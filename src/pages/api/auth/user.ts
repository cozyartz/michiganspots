/**
 * Get Current User Session
 * Endpoint: GET /api/auth/user
 * Used by protected pages to verify authentication
 */
import type { APIRoute } from 'astro';

export const prerender = false;

interface User {
  id: string;
  email: string;
  username: string | null;
  role: 'user' | 'partner' | 'super_admin';
  created_at: string;
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

export const GET: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime?.env;

  if (!env) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const sessionId = getCookie(request.headers.get('Cookie'), 'session');

    if (!sessionId) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = env.DB as D1Database;

    // Get session from database
    const session = await db.prepare(
      'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
    ).bind(sessionId).first();

    if (!session) {
      // Session expired or doesn't exist
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Clear invalid session cookie
          'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax',
        },
      });
    }

    // Get user data
    const user = await db.prepare(
      'SELECT id, email, username, role, created_at FROM users WHERE id = ?'
    ).bind(session.user_id).first() as User | null;

    if (!user) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax',
        },
      });
    }

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user session:', error);
    return new Response(JSON.stringify({
      user: null,
      error: 'Failed to fetch session'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
