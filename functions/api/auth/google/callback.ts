/**
 * Google OAuth callback handler
 */
import { createGoogleClient, createSession, createSessionCookie } from '../../../utils/auth-helpers';

interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  PUBLIC_SITE_URL?: string;
}

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
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

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const siteUrl = env.PUBLIC_SITE_URL || 'http://localhost:4321';
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  try {
    const google = createGoogleClient(clientId, clientSecret, redirectUri);
    const tokens = await google.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

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

    // Check if user exists by Google ID
    let existingUser = await env.DB.prepare(
      'SELECT * FROM users WHERE google_id = ?'
    ).bind(googleUser.sub).first();

    let userId: number;

    if (existingUser) {
      // Update existing user
      userId = existingUser.id as number;
      await env.DB.prepare(`
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
      const emailUser = await env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
      ).bind(googleUser.email).first();

      if (emailUser) {
        // Link Google account to existing user
        userId = emailUser.id as number;
        await env.DB.prepare(`
          UPDATE users
          SET google_id = ?, avatar_url = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(googleUser.sub, googleUser.picture || null, userId).run();
      } else {
        // Create new user
        const result = await env.DB.prepare(`
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

    // Create session
    const { id: sessionId, expiresAt } = createSession(userId);

    // Store session in database
    await env.DB.prepare(`
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
