/**
 * Main types export file for the Reddit Treasure Hunt Game
 */

// Core types
export * from './core.js';

// Analytics types
export * from './analytics.js';

// Error types
export * from './errors.js';

// Component prop types
export interface ComponentProps {
  className?: string;
  children?: any; // Using any for now since we don't have React types in Devvit
}

// App configuration types
export interface AppConfig {
  cloudflareApiKey: string;
  analyticsBaseUrl: string;
  gpsVerificationRadius: number;
  maxSubmissionsPerUserPerDay: number;
}

// Redis key patterns
export const REDIS_KEYS = {
  USER_PROFILE: (username: string) => `user:${username}`,
  CHALLENGE: (id: string) => `challenge:${id}`,
  SUBMISSION: (id: string) => `submission:${id}`,
  LEADERBOARD: (type: string) => `leaderboard:${type}`,
  USER_SUBMISSIONS: (username: string) => `user_submissions:${username}`,
  DAILY_SUBMISSIONS: (username: string, date: string) => `daily_submissions:${username}:${date}`,
  CHALLENGE_COMPLETIONS: (challengeId: string) => `challenge_completions:${challengeId}`,
} as const;

// Constants
export const CONSTANTS = {
  POINTS: {
    EASY: 10,
    MEDIUM: 25,
    HARD: 50,
  },
  GPS: {
    DEFAULT_RADIUS: 100, // meters
    MAX_ACCURACY: 50, // meters
  },
  RATE_LIMITS: {
    SUBMISSIONS_PER_DAY: 10,
    VIEWS_PER_HOUR: 100,
  },
  TIMEOUTS: {
    GPS_TIMEOUT: 10000, // 10 seconds
    API_TIMEOUT: 5000, // 5 seconds
  },
} as const;