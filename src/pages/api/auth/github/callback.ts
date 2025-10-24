/**
 * GitHub OAuth Callback Handler
 * Endpoint: GET /api/auth/github/callback
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const SUPER_ADMIN_GITHUB_USERNAME = 'cozyartz';

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
  const storedState = getCookie(request.headers.get('Cookie'), 'github_oauth_state');

  // Validate OAuth state for CSRF protection
  if (!code || !state || !storedState || state !== storedState) {
    return new Response('Invalid OAuth state', { status: 400 });
  }

  try {
    const clientId = env.GITHUB_CLIENT_ID as string;
    const clientSecret = env.GITHUB_CLIENT_SECRET as string;

    if (!clientId || !clientSecret) {
      console.error('GitHub OAuth not configured - missing credentials');
      return new Response('GitHub OAuth not configured', { status: 500 });
    }

    // Get redirect URI (must match what was sent during authorization)
    const siteUrl = (env.PUBLIC_SITE_URL as string) || `${url.protocol}//${url.host}`;
    const redirectUri = `${siteUrl}/api/auth/github/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', tokenResponse.status, tokenResponse.statusText);
      return new Response('Failed to exchange code for token', { status: 500 });
    }

    const tokenData: any = await tokenResponse.json();
    console.log('GitHub token response:', tokenData);
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('No access token received. Full response:', JSON.stringify(tokenData));
      return new Response(`No access token received. GitHub error: ${tokenData.error || 'unknown'} - ${tokenData.error_description || 'No description'}`, { status: 500 });
    }

    // Fetch user data from GitHub
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Michigan-Spots-App',
      },
    });

    if (!githubUserResponse.ok) {
      const errorText = await githubUserResponse.text();
      console.error('Failed to fetch GitHub user:', githubUserResponse.status, errorText);
      return new Response(`Failed to fetch GitHub user: ${githubUserResponse.status} - ${errorText}`, { status: 500 });
    }

    const githubUser: any = await githubUserResponse.json();
    console.log('GitHub user fetched:', githubUser.login);

    // ONLY allow super admin to use GitHub OAuth
    if (githubUser.login !== SUPER_ADMIN_GITHUB_USERNAME) {
      return new Response(`GitHub authentication is reserved for administrators only. Your GitHub username is: ${githubUser.login}. Expected: ${SUPER_ADMIN_GITHUB_USERNAME}. Please use Google sign-in or magic link.`, {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Force super admin email and role
    const email = 'cozycoding@proton.me';
    const role: 'super_admin' = 'super_admin';

    const db = env.DB as D1Database;

    if (!db) {
      return new Response('Database not available', { status: 500 });
    }

    // Check if user exists
    const existingUser = await db
      .prepare('SELECT * FROM users WHERE github_id = ?')
      .bind(githubUser.id)
      .first();

    let userId: number;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id as number;
      await db
        .prepare(`
          UPDATE users
          SET username = ?, email = ?, name = ?, avatar_url = ?, role = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(
          githubUser.login,
          email,
          githubUser.name || existingUser.name,
          githubUser.avatar_url,
          role,
          userId
        )
        .run();
    } else {
      // Create new user
      const result = await db
        .prepare(`
          INSERT INTO users (
            github_id, username, email, name, city, avatar_url, role,
            total_spots, total_badges, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(
          githubUser.id,
          githubUser.login,
          email,
          githubUser.name || githubUser.login,
          'Unknown',
          githubUser.avatar_url,
          role
        )
        .run();

      userId = result.meta.last_row_id as number;
    }

    // GitHub OAuth is super admin only - no payment checks needed

    // Create session
    const { id: sessionId, expiresAt } = createSession(userId);

    await db
      .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(sessionId, userId, Math.floor(expiresAt / 1000))
      .run();

    // Set session cookie
    const sessionCookie = createSessionCookie(sessionId, expiresAt);

    // Clear OAuth state cookie
    const clearStateCookie = 'github_oauth_state=; Path=/; Max-Age=0';

    // Redirect based on role
    const redirectUrl = role === 'super_admin' ? '/admin/dashboard' : '/';

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Set-Cookie': [sessionCookie, clearStateCookie].join(', '),
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
};
