/**
 * Logout endpoint - clear session
 */

interface Env {
  DB: D1Database;
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const sessionId = getCookie(request.headers.get('Cookie'), 'session_id');

    if (sessionId) {
      // Delete session from database
      await env.DB.prepare('DELETE FROM sessions WHERE id = ?')
        .bind(sessionId)
        .run();
    }

    const siteUrl = env.PUBLIC_SITE_URL || 'http://localhost:4321';
    const isSecure = siteUrl.startsWith('https');

    // Clear session cookie
    const clearCookie = `session_id=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${isSecure ? '; Secure' : ''}`;

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
