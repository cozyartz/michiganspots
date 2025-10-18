/**
 * Error types and classification system for the Michigan Spots treasure hunt game
 */

export enum ErrorType {
  // GPS and Location Errors
  GPS_UNAVAILABLE = 'GPS_UNAVAILABLE',
  GPS_PERMISSION_DENIED = 'GPS_PERMISSION_DENIED',
  LOCATION_TOO_FAR = 'LOCATION_TOO_FAR',
  LOCATION_ACCURACY_LOW = 'LOCATION_ACCURACY_LOW',
  
  // Network and API Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Authentication and Authorization
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  
  // Challenge and Submission Errors
  CHALLENGE_EXPIRED = 'CHALLENGE_EXPIRED',
  CHALLENGE_NOT_FOUND = 'CHALLENGE_NOT_FOUND',
  ALREADY_COMPLETED = 'ALREADY_COMPLETED',
  INVALID_PROOF = 'INVALID_PROOF',
  SUBMISSION_FAILED = 'SUBMISSION_FAILED',
  
  // Data and Storage Errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  SYNC_ERROR = 'SYNC_ERROR',
  
  // General Application Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface GameError {
  type: ErrorType;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  retryable: boolean;
  context?: Record<string, any>;
  timestamp: Date;
  stack?: string;
  correlationId?: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export interface ErrorRecoveryAction {
  type: 'retry' | 'fallback' | 'redirect' | 'manual';
  label: string;
  action: () => Promise<void> | void;
}

export interface ErrorContext {
  userId?: string;
  challengeId?: string;
  component?: string;
  operation?: string;
  userAgent?: string;
  timestamp: Date;
  additionalData?: Record<string, any>;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorType.NETWORK_ERROR,
    ErrorType.API_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.SYNC_ERROR
  ]
};

export const ERROR_MESSAGES: Record<ErrorType, { message: string; userMessage: string; severity: ErrorSeverity }> = {
  [ErrorType.GPS_UNAVAILABLE]: {
    message: 'GPS service is not available on this device',
    userMessage: 'Location services are not available. Please enable GPS or try manual location entry.',
    severity: ErrorSeverity.MEDIUM
  },
  [ErrorType.GPS_PERMISSION_DENIED]: {
    message: 'User denied GPS permission',
    userMessage: 'Location permission is required to verify your visit. Please enable location access in your browser settings.',
    severity: ErrorSeverity.HIGH
  },
  [ErrorType.LOCATION_TOO_FAR]: {
    message: 'User location is too far from challenge location',
    userMessage: 'You need to be within 100 meters of the business to complete this challenge.',
    severity: ErrorSeverity.MEDIUM
  },
  [ErrorType.LOCATION_ACCURACY_LOW]: {
    message: 'GPS accuracy is too low for verification',
    userMessage: 'Your location accuracy is too low. Please move to an area with better GPS signal.',
    severity: ErrorSeverity.MEDIUM
  },
  [ErrorType.NETWORK_ERROR]: {
    message: 'Network connection failed',
    userMessage: 'Connection failed. Please check your internet connection and try again.',
    severity: ErrorSeverity.MEDIUM
  },
  [ErrorType.API_ERROR]: {
    message: 'API request failed',
    userMessage: 'Something went wrong on our end. Please try again in a moment.',
    severity: ErrorSeverity.HIGH
  },
  [ErrorType.TIMEOUT_ERROR]: {
    message: 'Request timed out',
    userMessage: 'The request is taking too long. Please try again.',
    severity: ErrorSeverity.MEDIUM
  },
  [ErrorType.RATE_LIMITED]: {
    message: 'Rate limit exceeded',
    userMessage: 'You\'re doing that too often. Please wait a moment before trying again.',
    severity: ErrorSeverity.MEDIUM
  },
  [ErrorType.AUTHENTICATION_ERROR]: {
    message: 'Authentication failed',
    userMessage: 'Please log in again to continue.',
    severity: ErrorSeverity.HIGH
  },
  [ErrorType.AUTHORIZATION_ERROR]: {
    message: 'User not authorized for this action',
    userMessage: 'You don\'t have permission to perform this action.',
    severity: ErrorSeverity.HIGH
  },
  [ErrorType.CHALLENGE_EXPIRED]: {
    message: 'Challenge has expired',
    userMessage: 'This challenge has expired and is no longer available.',
    severity: ErrorSeverity.LOW
  },
  [ErrorType.CHALLENGE_NOT_FOUND]: {
    message: 'Challenge not found',
    userMessage: 'This challenge could not be found. It may have been removed.',
    severity: ErrorSeverity.MEDIUM
  },
  [ErrorType.ALREADY_COMPLETED]: {
    message: 'Challenge already completed by user',
    userMessage: 'You have already completed this challenge.',
    severity: ErrorSeverity.LOW
  },
  [ErrorType.INVALID_PROOF]: {
    message: 'Submitted proof is invalid',
    userMessage: 'The proof you submitted doesn\'t meet the requirements. Please try again.',
    severity: ErrorSeverity.MEDIUM
  },
  [ErrorType.SUBMISSION_FAILED]: {
    message: 'Proof submission failed',
    userMessage: 'Failed to submit your proof. Please try again.',
    severity: ErrorSeverity.HIGH
  },
  [ErrorType.STORAGE_ERROR]: {
    message: 'Local storage operation failed',
    userMessage: 'Failed to save your progress. Your data may not be preserved.',
    severity: ErrorSeverity.HIGH
  },
  [ErrorType.DATA_CORRUPTION]: {
    message: 'Stored data is corrupted',
    userMessage: 'Your saved data appears to be corrupted. Some progress may be lost.',
    severity: ErrorSeverity.CRITICAL
  },
  [ErrorType.SYNC_ERROR]: {
    message: 'Data synchronization failed',
    userMessage: 'Failed to sync your progress. Some changes may not be saved.',
    severity: ErrorSeverity.HIGH
  },
  [ErrorType.UNKNOWN_ERROR]: {
    message: 'An unknown error occurred',
    userMessage: 'Something unexpected happened. Please try again.',
    severity: ErrorSeverity.HIGH
  },
  [ErrorType.VALIDATION_ERROR]: {
    message: 'Data validation failed',
    userMessage: 'The information provided is not valid. Please check and try again.',
    severity: ErrorSeverity.MEDIUM
  },
  [ErrorType.CONFIGURATION_ERROR]: {
    message: 'Application configuration error',
    userMessage: 'The app is not configured correctly. Please contact support.',
    severity: ErrorSeverity.CRITICAL
  }
};