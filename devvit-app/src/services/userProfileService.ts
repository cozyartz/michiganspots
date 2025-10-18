/**
 * User Profile Service
 * Manages user profile data, statistics, and achievements in Devvit KV store
 */

import { Devvit } from '@devvit/public-api';
import { UserProfile, Badge, BadgeCriteria, Challenge, Submission } from '../types/core.js';
import { REDIS_KEYS, CONSTANTS } from '../types/index.js';

export class UserProfileService {
  private context: Devvit.Context;

  constructor(context: Devvit.Context) {
    this.context = context;
  }

  /**
   * Get user profile from KV store, create if doesn't exist
   */
  async getUserProfile(redditUsername: string): Promise<UserProfile> {
    const key = REDIS_KEYS.USER_PROFILE(redditUsername);
    
    try {
      const profileData = await this.context.redis.get(key);
      
      if (profileData) {
        return JSON.parse(profileData);
      }
      
      // Create new user profile
      const newProfile = this.createNewUserProfile(redditUsername);
      await this.saveUserProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Return default profile on error
      return this.createNewUserProfile(redditUsername);
    }
  }

  /**
   * Save user profile to KV store
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    const key = REDIS_KEYS.USER_PROFILE(profile.redditUsername);
    
    try {
      // Update last active timestamp
      profile.lastActiveAt = new Date();
      
      await this.context.redis.set(key, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw new Error('Failed to save user profile');
    }
  }

  /**
   * Update user points after challenge completion
   */
  async updateUserPoints(redditUsername: string, points: number, challengeId: string): Promise<UserProfile> {
    const profile = await this.getUserProfile(redditUsername);
    
    // Add points
    profile.totalPoints += points;
    
    // Add to completed challenges if not already there
    if (!profile.completedChallenges.includes(challengeId)) {
      profile.completedChallenges.push(challengeId);
    }
    
    // Update statistics
    profile.statistics.successfulSubmissions += 1;
    
    await this.saveUserProfile(profile);
    return profile;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    redditUsername: string, 
    preferences: Partial<UserProfile['preferences']>
  ): Promise<UserProfile> {
    const profile = await this.getUserProfile(redditUsername);
    
    profile.preferences = {
      ...profile.preferences,
      ...preferences
    };
    
    await this.saveUserProfile(profile);
    return profile;
  }

  /**
   * Calculate user statistics
   */
  async calculateUserStatistics(redditUsername: string, submissions: Submission[]): Promise<UserProfile['statistics']> {
    const userSubmissions = submissions.filter(s => s.userRedditUsername === redditUsername);
    const successfulSubmissions = userSubmissions.filter(s => s.verificationStatus === 'approved');
    
    // Calculate average completion time (simplified - would need more data in real implementation)
    const avgCompletionTime = userSubmissions.length > 0 
      ? userSubmissions.reduce((sum, sub) => {
          const submissionTime = new Date(sub.submittedAt).getTime();
          return sum + submissionTime;
        }, 0) / userSubmissions.length
      : 0;

    // Get favorite partners (most frequently visited)
    const partnerCounts: Record<string, number> = {};
    successfulSubmissions.forEach(sub => {
      // Would need to get challenge data to find partnerId
      // For now, using challengeId as proxy
      const partnerId = sub.challengeId.split('-')[0]; // Simplified
      partnerCounts[partnerId] = (partnerCounts[partnerId] || 0) + 1;
    });
    
    const favoritePartners = Object.entries(partnerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([partnerId]) => partnerId);

    return {
      totalSubmissions: userSubmissions.length,
      successfulSubmissions: successfulSubmissions.length,
      averageCompletionTime: avgCompletionTime,
      favoritePartners
    };
  }

  /**
   * Add badge to user profile
   */
  async awardBadge(redditUsername: string, badge: Badge): Promise<UserProfile> {
    const profile = await this.getUserProfile(redditUsername);
    
    // Check if user already has this badge
    const existingBadge = profile.badges.find(b => b.id === badge.id);
    if (existingBadge) {
      return profile; // Already has badge
    }
    
    profile.badges.push(badge);
    await this.saveUserProfile(profile);
    
    return profile;
  }

  /**
   * Get user completion rate
   */
  async getUserCompletionRate(redditUsername: string, totalChallenges: number): Promise<number> {
    const profile = await this.getUserProfile(redditUsername);
    
    if (totalChallenges === 0) return 0;
    
    return (profile.completedChallenges.length / totalChallenges) * 100;
  }

  /**
   * Check if user has completed a specific challenge
   */
  async hasUserCompletedChallenge(redditUsername: string, challengeId: string): Promise<boolean> {
    const profile = await this.getUserProfile(redditUsername);
    return profile.completedChallenges.includes(challengeId);
  }

  /**
   * Get user's current rank (simplified - would need leaderboard service)
   */
  async getUserRank(redditUsername: string): Promise<number> {
    // This would typically query the leaderboard service
    // For now, return a placeholder
    return 0;
  }

  /**
   * Create a new user profile with default values
   */
  private createNewUserProfile(redditUsername: string): UserProfile {
    return {
      redditUsername,
      totalPoints: 0,
      completedChallenges: [],
      badges: [],
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      preferences: {
        notifications: true,
        leaderboardVisible: true,
        locationSharing: true
      },
      statistics: {
        totalSubmissions: 0,
        successfulSubmissions: 0,
        averageCompletionTime: 0,
        favoritePartners: []
      }
    };
  }

  /**
   * Bulk update user statistics from submission history
   */
  async updateUserStatistics(redditUsername: string, submissions: Submission[]): Promise<UserProfile> {
    const profile = await this.getUserProfile(redditUsername);
    
    profile.statistics = await this.calculateUserStatistics(redditUsername, submissions);
    
    await this.saveUserProfile(profile);
    return profile;
  }

  /**
   * Get multiple user profiles efficiently
   */
  async getUserProfiles(redditUsernames: string[]): Promise<UserProfile[]> {
    const profiles: UserProfile[] = [];
    
    for (const username of redditUsernames) {
      try {
        const profile = await this.getUserProfile(username);
        profiles.push(profile);
      } catch (error) {
        console.error(`Error getting profile for ${username}:`, error);
        // Continue with other profiles
      }
    }
    
    return profiles;
  }

  /**
   * Delete user profile (for privacy compliance)
   */
  async deleteUserProfile(redditUsername: string): Promise<void> {
    const key = REDIS_KEYS.USER_PROFILE(redditUsername);
    
    try {
      await this.context.redis.del(key);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw new Error('Failed to delete user profile');
    }
  }
}