// Verify magic link token and log in user
import type { APIRoute } from 'astro';
import { createSession, createSessionCookie } from '../../../../lib/auth';

export const GET: APIRoute = async ({ url, redirect, locals }) => {
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect('/?error=invalid_magic_link');
  }

  try {
    // Access database
    const runtime = locals.runtime as any;
    const env = runtime?.env || import.meta.env;
    const db = env.DB || runtime?.env?.DB;

    if (!db) {
      return redirect('/?error=database_unavailable');
    }

    // Check if token exists and is valid
    const magicLink = await db
      .prepare(`
        SELECT ml.*, u.id as user_id, u.email, u.name, u.role
        FROM magic_links ml
        JOIN users u ON ml.user_id = u.id
        WHERE ml.token = ?
          AND ml.used = 0
          AND datetime(ml.expires_at) > datetime('now')
      `)
      .bind(token)
      .first();

    if (!magicLink) {
      // Check if token was already used or expired
      const usedLink = await db
        .prepare('SELECT used, expires_at FROM magic_links WHERE token = ?')
        .bind(token)
        .first();

      if (usedLink) {
        if (usedLink.used === 1) {
          return redirect('/?error=magic_link_already_used');
        } else {
          return redirect('/?error=magic_link_expired');
        }
      }

      return redirect('/?error=invalid_magic_link');
    }

    // Mark magic link as used
    await db
      .prepare(`
        UPDATE magic_links
        SET used = 1, used_at = datetime('now')
        WHERE token = ?
      `)
      .bind(token)
      .run();

    // Also mark partner magic link as used if it exists
    await db
      .prepare(`
        UPDATE partner_magic_links
        SET used = 1, used_at = datetime('now')
        WHERE token = ?
      `)
      .bind(token)
      .run();

    // Create session
    const userId = magicLink.user_id;
    const { id: sessionId, expiresAt } = createSession(userId);

    await db
      .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(sessionId, userId, Math.floor(expiresAt / 1000))
      .run();

    // Set session cookie
    const sessionCookie = createSessionCookie(sessionId, expiresAt);

    // Redirect based on role
    let redirectUrl = '/';
    if (magicLink.role === 'super_admin') {
      redirectUrl = '/admin/dashboard';
    } else if (magicLink.role === 'partner') {
      redirectUrl = '/partner/dashboard';
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        'Set-Cookie': sessionCookie,
      },
    });

  } catch (error) {
    console.error('Magic link verification error:', error);
    return redirect('/?error=authentication_failed');
  }
};
