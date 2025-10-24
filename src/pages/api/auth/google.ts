/**
 * Google OAuth Login Initiation
 * Endpoint: GET /api/auth/google
 */
import type { APIRoute } from 'astro';
import { createGoogleClient, generateState } from '../../../../functions/utils/auth-helpers';

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime?.env;

  if (!env) {
    return new Response('Runtime environment not available', { status: 500 });
  }

  const clientId = env.GOOGLE_CLIENT_ID as string;
  const clientSecret = env.GOOGLE_CLIENT_SECRET as string;

  // Auto-detect site URL from request origin
  const requestUrl = new URL(request.url);
  const siteUrl = (env.PUBLIC_SITE_URL as string) || `${requestUrl.protocol}//${requestUrl.host}`;
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return new Response('Google OAuth not configured. Please set up Google OAuth credentials in your environment variables.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const google = createGoogleClient(clientId, clientSecret, redirectUri);
  const state = generateState();

  // Set state cookie for CSRF protection
  const isSecure = siteUrl.startsWith('https');
  const stateCookie = `google_oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax${isSecure ? '; Secure' : ''}`;

  // Request email and profile scopes
  const scopes = ['email', 'profile'];
  const url = google.createAuthorizationURL(state, scopes);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': url.toString(),
      'Set-Cookie': stateCookie,
    },
  });
};
