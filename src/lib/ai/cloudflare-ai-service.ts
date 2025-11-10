/**
 * Cloudflare AI Service for Michigan Spots Business Directory
 * Provides AI-powered business enrichment, search, and insights
 */

export const AI_MODELS = {
  TEXT_GENERATION: '@cf/meta/llama-2-7b-chat-int8',
  TEXT_EMBEDDING: '@cf/baai/bge-base-en-v1.5',
  TEXT_CLASSIFICATION: '@cf/huggingface/distilbert-sst-2-int8',
  SENTIMENT: '@cf/huggingface/distilbert-sst-2-int8',
} as const;

export interface BusinessAIEnrichment {
  description: string;
  keywords: string[];
  category: string;
  categoryConfidence: number;
  highlights: string[];
  faq: Array<{ question: string; answer: string }>;
  sentiment: number;
}

export interface BusinessInsight {
  type: 'trend' | 'opportunity' | 'risk' | 'recommendation' | 'competitive';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionItems: string[];
  confidenceScore: number;
}

export class CloudflareAIService {
  private ai: any;
  private db: any;

  constructor(ai: any, db: any) {
    this.ai = ai;
    this.db = db;
  }

  /**
   * Enrich business data with AI-generated content
   */
  async enrichBusinessData(
    businessName: string,
    rawDescription: string,
    category: string,
    city: string
  ): Promise<BusinessAIEnrichment> {
    try {
      // Generate enhanced description
      const descriptionPrompt = `Write a compelling 2-3 paragraph description for this Michigan business:

Business Name: ${businessName}
Category: ${category}
Location: ${city}, Michigan
Current Description: ${rawDescription || 'No description provided'}

Write an SEO-optimized description that:
1. Highlights what makes this business unique
2. Mentions the location and atmosphere
3. Appeals to both locals and Michigan visitors
4. Uses natural, conversational language

Description:`;

      const descriptionResponse = await this.ai.run(AI_MODELS.TEXT_GENERATION, {
        prompt: descriptionPrompt,
        max_tokens: 300,
      });

      // Extract keywords
      const keywordPrompt = `Extract 10-12 relevant search keywords for this business: ${businessName}, a ${category} in ${city}, Michigan. Focus on what customers would search for. Return as comma-separated list.

Keywords:`;

      const keywordsResponse = await this.ai.run(AI_MODELS.TEXT_GENERATION, {
        prompt: keywordPrompt,
        max_tokens: 100,
      });

      // Generate highlights
      const highlightsPrompt = `List 3-5 key highlights or unique features of ${businessName}, a ${category} in ${city}, Michigan. Format as bullet points.

Highlights:`;

      const highlightsResponse = await this.ai.run(AI_MODELS.TEXT_GENERATION, {
        prompt: highlightsPrompt,
        max_tokens: 150,
      });

      // Generate FAQ
      const faqPrompt = `Generate 5 frequently asked questions and concise answers about ${businessName}, a ${category} in ${city}, Michigan.
Format: Q: [question] A: [answer]

FAQs:`;

      const faqResponse = await this.ai.run(AI_MODELS.TEXT_GENERATION, {
        prompt: faqPrompt,
        max_tokens: 400,
      });

      return {
        description: descriptionResponse.response || rawDescription,
        keywords: this.parseKeywords(keywordsResponse.response),
        category,
        categoryConfidence: 0.85,
        highlights: this.parseHighlights(highlightsResponse.response),
        faq: this.parseFAQ(faqResponse.response),
        sentiment: 0.75,
      };
    } catch (error) {
      console.error('Business enrichment error:', error);
      return {
        description: rawDescription,
        keywords: [businessName, category, city],
        category,
        categoryConfidence: 0.5,
        highlights: [],
        faq: [],
        sentiment: 0.5,
      };
    }
  }

  /**
   * Generate business insights based on data analysis
   */
  async generateBusinessInsights(businessId: number): Promise<BusinessInsight[]> {
    try {
      // Get business data
      const business = await this.db
        .prepare('SELECT * FROM business_directory WHERE id = ?')
        .bind(businessId)
        .first();

      if (!business) return [];

      // Get recent analytics
      const analytics = await this.db
        .prepare(
          `SELECT * FROM directory_partner_analytics
           WHERE business_id = ?
           ORDER BY date DESC
           LIMIT 30`
        )
        .bind(businessId)
        .all();

      const insights: BusinessInsight[] = [];

      // Analyze search visibility trends
      if (analytics.results && analytics.results.length > 0) {
        const recentViews = analytics.results.slice(0, 7).reduce((sum: number, a: any) => sum + (a.profile_views || 0), 0);
        const previousViews = analytics.results.slice(7, 14).reduce((sum: number, a: any) => sum + (a.profile_views || 0), 0);

        if (recentViews > previousViews * 1.2) {
          insights.push({
            type: 'trend',
            title: 'Increasing Visibility',
            description: `Your business is gaining traction! Profile views increased by ${Math.round(((recentViews - previousViews) / previousViews) * 100)}% this week.`,
            priority: 'medium',
            actionItems: [
              'Keep your business information up to date',
              'Consider responding to recent customer inquiries',
              'Share your listing on social media to maintain momentum',
            ],
            confidenceScore: 0.85,
          });
        }
      }

      // Quality score opportunity
      if (business.ai_quality_score < 80) {
        insights.push({
          type: 'opportunity',
          title: 'Improve Quality Score',
          description: `Your AI quality score is ${business.ai_quality_score}/100. Businesses above 85 get 40% more visibility.`,
          priority: 'high',
          actionItems: [
            'Add high-quality photos of your business',
            'Complete all business profile fields',
            'Encourage satisfied customers to leave reviews',
            'Update your hours and amenities',
          ],
          confidenceScore: 0.95,
        });
      }

      // Directory tier recommendation
      if (business.directory_tier === 'free') {
        insights.push({
          type: 'recommendation',
          title: 'Unlock AI-Powered Growth',
          description: 'Upgrade to a paid tier to get AI-generated descriptions, priority search placement, and weekly insights.',
          priority: 'medium',
          actionItems: [
            'Review pricing plans starting at $49/month',
            'Get AI-generated business description',
            'Boost search ranking by 30%',
            'Access weekly performance insights',
          ],
          confidenceScore: 0.9,
        });
      }

      return insights;
    } catch (error) {
      console.error('Insights generation error:', error);
      return [];
    }
  }

  /**
   * Generate vector embedding for business semantic search
   */
  async generateBusinessEmbedding(business: any): Promise<number[]> {
    try {
      // Combine all relevant business text into embedding input
      const embeddingText = [
        business.business_name,
        business.business_category,
        business.sub_categories,
        business.short_description,
        business.ai_description,
        business.ai_keywords,
        business.city,
        business.tags,
        business.amenities
      ]
        .filter(Boolean)
        .join(' ');

      const response = await this.ai.run(AI_MODELS.TEXT_EMBEDDING, {
        text: embeddingText
      });

      // BGE-base-en-v1.5 returns array of shape [1, 768]
      const embedding = response.data?.[0] || response.data || [];

      if (!Array.isArray(embedding) || embedding.length !== 768) {
        throw new Error('Invalid embedding dimensions');
      }

      return embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for search query
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await this.ai.run(AI_MODELS.TEXT_EMBEDDING, {
        text: query
      });

      const embedding = response.data?.[0] || response.data || [];

      if (!Array.isArray(embedding) || embedding.length !== 768) {
        throw new Error('Invalid embedding dimensions');
      }

      return embedding;
    } catch (error) {
      console.error('Query embedding error:', error);
      throw error;
    }
  }

  /**
   * Calculate AI quality score for a business
   */
  async calculateQualityScore(businessId: number): Promise<number> {
    try {
      const business = await this.db
        .prepare('SELECT * FROM business_directory WHERE id = ?')
        .bind(businessId)
        .first();

      if (!business) return 0;

      let score = 0;

      // Completeness (40 points)
      if (business.business_name) score += 5;
      if (business.short_description && business.short_description.length > 50) score += 10;
      if (business.phone) score += 5;
      if (business.website) score += 5;
      if (business.address) score += 5;
      if (business.hours_of_operation) score += 5;
      if (business.amenities) score += 5;

      // Content quality (30 points)
      if (business.ai_description) score += 15;
      if (business.ai_keywords) score += 10;
      if (business.ai_highlights) score += 5;

      // Engagement (20 points)
      const recentViews = business.total_views || 0;
      if (recentViews > 100) score += 10;
      else if (recentViews > 50) score += 7;
      else if (recentViews > 10) score += 4;

      const recentClicks = business.total_clicks || 0;
      if (recentClicks > 50) score += 10;
      else if (recentClicks > 20) score += 7;
      else if (recentClicks > 5) score += 4;

      // Verification (10 points)
      if (business.is_ai_verified) score += 5;
      if (business.is_claimed) score += 5;

      return Math.min(score, 100);
    } catch (error) {
      console.error('Quality score calculation error:', error);
      return 0;
    }
  }

  // Helper methods for parsing AI responses

  private parseKeywords(response: string): string[] {
    if (!response) return [];
    return response
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .slice(0, 12);
  }

  private parseHighlights(response: string): string[] {
    if (!response) return [];
    const lines = response.split('\n').filter((line) => line.trim());
    return lines
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 5);
  }

  private parseFAQ(response: string): Array<{ question: string; answer: string }> {
    if (!response) return [];
    const faqs: Array<{ question: string; answer: string }> = [];
    const lines = response.split('\n');

    let currentQ = '';
    let currentA = '';

    for (const line of lines) {
      if (line.match(/^Q:/i)) {
        if (currentQ && currentA) {
          faqs.push({ question: currentQ, answer: currentA });
        }
        currentQ = line.replace(/^Q:\s*/i, '').trim();
        currentA = '';
      } else if (line.match(/^A:/i)) {
        currentA = line.replace(/^A:\s*/i, '').trim();
      } else if (currentA && line.trim()) {
        currentA += ' ' + line.trim();
      }
    }

    if (currentQ && currentA) {
      faqs.push({ question: currentQ, answer: currentA });
    }

    return faqs.slice(0, 5);
  }
}

/**
 * Cosine similarity for vector comparison
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}
