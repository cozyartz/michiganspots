// GitHub OAuth Login Initiation
import type { APIRoute } from 'astro';
import { createGitHubClient, generateState } from '../../../lib/auth';

export const GET: APIRoute = async ({ redirect, cookies }) => {
  // Get GitHub OAuth credentials from environment
  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;
  const redirectUri = import.meta.env.PUBLIC_SITE_URL
    ? `${import.meta.env.PUBLIC_SITE_URL}/api/auth/github/callback`
    : 'http://localhost:4321/api/auth/github/callback';

  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth not configured', { status: 500 });
  }

  const github = createGitHubClient(clientId, clientSecret, redirectUri);
  const state = generateState();

  // Store state in cookie for CSRF protection
  cookies.set('github_oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  });

  const url = github.createAuthorizationURL(state, ['user:email']);

  return redirect(url.toString(), 302);
};
