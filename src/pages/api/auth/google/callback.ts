// Google OAuth Callback Handler
import type { APIRoute } from 'astro';
import { createGoogleClient, createSession, createSessionCookie, SUPER_ADMIN_GITHUB_USERNAME } from '../../../../lib/auth';

export const GET: APIRoute = async ({ url, cookies, redirect, locals }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('google_oauth_state')?.value;

  // Validate OAuth state for CSRF protection
  if (!code || !state || !storedState || state !== storedState) {
    return new Response('Invalid OAuth state', { status: 400 });
  }

  try {
    // Get Google OAuth credentials
    const runtime = locals.runtime as any;
    const env = runtime?.env || import.meta.env;

    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    const siteUrl = env.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL;
    const redirectUri = siteUrl
      ? `${siteUrl}/api/auth/google/callback`
      : 'http://localhost:4321/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      return new Response('Google OAuth not configured', { status: 500 });
    }

    const google = createGoogleClient(clientId, clientSecret, redirectUri);

    // Exchange code for access token
    const tokens = await google.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    // Fetch user data from Google
    const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!googleUserResponse.ok) {
      return new Response('Failed to fetch Google user', { status: 500 });
    }

    const googleUser: any = await googleUserResponse.json();

    // Determine user role (default to user, can be upgraded later)
    let role: 'user' | 'partner' | 'super_admin' = 'user';

    // Access D1 database
    const db = env.DB || runtime?.env?.DB;

    if (!db) {
      return new Response('Database not available', { status: 500 });
    }

    // Check if user exists by Google ID
    const existingUserByGoogle = await db
      .prepare('SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?')
      .bind('google', googleUser.id)
      .first();

    let userId: number;

    if (existingUserByGoogle) {
      // User exists, get their user_id
      userId = existingUserByGoogle.user_id;

      // Update user info
      await db
        .prepare(`
          UPDATE users
          SET email = ?, name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(
          googleUser.email,
          googleUser.name,
          googleUser.picture,
          userId
        )
        .run();

      // Get updated user role
      const user = await db
        .prepare('SELECT role FROM users WHERE id = ?')
        .bind(userId)
        .first();
      role = user?.role || 'user';

    } else {
      // Check if user exists by email
      const existingUserByEmail = await db
        .prepare('SELECT * FROM users WHERE email = ?')
        .bind(googleUser.email)
        .first();

      if (existingUserByEmail) {
        // Link Google account to existing user
        userId = existingUserByEmail.id;
        role = existingUserByEmail.role || 'user';

        await db
          .prepare(`
            INSERT INTO oauth_accounts (provider, provider_user_id, user_id)
            VALUES (?, ?, ?)
          `)
          .bind('google', googleUser.id, userId)
          .run();

        // Update user info
        await db
          .prepare(`
            UPDATE users
            SET name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `)
          .bind(
            googleUser.name,
            googleUser.picture,
            userId
          )
          .run();

      } else {
        // Create new user
        const result = await db
          .prepare(`
            INSERT INTO users (
              email, name, city, avatar_url, role,
              total_spots, total_badges, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `)
          .bind(
            googleUser.email,
            googleUser.name,
            'Unknown', // Default city
            googleUser.picture,
            role
          )
          .run();

        userId = result.meta.last_row_id as number;

        // Create OAuth account link
        await db
          .prepare(`
            INSERT INTO oauth_accounts (provider, provider_user_id, user_id)
            VALUES (?, ?, ?)
          `)
          .bind('google', googleUser.id, userId)
          .run();
      }
    }

    // Create session
    const { id: sessionId, expiresAt } = createSession(userId);

    await db
      .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(sessionId, userId, Math.floor(expiresAt / 1000))
      .run();

    // Set session cookie
    const sessionCookie = createSessionCookie(sessionId, expiresAt);

    // Clear OAuth state cookie
    cookies.delete('google_oauth_state', { path: '/' });

    // Redirect based on role
    const redirectUrl = role === 'super_admin' ? '/admin/dashboard' : role === 'partner' ? '/partner/dashboard' : '/';

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        'Set-Cookie': sessionCookie,
      },
    });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
};
