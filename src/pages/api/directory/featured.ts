import type { APIRoute} from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const runtime = locals.runtime;
    const db = runtime.env.DB;

    // Get featured businesses (AI-verified, high quality score, premium tiers)
    const featuredBusinesses = await db
      .prepare(
        `SELECT
          bd.id,
          bd.business_name as name,
          bd.business_category as category,
          bd.city,
          bd.short_description,
          bd.ai_quality_score as aiQualityScore,
          bd.ai_highlights as aiHighlights,
          bd.is_ai_verified as isAIVerified,
          bd.phone,
          bd.website,
          bd.directory_tier,
          s.image_url as imageUrl,
          s.rating_average as rating,
          s.rating_count as reviewCount
         FROM business_directory bd
         LEFT JOIN spots s ON bd.spot_id = s.id
         WHERE bd.is_ai_verified = 1
           AND bd.ai_quality_score >= 85
         ORDER BY
           CASE
             WHEN bd.directory_tier = 'pro' THEN 4
             WHEN bd.directory_tier = 'growth' THEN 3
             WHEN bd.directory_tier = 'starter' THEN 2
             ELSE 1
           END DESC,
           bd.ai_quality_score DESC,
           bd.total_views DESC
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

    return new Response(
      JSON.stringify({ businesses }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Featured businesses error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch featured businesses', businesses: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
