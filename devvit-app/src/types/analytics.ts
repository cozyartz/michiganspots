/**
 * Analytics event type definitions for Cloudflare Workers integration
 */

import { GPSCoordinate, ProofType } from './core.js';

// Base Analytics Event
export interface BaseAnalyticsEvent {
  timestamp: string;
  userRedditUsername: string;
  sessionId?: string;
  userAgent?: string;
}

// Engagement Events
export type EngagementEventType = 'view' | 'comment' | 'upvote' | 'share' | 'award';

export interface EngagementEvent extends BaseAnalyticsEvent {
  eventType: EngagementEventType;
  challengeId: number;
  spotId?: number;
  postId: string;
  commentId?: string;
  eventData?: Record<string, any>;
}

// Challenge Completion Events
export interface ChallengeCompletion extends BaseAnalyticsEvent {
  challengeId: number;
  submissionUrl: string;
  submissionType: 'post' | 'comment';
  completedAt: string;
  gpsCoordinates: GPSCoordinate;
  proofType: ProofType;
  pointsAwarded: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
}

// Analytics API Request/Response Types
export interface AnalyticsAPIRequest {
  apiKey: string;
  events: (EngagementEvent | ChallengeCompletion)[];
}

export interface AnalyticsAPIResponse {
  success: boolean;
  message?: string;
  errors?: string[];
  processedEvents: number;
}

// Analytics Client Configuration
export interface AnalyticsClientConfig {
  baseUrl: string;
  apiKey: string;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

// Error Types for Analytics
export enum AnalyticsErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

export interface AnalyticsError {
  type: AnalyticsErrorType;
  message: string;
  retryable: boolean;
  context?: Record<string, any>;
}

// Partner Analytics (for dashboard display)
export interface PartnerAnalytics {
  partnerId: string;
  date: string; // YYYY-MM-DD
  metrics: {
    challengeViews: number;
    challengeCompletions: number;
    challengeComments: number;
    challengeUpvotes: number;
    challengeShares: number;
    challengeAwards: number;
    uniqueParticipants: number;
    engagementRate: number;
    costPerVisit: number;
    returnVisitors: number;
  };
  topChallenges: {
    challengeId: string;
    completions: number;
    views: number;
  }[];
  topParticipants: {
    username: string;
    completions: number;
    points: number;
  }[];
}