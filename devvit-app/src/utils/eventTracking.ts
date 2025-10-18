/**
 * Event Tracking Utilities for Reddit Social Integration
 * 
 * Helper functions for formatting engagement events and challenge completion events
 * with proper validation to ensure required fields are present.
 */

import { EngagementEvent, ChallengeCompletion, EngagementEventType } from '../types/analytics.js';
import { GPSCoordinate, ProofType } from '../types/core.js';

/**
 * Event validation result
 */
export interface EventValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Engagement event builder parameters
 */
export interface EngagementEventParams {
  eventType: EngagementEventType;
  challengeId: number;
  userRedditUsername: string;
  postId: string;
  commentId?: string;
  spotId?: number;
  eventData?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Challenge completion event builder parameters
 */
export interface ChallengeCompletionParams {
  challengeId: number;
  userRedditUsername: string;
  submissionUrl: string;
  submissionType: 'post' | 'comment';
  gpsCoordinates: GPSCoordinate;
  proofType: ProofType;
  pointsAwarded: number;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  timestamp?: Date;
}

/**
 * Format engagement event for analytics API
 */
export function formatEngagementEvent(params: EngagementEventParams): EngagementEvent {
  const timestamp = params.timestamp || new Date();
  
  return {
    eventType: params.eventType,
    challengeId: params.challengeId,
    spotId: params.spotId,
    userRedditUsername: params.userRedditUsername,
    postId: params.postId,
    commentId: params.commentId,
    eventData: params.eventData || {},
    timestamp: timestamp.toISOString()
  };
}

/**
 * Format challenge completion event for analytics API
 */
export function formatChallengeCompletion(params: ChallengeCompletionParams): ChallengeCompletion {
  const timestamp = params.timestamp || new Date();
  
  return {
    challengeId: params.challengeId,
    userRedditUsername: params.userRedditUsername,
    submissionUrl: params.submissionUrl,
    submissionType: params.submissionType,
    completedAt: timestamp.toISOString(),
    gpsCoordinates: params.gpsCoordinates,
    proofType: params.proofType,
    pointsAwarded: params.pointsAwarded,
    verificationStatus: params.verificationStatus || 'pending',
    timestamp: timestamp.toISOString()
  };
}

/**
 * Validate engagement event data
 */
export function validateEngagementEvent(event: EngagementEvent): EventValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!event.eventType) {
    errors.push('eventType is required');
  } else if (!['view', 'comment', 'upvote', 'share', 'award'].includes(event.eventType)) {
    errors.push('eventType must be one of: view, comment, upvote, share, award');
  }

  if (typeof event.challengeId !== 'number') {
    errors.push('challengeId must be a number');
  } else if (event.challengeId <= 0) {
    errors.push('challengeId must be a positive number');
  }

  if (!event.userRedditUsername) {
    errors.push('userRedditUsername is required');
  } else if (typeof event.userRedditUsername !== 'string') {
    errors.push('userRedditUsername must be a string');
  }

  if (!event.postId) {
    errors.push('postId is required');
  } else if (typeof event.postId !== 'string') {
    errors.push('postId must be a string');
  }

  if (!event.timestamp) {
    errors.push('timestamp is required');
  } else {
    try {
      new Date(event.timestamp);
    } catch {
      errors.push('timestamp must be a valid ISO date string');
    }
  }

  // Optional field validation
  if (event.commentId && typeof event.commentId !== 'string') {
    warnings.push('commentId should be a string when provided');
  }

  if (event.spotId && typeof event.spotId !== 'number') {
    warnings.push('spotId should be a number when provided');
  }

  if (event.eventData && typeof event.eventData !== 'object') {
    warnings.push('eventData should be an object when provided');
  }

  // Event-specific validation
  if (event.eventType === 'comment' && !event.commentId) {
    warnings.push('commentId is recommended for comment events');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate challenge completion event data
 */
export function validateChallengeCompletion(completion: ChallengeCompletion): EventValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (typeof completion.challengeId !== 'number') {
    errors.push('challengeId must be a number');
  } else if (completion.challengeId <= 0) {
    errors.push('challengeId must be a positive number');
  }

  if (!completion.userRedditUsername) {
    errors.push('userRedditUsername is required');
  } else if (typeof completion.userRedditUsername !== 'string') {
    errors.push('userRedditUsername must be a string');
  }

  if (!completion.submissionUrl) {
    errors.push('submissionUrl is required');
  } else if (typeof completion.submissionUrl !== 'string') {
    errors.push('submissionUrl must be a string');
  } else if (!completion.submissionUrl.startsWith('http')) {
    errors.push('submissionUrl must be a valid URL');
  }

  if (!completion.submissionType) {
    errors.push('submissionType is required');
  } else if (!['post', 'comment'].includes(completion.submissionType)) {
    errors.push('submissionType must be either "post" or "comment"');
  }

  if (!completion.completedAt) {
    errors.push('completedAt is required');
  } else {
    try {
      new Date(completion.completedAt);
    } catch {
      errors.push('completedAt must be a valid ISO date string');
    }
  }

  if (!completion.gpsCoordinates) {
    errors.push('gpsCoordinates is required');
  } else {
    if (typeof completion.gpsCoordinates.latitude !== 'number' || 
        completion.gpsCoordinates.latitude < -90 || 
        completion.gpsCoordinates.latitude > 90) {
      errors.push('gpsCoordinates.latitude must be a valid number between -90 and 90');
    }

    if (typeof completion.gpsCoordinates.longitude !== 'number' || 
        completion.gpsCoordinates.longitude < -180 || 
        completion.gpsCoordinates.longitude > 180) {
      errors.push('gpsCoordinates.longitude must be a valid number between -180 and 180');
    }

    if (completion.gpsCoordinates.accuracy && 
        (typeof completion.gpsCoordinates.accuracy !== 'number' || completion.gpsCoordinates.accuracy < 0)) {
      warnings.push('gpsCoordinates.accuracy should be a non-negative number when provided');
    }
  }

  if (!completion.proofType) {
    errors.push('proofType is required');
  } else if (!['photo', 'receipt', 'gps_checkin', 'location_question'].includes(completion.proofType)) {
    errors.push('proofType must be one of: photo, receipt, gps_checkin, location_question');
  }

  if (typeof completion.pointsAwarded !== 'number') {
    errors.push('pointsAwarded must be a number');
  } else if (completion.pointsAwarded < 0) {
    errors.push('pointsAwarded must be non-negative');
  }

  if (completion.verificationStatus && 
      !['pending', 'approved', 'rejected'].includes(completion.verificationStatus)) {
    warnings.push('verificationStatus should be one of: pending, approved, rejected when provided');
  }

  if (!completion.timestamp) {
    warnings.push('timestamp is recommended');
  } else {
    try {
      new Date(completion.timestamp);
    } catch {
      warnings.push('timestamp should be a valid ISO date string when provided');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Extract challenge ID from various text sources
 */
export function extractChallengeIdFromText(text: string): string | null {
  if (!text) return null;

  const patterns = [
    /challenge[_-](\w+)/i,
    /challenge:\s*(\w+)/i,
    /id[_-](\w+)/i,
    /#(\w+)/,
    /\[(\w+)\]/,
    /\((\w+)\)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if text contains challenge-related keywords
 */
export function isChallengeRelatedText(text: string): boolean {
  if (!text) return false;

  const challengeKeywords = [
    'challenge',
    'treasure hunt',
    'michigan spots',
    'business visit',
    'proof submission',
    'completed',
    'points earned',
    'badge earned',
    'leaderboard',
    'gps verified',
    'location verified'
  ];

  const normalizedText = text.toLowerCase();
  return challengeKeywords.some(keyword => normalizedText.includes(keyword));
}

/**
 * Generate session ID for tracking user sessions
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get user agent string for analytics
 */
export function getUserAgent(): string {
  return 'DevvitApp/1.0 RedditTreasureHunt MichiganSpots';
}

/**
 * Sanitize username for analytics (remove sensitive characters)
 */
export function sanitizeUsername(username: string): string {
  if (!username) return 'anonymous';
  
  // Remove any potentially sensitive characters and limit length
  return username
    .replace(/[^\w\-_.]/g, '')
    .substring(0, 50)
    .toLowerCase();
}

/**
 * Create engagement context data
 */
export function createEngagementContext(
  subredditName: string,
  userId?: string,
  sessionId?: string,
  additionalData?: Record<string, any>
): Record<string, any> {
  return {
    subredditName,
    userId: userId ? sanitizeUsername(userId) : undefined,
    sessionId: sessionId || generateSessionId(),
    userAgent: getUserAgent(),
    timestamp: new Date().toISOString(),
    ...additionalData
  };
}

/**
 * Batch event validation for multiple events
 */
export function validateEventBatch(
  events: (EngagementEvent | ChallengeCompletion)[]
): { valid: any[]; invalid: any[]; errors: Record<number, string[]> } {
  const valid: any[] = [];
  const invalid: any[] = [];
  const errors: Record<number, string[]> = {};

  events.forEach((event, index) => {
    let validation: EventValidationResult;
    
    if ('eventType' in event) {
      validation = validateEngagementEvent(event as EngagementEvent);
    } else {
      validation = validateChallengeCompletion(event as ChallengeCompletion);
    }

    if (validation.isValid) {
      valid.push(event);
    } else {
      invalid.push(event);
      errors[index] = validation.errors;
    }
  });

  return { valid, invalid, errors };
}