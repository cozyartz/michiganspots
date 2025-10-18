/**
 * Retry mechanism utilities for transient failures
 */

import { ErrorType, GameError, RetryConfig } from '../types/errors.js';
import { errorHandler } from '../services/errorHandler.js';

export interface RetryOptions extends Partial<RetryConfig> {
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Circuit breaker implementation to prevent cascading failures
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw errorHandler.createError(ErrorType.API_ERROR, new Error('Circuit breaker is open'));
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
  }
}

/**
 * Exponential backoff retry utility
 */
export class RetryMechanism {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [ErrorType.NETWORK_ERROR, ErrorType.API_ERROR, ErrorType.TIMEOUT_ERROR],
      ...options
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if error should be retried
        const shouldRetry = config.shouldRetry 
          ? config.shouldRetry(lastError)
          : this.isRetryableError(lastError, config.retryableErrors);

        if (!shouldRetry || attempt === config.maxAttempts) {
          throw lastError;
        }

        // Call retry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt, lastError);
        }

        // Calculate delay with jitter
        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Execute operation with circuit breaker
   */
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitKey: string,
    circuitConfig?: CircuitBreakerConfig
  ): Promise<T> {
    let circuitBreaker = this.circuitBreakers.get(circuitKey);
    
    if (!circuitBreaker) {
      const config = circuitConfig || {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        monitoringPeriod: 10000 // 10 seconds
      };
      circuitBreaker = new CircuitBreaker(config);
      this.circuitBreakers.set(circuitKey, circuitBreaker);
    }

    return circuitBreaker.execute(operation);
  }

  /**
   * Execute operation with both retry and circuit breaker
   */
  async executeWithRetryAndCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitKey: string,
    retryOptions: RetryOptions = {},
    circuitConfig?: CircuitBreakerConfig
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.executeWithCircuitBreaker(operation, circuitKey, circuitConfig),
      retryOptions
    );
  }

  /**
   * Batch retry for multiple operations
   */
  async retryBatch<T>(
    operations: (() => Promise<T>)[],
    options: RetryOptions = {}
  ): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
    const results = await Promise.allSettled(
      operations.map(op => this.executeWithRetry(op, options))
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return { success: true, result: result.value };
      } else {
        return { success: false, error: result.reason };
      }
    });
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error, retryableErrors: ErrorType[]): boolean {
    // Check if it's a GameError with retryable type
    if ('type' in error && retryableErrors.includes((error as GameError).type)) {
      return true;
    }

    // Check common error patterns
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
      return true;
    }

    // Check HTTP status codes
    if ('status' in error) {
      const status = (error as any).status;
      return status >= 500 || status === 408 || status === 429;
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryOptions): number {
    const exponentialDelay = (config.baseDelay || 1000) * Math.pow(config.backoffMultiplier || 2, attempt - 1);
    const maxDelay = config.maxDelay || 10000;
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(circuitKey: string): CircuitState | null {
    const circuitBreaker = this.circuitBreakers.get(circuitKey);
    return circuitBreaker ? circuitBreaker.getState() : null;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(circuitKey: string): void {
    const circuitBreaker = this.circuitBreakers.get(circuitKey);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach(cb => cb.reset());
  }
}

// Utility functions for common retry patterns

/**
 * Retry API calls with exponential backoff
 */
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  const retryMechanism = new RetryMechanism();
  return retryMechanism.executeWithRetry(apiCall, {
    maxAttempts,
    shouldRetry: (error) => {
      if ('status' in error) {
        const status = (error as any).status;
        return status >= 500 || status === 408 || status === 429;
      }
      return error.name === 'NetworkError' || error.name === 'TimeoutError';
    }
  });
}

/**
 * Retry GPS operations
 */
export async function retryGpsOperation<T>(
  gpsOperation: () => Promise<T>,
  maxAttempts = 2
): Promise<T> {
  const retryMechanism = new RetryMechanism();
  return retryMechanism.executeWithRetry(gpsOperation, {
    maxAttempts,
    baseDelay: 2000,
    shouldRetry: (error) => {
      return error.name === 'TimeoutError' || 
             ('code' in error && (error as any).code === 3); // GPS timeout
    }
  });
}

/**
 * Retry storage operations
 */
export async function retryStorageOperation<T>(
  storageOperation: () => Promise<T>,
  maxAttempts = 2
): Promise<T> {
  const retryMechanism = new RetryMechanism();
  return retryMechanism.executeWithRetry(storageOperation, {
    maxAttempts,
    baseDelay: 500,
    shouldRetry: (error) => {
      return error.name === 'QuotaExceededError' || 
             error.name === 'DataError' ||
             error.name === 'TransactionInactiveError';
    }
  });
}

// Global retry mechanism instance
export const retryMechanism = new RetryMechanism();