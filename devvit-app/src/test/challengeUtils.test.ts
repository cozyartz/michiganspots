/**
 * Unit tests for challenge utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateChallengeStatus,
  isChallengeActive,
  calculateDistance,
  filterChallenges,
  sortChallenges,
  getActiveChallenges,
  getChallengeStatusText,
  getDifficultyColor,
  validateChallengeFilters
} from '../utils/challengeUtils.js';
import { Challenge, ChallengeFilters, GPSCoordinate } from '../types/core.js';

describe('Challenge Utils', () => {
  let mockChallenge: Challenge;
  let userCompletedChallenges: Set<string>;

  beforeEach(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    mockChallenge = {
      id: 'challenge-1',
      title: 'Test Challenge',
      description: 'A test challenge',
      partnerId: 'partner-1',
      partnerName: 'Test Partner',
      partnerBranding: {
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#000000',
        secondaryColor: '#ffffff'
      },
      difficulty: 'medium',
      points: 25,
      startDate: yesterday,
      endDate: tomorrow,
      location: {
        coordinates: { latitude: 42.3314, longitude: -83.0458 },
        address: '123 Test St, Detroit, MI',
        businessName: 'Test Business',
        verificationRadius: 100
      },
      proofRequirements: {
        types: ['photo'],
        instructions: 'Take a photo of the storefront'
      },
      status: 'active',
      createdAt: yesterday,
      updatedAt: yesterday
    };

    userCompletedChallenges = new Set<string>();
  });

  describe('calculateChallengeStatus', () => {
    it('should return "active" for a challenge within date range and not completed', () => {
      const status = calculateChallengeStatus(mockChallenge, userCompletedChallenges);
      expect(status).toBe('active');
    });

    it('should return "completed" if user has completed the challenge', () => {
      userCompletedChallenges.add('challenge-1');
      const status = calculateChallengeStatus(mockChallenge, userCompletedChallenges);
      expect(status).toBe('completed');
    });

    it('should return "expired" if challenge end date has passed', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      mockChallenge.endDate = yesterday;
      const status = calculateChallengeStatus(mockChallenge, userCompletedChallenges);
      expect(status).toBe('expired');
    });

    it('should return "expired" if challenge start date is in the future', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      mockChallenge.startDate = tomorrow;
      const status = calculateChallengeStatus(mockChallenge, userCompletedChallenges);
      expect(status).toBe('expired');
    });

    it('should return "expired" if max completions reached', () => {
      mockChallenge.maxCompletions = 0;
      const status = calculateChallengeStatus(mockChallenge, userCompletedChallenges);
      expect(status).toBe('expired');
    });
  });

  describe('isChallengeActive', () => {
    it('should return true for active challenges', () => {
      expect(isChallengeActive(mockChallenge, userCompletedChallenges)).toBe(true);
    });

    it('should return false for completed challenges', () => {
      userCompletedChallenges.add('challenge-1');
      expect(isChallengeActive(mockChallenge, userCompletedChallenges)).toBe(false);
    });

    it('should return false for expired challenges', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      mockChallenge.endDate = yesterday;
      expect(isChallengeActive(mockChallenge, userCompletedChallenges)).toBe(false);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates correctly', () => {
      const coord1: GPSCoordinate = { latitude: 42.3314, longitude: -83.0458 }; // Detroit
      const coord2: GPSCoordinate = { latitude: 42.3601, longitude: -82.9988 }; // Windsor
      
      const distance = calculateDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10000); // Should be less than 10km
    });

    it('should return 0 for identical coordinates', () => {
      const coord: GPSCoordinate = { latitude: 42.3314, longitude: -83.0458 };
      const distance = calculateDistance(coord, coord);
      expect(distance).toBe(0);
    });
  });

  describe('filterChallenges', () => {
    let challenges: Challenge[];
    let filters: ChallengeFilters;

    beforeEach(() => {
      const easyChallenge = { ...mockChallenge, id: 'easy-1', difficulty: 'easy' as const };
      const hardChallenge = { ...mockChallenge, id: 'hard-1', difficulty: 'hard' as const };
      challenges = [mockChallenge, easyChallenge, hardChallenge];
      filters = {};
    });

    it('should filter by difficulty', () => {
      filters.difficulty = 'easy';
      const filtered = filterChallenges(challenges, filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].difficulty).toBe('easy');
    });

    it('should filter by status', () => {
      userCompletedChallenges.add('challenge-1');
      filters.status = 'completed';
      const filtered = filterChallenges(challenges, filters, undefined, userCompletedChallenges);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('challenge-1');
    });

    it('should filter by partner ID', () => {
      challenges[1].partnerId = 'different-partner';
      filters.partnerId = 'partner-1';
      const filtered = filterChallenges(challenges, filters);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(c => c.partnerId === 'partner-1')).toBe(true);
    });

    it('should filter by distance when user location provided', () => {
      const userLocation: GPSCoordinate = { latitude: 42.3314, longitude: -83.0458 };
      challenges[1].location.coordinates = { latitude: 45.0, longitude: -85.0 }; // Far away
      filters.maxDistance = 1000; // 1km
      
      const filtered = filterChallenges(challenges, filters, userLocation);
      expect(filtered.length).toBeLessThan(challenges.length);
    });
  });

  describe('sortChallenges', () => {
    let challenges: Challenge[];

    beforeEach(() => {
      const easyChallenge = { ...mockChallenge, id: 'easy-1', difficulty: 'easy' as const, points: 10 };
      const hardChallenge = { ...mockChallenge, id: 'hard-1', difficulty: 'hard' as const, points: 50 };
      challenges = [mockChallenge, easyChallenge, hardChallenge];
    });

    it('should sort by points ascending', () => {
      const sorted = sortChallenges(challenges, 'points', 'asc');
      expect(sorted[0].points).toBe(10);
      expect(sorted[2].points).toBe(50);
    });

    it('should sort by points descending', () => {
      const sorted = sortChallenges(challenges, 'points', 'desc');
      expect(sorted[0].points).toBe(50);
      expect(sorted[2].points).toBe(10);
    });

    it('should sort by difficulty', () => {
      const sorted = sortChallenges(challenges, 'difficulty', 'asc');
      expect(sorted[0].difficulty).toBe('easy');
      expect(sorted[2].difficulty).toBe('hard');
    });

    it('should sort by distance when user location provided', () => {
      const userLocation: GPSCoordinate = { latitude: 42.3314, longitude: -83.0458 };
      challenges[1].location.coordinates = { latitude: 45.0, longitude: -85.0 }; // Far away
      
      const sorted = sortChallenges(challenges, 'distance', 'asc', userLocation);
      expect(sorted[0].id).not.toBe('easy-1'); // The far away one should not be first
    });
  });

  describe('getActiveChallenges', () => {
    it('should return only active challenges', () => {
      const expiredChallenge = { 
        ...mockChallenge, 
        id: 'expired-1', 
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000) 
      };
      const challenges = [mockChallenge, expiredChallenge];
      
      const active = getActiveChallenges(challenges, userCompletedChallenges);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('challenge-1');
    });
  });

  describe('getChallengeStatusText', () => {
    it('should return "Completed" for completed challenges', () => {
      userCompletedChallenges.add('challenge-1');
      const text = getChallengeStatusText(mockChallenge, userCompletedChallenges);
      expect(text).toBe('Completed');
    });

    it('should return "Expired" for past end date', () => {
      mockChallenge.endDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const text = getChallengeStatusText(mockChallenge, userCompletedChallenges);
      expect(text).toBe('Expired');
    });

    it('should return "Expires Today" for challenges ending today', () => {
      mockChallenge.endDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
      const text = getChallengeStatusText(mockChallenge, userCompletedChallenges);
      expect(text).toBe('Expires Today');
    });

    it('should return days left for active challenges', () => {
      mockChallenge.endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      const text = getChallengeStatusText(mockChallenge, userCompletedChallenges);
      expect(text).toBe('3 days left');
    });

    it('should return "Active" for challenges with more than 7 days left', () => {
      mockChallenge.endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
      const text = getChallengeStatusText(mockChallenge, userCompletedChallenges);
      expect(text).toBe('Active');
    });
  });

  describe('getDifficultyColor', () => {
    it('should return correct colors for each difficulty', () => {
      expect(getDifficultyColor('easy')).toBe('#22c55e');
      expect(getDifficultyColor('medium')).toBe('#f59e0b');
      expect(getDifficultyColor('hard')).toBe('#ef4444');
    });
  });

  describe('validateChallengeFilters', () => {
    it('should return true for valid filters', () => {
      const filters: ChallengeFilters = {
        difficulty: 'easy',
        status: 'active',
        maxDistance: 1000,
        sortBy: 'points',
        sortOrder: 'asc'
      };
      expect(validateChallengeFilters(filters)).toBe(true);
    });

    it('should return false for negative maxDistance', () => {
      const filters: ChallengeFilters = { maxDistance: -100 };
      expect(validateChallengeFilters(filters)).toBe(false);
    });

    it('should return false for invalid sortBy', () => {
      const filters: ChallengeFilters = { sortBy: 'invalid' as any };
      expect(validateChallengeFilters(filters)).toBe(false);
    });

    it('should return false for invalid sortOrder', () => {
      const filters: ChallengeFilters = { sortOrder: 'invalid' as any };
      expect(validateChallengeFilters(filters)).toBe(false);
    });
  });
});