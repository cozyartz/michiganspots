/**
 * Unit tests for error handling system
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ErrorHandler } from '../services/errorHandler.js';
import { GracefulDegradationService } from '../services/gracefulDegradation.js';
import { RetryMechanism, CircuitBreaker, CircuitState } from '../utils/retryMechanism.js';
import { ErrorType, ErrorSeverity, GameError } from '../types/errors.js';

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

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    vi.clearAllMocks();
  });

  describe('createError', () => {
    it('should create a GameError with correct properties', () => {
      const error = errorHandler.createError(ErrorType.GPS_UNAVAILABLE);

      expect(error.type).toBe(ErrorType.GPS_UNAVAILABLE);
      expect(error.userMessage).toBe('Location services are not available. Please enable GPS or try manual location entry.');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoverable).toBe(true);
      expect(error.retryable).toBe(false);
      expect(error.correlationId).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should include original error details', () => {
      const originalError = new Error('GPS timeout');
      const error = errorHandler.createError(ErrorType.GPS_UNAVAILABLE, originalError);

      expect(error.message).toBe('GPS timeout');
      expect(error.stack).toBe(originalError.stack);
    });

    it('should include context information', () => {
      const context = {
        userId: 'user123',
        challengeId: 'challenge456',
        additionalData: { attempt: 1 }
      };

      const error = errorHandler.createError(ErrorType.NETWORK_ERROR, undefined, context);

      expect(error.context).toEqual({ attempt: 1 });
    });
  });

  describe('handleError', () => {
    it('should handle GameError objects', async () => {
      const gameError: GameError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network failed',
        userMessage: 'Connection failed',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: true,
        timestamp: new Date()
      };

      const result = await errorHandler.handleError(gameError);
      expect(result).toBe(gameError);
    });

    it('should classify unknown errors', async () => {
      const networkError = new Error('Network failed');
      (networkError as any).name = 'NetworkError';

      const result = await errorHandler.handleError(networkError);

      expect(result.type).toBe(ErrorType.NETWORK_ERROR);
      expect(result.retryable).toBe(true);
    });

    it('should classify HTTP errors correctly', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).status = 401;

      const result = await errorHandler.handleError(authError);

      expect(result.type).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await errorHandler.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      // Mock the error classification
      vi.spyOn(errorHandler as any, 'classifyError').mockReturnValue({
        type: ErrorType.NETWORK_ERROR,
        retryable: true,
        severity: ErrorSeverity.MEDIUM
      });

      const result = await errorHandler.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Auth error'));

      vi.spyOn(errorHandler as any, 'classifyError').mockReturnValue({
        type: ErrorType.AUTHENTICATION_ERROR,
        retryable: false,
        severity: ErrorSeverity.HIGH
      });

      await expect(errorHandler.executeWithRetry(operation)).rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));

      vi.spyOn(errorHandler as any, 'classifyError').mockReturnValue({
        type: ErrorType.NETWORK_ERROR,
        retryable: true,
        severity: ErrorSeverity.MEDIUM
      });

      await expect(errorHandler.executeWithRetry(operation, undefined, { maxAttempts: 2 }))
        .rejects.toThrow();
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRecoveryActions', () => {
    it('should return appropriate actions for GPS errors', () => {
      const error: GameError = {
        type: ErrorType.GPS_UNAVAILABLE,
        message: 'GPS unavailable',
        userMessage: 'GPS unavailable',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: false,
        timestamp: new Date()
      };

      const actions = errorHandler.getRecoveryActions(error);

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('manual');
      expect(actions[0].label).toBe('Enter Location Manually');
    });

    it('should return retry action for retryable errors', () => {
      const error: GameError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        userMessage: 'Network error',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: true,
        timestamp: new Date()
      };

      const actions = errorHandler.getRecoveryActions(error);

      expect(actions.some(action => action.type === 'retry')).toBe(true);
    });
  });
});

describe('GracefulDegradationService', () => {
  let degradationService: GracefulDegradationService;

  beforeEach(() => {
    degradationService = new GracefulDegradationService();
    vi.clearAllMocks();
  });

  describe('applyDegradation', () => {
    it('should apply appropriate strategy for network errors', async () => {
      const error: GameError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network failed',
        userMessage: 'Network failed',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: true,
        timestamp: new Date()
      };

      const result = await degradationService.applyDegradation(error, 'loadChallenges');

      expect(result.degraded).toBe(true);
      expect(result.strategy?.name).toBe('offline_challenges');
    });

    it('should return original data when no strategy applies', async () => {
      const error: GameError = {
        type: ErrorType.AUTHENTICATION_ERROR,
        message: 'Auth failed',
        userMessage: 'Auth failed',
        severity: ErrorSeverity.HIGH,
        recoverable: false,
        retryable: false,
        timestamp: new Date()
      };

      const originalData = { test: 'data' };
      const result = await degradationService.applyDegradation(error, 'loadData', originalData);

      expect(result.degraded).toBe(false);
      expect(result.data).toBe(originalData);
    });
  });

  describe('cacheData and getCachedData', () => {
    it('should cache and retrieve data correctly', async () => {
      const testData = { challenges: ['challenge1', 'challenge2'] };

      await degradationService.cacheData('test_key', testData);
      const retrieved = await degradationService.getCachedData('test_key');

      expect(retrieved).toEqual(testData);
    });

    it('should return null for expired cache', async () => {
      const testData = { test: 'data' };

      await degradationService.cacheData('test_key', testData, 1); // 1ms TTL
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for expiration

      const retrieved = await degradationService.getCachedData('test_key');

      expect(retrieved).toBeNull();
    });
  });

  describe('offline mode', () => {
    it('should track offline status', () => {
      expect(degradationService.isOffline()).toBe(false);

      degradationService.setOfflineMode(true);
      expect(degradationService.isOffline()).toBe(true);

      degradationService.setOfflineMode(false);
      expect(degradationService.isOffline()).toBe(false);
    });
  });
});

describe('RetryMechanism', () => {
  let retryMechanism: RetryMechanism;

  beforeEach(() => {
    retryMechanism = new RetryMechanism();
    vi.clearAllMocks();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryMechanism.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(Object.assign(new Error('Network error'), { name: 'NetworkError' }))
        .mockResolvedValue('success');

      const result = await retryMechanism.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(Object.assign(new Error('Network error'), { name: 'NetworkError' }))
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      await retryMechanism.executeWithRetry(operation, { onRetry });

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should respect custom shouldRetry function', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Custom error'));
      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(retryMechanism.executeWithRetry(operation, { shouldRetry }))
        .rejects.toThrow('Custom error');

      expect(operation).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('retryBatch', () => {
    it('should handle mixed success and failure results', async () => {
      const operations = [
        vi.fn().mockResolvedValue('success1'),
        vi.fn().mockRejectedValue(new Error('failure')),
        vi.fn().mockResolvedValue('success2')
      ];

      const results = await retryMechanism.retryBatch(operations);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe('success1');
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeInstanceOf(Error);
      expect(results[2].success).toBe(true);
      expect(results[2].result).toBe('success2');
    });
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 500
    });
  });

  it('should start in closed state', () => {
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should open after failure threshold', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('failure'));

    // Trigger failures to reach threshold
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation);
      } catch (e) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
  });

  it('should reject immediately when open', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('failure'));

    // Trigger failures to open circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation);
      } catch (e) {
        // Expected to fail
      }
    }

    // Next call should be rejected immediately
    await expect(circuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is open');
    expect(operation).toHaveBeenCalledTimes(3); // Should not be called again
  });

  it('should transition to half-open after timeout', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('failure'));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation);
      } catch (e) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Next operation should transition to half-open
    operation.mockResolvedValueOnce('success');
    const result = await circuitBreaker.execute(operation);

    expect(result).toBe('success');
    expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
  });

  it('should close after successful operations in half-open state', async () => {
    const operation = vi.fn();

    // Open the circuit
    operation.mockRejectedValue(new Error('failure'));
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(operation);
      } catch (e) {
        // Expected to fail
      }
    }

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Succeed 3 times to close circuit
    operation.mockResolvedValue('success');
    for (let i = 0; i < 3; i++) {
      await circuitBreaker.execute(operation);
    }

    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should reset state correctly', () => {
    circuitBreaker.reset();
    expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
  });
});

describe('Error Classification', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  it('should classify GPS errors correctly', () => {
    const gpsError = new Error('GPS unavailable');
    (gpsError as any).code = 2; // POSITION_UNAVAILABLE

    const classified = (errorHandler as any).classifyError(gpsError);

    expect(classified.type).toBe(ErrorType.GPS_UNAVAILABLE);
  });

  it('should classify HTTP status codes correctly', () => {
    const httpError = new Error('Server error');
    (httpError as any).status = 500;

    const classified = (errorHandler as any).classifyError(httpError);

    expect(classified.type).toBe(ErrorType.API_ERROR);
  });

  it('should classify storage errors correctly', () => {
    const storageError = new Error('Quota exceeded');
    storageError.name = 'QuotaExceededError';

    const classified = (errorHandler as any).classifyError(storageError);

    expect(classified.type).toBe(ErrorType.STORAGE_ERROR);
  });
});

describe('Error Recovery Actions', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  it('should provide manual location entry for GPS errors', () => {
    const gpsError: GameError = {
      type: ErrorType.GPS_UNAVAILABLE,
      message: 'GPS unavailable',
      userMessage: 'GPS unavailable',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: false,
      timestamp: new Date()
    };

    const actions = errorHandler.getRecoveryActions(gpsError);
    const manualAction = actions.find(a => a.type === 'manual');

    expect(manualAction).toBeDefined();
    expect(manualAction?.label).toBe('Enter Location Manually');
  });

  it('should provide retry and offline options for network errors', () => {
    const networkError: GameError = {
      type: ErrorType.NETWORK_ERROR,
      message: 'Network failed',
      userMessage: 'Network failed',
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
      retryable: true,
      timestamp: new Date()
    };

    const actions = errorHandler.getRecoveryActions(networkError);

    expect(actions.some(a => a.type === 'retry')).toBe(true);
    expect(actions.some(a => a.type === 'fallback')).toBe(true);
  });

  it('should provide login redirect for auth errors', () => {
    const authError: GameError = {
      type: ErrorType.AUTHENTICATION_ERROR,
      message: 'Auth failed',
      userMessage: 'Auth failed',
      severity: ErrorSeverity.HIGH,
      recoverable: false,
      retryable: false,
      timestamp: new Date()
    };

    const actions = errorHandler.getRecoveryActions(authError);
    const loginAction = actions.find(a => a.type === 'redirect');

    expect(loginAction).toBeDefined();
    expect(loginAction?.label).toBe('Log In Again');
  });
});

describe('Comprehensive Error Classification and User Messages', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('GPS Error Classification', () => {
    it('should classify GPS permission denied errors', () => {
      const gpsError = new Error('User denied geolocation');
      (gpsError as any).code = 1; // PERMISSION_DENIED

      const classified = (errorHandler as any).classifyError(gpsError);

      expect(classified.type).toBe(ErrorType.GPS_PERMISSION_DENIED);
      expect(classified.userMessage).toContain('Location permission is required');
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.recoverable).toBe(true);
    });

    it('should classify GPS unavailable errors', () => {
      const gpsError = new Error('Position unavailable');
      (gpsError as any).code = 2; // POSITION_UNAVAILABLE

      const classified = (errorHandler as any).classifyError(gpsError);

      expect(classified.type).toBe(ErrorType.GPS_UNAVAILABLE);
      expect(classified.userMessage).toContain('Location services are not available');
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should classify GPS timeout errors', () => {
      const gpsError = new Error('GPS timeout');
      (gpsError as any).code = 3; // TIMEOUT

      const classified = (errorHandler as any).classifyError(gpsError);

      expect(classified.type).toBe(ErrorType.TIMEOUT_ERROR);
      expect(classified.userMessage).toContain('taking too long');
      expect(classified.retryable).toBe(true);
    });
  });

  describe('Network Error Classification', () => {
    it('should classify network connection errors', () => {
      const networkError = new Error('Network connection failed');
      networkError.name = 'NetworkError';

      const classified = (errorHandler as any).classifyError(networkError);

      expect(classified.type).toBe(ErrorType.NETWORK_ERROR);
      expect(classified.userMessage).toContain('check your internet connection');
      expect(classified.retryable).toBe(true);
    });

    it('should classify timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';

      const classified = (errorHandler as any).classifyError(timeoutError);

      expect(classified.type).toBe(ErrorType.TIMEOUT_ERROR);
      expect(classified.userMessage).toContain('taking too long');
      expect(classified.retryable).toBe(true);
    });

    it('should classify rate limiting errors', () => {
      const rateLimitError = new Error('Too many requests');
      (rateLimitError as any).status = 429;

      const classified = (errorHandler as any).classifyError(rateLimitError);

      expect(classified.type).toBe(ErrorType.RATE_LIMITED);
      expect(classified.userMessage).toContain('doing that too often');
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('Authentication Error Classification', () => {
    it('should classify 401 errors as authentication errors', () => {
      const authError = new Error('Unauthorized');
      (authError as any).status = 401;

      const classified = (errorHandler as any).classifyError(authError);

      expect(classified.type).toBe(ErrorType.AUTHENTICATION_ERROR);
      expect(classified.userMessage).toContain('log in again');
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.retryable).toBe(false);
    });

    it('should classify 403 errors as authorization errors', () => {
      const authzError = new Error('Forbidden');
      (authzError as any).status = 403;

      const classified = (errorHandler as any).classifyError(authzError);

      expect(classified.type).toBe(ErrorType.AUTHORIZATION_ERROR);
      expect(classified.userMessage).toContain('don\'t have permission');
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('Storage Error Classification', () => {
    it('should classify quota exceeded errors', () => {
      const storageError = new Error('Storage quota exceeded');
      storageError.name = 'QuotaExceededError';

      const classified = (errorHandler as any).classifyError(storageError);

      expect(classified.type).toBe(ErrorType.STORAGE_ERROR);
      expect(classified.userMessage).toContain('save your progress');
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should classify validation errors', () => {
      const validationError = new Error('Invalid data format');
      validationError.name = 'ValidationError';

      const classified = (errorHandler as any).classifyError(validationError);

      expect(classified.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(classified.userMessage).toContain('not valid');
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('Server Error Classification', () => {
    it('should classify 5xx errors as API errors', () => {
      const serverError = new Error('Internal server error');
      (serverError as any).status = 500;

      const classified = (errorHandler as any).classifyError(serverError);

      expect(classified.type).toBe(ErrorType.API_ERROR);
      expect(classified.userMessage).toContain('Something went wrong on our end');
      expect(classified.severity).toBe(ErrorSeverity.HIGH);
      expect(classified.retryable).toBe(true);
    });
  });

  describe('User Message Generation', () => {
    it('should generate appropriate user messages for all error types', () => {
      const errorTypes = Object.values(ErrorType);
      
      errorTypes.forEach(errorType => {
        const error = errorHandler.createError(errorType);
        
        expect(error.userMessage).toBeDefined();
        expect(error.userMessage.length).toBeGreaterThan(0);
        expect(error.userMessage).not.toContain('undefined');
        expect(error.userMessage).not.toContain('null');
        
        // User messages should be user-friendly, not technical
        expect(error.userMessage).not.toMatch(/Error|Exception|Stack|Trace/i);
      });
    });

    it('should provide actionable user messages', () => {
      const gpsError = errorHandler.createError(ErrorType.GPS_UNAVAILABLE);
      expect(gpsError.userMessage).toMatch(/enable|try|manual/i);

      const networkError = errorHandler.createError(ErrorType.NETWORK_ERROR);
      expect(networkError.userMessage).toMatch(/check|connection|try again/i);

      const authError = errorHandler.createError(ErrorType.AUTHENTICATION_ERROR);
      expect(authError.userMessage).toMatch(/log in|login/i);
    });
  });
});

describe('Offline Mode and Data Sync Testing', () => {
  let degradationService: GracefulDegradationService;

  beforeEach(() => {
    degradationService = new GracefulDegradationService();
    vi.clearAllMocks();
  });

  describe('Offline Mode Detection', () => {
    it('should detect offline mode correctly', () => {
      expect(degradationService.isOffline()).toBe(false);
      
      degradationService.setOfflineMode(true);
      expect(degradationService.isOffline()).toBe(true);
      
      degradationService.setOfflineMode(false);
      expect(degradationService.isOffline()).toBe(false);
    });

    it('should apply offline strategies when network is unavailable', async () => {
      const networkError: GameError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network failed',
        userMessage: 'Network failed',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: true,
        timestamp: new Date()
      };

      const result = await degradationService.applyDegradation(networkError, 'loadChallenges');

      expect(result.degraded).toBe(true);
      expect(result.strategy?.name).toBe('offline_challenges');
      expect(result.strategy?.userMessage).toContain('cached challenges');
    });

    it('should apply GPS fallback strategies', async () => {
      const gpsError: GameError = {
        type: ErrorType.GPS_UNAVAILABLE,
        message: 'GPS unavailable',
        userMessage: 'GPS unavailable',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: false,
        timestamp: new Date()
      };

      const result = await degradationService.applyDegradation(gpsError, 'getLocation');

      expect(result.degraded).toBe(true);
      expect(result.strategy?.name).toBe('manual_location');
      expect(result.strategy?.userMessage).toContain('enter your location manually');
    });
  });

  describe('Data Caching and Retrieval', () => {
    it('should cache data with TTL', async () => {
      const testData = { challenges: ['challenge1', 'challenge2'] };
      const ttl = 5000; // 5 seconds

      await degradationService.cacheData('test_challenges', testData, ttl);
      
      // Should retrieve immediately
      const retrieved = await degradationService.getCachedData('test_challenges');
      expect(retrieved).toEqual(testData);
    });

    it('should handle cache expiration', async () => {
      const testData = { test: 'data' };
      const shortTtl = 1; // 1ms

      await degradationService.cacheData('short_lived', testData, shortTtl);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const retrieved = await degradationService.getCachedData('short_lived');
      expect(retrieved).toBeNull();
    });

    it('should handle cache storage failures gracefully', async () => {
      // Import Devvit from the mock
      const { Devvit } = await import('@devvit/public-api');
      
      // Mock KV store failure
      vi.mocked(Devvit.kvStore.put).mockRejectedValue(new Error('Storage failed'));
      
      const testData = { test: 'data' };
      
      // Should not throw error
      await expect(degradationService.cacheData('test_key', testData)).resolves.not.toThrow();
    });

    it('should handle cache retrieval failures gracefully', async () => {
      // Import Devvit from the mock
      const { Devvit } = await import('@devvit/public-api');
      
      // Mock KV store failure
      vi.mocked(Devvit.kvStore.get).mockRejectedValue(new Error('Retrieval failed'));
      
      const result = await degradationService.getCachedData('test_key');
      expect(result).toBeNull();
    });
  });

  describe('Fallback Strategy Execution', () => {
    it('should execute fallback strategies without errors', async () => {
      const strategies = [
        { error: ErrorType.NETWORK_ERROR, operation: 'loadChallenges' },
        { error: ErrorType.GPS_UNAVAILABLE, operation: 'getLocation' },
        { error: ErrorType.API_ERROR, operation: 'submitProof' }
      ];

      for (const { error, operation } of strategies) {
        const gameError: GameError = {
          type: error,
          message: 'Test error',
          userMessage: 'Test error',
          severity: ErrorSeverity.MEDIUM,
          recoverable: true,
          retryable: true,
          timestamp: new Date()
        };

        const result = await degradationService.applyDegradation(gameError, operation);
        
        if (result.degraded) {
          expect(result.strategy).toBeDefined();
          expect(result.strategy?.userMessage).toBeDefined();
          expect(result.data).toBeDefined();
        }
      }
    });

    it('should handle fallback strategy failures', async () => {
      const networkError: GameError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network failed',
        userMessage: 'Network failed',
        severity: ErrorSeverity.MEDIUM,
        recoverable: true,
        retryable: true,
        timestamp: new Date()
      };

      // Mock fallback failure
      vi.spyOn(degradationService as any, 'getCachedChallenges')
        .mockRejectedValue(new Error('Fallback failed'));

      const result = await degradationService.applyDegradation(networkError, 'loadChallenges');
      
      // Should handle fallback failure gracefully
      expect(result.degraded).toBe(false);
      expect(result.data).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should clear all cached data', async () => {
      // Add some cached data
      await degradationService.cacheData('test1', { data: 'test1' });
      await degradationService.cacheData('test2', { data: 'test2' });
      
      // Clear cache
      await degradationService.clearCache();
      
      // Should return null for all cached items
      const result1 = await degradationService.getCachedData('test1');
      const result2 = await degradationService.getCachedData('test2');
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });
});

describe('Retry Mechanisms and Graceful Degradation', () => {
  let retryMechanism: RetryMechanism;

  beforeEach(() => {
    retryMechanism = new RetryMechanism();
    vi.clearAllMocks();
  });

  describe('Exponential Backoff', () => {
    it('should implement exponential backoff correctly', async () => {
      const delays: number[] = [];
      const operation = vi.fn().mockRejectedValue(Object.assign(new Error('Network error'), { name: 'NetworkError' }));
      
      // Mock sleep to capture delays
      vi.spyOn(retryMechanism as any, 'sleep').mockImplementation((ms: number) => {
        delays.push(ms);
        return Promise.resolve();
      });

      try {
        await retryMechanism.executeWithRetry(operation, {
          maxAttempts: 3,
          baseDelay: 1000,
          backoffMultiplier: 2
        });
      } catch (e) {
        // Expected to fail
      }

      expect(delays).toHaveLength(2); // 2 retries
      expect(delays[0]).toBeGreaterThanOrEqual(1000); // First retry >= base delay
      expect(delays[1]).toBeGreaterThanOrEqual(2000); // Second retry >= base delay * 2
    });

    it('should respect maximum delay', async () => {
      const delays: number[] = [];
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));
      
      vi.spyOn(retryMechanism as any, 'sleep').mockImplementation((ms: number) => {
        delays.push(ms);
        return Promise.resolve();
      });

      try {
        await retryMechanism.executeWithRetry(operation, {
          maxAttempts: 5,
          baseDelay: 1000,
          backoffMultiplier: 3,
          maxDelay: 5000
        });
      } catch (e) {
        // Expected to fail
      }

      // All delays should be <= maxDelay
      delays.forEach(delay => {
        expect(delay).toBeLessThanOrEqual(5000);
      });
    });

    it('should add jitter to prevent thundering herd', async () => {
      const delays: number[] = [];
      const operation = vi.fn().mockRejectedValue(Object.assign(new Error('Network error'), { name: 'NetworkError' }));
      
      vi.spyOn(retryMechanism as any, 'sleep').mockImplementation((ms: number) => {
        delays.push(ms);
        return Promise.resolve();
      });

      // Run multiple times to check for jitter
      for (let i = 0; i < 3; i++) {
        try {
          await retryMechanism.executeWithRetry(operation, {
            maxAttempts: 2,
            baseDelay: 1000
          });
        } catch (e) {
          // Expected to fail
        }
      }

      // Should have at least some delays recorded
      expect(delays.length).toBeGreaterThan(0);
      
      // Check that delays are in expected range (with jitter they should vary)
      delays.forEach(delay => {
        expect(delay).toBeGreaterThan(900); // Should be close to base delay with jitter
        expect(delay).toBeLessThan(1200); // Should not be too far from base delay
      });
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should open circuit after failure threshold', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      const circuitKey = 'test-service';

      // Trigger failures to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await retryMechanism.executeWithCircuitBreaker(operation, circuitKey);
        } catch (e) {
          // Expected to fail
        }
      }

      const state = retryMechanism.getCircuitBreakerStatus(circuitKey);
      expect(state).toBe(CircuitState.OPEN);
    });

    it('should reject immediately when circuit is open', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Service unavailable'));
      const circuitKey = 'test-service-2';

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await retryMechanism.executeWithCircuitBreaker(operation, circuitKey);
        } catch (e) {
          // Expected to fail
        }
      }

      // Next call should be rejected immediately
      const startTime = Date.now();
      try {
        await retryMechanism.executeWithCircuitBreaker(operation, circuitKey);
      } catch (e) {
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(100); // Should fail quickly
      }
    });

    it('should reset circuit breaker', () => {
      const circuitKey = 'test-service-reset';
      
      retryMechanism.resetCircuitBreaker(circuitKey);
      const state = retryMechanism.getCircuitBreakerStatus(circuitKey);
      
      // Should be null if circuit doesn't exist or closed if it does
      expect(state === null || state === CircuitState.CLOSED).toBe(true);
    });
  });

  describe('Batch Operations with Retry', () => {
    it('should handle mixed success and failure in batch operations', async () => {
      const operations = [
        vi.fn().mockResolvedValue('success1'),
        vi.fn().mockRejectedValue(new Error('failure')),
        vi.fn().mockResolvedValue('success2'),
        vi.fn()
          .mockRejectedValueOnce(Object.assign(new Error('temp failure'), { name: 'NetworkError' }))
          .mockResolvedValue('success after retry')
      ];

      const results = await retryMechanism.retryBatch(operations, {
        maxAttempts: 2
      });

      expect(results).toHaveLength(4);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe('success1');
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
      expect(results[2].result).toBe('success2');
      expect(results[3].success).toBe(true);
      expect(results[3].result).toBe('success after retry');
    });
  });

  describe('Custom Retry Logic', () => {
    it('should respect custom shouldRetry function', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Retryable error'))
        .mockRejectedValueOnce(new Error('Non-retryable error'))
        .mockResolvedValue('success');

      const shouldRetry = vi.fn()
        .mockReturnValueOnce(true)  // First error is retryable
        .mockReturnValueOnce(false); // Second error is not retryable

      try {
        await retryMechanism.executeWithRetry(operation, {
          maxAttempts: 3,
          shouldRetry
        });
      } catch (e) {
        expect((e as Error).message).toBe('Non-retryable error');
      }

      expect(operation).toHaveBeenCalledTimes(2);
      expect(shouldRetry).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback with correct parameters', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(Object.assign(new Error('First failure'), { name: 'NetworkError' }))
        .mockRejectedValueOnce(Object.assign(new Error('Second failure'), { name: 'NetworkError' }))
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      await retryMechanism.executeWithRetry(operation, {
        maxAttempts: 3,
        onRetry
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.objectContaining({
        message: 'First failure'
      }));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.objectContaining({
        message: 'Second failure'
      }));
    });
  });

  describe('Error Type Specific Retry Logic', () => {
    it('should retry network errors', () => {
      const networkError = new Error('Network failed');
      networkError.name = 'NetworkError';

      const isRetryable = (retryMechanism as any).isRetryableError(
        networkError, 
        [ErrorType.NETWORK_ERROR, ErrorType.API_ERROR]
      );

      expect(isRetryable).toBe(true);
    });

    it('should retry timeout errors', () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';

      const isRetryable = (retryMechanism as any).isRetryableError(
        timeoutError,
        [ErrorType.TIMEOUT_ERROR]
      );

      expect(isRetryable).toBe(true);
    });

    it('should retry 5xx HTTP errors', () => {
      const serverError = new Error('Server error');
      (serverError as any).status = 500;

      const isRetryable = (retryMechanism as any).isRetryableError(
        serverError,
        [ErrorType.API_ERROR]
      );

      expect(isRetryable).toBe(true);
    });

    it('should not retry 4xx HTTP errors (except 408, 429)', () => {
      const clientError = new Error('Bad request');
      (clientError as any).status = 400;

      const isRetryable = (retryMechanism as any).isRetryableError(
        clientError,
        [ErrorType.API_ERROR]
      );

      expect(isRetryable).toBe(false);
    });

    it('should retry 408 and 429 HTTP errors', () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).status = 408;

      const rateLimitError = new Error('Rate limited');
      (rateLimitError as any).status = 429;

      const isTimeoutRetryable = (retryMechanism as any).isRetryableError(
        timeoutError,
        [ErrorType.TIMEOUT_ERROR]
      );

      const isRateLimitRetryable = (retryMechanism as any).isRetryableError(
        rateLimitError,
        [ErrorType.RATE_LIMITED]
      );

      expect(isTimeoutRetryable).toBe(true);
      expect(isRateLimitRetryable).toBe(true);
    });
  });
});

describe('Integration: Error Handling with Offline Sync', () => {
  let errorHandler: ErrorHandler;
  let degradationService: GracefulDegradationService;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    degradationService = new GracefulDegradationService();
    vi.clearAllMocks();
  });

  it('should handle network errors with graceful degradation', async () => {
    const networkError = new Error('Network connection failed');
    networkError.name = 'NetworkError';

    // Classify the error
    const gameError = await errorHandler.handleError(networkError);
    expect(gameError.type).toBe(ErrorType.NETWORK_ERROR);

    // Apply graceful degradation
    const degradationResult = await degradationService.applyDegradation(
      gameError, 
      'loadChallenges'
    );

    expect(degradationResult.degraded).toBe(true);
    expect(degradationResult.strategy?.name).toBe('offline_challenges');

    // Get recovery actions
    const actions = errorHandler.getRecoveryActions(gameError);
    expect(actions.some(a => a.type === 'retry')).toBe(true);
    expect(actions.some(a => a.type === 'fallback')).toBe(true);
  });

  it('should handle GPS errors with manual fallback', async () => {
    const gpsError = new Error('GPS unavailable');
    (gpsError as any).code = 2;

    const gameError = await errorHandler.handleError(gpsError);
    expect(gameError.type).toBe(ErrorType.GPS_UNAVAILABLE);

    const degradationResult = await degradationService.applyDegradation(
      gameError,
      'getLocation'
    );

    expect(degradationResult.degraded).toBe(true);
    expect(degradationResult.strategy?.name).toBe('manual_location');

    const actions = errorHandler.getRecoveryActions(gameError);
    expect(actions.some(a => a.type === 'manual')).toBe(true);
  });

  it('should provide comprehensive error context for debugging', async () => {
    const context = {
      userId: 'user123',
      challengeId: 'challenge456',
      component: 'ChallengeDetail',
      operation: 'submitProof',
      additionalData: { attempt: 2, gpsAccuracy: 50 }
    };

    const error = errorHandler.createError(
      ErrorType.LOCATION_TOO_FAR,
      new Error('User too far from location'),
      context
    );

    expect(error.correlationId).toBeDefined();
    expect(error.context).toEqual(context.additionalData);
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.userMessage).toContain('100 meters');
  });
});