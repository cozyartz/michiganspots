// GitHub OAuth Callback Handler
import type { APIRoute } from 'astro';
import { createGitHubClient, createSession, createSessionCookie, SUPER_ADMIN_GITHUB_USERNAME } from '../../../../lib/auth';

export const GET: APIRoute = async ({ url, cookies, redirect, locals }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = cookies.get('github_oauth_state')?.value;

  // Validate OAuth state for CSRF protection
  if (!code || !state || !storedState || state !== storedState) {
    return new Response('Invalid OAuth state', { status: 400 });
  }

  try {
    // Get GitHub OAuth credentials
    // In Cloudflare, secrets are in runtime.env
    const runtime = locals.runtime as any;
    const env = runtime?.env || import.meta.env;

    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;
    const siteUrl = env.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL;
    const redirectUri = siteUrl
      ? `${siteUrl}/api/auth/github/callback`
      : 'http://localhost:4321/api/auth/github/callback';

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

    // Access D1 database (already accessed above for env)
    const db = env.DB || runtime?.env?.DB;

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
      userId = existingUser.id;
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
          role, // Update role in case user became super admin
          userId
        )
        .run();
    } else {
      // Create new user (id will auto-increment)
      // Need to set required fields from existing schema: email, name, city, created_at
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
          'Unknown', // Default city, can be updated later
          githubUser.avatar_url,
          role
        )
        .run();

      // Get the auto-generated user ID
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
    cookies.delete('github_oauth_state', { path: '/' });

    // Redirect based on role
    const redirectUrl = role === 'super_admin' ? '/admin/dashboard' : '/';

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        'Set-Cookie': sessionCookie,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
};
