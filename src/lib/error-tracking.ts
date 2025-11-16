/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

/**
 * Error Tracking with Toucan (Sentry for Cloudflare Workers)
 *
 * Provides centralized error tracking and performance monitoring
 * using Toucan-js, a Sentry client built specifically for Workers.
 *
 * Features:
 * - Automatic error capturing with stack traces
 * - Performance monitoring (transactions)
 * - Request context (IP, user agent, headers)
 * - Breadcrumbs for debugging
 * - Source map support
 *
 * Setup Instructions:
 * 1. Create a Sentry project at https://sentry.io
 * 2. Get your DSN from Project Settings > Client Keys (DSN)
 * 3. Add to Cloudflare Dashboard: Workers & Pages > michiganspot > Settings > Environment Variables
 *    - Variable name: SENTRY_DSN
 *    - Value: https://xxx@xxx.ingest.sentry.io/xxx
 * 4. Set environment: production or development
 */

import { Toucan } from 'toucan-js';

export interface ErrorTrackingEnv {
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
}

/**
 * Initialize Toucan for error tracking
 *
 * @param request - The incoming request
 * @param env - Cloudflare environment with SENTRY_DSN
 * @param ctx - Execution context
 * @returns Toucan instance or null if not configured
 */
export function initErrorTracking(
  request: Request,
  env: ErrorTrackingEnv,
  ctx?: ExecutionContext
): Toucan | null {
  // Skip if Sentry DSN not configured
  if (!env.SENTRY_DSN) {
    return null;
  }

  const sentry = new Toucan({
    dsn: env.SENTRY_DSN,
    context: ctx,
    request,

    // Environment configuration
    environment: env.SENTRY_ENVIRONMENT || 'production',

    // Enable detailed error reporting
    allowedHeaders: [
      'user-agent',
      'cf-ipcountry',
      'cf-ray',
      'cf-connecting-ip',
      'content-type',
      'origin',
      'referer',
    ],

    // Enable detailed request data
    allowedSearchParams: /(.*)/,

    // Transport options
    transportOptions: {
      // Add any transport-specific options here
    },

    // Release tracking (optional - use git commit hash)
    // release: 'michiganspot@1.0.0',

    // Performance monitoring sample rate (10% of requests)
    tracesSampleRate: 0.1,
  });

  // Add custom tags
  sentry.setTag('worker', 'michiganspot');

  return sentry;
}

/**
 * Capture an error and send to Sentry
 *
 * @param sentry - Toucan instance (can be null)
 * @param error - Error to capture
 * @param context - Additional context
 */
export function captureError(
  sentry: Toucan | null,
  error: Error | unknown,
  context?: Record<string, any>
): void {
  // Always log to console for local debugging
  console.error('[Error]', error, context);

  if (!sentry) {
    return;
  }

  // Add context if provided
  if (context) {
    sentry.setExtras(context);
  }

  // Capture the error
  if (error instanceof Error) {
    sentry.captureException(error);
  } else {
    sentry.captureMessage(String(error), 'error');
  }
}

/**
 * Start a performance transaction
 *
 * @param sentry - Toucan instance (can be null)
 * @param operation - Operation name (e.g., 'http.server')
 * @param name - Transaction name (e.g., 'POST /api/directory/search')
 * @returns Transaction or null
 */
export function startTransaction(
  sentry: Toucan | null,
  operation: string,
  name: string
) {
  if (!sentry) {
    return null;
  }

  // Check if startTransaction method exists
  if (typeof (sentry as any).startTransaction !== 'function') {
    console.warn('[Sentry] startTransaction not available in current Toucan version');
    return null;
  }

  try {
    return (sentry as any).startTransaction({
      op: operation,
      name,
    });
  } catch (error) {
    console.warn('[Sentry] Failed to start transaction:', error);
    return null;
  }
}

/**
 * Add a breadcrumb for debugging context
 *
 * @param sentry - Toucan instance (can be null)
 * @param message - Breadcrumb message
 * @param data - Additional data
 * @param level - Severity level
 */
export function addBreadcrumb(
  sentry: Toucan | null,
  message: string,
  data?: Record<string, any>,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  if (!sentry) {
    return;
  }

  sentry.addBreadcrumb({
    message,
    level,
    data,
  });
}

/**
 * Wrapper for API route handlers with automatic error tracking
 *
 * Example usage:
 * ```typescript
 * export const GET: APIRoute = withErrorTracking(async ({ request, locals }) => {
 *   const sentry = locals.sentry;
 *
 *   try {
 *     // Your code here
 *     addBreadcrumb(sentry, 'Processing search request', { query: 'coffee' });
 *
 *     return new Response(JSON.stringify({ success: true }), {
 *       status: 200,
 *       headers: { 'Content-Type': 'application/json' }
 *     });
 *   } catch (error) {
 *     captureError(sentry, error, { endpoint: '/api/directory/search' });
 *     throw error;
 *   }
 * });
 * ```
 */
export function withErrorTracking<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const context = args[0]; // Astro context
    const { request, locals } = context;

    // Initialize Sentry if not already done
    if (!locals.sentry && locals.runtime?.env) {
      locals.sentry = initErrorTracking(
        request,
        locals.runtime.env,
        locals.runtime.ctx
      );
    }

    try {
      return await handler(...args);
    } catch (error) {
      // Capture error
      captureError(locals.sentry, error, {
        url: request.url,
        method: request.method,
      });

      // Re-throw to allow normal error handling
      throw error;
    }
  }) as T;
}

/**
 * Set user context for error tracking
 *
 * @param sentry - Toucan instance (can be null)
 * @param userId - User ID
 * @param email - User email (optional)
 * @param username - Username (optional)
 */
export function setUser(
  sentry: Toucan | null,
  userId: string,
  email?: string,
  username?: string
): void {
  if (!sentry) {
    return;
  }

  sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (for logout)
 *
 * @param sentry - Toucan instance (can be null)
 */
export function clearUser(sentry: Toucan | null): void {
  if (!sentry) {
    return;
  }

  sentry.setUser(null);
}
