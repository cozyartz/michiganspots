/**
 * Badge Service
 * Manages badge definitions, criteria, and awarding logic
 */

import { Devvit } from '@devvit/public-api';
import { Badge, BadgeCriteria, UserProfile, Challenge } from '../types/core.js';
import { CONSTANTS } from '../types/index.js';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  criteria: BadgeCriteria;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export class BadgeService {
  private context: Devvit.Context;
  private badgeDefinitions: BadgeDefinition[];

  constructor(context: Devvit.Context) {
    this.context = context;
    this.badgeDefinitions = this.initializeBadgeDefinitions();
  }

  /**
   * Initialize all badge definitions
   */
  private initializeBadgeDefinitions(): BadgeDefinition[] {
    return [
      // Completion Count Badges
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first challenge',
        iconUrl: '/badges/first_steps.png',
        criteria: {
          type: 'completion_count',
          threshold: 1,
          timeframe: 'alltime'
        },
        rarity: 'common'
      },
      {
        id: 'explorer',
        name: 'Explorer',
        description: 'Complete 5 challenges',
        iconUrl: '/badges/explorer.png',
        criteria: {
          type: 'completion_count',
          threshold: 5,
          timeframe: 'alltime'
        },
        rarity: 'common'
      },
      {
        id: 'adventurer',
        name: 'Adventurer',
        description: 'Complete 15 challenges',
        iconUrl: '/badges/adventurer.png',
        criteria: {
          type: 'completion_count',
          threshold: 15,
          timeframe: 'alltime'
        },
        rarity: 'rare'
      },
      {
        id: 'treasure_hunter',
        name: 'Treasure Hunter',
        description: 'Complete 50 challenges',
        iconUrl: '/badges/treasure_hunter.png',
        criteria: {
          type: 'completion_count',
          threshold: 50,
          timeframe: 'alltime'
        },
        rarity: 'epic'
      },
      {
        id: 'legend',
        name: 'Legend',
        description: 'Complete 100 challenges',
        iconUrl: '/badges/legend.png',
        criteria: {
          type: 'completion_count',
          threshold: 100,
          timeframe: 'alltime'
        },
        rarity: 'legendary'
      },

      // Points Total Badges
      {
        id: 'point_collector',
        name: 'Point Collector',
        description: 'Earn 100 total points',
        iconUrl: '/badges/point_collector.png',
        criteria: {
          type: 'points_total',
          threshold: 100,
          timeframe: 'alltime'
        },
        rarity: 'common'
      },
      {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Earn 500 total points',
        iconUrl: '/badges/high_scorer.png',
        criteria: {
          type: 'points_total',
          threshold: 500,
          timeframe: 'alltime'
        },
        rarity: 'rare'
      },
      {
        id: 'point_master',
        name: 'Point Master',
        description: 'Earn 1000 total points',
        iconUrl: '/badges/point_master.png',
        criteria: {
          type: 'points_total',
          threshold: 1000,
          timeframe: 'alltime'
        },
        rarity: 'epic'
      },

      // Streak Badges
      {
        id: 'consistent',
        name: 'Consistent',
        description: 'Complete challenges 3 days in a row',
        iconUrl: '/badges/consistent.png',
        criteria: {
          type: 'streak',
          threshold: 3,
          timeframe: 'daily'
        },
        rarity: 'common'
      },
      {
        id: 'dedicated',
        name: 'Dedicated',
        description: 'Complete challenges 7 days in a row',
        iconUrl: '/badges/dedicated.png',
        criteria: {
          type: 'streak',
          threshold: 7,
          timeframe: 'daily'
        },
        rarity: 'rare'
      },
      {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Complete challenges 30 days in a row',
        iconUrl: '/badges/unstoppable.png',
        criteria: {
          type: 'streak',
          threshold: 30,
          timeframe: 'daily'
        },
        rarity: 'legendary'
      },

      // Difficulty Master Badges
      {
        id: 'easy_master',
        name: 'Easy Master',
        description: 'Complete 10 easy challenges',
        iconUrl: '/badges/easy_master.png',
        criteria: {
          type: 'difficulty_master',
          threshold: 10,
          timeframe: 'alltime',
          additionalRequirements: { difficulty: 'easy' }
        },
        rarity: 'common'
      },
      {
        id: 'medium_master',
        name: 'Medium Master',
        description: 'Complete 10 medium challenges',
        iconUrl: '/badges/medium_master.png',
        criteria: {
          type: 'difficulty_master',
          threshold: 10,
          timeframe: 'alltime',
          additionalRequirements: { difficulty: 'medium' }
        },
        rarity: 'rare'
      },
      {
        id: 'hard_master',
        name: 'Hard Master',
        description: 'Complete 10 hard challenges',
        iconUrl: '/badges/hard_master.png',
        criteria: {
          type: 'difficulty_master',
          threshold: 10,
          timeframe: 'alltime',
          additionalRequirements: { difficulty: 'hard' }
        },
        rarity: 'epic'
      },

      // Partner Visit Badges
      {
        id: 'local_supporter',
        name: 'Local Supporter',
        description: 'Visit 5 different partner businesses',
        iconUrl: '/badges/local_supporter.png',
        criteria: {
          type: 'partner_visits',
          threshold: 5,
          timeframe: 'alltime'
        },
        rarity: 'common'
      },
      {
        id: 'community_champion',
        name: 'Community Champion',
        description: 'Visit 15 different partner businesses',
        iconUrl: '/badges/community_champion.png',
        criteria: {
          type: 'partner_visits',
          threshold: 15,
          timeframe: 'alltime'
        },
        rarity: 'rare'
      }
    ];
  }

  /**
   * Calculate points for a challenge based on difficulty
   */
  calculateChallengePoints(difficulty: 'easy' | 'medium' | 'hard'): number {
    switch (difficulty) {
      case 'easy':
        return CONSTANTS.POINTS.EASY;
      case 'medium':
        return CONSTANTS.POINTS.MEDIUM;
      case 'hard':
        return CONSTANTS.POINTS.HARD;
      default:
        return CONSTANTS.POINTS.EASY;
    }
  }

  /**
   * Check which badges a user should be awarded based on their profile
   */
  async checkEligibleBadges(userProfile: UserProfile, challenges: Challenge[]): Promise<Badge[]> {
    const eligibleBadges: Badge[] = [];
    const currentBadgeIds = new Set(userProfile.badges.map(b => b.id));

    for (const badgeDefinition of this.badgeDefinitions) {
      // Skip if user already has this badge
      if (currentBadgeIds.has(badgeDefinition.id)) {
        continue;
      }

      const isEligible = await this.checkBadgeEligibility(userProfile, badgeDefinition, challenges);
      
      if (isEligible) {
        const badge: Badge = {
          id: badgeDefinition.id,
          name: badgeDefinition.name,
          description: badgeDefinition.description,
          iconUrl: badgeDefinition.iconUrl,
          earnedAt: new Date(),
          criteria: badgeDefinition.criteria
        };
        
        eligibleBadges.push(badge);
      }
    }

    return eligibleBadges;
  }

  /**
   * Check if user meets criteria for a specific badge
   */
  private async checkBadgeEligibility(
    userProfile: UserProfile, 
    badgeDefinition: BadgeDefinition,
    challenges: Challenge[]
  ): Promise<boolean> {
    const { criteria } = badgeDefinition;

    switch (criteria.type) {
      case 'completion_count':
        return userProfile.completedChallenges.length >= criteria.threshold;

      case 'points_total':
        return userProfile.totalPoints >= criteria.threshold;

      case 'streak':
        // This would require more complex logic to track daily streaks
        // For now, simplified implementation
        return this.checkStreakCriteria(userProfile, criteria);

      case 'partner_visits':
        return userProfile.statistics.favoritePartners.length >= criteria.threshold;

      case 'difficulty_master':
        return this.checkDifficultyMasterCriteria(userProfile, badgeDefinition, challenges);

      default:
        return false;
    }
  }

  /**
   * Check streak criteria (simplified implementation)
   */
  private checkStreakCriteria(userProfile: UserProfile, criteria: BadgeCriteria): boolean {
    // This is a simplified implementation
    // In a real app, you'd track daily completion dates
    const completionsNeeded = criteria.threshold;
    const hasEnoughCompletions = userProfile.completedChallenges.length >= completionsNeeded;
    
    // For now, assume if they have enough completions, they might have a streak
    return hasEnoughCompletions;
  }

  /**
   * Check difficulty master criteria
   */
  private checkDifficultyMasterCriteria(
    userProfile: UserProfile, 
    badgeDefinition: BadgeDefinition,
    challenges: Challenge[]
  ): boolean {
    const targetDifficulty = badgeDefinition.criteria.additionalRequirements?.difficulty;
    if (!targetDifficulty) return false;

    // Count completed challenges of specific difficulty
    const completedChallengesOfDifficulty = userProfile.completedChallenges.filter(challengeId => {
      const challenge = challenges.find(c => c.id === challengeId);
      return challenge?.difficulty === targetDifficulty;
    });

    return completedChallengesOfDifficulty.length >= badgeDefinition.criteria.threshold;
  }

  /**
   * Get all badge definitions
   */
  getBadgeDefinitions(): BadgeDefinition[] {
    return this.badgeDefinitions;
  }

  /**
   * Get badge definition by ID
   */
  getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
    return this.badgeDefinitions.find(b => b.id === badgeId);
  }

  /**
   * Award badges to user and return newly awarded badges
   */
  async awardEligibleBadges(
    userProfile: UserProfile, 
    challenges: Challenge[]
  ): Promise<Badge[]> {
    const eligibleBadges = await this.checkEligibleBadges(userProfile, challenges);
    
    // In a real implementation, you'd save these to the user profile
    // This method returns the badges that should be awarded
    return eligibleBadges;
  }

  /**
   * Get badge rarity color for UI display
   */
  getBadgeRarityColor(rarity: BadgeDefinition['rarity']): string {
    switch (rarity) {
      case 'common':
        return '#9CA3AF'; // Gray
      case 'rare':
        return '#3B82F6'; // Blue
      case 'epic':
        return '#8B5CF6'; // Purple
      case 'legendary':
        return '#F59E0B'; // Gold
      default:
        return '#9CA3AF';
    }
  }

  /**
   * Format badge for display
   */
  formatBadgeForDisplay(badge: Badge): {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    earnedAt: string;
    rarity: BadgeDefinition['rarity'];
    rarityColor: string;
  } {
    const definition = this.getBadgeDefinition(badge.id);
    const rarity = definition?.rarity || 'common';
    
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl,
      earnedAt: badge.earnedAt.toLocaleDateString(),
      rarity,
      rarityColor: this.getBadgeRarityColor(rarity)
    };
  }
}