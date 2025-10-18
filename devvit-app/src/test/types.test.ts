/**
 * Tests for core type definitions
 */

import { describe, it, expect } from 'vitest';
import type { 
  Challenge, 
  UserProfile, 
  Submission, 
  EngagementEvent,
  ChallengeCompletion,
  GPSCoordinate,
  AppConfig 
} from '../types/index.js';
import { CONSTANTS, REDIS_KEYS } from '../types/index.js';

describe('Core Types', () => {
  it('should define Challenge interface correctly', () => {
    const challenge: Challenge = {
      id: 'test-challenge-1',
      title: 'Visit Local Coffee Shop',
      description: 'Take a photo at our coffee shop',
      partnerId: 'partner-1',
      partnerName: 'Local Coffee Shop',
      partnerBranding: {
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      },
      difficulty: 'easy',
      points: 10,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      location: {
        coordinates: { latitude: 42.3314, longitude: -83.0458 },
        address: '123 Main St, Detroit, MI',
        businessName: 'Local Coffee Shop',
        verificationRadius: 100,
      },
      proofRequirements: {
        types: ['photo'],
        instructions: 'Take a photo of the storefront',
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(challenge.id).toBe('test-challenge-1');
    expect(challenge.difficulty).toBe('easy');
    expect(challenge.points).toBe(10);
  });

  it('should define UserProfile interface correctly', () => {
    const userProfile: UserProfile = {
      redditUsername: 'testuser',
      totalPoints: 100,
      completedChallenges: ['challenge-1', 'challenge-2'],
      badges: [],
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      preferences: {
        notifications: true,
        leaderboardVisible: true,
        locationSharing: false,
      },
      statistics: {
        totalSubmissions: 5,
        successfulSubmissions: 4,
        averageCompletionTime: 1800, // 30 minutes
        favoritePartners: ['partner-1'],
      },
    };

    expect(userProfile.redditUsername).toBe('testuser');
    expect(userProfile.totalPoints).toBe(100);
    expect(userProfile.completedChallenges).toHaveLength(2);
  });

  it('should define Submission interface correctly', () => {
    const submission: Submission = {
      id: 'submission-1',
      challengeId: 'challenge-1',
      userRedditUsername: 'testuser',
      proofType: 'photo',
      proofData: { imageUrl: 'https://example.com/photo.jpg' },
      submittedAt: new Date(),
      verificationStatus: 'pending',
      gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
      fraudRiskScore: 0.1,
    };

    expect(submission.challengeId).toBe('challenge-1');
    expect(submission.proofType).toBe('photo');
    expect(submission.verificationStatus).toBe('pending');
  });
});

describe('Analytics Types', () => {
  it('should define EngagementEvent interface correctly', () => {
    const event: EngagementEvent = {
      eventType: 'view',
      challengeId: 1,
      userRedditUsername: 'testuser',
      postId: 'post123',
      timestamp: new Date().toISOString(),
    };

    expect(event.eventType).toBe('view');
    expect(event.challengeId).toBe(1);
  });

  it('should define ChallengeCompletion interface correctly', () => {
    const completion: ChallengeCompletion = {
      challengeId: 1,
      userRedditUsername: 'testuser',
      submissionUrl: 'https://reddit.com/r/michiganspots/comments/abc123',
      submissionType: 'post',
      completedAt: new Date().toISOString(),
      gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
      proofType: 'photo',
      pointsAwarded: 10,
      verificationStatus: 'approved',
      timestamp: new Date().toISOString(),
    };

    expect(completion.challengeId).toBe(1);
    expect(completion.pointsAwarded).toBe(10);
    expect(completion.proofType).toBe('photo');
  });
});

describe('Constants and Utilities', () => {
  it('should define point values correctly', () => {
    expect(CONSTANTS.POINTS.EASY).toBe(10);
    expect(CONSTANTS.POINTS.MEDIUM).toBe(25);
    expect(CONSTANTS.POINTS.HARD).toBe(50);
  });

  it('should generate Redis keys correctly', () => {
    expect(REDIS_KEYS.USER_PROFILE('testuser')).toBe('user:testuser');
    expect(REDIS_KEYS.CHALLENGE('challenge-1')).toBe('challenge:challenge-1');
    expect(REDIS_KEYS.LEADERBOARD('individual')).toBe('leaderboard:individual');
  });

  it('should define GPS constants correctly', () => {
    expect(CONSTANTS.GPS.DEFAULT_RADIUS).toBe(100);
    expect(CONSTANTS.GPS.MAX_ACCURACY).toBe(50);
  });
});