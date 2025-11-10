import type { APIRoute} from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime;

    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({
          error: 'Database not available',
          businesses: []
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const db = runtime.env.DB;

    // Get featured businesses (prioritize AI-verified, high quality score, premium tiers)
    const featuredBusinesses = await db
      .prepare(
        `SELECT
          id,
          business_name as name,
          business_category as category,
          city,
          short_description,
          quality_score as aiQualityScore,
          ai_highlights as aiHighlights,
          is_ai_verified as isAIVerified,
          phone,
          website,
          directory_tier
         FROM business_directory
         ORDER BY
           CASE
             WHEN directory_tier = 'pro' THEN 4
             WHEN directory_tier = 'growth' THEN 3
             WHEN directory_tier = 'starter' THEN 2
             ELSE 1
           END DESC,
           is_ai_verified DESC,
           quality_score DESC,
           total_views DESC
         LIMIT 12`
      )
      .all();

    const businesses = (featuredBusinesses.results || []).map((biz: any) => ({
      id: biz.id,
      name: biz.name,
      category: biz.category,
      city: biz.city,
      rating: biz.rating || 4.5,
      reviewCount: biz.reviewCount || 0,
      aiQualityScore: biz.aiQualityScore || 0,
      aiHighlights: biz.aiHighlights ? JSON.parse(biz.aiHighlights) : [],
      imageUrl: biz.imageUrl || 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400',
      isAIVerified: biz.isAIVerified === 1,
      phone: biz.phone,
      website: biz.website,
    }));

    // Return empty array if no businesses found (this is normal when starting out)
    return new Response(
      JSON.stringify({ businesses }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Featured businesses error:', error);
    // Return empty array instead of error to allow frontend fallback
    return new Response(
      JSON.stringify({ businesses: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
