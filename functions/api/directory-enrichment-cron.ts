/**
 * Directory Business Enrichment Cron Job
 *
 * This function should be triggered by Cloudflare Cron Triggers.
 *
 * To set up:
 * 1. Add cron trigger in wrangler.toml:
 *    [triggers]
 *    crons = ["0 */6 * * *"]  # Run every 6 hours
 *
 * 2. Or use Cloudflare Dashboard:
 *    - Go to Workers & Pages > michiganspot > Triggers > Cron Triggers
 *    - Add schedule: "0 */6 * * *" (every 6 hours)
 *    - Point to: /api/directory-enrichment-cron
 *
 * This cron job will:
 * - Find businesses without Clodura enrichment
 * - Enrich up to 50 businesses per run (respects rate limits)
 * - Update business data with Clodura information
 * - Trigger AI quality score calculation
 */

import { createCloduraService } from '../../src/lib/clodura-api-service';
import { CloudflareAIService } from '../../src/lib/ai/cloudflare-ai-service';

interface Env {
  DB: D1Database;
  CLODURA_API_KEY?: string;
  AI: any;
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

    // Check for Clodura API key
    const cloduraApiKey = env.CLODURA_API_KEY;
    if (!cloduraApiKey) {
      console.error('CLODURA_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Clodura API key not configured',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const cloduraService = createCloduraService(cloduraApiKey);
    const aiService = new CloudflareAIService(env.AI);

    // Get businesses that need enrichment (no clodura_metadata)
    // Limit to 50 per run to respect rate limits
    const businessesResult = await db
      .prepare(
        `SELECT id, business_name as name, city, business_category as category, short_description as description
         FROM business_directory
         WHERE clodura_metadata IS NULL
           AND ai_processing_status != 'error'
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
      enriched: 0,
      aiProcessed: 0,
      failed: 0,
      errors: [] as string[],
    };

    console.log(`Starting enrichment for ${businesses.length} businesses`);

    // Process each business
    for (const business of businesses) {
      try {
        console.log(`Enriching: ${business.name} in ${business.city}`);

        // Step 1: Enrich with Clodura
        const enrichResult = await cloduraService.enrichBusiness(
          business.name as string,
          business.city as string
        );

        if (enrichResult.success && enrichResult.data && enrichResult.data.length > 0) {
          const cloduraData = enrichResult.data[0];

          // Update business with Clodura data
          await db
            .prepare(
              `UPDATE business_directory
               SET
                 phone = COALESCE(?, phone),
                 website = COALESCE(?, website),
                 description = COALESCE(?, description),
                 social_facebook = COALESCE(?, social_facebook),
                 social_twitter = COALESCE(?, social_twitter),
                 social_linkedin = COALESCE(?, social_linkedin),
                 clodura_metadata = ?,
                 updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
            )
            .bind(
              cloduraData.company_phone,
              cloduraData.company_website,
              cloduraData.company_description,
              cloduraData.company_social_facebook,
              cloduraData.company_social_twitter,
              cloduraData.company_social_linkedin,
              JSON.stringify({
                industry: cloduraData.company_industry,
                size: cloduraData.company_size,
                founded: cloduraData.company_founded_year,
                revenue: cloduraData.company_revenue,
                employees: cloduraData.company_employees,
                enriched_at: new Date().toISOString(),
              }),
              business.id
            )
            .run();

          results.enriched++;
          console.log(`✓ Enriched: ${business.name}`);

          // Step 2: Trigger AI processing if available
          if (env.AI) {
            try {
              // Get updated business data
              const updatedBusiness = await db
                .prepare('SELECT * FROM business_directory WHERE id = ? LIMIT 1')
                .bind(business.id)
                .first();

              if (updatedBusiness) {
                // Generate AI quality score and enrichment
                const qualityScore = await aiService.calculateQualityScore(updatedBusiness);
                const enrichedData = await aiService.enrichBusinessData(updatedBusiness);

                // Update with AI data
                await db
                  .prepare(
                    `UPDATE business_directory
                     SET
                       ai_quality_score = ?,
                       ai_generated_description = ?,
                       ai_keywords = ?,
                       ai_highlights = ?,
                       ai_processing_status = 'completed',
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
              }
            } catch (aiError) {
              console.error(`AI processing failed for ${business.name}:`, aiError);
              // Continue even if AI fails
            }
          }
        } else {
          results.failed++;
          const error = `No Clodura data for: ${business.name}`;
          console.log(error);
          results.errors.push(error);
        }

        // Delay between requests to respect rate limits (150ms = ~6-7 req/sec)
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        results.failed++;
        const errorMsg = `Failed to process ${business.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    const rateLimitStatus = cloduraService.getRateLimitStatus();

    console.log('Enrichment cron completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Business enrichment cron completed',
        results,
        rateLimitStatus,
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
