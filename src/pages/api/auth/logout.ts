// Logout API endpoint
import type { APIRoute } from 'astro';
import { parseSessionCookie, createLogoutCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  // Parse session from cookie
  const sessionId = parseSessionCookie(request.headers.get('cookie'));

  if (sessionId) {
    try {
      // Access D1 database
      const runtime = locals.runtime as any;
      const db = runtime?.env?.DB;

      if (db) {
        // Delete session from database
        await db
          .prepare('DELETE FROM sessions WHERE id = ?')
          .bind(sessionId)
          .run();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Clear session cookie
  const logoutCookie = createLogoutCookie();

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': logoutCookie,
    },
  });
};

export const GET: APIRoute = async (context) => {
  return POST(context);
};
