import { Context } from '@devvit/public-api';

export interface AIValidationResult {
  isValid: boolean;
  confidence: number;
  reason?: string;
  detectedElements?: string[];
  suggestedAction?: 'approve' | 'reject' | 'manual_review';
}

export interface PhotoValidationRequest {
  imageUrl: string;
  expectedBusiness?: string;
  expectedLocation?: {
    lat: number;
    lng: number;
  };
  validationType: 'business_signage' | 'receipt' | 'location_proof';
}

export interface ChallengeGenerationRequest {
  businessInfo: {
    name: string;
    category: string;
    location: { lat: number; lng: number };
    description?: string;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  seasonalContext?: string;
  userPatterns?: {
    preferredCategories: string[];
    completionRate: number;
    averageDistance: number;
  };
}

export interface GeneratedChallenge {
  title: string;
  description: string;
  requirements: string[];
  proofType: 'photo' | 'receipt' | 'gps_checkin' | 'location_question';
  estimatedDuration: number;
  tips?: string[];
}

export class CloudflareAIService {
  private apiKey: string;
  private baseUrl: string;
  private accountId: string;

  constructor(context: Context) {
    this.apiKey = context.settings.get('CLOUDFLARE_AI_API_KEY') || '';
    this.accountId = context.settings.get('CLOUDFLARE_ACCOUNT_ID') || '';
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run`;
  }

  /**
   * Validate photo submissions using Cloudflare Workers AI vision models
   */
  async validatePhoto(request: PhotoValidationRequest): Promise<AIValidationResult> {
    try {
      const prompt = this.buildValidationPrompt(request);
      
      const response = await fetch(`${this.baseUrl}/@cf/llava-hf/llava-1.5-7b-hf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: await this.fetchImageAsBase64(request.imageUrl),
          prompt,
          max_tokens: 512,
        }),
      });

      const result = await response.json();
      return this.parseValidationResponse(result, request.validationType);
    } catch (error) {
      console.error('AI photo validation failed:', error);
      return {
        isValid: false,
        confidence: 0,
        reason: 'AI validation service unavailable',
        suggestedAction: 'manual_review',
      };
    }
  }

  /**
   * Generate contextual challenges using AI
   */
  async generateChallenge(request: ChallengeGenerationRequest): Promise<GeneratedChallenge> {
    try {
      const prompt = this.buildChallengePrompt(request);
      
      const response = await fetch(`${this.baseUrl}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      const result = await response.json();
      return this.parseChallengeResponse(result, request);
    } catch (error) {
      console.error('AI challenge generation failed:', error);
      return this.getFallbackChallenge(request);
    }
  }

  /**
   * Analyze user behavior patterns for personalization
   */
  async analyzeUserBehavior(userId: string, activityData: any[]): Promise<{
    preferredCategories: string[];
    optimalChallengeTime: string;
    churnRisk: number;
    recommendedDifficulty: string;
  }> {
    try {
      const prompt = this.buildBehaviorAnalysisPrompt(activityData);
      
      const response = await fetch(`${this.baseUrl}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 512,
          temperature: 0.3,
        }),
      });

      const result = await response.json();
      return this.parseBehaviorAnalysis(result);
    } catch (error) {
      console.error('AI behavior analysis failed:', error);
      return {
        preferredCategories: ['restaurant', 'retail'],
        optimalChallengeTime: 'evening',
        churnRisk: 0.3,
        recommendedDifficulty: 'medium',
      };
    }
  }

  private buildValidationPrompt(request: PhotoValidationRequest): string {
    const basePrompt = "Analyze this image and determine if it meets the requirements. Respond with a JSON object containing 'valid' (boolean), 'confidence' (0-1), 'elements' (array of detected items), and 'reason' (string).";
    
    switch (request.validationType) {
      case 'business_signage':
        return `${basePrompt} Check if this image shows clear business signage for "${request.expectedBusiness}". Look for store signs, logos, or clear business identification.`;
      
      case 'receipt':
        return `${basePrompt} Verify this is a valid receipt from "${request.expectedBusiness}". Check for business name, date, items, and total amount.`;
      
      case 'location_proof':
        return `${basePrompt} Confirm this image was taken at the specified business location. Look for distinctive architectural features, signage, or location markers.`;
      
      default:
        return basePrompt;
    }
  }

  private buildChallengePrompt(request: ChallengeGenerationRequest): string {
    return `Generate a treasure hunt challenge for ${request.businessInfo.name}, a ${request.businessInfo.category} business. 
    
    Requirements:
    - Difficulty: ${request.difficulty}
    - Business: ${request.businessInfo.name}
    - Category: ${request.businessInfo.category}
    ${request.seasonalContext ? `- Seasonal context: ${request.seasonalContext}` : ''}
    
    Create an engaging challenge that encourages customers to visit and interact with the business. Include:
    1. A catchy title
    2. Clear description of what to do
    3. Specific requirements for completion
    4. Type of proof needed
    5. Helpful tips
    
    Respond with JSON format: {"title": "", "description": "", "requirements": [], "proofType": "", "estimatedDuration": 0, "tips": []}`;
  }

  private buildBehaviorAnalysisPrompt(activityData: any[]): string {
    const dataStr = JSON.stringify(activityData.slice(0, 50)); // Limit data size
    
    return `Analyze this user activity data and provide insights: ${dataStr}
    
    Determine:
    1. Top 3 preferred business categories
    2. Optimal time for challenges (morning/afternoon/evening)
    3. Churn risk (0-1 scale)
    4. Recommended difficulty level
    
    Respond with JSON: {"preferredCategories": [], "optimalChallengeTime": "", "churnRisk": 0, "recommendedDifficulty": ""}`;
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      return base64;
    } catch (error) {
      throw new Error(`Failed to fetch image: ${error}`);
    }
  }

  private parseValidationResponse(result: any, validationType: string): AIValidationResult {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        isValid: parsed.valid || false,
        confidence: parsed.confidence || 0,
        reason: parsed.reason || 'AI analysis completed',
        detectedElements: parsed.elements || [],
        suggestedAction: parsed.valid && parsed.confidence > 0.8 ? 'approve' : 
                        parsed.confidence < 0.3 ? 'reject' : 'manual_review',
      };
    } catch (error) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'Failed to parse AI response',
        suggestedAction: 'manual_review',
      };
    }
  }

  private parseChallengeResponse(result: any, request: ChallengeGenerationRequest): GeneratedChallenge {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        title: parsed.title || `Visit ${request.businessInfo.name}`,
        description: parsed.description || `Complete a challenge at ${request.businessInfo.name}`,
        requirements: parsed.requirements || ['Visit the business', 'Take a photo'],
        proofType: parsed.proofType || 'photo',
        estimatedDuration: parsed.estimatedDuration || 15,
        tips: parsed.tips || [],
      };
    } catch (error) {
      return this.getFallbackChallenge(request);
    }
  }

  private parseBehaviorAnalysis(result: any) {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        preferredCategories: parsed.preferredCategories || ['restaurant', 'retail'],
        optimalChallengeTime: parsed.optimalChallengeTime || 'evening',
        churnRisk: parsed.churnRisk || 0.3,
        recommendedDifficulty: parsed.recommendedDifficulty || 'medium',
      };
    } catch (error) {
      return {
        preferredCategories: ['restaurant', 'retail'],
        optimalChallengeTime: 'evening',
        churnRisk: 0.3,
        recommendedDifficulty: 'medium',
      };
    }
  }

  private getFallbackChallenge(request: ChallengeGenerationRequest): GeneratedChallenge {
    const templates = {
      restaurant: {
        title: `Taste Test at ${request.businessInfo.name}`,
        description: `Visit ${request.businessInfo.name} and try their signature dish!`,
        requirements: ['Order any menu item', 'Take a photo of your meal', 'Share your experience'],
        proofType: 'photo' as const,
      },
      retail: {
        title: `Shopping Adventure at ${request.businessInfo.name}`,
        description: `Explore ${request.businessInfo.name} and discover something new!`,
        requirements: ['Browse the store', 'Find an interesting product', 'Take a photo with store signage'],
        proofType: 'photo' as const,
      },
      default: {
        title: `Explore ${request.businessInfo.name}`,
        description: `Visit ${request.businessInfo.name} and complete this challenge!`,
        requirements: ['Visit the business', 'Take a photo at the location'],
        proofType: 'photo' as const,
      },
    };

    const template = templates[request.businessInfo.category as keyof typeof templates] || templates.default;
    
    return {
      ...template,
      estimatedDuration: request.difficulty === 'easy' ? 10 : request.difficulty === 'medium' ? 20 : 30,
      tips: ['Check business hours before visiting', 'Be respectful of other customers'],
    };
  }
}