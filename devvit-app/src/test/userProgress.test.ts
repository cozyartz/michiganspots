/**
 * Unit tests for User Progress System
 * 
 * Tests point calculation, badge awarding logic, user profile data management,
 * achievement criteria, and milestone detection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PointsService, PointsCalculation, PointsTransaction } from '../services/pointsService.js';
import { BadgeService, BadgeDefinition } from '../services/badgeService.js';
import { UserProfileService } from '../services/userProfileService.js';
import type { UserProfile, Challenge, Badge, Submission } from '../types/core.js';
import { CONSTANTS } from '../types/index.js';

// Mock Devvit context
const mockContext = {
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
} as any;

describe('PointsService', () => {
  let pointsService: PointsService;
  let mockUserProfile: UserProfile;
  let mockChallenge: Challenge;

  beforeEach(() => {
    pointsService = new PointsService(mockContext);
    
    mockUserProfile = {
      redditUsername: 'testuser',
      totalPoints: 150,
      completedChallenges: ['challenge1', 'challenge2'],
      badges: [],
      joinedAt: new Date('2024-01-01'),
      lastActiveAt: new Date('2024-01-15'),
      preferences: {
        notifications: true,
        leaderboardVisible: true,
        locationSharing: true
      },
      statistics: {
        totalSubmissions: 5,
        successfulSubmissions: 3,
        averageCompletionTime: 1800000, // 30 minutes
        favoritePartners: ['partner1', 'partner2']
      }
    };

    mockChallenge = {
      id: 'challenge3',
      title: 'Visit Coffee Shop',
      description: 'Take a photo at the coffee shop',
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
        address: '123 Main St',
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
  });

  describe('calculateChallengePoints', () => {
    it('should calculate base points correctly for different difficulties', () => {
      const easyChallenge = { ...mockChallenge, difficulty: 'easy' as const };
      const mediumChallenge = { ...mockChallenge, difficulty: 'medium' as const };
      const hardChallenge = { ...mockChallenge, difficulty: 'hard' as const };

      const easyResult = pointsService.calculateChallengePoints(easyChallenge, mockUserProfile);
      const mediumResult = pointsService.calculateChallengePoints(mediumChallenge, mockUserProfile);
      const hardResult = pointsService.calculateChallengePoints(hardChallenge, mockUserProfile);

      expect(easyResult.basePoints).toBe(CONSTANTS.POINTS.EASY);
      expect(mediumResult.basePoints).toBe(CONSTANTS.POINTS.MEDIUM);
      expect(hardResult.basePoints).toBe(CONSTANTS.POINTS.HARD);
    });

    it('should award first completion bonus for new users', () => {
      const newUserProfile = { ...mockUserProfile, completedChallenges: [] };
      
      const result = pointsService.calculateChallengePoints(mockChallenge, newUserProfile);
      
      expect(result.bonusPoints).toBeGreaterThan(0);
      expect(result.bonusReasons).toContain('First challenge bonus (+5)');
      expect(result.totalPoints).toBe(result.basePoints + result.bonusPoints);
    });

    it('should award streak bonus for active users', () => {
      const activeUserProfile = { 
        ...mockUserProfile, 
        completedChallenges: ['c1', 'c2', 'c3', 'c4', 'c5'] 
      };
      
      const result = pointsService.calculateChallengePoints(mockChallenge, activeUserProfile);
      
      expect(result.bonusReasons.some(reason => reason.includes('Streak bonus'))).toBe(true);
    });

    it('should award difficulty progression bonus', () => {
      const experiencedUserProfile = { 
        ...mockUserProfile, 
        completedChallenges: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'] 
      };
      const hardChallenge = { ...mockChallenge, difficulty: 'hard' as const };
      
      const result = pointsService.calculateChallengePoints(hardChallenge, experiencedUserProfile);
      
      expect(result.bonusReasons.some(reason => reason.includes('Difficulty progression'))).toBe(true);
    });

    it('should award speed completion bonus for quick completions', () => {
      const quickCompletionTime = 1800000; // 30 minutes
      
      const result = pointsService.calculateChallengePoints(
        mockChallenge, 
        mockUserProfile, 
        quickCompletionTime
      );
      
      expect(result.bonusReasons.some(reason => reason.includes('Quick completion'))).toBe(true);
    });

    it('should award partner loyalty bonus for frequent visitors', () => {
      const loyalUserProfile = { 
        ...mockUserProfile, 
        statistics: { 
          ...mockUserProfile.statistics, 
          favoritePartners: ['partner1'] 
        } 
      };
      
      const result = pointsService.calculateChallengePoints(mockChallenge, loyalUserProfile);
      
      expect(result.bonusReasons.some(reason => reason.includes('Partner loyalty'))).toBe(true);
    });

    it('should not award bonuses when criteria are not met', () => {
      const basicUserProfile = { 
        ...mockUserProfile, 
        completedChallenges: ['c1'], 
        statistics: { 
          ...mockUserProfile.statistics, 
          favoritePartners: [] 
        } 
      };
      
      const result = pointsService.calculateChallengePoints(mockChallenge, basicUserProfile);
      
      expect(result.bonusPoints).toBe(0);
      expect(result.bonusReasons).toHaveLength(0);
      expect(result.totalPoints).toBe(result.basePoints);
    });
  });

  describe('getPointsToNextMilestone', () => {
    it('should calculate points needed for next milestone correctly', () => {
      const result = pointsService.getPointsToNextMilestone(75);
      
      expect(result.nextMilestone).toBe(100);
      expect(result.pointsNeeded).toBe(25);
      expect(result.milestoneType).toBe('Point Collector');
    });

    it('should handle users at milestone boundaries', () => {
      const result = pointsService.getPointsToNextMilestone(100);
      
      expect(result.nextMilestone).toBe(250);
      expect(result.pointsNeeded).toBe(150);
      expect(result.milestoneType).toBe('Rising Star');
    });

    it('should handle users beyond all predefined milestones', () => {
      const result = pointsService.getPointsToNextMilestone(10000);
      
      expect(result.nextMilestone).toBe(11000);
      expect(result.pointsNeeded).toBe(1000);
      expect(result.milestoneType).toBe('Master Level');
    });
  });

  describe('getUserPointRank', () => {
    it('should calculate user rank and percentile', async () => {
      const result = await pointsService.getUserPointRank(500);
      
      expect(result.rank).toBeGreaterThan(0);
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
      expect(result.totalUsers).toBeGreaterThan(0);
    });

    it('should handle users with very high points', async () => {
      const result = await pointsService.getUserPointRank(10000);
      
      expect(result.rank).toBe(1);
      expect(result.percentile).toBeGreaterThan(90);
    });

    it('should handle users with zero points', async () => {
      const result = await pointsService.getUserPointRank(0);
      
      expect(result.rank).toBeGreaterThan(0);
      expect(result.percentile).toBeLessThan(10);
    });
  });

  describe('recordPointsTransaction', () => {
    it('should create a complete points transaction', async () => {
      const transactionData = {
        userRedditUsername: 'testuser',
        challengeId: 'challenge1',
        points: 25,
        transactionType: 'earned' as const,
        reason: 'Challenge completion'
      };
      
      const result = await pointsService.recordPointsTransaction(transactionData);
      
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.userRedditUsername).toBe(transactionData.userRedditUsername);
      expect(result.points).toBe(transactionData.points);
      expect(result.transactionType).toBe(transactionData.transactionType);
    });
  });

  describe('getPointsMultiplier', () => {
    it('should return correct multiplier based on user level', () => {
      const legendUser = { ...mockUserProfile, totalPoints: 5000 };
      const eliteUser = { ...mockUserProfile, totalPoints: 2500 };
      const masterUser = { ...mockUserProfile, totalPoints: 1000 };
      const highScorerUser = { ...mockUserProfile, totalPoints: 500 };
      const basicUser = { ...mockUserProfile, totalPoints: 100 };
      
      expect(pointsService.getPointsMultiplier(legendUser)).toBe(1.5);
      expect(pointsService.getPointsMultiplier(eliteUser)).toBe(1.3);
      expect(pointsService.getPointsMultiplier(masterUser)).toBe(1.2);
      expect(pointsService.getPointsMultiplier(highScorerUser)).toBe(1.1);
      expect(pointsService.getPointsMultiplier(basicUser)).toBe(1.0);
    });
  });

  describe('applyPointsMultiplier', () => {
    it('should apply multiplier correctly to points calculation', () => {
      const baseCalculation: PointsCalculation = {
        basePoints: 25,
        bonusPoints: 5,
        totalPoints: 30,
        bonusReasons: ['Test bonus (+5)']
      };
      
      const result = pointsService.applyPointsMultiplier(baseCalculation, 1.2);
      
      expect(result.totalPoints).toBe(36); // 30 * 1.2 = 36
      expect(result.bonusPoints).toBe(11); // 5 + 6 (additional from multiplier)
      expect(result.bonusReasons).toContain('Level multiplier x1.2 (+6)');
    });

    it('should not modify calculation when multiplier is 1.0', () => {
      const baseCalculation: PointsCalculation = {
        basePoints: 25,
        bonusPoints: 5,
        totalPoints: 30,
        bonusReasons: ['Test bonus (+5)']
      };
      
      const result = pointsService.applyPointsMultiplier(baseCalculation, 1.0);
      
      expect(result).toEqual(baseCalculation);
    });
  });

  describe('getDailyPointsLimit', () => {
    it('should calculate daily points limit based on user level', () => {
      const newUser = { ...mockUserProfile, totalPoints: 100 };
      const experiencedUser = { ...mockUserProfile, totalPoints: 2000 };
      
      const newUserLimit = pointsService.getDailyPointsLimit(newUser);
      const experiencedUserLimit = pointsService.getDailyPointsLimit(experiencedUser);
      
      expect(newUserLimit).toBe(200); // Base limit
      expect(experiencedUserLimit).toBe(300); // Base + 100 (2000/1000 * 50)
    });
  });

  describe('formatPointsBreakdown', () => {
    it('should format points breakdown correctly', () => {
      const calculation: PointsCalculation = {
        basePoints: 25,
        bonusPoints: 10,
        totalPoints: 35,
        bonusReasons: ['First challenge bonus (+5)', 'Speed bonus (+5)']
      };
      
      const result = pointsService.formatPointsBreakdown(calculation);
      
      expect(result).toContain('Base Points: 25');
      expect(result).toContain('Bonus Points: 10');
      expect(result).toContain('First challenge bonus (+5)');
      expect(result).toContain('Speed bonus (+5)');
      expect(result).toContain('Total: 35 points');
    });

    it('should handle calculation with no bonus points', () => {
      const calculation: PointsCalculation = {
        basePoints: 25,
        bonusPoints: 0,
        totalPoints: 25,
        bonusReasons: []
      };
      
      const result = pointsService.formatPointsBreakdown(calculation);
      
      expect(result).toContain('Base Points: 25');
      expect(result).not.toContain('Bonus Points');
      expect(result).toContain('Total: 25 points');
    });
  });
});

describe('BadgeService', () => {
  let badgeService: BadgeService;
  let mockUserProfile: UserProfile;
  let mockChallenges: Challenge[];

  beforeEach(() => {
    badgeService = new BadgeService(mockContext);
    
    mockUserProfile = {
      redditUsername: 'testuser',
      totalPoints: 150,
      completedChallenges: ['challenge1', 'challenge2', 'challenge3'],
      badges: [],
      joinedAt: new Date('2024-01-01'),
      lastActiveAt: new Date('2024-01-15'),
      preferences: {
        notifications: true,
        leaderboardVisible: true,
        locationSharing: true
      },
      statistics: {
        totalSubmissions: 5,
        successfulSubmissions: 3,
        averageCompletionTime: 1800000,
        favoritePartners: ['partner1', 'partner2', 'partner3']
      }
    };

    mockChallenges = [
      {
        id: 'challenge1',
        title: 'Easy Challenge 1',
        description: 'Test easy challenge',
        partnerId: 'partner1',
        partnerName: 'Partner 1',
        partnerBranding: { logoUrl: '', primaryColor: '#000', secondaryColor: '#fff' },
        difficulty: 'easy',
        points: 10,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        location: {
          coordinates: { latitude: 42.3314, longitude: -83.0458 },
          address: '123 Main St',
          businessName: 'Business 1',
          verificationRadius: 100
        },
        proofRequirements: { types: ['photo'], instructions: 'Take a photo' },
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'challenge2',
        title: 'Medium Challenge 1',
        description: 'Test medium challenge',
        partnerId: 'partner2',
        partnerName: 'Partner 2',
        partnerBranding: { logoUrl: '', primaryColor: '#000', secondaryColor: '#fff' },
        difficulty: 'medium',
        points: 25,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        location: {
          coordinates: { latitude: 42.3314, longitude: -83.0458 },
          address: '456 Oak St',
          businessName: 'Business 2',
          verificationRadius: 100
        },
        proofRequirements: { types: ['photo'], instructions: 'Take a photo' },
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'challenge3',
        title: 'Hard Challenge 1',
        description: 'Test hard challenge',
        partnerId: 'partner3',
        partnerName: 'Partner 3',
        partnerBranding: { logoUrl: '', primaryColor: '#000', secondaryColor: '#fff' },
        difficulty: 'hard',
        points: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        location: {
          coordinates: { latitude: 42.3314, longitude: -83.0458 },
          address: '789 Pine St',
          businessName: 'Business 3',
          verificationRadius: 100
        },
        proofRequirements: { types: ['photo'], instructions: 'Take a photo' },
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];
  });

  describe('calculateChallengePoints', () => {
    it('should calculate points correctly for different difficulties', () => {
      expect(badgeService.calculateChallengePoints('easy')).toBe(CONSTANTS.POINTS.EASY);
      expect(badgeService.calculateChallengePoints('medium')).toBe(CONSTANTS.POINTS.MEDIUM);
      expect(badgeService.calculateChallengePoints('hard')).toBe(CONSTANTS.POINTS.HARD);
    });

    it('should default to easy points for invalid difficulty', () => {
      expect(badgeService.calculateChallengePoints('invalid' as any)).toBe(CONSTANTS.POINTS.EASY);
    });
  });

  describe('checkEligibleBadges', () => {
    it('should identify completion count badges', async () => {
      const userWith5Completions = { 
        ...mockUserProfile, 
        completedChallenges: ['c1', 'c2', 'c3', 'c4', 'c5'] 
      };
      
      const eligibleBadges = await badgeService.checkEligibleBadges(userWith5Completions, mockChallenges);
      
      const explorerBadge = eligibleBadges.find(b => b.id === 'explorer');
      expect(explorerBadge).toBeDefined();
      expect(explorerBadge?.name).toBe('Explorer');
    });

    it('should identify points total badges', async () => {
      const userWith500Points = { ...mockUserProfile, totalPoints: 500 };
      
      const eligibleBadges = await badgeService.checkEligibleBadges(userWith500Points, mockChallenges);
      
      const highScorerBadge = eligibleBadges.find(b => b.id === 'high_scorer');
      expect(highScorerBadge).toBeDefined();
      expect(highScorerBadge?.name).toBe('High Scorer');
    });

    it('should identify partner visit badges', async () => {
      const userWith5Partners = { 
        ...mockUserProfile, 
        statistics: { 
          ...mockUserProfile.statistics, 
          favoritePartners: ['p1', 'p2', 'p3', 'p4', 'p5'] 
        } 
      };
      
      const eligibleBadges = await badgeService.checkEligibleBadges(userWith5Partners, mockChallenges);
      
      const localSupporterBadge = eligibleBadges.find(b => b.id === 'local_supporter');
      expect(localSupporterBadge).toBeDefined();
      expect(localSupporterBadge?.name).toBe('Local Supporter');
    });

    it('should not award badges already earned', async () => {
      const userWithFirstStepsBadge = { 
        ...mockUserProfile,
        badges: [{
          id: 'first_steps',
          name: 'First Steps',
          description: 'Complete your first challenge',
          iconUrl: '/badges/first_steps.png',
          earnedAt: new Date(),
          criteria: { type: 'completion_count' as const, threshold: 1, timeframe: 'alltime' as const }
        }]
      };
      
      const eligibleBadges = await badgeService.checkEligibleBadges(userWithFirstStepsBadge, mockChallenges);
      
      const firstStepsBadge = eligibleBadges.find(b => b.id === 'first_steps');
      expect(firstStepsBadge).toBeUndefined();
    });

    it('should identify difficulty master badges', async () => {
      // Create challenges with specific difficulties
      const easyChallenges = Array.from({ length: 10 }, (_, i) => ({
        ...mockChallenges[0],
        id: `easy_${i}`,
        difficulty: 'easy' as const
      }));
      
      const userWith10EasyCompletions = { 
        ...mockUserProfile, 
        completedChallenges: easyChallenges.map(c => c.id)
      };
      
      const eligibleBadges = await badgeService.checkEligibleBadges(
        userWith10EasyCompletions, 
        easyChallenges
      );
      
      const easyMasterBadge = eligibleBadges.find(b => b.id === 'easy_master');
      expect(easyMasterBadge).toBeDefined();
      expect(easyMasterBadge?.name).toBe('Easy Master');
    });
  });

  describe('getBadgeDefinitions', () => {
    it('should return all badge definitions', () => {
      const definitions = badgeService.getBadgeDefinitions();
      
      expect(definitions).toBeInstanceOf(Array);
      expect(definitions.length).toBeGreaterThan(0);
      
      // Check for key badges
      const firstSteps = definitions.find(d => d.id === 'first_steps');
      const explorer = definitions.find(d => d.id === 'explorer');
      const pointCollector = definitions.find(d => d.id === 'point_collector');
      
      expect(firstSteps).toBeDefined();
      expect(explorer).toBeDefined();
      expect(pointCollector).toBeDefined();
    });

    it('should have proper badge structure', () => {
      const definitions = badgeService.getBadgeDefinitions();
      
      definitions.forEach(badge => {
        expect(badge.id).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.description).toBeDefined();
        expect(badge.iconUrl).toBeDefined();
        expect(badge.criteria).toBeDefined();
        expect(badge.rarity).toBeDefined();
        expect(['common', 'rare', 'epic', 'legendary']).toContain(badge.rarity);
      });
    });
  });

  describe('getBadgeDefinition', () => {
    it('should return specific badge definition', () => {
      const firstSteps = badgeService.getBadgeDefinition('first_steps');
      
      expect(firstSteps).toBeDefined();
      expect(firstSteps?.id).toBe('first_steps');
      expect(firstSteps?.name).toBe('First Steps');
    });

    it('should return undefined for non-existent badge', () => {
      const nonExistent = badgeService.getBadgeDefinition('non_existent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('awardEligibleBadges', () => {
    it('should return newly awarded badges', async () => {
      const userWith5Completions = { 
        ...mockUserProfile, 
        completedChallenges: ['c1', 'c2', 'c3', 'c4', 'c5'] 
      };
      
      const awardedBadges = await badgeService.awardEligibleBadges(userWith5Completions, mockChallenges);
      
      expect(awardedBadges).toBeInstanceOf(Array);
      expect(awardedBadges.length).toBeGreaterThan(0);
      
      // Should include first steps and explorer badges
      const badgeIds = awardedBadges.map(b => b.id);
      expect(badgeIds).toContain('first_steps');
      expect(badgeIds).toContain('explorer');
    });
  });

  describe('getBadgeRarityColor', () => {
    it('should return correct colors for each rarity', () => {
      expect(badgeService.getBadgeRarityColor('common')).toBe('#9CA3AF');
      expect(badgeService.getBadgeRarityColor('rare')).toBe('#3B82F6');
      expect(badgeService.getBadgeRarityColor('epic')).toBe('#8B5CF6');
      expect(badgeService.getBadgeRarityColor('legendary')).toBe('#F59E0B');
    });

    it('should default to gray for unknown rarity', () => {
      expect(badgeService.getBadgeRarityColor('unknown' as any)).toBe('#9CA3AF');
    });
  });

  describe('formatBadgeForDisplay', () => {
    it('should format badge correctly for display', () => {
      const badge: Badge = {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first challenge',
        iconUrl: '/badges/first_steps.png',
        earnedAt: new Date('2024-01-15T10:00:00Z'),
        criteria: { type: 'completion_count', threshold: 1, timeframe: 'alltime' }
      };
      
      const formatted = badgeService.formatBadgeForDisplay(badge);
      
      expect(formatted.id).toBe('first_steps');
      expect(formatted.name).toBe('First Steps');
      expect(formatted.description).toBe('Complete your first challenge');
      expect(formatted.rarity).toBe('common');
      expect(formatted.rarityColor).toBe('#9CA3AF');
      expect(formatted.earnedAt).toBe('1/15/2024');
    });
  });
});

describe('UserProfileService', () => {
  let userProfileService: UserProfileService;
  let mockUserProfile: UserProfile;
  let mockSubmissions: Submission[];

  beforeEach(() => {
    userProfileService = new UserProfileService(mockContext);
    mockContext.redis.get.mockClear();
    mockContext.redis.set.mockClear();
    mockContext.redis.del.mockClear();
    
    mockUserProfile = {
      redditUsername: 'testuser',
      totalPoints: 150,
      completedChallenges: ['challenge1', 'challenge2'],
      badges: [],
      joinedAt: new Date('2024-01-01'),
      lastActiveAt: new Date('2024-01-15'),
      preferences: {
        notifications: true,
        leaderboardVisible: true,
        locationSharing: true
      },
      statistics: {
        totalSubmissions: 3,
        successfulSubmissions: 2,
        averageCompletionTime: 1800000,
        favoritePartners: ['partner1']
      }
    };

    mockSubmissions = [
      {
        id: 'sub1',
        challengeId: 'challenge1',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: { imageUrl: 'https://example.com/photo1.jpg' },
        submittedAt: new Date('2024-01-10T10:00:00Z'),
        verificationStatus: 'approved',
        redditPostUrl: 'https://reddit.com/r/test/comments/abc123',
        gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
        fraudRiskScore: 0.1
      },
      {
        id: 'sub2',
        challengeId: 'challenge2',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: { imageUrl: 'https://example.com/photo2.jpg' },
        submittedAt: new Date('2024-01-12T14:00:00Z'),
        verificationStatus: 'approved',
        redditPostUrl: 'https://reddit.com/r/test/comments/def456',
        gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
        fraudRiskScore: 0.2
      },
      {
        id: 'sub3',
        challengeId: 'challenge3',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: { imageUrl: 'https://example.com/photo3.jpg' },
        submittedAt: new Date('2024-01-14T16:00:00Z'),
        verificationStatus: 'rejected',
        redditPostUrl: 'https://reddit.com/r/test/comments/ghi789',
        gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
        fraudRiskScore: 0.8
      }
    ];
  });

  describe('getUserProfile', () => {
    it('should return existing user profile from Redis', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      
      const result = await userProfileService.getUserProfile('testuser');
      
      // Check key properties since dates get serialized/deserialized
      expect(result.redditUsername).toBe(mockUserProfile.redditUsername);
      expect(result.totalPoints).toBe(mockUserProfile.totalPoints);
      expect(result.completedChallenges).toEqual(mockUserProfile.completedChallenges);
      expect(mockContext.redis.get).toHaveBeenCalledWith('user:testuser');
    });

    it('should create new user profile if none exists', async () => {
      mockContext.redis.get.mockResolvedValue(null);
      mockContext.redis.set.mockResolvedValue(undefined);
      
      const result = await userProfileService.getUserProfile('newuser');
      
      expect(result.redditUsername).toBe('newuser');
      expect(result.totalPoints).toBe(0);
      expect(result.completedChallenges).toEqual([]);
      expect(result.badges).toEqual([]);
      expect(result.joinedAt).toBeInstanceOf(Date);
      expect(result.lastActiveAt).toBeInstanceOf(Date);
      expect(mockContext.redis.set).toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      mockContext.redis.get.mockRejectedValue(new Error('Redis error'));
      
      const result = await userProfileService.getUserProfile('testuser');
      
      expect(result.redditUsername).toBe('testuser');
      expect(result.totalPoints).toBe(0);
    });
  });

  describe('saveUserProfile', () => {
    it('should save user profile to Redis', async () => {
      mockContext.redis.set.mockResolvedValue(undefined);
      
      await userProfileService.saveUserProfile(mockUserProfile);
      
      expect(mockContext.redis.set).toHaveBeenCalledWith(
        'user:testuser',
        expect.stringContaining('"redditUsername":"testuser"')
      );
    });

    it('should update lastActiveAt timestamp when saving', async () => {
      mockContext.redis.set.mockResolvedValue(undefined);
      const originalLastActive = mockUserProfile.lastActiveAt;
      
      await userProfileService.saveUserProfile(mockUserProfile);
      
      expect(mockUserProfile.lastActiveAt.getTime()).toBeGreaterThan(originalLastActive.getTime());
    });

    it('should handle Redis save errors', async () => {
      mockContext.redis.set.mockRejectedValue(new Error('Redis save error'));
      
      await expect(userProfileService.saveUserProfile(mockUserProfile))
        .rejects.toThrow('Failed to save user profile');
    });
  });

  describe('updateUserPoints', () => {
    it('should update user points and completed challenges', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      mockContext.redis.set.mockResolvedValue(undefined);
      
      const result = await userProfileService.updateUserPoints('testuser', 25, 'challenge3');
      
      expect(result.totalPoints).toBe(175); // 150 + 25
      expect(result.completedChallenges).toContain('challenge3');
      expect(result.statistics.successfulSubmissions).toBe(3); // 2 + 1
    });

    it('should not duplicate completed challenges', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      mockContext.redis.set.mockResolvedValue(undefined);
      
      const result = await userProfileService.updateUserPoints('testuser', 25, 'challenge1');
      
      expect(result.completedChallenges.filter(c => c === 'challenge1')).toHaveLength(1);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      mockContext.redis.set.mockResolvedValue(undefined);
      
      const newPreferences = { notifications: false, leaderboardVisible: false };
      const result = await userProfileService.updateUserPreferences('testuser', newPreferences);
      
      expect(result.preferences.notifications).toBe(false);
      expect(result.preferences.leaderboardVisible).toBe(false);
      expect(result.preferences.locationSharing).toBe(true); // Should remain unchanged
    });
  });

  describe('calculateUserStatistics', () => {
    it('should calculate user statistics from submissions', async () => {
      const stats = await userProfileService.calculateUserStatistics('testuser', mockSubmissions);
      
      expect(stats.totalSubmissions).toBe(3);
      expect(stats.successfulSubmissions).toBe(2);
      expect(stats.averageCompletionTime).toBeGreaterThan(0);
      expect(stats.favoritePartners).toBeInstanceOf(Array);
    });

    it('should handle empty submissions array', async () => {
      const stats = await userProfileService.calculateUserStatistics('testuser', []);
      
      expect(stats.totalSubmissions).toBe(0);
      expect(stats.successfulSubmissions).toBe(0);
      expect(stats.averageCompletionTime).toBe(0);
      expect(stats.favoritePartners).toEqual([]);
    });

    it('should identify favorite partners correctly', async () => {
      const submissionsWithPartners = [
        { ...mockSubmissions[0], challengeId: 'partner1-challenge1' },
        { ...mockSubmissions[1], challengeId: 'partner1-challenge2' },
        { ...mockSubmissions[2], challengeId: 'partner2-challenge1' }
      ];
      
      const stats = await userProfileService.calculateUserStatistics('testuser', submissionsWithPartners);
      
      expect(stats.favoritePartners[0]).toBe('partner1'); // Most frequent should be first
    });
  });

  describe('awardBadge', () => {
    it('should add badge to user profile', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      mockContext.redis.set.mockResolvedValue(undefined);
      
      const badge: Badge = {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first challenge',
        iconUrl: '/badges/first_steps.png',
        earnedAt: new Date(),
        criteria: { type: 'completion_count', threshold: 1, timeframe: 'alltime' }
      };
      
      const result = await userProfileService.awardBadge('testuser', badge);
      
      expect(result.badges).toContain(badge);
      expect(result.badges).toHaveLength(1);
    });

    it('should not award duplicate badges', async () => {
      const existingBadge: Badge = {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first challenge',
        iconUrl: '/badges/first_steps.png',
        earnedAt: new Date(),
        criteria: { type: 'completion_count', threshold: 1, timeframe: 'alltime' }
      };
      
      const profileWithBadge = { ...mockUserProfile, badges: [existingBadge] };
      mockContext.redis.get.mockResolvedValue(JSON.stringify(profileWithBadge));
      
      const result = await userProfileService.awardBadge('testuser', existingBadge);
      
      expect(result.badges).toHaveLength(1);
    });
  });

  describe('getUserCompletionRate', () => {
    it('should calculate completion rate correctly', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      
      const completionRate = await userProfileService.getUserCompletionRate('testuser', 10);
      
      expect(completionRate).toBe(20); // 2 completed out of 10 total = 20%
    });

    it('should handle zero total challenges', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      
      const completionRate = await userProfileService.getUserCompletionRate('testuser', 0);
      
      expect(completionRate).toBe(0);
    });
  });

  describe('hasUserCompletedChallenge', () => {
    it('should return true for completed challenges', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      
      const hasCompleted = await userProfileService.hasUserCompletedChallenge('testuser', 'challenge1');
      
      expect(hasCompleted).toBe(true);
    });

    it('should return false for uncompleted challenges', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      
      const hasCompleted = await userProfileService.hasUserCompletedChallenge('testuser', 'challenge3');
      
      expect(hasCompleted).toBe(false);
    });
  });

  describe('getUserProfiles', () => {
    it('should return multiple user profiles', async () => {
      const user1Profile = { ...mockUserProfile, redditUsername: 'user1' };
      const user2Profile = { ...mockUserProfile, redditUsername: 'user2' };
      
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(user1Profile))
        .mockResolvedValueOnce(JSON.stringify(user2Profile));
      
      const profiles = await userProfileService.getUserProfiles(['user1', 'user2']);
      
      expect(profiles).toHaveLength(2);
      expect(profiles[0].redditUsername).toBe('user1');
      expect(profiles[1].redditUsername).toBe('user2');
    });

    it('should handle errors for individual profiles gracefully', async () => {
      const user1Profile = { ...mockUserProfile, redditUsername: 'user1' };
      
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(user1Profile))
        .mockRejectedValueOnce(new Error('Redis error'));
      
      const profiles = await userProfileService.getUserProfiles(['user1', 'user2']);
      
      // The service creates a default profile for user2 when Redis fails, so we get 2 profiles
      expect(profiles).toHaveLength(2);
      expect(profiles[0].redditUsername).toBe('user1');
      expect(profiles[1].redditUsername).toBe('user2'); // Default profile created
    });
  });

  describe('updateUserStatistics', () => {
    it('should update user statistics from submission history', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      mockContext.redis.set.mockResolvedValue(undefined);
      
      const result = await userProfileService.updateUserStatistics('testuser', mockSubmissions);
      
      expect(result.statistics.totalSubmissions).toBe(3);
      expect(result.statistics.successfulSubmissions).toBe(2);
    });
  });

  describe('deleteUserProfile', () => {
    it('should delete user profile from Redis', async () => {
      mockContext.redis.del.mockResolvedValue(1);
      
      await userProfileService.deleteUserProfile('testuser');
      
      expect(mockContext.redis.del).toHaveBeenCalledWith('user:testuser');
    });

    it('should handle deletion errors', async () => {
      mockContext.redis.del.mockRejectedValue(new Error('Redis delete error'));
      
      await expect(userProfileService.deleteUserProfile('testuser'))
        .rejects.toThrow('Failed to delete user profile');
    });
  });

  describe('getUserRank', () => {
    it('should return user rank placeholder', async () => {
      const rank = await userProfileService.getUserRank('testuser');
      
      expect(rank).toBe(0); // Placeholder implementation
    });
  });
});

describe('User Progress System Integration', () => {
  let pointsService: PointsService;
  let badgeService: BadgeService;
  let userProfileService: UserProfileService;
  let mockUserProfile: UserProfile;
  let mockChallenge: Challenge;

  beforeEach(() => {
    pointsService = new PointsService(mockContext);
    badgeService = new BadgeService(mockContext);
    userProfileService = new UserProfileService(mockContext);
    
    mockContext.redis.get.mockClear();
    mockContext.redis.set.mockClear();
    
    mockUserProfile = {
      redditUsername: 'testuser',
      totalPoints: 75,
      completedChallenges: ['challenge1', 'challenge2'],
      badges: [],
      joinedAt: new Date('2024-01-01'),
      lastActiveAt: new Date('2024-01-15'),
      preferences: {
        notifications: true,
        leaderboardVisible: true,
        locationSharing: true
      },
      statistics: {
        totalSubmissions: 3,
        successfulSubmissions: 2,
        averageCompletionTime: 1800000,
        favoritePartners: ['partner1']
      }
    };

    mockChallenge = {
      id: 'challenge3',
      title: 'Visit Coffee Shop',
      description: 'Take a photo at the coffee shop',
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
        address: '123 Main St',
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
  });

  describe('Challenge Completion Flow', () => {
    it('should calculate points, award badges, and update profile correctly', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      mockContext.redis.set.mockResolvedValue(undefined);
      
      // Step 1: Calculate points for challenge completion
      const pointsCalculation = pointsService.calculateChallengePoints(mockChallenge, mockUserProfile);
      expect(pointsCalculation.totalPoints).toBeGreaterThan(0);
      
      // Step 2: Apply level multiplier
      const multiplier = pointsService.getPointsMultiplier(mockUserProfile);
      const finalPointsCalculation = pointsService.applyPointsMultiplier(pointsCalculation, multiplier);
      
      // Step 3: Update user profile with new points
      const updatedProfile = await userProfileService.updateUserPoints(
        'testuser', 
        finalPointsCalculation.totalPoints, 
        mockChallenge.id
      );
      
      expect(updatedProfile.totalPoints).toBe(mockUserProfile.totalPoints + finalPointsCalculation.totalPoints);
      expect(updatedProfile.completedChallenges).toContain(mockChallenge.id);
      
      // Step 4: Check for eligible badges
      const eligibleBadges = await badgeService.checkEligibleBadges(updatedProfile, [mockChallenge]);
      expect(eligibleBadges.length).toBeGreaterThan(0);
      
      // Step 5: Award badges
      for (const badge of eligibleBadges) {
        await userProfileService.awardBadge('testuser', badge);
      }
    });

    it('should handle milestone achievements correctly', async () => {
      // User close to 100 point milestone
      const userNearMilestone = { ...mockUserProfile, totalPoints: 95 };
      mockContext.redis.get.mockResolvedValue(JSON.stringify(userNearMilestone));
      mockContext.redis.set.mockResolvedValue(undefined);
      
      // Calculate points for medium challenge (25 points)
      const pointsCalculation = pointsService.calculateChallengePoints(mockChallenge, userNearMilestone);
      
      // Check milestone before completion
      const milestoneBeforeCompletion = pointsService.getPointsToNextMilestone(userNearMilestone.totalPoints);
      expect(milestoneBeforeCompletion.nextMilestone).toBe(100);
      expect(milestoneBeforeCompletion.pointsNeeded).toBe(5);
      
      // Update profile with new points
      const updatedProfile = await userProfileService.updateUserPoints(
        'testuser', 
        pointsCalculation.totalPoints, 
        mockChallenge.id
      );
      
      // Check milestone after completion
      const milestoneAfterCompletion = pointsService.getPointsToNextMilestone(updatedProfile.totalPoints);
      expect(milestoneAfterCompletion.nextMilestone).toBe(250); // Next milestone
      
      // Check if Point Collector badge is eligible
      const eligibleBadges = await badgeService.checkEligibleBadges(updatedProfile, [mockChallenge]);
      const pointCollectorBadge = eligibleBadges.find(b => b.id === 'point_collector');
      expect(pointCollectorBadge).toBeDefined();
    });

    it('should handle first-time user completion correctly', async () => {
      // New user with no completions
      const newUser = { 
        ...mockUserProfile, 
        totalPoints: 0, 
        completedChallenges: [],
        statistics: { ...mockUserProfile.statistics, successfulSubmissions: 0 }
      };
      mockContext.redis.get.mockResolvedValue(JSON.stringify(newUser));
      mockContext.redis.set.mockResolvedValue(undefined);
      
      // Calculate points (should include first completion bonus)
      const pointsCalculation = pointsService.calculateChallengePoints(mockChallenge, newUser);
      expect(pointsCalculation.bonusReasons).toContain('First challenge bonus (+5)');
      
      // Update profile
      const updatedProfile = await userProfileService.updateUserPoints(
        'testuser', 
        pointsCalculation.totalPoints, 
        mockChallenge.id
      );
      
      // Check for First Steps badge
      const eligibleBadges = await badgeService.checkEligibleBadges(updatedProfile, [mockChallenge]);
      const firstStepsBadge = eligibleBadges.find(b => b.id === 'first_steps');
      expect(firstStepsBadge).toBeDefined();
      expect(firstStepsBadge?.name).toBe('First Steps');
    });

    it('should handle partner loyalty bonuses correctly', async () => {
      // User who frequently visits partner1
      const loyalUser = { 
        ...mockUserProfile, 
        statistics: { 
          ...mockUserProfile.statistics, 
          favoritePartners: ['partner1'] 
        } 
      };
      mockContext.redis.get.mockResolvedValue(JSON.stringify(loyalUser));
      mockContext.redis.set.mockResolvedValue(undefined);
      
      // Calculate points (should include partner loyalty bonus)
      const pointsCalculation = pointsService.calculateChallengePoints(mockChallenge, loyalUser);
      expect(pointsCalculation.bonusReasons.some(reason => reason.includes('Partner loyalty'))).toBe(true);
      
      // Update profile
      const updatedProfile = await userProfileService.updateUserPoints(
        'testuser', 
        pointsCalculation.totalPoints, 
        mockChallenge.id
      );
      
      // Check if user qualifies for partner visit badges
      const userWith5Partners = { 
        ...updatedProfile, 
        statistics: { 
          ...updatedProfile.statistics, 
          favoritePartners: ['p1', 'p2', 'p3', 'p4', 'p5'] 
        } 
      };
      
      const eligibleBadges = await badgeService.checkEligibleBadges(userWith5Partners, [mockChallenge]);
      const localSupporterBadge = eligibleBadges.find(b => b.id === 'local_supporter');
      expect(localSupporterBadge).toBeDefined();
    });

    it('should handle daily points limits correctly', async () => {
      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfile));
      
      // Check daily limit for user
      const dailyLimit = pointsService.getDailyPointsLimit(mockUserProfile);
      expect(dailyLimit).toBeGreaterThan(0);
      
      // Check if user has reached daily limit (should be false in test)
      const hasReachedLimit = await pointsService.hasReachedDailyLimit('testuser', 50);
      expect(hasReachedLimit).toBe(false);
    });
  });

  describe('Achievement Criteria Validation', () => {
    it('should validate completion count criteria correctly', async () => {
      const userWith5Completions = { 
        ...mockUserProfile, 
        completedChallenges: ['c1', 'c2', 'c3', 'c4', 'c5'] 
      };
      
      const eligibleBadges = await badgeService.checkEligibleBadges(userWith5Completions, []);
      
      // Should get first_steps (1 completion) and explorer (5 completions)
      const badgeIds = eligibleBadges.map(b => b.id);
      expect(badgeIds).toContain('first_steps');
      expect(badgeIds).toContain('explorer');
      expect(badgeIds).not.toContain('adventurer'); // Requires 15 completions
    });

    it('should validate points total criteria correctly', async () => {
      const userWith500Points = { ...mockUserProfile, totalPoints: 500 };
      
      const eligibleBadges = await badgeService.checkEligibleBadges(userWith500Points, []);
      
      const badgeIds = eligibleBadges.map(b => b.id);
      expect(badgeIds).toContain('point_collector'); // 100 points
      expect(badgeIds).toContain('high_scorer'); // 500 points
      expect(badgeIds).not.toContain('point_master'); // Requires 1000 points
    });

    it('should validate partner visit criteria correctly', async () => {
      const userWith15Partners = { 
        ...mockUserProfile, 
        statistics: { 
          ...mockUserProfile.statistics, 
          favoritePartners: Array.from({ length: 15 }, (_, i) => `partner${i}`) 
        } 
      };
      
      const eligibleBadges = await badgeService.checkEligibleBadges(userWith15Partners, []);
      
      const badgeIds = eligibleBadges.map(b => b.id);
      expect(badgeIds).toContain('local_supporter'); // 5 partners
      expect(badgeIds).toContain('community_champion'); // 15 partners
    });
  });

  describe('Points Transaction Recording', () => {
    it('should record points transactions correctly', async () => {
      const transaction = await pointsService.recordPointsTransaction({
        userRedditUsername: 'testuser',
        challengeId: 'challenge1',
        points: 25,
        transactionType: 'earned',
        reason: 'Challenge completion'
      });
      
      expect(transaction.id).toBeDefined();
      expect(transaction.timestamp).toBeInstanceOf(Date);
      expect(transaction.userRedditUsername).toBe('testuser');
      expect(transaction.points).toBe(25);
      expect(transaction.transactionType).toBe('earned');
    });

    it('should format points breakdown for display', () => {
      const calculation: PointsCalculation = {
        basePoints: 25,
        bonusPoints: 10,
        totalPoints: 35,
        bonusReasons: ['First challenge bonus (+5)', 'Partner loyalty (+2)', 'Speed bonus (+3)']
      };
      
      const breakdown = pointsService.formatPointsBreakdown(calculation);
      
      expect(breakdown).toContain('Base Points: 25');
      expect(breakdown).toContain('Bonus Points: 10');
      expect(breakdown).toContain('First challenge bonus (+5)');
      expect(breakdown).toContain('Partner loyalty (+2)');
      expect(breakdown).toContain('Speed bonus (+3)');
      expect(breakdown).toContain('Total: 35 points');
    });
  });

  describe('Badge Display Formatting', () => {
    it('should format badges for display correctly', () => {
      const badge: Badge = {
        id: 'explorer',
        name: 'Explorer',
        description: 'Complete 5 challenges',
        iconUrl: '/badges/explorer.png',
        earnedAt: new Date('2024-01-15T10:00:00Z'),
        criteria: { type: 'completion_count', threshold: 5, timeframe: 'alltime' }
      };
      
      const formatted = badgeService.formatBadgeForDisplay(badge);
      
      expect(formatted.id).toBe('explorer');
      expect(formatted.name).toBe('Explorer');
      expect(formatted.rarity).toBe('common');
      expect(formatted.rarityColor).toBe('#9CA3AF');
      expect(formatted.earnedAt).toBe('1/15/2024');
    });
  });
});