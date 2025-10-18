// GitHub OAuth Login Initiation
import { createGitHubClient, generateState } from '../../utils/auth-helpers';

interface Env {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  PUBLIC_SITE_URL?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  const siteUrl = env.PUBLIC_SITE_URL || 'http://localhost:4321';
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
