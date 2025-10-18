/**
 * Reddit Event Service for handling Reddit social interactions
 * 
 * This service sets up Devvit triggers for Reddit events and processes
 * challenge-related interactions for analytics tracking.
 */

import { Devvit, Context } from '@devvit/public-api';
import { getAnalyticsClient } from './analytics.js';
import { getSocialEngagementService, SocialInteractionContext } from './socialEngagementService.js';
import { EngagementEvent, EngagementEventType } from '../types/analytics.js';

/**
 * Reddit Event Context - extracted from Reddit events
 */
export interface RedditEventContext {
  postId: string;
  commentId?: string;
  userId: string;
  username: string;
  subredditName: string;
  challengeId?: string;
  eventType: EngagementEventType;
  timestamp: Date;
}

/**
 * Challenge ID extraction patterns
 */
const CHALLENGE_ID_PATTERNS = [
  /challenge[_-](\w+)/i,
  /challenge:\s*(\w+)/i,
  /id[_-](\w+)/i,
  /#(\w+)/,
];

/**
 * Reddit Event Service for processing social interactions
 */
export class RedditEventService {
  private static instance: RedditEventService;
  private analyticsClient = getAnalyticsClient();
  private socialEngagementService = getSocialEngagementService();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): RedditEventService {
    if (!RedditEventService.instance) {
      RedditEventService.instance = new RedditEventService();
    }
    return RedditEventService.instance;
  }

  /**
   * Extract challenge ID from post title, content, or flair
   */
  public extractChallengeId(
    title?: string,
    content?: string,
    flair?: string,
    postId?: string
  ): string | null {
    const textToSearch = [title, content, flair, postId].filter(Boolean).join(' ');
    
    for (const pattern of CHALLENGE_ID_PATTERNS) {
      const match = textToSearch.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Check if a post/comment is challenge-related
   */
  public isChallengeRelated(
    title?: string,
    content?: string,
    flair?: string,
    postId?: string
  ): boolean {
    const challengeKeywords = [
      'challenge',
      'treasure hunt',
      'michigan spots',
      'business visit',
      'proof submission',
      'completed',
      'points earned'
    ];

    const textToSearch = [title, content, flair].filter(Boolean).join(' ').toLowerCase();
    
    return challengeKeywords.some(keyword => textToSearch.includes(keyword)) ||
           this.extractChallengeId(title, content, flair, postId) !== null;
  }

  /**
   * Process Reddit event and extract context
   */
  public async processRedditEvent(
    eventType: EngagementEventType,
    context: any
  ): Promise<RedditEventContext | null> {
    try {
      let postId: string;
      let commentId: string | undefined;
      let userId: string;
      let username: string;
      let subredditName: string;
      let title: string | undefined;
      let content: string | undefined;
      let flair: string | undefined;

      // Extract data based on event type and context structure
      switch (eventType) {
        case 'view':
          // Post view event
          postId = context.postId || context.post?.id;
          userId = context.userId || context.user?.id;
          username = context.username || context.user?.username;
          subredditName = context.subredditName || context.subreddit?.name;
          title = context.post?.title;
          content = context.post?.body;
          flair = context.post?.linkFlairText;
          break;

        case 'comment':
          // Comment event
          postId = context.postId || context.post?.id;
          commentId = context.commentId || context.comment?.id;
          userId = context.userId || context.user?.id || context.author?.id;
          username = context.username || context.user?.username || context.author?.username;
          subredditName = context.subredditName || context.subreddit?.name;
          title = context.post?.title;
          content = context.comment?.body || context.post?.body;
          flair = context.post?.linkFlairText;
          break;

        case 'upvote':
        case 'share':
        case 'award':
          // Vote/share/award events
          postId = context.postId || context.post?.id || context.targetId;
          userId = context.userId || context.user?.id || context.author?.id;
          username = context.username || context.user?.username || context.author?.username;
          subredditName = context.subredditName || context.subreddit?.name;
          title = context.post?.title;
          content = context.post?.body;
          flair = context.post?.linkFlairText;
          break;

        default:
          console.warn(`Unknown event type: ${eventType}`);
          return null;
      }

      // Validate required fields
      if (!postId || !userId || !username || !subredditName) {
        console.warn('Missing required fields for Reddit event processing', {
          eventType,
          postId,
          userId,
          username,
          subredditName
        });
        return null;
      }

      // Check if this is challenge-related
      if (!this.isChallengeRelated(title, content, flair, postId)) {
        return null; // Not challenge-related, ignore
      }

      // Extract challenge ID
      const challengeId = this.extractChallengeId(title, content, flair, postId);

      return {
        postId,
        commentId,
        userId,
        username,
        subredditName,
        challengeId,
        eventType,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error processing Reddit event:', error);
      return null;
    }
  }

  /**
   * Send engagement event to analytics API
   */
  public async sendEngagementEvent(eventContext: RedditEventContext): Promise<void> {
    try {
      // Only process events for r/michiganspots
      if (eventContext.subredditName !== 'michiganspots') {
        return;
      }

      // Convert challenge ID to number (required by analytics API)
      const challengeIdNumber = eventContext.challengeId ? 
        parseInt(eventContext.challengeId, 10) : 0;

      if (eventContext.challengeId && isNaN(challengeIdNumber)) {
        console.warn('Invalid challenge ID format:', eventContext.challengeId);
        return;
      }

      const engagementEvent: EngagementEvent = {
        eventType: eventContext.eventType,
        challengeId: challengeIdNumber,
        userRedditUsername: eventContext.username,
        postId: eventContext.postId,
        commentId: eventContext.commentId,
        timestamp: eventContext.timestamp.toISOString(),
        eventData: {
          subredditName: eventContext.subredditName,
          userId: eventContext.userId,
          extractedChallengeId: eventContext.challengeId
        }
      };

      // Send to analytics API
      await this.analyticsClient.trackEngagement(engagementEvent);
      
      console.log('Engagement event sent successfully:', {
        eventType: eventContext.eventType,
        challengeId: challengeIdNumber,
        username: eventContext.username,
        postId: eventContext.postId
      });

    } catch (error) {
      console.error('Failed to send engagement event:', error);
      // Don't throw - we don't want to break Reddit functionality
    }
  }

  /**
   * Convert Reddit event context to social interaction context
   */
  private convertToSocialContext(
    eventType: EngagementEventType,
    redditContext: RedditEventContext
  ): SocialInteractionContext {
    return {
      eventType,
      postId: redditContext.postId,
      commentId: redditContext.commentId,
      userId: redditContext.userId,
      username: redditContext.username,
      subredditName: redditContext.subredditName,
      timestamp: redditContext.timestamp
    };
  }

  /**
   * Handle post submission events
   */
  public async handlePostSubmit(context: any): Promise<void> {
    try {
      const eventContext = await this.processRedditEvent('view', context);
      if (eventContext) {
        const socialContext: SocialInteractionContext = {
          ...this.convertToSocialContext('view', eventContext),
          postTitle: context.post?.title,
          postContent: context.post?.body,
          postFlair: context.post?.linkFlairText
        };
        
        const result = await this.socialEngagementService.trackViewEngagement(socialContext);
        if (result.success && result.eventSent) {
          console.log('Post view tracked successfully:', result.challengeId);
        }
      }
    } catch (error) {
      console.error('Error handling post submit event:', error);
    }
  }

  /**
   * Handle comment submission events
   */
  public async handleCommentSubmit(context: any): Promise<void> {
    try {
      const eventContext = await this.processRedditEvent('comment', context);
      if (eventContext) {
        const socialContext: SocialInteractionContext = {
          ...this.convertToSocialContext('comment', eventContext),
          postTitle: context.post?.title,
          postContent: context.post?.body,
          commentContent: context.comment?.body,
          postFlair: context.post?.linkFlairText
        };
        
        const result = await this.socialEngagementService.trackCommentEngagement(socialContext);
        if (result.success && result.eventSent) {
          console.log('Comment engagement tracked successfully:', result.challengeId);
        }
      }
    } catch (error) {
      console.error('Error handling comment submit event:', error);
    }
  }

  /**
   * Handle upvote events
   */
  public async handleUpvote(context: any): Promise<void> {
    try {
      const eventContext = await this.processRedditEvent('upvote', context);
      if (eventContext) {
        const socialContext: SocialInteractionContext = {
          ...this.convertToSocialContext('upvote', eventContext),
          postTitle: context.post?.title,
          postContent: context.post?.body,
          commentContent: context.comment?.body,
          postFlair: context.post?.linkFlairText
        };
        
        const result = await this.socialEngagementService.trackUpvoteEngagement(socialContext);
        if (result.success && result.eventSent) {
          console.log('Upvote engagement tracked successfully:', result.challengeId);
        }
      }
    } catch (error) {
      console.error('Error handling upvote event:', error);
    }
  }

  /**
   * Handle share events
   */
  public async handleShare(context: any): Promise<void> {
    try {
      const eventContext = await this.processRedditEvent('share', context);
      if (eventContext) {
        const socialContext: SocialInteractionContext = {
          ...this.convertToSocialContext('share', eventContext),
          postTitle: context.post?.title,
          postContent: context.post?.body,
          postFlair: context.post?.linkFlairText,
          shareDestination: context.destination || 'unknown'
        };
        
        const result = await this.socialEngagementService.trackShareEngagement(socialContext);
        if (result.success && result.eventSent) {
          console.log('Share engagement tracked successfully:', result.challengeId);
        }
      }
    } catch (error) {
      console.error('Error handling share event:', error);
    }
  }

  /**
   * Handle award events
   */
  public async handleAward(context: any): Promise<void> {
    try {
      const eventContext = await this.processRedditEvent('award', context);
      if (eventContext) {
        const socialContext: SocialInteractionContext = {
          ...this.convertToSocialContext('award', eventContext),
          postTitle: context.post?.title,
          postContent: context.post?.body,
          commentContent: context.comment?.body,
          postFlair: context.post?.linkFlairText,
          awardType: context.award?.type || context.awardType || 'unknown'
        };
        
        const result = await this.socialEngagementService.trackAwardEngagement(socialContext);
        if (result.success && result.eventSent) {
          console.log('Award engagement tracked successfully:', result.challengeId);
        }
      }
    } catch (error) {
      console.error('Error handling award event:', error);
    }
  }
}

/**
 * Get singleton instance of Reddit Event Service
 */
export function getRedditEventService(): RedditEventService {
  return RedditEventService.getInstance();
}