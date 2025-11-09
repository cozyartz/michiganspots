import type { APIRoute } from 'astro';
import { CloudflareAIService } from '../../../lib/ai/cloudflare-ai-service';

/**
 * API endpoint to enrich business listings with AI-generated content
 *
 * Usage:
 * POST /api/directory/enrich
 * Body: { businessId: "uuid", force: boolean }
 *
 * Or for bulk:
 * POST /api/directory/enrich
 * Body: { bulkEnrich: true, limit: 10 }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { businessId, force = false, bulkEnrich = false, limit = 10 } = body;

    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
        AI?: any;
      };
    };

    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database not available',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const db = runtime.env.DB;

    // Check for AI availability
    if (!runtime.env.AI) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI service not available',
          message: 'Cloudflare AI binding not configured',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const aiService = new CloudflareAIService(runtime.env.AI);

    // Handle single business enrichment
    if (businessId) {
      const business = await db
        .prepare('SELECT * FROM business_directory WHERE id = ? LIMIT 1')
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

      // Check if already AI processed (unless force is true)
      if (!force && business.ai_processing_status === 'completed') {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Business already AI-processed (use force=true to re-process)',
            business,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Generate AI enrichment
      try {
        const qualityScore = await aiService.calculateQualityScore(business);
        const enrichedData = await aiService.enrichBusinessData(business);

        // Update business with AI-generated data
        const updateResult = await db
          .prepare(
            `UPDATE business_directory
             SET
               quality_score = ?,
               ai_description = ?,
               ai_keywords = ?,
               ai_highlights = ?,
               ai_processing_status = 'completed',
               last_ai_update = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .bind(
            qualityScore,
            enrichedData.description,
            enrichedData.keywords?.join(', '),
            JSON.stringify(enrichedData.highlights || []),
            businessId
          )
          .run();

        if (!updateResult.success) {
          throw new Error('Failed to update business with AI data');
        }

        // Fetch updated business
        const updatedBusiness = await db
          .prepare('SELECT * FROM business_directory WHERE id = ? LIMIT 1')
          .bind(businessId)
          .first();

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Business AI-enriched successfully',
            business: updatedBusiness,
            qualityScore,
            enrichedData,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (aiError) {
        // Mark as error in database
        await db
          .prepare(
            `UPDATE business_directory
             SET ai_processing_status = 'error'
             WHERE id = ?`
          )
          .bind(businessId)
          .run();

        return new Response(
          JSON.stringify({
            success: false,
            error: 'AI processing failed',
            message: aiError instanceof Error ? aiError.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Handle bulk enrichment
    if (bulkEnrich) {
      // Get businesses that need AI processing
      const businessesResult = await db
        .prepare(
          `SELECT * FROM business_directory
           WHERE ai_processing_status = 'pending'
           LIMIT ?`
        )
        .bind(limit)
        .all();

      if (!businessesResult.success || !businessesResult.results || businessesResult.results.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'No businesses need AI processing',
            processed: 0,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const businesses = businessesResult.results;
      const processedCount = {
        success: 0,
        failed: 0,
        total: businesses.length,
      };

      // Process each business with AI
      for (const business of businesses) {
        try {
          const qualityScore = await aiService.calculateQualityScore(business);
          const enrichedData = await aiService.enrichBusinessData(business);

          await db
            .prepare(
              `UPDATE business_directory
               SET
                 quality_score = ?,
                 ai_description = ?,
                 ai_keywords = ?,
                 ai_highlights = ?,
                 ai_processing_status = 'completed',
                 last_ai_update = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
            )
            .bind(
              qualityScore,
              enrichedData.description,
              enrichedData.keywords?.join(', '),
              JSON.stringify(enrichedData.highlights || []),
              business.id
            )
            .run();

          processedCount.success++;

          // Small delay between AI calls
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to AI-process business ${business.id}:`, error);
          processedCount.failed++;

          // Mark as error
          await db
            .prepare(
              `UPDATE business_directory
               SET ai_processing_status = 'error'
               WHERE id = ?`
            )
            .bind(business.id)
            .run();
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Bulk AI processing completed`,
          results: processedCount,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid request',
        message: 'Provide either businessId or bulkEnrich parameter',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Enrichment API error:', error);
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
