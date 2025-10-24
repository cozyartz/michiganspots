/**
 * User Magic Link Authentication - Verify Link
 * Endpoint: GET /api/auth/magic-link/verify?token=xxx
 */
import type { APIRoute } from 'astro';

export const prerender = false;

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

export const GET: APIRoute = async ({ locals, request, url }) => {
  const env = locals.runtime?.env;

  if (!env) {
    return new Response('Runtime environment not available', { status: 500 });
  }

  const db = env.DB as D1Database;

  if (!db) {
    return new Response('Database not available', { status: 500 });
  }

  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Invalid magic link', { status: 400 });
  }

  try {
    // Find magic link by token
    const magicLink = await db.prepare(`
      SELECT email, expires_at, used
      FROM magic_link_tokens
      WHERE token = ?
      LIMIT 1
    `).bind(token).first();

    if (!magicLink) {
      return new Response('Invalid or expired magic link', { status: 400 });
    }

    // Check if already used
    if (magicLink.used === 1) {
      return new Response('This magic link has already been used', { status: 400 });
    }

    // Check if expired (Unix timestamp comparison)
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > (magicLink.expires_at as number)) {
      return new Response('This magic link has expired', { status: 400 });
    }

    // Get user details
    const user = await db.prepare(`
      SELECT id, email, role
      FROM users
      WHERE email = ?
    `).bind(magicLink.email).first();

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Check if user is a partner (not super admin) and verify payment status
    if (user.role !== 'super_admin') {
      const partnerCheck = await db.prepare(`
        SELECT ends_at, is_active
        FROM partnership_activations
        WHERE email = ?
        AND is_active = 1
      `).bind(user.email).first();

      if (partnerCheck && partnerCheck.ends_at) {
        const endsAt = new Date(partnerCheck.ends_at as string);
        const gracePeriodEnd = new Date(endsAt);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 10); // 10 day grace period

        if (new Date() > gracePeriodEnd) {
          return new Response('Your partnership payment is overdue. Please contact us to renew your partnership before accessing your account.', {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }
    }

    // Mark magic link as used
    await db.prepare(`
      UPDATE magic_link_tokens
      SET used = 1, used_at = unixepoch()
      WHERE token = ?
    `).bind(token).run();

    // Create session
    const { id: sessionId, expiresAt: sessionExpiresAt } = createSession(user.id as number);

    // Store session in database
    await db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (?, ?, datetime(?, 'unixepoch'), datetime('now'))
    `).bind(sessionId, user.id, Math.floor(sessionExpiresAt / 1000)).run();

    // Create session cookie
    const sessionCookie = createSessionCookie(sessionId, sessionExpiresAt);

    // Determine redirect based on role
    let redirectUrl = '/';
    if (user.role === 'super_admin') {
      redirectUrl = '/admin/dashboard';
    } else if (user.role === 'partner') {
      redirectUrl = '/partner/dashboard';
    }

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Set-Cookie': sessionCookie,
      },
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return new Response('Authentication failed. Please try again.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
