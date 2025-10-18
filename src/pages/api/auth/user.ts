// Get current user session
import type { APIRoute } from 'astro';
import { parseSessionCookie } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals }) => {
  const sessionId = parseSessionCookie(request.headers.get('cookie'));

  if (!sessionId) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    // Access D1 database
    const runtime = locals.runtime as any;
    const db = runtime?.env?.DB;

    if (!db) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Get session with user data
    const result = await db
      .prepare(`
        SELECT
          s.id as session_id,
          s.expires_at,
          u.*
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.expires_at > unixepoch()
      `)
      .bind(sessionId)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Return user data
    const user = {
      id: result.id,
      username: result.username,
      email: result.email,
      name: result.name,
      avatar_url: result.avatar_url,
      role: result.role,
    };

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
