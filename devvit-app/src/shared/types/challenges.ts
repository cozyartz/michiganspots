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
  // Geocaching Challenges
  {
    id: 'geocache-explorer',
    name: 'Michigan Geocache Explorer',
    description: 'Find and photograph 10 different geocaches across Michigan',
    category: 'hidden-gems',
    difficulty: 'medium',
    bonusPoints: 500,
    icon: '🎯',
    requiredCount: 10,
    landmarks: [], // Dynamically populated from geocache visits
  },
  {
    id: 'up-cache-hunter',
    name: 'UP Cache Hunter',
    description: 'Discover 5 geocaches in the Upper Peninsula',
    category: 'hidden-gems',
    difficulty: 'hard',
    bonusPoints: 300,
    icon: '🗺️',
    requiredCount: 5,
    landmarks: [], // UP geocaches
  },
  {
    id: 'terrain-master',
    name: 'Terrain Master',
    description: 'Complete 5 geocaches with 3+ star terrain ratings',
    category: 'natural-wonders',
    difficulty: 'hard',
    bonusPoints: 400,
    icon: '⛰️',
    requiredCount: 5,
    landmarks: [], // High-terrain caches
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

/**
 * GPS Coordinates for Michigan Landmarks
 * Format: { landmarkName: { latitude, longitude } }
 */
export const LANDMARK_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // Great Lakes
  'Lake Superior': { lat: 47.5979, lon: -87.5470 },
  'Lake Michigan': { lat: 44.0931, lon: -86.4542 },
  'Lake Huron': { lat: 44.8167, lon: -82.7333 },
  'Lake Erie': { lat: 41.9784, lon: -83.2654 },
  'Lake St. Clair': { lat: 42.5833, lon: -82.75 },

  // Upper Peninsula Natural Wonders
  'Pictured Rocks National Lakeshore': { lat: 46.5656, lon: -86.3397 },
  'Pictured Rocks': { lat: 46.5656, lon: -86.3397 },
  'Tahquamenon Falls': { lat: 46.5771, lon: -85.2561 },
  'Frozen Tahquamenon Falls': { lat: 46.5771, lon: -85.2561 },
  'Mackinac Island': { lat: 45.8489, lon: -84.6175 },
  'Porcupine Mountains': { lat: 46.7557, lon: -89.7845 },
  'Isle Royale': { lat: 48.1063, lon: -88.5542 },

  // Detroit Urban Landmarks
  'Guardian Building': { lat: 42.3298, lon: -83.0458 },
  'Eastern Market': { lat: 42.3471, lon: -83.0396 },
  'Belle Isle': { lat: 42.3387, lon: -82.9853 },
  'Detroit Institute of Arts': { lat: 42.3594, lon: -83.0645 },
  'Fox Theatre': { lat: 42.3373, lon: -83.0504 },
  'Comerica Park': { lat: 42.3390, lon: -83.0485 },

  // Lighthouses
  'Big Sable Point Lighthouse': { lat: 44.0579, lon: -86.5122 },
  'Old Mackinac Point Lighthouse': { lat: 45.7823, lon: -84.7275 },
  'Point Betsie Lighthouse': { lat: 44.6947, lon: -86.2544 },
  'Sturgeon Point Lighthouse': { lat: 44.7176, lon: -83.2732 },
  'Au Sable Light Station': { lat: 46.6702, lon: -85.5449 },
  'Whitefish Point Light': { lat: 46.7697, lon: -84.9567 },

  // West Michigan Beaches
  'Sleeping Bear Dunes': { lat: 44.8833, lon: -86.0333 },
  'Grand Haven State Park': { lat: 43.0613, lon: -86.2286 },
  'Holland State Park': { lat: 42.7752, lon: -86.2094 },
  'Warren Dunes': { lat: 41.9095, lon: -86.5869 },
  'Silver Lake Sand Dunes': { lat: 43.6780, lon: -86.4925 },

  // College Towns
  'University of Michigan': { lat: 42.2780, lon: -83.7382 },
  'Michigan State University': { lat: 42.7018, lon: -84.4822 },
  'Western Michigan University': { lat: 42.2844, lon: -85.6064 },
  'Michigan Technological University': { lat: 47.1176, lon: -88.5459 },
  'Grand Valley State University': { lat: 42.9631, lon: -85.8891 },

  // Fall Colors Tour
  'Tunnel of Trees (M-119)': { lat: 45.6353, lon: -85.1004 },

  // Hidden Michigan
  'Kitch-iti-kipi Spring': { lat: 46.0136, lon: -86.1825 },
  'Castle Rock': { lat: 45.8672, lon: -84.7333 },
  'Mystery Spot': { lat: 45.9889, lon: -85.6236 },
  'Dinosaur Gardens': { lat: 45.2186, lon: -83.6253 },
  'Hartwick Pines State Park': { lat: 44.7381, lon: -84.6597 },
  'Bond Falls': { lat: 46.4586, lon: -89.0892 },

  // Winter Wonderland
  'Ice Caves at Eben': { lat: 46.4044, lon: -87.0286 },
  'Frankenmuth': { lat: 43.3314, lon: -83.7380 },
  'Crystal Mountain Resort': { lat: 44.5914, lon: -85.9539 },
  'Boyne Mountain': { lat: 45.1647, lon: -84.9294 },

  // Historic Michigan
  'Fort Mackinac': { lat: 45.8517, lon: -84.6172 },
  'Henry Ford Museum': { lat: 42.3034, lon: -83.2343 },
  'Greenfield Village': { lat: 42.3075, lon: -83.2297 },
  'Michigan State Capitol': { lat: 42.7337, lon: -84.5553 },
  'Soo Locks': { lat: 46.5050, lon: -84.3489 },
  'Grand Hotel Mackinac': { lat: 45.8475, lon: -84.6250 },
};

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Verify user is within proximity of a landmark
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param landmarkName Name of the landmark
 * @param radiusMeters Proximity radius in meters (default 1000m = 1km)
 * @returns Object with verification status, distance, and message
 */
export function verifyProximity(
  userLat: number,
  userLon: number,
  landmarkName: string,
  radiusMeters: number = 1000
): { verified: boolean; distance: number; message: string; landmark: { lat: number; lon: number } | null } {
  const landmark = LANDMARK_COORDINATES[landmarkName];

  if (!landmark) {
    return {
      verified: false,
      distance: -1,
      message: `Landmark "${landmarkName}" not found in database`,
      landmark: null,
    };
  }

  const distance = calculateDistance(userLat, userLon, landmark.lat, landmark.lon);

  if (distance <= radiusMeters) {
    return {
      verified: true,
      distance: Math.round(distance),
      message: `You are ${Math.round(distance)}m from ${landmarkName}. Challenge progress updated!`,
      landmark,
    };
  }

  return {
    verified: false,
    distance: Math.round(distance),
    message: `You are ${Math.round(distance)}m from ${landmarkName}. Please get within ${radiusMeters}m to verify.`,
    landmark,
  };
}

/**
 * Find nearest landmark to user's current location
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param maxDistance Maximum distance to search (default 5000m = 5km)
 * @returns Nearest landmark or null if none within range
 */
export function findNearestLandmark(
  userLat: number,
  userLon: number,
  maxDistance: number = 5000
): { name: string; distance: number; coords: { lat: number; lon: number } } | null {
  let nearest: { name: string; distance: number; coords: { lat: number; lon: number } } | null = null;
  let minDistance = maxDistance;

  for (const [name, coords] of Object.entries(LANDMARK_COORDINATES)) {
    const distance = calculateDistance(userLat, userLon, coords.lat, coords.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { name, distance: Math.round(distance), coords };
    }
  }

  return nearest;
}

/**
 * Michigan Cities Database (Tier 3 Location Verification)
 * Organized by region for manual city selection fallback
 */

export interface MichiganRegion {
  name: string;
  cities: string[];
  approximateCenter: { lat: number; lon: number };
}

export const MICHIGAN_REGIONS: MichiganRegion[] = [
  {
    name: 'Upper Peninsula',
    approximateCenter: { lat: 46.5, lon: -87.5 },
    cities: [
      'Marquette',
      'Sault Ste. Marie',
      'Escanaba',
      'Houghton',
      'Hancock',
      'Iron Mountain',
      'Ishpeming',
      'Negaunee',
      'Menominee',
      'Ironwood',
      'Calumet',
      'St. Ignace',
      'Manistique',
      'Munising',
      'Gladstone',
    ],
  },
  {
    name: 'Northern Lower Peninsula',
    approximateCenter: { lat: 45.0, lon: -85.0 },
    cities: [
      'Traverse City',
      'Petoskey',
      'Charlevoix',
      'Alpena',
      'Gaylord',
      'Cadillac',
      'Cheboygan',
      'Mackinaw City',
      'Harbor Springs',
      'Boyne City',
      'Elk Rapids',
      'Grayling',
      'Rogers City',
      'Bellaire',
      'East Jordan',
    ],
  },
  {
    name: 'West Michigan',
    approximateCenter: { lat: 43.0, lon: -86.0 },
    cities: [
      'Grand Rapids',
      'Holland',
      'Muskegon',
      'Grand Haven',
      'Ludington',
      'Manistee',
      'Norton Shores',
      'Walker',
      'Grandville',
      'Wyoming',
      'Kentwood',
      'East Grand Rapids',
      'Rockford',
      'Zeeland',
      'Hudsonville',
    ],
  },
  {
    name: 'Central Michigan',
    approximateCenter: { lat: 43.5, lon: -84.5 },
    cities: [
      'Lansing',
      'East Lansing',
      'Midland',
      'Mount Pleasant',
      'Saginaw',
      'Bay City',
      'Alma',
      'Clare',
      'St. Johns',
      'Owosso',
      'Howell',
      'Brighton',
      'Okemos',
      'Haslett',
      'Dewitt',
    ],
  },
  {
    name: 'Southeast Michigan',
    approximateCenter: { lat: 42.3, lon: -83.0 },
    cities: [
      'Detroit',
      'Ann Arbor',
      'Dearborn',
      'Livonia',
      'Warren',
      'Sterling Heights',
      'Troy',
      'Farmington Hills',
      'Rochester',
      'Royal Oak',
      'Southfield',
      'Pontiac',
      'Novi',
      'Canton',
      'Plymouth',
      'Ypsilanti',
      'Westland',
      'Birmingham',
      'Ferndale',
      'Bloomfield Hills',
    ],
  },
  {
    name: 'Southwest Michigan',
    approximateCenter: { lat: 42.0, lon: -86.0 },
    cities: [
      'Kalamazoo',
      'Battle Creek',
      'Portage',
      'Benton Harbor',
      'St. Joseph',
      'South Haven',
      'Paw Paw',
      'Three Rivers',
      'Niles',
      'Sturgis',
      'Dowagiac',
      'Buchanan',
      'Coldwater',
      'Marshall',
      'Albion',
    ],
  },
  {
    name: 'Thumb Region',
    approximateCenter: { lat: 43.5, lon: -83.0 },
    cities: [
      'Flint',
      'Port Huron',
      'Saginaw',
      'Bay City',
      'Lapeer',
      'Caro',
      'Bad Axe',
      'Sandusky',
      'Marlette',
      'Imlay City',
      'Yale',
      'Harbor Beach',
      'Vassar',
      'Frankenmuth',
      'Birch Run',
    ],
  },
];

/**
 * Flat list of all Michigan cities for validation
 */
export const ALL_MICHIGAN_CITIES: string[] = MICHIGAN_REGIONS.flatMap(region => region.cities);

/**
 * Validate if a city name is in Michigan
 */
export function isMichiganCity(cityName: string): boolean {
  const normalized = cityName.toLowerCase().trim();
  return ALL_MICHIGAN_CITIES.some(city => city.toLowerCase() === normalized);
}

/**
 * Get region for a city
 */
export function getRegionForCity(cityName: string): MichiganRegion | null {
  const normalized = cityName.toLowerCase().trim();
  return MICHIGAN_REGIONS.find(region =>
    region.cities.some(city => city.toLowerCase() === normalized)
  ) || null;
}

/**
 * Get approximate coordinates for a city
 * Returns region center as approximation
 */
export function getCityApproximateCoords(cityName: string): { lat: number; lon: number } | null {
  const region = getRegionForCity(cityName);
  return region ? region.approximateCenter : null;
}

/**
 * Location verification tiers
 */
export type LocationTier = 'gps' | 'ip' | 'manual';

export interface LocationVerification {
  tier: LocationTier;
  latitude: number;
  longitude: number;
  accuracy: number; // meters - GPS: 10-50m, IP: 5000-50000m, Manual: city-level
  source: string; // 'device-gps', 'ip-geolocation', 'user-selected'
  timestamp: number;
  cityName?: string; // For manual tier
  regionName?: string; // For manual tier
}

/**
 * Validate location is in Michigan (broad check for any tier)
 */
export function isLocationInMichigan(lat: number, lon: number): boolean {
  const MICHIGAN_BOUNDS = {
    minLat: 41.7,
    maxLat: 48.3,
    minLon: -90.4,
    maxLon: -82.1,
  };

  return (
    lat >= MICHIGAN_BOUNDS.minLat &&
    lat <= MICHIGAN_BOUNDS.maxLat &&
    lon >= MICHIGAN_BOUNDS.minLon &&
    lon <= MICHIGAN_BOUNDS.maxLon
  );
}
