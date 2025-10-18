/**
 * Social Engagement Service for Reddit Interactions
 * 
 * This service handles real-time tracking of social engagement events
 * including comments, upvotes, shares, and awards on challenge-related content.
 */

import { getAnalyticsClient } from './analytics.js';
import { getRedditEventService } from './redditEventService.js';
import { 
  formatEngagementEvent, 
  validateEngagementEvent,
  createEngagementContext,
  extractChallengeIdFromText,
  isChallengeRelatedText,
  sanitizeUsername
} from '../utils/eventTracking.js';
import { EngagementEvent, EngagementEventType } from '../types/analytics.js';

/**
 * Social interaction context from Reddit events
 */
export interface SocialInteractionContext {
  eventType: EngagementEventType;
  postId: string;
  commentId?: string;
  userId: string;
  username: string;
  subredditName: string;
  postTitle?: string;
  postContent?: string;
  commentContent?: string;
  postFlair?: string;
  awardType?: string;
  shareDestination?: string;
  timestamp: Date;
}

/**
 * Engagement tracking result
 */
export interface EngagementTrackingResult {
  success: boolean;
  eventSent: boolean;
  challengeId?: number;
  error?: string;
  warnings?: string[];
}

/**
 * Social Engagement Service for tracking Reddit interactions
 */
export class SocialEngagementService {
  private static instance: SocialEngagementService;
  private analyticsClient = getAnalyticsClient();
  private redditEventService = getRedditEventService();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SocialEngagementService {
    if (!SocialEngagementService.instance) {
      SocialEngagementService.instance = new SocialEngagementService();
    }
    return SocialEngagementService.instance;
  }

  /**
   * Track comment engagement on challenge posts
   */
  public async trackCommentEngagement(context: SocialInteractionContext): Promise<EngagementTrackingResult> {
    try {
      // Only process comments in r/michiganspots
      if (context.subredditName !== 'michiganspots') {
        return { success: true, eventSent: false };
      }

      // Check if this is challenge-related content
      const textToAnalyze = [
        context.postTitle,
        context.postContent,
        context.commentContent,
        context.postFlair
      ].filter(Boolean).join(' ');

      if (!isChallengeRelatedText(textToAnalyze)) {
        return { success: true, eventSent: false };
      }

      // Extract challenge ID
      const challengeIdStr = extractChallengeIdFromText(textToAnalyze);
      if (!challengeIdStr) {
        return { 
          success: true, 
          eventSent: false,
          warnings: ['Challenge-related content found but no challenge ID extracted']
        };
      }

      const challengeId = parseInt(challengeIdStr, 10);
      if (isNaN(challengeId)) {
        return { 
          success: false, 
          eventSent: false,
          error: `Invalid challenge ID format: ${challengeIdStr}`
        };
      }

      // Create engagement event
      const engagementEvent = formatEngagementEvent({
        eventType: 'comment',
        challengeId,
        userRedditUsername: sanitizeUsername(context.username),
        postId: context.postId,
        commentId: context.commentId,
        eventData: createEngagementContext(
          context.subredditName,
          context.userId,
          undefined,
          {
            postTitle: context.postTitle,
            commentLength: context.commentContent?.length || 0,
            hasPostFlair: !!context.postFlair
          }
        ),
        timestamp: context.timestamp
      });

      // Validate event
      const validation = validateEngagementEvent(engagementEvent);
      if (!validation.isValid) {
        return {
          success: false,
          eventSent: false,
          error: `Event validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Send to analytics API
      await this.analyticsClient.trackEngagement(engagementEvent);

      return {
        success: true,
        eventSent: true,
        challengeId,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      };

    } catch (error) {
      console.error('Error tracking comment engagement:', error);
      return {
        success: false,
        eventSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Track upvote engagement on challenge posts or comments
   */
  public async trackUpvoteEngagement(context: SocialInteractionContext): Promise<EngagementTrackingResult> {
    try {
      // Only process upvotes in r/michiganspots
      if (context.subredditName !== 'michiganspots') {
        return { success: true, eventSent: false };
      }

      // Check if this is challenge-related content
      const textToAnalyze = [
        context.postTitle,
        context.postContent,
        context.commentContent,
        context.postFlair
      ].filter(Boolean).join(' ');

      if (!isChallengeRelatedText(textToAnalyze)) {
        return { success: true, eventSent: false };
      }

      // Extract challenge ID
      const challengeIdStr = extractChallengeIdFromText(textToAnalyze);
      if (!challengeIdStr) {
        return { 
          success: true, 
          eventSent: false,
          warnings: ['Challenge-related content found but no challenge ID extracted']
        };
      }

      const challengeId = parseInt(challengeIdStr, 10);
      if (isNaN(challengeId)) {
        return { 
          success: false, 
          eventSent: false,
          error: `Invalid challenge ID format: ${challengeIdStr}`
        };
      }

      // Create engagement event
      const engagementEvent = formatEngagementEvent({
        eventType: 'upvote',
        challengeId,
        userRedditUsername: sanitizeUsername(context.username),
        postId: context.postId,
        commentId: context.commentId,
        eventData: createEngagementContext(
          context.subredditName,
          context.userId,
          undefined,
          {
            postTitle: context.postTitle,
            targetType: context.commentId ? 'comment' : 'post',
            hasPostFlair: !!context.postFlair
          }
        ),
        timestamp: context.timestamp
      });

      // Validate and send event
      const validation = validateEngagementEvent(engagementEvent);
      if (!validation.isValid) {
        return {
          success: false,
          eventSent: false,
          error: `Event validation failed: ${validation.errors.join(', ')}`
        };
      }

      await this.analyticsClient.trackEngagement(engagementEvent);

      return {
        success: true,
        eventSent: true,
        challengeId,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      };

    } catch (error) {
      console.error('Error tracking upvote engagement:', error);
      return {
        success: false,
        eventSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Track share engagement on challenge posts
   */
  public async trackShareEngagement(context: SocialInteractionContext): Promise<EngagementTrackingResult> {
    try {
      // Only process shares in r/michiganspots
      if (context.subredditName !== 'michiganspots') {
        return { success: true, eventSent: false };
      }

      // Check if this is challenge-related content
      const textToAnalyze = [
        context.postTitle,
        context.postContent,
        context.postFlair
      ].filter(Boolean).join(' ');

      if (!isChallengeRelatedText(textToAnalyze)) {
        return { success: true, eventSent: false };
      }

      // Extract challenge ID
      const challengeIdStr = extractChallengeIdFromText(textToAnalyze);
      if (!challengeIdStr) {
        return { 
          success: true, 
          eventSent: false,
          warnings: ['Challenge-related content found but no challenge ID extracted']
        };
      }

      const challengeId = parseInt(challengeIdStr, 10);
      if (isNaN(challengeId)) {
        return { 
          success: false, 
          eventSent: false,
          error: `Invalid challenge ID format: ${challengeIdStr}`
        };
      }

      // Create engagement event
      const engagementEvent = formatEngagementEvent({
        eventType: 'share',
        challengeId,
        userRedditUsername: sanitizeUsername(context.username),
        postId: context.postId,
        eventData: createEngagementContext(
          context.subredditName,
          context.userId,
          undefined,
          {
            postTitle: context.postTitle,
            shareDestination: context.shareDestination || 'unknown',
            hasPostFlair: !!context.postFlair
          }
        ),
        timestamp: context.timestamp
      });

      // Validate and send event
      const validation = validateEngagementEvent(engagementEvent);
      if (!validation.isValid) {
        return {
          success: false,
          eventSent: false,
          error: `Event validation failed: ${validation.errors.join(', ')}`
        };
      }

      await this.analyticsClient.trackEngagement(engagementEvent);

      return {
        success: true,
        eventSent: true,
        challengeId,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      };

    } catch (error) {
      console.error('Error tracking share engagement:', error);
      return {
        success: false,
        eventSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Track award engagement on challenge posts or comments
   */
  public async trackAwardEngagement(context: SocialInteractionContext): Promise<EngagementTrackingResult> {
    try {
      // Only process awards in r/michiganspots
      if (context.subredditName !== 'michiganspots') {
        return { success: true, eventSent: false };
      }

      // Check if this is challenge-related content
      const textToAnalyze = [
        context.postTitle,
        context.postContent,
        context.commentContent,
        context.postFlair
      ].filter(Boolean).join(' ');

      if (!isChallengeRelatedText(textToAnalyze)) {
        return { success: true, eventSent: false };
      }

      // Extract challenge ID
      const challengeIdStr = extractChallengeIdFromText(textToAnalyze);
      if (!challengeIdStr) {
        return { 
          success: true, 
          eventSent: false,
          warnings: ['Challenge-related content found but no challenge ID extracted']
        };
      }

      const challengeId = parseInt(challengeIdStr, 10);
      if (isNaN(challengeId)) {
        return { 
          success: false, 
          eventSent: false,
          error: `Invalid challenge ID format: ${challengeIdStr}`
        };
      }

      // Create engagement event
      const engagementEvent = formatEngagementEvent({
        eventType: 'award',
        challengeId,
        userRedditUsername: sanitizeUsername(context.username),
        postId: context.postId,
        commentId: context.commentId,
        eventData: createEngagementContext(
          context.subredditName,
          context.userId,
          undefined,
          {
            postTitle: context.postTitle,
            awardType: context.awardType || 'unknown',
            targetType: context.commentId ? 'comment' : 'post',
            hasPostFlair: !!context.postFlair
          }
        ),
        timestamp: context.timestamp
      });

      // Validate and send event
      const validation = validateEngagementEvent(engagementEvent);
      if (!validation.isValid) {
        return {
          success: false,
          eventSent: false,
          error: `Event validation failed: ${validation.errors.join(', ')}`
        };
      }

      await this.analyticsClient.trackEngagement(engagementEvent);

      return {
        success: true,
        eventSent: true,
        challengeId,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      };

    } catch (error) {
      console.error('Error tracking award engagement:', error);
      return {
        success: false,
        eventSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Track view engagement on challenge posts
   */
  public async trackViewEngagement(context: SocialInteractionContext): Promise<EngagementTrackingResult> {
    try {
      // Only process views in r/michiganspots
      if (context.subredditName !== 'michiganspots') {
        return { success: true, eventSent: false };
      }

      // Check if this is challenge-related content
      const textToAnalyze = [
        context.postTitle,
        context.postContent,
        context.postFlair
      ].filter(Boolean).join(' ');

      if (!isChallengeRelatedText(textToAnalyze)) {
        return { success: true, eventSent: false };
      }

      // Extract challenge ID
      const challengeIdStr = extractChallengeIdFromText(textToAnalyze);
      if (!challengeIdStr) {
        return { 
          success: true, 
          eventSent: false,
          warnings: ['Challenge-related content found but no challenge ID extracted']
        };
      }

      const challengeId = parseInt(challengeIdStr, 10);
      if (isNaN(challengeId)) {
        return { 
          success: false, 
          eventSent: false,
          error: `Invalid challenge ID format: ${challengeIdStr}`
        };
      }

      // Create engagement event
      const engagementEvent = formatEngagementEvent({
        eventType: 'view',
        challengeId,
        userRedditUsername: sanitizeUsername(context.username),
        postId: context.postId,
        eventData: createEngagementContext(
          context.subredditName,
          context.userId,
          undefined,
          {
            postTitle: context.postTitle,
            hasPostFlair: !!context.postFlair,
            contentLength: context.postContent?.length || 0
          }
        ),
        timestamp: context.timestamp
      });

      // Validate and send event
      const validation = validateEngagementEvent(engagementEvent);
      if (!validation.isValid) {
        return {
          success: false,
          eventSent: false,
          error: `Event validation failed: ${validation.errors.join(', ')}`
        };
      }

      await this.analyticsClient.trackEngagement(engagementEvent);

      return {
        success: true,
        eventSent: true,
        challengeId,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      };

    } catch (error) {
      console.error('Error tracking view engagement:', error);
      return {
        success: false,
        eventSent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process any social engagement event based on type
   */
  public async processEngagementEvent(
    eventType: EngagementEventType,
    context: SocialInteractionContext
  ): Promise<EngagementTrackingResult> {
    switch (eventType) {
      case 'view':
        return this.trackViewEngagement(context);
      case 'comment':
        return this.trackCommentEngagement(context);
      case 'upvote':
        return this.trackUpvoteEngagement(context);
      case 'share':
        return this.trackShareEngagement(context);
      case 'award':
        return this.trackAwardEngagement(context);
      default:
        return {
          success: false,
          eventSent: false,
          error: `Unknown engagement event type: ${eventType}`
        };
    }
  }

  /**
   * Batch process multiple engagement events
   */
  public async processBatchEngagementEvents(
    events: Array<{ eventType: EngagementEventType; context: SocialInteractionContext }>
  ): Promise<EngagementTrackingResult[]> {
    const results: EngagementTrackingResult[] = [];

    for (const event of events) {
      try {
        const result = await this.processEngagementEvent(event.eventType, event.context);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          eventSent: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

/**
 * Get singleton instance of Social Engagement Service
 */
export function getSocialEngagementService(): SocialEngagementService {
  return SocialEngagementService.getInstance();
}