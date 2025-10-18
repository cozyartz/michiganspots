import { Context } from '@devvit/public-api';
import { CloudflareAIService } from './aiService.js';
import { AIValidationService } from './aiValidationService.js';
import { AIChallengeService } from './aiChallengeService.js';
import { AIPersonalizationService } from './aiPersonalizationService.js';
import { AIExperimentService } from './aiExperimentService.js';
import { AIExperimentDashboard } from './aiExperimentDashboard.js';
import { Challenge, UserProfile, Submission, BusinessInfo } from '../types/index.js';

export interface AutomationConfig {
  enableAutoValidation: boolean;
  enableChallengeGeneration: boolean;
  enablePersonalization: boolean;
  enableNotificationOptimization: boolean;
  validationThresholds: {
    autoApprove: number;
    autoReject: number;
  };
  challengeGeneration: {
    frequency: 'daily' | 'weekly' | 'monthly';
    maxPerBusiness: number;
    seasonalAdjustment: boolean;
  };
  personalization: {
    updateFrequency: 'realtime' | 'hourly' | 'daily';
    segmentationEnabled: boolean;
  };
}

export interface AutomationMetrics {
  validationStats: {
    totalProcessed: number;
    autoApproved: number;
    autoRejected: number;
    manualReviews: number;
    accuracy: number;
  };
  challengeGeneration: {
    generated: number;
    published: number;
    averageEngagement: number;
  };
  personalization: {
    usersSegmented: number;
    recommendationsGenerated: number;
    engagementImprovement: number;
  };
  systemPerformance: {
    averageResponseTime: number;
    errorRate: number;
    costPerOperation: number;
  };
}

export class AIOrchestrator {
  private context: Context;
  private aiService: CloudflareAIService;
  private validationService: AIValidationService;
  private challengeService: AIChallengeService;
  private personalizationService: AIPersonalizationService;
  private experimentService: AIExperimentService;
  private experimentDashboard: AIExperimentDashboard;
  private config: AutomationConfig;

  constructor(context: Context, config?: Partial<AutomationConfig>) {
    this.context = context;
    this.aiService = new CloudflareAIService(context);
    this.validationService = new AIValidationService(context);
    this.challengeService = new AIChallengeService(context);
    this.personalizationService = new AIPersonalizationService(context);
    this.experimentService = new AIExperimentService(context);
    this.experimentDashboard = new AIExperimentDashboard(context);
    
    this.config = {
      enableAutoValidation: true,
      enableChallengeGeneration: true,
      enablePersonalization: true,
      enableNotificationOptimization: true,
      validationThresholds: {
        autoApprove: 0.85,
        autoReject: 0.3,
      },
      challengeGeneration: {
        frequency: 'weekly',
        maxPerBusiness: 3,
        seasonalAdjustment: true,
      },
      personalization: {
        updateFrequency: 'daily',
        segmentationEnabled: true,
      },
      ...config,
    };
  }

  /**
   * Main automation pipeline - processes all AI tasks
   */
  async runAutomationPipeline(): Promise<{
    success: boolean;
    tasksCompleted: string[];
    errors: string[];
    metrics: Partial<AutomationMetrics>;
  }> {
    const tasksCompleted: string[] = [];
    const errors: string[] = [];
    const startTime = Date.now();

    try {
      // 1. Process pending validations
      if (this.config.enableAutoValidation) {
        try {
          await this.processPendingValidations();
          tasksCompleted.push('validation_processing');
        } catch (error) {
          errors.push(`Validation processing failed: ${error}`);
        }
      }

      // 2. Generate new challenges
      if (this.config.enableChallengeGeneration) {
        try {
          await this.generateScheduledChallenges();
          tasksCompleted.push('challenge_generation');
        } catch (error) {
          errors.push(`Challenge generation failed: ${error}`);
        }
      }

      // 3. Update personalization insights
      if (this.config.enablePersonalization) {
        try {
          await this.updatePersonalizationInsights();
          tasksCompleted.push('personalization_update');
        } catch (error) {
          errors.push(`Personalization update failed: ${error}`);
        }
      }

      // 4. Optimize notifications
      if (this.config.enableNotificationOptimization) {
        try {
          await this.optimizeNotificationStrategies();
          tasksCompleted.push('notification_optimization');
        } catch (error) {
          errors.push(`Notification optimization failed: ${error}`);
        }
      }

      // 5. Run A/B testing pipeline
      try {
        await this.runExperimentPipeline();
        tasksCompleted.push('experiment_management');
      } catch (error) {
        errors.push(`Experiment management failed: ${error}`);
      }

      // 6. Update system metrics
      const metrics = await this.collectAutomationMetrics();

      const processingTime = Date.now() - startTime;
      console.log(`AI automation pipeline completed in ${processingTime}ms`);

      return {
        success: errors.length === 0,
        tasksCompleted,
        errors,
        metrics,
      };
    } catch (error) {
      console.error('AI automation pipeline failed:', error);
      return {
        success: false,
        tasksCompleted,
        errors: [...errors, `Pipeline error: ${error}`],
        metrics: {},
      };
    }
  }

  /**
   * Process a single submission with full AI pipeline (A/B test enabled)
   */
  async processSubmissionWithAI(
    submission: Submission,
    challenge: Challenge,
    userId: string
  ): Promise<{
    approved: boolean;
    confidence: number;
    reasoning: string;
    nextRecommendations?: Challenge[];
    experimentVariant?: string;
  }> {
    try {
      // Check if user is in a validation experiment
      const experimentVariant = await this.experimentService.getUserVariant(userId, 'validation');
      
      // Use experiment-specific validation thresholds if applicable
      let validationService = this.validationService;
      if (experimentVariant) {
        // Temporarily override thresholds for this validation
        const originalThresholds = {
          autoApprove: (validationService as any).AUTO_APPROVE_THRESHOLD,
          autoReject: (validationService as any).AUTO_REJECT_THRESHOLD,
        };
        
        (validationService as any).AUTO_APPROVE_THRESHOLD = experimentVariant.config.autoApproveThreshold;
        (validationService as any).AUTO_REJECT_THRESHOLD = experimentVariant.config.autoRejectThreshold;
        
        // Restore after validation
        setTimeout(() => {
          (validationService as any).AUTO_APPROVE_THRESHOLD = originalThresholds.autoApprove;
          (validationService as any).AUTO_REJECT_THRESHOLD = originalThresholds.autoReject;
        }, 0);
      }

      // 1. Validate submission with AI (potentially with experiment config)
      const validationResult = await validationService.validateSubmission(
        submission,
        challenge,
        userId
      );

      // Record experiment result if user is in validation experiment
      if (experimentVariant) {
        await this.experimentService.recordExperimentResult({
          experimentId: experimentVariant.experimentId,
          variant: experimentVariant.variantId,
          userId,
          timestamp: new Date(),
          metrics: {
            validation_accuracy: validationResult.confidence,
            processing_time: Date.now(), // You'd measure actual processing time
            manual_review_rate: validationResult.finalDecision === 'manual_review' ? 1 : 0,
          },
          outcome: validationResult.isValid ? 'success' : 'failure',
        });
      }

      // 2. If approved, generate personalized recommendations
      let nextRecommendations: Challenge[] = [];
      if (validationResult.isValid) {
        try {
          const userProfile = await this.getUserProfile(userId);
          const insights = await this.personalizationService.generatePersonalizationInsights(
            userId,
            userProfile,
            await this.getUserActivityHistory(userId)
          );
          
          const recommendations = await this.challengeService.getPersonalizedRecommendations(
            userId,
            userProfile,
            await this.getAvailableChallenges(),
            3
          );
          
          nextRecommendations = recommendations.map(r => r.challenge);
        } catch (error) {
          console.error('Failed to generate recommendations:', error);
        }
      }

      return {
        approved: validationResult.isValid,
        confidence: validationResult.confidence,
        reasoning: validationResult.reviewReason || 'AI validation completed',
        nextRecommendations,
        experimentVariant: experimentVariant?.variantId,
      };
    } catch (error) {
      console.error('AI submission processing failed:', error);
      return {
        approved: false,
        confidence: 0,
        reasoning: 'AI processing error - manual review required',
      };
    }
  }

  /**
   * Generate and publish new challenges automatically
   */
  async autoGenerateChallenges(
    businesses: BusinessInfo[],
    count?: number
  ): Promise<Challenge[]> {
    try {
      // Get user patterns for better challenge generation
      const userProfiles = await this.getAllUserProfiles();
      const seasonalContext = await this.getCurrentSeasonalContext();

      // Generate challenges
      const generatedChallenges = await this.challengeService.generateChallenges(
        businesses,
        userProfiles,
        seasonalContext,
        count || this.config.challengeGeneration.maxPerBusiness
      );

      // Validate and publish challenges
      const publishedChallenges: Challenge[] = [];
      for (const challenge of generatedChallenges) {
        try {
          // Basic validation
          if (this.validateGeneratedChallenge(challenge)) {
            await this.publishChallenge(challenge);
            publishedChallenges.push(challenge);
          }
        } catch (error) {
          console.error(`Failed to publish challenge ${challenge.id}:`, error);
        }
      }

      console.log(`Auto-generated and published ${publishedChallenges.length} challenges`);
      return publishedChallenges;
    } catch (error) {
      console.error('Auto challenge generation failed:', error);
      return [];
    }
  }

  /**
   * Optimize user experience with AI insights
   */
  async optimizeUserExperience(userId: string): Promise<{
    personalizedChallenges: Challenge[];
    notificationStrategy: any;
    engagementPrediction: any;
    recommendations: string[];
  }> {
    try {
      const userProfile = await this.getUserProfile(userId);
      const activityHistory = await this.getUserActivityHistory(userId);
      
      // Generate comprehensive insights
      const insights = await this.personalizationService.generatePersonalizationInsights(
        userId,
        userProfile,
        activityHistory
      );

      // Get personalized challenges
      const challengeRecommendations = await this.challengeService.getPersonalizedRecommendations(
        userId,
        userProfile,
        await this.getAvailableChallenges(),
        5
      );

      // Optimize notifications
      const notificationStrategy = await this.personalizationService.optimizeNotifications(
        userId,
        insights,
        await this.getNotificationHistory(userId)
      );

      // Predict user trajectory
      const engagementPrediction = await this.personalizationService.predictUserTrajectory(
        userId,
        userProfile,
        insights
      );

      return {
        personalizedChallenges: challengeRecommendations.map(r => r.challenge),
        notificationStrategy,
        engagementPrediction,
        recommendations: insights.nextBestActions,
      };
    } catch (error) {
      console.error('User experience optimization failed:', error);
      return {
        personalizedChallenges: [],
        notificationStrategy: {},
        engagementPrediction: {},
        recommendations: ['Complete more challenges to improve recommendations'],
      };
    }
  }

  /**
   * Monitor and adjust AI performance
   */
  async monitorAndOptimize(): Promise<{
    performanceScore: number;
    optimizationsApplied: string[];
    recommendations: string[];
  }> {
    try {
      const metrics = await this.collectAutomationMetrics();
      const optimizationsApplied: string[] = [];
      const recommendations: string[] = [];

      // Check validation accuracy
      if (metrics.validationStats && metrics.validationStats.accuracy < 0.8) {
        const thresholdOptimization = await this.validationService.optimizeValidationThresholds();
        optimizationsApplied.push(`Updated validation thresholds: ${thresholdOptimization.reasoning}`);
      }

      // Check challenge engagement
      if (metrics.challengeGeneration && metrics.challengeGeneration.averageEngagement < 0.5) {
        recommendations.push('Review challenge generation prompts and templates');
        recommendations.push('Analyze user feedback for challenge improvements');
      }

      // Check system performance
      if (metrics.systemPerformance && metrics.systemPerformance.errorRate > 0.05) {
        recommendations.push('Investigate AI service reliability issues');
        recommendations.push('Implement additional error handling and fallbacks');
      }

      // Calculate overall performance score
      const performanceScore = this.calculatePerformanceScore(metrics);

      return {
        performanceScore,
        optimizationsApplied,
        recommendations,
      };
    } catch (error) {
      console.error('AI monitoring failed:', error);
      return {
        performanceScore: 0.5,
        optimizationsApplied: [],
        recommendations: ['Fix AI monitoring system'],
      };
    }
  }

  private async processPendingValidations(): Promise<void> {
    // Get pending submissions from queue
    const pendingSubmissions = await this.getPendingSubmissions();
    
    if (pendingSubmissions.length === 0) return;

    // Process in batches
    const batchSize = 10;
    for (let i = 0; i < pendingSubmissions.length; i += batchSize) {
      const batch = pendingSubmissions.slice(i, i + batchSize);
      
      try {
        const results = await this.validationService.batchValidateSubmissions(batch);
        await this.processBatchResults(results);
      } catch (error) {
        console.error(`Batch validation failed for batch ${i / batchSize + 1}:`, error);
      }
    }
  }

  private async generateScheduledChallenges(): Promise<void> {
    const shouldGenerate = await this.shouldGenerateChallenges();
    if (!shouldGenerate) return;

    const businesses = await this.getActiveBusinesses();
    await this.autoGenerateChallenges(businesses);
  }

  private async updatePersonalizationInsights(): Promise<void> {
    const users = await this.getActiveUsers();
    
    for (const user of users) {
      try {
        const insights = await this.personalizationService.generatePersonalizationInsights(
          user.userId,
          user,
          await this.getUserActivityHistory(user.userId)
        );
        
        await this.storePersonalizationInsights(user.userId, insights);
      } catch (error) {
        console.error(`Failed to update insights for user ${user.userId}:`, error);
      }
    }
  }

  private async optimizeNotificationStrategies(): Promise<void> {
    const users = await this.getActiveUsers();
    
    for (const user of users) {
      try {
        const insights = await this.getStoredPersonalizationInsights(user.userId);
        if (!insights) continue;

        const notificationStrategy = await this.personalizationService.optimizeNotifications(
          user.userId,
          insights,
          await this.getNotificationHistory(user.userId)
        );
        
        await this.updateNotificationStrategy(user.userId, notificationStrategy);
      } catch (error) {
        console.error(`Failed to optimize notifications for user ${user.userId}:`, error);
      }
    }
  }

  private async collectAutomationMetrics(): Promise<AutomationMetrics> {
    try {
      const validationStats = await this.validationService.getValidationMetrics();
      
      return {
        validationStats: {
          totalProcessed: validationStats.totalSubmissions,
          autoApproved: validationStats.aiApproved,
          autoRejected: validationStats.aiRejected,
          manualReviews: validationStats.manualReviews,
          accuracy: validationStats.averageConfidence,
        },
        challengeGeneration: {
          generated: await this.getChallengeGenerationCount(),
          published: await this.getPublishedChallengeCount(),
          averageEngagement: await this.getAverageEngagement(),
        },
        personalization: {
          usersSegmented: await this.getSegmentedUserCount(),
          recommendationsGenerated: await this.getRecommendationCount(),
          engagementImprovement: await this.getEngagementImprovement(),
        },
        systemPerformance: {
          averageResponseTime: await this.getAverageResponseTime(),
          errorRate: await this.getErrorRate(),
          costPerOperation: await this.getCostPerOperation(),
        },
      };
    } catch (error) {
      console.error('Failed to collect automation metrics:', error);
      return {} as AutomationMetrics;
    }
  }

  private calculatePerformanceScore(metrics: AutomationMetrics): number {
    let score = 0;
    let factors = 0;

    if (metrics.validationStats) {
      score += metrics.validationStats.accuracy;
      factors++;
    }

    if (metrics.challengeGeneration) {
      score += Math.min(metrics.challengeGeneration.averageEngagement, 1);
      factors++;
    }

    if (metrics.systemPerformance) {
      score += Math.max(0, 1 - metrics.systemPerformance.errorRate);
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  // Helper methods (simplified implementations)
  private async getUserProfile(userId: string): Promise<UserProfile> {
    // Implementation would fetch from your user service
    return {} as UserProfile;
  }

  private async getUserActivityHistory(userId: string): Promise<any[]> {
    // Implementation would fetch user activity data
    return [];
  }

  private async getAvailableChallenges(): Promise<Challenge[]> {
    // Implementation would fetch active challenges
    return [];
  }

  private async getAllUserProfiles(): Promise<UserProfile[]> {
    // Implementation would fetch all user profiles
    return [];
  }

  private async getCurrentSeasonalContext(): Promise<any> {
    // Implementation would determine current seasonal context
    return {};
  }

  private validateGeneratedChallenge(challenge: Challenge): boolean {
    // Basic validation logic
    return challenge.title.length > 0 && challenge.description.length > 0;
  }

  private async publishChallenge(challenge: Challenge): Promise<void> {
    // Implementation would publish challenge to your system
  }

  private async getPendingSubmissions(): Promise<any[]> {
    // Implementation would fetch pending submissions
    return [];
  }

  private async processBatchResults(results: any[]): Promise<void> {
    // Implementation would process validation results
  }

  private async shouldGenerateChallenges(): Promise<boolean> {
    // Implementation would check if new challenges should be generated
    return true;
  }

  private async getActiveBusinesses(): Promise<BusinessInfo[]> {
    // Implementation would fetch active businesses
    return [];
  }

  private async getActiveUsers(): Promise<UserProfile[]> {
    // Implementation would fetch active users
    return [];
  }

  private async storePersonalizationInsights(userId: string, insights: any): Promise<void> {
    // Implementation would store insights
  }

  private async getStoredPersonalizationInsights(userId: string): Promise<any> {
    // Implementation would retrieve stored insights
    return null;
  }

  private async getNotificationHistory(userId: string): Promise<any[]> {
    // Implementation would fetch notification history
    return [];
  }

  private async updateNotificationStrategy(userId: string, strategy: any): Promise<void> {
    // Implementation would update notification strategy
  }

  // Metric collection helpers
  private async getChallengeGenerationCount(): Promise<number> { return 0; }
  private async getPublishedChallengeCount(): Promise<number> { return 0; }
  private async getAverageEngagement(): Promise<number> { return 0.7; }
  private async getSegmentedUserCount(): Promise<number> { return 0; }
  private async getRecommendationCount(): Promise<number> { return 0; }
  private async getEngagementImprovement(): Promise<number> { return 0.1; }
  private async getAverageResponseTime(): Promise<number> { return 500; }
  private async getErrorRate(): Promise<number> { return 0.02; }
  private async getCostPerOperation(): Promise<number> { return 0.01; }

  /**
   * A/B Testing Pipeline Methods
   */

  /**
   * Run the complete A/B testing pipeline
   */
  private async runExperimentPipeline(): Promise<void> {
    // 1. Monitor and auto-stop experiments
    await this.experimentDashboard.monitorAndAutoStop();
    
    // 2. Auto-create new experiments based on performance
    await this.experimentDashboard.autoCreateExperiments();
    
    // 3. Analyze active experiments
    const activeExperiments = await this.experimentService.getActiveExperiments();
    for (const experiment of activeExperiments) {
      await this.experimentService.analyzeExperiment(experiment.id);
    }
  }

  /**
   * Get personalized recommendations with A/B testing
   */
  async getPersonalizedRecommendationsWithExperiments(
    userId: string,
    userProfile: UserProfile,
    availableChallenges: Challenge[]
  ): Promise<{
    recommendations: Challenge[];
    experimentVariant?: string;
    personalizedReason: string;
  }> {
    try {
      // Check if user is in personalization experiment
      const experimentVariant = await this.experimentService.getUserVariant(userId, 'personalization');
      
      let recommendations: Challenge[];
      let personalizedReason: string;

      if (experimentVariant) {
        // Use experiment-specific personalization algorithm
        recommendations = await this.getExperimentalRecommendations(
          userId,
          userProfile,
          availableChallenges,
          experimentVariant.config
        );
        personalizedReason = `Recommendations using ${experimentVariant.config.algorithm} algorithm`;
        
        // Record experiment interaction
        await this.experimentService.recordExperimentResult({
          experimentId: experimentVariant.experimentId,
          variant: experimentVariant.variantId,
          userId,
          timestamp: new Date(),
          metrics: {
            recommendations_shown: recommendations.length,
            algorithm_used: experimentVariant.config.algorithm,
          },
          outcome: 'neutral', // Will be updated when user interacts
        });
      } else {
        // Use default personalization
        const challengeRecommendations = await this.challengeService.getPersonalizedRecommendations(
          userId,
          userProfile,
          availableChallenges,
          5
        );
        recommendations = challengeRecommendations.map(r => r.challenge);
        personalizedReason = 'Standard personalization algorithm';
      }

      return {
        recommendations,
        experimentVariant: experimentVariant?.variantId,
        personalizedReason,
      };
    } catch (error) {
      console.error('Personalized recommendations with experiments failed:', error);
      return {
        recommendations: availableChallenges.slice(0, 5),
        personalizedReason: 'Fallback recommendations due to error',
      };
    }
  }

  /**
   * Send notification with A/B testing
   */
  async sendNotificationWithExperiment(
    userId: string,
    notificationType: string,
    message: string
  ): Promise<{
    sent: boolean;
    experimentVariant?: string;
    timing: string;
  }> {
    try {
      // Check if user is in notification experiment
      const experimentVariant = await this.experimentService.getUserVariant(userId, 'notification');
      
      let shouldSend = true;
      let timing = 'immediate';

      if (experimentVariant) {
        const config = experimentVariant.config;
        
        if (config.personalized) {
          // Use AI-optimized timing
          const userProfile = await this.getUserProfile(userId);
          const insights = await this.personalizationService.generatePersonalizationInsights(
            userId,
            userProfile,
            await this.getUserActivityHistory(userId)
          );
          timing = insights.optimalChallengeTime;
        } else {
          // Use experiment-specific timing
          const currentHour = new Date().getHours();
          const experimentTimes = config.times.map((time: string) => parseInt(time.split(':')[0]));
          shouldSend = experimentTimes.some((hour: number) => Math.abs(currentHour - hour) <= 1);
          timing = config.times[0];
        }

        // Record experiment result
        await this.experimentService.recordExperimentResult({
          experimentId: experimentVariant.experimentId,
          variant: experimentVariant.variantId,
          userId,
          timestamp: new Date(),
          metrics: {
            notification_sent: shouldSend ? 1 : 0,
            optimal_timing: timing === 'immediate' ? 0 : 1,
          },
          outcome: shouldSend ? 'success' : 'neutral',
        });
      }

      if (shouldSend) {
        // Send notification through your existing system
        await this.sendNotification(userId, message, 'push');
      }

      return {
        sent: shouldSend,
        experimentVariant: experimentVariant?.variantId,
        timing,
      };
    } catch (error) {
      console.error('Notification with experiment failed:', error);
      return {
        sent: false,
        timing: 'error',
      };
    }
  }

  /**
   * Generate challenge with A/B testing
   */
  async generateChallengeWithExperiment(
    businessInfo: BusinessInfo,
    userPatterns?: UserProfile[]
  ): Promise<{
    challenge: Challenge;
    experimentVariant?: string;
    generationStrategy: string;
  }> {
    try {
      // Check for challenge generation experiment
      const experimentVariant = await this.experimentService.getUserVariant('system', 'challenge_generation');
      
      let challenge: Challenge;
      let generationStrategy: string;

      if (experimentVariant) {
        // Use experimental generation strategy
        const config = experimentVariant.config;
        challenge = await this.generateChallengeWithStrategy(businessInfo, config);
        generationStrategy = config.name;
        
        // Record experiment result (will be updated based on engagement)
        await this.experimentService.recordExperimentResult({
          experimentId: experimentVariant.experimentId,
          variant: experimentVariant.variantId,
          userId: 'system',
          timestamp: new Date(),
          metrics: {
            challenge_generated: 1,
            strategy_used: config.name,
          },
          outcome: 'neutral', // Will be updated based on user engagement
        });
      } else {
        // Use default generation
        const challenges = await this.challengeService.generateChallenges([businessInfo], userPatterns, undefined, 1);
        challenge = challenges[0];
        generationStrategy = 'default';
      }

      return {
        challenge,
        experimentVariant: experimentVariant?.variantId,
        generationStrategy,
      };
    } catch (error) {
      console.error('Challenge generation with experiment failed:', error);
      throw error;
    }
  }

  /**
   * Get A/B testing dashboard data
   */
  async getExperimentDashboard(): Promise<{
    metrics: any;
    activeExperiments: any[];
    recommendations: any;
    performanceReport: any;
  }> {
    try {
      const [metrics, activeExperiments, recommendations, performanceReport] = await Promise.all([
        this.experimentDashboard.getDashboardMetrics(),
        this.experimentDashboard.getActiveExperimentSummaries(),
        this.experimentDashboard.generateRecommendations(),
        this.experimentDashboard.generatePerformanceReport(),
      ]);

      return {
        metrics,
        activeExperiments,
        recommendations,
        performanceReport,
      };
    } catch (error) {
      console.error('Failed to get experiment dashboard:', error);
      return {
        metrics: {},
        activeExperiments: [],
        recommendations: { suggestedExperiments: [], optimizationOpportunities: [] },
        performanceReport: { summary: {}, topWins: [], learnings: [], recommendations: [] },
      };
    }
  }

  /**
   * Create a new A/B test experiment
   */
  async createExperiment(
    type: 'validation' | 'challenge_generation' | 'personalization' | 'notification',
    name: string,
    variants: any[],
    options?: {
      duration?: number;
      targetUsers?: string[];
      minimumSampleSize?: number;
    }
  ): Promise<string> {
    try {
      const config = {
        id: `${type}_${Date.now()}`,
        name,
        description: `A/B test for ${type} optimization`,
        type,
        status: 'running' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + (options?.duration || 14) * 24 * 60 * 60 * 1000),
        targetUsers: options?.targetUsers || 'all' as const,
        variants: variants.map((variant, index) => ({
          id: `variant_${index}`,
          name: variant.name,
          description: variant.description,
          weight: 1 / variants.length,
          config: variant.config,
        })),
        successMetrics: this.getSuccessMetricsForType(type),
        minimumSampleSize: options?.minimumSampleSize || 100,
        confidenceLevel: 0.95,
      };

      const result = await this.experimentService.createExperiment(config);
      return result.experimentId;
    } catch (error) {
      console.error('Failed to create experiment:', error);
      throw error;
    }
  }

  private async getExperimentalRecommendations(
    userId: string,
    userProfile: UserProfile,
    availableChallenges: Challenge[],
    experimentConfig: any
  ): Promise<Challenge[]> {
    // Implement different recommendation algorithms based on experiment config
    switch (experimentConfig.algorithm) {
      case 'collaborative_filtering':
        return this.getCollaborativeFilteringRecommendations(userId, availableChallenges);
      case 'content_based':
        return this.getContentBasedRecommendations(userProfile, availableChallenges);
      default:
        const recommendations = await this.challengeService.getPersonalizedRecommendations(
          userId,
          userProfile,
          availableChallenges,
          5
        );
        return recommendations.map(r => r.challenge);
    }
  }

  private async generateChallengeWithStrategy(
    businessInfo: BusinessInfo,
    strategy: any
  ): Promise<Challenge> {
    // Use different AI models/strategies based on experiment config
    const request = {
      businessInfo: {
        name: businessInfo.name,
        category: businessInfo.category,
        location: businessInfo.location,
        description: businessInfo.description,
      },
      difficulty: 'medium' as const,
      seasonalContext: '',
    };

    // Modify AI service call based on strategy
    const generatedChallenge = await this.aiService.generateChallenge(request);
    
    // Convert to Challenge object
    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: generatedChallenge.title,
      description: generatedChallenge.description,
      difficulty: 'medium',
      pointsReward: 25,
      location: businessInfo.location,
      partnerInfo: {
        businessName: businessInfo.name,
        category: businessInfo.category,
        logoUrl: businessInfo.logoUrl || '',
        description: businessInfo.description || '',
      },
      proofRequirements: {
        type: generatedChallenge.proofType,
        description: generatedChallenge.requirements.join('. '),
        gpsRequired: true,
      },
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      estimatedDuration: generatedChallenge.estimatedDuration,
      tips: generatedChallenge.tips,
      isAIGenerated: true,
    };
  }

  private getSuccessMetricsForType(type: string): string[] {
    const metricsMap = {
      validation: ['validation_accuracy', 'processing_time', 'manual_review_rate'],
      challenge_generation: ['engagement_rate', 'completion_rate', 'user_rating'],
      personalization: ['click_through_rate', 'completion_rate', 'session_length'],
      notification: ['open_rate', 'click_rate', 'conversion_rate'],
    };
    return metricsMap[type as keyof typeof metricsMap] || ['conversion_rate'];
  }

  private async getCollaborativeFilteringRecommendations(
    userId: string,
    availableChallenges: Challenge[]
  ): Promise<Challenge[]> {
    // Simplified collaborative filtering
    // In production, you'd implement proper collaborative filtering
    return availableChallenges.slice(0, 5);
  }

  private async getContentBasedRecommendations(
    userProfile: UserProfile,
    availableChallenges: Challenge[]
  ): Promise<Challenge[]> {
    // Simplified content-based filtering
    const preferredCategories = userProfile.preferences?.categories || [];
    
    const filtered = availableChallenges.filter(challenge =>
      preferredCategories.includes(challenge.partnerInfo.category)
    );
    
    return filtered.slice(0, 5);
  }

  private async sendNotification(userId: string, message: string, channel: string): Promise<void> {
    // Your existing notification implementation
    console.log(`Sending ${channel} notification to ${userId}: ${message}`);
  }
}