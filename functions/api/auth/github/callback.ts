// GitHub OAuth Callback Handler
import { createGitHubClient, createSession, createSessionCookie, SUPER_ADMIN_GITHUB_USERNAME } from '../../../utils/auth-helpers';

interface Env {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  PUBLIC_SITE_URL?: string;
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
  const storedState = getCookie(request.headers.get('Cookie'), 'github_oauth_state');

  // Validate OAuth state for CSRF protection
  if (!code || !state || !storedState || state !== storedState) {
    return new Response('Invalid OAuth state', { status: 400 });
  }

  try {
    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;

    // Auto-detect site URL from request origin
    const siteUrl = env.PUBLIC_SITE_URL || `${url.protocol}//${url.host}`;
    const redirectUri = `${siteUrl}/api/auth/github/callback`;

    if (!clientId || !clientSecret) {
      return new Response('GitHub OAuth not configured', { status: 500 });
    }

    const github = createGitHubClient(clientId, clientSecret, redirectUri);

    // Exchange code for access token
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    // Fetch user data from GitHub
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!githubUserResponse.ok) {
      return new Response('Failed to fetch GitHub user', { status: 500 });
    }

    const githubUser: any = await githubUserResponse.json();

    // Fetch user email if not public
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (emailResponse.ok) {
        const emails: any[] = await emailResponse.json();
        const primaryEmail = emails.find(e => e.primary);
        email = primaryEmail?.email || emails[0]?.email;
      }
    }

    // Determine user role
    let role: 'user' | 'partner' | 'super_admin' = 'user';
    if (githubUser.login === SUPER_ADMIN_GITHUB_USERNAME) {
      role = 'super_admin';
    }

    const db = env.DB;

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
          email || existingUser.email,
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
          email || '',
          githubUser.name || githubUser.login,
          'Unknown',
          githubUser.avatar_url,
          role
        )
        .run();

      userId = result.meta.last_row_id as number;
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
    return new Response('Authentication failed', { status: 500 });
  }
};
