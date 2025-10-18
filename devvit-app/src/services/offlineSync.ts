/**
 * Offline support and data synchronization service
 */

import { Devvit } from '@devvit/public-api';
import { Challenge, UserProfile, Submission } from '../types/core.js';
import { ErrorType, GameError } from '../types/errors.js';
import { errorHandler } from './errorHandler.js';
import { retryMechanism } from '../utils/retryMechanism.js';

export interface SyncQueueItem {
  id: string;
  type: 'submission' | 'profile_update' | 'analytics_event';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineData {
  challenges: Challenge[];
  userProfile: UserProfile | null;
  submissions: Submission[];
  leaderboard: any[];
  lastSync: Date;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
  lastSyncTime: Date | null;
  syncErrors: GameError[];
}

export class OfflineSyncService {
  private isOnline = true;
  private isSyncing = false;
  private syncQueue: SyncQueueItem[] = [];
  private offlineData: OfflineData | null = null;
  private syncListeners: ((status: SyncStatus) => void)[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeOfflineSupport();
    this.setupNetworkMonitoring();
    this.startPeriodicSync();
  }

  /**
   * Initialize offline support
   */
  private async initializeOfflineSupport(): Promise<void> {
    try {
      // Load offline data from storage
      await this.loadOfflineData();
      
      // Load sync queue from storage
      await this.loadSyncQueue();
      
      console.log('Offline support initialized');
    } catch (error) {
      console.error('Failed to initialize offline support:', error);
    }
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      // Initial state
      this.isOnline = navigator.onLine;

      // Listen for network changes
      window.addEventListener('online', () => {
        console.log('Network connection restored');
        this.isOnline = true;
        this.onNetworkRestore();
      });

      window.addEventListener('offline', () => {
        console.log('Network connection lost');
        this.isOnline = false;
        this.onNetworkLost();
      });
    }
  }

  /**
   * Start periodic sync when online
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        this.syncPendingData();
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Handle network restoration
   */
  private async onNetworkRestore(): Promise<void> {
    this.notifyListeners();
    
    // Start syncing pending data
    if (this.syncQueue.length > 0) {
      await this.syncPendingData();
    }
    
    // Refresh cached data
    await this.refreshOfflineData();
  }

  /**
   * Handle network loss
   */
  private onNetworkLost(): void {
    this.notifyListeners();
    console.log('Switched to offline mode');
  }

  /**
   * Get challenges (offline-first)
   */
  async getChallenges(): Promise<Challenge[]> {
    if (this.isOnline) {
      try {
        // Try to fetch fresh data
        const challenges = await this.fetchChallengesFromAPI();
        
        // Cache for offline use
        await this.cacheData('challenges', challenges);
        
        return challenges;
      } catch (error) {
        console.warn('Failed to fetch challenges online, using cached data');
        return this.getCachedChallenges();
      }
    } else {
      // Use cached data when offline
      return this.getCachedChallenges();
    }
  }

  /**
   * Get user profile (offline-first)
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (this.isOnline) {
      try {
        const profile = await this.fetchUserProfileFromAPI(userId);
        await this.cacheData('user_profile', profile);
        return profile;
      } catch (error) {
        console.warn('Failed to fetch profile online, using cached data');
        return this.getCachedUserProfile();
      }
    } else {
      return this.getCachedUserProfile();
    }
  }

  /**
   * Submit challenge proof (with offline queueing)
   */
  async submitProof(submission: Submission): Promise<{ success: boolean; queued?: boolean }> {
    if (this.isOnline) {
      try {
        // Try to submit immediately
        await this.submitProofToAPI(submission);
        return { success: true };
      } catch (error) {
        // Queue for later if submission fails
        await this.queueForSync('submission', submission);
        return { success: true, queued: true };
      }
    } else {
      // Queue for sync when back online
      await this.queueForSync('submission', submission);
      return { success: true, queued: true };
    }
  }

  /**
   * Update user profile (with offline queueing)
   */
  async updateUserProfile(profile: UserProfile): Promise<{ success: boolean; queued?: boolean }> {
    // Always update local cache
    await this.cacheData('user_profile', profile);

    if (this.isOnline) {
      try {
        await this.updateUserProfileAPI(profile);
        return { success: true };
      } catch (error) {
        await this.queueForSync('profile_update', profile);
        return { success: true, queued: true };
      }
    } else {
      await this.queueForSync('profile_update', profile);
      return { success: true, queued: true };
    }
  }

  /**
   * Track analytics event (with offline queueing)
   */
  async trackAnalyticsEvent(event: any): Promise<{ success: boolean; queued?: boolean }> {
    if (this.isOnline) {
      try {
        await this.sendAnalyticsEventToAPI(event);
        return { success: true };
      } catch (error) {
        await this.queueForSync('analytics_event', event);
        return { success: true, queued: true };
      }
    } else {
      await this.queueForSync('analytics_event', event);
      return { success: true, queued: true };
    }
  }

  /**
   * Queue item for synchronization
   */
  private async queueForSync(type: SyncQueueItem['type'], data: any): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: this.generateId(),
      type,
      data,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();
    this.notifyListeners();
  }

  /**
   * Sync all pending data
   */
  async syncPendingData(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    console.log(`Starting sync of ${this.syncQueue.length} items`);

    const itemsToSync = [...this.syncQueue];
    const syncErrors: GameError[] = [];

    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
        
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        // Increment retry count
        const queueItem = this.syncQueue.find(q => q.id === item.id);
        if (queueItem) {
          queueItem.retryCount++;
          
          // Remove if max retries exceeded
          if (queueItem.retryCount >= queueItem.maxRetries) {
            this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
            syncErrors.push(error as GameError);
          }
        }
      }
    }

    await this.saveSyncQueue();
    this.isSyncing = false;
    
    console.log(`Sync completed. ${this.syncQueue.length} items remaining`);
    this.notifyListeners();

    if (syncErrors.length > 0) {
      console.warn(`${syncErrors.length} items failed to sync after max retries`);
    }
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'submission':
        await retryMechanism.executeWithRetry(() => 
          this.submitProofToAPI(item.data)
        );
        break;
        
      case 'profile_update':
        await retryMechanism.executeWithRetry(() => 
          this.updateUserProfileAPI(item.data)
        );
        break;
        
      case 'analytics_event':
        await retryMechanism.executeWithRetry(() => 
          this.sendAnalyticsEventToAPI(item.data)
        );
        break;
        
      default:
        throw errorHandler.createError(ErrorType.UNKNOWN_ERROR, 
          new Error(`Unknown sync item type: ${item.type}`)
        );
    }
  }

  /**
   * Cache data for offline use
   */
  private async cacheData(key: string, data: any): Promise<void> {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };

      // Update in-memory cache
      if (!this.offlineData) {
        this.offlineData = {
          challenges: [],
          userProfile: null,
          submissions: [],
          leaderboard: [],
          lastSync: new Date()
        };
      }

      switch (key) {
        case 'challenges':
          this.offlineData.challenges = data;
          break;
        case 'user_profile':
          this.offlineData.userProfile = data;
          break;
        case 'leaderboard':
          this.offlineData.leaderboard = data;
          break;
      }

      this.offlineData.lastSync = new Date();

      // Persist to storage
      await Devvit.kvStore.put(`offline_cache:${key}`, JSON.stringify(cacheEntry));
      await this.saveOfflineData();
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Get cached challenges
   */
  private async getCachedChallenges(): Promise<Challenge[]> {
    if (this.offlineData?.challenges) {
      return this.offlineData.challenges;
    }

    try {
      const cached = await Devvit.kvStore.get('offline_cache:challenges');
      if (cached) {
        const { data } = JSON.parse(cached);
        return data || [];
      }
    } catch (error) {
      console.error('Failed to get cached challenges:', error);
    }

    return [];
  }

  /**
   * Get cached user profile
   */
  private async getCachedUserProfile(): Promise<UserProfile | null> {
    if (this.offlineData?.userProfile) {
      return this.offlineData.userProfile;
    }

    try {
      const cached = await Devvit.kvStore.get('offline_cache:user_profile');
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
    } catch (error) {
      console.error('Failed to get cached profile:', error);
    }

    return null;
  }

  /**
   * Load offline data from storage
   */
  private async loadOfflineData(): Promise<void> {
    try {
      const stored = await Devvit.kvStore.get('offline_data');
      if (stored) {
        this.offlineData = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  /**
   * Save offline data to storage
   */
  private async saveOfflineData(): Promise<void> {
    try {
      if (this.offlineData) {
        await Devvit.kvStore.put('offline_data', JSON.stringify(this.offlineData));
      }
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const stored = await Devvit.kvStore.get('sync_queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await Devvit.kvStore.put('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Refresh offline data when online
   */
  private async refreshOfflineData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Refresh challenges
      const challenges = await this.fetchChallengesFromAPI();
      await this.cacheData('challenges', challenges);

      // Refresh leaderboard
      const leaderboard = await this.fetchLeaderboardFromAPI();
      await this.cacheData('leaderboard', leaderboard);

      console.log('Offline data refreshed');
    } catch (error) {
      console.error('Failed to refresh offline data:', error);
    }
  }

  /**
   * API methods (to be implemented with actual API calls)
   */
  private async fetchChallengesFromAPI(): Promise<Challenge[]> {
    // Implementation would make actual API call
    throw new Error('API method not implemented');
  }

  private async fetchUserProfileFromAPI(userId: string): Promise<UserProfile> {
    // Implementation would make actual API call
    throw new Error('API method not implemented');
  }

  private async fetchLeaderboardFromAPI(): Promise<any[]> {
    // Implementation would make actual API call
    throw new Error('API method not implemented');
  }

  private async submitProofToAPI(submission: Submission): Promise<void> {
    // Implementation would make actual API call
    throw new Error('API method not implemented');
  }

  private async updateUserProfileAPI(profile: UserProfile): Promise<void> {
    // Implementation would make actual API call
    throw new Error('API method not implemented');
  }

  private async sendAnalyticsEventToAPI(event: any): Promise<void> {
    // Implementation would make actual API call
    throw new Error('API method not implemented');
  }

  /**
   * Utility methods
   */
  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API methods
   */
  
  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingItems: this.syncQueue.length,
      lastSyncTime: this.offlineData?.lastSync || null,
      syncErrors: []
    };
  }

  /**
   * Force sync now
   */
  async forceSyncNow(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingData();
    }
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    this.offlineData = null;
    this.syncQueue = [];
    
    try {
      await Devvit.kvStore.delete('offline_data');
      await Devvit.kvStore.delete('sync_queue');
      
      // Clear individual cache entries
      const cacheKeys = ['challenges', 'user_profile', 'leaderboard'];
      for (const key of cacheKeys) {
        await Devvit.kvStore.delete(`offline_cache:${key}`);
      }
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  /**
   * Force offline mode (for testing)
   */
  setOfflineMode(offline: boolean): void {
    this.isOnline = !offline;
  }

  /**
   * Add sync status listener
   */
  addSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove sync status listener
   */
  removeSyncListener(listener: (status: SyncStatus) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getSyncStatus();
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.syncListeners = [];
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onNetworkRestore);
      window.removeEventListener('offline', this.onNetworkLost);
    }
  }
}

// Global offline sync service instance
export const offlineSyncService = new OfflineSyncService();