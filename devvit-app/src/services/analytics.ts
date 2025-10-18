/**
 * Analytics Client Service for Cloudflare Workers API Integration
 * 
 * This service handles communication with the existing Cloudflare Workers
 * analytics API endpoints for tracking engagement and challenge completions.
 */

import type {
  EngagementEvent,
  ChallengeCompletion,
  AnalyticsAPIResponse,
  AnalyticsClientConfig,
  AnalyticsError
} from '../types/analytics.js';
import { AnalyticsErrorType } from '../types/analytics.js';

/**
 * Analytics Client for communicating with Cloudflare Workers API
 */
export class AnalyticsClient {
  private config: AnalyticsClientConfig;
  private retryDelays: number[] = [1000, 2000, 4000]; // Exponential backoff delays

  constructor(config: AnalyticsClientConfig) {
    this.config = config;
  }

  /**
   * Track engagement events (view, comment, upvote, share, award)
   */
  async trackEngagement(event: EngagementEvent): Promise<AnalyticsAPIResponse> {
    const endpoint = `${this.config.baseUrl}/track-engagement`;
    return this.sendEventWithRetry(endpoint, event);
  }

  /**
   * Track challenge completion events
   */
  async trackChallenge(completion: ChallengeCompletion): Promise<AnalyticsAPIResponse> {
    const endpoint = `${this.config.baseUrl}/track-challenge`;
    return this.sendEventWithRetry(endpoint, completion);
  }

  /**
   * Send event with retry logic and exponential backoff
   */
  private async sendEventWithRetry(
    endpoint: string,
    eventData: EngagementEvent | ChallengeCompletion,
    attempt: number = 0
  ): Promise<AnalyticsAPIResponse> {
    try {
      return await this.sendEvent(endpoint, eventData);
    } catch (error) {
      const analyticsError = this.classifyError(error);
      
      // If error is retryable and we haven't exceeded max attempts
      if (analyticsError.retryable && attempt < this.config.retryAttempts) {
        const delay = this.retryDelays[attempt] || this.retryDelays[this.retryDelays.length - 1];
        
        // Wait for exponential backoff delay
        await this.sleep(delay);
        
        // Retry the request
        return this.sendEventWithRetry(endpoint, eventData, attempt + 1);
      }
      
      // If not retryable or max attempts exceeded, throw the error
      throw analyticsError;
    }
  }

  /**
   * Send a single event to the analytics API
   */
  private async sendEvent(
    endpoint: string,
    eventData: EngagementEvent | ChallengeCompletion
  ): Promise<AnalyticsAPIResponse> {
    const requestBody = {
      ...eventData,
      timestamp: eventData.timestamp || new Date().toISOString()
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'User-Agent': 'DevvitApp/1.0 RedditTreasureHunt'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result: AnalyticsAPIResponse = await response.json();
    
    if (!result.success) {
      throw new Error(`API Error: ${result.message || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Classify errors for retry logic
   */
  private classifyError(error: any): AnalyticsError {
    // Network or timeout errors - retryable
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return {
        type: AnalyticsErrorType.NETWORK_ERROR,
        message: 'Request timeout or network error',
        retryable: true,
        context: { originalError: error.message }
      };
    }

    // HTTP errors
    if (error.message?.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;

      if (status === 401 || status === 403) {
        return {
          type: AnalyticsErrorType.AUTHENTICATION_ERROR,
          message: 'Authentication failed - invalid API key',
          retryable: false,
          context: { status }
        };
      }

      if (status === 400) {
        return {
          type: AnalyticsErrorType.VALIDATION_ERROR,
          message: 'Invalid request data',
          retryable: false,
          context: { status }
        };
      }

      if (status === 429) {
        return {
          type: AnalyticsErrorType.RATE_LIMIT_ERROR,
          message: 'Rate limit exceeded',
          retryable: true,
          context: { status }
        };
      }

      if (status >= 500) {
        return {
          type: AnalyticsErrorType.SERVER_ERROR,
          message: 'Server error',
          retryable: true,
          context: { status }
        };
      }
    }

    // API errors
    if (error.message?.includes('API Error')) {
      return {
        type: AnalyticsErrorType.VALIDATION_ERROR,
        message: error.message,
        retryable: false,
        context: { originalError: error.message }
      };
    }

    // Default to network error (retryable)
    return {
      type: AnalyticsErrorType.NETWORK_ERROR,
      message: error.message || 'Unknown network error',
      retryable: true,
      context: { originalError: error.message }
    };
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate event data before sending
   */
  private validateEngagementEvent(event: EngagementEvent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.eventType) {
      errors.push('eventType is required');
    } else if (!['view', 'comment', 'upvote', 'share', 'award'].includes(event.eventType)) {
      errors.push('eventType must be one of: view, comment, upvote, share, award');
    }

    if (!event.challengeId) {
      errors.push('challengeId is required');
    }

    if (!event.userRedditUsername) {
      errors.push('userRedditUsername is required');
    }

    if (!event.postId) {
      errors.push('postId is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate challenge completion data before sending
   */
  private validateChallengeCompletion(completion: ChallengeCompletion): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!completion.challengeId) {
      errors.push('challengeId is required');
    }

    if (!completion.userRedditUsername) {
      errors.push('userRedditUsername is required');
    }

    if (!completion.submissionUrl) {
      errors.push('submissionUrl is required');
    }

    if (!completion.submissionType || !['post', 'comment'].includes(completion.submissionType)) {
      errors.push('submissionType must be either "post" or "comment"');
    }

    if (!completion.gpsCoordinates) {
      errors.push('gpsCoordinates is required');
    } else {
      if (typeof completion.gpsCoordinates.latitude !== 'number' || 
          completion.gpsCoordinates.latitude < -90 || 
          completion.gpsCoordinates.latitude > 90) {
        errors.push('gpsCoordinates.latitude must be a valid number between -90 and 90');
      }

      if (typeof completion.gpsCoordinates.longitude !== 'number' || 
          completion.gpsCoordinates.longitude < -180 || 
          completion.gpsCoordinates.longitude > 180) {
        errors.push('gpsCoordinates.longitude must be a valid number between -180 and 180');
      }
    }

    if (!completion.proofType) {
      errors.push('proofType is required');
    }

    if (typeof completion.pointsAwarded !== 'number' || completion.pointsAwarded < 0) {
      errors.push('pointsAwarded must be a non-negative number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Public method to validate engagement events
   */
  public validateEngagement(event: EngagementEvent): { isValid: boolean; errors: string[] } {
    return this.validateEngagementEvent(event);
  }

  /**
   * Public method to validate challenge completions
   */
  public validateCompletion(completion: ChallengeCompletion): { isValid: boolean; errors: string[] } {
    return this.validateChallengeCompletion(completion);
  }
}

/**
 * Factory function to create analytics client with default configuration
 */
export function createAnalyticsClient(
  apiKey: string,
  baseUrl: string = 'https://michiganspots.com/api/analytics'
): AnalyticsClient {
  const config: AnalyticsClientConfig = {
    baseUrl,
    apiKey,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 5000
  };

  return new AnalyticsClient(config);
}

/**
 * Singleton analytics client instance
 * Will be initialized when the app starts
 */
let analyticsClientInstance: AnalyticsClient | null = null;

/**
 * Get the singleton analytics client instance
 */
export function getAnalyticsClient(): AnalyticsClient {
  if (!analyticsClientInstance) {
    throw new Error('Analytics client not initialized. Call initializeAnalyticsClient first.');
  }
  return analyticsClientInstance;
}

/**
 * Initialize the singleton analytics client
 */
export function initializeAnalyticsClient(config: AnalyticsClientConfig): void {
  analyticsClientInstance = new AnalyticsClient(config);
}