/**
 * Main entry point for the Reddit Treasure Hunt Game Devvit app
 */

import { Devvit } from '@devvit/public-api';
import { ChallengeBrowserUtils } from './components/ChallengeBrowser.js';
import { renderChallengeDetailView } from './components/ChallengeDetailView.js';
import { ChallengeService } from './services/challengeService.js';
import { Challenge } from './types/core.js';
import { getRedditEventService } from './services/redditEventService.js';
import { initializeAnalyticsClient } from './services/analytics.js';
import { InteractiveGameHub } from './components/InteractiveGameHub.js';

// Import AI Services
import { AIMasterOrchestrator } from './services/aiMasterOrchestrator.js';
import { AIGameIntelligence } from './services/aiGameIntelligence.js';
import { AICommunityManager } from './services/aiCommunityManager.js';
import { AIBusinessIntelligence } from './services/aiBusinessIntelligence.js';
import { AIOrchestrator } from './services/aiOrchestrator.js';

// Configure the app
Devvit.configure({
  redditAPI: true,
  redis: true,
  http: true,
});

// App settings configuration
Devvit.addSettings([
  {
    name: 'CLOUDFLARE_API_KEY',
    type: 'string',
    label: 'Cloudflare API Key',
    helpText: 'API key for Cloudflare Workers analytics integration',
    isSecret: true,
    scope: 'app',
  },
  {
    name: 'CLOUDFLARE_AI_API_KEY',
    type: 'string',
    label: 'Cloudflare AI API Key',
    helpText: 'API key for Cloudflare Workers AI services',
    isSecret: true,
    scope: 'app',
  },
  {
    name: 'CLOUDFLARE_ACCOUNT_ID',
    type: 'string',
    label: 'Cloudflare Account ID',
    helpText: 'Your Cloudflare account ID for AI services',
    isSecret: true,
    scope: 'app',
  },
  {
    name: 'ANALYTICS_BASE_URL',
    type: 'string',
    label: 'Analytics Base URL',
    helpText: 'Base URL for analytics API',
    defaultValue: 'https://michiganspots.com/api/analytics',
  },
  {
    name: 'GPS_VERIFICATION_RADIUS',
    type: 'number',
    label: 'GPS Verification Radius (meters)',
    helpText: 'GPS verification radius in meters',
    defaultValue: 100,
  },
  {
    name: 'MAX_SUBMISSIONS_PER_USER_PER_DAY',
    type: 'number',
    label: 'Max Submissions Per User Per Day',
    helpText: 'Maximum submissions per user per day for rate limiting',
    defaultValue: 10,
  },
  {
    name: 'AI_VALIDATION_ENABLED',
    type: 'boolean',
    label: 'Enable AI Validation',
    helpText: 'Enable AI-powered submission validation',
    defaultValue: true,
  },
  {
    name: 'AI_CHALLENGE_GENERATION_ENABLED',
    type: 'boolean',
    label: 'Enable AI Challenge Generation',
    helpText: 'Enable AI-powered challenge generation',
    defaultValue: true,
  },
  {
    name: 'AI_PERSONALIZATION_ENABLED',
    type: 'boolean',
    label: 'Enable AI Personalization',
    helpText: 'Enable AI-powered user personalization',
    defaultValue: true,
  },
  {
    name: 'AI_COMMUNITY_MANAGEMENT_ENABLED',
    type: 'boolean',
    label: 'Enable AI Community Management',
    helpText: 'Enable AI-powered community management',
    defaultValue: true,
  },
  {
    name: 'AI_BUSINESS_INTELLIGENCE_ENABLED',
    type: 'boolean',
    label: 'Enable AI Business Intelligence',
    helpText: 'Enable AI-powered business intelligence for partners',
    defaultValue: true,
  },
]);

// Global AI system instances
let masterOrchestrator: AIMasterOrchestrator;
let aiOrchestrator: AIOrchestrator;
let gameIntelligence: AIGameIntelligence;
let communityManager: AICommunityManager;
let businessIntelligence: AIBusinessIntelligence;

// Add menu action for interactive games
Devvit.addMenuItem({
  label: '🎮 Play Interactive Games',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    
    const post = await reddit.submitPost({
      title: '🎮 Interactive Games Hub - Play While You Explore!',
      subredditName: context.subredditName!,
      preview: {
        type: 'vstack',
        padding: 'medium',
        gap: 'medium',
        alignment: 'center',
        children: [
          {
            type: 'text',
            size: 'xxlarge',
            text: '🎮'
          },
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            text: 'Interactive Games Hub'
          },
          {
            type: 'text',
            size: 'medium',
            color: '#6b7280',
            text: 'Play mini-games while exploring Michigan!'
          }
        ]
      },
    });

    ui.showToast({ text: '🎮 Interactive Games Hub created!' });
    ui.navigateTo(post);
  },
});

// Add menu action for creating treasure hunt challenges
Devvit.addMenuItem({
  label: '🗺️ Create Treasure Hunt Challenge',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    
    const post = await reddit.submitPost({
      title: '🗺️ Michigan Spots Treasure Hunt - Discover Local Gems!',
      subredditName: context.subredditName!,
      preview: {
        type: 'vstack',
        padding: 'medium',
        gap: 'medium',
        alignment: 'center',
        children: [
          {
            type: 'text',
            size: 'xxlarge',
            text: '🗺️'
          },
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            text: 'Michigan Spots Treasure Hunt'
          },
          {
            type: 'text',
            size: 'medium',
            color: '#6b7280',
            text: 'Discover hidden gems across Michigan!'
          }
        ]
      },
    });

    ui.showToast({ text: '🗺️ Treasure Hunt Challenge created!' });
    ui.navigateTo(post);
  },
});

// Initialize all systems when app starts
Devvit.addTrigger({
  event: 'AppInstall',
  handler: async (event, context) => {
    try {
      const settings = await context.settings.getAll();
      const apiKey = settings.CLOUDFLARE_API_KEY as string;
      const aiApiKey = settings.CLOUDFLARE_AI_API_KEY as string;
      const accountId = settings.CLOUDFLARE_ACCOUNT_ID as string;
      const baseUrl = (settings.ANALYTICS_BASE_URL as string) || 'https://michiganspots.com/api/analytics';
      const logLevel = (settings.LOG_LEVEL as string) || 'info';
      
      // Initialize Analytics
      if (apiKey && apiKey !== 'your_production_api_key_here') {
        initializeAnalyticsClient({
          baseUrl,
          apiKey,
          retryAttempts: 3,
          retryDelay: 1000,
          timeout: 5000
        });
        
        if (logLevel === 'info' || logLevel === 'debug') {
          console.log('Analytics client initialized successfully for production');
          console.log(`Base URL: ${baseUrl}`);
        }
      } else {
        console.error('CLOUDFLARE_API_KEY not properly configured for production');
        console.error('Please set the production API key in app settings');
      }

      // Initialize AI Systems
      if (aiApiKey && accountId && aiApiKey !== 'your_ai_api_key_here') {
        console.log('🤖 Initializing AI Systems...');
        
        // Initialize AI services
        masterOrchestrator = new AIMasterOrchestrator(context);
        aiOrchestrator = new AIOrchestrator(context, {
          enableAutoValidation: settings.AI_VALIDATION_ENABLED as boolean ?? true,
          enableChallengeGeneration: settings.AI_CHALLENGE_GENERATION_ENABLED as boolean ?? true,
          enablePersonalization: settings.AI_PERSONALIZATION_ENABLED as boolean ?? true,
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
        });
        
        gameIntelligence = new AIGameIntelligence(context);
        communityManager = new AICommunityManager(context);
        businessIntelligence = new AIBusinessIntelligence(context);
        
        console.log('✅ AI Systems initialized successfully!');
        console.log('🧠 Master AI Orchestrator: Ready');
        console.log('🎮 Game Intelligence: Ready');
        console.log('👥 Community Manager: Ready');
        console.log('💼 Business Intelligence: Ready');
        
        // Run initial AI pipeline
        try {
          console.log('🚀 Running initial AI intelligence pipeline...');
          const result = await masterOrchestrator.runMasterIntelligencePipeline();
          console.log(`📊 Ecosystem Health: ${(result.ecosystemHealth.overallScore * 100).toFixed(1)}%`);
          console.log(`🎯 Growth Trajectory: ${result.ecosystemHealth.growthTrajectory}`);
          console.log(`⚡ Actions Executed: ${result.executionSummary.actionsExecuted}`);
        } catch (error) {
          console.error('Initial AI pipeline failed:', error);
        }
        
      } else {
        console.log('⚠️ AI services not configured - running in basic mode');
        console.log('To enable AI features, configure CLOUDFLARE_AI_API_KEY and CLOUDFLARE_ACCOUNT_ID');
      }
      
    } catch (error) {
      console.error('Failed to initialize systems:', error);
    }
  }
});

// App upgrade trigger - reinitialize all systems on updates
Devvit.addTrigger({
  event: 'AppUpgrade',
  handler: async (event, context) => {
    try {
      const settings = await context.settings.getAll();
      const apiKey = settings.CLOUDFLARE_API_KEY as string;
      const aiApiKey = settings.CLOUDFLARE_AI_API_KEY as string;
      const accountId = settings.CLOUDFLARE_ACCOUNT_ID as string;
      const baseUrl = (settings.ANALYTICS_BASE_URL as string) || 'https://michiganspots.com/api/analytics';
      
      // Reinitialize Analytics
      if (apiKey && apiKey !== 'your_production_api_key_here') {
        initializeAnalyticsClient({
          baseUrl,
          apiKey,
          retryAttempts: 3,
          retryDelay: 1000,
          timeout: 5000
        });
        console.log('Analytics client reinitialized after app upgrade');
      }

      // Reinitialize AI Systems
      if (aiApiKey && accountId && aiApiKey !== 'your_ai_api_key_here') {
        console.log('🔄 Reinitializing AI Systems after upgrade...');
        
        masterOrchestrator = new AIMasterOrchestrator(context);
        aiOrchestrator = new AIOrchestrator(context);
        gameIntelligence = new AIGameIntelligence(context);
        communityManager = new AICommunityManager(context);
        businessIntelligence = new AIBusinessIntelligence(context);
        
        console.log('✅ AI Systems reinitialized successfully after upgrade!');
        
        // Run post-upgrade AI optimization
        try {
          const result = await masterOrchestrator.runMasterIntelligencePipeline();
          console.log('🚀 Post-upgrade AI optimization completed');
        } catch (error) {
          console.error('Post-upgrade AI optimization failed:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to reinitialize systems after upgrade:', error);
    }
  }
});

// Reddit Event Triggers for Social Integration
// Note: These triggers are commented out as the event names need to be updated to valid Devvit events
// Valid events: PostCreate, PostUpdate, PostDelete, CommentCreate, CommentUpdate, CommentDelete, ModAction, ModMail

/*
// Post submission trigger - tracks when challenge posts are created
Devvit.addTrigger({
  event: 'PostSubmit',
  handler: async (event, context) => {
    try {
      const redditEventService = getRedditEventService();
      await redditEventService.handlePostSubmit({
        postId: event.post?.id,
        post: event.post,
        author: event.author,
        subreddit: event.subreddit,
        subredditName: event.subreddit?.name
      });

      // AI-Enhanced Processing
      if (communityManager && event.post?.body) {
        try {
          // AI content moderation
          const moderation = await communityManager.moderateContent(
            event.post.body,
            event.author?.name || 'unknown',
            {
              isNewUser: (event.author?.createdAt || 0) > Date.now() - 30 * 24 * 60 * 60 * 1000,
              previousViolations: 0, // Would fetch from user history
              communityStanding: 7, // Would calculate from user activity
            }
          );

          if (moderation.action === 'remove' || moderation.action === 'flag') {
            console.log(`🛡️ AI Moderation: ${moderation.action} - ${moderation.reason}`);
            // In production, you'd take appropriate action here
          }
        } catch (error) {
          console.error('AI moderation failed:', error);
        }
      }
      
    } catch (error) {
      console.error('Error handling PostSubmit event:', error);
    }
  }
});

// Comment submission trigger - tracks when users comment on challenges
Devvit.addTrigger({
  event: 'CommentSubmit',
  handler: async (event, context) => {
    try {
      const redditEventService = getRedditEventService();
      await redditEventService.handleCommentSubmit({
        postId: event.post?.id,
        commentId: event.comment?.id,
        post: event.post,
        comment: event.comment,
        author: event.author,
        subreddit: event.subreddit,
        subredditName: event.subreddit?.name
      });

      // AI-Enhanced Comment Processing
      if (communityManager && event.comment?.body) {
        try {
          // AI content moderation for comments
          const moderation = await communityManager.moderateContent(
            event.comment.body,
            event.author?.name || 'unknown',
            {
              isNewUser: (event.author?.createdAt || 0) > Date.now() - 30 * 24 * 60 * 60 * 1000,
              previousViolations: 0,
              communityStanding: 7,
            }
          );

          // AI-powered personalized response suggestions
          if (moderation.suggestedResponse) {
            console.log(`💡 AI Suggestion: ${moderation.suggestedResponse}`);
          }

          // Check if this might be a challenge submission
          if (event.comment.body.toLowerCase().includes('completed') || 
              event.comment.body.toLowerCase().includes('challenge')) {
            
            // This could be a challenge submission - process with AI validation
            if (aiOrchestrator) {
              console.log('🎯 Potential challenge submission detected - AI processing initiated');
              // In production, you'd extract submission data and validate
            }
          }
          
        } catch (error) {
          console.error('AI comment processing failed:', error);
        }
      }
      
    } catch (error) {
      console.error('Error handling CommentSubmit event:', error);
    }
  }
});

// Post upvote trigger - tracks when users upvote challenge posts
Devvit.addTrigger({
  event: 'PostUpvote',
  handler: async (event, context) => {
    try {
      const redditEventService = getRedditEventService();
      await redditEventService.handleUpvote({
        postId: event.post?.id,
        post: event.post,
        author: event.author,
        subreddit: event.subreddit,
        subredditName: event.subreddit?.name,
        targetId: event.targetId
      });
    } catch (error) {
      console.error('Error handling PostUpvote event:', error);
    }
  }
});

// Comment upvote trigger - tracks when users upvote challenge comments
Devvit.addTrigger({
  event: 'CommentUpvote',
  handler: async (event, context) => {
    try {
      const redditEventService = getRedditEventService();
      await redditEventService.handleUpvote({
        postId: event.post?.id,
        commentId: event.comment?.id,
        post: event.post,
        comment: event.comment,
        author: event.author,
        subreddit: event.subreddit,
        subredditName: event.subreddit?.name,
        targetId: event.targetId
      });
    } catch (error) {
      console.error('Error handling CommentUpvote event:', error);
    }
  }
});

// Post share trigger - tracks when users share challenge posts
Devvit.addTrigger({
  event: 'PostShare',
  handler: async (event, context) => {
    try {
      const redditEventService = getRedditEventService();
      await redditEventService.handleShare({
        postId: event.post?.id,
        post: event.post,
        author: event.author,
        subreddit: event.subreddit,
        subredditName: event.subreddit?.name,
        destination: event.destination
      });
    } catch (error) {
      console.error('Error handling PostShare event:', error);
    }
  }
});

// Award given trigger - tracks when users give awards to challenge posts/comments
Devvit.addTrigger({
  event: 'AwardGiven',
  handler: async (event, context) => {
    try {
      const redditEventService = getRedditEventService();
      await redditEventService.handleAward({
        postId: event.post?.id,
        commentId: event.comment?.id,
        post: event.post,
        comment: event.comment,
        author: event.author,
        subreddit: event.subreddit,
        subredditName: event.subreddit?.name,
        award: event.award,
        awardType: event.award?.type
      });

      // AI-Enhanced Award Processing
      if (gameIntelligence && event.award) {
        try {
          // This is a high-engagement event - could trigger viral content generation
          console.log('🏆 High engagement detected - potential viral moment');
          
          // In production, you'd analyze if this creates a viral moment
          // and potentially generate related content or events
          
        } catch (error) {
          console.error('AI award processing failed:', error);
        }
      }
      
    } catch (error) {
      console.error('Error handling AwardGiven event:', error);
    }
  }
});

// Scheduled AI Tasks

// Daily AI Intelligence Pipeline
Devvit.addSchedulerJob({
  name: 'daily_ai_pipeline',
  cron: '0 6 * * *', // Run at 6 AM daily
  handler: async (event, context) => {
    try {
      if (!masterOrchestrator) {
        console.log('⚠️ Master AI Orchestrator not initialized - skipping daily pipeline');
        return;
      }

      console.log('🌅 Running Daily AI Intelligence Pipeline...');
      const result = await masterOrchestrator.runMasterIntelligencePipeline();
      
      console.log('📊 Daily AI Pipeline Results:');
      console.log(`   Ecosystem Health: ${(result.ecosystemHealth.overallScore * 100).toFixed(1)}%`);
      console.log(`   Growth Trajectory: ${result.ecosystemHealth.growthTrajectory}`);
      console.log(`   Actions Executed: ${result.executionSummary.actionsExecuted}`);
      console.log(`   Issues Prevented: ${result.executionSummary.issuesPrevented}`);
      console.log(`   Optimizations Applied: ${result.executionSummary.optimizationsApplied}`);
      
      // Store daily metrics
      await context.redis.hSet('daily_ai_metrics', {
        date: new Date().toISOString().split('T')[0],
        ecosystemHealth: result.ecosystemHealth.overallScore.toString(),
        actionsExecuted: result.executionSummary.actionsExecuted.toString(),
        issuesPrevented: result.executionSummary.issuesPrevented.toString(),
      });
      
    } catch (error) {
      console.error('Daily AI pipeline failed:', error);
    }
  }
});

// Weekly Challenge Generation
Devvit.addSchedulerJob({
  name: 'weekly_challenge_generation',
  cron: '0 8 * * 1', // Run at 8 AM every Monday
  handler: async (event, context) => {
    try {
      if (!aiOrchestrator) {
        console.log('⚠️ AI Orchestrator not initialized - skipping challenge generation');
        return;
      }

      console.log('📅 Running Weekly AI Challenge Generation...');
      
      // Mock business data - in production, you'd fetch real partner data
      const mockBusinesses = [
        {
          name: 'Downtown Coffee Co',
          category: 'restaurant',
          location: { lat: 42.3601, lng: -71.0589 },
          description: 'Cozy coffee shop in downtown',
        },
        {
          name: 'Local Bookstore',
          category: 'retail',
          location: { lat: 42.3605, lng: -71.0595 },
          description: 'Independent bookstore with local authors',
        },
      ];
      
      const newChallenges = await aiOrchestrator.autoGenerateChallenges(mockBusinesses, 5);
      
      console.log(`✅ Generated ${newChallenges.length} new AI-powered challenges`);
      
      // Store challenge generation metrics
      await context.redis.hSet('weekly_challenge_metrics', {
        week: new Date().toISOString().split('T')[0],
        challengesGenerated: newChallenges.length.toString(),
        businessesIncluded: mockBusinesses.length.toString(),
      });
      
    } catch (error) {
      console.error('Weekly challenge generation failed:', error);
    }
  }
});

// Hourly Community Health Check
Devvit.addSchedulerJob({
  name: 'hourly_community_health',
  cron: '0 * * * *', // Run every hour
  handler: async (event, context) => {
    try {
      if (!communityManager) {
        return; // Skip if not initialized
      }

      // Mock activity data - in production, you'd fetch real data
      const mockActivity = [
        { userId: 'user1', action: 'challenge_completed', timestamp: Date.now(), engagement: 0.8 },
        { userId: 'user2', action: 'content_shared', timestamp: Date.now() - 1800000, engagement: 0.7 },
      ];
      
      const mockContentMetrics = [
        { contentId: 'post1', engagement: 0.8, sentiment: 0.9, shares: 15 },
      ];
      
      const mockModerationEvents = [
        { contentId: 'post2', action: 'approved', reason: 'positive_content', timestamp: Date.now() },
      ];

      const communityHealth = await communityManager.analyzeCommunityHealth(
        mockActivity,
        mockContentMetrics,
        mockModerationEvents
      );
      
      // Only log if health is concerning
      if (communityHealth.overallScore < 0.7) {
        console.log(`⚠️ Community Health Alert: ${(communityHealth.overallScore * 100).toFixed(1)}%`);
        console.log(`   Recommendations: ${communityHealth.recommendations.join(', ')}`);
      }
      
      // Store hourly health metrics
      await context.redis.hSet('community_health_hourly', {
        hour: new Date().toISOString(),
        overallScore: communityHealth.overallScore.toString(),
        engagement: communityHealth.engagement.toString(),
        toxicity: communityHealth.toxicity.toString(),
      });
      
    } catch (error) {
      console.error('Hourly community health check failed:', error);
    }
  }
});

// Weekly Business Intelligence Reports
Devvit.addSchedulerJob({
  name: 'weekly_business_reports',
  cron: '0 9 * * 1', // Run at 9 AM every Monday
  handler: async (event, context) => {
    try {
      if (!businessIntelligence) {
        console.log('⚠️ Business Intelligence not initialized - skipping reports');
        return;
      }

      console.log('📊 Generating Weekly Business Intelligence Reports...');
      
      // Mock partner data - in production, you'd fetch real partner data
      const mockPartners = ['downtown_cafe', 'local_bookstore', 'pizza_place'];
      
      for (const partnerId of mockPartners) {
        try {
          const report = await businessIntelligence.generateAutomatedReport(
            partnerId,
            'weekly'
          );
          
          console.log(`📈 Generated report for ${partnerId}: ${report.reportId}`);
          console.log(`   Performance Score: ${(report.keyMetrics.performanceScore * 100).toFixed(1)}%`);
          console.log(`   Action Items: ${report.actionItems.length}`);
          
          // In production, you'd send this report to the partner
          
        } catch (error) {
          console.error(`Failed to generate report for ${partnerId}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Weekly business reports failed:', error);
    }
  }
});
*/

// Loading Screen Component
const LoadingScreen: Devvit.BlockComponent = () => {
  return {
    type: 'vstack',
    height: '100%',
    width: '100%',
    alignment: 'center middle',
    backgroundColor: '#F5E6D3',
    gap: 'medium',
    children: [
      {
        type: 'image',
        imageHeight: 128,
        imageWidth: 128,
        url: 'https://i.redd.it/snoovatar/avatars/nftv2_bmZ0X2VpcDE1NToxMzdfZjE0MzM3M2YyNjJjODMyMWUxZDMzNGQwNjY4MjAzNmQyOTRkZmQwMl8xMzE1MjY_rare_f417bf15-b64d-4fae-9f0e-04e6cfc9b79c-transparent.png',
        description: 'Michigan Spots Logo',
        resizeMode: 'fit',
      },
      {
        type: 'vstack',
        alignment: 'center middle',
        gap: 'small',
        children: [
          {
            type: 'text',
            size: 'xxlarge',
            weight: 'bold',
            color: '#D2691E',
            text: 'Michigan Spots',
          },
          {
            type: 'text',
            size: 'medium',
            color: '#CD853F',
            text: 'Treasure Hunt Game',
          },
        ],
      },
      {
        type: 'spacer',
        size: 'medium',
      },
      {
        type: 'text',
        size: 'medium',
        color: '#6b7280',
        text: 'Loading challenges...',
      },
      {
        type: 'vstack',
        width: '60%',
        height: '4px',
        backgroundColor: '#e5e7eb',
        cornerRadius: 'full',
        children: [
          {
            type: 'hstack',
            width: '100%',
            height: '100%',
            children: [
              {
                type: 'spacer',
                size: 'small',
              },
            ],
          },
        ],
      },
      {
        type: 'spacer',
        size: 'large',
      },
      {
        type: 'text',
        size: 'small',
        color: '#9ca3af',
        text: '🗺️ Discover Michigan\'s Hidden Gems',
      },
    ],
  };
};

// AI-Enhanced Main App Component
const App: Devvit.CustomPostComponent = async (context) => {
  try {
    const logLevel = context.settings.get('LOG_LEVEL') || 'info';
    const userId = context.userId || 'anonymous';
    
    if (logLevel === 'info' || logLevel === 'debug') {
      console.log('🤖 AI-Powered Michigan Spots Treasure Hunt App initialized');
    }
    
    // Get mock data for demonstration
    let mockChallenges = ChallengeService.getMockChallenges();
    const userCompletedChallenges = ['challenge-5']; // Mock completed challenges

    // AI-Enhanced Challenge Personalization
    if (masterOrchestrator && userId !== 'anonymous') {
      try {
        // Create hyper-personalized experience
        const mockUserProfile = {
          userId,
          stats: { completionRate: 0.75, totalPoints: 250, averageRating: 4.2 },
          preferences: { categories: ['restaurant', 'cafe', 'retail'] },
          lastActive: new Date(),
        };

        const currentContext = {
          location: { lat: 42.3601, lng: -71.0589 }, // Boston area
          timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                     new Date().getHours() < 17 ? 'afternoon' : 'evening',
          weather: 'clear',
          socialContext: { friends: 15, recentInteractions: 8 },
          recentActivity: [
            { action: 'completed_challenge', timestamp: Date.now() - 3600000, engagement: 0.8 },
          ],
        };

        const personalizedExperience = await masterOrchestrator.createHyperPersonalizedExperience(
          userId,
          mockUserProfile,
          currentContext
        );

        // Add AI-generated challenges to the mix
        if (personalizedExperience.dynamicChallenges.length > 0) {
          mockChallenges = [...mockChallenges, ...personalizedExperience.dynamicChallenges];
          console.log(`🎯 Added ${personalizedExperience.dynamicChallenges.length} AI-personalized challenges`);
        }

        // Store personalization insights
        await context.redis.hSet(`user_ai_insights:${userId}`, {
          lastPersonalized: new Date().toISOString(),
          aiConfidence: personalizedExperience.aiConfidence.toString(),
          narrativeChapter: personalizedExperience.personalizedNarrative.currentChapter,
          emotionalTone: personalizedExperience.personalizedNarrative.emotionalTone,
        });

      } catch (error) {
        console.error('AI personalization failed, using default experience:', error);
      }
    }
  
    // Use the challenge browser utilities to get display data
    const activeChallenges = ChallengeBrowserUtils.getActiveChallengesOnly(
      mockChallenges, 
      userCompletedChallenges
    );
    
    const challengeStats = ChallengeBrowserUtils.getChallengeStats(
      mockChallenges, 
      userCompletedChallenges
    );

    // Get AI system status
    let aiStatus = 'Basic Mode';
    let aiFeatures: string[] = [];
    
    if (masterOrchestrator) {
      aiStatus = 'AI-Powered';
      aiFeatures = [
        '🧠 Master AI Intelligence',
        '🎯 Hyper-Personalization', 
        '🎮 Dynamic Game Intelligence',
        '👥 AI Community Management',
        '💼 Business Intelligence',
        '🚨 Crisis Prevention',
        '🚀 Viral Content Generation'
      ];
    }

    // AI-Enhanced challenge list display
    const challengeBlocks = activeChallenges.map((challenge) => {
      const displayInfo = ChallengeBrowserUtils.getChallengeDisplayInfo(
        challenge, 
        userCompletedChallenges
      );
      
      // Check if this is an AI-generated challenge
      const isAIGenerated = (challenge as any).isAIGenerated;
      const aiIndicator = isAIGenerated ? '🤖 ' : '';
      
      return {
        type: 'vstack',
        padding: 'medium',
        backgroundColor: displayInfo.isCompleted ? '#f0f9ff' : 
                         isAIGenerated ? '#fef3c7' : 'white',
        cornerRadius: 'medium',
        border: 'thin',
        borderColor: displayInfo.isCompleted ? '#0ea5e9' : 
                     isAIGenerated ? '#f59e0b' : '#e5e7eb',
        children: [
          {
            type: 'text',
            size: 'large',
            weight: 'bold',
            color: 'black',
            text: aiIndicator + challenge.title
          },
          {
            type: 'text',
            size: 'medium',
            color: '#6b7280',
            text: challenge.partnerName
          },
          {
            type: 'text',
            size: 'medium',
            color: '#374151',
            text: challenge.description
          },
          {
            type: 'text',
            size: 'small',
            color: '#059669',
            text: `${challenge.points} points • ${challenge.difficulty.toUpperCase()} • ${displayInfo.statusText}`
          },
          {
            type: 'text',
            size: 'small',
            color: '#6b7280',
            text: `📍 ${challenge.location.businessName}`
          },
          {
            type: 'text',
            size: 'small',
            color: '#6b7280',
            text: `📋 ${challenge.proofRequirements.instructions}`
          },
          ...(isAIGenerated ? [{
            type: 'text',
            size: 'small',
            weight: 'bold',
            color: '#f59e0b',
            text: '🤖 AI-Generated Challenge'
          }] : []),
          ...(displayInfo.isCompleted ? [{
            type: 'text',
            size: 'small',
            weight: 'bold',
            color: '#059669',
            text: '✅ Completed'
          }] : [])
        ]
      };
    });

    return {
      type: 'vstack',
      gap: 'medium',
      padding: 'medium',
      children: [
        {
          type: 'text',
          size: 'xxlarge',
          weight: 'bold',
          color: 'black',
          text: '🤖 AI-Powered Michigan Spots'
        },
        {
          type: 'text',
          size: 'medium',
          color: '#6b7280',
          text: `${challengeStats.active} active • ${challengeStats.completed} completed • ${challengeStats.expired} expired`
        },
        {
          type: 'text',
          size: 'small',
          weight: 'bold',
          color: aiStatus === 'AI-Powered' ? '#059669' : '#f59e0b',
          text: `Status: ${aiStatus}`
        },
        ...(aiFeatures.length > 0 ? [{
          type: 'vstack',
          gap: 'small',
          padding: 'small',
          backgroundColor: '#f0f9ff',
          cornerRadius: 'medium',
          children: [
            {
              type: 'text',
              size: 'small',
              weight: 'bold',
              color: '#0ea5e9',
              text: '🚀 AI Features Active:'
            },
            ...aiFeatures.map(feature => ({
              type: 'text',
              size: 'small',
              color: '#374151',
              text: feature
            }))
          ]
        }] : []),
        
        // Interactive Games Section
        {
          type: 'vstack',
          gap: 'small',
          padding: 'medium',
          backgroundColor: '#fef3c7',
          cornerRadius: 'medium',
          border: 'thin',
          borderColor: '#f59e0b',
          children: [
            {
              type: 'text',
              size: 'large',
              weight: 'bold',
              color: '#92400e',
              text: '🎮 Interactive Games'
            },
            {
              type: 'text',
              size: 'medium',
              color: '#92400e',
              text: 'Play mini-games while exploring Michigan!'
            },
            {
              type: 'hstack',
              gap: 'small',
              children: [
                {
                  type: 'text',
                  size: 'small',
                  color: '#a16207',
                  text: '🔍 Spot the Difference • 🔤 Word Search • 🧠 Trivia • 🗺️ Treasure Hunt • 🎨 Drawing'
                }
              ]
            }
          ]
        },
        
        ...challengeBlocks,
        {
          type: 'text',
          size: 'small',
          color: '#9ca3af',
          text: aiStatus === 'AI-Powered' ? 
            '🤖 Powered by Advanced AI • Personalized for you • Self-optimizing ecosystem' :
            'Discover local Michigan businesses • Earn points • Have fun!'
        },
        ...(userId !== 'anonymous' && aiStatus === 'AI-Powered' ? [{
          type: 'text',
          size: 'small',
          color: '#6366f1',
          text: `👋 Welcome back! Your personalized adventure continues...`
        }] : [])
      ]
    } as any;
  
  } catch (error) {
    console.error('Error in main app component:', error);
    
    // Return error state component
    return {
      type: 'vstack',
      gap: 'medium',
      padding: 'medium',
      children: [
        {
          type: 'text',
          size: 'large',
          weight: 'bold',
          color: 'red',
          text: '⚠️ App Error'
        },
        {
          type: 'text',
          size: 'medium',
          color: '#6b7280',
          text: 'The Michigan Spots app encountered an error. Please try refreshing or contact support.'
        },
        {
          type: 'text',
          size: 'small',
          color: '#9ca3af',
          text: 'Error details have been logged for debugging.'
        }
      ]
    } as any;
  }
};

// Register the main app component
Devvit.addCustomPostType({
  name: 'Michigan Spots Treasure Hunt',
  description: 'Interactive treasure hunt game for discovering local Michigan businesses',
  height: 'tall',
  render: App,
});

// Add Interactive Games Hub as a custom post type
Devvit.addCustomPostType({
  name: 'Interactive Games Hub',
  description: 'Mini-games and interactive features for Michigan Spots',
  height: 'tall',
  render: InteractiveGameHub,
});

// Export the configured Devvit app
export default Devvit;