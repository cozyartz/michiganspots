import type { APIRoute } from 'astro';
import { CloudflareAIService } from '../../../lib/ai/cloudflare-ai-service';

/**
 * Embedding Health Check API
 *
 * Monitors the health of business embeddings in Vectorize
 *
 * GET /api/admin/embedding-health
 * Returns statistics about embedding coverage
 *
 * POST /api/admin/embedding-health
 * Body: { action: 'regenerate', businessIds?: number[] }
 * Regenerates embeddings for specified businesses or all missing ones
 */

interface HealthStats {
  total_businesses: number;
  with_embeddings: number;
  missing_embeddings: number;
  coverage_percentage: number;
  last_sync: string | null;
  missing_business_ids: number[];
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
        VECTORIZE?: any;
      };
    };

    if (!runtime?.env?.DB || !runtime?.env?.VECTORIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database or Vectorize not available',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const db = runtime.env.DB;
    const vectorize = runtime.env.VECTORIZE;

    // Get all active businesses
    const businessesResult = await db
      .prepare(`
        SELECT id, business_name, created_at
        FROM business_directory
        WHERE ai_processing_status != 'error'
        ORDER BY id ASC
      `)
      .all();

    const businesses = businessesResult.results || [];
    const totalBusinesses = businesses.length;

    // Check which businesses have embeddings in Vectorize
    const missingBusinessIds: number[] = [];
    let withEmbeddings = 0;

    // Query Vectorize for each business (batch check)
    for (const business of businesses) {
      try {
        // Try to query for this specific business by ID
        // Vectorize doesn't have a direct "get by ID" - we query and check results
        const result = await vectorize.getByIds([business.id.toString()]);

        if (result && result.length > 0) {
          withEmbeddings++;
        } else {
          missingBusinessIds.push(business.id);
        }
      } catch (error) {
        // If error, assume missing
        missingBusinessIds.push(business.id);
      }
    }

    const missingEmbeddings = missingBusinessIds.length;
    const coveragePercentage = totalBusinesses > 0
      ? ((withEmbeddings / totalBusinesses) * 100).toFixed(1)
      : 0;

    // Get last successful embedding generation timestamp
    const lastSyncResult = await db
      .prepare(`
        SELECT MAX(updated_at) as last_sync
        FROM business_directory
        WHERE ai_processing_status = 'completed'
      `)
      .first();

    const stats: HealthStats = {
      total_businesses: totalBusinesses,
      with_embeddings: withEmbeddings,
      missing_embeddings: missingEmbeddings,
      coverage_percentage: parseFloat(coveragePercentage as string),
      last_sync: lastSyncResult?.last_sync || null,
      missing_business_ids: missingBusinessIds.slice(0, 100), // Return first 100 missing IDs
    };

    // Get businesses missing embeddings with details
    let missingBusinesses = [];
    if (missingBusinessIds.length > 0) {
      const placeholders = missingBusinessIds.slice(0, 20).map(() => '?').join(',');
      const missingResult = await db
        .prepare(`
          SELECT id, business_name, business_category, city, created_at
          FROM business_directory
          WHERE id IN (${placeholders})
          ORDER BY created_at DESC
        `)
        .bind(...missingBusinessIds.slice(0, 20))
        .all();

      missingBusinesses = missingResult.results || [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        missing_businesses: missingBusinesses,
        health_status: coveragePercentage >= 95 ? 'healthy' :
                      coveragePercentage >= 80 ? 'warning' : 'critical',
        recommendations: generateRecommendations(stats),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error) {
    console.error('Embedding health check error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Regenerate missing embeddings
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { action, businessIds, batchSize = 10 } = body;

    if (action !== 'regenerate') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid action. Use action: "regenerate"',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
        AI?: any;
        VECTORIZE?: any;
      };
    };

    if (!runtime?.env?.DB || !runtime?.env?.AI || !runtime?.env?.VECTORIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database, AI, or Vectorize not available',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const db = runtime.env.DB;
    const ai = runtime.env.AI;
    const vectorize = runtime.env.VECTORIZE;
    const aiService = new CloudflareAIService(ai, db);

    // Get businesses to process
    let query = 'SELECT * FROM business_directory WHERE ai_processing_status != \'error\'';
    let params: any[] = [];

    if (businessIds && Array.isArray(businessIds) && businessIds.length > 0) {
      const placeholders = businessIds.map(() => '?').join(',');
      query += ` AND id IN (${placeholders})`;
      params = businessIds;
    } else {
      query += ` LIMIT ?`;
      params = [batchSize];
    }

    const businessesResult = await db.prepare(query).bind(...params).all();
    const businesses = businessesResult.results || [];

    const results = {
      processed: 0,
      failed: 0,
      total: businesses.length,
      details: [] as Array<{ id: number; success: boolean; error?: string }>,
    };

    // Process each business
    const vectors = [];
    for (const business of businesses) {
      try {
        // Generate embedding
        const embedding = await aiService.generateBusinessEmbedding(business);

        vectors.push({
          id: business.id.toString(),
          values: embedding,
          metadata: {
            name: business.business_name,
            category: business.business_category,
            city: business.city,
          },
        });

        results.processed++;
        results.details.push({
          id: business.id,
          success: true,
        });

        // Batch insert when we hit 100 vectors
        if (vectors.length >= 100) {
          await vectorize.upsert(vectors);
          vectors.length = 0;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to generate embedding for business ${business.id}:`, error);
        results.failed++;
        results.details.push({
          id: business.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Insert remaining vectors
    if (vectors.length > 0) {
      await vectorize.upsert(vectors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Regenerated ${results.processed} embeddings, ${results.failed} failed`,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Embedding regeneration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

function generateRecommendations(stats: HealthStats): string[] {
  const recommendations = [];

  if (stats.coverage_percentage < 80) {
    recommendations.push('⚠️ CRITICAL: Less than 80% of businesses have embeddings. Run bulk regeneration immediately.');
  }

  if (stats.coverage_percentage >= 80 && stats.coverage_percentage < 95) {
    recommendations.push('⚠️ WARNING: Some businesses are missing embeddings. Consider running a backfill job.');
  }

  if (stats.missing_embeddings > 0 && stats.missing_embeddings < 10) {
    recommendations.push(`✓ Only ${stats.missing_embeddings} businesses need embeddings. You can regenerate them manually.`);
  }

  if (stats.coverage_percentage >= 95) {
    recommendations.push('✓ Embedding coverage is healthy!');
  }

  if (stats.last_sync) {
    const lastSync = new Date(stats.last_sync);
    const hoursSince = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

    if (hoursSince > 24) {
      recommendations.push(`Last sync was ${Math.round(hoursSince)} hours ago. Check if cron job is running.`);
    }
  }

  return recommendations;
}
