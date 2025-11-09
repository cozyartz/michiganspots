import type { APIRoute } from 'astro';
import { createCloduraService } from '../../../lib/clodura-api-service';

/**
 * API endpoint to enrich business listings with Clodura data
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
        CLODURA_API_KEY?: string;
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

    // Check for Clodura API key
    const cloduraApiKey = runtime.env.CLODURA_API_KEY;
    if (!cloduraApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Clodura API key not configured',
          message: 'Add CLODURA_API_KEY to environment variables',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const cloduraService = createCloduraService(cloduraApiKey);

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

      // Check if already enriched (unless force is true)
      if (!force && business.clodura_metadata) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Business already enriched (use force=true to re-enrich)',
            business,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Enrich with Clodura
      const enrichResult = await cloduraService.enrichBusiness(business.name as string, business.city as string);

      if (!enrichResult.success || !enrichResult.data || enrichResult.data.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to enrich business with Clodura',
            message: enrichResult.error || 'No data found',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const cloduraData = enrichResult.data[0];

      // Update business with enriched data
      const updateResult = await db
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
          businessId
        )
        .run();

      if (!updateResult.success) {
        throw new Error('Failed to update business with enriched data');
      }

      // Fetch updated business
      const updatedBusiness = await db
        .prepare('SELECT * FROM business_directory WHERE id = ? LIMIT 1')
        .bind(businessId)
        .first();

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Business enriched successfully',
          business: updatedBusiness,
          cloduraData,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle bulk enrichment
    if (bulkEnrich) {
      // Get businesses that need enrichment (no clodura_metadata)
      const businessesResult = await db
        .prepare(
          `SELECT id, business_name as name, city, business_category as category
           FROM business_directory
           WHERE clodura_metadata IS NULL
             AND ai_processing_status != 'error'
           LIMIT ?`
        )
        .bind(limit)
        .all();

      if (!businessesResult.success || !businessesResult.results || businessesResult.results.length === 0) {
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
      const enrichedCount = {
        success: 0,
        failed: 0,
        total: businesses.length,
      };

      // Enrich each business
      for (const business of businesses) {
        try {
          const enrichResult = await cloduraService.enrichBusiness(
            business.name as string,
            business.city as string
          );

          if (enrichResult.success && enrichResult.data && enrichResult.data.length > 0) {
            const cloduraData = enrichResult.data[0];

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

            enrichedCount.success++;
          } else {
            enrichedCount.failed++;
          }

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          console.error(`Failed to enrich business ${business.id}:`, error);
          enrichedCount.failed++;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Bulk enrichment completed`,
          results: enrichedCount,
          rateLimitStatus: cloduraService.getRateLimitStatus(),
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
