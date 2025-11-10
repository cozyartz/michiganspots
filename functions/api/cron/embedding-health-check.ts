import type { EventContext } from '@cloudflare/workers-types';

/**
 * Embedding Health Check Cron Job
 *
 * Runs daily to monitor and maintain embedding health
 * - Checks embedding coverage across all businesses
 * - Auto-regenerates up to 10 missing embeddings per run
 * - Sends alerts if critical threshold exceeded
 *
 * Configured in wrangler.toml:
 * [triggers]
 * crons = ["0 2 * * *"]  # Runs daily at 2 AM UTC
 */

interface Env {
  DB: D1Database;
  AI: any;
  VECTORIZE: any;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const db = env.DB;
    const vectorize = env.VECTORIZE;

    console.log('[Cron] Starting embedding health check...');

    // Step 1: Get all active businesses
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

    // Step 2: Check which businesses have embeddings
    const missingBusinessIds: number[] = [];
    let withEmbeddings = 0;

    for (const business of businesses) {
      try {
        const result = await vectorize.getByIds([business.id.toString()]);
        if (result && result.length > 0) {
          withEmbeddings++;
        } else {
          missingBusinessIds.push(business.id);
        }
      } catch (error) {
        missingBusinessIds.push(business.id);
      }
    }

    const missingCount = missingBusinessIds.length;
    const coveragePercentage = totalBusinesses > 0
      ? ((withEmbeddings / totalBusinesses) * 100).toFixed(1)
      : 100;

    console.log(`[Cron] Health Check: ${withEmbeddings}/${totalBusinesses} businesses have embeddings (${coveragePercentage}%)`);
    console.log(`[Cron] Missing embeddings: ${missingCount}`);

    // Step 3: Determine health status
    const healthStatus = parseFloat(coveragePercentage) >= 95 ? 'healthy' :
                        parseFloat(coveragePercentage) >= 80 ? 'warning' : 'critical';

    // Step 4: Log health check result
    await db
      .prepare(`
        INSERT INTO embedding_health_log (
          total_businesses,
          with_embeddings,
          missing_embeddings,
          coverage_percentage,
          health_status,
          checked_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)
      .bind(totalBusinesses, withEmbeddings, missingCount, parseFloat(coveragePercentage), healthStatus)
      .run();

    // Step 5: Auto-regenerate up to 10 missing embeddings if needed
    if (missingBusinessIds.length > 0) {
      const batchSize = Math.min(10, missingBusinessIds.length);
      const toRegenerate = missingBusinessIds.slice(0, batchSize);

      console.log(`[Cron] Regenerating ${batchSize} embeddings...`);

      let regenerated = 0;
      let failed = 0;

      for (const businessId of toRegenerate) {
        try {
          // Get business details
          const business = await db
            .prepare('SELECT * FROM business_directory WHERE id = ?')
            .bind(businessId)
            .first();

          if (!business) {
            console.error(`[Cron] Business ${businessId} not found`);
            failed++;
            continue;
          }

          // Generate embedding using AI
          const embedding = await generateBusinessEmbedding(business, env.AI);

          // Upsert to Vectorize
          await vectorize.upsert([{
            id: business.id.toString(),
            values: embedding,
            metadata: {
              name: business.business_name,
              category: business.business_category,
              city: business.city,
            }
          }]);

          regenerated++;
          console.log(`[Cron] Regenerated embedding for business ${businessId}`);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`[Cron] Failed to regenerate embedding for business ${businessId}:`, error);
          failed++;
        }
      }

      console.log(`[Cron] Regeneration complete: ${regenerated} succeeded, ${failed} failed`);

      // Log regeneration result
      await db
        .prepare(`
          INSERT INTO embedding_regeneration_log (
            attempted_count,
            succeeded_count,
            failed_count,
            triggered_by,
            regenerated_at
          ) VALUES (?, ?, ?, 'cron', CURRENT_TIMESTAMP)
        `)
        .bind(batchSize, regenerated, failed)
        .run();
    }

    // Step 6: Alert if critical
    if (healthStatus === 'critical') {
      console.error(`[Cron] ALERT: Critical embedding health! Coverage: ${coveragePercentage}%`);
      // TODO: Implement email/webhook alert if needed
    }

    return new Response(
      JSON.stringify({
        success: true,
        health_check: {
          total_businesses: totalBusinesses,
          with_embeddings: withEmbeddings,
          missing_embeddings: missingCount,
          coverage_percentage: parseFloat(coveragePercentage),
          health_status: healthStatus
        },
        cron_run: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[Cron] Embedding health check failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Cron job failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Generate business embedding using CloudflareAI
 */
async function generateBusinessEmbedding(business: any, ai: any): Promise<number[]> {
  // Create a comprehensive text representation
  const text = [
    business.business_name,
    business.business_category,
    business.business_subcategory,
    business.description,
    business.city,
    business.state,
    business.tags,
  ].filter(Boolean).join(' ');

  // Generate embedding using BGE model
  const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: text.substring(0, 1000), // Limit to 1000 chars
  });

  return result.data[0];
}
