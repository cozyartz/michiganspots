/**
 * GitHub OAuth Login Initiation
 * Endpoint: GET /api/auth/github
 */
import type { APIRoute } from 'astro';
import { createGitHubClient, generateState } from '../../../../functions/utils/auth-helpers';

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime?.env;

  if (!env) {
    return new Response('Runtime environment not available', { status: 500 });
  }

  const clientId = env.GITHUB_CLIENT_ID as string;
  const clientSecret = env.GITHUB_CLIENT_SECRET as string;

  // Auto-detect site URL from request origin
  const requestUrl = new URL(request.url);
  const siteUrl = (env.PUBLIC_SITE_URL as string) || `${requestUrl.protocol}//${requestUrl.host}`;
  const redirectUri = `${siteUrl}/api/auth/github/callback`;

  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth not configured. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to Cloudflare environment variables.', { status: 500 });
  }

  const github = createGitHubClient(clientId, clientSecret, redirectUri);
  const state = generateState();

  // Store state in cookie for CSRF protection
  const stateCookie = `github_oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax${siteUrl.startsWith('https') ? '; Secure' : ''}`;

  const url = github.createAuthorizationURL(state, ['user:email']);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': url.toString(),
      'Set-Cookie': stateCookie,
    },
  });
};
