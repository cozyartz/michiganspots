/**
 * Comprehensive error handling service for the Michigan Spots treasure hunt game
 */

import { Devvit } from '@devvit/public-api';
import {
  ErrorType,
  ErrorSeverity,
  GameError,
  RetryConfig,
  ErrorRecoveryAction,
  ErrorContext,
  DEFAULT_RETRY_CONFIG,
  ERROR_MESSAGES
} from '../types/errors.js';

export class ErrorHandler {
  private retryConfig: RetryConfig;
  private errorLog: GameError[] = [];
  private maxLogSize = 100;

  constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.retryConfig = retryConfig;
  }

  /**
   * Create a standardized GameError from various error sources
   */
  createError(
    type: ErrorType,
    originalError?: Error | any,
    context?: Partial<ErrorContext>
  ): GameError {
    const errorInfo = ERROR_MESSAGES[type];
    const correlationId = this.generateCorrelationId();

    const gameError: GameError = {
      type,
      message: originalError?.message || errorInfo.message,
      userMessage: errorInfo.userMessage,
      severity: errorInfo.severity,
      recoverable: this.isRecoverable(type),
      retryable: this.isRetryable(type),
      context: context?.additionalData,
      timestamp: new Date(),
      stack: originalError?.stack,
      correlationId
    };

    this.logError(gameError, context);
    return gameError;
  }

  /**
   * Handle errors with automatic retry and recovery
   */
  async handleError(
    error: GameError | Error | any,
    context?: Partial<ErrorContext>
  ): Promise<GameError> {
    let gameError: GameError;

    if (this.isGameError(error)) {
      gameError = error;
    } else {
      gameError = this.classifyError(error, context);
    }

    // Log the error
    this.logError(gameError, context);

    // Send to monitoring if critical
    if (gameError.severity === ErrorSeverity.CRITICAL) {
      await this.alertMonitoring(gameError, context);
    }

    return gameError;
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const gameError = await this.handleError(error, {
          ...context,
          additionalData: { ...context?.additionalData, attempt }
        });

        // Don't retry if error is not retryable or we've reached max attempts
        if (!gameError.retryable || attempt === config.maxAttempts) {
          throw gameError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Get recovery actions for an error
   */
  getRecoveryActions(error: GameError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    switch (error.type) {
      case ErrorType.GPS_UNAVAILABLE:
      case ErrorType.GPS_PERMISSION_DENIED:
        actions.push({
          type: 'manual',
          label: 'Enter Location Manually',
          action: () => this.showManualLocationEntry()
        });
        break;

      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        if (error.retryable) {
          actions.push({
            type: 'retry',
            label: 'Try Again',
            action: () => this.retryLastOperation()
          });
        }
        actions.push({
          type: 'fallback',
          label: 'Work Offline',
          action: () => this.enableOfflineMode()
        });
        break;

      case ErrorType.AUTHENTICATION_ERROR:
        actions.push({
          type: 'redirect',
          label: 'Log In Again',
          action: () => this.redirectToLogin()
        });
        break;

      case ErrorType.CHALLENGE_EXPIRED:
        actions.push({
          type: 'redirect',
          label: 'Browse Active Challenges',
          action: () => this.redirectToChallenges()
        });
        break;

      case ErrorType.LOCATION_TOO_FAR:
        actions.push({
          type: 'manual',
          label: 'Get Directions',
          action: () => this.showDirections()
        });
        break;

      default:
        if (error.retryable) {
          actions.push({
            type: 'retry',
            label: 'Try Again',
            action: () => this.retryLastOperation()
          });
        }
        break;
    }

    return actions;
  }

  /**
   * Classify unknown errors into GameError types
   */
  private classifyError(error: any, context?: Partial<ErrorContext>): GameError {
    let errorType = ErrorType.UNKNOWN_ERROR;

    // Network-related errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      errorType = ErrorType.NETWORK_ERROR;
    } else if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      errorType = ErrorType.TIMEOUT_ERROR;
    } else if (error.status === 401) {
      errorType = ErrorType.AUTHENTICATION_ERROR;
    } else if (error.status === 403) {
      errorType = ErrorType.AUTHORIZATION_ERROR;
    } else if (error.status === 429) {
      errorType = ErrorType.RATE_LIMITED;
    } else if (error.status >= 500) {
      errorType = ErrorType.API_ERROR;
    }

    // GPS-related errors
    else if (error.code === 1) { // PERMISSION_DENIED
      errorType = ErrorType.GPS_PERMISSION_DENIED;
    } else if (error.code === 2) { // POSITION_UNAVAILABLE
      errorType = ErrorType.GPS_UNAVAILABLE;
    } else if (error.code === 3) { // TIMEOUT
      errorType = ErrorType.TIMEOUT_ERROR;
    }

    // Storage-related errors
    else if (error.name === 'QuotaExceededError') {
      errorType = ErrorType.STORAGE_ERROR;
    }

    // Validation errors
    else if (error.name === 'ValidationError') {
      errorType = ErrorType.VALIDATION_ERROR;
    }

    return this.createError(errorType, error, context);
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(type: ErrorType): boolean {
    return this.retryConfig.retryableErrors.includes(type);
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverable(type: ErrorType): boolean {
    const nonRecoverableErrors = [
      ErrorType.CHALLENGE_EXPIRED,
      ErrorType.ALREADY_COMPLETED,
      ErrorType.AUTHORIZATION_ERROR,
      ErrorType.DATA_CORRUPTION,
      ErrorType.CONFIGURATION_ERROR
    ];
    return !nonRecoverableErrors.includes(type);
  }

  /**
   * Check if object is a GameError
   */
  private isGameError(error: any): error is GameError {
    return error && typeof error === 'object' && 'type' in error && 'userMessage' in error;
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(error: GameError, context?: Partial<ErrorContext>): void {
    const logEntry = {
      ...error,
      context: {
        ...context,
        timestamp: new Date()
      }
    };

    // Add to in-memory log
    this.errorLog.push(logEntry);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GameError:', logEntry);
    }

    // Store in Devvit KV for persistence
    this.storeErrorLog(logEntry);
  }

  /**
   * Store error in Devvit KV store
   */
  private async storeErrorLog(error: GameError): Promise<void> {
    try {
      const key = `error_log:${error.correlationId}`;
      await Devvit.kvStore.put(key, JSON.stringify(error));
    } catch (e) {
      console.error('Failed to store error log:', e);
    }
  }

  /**
   * Alert monitoring systems for critical errors
   */
  private async alertMonitoring(error: GameError, context?: Partial<ErrorContext>): Promise<void> {
    try {
      // In a real implementation, this would send to monitoring service
      console.error('CRITICAL ERROR ALERT:', {
        error,
        context,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to send monitoring alert:', e);
    }
  }

  /**
   * Generate unique correlation ID for error tracking
   */
  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Recovery action implementations
  private async showManualLocationEntry(): Promise<void> {
    // Implementation would show manual location entry UI
    console.log('Showing manual location entry');
  }

  private async retryLastOperation(): Promise<void> {
    // Implementation would retry the last failed operation
    console.log('Retrying last operation');
  }

  private async enableOfflineMode(): Promise<void> {
    // Implementation would enable offline mode
    console.log('Enabling offline mode');
  }

  private async redirectToLogin(): Promise<void> {
    // Implementation would redirect to login
    console.log('Redirecting to login');
  }

  private async redirectToChallenges(): Promise<void> {
    // Implementation would redirect to challenges list
    console.log('Redirecting to challenges');
  }

  private async showDirections(): Promise<void> {
    // Implementation would show directions to challenge location
    console.log('Showing directions');
  }

  /**
   * Get recent error logs
   */
  getRecentErrors(limit: number = 10): GameError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();