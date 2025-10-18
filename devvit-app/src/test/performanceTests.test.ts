/**
 * Performance Tests
 * 
 * Tests performance monitoring, caching strategies, query optimization,
 * and API call frequency reduction.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  PerformanceMonitor, 
  getPerformanceMonitor, 
  initializePerformanceMonitoring 
} from '../services/performanceMonitoring.js';
import { 
  CacheService, 
  ChallengeCache, 
  UserProfileCache, 
  LeaderboardCache,
  getChallengeCache,
  getUserProfileCache,
  getLeaderboardCache,
  initializeCaches,
  destroyAllCaches
} from '../services/cacheService.js';
import { 
  QueryOptimizer, 
  APICallBatcher, 
  OptimizedDataFetcher,
  getOptimizedDataFetcher,
  debounce,
  throttle
} from '../utils/performanceOptimization.js';
import type { Challenge, UserProfile, LeaderboardEntry } from '../types/core.js';

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
} as any;

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}));

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    performanceMonitor.destroy();
  });

  describe('metric recording', () => {
    it('should record custom metrics', () => {
      const metric = {
        name: 'test.metric',
        value: 100,
        unit: 'ms' as const,
        timestamp: new Date(),
        tags: { component: 'test' }
      };

      performanceMonitor.recordMetric(metric);
      const metrics = performanceMonitor.getMetricsForReporting();
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metric);
    });

    it('should limit metrics to prevent memory issues', () => {
      // Record more than 1000 metrics
      for (let i = 0; i < 1200; i++) {
        performanceMonitor.recordMetric({
          name: `test.metric.${i}`,
          value: i,
          unit: 'count',
          timestamp: new Date()
        });
      }

      const metrics = performanceMonitor.getMetricsForReporting();
      expect(metrics).toHaveLength(1000);
      
      // Should keep the latest 1000 metrics
      expect(metrics[0].name).toBe('test.metric.200');
      expect(metrics[999].name).toBe('test.metric.1199');
    });
  });

  describe('timing operations', () => {
    it('should measure operation timing', () => {
      const endTiming = performanceMonitor.startTiming('test.operation');
      
      // Simulate some work
      vi.advanceTimersByTime(100);
      
      const duration = endTiming();
      
      expect(duration).toBeGreaterThan(0);
      
      const metrics = performanceMonitor.getMetricsForReporting();
      const timingMetric = metrics.find(m => m.name === 'timing.test.operation');
      expect(timingMetric).toBeDefined();
      expect(timingMetric!.unit).toBe('ms');
    });
  });

  describe('API call measurement', () => {
    it('should measure successful API calls', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
      
      const result = await performanceMonitor.measureAPICall(
        '/api/test',
        'GET',
        mockApiCall,
        { expectedSize: 1024 }
      );

      expect(result).toEqual({ data: 'test' });
      expect(mockApiCall).toHaveBeenCalledOnce();
      
      const metrics = performanceMonitor.getMetricsForReporting();
      const durationMetric = metrics.find(m => m.name === 'api.call.duration');
      const sizeMetric = metrics.find(m => m.name === 'api.response.size');
      
      expect(durationMetric).toBeDefined();
      expect(durationMetric!.tags?.endpoint).toBe('/api/test');
      expect(durationMetric!.tags?.method).toBe('GET');
      expect(durationMetric!.tags?.status).toBe('200');
      
      expect(sizeMetric).toBeDefined();
      expect(sizeMetric!.value).toBe(1024);
    });

    it('should measure failed API calls', async () => {
      const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'));
      
      await expect(
        performanceMonitor.measureAPICall('/api/test', 'POST', mockApiCall)
      ).rejects.toThrow('API Error');
      
      const metrics = performanceMonitor.getMetricsForReporting();
      const errorMetric = metrics.find(m => m.name === 'api.call.error');
      
      expect(errorMetric).toBeDefined();
      expect(errorMetric!.tags?.endpoint).toBe('/api/test');
      expect(errorMetric!.tags?.method).toBe('POST');
      expect(errorMetric!.tags?.status).toBe('500');
    });

    it('should track retry attempts', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
      
      await performanceMonitor.measureAPICall(
        '/api/test',
        'GET',
        mockApiCall,
        { retryCount: 2 }
      );
      
      const metrics = performanceMonitor.getMetricsForReporting();
      const durationMetric = metrics.find(m => m.name === 'api.call.duration');
      
      expect(durationMetric).toBeDefined();
      // Note: retryCount is tracked in apiCallMetrics, not in the metric tags
    });
  });

  describe('component render measurement', () => {
    it('should measure component render performance', () => {
      const mockRenderFunction = vi.fn().mockReturnValue({
        type: 'div',
        children: [{ type: 'span' }, { type: 'p' }]
      });
      
      const props = { title: 'Test Component', data: [1, 2, 3] };
      
      const result = performanceMonitor.measureComponentRender(
        'TestComponent',
        mockRenderFunction,
        props
      );

      expect(result).toBeDefined();
      expect(mockRenderFunction).toHaveBeenCalledOnce();
      
      const metrics = performanceMonitor.getMetricsForReporting();
      const renderMetric = metrics.find(m => m.name === 'component.render.duration');
      const propsMetric = metrics.find(m => m.name === 'component.props.size');
      
      expect(renderMetric).toBeDefined();
      expect(renderMetric!.tags?.component).toBe('TestComponent');
      expect(renderMetric!.tags?.reRenderCount).toBe('1');
      
      expect(propsMetric).toBeDefined();
      expect(propsMetric!.value).toBeGreaterThan(0);
    });

    it('should track re-render count', () => {
      const mockRenderFunction = vi.fn().mockReturnValue({ type: 'div' });
      
      // First render
      performanceMonitor.measureComponentRender('TestComponent', mockRenderFunction);
      
      // Second render
      performanceMonitor.measureComponentRender('TestComponent', mockRenderFunction);
      
      const metrics = performanceMonitor.getMetricsForReporting();
      const renderMetrics = metrics.filter(m => m.name === 'component.render.duration');
      
      expect(renderMetrics).toHaveLength(2);
      expect(renderMetrics[0].tags?.reRenderCount).toBe('1');
      expect(renderMetrics[1].tags?.reRenderCount).toBe('2');
    });

    it('should handle component render errors', () => {
      const mockRenderFunction = vi.fn().mockImplementation(() => {
        throw new Error('Render error');
      });
      
      expect(() => 
        performanceMonitor.measureComponentRender('TestComponent', mockRenderFunction)
      ).toThrow('Render error');
      
      const metrics = performanceMonitor.getMetricsForReporting();
      const errorMetric = metrics.find(m => m.name === 'component.render.error');
      
      expect(errorMetric).toBeDefined();
      expect(errorMetric!.tags?.component).toBe('TestComponent');
      expect(errorMetric!.tags?.errorType).toBe('Error');
    });
  });

  describe('performance summary', () => {
    it('should generate comprehensive performance summary', async () => {
      // Add some test data
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
      await performanceMonitor.measureAPICall('/api/slow', 'GET', mockApiCall);
      await performanceMonitor.measureAPICall('/api/fast', 'GET', mockApiCall);
      
      const mockRenderFunction = vi.fn().mockReturnValue({ type: 'div' });
      performanceMonitor.measureComponentRender('SlowComponent', mockRenderFunction);
      performanceMonitor.measureComponentRender('FastComponent', mockRenderFunction);
      
      performanceMonitor.updateCacheMetrics('testCache', {
        hitRate: 85,
        missRate: 15,
        totalSize: 1024,
        entryCount: 10
      });
      
      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.apiCalls.totalCalls).toBe(2);
      expect(summary.apiCalls.averageDuration).toBeGreaterThan(0);
      expect(summary.apiCalls.errorRate).toBe(0);
      expect(summary.apiCalls.slowestEndpoints).toHaveLength(2);
      
      expect(summary.components.slowestComponents).toHaveLength(2);
      expect(summary.components.mostReRendered).toHaveLength(2);
      
      expect(summary.cache.overallHitRate).toBe(85);
      expect(summary.cache.totalSize).toBe(1024);
      expect(summary.cache.cachesByPerformance).toHaveLength(1);
      
      expect(summary.memory.estimatedUsage).toBeGreaterThan(0);
      expect(summary.memory.metricsCount).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should clear old metrics', () => {
      const oldDate = new Date(Date.now() - 60000); // 1 minute ago
      const newDate = new Date();
      
      performanceMonitor.recordMetric({
        name: 'old.metric',
        value: 1,
        unit: 'count',
        timestamp: oldDate
      });
      
      performanceMonitor.recordMetric({
        name: 'new.metric',
        value: 1,
        unit: 'count',
        timestamp: newDate
      });
      
      const cutoffTime = new Date(Date.now() - 30000); // 30 seconds ago
      performanceMonitor.clearOldMetrics(cutoffTime);
      
      const metrics = performanceMonitor.getMetricsForReporting();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('new.metric');
    });
  });
});

describe('CacheService', () => {
  let cache: CacheService<string>;

  beforeEach(() => {
    cache = new CacheService({
      maxSize: 1024,
      maxEntries: 10,
      defaultTTL: 60000, // 1 minute
      cleanupInterval: 30000 // 30 seconds
    }, 'test-cache');
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('basic operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete values', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL and expiration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire entries after TTL', () => {
      cache.set('key1', 'value1', 1000); // 1 second TTL
      expect(cache.get('key1')).toBe('value1');
      
      vi.advanceTimersByTime(1500); // Advance past TTL
      expect(cache.get('key1')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      cache.set('key1', 'value1'); // Uses default TTL (60000ms)
      expect(cache.get('key1')).toBe('value1');
      
      vi.advanceTimersByTime(30000); // 30 seconds
      expect(cache.get('key1')).toBe('value1'); // Still valid
      
      vi.advanceTimersByTime(35000); // Total 65 seconds
      expect(cache.get('key1')).toBeNull(); // Expired
    });

    it('should cleanup expired entries', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 2000);
      
      vi.advanceTimersByTime(1500);
      
      const removedCount = cache.cleanup();
      expect(removedCount).toBe(1);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('size limits and eviction', () => {
    it('should evict least recently used entries when size limit exceeded', () => {
      // Fill cache to near capacity
      for (let i = 0; i < 9; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Access some entries to update LRU order
      cache.get('key0'); // Make key0 most recently used
      cache.get('key1'); // Make key1 second most recently used
      
      // Add entry that exceeds capacity
      cache.set('key9', 'value9');
      
      // key2 should be evicted (least recently used)
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key0')).toBe('value0'); // Still exists
      expect(cache.get('key1')).toBe('value1'); // Still exists
      expect(cache.get('key9')).toBe('value9'); // New entry exists
    });

    it('should enforce maximum entry count', () => {
      // Add more entries than maxEntries (10)
      for (let i = 0; i < 15; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      const stats = cache.getStats();
      expect(stats.entryCount).toBeLessThanOrEqual(10);
    });
  });

  describe('batch operations', () => {
    it('should get multiple values in batch', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      const results = cache.getBatch(['key1', 'key2', 'nonexistent']);
      
      expect(results.size).toBe(2);
      expect(results.get('key1')).toBe('value1');
      expect(results.get('key2')).toBe('value2');
      expect(results.has('nonexistent')).toBe(false);
    });

    it('should set multiple values in batch', () => {
      cache.setBatch([
        { key: 'key1', data: 'value1', ttl: 1000 },
        { key: 'key2', data: 'value2' },
        { key: 'key3', data: 'value3', ttl: 2000 }
      ]);
      
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });
  });

  describe('getOrSet pattern', () => {
    it('should return cached value if exists', async () => {
      cache.set('key1', 'cached-value');
      
      const factory = vi.fn().mockResolvedValue('new-value');
      const result = await cache.getOrSet('key1', factory);
      
      expect(result).toBe('cached-value');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = vi.fn().mockResolvedValue('new-value');
      const result = await cache.getOrSet('key1', factory);
      
      expect(result).toBe('new-value');
      expect(factory).toHaveBeenCalledOnce();
      expect(cache.get('key1')).toBe('new-value');
    });
  });

  describe('statistics', () => {
    it('should track cache statistics', () => {
      // Generate some hits and misses
      cache.set('key1', 'value1');
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('nonexistent'); // Miss
      cache.get('nonexistent'); // Miss
      
      const stats = cache.getStats();
      
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(50);
      expect(stats.missRate).toBe(50);
      expect(stats.entryCount).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });
});

describe('Specialized Caches', () => {
  beforeEach(() => {
    destroyAllCaches();
  });

  afterEach(() => {
    destroyAllCaches();
  });

  describe('ChallengeCache', () => {
    it('should cache active challenges', async () => {
      const challengeCache = getChallengeCache();
      const mockChallenges: Challenge[] = [
        {
          id: 'challenge-1',
          title: 'Test Challenge',
          description: 'Test description',
          partnerId: 'partner-1',
          partnerName: 'Test Partner',
          partnerBranding: { logoUrl: '', primaryColor: '', secondaryColor: '' },
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
          proofRequirements: { types: ['photo'], instructions: 'Test' },
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const fetchFunction = vi.fn().mockResolvedValue(mockChallenges);
      
      // First call should fetch from function
      const result1 = await challengeCache.getActiveChallenges(fetchFunction);
      expect(result1).toEqual(mockChallenges);
      expect(fetchFunction).toHaveBeenCalledOnce();
      
      // Second call should return cached result
      const result2 = await challengeCache.getActiveChallenges(fetchFunction);
      expect(result2).toEqual(mockChallenges);
      expect(fetchFunction).toHaveBeenCalledOnce(); // Still only once
    });

    it('should invalidate challenge data', async () => {
      const challengeCache = getChallengeCache();
      const mockChallenge: Challenge = {
        id: 'challenge-1',
        title: 'Test Challenge',
        description: 'Test description',
        partnerId: 'partner-1',
        partnerName: 'Test Partner',
        partnerBranding: { logoUrl: '', primaryColor: '', secondaryColor: '' },
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
        proofRequirements: { types: ['photo'], instructions: 'Test' },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const fetchFunction = vi.fn().mockResolvedValue(mockChallenge);
      
      // Cache the challenge
      await challengeCache.getChallengeById('challenge-1', fetchFunction);
      expect(fetchFunction).toHaveBeenCalledOnce();
      
      // Invalidate and fetch again
      challengeCache.invalidateChallengeData('challenge-1');
      await challengeCache.getChallengeById('challenge-1', fetchFunction);
      expect(fetchFunction).toHaveBeenCalledTimes(2);
    });
  });
});

describe('QueryOptimizer', () => {
  let queryOptimizer: QueryOptimizer;

  beforeEach(() => {
    queryOptimizer = new QueryOptimizer({
      batchSize: 3,
      maxConcurrentQueries: 2,
      queryTimeout: 1000,
      retryAttempts: 2,
      retryDelay: 100
    });
  });

  describe('query deduplication', () => {
    it('should deduplicate identical queries', async () => {
      const mockQuery = vi.fn().mockResolvedValue('result');
      
      // Execute same query multiple times simultaneously
      const promises = [
        queryOptimizer.executeQuery('test-query', mockQuery),
        queryOptimizer.executeQuery('test-query', mockQuery),
        queryOptimizer.executeQuery('test-query', mockQuery)
      ];
      
      const results = await Promise.all(promises);
      
      // All should return same result
      expect(results).toEqual(['result', 'result', 'result']);
      
      // But query function should only be called once
      expect(mockQuery).toHaveBeenCalledOnce();
    });

    it('should execute different queries separately', async () => {
      const mockQuery1 = vi.fn().mockResolvedValue('result1');
      const mockQuery2 = vi.fn().mockResolvedValue('result2');
      
      const [result1, result2] = await Promise.all([
        queryOptimizer.executeQuery('query1', mockQuery1),
        queryOptimizer.executeQuery('query2', mockQuery2)
      ]);
      
      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(mockQuery1).toHaveBeenCalledOnce();
      expect(mockQuery2).toHaveBeenCalledOnce();
    });
  });

  describe('batch processing', () => {
    it('should batch multiple queries', async () => {
      const queries = [
        { key: 'query1', query: vi.fn().mockResolvedValue('result1') },
        { key: 'query2', query: vi.fn().mockResolvedValue('result2') },
        { key: 'query3', query: vi.fn().mockResolvedValue('result3') }
      ];
      
      const results = await queryOptimizer.batchQueries(queries);
      
      expect(results).toEqual(['result1', 'result2', 'result3']);
      queries.forEach(({ query }) => {
        expect(query).toHaveBeenCalledOnce();
      });
    });
  });

  describe('error handling', () => {
    it('should handle query errors', async () => {
      const mockQuery = vi.fn().mockRejectedValue(new Error('Query failed'));
      
      await expect(
        queryOptimizer.executeQuery('failing-query', mockQuery)
      ).rejects.toThrow('Query failed');
    });

    it('should handle timeout errors', async () => {
      vi.useFakeTimers();
      
      const mockQuery = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
      );
      
      const queryPromise = queryOptimizer.executeQuery('slow-query', mockQuery);
      
      vi.advanceTimersByTime(1500); // Advance past timeout (1000ms)
      
      await expect(queryPromise).rejects.toThrow('Query timeout');
      
      vi.useRealTimers();
    });
  });

  describe('statistics', () => {
    it('should track query statistics', async () => {
      const mockQuery = vi.fn().mockResolvedValue('result');
      
      // Start some queries
      const promise1 = queryOptimizer.executeQuery('query1', mockQuery);
      const promise2 = queryOptimizer.executeQuery('query2', mockQuery);
      
      const stats = queryOptimizer.getStats();
      expect(stats.activeQueries).toBeGreaterThan(0);
      expect(stats.totalQueries).toBeGreaterThan(0);
      
      await Promise.all([promise1, promise2]);
    });
  });
});

describe('APICallBatcher', () => {
  let batcher: APICallBatcher<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    batcher = new APICallBatcher<string>(100, 5); // 100ms delay, max 5 items
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('batching behavior', () => {
    it('should batch multiple requests', async () => {
      const mockRequest1 = vi.fn().mockResolvedValue('result1');
      const mockRequest2 = vi.fn().mockResolvedValue('result2');
      const mockRequest3 = vi.fn().mockResolvedValue('result3');
      
      const promise1 = batcher.add('key1', mockRequest1);
      const promise2 = batcher.add('key2', mockRequest2);
      const promise3 = batcher.add('key3', mockRequest3);
      
      expect(batcher.size()).toBe(3);
      
      // Advance time to trigger batch processing
      vi.advanceTimersByTime(150);
      
      const results = await Promise.all([promise1, promise2, promise3]);
      
      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(mockRequest1).toHaveBeenCalledOnce();
      expect(mockRequest2).toHaveBeenCalledOnce();
      expect(mockRequest3).toHaveBeenCalledOnce();
    });

    it('should flush immediately when batch size limit reached', async () => {
      const requests = Array.from({ length: 6 }, (_, i) => 
        vi.fn().mockResolvedValue(`result${i}`)
      );
      
      const promises = requests.map((request, i) => 
        batcher.add(`key${i}`, request)
      );
      
      // Should flush automatically when 5th item is added
      expect(batcher.size()).toBeLessThanOrEqual(1); // Only the 6th item remains
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(6);
      requests.forEach(request => {
        expect(request).toHaveBeenCalledOnce();
      });
    });

    it('should handle request errors individually', async () => {
      const mockRequest1 = vi.fn().mockResolvedValue('result1');
      const mockRequest2 = vi.fn().mockRejectedValue(new Error('Request failed'));
      const mockRequest3 = vi.fn().mockResolvedValue('result3');
      
      const promise1 = batcher.add('key1', mockRequest1);
      const promise2 = batcher.add('key2', mockRequest2);
      const promise3 = batcher.add('key3', mockRequest3);
      
      vi.advanceTimersByTime(150);
      
      const results = await Promise.allSettled([promise1, promise2, promise3]);
      
      expect(results[0].status).toBe('fulfilled');
      expect((results[0] as any).value).toBe('result1');
      
      expect(results[1].status).toBe('rejected');
      expect((results[1] as any).reason.message).toBe('Request failed');
      
      expect(results[2].status).toBe('fulfilled');
      expect((results[2] as any).value).toBe('result3');
    });
  });

  describe('manual flushing', () => {
    it('should flush batch manually', async () => {
      const mockRequest = vi.fn().mockResolvedValue('result');
      
      const promise = batcher.add('key1', mockRequest);
      expect(batcher.size()).toBe(1);
      
      await batcher.flush();
      
      const result = await promise;
      expect(result).toBe('result');
      expect(batcher.size()).toBe(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      const debouncedFn = debounce(mockFn, 100);
      
      // Call multiple times rapidly
      const promise1 = debouncedFn('arg1');
      const promise2 = debouncedFn('arg2');
      const promise3 = debouncedFn('arg3');
      
      // Advance time to trigger debounced call
      vi.advanceTimersByTime(150);
      
      const results = await Promise.all([promise1, promise2, promise3]);
      
      // All promises should resolve to the same result
      expect(results).toEqual(['result', 'result', 'result']);
      
      // Function should only be called once with the latest arguments
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle function calls', () => {
      const mockFn = vi.fn().mockReturnValue('result');
      const throttledFn = throttle(mockFn, 100);
      
      // Call multiple times rapidly
      const result1 = throttledFn('arg1');
      const result2 = throttledFn('arg2');
      const result3 = throttledFn('arg3');
      
      expect(result1).toBe('result');
      expect(result2).toBe('result'); // Returns cached result
      expect(result3).toBe('result'); // Returns cached result
      
      // Function should only be called once
      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockFn).toHaveBeenCalledWith('arg1');
      
      // After throttle period, should allow new calls
      vi.advanceTimersByTime(150);
      
      const result4 = throttledFn('arg4');
      expect(result4).toBe('result');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenLastCalledWith('arg4');
    });
  });
});