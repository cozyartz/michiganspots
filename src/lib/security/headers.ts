/**
 * Security headers for all responses
 * Prevents clickjacking, XSS, and other attacks
 */

export function getSecurityHeaders() {
  return {
    // Prevent clickjacking
    'X-Frame-Options': 'SAMEORIGIN',

    // XSS protection
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',

    // Content Security Policy (strict)
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.stripe.com https://checkout.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com",
      "frame-src https://checkout.stripe.com https://js.stripe.com",
      "frame-ancestors 'self'",
    ].join('; '),

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy (disable unnecessary features)
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(self)',

    // HSTS (force HTTPS)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}

/**
 * Anti-scraping headers
 */
export function getAntiScrapingHeaders() {
  return {
    'X-Robots-Tag': 'noarchive, nosnippet', // Prevent caching by search engines
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

/**
 * Rate limit headers
 */
export function getRateLimitHeaders(remaining: number, resetTime: number) {
  return {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
  };
}

/**
 * CORS headers (restrictive)
 */
export function getCORSHeaders(origin: string) {
  const allowedOrigins = [
    'https://michiganspots.com',
    'https://www.michiganspots.com',
    'http://localhost:4321',
  ];

  const isAllowed = allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Get client IP from Cloudflare headers
 */
export function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
         'unknown';
}

/**
 * Get client country from Cloudflare headers
 */
export function getClientCountry(request: Request): string | null {
  return request.headers.get('CF-IPCountry');
}

/**
 * Check if request is from Cloudflare
 */
export function isCloudflareRequest(request: Request): boolean {
  return request.headers.has('CF-Ray');
}
