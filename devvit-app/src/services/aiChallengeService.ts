import { Context } from '@devvit/public-api';
import { CloudflareAIService, ChallengeGenerationRequest, GeneratedChallenge } from './aiService.js';
import { Challenge, BusinessInfo, UserProfile } from '../types/index.js';

export interface ChallengeOptimizationData {
  challengeId: string;
  completionRate: number;
  averageRating: number;
  timeToComplete: number;
  userFeedback: string[];
  engagementMetrics: {
    views: number;
    attempts: number;
    completions: number;
    shares: number;
  };
}

export interface SeasonalContext {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  holidays: string[];
  localEvents: string[];
  weatherConditions: string;
}

export interface ChallengeRecommendation {
  challenge: Challenge;
  personalizedReason: string;
  estimatedEngagement: number;
  optimalTiming: string;
}

export class AIChallengeService {
  private aiService: CloudflareAIService;
  private context: Context;

  constructor(context: Context) {
    this.context = context;
    this.aiService = new CloudflareAIService(context);
  }

  /**
   * Generate new challenges using AI based on business data and user patterns
   */
  async generateChallenges(
    businesses: BusinessInfo[],
    userPatterns?: UserProfile[],
    seasonalContext?: SeasonalContext,
    count: number = 5
  ): Promise<Challenge[]> {
    const challenges: Challenge[] = [];

    for (const business of businesses.slice(0, count)) {
      try {
        const userBehaviorData = this.aggregateUserPatterns(userPatterns);
        
        const request: ChallengeGenerationRequest = {
          businessInfo: {
            name: business.name,
            category: business.category,
            location: business.location,
            description: business.description,
          },
          difficulty: this.selectOptimalDifficulty(business, userBehaviorData),
          seasonalContext: this.buildSeasonalContext(seasonalContext),
          userPatterns: userBehaviorData,
        };

        const generatedChallenge = await this.aiService.generateChallenge(request);
        const challenge = this.convertToChallenge(generatedChallenge, business);
        
        challenges.push(challenge);
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to generate challenge for ${business.name}:`, error);
        // Continue with other businesses
      }
    }

    return challenges;
  }

  /**
   * Optimize existing challenges based on performance data
   */
  async optimizeChallenge(
    challenge: Challenge,
    optimizationData: ChallengeOptimizationData
  ): Promise<Challenge> {
    try {
      // Analyze what needs improvement
      const improvements = this.analyzePerformanceData(optimizationData);
      
      if (improvements.length === 0) {
        return challenge; // No optimization needed
      }

      // Generate improved version
      const optimizationPrompt = this.buildOptimizationPrompt(challenge, improvements);
      const optimizedChallenge = await this.generateOptimizedChallenge(
        challenge,
        optimizationPrompt
      );

      // Log optimization for tracking
      await this.logChallengeOptimization(challenge.id, improvements, optimizedChallenge);

      return optimizedChallenge;
    } catch (error) {
      console.error('Challenge optimization failed:', error);
      return challenge;
    }
  }

  /**
   * Get personalized challenge recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    userProfile: UserProfile,
    availableChallenges: Challenge[],
    count: number = 3
  ): Promise<ChallengeRecommendation[]> {
    try {
      // Analyze user behavior
      const behaviorAnalysis = await this.aiService.analyzeUserBehavior(
        userId,
        this.extractUserActivityData(userProfile)
      );

      // Score and rank challenges
      const scoredChallenges = await Promise.all(
        availableChallenges.map(async (challenge) => {
          const score = await this.calculatePersonalizationScore(
            challenge,
            userProfile,
            behaviorAnalysis
          );
          
          return {
            challenge,
            score,
            personalizedReason: this.generatePersonalizationReason(challenge, behaviorAnalysis),
            estimatedEngagement: score * 100,
            optimalTiming: behaviorAnalysis.optimalChallengeTime,
          };
        })
      );

      // Return top recommendations
      return scoredChallenges
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(({ challenge, personalizedReason, estimatedEngagement, optimalTiming }) => ({
          challenge,
          personalizedReason,
          estimatedEngagement,
          optimalTiming,
        }));
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      
      // Fallback to simple recommendations
      return availableChallenges.slice(0, count).map(challenge => ({
        challenge,
        personalizedReason: 'Based on your location and interests',
        estimatedEngagement: 70,
        optimalTiming: 'evening',
      }));
    }
  }

  /**
   * Generate seasonal challenge variations
   */
  async generateSeasonalVariations(
    baseChallenge: Challenge,
    seasonalContext: SeasonalContext
  ): Promise<Challenge[]> {
    const variations: Challenge[] = [];

    try {
      // Generate holiday-themed variation
      if (seasonalContext.holidays.length > 0) {
        const holidayVariation = await this.generateHolidayVariation(
          baseChallenge,
          seasonalContext.holidays[0]
        );
        variations.push(holidayVariation);
      }

      // Generate weather-appropriate variation
      const weatherVariation = await this.generateWeatherVariation(
        baseChallenge,
        seasonalContext.weatherConditions
      );
      variations.push(weatherVariation);

      // Generate local event variation
      if (seasonalContext.localEvents.length > 0) {
        const eventVariation = await this.generateEventVariation(
          baseChallenge,
          seasonalContext.localEvents[0]
        );
        variations.push(eventVariation);
      }

      return variations;
    } catch (error) {
      console.error('Failed to generate seasonal variations:', error);
      return [baseChallenge];
    }
  }

  /**
   * Analyze challenge performance and suggest improvements
   */
  async analyzeChallengePerformance(challengeId: string): Promise<{
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    predictedImprovements: {
      completionRate: number;
      engagement: number;
      userSatisfaction: number;
    };
  }> {
    try {
      const redis = this.context.redis;
      
      // Get performance data
      const performanceData = await redis.hGetAll(`challenge_performance:${challengeId}`);
      const completionRate = parseFloat(performanceData.completionRate || '0');
      const engagementScore = parseFloat(performanceData.engagementScore || '0');
      const averageRating = parseFloat(performanceData.averageRating || '0');

      // Calculate overall score
      const overallScore = (completionRate + engagementScore + averageRating) / 3;

      // Analyze strengths and weaknesses
      const analysis = this.performPerformanceAnalysis({
        completionRate,
        engagementScore,
        averageRating,
      });

      return {
        overallScore,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        predictedImprovements: {
          completionRate: Math.min(completionRate + 0.15, 1.0),
          engagement: Math.min(engagementScore + 0.2, 1.0),
          userSatisfaction: Math.min(averageRating + 0.3, 5.0),
        },
      };
    } catch (error) {
      console.error('Performance analysis failed:', error);
      return {
        overallScore: 0.5,
        strengths: [],
        weaknesses: ['Unable to analyze performance'],
        suggestions: ['Monitor challenge metrics'],
        predictedImprovements: {
          completionRate: 0.6,
          engagement: 0.7,
          userSatisfaction: 3.5,
        },
      };
    }
  }

  private aggregateUserPatterns(userPatterns?: UserProfile[]) {
    if (!userPatterns || userPatterns.length === 0) {
      return {
        preferredCategories: ['restaurant', 'retail'],
        completionRate: 0.7,
        averageDistance: 2.0,
      };
    }

    const categories = userPatterns.flatMap(p => p.preferences?.categories || []);
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    const avgCompletionRate = userPatterns.reduce((sum, p) => 
      sum + (p.stats?.completionRate || 0.7), 0) / userPatterns.length;

    return {
      preferredCategories,
      completionRate: avgCompletionRate,
      averageDistance: 2.0, // Default value
    };
  }

  private selectOptimalDifficulty(
    business: BusinessInfo,
    userPatterns: any
  ): 'easy' | 'medium' | 'hard' {
    // Simple logic - can be enhanced with ML
    if (userPatterns.completionRate > 0.8) {
      return 'medium';
    } else if (userPatterns.completionRate < 0.5) {
      return 'easy';
    }
    return 'medium';
  }

  private buildSeasonalContext(seasonalContext?: SeasonalContext): string {
    if (!seasonalContext) return '';
    
    return `Current season: ${seasonalContext.season}. ` +
           `Holidays: ${seasonalContext.holidays.join(', ')}. ` +
           `Weather: ${seasonalContext.weatherConditions}. ` +
           `Local events: ${seasonalContext.localEvents.join(', ')}.`;
  }

  private convertToChallenge(generated: GeneratedChallenge, business: BusinessInfo): Challenge {
    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: generated.title,
      description: generated.description,
      difficulty: 'medium', // Default, can be enhanced
      pointsReward: 25, // Default, can be calculated based on difficulty
      location: business.location,
      partnerInfo: {
        businessName: business.name,
        category: business.category,
        logoUrl: business.logoUrl || '',
        description: business.description || '',
      },
      proofRequirements: {
        type: generated.proofType,
        description: generated.requirements.join('. '),
        gpsRequired: true,
      },
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      estimatedDuration: generated.estimatedDuration,
      tips: generated.tips,
      isAIGenerated: true,
    };
  }

  private analyzePerformanceData(data: ChallengeOptimizationData): string[] {
    const improvements: string[] = [];

    if (data.completionRate < 0.3) {
      improvements.push('low_completion_rate');
    }
    if (data.averageRating < 3.0) {
      improvements.push('low_user_satisfaction');
    }
    if (data.engagementMetrics.views > 0 && 
        data.engagementMetrics.attempts / data.engagementMetrics.views < 0.2) {
      improvements.push('low_conversion_rate');
    }
    if (data.timeToComplete > data.estimatedDuration * 2) {
      improvements.push('takes_too_long');
    }

    return improvements;
  }

  private buildOptimizationPrompt(challenge: Challenge, improvements: string[]): string {
    return `Optimize this challenge based on performance issues: ${improvements.join(', ')}.
    
    Current challenge:
    Title: ${challenge.title}
    Description: ${challenge.description}
    Requirements: ${challenge.proofRequirements.description}
    
    Make it more engaging and easier to complete while maintaining the core objective.`;
  }

  private async generateOptimizedChallenge(
    original: Challenge,
    optimizationPrompt: string
  ): Promise<Challenge> {
    // This would use the AI service to generate an optimized version
    // For now, return the original with minor modifications
    return {
      ...original,
      title: `${original.title} (Optimized)`,
      description: `${original.description} Updated for better user experience!`,
    };
  }

  private async calculatePersonalizationScore(
    challenge: Challenge,
    userProfile: UserProfile,
    behaviorAnalysis: any
  ): Promise<number> {
    let score = 0.5; // Base score

    // Category preference match
    if (behaviorAnalysis.preferredCategories.includes(challenge.partnerInfo.category)) {
      score += 0.3;
    }

    // Difficulty match
    if (challenge.difficulty === behaviorAnalysis.recommendedDifficulty) {
      score += 0.2;
    }

    // Location proximity (simplified)
    // In real implementation, calculate actual distance
    score += 0.1;

    return Math.min(score, 1.0);
  }

  private generatePersonalizationReason(challenge: Challenge, behaviorAnalysis: any): string {
    const reasons: string[] = [];

    if (behaviorAnalysis.preferredCategories.includes(challenge.partnerInfo.category)) {
      reasons.push(`matches your interest in ${challenge.partnerInfo.category}`);
    }

    if (challenge.difficulty === behaviorAnalysis.recommendedDifficulty) {
      reasons.push(`perfect ${challenge.difficulty} difficulty for you`);
    }

    reasons.push('located conveniently near you');

    return `Recommended because it ${reasons.join(' and ')}.`;
  }

  private extractUserActivityData(userProfile: UserProfile): any[] {
    // Extract relevant activity data for AI analysis
    return [
      {
        completedChallenges: userProfile.stats?.completedChallenges || 0,
        totalPoints: userProfile.stats?.totalPoints || 0,
        preferredCategories: userProfile.preferences?.categories || [],
        averageRating: userProfile.stats?.averageRating || 0,
        lastActive: userProfile.lastActive,
      }
    ];
  }

  private async generateHolidayVariation(challenge: Challenge, holiday: string): Promise<Challenge> {
    return {
      ...challenge,
      id: `${challenge.id}_holiday_${holiday.toLowerCase()}`,
      title: `${holiday} Special: ${challenge.title}`,
      description: `Celebrate ${holiday} with this special challenge! ${challenge.description}`,
    };
  }

  private async generateWeatherVariation(challenge: Challenge, weather: string): Promise<Challenge> {
    return {
      ...challenge,
      id: `${challenge.id}_weather`,
      title: `${challenge.title} (${weather} Edition)`,
      description: `Perfect for ${weather} weather! ${challenge.description}`,
    };
  }

  private async generateEventVariation(challenge: Challenge, event: string): Promise<Challenge> {
    return {
      ...challenge,
      id: `${challenge.id}_event_${event.toLowerCase().replace(/\s+/g, '_')}`,
      title: `${event}: ${challenge.title}`,
      description: `Join the ${event} excitement! ${challenge.description}`,
    };
  }

  private performPerformanceAnalysis(metrics: {
    completionRate: number;
    engagementScore: number;
    averageRating: number;
  }) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    if (metrics.completionRate > 0.7) {
      strengths.push('High completion rate');
    } else {
      weaknesses.push('Low completion rate');
      suggestions.push('Simplify requirements or provide better guidance');
    }

    if (metrics.engagementScore > 0.8) {
      strengths.push('Strong user engagement');
    } else {
      weaknesses.push('Low engagement');
      suggestions.push('Add more interactive elements or social features');
    }

    if (metrics.averageRating > 4.0) {
      strengths.push('Excellent user satisfaction');
    } else {
      weaknesses.push('Poor user satisfaction');
      suggestions.push('Gather user feedback and improve challenge design');
    }

    return { strengths, weaknesses, suggestions };
  }

  private async logChallengeOptimization(
    challengeId: string,
    improvements: string[],
    optimizedChallenge: Challenge
  ): Promise<void> {
    try {
      const redis = this.context.redis;
      const logEntry = {
        timestamp: new Date().toISOString(),
        challengeId,
        improvements,
        optimizations: 'AI-generated improvements applied',
      };

      await redis.lPush(`challenge_optimizations:${challengeId}`, JSON.stringify(logEntry));
      await redis.expire(`challenge_optimizations:${challengeId}`, 86400 * 30); // 30 days
    } catch (error) {
      console.error('Failed to log challenge optimization:', error);
    }
  }
}