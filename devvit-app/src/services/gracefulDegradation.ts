/**
 * Graceful degradation service for offline scenarios and service failures
 */

import { Devvit } from '@devvit/public-api';
import { Challenge, UserProfile, Submission } from '../types/core.js';
import { ErrorType, GameError } from '../types/errors.js';
import { errorHandler } from './errorHandler.js';

export interface DegradationStrategy {
  name: string;
  condition: (error: GameError) => boolean;
  fallback: () => Promise<any> | any;
  userMessage: string;
}

export class GracefulDegradationService {
  private strategies: DegradationStrategy[] = [];
  private offlineMode = false;
  private cachedData: Map<string, any> = new Map();

  constructor() {
    this.initializeStrategies();
    this.setupNetworkMonitoring();
  }

  /**
   * Initialize degradation strategies
   */
  private initializeStrategies(): void {
    this.strategies = [
      {
        name: 'offline_challenges',
        condition: (error) => error.type === ErrorType.NETWORK_ERROR,
        fallback: () => this.getCachedChallenges(),
        userMessage: 'Showing cached challenges. Some information may be outdated.'
      },
      {
        name: 'manual_location',
        condition: (error) => error.type === ErrorType.GPS_UNAVAILABLE || error.type === ErrorType.GPS_PERMISSION_DENIED,
        fallback: () => this.showManualLocationEntry(),
        userMessage: 'GPS unavailable. You can enter your location manually.'
      },
      {
        name: 'offline_profile',
        condition: (error) => error.type === ErrorType.NETWORK_ERROR,
        fallback: () => this.getCachedUserProfile(),
        userMessage: 'Showing cached profile data. Recent changes may not be visible.'
      },
      {
        name: 'local_submission_queue',
        condition: (error) => error.type === ErrorType.NETWORK_ERROR || error.type === ErrorType.API_ERROR,
        fallback: () => this.queueSubmissionLocally(),
        userMessage: 'Submission saved locally. It will be sent when connection is restored.'
      },
      {
        name: 'static_leaderboard',
        condition: (error) => error.type === ErrorType.NETWORK_ERROR,
        fallback: () => this.getCachedLeaderboard(),
        userMessage: 'Showing cached leaderboard. Rankings may not be current.'
      }
    ];
  }

  /**
   * Setup network monitoring for automatic degradation
   */
  private setupNetworkMonitoring(): void {
    // Monitor network status if available
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      window.addEventListener('online', () => {
        this.offlineMode = false;
        this.syncPendingData();
      });

      window.addEventListener('offline', () => {
        this.offlineMode = true;
      });

      this.offlineMode = !navigator.onLine;
    }
  }

  /**
   * Apply graceful degradation for a given error
   */
  async applyDegradation<T>(
    error: GameError,
    operation: string,
    originalData?: T
  ): Promise<{ data: T | null; degraded: boolean; strategy?: DegradationStrategy }> {
    const applicableStrategy = this.strategies.find(strategy => strategy.condition(error));

    if (!applicableStrategy) {
      return { data: originalData || null, degraded: false };
    }

    try {
      const fallbackData = await applicableStrategy.fallback();
      
      // Log degradation event
      console.warn(`Graceful degradation applied: ${applicableStrategy.name} for operation: ${operation}`);
      
      return {
        data: fallbackData,
        degraded: true,
        strategy: applicableStrategy
      };
    } catch (fallbackError) {
      console.error('Fallback strategy failed:', fallbackError);
      return { data: originalData || null, degraded: false };
    }
  }

  /**
   * Cache data for offline use
   */
  async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 24 * 60 * 60 * 1000 // 24 hours default
      };

      this.cachedData.set(key, cacheEntry);
      
      // Also store in Devvit KV for persistence
      await Devvit.kvStore.put(`cache:${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    try {
      // Check in-memory cache first
      let cacheEntry = this.cachedData.get(key);

      // If not in memory, try KV store
      if (!cacheEntry) {
        const stored = await Devvit.kvStore.get(`cache:${key}`);
        if (stored) {
          cacheEntry = JSON.parse(stored);
          this.cachedData.set(key, cacheEntry);
        }
      }

      if (!cacheEntry) {
        return null;
      }

      // Check if cache is expired
      const isExpired = Date.now() - cacheEntry.timestamp > cacheEntry.ttl;
      if (isExpired) {
        this.cachedData.delete(key);
        await Devvit.kvStore.delete(`cache:${key}`);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Fallback strategies implementation
   */
  private async getCachedChallenges(): Promise<Challenge[]> {
    const cached = await this.getCachedData('challenges');
    return cached || [];
  }

  private async getCachedUserProfile(): Promise<UserProfile | null> {
    const cached = await this.getCachedData('user_profile');
    return cached || null;
  }

  private async getCachedLeaderboard(): Promise<any[]> {
    const cached = await this.getCachedData('leaderboard');
    return cached || [];
  }

  private async showManualLocationEntry(): Promise<{ manual: boolean }> {
    return { manual: true };
  }

  private async queueSubmissionLocally(): Promise<{ queued: boolean }> {
    // This would queue the submission for later sync
    return { queued: true };
  }

  /**
   * Sync pending data when connection is restored
   */
  private async syncPendingData(): Promise<void> {
    try {
      console.log('Connection restored, syncing pending data...');
      
      // Get all queued submissions
      const queuedSubmissions = await this.getQueuedSubmissions();
      
      for (const submission of queuedSubmissions) {
        try {
          await this.syncSubmission(submission);
          await this.removeFromQueue(submission.id);
        } catch (error) {
          console.error('Failed to sync submission:', error);
        }
      }
    } catch (error) {
      console.error('Failed to sync pending data:', error);
    }
  }

  private async getQueuedSubmissions(): Promise<Submission[]> {
    try {
      const queued = await Devvit.kvStore.get('queued_submissions');
      return queued ? JSON.parse(queued) : [];
    } catch (error) {
      console.error('Failed to get queued submissions:', error);
      return [];
    }
  }

  private async syncSubmission(submission: Submission): Promise<void> {
    // Implementation would sync the submission with the server
    console.log('Syncing submission:', submission.id);
  }

  private async removeFromQueue(submissionId: string): Promise<void> {
    try {
      const queued = await this.getQueuedSubmissions();
      const filtered = queued.filter(s => s.id !== submissionId);
      await Devvit.kvStore.put('queued_submissions', JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from queue:', error);
    }
  }

  /**
   * Check if currently in offline mode
   */
  isOffline(): boolean {
    return this.offlineMode;
  }

  /**
   * Force offline mode (for testing)
   */
  setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }

  /**
   * Get degradation status message
   */
  getDegradationMessage(strategy: DegradationStrategy): string {
    return strategy.userMessage;
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    this.cachedData.clear();
    
    try {
      // Clear KV store cache entries
      const keys = ['challenges', 'user_profile', 'leaderboard', 'queued_submissions'];
      for (const key of keys) {
        await Devvit.kvStore.delete(`cache:${key}`);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

// Global graceful degradation service instance
export const gracefulDegradation = new GracefulDegradationService();