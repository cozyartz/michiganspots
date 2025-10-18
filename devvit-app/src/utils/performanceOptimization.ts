/**
 * Performance Optimization Utilities
 * 
 * Implements database query optimization, API call frequency reduction,
 * and other performance enhancement strategies.
 */

import { getPerformanceMonitor } from '../services/performanceMonitoring.js';
import { getChallengeCache, getUserProfileCache, getLeaderboardCache } from '../services/cacheService.js';
import type { Challenge, UserProfile, LeaderboardEntry } from '../types/core.js';

export interface QueryOptimizationConfig {
  batchSize: number;
  maxConcurrentQueries: number;
  queryTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface APICallBatcher<T> {
  add(key: string, request: () => Promise<T>): Promise<T>;
  flush(): Promise<void>;
  size(): number;
}

/**
 * Database Query Optimizer
 */
export class QueryOptimizer {
  private config: QueryOptimizationConfig;
  private performanceMonitor = getPerformanceMonitor();
  private activeQueries = new Map<string, Promise<any>>();
  private queryQueue: Array<{ key: string; query: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private processingQueue = false;

  constructor(config: Partial<QueryOptimizationConfig> = {}) {
    this.config = {
      batchSize: 10,
      maxConcurrentQueries: 5,
      queryTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Execute query with deduplication and batching
   */
  async executeQuery<T>(key: string, query: () => Promise<T>): Promise<T> {
    // Check if same query is already running
    if (this.activeQueries.has(key)) {
      return this.activeQueries.get(key) as Promise<T>;
    }

    // Create promise for this query
    const queryPromise = new Promise<T>((resolve, reject) => {
      this.queryQueue.push({ key, query, resolve, reject });
      this.processQueue();
    });

    this.activeQueries.set(key, queryPromise);
    
    // Clean up after completion
    queryPromise.finally(() => {
      this.activeQueries.delete(key);
    });

    return queryPromise;
  }

  /**
   * Process query queue with concurrency control
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.queryQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.queryQueue.length > 0 && this.activeQueries.size < this.config.maxConcurrentQueries) {
        const batch = this.queryQueue.splice(0, this.config.batchSize);
        
        // Process batch concurrently
        const batchPromises = batch.map(async ({ key, query, resolve, reject }) => {
          try {
            const endTiming = this.performanceMonitor.startTiming(`query.${key}`);
            const result = await this.executeWithTimeout(query(), this.config.queryTimeout);
            endTiming();
            resolve(result);
          } catch (error) {
            this.performanceMonitor.recordMetric({
              name: 'query.error',
              value: 1,
              unit: 'count',
              timestamp: new Date(),
              tags: { queryKey: key }
            });
            reject(error);
          }
        });

        await Promise.allSettled(batchPromises);
      }
    } finally {
      this.processingQueue = false;
      
      // Continue processing if there are more items
      if (this.queryQueue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
      }
    }
  }

  /**
   * Execute promise with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Batch multiple queries together
   */
  async batchQueries<T>(queries: Array<{ key: string; query: () => Promise<T> }>): Promise<T[]> {
    const promises = queries.map(({ key, query }) => this.executeQuery(key, query));
    return Promise.all(promises);
  }

  /**
   * Get query statistics
   */
  getStats(): {
    activeQueries: number;
    queuedQueries: number;
    totalQueries: number;
  } {
    return {
      activeQueries: this.activeQueries.size,
      queuedQueries: this.queryQueue.length,
      totalQueries: this.activeQueries.size + this.queryQueue.length
    };
  }
}

/**
 * API Call Batcher for reducing request frequency
 */
export class APICallBatcher<T> implements APICallBatcher<T> {
  private batch = new Map<string, () => Promise<T>>();
  private promises = new Map<string, { resolve: (value: T) => void; reject: (error: any) => void }>();
  private batchTimer?: NodeJS.Timeout;
  private performanceMonitor = getPerformanceMonitor();

  constructor(
    private batchDelay: number = 100, // 100ms batch window
    private maxBatchSize: number = 10
  ) {}

  /**
   * Add request to batch
   */
  add(key: string, request: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.batch.set(key, request);
      this.promises.set(key, { resolve, reject });

      // Schedule batch processing
      this.scheduleBatch();

      // Force flush if batch is full
      if (this.batch.size >= this.maxBatchSize) {
        this.flush();
      }
    });
  }

  /**
   * Flush current batch
   */
  async flush(): Promise<void> {
    if (this.batch.size === 0) return;

    const currentBatch = new Map(this.batch);
    const currentPromises = new Map(this.promises);
    
    this.batch.clear();
    this.promises.clear();
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    const endTiming = this.performanceMonitor.startTiming('api.batch.execution');
    
    try {
      // Execute all requests in parallel
      const results = await Promise.allSettled(
        Array.from(currentBatch.entries()).map(async ([key, request]) => {
          try {
            const result = await request();
            return { key, result, success: true };
          } catch (error) {
            return { key, error, success: false };
          }
        })
      );

      // Resolve/reject individual promises
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { key, result: data, success, error } = result.value;
          const promise = currentPromises.get(key);
          
          if (promise) {
            if (success) {
              promise.resolve(data);
            } else {
              promise.reject(error);
            }
          }
        } else {
          // This shouldn't happen with Promise.allSettled, but handle it
          console.error('Unexpected batch result:', result.reason);
        }
      });

      this.performanceMonitor.recordMetric({
        name: 'api.batch.size',
        value: currentBatch.size,
        unit: 'count',
        timestamp: new Date()
      });

    } catch (error) {
      // Reject all promises in case of unexpected error
      currentPromises.forEach(({ reject }) => reject(error));
    } finally {
      endTiming();
    }
  }

  /**
   * Get current batch size
   */
  size(): number {
    return this.batch.size;
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.flush();
    }, this.batchDelay);
  }
}

/**
 * Optimized data fetcher with caching and batching
 */
export class OptimizedDataFetcher {
  private queryOptimizer = new QueryOptimizer();
  private challengeCache = getChallengeCache();
  private userProfileCache = getUserProfileCache();
  private leaderboardCache = getLeaderboardCache();
  private challengeBatcher = new APICallBatcher<Challenge>(200, 5);
  private userProfileBatcher = new APICallBatcher<UserProfile>(150, 8);

  /**
   * Fetch challenge with optimization
   */
  async fetchChallenge(
    challengeId: string,
    fetchFunction: (id: string) => Promise<Challenge>
  ): Promise<Challenge> {
    // Try cache first
    const cached = this.challengeCache.get(`challenge_${challengeId}`);
    if (cached) {
      return cached;
    }

    // Use batcher to reduce duplicate requests
    return this.challengeBatcher.add(
      `challenge_${challengeId}`,
      async () => {
        const challenge = await this.queryOptimizer.executeQuery(
          `fetch_challenge_${challengeId}`,
          () => fetchFunction(challengeId)
        );
        
        // Cache the result
        this.challengeCache.set(`challenge_${challengeId}`, challenge);
        return challenge;
      }
    );
  }

  /**
   * Fetch multiple challenges efficiently
   */
  async fetchChallenges(
    challengeIds: string[],
    fetchFunction: (ids: string[]) => Promise<Challenge[]>
  ): Promise<Challenge[]> {
    // Check cache for existing challenges
    const cachedChallenges = new Map<string, Challenge>();
    const uncachedIds: string[] = [];

    challengeIds.forEach(id => {
      const cached = this.challengeCache.get(`challenge_${id}`);
      if (cached) {
        cachedChallenges.set(id, cached);
      } else {
        uncachedIds.push(id);
      }
    });

    // Fetch uncached challenges in batch
    let fetchedChallenges: Challenge[] = [];
    if (uncachedIds.length > 0) {
      fetchedChallenges = await this.queryOptimizer.executeQuery(
        `fetch_challenges_${uncachedIds.join(',')}`,
        () => fetchFunction(uncachedIds)
      );

      // Cache fetched challenges
      fetchedChallenges.forEach(challenge => {
        this.challengeCache.set(`challenge_${challenge.id}`, challenge);
      });
    }

    // Combine cached and fetched results in original order
    return challengeIds.map(id => {
      const cached = cachedChallenges.get(id);
      if (cached) return cached;
      
      const fetched = fetchedChallenges.find(c => c.id === id);
      if (fetched) return fetched;
      
      throw new Error(`Challenge ${id} not found`);
    });
  }

  /**
   * Fetch user profile with optimization
   */
  async fetchUserProfile(
    username: string,
    fetchFunction: (username: string) => Promise<UserProfile>
  ): Promise<UserProfile> {
    return this.userProfileCache.getOrSet(
      `profile_${username}`,
      () => this.userProfileBatcher.add(
        `profile_${username}`,
        () => this.queryOptimizer.executeQuery(
          `fetch_profile_${username}`,
          () => fetchFunction(username)
        )
      )
    );
  }

  /**
   * Fetch leaderboard with optimization
   */
  async fetchLeaderboard(
    type: 'individual' | 'city',
    timeframe: 'weekly' | 'monthly' | 'alltime',
    fetchFunction: () => Promise<LeaderboardEntry[]>
  ): Promise<LeaderboardEntry[]> {
    return this.leaderboardCache.getLeaderboard(type, timeframe, () =>
      this.queryOptimizer.executeQuery(
        `fetch_leaderboard_${type}_${timeframe}`,
        fetchFunction
      )
    );
  }

  /**
   * Prefetch data for better performance
   */
  async prefetchChallenges(
    challengeIds: string[],
    fetchFunction: (ids: string[]) => Promise<Challenge[]>
  ): Promise<void> {
    // Only prefetch uncached challenges
    const uncachedIds = challengeIds.filter(id => 
      !this.challengeCache.has(`challenge_${id}`)
    );

    if (uncachedIds.length > 0) {
      try {
        const challenges = await fetchFunction(uncachedIds);
        challenges.forEach(challenge => {
          this.challengeCache.set(`challenge_${challenge.id}`, challenge);
        });
      } catch (error) {
        // Prefetch failures shouldn't break the app
        console.warn('Prefetch failed:', error);
      }
    }
  }

  /**
   * Invalidate cached data
   */
  invalidateCache(type: 'challenge' | 'user' | 'leaderboard', key?: string): void {
    switch (type) {
      case 'challenge':
        if (key) {
          this.challengeCache.delete(`challenge_${key}`);
        } else {
          this.challengeCache.clear();
        }
        break;
      case 'user':
        if (key) {
          this.userProfileCache.delete(`profile_${key}`);
        } else {
          this.userProfileCache.clear();
        }
        break;
      case 'leaderboard':
        this.leaderboardCache.invalidateLeaderboards();
        break;
    }
  }

  /**
   * Get optimization statistics
   */
  getStats(): {
    queryOptimizer: ReturnType<QueryOptimizer['getStats']>;
    caches: {
      challenges: ReturnType<typeof this.challengeCache.getStats>;
      userProfiles: ReturnType<typeof this.userProfileCache.getStats>;
      leaderboards: ReturnType<typeof this.leaderboardCache.getStats>;
    };
    batchers: {
      challengeBatchSize: number;
      userProfileBatchSize: number;
    };
  } {
    return {
      queryOptimizer: this.queryOptimizer.getStats(),
      caches: {
        challenges: this.challengeCache.getStats(),
        userProfiles: this.userProfileCache.getStats(),
        leaderboards: this.leaderboardCache.getStats()
      },
      batchers: {
        challengeBatchSize: this.challengeBatcher.size(),
        userProfileBatchSize: this.userProfileBatcher.size()
      }
    };
  }
}

/**
 * Debounce function for reducing API call frequency
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout;
  let latestResolve: (value: ReturnType<T>) => void;
  let latestReject: (error: any) => void;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      latestResolve = resolve;
      latestReject = reject;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          latestResolve(result);
        } catch (error) {
          latestReject(error);
        }
      }, delay);
    });
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return (...args: Parameters<T>): ReturnType<T> | undefined => {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      return lastResult;
    }
    return lastResult;
  };
}

// Singleton instance
let optimizedDataFetcherInstance: OptimizedDataFetcher | null = null;

export function getOptimizedDataFetcher(): OptimizedDataFetcher {
  if (!optimizedDataFetcherInstance) {
    optimizedDataFetcherInstance = new OptimizedDataFetcher();
  }
  return optimizedDataFetcherInstance;
}

export function initializeOptimizedDataFetcher(): OptimizedDataFetcher {
  optimizedDataFetcherInstance = new OptimizedDataFetcher();
  return optimizedDataFetcherInstance;
}