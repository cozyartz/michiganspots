/**
 * Google OAuth Login Initiation
 * Endpoint: GET /api/auth/google
 */
import type { APIRoute } from 'astro';

export const prerender = false;

// Generate random state for CSRF protection
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export const GET: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime?.env;

  if (!env) {
    return new Response('Runtime environment not available', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  const clientId = String(env.GOOGLE_CLIENT_ID || '').trim();

  if (!clientId || clientId.length < 10) {
    return new Response('Google OAuth not configured', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Auto-detect site URL
  const requestUrl = new URL(request.url);
  const siteUrl = String(env.PUBLIC_SITE_URL || `${requestUrl.protocol}//${requestUrl.host}`).trim();
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  // Generate state for CSRF protection
  const state = generateState();

  // Build Google authorization URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'email profile');
  authUrl.searchParams.set('state', state);

  // Store state in cookie
  const isSecure = siteUrl.startsWith('https');
  const stateCookie = `google_oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax${isSecure ? '; Secure' : ''}`;

  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl.toString(),
      'Set-Cookie': stateCookie,
    },
  });
};
