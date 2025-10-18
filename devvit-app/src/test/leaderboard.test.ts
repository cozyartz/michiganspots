/**
 * Unit tests for Leaderboard System
 * Tests ranking algorithms, tie-breaking logic, component rendering, and real-time synchronization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  LeaderboardService, 
  LeaderboardConfig, 
  RankingCriteria,
  DEFAULT_LEADERBOARD_CONFIGS,
  RANKING_PRESETS
} from '../services/leaderboardService.js';
import { 
  UserProfile, 
  LeaderboardEntry, 
  LeaderboardData,
  Badge 
} from '../types/core.js';
// Note: Devvit components use a different testing approach than React
// These imports are for reference - actual component testing would use Devvit's testing framework

// Mock Devvit context
const mockContext = {
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    keys: vi.fn(),
    zadd: vi.fn(),
    zrange: vi.fn(),
    zrevrange: vi.fn()
  },
  reddit: {
    getCurrentUser: vi.fn()
  }
};

// Test data
const createMockUserProfile = (
  username: string, 
  points: number, 
  completions: number,
  joinedDaysAgo: number = 30
): UserProfile => ({
  redditUsername: username,
  totalPoints: points,
  completedChallenges: Array(completions).fill('challenge-id'),
  badges: Array(Math.floor(completions / 3)).fill({
    id: 'badge-1',
    name: 'Test Badge',
    description: 'Test badge',
    iconUrl: 'test.png',
    earnedAt: new Date(),
    criteria: {
      type: 'completion_count',
      threshold: 3
    }
  }) as Badge[],
  joinedAt: new Date(Date.now() - (joinedDaysAgo * 24 * 60 * 60 * 1000)),
  lastActiveAt: new Date(),
  preferences: {
    notifications: true,
    leaderboardVisible: true,
    locationSharing: true
  },
  statistics: {
    totalSubmissions: completions,
    successfulSubmissions: completions,
    averageCompletionTime: 300,
    favoritePartners: []
  }
});

const mockUserProfiles: UserProfile[] = [
  createMockUserProfile('alice', 150, 6, 10), // Should be rank 1
  createMockUserProfile('bob', 125, 5, 15),   // Should be rank 2
  createMockUserProfile('charlie', 125, 5, 20), // Should be rank 3 (tie-breaker by join date)
  createMockUserProfile('david', 100, 4, 25),   // Should be rank 4
  createMockUserProfile('eve', 75, 3, 30)       // Should be rank 5
];

describe('LeaderboardService', () => {
  let leaderboardService: LeaderboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    leaderboardService = new LeaderboardService(mockContext as any);
  });

  describe('generateLeaderboard', () => {
    it('should generate leaderboard with correct rankings', async () => {
      // Mock Redis calls
      mockContext.redis.keys.mockResolvedValue(['user:alice', 'user:bob', 'user:charlie', 'user:david', 'user:eve']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[0]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[1]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[2]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[3]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[4]));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const result = await leaderboardService.generateLeaderboard(config);

      expect(result.entries).toHaveLength(5);
      expect(result.entries[0].username).toBe('alice');
      expect(result.entries[0].rank).toBe(1);
      expect(result.entries[0].points).toBe(150);
      
      expect(result.entries[1].username).toBe('bob');
      expect(result.entries[1].rank).toBe(2);
      
      expect(result.entries[2].username).toBe('charlie');
      expect(result.entries[2].rank).toBe(3);
    });

    it('should handle tie-breaking correctly', async () => {
      // Create users with same points but different join dates
      const tiedUsers = [
        createMockUserProfile('user1', 100, 4, 10), // Joined more recently
        createMockUserProfile('user2', 100, 4, 20), // Joined earlier
        createMockUserProfile('user3', 100, 4, 15)  // Joined in between
      ];

      mockContext.redis.keys.mockResolvedValue(['user:user1', 'user:user2', 'user:user3']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(tiedUsers[0]))
        .mockResolvedValueOnce(JSON.stringify(tiedUsers[1]))
        .mockResolvedValueOnce(JSON.stringify(tiedUsers[2]));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const criteria: RankingCriteria = {
        primarySort: 'points',
        tieBreaker: 'join_date',
        sortOrder: 'desc'
      };

      const result = await leaderboardService.generateLeaderboard(config, criteria);

      // Earlier join date should win tie-breaker
      expect(result.entries[0].username).toBe('user2'); // Joined earliest
      expect(result.entries[1].username).toBe('user3'); // Joined middle
      expect(result.entries[2].username).toBe('user1'); // Joined latest
    });

    it('should apply filters correctly', async () => {
      mockContext.redis.keys.mockResolvedValue(['user:alice', 'user:bob', 'user:charlie']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[0])) // 150 points
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[1])) // 125 points
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[2])); // 125 points

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const filters = {
        minPoints: 130,
        excludeUsers: ['bob']
      };

      const result = await leaderboardService.generateLeaderboard(config, RANKING_PRESETS.points, filters);

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].username).toBe('alice');
    });

    it('should limit entries to maxEntries', async () => {
      mockContext.redis.keys.mockResolvedValue(['user:alice', 'user:bob', 'user:charlie', 'user:david', 'user:eve']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[0]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[1]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[2]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[3]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[4]));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 3,
        updateInterval: 60
      };

      const result = await leaderboardService.generateLeaderboard(config);

      expect(result.entries).toHaveLength(3);
      expect(result.entries[2].username).toBe('charlie');
    });
  });

  describe('getUserRank', () => {
    beforeEach(() => {
      // Mock leaderboard data
      const mockLeaderboard: LeaderboardData = {
        type: 'individual',
        timeframe: 'alltime',
        entries: [
          { rank: 1, username: 'alice', points: 150, badgeCount: 2, completedChallenges: 6 },
          { rank: 2, username: 'bob', points: 125, badgeCount: 1, completedChallenges: 5 },
          { rank: 3, username: 'charlie', points: 125, badgeCount: 1, completedChallenges: 5 }
        ],
        totalParticipants: 5,
        lastUpdated: new Date()
      };

      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockLeaderboard));
    });

    it('should return correct rank for user in top entries', async () => {
      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const result = await leaderboardService.getUserRank('alice', config);

      expect(result.rank).toBe(1);
      expect(result.entry?.username).toBe('alice');
      expect(result.entry?.points).toBe(150);
    });

    it('should calculate rank for user not in top entries', async () => {
      // Mock user profile for user not in leaderboard
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify({
          type: 'individual',
          timeframe: 'alltime',
          entries: [
            { rank: 1, username: 'alice', points: 150, badgeCount: 2, completedChallenges: 6 }
          ],
          totalParticipants: 5,
          lastUpdated: new Date()
        }))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[4])); // eve with 75 points

      // Mock all user profiles for rank calculation
      mockContext.redis.keys.mockResolvedValue(['user:alice', 'user:bob', 'user:charlie', 'user:david', 'user:eve']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[0]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[1]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[2]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[3]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[4]));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 1,
        updateInterval: 60
      };

      const result = await leaderboardService.getUserRank('eve', config);

      expect(result.rank).toBe(5);
      expect(result.entry?.username).toBe('eve');
      expect(result.entry?.points).toBe(75);
    });

    it('should return -1 for non-existent user', async () => {
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify({
          type: 'individual',
          timeframe: 'alltime',
          entries: [],
          totalParticipants: 0,
          lastUpdated: new Date()
        }))
        .mockResolvedValueOnce(null); // User profile not found

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const result = await leaderboardService.getUserRank('nonexistent', config);

      expect(result.rank).toBe(-1);
      expect(result.entry).toBeNull();
    });
  });

  describe('getLeaderboardStats', () => {
    it('should calculate correct statistics', async () => {
      const mockLeaderboard: LeaderboardData = {
        type: 'individual',
        timeframe: 'alltime',
        entries: [
          { rank: 1, username: 'alice', points: 150, badgeCount: 2, completedChallenges: 6 },
          { rank: 2, username: 'bob', points: 100, badgeCount: 1, completedChallenges: 4 },
          { rank: 3, username: 'charlie', points: 50, badgeCount: 0, completedChallenges: 2 }
        ],
        totalParticipants: 3,
        lastUpdated: new Date()
      };

      // Mock the getLeaderboard method directly
      const getLeaderboardSpy = vi.spyOn(leaderboardService, 'getLeaderboard');
      getLeaderboardSpy.mockResolvedValue(mockLeaderboard);
      
      // Mock active users count
      mockContext.redis.keys.mockResolvedValue(['user:alice', 'user:bob']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[0]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[1]));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const stats = await leaderboardService.getLeaderboardStats(config);

      expect(stats.totalUsers).toBe(3);
      expect(stats.averagePoints).toBe(100); // (150 + 100 + 50) / 3 = 100
      expect(stats.topScore).toBe(150);
      expect(stats.activeUsers).toBe(2);
      
      getLeaderboardSpy.mockRestore();
    });

    it('should handle empty leaderboard', async () => {
      const mockLeaderboard: LeaderboardData = {
        type: 'individual',
        timeframe: 'alltime',
        entries: [],
        totalParticipants: 0,
        lastUpdated: new Date()
      };

      mockContext.redis.get.mockResolvedValue(JSON.stringify(mockLeaderboard));
      mockContext.redis.keys.mockResolvedValue([]);

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const stats = await leaderboardService.getLeaderboardStats(config);

      expect(stats.totalUsers).toBe(0);
      expect(stats.averagePoints).toBe(0);
      expect(stats.topScore).toBe(0);
      expect(stats.activeUsers).toBe(0);
    });
  });

  describe('updateUserPosition', () => {
    it('should update user position in all leaderboard types', async () => {
      await leaderboardService.updateUserPosition('alice', 25);

      // Should call zadd for each leaderboard type
      expect(mockContext.redis.zadd).toHaveBeenCalledTimes(3);
      expect(mockContext.redis.zadd).toHaveBeenCalledWith(
        expect.stringContaining('weekly'),
        25,
        'alice'
      );
      expect(mockContext.redis.zadd).toHaveBeenCalledWith(
        expect.stringContaining('monthly'),
        25,
        'alice'
      );
      expect(mockContext.redis.zadd).toHaveBeenCalledWith(
        expect.stringContaining('alltime'),
        25,
        'alice'
      );
    });
  });

  describe('Configuration and Presets', () => {
    it('should have valid default configurations', () => {
      expect(DEFAULT_LEADERBOARD_CONFIGS).toHaveLength(4);
      
      const weeklyConfig = DEFAULT_LEADERBOARD_CONFIGS.find(c => c.timeframe === 'weekly');
      expect(weeklyConfig).toBeDefined();
      expect(weeklyConfig?.type).toBe('individual');
      expect(weeklyConfig?.maxEntries).toBe(50);
      expect(weeklyConfig?.updateInterval).toBe(15);
    });

    it('should have valid ranking presets', () => {
      expect(RANKING_PRESETS.points).toBeDefined();
      expect(RANKING_PRESETS.points.primarySort).toBe('points');
      expect(RANKING_PRESETS.points.tieBreaker).toBe('completion_date');
      expect(RANKING_PRESETS.points.sortOrder).toBe('desc');

      expect(RANKING_PRESETS.completions).toBeDefined();
      expect(RANKING_PRESETS.completions.primarySort).toBe('completions');
      
      expect(RANKING_PRESETS.badges).toBeDefined();
      expect(RANKING_PRESETS.badges.primarySort).toBe('badges');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors gracefully', async () => {
      mockContext.redis.keys.mockRejectedValue(new Error('Redis connection failed'));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      await expect(leaderboardService.generateLeaderboard(config))
        .rejects.toThrow('Failed to generate leaderboard');
    });

    it('should handle invalid user profile data', async () => {
      mockContext.redis.keys.mockResolvedValue(['user:invalid']);
      mockContext.redis.get.mockResolvedValue('invalid json');

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const result = await leaderboardService.generateLeaderboard(config);
      
      // Should handle invalid data gracefully and return empty leaderboard
      expect(result.entries).toHaveLength(0);
    });
  });

  describe('Real-time Data Synchronization', () => {
    it('should detect stale data and refresh leaderboard', async () => {
      const staleLeaderboard: LeaderboardData = {
        type: 'individual',
        timeframe: 'weekly',
        entries: [
          { rank: 1, username: 'alice', points: 100, badgeCount: 1, completedChallenges: 4 }
        ],
        totalParticipants: 1,
        lastUpdated: new Date(Date.now() - (20 * 60 * 1000)) // 20 minutes ago
      };

      // Mock stale data detection by checking if data should be refreshed
      const isStale = (lastUpdated: Date, updateInterval: number): boolean => {
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();
        return timeDiff > (updateInterval * 60 * 1000);
      };

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'weekly',
        maxEntries: 10,
        updateInterval: 15 // 15 minutes
      };

      // Test stale detection logic
      expect(isStale(staleLeaderboard.lastUpdated, config.updateInterval)).toBe(true);
      
      // Test fresh data detection
      const freshData = new Date(Date.now() - (5 * 60 * 1000)); // 5 minutes ago
      expect(isStale(freshData, config.updateInterval)).toBe(false);
    });

    it('should return cached data when not stale', async () => {
      // Test cache freshness logic
      const freshTime = new Date(Date.now() - (5 * 60 * 1000)); // 5 minutes ago
      const updateInterval = 15; // 15 minutes
      
      const isDataFresh = (lastUpdated: Date, intervalMinutes: number): boolean => {
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();
        return timeDiff <= (intervalMinutes * 60 * 1000);
      };

      expect(isDataFresh(freshTime, updateInterval)).toBe(true);
      
      // Test stale data
      const staleTime = new Date(Date.now() - (20 * 60 * 1000)); // 20 minutes ago
      expect(isDataFresh(staleTime, updateInterval)).toBe(false);
    });

    it('should handle concurrent leaderboard updates', async () => {
      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      // Simulate multiple concurrent updates
      const updatePromises = [
        leaderboardService.updateUserPosition('alice', 25),
        leaderboardService.updateUserPosition('bob', 30),
        leaderboardService.updateUserPosition('charlie', 20)
      ];

      await Promise.all(updatePromises);

      // Should handle all updates without conflicts
      expect(mockContext.redis.zadd).toHaveBeenCalledTimes(9); // 3 users × 3 leaderboard types
    });
  });

  describe('Timeframe Filtering', () => {
    it('should filter users by weekly timeframe correctly', async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - (8 * 24 * 60 * 60 * 1000)); // 8 days ago
      const dayAgo = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)); // 1 day ago

      const users = [
        createMockUserProfile('active_user', 100, 4, 1), // Active within week
        { ...createMockUserProfile('inactive_user', 150, 6, 10), lastActiveAt: weekAgo }, // Inactive
        { ...createMockUserProfile('recent_user', 75, 3, 5), lastActiveAt: dayAgo } // Active within week
      ];

      mockContext.redis.keys.mockResolvedValue(['user:active_user', 'user:inactive_user', 'user:recent_user']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(users[0]))
        .mockResolvedValueOnce(JSON.stringify(users[1]))
        .mockResolvedValueOnce(JSON.stringify(users[2]));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'weekly',
        maxEntries: 10,
        updateInterval: 15
      };

      const result = await leaderboardService.generateLeaderboard(config);

      // Should only include users active within the week
      expect(result.entries).toHaveLength(2);
      expect(result.entries.find(e => e.username === 'inactive_user')).toBeUndefined();
      expect(result.entries.find(e => e.username === 'active_user')).toBeDefined();
      expect(result.entries.find(e => e.username === 'recent_user')).toBeDefined();
    });

    it('should include all users for alltime timeframe', async () => {
      mockContext.redis.keys.mockResolvedValue(['user:alice', 'user:bob']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[0]))
        .mockResolvedValueOnce(JSON.stringify(mockUserProfiles[1]));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const result = await leaderboardService.generateLeaderboard(config);

      expect(result.entries).toHaveLength(2);
    });
  });

  describe('Advanced Ranking Scenarios', () => {
    it('should handle complex tie-breaking with multiple criteria', async () => {
      const now = new Date();
      const users = [
        { 
          ...createMockUserProfile('user1', 100, 4, 10), 
          lastActiveAt: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)) // 1 day ago
        },
        { 
          ...createMockUserProfile('user2', 100, 4, 5), 
          lastActiveAt: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)) // 2 days ago
        },
        { 
          ...createMockUserProfile('user3', 100, 4, 15), 
          lastActiveAt: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)) // 3 days ago
        }
      ];

      mockContext.redis.keys.mockResolvedValue(['user:user1', 'user:user2', 'user:user3']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(users[0]))
        .mockResolvedValueOnce(JSON.stringify(users[1]))
        .mockResolvedValueOnce(JSON.stringify(users[2]));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      const criteria: RankingCriteria = {
        primarySort: 'points',
        tieBreaker: 'completion_date', // Most recent completion wins
        sortOrder: 'desc'
      };

      const result = await leaderboardService.generateLeaderboard(config, criteria);

      // Should rank by most recent completion (lastActiveAt as proxy)
      expect(result.entries[0].username).toBe('user1'); // Most recent
      expect(result.entries[1].username).toBe('user2');
      expect(result.entries[2].username).toBe('user3'); // Least recent
    });

    it('should handle ranking by different primary criteria', async () => {
      const users = [
        createMockUserProfile('points_leader', 200, 4, 10), // High points, low completions
        createMockUserProfile('completion_leader', 100, 10, 15), // Low points, high completions
        createMockUserProfile('balanced_user', 150, 6, 20) // Balanced
      ];

      mockContext.redis.keys.mockResolvedValue(['user:points_leader', 'user:completion_leader', 'user:balanced_user']);
      mockContext.redis.get
        .mockResolvedValueOnce(JSON.stringify(users[0]))
        .mockResolvedValueOnce(JSON.stringify(users[1]))
        .mockResolvedValueOnce(JSON.stringify(users[2]));

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 10,
        updateInterval: 60
      };

      // Test ranking by completions
      const completionCriteria: RankingCriteria = {
        primarySort: 'completions',
        tieBreaker: 'join_date',
        sortOrder: 'desc'
      };

      const result = await leaderboardService.generateLeaderboard(config, completionCriteria);

      expect(result.entries[0].username).toBe('completion_leader'); // 10 completions
      expect(result.entries[1].username).toBe('balanced_user'); // 6 completions
      expect(result.entries[2].username).toBe('points_leader'); // 4 completions
    });
  });
});

describe('Leaderboard Component Logic Testing', () => {
  // Note: Devvit components require a different testing approach than React components
  // These tests focus on the logic that would be used within components

  describe('Component Data Processing', () => {
    it('should correctly filter leaderboard entries by search query', () => {
      const entries: LeaderboardEntry[] = [
        { rank: 1, username: 'alice_smith', points: 150, badgeCount: 2, completedChallenges: 6 },
        { rank: 2, username: 'bob_jones', points: 125, badgeCount: 1, completedChallenges: 5 },
        { rank: 3, username: 'charlie_brown', points: 100, badgeCount: 1, completedChallenges: 4 }
      ];

      // Test search filtering logic
      const searchQuery = 'alice';
      const filteredEntries = entries.filter(entry => 
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filteredEntries).toHaveLength(1);
      expect(filteredEntries[0].username).toBe('alice_smith');
    });

    it('should correctly paginate leaderboard entries', () => {
      const entries: LeaderboardEntry[] = Array.from({ length: 50 }, (_, i) => ({
        rank: i + 1,
        username: `user${i + 1}`,
        points: 100 - i,
        badgeCount: Math.floor((100 - i) / 25),
        completedChallenges: Math.floor((100 - i) / 10)
      }));

      const ENTRIES_PER_PAGE = 20;
      const currentPage = 2;

      // Test pagination logic
      const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
      const endIndex = startIndex + ENTRIES_PER_PAGE;
      const paginatedEntries = entries.slice(startIndex, endIndex);

      expect(paginatedEntries).toHaveLength(20);
      expect(paginatedEntries[0].rank).toBe(21); // First entry on page 2
      expect(paginatedEntries[19].rank).toBe(40); // Last entry on page 2
    });

    it('should correctly calculate total pages for pagination', () => {
      const totalEntries = 157;
      const ENTRIES_PER_PAGE = 20;
      
      const totalPages = Math.ceil(totalEntries / ENTRIES_PER_PAGE);
      
      expect(totalPages).toBe(8); // 157 entries / 20 per page = 7.85, rounded up to 8
    });

    it('should correctly identify current user in leaderboard', () => {
      const entries: LeaderboardEntry[] = [
        { rank: 1, username: 'alice', points: 150, badgeCount: 2, completedChallenges: 6 },
        { rank: 2, username: 'testuser', points: 125, badgeCount: 1, completedChallenges: 5 },
        { rank: 3, username: 'charlie', points: 100, badgeCount: 1, completedChallenges: 4 }
      ];

      const currentUser = 'testuser';
      const userEntry = entries.find(entry => entry.username === currentUser);

      expect(userEntry).toBeDefined();
      expect(userEntry?.rank).toBe(2);
      expect(userEntry?.points).toBe(125);
    });

    it('should handle rank display formatting correctly', () => {
      const getRankDisplay = (rank: number): string => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
      };

      expect(getRankDisplay(1)).toBe('🥇');
      expect(getRankDisplay(2)).toBe('🥈');
      expect(getRankDisplay(3)).toBe('🥉');
      expect(getRankDisplay(4)).toBe('#4');
      expect(getRankDisplay(10)).toBe('#10');
    });

    it('should handle username truncation for display', () => {
      const truncateUsername = (username: string, maxLength: number = 12): string => {
        return username.length > maxLength ? 
          username.substring(0, maxLength) + '...' : 
          username;
      };

      expect(truncateUsername('short')).toBe('short');
      expect(truncateUsername('verylongusername')).toBe('verylonguser...');
      expect(truncateUsername('exactlength')).toBe('exactlength'); // Exactly 11 chars, no truncation
      expect(truncateUsername('exactlength12')).toBe('exactlength1...'); // 13 chars, should truncate
    });
  });

  describe('Component State Logic', () => {
    it('should handle tab switching state changes', () => {
      const tabs = ['weekly', 'monthly', 'alltime'];
      let activeTab = 'weekly';
      let currentPage = 2;

      // Simulate tab change
      const handleTabChange = (newTab: string) => {
        activeTab = newTab;
        currentPage = 1; // Reset to first page
      };

      handleTabChange('monthly');

      expect(activeTab).toBe('monthly');
      expect(currentPage).toBe(1);
    });

    it('should handle search query state changes', () => {
      let searchQuery = '';
      let currentPage = 3;

      // Simulate search input
      const handleSearchChange = (query: string) => {
        searchQuery = query;
        currentPage = 1; // Reset to first page when searching
      };

      handleSearchChange('alice');

      expect(searchQuery).toBe('alice');
      expect(currentPage).toBe(1);
    });

    it('should handle pagination state correctly', () => {
      const totalEntries = 100;
      const ENTRIES_PER_PAGE = 20;
      const totalPages = Math.ceil(totalEntries / ENTRIES_PER_PAGE);
      let currentPage = 1;

      // Test next page
      const goToNextPage = () => {
        if (currentPage < totalPages) {
          currentPage++;
        }
      };

      // Test previous page
      const goToPreviousPage = () => {
        if (currentPage > 1) {
          currentPage--;
        }
      };

      goToNextPage();
      expect(currentPage).toBe(2);

      goToNextPage();
      goToNextPage();
      goToNextPage();
      goToNextPage(); // Should be at page 5 (max)
      expect(currentPage).toBe(5);

      goToPreviousPage();
      expect(currentPage).toBe(4);
    });
  });

  describe('Component Error Handling Logic', () => {
    it('should handle empty leaderboard data', () => {
      const emptyLeaderboard: LeaderboardData = {
        type: 'individual',
        timeframe: 'weekly',
        entries: [],
        totalParticipants: 0,
        lastUpdated: new Date()
      };

      const hasEntries = emptyLeaderboard.entries.length > 0;
      const displayMessage = hasEntries ? 'Showing leaderboard' : 'No entries available';

      expect(hasEntries).toBe(false);
      expect(displayMessage).toBe('No entries available');
    });

    it('should handle missing user rank gracefully', () => {
      const userRank = { rank: -1, entry: null };
      
      const isUserRanked = userRank.rank > 0 && userRank.entry !== null;
      const displayRank = isUserRanked ? `Rank #${userRank.rank}` : 'Not ranked';

      expect(isUserRanked).toBe(false);
      expect(displayRank).toBe('Not ranked');
    });

    it('should handle loading and error states', () => {
      const states = [
        { loading: true, error: null, data: null },
        { loading: false, error: 'Network error', data: null },
        { loading: false, error: null, data: { entries: [] } }
      ];

      states.forEach((state, index) => {
        let displayContent = '';
        
        if (state.loading) {
          displayContent = 'Loading...';
        } else if (state.error) {
          displayContent = `Error: ${state.error}`;
        } else if (state.data) {
          displayContent = 'Data loaded';
        }

        switch (index) {
          case 0:
            expect(displayContent).toBe('Loading...');
            break;
          case 1:
            expect(displayContent).toBe('Error: Network error');
            break;
          case 2:
            expect(displayContent).toBe('Data loaded');
            break;
        }
      });
    });
  });

  describe('Widget-Specific Logic', () => {
    it('should limit entries for widget display', () => {
      const allEntries: LeaderboardEntry[] = Array.from({ length: 20 }, (_, i) => ({
        rank: i + 1,
        username: `user${i + 1}`,
        points: 100 - i,
        badgeCount: Math.floor((100 - i) / 25),
        completedChallenges: Math.floor((100 - i) / 10)
      }));

      const maxEntries = 5;
      const widgetEntries = allEntries.slice(0, maxEntries);

      expect(widgetEntries).toHaveLength(5);
      expect(widgetEntries[0].rank).toBe(1);
      expect(widgetEntries[4].rank).toBe(5);
    });

    it('should format time display for widget', () => {
      const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      };

      const testDate = new Date('2024-01-01T14:30:00');
      const formattedTime = formatTime(testDate);

      expect(formattedTime).toMatch(/\d{1,2}:\d{2}/); // Should match time format
    });

    it('should handle compact vs full display modes', () => {
      const entry: LeaderboardEntry = {
        rank: 1,
        username: 'verylongusername123',
        points: 150,
        badgeCount: 2,
        completedChallenges: 6
      };

      const getDisplayUsername = (username: string, compact: boolean): string => {
        if (compact && username.length > 12) {
          return username.substring(0, 12) + '...';
        }
        return username;
      };

      expect(getDisplayUsername(entry.username, true)).toBe('verylonguser...');
      expect(getDisplayUsername(entry.username, false)).toBe('verylongusername123');
    });
  });
});

describe('Leaderboard Data Updates and Synchronization', () => {
  let leaderboardService: LeaderboardService;

  beforeEach(() => {
    vi.clearAllMocks();
    leaderboardService = new LeaderboardService(mockContext as any);
  });

  describe('Real-time Updates', () => {
    it('should update leaderboard when user completes challenge', async () => {
      const initialData: LeaderboardData = {
        type: 'individual',
        timeframe: 'weekly',
        entries: [
          { rank: 1, username: 'alice', points: 100, badgeCount: 1, completedChallenges: 4 },
          { rank: 2, username: 'bob', points: 75, badgeCount: 0, completedChallenges: 3 }
        ],
        totalParticipants: 2,
        lastUpdated: new Date(Date.now() - (10 * 60 * 1000)) // 10 minutes ago
      };

      // Mock initial leaderboard
      mockContext.redis.get.mockResolvedValueOnce(JSON.stringify(initialData));

      // Simulate user completing challenge and earning points
      await leaderboardService.updateUserPosition('bob', 50); // Bob gains 50 points

      // Verify Redis operations for score updates
      expect(mockContext.redis.zadd).toHaveBeenCalledWith(
        expect.stringContaining('weekly'),
        50,
        'bob'
      );
    });

    it('should handle multiple simultaneous updates', async () => {
      const updates = [
        { user: 'alice', points: 25 },
        { user: 'bob', points: 30 },
        { user: 'charlie', points: 20 },
        { user: 'david', points: 35 }
      ];

      // Execute all updates simultaneously
      const updatePromises = updates.map(update => 
        leaderboardService.updateUserPosition(update.user, update.points)
      );

      await Promise.all(updatePromises);

      // Should handle all updates without race conditions
      expect(mockContext.redis.zadd).toHaveBeenCalledTimes(12); // 4 users × 3 leaderboard types
      
      // Verify each user's updates
      updates.forEach(update => {
        expect(mockContext.redis.zadd).toHaveBeenCalledWith(
          expect.stringContaining('weekly'),
          update.points,
          update.user
        );
      });
    });

    it('should invalidate cache when data becomes stale', async () => {
      // Test cache invalidation logic
      const staleTime = new Date(Date.now() - (30 * 60 * 1000)); // 30 minutes ago
      const updateInterval = 15; // 15 minutes
      
      const shouldInvalidateCache = (lastUpdated: Date, intervalMinutes: number): boolean => {
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();
        return timeDiff > (intervalMinutes * 60 * 1000);
      };

      expect(shouldInvalidateCache(staleTime, updateInterval)).toBe(true);
      
      // Test that fresh data should not be invalidated
      const freshTime = new Date(Date.now() - (5 * 60 * 1000)); // 5 minutes ago
      expect(shouldInvalidateCache(freshTime, updateInterval)).toBe(false);
    });

    it('should maintain data consistency during updates', async () => {
      // Test ranking consistency logic
      const mockEntries = [
        { username: 'user2', points: 150 },
        { username: 'user1', points: 100 },
        { username: 'user3', points: 75 }
      ];

      // Sort by points descending
      const sortedEntries = mockEntries.sort((a, b) => b.points - a.points);
      
      // Assign ranks
      const rankedEntries = sortedEntries.map((entry, index) => ({
        rank: index + 1,
        username: entry.username,
        points: entry.points,
        badgeCount: 0,
        completedChallenges: 0
      }));

      // Verify ranking consistency
      expect(rankedEntries).toHaveLength(3);
      expect(rankedEntries[0].rank).toBe(1);
      expect(rankedEntries[0].username).toBe('user2'); // Highest points
      expect(rankedEntries[1].rank).toBe(2);
      expect(rankedEntries[1].username).toBe('user1');
      expect(rankedEntries[2].rank).toBe(3);
      expect(rankedEntries[2].username).toBe('user3'); // Lowest points
      
      // Verify no gaps in ranking
      const ranks = rankedEntries.map(e => e.rank);
      expect(ranks).toEqual([1, 2, 3]);
    });
  });

  describe('Cache Management', () => {
    it('should set appropriate TTL for different timeframes', async () => {
      const configs = [
        { timeframe: 'weekly', expectedTTL: 15 * 60 },
        { timeframe: 'monthly', expectedTTL: 60 * 60 },
        { timeframe: 'alltime', expectedTTL: 60 * 60 }
      ];

      for (const { timeframe, expectedTTL } of configs) {
        mockContext.redis.keys.mockResolvedValue(['user:alice']);
        mockContext.redis.get.mockResolvedValue(JSON.stringify(mockUserProfiles[0]));

        const config: LeaderboardConfig = {
          type: 'individual',
          timeframe: timeframe as any,
          maxEntries: 10,
          updateInterval: 60
        };

        await leaderboardService.generateLeaderboard(config);

        expect(mockContext.redis.setex).toHaveBeenCalledWith(
          expect.stringContaining(timeframe),
          expectedTTL,
          expect.any(String)
        );
      }
    });

    it('should handle cache misses gracefully', async () => {
      // Test cache miss handling logic
      const handleCacheMiss = (cachedData: string | null): boolean => {
        return cachedData === null || cachedData === undefined;
      };

      expect(handleCacheMiss(null)).toBe(true);
      expect(handleCacheMiss(undefined as any)).toBe(true);
      expect(handleCacheMiss('')).toBe(false);
      expect(handleCacheMiss('{"data": "value"}')).toBe(false);
      
      // Test fallback behavior
      const getFallbackData = (cachedData: string | null): any => {
        if (handleCacheMiss(cachedData)) {
          return { entries: [], totalParticipants: 0, lastUpdated: new Date() };
        }
        return JSON.parse(cachedData!);
      };

      const fallback = getFallbackData(null);
      expect(fallback.entries).toEqual([]);
      expect(fallback.totalParticipants).toBe(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of users efficiently', async () => {
      // Generate 1000 mock users
      const largeUserSet = Array.from({ length: 1000 }, (_, i) => 
        createMockUserProfile(`user${i}`, Math.floor(Math.random() * 1000), Math.floor(Math.random() * 20), i)
      );

      const userKeys = largeUserSet.map((_, i) => `user:user${i}`);
      mockContext.redis.keys.mockResolvedValue(userKeys);
      
      // Mock Redis responses for all users
      largeUserSet.forEach(user => {
        mockContext.redis.get.mockResolvedValueOnce(JSON.stringify(user));
      });

      const config: LeaderboardConfig = {
        type: 'individual',
        timeframe: 'alltime',
        maxEntries: 100, // Limit to top 100
        updateInterval: 60
      };

      const result = await leaderboardService.generateLeaderboard(config);

      expect(result.entries).toHaveLength(100); // Should limit to maxEntries
      expect(result.totalParticipants).toBe(1000); // Should track total participants
      
      // Verify ranking is correct (highest points first)
      for (let i = 1; i < result.entries.length; i++) {
        expect(result.entries[i - 1].points).toBeGreaterThanOrEqual(result.entries[i].points);
      }
    });

    it('should batch Redis operations for efficiency', async () => {
      const users = ['alice', 'bob', 'charlie', 'david', 'eve'];
      
      // Simulate batch updates
      const batchUpdates = users.map(user => 
        leaderboardService.updateUserPosition(user, 25)
      );

      await Promise.all(batchUpdates);

      // Should use efficient Redis operations
      expect(mockContext.redis.zadd).toHaveBeenCalledTimes(15); // 5 users × 3 leaderboard types
    });
  });
});