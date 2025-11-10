import type { APIRoute } from 'astro';
import { checkRateLimit, detectBot, RATE_LIMITS } from '../../../lib/security/rate-limiter';
import { getSecurityHeaders, getClientIP } from '../../../lib/security/headers';
import { z } from 'zod';

// Validation schema
const searchParamsSchema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  sort: z.enum(['ai_score', 'name', 'newest']).optional(),
});

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get client info
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('User-Agent') || '';

    // Bot detection
    const botCheck = detectBot(userAgent, clientIP);
    if (botCheck.isBot) {
      console.warn(`[Security] Bot detected: ${botCheck.reason} - IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access denied',
          businesses: [],
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Rate limiting - strict for search to prevent scraping
    const rateLimit = await checkRateLimit(clientIP, RATE_LIMITS.SEARCH);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          businesses: [],
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Validate search parameters
    const url = new URL(request.url);
    const paramsObj = {
      q: url.searchParams.get('q') || undefined,
      category: url.searchParams.get('category') || undefined,
      city: url.searchParams.get('city') || undefined,
      sort: url.searchParams.get('sort') || undefined,
    };

    const validation = searchParamsSchema.safeParse(paramsObj);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid search parameters',
          businesses: [],
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      );
    }

    const { q: query = '', category = '', city = '', sort = 'ai_score' } = validation.data;

    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
      };
    };

    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database not available',
          businesses: [],
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      );
    }

    const db = runtime.env.DB;

    // Build the SQL query dynamically based on filters
    let sql = `
      SELECT
        id,
        business_name as name,
        business_category as category,
        city,
        address,
        phone,
        email,
        website,
        short_description as description,
        quality_score as ai_quality_score,
        ai_description as ai_generated_description,
        ai_keywords,
        directory_tier as tier,
        NULL as featured_image_url,
        is_ai_verified as is_verified,
        hours_of_operation as hours,
        ai_processing_status as status,
        created_at
      FROM business_directory
      WHERE ai_processing_status != 'error'
    `;

    const params: any[] = [];

    // Add search query filter (search across multiple fields)
    if (query) {
      sql += ` AND (
        business_name LIKE ? OR
        short_description LIKE ? OR
        ai_description LIKE ? OR
        ai_keywords LIKE ? OR
        business_category LIKE ? OR
        city LIKE ?
      )`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Add category filter
    if (category && category !== 'All Categories') {
      sql += ` AND business_category = ?`;
      params.push(category);
    }

    // Add city filter
    if (city && city !== 'All Cities') {
      sql += ` AND city = ?`;
      params.push(city);
    }

    // Add sorting
    if (sort === 'ai_score') {
      sql += ` ORDER BY quality_score DESC, business_name ASC`;
    } else if (sort === 'name') {
      sql += ` ORDER BY business_name ASC`;
    } else if (sort === 'newest') {
      sql += ` ORDER BY created_at DESC`;
    } else {
      sql += ` ORDER BY quality_score DESC, business_name ASC`;
    }

    // Limit results to 100 for performance
    sql += ` LIMIT 100`;

    const result = await db.prepare(sql).bind(...params).all();

    if (!result.success) {
      throw new Error('Failed to fetch businesses from database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        businesses: result.results || [],
        count: result.results?.length || 0,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=30', // Short cache, private only
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('[Error] Directory search error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'An error occurred while searching',
        businesses: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
      }
    );
  }
};
