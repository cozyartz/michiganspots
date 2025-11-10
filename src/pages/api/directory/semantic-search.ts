import type { APIRoute } from 'astro';
import { CloudflareAIService } from '../../../lib/ai/cloudflare-ai-service';
import { checkRateLimit, detectBot, RATE_LIMITS } from '../../../lib/security/rate-limiter';
import { getSecurityHeaders, getClientIP } from '../../../lib/security/headers';
import { z } from 'zod';

/**
 * MichiganGPT Semantic Search API (Vectorize-powered)
 *
 * Uses Cloudflare Vectorize for efficient vector similarity search
 *
 * Features:
 * - Native vector similarity search (no manual cosine calculations)
 * - Sub-100ms query times via edge computing
 * - Scalable to millions of vectors
 * - Hybrid scoring with keyword boosting
 * - Rate limiting and bot protection
 *
 * Usage:
 * GET /api/directory/semantic-search?q=romantic+dinner+with+lake+view&limit=20
 */

// Validation schema
const semanticSearchSchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).optional(),
  category: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
});

interface SearchResult {
  id: number;
  score: number;
  metadata: any;
}

/**
 * Calculate keyword matching score (0-1)
 */
function calculateKeywordScore(query: string, business: any): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (queryTerms.length === 0) return 0;

  const searchableText = [
    business.business_name,
    business.business_category,
    business.short_description,
    business.ai_description,
    business.city,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let matches = 0;
  for (const term of queryTerms) {
    if (searchableText.includes(term)) {
      matches++;
    }
  }

  return matches / queryTerms.length;
}

/**
 * Calculate quality boost multiplier
 */
function calculateQualityBoost(business: any): number {
  let boost = 1.0;

  // Quality score boost
  const qualityScore = business.quality_score || 0;
  if (qualityScore >= 85) boost += 0.2;
  else if (qualityScore >= 70) boost += 0.1;
  else if (qualityScore >= 50) boost += 0.05;

  // Tier boost
  const tier = business.directory_tier || 'free';
  if (tier === 'pro') boost += 0.15;
  else if (tier === 'growth') boost += 0.1;
  else if (tier === 'starter') boost += 0.05;

  // Verification boost
  if (business.is_ai_verified) boost += 0.1;
  if (business.is_claimed) boost += 0.05;

  return boost;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get client info
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('User-Agent') || '';

    // Bot detection
    const botCheck = detectBot(userAgent, clientIP);
    if (botCheck.isBot) {
      console.warn(`[Security] Bot detected on semantic search: ${botCheck.reason} - IP: ${clientIP}`);
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

    // Rate limiting - strict for semantic search (AI-powered, expensive)
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
      q: url.searchParams.get('q') || '',
      limit: parseInt(url.searchParams.get('limit') || '20', 10),
      category: url.searchParams.get('category') || undefined,
      city: url.searchParams.get('city') || undefined,
    };

    const validation = semanticSearchSchema.safeParse(paramsObj);
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

    const { q: query, limit = 20, category = '', city = '' } = validation.data;

    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
        AI: any;
        VECTORIZE: any;
      };
    };

    if (!runtime?.env?.DB || !runtime?.env?.AI || !runtime?.env?.VECTORIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database, AI, or Vectorize not available',
          businesses: [],
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      );
    }

    const db = runtime.env.DB;
    const ai = runtime.env.AI;
    const vectorize = runtime.env.VECTORIZE;

    // Generate query embedding
    const aiService = new CloudflareAIService(ai, db);
    const queryEmbedding = await aiService.generateQueryEmbedding(query);

    // Query Vectorize for similar vectors
    // Use topK higher than limit to allow for filtering and re-ranking
    const vectorResults = await vectorize.query(queryEmbedding, {
      topK: Math.min(limit * 3, 100), // Get more results for filtering
      returnValues: false,
      returnMetadata: true,
    });

    if (!vectorResults || !vectorResults.matches || vectorResults.matches.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No matching businesses found',
          businesses: [],
          count: 0,
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
    }

    // Extract business IDs from vector matches
    const businessIds = vectorResults.matches.map((match: any) => match.id);

    // Fetch full business data from D1
    const placeholders = businessIds.map(() => '?').join(',');
    let businessSql = `
      SELECT *
      FROM business_directory
      WHERE id IN (${placeholders})
      AND ai_processing_status != 'error'
    `;

    const params: any[] = [...businessIds];

    // Add category filter
    if (category && category !== 'All Categories') {
      businessSql += ` AND business_category = ?`;
      params.push(category);
    }

    // Add city filter
    if (city && city !== 'All Cities') {
      businessSql += ` AND city = ?`;
      params.push(city);
    }

    const businessesResult = await db.prepare(businessSql).bind(...params).all();

    if (!businessesResult.success || !businessesResult.results) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No businesses found after filtering',
          businesses: [],
          count: 0,
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
    }

    const businesses = businessesResult.results;

    // Create map of business ID to vector score
    const vectorScoreMap = new Map();
    vectorResults.matches.forEach((match: any) => {
      vectorScoreMap.set(parseInt(match.id), match.score);
    });

    // Calculate hybrid scores
    const scoredBusinesses = businesses.map((business: any) => {
      const semanticScore = vectorScoreMap.get(business.id) || 0;
      const keywordScore = calculateKeywordScore(query, business);
      const qualityBoost = calculateQualityBoost(business);

      // Hybrid: 60% semantic + 40% keyword
      const hybridScore = (semanticScore * 0.6) + (keywordScore * 0.4);
      const finalScore = hybridScore * qualityBoost;

      return {
        business,
        semanticScore,
        keywordScore,
        hybridScore,
        finalScore,
      };
    });

    // Sort by final score
    scoredBusinesses.sort((a, b) => b.finalScore - a.finalScore);

    // Take top N results
    const topResults = scoredBusinesses.slice(0, limit);

    // Format response
    const formattedBusinesses = topResults.map((result) => {
      const { business, semanticScore, keywordScore, hybridScore, finalScore } = result;

      return {
        id: business.id,
        name: business.business_name,
        category: business.business_category,
        sub_categories: business.sub_categories ? JSON.parse(business.sub_categories) : [],
        city: business.city,
        address: business.address,
        phone: business.phone,
        email: business.email,
        website: business.website,
        description: business.short_description,
        ai_generated_description: business.ai_description,
        ai_keywords: business.ai_keywords ? JSON.parse(business.ai_keywords) : [],
        ai_highlights: business.ai_highlights ? JSON.parse(business.ai_highlights) : [],
        ai_quality_score: business.quality_score,
        tier: business.directory_tier,
        is_verified: business.is_ai_verified,
        is_claimed: business.is_claimed,
        hours: business.hours_of_operation ? JSON.parse(business.hours_of_operation) : null,
        price_level: business.price_level,
        amenities: business.amenities ? JSON.parse(business.amenities) : [],
        tags: business.tags ? JSON.parse(business.tags) : [],
        total_views: business.total_views,
        total_clicks: business.total_clicks,
        created_at: business.created_at,

        // Search scores (for debugging/transparency)
        search_metadata: {
          semantic_score: Math.round(semanticScore * 100) / 100,
          keyword_score: Math.round(keywordScore * 100) / 100,
          hybrid_score: Math.round(hybridScore * 100) / 100,
          final_score: Math.round(finalScore * 100) / 100,
        },
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        query,
        businesses: formattedBusinesses,
        count: formattedBusinesses.length,
        total_candidates: vectorResults.matches.length,
        search_type: 'vectorize_semantic_hybrid',
        weights: {
          semantic: 0.6,
          keyword: 0.4,
        },
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
    console.error('[Error] Semantic search error:', error);
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
