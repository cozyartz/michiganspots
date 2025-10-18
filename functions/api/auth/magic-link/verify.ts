/**
 * Verify magic link token and create session
 */
import { createSession, createSessionCookie } from '../../../utils/auth-helpers';

interface Env {
  DB: D1Database;
  PUBLIC_SITE_URL?: string;
}

interface MagicLinkToken {
  id: number;
  email: string;
  token: string;
  expires_at: number;
  used: number;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Invalid magic link. Please request a new one.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  try {
    // Get token from database
    const magicLinkToken = await env.DB.prepare(`
      SELECT * FROM magic_link_tokens
      WHERE token = ? AND used = 0
    `).bind(token).first() as MagicLinkToken | null;

    if (!magicLinkToken) {
      return new Response('Invalid or already used magic link. Please request a new one.', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Check if token has expired
    const now = Math.floor(Date.now() / 1000);
    if (magicLinkToken.expires_at < now) {
      return new Response('Magic link has expired. Please request a new one.', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Mark token as used
    await env.DB.prepare(`
      UPDATE magic_link_tokens
      SET used = 1, used_at = ?
      WHERE id = ?
    `).bind(now, magicLinkToken.id).run();

    // Find or create user
    let user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(magicLinkToken.email).first();

    let userId: number;

    if (user) {
      // User exists
      userId = user.id as number;
    } else {
      // Create new user
      const emailName = magicLinkToken.email.split('@')[0];
      const result = await env.DB.prepare(`
        INSERT INTO users (
          email, name, city, role,
          total_spots, total_badges, created_at, updated_at
        ) VALUES (?, ?, '', 'user', 0, 0, datetime('now'), datetime('now'))
      `).bind(
        magicLinkToken.email,
        emailName.charAt(0).toUpperCase() + emailName.slice(1) // Capitalize first letter
      ).run();

      userId = result.meta.last_row_id as number;
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

    // Redirect to home page
    const siteUrl = env.PUBLIC_SITE_URL || 'http://localhost:4321';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${siteUrl}/?login=success`,
        'Set-Cookie': sessionCookie,
      },
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return new Response('Authentication failed. Please try again.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};
