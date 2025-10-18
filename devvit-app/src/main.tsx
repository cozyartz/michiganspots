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
]);

// Initialize analytics client when app starts
Devvit.addTrigger({
  event: 'AppInstall',
  handler: async (event, context) => {
    try {
      const settings = await context.settings.getAll();
      const apiKey = settings.CLOUDFLARE_API_KEY as string;
      const baseUrl = (settings.ANALYTICS_BASE_URL as string) || 'https://michiganspots.com/api/analytics';
      const logLevel = (settings.LOG_LEVEL as string) || 'info';
      
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
    } catch (error) {
      console.error('Failed to initialize analytics client:', error);
    }
  }
});

// App upgrade trigger - reinitialize analytics on updates
Devvit.addTrigger({
  event: 'AppUpgrade',
  handler: async (event, context) => {
    try {
      const settings = await context.settings.getAll();
      const apiKey = settings.CLOUDFLARE_API_KEY as string;
      const baseUrl = (settings.ANALYTICS_BASE_URL as string) || 'https://michiganspots.com/api/analytics';
      
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
    } catch (error) {
      console.error('Failed to reinitialize analytics client after upgrade:', error);
    }
  }
});

// Reddit Event Triggers for Social Integration

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
    } catch (error) {
      console.error('Error handling AwardGiven event:', error);
    }
  }
});

// Main app component - demonstrates challenge browser functionality
const App: Devvit.CustomPostComponent = (context) => {
  try {
    const logLevel = context.settings.get('LOG_LEVEL') || 'info';
    
    if (logLevel === 'info' || logLevel === 'debug') {
      console.log('Michigan Spots Treasure Hunt App initialized');
    }
    
    // Get mock data for demonstration
    const mockChallenges = ChallengeService.getMockChallenges();
    const userCompletedChallenges = ['challenge-5']; // Mock completed challenges
  
  // Use the challenge browser utilities to get display data
  const activeChallenges = ChallengeBrowserUtils.getActiveChallengesOnly(
    mockChallenges, 
    userCompletedChallenges
  );
  
  const challengeStats = ChallengeBrowserUtils.getChallengeStats(
    mockChallenges, 
    userCompletedChallenges
  );

  // Simple challenge list display using Devvit blocks
  const challengeBlocks = activeChallenges.map((challenge) => {
    const displayInfo = ChallengeBrowserUtils.getChallengeDisplayInfo(
      challenge, 
      userCompletedChallenges
    );
    
    return {
      type: 'vstack',
      padding: 'medium',
      backgroundColor: displayInfo.isCompleted ? '#f0f9ff' : 'white',
      cornerRadius: 'medium',
      border: 'thin',
      borderColor: displayInfo.isCompleted ? '#0ea5e9' : '#e5e7eb',
      children: [
        {
          type: 'text',
          size: 'large',
          weight: 'bold',
          color: 'black',
          text: challenge.title
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
        text: '🏆 Michigan Spots Challenges'
      },
      {
        type: 'text',
        size: 'medium',
        color: '#6b7280',
        text: `${challengeStats.active} active • ${challengeStats.completed} completed • ${challengeStats.expired} expired`
      },
      ...challengeBlocks,
      {
        type: 'text',
        size: 'small',
        color: '#9ca3af',
        text: 'Discover local Michigan businesses • Earn points • Have fun!'
      }
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
  render: App,
});

// Export the configured Devvit app
export default Devvit;