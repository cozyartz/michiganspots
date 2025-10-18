import { Context } from '@devvit/public-api';
import { AIOrchestrator } from '../services/aiOrchestrator.js';
import { AIExperimentService } from '../services/aiExperimentService.js';
import { AIExperimentDashboard } from '../services/aiExperimentDashboard.js';

/**
 * Comprehensive A/B Testing Examples for AI Automation
 */

// Initialize services
let aiOrchestrator: AIOrchestrator;
let experimentService: AIExperimentService;
let experimentDashboard: AIExperimentDashboard;

export function initializeExperimentSystem(context: Context) {
  aiOrchestrator = new AIOrchestrator(context);
  experimentService = new AIExperimentService(context);
  experimentDashboard = new AIExperimentDashboard(context);
}

/**
 * Example 1: Validation Threshold A/B Test
 * Test different AI validation thresholds to optimize accuracy vs efficiency
 */
export async function runValidationThresholdExperiment(context: Context) {
  try {
    console.log('🧪 Starting Validation Threshold A/B Test...');
    
    // Create experiment with different threshold configurations
    const experimentId = await experimentService.createValidationExperiment(
      'Validation Threshold Optimization v2.0',
      [
        { approve: 0.80, reject: 0.25 }, // More lenient - faster processing
        { approve: 0.85, reject: 0.30 }, // Current baseline
        { approve: 0.90, reject: 0.35 }, // More strict - higher accuracy
      ]
    );
    
    console.log(`✅ Created validation experiment: ${experimentId}`);
    
    // Simulate processing submissions with different thresholds
    const testSubmissions = await getTestSubmissions();
    
    for (const { submission, challenge, userId } of testSubmissions) {
      const result = await aiOrchestrator.processSubmissionWithAI(
        submission,
        challenge,
        userId
      );
      
      console.log(`User ${userId} - Variant: ${result.experimentVariant}, Approved: ${result.approved}, Confidence: ${result.confidence}`);
    }
    
    // Check results after some time
    setTimeout(async () => {
      const analysis = await experimentService.analyzeExperiment(experimentId);
      console.log('📊 Validation Experiment Results:', {
        status: analysis.status,
        winner: analysis.winningVariant,
        confidence: analysis.confidence,
        recommendations: analysis.recommendations,
      });
    }, 5000);
    
    return experimentId;
  } catch (error) {
    console.error('Validation experiment failed:', error);
    throw error;
  }
}

/**
 * Example 2: Challenge Generation Strategy A/B Test
 * Test different AI models and prompts for challenge creation
 */
export async function runChallengeGenerationExperiment(context: Context) {
  try {
    console.log('🎯 Starting Challenge Generation A/B Test...');
    
    const experimentId = await experimentService.createChallengeGenerationExperiment(
      'AI Challenge Generation Strategy Test',
      [
        {
          name: 'Creative High-Temperature',
          aiModel: '@cf/meta/llama-2-7b-chat-int8',
          temperature: 0.8,
          promptStyle: 'creative_storytelling',
        },
        {
          name: 'Structured Low-Temperature',
          aiModel: '@cf/meta/llama-2-7b-chat-int8',
          temperature: 0.3,
          promptStyle: 'structured_business',
        },
        {
          name: 'Balanced Approach',
          aiModel: '@cf/meta/llama-2-7b-chat-int8',
          temperature: 0.5,
          promptStyle: 'balanced_engaging',
        },
      ]
    );
    
    console.log(`✅ Created challenge generation experiment: ${experimentId}`);
    
    // Generate challenges using different strategies
    const testBusinesses = await getTestBusinesses();
    
    for (const business of testBusinesses) {
      const result = await aiOrchestrator.generateChallengeWithExperiment(business);
      
      console.log(`Generated challenge: "${result.challenge.title}" using ${result.generationStrategy}`);
      
      // Simulate user engagement (in real app, this would come from actual user interactions)
      await simulateUserEngagement(result.challenge, experimentId, result.experimentVariant);
    }
    
    return experimentId;
  } catch (error) {
    console.error('Challenge generation experiment failed:', error);
    throw error;
  }
}

/**
 * Example 3: Personalization Algorithm A/B Test
 * Compare different recommendation algorithms
 */
export async function runPersonalizationExperiment(context: Context) {
  try {
    console.log('🎨 Starting Personalization Algorithm A/B Test...');
    
    const experimentId = await experimentService.createPersonalizationExperiment(
      'Recommendation Algorithm Comparison',
      [
        {
          name: 'Collaborative Filtering',
          algorithm: 'collaborative_filtering',
          features: ['completion_history', 'user_ratings', 'similar_users'],
          updateFrequency: 'daily',
        },
        {
          name: 'Content-Based Filtering',
          algorithm: 'content_based',
          features: ['business_category', 'difficulty_level', 'location_proximity'],
          updateFrequency: 'realtime',
        },
        {
          name: 'Hybrid Approach',
          algorithm: 'hybrid',
          features: ['completion_history', 'business_category', 'user_ratings', 'location_proximity'],
          updateFrequency: 'hourly',
        },
      ]
    );
    
    console.log(`✅ Created personalization experiment: ${experimentId}`);
    
    // Test personalized recommendations for different users
    const testUsers = await getTestUsers();
    const availableChallenges = await getAvailableChallenges();
    
    for (const user of testUsers) {
      const result = await aiOrchestrator.getPersonalizedRecommendationsWithExperiments(
        user.userId,
        user,
        availableChallenges
      );
      
      console.log(`User ${user.userId} - Algorithm: ${result.experimentVariant}, Recommendations: ${result.recommendations.length}`);
      
      // Simulate user interactions with recommendations
      await simulateRecommendationInteractions(user.userId, result.recommendations, experimentId, result.experimentVariant);
    }
    
    return experimentId;
  } catch (error) {
    console.error('Personalization experiment failed:', error);
    throw error;
  }
}

/**
 * Example 4: Notification Timing A/B Test
 * Optimize when and how often to send notifications
 */
export async function runNotificationTimingExperiment(context: Context) {
  try {
    console.log('📱 Starting Notification Timing A/B Test...');
    
    const experimentId = await experimentService.createNotificationExperiment(
      'Optimal Notification Timing Test',
      [
        {
          name: 'Morning Focus',
          times: ['09:00', '10:30'],
          frequency: 'daily',
          personalized: false,
        },
        {
          name: 'Evening Focus',
          times: ['18:00', '19:30'],
          frequency: 'daily',
          personalized: false,
        },
        {
          name: 'AI-Personalized',
          times: ['varies'],
          frequency: 'optimal',
          personalized: true,
        },
        {
          name: 'Weekend Special',
          times: ['11:00', '15:00'],
          frequency: 'weekend_only',
          personalized: false,
        },
      ]
    );
    
    console.log(`✅ Created notification experiment: ${experimentId}`);
    
    // Test notification sending for different users
    const testUsers = await getTestUsers();
    
    for (const user of testUsers) {
      const result = await aiOrchestrator.sendNotificationWithExperiment(
        user.userId,
        'new_challenge',
        'New treasure hunt challenge available near you!'
      );
      
      console.log(`User ${user.userId} - Variant: ${result.experimentVariant}, Sent: ${result.sent}, Timing: ${result.timing}`);
      
      // Simulate user response to notification
      await simulateNotificationResponse(user.userId, result.sent, experimentId, result.experimentVariant);
    }
    
    return experimentId;
  } catch (error) {
    console.error('Notification experiment failed:', error);
    throw error;
  }
}

/**
 * Example 5: Multi-Experiment Dashboard Management
 * Monitor and manage multiple experiments simultaneously
 */
export async function manageDashboardExperiments(context: Context) {
  try {
    console.log('📊 Managing A/B Testing Dashboard...');
    
    // Get comprehensive dashboard data
    const dashboard = await aiOrchestrator.getExperimentDashboard();
    
    console.log('Dashboard Metrics:', {
      totalExperiments: dashboard.metrics.totalExperiments,
      activeExperiments: dashboard.metrics.activeExperiments,
      significantWins: dashboard.metrics.significantWins,
      topPerformers: dashboard.metrics.topPerformingVariants?.slice(0, 3),
    });
    
    // Display active experiments
    console.log('\n🔬 Active Experiments:');
    for (const experiment of dashboard.activeExperiments) {
      console.log(`- ${experiment.name} (${experiment.type})`);
      console.log(`  Status: ${experiment.status}, Confidence: ${(experiment.confidence * 100).toFixed(1)}%`);
      console.log(`  Participants: ${experiment.participantCount}, Days Remaining: ${experiment.daysRemaining}`);
      
      if (experiment.currentWinner) {
        console.log(`  🏆 Current Winner: ${experiment.currentWinner}`);
      }
    }
    
    // Show recommendations for new experiments
    console.log('\n💡 Experiment Recommendations:');
    for (const suggestion of dashboard.recommendations.suggestedExperiments) {
      console.log(`- ${suggestion.name} (${suggestion.priority} priority)`);
      console.log(`  Expected Impact: ${suggestion.expectedImpact}`);
      console.log(`  Duration: ${suggestion.estimatedDuration} days`);
    }
    
    // Show optimization opportunities
    console.log('\n🎯 Optimization Opportunities:');
    for (const opportunity of dashboard.recommendations.optimizationOpportunities) {
      console.log(`- ${opportunity.area}: ${opportunity.suggestedAction}`);
      console.log(`  Current: ${opportunity.currentPerformance}, Potential: ${opportunity.potentialImprovement}`);
    }
    
    // Generate performance report
    console.log('\n📈 Performance Report:');
    const report = dashboard.performanceReport;
    console.log(`Experiments Run: ${report.summary.experimentsRun}`);
    console.log(`Significant Results: ${report.summary.significantResults}`);
    console.log(`Average Improvement: ${report.summary.averageImprovement?.toFixed(1)}%`);
    console.log(`User Impact: ${report.summary.totalUserImpact} users`);
    
    // Show top wins
    if (report.topWins?.length > 0) {
      console.log('\n🏆 Top Experiment Wins:');
      for (const win of report.topWins.slice(0, 3)) {
        console.log(`- ${win.experimentName}: ${win.improvement.toFixed(1)}% improvement`);
        console.log(`  Business Value: ${win.businessValue}`);
      }
    }
    
    return dashboard;
  } catch (error) {
    console.error('Dashboard management failed:', error);
    throw error;
  }
}

/**
 * Example 6: Automated Experiment Lifecycle
 * Demonstrate full automation of experiment creation, monitoring, and optimization
 */
export async function runAutomatedExperimentLifecycle(context: Context) {
  try {
    console.log('🤖 Starting Automated Experiment Lifecycle...');
    
    // 1. Auto-create experiments based on performance data
    const createdExperiments = await experimentDashboard.autoCreateExperiments();
    console.log(`✅ Auto-created ${createdExperiments.length} experiments:`, createdExperiments);
    
    // 2. Monitor and auto-stop experiments
    const monitoringResults = await experimentDashboard.monitorAndAutoStop();
    console.log('📊 Monitoring Results:');
    for (const result of monitoringResults) {
      console.log(`- Experiment ${result.experimentId}: ${result.action} (${result.reason})`);
    }
    
    // 3. Generate recommendations for optimization
    const recommendations = await experimentDashboard.generateRecommendations();
    console.log('\n💡 System Recommendations:');
    console.log('Suggested Experiments:', recommendations.suggestedExperiments.length);
    console.log('Optimization Opportunities:', recommendations.optimizationOpportunities.length);
    
    // 4. Create custom experiment based on specific needs
    const customExperimentId = await aiOrchestrator.createExperiment(
      'validation',
      'Custom Validation Optimization',
      [
        {
          name: 'Ultra Conservative',
          description: 'Very high thresholds for maximum accuracy',
          config: { autoApproveThreshold: 0.95, autoRejectThreshold: 0.40 },
        },
        {
          name: 'Balanced Efficiency',
          description: 'Balanced approach for good accuracy and speed',
          config: { autoApproveThreshold: 0.85, autoRejectThreshold: 0.30 },
        },
      ],
      {
        duration: 21, // 3 weeks
        minimumSampleSize: 200,
      }
    );
    
    console.log(`✅ Created custom experiment: ${customExperimentId}`);
    
    return {
      createdExperiments,
      monitoringResults,
      recommendations,
      customExperimentId,
    };
  } catch (error) {
    console.error('Automated experiment lifecycle failed:', error);
    throw error;
  }
}

/**
 * Example 7: Real-time Experiment Monitoring
 * Monitor experiments in real-time and react to results
 */
export async function monitorExperimentsRealTime(context: Context) {
  try {
    console.log('⏱️ Starting Real-time Experiment Monitoring...');
    
    const activeExperiments = await experimentService.getActiveExperiments();
    
    for (const experiment of activeExperiments) {
      // Get detailed experiment information
      const details = await experimentDashboard.getExperimentDetails(experiment.id);
      
      if (details) {
        console.log(`\n🔬 Experiment: ${details.experiment.name}`);
        console.log(`Status: ${details.analysis.status}`);
        console.log(`Confidence: ${(details.analysis.confidence * 100).toFixed(1)}%`);
        
        // Show real-time metrics
        console.log('Real-time Metrics:');
        for (const [variantId, metrics] of Object.entries(details.realTimeMetrics)) {
          const variant = details.experiment.variants.find(v => v.id === variantId);
          console.log(`  ${variant?.name}: ${JSON.stringify(metrics)}`);
        }
        
        // Check if experiment should be stopped
        if (details.analysis.statisticalSignificance && details.analysis.confidence > 0.95) {
          console.log(`🏆 Experiment has significant winner: ${details.analysis.winningVariant}`);
          console.log('Recommendations:', details.analysis.recommendations);
          
          // Auto-stop the experiment
          await experimentService.stopExperiment(
            experiment.id,
            `Auto-stopped: Statistical significance reached with ${(details.analysis.confidence * 100).toFixed(1)}% confidence`
          );
          
          console.log('✅ Experiment automatically stopped and results finalized');
        }
      }
    }
    
    return activeExperiments.length;
  } catch (error) {
    console.error('Real-time monitoring failed:', error);
    throw error;
  }
}

// Helper functions for testing (you'd replace these with real data)

async function getTestSubmissions(): Promise<Array<{ submission: any; challenge: any; userId: string }>> {
  return [
    {
      submission: { proofImageUrl: 'https://example.com/image1.jpg', gpsLocation: { lat: 42.3601, lng: -71.0589 } },
      challenge: { id: 'test1', partnerInfo: { businessName: 'Test Restaurant' }, location: { lat: 42.3601, lng: -71.0589 } },
      userId: 'user1',
    },
    {
      submission: { proofImageUrl: 'https://example.com/image2.jpg', gpsLocation: { lat: 42.3602, lng: -71.0590 } },
      challenge: { id: 'test2', partnerInfo: { businessName: 'Test Cafe' }, location: { lat: 42.3602, lng: -71.0590 } },
      userId: 'user2',
    },
  ];
}

async function getTestBusinesses(): Promise<any[]> {
  return [
    {
      name: 'Downtown Deli',
      category: 'restaurant',
      location: { lat: 42.3601, lng: -71.0589 },
      description: 'Popular lunch spot in downtown',
    },
    {
      name: 'Corner Bookstore',
      category: 'retail',
      location: { lat: 42.3605, lng: -71.0595 },
      description: 'Independent bookstore with local authors',
    },
  ];
}

async function getTestUsers(): Promise<any[]> {
  return [
    {
      userId: 'user1',
      stats: { completionRate: 0.8, totalPoints: 150 },
      preferences: { categories: ['restaurant', 'cafe'] },
    },
    {
      userId: 'user2',
      stats: { completionRate: 0.6, totalPoints: 75 },
      preferences: { categories: ['retail', 'entertainment'] },
    },
  ];
}

async function getAvailableChallenges(): Promise<any[]> {
  return [
    { id: 'c1', title: 'Coffee Challenge', partnerInfo: { category: 'cafe' } },
    { id: 'c2', title: 'Shopping Quest', partnerInfo: { category: 'retail' } },
    { id: 'c3', title: 'Dinner Adventure', partnerInfo: { category: 'restaurant' } },
  ];
}

async function simulateUserEngagement(challenge: any, experimentId: string, variantId?: string): Promise<void> {
  if (!variantId) return;
  
  // Simulate random engagement metrics
  const engagementRate = Math.random();
  const completionRate = Math.random() * 0.8;
  const userRating = 3 + Math.random() * 2; // 3-5 stars
  
  await experimentService.recordExperimentResult({
    experimentId,
    variant: variantId,
    userId: 'system',
    timestamp: new Date(),
    metrics: {
      engagement_rate: engagementRate,
      completion_rate: completionRate,
      user_rating: userRating,
    },
    outcome: completionRate > 0.5 ? 'success' : 'failure',
  });
}

async function simulateRecommendationInteractions(
  userId: string,
  recommendations: any[],
  experimentId: string,
  variantId?: string
): Promise<void> {
  if (!variantId) return;
  
  // Simulate user clicking on recommendations
  const clickThroughRate = Math.random() * 0.4; // 0-40% CTR
  const completionRate = Math.random() * 0.6; // 0-60% completion
  const sessionLength = 5 + Math.random() * 20; // 5-25 minutes
  
  await experimentService.recordExperimentResult({
    experimentId,
    variant: variantId,
    userId,
    timestamp: new Date(),
    metrics: {
      click_through_rate: clickThroughRate,
      completion_rate: completionRate,
      session_length: sessionLength,
      recommendations_shown: recommendations.length,
    },
    outcome: clickThroughRate > 0.2 ? 'success' : 'failure',
  });
}

async function simulateNotificationResponse(
  userId: string,
  sent: boolean,
  experimentId: string,
  variantId?: string
): Promise<void> {
  if (!variantId || !sent) return;
  
  // Simulate notification response metrics
  const openRate = Math.random() * 0.6; // 0-60% open rate
  const clickRate = openRate * Math.random() * 0.5; // 0-30% click rate
  const conversionRate = clickRate * Math.random() * 0.3; // 0-9% conversion
  
  await experimentService.recordExperimentResult({
    experimentId,
    variant: variantId,
    userId,
    timestamp: new Date(),
    metrics: {
      open_rate: openRate,
      click_rate: clickRate,
      conversion_rate: conversionRate,
      notification_sent: 1,
    },
    outcome: conversionRate > 0.05 ? 'success' : 'failure',
  });
}