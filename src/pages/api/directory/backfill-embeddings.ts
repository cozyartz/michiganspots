import type { APIRoute } from 'astro';
import { CloudflareAIService } from '../../../lib/ai/cloudflare-ai-service';

/**
 * Backfill Vector Embeddings to Vectorize
 *
 * Migrates businesses to Cloudflare Vectorize for efficient semantic search
 *
 * Usage:
 * POST /api/directory/backfill-embeddings
 * Body: {
 *   businessId?: number,      // Process single business
 *   batchSize?: number,        // Number of businesses to process (default: 10)
 *   force?: boolean           // Regenerate embeddings even if they exist
 * }
 */

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { businessId, batchSize = 10, force = false } = body;

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

    // Handle single business
    if (businessId) {
      const business = await db
        .prepare('SELECT * FROM business_directory WHERE id = ?')
        .bind(businessId)
        .first();

      if (!business) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Business not found',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      try {
        // Generate embedding
        const embedding = await aiService.generateBusinessEmbedding(business);

        // Insert into Vectorize
        await vectorize.upsert([
          {
            id: business.id.toString(),
            values: embedding,
            metadata: {
              name: business.business_name,
              category: business.business_category,
              city: business.city,
            },
          },
        ]);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Embedding generated and inserted into Vectorize',
            businessId,
            embeddingDimensions: embedding.length,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error(`Embedding generation failed for business ${businessId}:`, error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Embedding generation failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Handle batch processing - get all businesses that need embeddings
    const businessesResult = await db
      .prepare(
        `SELECT * FROM business_directory
         WHERE ai_processing_status != 'error'
         LIMIT ?`
      )
      .bind(batchSize)
      .all();

    if (!businessesResult.success || !businessesResult.results || businessesResult.results.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No businesses need embedding generation',
          processed: 0,
          failed: 0,
          total: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const businesses = businessesResult.results;
    const results = {
      processed: 0,
      failed: 0,
      total: businesses.length,
      details: [] as Array<{ id: number; success: boolean; error?: string }>,
    };

    // Process in batches of 100 for Vectorize upsert
    const VECTORIZE_BATCH_SIZE = 100;
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

        // When we reach batch size, insert into Vectorize
        if (vectors.length >= VECTORIZE_BATCH_SIZE) {
          await vectorize.upsert(vectors);
          vectors.length = 0; // Clear array
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

    // Insert any remaining vectors
    if (vectors.length > 0) {
      await vectorize.upsert(vectors);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Backfill completed: ${results.processed} processed, ${results.failed} failed`,
        processed: results.processed,
        failed: results.failed,
        total: results.total,
        results: results.details,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Backfill embeddings API error:', error);
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
