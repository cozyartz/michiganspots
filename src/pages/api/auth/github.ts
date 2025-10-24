/**
 * GitHub OAuth Login Initiation
 * Endpoint: GET /api/auth/github
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
    return new Response('Runtime environment not available', { status: 500 });
  }

  const clientId = env.GITHUB_CLIENT_ID as string;

  if (!clientId) {
    return new Response('GitHub OAuth not configured', { status: 500 });
  }

  // Auto-detect site URL
  const requestUrl = new URL(request.url);
  const siteUrl = (env.PUBLIC_SITE_URL as string) || `${requestUrl.protocol}//${requestUrl.host}`;
  const redirectUri = `${siteUrl}/api/auth/github/callback`;

  // Generate state for CSRF protection
  const state = generateState();

  // Build GitHub authorization URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'user:email');
  authUrl.searchParams.set('state', state);

  // Store state in cookie
  const isSecure = siteUrl.startsWith('https');
  const stateCookie = `github_oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax${isSecure ? '; Secure' : ''}`;

  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl.toString(),
      'Set-Cookie': stateCookie,
    },
  });
};
