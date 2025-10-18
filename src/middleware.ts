import { defineMiddleware } from 'astro:middleware';
import { parseSessionCookie, type User, type SessionWithUser } from './lib/auth';

// Extend Astro locals to include user and session
declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: { id: string; user_id: string; expires_at: number } | null;
    }
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Initialize user and session as null
  context.locals.user = null;
  context.locals.session = null;

  // Parse session cookie
  const sessionId = parseSessionCookie(context.request.headers.get('cookie'));

  if (sessionId) {
    try {
      // In SSR mode with Cloudflare, we'd query D1 here
      // For now, we'll handle this in the page components
      // This middleware mainly sets up the context
    } catch (error) {
      console.error('Session validation error:', error);
    }
  }

  // Protected routes
  const pathname = new URL(context.request.url).pathname;

  // Admin routes - require super_admin role
  if (pathname.startsWith('/admin')) {
    // We'll validate this in the page component since we need D1 access
    // For static builds, we'll use client-side protection
  }

  // Partner routes - require partner or super_admin role
  if (pathname.startsWith('/partner')) {
    // We'll validate this in the page component
  }

  return next();
});
