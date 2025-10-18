import { Context } from '@devvit/public-api';
import { CloudflareAIService } from './aiService.js';
import { Challenge, UserProfile } from '../types/index.js';

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  type: 'validation' | 'challenge_generation' | 'personalization' | 'notification';
  status: 'draft' | 'running' | 'completed' | 'paused';
  startDate: Date;
  endDate: Date;
  targetUsers: string[] | 'all' | 'segment';
  segmentCriteria?: {
    minCompletionRate?: number;
    maxChurnRisk?: number;
    preferredCategories?: string[];
    engagementLevel?: 'low' | 'medium' | 'high';
  };
  variants: ExperimentVariant[];
  successMetrics: string[];
  minimumSampleSize: number;
  confidenceLevel: number; // 0.95 for 95% confidence
}

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1, sum of all variants should be 1
  config: any; // Variant-specific configuration
}

export interface ExperimentResult {
  experimentId: string;
  variant: string;
  userId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  outcome: 'success' | 'failure' | 'neutral';
}

export interface ExperimentAnalysis {
  experimentId: string;
  status: 'insufficient_data' | 'no_significant_difference' | 'significant_winner' | 'significant_loser';
  winningVariant?: string;
  confidence: number;
  results: {
    [variantId: string]: {
      sampleSize: number;
      conversionRate: number;
      averageMetric: number;
      standardError: number;
      confidenceInterval: [number, number];
    };
  };
  recommendations: string[];
  statisticalSignificance: boolean;
}

export class AIExperimentService {
  private context: Context;
  private aiService: CloudflareAIService;

  constructor(context: Context) {
    this.context = context;
    this.aiService = new CloudflareAIService(context);
  }

  /**
   * Create and start a new A/B test experiment
   */
  async createExperiment(config: ExperimentConfig): Promise<{
    experimentId: string;
    userAssignments: Record<string, string>;
    estimatedDuration: number;
  }> {
    try {
      // Validate experiment configuration
      this.validateExperimentConfig(config);

      // Get target users
      const targetUsers = await this.getTargetUsers(config);
      
      // Assign users to variants
      const userAssignments = this.assignUsersToVariants(targetUsers, config.variants);

      // Store experiment configuration
      await this.storeExperiment(config, userAssignments);

      // Calculate estimated duration
      const estimatedDuration = this.calculateEstimatedDuration(
        config,
        targetUsers.length
      );

      console.log(`Created experiment ${config.id} with ${targetUsers.length} users`);

      return {
        experimentId: config.id,
        userAssignments,
        estimatedDuration,
      };
    } catch (error) {
      console.error('Failed to create experiment:', error);
      throw error;
    }
  }

  /**
   * Get the variant assignment for a user in an active experiment
   */
  async getUserVariant(userId: string, experimentType: string): Promise<{
    experimentId: string;
    variantId: string;
    config: any;
  } | null> {
    try {
      const redis = this.context.redis;
      
      // Get active experiments of this type
      const activeExperiments = await redis.sMembers(`active_experiments:${experimentType}`);
      
      for (const experimentId of activeExperiments) {
        const assignment = await redis.hGet(`experiment_assignments:${experimentId}`, userId);
        
        if (assignment) {
          const experiment = await this.getExperiment(experimentId);
          const variant = experiment.variants.find(v => v.id === assignment);
          
          if (variant) {
            return {
              experimentId,
              variantId: variant.id,
              config: variant.config,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get user variant:', error);
      return null;
    }
  }

  /**
   * Record experiment result/outcome
   */
  async recordExperimentResult(result: ExperimentResult): Promise<void> {
    try {
      const redis = this.context.redis;
      
      // Store individual result
      const resultKey = `experiment_results:${result.experimentId}:${result.variant}`;
      await redis.lPush(resultKey, JSON.stringify(result));
      
      // Update aggregated metrics
      await this.updateAggregatedMetrics(result);
      
      // Check if experiment should be analyzed
      await this.checkForAnalysis(result.experimentId);
    } catch (error) {
      console.error('Failed to record experiment result:', error);
    }
  }

  /**
   * Analyze experiment results and determine statistical significance
   */
  async analyzeExperiment(experimentId: string): Promise<ExperimentAnalysis> {
    try {
      const experiment = await this.getExperiment(experimentId);
      const results = await this.getExperimentResults(experimentId);
      
      // Calculate statistics for each variant
      const variantStats: Record<string, any> = {};
      
      for (const variant of experiment.variants) {
        const variantResults = results.filter(r => r.variant === variant.id);
        
        if (variantResults.length === 0) {
          variantStats[variant.id] = {
            sampleSize: 0,
            conversionRate: 0,
            averageMetric: 0,
            standardError: 0,
            confidenceInterval: [0, 0],
          };
          continue;
        }

        const sampleSize = variantResults.length;
        const successes = variantResults.filter(r => r.outcome === 'success').length;
        const conversionRate = successes / sampleSize;
        
        // Calculate primary metric average
        const primaryMetric = experiment.successMetrics[0];
        const metricValues = variantResults
          .map(r => r.metrics[primaryMetric] || 0)
          .filter(v => !isNaN(v));
        
        const averageMetric = metricValues.length > 0 ? 
          metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length : 0;
        
        // Calculate standard error
        const variance = metricValues.length > 1 ? 
          metricValues.reduce((sum, val) => sum + Math.pow(val - averageMetric, 2), 0) / (metricValues.length - 1) : 0;
        const standardError = Math.sqrt(variance / sampleSize);
        
        // Calculate confidence interval
        const marginOfError = 1.96 * standardError; // 95% confidence
        const confidenceInterval: [number, number] = [
          averageMetric - marginOfError,
          averageMetric + marginOfError
        ];

        variantStats[variant.id] = {
          sampleSize,
          conversionRate,
          averageMetric,
          standardError,
          confidenceInterval,
        };
      }

      // Determine statistical significance and winner
      const analysis = this.performStatisticalAnalysis(experiment, variantStats);
      
      // Store analysis results
      await this.storeAnalysis(experimentId, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Experiment analysis failed:', error);
      return {
        experimentId,
        status: 'insufficient_data',
        confidence: 0,
        results: {},
        recommendations: ['Unable to analyze experiment due to error'],
        statisticalSignificance: false,
      };
    }
  }

  /**
   * Get all running experiments
   */
  async getActiveExperiments(): Promise<ExperimentConfig[]> {
    try {
      const redis = this.context.redis;
      const experimentIds = await redis.sMembers('active_experiments:all');
      
      const experiments: ExperimentConfig[] = [];
      for (const id of experimentIds) {
        const experiment = await this.getExperiment(id);
        if (experiment && experiment.status === 'running') {
          experiments.push(experiment);
        }
      }
      
      return experiments;
    } catch (error) {
      console.error('Failed to get active experiments:', error);
      return [];
    }
  }

  /**
   * Stop an experiment and finalize results
   */
  async stopExperiment(experimentId: string, reason: string): Promise<ExperimentAnalysis> {
    try {
      const redis = this.context.redis;
      
      // Update experiment status
      const experiment = await this.getExperiment(experimentId);
      experiment.status = 'completed';
      await redis.set(`experiment:${experimentId}`, JSON.stringify(experiment));
      
      // Remove from active experiments
      await redis.sRem('active_experiments:all', experimentId);
      await redis.sRem(`active_experiments:${experiment.type}`, experimentId);
      
      // Perform final analysis
      const analysis = await this.analyzeExperiment(experimentId);
      
      // Log experiment completion
      console.log(`Experiment ${experimentId} stopped: ${reason}`);
      console.log(`Winner: ${analysis.winningVariant || 'No significant difference'}`);
      
      return analysis;
    } catch (error) {
      console.error('Failed to stop experiment:', error);
      throw error;
    }
  }

  /**
   * Create validation threshold experiment
   */
  async createValidationExperiment(
    name: string,
    thresholds: Array<{ approve: number; reject: number }>,
    targetUsers?: string[]
  ): Promise<string> {
    const variants: ExperimentVariant[] = thresholds.map((threshold, index) => ({
      id: `threshold_${index}`,
      name: `Approve: ${threshold.approve}, Reject: ${threshold.reject}`,
      description: `Auto-approve at ${threshold.approve * 100}%, auto-reject below ${threshold.reject * 100}%`,
      weight: 1 / thresholds.length,
      config: {
        autoApproveThreshold: threshold.approve,
        autoRejectThreshold: threshold.reject,
      },
    }));

    const config: ExperimentConfig = {
      id: `validation_${Date.now()}`,
      name,
      description: 'Test different validation thresholds for optimal accuracy vs efficiency',
      type: 'validation',
      status: 'running',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      targetUsers: targetUsers || 'all',
      variants,
      successMetrics: ['validation_accuracy', 'processing_time', 'manual_review_rate'],
      minimumSampleSize: 100,
      confidenceLevel: 0.95,
    };

    const result = await this.createExperiment(config);
    return result.experimentId;
  }

  /**
   * Create challenge generation experiment
   */
  async createChallengeGenerationExperiment(
    name: string,
    generationStrategies: Array<{
      name: string;
      aiModel: string;
      temperature: number;
      promptStyle: string;
    }>
  ): Promise<string> {
    const variants: ExperimentVariant[] = generationStrategies.map((strategy, index) => ({
      id: `strategy_${index}`,
      name: strategy.name,
      description: `Using ${strategy.aiModel} with ${strategy.promptStyle} prompts`,
      weight: 1 / generationStrategies.length,
      config: strategy,
    }));

    const config: ExperimentConfig = {
      id: `challenge_gen_${Date.now()}`,
      name,
      description: 'Test different AI strategies for challenge generation',
      type: 'challenge_generation',
      status: 'running',
      startDate: new Date(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
      targetUsers: 'all',
      variants,
      successMetrics: ['engagement_rate', 'completion_rate', 'user_rating'],
      minimumSampleSize: 50,
      confidenceLevel: 0.95,
    };

    const result = await this.createExperiment(config);
    return result.experimentId;
  }

  /**
   * Create personalization experiment
   */
  async createPersonalizationExperiment(
    name: string,
    personalizationStrategies: Array<{
      name: string;
      algorithm: string;
      features: string[];
      updateFrequency: string;
    }>
  ): Promise<string> {
    const variants: ExperimentVariant[] = personalizationStrategies.map((strategy, index) => ({
      id: `personalization_${index}`,
      name: strategy.name,
      description: `${strategy.algorithm} algorithm with ${strategy.features.join(', ')} features`,
      weight: 1 / personalizationStrategies.length,
      config: strategy,
    }));

    const config: ExperimentConfig = {
      id: `personalization_${Date.now()}`,
      name,
      description: 'Test different personalization algorithms and feature sets',
      type: 'personalization',
      status: 'running',
      startDate: new Date(),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days
      targetUsers: 'all',
      segmentCriteria: {
        minCompletionRate: 0.1, // Only users who have completed at least one challenge
      },
      variants,
      successMetrics: ['click_through_rate', 'completion_rate', 'session_length', 'retention_rate'],
      minimumSampleSize: 200,
      confidenceLevel: 0.95,
    };

    const result = await this.createExperiment(config);
    return result.experimentId;
  }

  /**
   * Create notification timing experiment
   */
  async createNotificationExperiment(
    name: string,
    timingStrategies: Array<{
      name: string;
      times: string[];
      frequency: string;
      personalized: boolean;
    }>
  ): Promise<string> {
    const variants: ExperimentVariant[] = timingStrategies.map((strategy, index) => ({
      id: `notification_${index}`,
      name: strategy.name,
      description: `Send at ${strategy.times.join(', ')} with ${strategy.frequency} frequency`,
      weight: 1 / timingStrategies.length,
      config: strategy,
    }));

    const config: ExperimentConfig = {
      id: `notification_${Date.now()}`,
      name,
      description: 'Test different notification timing and frequency strategies',
      type: 'notification',
      status: 'running',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      targetUsers: 'all',
      variants,
      successMetrics: ['open_rate', 'click_rate', 'conversion_rate', 'unsubscribe_rate'],
      minimumSampleSize: 300,
      confidenceLevel: 0.95,
    };

    const result = await this.createExperiment(config);
    return result.experimentId;
  }

  private validateExperimentConfig(config: ExperimentConfig): void {
    if (!config.id || !config.name || !config.variants.length) {
      throw new Error('Invalid experiment configuration');
    }

    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error('Variant weights must sum to 1.0');
    }

    if (config.minimumSampleSize < 30) {
      throw new Error('Minimum sample size must be at least 30');
    }
  }

  private async getTargetUsers(config: ExperimentConfig): Promise<string[]> {
    if (Array.isArray(config.targetUsers)) {
      return config.targetUsers;
    }

    if (config.targetUsers === 'all') {
      return await this.getAllActiveUsers();
    }

    if (config.targetUsers === 'segment' && config.segmentCriteria) {
      return await this.getUsersBySegment(config.segmentCriteria);
    }

    return [];
  }

  private assignUsersToVariants(
    users: string[],
    variants: ExperimentVariant[]
  ): Record<string, string> {
    const assignments: Record<string, string> = {};
    
    // Create cumulative weight distribution
    const cumulativeWeights: number[] = [];
    let sum = 0;
    for (const variant of variants) {
      sum += variant.weight;
      cumulativeWeights.push(sum);
    }

    // Assign each user to a variant based on hash of their ID
    for (const userId of users) {
      const hash = this.hashUserId(userId);
      const random = hash / 0xffffffff; // Normalize to 0-1
      
      for (let i = 0; i < cumulativeWeights.length; i++) {
        if (random <= cumulativeWeights[i]) {
          assignments[userId] = variants[i].id;
          break;
        }
      }
    }

    return assignments;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async storeExperiment(
    config: ExperimentConfig,
    userAssignments: Record<string, string>
  ): Promise<void> {
    const redis = this.context.redis;
    
    // Store experiment configuration
    await redis.set(`experiment:${config.id}`, JSON.stringify(config));
    
    // Store user assignments
    for (const [userId, variantId] of Object.entries(userAssignments)) {
      await redis.hSet(`experiment_assignments:${config.id}`, userId, variantId);
    }
    
    // Add to active experiments
    await redis.sAdd('active_experiments:all', config.id);
    await redis.sAdd(`active_experiments:${config.type}`, config.id);
    
    // Set expiration
    const ttl = Math.ceil((config.endDate.getTime() - Date.now()) / 1000);
    await redis.expire(`experiment:${config.id}`, ttl);
    await redis.expire(`experiment_assignments:${config.id}`, ttl);
  }

  private calculateEstimatedDuration(config: ExperimentConfig, userCount: number): number {
    // Simple estimation based on minimum sample size and expected conversion rate
    const expectedConversionRate = 0.1; // 10% default
    const dailyActiveRate = 0.3; // 30% of users active daily
    
    const dailyEvents = userCount * dailyActiveRate * expectedConversionRate;
    const daysToMinimumSample = Math.ceil(config.minimumSampleSize / dailyEvents);
    
    return Math.max(daysToMinimumSample, 7); // Minimum 7 days
  }

  private async getExperiment(experimentId: string): Promise<ExperimentConfig> {
    const redis = this.context.redis;
    const data = await redis.get(`experiment:${experimentId}`);
    return data ? JSON.parse(data) : null;
  }

  private async updateAggregatedMetrics(result: ExperimentResult): Promise<void> {
    const redis = this.context.redis;
    const key = `experiment_metrics:${result.experimentId}:${result.variant}`;
    
    // Update counters
    await redis.hIncrBy(key, 'total_events', 1);
    
    if (result.outcome === 'success') {
      await redis.hIncrBy(key, 'success_events', 1);
    }
    
    // Update metric sums for averaging
    for (const [metric, value] of Object.entries(result.metrics)) {
      await redis.hIncrByFloat(key, `sum_${metric}`, value);
    }
  }

  private async checkForAnalysis(experimentId: string): Promise<void> {
    const experiment = await this.getExperiment(experimentId);
    if (!experiment) return;

    // Check if we have enough data for analysis
    const totalEvents = await this.getTotalEvents(experimentId);
    
    if (totalEvents >= experiment.minimumSampleSize) {
      // Perform analysis every 100 events after minimum sample size
      if (totalEvents % 100 === 0) {
        await this.analyzeExperiment(experimentId);
      }
    }
  }

  private async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    const redis = this.context.redis;
    const experiment = await this.getExperiment(experimentId);
    
    const allResults: ExperimentResult[] = [];
    
    for (const variant of experiment.variants) {
      const resultKey = `experiment_results:${experimentId}:${variant.id}`;
      const results = await redis.lRange(resultKey, 0, -1);
      
      for (const resultStr of results) {
        try {
          const result = JSON.parse(resultStr);
          allResults.push(result);
        } catch (error) {
          console.error('Failed to parse experiment result:', error);
        }
      }
    }
    
    return allResults;
  }

  private performStatisticalAnalysis(
    experiment: ExperimentConfig,
    variantStats: Record<string, any>
  ): ExperimentAnalysis {
    const variants = Object.keys(variantStats);
    
    if (variants.length < 2) {
      return {
        experimentId: experiment.id,
        status: 'insufficient_data',
        confidence: 0,
        results: variantStats,
        recommendations: ['Need at least 2 variants with data'],
        statisticalSignificance: false,
      };
    }

    // Find the variant with the highest average metric
    let bestVariant = variants[0];
    let bestMetric = variantStats[bestVariant].averageMetric;
    
    for (const variant of variants) {
      if (variantStats[variant].averageMetric > bestMetric) {
        bestVariant = variant;
        bestMetric = variantStats[variant].averageMetric;
      }
    }

    // Simple statistical significance test (t-test approximation)
    const controlVariant = variants[0];
    const testVariant = bestVariant;
    
    if (controlVariant === testVariant) {
      return {
        experimentId: experiment.id,
        status: 'no_significant_difference',
        confidence: 0.5,
        results: variantStats,
        recommendations: ['No clear winner detected'],
        statisticalSignificance: false,
      };
    }

    const controlStats = variantStats[controlVariant];
    const testStats = variantStats[testVariant];
    
    // Calculate t-statistic
    const meanDiff = testStats.averageMetric - controlStats.averageMetric;
    const pooledSE = Math.sqrt(
      Math.pow(controlStats.standardError, 2) + Math.pow(testStats.standardError, 2)
    );
    
    const tStat = pooledSE > 0 ? Math.abs(meanDiff / pooledSE) : 0;
    const isSignificant = tStat > 1.96; // 95% confidence level
    
    const confidence = Math.min(0.99, 0.5 + (tStat / 4)); // Rough confidence estimate

    return {
      experimentId: experiment.id,
      status: isSignificant ? 'significant_winner' : 'no_significant_difference',
      winningVariant: isSignificant ? bestVariant : undefined,
      confidence,
      results: variantStats,
      recommendations: this.generateRecommendations(experiment, variantStats, isSignificant, bestVariant),
      statisticalSignificance: isSignificant,
    };
  }

  private generateRecommendations(
    experiment: ExperimentConfig,
    variantStats: Record<string, any>,
    isSignificant: boolean,
    bestVariant: string
  ): string[] {
    const recommendations: string[] = [];

    if (isSignificant) {
      recommendations.push(`Implement ${bestVariant} configuration for improved performance`);
      
      const bestStats = variantStats[bestVariant];
      const improvement = ((bestStats.averageMetric / Object.values(variantStats)[0].averageMetric) - 1) * 100;
      
      if (improvement > 0) {
        recommendations.push(`Expected improvement: ${improvement.toFixed(1)}%`);
      }
    } else {
      recommendations.push('Continue running experiment to gather more data');
      
      // Check if any variant has very low sample size
      for (const [variant, stats] of Object.entries(variantStats)) {
        if (stats.sampleSize < experiment.minimumSampleSize / 2) {
          recommendations.push(`Increase traffic to ${variant} variant`);
        }
      }
    }

    // Type-specific recommendations
    if (experiment.type === 'validation') {
      recommendations.push('Monitor validation accuracy vs processing efficiency trade-offs');
    } else if (experiment.type === 'personalization') {
      recommendations.push('Consider user segment-specific analysis');
    }

    return recommendations;
  }

  private async storeAnalysis(experimentId: string, analysis: ExperimentAnalysis): Promise<void> {
    const redis = this.context.redis;
    await redis.set(`experiment_analysis:${experimentId}`, JSON.stringify(analysis));
    await redis.expire(`experiment_analysis:${experimentId}`, 86400 * 30); // 30 days
  }

  private async getTotalEvents(experimentId: string): Promise<number> {
    const redis = this.context.redis;
    const experiment = await this.getExperiment(experimentId);
    
    let total = 0;
    for (const variant of experiment.variants) {
      const count = await redis.hGet(`experiment_metrics:${experimentId}:${variant.id}`, 'total_events');
      total += parseInt(count || '0');
    }
    
    return total;
  }

  private async getAllActiveUsers(): Promise<string[]> {
    // Implementation would fetch all active users from your system
    // For now, return empty array
    return [];
  }

  private async getUsersBySegment(criteria: any): Promise<string[]> {
    // Implementation would filter users based on segment criteria
    // For now, return empty array
    return [];
  }
}