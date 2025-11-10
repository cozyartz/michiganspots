/**
 * Client-Side Sentry Error Tracking
 *
 * Tracks frontend JavaScript errors, React component crashes,
 * and user interactions in the browser.
 *
 * Setup:
 * 1. Add SENTRY_CLIENT_DSN to .dev.vars (development)
 * 2. Add SENTRY_CLIENT_DSN to Cloudflare Pages env vars (production)
 * 3. Import this file in your main layout or App component
 */

import * as Sentry from '@sentry/react';

// Check if running in browser (not SSR)
if (typeof window !== 'undefined') {
  // Get DSN from environment variable
  const dsn = import.meta.env.PUBLIC_SENTRY_CLIENT_DSN ||
              'https://704cddde6de4294b5a84f73c1b5029c0@o4510339428777984.ingest.us.sentry.io/4510339484680192';

  Sentry.init({
    dsn,

    // Environment (development, production, etc.)
    environment: import.meta.env.MODE || 'production',

    // Enable detailed error reporting
    sendDefaultPii: true,

    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions

    // Session replay (optional - captures user sessions)
    replaysSessionSampleRate: 0, // Disabled by default (can be expensive)
    replaysOnErrorSampleRate: 0.5, // 50% of sessions with errors

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Privacy: mask all text content
        blockAllMedia: true, // Privacy: block all media
      }),
    ],

    // Custom tags
    initialScope: {
      tags: {
        app: 'michiganspots',
        framework: 'astro',
      },
    },

    // Filter out certain errors
    beforeSend(event, hint) {
      // Don't send errors from browser extensions
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('chrome-extension://')
      )) {
        return null;
      }

      return event;
    },
  });

  console.log('[Sentry] Client-side error tracking initialized');
}

export { Sentry };
