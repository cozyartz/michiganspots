/**
 * Unit tests for Challenge Browser component and utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Challenge, ChallengeFilters, GPSCoordinate } from '../types/core.js';
import { ChallengeBrowserUtils } from '../components/ChallengeBrowser.js';
import {
  calculateChallengeStatus,
  isChallengeActive,
  filterChallenges,
  sortChallenges,
  getActiveChallenges,
  getChallengeStatusText,
  getDifficultyColor,
  calculateDistance,
  validateChallengeFilters
} from '../utils/challengeUtils.js';

// Mock data for testing
const mockGPSCoordinate: GPSCoordinate = {
  latitude: 42.3314,
  longitude: -83.0458,
  accuracy: 10
};

const mockBusinessLocation: GPSCoordinate = {
  latitude: 42.3320,
  longitude: -83.0460,
  accuracy: 5
};

const createMockChallenge = (overrides: Partial<Challenge> = {}): Challenge => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    id: 'challenge-1',
    title: 'Test Challenge',
    description: 'A test challenge for unit testing',
    partnerId: 'partner-1',
    partnerName: 'Test Business',
    partnerBranding: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00'
    },
    difficulty: 'medium',
    points: 25,
    startDate: yesterday,
    endDate: tomorrow,
    location: {
      coordinates: mockBusinessLocation,
      address: '123 Test St, Detroit, MI',
      businessName: 'Test Business',
      verificationRadius: 100
    },
    proofRequirements: {
      types: ['photo'],
      instructions: 'Take a photo of the storefront'
    },
    status: 'active',
    maxCompletions: undefined,
    redditPostId: 'post-123',
    createdAt: yesterday,
    updatedAt: now,
    ...overrides
  };
};

describe('Challenge Status Calculations', () => {
  describe('calculateChallengeStatus', () => {
    it('should return "completed" if user has completed the challenge', () => {
      const challenge = createMockChallenge();
      const userCompletedChallenges = new Set(['challenge-1']);
      
      const status = calculateChallengeStatus(challenge, userCompletedChallenges);
      expect(status).toBe('completed');
    });

    it('should return "expired" if challenge end date has passed', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const challenge = createMockChallenge({
        endDate: yesterday
      });
      
      const status = calculateChallengeStatus(challenge);
      expect(status).toBe('expired');
    });

    it('should return "expired" if challenge has not started yet', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const challenge = createMockChallenge({
        startDate: tomorrow,
        endDate: dayAfterTomorrow
      });
      
      const status = calculateChallengeStatus(challenge);
      expect(status).toBe('expired');
    });

    it('should return "expired" if challenge has reached max completions', () => {
      const challenge = createMockChallenge({
        maxCompletions: 0
      });
      
      const status = calculateChallengeStatus(challenge);
      expect(status).toBe('expired');
    });

    it('should return "active" for valid active challenge', () => {
      const challenge = createMockChallenge();
      
      const status = calculateChallengeStatus(challenge);
      expect(status).toBe('active');
    });
  });

  describe('isChallengeActive', () => {
    it('should return true for active challenges', () => {
      const challenge = createMockChallenge();
      
      const isActive = isChallengeActive(challenge);
      expect(isActive).toBe(true);
    });

    it('should return false for completed challenges', () => {
      const challenge = createMockChallenge();
      const userCompletedChallenges = new Set(['challenge-1']);
      
      const isActive = isChallengeActive(challenge, userCompletedChallenges);
      expect(isActive).toBe(false);
    });

    it('should return false for expired challenges', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const challenge = createMockChallenge({
        endDate: yesterday
      });
      
      const isActive = isChallengeActive(challenge);
      expect(isActive).toBe(false);
    });
  });

  describe('getChallengeStatusText', () => {
    it('should return "Completed" for completed challenges', () => {
      const challenge = createMockChallenge();
      const userCompletedChallenges = new Set(['challenge-1']);
      
      const statusText = getChallengeStatusText(challenge, userCompletedChallenges);
      expect(statusText).toBe('Completed');
    });

    it('should return "Expired" for past end date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const challenge = createMockChallenge({
        endDate: yesterday
      });
      
      const statusText = getChallengeStatusText(challenge);
      expect(statusText).toBe('Expired');
    });

    it('should return "Expires Today" for challenges ending today', () => {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const challenge = createMockChallenge({
        endDate: endOfToday
      });
      
      const statusText = getChallengeStatusText(challenge);
      expect(statusText).toBe('Expires Today');
    });

    it('should return days left for challenges ending within a week', () => {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const challenge = createMockChallenge({
        endDate: threeDaysFromNow
      });
      
      const statusText = getChallengeStatusText(challenge);
      expect(statusText).toBe('3 days left');
    });

    it('should return "Active" for challenges ending more than a week away', () => {
      const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const challenge = createMockChallenge({
        endDate: tenDaysFromNow
      });
      
      const statusText = getChallengeStatusText(challenge);
      expect(statusText).toBe('Active');
    });
  });
});

describe('Challenge Filtering Logic', () => {
  let challenges: Challenge[];

  beforeEach(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    challenges = [
      createMockChallenge({
        id: 'easy-challenge',
        difficulty: 'easy',
        points: 10,
        partnerId: 'partner-1'
      }),
      createMockChallenge({
        id: 'medium-challenge',
        difficulty: 'medium',
        points: 25,
        partnerId: 'partner-2'
      }),
      createMockChallenge({
        id: 'hard-challenge',
        difficulty: 'hard',
        points: 50,
        partnerId: 'partner-1'
      }),
      createMockChallenge({
        id: 'expired-challenge',
        difficulty: 'easy',
        points: 10,
        endDate: yesterday,
        partnerId: 'partner-3'
      })
    ];
  });

  describe('filterChallenges', () => {
    it('should filter by difficulty', () => {
      const filters: ChallengeFilters = { difficulty: 'easy' };
      const filtered = filterChallenges(challenges, filters);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.difficulty === 'easy')).toBe(true);
    });

    it('should filter by status', () => {
      const filters: ChallengeFilters = { status: 'active' };
      const filtered = filterChallenges(challenges, filters);
      
      expect(filtered).toHaveLength(3);
      expect(filtered.every(c => c.id !== 'expired-challenge')).toBe(true);
    });

    it('should filter by partner ID', () => {
      const filters: ChallengeFilters = { partnerId: 'partner-1' };
      const filtered = filterChallenges(challenges, filters);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.partnerId === 'partner-1')).toBe(true);
    });

    it('should filter by distance when user location is provided', () => {
      const userLocation: GPSCoordinate = {
        latitude: 42.3314,
        longitude: -83.0458
      };
      
      // Create challenges with different distances
      const nearChallenge = createMockChallenge({
        id: 'near-challenge',
        location: {
          ...challenges[0].location,
          coordinates: { latitude: 42.3315, longitude: -83.0459 } // Very close
        }
      });
      
      const farChallenge = createMockChallenge({
        id: 'far-challenge',
        location: {
          ...challenges[0].location,
          coordinates: { latitude: 43.0000, longitude: -84.0000 } // Far away
        }
      });

      const testChallenges = [nearChallenge, farChallenge];
      const filters: ChallengeFilters = { maxDistance: 1000 }; // 1km radius
      
      const filtered = filterChallenges(testChallenges, filters, userLocation);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('near-challenge');
    });

    it('should apply multiple filters simultaneously', () => {
      const filters: ChallengeFilters = {
        difficulty: 'easy',
        status: 'active',
        partnerId: 'partner-1'
      };
      
      const filtered = filterChallenges(challenges, filters);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('easy-challenge');
    });
  });

  describe('getActiveChallenges', () => {
    it('should return only active challenges', () => {
      const activeChallenges = getActiveChallenges(challenges);
      
      expect(activeChallenges).toHaveLength(3);
      expect(activeChallenges.every(c => c.id !== 'expired-challenge')).toBe(true);
    });

    it('should exclude user completed challenges', () => {
      const userCompletedChallenges = new Set(['easy-challenge']);
      const activeChallenges = getActiveChallenges(challenges, userCompletedChallenges);
      
      expect(activeChallenges).toHaveLength(2);
      expect(activeChallenges.every(c => c.id !== 'easy-challenge')).toBe(true);
    });
  });
});

describe('Challenge Sorting Logic', () => {
  let challenges: Challenge[];

  beforeEach(() => {
    const now = new Date();
    challenges = [
      createMockChallenge({
        id: 'challenge-1',
        points: 10,
        difficulty: 'easy',
        endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      }),
      createMockChallenge({
        id: 'challenge-2',
        points: 50,
        difficulty: 'hard',
        endDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
      }),
      createMockChallenge({
        id: 'challenge-3',
        points: 25,
        difficulty: 'medium',
        endDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      })
    ];
  });

  describe('sortChallenges', () => {
    it('should sort by points ascending', () => {
      const sorted = sortChallenges(challenges, 'points', 'asc');
      
      expect(sorted[0].points).toBe(10);
      expect(sorted[1].points).toBe(25);
      expect(sorted[2].points).toBe(50);
    });

    it('should sort by points descending', () => {
      const sorted = sortChallenges(challenges, 'points', 'desc');
      
      expect(sorted[0].points).toBe(50);
      expect(sorted[1].points).toBe(25);
      expect(sorted[2].points).toBe(10);
    });

    it('should sort by difficulty ascending', () => {
      const sorted = sortChallenges(challenges, 'difficulty', 'asc');
      
      expect(sorted[0].difficulty).toBe('easy');
      expect(sorted[1].difficulty).toBe('medium');
      expect(sorted[2].difficulty).toBe('hard');
    });

    it('should sort by end date ascending (default)', () => {
      const sorted = sortChallenges(challenges);
      
      expect(sorted[0].id).toBe('challenge-2'); // Ends soonest
      expect(sorted[1].id).toBe('challenge-3');
      expect(sorted[2].id).toBe('challenge-1'); // Ends latest
    });

    it('should sort by distance when user location provided', () => {
      const userLocation: GPSCoordinate = {
        latitude: 42.3314,
        longitude: -83.0458
      };

      // Modify challenges to have different distances
      const challengesWithDistance = challenges.map((challenge, index) => ({
        ...challenge,
        location: {
          ...challenge.location,
          coordinates: {
            latitude: 42.3314 + (index * 0.01), // Increasing distance
            longitude: -83.0458 + (index * 0.01)
          }
        }
      }));

      const sorted = sortChallenges(challengesWithDistance, 'distance', 'asc', userLocation);
      
      // First challenge should be closest (index 0 has smallest offset)
      expect(sorted[0].id).toBe('challenge-1');
    });
  });
});

describe('ChallengeBrowserUtils', () => {
  let challenges: Challenge[];
  let userCompletedChallenges: string[];
  let userLocation: GPSCoordinate;

  beforeEach(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    challenges = [
      createMockChallenge({
        id: 'active-challenge',
        difficulty: 'easy',
        points: 10,
        endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
      }),
      createMockChallenge({
        id: 'completed-challenge',
        difficulty: 'medium',
        points: 25
      }),
      createMockChallenge({
        id: 'expired-challenge',
        difficulty: 'hard',
        points: 50,
        endDate: yesterday
      })
    ];

    userCompletedChallenges = ['completed-challenge'];
    userLocation = mockGPSCoordinate;
  });

  describe('getDisplayChallenges', () => {
    it('should return filtered and sorted challenges', () => {
      const filters: ChallengeFilters = {
        difficulty: 'easy',
        sortBy: 'points',
        sortOrder: 'desc'
      };

      const displayChallenges = ChallengeBrowserUtils.getDisplayChallenges(
        challenges,
        userCompletedChallenges,
        filters,
        userLocation
      );

      expect(displayChallenges).toHaveLength(1);
      expect(displayChallenges[0].id).toBe('active-challenge');
    });

    it('should work with empty filters', () => {
      const displayChallenges = ChallengeBrowserUtils.getDisplayChallenges(
        challenges,
        userCompletedChallenges
      );

      expect(displayChallenges).toHaveLength(3);
    });
  });

  describe('getChallengeDisplayInfo', () => {
    it('should return correct display info for active challenge', () => {
      const challenge = challenges[0]; // active-challenge
      const displayInfo = ChallengeBrowserUtils.getChallengeDisplayInfo(
        challenge,
        userCompletedChallenges,
        userLocation
      );

      expect(displayInfo.isCompleted).toBe(false);
      expect(displayInfo.statusText).toBe('Active');
      expect(displayInfo.difficultyColor).toBe('#22c55e'); // green for easy
      expect(displayInfo.distance).toBeTypeOf('number');
      expect(displayInfo.distanceText).toMatch(/\d+\.\d+ km away/);
    });

    it('should return correct display info for completed challenge', () => {
      const challenge = challenges[1]; // completed-challenge
      const displayInfo = ChallengeBrowserUtils.getChallengeDisplayInfo(
        challenge,
        userCompletedChallenges,
        userLocation
      );

      expect(displayInfo.isCompleted).toBe(true);
      expect(displayInfo.statusText).toBe('Completed');
      expect(displayInfo.difficultyColor).toBe('#f59e0b'); // amber for medium
    });

    it('should handle missing user location', () => {
      const challenge = challenges[0];
      const displayInfo = ChallengeBrowserUtils.getChallengeDisplayInfo(
        challenge,
        userCompletedChallenges
      );

      expect(displayInfo.distance).toBeNull();
      expect(displayInfo.distanceText).toBeNull();
    });
  });

  describe('getActiveChallengesOnly', () => {
    it('should return only active challenges', () => {
      const activeChallenges = ChallengeBrowserUtils.getActiveChallengesOnly(
        challenges,
        userCompletedChallenges
      );

      expect(activeChallenges).toHaveLength(1);
      expect(activeChallenges[0].id).toBe('active-challenge');
    });
  });

  describe('formatChallengeForDisplay', () => {
    it('should format challenge correctly', () => {
      const challenge = challenges[0];
      const formatted = ChallengeBrowserUtils.formatChallengeForDisplay(challenge);

      expect(formatted).toBe('Test Challenge - Test Business (10 pts, easy)');
    });
  });

  describe('getChallengeStats', () => {
    it('should return correct statistics', () => {
      const stats = ChallengeBrowserUtils.getChallengeStats(
        challenges,
        userCompletedChallenges
      );

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.expired).toBe(1);
    });
  });
});

describe('Utility Functions', () => {
  describe('getDifficultyColor', () => {
    it('should return correct colors for each difficulty', () => {
      expect(getDifficultyColor('easy')).toBe('#22c55e');
      expect(getDifficultyColor('medium')).toBe('#f59e0b');
      expect(getDifficultyColor('hard')).toBe('#ef4444');
    });

    it('should return default color for unknown difficulty', () => {
      expect(getDifficultyColor('unknown' as any)).toBe('#6b7280');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between coordinates correctly', () => {
      const coord1: GPSCoordinate = { latitude: 42.3314, longitude: -83.0458 };
      const coord2: GPSCoordinate = { latitude: 42.3320, longitude: -83.0460 };
      
      const distance = calculateDistance(coord1, coord2);
      
      // Distance should be approximately 67 meters
      expect(distance).toBeGreaterThan(60);
      expect(distance).toBeLessThan(80);
    });

    it('should return 0 for identical coordinates', () => {
      const coord: GPSCoordinate = { latitude: 42.3314, longitude: -83.0458 };
      
      const distance = calculateDistance(coord, coord);
      
      expect(distance).toBe(0);
    });
  });

  describe('validateChallengeFilters', () => {
    it('should validate correct filters', () => {
      const validFilters: ChallengeFilters = {
        difficulty: 'easy',
        status: 'active',
        maxDistance: 1000,
        sortBy: 'points',
        sortOrder: 'asc'
      };

      expect(validateChallengeFilters(validFilters)).toBe(true);
    });

    it('should reject negative maxDistance', () => {
      const invalidFilters: ChallengeFilters = {
        maxDistance: -100
      };

      expect(validateChallengeFilters(invalidFilters)).toBe(false);
    });

    it('should reject invalid sortBy', () => {
      const invalidFilters: ChallengeFilters = {
        sortBy: 'invalid' as any
      };

      expect(validateChallengeFilters(invalidFilters)).toBe(false);
    });

    it('should reject invalid sortOrder', () => {
      const invalidFilters: ChallengeFilters = {
        sortOrder: 'invalid' as any
      };

      expect(validateChallengeFilters(invalidFilters)).toBe(false);
    });
  });
});