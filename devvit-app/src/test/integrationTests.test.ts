/**
 * Integration Test Suite for Reddit Treasure Hunt Game
 * 
 * Tests end-to-end flows for complete challenge completion, analytics data flow,
 * GPS verification and fraud prevention, and social engagement tracking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { 
  Challenge, 
  GPSCoordinate, 
  ProofSubmission, 
  Submission,
  UserProfile,
  ProofType 
} from '../types/core.js';
import type { 
  EngagementEvent, 
  ChallengeCompletion,
  AnalyticsAPIResponse 
} from '../types/analytics.js';

// Import services for integration testing
import { AnalyticsClient } from '../services/analytics.js';
import { ChallengeDetailComponent } from '../components/ChallengeDetail.js';
import { ProofSubmissionComponent } from '../components/ProofSubmission.js';
import { ChallengeBrowserComponent } from '../components/ChallengeBrowser.js';
import { LeaderboardComponent } from '../components/Leaderboard.js';
import { UserProfileComponent } from '../components/UserProfile.js';

// Mock external dependencies
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Devvit context for integration tests
const createMockDevvitContext = () => ({
  reddit: {
    getCurrentUser: vi.fn(),
    submitPost: vi.fn(),
    submitComment: vi.fn(),
    getPostById: vi.fn(),
    getCommentById: vi.fn()
  },
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn()
  },
  kvStore: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
  },
  postId: 'test-post-123',
  subredditName: 'michiganspots',
  userId: 'user-456'
});

// Test data factories
const createTestChallenge = (overrides: Partial<Challenge> = {}): Challenge => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    id: 'challenge-123',
    title: 'Visit Amazing Coffee Shop',
    description: 'Take a photo at our local coffee shop and earn 25 points!',
    partnerId: 'partner-456',
    partnerName: 'Amazing Coffee Shop',
    partnerBranding: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#8B4513',
      secondaryColor: '#D2691E'
    },
    difficulty: 'medium',
    points: 25,
    startDate: yesterday,
    endDate: tomorrow,
    location: {
      coordinates: { latitude: 42.3314, longitude: -83.0458 },
      address: '123 Coffee St, Detroit, MI 48201',
      businessName: 'Amazing Coffee Shop',
      verificationRadius: 100
    },
    proofRequirements: {
      types: ['photo'],
      instructions: 'Take a photo of the storefront showing the business name',
      examples: ['Photo of the front entrance', 'Photo of the business sign']
    },
    status: 'active',
    redditPostId: 'reddit-post-789',
    createdAt: yesterday,
    updatedAt: now,
    ...overrides
  };
};

const createTestUserLocation = (distance: number = 50): GPSCoordinate => {
  // Create a location within specified distance of the test business
  const businessLat = 42.3314;
  const businessLng = -83.0458;
  
  // Approximate offset for distance in meters (rough calculation)
  const latOffset = (distance / 111000); // 1 degree lat ≈ 111km
  const lngOffset = (distance / (111000 * Math.cos(businessLat * Math.PI / 180)));
  
  return {
    latitude: businessLat + latOffset,
    longitude: businessLng + lngOffset,
    accuracy: 10,
    timestamp: new Date()
  };
};

describe('Integration Tests - Complete Challenge Completion Flow', () => {
  let mockDevvitContext: ReturnType<typeof createMockDevvitContext>;
  let analyticsClient: AnalyticsClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDevvitContext = createMockDevvitContext();
    
    // Setup analytics client
    analyticsClient = new AnalyticsClient({
      baseUrl: 'https://test-api.com/analytics',
      apiKey: 'test-api-key',
      retryAttempts: 3,
      retryDelay: 100,
      timeout: 5000
    });

    // Mock successful API responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, processedEvents: 1 })
    });

    // Mock user authentication
    mockDevvitContext.reddit.getCurrentUser.mockResolvedValue({
      username: 'testuser',
      id: 'user-456'
    });

    // Mock Reddit post/comment creation
    mockDevvitContext.reddit.submitComment.mockResolvedValue({
      permalink: '/r/michiganspots/comments/abc123/def456'
    });

    mockDevvitContext.reddit.submitPost.mockResolvedValue({
      permalink: '/r/michiganspots/comments/xyz789'
    });

    // Mock Redis operations
    mockDevvitContext.redis.get.mockResolvedValue(null);
    mockDevvitContext.redis.set.mockResolvedValue(true);
  });

  it('should complete full challenge completion flow with analytics tracking', async () => {
    const challenge = createTestChallenge();
    const userLocation = createTestUserLocation(50); // 50m from business
    
    // Step 1: User views challenge (should trigger analytics)
    await ChallengeDetailComponent.trackChallengeView(
      challenge.id,
      'testuser',
      mockDevvitContext.postId
    );

    // Verify view event was sent
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-api.com/analytics/track-engagement',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          eventType: 'view',
          challengeId: parseInt(challenge.id),
          userRedditUsername: 'testuser',
          postId: mockDevvitContext.postId,
          timestamp: expect.any(String)
        })
      })
    );

    // Step 2: User submits proof
    const proofSubmission: ProofSubmission = {
      type: 'photo',
      data: {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      },
      metadata: {
        timestamp: new Date(),
        location: userLocation,
        deviceInfo: 'Devvit App'
      }
    };

    const submissionResult = await ProofSubmissionComponent.submitProof(
      mockDevvitContext as any,
      challenge,
      proofSubmission,
      userLocation
    );

    // Verify submission was successful
    expect(submissionResult.success).toBe(true);
    expect(submissionResult.submission).toBeDefined();
    expect(submissionResult.submission!.challengeId).toBe(challenge.id);
    expect(submissionResult.submission!.verificationStatus).toBe('approved');

    // Step 3: Verify Reddit content was created
    expect(mockDevvitContext.reddit.submitComment).toHaveBeenCalledWith({
      id: challenge.redditPostId,
      text: expect.stringContaining('Challenge Completed: Visit Amazing Coffee Shop')
    });

    // Step 4: Verify challenge completion analytics event was sent
    const challengeCompletionCall = mockFetch.mock.calls.find(call => 
      call[0].includes('track-challenge')
    );
    expect(challengeCompletionCall).toBeDefined();
    
    const completionPayload = JSON.parse(challengeCompletionCall![1].body);
    expect(completionPayload).toMatchObject({
      challengeId: parseInt(challenge.id),
      userRedditUsername: 'testuser',
      submissionType: 'comment',
      gpsCoordinates: userLocation,
      proofType: 'photo',
      pointsAwarded: 25,
      verificationStatus: 'approved'
    });

    // Step 5: Verify user profile was updated
    const userProfileUpdateCall = mockDevvitContext.redis.set.mock.calls.find(call => 
      call[0] === 'user:testuser'
    );
    expect(userProfileUpdateCall).toBeDefined();
    
    const updatedProfile = JSON.parse(userProfileUpdateCall![1]);
    expect(updatedProfile.totalPoints).toBe(25);
    expect(updatedProfile.completedChallenges).toContain(challenge.id);
    expect(updatedProfile.statistics.totalSubmissions).toBe(1);
    expect(updatedProfile.statistics.successfulSubmissions).toBe(1);
  });

  it('should handle GPS verification failure in complete flow', async () => {
    const challenge = createTestChallenge();
    const userLocation = createTestUserLocation(200); // 200m from business (too far)
    
    const proofSubmission: ProofSubmission = {
      type: 'photo',
      data: {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      },
      metadata: {
        timestamp: new Date(),
        location: userLocation,
        deviceInfo: 'Devvit App'
      }
    };

    const submissionResult = await ProofSubmissionComponent.submitProof(
      mockDevvitContext as any,
      challenge,
      proofSubmission,
      userLocation
    );

    // Verify submission failed due to GPS
    expect(submissionResult.success).toBe(false);
    expect(submissionResult.error).toContain('You must be within 100m');

    // Verify no analytics events were sent for failed submission
    const challengeCompletionCall = mockFetch.mock.calls.find(call => 
      call[0].includes('track-challenge')
    );
    expect(challengeCompletionCall).toBeUndefined();

    // Verify no Reddit content was created
    expect(mockDevvitContext.reddit.submitComment).not.toHaveBeenCalled();
    expect(mockDevvitContext.reddit.submitPost).not.toHaveBeenCalled();
  });

  it('should handle duplicate submission prevention', async () => {
    const challenge = createTestChallenge();
    const userLocation = createTestUserLocation(50);
    
    // Mock existing user profile with completed challenge
    const existingProfile = {
      redditUsername: 'testuser',
      totalPoints: 50,
      completedChallenges: [challenge.id], // Already completed
      badges: [],
      statistics: {
        totalSubmissions: 5,
        successfulSubmissions: 4
      }
    };
    mockDevvitContext.redis.get.mockResolvedValue(JSON.stringify(existingProfile));

    const proofSubmission: ProofSubmission = {
      type: 'photo',
      data: {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      },
      metadata: {
        timestamp: new Date(),
        location: userLocation,
        deviceInfo: 'Devvit App'
      }
    };

    const submissionResult = await ProofSubmissionComponent.submitProof(
      mockDevvitContext as any,
      challenge,
      proofSubmission,
      userLocation
    );

    // Verify submission was rejected due to duplicate
    expect(submissionResult.success).toBe(false);
    expect(submissionResult.error).toContain('already completed');

    // Verify no new analytics events were sent
    const challengeCompletionCall = mockFetch.mock.calls.find(call => 
      call[0].includes('track-challenge')
    );
    expect(challengeCompletionCall).toBeUndefined();
  });

  it('should continue flow even if analytics fails', async () => {
    const challenge = createTestChallenge();
    const userLocation = createTestUserLocation(50);
    
    // Mock analytics API failure
    mockFetch.mockRejectedValue(new Error('Analytics API error'));

    const proofSubmission: ProofSubmission = {
      type: 'gps_checkin',
      data: {},
      metadata: {
        timestamp: new Date(),
        location: userLocation,
        deviceInfo: 'Devvit App'
      }
    };

    const submissionResult = await ProofSubmissionComponent.submitProof(
      mockDevvitContext as any,
      challenge,
      proofSubmission,
      userLocation
    );

    // Verify submission still succeeded despite analytics failure
    expect(submissionResult.success).toBe(true);
    expect(submissionResult.submission).toBeDefined();

    // Verify Reddit content was still created
    expect(mockDevvitContext.reddit.submitComment).toHaveBeenCalled();

    // Verify user profile was still updated
    const userProfileUpdateCall = mockDevvitContext.redis.set.mock.calls.find(call => 
      call[0] === 'user:testuser'
    );
    expect(userProfileUpdateCall).toBeDefined();
  });
});

describe('Integration Tests - Analytics Data Flow', () => {
  let mockDevvitContext: ReturnType<typeof createMockDevvitContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDevvitContext = createMockDevvitContext();
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, processedEvents: 1 })
    });
  });

  it('should track complete user journey analytics from view to completion', async () => {
    const challenge = createTestChallenge();
    const userLocation = createTestUserLocation(50);

    // Step 1: Track challenge view
    await ChallengeDetailComponent.trackChallengeView(
      challenge.id,
      'testuser',
      'post-123'
    );

    // Step 2: Simulate social engagement (comment)
    const commentEvent: EngagementEvent = {
      eventType: 'comment',
      challengeId: parseInt(challenge.id),
      userRedditUsername: 'testuser',
      postId: 'post-123',
      commentId: 'comment-456',
      timestamp: new Date().toISOString(),
      eventData: {
        commentLength: 25,
        hasMedia: false,
        subreddit: 'michiganspots'
      }
    };

    const analyticsClient = new AnalyticsClient({
      baseUrl: 'https://test-api.com/analytics',
      apiKey: 'test-key',
      retryAttempts: 3,
      retryDelay: 100,
      timeout: 5000
    });

    await analyticsClient.trackEngagement(commentEvent);

    // Step 3: Simulate upvote
    const upvoteEvent: EngagementEvent = {
      eventType: 'upvote',
      challengeId: parseInt(challenge.id),
      userRedditUsername: 'testuser',
      postId: 'post-123',
      timestamp: new Date().toISOString(),
      eventData: {
        voteDirection: 'up',
        subreddit: 'michiganspots'
      }
    };

    await analyticsClient.trackEngagement(upvoteEvent);

    // Step 4: Complete challenge
    mockDevvitContext.reddit.getCurrentUser.mockResolvedValue({
      username: 'testuser',
      id: 'user-456'
    });
    mockDevvitContext.reddit.submitComment.mockResolvedValue({
      permalink: '/r/michiganspots/comments/abc123/def456'
    });
    mockDevvitContext.redis.get.mockResolvedValue(null);
    mockDevvitContext.redis.set.mockResolvedValue(true);

    const proofSubmission: ProofSubmission = {
      type: 'photo',
      data: {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      },
      metadata: {
        timestamp: new Date(),
        location: userLocation,
        deviceInfo: 'Devvit App'
      }
    };

    await ProofSubmissionComponent.submitProof(
      mockDevvitContext as any,
      challenge,
      proofSubmission,
      userLocation
    );

    // Verify all analytics events were sent in correct order
    const apiCalls = mockFetch.mock.calls;
    
    // Should have 4 calls: view, comment, upvote, completion
    expect(apiCalls).toHaveLength(4);

    // Verify view event
    const viewCall = apiCalls.find(call => {
      const body = JSON.parse(call[1].body);
      return body.eventType === 'view';
    });
    expect(viewCall).toBeDefined();

    // Verify comment event
    const commentCall = apiCalls.find(call => {
      const body = JSON.parse(call[1].body);
      return body.eventType === 'comment';
    });
    expect(commentCall).toBeDefined();

    // Verify upvote event
    const upvoteCall = apiCalls.find(call => {
      const body = JSON.parse(call[1].body);
      return body.eventType === 'upvote';
    });
    expect(upvoteCall).toBeDefined();

    // Verify completion event
    const completionCall = apiCalls.find(call => 
      call[0].includes('track-challenge')
    );
    expect(completionCall).toBeDefined();
  });

  it('should handle analytics API retry logic during high load', async () => {
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        // First two calls fail with 500 error
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        });
      }
      // Third call succeeds
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, processedEvents: 1 })
      });
    });

    const analyticsClient = new AnalyticsClient({
      baseUrl: 'https://test-api.com/analytics',
      apiKey: 'test-key',
      retryAttempts: 3,
      retryDelay: 10, // Short delay for testing
      timeout: 5000
    });

    const event: EngagementEvent = {
      eventType: 'view',
      challengeId: 123,
      userRedditUsername: 'testuser',
      postId: 'post-123',
      timestamp: new Date().toISOString()
    };

    const result = await analyticsClient.trackEngagement(event);

    // Verify it eventually succeeded after retries
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should batch multiple engagement events efficiently', async () => {
    const analyticsClient = new AnalyticsClient({
      baseUrl: 'https://test-api.com/analytics',
      apiKey: 'test-key',
      retryAttempts: 3,
      retryDelay: 100,
      timeout: 5000
    });

    // Simulate rapid engagement events
    const events: EngagementEvent[] = [
      {
        eventType: 'view',
        challengeId: 123,
        userRedditUsername: 'user1',
        postId: 'post-123',
        timestamp: new Date().toISOString()
      },
      {
        eventType: 'comment',
        challengeId: 123,
        userRedditUsername: 'user2',
        postId: 'post-123',
        commentId: 'comment-456',
        timestamp: new Date().toISOString()
      },
      {
        eventType: 'upvote',
        challengeId: 123,
        userRedditUsername: 'user3',
        postId: 'post-123',
        timestamp: new Date().toISOString()
      }
    ];

    // Send all events concurrently
    const results = await Promise.all(
      events.map(event => analyticsClient.trackEngagement(event))
    );

    // Verify all events were processed successfully
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // Verify correct number of API calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

describe('Integration Tests - GPS Verification and Fraud Prevention', () => {
  let mockDevvitContext: ReturnType<typeof createMockDevvitContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDevvitContext = createMockDevvitContext();
    
    mockDevvitContext.reddit.getCurrentUser.mockResolvedValue({
      username: 'testuser',
      id: 'user-456'
    });
    mockDevvitContext.redis.get.mockResolvedValue(null);
    mockDevvitContext.redis.set.mockResolvedValue(true);
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, processedEvents: 1 })
    });
  });

  it('should detect and prevent GPS spoofing attempts', async () => {
    const challenge = createTestChallenge();
    
    // Create suspicious GPS data (impossible travel speed)
    const firstLocation: GPSCoordinate = {
      latitude: 42.3314, // Detroit
      longitude: -83.0458,
      accuracy: 5,
      timestamp: new Date('2024-01-01T12:00:00Z')
    };

    const secondLocation: GPSCoordinate = {
      latitude: 40.7128, // New York (impossible to travel in 1 minute)
      longitude: -74.0060,
      accuracy: 5,
      timestamp: new Date('2024-01-01T12:01:00Z')
    };

    // Mock user history with recent submission
    const userHistory = {
      redditUsername: 'testuser',
      totalPoints: 25,
      completedChallenges: ['other-challenge'],
      badges: [],
      statistics: {
        totalSubmissions: 1,
        successfulSubmissions: 1,
        lastSubmissionLocation: firstLocation,
        lastSubmissionTime: firstLocation.timestamp
      }
    };
    mockDevvitContext.redis.get.mockResolvedValue(JSON.stringify(userHistory));

    const proofSubmission: ProofSubmission = {
      type: 'photo',
      data: {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      },
      metadata: {
        timestamp: secondLocation.timestamp!,
        location: secondLocation,
        deviceInfo: 'Devvit App'
      }
    };

    const submissionResult = await ProofSubmissionComponent.submitProof(
      mockDevvitContext as any,
      challenge,
      proofSubmission,
      secondLocation
    );

    // Verify submission was rejected due to fraud detection
    expect(submissionResult.success).toBe(false);
    expect(submissionResult.error).toContain('GPS location could not be verified');

    // Verify no analytics events were sent
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle legitimate GPS variations and accuracy issues', async () => {
    const challenge = createTestChallenge();
    
    // Create location with lower accuracy but still valid
    const userLocation: GPSCoordinate = {
      latitude: 42.3320, // Slightly off but within radius
      longitude: -83.0465,
      accuracy: 50, // Lower accuracy
      timestamp: new Date()
    };

    const proofSubmission: ProofSubmission = {
      type: 'photo',
      data: {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      },
      metadata: {
        timestamp: new Date(),
        location: userLocation,
        deviceInfo: 'Devvit App'
      }
    };

    const submissionResult = await ProofSubmissionComponent.submitProof(
      mockDevvitContext as any,
      challenge,
      proofSubmission,
      userLocation
    );

    // Verify submission succeeded despite lower accuracy
    expect(submissionResult.success).toBe(true);
    expect(submissionResult.submission).toBeDefined();
  });

  it('should implement rate limiting for rapid submissions', async () => {
    const challenge = createTestChallenge();
    const userLocation = createTestUserLocation(50);

    // Mock user with recent rapid submissions
    const userHistory = {
      redditUsername: 'testuser',
      totalPoints: 100,
      completedChallenges: ['challenge-1', 'challenge-2'],
      badges: [],
      statistics: {
        totalSubmissions: 10,
        successfulSubmissions: 8,
        recentSubmissions: [
          new Date(Date.now() - 30000), // 30 seconds ago
          new Date(Date.now() - 60000), // 1 minute ago
          new Date(Date.now() - 90000), // 1.5 minutes ago
          new Date(Date.now() - 120000), // 2 minutes ago
          new Date(Date.now() - 150000)  // 2.5 minutes ago - 5 submissions in 3 minutes
        ]
      }
    };
    mockDevvitContext.redis.get.mockResolvedValue(JSON.stringify(userHistory));

    const proofSubmission: ProofSubmission = {
      type: 'photo',
      data: {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      },
      metadata: {
        timestamp: new Date(),
        location: userLocation,
        deviceInfo: 'Devvit App'
      }
    };

    const submissionResult = await ProofSubmissionComponent.submitProof(
      mockDevvitContext as any,
      challenge,
      proofSubmission,
      userLocation
    );

    // Verify submission was rate limited
    expect(submissionResult.success).toBe(false);
    expect(submissionResult.error).toContain('rate limit');
  });
});

describe('Integration Tests - Social Engagement Tracking', () => {
  let mockDevvitContext: ReturnType<typeof createMockDevvitContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDevvitContext = createMockDevvitContext();
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, processedEvents: 1 })
    });
  });

  it('should track Reddit interactions on challenge posts', async () => {
    const challenge = createTestChallenge();
    
    // Mock Reddit event context
    const redditEventContext = {
      postId: challenge.redditPostId,
      post: {
        id: challenge.redditPostId,
        title: `Challenge_${challenge.id}: ${challenge.title}`,
        body: challenge.description,
        linkFlairText: 'Active Challenge'
      },
      user: {
        id: 'user-456',
        username: 'testuser'
      },
      subreddit: {
        name: 'michiganspots'
      }
    };

    // Import and test Reddit event service
    const { RedditEventService } = await import('../services/redditEventService.js');
    const redditEventService = new (RedditEventService as any)();

    // Test comment event
    const commentContext = {
      ...redditEventContext,
      comment: {
        id: 'comment-789',
        body: 'This looks like a great challenge!'
      }
    };

    const commentEventResult = await redditEventService.processRedditEvent('comment', commentContext);
    expect(commentEventResult).toMatchObject({
      postId: challenge.redditPostId,
      commentId: 'comment-789',
      username: 'testuser',
      subredditName: 'michiganspots',
      challengeId: challenge.id,
      eventType: 'comment'
    });

    // Test upvote event
    const upvoteEventResult = await redditEventService.processRedditEvent('upvote', redditEventContext);
    expect(upvoteEventResult).toMatchObject({
      postId: challenge.redditPostId,
      username: 'testuser',
      subredditName: 'michiganspots',
      challengeId: challenge.id,
      eventType: 'upvote'
    });

    // Test share event
    const shareContext = {
      ...redditEventContext,
      destination: 'twitter'
    };
    const shareEventResult = await redditEventService.processRedditEvent('share', shareContext);
    expect(shareEventResult).toMatchObject({
      postId: challenge.redditPostId,
      username: 'testuser',
      subredditName: 'michiganspots',
      challengeId: challenge.id,
      eventType: 'share'
    });
  });

  it('should filter out non-challenge-related Reddit interactions', async () => {
    // Mock regular Reddit post (not challenge-related)
    const regularPostContext = {
      postId: 'regular-post-123',
      post: {
        id: 'regular-post-123',
        title: 'General discussion about Michigan',
        body: 'Just a regular post about Michigan',
        linkFlairText: 'Discussion'
      },
      user: {
        id: 'user-456',
        username: 'testuser'
      },
      subreddit: {
        name: 'michiganspots'
      }
    };

    const { RedditEventService } = await import('../services/redditEventService.js');
    const redditEventService = new (RedditEventService as any)();

    const eventResult = await redditEventService.processRedditEvent('view', regularPostContext);
    
    // Should return null for non-challenge content
    expect(eventResult).toBeNull();

    // Verify no analytics events were sent
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle Reddit API errors gracefully during social tracking', async () => {
    const challenge = createTestChallenge();
    
    // Mock Reddit API failure
    mockDevvitContext.reddit.submitComment.mockRejectedValue(new Error('Reddit API error'));
    mockDevvitContext.reddit.getCurrentUser.mockResolvedValue({
      username: 'testuser',
      id: 'user-456'
    });
    mockDevvitContext.redis.get.mockResolvedValue(null);
    mockDevvitContext.redis.set.mockResolvedValue(true);

    const userLocation = createTestUserLocation(50);
    const proofSubmission: ProofSubmission = {
      type: 'gps_checkin',
      data: {},
      metadata: {
        timestamp: new Date(),
        location: userLocation,
        deviceInfo: 'Devvit App'
      }
    };

    const submissionResult = await ProofSubmissionComponent.submitProof(
      mockDevvitContext as any,
      challenge,
      proofSubmission,
      userLocation
    );

    // Verify submission still succeeded despite Reddit API failure
    expect(submissionResult.success).toBe(true);
    expect(submissionResult.submission).toBeDefined();

    // Verify analytics event was still sent
    const completionCall = mockFetch.mock.calls.find(call => 
      call[0].includes('track-challenge')
    );
    expect(completionCall).toBeDefined();
  });
});