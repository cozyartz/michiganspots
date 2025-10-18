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