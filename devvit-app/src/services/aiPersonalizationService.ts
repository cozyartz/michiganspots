import { Context } from '@devvit/public-api';
import { CloudflareAIService } from './aiService.js';
import { Challenge, UserProfile } from '../types/index.js';

export interface PersonalizationInsights {
  userId: string;
  preferredCategories: string[];
  optimalChallengeTime: 'morning' | 'afternoon' | 'evening' | 'night';
  difficultyPreference: 'easy' | 'medium' | 'hard';
  locationRadius: number; // km
  engagementPatterns: {
    mostActiveDay: string;
    averageSessionLength: number;
    preferredProofTypes: string[];
  };
  churnRisk: number; // 0-1 scale
  nextBestActions: string[];
}

export interface NotificationOptimization {
  userId: string;
  optimalTimes: string[]; // ISO time strings
  messagePersonalization: {
    tone: 'casual' | 'enthusiastic' | 'informative';
    contentFocus: 'rewards' | 'social' | 'exploration' | 'achievement';
  };
  frequency: 'high' | 'medium' | 'low';
  channels: ('push' | 'reddit_dm' | 'email')[];
}

export interface UserSegment {
  segmentId: string;
  name: string;
  description: string;
  characteristics: string[];
  userCount: number;
  averageEngagement: number;
  recommendedStrategies: string[];
}

export class AIPersonalizationService {
  private aiService: CloudflareAIService;
  private context: Context;

  constructor(context: Context) {
    this.context = context;
    this.aiService = new CloudflareAIService(context);
  }

  /**
   * Generate comprehensive personalization insights for a user
   */
  async generatePersonalizationInsights(
    userId: string,
    userProfile: UserProfile,
    activityHistory: any[]
  ): Promise<PersonalizationInsights> {
    try {
      // Get AI analysis of user behavior
      const behaviorAnalysis = await this.aiService.analyzeUserBehavior(
        userId,
        activityHistory
      );

      // Analyze engagement patterns
      const engagementPatterns = this.analyzeEngagementPatterns(activityHistory);
      
      // Calculate churn risk
      const churnRisk = await this.calculateChurnRisk(userId, userProfile, activityHistory);
      
      // Generate next best actions
      const nextBestActions = await this.generateNextBestActions(
        userProfile,
        behaviorAnalysis,
        churnRisk
      );

      return {
        userId,
        preferredCategories: behaviorAnalysis.preferredCategories,
        optimalChallengeTime: behaviorAnalysis.optimalChallengeTime as any,
        difficultyPreference: behaviorAnalysis.recommendedDifficulty as any,
        locationRadius: this.calculateOptimalRadius(activityHistory),
        engagementPatterns,
        churnRisk,
        nextBestActions,
      };
    } catch (error) {
      console.error('Failed to generate personalization insights:', error);
      return this.getDefaultInsights(userId);
    }
  }

  /**
   * Optimize notification strategy for a user
   */
  async optimizeNotifications(
    userId: string,
    insights: PersonalizationInsights,
    notificationHistory: any[]
  ): Promise<NotificationOptimization> {
    try {
      // Analyze notification response patterns
      const responsePatterns = this.analyzeNotificationResponses(notificationHistory);
      
      // Determine optimal timing
      const optimalTimes = this.calculateOptimalNotificationTimes(
        insights.optimalChallengeTime,
        insights.engagementPatterns.mostActiveDay,
        responsePatterns
      );

      // Personalize message strategy
      const messagePersonalization = this.determineMessagePersonalization(insights);
      
      // Calculate optimal frequency
      const frequency = this.calculateNotificationFrequency(insights.churnRisk, responsePatterns);

      return {
        userId,
        optimalTimes,
        messagePersonalization,
        frequency,
        channels: this.selectOptimalChannels(insights, responsePatterns),
      };
    } catch (error) {
      console.error('Failed to optimize notifications:', error);
      return this.getDefaultNotificationStrategy(userId);
    }
  }

  /**
   * Segment users based on behavior patterns using AI clustering
   */
  async segmentUsers(userProfiles: UserProfile[]): Promise<UserSegment[]> {
    try {
      // Prepare user data for clustering
      const userData = userProfiles.map(profile => ({
        userId: profile.userId,
        completionRate: profile.stats?.completionRate || 0,
        totalPoints: profile.stats?.totalPoints || 0,
        averageRating: profile.stats?.averageRating || 0,
        preferredCategories: profile.preferences?.categories || [],
        lastActive: profile.lastActive,
        engagementLevel: this.calculateEngagementLevel(profile),
      }));

      // Simple clustering logic (can be enhanced with proper ML clustering)
      const segments = this.performSimpleClustering(userData);
      
      return segments.map(segment => ({
        segmentId: segment.id,
        name: segment.name,
        description: segment.description,
        characteristics: segment.characteristics,
        userCount: segment.users.length,
        averageEngagement: segment.averageEngagement,
        recommendedStrategies: this.generateSegmentStrategies(segment),
      }));
    } catch (error) {
      console.error('User segmentation failed:', error);
      return this.getDefaultSegments();
    }
  }

  /**
   * Generate personalized challenge recommendations with AI reasoning
   */
  async generateSmartRecommendations(
    userId: string,
    insights: PersonalizationInsights,
    availableChallenges: Challenge[],
    count: number = 5
  ): Promise<Array<{
    challenge: Challenge;
    score: number;
    reasoning: string;
    personalizedTitle?: string;
    personalizedDescription?: string;
  }>> {
    try {
      const recommendations = [];

      for (const challenge of availableChallenges) {
        // Calculate personalization score
        const score = this.calculatePersonalizationScore(challenge, insights);
        
        // Generate AI reasoning
        const reasoning = await this.generateRecommendationReasoning(
          challenge,
          insights,
          score
        );

        // Personalize content if score is high enough
        let personalizedTitle, personalizedDescription;
        if (score > 0.7) {
          const personalized = await this.personalizeChallenge(challenge, insights);
          personalizedTitle = personalized.title;
          personalizedDescription = personalized.description;
        }

        recommendations.push({
          challenge,
          score,
          reasoning,
          personalizedTitle,
          personalizedDescription,
        });
      }

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
    } catch (error) {
      console.error('Failed to generate smart recommendations:', error);
      return availableChallenges.slice(0, count).map(challenge => ({
        challenge,
        score: 0.5,
        reasoning: 'Based on general popularity',
      }));
    }
  }

  /**
   * Predict user lifetime value and engagement trajectory
   */
  async predictUserTrajectory(
    userId: string,
    userProfile: UserProfile,
    insights: PersonalizationInsights
  ): Promise<{
    predictedLTV: number;
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
    retentionProbability: number;
    recommendedInterventions: string[];
    timeToChurn?: number; // days
  }> {
    try {
      // Simple predictive model (can be enhanced with proper ML)
      const currentEngagement = this.calculateEngagementLevel(userProfile);
      const retentionProbability = Math.max(0, 1 - insights.churnRisk);
      
      // Predict LTV based on current patterns
      const predictedLTV = this.calculatePredictedLTV(userProfile, insights);
      
      // Determine engagement trend
      const engagementTrend = this.determineEngagementTrend(insights);
      
      // Generate intervention recommendations
      const recommendedInterventions = this.generateInterventionRecommendations(
        insights,
        engagementTrend
      );

      return {
        predictedLTV,
        engagementTrend,
        retentionProbability,
        recommendedInterventions,
        timeToChurn: insights.churnRisk > 0.7 ? Math.round(30 * (1 - insights.churnRisk)) : undefined,
      };
    } catch (error) {
      console.error('Failed to predict user trajectory:', error);
      return {
        predictedLTV: 100,
        engagementTrend: 'stable',
        retentionProbability: 0.7,
        recommendedInterventions: ['Monitor user engagement'],
      };
    }
  }

  /**
   * A/B test personalization strategies
   */
  async runPersonalizationExperiment(
    experimentName: string,
    userIds: string[],
    strategies: Array<{
      name: string;
      config: any;
    }>
  ): Promise<{
    experimentId: string;
    assignments: Record<string, string>;
    expectedDuration: number;
    successMetrics: string[];
  }> {
    const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Randomly assign users to strategies
    const assignments: Record<string, string> = {};
    userIds.forEach((userId, index) => {
      const strategyIndex = index % strategies.length;
      assignments[userId] = strategies[strategyIndex].name;
    });

    // Store experiment configuration
    await this.storeExperimentConfig(experimentId, {
      name: experimentName,
      strategies,
      assignments,
      startDate: new Date(),
    });

    return {
      experimentId,
      assignments,
      expectedDuration: 14, // days
      successMetrics: ['engagement_rate', 'completion_rate', 'retention_rate'],
    };
  }

  private analyzeEngagementPatterns(activityHistory: any[]) {
    // Analyze user activity patterns
    const dayActivity = activityHistory.reduce((acc, activity) => {
      const day = new Date(activity.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveDay = Object.entries(dayActivity)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';

    const proofTypes = activityHistory
      .filter(a => a.proofType)
      .map(a => a.proofType);
    
    const proofTypeCount = proofTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredProofTypes = Object.entries(proofTypeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([type]) => type);

    return {
      mostActiveDay,
      averageSessionLength: 15, // minutes, simplified
      preferredProofTypes,
    };
  }

  private async calculateChurnRisk(
    userId: string,
    userProfile: UserProfile,
    activityHistory: any[]
  ): Promise<number> {
    // Simple churn risk calculation
    const daysSinceLastActivity = userProfile.lastActive ? 
      (Date.now() - new Date(userProfile.lastActive).getTime()) / (1000 * 60 * 60 * 24) : 30;
    
    const completionRate = userProfile.stats?.completionRate || 0;
    const engagementLevel = this.calculateEngagementLevel(userProfile);

    // Higher risk if inactive, low completion rate, or low engagement
    let risk = 0;
    if (daysSinceLastActivity > 7) risk += 0.3;
    if (daysSinceLastActivity > 14) risk += 0.3;
    if (completionRate < 0.3) risk += 0.2;
    if (engagementLevel < 0.4) risk += 0.2;

    return Math.min(risk, 1.0);
  }

  private async generateNextBestActions(
    userProfile: UserProfile,
    behaviorAnalysis: any,
    churnRisk: number
  ): Promise<string[]> {
    const actions: string[] = [];

    if (churnRisk > 0.7) {
      actions.push('Send re-engagement campaign');
      actions.push('Offer bonus points challenge');
    }

    if ((userProfile.stats?.completionRate || 0) < 0.5) {
      actions.push('Recommend easier challenges');
      actions.push('Provide tutorial content');
    }

    if (behaviorAnalysis.preferredCategories.length > 0) {
      actions.push(`Focus on ${behaviorAnalysis.preferredCategories[0]} challenges`);
    }

    actions.push('Invite to join community events');

    return actions;
  }

  private calculateOptimalRadius(activityHistory: any[]): number {
    // Analyze user's travel patterns to determine optimal challenge radius
    const distances = activityHistory
      .filter(a => a.distance)
      .map(a => a.distance);
    
    if (distances.length === 0) return 5.0; // Default 5km

    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    return Math.min(Math.max(avgDistance * 1.5, 2.0), 10.0); // Between 2-10km
  }

  private analyzeNotificationResponses(notificationHistory: any[]) {
    return {
      openRate: 0.3, // Simplified
      clickRate: 0.15,
      bestPerformingTime: 'evening',
      preferredChannel: 'push',
    };
  }

  private calculateOptimalNotificationTimes(
    optimalChallengeTime: string,
    mostActiveDay: string,
    responsePatterns: any
  ): string[] {
    // Generate optimal notification times based on user patterns
    const baseHours = {
      morning: ['09:00', '10:30'],
      afternoon: ['14:00', '15:30'],
      evening: ['18:00', '19:30'],
      night: ['21:00', '22:00'],
    };

    return baseHours[optimalChallengeTime as keyof typeof baseHours] || baseHours.evening;
  }

  private determineMessagePersonalization(insights: PersonalizationInsights) {
    // Determine message tone and focus based on user characteristics
    let tone: 'casual' | 'enthusiastic' | 'informative' = 'casual';
    let contentFocus: 'rewards' | 'social' | 'exploration' | 'achievement' = 'exploration';

    if (insights.churnRisk > 0.5) {
      tone = 'enthusiastic';
      contentFocus = 'rewards';
    } else if (insights.engagementPatterns.averageSessionLength > 20) {
      contentFocus = 'achievement';
    }

    return { tone, contentFocus };
  }

  private calculateNotificationFrequency(
    churnRisk: number,
    responsePatterns: any
  ): 'high' | 'medium' | 'low' {
    if (churnRisk > 0.7) return 'high';
    if (responsePatterns.openRate > 0.4) return 'medium';
    return 'low';
  }

  private selectOptimalChannels(
    insights: PersonalizationInsights,
    responsePatterns: any
  ): ('push' | 'reddit_dm' | 'email')[] {
    const channels: ('push' | 'reddit_dm' | 'email')[] = ['push'];
    
    if (insights.engagementPatterns.averageSessionLength > 15) {
      channels.push('reddit_dm');
    }
    
    if (insights.churnRisk > 0.5) {
      channels.push('email');
    }

    return channels;
  }

  private calculateEngagementLevel(userProfile: UserProfile): number {
    const stats = userProfile.stats;
    if (!stats) return 0.3;

    const factors = [
      stats.completionRate || 0,
      Math.min((stats.totalPoints || 0) / 1000, 1), // Normalize points
      (stats.averageRating || 0) / 5, // Normalize rating
    ];

    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private performSimpleClustering(userData: any[]) {
    // Simple clustering based on engagement and activity patterns
    const highEngagement = userData.filter(u => u.engagementLevel > 0.7);
    const mediumEngagement = userData.filter(u => u.engagementLevel > 0.4 && u.engagementLevel <= 0.7);
    const lowEngagement = userData.filter(u => u.engagementLevel <= 0.4);

    return [
      {
        id: 'high_engagement',
        name: 'Power Users',
        description: 'Highly engaged users who complete challenges regularly',
        characteristics: ['High completion rate', 'Active participation', 'High ratings'],
        users: highEngagement,
        averageEngagement: 0.8,
      },
      {
        id: 'medium_engagement',
        name: 'Regular Users',
        description: 'Moderately engaged users with room for growth',
        characteristics: ['Moderate completion rate', 'Occasional participation'],
        users: mediumEngagement,
        averageEngagement: 0.55,
      },
      {
        id: 'low_engagement',
        name: 'At-Risk Users',
        description: 'Users with low engagement who may churn',
        characteristics: ['Low completion rate', 'Infrequent activity', 'High churn risk'],
        users: lowEngagement,
        averageEngagement: 0.25,
      },
    ];
  }

  private generateSegmentStrategies(segment: any): string[] {
    const strategies: Record<string, string[]> = {
      high_engagement: [
        'Offer exclusive challenges',
        'Create community leadership opportunities',
        'Provide advanced difficulty options',
      ],
      medium_engagement: [
        'Send personalized recommendations',
        'Offer achievement milestones',
        'Encourage social sharing',
      ],
      low_engagement: [
        'Send re-engagement campaigns',
        'Offer easier entry challenges',
        'Provide tutorial content',
      ],
    };

    return strategies[segment.id] || ['Monitor user behavior'];
  }

  private calculatePersonalizationScore(challenge: Challenge, insights: PersonalizationInsights): number {
    let score = 0.5; // Base score

    // Category preference
    if (insights.preferredCategories.includes(challenge.partnerInfo.category)) {
      score += 0.3;
    }

    // Difficulty preference
    if (challenge.difficulty === insights.difficultyPreference) {
      score += 0.2;
    }

    // Proof type preference
    if (insights.engagementPatterns.preferredProofTypes.includes(challenge.proofRequirements.type)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private async generateRecommendationReasoning(
    challenge: Challenge,
    insights: PersonalizationInsights,
    score: number
  ): Promise<string> {
    const reasons: string[] = [];

    if (insights.preferredCategories.includes(challenge.partnerInfo.category)) {
      reasons.push(`matches your interest in ${challenge.partnerInfo.category}`);
    }

    if (challenge.difficulty === insights.difficultyPreference) {
      reasons.push(`perfect ${challenge.difficulty} difficulty level`);
    }

    if (score > 0.8) {
      reasons.push('highly recommended based on your activity patterns');
    }

    return reasons.length > 0 ? 
      `Recommended because it ${reasons.join(' and ')}.` :
      'Suggested based on your location and general preferences.';
  }

  private async personalizeChallenge(challenge: Challenge, insights: PersonalizationInsights) {
    // Simple personalization - can be enhanced with AI
    return {
      title: `${challenge.title} (Perfect for You!)`,
      description: `${challenge.description} This challenge matches your preferences for ${insights.preferredCategories[0]} experiences.`,
    };
  }

  private calculatePredictedLTV(userProfile: UserProfile, insights: PersonalizationInsights): number {
    const baseValue = 50; // Base LTV
    const engagementMultiplier = this.calculateEngagementLevel(userProfile) * 2;
    const retentionMultiplier = (1 - insights.churnRisk) * 1.5;
    
    return Math.round(baseValue * engagementMultiplier * retentionMultiplier);
  }

  private determineEngagementTrend(insights: PersonalizationInsights): 'increasing' | 'stable' | 'decreasing' {
    if (insights.churnRisk > 0.6) return 'decreasing';
    if (insights.churnRisk < 0.3) return 'increasing';
    return 'stable';
  }

  private generateInterventionRecommendations(
    insights: PersonalizationInsights,
    trend: 'increasing' | 'stable' | 'decreasing'
  ): string[] {
    const interventions: string[] = [];

    if (trend === 'decreasing') {
      interventions.push('Send personalized re-engagement campaign');
      interventions.push('Offer bonus rewards');
      interventions.push('Provide easier challenge options');
    } else if (trend === 'stable') {
      interventions.push('Introduce new challenge types');
      interventions.push('Encourage social features');
    } else {
      interventions.push('Offer advanced challenges');
      interventions.push('Invite to beta features');
    }

    return interventions;
  }

  private async storeExperimentConfig(experimentId: string, config: any): Promise<void> {
    try {
      const redis = this.context.redis;
      await redis.set(`experiment:${experimentId}`, JSON.stringify(config));
      await redis.expire(`experiment:${experimentId}`, 86400 * 30); // 30 days
    } catch (error) {
      console.error('Failed to store experiment config:', error);
    }
  }

  private getDefaultInsights(userId: string): PersonalizationInsights {
    return {
      userId,
      preferredCategories: ['restaurant', 'retail'],
      optimalChallengeTime: 'evening',
      difficultyPreference: 'medium',
      locationRadius: 5.0,
      engagementPatterns: {
        mostActiveDay: 'Saturday',
        averageSessionLength: 15,
        preferredProofTypes: ['photo'],
      },
      churnRisk: 0.3,
      nextBestActions: ['Complete your first challenge'],
    };
  }

  private getDefaultNotificationStrategy(userId: string): NotificationOptimization {
    return {
      userId,
      optimalTimes: ['18:00', '19:30'],
      messagePersonalization: {
        tone: 'casual',
        contentFocus: 'exploration',
      },
      frequency: 'medium',
      channels: ['push'],
    };
  }

  private getDefaultSegments(): UserSegment[] {
    return [
      {
        segmentId: 'new_users',
        name: 'New Users',
        description: 'Recently joined users',
        characteristics: ['New to platform', 'Learning features'],
        userCount: 0,
        averageEngagement: 0.4,
        recommendedStrategies: ['Onboarding campaigns', 'Tutorial content'],
      },
    ];
  }
}