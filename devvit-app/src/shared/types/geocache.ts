// OpenCaching.us / OKAPI Geocaching Types

export interface Geocache {
  code: string; // Cache code (e.g., "OX12345")
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  type: string; // Traditional, Multi-cache, Mystery/Puzzle, Letterbox, etc.
  difficulty: number; // 1-5 stars
  terrain: number; // 1-5 stars
  size: string; // Micro, Small, Regular, Large, Other
  status: string; // Available, Temporarily unavailable, Archived
  short_description?: string;
  description?: string;
  hint?: string;
  distance?: number; // Calculated distance from user (in meters)
  michiganRegion?: 'UP' | 'LP' | 'Detroit Metro' | 'Grand Rapids' | 'Northern Michigan' | 'West Michigan';
}

export interface OKAPISearchParams {
  center?: string; // "lat|lon" format
  radius?: number; // meters
  bbox?: string; // "min_lat|min_lon|max_lat|max_lon" format
  limit?: number;
  status?: string; // Available, Temporarily unavailable, Archived
  type?: string;
  mindiff?: number;
  maxdiff?: number;
  minterr?: number;
  maxterr?: number;
}

export interface OKAPICacheResponse {
  cache_code: string;
  name: string;
  location: string; // "lat|lon" format
  type: string;
  difficulty: number;
  terrain: number;
  size: string;
  status: string;
  short_description?: string;
  description?: string;
  hint2?: string; // Encrypted hint
}

export interface GeocacheChallenge {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bonusPoints: number;
  requiredCaches: number;
  cacheTypes?: string[];
  minDifficulty?: number;
  minTerrain?: number;
  region?: string;
  icon: string;
}

export interface GeocacheVisit {
  username: string;
  cacheCode: string;
  cacheName: string;
  visitedAt: number; // timestamp
  photoSubmitted: boolean;
  pointsEarned: number;
  location: {
    latitude: number;
    longitude: number;
  };
  verified: boolean; // GPS verification
}

export interface GeocachingPoints {
  baseGeocacheBonus: 50; // Basic geocache visit
  difficultyBonus: 25; // 3+ star difficulty
  terrainBonus: 25; // 3+ star terrain
  photoVerification: 100; // Photo at cache location
  firstToFind: 500; // First Reddit user to find new cache
}

// Michigan state boundaries for OKAPI searches
export const MICHIGAN_BOUNDS = {
  minLat: 41.7,
  maxLat: 48.3,
  minLon: -90.4,
  maxLon: -82.1,
  bbox: '41.7|-90.4|48.3|-82.1', // Format for OKAPI
};

// Helper function to determine Michigan region from coordinates
export function getMichiganRegion(lat: number, lon: number): string {
  // Upper Peninsula: north of ~45.5°N
  if (lat > 45.5) return 'UP';

  // Detroit Metro: near 42.3°N, -83°W
  if (Math.abs(lat - 42.3) < 0.5 && Math.abs(lon - (-83)) < 0.5) return 'Detroit Metro';

  // Grand Rapids: near 42.96°N, -85.67°W
  if (Math.abs(lat - 42.96) < 0.3 && Math.abs(lon - (-85.67)) < 0.3) return 'Grand Rapids';

  // West Michigan: western LP near Lake Michigan
  if (lon < -85.5 && lat > 42 && lat < 45.5) return 'West Michigan';

  // Northern Michigan: northern LP
  if (lat > 44 && lat < 45.5) return 'Northern Michigan';

  // Default to Lower Peninsula
  return 'LP';
}

// Helper function to calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}
