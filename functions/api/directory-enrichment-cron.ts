/**
 * Directory Business Enrichment Cron Job
 *
 * This function should be triggered by Cloudflare Cron Triggers.
 *
 * To set up:
 * Use Cloudflare Dashboard:
 * - Go to Workers & Pages > michiganspot > Triggers > Cron Triggers
 * - Add schedule: 0 (star)/6 (star) (star) (star) (star) - every 6 hours
 * - Replace (star) with the asterisk symbol
 *    - Point to: /api/directory-enrichment-cron
 *
 * This cron job will:
 * - Find businesses that need AI processing
 * - Process up to 50 businesses per run
 * - Generate AI quality scores and descriptions
 * - Update business data with AI-generated content
 * - Generate vector embeddings for semantic search
 */

import { CloudflareAIService } from '../../src/lib/ai/cloudflare-ai-service';

interface Env {
  DB: D1Database;
  AI: any;
  VECTORIZE: any;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    const { env } = context;

    // Verify cron secret for security (optional but recommended)
    const cronSecret = context.request.headers.get('x-cron-secret');
    const expectedSecret = env.CRON_SECRET || 'michigan-spots-cron-2025';

    if (cronSecret !== expectedSecret) {
      console.log('Unauthorized cron request');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const db = env.DB;

    // Check for AI availability
    if (!env.AI) {
      console.error('Cloudflare AI not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI service not available',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const aiService = new CloudflareAIService(env.AI, db);

    // Get businesses that need AI processing
    // Limit to 50 per run for performance
    const businessesResult = await db
      .prepare(
        `SELECT id, business_name as name, city, business_category as category, short_description as description
         FROM business_directory
         WHERE ai_processing_status = 'pending'
         ORDER BY created_at DESC
         LIMIT 50`
      )
      .all();

    if (!businessesResult.success || !businessesResult.results || businessesResult.results.length === 0) {
      console.log('No businesses need enrichment');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No businesses need enrichment',
          enriched: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const businesses = businessesResult.results;
    const results = {
      total: businesses.length,
      aiProcessed: 0,
      embeddingsGenerated: 0,
      failed: 0,
      errors: [] as string[],
    };

    console.log(`Starting AI processing for ${businesses.length} businesses`);

    // Process each business with AI
    for (const business of businesses) {
      try {
        console.log(`Processing: ${business.name} in ${business.city}`);

        // Get full business data
        const fullBusiness = await db
          .prepare('SELECT * FROM business_directory WHERE id = ? LIMIT 1')
          .bind(business.id)
          .first();

        if (!fullBusiness) {
          results.failed++;
          results.errors.push(`Business not found: ${business.id}`);
          continue;
        }

        // Generate AI quality score and enrichment
        const qualityScore = await aiService.calculateQualityScore(fullBusiness);
        const enrichedData = await aiService.enrichBusinessData(fullBusiness);

        // Update with AI data
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

        results.aiProcessed++;
        console.log(`✓ AI processed: ${business.name} (Score: ${qualityScore})`);

        // Generate vector embedding for semantic search and insert into Vectorize
        try {
          // Get updated business data for embedding
          const updatedBusiness = await db
            .prepare('SELECT * FROM business_directory WHERE id = ? LIMIT 1')
            .bind(business.id)
            .first();

          if (updatedBusiness) {
            const embedding = await aiService.generateBusinessEmbedding(updatedBusiness);

            // Insert into Vectorize (upsert replaces existing)
            await env.VECTORIZE.upsert([
              {
                id: updatedBusiness.id.toString(),
                values: embedding,
                metadata: {
                  name: updatedBusiness.business_name,
                  category: updatedBusiness.business_category,
                  city: updatedBusiness.city,
                },
              },
            ]);

            results.embeddingsGenerated++;
            console.log(`✓ Embedding generated and inserted into Vectorize: ${business.name}`);
          }
        } catch (embeddingError) {
          console.error(`Failed to generate embedding for ${business.name}:`, embeddingError);
          // Don't fail the whole process if embedding generation fails
        }

        // Small delay between AI calls
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to process ${business.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);

        // Mark as error in database
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

    console.log('AI processing cron completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Business AI processing cron completed',
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Enrichment cron error:', error);
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
