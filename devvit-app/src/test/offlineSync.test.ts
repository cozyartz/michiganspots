/**
 * Unit tests for offline sync system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OfflineSyncService } from '../services/offlineSync.js';
import { LocalStorageService } from '../services/localStorage.js';
import { Challenge, UserProfile, Submission } from '../types/core.js';
import { Devvit } from '@devvit/public-api';

// Mock Devvit
vi.mock('@devvit/public-api', () => ({
  Devvit: {
    kvStore: {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn()
    }
  }
}));

// Mock navigator for network status
const mockNavigator = {
  onLine: true
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

// Mock window for event listeners
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

describe('OfflineSyncService', () => {
  let offlineSyncService: OfflineSyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigator.onLine = true;
    offlineSyncService = new OfflineSyncService();
  });

  afterEach(() => {
    offlineSyncService.destroy();
  });

  describe('Network Status Monitoring', () => {
    it('should detect online status', () => {
      const status = offlineSyncService.getSyncStatus();
      expect(status.isOnline).toBe(true);
    });

    it('should detect offline status', () => {
      mockNavigator.onLine = false;
      offlineSyncService.setOfflineMode(true);
      
      const status = offlineSyncService.getSyncStatus();
      expect(status.isOnline).toBe(false);
    });

    it('should setup network event listeners', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Challenge Management', () => {
    const mockChallenges: Challenge[] = [
      {
        id: 'challenge1',
        title: 'Test Challenge 1',
        description: 'Test description',
        partnerId: 'partner1',
        partnerName: 'Test Partner',
        difficulty: 'easy',
        points: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        location: {
          coordinates: { latitude: 42.3314, longitude: -83.0458 },
          address: '123 Test St',
          businessName: 'Test Business',
          verificationRadius: 100
        },
        proofRequirements: {
          types: ['photo'],
          instructions: 'Take a photo'
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should get challenges when online', async () => {
      // Mock API call
      vi.spyOn(offlineSyncService as any, 'fetchChallengesFromAPI')
        .mockResolvedValue(mockChallenges);

      const challenges = await offlineSyncService.getChallenges();
      
      expect(challenges).toEqual(mockChallenges);
    });

    it('should use cached challenges when offline', async () => {
      // Set offline mode
      offlineSyncService.setOfflineMode(true);
      
      // Mock cached data
      vi.spyOn(offlineSyncService as any, 'getCachedChallenges')
        .mockResolvedValue(mockChallenges);

      const challenges = await offlineSyncService.getChallenges();
      
      expect(challenges).toEqual(mockChallenges);
    });

    it('should fallback to cache when API fails', async () => {
      // Mock API failure
      vi.spyOn(offlineSyncService as any, 'fetchChallengesFromAPI')
        .mockRejectedValue(new Error('API Error'));
      
      // Mock cached data
      vi.spyOn(offlineSyncService as any, 'getCachedChallenges')
        .mockResolvedValue(mockChallenges);

      const challenges = await offlineSyncService.getChallenges();
      
      expect(challenges).toEqual(mockChallenges);
    });
  });

  describe('User Profile Management', () => {
    const mockProfile: UserProfile = {
      redditUsername: 'testuser',
      totalPoints: 100,
      completedChallenges: ['challenge1'],
      badges: [],
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      preferences: {
        notifications: true,
        leaderboardVisible: true,
        locationSharing: true
      },
      statistics: {
        totalSubmissions: 5,
        successfulSubmissions: 4,
        averageCompletionTime: 300,
        favoritePartners: ['partner1']
      }
    };

    it('should get user profile when online', async () => {
      vi.spyOn(offlineSyncService as any, 'fetchUserProfileFromAPI')
        .mockResolvedValue(mockProfile);

      const profile = await offlineSyncService.getUserProfile('testuser');
      
      expect(profile).toEqual(mockProfile);
    });

    it('should use cached profile when offline', async () => {
      offlineSyncService.setOfflineMode(true);
      
      vi.spyOn(offlineSyncService as any, 'getCachedUserProfile')
        .mockResolvedValue(mockProfile);

      const profile = await offlineSyncService.getUserProfile('testuser');
      
      expect(profile).toEqual(mockProfile);
    });

    it('should update profile and queue for sync when offline', async () => {
      offlineSyncService.setOfflineMode(true);
      
      const result = await offlineSyncService.updateUserProfile(mockProfile);
      
      expect(result.success).toBe(true);
      expect(result.queued).toBe(true);
      
      const status = offlineSyncService.getSyncStatus();
      expect(status.pendingItems).toBe(1);
    });
  });

  describe('Submission Management', () => {
    const mockSubmission: Submission = {
      id: 'submission1',
      challengeId: 'challenge1',
      userRedditUsername: 'testuser',
      proofType: 'photo',
      proofData: { imageUrl: 'test.jpg' },
      submittedAt: new Date(),
      verificationStatus: 'pending',
      gpsCoordinates: { latitude: 42.3314, longitude: -83.0458 },
      fraudRiskScore: 0.1
    };

    it('should submit proof immediately when online', async () => {
      vi.spyOn(offlineSyncService as any, 'submitProofToAPI')
        .mockResolvedValue(undefined);

      const result = await offlineSyncService.submitProof(mockSubmission);
      
      expect(result.success).toBe(true);
      expect(result.queued).toBeUndefined();
    });

    it('should queue submission when offline', async () => {
      offlineSyncService.setOfflineMode(true);
      
      const result = await offlineSyncService.submitProof(mockSubmission);
      
      expect(result.success).toBe(true);
      expect(result.queued).toBe(true);
      
      const status = offlineSyncService.getSyncStatus();
      expect(status.pendingItems).toBe(1);
    });

    it('should queue submission when API fails', async () => {
      vi.spyOn(offlineSyncService as any, 'submitProofToAPI')
        .mockRejectedValue(new Error('API Error'));

      const result = await offlineSyncService.submitProof(mockSubmission);
      
      expect(result.success).toBe(true);
      expect(result.queued).toBe(true);
    });
  });

  describe('Analytics Event Tracking', () => {
    const mockEvent = {
      eventType: 'view',
      challengeId: 'challenge1',
      userRedditUsername: 'testuser',
      timestamp: new Date().toISOString()
    };

    it('should send analytics event immediately when online', async () => {
      vi.spyOn(offlineSyncService as any, 'sendAnalyticsEventToAPI')
        .mockResolvedValue(undefined);

      const result = await offlineSyncService.trackAnalyticsEvent(mockEvent);
      
      expect(result.success).toBe(true);
      expect(result.queued).toBeUndefined();
    });

    it('should queue analytics event when offline', async () => {
      offlineSyncService.setOfflineMode(true);
      
      const result = await offlineSyncService.trackAnalyticsEvent(mockEvent);
      
      expect(result.success).toBe(true);
      expect(result.queued).toBe(true);
    });
  });

  describe('Sync Operations', () => {
    it('should not sync when offline', async () => {
      offlineSyncService.setOfflineMode(true);
      
      // Add item to queue
      await offlineSyncService.submitProof({
        id: 'test',
        challengeId: 'challenge1',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: {},
        submittedAt: new Date(),
        verificationStatus: 'pending',
        gpsCoordinates: { latitude: 0, longitude: 0 },
        fraudRiskScore: 0
      });

      // Try to sync
      await offlineSyncService.syncPendingData();
      
      // Should still have pending items
      const status = offlineSyncService.getSyncStatus();
      expect(status.pendingItems).toBe(1);
    });

    it('should sync when online and not already syncing', async () => {
      // Mock successful API calls
      vi.spyOn(offlineSyncService as any, 'submitProofToAPI')
        .mockResolvedValue(undefined);
      
      // Add item to queue while offline
      offlineSyncService.setOfflineMode(true);
      await offlineSyncService.submitProof({
        id: 'test',
        challengeId: 'challenge1',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: {},
        submittedAt: new Date(),
        verificationStatus: 'pending',
        gpsCoordinates: { latitude: 0, longitude: 0 },
        fraudRiskScore: 0
      });

      // Go back online and sync
      offlineSyncService.setOfflineMode(false);
      await offlineSyncService.syncPendingData();
      
      // Should have no pending items
      const status = offlineSyncService.getSyncStatus();
      expect(status.pendingItems).toBe(0);
    });

    it('should handle sync failures with retry logic', async () => {
      // Mock API failure then success
      vi.spyOn(offlineSyncService as any, 'submitProofToAPI')
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue(undefined);
      
      // Add item to queue
      await offlineSyncService.submitProof({
        id: 'test',
        challengeId: 'challenge1',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: {},
        submittedAt: new Date(),
        verificationStatus: 'pending',
        gpsCoordinates: { latitude: 0, longitude: 0 },
        fraudRiskScore: 0
      });

      // Sync should handle the failure and retry
      await offlineSyncService.syncPendingData();
      
      // Item should still be in queue for retry
      const status = offlineSyncService.getSyncStatus();
      expect(status.pendingItems).toBe(1);
    });
  });

  describe('Sync Status and Listeners', () => {
    it('should provide accurate sync status', () => {
      const status = offlineSyncService.getSyncStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isSyncing');
      expect(status).toHaveProperty('pendingItems');
      expect(status).toHaveProperty('lastSyncTime');
      expect(status).toHaveProperty('syncErrors');
    });

    it('should notify listeners of status changes', async () => {
      const listener = vi.fn();
      offlineSyncService.addSyncListener(listener);
      
      // Trigger status change
      offlineSyncService.setOfflineMode(true);
      
      // Add item to queue to trigger notification
      await offlineSyncService.submitProof({
        id: 'test',
        challengeId: 'challenge1',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: {},
        submittedAt: new Date(),
        verificationStatus: 'pending',
        gpsCoordinates: { latitude: 0, longitude: 0 },
        fraudRiskScore: 0
      });
      
      expect(listener).toHaveBeenCalled();
      
      offlineSyncService.removeSyncListener(listener);
    });

    it('should force sync when requested', async () => {
      vi.spyOn(offlineSyncService, 'syncPendingData');
      
      await offlineSyncService.forceSyncNow();
      
      expect(offlineSyncService.syncPendingData).toHaveBeenCalled();
    });
  });

  describe('Data Cleanup', () => {
    it('should clear all offline data', async () => {
      await offlineSyncService.clearOfflineData();
      
      const status = offlineSyncService.getSyncStatus();
      expect(status.pendingItems).toBe(0);
    });
  });
});

describe('LocalStorageService', () => {
  let localStorageService: LocalStorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageService = new LocalStorageService();
  });

  describe('Basic Storage Operations', () => {
    it('should store and retrieve data', async () => {
      const testData = { test: 'value', number: 42 };
      
      await localStorageService.setItem('test_key', testData);
      const retrieved = await localStorageService.getItem('test_key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await localStorageService.getItem('non_existent');
      expect(result).toBeNull();
    });

    it('should remove items correctly', async () => {
      await localStorageService.setItem('test_key', { test: 'data' });
      await localStorageService.removeItem('test_key');
      
      const result = await localStorageService.getItem('test_key');
      expect(result).toBeNull();
    });

    it('should check if item exists', async () => {
      await localStorageService.setItem('test_key', { test: 'data' });
      
      const exists = await localStorageService.hasItem('test_key');
      expect(exists).toBe(true);
      
      const notExists = await localStorageService.hasItem('non_existent');
      expect(notExists).toBe(false);
    });
  });

  describe('Data Integrity', () => {
    it('should verify data integrity with checksums', async () => {
      const testData = { important: 'data' };
      
      await localStorageService.setItem('test_key', testData);
      
      // Mock corrupted data
      const mockCorruptedData = JSON.stringify({
        data: { important: 'corrupted_data' },
        timestamp: Date.now(),
        version: '1.0.0',
        checksum: 'wrong_checksum'
      });
      
      vi.mocked(Devvit.kvStore.get).mockResolvedValue(mockCorruptedData);
      
      // Should detect corruption and return null
      await expect(localStorageService.getItem('test_key')).rejects.toThrow();
    });

    it('should handle version compatibility', async () => {
      const testData = { test: 'data' };
      
      // Mock data with incompatible version
      const mockIncompatibleData = JSON.stringify({
        data: testData,
        timestamp: Date.now(),
        version: '2.0.0', // Different major version
        checksum: 'test_checksum'
      });
      
      vi.mocked(Devvit.kvStore.get).mockResolvedValue(mockIncompatibleData);
      
      const result = await localStorageService.getItem('test_key');
      expect(result).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should handle expired items', async () => {
      await localStorageService.setItem('test_key', { test: 'data' }, { ttl: 1 });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = await localStorageService.getItem('test_key');
      expect(result).toBeNull();
    });

    it('should cleanup expired items', async () => {
      // Set item with short TTL
      await localStorageService.setItem('expired_key', { test: 'data' }, { ttl: 1 });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const cleanedCount = await localStorageService.cleanupExpiredItems();
      expect(cleanedCount).toBeGreaterThan(0);
    });
  });

  describe('Batch Operations', () => {
    it('should set multiple items', async () => {
      const items = [
        { key: 'key1', data: { value: 1 } },
        { key: 'key2', data: { value: 2 } },
        { key: 'key3', data: { value: 3 } }
      ];
      
      await localStorageService.setMultiple(items);
      
      const results = await localStorageService.getMultiple(['key1', 'key2', 'key3']);
      
      expect(results).toHaveLength(3);
      expect(results[0].data).toEqual({ value: 1 });
      expect(results[1].data).toEqual({ value: 2 });
      expect(results[2].data).toEqual({ value: 3 });
    });

    it('should handle partial failures in batch operations', async () => {
      const items = [
        { key: 'key1', data: { value: 1 } },
        { key: 'key2', data: { value: 2 } }
      ];
      
      // Mock one failure
      vi.mocked(Devvit.kvStore.put)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(localStorageService.setMultiple(items)).rejects.toThrow();
    });
  });

  describe('Game-Specific Storage', () => {
    const mockProfile: UserProfile = {
      redditUsername: 'testuser',
      totalPoints: 100,
      completedChallenges: [],
      badges: [],
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      preferences: {
        notifications: true,
        leaderboardVisible: true,
        locationSharing: true
      },
      statistics: {
        totalSubmissions: 0,
        successfulSubmissions: 0,
        averageCompletionTime: 0,
        favoritePartners: []
      }
    };

    it('should store and retrieve user progress', async () => {
      await localStorageService.storeUserProgress('testuser', mockProfile);
      const retrieved = await localStorageService.getUserProgress('testuser');
      
      expect(retrieved).toEqual(mockProfile);
    });

    it('should manage submission queue', async () => {
      const submissions: Submission[] = [
        {
          id: 'sub1',
          challengeId: 'challenge1',
          userRedditUsername: 'testuser',
          proofType: 'photo',
          proofData: {},
          submittedAt: new Date(),
          verificationStatus: 'pending',
          gpsCoordinates: { latitude: 0, longitude: 0 },
          fraudRiskScore: 0
        }
      ];
      
      await localStorageService.storeSubmissionQueue(submissions);
      const retrieved = await localStorageService.getSubmissionQueue();
      
      expect(retrieved).toEqual(submissions);
    });

    it('should add and remove from submission queue', async () => {
      const submission: Submission = {
        id: 'sub1',
        challengeId: 'challenge1',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: {},
        submittedAt: new Date(),
        verificationStatus: 'pending',
        gpsCoordinates: { latitude: 0, longitude: 0 },
        fraudRiskScore: 0
      };
      
      await localStorageService.addToSubmissionQueue(submission);
      let queue = await localStorageService.getSubmissionQueue();
      expect(queue).toHaveLength(1);
      
      await localStorageService.removeFromSubmissionQueue('sub1');
      queue = await localStorageService.getSubmissionQueue();
      expect(queue).toHaveLength(0);
    });

    it('should store cached challenges', async () => {
      const challenges: Challenge[] = [
        {
          id: 'challenge1',
          title: 'Test Challenge',
          description: 'Test',
          partnerId: 'partner1',
          partnerName: 'Test Partner',
          difficulty: 'easy',
          points: 10,
          startDate: new Date(),
          endDate: new Date(),
          location: {
            coordinates: { latitude: 0, longitude: 0 },
            address: 'Test Address',
            businessName: 'Test Business',
            verificationRadius: 100
          },
          proofRequirements: {
            types: ['photo'],
            instructions: 'Take a photo'
          },
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await localStorageService.storeCachedChallenges(challenges);
      const retrieved = await localStorageService.getCachedChallenges();
      
      expect(retrieved).toEqual(challenges);
    });
  });

  describe('Storage Optimization', () => {
    it('should provide storage quota information', async () => {
      const quota = await localStorageService.getStorageQuota();
      
      expect(quota).toHaveProperty('used');
      expect(quota).toHaveProperty('available');
      expect(quota).toHaveProperty('total');
      expect(typeof quota.used).toBe('number');
      expect(typeof quota.available).toBe('number');
      expect(typeof quota.total).toBe('number');
    });

    it('should optimize storage by cleaning up', async () => {
      await localStorageService.optimizeStorage();
      // Should complete without errors
    });
  });
});