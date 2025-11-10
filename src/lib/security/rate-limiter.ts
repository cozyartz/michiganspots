/**
 * Rate Limiter for Cloudflare Workers
 * Uses in-memory Map for rate limiting (no KV needed)
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on worker restart, which is fine for abuse prevention)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  entry.count++;
  rateLimitStore.set(key, entry);

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

export function getRateLimitHeaders(result: {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
}

/**
 * Detect and block suspicious bots/scrapers
 */
export function detectBot(userAgent: string, ip: string): { isBot: boolean; reason?: string } {
  const ua = userAgent.toLowerCase();

  // Known good bots (allow)
  const allowedBots = [
    'googlebot',
    'bingbot',
    'slackbot',
    'twitterbot',
    'facebookexternalhit',
    'linkedinbot',
    'applebot',
  ];

  if (allowedBots.some((bot) => ua.includes(bot))) {
    return { isBot: false };
  }

  // Suspicious patterns
  const suspiciousPatterns = [
    'scrapy',
    'crawler',
    'spider',
    'scraper',
    'bot',
    'curl',
    'wget',
    'python-requests',
    'go-http-client',
    'axios',
    'node-fetch',
    'postman',
    'insomnia',
    'httpie',
  ];

  for (const pattern of suspiciousPatterns) {
    if (ua.includes(pattern)) {
      return { isBot: true, reason: `Suspicious user agent: ${pattern}` };
    }
  }

  // No user agent at all
  if (!userAgent || userAgent.trim() === '') {
    return { isBot: true, reason: 'Missing user agent' };
  }

  return { isBot: false };
}

/**
 * Rate limit configuration presets
 */
export const RATE_LIMITS = {
  // Very strict - for expensive operations
  STRICT: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 req/min

  // Standard API rate limit
  API: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 req/min

  // Search endpoints (prevent scraping)
  SEARCH: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 req/min

  // Auth endpoints (prevent brute force)
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 req/15min

  // Public endpoints
  PUBLIC: { windowMs: 60 * 1000, maxRequests: 300 }, // 300 req/min
} as const;
