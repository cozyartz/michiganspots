/**
 * Local storage service for user progress and submission queue
 */

import { Devvit } from '@devvit/public-api';
import { Challenge, UserProfile, Submission } from '../types/core.js';
import { ErrorType } from '../types/errors.js';
import { errorHandler } from './errorHandler.js';

export interface StorageQuota {
  used: number;
  available: number;
  total: number;
}

export interface StorageItem<T> {
  data: T;
  timestamp: number;
  version: string;
  checksum?: string;
}

export class LocalStorageService {
  private readonly VERSION = '1.0.0';
  private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit
  private readonly COMPRESSION_THRESHOLD = 1024; // Compress items larger than 1KB

  /**
   * Store data with versioning and integrity checks
   */
  async setItem<T>(key: string, data: T, options?: { compress?: boolean; ttl?: number }): Promise<void> {
    try {
      const storageItem: StorageItem<T> = {
        data,
        timestamp: Date.now(),
        version: this.VERSION,
        checksum: this.calculateChecksum(data)
      };

      let serialized = JSON.stringify(storageItem);

      // Compress if needed
      if (options?.compress || serialized.length > this.COMPRESSION_THRESHOLD) {
        serialized = await this.compress(serialized);
      }

      // Check storage quota
      await this.checkStorageQuota(serialized.length);

      // Store in Devvit KV
      await Devvit.kvStore.put(key, serialized);

      // Set TTL if specified
      if (options?.ttl) {
        await this.setTTL(key, options.ttl);
      }

    } catch (error) {
      throw errorHandler.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { key, dataSize: JSON.stringify(data).length }
      );
    }
  }

  /**
   * Get data with integrity verification
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const stored = await Devvit.kvStore.get(key);
      if (!stored) {
        return null;
      }

      // Check if item has expired
      if (await this.isExpired(key)) {
        await this.removeItem(key);
        return null;
      }

      let serialized = stored;

      // Decompress if needed
      if (this.isCompressed(serialized)) {
        serialized = await this.decompress(serialized);
      }

      const storageItem: StorageItem<T> = JSON.parse(serialized);

      // Verify integrity
      if (!this.verifyIntegrity(storageItem)) {
        console.warn(`Data integrity check failed for key: ${key}`);
        await this.removeItem(key);
        throw errorHandler.createError(ErrorType.DATA_CORRUPTION, undefined, { key });
      }

      // Check version compatibility
      if (!this.isVersionCompatible(storageItem.version)) {
        console.warn(`Version mismatch for key: ${key}. Expected: ${this.VERSION}, Got: ${storageItem.version}`);
        await this.removeItem(key);
        return null;
      }

      return storageItem.data;

    } catch (error) {
      if (error instanceof Error && 'type' in error) {
        throw error; // Re-throw GameError
      }
      
      throw errorHandler.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { key, operation: 'get' }
      );
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await Devvit.kvStore.delete(key);
      await Devvit.kvStore.delete(`${key}:ttl`);
    } catch (error) {
      throw errorHandler.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { key, operation: 'remove' }
      );
    }
  }

  /**
   * Check if key exists
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const stored = await Devvit.kvStore.get(key);
      return stored !== null && !(await this.isExpired(key));
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all keys with optional prefix filter
   */
  async getKeys(prefix?: string): Promise<string[]> {
    try {
      // Note: Devvit KV doesn't have a native keys() method
      // This would need to be implemented by maintaining a key index
      const keyIndex = await this.getItem<string[]>('__key_index__') || [];
      
      if (prefix) {
        return keyIndex.filter(key => key.startsWith(prefix));
      }
      
      return keyIndex;
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.getKeys();
      
      for (const key of keys) {
        await this.removeItem(key);
      }
      
      // Clear the key index
      await Devvit.kvStore.delete('__key_index__');
    } catch (error) {
      throw errorHandler.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { operation: 'clear' }
      );
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageQuota(): Promise<StorageQuota> {
    try {
      const keys = await this.getKeys();
      let used = 0;

      for (const key of keys) {
        const stored = await Devvit.kvStore.get(key);
        if (stored) {
          used += stored.length;
        }
      }

      return {
        used,
        available: this.MAX_STORAGE_SIZE - used,
        total: this.MAX_STORAGE_SIZE
      };
    } catch (error) {
      throw errorHandler.createError(
        ErrorType.STORAGE_ERROR,
        error as Error,
        { operation: 'quota_check' }
      );
    }
  }

  /**
   * Batch operations for better performance
   */
  async setMultiple<T>(items: Array<{ key: string; data: T; options?: { compress?: boolean; ttl?: number } }>): Promise<void> {
    const errors: Error[] = [];

    for (const item of items) {
      try {
        await this.setItem(item.key, item.data, item.options);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      throw errorHandler.createError(
        ErrorType.STORAGE_ERROR,
        new Error(`${errors.length} items failed to store`),
        { failedCount: errors.length, totalCount: items.length }
      );
    }
  }

  async getMultiple<T>(keys: string[]): Promise<Array<{ key: string; data: T | null }>> {
    const results: Array<{ key: string; data: T | null }> = [];

    for (const key of keys) {
      try {
        const data = await this.getItem<T>(key);
        results.push({ key, data });
      } catch (error) {
        console.error(`Failed to get item ${key}:`, error);
        results.push({ key, data: null });
      }
    }

    return results;
  }

  /**
   * Specialized methods for game data
   */

  /**
   * Store user progress
   */
  async storeUserProgress(userId: string, progress: UserProfile): Promise<void> {
    await this.setItem(`user_progress:${userId}`, progress, { compress: true });
    await this.updateKeyIndex(`user_progress:${userId}`);
  }

  /**
   * Get user progress
   */
  async getUserProgress(userId: string): Promise<UserProfile | null> {
    return this.getItem<UserProfile>(`user_progress:${userId}`);
  }

  /**
   * Store submission queue
   */
  async storeSubmissionQueue(submissions: Submission[]): Promise<void> {
    await this.setItem('submission_queue', submissions, { compress: true });
    await this.updateKeyIndex('submission_queue');
  }

  /**
   * Get submission queue
   */
  async getSubmissionQueue(): Promise<Submission[]> {
    return (await this.getItem<Submission[]>('submission_queue')) || [];
  }

  /**
   * Add submission to queue
   */
  async addToSubmissionQueue(submission: Submission): Promise<void> {
    const queue = await this.getSubmissionQueue();
    queue.push(submission);
    await this.storeSubmissionQueue(queue);
  }

  /**
   * Remove submission from queue
   */
  async removeFromSubmissionQueue(submissionId: string): Promise<void> {
    const queue = await this.getSubmissionQueue();
    const filtered = queue.filter(s => s.id !== submissionId);
    await this.storeSubmissionQueue(filtered);
  }

  /**
   * Store cached challenges
   */
  async storeCachedChallenges(challenges: Challenge[]): Promise<void> {
    await this.setItem('cached_challenges', challenges, { 
      compress: true, 
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    });
    await this.updateKeyIndex('cached_challenges');
  }

  /**
   * Get cached challenges
   */
  async getCachedChallenges(): Promise<Challenge[]> {
    return (await this.getItem<Challenge[]>('cached_challenges')) || [];
  }

  /**
   * Store analytics events queue
   */
  async storeAnalyticsQueue(events: any[]): Promise<void> {
    await this.setItem('analytics_queue', events, { compress: true });
    await this.updateKeyIndex('analytics_queue');
  }

  /**
   * Get analytics events queue
   */
  async getAnalyticsQueue(): Promise<any[]> {
    return (await this.getItem<any[]>('analytics_queue')) || [];
  }

  /**
   * Private utility methods
   */

  private calculateChecksum(data: any): string {
    // Simple checksum calculation (in production, use a proper hash function)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private verifyIntegrity<T>(storageItem: StorageItem<T>): boolean {
    if (!storageItem.checksum) {
      return true; // Skip verification if no checksum
    }
    
    const calculatedChecksum = this.calculateChecksum(storageItem.data);
    return calculatedChecksum === storageItem.checksum;
  }

  private isVersionCompatible(version: string): boolean {
    // Simple version compatibility check
    const [major] = version.split('.');
    const [currentMajor] = this.VERSION.split('.');
    return major === currentMajor;
  }

  private async compress(data: string): Promise<string> {
    // Simple compression placeholder (in production, use proper compression)
    return `compressed:${data}`;
  }

  private async decompress(data: string): Promise<string> {
    // Simple decompression placeholder
    if (data.startsWith('compressed:')) {
      return data.substring(11);
    }
    return data;
  }

  private isCompressed(data: string): boolean {
    return data.startsWith('compressed:');
  }

  private async setTTL(key: string, ttl: number): Promise<void> {
    const expiryTime = Date.now() + ttl;
    await Devvit.kvStore.put(`${key}:ttl`, expiryTime.toString());
  }

  private async isExpired(key: string): Promise<boolean> {
    try {
      const ttlStr = await Devvit.kvStore.get(`${key}:ttl`);
      if (!ttlStr) {
        return false; // No TTL set
      }
      
      const expiryTime = parseInt(ttlStr, 10);
      return Date.now() > expiryTime;
    } catch (error) {
      return false; // Assume not expired if we can't check
    }
  }

  private async checkStorageQuota(additionalSize: number): Promise<void> {
    const quota = await this.getStorageQuota();
    
    if (quota.used + additionalSize > quota.total) {
      throw errorHandler.createError(
        ErrorType.STORAGE_ERROR,
        new Error('Storage quota exceeded'),
        { 
          used: quota.used, 
          additional: additionalSize, 
          total: quota.total 
        }
      );
    }
  }

  private async updateKeyIndex(key: string): Promise<void> {
    try {
      const keyIndex = await this.getItem<string[]>('__key_index__') || [];
      
      if (!keyIndex.includes(key)) {
        keyIndex.push(key);
        await Devvit.kvStore.put('__key_index__', JSON.stringify({
          data: keyIndex,
          timestamp: Date.now(),
          version: this.VERSION
        }));
      }
    } catch (error) {
      console.error('Failed to update key index:', error);
    }
  }

  /**
   * Cleanup expired items
   */
  async cleanupExpiredItems(): Promise<number> {
    const keys = await this.getKeys();
    let cleanedCount = 0;

    for (const key of keys) {
      if (await this.isExpired(key)) {
        await this.removeItem(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Optimize storage by removing old data
   */
  async optimizeStorage(): Promise<void> {
    // Clean up expired items
    await this.cleanupExpiredItems();

    // Check if we're still over quota
    const quota = await this.getStorageQuota();
    
    if (quota.used > quota.total * 0.8) { // If using more than 80%
      console.warn('Storage usage high, consider clearing old data');
      
      // Could implement LRU eviction here
      // For now, just log the warning
    }
  }
}

// Global local storage service instance
export const localStorageService = new LocalStorageService();