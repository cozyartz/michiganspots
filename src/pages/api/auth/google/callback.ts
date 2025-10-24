/**
 * Google OAuth Callback Handler
 * Endpoint: GET /api/auth/google/callback
 */
import type { APIRoute } from 'astro';

export const prerender = false;

interface GoogleUser {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) return cookieValue;
  }
  return null;
}

// Generate session ID
function generateSessionId(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create session (30 days)
function createSession(userId: number): { id: string; expiresAt: number } {
  const sessionId = generateSessionId();
  const expiresAt = Date.now() + (1000 * 60 * 60 * 24 * 30); // 30 days
  return { id: sessionId, expiresAt };
}

// Create session cookie
function createSessionCookie(sessionId: string, expiresAt: number): string {
  const maxAge = Math.floor((expiresAt - Date.now()) / 1000);
  return [
    `session=${sessionId}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax'
  ].join('; ');
}

export const GET: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime?.env;

  if (!env) {
    return new Response('Runtime environment not available', { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = getCookie(request.headers.get('Cookie'), 'google_oauth_state');

  // Validate OAuth state for CSRF protection
  if (!code || !state || !storedState || state !== storedState) {
    return new Response('Invalid OAuth state. Please try logging in again.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const clientId = env.GOOGLE_CLIENT_ID as string;
  const clientSecret = env.GOOGLE_CLIENT_SECRET as string;

  // Auto-detect site URL from request origin
  const siteUrl = (env.PUBLIC_SITE_URL as string) || `${url.protocol}//${url.host}`;
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // Fetch user data from Google
    const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!googleUserResponse.ok) {
      throw new Error('Failed to fetch Google user data');
    }

    const googleUser: GoogleUser = await googleUserResponse.json();

    // Verify email is confirmed
    if (!googleUser.email_verified) {
      return new Response('Please verify your Google email address first.', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const db = env.DB as D1Database;

    if (!db) {
      return new Response('Database not available', { status: 500 });
    }

    // Check if user exists by Google ID
    let existingUser = await db.prepare(
      'SELECT * FROM users WHERE google_id = ?'
    ).bind(googleUser.sub).first();

    let userId: number;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id as number;
      await db.prepare(`
        UPDATE users
        SET email = ?, name = ?, avatar_url = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        googleUser.email,
        googleUser.name,
        googleUser.picture || null,
        userId
      ).run();
    } else {
      // Check if email already exists (from different provider)
      const emailUser = await db.prepare(
        'SELECT * FROM users WHERE email = ?'
      ).bind(googleUser.email).first();

      if (emailUser) {
        // Link Google account to existing user
        userId = emailUser.id as number;
        await db.prepare(`
          UPDATE users
          SET google_id = ?, avatar_url = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(googleUser.sub, googleUser.picture || null, userId).run();
      } else {
        // Create new user
        const result = await db.prepare(`
          INSERT INTO users (
            google_id, email, name, avatar_url, role,
            city, total_spots, total_badges, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'user', '', 0, 0, datetime('now'), datetime('now'))
        `).bind(
          googleUser.sub,
          googleUser.email,
          googleUser.name,
          googleUser.picture || null
        ).run();

        userId = result.meta.last_row_id as number;
      }
    }

    // Check if user is a partner (not super admin) and verify they're not overdue
    const currentUser = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();

    if (currentUser && currentUser.role !== 'super_admin') {
      const partnerCheck = await db.prepare(`
        SELECT ends_at, is_active
        FROM partnership_activations
        WHERE email = ?
        AND is_active = 1
      `).bind(googleUser.email).first();

      if (partnerCheck && partnerCheck.ends_at) {
        const endsAt = new Date(partnerCheck.ends_at as string);
        const gracePeriodEnd = new Date(endsAt);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 10); // 10 day grace period

        if (new Date() > gracePeriodEnd) {
          return new Response('Your partnership payment is overdue. Please contact us to renew your partnership before accessing your dashboard.', {
            status: 403,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      }
    }

    // Create session
    const { id: sessionId, expiresAt } = createSession(userId);

    // Store session in database
    await db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (?, ?, datetime(?, 'unixepoch'), datetime('now'))
    `).bind(sessionId, userId, Math.floor(expiresAt / 1000)).run();

    // Create session cookie
    const sessionCookie = createSessionCookie(sessionId, expiresAt);

    // Clear state cookie
    const isSecure = siteUrl.startsWith('https');
    const clearStateCookie = `google_oauth_state=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${isSecure ? '; Secure' : ''}`;

    // Redirect to home page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': [sessionCookie, clearStateCookie].join(', '),
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return new Response('Authentication failed. Please try again.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};
