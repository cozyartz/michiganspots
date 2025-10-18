/**
 * Points Service
 * Manages point calculation, bonuses, and point-related operations
 */

import { Devvit } from '@devvit/public-api';
import { Challenge, UserProfile } from '../types/core.js';
import { CONSTANTS } from '../types/index.js';

export interface PointsCalculation {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  bonusReasons: string[];
}

export interface PointsTransaction {
  id: string;
  userRedditUsername: string;
  challengeId: string;
  points: number;
  transactionType: 'earned' | 'bonus' | 'penalty';
  reason: string;
  timestamp: Date;
}

export class PointsService {
  private context: Devvit.Context;

  constructor(context: Devvit.Context) {
    this.context = context;
  }

  /**
   * Calculate points for completing a challenge
   */
  calculateChallengePoints(
    challenge: Challenge, 
    userProfile: UserProfile,
    completionTime?: number
  ): PointsCalculation {
    // Base points based on difficulty
    const basePoints = this.getBasePointsForDifficulty(challenge.difficulty);
    
    let bonusPoints = 0;
    const bonusReasons: string[] = [];

    // First completion bonus
    if (userProfile.completedChallenges.length === 0) {
      bonusPoints += 5;
      bonusReasons.push('First challenge bonus (+5)');
    }

    // Streak bonus (simplified - would need streak tracking)
    const recentCompletions = this.getRecentCompletions(userProfile);
    if (recentCompletions >= 3) {
      bonusPoints += 10;
      bonusReasons.push('Streak bonus (+10)');
    }

    // Difficulty progression bonus
    if (this.hasCompletedEasierDifficulties(challenge.difficulty, userProfile)) {
      bonusPoints += 5;
      bonusReasons.push('Difficulty progression (+5)');
    }

    // Speed completion bonus (if completed quickly)
    if (completionTime && completionTime < 3600000) { // Less than 1 hour
      bonusPoints += 3;
      bonusReasons.push('Quick completion (+3)');
    }

    // Partner loyalty bonus
    if (this.isFrequentPartnerVisitor(challenge.partnerId, userProfile)) {
      bonusPoints += 2;
      bonusReasons.push('Partner loyalty (+2)');
    }

    return {
      basePoints,
      bonusPoints,
      totalPoints: basePoints + bonusPoints,
      bonusReasons
    };
  }

  /**
   * Get base points for challenge difficulty
   */
  private getBasePointsForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): number {
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
   * Check if user has completed easier difficulties (for progression bonus)
   */
  private hasCompletedEasierDifficulties(
    currentDifficulty: 'easy' | 'medium' | 'hard',
    userProfile: UserProfile
  ): boolean {
    // This is simplified - would need to check actual challenge difficulties
    if (currentDifficulty === 'medium') {
      return userProfile.completedChallenges.length >= 3; // Assume some easy challenges completed
    }
    if (currentDifficulty === 'hard') {
      return userProfile.completedChallenges.length >= 8; // Assume easy and medium completed
    }
    return false;
  }

  /**
   * Get recent completions count (simplified)
   */
  private getRecentCompletions(userProfile: UserProfile): number {
    // This is simplified - would need to track completion dates
    // For now, assume recent if they have multiple completions
    return Math.min(userProfile.completedChallenges.length, 5);
  }

  /**
   * Check if user frequently visits this partner
   */
  private isFrequentPartnerVisitor(partnerId: string, userProfile: UserProfile): boolean {
    return userProfile.statistics.favoritePartners.includes(partnerId);
  }

  /**
   * Calculate total points needed for next milestone
   */
  getPointsToNextMilestone(currentPoints: number): {
    nextMilestone: number;
    pointsNeeded: number;
    milestoneType: string;
  } {
    const milestones = [
      { points: 100, type: 'Point Collector' },
      { points: 250, type: 'Rising Star' },
      { points: 500, type: 'High Scorer' },
      { points: 1000, type: 'Point Master' },
      { points: 2500, type: 'Elite Player' },
      { points: 5000, type: 'Legend' }
    ];

    for (const milestone of milestones) {
      if (currentPoints < milestone.points) {
        return {
          nextMilestone: milestone.points,
          pointsNeeded: milestone.points - currentPoints,
          milestoneType: milestone.type
        };
      }
    }

    // If beyond all milestones
    return {
      nextMilestone: currentPoints + 1000,
      pointsNeeded: 1000,
      milestoneType: 'Master Level'
    };
  }

  /**
   * Get user's point rank among all users (simplified)
   */
  async getUserPointRank(userPoints: number): Promise<{
    rank: number;
    percentile: number;
    totalUsers: number;
  }> {
    // This would typically query all user profiles
    // For now, return estimated values
    const estimatedTotalUsers = 1000;
    const estimatedRank = Math.max(1, Math.floor(estimatedTotalUsers * (1 - userPoints / 10000)));
    const percentile = ((estimatedTotalUsers - estimatedRank) / estimatedTotalUsers) * 100;

    return {
      rank: estimatedRank,
      percentile: Math.round(percentile),
      totalUsers: estimatedTotalUsers
    };
  }

  /**
   * Record a points transaction
   */
  async recordPointsTransaction(transaction: Omit<PointsTransaction, 'id' | 'timestamp'>): Promise<PointsTransaction> {
    const fullTransaction: PointsTransaction = {
      ...transaction,
      id: `pts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    // In a real implementation, you'd store this in the database
    // For now, just return the transaction
    return fullTransaction;
  }

  /**
   * Get points breakdown for display
   */
  formatPointsBreakdown(calculation: PointsCalculation): string {
    let breakdown = `Base Points: ${calculation.basePoints}`;
    
    if (calculation.bonusPoints > 0) {
      breakdown += `\nBonus Points: ${calculation.bonusPoints}`;
      calculation.bonusReasons.forEach(reason => {
        breakdown += `\n  • ${reason}`;
      });
    }
    
    breakdown += `\nTotal: ${calculation.totalPoints} points`;
    
    return breakdown;
  }

  /**
   * Calculate points multiplier based on user level
   */
  getPointsMultiplier(userProfile: UserProfile): number {
    const totalPoints = userProfile.totalPoints;
    
    if (totalPoints >= 5000) return 1.5; // Legend multiplier
    if (totalPoints >= 2500) return 1.3; // Elite multiplier
    if (totalPoints >= 1000) return 1.2; // Master multiplier
    if (totalPoints >= 500) return 1.1;  // High scorer multiplier
    
    return 1.0; // Base multiplier
  }

  /**
   * Apply points multiplier to calculation
   */
  applyPointsMultiplier(calculation: PointsCalculation, multiplier: number): PointsCalculation {
    if (multiplier === 1.0) return calculation;

    const multipliedTotal = Math.floor(calculation.totalPoints * multiplier);
    const additionalPoints = multipliedTotal - calculation.totalPoints;

    return {
      ...calculation,
      bonusPoints: calculation.bonusPoints + additionalPoints,
      totalPoints: multipliedTotal,
      bonusReasons: [
        ...calculation.bonusReasons,
        `Level multiplier x${multiplier} (+${additionalPoints})`
      ]
    };
  }

  /**
   * Get daily points limit (to prevent abuse)
   */
  getDailyPointsLimit(userProfile: UserProfile): number {
    const baseLimit = 200; // Base daily limit
    const levelBonus = Math.floor(userProfile.totalPoints / 1000) * 50; // +50 per 1000 points
    
    return baseLimit + levelBonus;
  }

  /**
   * Check if user has reached daily points limit
   */
  async hasReachedDailyLimit(userRedditUsername: string, todayPoints: number): Promise<boolean> {
    // This would need to track daily points in the database
    // For now, return false (no limit reached)
    return false;
  }
}