import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category') || '';
    const city = url.searchParams.get('city') || '';
    const sort = url.searchParams.get('sort') || 'ai_score';

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
          businesses: [],
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const db = runtime.env.DB;

    // Build the SQL query dynamically based on filters
    let sql = `
      SELECT
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
        directory_tier as tier,
        NULL as featured_image_url,
        is_ai_verified as is_verified,
        hours_of_operation as hours,
        ai_processing_status as status,
        created_at
      FROM business_directory
      WHERE ai_processing_status != 'error'
    `;

    const params: any[] = [];

    // Add search query filter (search across multiple fields)
    if (query) {
      sql += ` AND (
        business_name LIKE ? OR
        short_description LIKE ? OR
        ai_description LIKE ? OR
        ai_keywords LIKE ? OR
        business_category LIKE ? OR
        city LIKE ?
      )`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Add category filter
    if (category && category !== 'All Categories') {
      sql += ` AND business_category = ?`;
      params.push(category);
    }

    // Add city filter
    if (city && city !== 'All Cities') {
      sql += ` AND city = ?`;
      params.push(city);
    }

    // Add sorting
    if (sort === 'ai_score') {
      sql += ` ORDER BY quality_score DESC, business_name ASC`;
    } else if (sort === 'name') {
      sql += ` ORDER BY business_name ASC`;
    } else if (sort === 'newest') {
      sql += ` ORDER BY created_at DESC`;
    } else {
      sql += ` ORDER BY quality_score DESC, business_name ASC`;
    }

    // Limit results to 100 for performance
    sql += ` LIMIT 100`;

    const result = await db.prepare(sql).bind(...params).all();

    if (!result.success) {
      throw new Error('Failed to fetch businesses from database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        businesses: result.results || [],
        count: result.results?.length || 0,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        },
      }
    );
  } catch (error) {
    console.error('Directory search error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        businesses: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
