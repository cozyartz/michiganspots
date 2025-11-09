import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Business ID is required',
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

    // Fetch business from database
    const business = await db
      .prepare(
        `SELECT
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
          ai_highlights,
          ai_sentiment_score,
          directory_tier as tier,
          is_ai_verified as is_verified,
          is_claimed,
          hours_of_operation as hours,
          created_at
        FROM business_directory
        WHERE id = ?
        LIMIT 1`
      )
      .bind(id)
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

    return new Response(
      JSON.stringify({
        success: true,
        business,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('Business fetch error:', error);
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
