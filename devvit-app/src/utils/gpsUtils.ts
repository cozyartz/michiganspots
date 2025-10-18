/**
 * GPS coordinate utilities for location verification and distance calculations
 */

import { GPSCoordinate, LocationVerification } from '../types/core.js';

/**
 * Calculate the distance between two GPS coordinates using the Haversine formula
 * @param coord1 First GPS coordinate
 * @param coord2 Second GPS coordinate
 * @returns Distance in meters
 */
export function calculateDistance(coord1: GPSCoordinate, coord2: GPSCoordinate): number {
  const R = 6371000; // Earth's radius in meters
  
  // Convert latitude and longitude from degrees to radians
  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);
  const deltaLatRad = toRadians(coord2.latitude - coord1.latitude);
  const deltaLonRad = toRadians(coord2.longitude - coord1.longitude);

  // Haversine formula
  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate GPS coordinate accuracy and normalize coordinates
 * @param coordinate GPS coordinate to validate
 * @returns Normalized and validated GPS coordinate
 */
export function validateAndNormalizeCoordinate(coordinate: GPSCoordinate): {
  isValid: boolean;
  normalized?: GPSCoordinate;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate latitude range (-90 to 90)
  if (coordinate.latitude < -90 || coordinate.latitude > 90) {
    errors.push('Latitude must be between -90 and 90 degrees');
  }
  
  // Validate longitude range (-180 to 180)
  if (coordinate.longitude < -180 || coordinate.longitude > 180) {
    errors.push('Longitude must be between -180 and 180 degrees');
  }
  
  // Check for invalid numbers
  if (!isFinite(coordinate.latitude) || !isFinite(coordinate.longitude)) {
    errors.push('Coordinates must be valid numbers');
  }
  
  // Validate accuracy if provided
  if (coordinate.accuracy !== undefined) {
    if (coordinate.accuracy < 0) {
      errors.push('GPS accuracy must be a positive number');
    }
    if (coordinate.accuracy > 10000) {
      errors.push('GPS accuracy seems unreasonably high (>10km)');
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Normalize coordinates
  const normalized: GPSCoordinate = {
    latitude: Number(coordinate.latitude.toFixed(8)), // ~1cm precision
    longitude: Number(coordinate.longitude.toFixed(8)),
    accuracy: coordinate.accuracy ? Math.round(coordinate.accuracy) : undefined,
    timestamp: coordinate.timestamp || new Date()
  };
  
  return { isValid: true, normalized, errors: [] };
}

/**
 * Verify if a user location is within the required radius of a business location
 * @param userLocation User's GPS coordinates
 * @param businessLocation Business GPS coordinates
 * @param radiusMeters Required verification radius in meters (default: 100)
 * @returns Location verification result
 */
export function verifyLocationWithinRadius(
  userLocation: GPSCoordinate,
  businessLocation: GPSCoordinate,
  radiusMeters: number = 100
): LocationVerification {
  // Validate both coordinates
  const userValidation = validateAndNormalizeCoordinate(userLocation);
  const businessValidation = validateAndNormalizeCoordinate(businessLocation);
  
  if (!userValidation.isValid || !businessValidation.isValid) {
    return {
      isValid: false,
      distance: -1,
      accuracy: userLocation.accuracy || 0,
      fraudRisk: 'high',
      verificationMethod: 'manual'
    };
  }
  
  // Calculate distance between coordinates
  const distance = calculateDistance(
    userValidation.normalized!,
    businessValidation.normalized!
  );
  
  // Determine verification method based on GPS accuracy
  let verificationMethod: 'gps' | 'network' | 'manual' = 'gps';
  if (!userLocation.accuracy || userLocation.accuracy > 100) {
    verificationMethod = 'network';
  }
  if (!userLocation.accuracy || userLocation.accuracy > 1000) {
    verificationMethod = 'manual';
  }
  
  // Calculate fraud risk based on accuracy and distance
  let fraudRisk: 'low' | 'medium' | 'high' = 'low';
  
  if (verificationMethod === 'manual' || !userLocation.accuracy) {
    fraudRisk = 'high';
  } else if (userLocation.accuracy > 50 || distance > radiusMeters * 0.8) {
    fraudRisk = 'medium';
  }
  
  // Check if location is within required radius
  const isValid = distance <= radiusMeters;
  
  return {
    isValid,
    distance: Math.round(distance),
    accuracy: userLocation.accuracy || 0,
    fraudRisk,
    verificationMethod
  };
}

/**
 * Calculate the bearing (direction) from one coordinate to another
 * @param from Starting coordinate
 * @param to Ending coordinate
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(from: GPSCoordinate, to: GPSCoordinate): number {
  const lat1Rad = toRadians(from.latitude);
  const lat2Rad = toRadians(to.latitude);
  const deltaLonRad = toRadians(to.longitude - from.longitude);
  
  const y = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);
  
  const bearingRad = Math.atan2(y, x);
  const bearingDeg = (bearingRad * 180 / Math.PI + 360) % 360;
  
  return Math.round(bearingDeg);
}

/**
 * Check if coordinates are within Michigan state boundaries (approximate)
 * @param coordinate GPS coordinate to check
 * @returns True if coordinate is within Michigan boundaries
 */
export function isWithinMichiganBounds(coordinate: GPSCoordinate): boolean {
  // Approximate Michigan boundaries
  const MICHIGAN_BOUNDS = {
    north: 48.2388,   // Upper Peninsula northern border
    south: 41.6961,   // Southern border
    east: -82.1228,   // Eastern border
    west: -90.4186    // Western border (Upper Peninsula)
  };
  
  return coordinate.latitude >= MICHIGAN_BOUNDS.south &&
         coordinate.latitude <= MICHIGAN_BOUNDS.north &&
         coordinate.longitude >= MICHIGAN_BOUNDS.west &&
         coordinate.longitude <= MICHIGAN_BOUNDS.east;
}

/**
 * Generate a human-readable distance string
 * @param distanceMeters Distance in meters
 * @returns Formatted distance string
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  } else if (distanceMeters < 10000) {
    return `${(distanceMeters / 1000).toFixed(1)}km`;
  } else {
    return `${Math.round(distanceMeters / 1000)}km`;
  }
}

/**
 * Calculate the maximum possible speed between two GPS points
 * Used for fraud detection
 * @param coord1 First GPS coordinate with timestamp
 * @param coord2 Second GPS coordinate with timestamp
 * @returns Speed in meters per second, or null if timestamps are missing
 */
export function calculateSpeed(coord1: GPSCoordinate, coord2: GPSCoordinate): number | null {
  if (!coord1.timestamp || !coord2.timestamp) {
    return null;
  }
  
  const distance = calculateDistance(coord1, coord2);
  const timeDiff = Math.abs(coord2.timestamp.getTime() - coord1.timestamp.getTime()) / 1000; // seconds
  
  if (timeDiff === 0) {
    return 0;
  }
  
  return distance / timeDiff; // meters per second
}