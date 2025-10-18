/**
 * Challenge Browser Component for displaying and filtering challenges
 */

import { Devvit } from '@devvit/public-api';
import { Challenge, ChallengeFilters, GPSCoordinate } from '../types/core.js';
import { 
  filterChallenges, 
  sortChallenges, 
  getActiveChallenges,
  getChallengeStatusText,
  getDifficultyColor,
  calculateDistance
} from '../utils/challengeUtils.js';

/**
 * Challenge Browser utility functions for filtering and displaying challenges
 */
export class ChallengeBrowserUtils {
  /**
   * Get filtered and sorted challenges for display
   */
  static getDisplayChallenges(
    challenges: Challenge[],
    userCompletedChallenges: string[] = [],
    filters: ChallengeFilters = {},
    userLocation?: GPSCoordinate
  ): Challenge[] {
    const completedSet = new Set(userCompletedChallenges);
    
    // Filter challenges
    const filteredChallenges = filterChallenges(
      challenges, 
      filters, 
      userLocation, 
      completedSet
    );
    
    // Sort challenges
    return sortChallenges(
      filteredChallenges,
      filters.sortBy || 'endDate',
      filters.sortOrder || 'asc',
      userLocation
    );
  }

  /**
   * Get challenge display information for UI
   */
  static getChallengeDisplayInfo(
    challenge: Challenge,
    userCompletedChallenges: string[] = [],
    userLocation?: GPSCoordinate
  ) {
    const completedSet = new Set(userCompletedChallenges);
    const statusText = getChallengeStatusText(challenge, completedSet);
    const difficultyColor = getDifficultyColor(challenge.difficulty);
    const isCompleted = completedSet.has(challenge.id);
    const distance = userLocation ? calculateDistance(userLocation, challenge.location.coordinates) : null;

    return {
      statusText,
      difficultyColor,
      isCompleted,
      distance,
      distanceText: distance ? `${(distance / 1000).toFixed(1)} km away` : null
    };
  }

  /**
   * Get active challenges only
   */
  static getActiveChallengesOnly(
    challenges: Challenge[],
    userCompletedChallenges: string[] = []
  ): Challenge[] {
    const completedSet = new Set(userCompletedChallenges);
    return getActiveChallenges(challenges, completedSet);
  }

  /**
   * Format challenge for simple display
   */
  static formatChallengeForDisplay(challenge: Challenge): string {
    return `${challenge.title} - ${challenge.partnerName} (${challenge.points} pts, ${challenge.difficulty})`;
  }

  /**
   * Get challenge summary statistics
   */
  static getChallengeStats(
    challenges: Challenge[],
    userCompletedChallenges: string[] = []
  ) {
    const completedSet = new Set(userCompletedChallenges);
    const activeChallenges = getActiveChallenges(challenges, completedSet);
    
    return {
      total: challenges.length,
      active: activeChallenges.length,
      completed: userCompletedChallenges.length,
      expired: challenges.length - activeChallenges.length - userCompletedChallenges.length
    };
  }
}