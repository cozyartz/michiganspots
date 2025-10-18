/**
 * Challenge Service for managing challenge data
 */

import { Challenge, ChallengeFilters, GPSCoordinate } from '../types/core.js';
import { getActiveChallenges, filterChallenges, sortChallenges } from '../utils/challengeUtils.js';

export class ChallengeService {
  /**
   * Get mock challenges for testing (in real implementation, this would fetch from API/database)
   */
  static getMockChallenges(): Challenge[] {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return [
      {
        id: 'challenge-1',
        title: 'Visit Founders Brewing Co.',
        description: 'Take a photo with the iconic Founders logo and try their famous All Day IPA',
        partnerId: 'founders-brewing',
        partnerName: 'Founders Brewing Co.',
        partnerBranding: {
          logoUrl: 'https://example.com/founders-logo.png',
          primaryColor: '#d4af37',
          secondaryColor: '#000000'
        },
        difficulty: 'easy',
        points: 10,
        startDate: yesterday,
        endDate: nextWeek,
        location: {
          coordinates: { latitude: 42.9634, longitude: -85.6681 },
          address: '235 Grandville Ave SW, Grand Rapids, MI 49503',
          businessName: 'Founders Brewing Co.',
          verificationRadius: 100
        },
        proofRequirements: {
          types: ['photo'],
          instructions: 'Take a photo with the Founders logo visible in the background'
        },
        status: 'active',
        createdAt: yesterday,
        updatedAt: yesterday
      },
      {
        id: 'challenge-2',
        title: 'Detroit Institute of Arts Scavenger Hunt',
        description: 'Find the famous Diego Rivera murals and answer a question about Detroit industry',
        partnerId: 'dia-detroit',
        partnerName: 'Detroit Institute of Arts',
        partnerBranding: {
          logoUrl: 'https://example.com/dia-logo.png',
          primaryColor: '#1f2937',
          secondaryColor: '#f59e0b'
        },
        difficulty: 'medium',
        points: 25,
        startDate: yesterday,
        endDate: nextWeek,
        location: {
          coordinates: { latitude: 42.3598, longitude: -83.0645 },
          address: '5200 Woodward Ave, Detroit, MI 48202',
          businessName: 'Detroit Institute of Arts',
          verificationRadius: 150
        },
        proofRequirements: {
          types: ['photo', 'location_question'],
          instructions: 'Take a photo of the Rivera Court and answer: What industry is primarily depicted in the murals?'
        },
        status: 'active',
        createdAt: yesterday,
        updatedAt: yesterday
      },
      {
        id: 'challenge-3',
        title: 'Mackinac Island Fudge Challenge',
        description: 'Visit any fudge shop on Mackinac Island and purchase their signature fudge',
        partnerId: 'mackinac-fudge',
        partnerName: 'Mackinac Island Fudge Shops',
        partnerBranding: {
          logoUrl: 'https://example.com/mackinac-logo.png',
          primaryColor: '#8b4513',
          secondaryColor: '#f4e4bc'
        },
        difficulty: 'hard',
        points: 50,
        startDate: yesterday,
        endDate: nextWeek,
        location: {
          coordinates: { latitude: 45.8492, longitude: -84.6189 },
          address: 'Main Street, Mackinac Island, MI 49757',
          businessName: 'Mackinac Island',
          verificationRadius: 500
        },
        proofRequirements: {
          types: ['photo', 'receipt'],
          instructions: 'Take a photo of yourself with the fudge and upload your receipt'
        },
        status: 'active',
        createdAt: yesterday,
        updatedAt: yesterday
      },
      {
        id: 'challenge-4',
        title: 'Sleeping Bear Dunes Climb',
        description: 'Climb the Sleeping Bear Dunes and take a photo from the top overlooking Lake Michigan',
        partnerId: 'sleeping-bear',
        partnerName: 'Sleeping Bear Dunes National Lakeshore',
        partnerBranding: {
          logoUrl: 'https://example.com/nps-logo.png',
          primaryColor: '#2d5016',
          secondaryColor: '#8fbc8f'
        },
        difficulty: 'hard',
        points: 50,
        startDate: yesterday,
        endDate: tomorrow, // Expires soon
        location: {
          coordinates: { latitude: 44.8777, longitude: -86.0583 },
          address: '9922 Front St, Empire, MI 49630',
          businessName: 'Sleeping Bear Dunes',
          verificationRadius: 200
        },
        proofRequirements: {
          types: ['photo', 'gps_checkin'],
          instructions: 'Take a photo from the top of the dunes with Lake Michigan visible'
        },
        status: 'active',
        createdAt: yesterday,
        updatedAt: yesterday
      },
      {
        id: 'challenge-5',
        title: 'Ann Arbor Farmers Market',
        description: 'Visit the Ann Arbor Farmers Market and purchase something from a local vendor',
        partnerId: 'ann-arbor-market',
        partnerName: 'Ann Arbor Farmers Market',
        partnerBranding: {
          logoUrl: 'https://example.com/market-logo.png',
          primaryColor: '#22c55e',
          secondaryColor: '#ffffff'
        },
        difficulty: 'easy',
        points: 10,
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Started a week ago
        endDate: new Date(now.getTime() - 1 * 60 * 60 * 1000), // Expired 1 hour ago
        location: {
          coordinates: { latitude: 42.2808, longitude: -83.7430 },
          address: '315 Detroit St, Ann Arbor, MI 48104',
          businessName: 'Ann Arbor Farmers Market',
          verificationRadius: 100
        },
        proofRequirements: {
          types: ['photo', 'receipt'],
          instructions: 'Take a photo at the market and show your purchase receipt'
        },
        status: 'expired',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: yesterday
      }
    ];
  }

  /**
   * Get challenges with filtering and sorting applied
   */
  static async getChallenges(
    filters: ChallengeFilters = {},
    userLocation?: GPSCoordinate,
    userCompletedChallenges: Set<string> = new Set()
  ): Promise<Challenge[]> {
    // In a real implementation, this would make API calls or database queries
    const allChallenges = this.getMockChallenges();
    
    // Apply filters
    const filteredChallenges = filterChallenges(
      allChallenges,
      filters,
      userLocation,
      userCompletedChallenges
    );

    // Apply sorting
    const sortedChallenges = sortChallenges(
      filteredChallenges,
      filters.sortBy || 'endDate',
      filters.sortOrder || 'asc',
      userLocation
    );

    return sortedChallenges;
  }

  /**
   * Get only active challenges
   */
  static async getActiveChallenges(
    userCompletedChallenges: Set<string> = new Set()
  ): Promise<Challenge[]> {
    const allChallenges = this.getMockChallenges();
    return getActiveChallenges(allChallenges, userCompletedChallenges);
  }

  /**
   * Get a specific challenge by ID
   */
  static async getChallengeById(challengeId: string): Promise<Challenge | null> {
    const allChallenges = this.getMockChallenges();
    return allChallenges.find(challenge => challenge.id === challengeId) || null;
  }

  /**
   * Get user's completed challenges (mock implementation)
   */
  static async getUserCompletedChallenges(username: string): Promise<Set<string>> {
    // In a real implementation, this would fetch from Redis/database
    // For now, return a mock set with one completed challenge
    return new Set(['challenge-5']); // User has completed the expired farmers market challenge
  }
}