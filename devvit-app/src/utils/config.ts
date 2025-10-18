/**
 * Configuration utilities for the Reddit Treasure Hunt Game
 */

import type { AppConfig } from '../types/index.js';

/**
 * Get app configuration from Devvit settings
 * Note: This will be properly implemented when we build the actual components
 */
export function getAppConfig(context: any): AppConfig {
  // Placeholder implementation - will be updated when we implement actual components
  const config: AppConfig = {
    cloudflareApiKey: process.env.CLOUDFLARE_API_KEY || '',
    analyticsBaseUrl: process.env.ANALYTICS_BASE_URL || 'https://michiganspots.com/api/analytics',
    gpsVerificationRadius: Number(process.env.GPS_VERIFICATION_RADIUS) || 100,
    maxSubmissionsPerUserPerDay: Number(process.env.MAX_SUBMISSIONS_PER_USER_PER_DAY) || 10,
  };

  return config;
}

/**
 * Validate app configuration
 */
export function validateAppConfig(config: AppConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.cloudflareApiKey) {
    errors.push('Cloudflare API key is required');
  }

  if (!config.analyticsBaseUrl) {
    errors.push('Analytics base URL is required');
  } else {
    try {
      new URL(config.analyticsBaseUrl);
    } catch {
      errors.push('Analytics base URL must be a valid URL');
    }
  }

  if (config.gpsVerificationRadius <= 0) {
    errors.push('GPS verification radius must be greater than 0');
  }

  if (config.maxSubmissionsPerUserPerDay <= 0) {
    errors.push('Max submissions per user per day must be greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): {
  isDevelopment: boolean;
  isProduction: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
} {
  // In Devvit, we can determine environment based on settings or context
  // For now, we'll use a simple approach
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    isDevelopment,
    isProduction: !isDevelopment,
    logLevel: isDevelopment ? 'debug' : 'info',
  };
}