import { Context } from '@devvit/public-api';
import { CloudflareAIService } from './aiService.js';
import { Challenge, UserProfile } from '../types/index.js';

export interface GameNarrative {
  storyArc: string;
  currentChapter: string;
  personalizedPlot: string;
  characterDevelopment: string;
  nextStoryBeats: string[];
  emotionalTone: 'adventurous' | 'mysterious' | 'competitive' | 'social' | 'relaxing';
}

export interface DynamicEvent {
  id: string;
  type: 'flash_mob' | 'mystery_hunt' | 'community_challenge' | 'seasonal_festival' | 'business_spotlight';
  title: string;
  description: string;
  triggerConditions: {
    userCount?: number;
    timeOfDay?: string;
    weather?: string;
    socialMomentum?: number;
  };
  duration: number; // minutes
  rewards: {
    points: number;
    badges: string[];
    exclusiveContent?: string;
  };
  aiGeneratedContent: {
    clues: string[];
    socialPosts: string[];
    partnerIntegrations: string[];
  };
}

export interface SocialDynamics {
  communityMood: 'excited' | 'competitive' | 'collaborative' | 'exploratory';
  trendingTopics: string[];
  viralMoments: Array<{
    content: string;
    engagement: number;
    sentiment: number;
  }>;
  influencerIdentification: Array<{
    userId: string;
    influence: number;
    specialties: string[];
  }>;
  groupFormationSuggestions: Array<{
    users: string[];
    reason: string;
    suggestedActivity: string;
  }>;
}

export interface PredictiveInsights {
  userLifetimeValue: number;
  churnProbability: number;
  nextBestAction: string;
  optimalChallengeTime: Date;
  socialInfluencePotential: number;
  businessValueToPartners: number;
  communityContributionScore: number;
}

export class AIGameIntelligence {
  private context: Context;
  private aiService: CloudflareAIService;

  constructor(context: Context) {
    this.context = context;
    this.aiService = new CloudflareAIService(context);
  }

  /**
   * Generate dynamic, personalized game narratives
   */
  async generatePersonalizedNarrative(
    userId: string,
    userProfile: UserProfile,
    completedChallenges: Challenge[],
    currentLocation?: { lat: number; lng: number }
  ): Promise<GameNarrative> {
    try {
      const prompt = this.buildNarrativePrompt(userId, userProfile, completedChallenges, currentLocation);
      
      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      const result = await response.json();
      return this.parseNarrativeResponse(result, userProfile);
    } catch (error) {
      console.error('Narrative generation failed:', error);
      return this.getDefaultNarrative(userProfile);
    }
  }

  /**
   * Create dynamic events based on real-time conditions
   */
  async createDynamicEvent(
    eventType: string,
    currentConditions: {
      activeUsers: number;
      timeOfDay: string;
      weather?: string;
      socialActivity: number;
      businessPartners: any[];
    }
  ): Promise<DynamicEvent> {
    try {
      const prompt = this.buildEventPrompt(eventType, currentConditions);
      
      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.8,
        }),
      });

      const result = await response.json();
      return this.parseDynamicEventResponse(result, eventType, currentConditions);
    } catch (error) {
      console.error('Dynamic event creation failed:', error);
      return this.getDefaultEvent(eventType);
    }
  }

  /**
   * Analyze community social dynamics in real-time
   */
  async analyzeSocialDynamics(
    recentActivity: any[],
    userInteractions: any[],
    contentEngagement: any[]
  ): Promise<SocialDynamics> {
    try {
      // Analyze community mood
      const communityMood = await this.analyzeCommunityMood(recentActivity);
      
      // Identify trending topics
      const trendingTopics = await this.identifyTrendingTopics(contentEngagement);
      
      // Detect viral moments
      const viralMoments = await this.detectViralMoments(contentEngagement);
      
      // Identify community influencers
      const influencers = await this.identifyInfluencers(userInteractions);
      
      // Suggest group formations
      const groupSuggestions = await this.suggestGroupFormations(userInteractions, recentActivity);

      return {
        communityMood,
        trendingTopics,
        viralMoments,
        influencerIdentification: influencers,
        groupFormationSuggestions: groupSuggestions,
      };
    } catch (error) {
      console.error('Social dynamics analysis failed:', error);
      return {
        communityMood: 'exploratory',
        trendingTopics: [],
        viralMoments: [],
        influencerIdentification: [],
        groupFormationSuggestions: [],
      };
    }
  }

  /**
   * Generate predictive insights for user behavior and business value
   */
  async generatePredictiveInsights(
    userId: string,
    userProfile: UserProfile,
    behaviorHistory: any[],
    socialConnections: any[]
  ): Promise<PredictiveInsights> {
    try {
      const prompt = this.buildPredictivePrompt(userId, userProfile, behaviorHistory, socialConnections);
      
      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 512,
          temperature: 0.3,
        }),
      });

      const result = await response.json();
      return this.parsePredictiveInsights(result, userProfile);
    } catch (error) {
      console.error('Predictive insights generation failed:', error);
      return this.getDefaultPredictiveInsights();
    }
  }

  /**
   * Create AI-powered mystery hunts with evolving clues
   */
  async createMysteryHunt(
    theme: string,
    difficulty: 'easy' | 'medium' | 'hard',
    participantCount: number,
    locationBounds: { north: number; south: number; east: number; west: number }
  ): Promise<{
    huntId: string;
    title: string;
    backstory: string;
    clues: Array<{
      id: string;
      text: string;
      location?: { lat: number; lng: number };
      prerequisite?: string;
      hint?: string;
    }>;
    finalReward: {
      points: number;
      badge: string;
      exclusiveContent: string;
    };
  }> {
    try {
      const prompt = `Create an engaging mystery hunt with theme "${theme}" for ${participantCount} participants.
      
      Requirements:
      - Difficulty: ${difficulty}
      - Create 5-7 interconnected clues
      - Include a compelling backstory
      - Each clue should lead to the next
      - Final reward should be meaningful
      
      Respond with JSON format: {
        "title": "",
        "backstory": "",
        "clues": [{"id": "", "text": "", "hint": ""}],
        "finalReward": {"points": 0, "badge": "", "exclusiveContent": ""}
      }`;

      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      const result = await response.json();
      return this.parseMysteryHuntResponse(result, theme, difficulty);
    } catch (error) {
      console.error('Mystery hunt creation failed:', error);
      return this.getDefaultMysteryHunt(theme, difficulty);
    }
  }

  /**
   * Generate AI-powered social content and viral moments
   */
  async generateViralContent(
    context: {
      trendingTopics: string[];
      communityMood: string;
      recentEvents: any[];
      seasonalContext: string;
    }
  ): Promise<{
    socialPosts: Array<{
      platform: 'reddit' | 'twitter' | 'instagram';
      content: string;
      hashtags: string[];
      expectedEngagement: number;
    }>;
    memes: Array<{
      template: string;
      text: string;
      context: string;
    }>;
    challenges: Array<{
      name: string;
      description: string;
      viralPotential: number;
    }>;
  }> {
    try {
      const prompt = `Generate viral social content for a treasure hunt game community.
      
      Context:
      - Trending topics: ${context.trendingTopics.join(', ')}
      - Community mood: ${context.communityMood}
      - Season: ${context.seasonalContext}
      
      Create engaging content that could go viral and increase community participation.
      
      Respond with JSON format including social posts, meme ideas, and viral challenges.`;

      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.8,
        }),
      });

      const result = await response.json();
      return this.parseViralContentResponse(result);
    } catch (error) {
      console.error('Viral content generation failed:', error);
      return this.getDefaultViralContent();
    }
  }

  /**
   * AI-powered business intelligence for partners
   */
  async generateBusinessIntelligence(
    businessId: string,
    challengePerformance: any[],
    userEngagement: any[],
    competitorData?: any[]
  ): Promise<{
    performanceAnalysis: {
      engagementTrend: 'increasing' | 'stable' | 'decreasing';
      peakHours: string[];
      customerDemographics: any;
      conversionRate: number;
    };
    recommendations: Array<{
      category: 'marketing' | 'operations' | 'customer_experience';
      suggestion: string;
      expectedImpact: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    predictedOutcomes: {
      nextMonthVisits: number;
      revenueImpact: number;
      brandAwareness: number;
    };
  }> {
    try {
      const prompt = this.buildBusinessIntelligencePrompt(businessId, challengePerformance, userEngagement);
      
      const response = await fetch(`${this.aiService['baseUrl']}/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiService['apiKey']}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1024,
          temperature: 0.4,
        }),
      });

      const result = await response.json();
      return this.parseBusinessIntelligenceResponse(result);
    } catch (error) {
      console.error('Business intelligence generation failed:', error);
      return this.getDefaultBusinessIntelligence();
    }
  }

  // Private helper methods

  private buildNarrativePrompt(
    userId: string,
    userProfile: UserProfile,
    completedChallenges: Challenge[],
    currentLocation?: { lat: number; lng: number }
  ): string {
    const challengeTypes = completedChallenges.map(c => c.partnerInfo.category).join(', ');
    const completionRate = userProfile.stats?.completionRate || 0;
    
    return `Create a personalized adventure narrative for a treasure hunt player.
    
    Player Profile:
    - Completed ${completedChallenges.length} challenges
    - Challenge types: ${challengeTypes}
    - Completion rate: ${(completionRate * 100).toFixed(0)}%
    - Current location: ${currentLocation ? 'downtown area' : 'unknown'}
    
    Generate an engaging story arc that makes them feel like the hero of their own adventure.
    Include their past achievements and hint at future possibilities.
    
    Respond with JSON: {
      "storyArc": "",
      "currentChapter": "",
      "personalizedPlot": "",
      "characterDevelopment": "",
      "nextStoryBeats": [],
      "emotionalTone": ""
    }`;
  }

  private buildEventPrompt(eventType: string, currentConditions: any): string {
    return `Create a dynamic ${eventType} event for a treasure hunt game.
    
    Current Conditions:
    - Active users: ${currentConditions.activeUsers}
    - Time: ${currentConditions.timeOfDay}
    - Weather: ${currentConditions.weather || 'unknown'}
    - Social activity level: ${currentConditions.socialActivity}/10
    
    Create an exciting event that takes advantage of these conditions.
    
    Respond with JSON format including title, description, clues, and rewards.`;
  }

  private buildPredictivePrompt(
    userId: string,
    userProfile: UserProfile,
    behaviorHistory: any[],
    socialConnections: any[]
  ): string {
    return `Analyze user behavior and predict future engagement patterns.
    
    User Data:
    - Total points: ${userProfile.stats?.totalPoints || 0}
    - Completion rate: ${userProfile.stats?.completionRate || 0}
    - Social connections: ${socialConnections.length}
    - Recent activity: ${behaviorHistory.length} events
    
    Predict their lifetime value, churn risk, and optimal engagement strategies.
    
    Respond with JSON including predictions and recommendations.`;
  }

  private buildBusinessIntelligencePrompt(
    businessId: string,
    challengePerformance: any[],
    userEngagement: any[]
  ): string {
    const avgEngagement = userEngagement.length > 0 ? 
      userEngagement.reduce((sum, e) => sum + (e.engagement || 0), 0) / userEngagement.length : 0;
    
    return `Analyze business performance in treasure hunt game.
    
    Business Data:
    - Challenge performance: ${challengePerformance.length} challenges
    - Average engagement: ${avgEngagement.toFixed(2)}
    - User interactions: ${userEngagement.length}
    
    Provide actionable business intelligence and recommendations.
    
    Respond with JSON including analysis, recommendations, and predictions.`;
  }

  // Response parsing methods

  private parseNarrativeResponse(result: any, userProfile: UserProfile): GameNarrative {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        storyArc: parsed.storyArc || 'Your treasure hunting journey continues...',
        currentChapter: parsed.currentChapter || 'The Adventure Begins',
        personalizedPlot: parsed.personalizedPlot || 'A new challenge awaits you in the city.',
        characterDevelopment: parsed.characterDevelopment || 'You are becoming a skilled treasure hunter.',
        nextStoryBeats: parsed.nextStoryBeats || ['Explore new locations', 'Meet fellow adventurers'],
        emotionalTone: parsed.emotionalTone || 'adventurous',
      };
    } catch (error) {
      return this.getDefaultNarrative(userProfile);
    }
  }

  private parseDynamicEventResponse(result: any, eventType: string, conditions: any): DynamicEvent {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        id: `event_${Date.now()}`,
        type: eventType as any,
        title: parsed.title || `Dynamic ${eventType} Event`,
        description: parsed.description || 'An exciting community event is happening now!',
        triggerConditions: {
          userCount: conditions.activeUsers,
          timeOfDay: conditions.timeOfDay,
          weather: conditions.weather,
          socialMomentum: conditions.socialActivity,
        },
        duration: parsed.duration || 60,
        rewards: {
          points: parsed.rewards?.points || 50,
          badges: parsed.rewards?.badges || ['Event Participant'],
          exclusiveContent: parsed.rewards?.exclusiveContent,
        },
        aiGeneratedContent: {
          clues: parsed.clues || ['Follow the excitement!'],
          socialPosts: parsed.socialPosts || ['Join the community event!'],
          partnerIntegrations: parsed.partnerIntegrations || [],
        },
      };
    } catch (error) {
      return this.getDefaultEvent(eventType);
    }
  }

  private parsePredictiveInsights(result: any, userProfile: UserProfile): PredictiveInsights {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        userLifetimeValue: parsed.userLifetimeValue || 100,
        churnProbability: parsed.churnProbability || 0.3,
        nextBestAction: parsed.nextBestAction || 'Complete more challenges',
        optimalChallengeTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        socialInfluencePotential: parsed.socialInfluencePotential || 0.5,
        businessValueToPartners: parsed.businessValueToPartners || 75,
        communityContributionScore: parsed.communityContributionScore || 0.6,
      };
    } catch (error) {
      return this.getDefaultPredictiveInsights();
    }
  }

  private parseMysteryHuntResponse(result: any, theme: string, difficulty: string): any {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        huntId: `mystery_${Date.now()}`,
        title: parsed.title || `The ${theme} Mystery`,
        backstory: parsed.backstory || 'A mysterious adventure awaits...',
        clues: parsed.clues || [
          { id: 'clue1', text: 'The adventure begins here...', hint: 'Look for the obvious' }
        ],
        finalReward: {
          points: parsed.finalReward?.points || 100,
          badge: parsed.finalReward?.badge || 'Mystery Solver',
          exclusiveContent: parsed.finalReward?.exclusiveContent || 'Congratulations on solving the mystery!',
        },
      };
    } catch (error) {
      return this.getDefaultMysteryHunt(theme, difficulty);
    }
  }

  private parseViralContentResponse(result: any): any {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        socialPosts: parsed.socialPosts || [
          {
            platform: 'reddit',
            content: 'Amazing treasure hunt happening right now! 🗺️',
            hashtags: ['#TreasureHunt', '#Adventure'],
            expectedEngagement: 0.7,
          }
        ],
        memes: parsed.memes || [
          {
            template: 'Drake pointing',
            text: 'Staying inside / Going on treasure hunts',
            context: 'Encouraging outdoor activity',
          }
        ],
        challenges: parsed.challenges || [
          {
            name: 'Photo Challenge',
            description: 'Share your best treasure hunt photo',
            viralPotential: 0.8,
          }
        ],
      };
    } catch (error) {
      return this.getDefaultViralContent();
    }
  }

  private parseBusinessIntelligenceResponse(result: any): any {
    try {
      const response = result.result?.response || result.response || '';
      const parsed = JSON.parse(response);
      
      return {
        performanceAnalysis: {
          engagementTrend: parsed.performanceAnalysis?.engagementTrend || 'stable',
          peakHours: parsed.performanceAnalysis?.peakHours || ['18:00', '19:00'],
          customerDemographics: parsed.performanceAnalysis?.customerDemographics || {},
          conversionRate: parsed.performanceAnalysis?.conversionRate || 0.15,
        },
        recommendations: parsed.recommendations || [
          {
            category: 'marketing',
            suggestion: 'Increase social media presence',
            expectedImpact: '20% more engagement',
            priority: 'medium',
          }
        ],
        predictedOutcomes: {
          nextMonthVisits: parsed.predictedOutcomes?.nextMonthVisits || 150,
          revenueImpact: parsed.predictedOutcomes?.revenueImpact || 500,
          brandAwareness: parsed.predictedOutcomes?.brandAwareness || 0.7,
        },
      };
    } catch (error) {
      return this.getDefaultBusinessIntelligence();
    }
  }

  // Default fallback methods

  private getDefaultNarrative(userProfile: UserProfile): GameNarrative {
    return {
      storyArc: 'Your treasure hunting adventure is just beginning...',
      currentChapter: 'The Journey Starts',
      personalizedPlot: 'Explore the city and discover hidden treasures.',
      characterDevelopment: 'You are learning the ways of the treasure hunter.',
      nextStoryBeats: ['Visit new locations', 'Complete challenges', 'Meet other adventurers'],
      emotionalTone: 'adventurous',
    };
  }

  private getDefaultEvent(eventType: string): DynamicEvent {
    return {
      id: `default_${Date.now()}`,
      type: eventType as any,
      title: `Community ${eventType}`,
      description: 'Join the community for an exciting event!',
      triggerConditions: {},
      duration: 60,
      rewards: {
        points: 25,
        badges: ['Community Participant'],
      },
      aiGeneratedContent: {
        clues: ['Join the fun!'],
        socialPosts: ['Community event happening now!'],
        partnerIntegrations: [],
      },
    };
  }

  private getDefaultPredictiveInsights(): PredictiveInsights {
    return {
      userLifetimeValue: 100,
      churnProbability: 0.3,
      nextBestAction: 'Complete more challenges',
      optimalChallengeTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      socialInfluencePotential: 0.5,
      businessValueToPartners: 75,
      communityContributionScore: 0.6,
    };
  }

  private getDefaultMysteryHunt(theme: string, difficulty: string): any {
    return {
      huntId: `default_mystery_${Date.now()}`,
      title: `The ${theme} Mystery Hunt`,
      backstory: 'A mysterious adventure awaits in the city...',
      clues: [
        { id: 'clue1', text: 'Begin your search at the heart of downtown', hint: 'Look for the tallest building' },
        { id: 'clue2', text: 'Where coffee meets community', hint: 'A popular gathering place' },
      ],
      finalReward: {
        points: difficulty === 'hard' ? 150 : difficulty === 'medium' ? 100 : 50,
        badge: 'Mystery Solver',
        exclusiveContent: 'You solved the mystery! Well done, detective.',
      },
    };
  }

  private getDefaultViralContent(): any {
    return {
      socialPosts: [
        {
          platform: 'reddit',
          content: 'The treasure hunt community is amazing! Join us for adventure! 🗺️✨',
          hashtags: ['#TreasureHunt', '#Community', '#Adventure'],
          expectedEngagement: 0.6,
        }
      ],
      memes: [
        {
          template: 'Distracted boyfriend',
          text: 'Me / Staying home / Treasure hunting',
          context: 'Choosing adventure over staying inside',
        }
      ],
      challenges: [
        {
          name: 'Best Discovery Challenge',
          description: 'Share your most interesting treasure hunt discovery',
          viralPotential: 0.7,
        }
      ],
    };
  }

  private getDefaultBusinessIntelligence(): any {
    return {
      performanceAnalysis: {
        engagementTrend: 'stable',
        peakHours: ['17:00', '18:00', '19:00'],
        customerDemographics: { age_range: '25-45', interests: ['local_exploration'] },
        conversionRate: 0.12,
      },
      recommendations: [
        {
          category: 'marketing',
          suggestion: 'Create more engaging social content',
          expectedImpact: '15% increase in participation',
          priority: 'medium',
        }
      ],
      predictedOutcomes: {
        nextMonthVisits: 120,
        revenueImpact: 400,
        brandAwareness: 0.65,
      },
    };
  }

  // Social dynamics helper methods

  private async analyzeCommunityMood(recentActivity: any[]): Promise<'excited' | 'competitive' | 'collaborative' | 'exploratory'> {
    // Analyze activity patterns to determine mood
    const competitiveWords = ['win', 'beat', 'first', 'top', 'leader'];
    const collaborativeWords = ['team', 'together', 'help', 'share', 'group'];
    const excitedWords = ['amazing', 'awesome', 'love', 'great', 'fantastic'];
    
    let competitiveScore = 0;
    let collaborativeScore = 0;
    let excitedScore = 0;
    
    for (const activity of recentActivity) {
      const text = (activity.content || '').toLowerCase();
      competitiveScore += competitiveWords.filter(word => text.includes(word)).length;
      collaborativeScore += collaborativeWords.filter(word => text.includes(word)).length;
      excitedScore += excitedWords.filter(word => text.includes(word)).length;
    }
    
    if (excitedScore > competitiveScore && excitedScore > collaborativeScore) return 'excited';
    if (competitiveScore > collaborativeScore) return 'competitive';
    if (collaborativeScore > 0) return 'collaborative';
    return 'exploratory';
  }

  private async identifyTrendingTopics(contentEngagement: any[]): Promise<string[]> {
    // Extract trending topics from high-engagement content
    const topics = new Map<string, number>();
    
    for (const content of contentEngagement) {
      if (content.engagement > 0.7) {
        const words = (content.text || '').toLowerCase().split(' ');
        for (const word of words) {
          if (word.length > 4) {
            topics.set(word, (topics.get(word) || 0) + content.engagement);
          }
        }
      }
    }
    
    return Array.from(topics.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private async detectViralMoments(contentEngagement: any[]): Promise<Array<{ content: string; engagement: number; sentiment: number }>> {
    return contentEngagement
      .filter(content => content.engagement > 0.8)
      .map(content => ({
        content: content.text || 'Viral moment detected',
        engagement: content.engagement,
        sentiment: content.sentiment || 0.7,
      }))
      .slice(0, 3);
  }

  private async identifyInfluencers(userInteractions: any[]): Promise<Array<{ userId: string; influence: number; specialties: string[] }>> {
    const influenceMap = new Map<string, { interactions: number; specialties: Set<string> }>();
    
    for (const interaction of userInteractions) {
      const userId = interaction.userId;
      const current = influenceMap.get(userId) || { interactions: 0, specialties: new Set() };
      current.interactions += interaction.engagement || 1;
      if (interaction.category) current.specialties.add(interaction.category);
      influenceMap.set(userId, current);
    }
    
    return Array.from(influenceMap.entries())
      .map(([userId, data]) => ({
        userId,
        influence: data.interactions / userInteractions.length,
        specialties: Array.from(data.specialties),
      }))
      .sort((a, b) => b.influence - a.influence)
      .slice(0, 5);
  }

  private async suggestGroupFormations(userInteractions: any[], recentActivity: any[]): Promise<Array<{ users: string[]; reason: string; suggestedActivity: string }>> {
    // Simple group formation based on similar interests and activity patterns
    const suggestions: Array<{ users: string[]; reason: string; suggestedActivity: string }> = [];
    
    // Group users with similar activity patterns
    const activeUsers = userInteractions
      .filter(interaction => interaction.timestamp > Date.now() - 24 * 60 * 60 * 1000)
      .map(interaction => interaction.userId);
    
    if (activeUsers.length >= 2) {
      suggestions.push({
        users: activeUsers.slice(0, 3),
        reason: 'Similar activity patterns and timing',
        suggestedActivity: 'Team challenge in downtown area',
      });
    }
    
    return suggestions;
  }
}