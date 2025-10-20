import { Context } from '@devvit/public-api';
import { AIGameIntelligence } from './aiGameIntelligence.js';
import { AIChallengeService } from './aiChallengeService.js';
import { Challenge } from '../types/index.js';

export interface SubredditConfig {
  name: string;
  displayName: string;
  region: string;
  businessCategories: string[];
  customChallenges: boolean;
  moderationLevel: 'strict' | 'moderate' | 'relaxed';
  aiPersonalization: {
    localContext: string;
    culturalFactors: string[];
    seasonalEvents: string[];
  };
  crossPostingRules: {
    allowInbound: boolean;
    allowOutbound: boolean;
    targetSubreddits: string[];
    adaptationRequired: boolean;
  };
}

export interface CrossPostContent {
  originalSubreddit: string;
  targetSubreddit: string;
  originalChallenge: Challenge;
  adaptedContent: {
    title: string;
    description: string;
    localizations: string[];
  };
  engagementPrediction: number;
}

export class MultiSubredditManager {
  private context: Context;
  private gameIntelligence: AIGameIntelligence;
  private challengeService: AIChallengeService;
  private subredditConfigs: Map<string, SubredditConfig>;

  constructor(context: Context) {
    this.context = context;
    this.gameIntelligence = new AIGameIntelligence(context);
    this.challengeService = new AIChallengeService(context);
    this.subredditConfigs = new Map();
    this.initializeSubredditConfigs();
  }

  /**
   * Initialize configurations for all supported subreddits
   */
  private initializeSubredditConfigs(): void {
    const configs: SubredditConfig[] = [
      {
        name: 'michiganspots',
        displayName: 'Michigan Spots',
        region: 'michigan_statewide',
        businessCategories: ['restaurant', 'retail', 'entertainment', 'services'],
        customChallenges: true,
        moderationLevel: 'moderate',
        aiPersonalization: {
          localContext: 'Michigan state pride, Great Lakes culture, automotive heritage',
          culturalFactors: ['automotive_heritage', 'outdoor_recreation', 'craft_beer', 'great_lakes'],
          seasonalEvents: ['summer_festivals', 'fall_colors', 'winter_sports', 'spring_cleanup'],
        },
        crossPostingRules: {
          allowInbound: true,
          allowOutbound: true,
          targetSubreddits: ['michigan', 'detroit', 'grandrapids', 'annarbor'],
          adaptationRequired: true,
        },
      },
      {
        name: 'michigan',
        displayName: 'Michigan',
        region: 'michigan_statewide',
        businessCategories: ['restaurant', 'retail', 'entertainment', 'tourism'],
        customChallenges: false,
        moderationLevel: 'strict',
        aiPersonalization: {
          localContext: 'Statewide Michigan community, diverse regions and interests',
          culturalFactors: ['state_pride', 'regional_diversity', 'outdoor_culture'],
          seasonalEvents: ['state_fairs', 'tourism_season', 'college_sports'],
        },
        crossPostingRules: {
          allowInbound: true,
          allowOutbound: false,
          targetSubreddits: [],
          adaptationRequired: true,
        },
      },
      {
        name: 'detroit',
        displayName: 'Detroit',
        region: 'detroit_metro',
        businessCategories: ['restaurant', 'retail', 'entertainment', 'automotive', 'arts'],
        customChallenges: true,
        moderationLevel: 'moderate',
        aiPersonalization: {
          localContext: 'Motor City pride, urban renaissance, cultural diversity',
          culturalFactors: ['automotive_history', 'music_heritage', 'sports_culture', 'urban_renewal'],
          seasonalEvents: ['auto_show', 'music_festivals', 'sports_seasons', 'riverfront_events'],
        },
        crossPostingRules: {
          allowInbound: true,
          allowOutbound: true,
          targetSubreddits: ['michigan', 'michiganspots'],
          adaptationRequired: true,
        },
      },
      {
        name: 'grandrapids',
        displayName: 'Grand Rapids',
        region: 'west_michigan',
        businessCategories: ['restaurant', 'retail', 'craft_beer', 'arts'],
        customChallenges: true,
        moderationLevel: 'moderate',
        aiPersonalization: {
          localContext: 'Beer City USA, arts and culture, family-friendly community',
          culturalFactors: ['craft_beer_culture', 'arts_scene', 'family_activities'],
          seasonalEvents: ['beer_festivals', 'artprize', 'farmers_markets'],
        },
        crossPostingRules: {
          allowInbound: true,
          allowOutbound: true,
          targetSubreddits: ['michigan', 'michiganspots', 'westernmichigan'],
          adaptationRequired: true,
        },
      },
    ];

    configs.forEach(config => {
      this.subredditConfigs.set(config.name, config);
    });
  }

  /**
   * Adapt a challenge for a specific subreddit's culture and audience
   */
  async adaptChallengeForSubreddit(
    originalChallenge: Challenge,
    targetSubreddit: string
  ): Promise<Challenge> {
    const config = this.subredditConfigs.get(targetSubreddit);
    if (!config) {
      throw new Error(`No configuration found for subreddit: ${targetSubreddit}`);
    }

    try {
      // Use AI to adapt the challenge for the target subreddit
      const adaptationPrompt = this.buildAdaptationPrompt(originalChallenge, config);
      
      const adaptedContent = await this.gameIntelligence['aiService'].generateChallenge({
        businessInfo: {
          name: originalChallenge.partnerInfo.businessName,
          category: originalChallenge.partnerInfo.category,
          location: originalChallenge.location,
          description: originalChallenge.description,
        },
        difficulty: originalChallenge.difficulty as any,
        seasonalContext: config.aiPersonalization.localContext,
        userPatterns: {
          preferredCategories: config.businessCategories,
          completionRate: 0.7,
          averageDistance: 5.0,
        },
      });

      // Create adapted challenge
      const adaptedChallenge: Challenge = {
        ...originalChallenge,
        id: `${originalChallenge.id}_${targetSubreddit}`,
        title: this.localizeTitle(adaptedContent.title, config),
        description: this.localizeDescription(adaptedContent.description, config),
        partnerInfo: {
          ...originalChallenge.partnerInfo,
          description: this.addLocalContext(originalChallenge.partnerInfo.description || '', config),
        },
        tips: [
          ...originalChallenge.tips || [],
          ...this.generateLocalTips(config),
        ],
        metadata: {
          ...originalChallenge.metadata,
          originalSubreddit: this.getCurrentSubreddit(),
          targetSubreddit,
          adaptationVersion: '1.0',
        },
      };

      return adaptedChallenge;
    } catch (error) {
      console.error('Challenge adaptation failed:', error);
      return originalChallenge; // Return original if adaptation fails
    }
  }

  /**
   * Generate cross-post content for sharing challenges across subreddits
   */
  async generateCrossPostContent(
    challenge: Challenge,
    targetSubreddit: string
  ): Promise<CrossPostContent> {
    const config = this.subredditConfigs.get(targetSubreddit);
    if (!config) {
      throw new Error(`No configuration found for subreddit: ${targetSubreddit}`);
    }

    const adaptedChallenge = await this.adaptChallengeForSubreddit(challenge, targetSubreddit);
    
    // Generate subreddit-appropriate post content
    const postContent = await this.generatePostContent(adaptedChallenge, config);
    
    // Predict engagement for this cross-post
    const engagementPrediction = await this.predictCrossPostEngagement(
      adaptedChallenge,
      config
    );

    return {
      originalSubreddit: this.getCurrentSubreddit(),
      targetSubreddit,
      originalChallenge: challenge,
      adaptedContent: postContent,
      engagementPrediction,
    };
  }

  /**
   * Get optimal subreddits for cross-posting a challenge
   */
  async getOptimalCrossPostTargets(challenge: Challenge): Promise<string[]> {
    const currentSubreddit = this.getCurrentSubreddit();
    const currentConfig = this.subredditConfigs.get(currentSubreddit);
    
    if (!currentConfig || !currentConfig.crossPostingRules.allowOutbound) {
      return [];
    }

    const potentialTargets = currentConfig.crossPostingRules.targetSubreddits;
    const scoredTargets: Array<{ subreddit: string; score: number }> = [];

    for (const target of potentialTargets) {
      const targetConfig = this.subredditConfigs.get(target);
      if (!targetConfig || !targetConfig.crossPostingRules.allowInbound) {
        continue;
      }

      // Calculate relevance score
      const relevanceScore = await this.calculateRelevanceScore(challenge, targetConfig);
      scoredTargets.push({ subreddit: target, score: relevanceScore });
    }

    // Return top 3 most relevant subreddits
    return scoredTargets
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter(target => target.score > 0.6) // Only include high-relevance targets
      .map(target => target.subreddit);
  }

  /**
   * Schedule cross-posts for optimal timing
   */
  async scheduleCrossPost(
    crossPostContent: CrossPostContent,
    schedulingOptions?: {
      immediate?: boolean;
      optimalTiming?: boolean;
      customTime?: Date;
    }
  ): Promise<void> {
    const options = schedulingOptions || { optimalTiming: true };
    
    if (options.immediate) {
      await this.executeCrossPost(crossPostContent);
    } else if (options.customTime) {
      await this.schedulePost(crossPostContent, options.customTime);
    } else {
      // Use AI to determine optimal posting time
      const optimalTime = await this.calculateOptimalPostingTime(
        crossPostContent.targetSubreddit
      );
      await this.schedulePost(crossPostContent, optimalTime);
    }
  }

  /**
   * Monitor cross-post performance and optimize future posts
   */
  async monitorCrossPostPerformance(
    crossPostId: string,
    targetSubreddit: string
  ): Promise<{
    engagement: number;
    sentiment: number;
    recommendations: string[];
  }> {
    try {
      // Get post performance metrics
      const metrics = await this.getCrossPostMetrics(crossPostId);
      
      // Analyze performance
      const analysis = await this.analyzeCrossPostPerformance(metrics, targetSubreddit);
      
      // Store insights for future optimization
      await this.storeCrossPostInsights(targetSubreddit, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Cross-post monitoring failed:', error);
      return {
        engagement: 0,
        sentiment: 0.5,
        recommendations: ['Monitor post performance manually'],
      };
    }
  }

  // Private helper methods

  private buildAdaptationPrompt(challenge: Challenge, config: SubredditConfig): string {
    return `Adapt this challenge for the ${config.displayName} community:

Original Challenge: ${challenge.title}
Description: ${challenge.description}
Business: ${challenge.partnerInfo.businessName} (${challenge.partnerInfo.category})

Target Community Context:
- Subreddit: r/${config.name}
- Local Context: ${config.aiPersonalization.localContext}
- Cultural Factors: ${config.aiPersonalization.culturalFactors.join(', ')}
- Seasonal Events: ${config.aiPersonalization.seasonalEvents.join(', ')}

Adapt the challenge to resonate with this community while maintaining the core objective.
Make it feel native to their culture and interests.`;
  }

  private localizeTitle(title: string, config: SubredditConfig): string {
    // Add local context to title if appropriate
    if (config.name === 'detroit') {
      return title.replace('Michigan', 'Detroit').replace('Spots', 'Motor City Spots');
    } else if (config.name === 'grandrapids') {
      return title.replace('Michigan', 'Grand Rapids').replace('Spots', 'Beer City Spots');
    }
    return title;
  }

  private localizeDescription(description: string, config: SubredditConfig): string {
    // Add local cultural references
    let localized = description;
    
    config.aiPersonalization.culturalFactors.forEach(factor => {
      if (factor === 'automotive_heritage' && !localized.includes('automotive')) {
        localized += ' Perfect for exploring our automotive heritage!';
      } else if (factor === 'craft_beer_culture' && !localized.includes('beer')) {
        localized += ' Great to combine with our amazing craft beer scene!';
      }
    });
    
    return localized;
  }

  private addLocalContext(description: string, config: SubredditConfig): string {
    return `${description} Located in the heart of ${config.displayName}.`;
  }

  private generateLocalTips(config: SubredditConfig): string[] {
    const tips: string[] = [];
    
    if (config.aiPersonalization.culturalFactors.includes('outdoor_recreation')) {
      tips.push('Great for combining with outdoor activities in the area');
    }
    
    if (config.aiPersonalization.culturalFactors.includes('craft_beer_culture')) {
      tips.push('Check out nearby breweries while you\'re in the area');
    }
    
    return tips;
  }

  private async generatePostContent(
    challenge: Challenge,
    config: SubredditConfig
  ): Promise<{ title: string; description: string; localizations: string[] }> {
    const title = `🎯 ${challenge.title} - ${config.displayName} Treasure Hunt`;
    
    const description = `Hey r/${config.name}! 

${challenge.description}

🏆 Challenge Details:
• Business: ${challenge.partnerInfo.businessName}
• Difficulty: ${challenge.difficulty}
• Points: ${challenge.pointsReward}
• Location: ${challenge.location.businessName}

${config.aiPersonalization.localContext}

Join the adventure at r/michiganspots!`;

    const localizations = [
      `Perfect for ${config.displayName} residents`,
      `Celebrating our local ${config.businessCategories.join(' and ')} scene`,
    ];

    return { title, description, localizations };
  }

  private async predictCrossPostEngagement(
    challenge: Challenge,
    config: SubredditConfig
  ): Promise<number> {
    // Simple engagement prediction based on relevance factors
    let score = 0.5; // Base score
    
    // Category relevance
    if (config.businessCategories.includes(challenge.partnerInfo.category)) {
      score += 0.2;
    }
    
    // Local relevance
    if (challenge.location.businessName.toLowerCase().includes(config.region.toLowerCase())) {
      score += 0.2;
    }
    
    // Cultural fit
    const culturalMatch = config.aiPersonalization.culturalFactors.some(factor =>
      challenge.description.toLowerCase().includes(factor.replace('_', ' '))
    );
    if (culturalMatch) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private async calculateRelevanceScore(
    challenge: Challenge,
    config: SubredditConfig
  ): Promise<number> {
    let score = 0;
    
    // Business category match
    if (config.businessCategories.includes(challenge.partnerInfo.category)) {
      score += 0.4;
    }
    
    // Regional relevance
    if (challenge.location.businessName.toLowerCase().includes(config.region.toLowerCase())) {
      score += 0.3;
    }
    
    // Cultural factors
    const culturalMatches = config.aiPersonalization.culturalFactors.filter(factor =>
      challenge.description.toLowerCase().includes(factor.replace('_', ' '))
    ).length;
    score += (culturalMatches / config.aiPersonalization.culturalFactors.length) * 0.3;
    
    return Math.min(score, 1.0);
  }

  private getCurrentSubreddit(): string {
    // In a real implementation, this would get the current subreddit from context
    return 'michiganspots';
  }

  private async calculateOptimalPostingTime(subreddit: string): Promise<Date> {
    // Simple optimal timing - can be enhanced with historical data
    const now = new Date();
    const optimal = new Date(now);
    
    // Post during peak hours (6-9 PM local time)
    optimal.setHours(19, 0, 0, 0);
    
    // If it's already past optimal time today, schedule for tomorrow
    if (optimal <= now) {
      optimal.setDate(optimal.getDate() + 1);
    }
    
    return optimal;
  }

  private async executeCrossPost(crossPostContent: CrossPostContent): Promise<void> {
    // Implementation would create actual Reddit post
    console.log(`Cross-posting to r/${crossPostContent.targetSubreddit}:`, crossPostContent.adaptedContent.title);
  }

  private async schedulePost(crossPostContent: CrossPostContent, scheduledTime: Date): Promise<void> {
    // Implementation would schedule the post
    console.log(`Scheduled cross-post to r/${crossPostContent.targetSubreddit} for:`, scheduledTime);
  }

  private async getCrossPostMetrics(postId: string): Promise<any> {
    // Implementation would fetch actual post metrics
    return {
      upvotes: 0,
      comments: 0,
      engagement: 0,
      sentiment: 0.5,
    };
  }

  private async analyzeCrossPostPerformance(metrics: any, subreddit: string): Promise<any> {
    return {
      engagement: metrics.engagement || 0,
      sentiment: metrics.sentiment || 0.5,
      recommendations: ['Continue monitoring performance'],
    };
  }

  private async storeCrossPostInsights(subreddit: string, analysis: any): Promise<void> {
    // Store insights for future optimization
    const redis = this.context.redis;
    await redis.hSet(`crosspost_insights:${subreddit}`, {
      lastAnalysis: JSON.stringify(analysis),
      timestamp: new Date().toISOString(),
    });
  }
}