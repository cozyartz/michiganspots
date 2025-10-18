// Google OAuth Login Initiation
import type { APIRoute } from 'astro';
import { createGoogleClient, generateState } from '../../../lib/auth';

export const GET: APIRoute = async ({ redirect, cookies, locals }) => {
  // Get Google OAuth credentials from environment
  const runtime = locals.runtime as any;
  const env = runtime?.env || import.meta.env;

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const siteUrl = env.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL;
  const redirectUri = siteUrl
    ? `${siteUrl}/api/auth/google/callback`
    : 'http://localhost:4321/api/auth/google/callback';

  if (!clientId || !clientSecret) {
    return new Response('Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Cloudflare environment variables.', { status: 500 });
  }

  const google = createGoogleClient(clientId, clientSecret, redirectUri);
  const state = generateState();

  // Store state in cookie for CSRF protection
  cookies.set('google_oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  });

  const url = google.createAuthorizationURL(state, ['openid', 'profile', 'email']);

  return redirect(url.toString(), 302);
};
