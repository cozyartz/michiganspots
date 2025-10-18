/**
 * Example integration of error handling and offline sync services
 */

import { errorHandler } from '../services/errorHandler.js';
import { offlineSyncService } from '../services/offlineSync.js';
import { gracefulDegradation } from '../services/gracefulDegradation.js';
import { retryApiCall, retryGpsOperation } from '../utils/retryMechanism.js';
import { ErrorType } from '../types/errors.js';

/**
 * Example: Robust challenge loading with error handling and offline support
 */
export async function loadChallengesRobustly(): Promise<any[]> {
  try {
    // Try to get challenges with offline support
    const challenges = await offlineSyncService.getChallenges();
    return challenges;
  } catch (error) {
    // Handle the error with comprehensive error handling
    const gameError = await errorHandler.handleError(error, {
      operation: 'loadChallenges',
      component: 'ChallengeBrowser'
    });

    // Apply graceful degradation
    const degradationResult = await gracefulDegradation.applyDegradation(
      gameError,
      'loadChallenges'
    );

    if (degradationResult.degraded && degradationResult.data) {
      console.log(`Using degraded data: ${degradationResult.strategy?.userMessage}`);
      return degradationResult.data;
    }

    // If no degradation available, throw the error for UI handling
    throw gameError;
  }
}

/**
 * Example: Robust proof submission with retry and offline queueing
 */
export async function submitProofRobustly(submission: any): Promise<{ success: boolean; message: string }> {
  try {
    // Use retry mechanism for GPS operations
    const gpsLocation = await retryGpsOperation(async () => {
      return getCurrentLocation();
    });

    // Add GPS data to submission
    submission.gpsCoordinates = gpsLocation;

    // Submit with offline support
    const result = await offlineSyncService.submitProof(submission);

    if (result.queued) {
      return {
        success: true,
        message: 'Submission saved offline. It will be sent when connection is restored.'
      };
    }

    return {
      success: true,
      message: 'Submission completed successfully!'
    };

  } catch (error) {
    const gameError = await errorHandler.handleError(error, {
      operation: 'submitProof',
      component: 'ProofSubmission',
      challengeId: submission.challengeId
    });

    // Get recovery actions
    const recoveryActions = errorHandler.getRecoveryActions(gameError);

    return {
      success: false,
      message: gameError.userMessage
    };
  }
}

/**
 * Example: Robust API call with circuit breaker and retry
 */
export async function makeRobustApiCall<T>(
  apiCall: () => Promise<T>,
  operation: string
): Promise<T> {
  return errorHandler.executeWithRetry(
    async () => {
      return retryApiCall(apiCall);
    },
    {
      operation,
      component: 'ApiClient'
    }
  );
}

/**
 * Example: Handle network connectivity changes
 */
export function setupNetworkHandling(): void {
  // Listen for sync status changes
  offlineSyncService.addSyncListener((status) => {
    if (!status.isOnline) {
      console.log('📴 Offline mode activated');
      // Show offline banner in UI
    } else if (status.isSyncing) {
      console.log('🔄 Syncing data...');
      // Show sync progress in UI
    } else if (status.pendingItems > 0) {
      console.log(`⏳ ${status.pendingItems} items pending sync`);
      // Show pending items indicator
    } else {
      console.log('✅ All data synced');
      // Show success state
    }
  });
}

/**
 * Mock GPS function for example
 */
async function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(errorHandler.createError(ErrorType.GPS_UNAVAILABLE));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let errorType = ErrorType.GPS_UNAVAILABLE;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = ErrorType.GPS_PERMISSION_DENIED;
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = ErrorType.GPS_UNAVAILABLE;
            break;
          case error.TIMEOUT:
            errorType = ErrorType.TIMEOUT_ERROR;
            break;
        }

        reject(errorHandler.createError(errorType, error));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * Example: Component-level error boundary
 */
export class ComponentErrorBoundary {
  private componentName: string;

  constructor(componentName: string) {
    this.componentName = componentName;
  }

  async handleComponentError(error: any, context?: any): Promise<void> {
    const gameError = await errorHandler.handleError(error, {
      component: this.componentName,
      ...context
    });

    // Log error for debugging
    console.error(`Error in ${this.componentName}:`, gameError);

    // Apply graceful degradation if possible
    const degradationResult = await gracefulDegradation.applyDegradation(
      gameError,
      `${this.componentName}_error`
    );

    if (degradationResult.degraded) {
      console.log(`Applied degradation for ${this.componentName}: ${degradationResult.strategy?.userMessage}`);
    }
  }
}

/**
 * Example usage in a component
 */
export async function exampleComponentUsage(): Promise<void> {
  const errorBoundary = new ComponentErrorBoundary('ChallengeDetail');

  try {
    // Component logic here
    const challenges = await loadChallengesRobustly();
    console.log('Loaded challenges:', challenges.length);

  } catch (error) {
    await errorBoundary.handleComponentError(error, {
      operation: 'loadChallenges'
    });
  }
}

// Setup network handling on module load
setupNetworkHandling();