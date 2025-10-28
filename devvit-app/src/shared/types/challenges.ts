/**
 * Challenge Types for Michigan Spots Treasure Hunt
 */

export interface MichiganChallenge {
  id: string;
  name: string;
  description: string;
  category: ChallengeCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  bonusPoints: number;
  landmarks: string[];
  icon: string;
  requiredCount: number; // Number of landmarks needed to complete
}

export type ChallengeCategory =
  | 'natural-wonders'
  | 'urban-landmarks'
  | 'historical-sites'
  | 'great-lakes'
  | 'seasonal'
  | 'hidden-gems';

export interface UserChallengeProgress {
  challengeId: string;
  completedLandmarks: string[];
  completedAt?: number;
  totalScore: number;
}

export interface ChallengeSubmission {
  challengeId: string;
  landmarkName: string;
  photoScore: number;
  gps: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
}

/**
 * Predefined Michigan Challenges
 */
export const MICHIGAN_CHALLENGES: MichiganChallenge[] = [
  {
    id: 'great-lakes-explorer',
    name: 'Great Lakes Explorer',
    description: 'Capture photos at all five Great Lakes bordering Michigan',
    category: 'great-lakes',
    difficulty: 'hard',
    bonusPoints: 500,
    requiredCount: 5,
    icon: '🌊',
    landmarks: [
      'Lake Superior',
      'Lake Michigan',
      'Lake Huron',
      'Lake Erie',
      'Lake St. Clair',
    ],
  },
  {
    id: 'upper-peninsula-adventure',
    name: 'Upper Peninsula Adventure',
    description: 'Explore the natural wonders of Michigan\'s Upper Peninsula',
    category: 'natural-wonders',
    difficulty: 'hard',
    bonusPoints: 400,
    requiredCount: 3,
    icon: '⛰️',
    landmarks: [
      'Pictured Rocks National Lakeshore',
      'Tahquamenon Falls',
      'Mackinac Island',
      'Porcupine Mountains',
      'Isle Royale',
    ],
  },
  {
    id: 'detroit-urban-explorer',
    name: 'Detroit Urban Explorer',
    description: 'Visit iconic Detroit landmarks and capture their essence',
    category: 'urban-landmarks',
    difficulty: 'medium',
    bonusPoints: 300,
    requiredCount: 4,
    icon: '🏙️',
    landmarks: [
      'Guardian Building',
      'Eastern Market',
      'Belle Isle',
      'Detroit Institute of Arts',
      'Fox Theatre',
      'Comerica Park',
    ],
  },
  {
    id: 'lighthouse-seeker',
    name: 'Lighthouse Seeker',
    description: 'Find and photograph Michigan\'s historic lighthouses',
    category: 'historical-sites',
    difficulty: 'hard',
    bonusPoints: 350,
    requiredCount: 5,
    icon: '🗼',
    landmarks: [
      'Big Sable Point Lighthouse',
      'Old Mackinac Point Lighthouse',
      'Point Betsie Lighthouse',
      'Sturgeon Point Lighthouse',
      'Au Sable Light Station',
      'Whitefish Point Light',
    ],
  },
  {
    id: 'west-michigan-beaches',
    name: 'West Michigan Beaches',
    description: 'Experience the beautiful beaches of Western Michigan',
    category: 'natural-wonders',
    difficulty: 'easy',
    bonusPoints: 200,
    requiredCount: 3,
    icon: '🏖️',
    landmarks: [
      'Sleeping Bear Dunes',
      'Grand Haven State Park',
      'Holland State Park',
      'Warren Dunes',
      'Silver Lake Sand Dunes',
    ],
  },
  {
    id: 'college-town-tour',
    name: 'College Town Tour',
    description: 'Visit Michigan\'s famous university campuses',
    category: 'urban-landmarks',
    difficulty: 'medium',
    bonusPoints: 250,
    requiredCount: 3,
    icon: '🎓',
    landmarks: [
      'University of Michigan',
      'Michigan State University',
      'Western Michigan University',
      'Michigan Technological University',
      'Grand Valley State University',
    ],
  },
  {
    id: 'fall-colors-tour',
    name: 'Fall Colors Tour',
    description: 'Capture Michigan\'s stunning autumn foliage (Seasonal)',
    category: 'seasonal',
    difficulty: 'medium',
    bonusPoints: 300,
    requiredCount: 4,
    icon: '🍂',
    landmarks: [
      'Tunnel of Trees (M-119)',
      'Pictured Rocks',
      'Porcupine Mountains',
      'Sleeping Bear Dunes',
      'Tahquamenon Falls',
    ],
  },
  {
    id: 'hidden-michigan',
    name: 'Hidden Michigan',
    description: 'Discover lesser-known gems across the state',
    category: 'hidden-gems',
    difficulty: 'hard',
    bonusPoints: 400,
    requiredCount: 5,
    icon: '💎',
    landmarks: [
      'Kitch-iti-kipi Spring',
      'Castle Rock',
      'Mystery Spot',
      'Dinosaur Gardens',
      'Hartwick Pines State Park',
      'Bond Falls',
    ],
  },
  {
    id: 'winter-wonderland',
    name: 'Winter Wonderland',
    description: 'Experience Michigan\'s winter beauty (Seasonal)',
    category: 'seasonal',
    difficulty: 'medium',
    bonusPoints: 350,
    requiredCount: 3,
    icon: '❄️',
    landmarks: [
      'Ice Caves at Eben',
      'Frozen Tahquamenon Falls',
      'Frankenmuth',
      'Crystal Mountain Resort',
      'Boyne Mountain',
    ],
  },
  {
    id: 'historic-michigan',
    name: 'Historic Michigan',
    description: 'Explore Michigan\'s rich historical heritage',
    category: 'historical-sites',
    difficulty: 'medium',
    bonusPoints: 300,
    requiredCount: 4,
    icon: '🏛️',
    landmarks: [
      'Fort Mackinac',
      'Henry Ford Museum',
      'Greenfield Village',
      'Michigan State Capitol',
      'Soo Locks',
      'Grand Hotel Mackinac',
    ],
  },
];

/**
 * Helper function to get challenge by ID
 */
export function getChallengeById(id: string): MichiganChallenge | undefined {
  return MICHIGAN_CHALLENGES.find(c => c.id === id);
}

/**
 * Helper function to check if a landmark matches any challenge
 */
export function findChallengesForLandmark(landmarkName: string): MichiganChallenge[] {
  const normalizedLandmark = landmarkName.toLowerCase();
  return MICHIGAN_CHALLENGES.filter(challenge =>
    challenge.landmarks.some(l => l.toLowerCase().includes(normalizedLandmark) || normalizedLandmark.includes(l.toLowerCase()))
  );
}

/**
 * Calculate challenge progress
 */
export function calculateChallengeProgress(
  challenge: MichiganChallenge,
  completedLandmarks: string[]
): number {
  return Math.min(100, (completedLandmarks.length / challenge.requiredCount) * 100);
}

/**
 * Check if challenge is completed
 */
export function isChallengeCompleted(
  challenge: MichiganChallenge,
  completedLandmarks: string[]
): boolean {
  return completedLandmarks.length >= challenge.requiredCount;
}
