import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
      };
    };

    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          error: 'Database not available',
          cities: []
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const db = runtime.env.DB;

    // Get distinct cities with business counts
    const result = await db
      .prepare(
        `SELECT
          city,
          COUNT(*) as count
        FROM business_directory
        WHERE ai_processing_status = 'completed'
        GROUP BY city
        ORDER BY count DESC, city ASC`
      )
      .all();

    if (!result.success) {
      throw new Error('Failed to fetch cities');
    }

    const cities = result.results || [];

    return new Response(
      JSON.stringify({
        cities,
        count: cities.length
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );
  } catch (error) {
    console.error('Cities API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch cities',
        cities: []
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
