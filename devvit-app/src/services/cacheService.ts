/**
 * Cache Service for Performance Optimization
 * 
 * Implements caching strategies for frequently accessed data including
 * challenges, leaderboards, user profiles, and analytics data.
 */

import { getPerformanceMonitor } from './performanceMonitoring.js';
import type { Challenge, UserProfile, LeaderboardEntry } from '../types/core.js';

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: Date;
  size: number; // Estimated size in bytes
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
}

export class CacheService<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
    missRate: 0
  };
  private cleanupTimer?: NodeJS.Timeout;
  private performanceMonitor = getPerformanceMonitor();

  constructor(
    private config: CacheConfig,
    private cacheName: string = 'default'
  ) {
    this.startCleanupTimer();
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.entryCount--;
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    this.stats.hits++;
    this.updateStats();
    
    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const size = this.estimateSize(data);
    const entryTTL = ttl || this.config.defaultTTL;
    
    // Check if we need to make space
    this.ensureSpace(size);
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl: entryTTL,
      accessCount: 1,
      lastAccessed: new Date(),
      size
    };

    // Remove existing entry if it exists
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.stats.totalSize -= existingEntry.size;
      this.stats.entryCount--;
    }

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.entryCount++;
    
    this.updateStats();
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.entryCount--;
      this.updateStats();
      return true;
    }
    return false;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.entryCount = 0;
    this.updateStats();
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Batch get multiple keys
   */
  getBatch(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    
    keys.forEach(key => {
      const value = this.get(key);
      if (value !== null) {
        results.set(key, value);
      }
    });
    
    return results;
  }

  /**
   * Batch set multiple key-value pairs
   */
  setBatch(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): Array<{ key: string; entry: CacheEntry<T> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry: { ...entry }
    }));
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let removedCount = 0;
    const now = new Date();
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
        this.stats.entryCount--;
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.updateStats();
    }
    
    return removedCount;
  }

  /**
   * Ensure there's enough space for a new entry
   */
  private ensureSpace(requiredSize: number): void {
    // Check size limit
    while (this.stats.totalSize + requiredSize > this.config.maxSize && this.cache.size > 0) {
      this.evictLeastRecentlyUsed();
    }
    
    // Check entry count limit
    while (this.stats.entryCount >= this.config.maxEntries && this.cache.size > 0) {
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = new Date();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.stats.totalSize -= entry.size;
      this.stats.entryCount--;
      this.stats.evictions++;
    }
  }

  /**
   * Check if entry has expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    const now = new Date();
    return now.getTime() - entry.timestamp.getTime() > entry.ttl;
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: T): number {
    if (data === null || data === undefined) return 0;
    
    if (typeof data === 'string') return data.length * 2; // UTF-16
    if (typeof data === 'number') return 8;
    if (typeof data === 'boolean') return 4;
    if (data instanceof Date) return 8;
    
    if (Array.isArray(data)) {
      return data.reduce((size, item) => size + this.estimateSize(item), 0);
    }
    
    if (typeof data === 'object') {
      return Object.entries(data).reduce((size, [key, value]) => 
        size + key.length * 2 + this.estimateSize(value), 0
      );
    }
    
    return 0;
  }

  /**
   * Update cache statistics and report to performance monitor
   */
  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    this.stats.missRate = total > 0 ? (this.stats.misses / total) * 100 : 0;
    
    // Report to performance monitor
    this.performanceMonitor.updateCacheMetrics(this.cacheName, {
      hitRate: this.stats.hitRate,
      missRate: this.stats.missRate,
      evictionCount: this.stats.evictions,
      totalSize: this.stats.totalSize,
      entryCount: this.stats.entryCount
    });
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

/**
 * Specialized cache for challenges
 */
export class ChallengeCache extends CacheService<Challenge> {
  constructor() {
    super({
      maxSize: 5 * 1024 * 1024, // 5MB
      maxEntries: 1000,
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      cleanupInterval: 5 * 60 * 1000 // 5 minutes
    }, 'challenges');
  }

  /**
   * Get active challenges with caching
   */
  async getActiveChallenges(
    fetchFunction: () => Promise<Challenge[]>
  ): Promise<Challenge[]> {
    return this.getOrSet('active_challenges', fetchFunction, 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Get challenge by ID with caching
   */
  async getChallengeById(
    id: string,
    fetchFunction: (id: string) => Promise<Challenge>
  ): Promise<Challenge> {
    return this.getOrSet(`challenge_${id}`, () => fetchFunction(id));
  }

  /**
   * Invalidate challenge-related caches
   */
  invalidateChallengeData(challengeId?: string): void {
    if (challengeId) {
      this.delete(`challenge_${challengeId}`);
    }
    this.delete('active_challenges');
  }
}

/**
 * Specialized cache for user profiles
 */
export class UserProfileCache extends CacheService<UserProfile> {
  constructor() {
    super({
      maxSize: 2 * 1024 * 1024, // 2MB
      maxEntries: 500,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 10 * 60 * 1000 // 10 minutes
    }, 'user_profiles');
  }

  /**
   * Get user profile with caching
   */
  async getUserProfile(
    username: string,
    fetchFunction: (username: string) => Promise<UserProfile>
  ): Promise<UserProfile> {
    return this.getOrSet(`profile_${username}`, () => fetchFunction(username));
  }

  /**
   * Update user profile in cache
   */
  updateUserProfile(username: string, profile: UserProfile): void {
    this.set(`profile_${username}`, profile);
  }

  /**
   * Invalidate user profile
   */
  invalidateUserProfile(username: string): void {
    this.delete(`profile_${username}`);
  }
}

/**
 * Specialized cache for leaderboards
 */
export class LeaderboardCache extends CacheService<LeaderboardEntry[]> {
  constructor() {
    super({
      maxSize: 1 * 1024 * 1024, // 1MB
      maxEntries: 100,
      defaultTTL: 5 * 60 * 1000, // 5 minutes (frequent updates)
      cleanupInterval: 2 * 60 * 1000 // 2 minutes
    }, 'leaderboards');
  }

  /**
   * Get leaderboard with caching
   */
  async getLeaderboard(
    type: 'individual' | 'city',
    timeframe: 'weekly' | 'monthly' | 'alltime',
    fetchFunction: () => Promise<LeaderboardEntry[]>
  ): Promise<LeaderboardEntry[]> {
    const key = `leaderboard_${type}_${timeframe}`;
    return this.getOrSet(key, fetchFunction);
  }

  /**
   * Invalidate all leaderboards
   */
  invalidateLeaderboards(): void {
    const keys = Array.from(this.getEntries())
      .map(({ key }) => key)
      .filter(key => key.startsWith('leaderboard_'));
    
    keys.forEach(key => this.delete(key));
  }
}

// Singleton instances
let challengeCacheInstance: ChallengeCache | null = null;
let userProfileCacheInstance: UserProfileCache | null = null;
let leaderboardCacheInstance: LeaderboardCache | null = null;

export function getChallengeCache(): ChallengeCache {
  if (!challengeCacheInstance) {
    challengeCacheInstance = new ChallengeCache();
  }
  return challengeCacheInstance;
}

export function getUserProfileCache(): UserProfileCache {
  if (!userProfileCacheInstance) {
    userProfileCacheInstance = new UserProfileCache();
  }
  return userProfileCacheInstance;
}

export function getLeaderboardCache(): LeaderboardCache {
  if (!leaderboardCacheInstance) {
    leaderboardCacheInstance = new LeaderboardCache();
  }
  return leaderboardCacheInstance;
}

/**
 * Initialize all caches
 */
export function initializeCaches(): {
  challengeCache: ChallengeCache;
  userProfileCache: UserProfileCache;
  leaderboardCache: LeaderboardCache;
} {
  challengeCacheInstance = new ChallengeCache();
  userProfileCacheInstance = new UserProfileCache();
  leaderboardCacheInstance = new LeaderboardCache();
  
  return {
    challengeCache: challengeCacheInstance,
    userProfileCache: userProfileCacheInstance,
    leaderboardCache: leaderboardCacheInstance
  };
}

/**
 * Cleanup all caches
 */
export function destroyAllCaches(): void {
  challengeCacheInstance?.destroy();
  userProfileCacheInstance?.destroy();
  leaderboardCacheInstance?.destroy();
  
  challengeCacheInstance = null;
  userProfileCacheInstance = null;
  leaderboardCacheInstance = null;
}