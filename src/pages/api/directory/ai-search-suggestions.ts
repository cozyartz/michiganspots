import type { APIRoute } from 'astro';
import { checkRateLimit, detectBot, RATE_LIMITS } from '../../../lib/security/rate-limiter';
import { getSecurityHeaders, getClientIP } from '../../../lib/security/headers';
import { z } from 'zod';

// Validation schema
const searchSuggestionSchema = z.object({
  query: z.string().min(1).max(200),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get client info
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('User-Agent') || '';

    // Bot detection
    const botCheck = detectBot(userAgent, clientIP);
    if (botCheck.isBot) {
      console.warn(`[Security] Bot detected on AI suggestions: ${botCheck.reason} - IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ suggestions: [], insight: null }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Rate limiting - strict for AI suggestions (expensive)
    const rateLimit = await checkRateLimit(clientIP, RATE_LIMITS.SEARCH);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          suggestions: [],
          insight: null,
          error: 'Rate limit exceeded',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = searchSuggestionSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ suggestions: [], insight: null }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      );
    }

    const { query } = validation.data;

    if (query.length < 3) {
      return new Response(
        JSON.stringify({
          suggestions: [],
          insight: null,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=60',
            ...getSecurityHeaders(),
          },
        }
      );
    }

    const runtime = locals.runtime;
    const db = runtime.env.DB;
    const ai = runtime.env.AI;

    if (!db || !ai) {
      return new Response(
        JSON.stringify({ suggestions: [], insight: null }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      );
    }

    // Get AI analysis of the query
    const aiIntent = await analyzeSearchIntent(ai, query);

    // Get matching suggestions from search history and trending searches
    const suggestions = await generateSuggestions(db, query, aiIntent);

    return new Response(
      JSON.stringify({
        suggestions,
        insight: aiIntent,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60',
          ...getSecurityHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('[Error] AI search suggestions error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate suggestions', suggestions: [], insight: null }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
      }
    );
  }
};

async function analyzeSearchIntent(ai: any, query: string) {
  try {
    // Use Cloudflare AI to analyze the search query
    const prompt = `Analyze this business search query and provide a JSON response with the following structure:
{
  "intent": "dining|shopping|services|entertainment|research",
  "location": "extracted city or area in Michigan (or null if not mentioned)",
  "category": "type of business (restaurant, cafe, shop, etc.)",
  "features": ["feature1", "feature2"] (amenities like outdoor seating, parking, wifi, etc.)
}

Query: "${query}"

Provide only the JSON, no additional text.`;

    const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      prompt,
      max_tokens: 200,
    });

    // Parse the AI response
    let aiData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // Fallback to basic extraction
      aiData = {
        intent: extractIntent(query),
        location: extractLocation(query),
        category: extractCategory(query),
        features: extractFeatures(query),
      };
    }

    return aiData;
  } catch (error) {
    console.error('AI intent analysis error:', error);
    // Return basic analysis as fallback
    return {
      intent: extractIntent(query),
      location: extractLocation(query),
      category: extractCategory(query),
      features: extractFeatures(query),
    };
  }
}

async function generateSuggestions(db: any, query: string, aiIntent: any) {
  const suggestions = [];

  // Get recent popular searches (trending)
  try {
    const trendingSearches = await db
      .prepare(
        `SELECT query_text, COUNT(*) as count
         FROM ai_search_queries
         WHERE query_text LIKE ?
           AND created_at > datetime('now', '-7 days')
         GROUP BY query_text
         ORDER BY count DESC
         LIMIT 3`
      )
      .bind(`%${query}%`)
      .all();

    if (trendingSearches.results) {
      for (const search of trendingSearches.results) {
        suggestions.push({
          text: search.query_text,
          type: 'trending',
        });
      }
    }
  } catch (error) {
    console.error('Error fetching trending searches:', error);
  }

  // Add AI-generated suggestions based on intent
  if (aiIntent.category) {
    const categoryVariations = [
      `${aiIntent.category} in ${aiIntent.location || 'Michigan'}`,
      `best ${aiIntent.category} near me`,
      `${aiIntent.category} ${aiIntent.features?.join(' ') || ''}`.trim(),
    ];

    for (const variation of categoryVariations) {
      if (suggestions.length < 6 && variation.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: variation,
          type: 'ai',
        });
      }
    }
  }

  // Add generic suggestions if we don't have enough
  if (suggestions.length < 3) {
    const genericSuggestions = [
      { text: `${query} in Michigan`, type: 'ai' },
      { text: `best ${query}`, type: 'ai' },
      { text: `${query} near me`, type: 'ai' },
    ];

    for (const sug of genericSuggestions) {
      if (suggestions.length < 5) {
        suggestions.push(sug);
      }
    }
  }

  return suggestions.slice(0, 5);
}

// Fallback extraction functions
function extractIntent(query: string): string {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.match(/restaurant|food|eat|dine|lunch|dinner|breakfast/)) return 'dining';
  if (lowerQuery.match(/shop|store|buy|retail|boutique/)) return 'shopping';
  if (lowerQuery.match(/service|repair|fix|clean|legal|accounting/)) return 'services';
  if (lowerQuery.match(/bar|music|theater|museum|entertainment|fun/)) return 'entertainment';
  return 'research';
}

function extractLocation(query: string): string | null {
  const michiganCities = [
    'detroit',
    'grand rapids',
    'ann arbor',
    'lansing',
    'battle creek',
    'kalamazoo',
    'traverse city',
    'marquette',
    'flint',
    'saginaw',
    'holland',
    'muskegon',
  ];

  const lowerQuery = query.toLowerCase();
  for (const city of michiganCities) {
    if (lowerQuery.includes(city)) {
      return city.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
    }
  }

  if (lowerQuery.includes('near me') || lowerQuery.includes('nearby')) {
    return 'Near You';
  }

  return null;
}

function extractCategory(query: string): string | null {
  const categories: Record<string, string[]> = {
    'Coffee Shop': ['coffee', 'cafe', 'espresso', 'latte'],
    Restaurant: ['restaurant', 'diner', 'eatery', 'bistro'],
    Bar: ['bar', 'pub', 'tavern', 'brewery'],
    Shop: ['shop', 'store', 'boutique', 'retail'],
    Gym: ['gym', 'fitness', 'workout', 'yoga'],
    Salon: ['salon', 'hair', 'barber', 'spa'],
  };

  const lowerQuery = query.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
      return category;
    }
  }

  return null;
}

function extractFeatures(query: string): string[] {
  const features: string[] = [];
  const lowerQuery = query.toLowerCase();

  const featureMap: Record<string, string> = {
    outdoor: 'outdoor seating',
    patio: 'outdoor seating',
    wifi: 'free wifi',
    parking: 'parking available',
    'dog friendly': 'pet friendly',
    'pet friendly': 'pet friendly',
    'kid friendly': 'family friendly',
    'family friendly': 'family friendly',
    vegan: 'vegan options',
    gluten: 'gluten-free options',
    delivery: 'delivery available',
  };

  for (const [keyword, feature] of Object.entries(featureMap)) {
    if (lowerQuery.includes(keyword) && !features.includes(feature)) {
      features.push(feature);
    }
  }

  return features;
}
