/**
 * Get current user session
 * Used by protected pages to verify authentication
 */

interface Env {
  DB: D1Database;
}

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const sessionId = getCookie(request.headers.get('Cookie'), 'session_id');

    if (!sessionId) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get session from database
    const session = await env.DB.prepare(
      'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
    ).bind(sessionId).first();

    if (!session) {
      // Session expired or doesn't exist
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Clear invalid session cookie
          'Set-Cookie': 'session_id=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax',
        },
      });
    }

    // Get user data
    const user = await env.DB.prepare(
      'SELECT id, email, username, role, created_at FROM users WHERE id = ?'
    ).bind(session.user_id).first() as User | null;

    if (!user) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'session_id=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax',
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
