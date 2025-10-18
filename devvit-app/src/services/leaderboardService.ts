/**
 * Leaderboard Service for Reddit Treasure Hunt Game
 * Handles leaderboard data structures, ranking algorithms, and Redis storage
 */

import { Devvit } from '@devvit/public-api';
import { 
  LeaderboardEntry, 
  LeaderboardData, 
  UserProfile, 
  REDIS_KEYS 
} from '../types/index.js';

export interface LeaderboardConfig {
  type: 'individual' | 'city';
  timeframe: 'weekly' | 'monthly' | 'alltime';
  maxEntries: number;
  updateInterval: number; // minutes
}

export interface RankingCriteria {
  primarySort: 'points' | 'completions' | 'badges';
  tieBreaker: 'completion_date' | 'join_date' | 'username';
  sortOrder: 'desc' | 'asc';
}

export interface LeaderboardFilters {
  minPoints?: number;
  minCompletions?: number;
  city?: string;
  excludeUsers?: string[];
}

export class LeaderboardService {
  private redis: any;
  private context: Devvit.Context;

  constructor(context: Devvit.Context) {
    this.context = context;
    this.redis = context.redis;
  }

  /**
   * Generate leaderboard entries from user profiles
   */
  async generateLeaderboard(
    config: LeaderboardConfig,
    criteria: RankingCriteria = {
      primarySort: 'points',
      tieBreaker: 'completion_date',
      sortOrder: 'desc'
    },
    filters?: LeaderboardFilters
  ): Promise<LeaderboardData> {
    try {
      // Get all user profiles
      const userProfiles = await this.getAllUserProfiles(config.timeframe);
      
      // Apply filters
      const filteredProfiles = this.applyFilters(userProfiles, filters);
      
      // Generate entries with ranking
      const entries = await this.generateRankedEntries(
        filteredProfiles, 
        criteria, 
        config.maxEntries
      );

      const leaderboardData: LeaderboardData = {
        type: config.type,
        timeframe: config.timeframe,
        entries,
        totalParticipants: filteredProfiles.length,
        lastUpdated: new Date()
      };

      // Store in Redis
      await this.storeLeaderboard(config, leaderboardData);

      return leaderboardData;
    } catch (error) {
      console.error('Error generating leaderboard:', error);
      throw new Error(`Failed to generate leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get leaderboard data from Redis or generate if not exists
   */
  async getLeaderboard(config: LeaderboardConfig): Promise<LeaderboardData> {
    try {
      const redisKey = this.getLeaderboardKey(config);
      const cachedData = await this.redis.get(redisKey);

      if (cachedData) {
        const leaderboardData = JSON.parse(cachedData) as LeaderboardData;
        
        // Check if data is stale
        const isStale = this.isDataStale(leaderboardData.lastUpdated, config.updateInterval);
        
        if (!isStale) {
          return leaderboardData;
        }
      }

      // Generate fresh leaderboard data
      return await this.generateLeaderboard(config);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw new Error(`Failed to get leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's current rank in leaderboard
   */
  async getUserRank(
    username: string, 
    config: LeaderboardConfig
  ): Promise<{ rank: number; entry: LeaderboardEntry | null }> {
    try {
      const leaderboard = await this.getLeaderboard(config);
      
      const userEntry = leaderboard.entries.find(entry => entry.username === username);
      
      if (userEntry) {
        return { rank: userEntry.rank, entry: userEntry };
      }

      // User not in top entries, calculate their actual rank
      const userProfile = await this.getUserProfile(username);
      if (!userProfile) {
        return { rank: -1, entry: null };
      }

      const actualRank = await this.calculateUserRank(username, config);
      
      const calculatedUserEntry: LeaderboardEntry = {
        rank: actualRank,
        username: userProfile.redditUsername,
        points: userProfile.totalPoints,
        badgeCount: userProfile.badges.length,
        completedChallenges: userProfile.completedChallenges.length
      };

      return { rank: actualRank, entry: calculatedUserEntry };
    } catch (error) {
      console.error('Error getting user rank:', error);
      return { rank: -1, entry: null };
    }
  }

  /**
   * Update user's leaderboard position after challenge completion
   */
  async updateUserPosition(username: string, pointsEarned: number): Promise<void> {
    try {
      const configs: LeaderboardConfig[] = [
        { type: 'individual', timeframe: 'weekly', maxEntries: 100, updateInterval: 15 },
        { type: 'individual', timeframe: 'monthly', maxEntries: 100, updateInterval: 60 },
        { type: 'individual', timeframe: 'alltime', maxEntries: 100, updateInterval: 60 }
      ];

      // Update all leaderboard types
      for (const config of configs) {
        await this.incrementUserScore(username, pointsEarned, config);
      }
    } catch (error) {
      console.error('Error updating user position:', error);
    }
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(config: LeaderboardConfig): Promise<{
    totalUsers: number;
    averagePoints: number;
    topScore: number;
    activeUsers: number;
  }> {
    try {
      const leaderboard = await this.getLeaderboard(config);
      
      if (!leaderboard || !leaderboard.entries || leaderboard.entries.length === 0) {
        return { totalUsers: 0, averagePoints: 0, topScore: 0, activeUsers: 0 };
      }

      const totalPoints = leaderboard.entries.reduce((sum, entry) => sum + entry.points, 0);
      const averagePoints = Math.round(totalPoints / leaderboard.entries.length);
      const topScore = leaderboard.entries[0]?.points || 0;
      
      // Count users with activity in last 7 days
      const activeUsers = await this.countActiveUsers(7);

      return {
        totalUsers: leaderboard.totalParticipants,
        averagePoints,
        topScore,
        activeUsers
      };
    } catch (error) {
      console.error('Error getting leaderboard stats:', error);
      return { totalUsers: 0, averagePoints: 0, topScore: 0, activeUsers: 0 };
    }
  }

  // Private helper methods

  private async getAllUserProfiles(timeframe: string): Promise<UserProfile[]> {
    // In a real implementation, this would query all user profiles
    // For now, we'll simulate getting profiles from Redis
    const userKeys = await this.redis.keys('user:*');
    const profiles: UserProfile[] = [];

    for (const key of userKeys) {
      try {
        const profileData = await this.redis.get(key);
        if (profileData) {
          const profile = JSON.parse(profileData) as UserProfile;
          
          // Filter by timeframe if needed
          if (this.isUserActiveInTimeframe(profile, timeframe)) {
            profiles.push(profile);
          }
        }
      } catch (error) {
        console.error(`Error parsing profile for key ${key}:`, error);
      }
    }

    return profiles;
  }

  private applyFilters(profiles: UserProfile[], filters?: LeaderboardFilters): UserProfile[] {
    if (!filters) return profiles;

    return profiles.filter(profile => {
      if (filters.minPoints && profile.totalPoints < filters.minPoints) {
        return false;
      }
      
      if (filters.minCompletions && profile.completedChallenges.length < filters.minCompletions) {
        return false;
      }
      
      if (filters.excludeUsers && filters.excludeUsers.includes(profile.redditUsername)) {
        return false;
      }
      
      return true;
    });
  }

  private async generateRankedEntries(
    profiles: UserProfile[], 
    criteria: RankingCriteria,
    maxEntries: number
  ): Promise<LeaderboardEntry[]> {
    // Sort profiles based on criteria
    const sortedProfiles = profiles.sort((a, b) => {
      // Primary sort
      let comparison = 0;
      
      switch (criteria.primarySort) {
        case 'points':
          comparison = b.totalPoints - a.totalPoints;
          break;
        case 'completions':
          comparison = b.completedChallenges.length - a.completedChallenges.length;
          break;
        case 'badges':
          comparison = b.badges.length - a.badges.length;
          break;
      }

      // Tie breaker
      if (comparison === 0) {
        switch (criteria.tieBreaker) {
          case 'completion_date':
            // Most recent completion wins
            const aLastCompletion = this.getLastCompletionDate(a);
            const bLastCompletion = this.getLastCompletionDate(b);
            comparison = bLastCompletion.getTime() - aLastCompletion.getTime();
            break;
          case 'join_date':
            const aJoinedAt = a.joinedAt instanceof Date ? a.joinedAt : new Date(a.joinedAt);
            const bJoinedAt = b.joinedAt instanceof Date ? b.joinedAt : new Date(b.joinedAt);
            comparison = aJoinedAt.getTime() - bJoinedAt.getTime();
            break;
          case 'username':
            comparison = a.redditUsername.localeCompare(b.redditUsername);
            break;
        }
      }

      return criteria.sortOrder === 'desc' ? comparison : -comparison;
    });

    // Generate entries with ranks
    const entries: LeaderboardEntry[] = [];

    for (let i = 0; i < Math.min(sortedProfiles.length, maxEntries); i++) {
      const profile = sortedProfiles[i];
      
      entries.push({
        rank: i + 1, // Simple ranking: 1, 2, 3, 4, 5...
        username: profile.redditUsername,
        points: profile.totalPoints,
        badgeCount: profile.badges.length,
        completedChallenges: profile.completedChallenges.length
      });
    }

    return entries;
  }

  private getScoreForCriteria(profile: UserProfile, criteria: string): number {
    switch (criteria) {
      case 'points':
        return profile.totalPoints;
      case 'completions':
        return profile.completedChallenges.length;
      case 'badges':
        return profile.badges.length;
      default:
        return profile.totalPoints;
    }
  }

  private getLastCompletionDate(profile: UserProfile): Date {
    // In a real implementation, we'd track completion dates
    // For now, use lastActiveAt as proxy
    const lastActive = profile.lastActiveAt;
    const joinedAt = profile.joinedAt;
    
    // Ensure we return a Date object
    if (lastActive instanceof Date) {
      return lastActive;
    } else if (typeof lastActive === 'string') {
      return new Date(lastActive);
    } else if (joinedAt instanceof Date) {
      return joinedAt;
    } else if (typeof joinedAt === 'string') {
      return new Date(joinedAt);
    }
    
    // Fallback to current date
    return new Date();
  }

  private isUserActiveInTimeframe(profile: UserProfile, timeframe: string): boolean {
    const now = new Date();
    const lastActive = profile.lastActiveAt || profile.joinedAt;
    
    // Ensure we have a Date object
    const lastActiveDate = lastActive instanceof Date ? lastActive : new Date(lastActive);
    
    switch (timeframe) {
      case 'weekly':
        return (now.getTime() - lastActiveDate.getTime()) <= (7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return (now.getTime() - lastActiveDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);
      case 'alltime':
        return true;
      default:
        return true;
    }
  }

  private async calculateUserRank(username: string, config: LeaderboardConfig): Promise<number> {
    // Get all users and calculate rank
    const allProfiles = await this.getAllUserProfiles(config.timeframe);
    const userProfile = allProfiles.find(p => p.redditUsername === username);
    
    if (!userProfile) return -1;

    const betterUsers = allProfiles.filter(profile => {
      if (profile.totalPoints > userProfile.totalPoints) return true;
      if (profile.totalPoints === userProfile.totalPoints) {
        // Tie breaker by completion date
        const profileLastCompletion = this.getLastCompletionDate(profile);
        const userLastCompletion = this.getLastCompletionDate(userProfile);
        return profileLastCompletion > userLastCompletion;
      }
      return false;
    });

    return betterUsers.length + 1;
  }

  private async incrementUserScore(
    username: string, 
    points: number, 
    config: LeaderboardConfig
  ): Promise<void> {
    const redisKey = this.getLeaderboardKey(config);
    const scoreKey = `${redisKey}:scores`;
    
    // Increment user's score in sorted set
    await this.redis.zadd(scoreKey, points, username);
  }

  private async storeLeaderboard(config: LeaderboardConfig, data: LeaderboardData): Promise<void> {
    const redisKey = this.getLeaderboardKey(config);
    const ttl = this.getTTLForTimeframe(config.timeframe);
    
    await this.redis.setex(redisKey, ttl, JSON.stringify(data));
  }

  private getLeaderboardKey(config: LeaderboardConfig): string {
    return `${REDIS_KEYS.LEADERBOARD(config.type)}:${config.timeframe}`;
  }

  private getTTLForTimeframe(timeframe: string): number {
    switch (timeframe) {
      case 'weekly':
        return 15 * 60; // 15 minutes
      case 'monthly':
        return 60 * 60; // 1 hour
      case 'alltime':
        return 60 * 60; // 1 hour
      default:
        return 30 * 60; // 30 minutes
    }
  }

  private isDataStale(lastUpdated: Date, updateInterval: number): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - new Date(lastUpdated).getTime();
    return timeDiff > (updateInterval * 60 * 1000); // Convert minutes to milliseconds
  }

  private async getUserProfile(username: string): Promise<UserProfile | null> {
    try {
      const profileData = await this.redis.get(REDIS_KEYS.USER_PROFILE(username));
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  private async countActiveUsers(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const userKeys = await this.redis.keys('user:*');
    let activeCount = 0;

    for (const key of userKeys) {
      try {
        const profileData = await this.redis.get(key);
        if (profileData) {
          const profile = JSON.parse(profileData) as UserProfile;
          if (profile.lastActiveAt) {
            const lastActiveDate = profile.lastActiveAt instanceof Date ? 
              profile.lastActiveAt : new Date(profile.lastActiveAt);
            if (lastActiveDate > cutoffDate) {
              activeCount++;
            }
          }
        }
      } catch (error) {
        // Skip invalid profiles
      }
    }

    return activeCount;
  }
}

// Default leaderboard configurations
export const DEFAULT_LEADERBOARD_CONFIGS: LeaderboardConfig[] = [
  {
    type: 'individual',
    timeframe: 'weekly',
    maxEntries: 50,
    updateInterval: 15 // 15 minutes
  },
  {
    type: 'individual',
    timeframe: 'monthly',
    maxEntries: 100,
    updateInterval: 60 // 1 hour
  },
  {
    type: 'individual',
    timeframe: 'alltime',
    maxEntries: 100,
    updateInterval: 60 // 1 hour
  },
  {
    type: 'city',
    timeframe: 'monthly',
    maxEntries: 50,
    updateInterval: 120 // 2 hours
  }
];

// Ranking criteria presets
export const RANKING_PRESETS: Record<string, RankingCriteria> = {
  points: {
    primarySort: 'points',
    tieBreaker: 'completion_date',
    sortOrder: 'desc'
  },
  completions: {
    primarySort: 'completions',
    tieBreaker: 'completion_date',
    sortOrder: 'desc'
  },
  badges: {
    primarySort: 'badges',
    tieBreaker: 'completion_date',
    sortOrder: 'desc'
  }
};