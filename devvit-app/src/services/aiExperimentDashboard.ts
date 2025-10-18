import { Context } from '@devvit/public-api';
import { AIExperimentService, ExperimentConfig, ExperimentAnalysis } from './aiExperimentService.js';

export interface DashboardMetrics {
  totalExperiments: number;
  activeExperiments: number;
  completedExperiments: number;
  significantWins: number;
  totalUsersInExperiments: number;
  averageExperimentDuration: number;
  topPerformingVariants: Array<{
    experimentName: string;
    variantName: string;
    improvement: number;
    confidence: number;
  }>;
}

export interface ExperimentSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date;
  participantCount: number;
  currentWinner?: string;
  confidence: number;
  daysRemaining: number;
  keyMetrics: Record<string, number>;
}

export interface RecommendationEngine {
  suggestedExperiments: Array<{
    type: string;
    name: string;
    description: string;
    expectedImpact: string;
    priority: 'high' | 'medium' | 'low';
    estimatedDuration: number;
  }>;
  optimizationOpportunities: Array<{
    area: string;
    currentPerformance: number;
    potentialImprovement: number;
    suggestedAction: string;
  }>;
}

export class AIExperimentDashboard {
  private context: Context;
  private experimentService: AIExperimentService;

  constructor(context: Context) {
    this.context = context;
    this.experimentService = new AIExperimentService(context);
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const redis = this.context.redis;
      
      // Get all experiments
      const allExperimentIds = await redis.sMembers('all_experiments');
      const activeExperimentIds = await redis.sMembers('active_experiments:all');
      
      let completedExperiments = 0;
      let significantWins = 0;
      let totalDuration = 0;
      let totalUsersInExperiments = 0;
      const topPerformingVariants: any[] = [];

      for (const experimentId of allExperimentIds) {
        try {
          const experimentData = await redis.get(`experiment:${experimentId}`);
          if (!experimentData) continue;

          const experiment: ExperimentConfig = JSON.parse(experimentData);
          
          if (experiment.status === 'completed') {
            completedExperiments++;
            
            const duration = (experiment.endDate.getTime() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24);
            totalDuration += duration;

            // Get analysis results
            const analysisData = await redis.get(`experiment_analysis:${experimentId}`);
            if (analysisData) {
              const analysis: ExperimentAnalysis = JSON.parse(analysisData);
              
              if (analysis.statisticalSignificance) {
                significantWins++;
                
                if (analysis.winningVariant) {
                  const winningVariantData = experiment.variants.find(v => v.id === analysis.winningVariant);
                  const controlStats = Object.values(analysis.results)[0];
                  const winnerStats = analysis.results[analysis.winningVariant];
                  
                  const improvement = ((winnerStats.averageMetric / controlStats.averageMetric) - 1) * 100;
                  
                  topPerformingVariants.push({
                    experimentName: experiment.name,
                    variantName: winningVariantData?.name || analysis.winningVariant,
                    improvement,
                    confidence: analysis.confidence,
                  });
                }
              }
            }
          }

          // Count users in experiments
          const assignmentCount = await redis.hLen(`experiment_assignments:${experimentId}`);
          totalUsersInExperiments += assignmentCount;
        } catch (error) {
          console.error(`Error processing experiment ${experimentId}:`, error);
        }
      }

      // Sort top performing variants
      topPerformingVariants.sort((a, b) => b.improvement - a.improvement);

      return {
        totalExperiments: allExperimentIds.length,
        activeExperiments: activeExperimentIds.length,
        completedExperiments,
        significantWins,
        totalUsersInExperiments,
        averageExperimentDuration: completedExperiments > 0 ? totalDuration / completedExperiments : 0,
        topPerformingVariants: topPerformingVariants.slice(0, 5),
      };
    } catch (error) {
      console.error('Failed to get dashboard metrics:', error);
      return {
        totalExperiments: 0,
        activeExperiments: 0,
        completedExperiments: 0,
        significantWins: 0,
        totalUsersInExperiments: 0,
        averageExperimentDuration: 0,
        topPerformingVariants: [],
      };
    }
  }

  /**
   * Get summaries of all active experiments
   */
  async getActiveExperimentSummaries(): Promise<ExperimentSummary[]> {
    try {
      const activeExperiments = await this.experimentService.getActiveExperiments();
      const summaries: ExperimentSummary[] = [];

      for (const experiment of activeExperiments) {
        try {
          const summary = await this.createExperimentSummary(experiment);
          summaries.push(summary);
        } catch (error) {
          console.error(`Failed to create summary for experiment ${experiment.id}:`, error);
        }
      }

      return summaries.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Failed to get experiment summaries:', error);
      return [];
    }
  }

  /**
   * Get detailed experiment analysis
   */
  async getExperimentDetails(experimentId: string): Promise<{
    experiment: ExperimentConfig;
    analysis: ExperimentAnalysis;
    timeline: Array<{
      date: Date;
      event: string;
      description: string;
    }>;
    realTimeMetrics: Record<string, any>;
  } | null> {
    try {
      const redis = this.context.redis;
      
      const experimentData = await redis.get(`experiment:${experimentId}`);
      if (!experimentData) return null;

      const experiment: ExperimentConfig = JSON.parse(experimentData);
      
      // Get latest analysis
      const analysis = await this.experimentService.analyzeExperiment(experimentId);
      
      // Create timeline
      const timeline = [
        {
          date: experiment.startDate,
          event: 'Experiment Started',
          description: `${experiment.name} began with ${experiment.variants.length} variants`,
        },
      ];

      // Add analysis milestones
      if (analysis.statisticalSignificance) {
        timeline.push({
          date: new Date(),
          event: 'Statistical Significance Reached',
          description: `Winner: ${analysis.winningVariant || 'No clear winner'}`,
        });
      }

      // Get real-time metrics
      const realTimeMetrics = await this.getRealTimeMetrics(experimentId);

      return {
        experiment,
        analysis,
        timeline,
        realTimeMetrics,
      };
    } catch (error) {
      console.error('Failed to get experiment details:', error);
      return null;
    }
  }

  /**
   * Generate experiment recommendations based on current performance
   */
  async generateRecommendations(): Promise<RecommendationEngine> {
    try {
      const metrics = await this.getDashboardMetrics();
      const activeExperiments = await this.getActiveExperimentSummaries();
      
      const suggestedExperiments = await this.generateExperimentSuggestions(metrics, activeExperiments);
      const optimizationOpportunities = await this.identifyOptimizationOpportunities(metrics);

      return {
        suggestedExperiments,
        optimizationOpportunities,
      };
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return {
        suggestedExperiments: [],
        optimizationOpportunities: [],
      };
    }
  }

  /**
   * Auto-create experiments based on performance data
   */
  async autoCreateExperiments(): Promise<string[]> {
    try {
      const recommendations = await this.generateRecommendations();
      const createdExperiments: string[] = [];

      // Auto-create high-priority experiments
      for (const suggestion of recommendations.suggestedExperiments) {
        if (suggestion.priority === 'high') {
          try {
            let experimentId: string;

            switch (suggestion.type) {
              case 'validation':
                experimentId = await this.createValidationExperiment(suggestion);
                break;
              case 'challenge_generation':
                experimentId = await this.createChallengeExperiment(suggestion);
                break;
              case 'personalization':
                experimentId = await this.createPersonalizationExperiment(suggestion);
                break;
              case 'notification':
                experimentId = await this.createNotificationExperiment(suggestion);
                break;
              default:
                continue;
            }

            createdExperiments.push(experimentId);
            console.log(`Auto-created experiment: ${suggestion.name} (${experimentId})`);
          } catch (error) {
            console.error(`Failed to auto-create experiment ${suggestion.name}:`, error);
          }
        }
      }

      return createdExperiments;
    } catch (error) {
      console.error('Auto experiment creation failed:', error);
      return [];
    }
  }

  /**
   * Monitor experiments and auto-stop when appropriate
   */
  async monitorAndAutoStop(): Promise<Array<{
    experimentId: string;
    action: 'stopped' | 'extended' | 'no_action';
    reason: string;
  }>> {
    try {
      const activeExperiments = await this.experimentService.getActiveExperiments();
      const actions: Array<{ experimentId: string; action: 'stopped' | 'extended' | 'no_action'; reason: string }> = [];

      for (const experiment of activeExperiments) {
        try {
          const analysis = await this.experimentService.analyzeExperiment(experiment.id);
          const action = await this.determineExperimentAction(experiment, analysis);
          
          if (action.action === 'stopped') {
            await this.experimentService.stopExperiment(experiment.id, action.reason);
          }

          actions.push({
            experimentId: experiment.id,
            action: action.action,
            reason: action.reason,
          });
        } catch (error) {
          console.error(`Failed to monitor experiment ${experiment.id}:`, error);
        }
      }

      return actions;
    } catch (error) {
      console.error('Experiment monitoring failed:', error);
      return [];
    }
  }

  /**
   * Generate experiment performance report
   */
  async generatePerformanceReport(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    summary: {
      experimentsRun: number;
      significantResults: number;
      averageImprovement: number;
      totalUserImpact: number;
    };
    topWins: Array<{
      experimentName: string;
      improvement: number;
      userImpact: number;
      businessValue: string;
    }>;
    learnings: string[];
    recommendations: string[];
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      const redis = this.context.redis;
      const allExperimentIds = await redis.sMembers('all_experiments');
      
      let experimentsRun = 0;
      let significantResults = 0;
      let totalImprovement = 0;
      let improvementCount = 0;
      const topWins: any[] = [];
      const learnings: string[] = [];

      for (const experimentId of allExperimentIds) {
        try {
          const experimentData = await redis.get(`experiment:${experimentId}`);
          if (!experimentData) continue;

          const experiment: ExperimentConfig = JSON.parse(experimentData);
          
          // Check if experiment was in our timeframe
          if (experiment.startDate < startDate) continue;
          
          experimentsRun++;

          const analysisData = await redis.get(`experiment_analysis:${experimentId}`);
          if (analysisData) {
            const analysis: ExperimentAnalysis = JSON.parse(analysisData);
            
            if (analysis.statisticalSignificance) {
              significantResults++;
              
              if (analysis.winningVariant) {
                const controlStats = Object.values(analysis.results)[0];
                const winnerStats = analysis.results[analysis.winningVariant];
                const improvement = ((winnerStats.averageMetric / controlStats.averageMetric) - 1) * 100;
                
                totalImprovement += improvement;
                improvementCount++;

                topWins.push({
                  experimentName: experiment.name,
                  improvement,
                  userImpact: winnerStats.sampleSize,
                  businessValue: this.calculateBusinessValue(experiment.type, improvement),
                });
              }
            }

            // Extract learnings
            learnings.push(...analysis.recommendations);
          }
        } catch (error) {
          console.error(`Error processing experiment ${experimentId} for report:`, error);
        }
      }

      const averageImprovement = improvementCount > 0 ? totalImprovement / improvementCount : 0;
      const totalUserImpact = topWins.reduce((sum, win) => sum + win.userImpact, 0);

      // Sort top wins by improvement
      topWins.sort((a, b) => b.improvement - a.improvement);

      // Generate recommendations
      const recommendations = this.generateReportRecommendations(
        experimentsRun,
        significantResults,
        averageImprovement
      );

      return {
        summary: {
          experimentsRun,
          significantResults,
          averageImprovement,
          totalUserImpact,
        },
        topWins: topWins.slice(0, 5),
        learnings: [...new Set(learnings)].slice(0, 10), // Unique learnings
        recommendations,
      };
    } catch (error) {
      console.error('Failed to generate performance report:', error);
      return {
        summary: {
          experimentsRun: 0,
          significantResults: 0,
          averageImprovement: 0,
          totalUserImpact: 0,
        },
        topWins: [],
        learnings: [],
        recommendations: ['Unable to generate report due to error'],
      };
    }
  }

  private async createExperimentSummary(experiment: ExperimentConfig): Promise<ExperimentSummary> {
    const redis = this.context.redis;
    
    // Get participant count
    const participantCount = await redis.hLen(`experiment_assignments:${experiment.id}`);
    
    // Get latest analysis
    const analysis = await this.experimentService.analyzeExperiment(experiment.id);
    
    // Calculate days remaining
    const daysRemaining = Math.max(0, Math.ceil(
      (experiment.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));

    // Get key metrics
    const keyMetrics: Record<string, number> = {};
    for (const variant of experiment.variants) {
      const metricsKey = `experiment_metrics:${experiment.id}:${variant.id}`;
      const totalEvents = await redis.hGet(metricsKey, 'total_events');
      const successEvents = await redis.hGet(metricsKey, 'success_events');
      
      if (totalEvents && successEvents) {
        keyMetrics[`${variant.name}_conversion`] = parseInt(successEvents) / parseInt(totalEvents);
      }
    }

    return {
      id: experiment.id,
      name: experiment.name,
      type: experiment.type,
      status: experiment.status,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
      participantCount,
      currentWinner: analysis.winningVariant,
      confidence: analysis.confidence,
      daysRemaining,
      keyMetrics,
    };
  }

  private async getRealTimeMetrics(experimentId: string): Promise<Record<string, any>> {
    const redis = this.context.redis;
    const experiment = await redis.get(`experiment:${experimentId}`);
    
    if (!experiment) return {};

    const experimentConfig: ExperimentConfig = JSON.parse(experiment);
    const metrics: Record<string, any> = {};

    for (const variant of experimentConfig.variants) {
      const metricsKey = `experiment_metrics:${experimentId}:${variant.id}`;
      const variantMetrics = await redis.hGetAll(metricsKey);
      
      metrics[variant.id] = {
        totalEvents: parseInt(variantMetrics.total_events || '0'),
        successEvents: parseInt(variantMetrics.success_events || '0'),
        conversionRate: variantMetrics.total_events ? 
          parseInt(variantMetrics.success_events || '0') / parseInt(variantMetrics.total_events) : 0,
      };

      // Add custom metrics
      for (const [key, value] of Object.entries(variantMetrics)) {
        if (key.startsWith('sum_')) {
          const metricName = key.replace('sum_', '');
          const totalEvents = parseInt(variantMetrics.total_events || '1');
          metrics[variant.id][`avg_${metricName}`] = parseFloat(value) / totalEvents;
        }
      }
    }

    return metrics;
  }

  private async generateExperimentSuggestions(
    metrics: DashboardMetrics,
    activeExperiments: ExperimentSummary[]
  ): Promise<Array<{
    type: string;
    name: string;
    description: string;
    expectedImpact: string;
    priority: 'high' | 'medium' | 'low';
    estimatedDuration: number;
  }>> {
    const suggestions: any[] = [];

    // Check if we need validation experiments
    const hasValidationExperiment = activeExperiments.some(e => e.type === 'validation');
    if (!hasValidationExperiment) {
      suggestions.push({
        type: 'validation',
        name: 'Validation Threshold Optimization',
        description: 'Test different AI validation thresholds to optimize accuracy vs efficiency',
        expectedImpact: '15-25% improvement in processing efficiency',
        priority: 'high' as const,
        estimatedDuration: 14,
      });
    }

    // Check if we need personalization experiments
    const hasPersonalizationExperiment = activeExperiments.some(e => e.type === 'personalization');
    if (!hasPersonalizationExperiment && metrics.totalUsersInExperiments > 100) {
      suggestions.push({
        type: 'personalization',
        name: 'Recommendation Algorithm Test',
        description: 'Compare different personalization algorithms for challenge recommendations',
        expectedImpact: '20-30% improvement in engagement',
        priority: 'high' as const,
        estimatedDuration: 21,
      });
    }

    // Suggest notification experiments
    const hasNotificationExperiment = activeExperiments.some(e => e.type === 'notification');
    if (!hasNotificationExperiment) {
      suggestions.push({
        type: 'notification',
        name: 'Notification Timing Optimization',
        description: 'Test optimal times and frequencies for user notifications',
        expectedImpact: '10-20% improvement in open rates',
        priority: 'medium' as const,
        estimatedDuration: 14,
      });
    }

    // Suggest challenge generation experiments
    if (metrics.significantWins < 2) {
      suggestions.push({
        type: 'challenge_generation',
        name: 'AI Challenge Generation Strategy',
        description: 'Test different AI models and prompts for challenge creation',
        expectedImpact: '25-40% improvement in challenge engagement',
        priority: 'medium' as const,
        estimatedDuration: 28,
      });
    }

    return suggestions;
  }

  private async identifyOptimizationOpportunities(
    metrics: DashboardMetrics
  ): Promise<Array<{
    area: string;
    currentPerformance: number;
    potentialImprovement: number;
    suggestedAction: string;
  }>> {
    const opportunities: any[] = [];

    // Check experiment success rate
    const successRate = metrics.completedExperiments > 0 ? 
      metrics.significantWins / metrics.completedExperiments : 0;

    if (successRate < 0.3) {
      opportunities.push({
        area: 'Experiment Design',
        currentPerformance: successRate,
        potentialImprovement: 0.5,
        suggestedAction: 'Improve experiment design and hypothesis formation',
      });
    }

    // Check average experiment duration
    if (metrics.averageExperimentDuration > 30) {
      opportunities.push({
        area: 'Experiment Duration',
        currentPerformance: metrics.averageExperimentDuration,
        potentialImprovement: 21,
        suggestedAction: 'Optimize sample sizes and significance thresholds',
      });
    }

    // Check user participation
    if (metrics.totalUsersInExperiments < 1000) {
      opportunities.push({
        area: 'User Participation',
        currentPerformance: metrics.totalUsersInExperiments,
        potentialImprovement: 2000,
        suggestedAction: 'Expand experiment targeting and user base',
      });
    }

    return opportunities;
  }

  private async determineExperimentAction(
    experiment: ExperimentConfig,
    analysis: ExperimentAnalysis
  ): Promise<{ action: 'stopped' | 'extended' | 'no_action'; reason: string }> {
    // Stop if statistically significant and confident
    if (analysis.statisticalSignificance && analysis.confidence > 0.95) {
      return {
        action: 'stopped',
        reason: `Statistical significance reached with ${(analysis.confidence * 100).toFixed(1)}% confidence`,
      };
    }

    // Stop if experiment has run too long without results
    const daysSinceStart = (Date.now() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceStart > 60 && !analysis.statisticalSignificance) {
      return {
        action: 'stopped',
        reason: 'Experiment ran for 60+ days without significant results',
      };
    }

    // Stop if past end date
    if (Date.now() > experiment.endDate.getTime()) {
      return {
        action: 'stopped',
        reason: 'Experiment reached scheduled end date',
      };
    }

    return { action: 'no_action', reason: 'Experiment continuing as planned' };
  }

  private calculateBusinessValue(experimentType: string, improvement: number): string {
    const impactMap = {
      validation: 'Processing efficiency',
      challenge_generation: 'Content creation cost',
      personalization: 'User engagement',
      notification: 'User retention',
    };

    const impact = impactMap[experimentType as keyof typeof impactMap] || 'System performance';
    return `${improvement.toFixed(1)}% improvement in ${impact}`;
  }

  private generateReportRecommendations(
    experimentsRun: number,
    significantResults: number,
    averageImprovement: number
  ): string[] {
    const recommendations: string[] = [];

    if (experimentsRun < 5) {
      recommendations.push('Increase experiment velocity to gather more insights');
    }

    const successRate = experimentsRun > 0 ? significantResults / experimentsRun : 0;
    if (successRate < 0.3) {
      recommendations.push('Focus on stronger hypotheses and larger effect sizes');
    }

    if (averageImprovement < 10) {
      recommendations.push('Target higher-impact optimization opportunities');
    }

    if (significantResults > 0) {
      recommendations.push('Implement winning variants to capture business value');
    }

    return recommendations;
  }

  // Helper methods for auto-creating experiments
  private async createValidationExperiment(suggestion: any): Promise<string> {
    return await this.experimentService.createValidationExperiment(
      suggestion.name,
      [
        { approve: 0.8, reject: 0.2 },
        { approve: 0.85, reject: 0.3 },
        { approve: 0.9, reject: 0.4 },
      ]
    );
  }

  private async createChallengeExperiment(suggestion: any): Promise<string> {
    return await this.experimentService.createChallengeGenerationExperiment(
      suggestion.name,
      [
        { name: 'Creative', aiModel: 'llama-2-7b', temperature: 0.8, promptStyle: 'creative' },
        { name: 'Structured', aiModel: 'llama-2-7b', temperature: 0.3, promptStyle: 'structured' },
      ]
    );
  }

  private async createPersonalizationExperiment(suggestion: any): Promise<string> {
    return await this.experimentService.createPersonalizationExperiment(
      suggestion.name,
      [
        { name: 'Collaborative', algorithm: 'collaborative_filtering', features: ['completion_history', 'ratings'], updateFrequency: 'daily' },
        { name: 'Content-based', algorithm: 'content_based', features: ['categories', 'difficulty'], updateFrequency: 'realtime' },
      ]
    );
  }

  private async createNotificationExperiment(suggestion: any): Promise<string> {
    return await this.experimentService.createNotificationExperiment(
      suggestion.name,
      [
        { name: 'Morning', times: ['09:00', '10:00'], frequency: 'daily', personalized: false },
        { name: 'Evening', times: ['18:00', '19:00'], frequency: 'daily', personalized: false },
        { name: 'Personalized', times: ['varies'], frequency: 'optimal', personalized: true },
      ]
    );
  }
}