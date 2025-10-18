import { Context } from '@devvit/public-api';
import { AIOrchestrator } from '../services/aiOrchestrator.js';
import { Challenge, Submission, UserProfile } from '../types/index.js';

/**
 * Example integration showing how to use AI services in your treasure hunt game
 */

// Initialize AI orchestrator (do this once in your app)
let aiOrchestrator: AIOrchestrator;

export function initializeAI(context: Context) {
  aiOrchestrator = new AIOrchestrator(context, {
    enableAutoValidation: true,
    enableChallengeGeneration: true,
    enablePersonalization: true,
    validationThresholds: {
      autoApprove: 0.85, // 85% confidence for auto-approval
      autoReject: 0.3,   // Below 30% confidence gets rejected
    },
    challengeGeneration: {
      frequency: 'weekly',
      maxPerBusiness: 3,
      seasonalAdjustment: true,
    },
  });
}

/**
 * Example 1: AI-Enhanced Submission Processing
 * Replace your existing submission handler with this AI-powered version
 */
export async function handleSubmissionWithAI(
  submission: Submission,
  challenge: Challenge,
  userId: string,
  context: Context
): Promise<{
  status: 'approved' | 'rejected' | 'manual_review';
  message: string;
  nextChallenges?: Challenge[];
}> {
  try {
    // Process submission with full AI pipeline
    const result = await aiOrchestrator.processSubmissionWithAI(
      submission,
      challenge,
      userId
    );

    if (result.approved) {
      // Award points, update leaderboard, etc.
      await awardPoints(userId, challenge.pointsReward);
      await updateUserStats(userId, challenge);
      
      return {
        status: 'approved',
        message: `Great job! ${result.reasoning}`,
        nextChallenges: result.nextRecommendations,
      };
    } else {
      return {
        status: result.confidence < 0.3 ? 'rejected' : 'manual_review',
        message: result.reasoning,
      };
    }
  } catch (error) {
    console.error('AI submission processing failed:', error);
    return {
      status: 'manual_review',
      message: 'Unable to process automatically - manual review required',
    };
  }
}

/**
 * Example 2: Automated Challenge Generation
 * Run this weekly to generate fresh challenges
 */
export async function generateWeeklyChallenges(context: Context) {
  try {
    // Get active partner businesses
    const businesses = await getPartnerBusinesses();
    
    // Generate AI-powered challenges
    const newChallenges = await aiOrchestrator.autoGenerateChallenges(businesses, 10);
    
    console.log(`Generated ${newChallenges.length} new challenges`);
    
    // Publish challenges to your system
    for (const challenge of newChallenges) {
      await publishChallenge(challenge);
      
      // Notify relevant users about new challenges
      await notifyUsersAboutNewChallenge(challenge);
    }
    
    return newChallenges;
  } catch (error) {
    console.error('Weekly challenge generation failed:', error);
    return [];
  }
}

/**
 * Example 3: Personalized User Experience
 * Call this when user opens the app or views challenges
 */
export async function getPersonalizedExperience(
  userId: string,
  context: Context
): Promise<{
  recommendedChallenges: Challenge[];
  personalizedMessage: string;
  optimalNotificationTime: string;
  engagementPrediction: any;
}> {
  try {
    // Get AI-optimized user experience
    const optimization = await aiOrchestrator.optimizeUserExperience(userId);
    
    // Generate personalized welcome message
    const personalizedMessage = generateWelcomeMessage(
      optimization.engagementPrediction,
      optimization.personalizedChallenges.length
    );
    
    return {
      recommendedChallenges: optimization.personalizedChallenges,
      personalizedMessage,
      optimalNotificationTime: optimization.notificationStrategy.optimalTimes[0],
      engagementPrediction: optimization.engagementPrediction,
    };
  } catch (error) {
    console.error('Personalization failed:', error);
    
    // Fallback to basic experience
    return {
      recommendedChallenges: await getPopularChallenges(),
      personalizedMessage: 'Welcome back! Check out these popular challenges.',
      optimalNotificationTime: '18:00',
      engagementPrediction: null,
    };
  }
}

/**
 * Example 4: Smart Notification System
 * Use AI to optimize when and how to notify users
 */
export async function sendSmartNotification(
  userId: string,
  notificationType: 'new_challenge' | 'reminder' | 'achievement',
  context: Context
) {
  try {
    // Get user's personalized notification strategy
    const userProfile = await getUserProfile(userId);
    const insights = await getPersonalizationInsights(userId);
    
    if (!insights) return; // Skip if no insights available
    
    const notificationStrategy = await aiOrchestrator.personalizationService.optimizeNotifications(
      userId,
      insights,
      await getNotificationHistory(userId)
    );
    
    // Check if it's optimal time to send notification
    const currentHour = new Date().getHours();
    const optimalHours = notificationStrategy.optimalTimes.map(time => 
      parseInt(time.split(':')[0])
    );
    
    const isOptimalTime = optimalHours.some(hour => 
      Math.abs(currentHour - hour) <= 1
    );
    
    if (!isOptimalTime && notificationType !== 'achievement') {
      // Schedule for later
      await scheduleNotification(userId, notificationType, notificationStrategy.optimalTimes[0]);
      return;
    }
    
    // Personalize message based on user preferences
    const message = personalizeNotificationMessage(
      notificationType,
      notificationStrategy.messagePersonalization,
      userProfile
    );
    
    // Send through preferred channels
    for (const channel of notificationStrategy.channels) {
      await sendNotification(userId, message, channel);
    }
    
  } catch (error) {
    console.error('Smart notification failed:', error);
    // Fallback to basic notification
    await sendBasicNotification(userId, notificationType);
  }
}

/**
 * Example 5: Fraud Detection Enhancement
 * Integrate AI fraud detection with your existing validation
 */
export async function validateSubmissionWithAI(
  submission: Submission,
  challenge: Challenge,
  userId: string,
  context: Context
): Promise<{
  isValid: boolean;
  confidence: number;
  fraudFlags: string[];
  recommendation: string;
}> {
  try {
    // Use AI validation service
    const validationResult = await aiOrchestrator.validationService.validateSubmission(
      submission,
      challenge,
      userId
    );
    
    return {
      isValid: validationResult.isValid,
      confidence: validationResult.confidence,
      fraudFlags: validationResult.fraudCheck.flags,
      recommendation: validationResult.reviewReason || 'Validation completed',
    };
  } catch (error) {
    console.error('AI validation failed:', error);
    return {
      isValid: false,
      confidence: 0,
      fraudFlags: ['validation_error'],
      recommendation: 'Manual review required due to system error',
    };
  }
}

/**
 * Example 6: Performance Monitoring
 * Monitor AI performance and optimize automatically
 */
export async function monitorAIPerformance(context: Context) {
  try {
    const monitoring = await aiOrchestrator.monitorAndOptimize();
    
    console.log(`AI Performance Score: ${monitoring.performanceScore}`);
    
    // Log optimizations applied
    if (monitoring.optimizationsApplied.length > 0) {
      console.log('AI Optimizations Applied:', monitoring.optimizationsApplied);
    }
    
    // Handle recommendations
    if (monitoring.recommendations.length > 0) {
      console.log('AI Recommendations:', monitoring.recommendations);
      
      // You could send alerts or create tasks based on recommendations
      for (const recommendation of monitoring.recommendations) {
        await createMaintenanceTask(recommendation);
      }
    }
    
    // Store metrics for dashboard
    await storePerformanceMetrics(monitoring.performanceScore, new Date());
    
    return monitoring;
  } catch (error) {
    console.error('AI monitoring failed:', error);
    return null;
  }
}

/**
 * Example 7: Seasonal Challenge Optimization
 * Automatically adjust challenges based on seasons and events
 */
export async function optimizeForSeason(context: Context) {
  try {
    const currentSeason = getCurrentSeason();
    const upcomingHolidays = getUpcomingHolidays();
    const localEvents = await getLocalEvents();
    
    const seasonalContext = {
      season: currentSeason,
      holidays: upcomingHolidays,
      localEvents: localEvents.map(e => e.name),
      weatherConditions: await getCurrentWeather(),
    };
    
    // Get existing challenges that could be optimized
    const existingChallenges = await getActiveChallenges();
    
    for (const challenge of existingChallenges) {
      try {
        // Generate seasonal variations
        const variations = await aiOrchestrator.challengeService.generateSeasonalVariations(
          challenge,
          seasonalContext
        );
        
        // Publish the best variation
        if (variations.length > 0) {
          const bestVariation = variations[0]; // AI ranks them by expected engagement
          await publishChallenge(bestVariation);
          console.log(`Created seasonal variation: ${bestVariation.title}`);
        }
      } catch (error) {
        console.error(`Failed to create seasonal variation for ${challenge.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Seasonal optimization failed:', error);
  }
}

// Helper functions (you'll need to implement these based on your existing system)

async function awardPoints(userId: string, points: number): Promise<void> {
  // Your existing points awarding logic
}

async function updateUserStats(userId: string, challenge: Challenge): Promise<void> {
  // Your existing user stats update logic
}

async function getPartnerBusinesses(): Promise<any[]> {
  // Your existing business data retrieval
  return [];
}

async function publishChallenge(challenge: Challenge): Promise<void> {
  // Your existing challenge publishing logic
}

async function notifyUsersAboutNewChallenge(challenge: Challenge): Promise<void> {
  // Your existing notification logic
}

async function getPopularChallenges(): Promise<Challenge[]> {
  // Your existing popular challenges logic
  return [];
}

async function getUserProfile(userId: string): Promise<UserProfile> {
  // Your existing user profile retrieval
  return {} as UserProfile;
}

async function getPersonalizationInsights(userId: string): Promise<any> {
  // Retrieve stored personalization insights
  return null;
}

async function getNotificationHistory(userId: string): Promise<any[]> {
  // Your existing notification history retrieval
  return [];
}

async function scheduleNotification(userId: string, type: string, time: string): Promise<void> {
  // Your existing notification scheduling logic
}

async function sendNotification(userId: string, message: string, channel: string): Promise<void> {
  // Your existing notification sending logic
}

async function sendBasicNotification(userId: string, type: string): Promise<void> {
  // Your existing basic notification logic
}

async function createMaintenanceTask(recommendation: string): Promise<void> {
  // Create a task or alert based on AI recommendation
}

async function storePerformanceMetrics(score: number, timestamp: Date): Promise<void> {
  // Store metrics for your dashboard
}

async function getActiveChallenges(): Promise<Challenge[]> {
  // Your existing active challenges retrieval
  return [];
}

function generateWelcomeMessage(prediction: any, challengeCount: number): string {
  if (prediction?.churnRisk > 0.7) {
    return `Welcome back! We've missed you. Check out these ${challengeCount} challenges picked just for you!`;
  } else if (prediction?.engagementTrend === 'increasing') {
    return `You're on fire! Here are ${challengeCount} new challenges to keep your streak going!`;
  } else {
    return `Ready for adventure? We've found ${challengeCount} perfect challenges for you!`;
  }
}

function personalizeNotificationMessage(
  type: string,
  personalization: any,
  userProfile: UserProfile
): string {
  const { tone, contentFocus } = personalization;
  
  const messages = {
    new_challenge: {
      casual: {
        rewards: "New challenge with great rewards just dropped!",
        social: "Your friends are already trying this new challenge!",
        exploration: "Ready to explore something new?",
        achievement: "Perfect challenge to boost your score!",
      },
      enthusiastic: {
        rewards: "🎉 Amazing new challenge with awesome rewards!",
        social: "🔥 Everyone's talking about this new challenge!",
        exploration: "🗺️ Epic new adventure awaits!",
        achievement: "🏆 Level up with this exciting challenge!",
      },
      informative: {
        rewards: "New challenge available with 25 point reward",
        social: "Community challenge now active",
        exploration: "New location-based challenge published",
        achievement: "Achievement opportunity available",
      },
    },
  };
  
  return messages[type as keyof typeof messages]?.[tone]?.[contentFocus] || 
         "New activity available in your treasure hunt game!";
}

function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function getUpcomingHolidays(): string[] {
  // Simple implementation - you could use a holiday API
  const now = new Date();
  const month = now.getMonth();
  
  if (month === 11) return ['Christmas', 'New Year'];
  if (month === 9) return ['Halloween'];
  if (month === 1) return ['Valentine\'s Day'];
  
  return [];
}

async function getLocalEvents(): Promise<Array<{ name: string; date: Date }>> {
  // You could integrate with local event APIs
  return [];
}

async function getCurrentWeather(): Promise<string> {
  // You could integrate with weather APIs
  return 'mild';
}