/**
 * Logout Endpoint
 * Endpoint: POST /api/auth/logout
 * Clears user session and cookie
 */
import type { APIRoute } from 'astro';

export const prerender = false;

function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) return cookieValue;
  }
  return null;
}

export const POST: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime?.env;

  if (!env) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Runtime environment not available'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const sessionId = getCookie(request.headers.get('Cookie'), 'session');

    if (sessionId) {
      const db = env.DB as D1Database;
      // Delete session from database
      await db.prepare('DELETE FROM sessions WHERE id = ?')
        .bind(sessionId)
        .run();
    }

    const siteUrl = (env.PUBLIC_SITE_URL as string) || 'http://localhost:4321';
    const isSecure = siteUrl.startsWith('https');

    // Clear session cookie
    const clearCookie = `session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${isSecure ? '; Secure' : ''}`;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearCookie,
      },
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to logout'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
