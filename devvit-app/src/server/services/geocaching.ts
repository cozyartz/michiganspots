// OpenCaching.us / OKAPI Integration Service

import type {
  Geocache,
  OKAPISearchParams,
  OKAPICacheResponse,
  GeocacheVisit,
} from '../../shared/types/geocache';
import { MICHIGAN_BOUNDS, getMichiganRegion, calculateDistance } from '../../shared/types/geocache';

const OKAPI_BASE_URL = 'https://www.opencaching.us/okapi';

/**
 * Search for geocaches within Michigan state boundaries
 */
export async function searchMichiganGeocaches(params?: {
  limit?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  minTerrain?: number;
  maxTerrain?: number;
  type?: string;
}): Promise<Geocache[]> {
  try {
    const searchParams: OKAPISearchParams = {
      bbox: MICHIGAN_BOUNDS.bbox,
      limit: params?.limit || 500,
      status: 'Available',
    };

    if (params?.minDifficulty) searchParams.mindiff = params.minDifficulty;
    if (params?.maxDifficulty) searchParams.maxdiff = params.maxDifficulty;
    if (params?.minTerrain) searchParams.minterr = params.minTerrain;
    if (params?.maxTerrain) searchParams.maxterr = params.maxTerrain;
    if (params?.type) searchParams.type = params.type;

    // Step 1: Search for cache codes
    const searchUrl = new URL(`${OKAPI_BASE_URL}/services/caches/search/bbox`);
    searchUrl.searchParams.append('bbox', searchParams.bbox!);
    searchUrl.searchParams.append('status', searchParams.status!);
    searchUrl.searchParams.append('limit', searchParams.limit!.toString());

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      throw new Error(`OKAPI search failed: ${searchResponse.statusText}`);
    }

    const cacheCodes: string[] = await searchResponse.json();

    if (cacheCodes.length === 0) {
      return [];
    }

    // Step 2: Get detailed information for each cache
    const caches = await getCacheDetailsBatch(cacheCodes.slice(0, 100)); // Limit to 100 for performance

    return caches;
  } catch (error) {
    console.error('Error searching Michigan geocaches:', error);
    return [];
  }
}

/**
 * Search for geocaches near a specific location
 */
export async function searchNearbyGeocaches(
  latitude: number,
  longitude: number,
  radiusMeters: number = 10000,
  limit: number = 20
): Promise<Geocache[]> {
  try {
    // Step 1: Search for nearby cache codes
    const searchUrl = new URL(`${OKAPI_BASE_URL}/services/caches/search/nearest`);
    searchUrl.searchParams.append('center', `${latitude}|${longitude}`);
    searchUrl.searchParams.append('radius', radiusMeters.toString());
    searchUrl.searchParams.append('limit', limit.toString());
    searchUrl.searchParams.append('status', 'Available');

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      throw new Error(`OKAPI search failed: ${searchResponse.statusText}`);
    }

    const cacheCodes: string[] = await searchResponse.json();

    if (cacheCodes.length === 0) {
      return [];
    }

    // Step 2: Get detailed information for each cache
    const caches = await getCacheDetailsBatch(cacheCodes);

    // Step 3: Calculate distance from user location and add region
    const cachesWithDistance = caches.map((cache) => ({
      ...cache,
      distance: calculateDistance(
        latitude,
        longitude,
        cache.location.latitude,
        cache.location.longitude
      ),
      michiganRegion: getMichiganRegion(cache.location.latitude, cache.location.longitude) as any,
    }));

    // Sort by distance
    cachesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return cachesWithDistance;
  } catch (error) {
    console.error('Error searching nearby geocaches:', error);
    return [];
  }
}

/**
 * Get detailed information for a single geocache
 */
export async function getCacheDetails(cacheCode: string): Promise<Geocache | null> {
  try {
    const detailsUrl = new URL(`${OKAPI_BASE_URL}/services/caches/geocache`);
    detailsUrl.searchParams.append('cache_code', cacheCode);
    detailsUrl.searchParams.append(
      'fields',
      'code|name|location|type|difficulty|terrain|size|status|short_description|description|hint2'
    );

    const response = await fetch(detailsUrl.toString());
    if (!response.ok) {
      throw new Error(`OKAPI cache details failed: ${response.statusText}`);
    }

    const data: OKAPICacheResponse = await response.json();
    return transformOKAPIResponse(data);
  } catch (error) {
    console.error(`Error fetching cache details for ${cacheCode}:`, error);
    return null;
  }
}

/**
 * Get detailed information for multiple geocaches in a single batch
 */
async function getCacheDetailsBatch(cacheCodes: string[]): Promise<Geocache[]> {
  try {
    const detailsUrl = new URL(`${OKAPI_BASE_URL}/services/caches/geocaches`);
    detailsUrl.searchParams.append('cache_codes', cacheCodes.join('|'));
    detailsUrl.searchParams.append(
      'fields',
      'code|name|location|type|difficulty|terrain|size|status|short_description|description|hint2'
    );

    const response = await fetch(detailsUrl.toString());
    if (!response.ok) {
      throw new Error(`OKAPI batch cache details failed: ${response.statusText}`);
    }

    const data: Record<string, OKAPICacheResponse> = await response.json();

    // Transform all responses
    return Object.values(data)
      .map(transformOKAPIResponse)
      .filter((cache): cache is Geocache => cache !== null);
  } catch (error) {
    console.error('Error fetching batch cache details:', error);
    return [];
  }
}

/**
 * Transform OKAPI response format to our internal Geocache format
 */
function transformOKAPIResponse(data: OKAPICacheResponse): Geocache | null {
  try {
    // Parse location (format: "lat|lon")
    const [latStr, lonStr] = data.location.split('|');
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      console.error('Invalid location format:', data.location);
      return null;
    }

    const cache: Geocache = {
      code: data.cache_code,
      name: data.name,
      location: {
        latitude,
        longitude,
      },
      type: data.type,
      difficulty: data.difficulty,
      terrain: data.terrain,
      size: data.size,
      status: data.status,
      short_description: data.short_description,
      description: data.description,
      hint: data.hint2,
      michiganRegion: getMichiganRegion(latitude, longitude) as any,
    };

    return cache;
  } catch (error) {
    console.error('Error transforming OKAPI response:', error);
    return null;
  }
}

/**
 * Verify if user is within acceptable distance of a geocache
 */
export function verifyGeocacheProximity(
  userLat: number,
  userLon: number,
  cacheLat: number,
  cacheLon: number,
  maxDistanceMeters: number = 161 // 0.1 miles / 161 meters
): boolean {
  const distance = calculateDistance(userLat, userLon, cacheLat, cacheLon);
  return distance <= maxDistanceMeters;
}

/**
 * Calculate bonus points for a geocache visit
 */
export function calculateGeocacheBonus(cache: Geocache, verified: boolean): number {
  let bonus = 0;

  // Base geocache bonus (only if verified with GPS)
  if (verified) {
    bonus += 50;
  }

  // Difficulty bonus (3+ stars)
  if (cache.difficulty >= 3) {
    bonus += 25;
  }

  // Terrain bonus (3+ stars)
  if (cache.terrain >= 3) {
    bonus += 25;
  }

  return bonus;
}
