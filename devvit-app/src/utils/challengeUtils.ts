/**
 * Challenge utility functions for status calculation and filtering
 */

import { Challenge, ChallengeFilters, GPSCoordinate } from '../types/core.js';

/**
 * Calculate the current status of a challenge based on dates and completion
 */
export function calculateChallengeStatus(
  challenge: Challenge,
  userCompletedChallenges: Set<string> = new Set()
): 'active' | 'expired' | 'completed' {
  const now = new Date();
  
  // Check if user has already completed this challenge
  if (userCompletedChallenges.has(challenge.id)) {
    return 'completed';
  }
  
  // Check if challenge is expired
  if (challenge.endDate < now) {
    return 'expired';
  }
  
  // Check if challenge hasn't started yet
  if (challenge.startDate > now) {
    return 'expired'; // Treat future challenges as expired for now
  }
  
  // Check if challenge has reached max completions
  if (challenge.maxCompletions !== undefined && challenge.maxCompletions <= 0) {
    return 'expired';
  }
  
  return 'active';
}

/**
 * Check if a challenge is currently active (within date range and not completed by user)
 */
export function isChallengeActive(
  challenge: Challenge,
  userCompletedChallenges: Set<string> = new Set()
): boolean {
  return calculateChallengeStatus(challenge, userCompletedChallenges) === 'active';
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
export function calculateDistance(coord1: GPSCoordinate, coord2: GPSCoordinate): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Filter challenges based on provided filters
 */
export function filterChallenges(
  challenges: Challenge[],
  filters: ChallengeFilters,
  userLocation?: GPSCoordinate,
  userCompletedChallenges: Set<string> = new Set()
): Challenge[] {
  let filteredChallenges = [...challenges];

  // Filter by difficulty
  if (filters.difficulty) {
    filteredChallenges = filteredChallenges.filter(
      challenge => challenge.difficulty === filters.difficulty
    );
  }

  // Filter by status
  if (filters.status) {
    filteredChallenges = filteredChallenges.filter(
      challenge => calculateChallengeStatus(challenge, userCompletedChallenges) === filters.status
    );
  }

  // Filter by partner
  if (filters.partnerId) {
    filteredChallenges = filteredChallenges.filter(
      challenge => challenge.partnerId === filters.partnerId
    );
  }

  // Filter by distance (requires user location)
  if (filters.maxDistance && userLocation) {
    filteredChallenges = filteredChallenges.filter(challenge => {
      const distance = calculateDistance(userLocation, challenge.location.coordinates);
      return distance <= filters.maxDistance!;
    });
  }

  return filteredChallenges;
}

/**
 * Sort challenges based on provided sort criteria
 */
export function sortChallenges(
  challenges: Challenge[],
  sortBy: ChallengeFilters['sortBy'] = 'endDate',
  sortOrder: ChallengeFilters['sortOrder'] = 'asc',
  userLocation?: GPSCoordinate
): Challenge[] {
  const sortedChallenges = [...challenges];

  sortedChallenges.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'points':
        comparison = a.points - b.points;
        break;
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        break;
      case 'distance':
        if (userLocation) {
          const distanceA = calculateDistance(userLocation, a.location.coordinates);
          const distanceB = calculateDistance(userLocation, b.location.coordinates);
          comparison = distanceA - distanceB;
        }
        break;
      case 'endDate':
      default:
        comparison = a.endDate.getTime() - b.endDate.getTime();
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sortedChallenges;
}

/**
 * Get challenges that are currently active for display in the browser
 */
export function getActiveChallenges(
  challenges: Challenge[],
  userCompletedChallenges: Set<string> = new Set()
): Challenge[] {
  return challenges.filter(challenge => isChallengeActive(challenge, userCompletedChallenges));
}

/**
 * Get challenge display status text for UI
 */
export function getChallengeStatusText(
  challenge: Challenge,
  userCompletedChallenges: Set<string> = new Set()
): string {
  const status = calculateChallengeStatus(challenge, userCompletedChallenges);
  
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'expired':
      return challenge.endDate < new Date() ? 'Expired' : 'Not Available';
    case 'active':
      const daysLeft = Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 1) {
        return 'Expires Today';
      } else if (daysLeft <= 7) {
        return `${daysLeft} days left`;
      }
      return 'Active';
    default:
      return 'Unknown';
  }
}

/**
 * Get challenge difficulty color for UI styling
 */
export function getDifficultyColor(difficulty: Challenge['difficulty']): string {
  switch (difficulty) {
    case 'easy':
      return '#22c55e'; // green
    case 'medium':
      return '#f59e0b'; // amber
    case 'hard':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Validate challenge filters
 */
export function validateChallengeFilters(filters: ChallengeFilters): boolean {
  // Check if maxDistance is positive
  if (filters.maxDistance !== undefined && filters.maxDistance <= 0) {
    return false;
  }

  // Check if sortBy is valid
  const validSortBy = ['points', 'difficulty', 'distance', 'endDate'];
  if (filters.sortBy && !validSortBy.includes(filters.sortBy)) {
    return false;
  }

  // Check if sortOrder is valid
  const validSortOrder = ['asc', 'desc'];
  if (filters.sortOrder && !validSortOrder.includes(filters.sortOrder)) {
    return false;
  }

  return true;
}