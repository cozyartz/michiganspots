/**
 * Achievement and Badge System for Michigan Spots
 */

export type AchievementCategory =
  | 'games'
  | 'challenges'
  | 'exploration'
  | 'social'
  | 'mastery';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  requirement: {
    type: 'score' | 'games_played' | 'challenges_completed' | 'landmarks_visited' | 'streak' | 'specific';
    count?: number;
    game?: string;
    challengeId?: string;
  };
  points: number; // Prestige points awarded
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: number;
  progress?: number; // For tracking progress towards achievement
}

/**
 * All available achievements in Michigan Spots
 */
export const ACHIEVEMENTS: Achievement[] = [
  // Game Achievements
  {
    id: 'first-photo',
    name: 'First Snapshot',
    description: 'Submit your first Michigan photo',
    category: 'games',
    tier: 'bronze',
    icon: '📸',
    requirement: { type: 'games_played', count: 1, game: 'photo-hunt' },
    points: 10,
  },
  {
    id: 'photo-enthusiast',
    name: 'Photo Enthusiast',
    description: 'Submit 10 Michigan photos',
    category: 'games',
    tier: 'silver',
    icon: '📷',
    requirement: { type: 'games_played', count: 10, game: 'photo-hunt' },
    points: 50,
  },
  {
    id: 'photo-master',
    name: 'Photo Master',
    description: 'Submit 50 Michigan photos',
    category: 'games',
    tier: 'gold',
    icon: '🎯',
    requirement: { type: 'games_played', count: 50, game: 'photo-hunt' },
    points: 200,
  },
  {
    id: 'memory-novice',
    name: 'Memory Novice',
    description: 'Complete 5 Memory Match games',
    category: 'games',
    tier: 'bronze',
    icon: '🎴',
    requirement: { type: 'games_played', count: 5, game: 'memory-match' },
    points: 25,
  },
  {
    id: 'trivia-champion',
    name: 'Trivia Champion',
    description: 'Score 900+ in Trivia',
    category: 'games',
    tier: 'gold',
    icon: '🧠',
    requirement: { type: 'score', count: 900, game: 'trivia' },
    points: 150,
  },
  {
    id: 'word-wizard',
    name: 'Word Wizard',
    description: 'Score 800+ in Word Search',
    category: 'games',
    tier: 'gold',
    icon: '🔤',
    requirement: { type: 'score', count: 800, game: 'word-search' },
    points: 150,
  },

  // Challenge Achievements
  {
    id: 'first-challenge',
    name: 'Challenge Accepted',
    description: 'Complete your first Michigan challenge',
    category: 'challenges',
    tier: 'bronze',
    icon: '🗺️',
    requirement: { type: 'challenges_completed', count: 1 },
    points: 50,
  },
  {
    id: 'challenge-hunter',
    name: 'Challenge Hunter',
    description: 'Complete 3 Michigan challenges',
    category: 'challenges',
    tier: 'silver',
    icon: '🎖️',
    requirement: { type: 'challenges_completed', count: 3 },
    points: 100,
  },
  {
    id: 'challenge-master',
    name: 'Challenge Master',
    description: 'Complete 5 Michigan challenges',
    category: 'challenges',
    tier: 'gold',
    icon: '🏅',
    requirement: { type: 'challenges_completed', count: 5 },
    points: 250,
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'Complete all 10 Michigan challenges',
    category: 'challenges',
    tier: 'legendary',
    icon: '👑',
    requirement: { type: 'challenges_completed', count: 10 },
    points: 1000,
  },
  {
    id: 'great-lakes-explorer',
    name: 'Great Lakes Explorer',
    description: 'Complete the Great Lakes Explorer challenge',
    category: 'challenges',
    tier: 'platinum',
    icon: '🌊',
    requirement: { type: 'specific', challengeId: 'great-lakes-explorer' },
    points: 300,
  },

  // Exploration Achievements
  {
    id: 'landmark-seeker',
    name: 'Landmark Seeker',
    description: 'Visit 5 different Michigan landmarks',
    category: 'exploration',
    tier: 'bronze',
    icon: '🏛️',
    requirement: { type: 'landmarks_visited', count: 5 },
    points: 50,
  },
  {
    id: 'landmark-explorer',
    name: 'Landmark Explorer',
    description: 'Visit 15 different Michigan landmarks',
    category: 'exploration',
    tier: 'silver',
    icon: '⛰️',
    requirement: { type: 'landmarks_visited', count: 15 },
    points: 150,
  },
  {
    id: 'landmark-master',
    name: 'Landmark Master',
    description: 'Visit 30 different Michigan landmarks',
    category: 'exploration',
    tier: 'gold',
    icon: '🗿',
    requirement: { type: 'landmarks_visited', count: 30 },
    points: 400,
  },
  {
    id: 'michigan-native',
    name: 'Michigan Native',
    description: 'Visit landmarks in all challenge categories',
    category: 'exploration',
    tier: 'platinum',
    icon: '🌟',
    requirement: { type: 'specific' },
    points: 500,
  },

  // Mastery Achievements
  {
    id: 'high-scorer',
    name: 'High Scorer',
    description: 'Earn a total of 1,000 points',
    category: 'mastery',
    tier: 'bronze',
    icon: '⭐',
    requirement: { type: 'score', count: 1000 },
    points: 50,
  },
  {
    id: 'point-master',
    name: 'Point Master',
    description: 'Earn a total of 5,000 points',
    category: 'mastery',
    tier: 'silver',
    icon: '💫',
    requirement: { type: 'score', count: 5000 },
    points: 200,
  },
  {
    id: 'legend',
    name: 'Michigan Legend',
    description: 'Earn a total of 10,000 points',
    category: 'mastery',
    tier: 'gold',
    icon: '🏆',
    requirement: { type: 'score', count: 10000 },
    points: 500,
  },
  {
    id: 'ultimate-champion',
    name: 'Ultimate Champion',
    description: 'Earn a total of 25,000 points',
    category: 'mastery',
    tier: 'legendary',
    icon: '💎',
    requirement: { type: 'score', count: 25000 },
    points: 2000,
  },

  // Social/Engagement Achievements
  {
    id: 'dedicated-player',
    name: 'Dedicated Player',
    description: 'Play 10 games total',
    category: 'social',
    tier: 'bronze',
    icon: '🎮',
    requirement: { type: 'games_played', count: 10 },
    points: 25,
  },
  {
    id: 'regular',
    name: 'Regular Player',
    description: 'Play 50 games total',
    category: 'social',
    tier: 'silver',
    icon: '🎯',
    requirement: { type: 'games_played', count: 50 },
    points: 100,
  },
  {
    id: 'hardcore-gamer',
    name: 'Hardcore Gamer',
    description: 'Play 100 games total',
    category: 'social',
    tier: 'gold',
    icon: '🔥',
    requirement: { type: 'games_played', count: 100 },
    points: 300,
  },
];

/**
 * Get achievement by ID
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

/**
 * Get achievements by tier
 */
export function getAchievementsByTier(tier: AchievementTier): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.tier === tier);
}

/**
 * Calculate achievement progress percentage
 */
export function calculateAchievementProgress(
  achievement: Achievement,
  userStats: {
    totalScore: number;
    gamesPlayed: number;
    challengesCompleted: number;
    landmarksVisited: number;
    gameStats: Record<string, { timesPlayed: number; bestScore: number }>;
  }
): number {
  const req = achievement.requirement;

  switch (req.type) {
    case 'score':
      if (req.game) {
        const gameScore = userStats.gameStats[req.game]?.bestScore || 0;
        return Math.min(100, (gameScore / (req.count || 1)) * 100);
      }
      return Math.min(100, (userStats.totalScore / (req.count || 1)) * 100);

    case 'games_played':
      if (req.game) {
        const played = userStats.gameStats[req.game]?.timesPlayed || 0;
        return Math.min(100, (played / (req.count || 1)) * 100);
      }
      return Math.min(100, (userStats.gamesPlayed / (req.count || 1)) * 100);

    case 'challenges_completed':
      return Math.min(100, (userStats.challengesCompleted / (req.count || 1)) * 100);

    case 'landmarks_visited':
      return Math.min(100, (userStats.landmarksVisited / (req.count || 1)) * 100);

    case 'specific':
      // Handled separately based on achievement ID
      return 0;

    default:
      return 0;
  }
}

/**
 * Check if achievement is unlocked
 */
export function isAchievementUnlocked(
  achievement: Achievement,
  userStats: {
    totalScore: number;
    gamesPlayed: number;
    challengesCompleted: number;
    landmarksVisited: number;
    gameStats: Record<string, { timesPlayed: number; bestScore: number }>;
    completedChallengeIds?: string[];
  }
): boolean {
  const req = achievement.requirement;

  switch (req.type) {
    case 'score':
      if (req.game) {
        return (userStats.gameStats[req.game]?.bestScore || 0) >= (req.count || 0);
      }
      return userStats.totalScore >= (req.count || 0);

    case 'games_played':
      if (req.game) {
        return (userStats.gameStats[req.game]?.timesPlayed || 0) >= (req.count || 0);
      }
      return userStats.gamesPlayed >= (req.count || 0);

    case 'challenges_completed':
      return userStats.challengesCompleted >= (req.count || 0);

    case 'landmarks_visited':
      return userStats.landmarksVisited >= (req.count || 0);

    case 'specific':
      if (req.challengeId) {
        return userStats.completedChallengeIds?.includes(req.challengeId) || false;
      }
      return false;

    default:
      return false;
  }
}

/**
 * Get tier color for display
 */
export function getTierColor(tier: AchievementTier): string {
  switch (tier) {
    case 'bronze':
      return '#CD7F32';
    case 'silver':
      return '#C0C0C0';
    case 'gold':
      return '#FFD700';
    case 'platinum':
      return '#E5E4E2';
    case 'legendary':
      return '#FF6B6B';
    default:
      return '#666666';
  }
}

/**
 * Get tier display name
 */
export function getTierName(tier: AchievementTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}
