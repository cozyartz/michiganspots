/**
 * Clodura API Service
 *
 * Integrates with Clodura API for business data enrichment and discovery.
 *
 * Documentation: https://kb.clodura.ai/api/search_people/search-people/
 *
 * Rate Limits:
 * - 10 requests/second
 * - 100 requests/minute
 * - 2,000 requests/day
 */

export interface CloduraSearchParams {
  company_name?: string;
  company_location?: string;
  company_industry?: string;
  company_size?: string;
  page?: number;
  limit?: number;
}

export interface CloduraCompanyResult {
  company_name: string;
  company_website?: string;
  company_industry?: string;
  company_size?: string;
  company_location?: string;
  company_city?: string;
  company_state?: string;
  company_country?: string;
  company_phone?: string;
  company_description?: string;
  company_founded_year?: string;
  company_revenue?: string;
  company_employees?: string;
  company_social_linkedin?: string;
  company_social_facebook?: string;
  company_social_twitter?: string;
}

export interface CloduraAPIResponse {
  success: boolean;
  data?: CloduraCompanyResult[];
  total_results?: number;
  page?: number;
  error?: string;
  message?: string;
}

export class CloduraAPIService {
  private apiKey: string;
  private baseUrl = 'https://api.clodura.ai/v1';

  // Rate limiting state
  private requestsThisSecond: number = 0;
  private requestsThisMinute: number = 0;
  private requestsToday: number = 0;
  private lastSecondReset: number = Date.now();
  private lastMinuteReset: number = Date.now();
  private lastDayReset: number = Date.now();

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Clodura API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Check and enforce rate limits
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    // Reset counters if time periods have elapsed
    if (now - this.lastSecondReset >= 1000) {
      this.requestsThisSecond = 0;
      this.lastSecondReset = now;
    }

    if (now - this.lastMinuteReset >= 60000) {
      this.requestsThisMinute = 0;
      this.lastMinuteReset = now;
    }

    if (now - this.lastDayReset >= 86400000) {
      this.requestsToday = 0;
      this.lastDayReset = now;
    }

    // Check limits
    if (this.requestsThisSecond >= 10) {
      const waitTime = 1000 - (now - this.lastSecondReset);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkRateLimit();
    }

    if (this.requestsThisMinute >= 100) {
      throw new Error('Rate limit exceeded: 100 requests per minute');
    }

    if (this.requestsToday >= 2000) {
      throw new Error('Rate limit exceeded: 2000 requests per day');
    }

    // Increment counters
    this.requestsThisSecond++;
    this.requestsThisMinute++;
    this.requestsToday++;
  }

  /**
   * Search for companies using Clodura API
   */
  async searchCompanies(params: CloduraSearchParams): Promise<CloduraAPIResponse> {
    try {
      await this.checkRateLimit();

      const queryParams = new URLSearchParams();

      if (params.company_name) queryParams.append('company_name', params.company_name);
      if (params.company_location) queryParams.append('company_location', params.company_location);
      if (params.company_industry) queryParams.append('company_industry', params.company_industry);
      if (params.company_size) queryParams.append('company_size', params.company_size);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(
        `${this.baseUrl}/companies/search?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Clodura API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data.companies || data.results || [],
        total_results: data.total || data.total_results || 0,
        page: data.page || 1,
      };
    } catch (error) {
      console.error('Clodura API search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Enrich a business with Clodura data
   * Searches for the business and returns enriched information
   */
  async enrichBusiness(businessName: string, city?: string): Promise<CloduraAPIResponse> {
    try {
      const searchParams: CloduraSearchParams = {
        company_name: businessName,
        limit: 5, // Get top 5 matches
      };

      if (city) {
        searchParams.company_location = `${city}, Michigan`;
      }

      const results = await this.searchCompanies(searchParams);

      if (!results.success || !results.data || results.data.length === 0) {
        return {
          success: false,
          error: 'No matching business found in Clodura',
        };
      }

      // Return the best match (first result)
      return {
        success: true,
        data: [results.data[0]],
        message: `Found ${results.total_results} matches, returning best match`,
      };
    } catch (error) {
      console.error('Clodura enrichment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Enrichment failed',
      };
    }
  }

  /**
   * Map Clodura company data to our business directory format
   */
  mapToBusinessDirectory(cloduraData: CloduraCompanyResult, category: string = 'Services'): any {
    return {
      business_name: cloduraData.company_name,
      business_category: category,
      city: cloduraData.company_city || cloduraData.company_location?.split(',')[0] || 'Michigan',
      address: cloduraData.company_location || '',
      phone: cloduraData.company_phone || null,
      email: null, // Clodura doesn't typically provide email in company search
      website: cloduraData.company_website || null,
      short_description: cloduraData.company_description || null,
      directory_tier: 'free',
      is_ai_verified: 0,
      is_claimed: 0,
      ai_processing_status: 'pending',
      // Social media fields (table doesn't have these yet, but keeping for reference)
      // Additional metadata from Clodura - store in JSON field when available
      clodura_metadata: JSON.stringify({
        industry: cloduraData.company_industry,
        size: cloduraData.company_size,
        founded: cloduraData.company_founded_year,
        revenue: cloduraData.company_revenue,
        employees: cloduraData.company_employees,
        social_linkedin: cloduraData.company_social_linkedin,
        social_facebook: cloduraData.company_social_facebook,
        social_twitter: cloduraData.company_social_twitter,
        enriched_at: new Date().toISOString(),
      }),
    };
  }

  /**
   * Bulk search for multiple businesses
   * Implements batching to respect rate limits
   */
  async bulkEnrichBusinesses(businesses: Array<{ name: string; city?: string; category?: string }>): Promise<any[]> {
    const enrichedBusinesses: any[] = [];

    for (const business of businesses) {
      try {
        const result = await this.enrichBusiness(business.name, business.city);

        if (result.success && result.data && result.data.length > 0) {
          const mappedBusiness = this.mapToBusinessDirectory(
            result.data[0],
            business.category || 'Services'
          );
          enrichedBusinesses.push(mappedBusiness);
        } else {
          console.log(`No Clodura data found for: ${business.name}`);
        }

        // Small delay between requests to be respectful of rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to enrich ${business.name}:`, error);
      }
    }

    return enrichedBusinesses;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    requestsThisSecond: number;
    requestsThisMinute: number;
    requestsToday: number;
    limits: {
      perSecond: number;
      perMinute: number;
      perDay: number;
    };
  } {
    return {
      requestsThisSecond: this.requestsThisSecond,
      requestsThisMinute: this.requestsThisMinute,
      requestsToday: this.requestsToday,
      limits: {
        perSecond: 10,
        perMinute: 100,
        perDay: 2000,
      },
    };
  }
}

/**
 * Factory function to create Clodura API service
 */
export function createCloduraService(apiKey: string): CloduraAPIService {
  return new CloduraAPIService(apiKey);
}
