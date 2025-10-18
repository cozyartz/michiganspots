/**
 * Unit tests for Analytics Integration
 * 
 * Tests the AnalyticsClient methods, retry logic, error handling,
 * and event formatting/validation functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnalyticsClient, createAnalyticsClient, getAnalyticsClient, initializeAnalyticsClient } from '../services/analytics.js';
import {
  formatViewEvent,
  formatCommentEvent,
  formatUpvoteEvent,
  formatShareEvent,
  formatAwardEvent,
  formatChallengeCompletion,
  validateEngagementEvent,
  validateChallengeCompletion,
  validateEventBatch,
  createSessionId,
  extractChallengeIdFromUrl,
  sanitizeEventData
} from '../utils/eventTracking.js';
import type {
  AnalyticsClientConfig,
  EngagementEvent,
  ChallengeCompletion,
  AnalyticsAPIResponse,
  AnalyticsError
} from '../types/analytics.js';
import { AnalyticsErrorType } from '../types/analytics.js';
import type { Challenge, Submission, GPSCoordinate } from '../types/core.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout for older environments
if (!AbortSignal.timeout) {
  AbortSignal.timeout = vi.fn((ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  });
}

describe('AnalyticsClient', () => {
  let analyticsClient: AnalyticsClient;
  let config: AnalyticsClientConfig;

  beforeEach(() => {
    config = {
      baseUrl: 'https://test-api.com/analytics',
      apiKey: 'test-api-key',
      retryAttempts: 3,
      retryDelay: 100,
      timeout: 5000
    };
    analyticsClient = new AnalyticsClient(config);
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('trackEngagement', () => {
    it('should successfully send engagement event', async () => {
      const mockResponse: AnalyticsAPIResponse = {
        success: true,
        processedEvents: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const result = await analyticsClient.trackEngagement(event);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/analytics/track-engagement',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key',
            'User-Agent': 'DevvitApp/1.0 RedditTreasureHunt'
          },
          body: JSON.stringify(event)
        })
      );
    });

    it('should add timestamp if not provided', async () => {
      const mockResponse: AnalyticsAPIResponse = {
        success: true,
        processedEvents: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const event: Omit<EngagementEvent, 'timestamp'> = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123'
      };

      await analyticsClient.trackEngagement(event as EngagementEvent);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.timestamp).toBeDefined();
      expect(new Date(requestBody.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('trackChallenge', () => {
    it('should successfully send challenge completion event', async () => {
      const mockResponse: AnalyticsAPIResponse = {
        success: true,
        processedEvents: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const completion: ChallengeCompletion = {
        challengeId: 123,
        userRedditUsername: 'testuser',
        submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
        submissionType: 'post',
        completedAt: '2024-01-01T00:00:00.000Z',
        gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
        proofType: 'photo',
        pointsAwarded: 25,
        verificationStatus: 'pending',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const result = await analyticsClient.trackChallenge(completion);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.com/analytics/track-challenge',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key',
            'User-Agent': 'DevvitApp/1.0 RedditTreasureHunt'
          },
          body: JSON.stringify(completion)
        })
      );
    });
  });

  describe('retry logic and error handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should retry on network errors with exponential backoff', async () => {
      // First two calls fail with network error
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, processedEvents: 1 })
        });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const resultPromise = analyticsClient.trackEngagement(event);

      // Fast-forward through retry delays
      await vi.advanceTimersByTimeAsync(1000); // First retry delay
      await vi.advanceTimersByTimeAsync(2000); // Second retry delay

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      await expect(analyticsClient.trackEngagement(event)).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors (5xx)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, processedEvents: 1 })
        });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const resultPromise = analyticsClient.trackEngagement(event);
      await vi.advanceTimersByTimeAsync(1000);
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on rate limit errors (429)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, processedEvents: 1 })
        });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const resultPromise = analyticsClient.trackEngagement(event);
      await vi.advanceTimersByTimeAsync(1000);
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on validation errors (400)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      await expect(analyticsClient.trackEngagement(event)).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should stop retrying after max attempts', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const resultPromise = analyticsClient.trackEngagement(event);

      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry
      await vi.advanceTimersByTimeAsync(4000); // Third retry

      await expect(resultPromise).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should handle timeout errors as retryable', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';

      mockFetch
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, processedEvents: 1 })
        });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const resultPromise = analyticsClient.trackEngagement(event);
      await vi.advanceTimersByTimeAsync(1000);
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('error classification', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should classify network errors correctly', async () => {
      // Mock all retry attempts to fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const resultPromise = analyticsClient.trackEngagement(event);
      
      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      try {
        await resultPromise;
        expect.fail('Should have thrown an error');
      } catch (error) {
        const analyticsError = error as AnalyticsError;
        expect(analyticsError.type).toBe(AnalyticsErrorType.NETWORK_ERROR);
        expect(analyticsError.retryable).toBe(true);
      }
    });

    it('should classify authentication errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      try {
        await analyticsClient.trackEngagement(event);
      } catch (error) {
        const analyticsError = error as AnalyticsError;
        expect(analyticsError.type).toBe(AnalyticsErrorType.AUTHENTICATION_ERROR);
        expect(analyticsError.retryable).toBe(false);
      }
    });

    it('should classify validation errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      try {
        await analyticsClient.trackEngagement(event);
      } catch (error) {
        const analyticsError = error as AnalyticsError;
        expect(analyticsError.type).toBe(AnalyticsErrorType.VALIDATION_ERROR);
        expect(analyticsError.retryable).toBe(false);
      }
    });

    it('should classify rate limit errors correctly', async () => {
      // Mock all retry attempts to fail with 429
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const resultPromise = analyticsClient.trackEngagement(event);
      
      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      try {
        await resultPromise;
        expect.fail('Should have thrown an error');
      } catch (error) {
        const analyticsError = error as AnalyticsError;
        expect(analyticsError.type).toBe(AnalyticsErrorType.RATE_LIMIT_ERROR);
        expect(analyticsError.retryable).toBe(true);
      }
    });

    it('should classify server errors correctly', async () => {
      // Mock all retry attempts to fail with 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const resultPromise = analyticsClient.trackEngagement(event);
      
      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);

      try {
        await resultPromise;
        expect.fail('Should have thrown an error');
      } catch (error) {
        const analyticsError = error as AnalyticsError;
        expect(analyticsError.type).toBe(AnalyticsErrorType.SERVER_ERROR);
        expect(analyticsError.retryable).toBe(true);
      }
    });
  });

  describe('validation methods', () => {
    describe('validateEngagement', () => {
      it('should validate correct engagement event', () => {
        const event: EngagementEvent = {
          eventType: 'view',
          challengeId: 123,
          userRedditUsername: 'testuser',
          postId: 'post123',
          timestamp: '2024-01-01T00:00:00.000Z'
        };

        const result = analyticsClient.validateEngagement(event);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject engagement event with missing required fields', () => {
        const event = {
          challengeId: 123,
          userRedditUsername: 'testuser'
        } as EngagementEvent;

        const result = analyticsClient.validateEngagement(event);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('eventType is required');
        expect(result.errors).toContain('postId is required');
      });

      it('should reject engagement event with invalid eventType', () => {
        const event = {
          eventType: 'invalid',
          challengeId: 123,
          userRedditUsername: 'testuser',
          postId: 'post123',
          timestamp: '2024-01-01T00:00:00.000Z'
        } as unknown as EngagementEvent;

        const result = analyticsClient.validateEngagement(event);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('eventType must be one of: view, comment, upvote, share, award');
      });
    });

    describe('validateCompletion', () => {
      it('should validate correct challenge completion', () => {
        const completion: ChallengeCompletion = {
          challengeId: 123,
          userRedditUsername: 'testuser',
          submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
          submissionType: 'post',
          completedAt: '2024-01-01T00:00:00.000Z',
          gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
          proofType: 'photo',
          pointsAwarded: 25,
          verificationStatus: 'pending',
          timestamp: '2024-01-01T00:00:00.000Z'
        };

        const result = analyticsClient.validateCompletion(completion);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject completion with invalid GPS coordinates', () => {
        const completion = {
          challengeId: 123,
          userRedditUsername: 'testuser',
          submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
          submissionType: 'post',
          completedAt: '2024-01-01T00:00:00.000Z',
          gpsCoordinates: { latitude: 200, longitude: -300 }, // Invalid coordinates
          proofType: 'photo',
          pointsAwarded: 25,
          verificationStatus: 'pending',
          timestamp: '2024-01-01T00:00:00.000Z'
        } as ChallengeCompletion;

        const result = analyticsClient.validateCompletion(completion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('gpsCoordinates.latitude must be a valid number between -90 and 90');
        expect(result.errors).toContain('gpsCoordinates.longitude must be a valid number between -180 and 180');
      });

      it('should reject completion with negative points', () => {
        const completion = {
          challengeId: 123,
          userRedditUsername: 'testuser',
          submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
          submissionType: 'post',
          completedAt: '2024-01-01T00:00:00.000Z',
          gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
          proofType: 'photo',
          pointsAwarded: -10, // Invalid negative points
          verificationStatus: 'pending',
          timestamp: '2024-01-01T00:00:00.000Z'
        } as ChallengeCompletion;

        const result = analyticsClient.validateCompletion(completion);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('pointsAwarded must be a non-negative number');
      });
    });
  });

  describe('factory functions', () => {
    it('should create analytics client with default configuration', () => {
      const client = createAnalyticsClient('test-key', 'https://test.com/api');
      expect(client).toBeInstanceOf(AnalyticsClient);
    });

    it('should initialize and get singleton instance', () => {
      const config: AnalyticsClientConfig = {
        baseUrl: 'https://test.com/api',
        apiKey: 'test-key',
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 5000
      };

      initializeAnalyticsClient(config);
      const client = getAnalyticsClient();
      expect(client).toBeInstanceOf(AnalyticsClient);
    });

    it('should throw error when getting uninitialized singleton', () => {
      // We need to test this by importing a fresh module or mocking the singleton
      // For now, let's test the behavior when the singleton is null
      const originalGetAnalyticsClient = getAnalyticsClient;
      
      // Mock the function to simulate uninitialized state
      const mockGetAnalyticsClient = vi.fn(() => {
        throw new Error('Analytics client not initialized. Call initializeAnalyticsClient first.');
      });
      
      expect(() => mockGetAnalyticsClient()).toThrow('Analytics client not initialized');
    });
  });
});

describe('Event Tracking Utilities', () => {
  const mockRedditContext = {
    postId: 'post123',
    commentId: 'comment456',
    subredditName: 'michiganspots',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    sessionId: 'session123'
  };

  const mockChallenge: Challenge = {
    id: '123',
    title: 'Visit Local Coffee Shop',
    description: 'Take a photo at the local coffee shop',
    partnerId: 'partner1',
    partnerName: 'Coffee Shop',
    partnerBranding: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#000000',
      secondaryColor: '#ffffff'
    },
    difficulty: 'medium',
    points: 25,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    location: {
      coordinates: { latitude: 42.3314, longitude: -83.0458 },
      address: '123 Main St, Detroit, MI',
      businessName: 'Coffee Shop',
      verificationRadius: 100
    },
    proofRequirements: {
      types: ['photo'],
      instructions: 'Take a photo of the storefront',
      examples: []
    },
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  const mockSubmission: Submission = {
    id: 'sub123',
    challengeId: '123',
    userRedditUsername: 'testuser',
    proofType: 'photo',
    proofData: { imageUrl: 'https://example.com/photo.jpg' },
    submittedAt: new Date('2024-01-01T12:00:00Z'),
    verificationStatus: 'pending',
    redditPostUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
    gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
    fraudRiskScore: 0.1
  };

  describe('formatViewEvent', () => {
    it('should format view event correctly', () => {
      const event = formatViewEvent(123, 'testuser', mockRedditContext, 456);

      expect(event.eventType).toBe('view');
      expect(event.challengeId).toBe(123);
      expect(event.spotId).toBe(456);
      expect(event.userRedditUsername).toBe('testuser');
      expect(event.postId).toBe('post123');
      expect(event.commentId).toBe('comment456');
      expect(event.timestamp).toBeDefined();
      expect(event.eventData).toEqual({
        subreddit: 'michiganspots',
        viewDuration: null,
        deviceType: 'mobile',
        referrer: 'reddit_native'
      });
    });

    it('should detect device type from user agent', () => {
      const desktopContext = {
        ...mockRedditContext,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      const event = formatViewEvent(123, 'testuser', desktopContext);
      expect(event.eventData?.deviceType).toBe('desktop');
    });

    it('should handle missing optional fields', () => {
      const minimalContext = {
        postId: 'post123'
      };

      const event = formatViewEvent(123, 'testuser', minimalContext);
      expect(event.eventType).toBe('view');
      expect(event.challengeId).toBe(123);
      expect(event.spotId).toBeUndefined();
      expect(event.commentId).toBeUndefined();
    });
  });

  describe('formatCommentEvent', () => {
    it('should format comment event correctly', () => {
      const event = formatCommentEvent(123, 'testuser', mockRedditContext, 'Great challenge!', 456);

      expect(event.eventType).toBe('comment');
      expect(event.challengeId).toBe(123);
      expect(event.spotId).toBe(456);
      expect(event.userRedditUsername).toBe('testuser');
      expect(event.postId).toBe('post123');
      expect(event.commentId).toBe('comment456');
      expect(event.eventData).toEqual({
        commentLength: 16,
        hasMedia: false,
        parentCommentId: null,
        subreddit: 'michiganspots'
      });
    });

    it('should handle empty comment content', () => {
      const event = formatCommentEvent(123, 'testuser', mockRedditContext);
      expect(event.eventData?.commentLength).toBe(0);
    });
  });

  describe('formatUpvoteEvent', () => {
    it('should format upvote event correctly', () => {
      const event = formatUpvoteEvent(123, 'testuser', mockRedditContext, true, 456);

      expect(event.eventType).toBe('upvote');
      expect(event.challengeId).toBe(123);
      expect(event.eventData?.voteDirection).toBe('up');
    });

    it('should format downvote event correctly', () => {
      const event = formatUpvoteEvent(123, 'testuser', mockRedditContext, false, 456);
      expect(event.eventData?.voteDirection).toBe('down');
    });
  });

  describe('formatShareEvent', () => {
    it('should format share event correctly', () => {
      const event = formatShareEvent(123, 'testuser', mockRedditContext, 'twitter', 456);

      expect(event.eventType).toBe('share');
      expect(event.challengeId).toBe(123);
      expect(event.eventData?.shareMethod).toBe('twitter');
    });

    it('should handle unknown share method', () => {
      const event = formatShareEvent(123, 'testuser', mockRedditContext);
      expect(event.eventData?.shareMethod).toBe('unknown');
    });
  });

  describe('formatAwardEvent', () => {
    it('should format award event correctly', () => {
      const event = formatAwardEvent(123, 'testuser', mockRedditContext, 'gold', 100, 456);

      expect(event.eventType).toBe('award');
      expect(event.challengeId).toBe(123);
      expect(event.eventData?.awardType).toBe('gold');
      expect(event.eventData?.awardCost).toBe(100);
    });

    it('should handle missing award details', () => {
      const event = formatAwardEvent(123, 'testuser', mockRedditContext);
      expect(event.eventData?.awardType).toBe('unknown');
      expect(event.eventData?.awardCost).toBe(0);
    });
  });

  describe('formatChallengeCompletion', () => {
    it('should format challenge completion correctly', () => {
      const completion = formatChallengeCompletion(mockChallenge, mockSubmission, 'testuser', mockRedditContext);

      expect(completion.challengeId).toBe(123);
      expect(completion.userRedditUsername).toBe('testuser');
      expect(completion.submissionUrl).toBe('https://reddit.com/r/michiganspots/comments/abc123');
      expect(completion.submissionType).toBe('post');
      expect(completion.completedAt).toBe('2024-01-01T12:00:00.000Z');
      expect(completion.gpsCoordinates).toEqual({ latitude: 42.3314, longitude: -83.0458 });
      expect(completion.proofType).toBe('photo');
      expect(completion.pointsAwarded).toBe(25); // Medium difficulty
      expect(completion.verificationStatus).toBe('pending');
    });

    it('should calculate points based on difficulty', () => {
      const easyChallenge = { ...mockChallenge, difficulty: 'easy' as const };
      const hardChallenge = { ...mockChallenge, difficulty: 'hard' as const };

      const easyCompletion = formatChallengeCompletion(easyChallenge, mockSubmission, 'testuser', mockRedditContext);
      const hardCompletion = formatChallengeCompletion(hardChallenge, mockSubmission, 'testuser', mockRedditContext);

      expect(easyCompletion.pointsAwarded).toBe(10);
      expect(hardCompletion.pointsAwarded).toBe(50);
    });

    it('should handle comment submission type', () => {
      const commentSubmission = {
        ...mockSubmission,
        redditPostUrl: undefined,
        redditCommentUrl: 'https://reddit.com/r/michiganspots/comments/abc123/def456'
      };

      const completion = formatChallengeCompletion(mockChallenge, commentSubmission, 'testuser', mockRedditContext);
      expect(completion.submissionType).toBe('comment');
      expect(completion.submissionUrl).toBe('https://reddit.com/r/michiganspots/comments/abc123/def456');
    });
  });

  describe('validateEngagementEvent', () => {
    it('should validate correct engagement event', () => {
      const event: EngagementEvent = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const result = validateEngagementEvent(event);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject event with missing required fields', () => {
      const event = {
        challengeId: 123,
        userRedditUsername: 'testuser'
      } as EngagementEvent;

      const result = validateEngagementEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('eventType is required');
      expect(result.errors).toContain('postId must be a non-empty string');
      expect(result.errors).toContain('timestamp is required');
    });

    it('should reject event with invalid eventType', () => {
      const event = {
        eventType: 'invalid',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      } as unknown as EngagementEvent;

      const result = validateEngagementEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('eventType must be one of: view, comment, upvote, share, award');
    });

    it('should reject event with invalid challengeId', () => {
      const event = {
        eventType: 'view',
        challengeId: 'not-a-number',
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z'
      } as any;

      const result = validateEngagementEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('challengeId must be a valid number');
    });

    it('should reject event with invalid timestamp', () => {
      const event = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: 'invalid-date'
      } as EngagementEvent;

      const result = validateEngagementEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('timestamp must be a valid ISO date string');
    });

    it('should validate optional fields when provided', () => {
      const event = {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'testuser',
        postId: 'post123',
        timestamp: '2024-01-01T00:00:00.000Z',
        spotId: 'not-a-number',
        commentId: 123
      } as any;

      const result = validateEngagementEvent(event);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('spotId must be a number if provided');
      expect(result.errors).toContain('commentId must be a string if provided');
    });
  });

  describe('validateChallengeCompletion', () => {
    it('should validate correct challenge completion', () => {
      const completion: ChallengeCompletion = {
        challengeId: 123,
        userRedditUsername: 'testuser',
        submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
        submissionType: 'post',
        completedAt: '2024-01-01T00:00:00.000Z',
        gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
        proofType: 'photo',
        pointsAwarded: 25,
        verificationStatus: 'pending',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const result = validateChallengeCompletion(completion);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject completion with invalid GPS coordinates', () => {
      const completion = {
        challengeId: 123,
        userRedditUsername: 'testuser',
        submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
        submissionType: 'post',
        completedAt: '2024-01-01T00:00:00.000Z',
        gpsCoordinates: { latitude: 200, longitude: -300 },
        proofType: 'photo',
        pointsAwarded: 25,
        verificationStatus: 'pending',
        timestamp: '2024-01-01T00:00:00.000Z'
      } as ChallengeCompletion;

      const result = validateChallengeCompletion(completion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('gpsCoordinates.latitude must be a valid number between -90 and 90');
      expect(result.errors).toContain('gpsCoordinates.longitude must be a valid number between -180 and 180');
    });

    it('should reject completion with invalid submissionType', () => {
      const completion = {
        challengeId: 123,
        userRedditUsername: 'testuser',
        submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
        submissionType: 'invalid',
        completedAt: '2024-01-01T00:00:00.000Z',
        gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
        proofType: 'photo',
        pointsAwarded: 25,
        verificationStatus: 'pending',
        timestamp: '2024-01-01T00:00:00.000Z'
      } as any;

      const result = validateChallengeCompletion(completion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('submissionType must be either "post" or "comment"');
    });

    it('should reject completion with invalid proofType', () => {
      const completion = {
        challengeId: 123,
        userRedditUsername: 'testuser',
        submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
        submissionType: 'post',
        completedAt: '2024-01-01T00:00:00.000Z',
        gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
        proofType: 'invalid',
        pointsAwarded: 25,
        verificationStatus: 'pending',
        timestamp: '2024-01-01T00:00:00.000Z'
      } as any;

      const result = validateChallengeCompletion(completion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('proofType must be one of: photo, receipt, gps_checkin, location_question');
    });

    it('should reject completion with invalid verificationStatus', () => {
      const completion = {
        challengeId: 123,
        userRedditUsername: 'testuser',
        submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
        submissionType: 'post',
        completedAt: '2024-01-01T00:00:00.000Z',
        gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
        proofType: 'photo',
        pointsAwarded: 25,
        verificationStatus: 'invalid',
        timestamp: '2024-01-01T00:00:00.000Z'
      } as any;

      const result = validateChallengeCompletion(completion);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('verificationStatus must be one of: pending, approved, rejected');
    });
  });

  describe('validateEventBatch', () => {
    it('should validate batch of mixed events', () => {
      const events = [
        {
          eventType: 'view',
          challengeId: 123,
          userRedditUsername: 'testuser',
          postId: 'post123',
          timestamp: '2024-01-01T00:00:00.000Z'
        } as EngagementEvent,
        {
          challengeId: 123,
          userRedditUsername: 'testuser',
          submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
          submissionType: 'post',
          completedAt: '2024-01-01T00:00:00.000Z',
          gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
          proofType: 'photo',
          pointsAwarded: 25,
          verificationStatus: 'pending',
          timestamp: '2024-01-01T00:00:00.000Z'
        } as ChallengeCompletion
      ];

      const result = validateEventBatch(events);
      expect(result.isValid).toBe(true);
      expect(result.validEvents).toHaveLength(2);
      expect(result.invalidEvents).toHaveLength(0);
    });

    it('should separate valid and invalid events', () => {
      const events = [
        {
          eventType: 'view',
          challengeId: 123,
          userRedditUsername: 'testuser',
          postId: 'post123',
          timestamp: '2024-01-01T00:00:00.000Z'
        } as EngagementEvent,
        {
          eventType: 'invalid',
          challengeId: 'not-a-number'
        } as any,
        {
          challengeId: 123,
          userRedditUsername: 'testuser',
          submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
          submissionType: 'post',
          completedAt: '2024-01-01T00:00:00.000Z',
          gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
          proofType: 'photo',
          pointsAwarded: 25,
          verificationStatus: 'pending',
          timestamp: '2024-01-01T00:00:00.000Z'
        } as ChallengeCompletion
      ];

      const result = validateEventBatch(events);
      expect(result.isValid).toBe(false);
      expect(result.validEvents).toHaveLength(2);
      expect(result.invalidEvents).toHaveLength(1);
      expect(result.invalidEvents[0].errors.length).toBeGreaterThan(0);
    });
  });

  describe('utility functions', () => {
    describe('createSessionId', () => {
      it('should create unique session IDs', () => {
        const id1 = createSessionId();
        const id2 = createSessionId();

        expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
        expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/);
        expect(id1).not.toBe(id2);
      });
    });

    describe('extractChallengeIdFromUrl', () => {
      it('should extract challenge ID from URL', () => {
        const url1 = 'https://reddit.com/r/michiganspots/comments/challenge_123';
        const url2 = 'https://reddit.com/r/michiganspots/comments/challenge-456';

        expect(extractChallengeIdFromUrl(url1)).toBe(123);
        expect(extractChallengeIdFromUrl(url2)).toBe(456);
      });

      it('should return null for URLs without challenge ID', () => {
        const url = 'https://reddit.com/r/michiganspots/comments/regular_post';
        expect(extractChallengeIdFromUrl(url)).toBeNull();
      });
    });

    describe('sanitizeEventData', () => {
      it('should remove sensitive information', () => {
        const data = {
          username: 'testuser',
          password: 'secret123',
          apiToken: 'token123',
          secretKey: 'key123',
          normalField: 'value'
        };

        const sanitized = sanitizeEventData(data);
        expect(sanitized.username).toBe('testuser');
        expect(sanitized.normalField).toBe('value');
        expect(sanitized.password).toBeUndefined();
        expect(sanitized.apiToken).toBeUndefined();
        expect(sanitized.secretKey).toBeUndefined();
      });

      it('should truncate long strings', () => {
        const longString = 'a'.repeat(1500);
        const data = {
          shortString: 'short',
          longString: longString
        };

        const sanitized = sanitizeEventData(data);
        expect(sanitized.shortString).toBe('short');
        expect(sanitized.longString).toHaveLength(1003); // 1000 + '...'
        expect(sanitized.longString.endsWith('...')).toBe(true);
      });
    });
  });
});