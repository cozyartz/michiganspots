/**
 * Error handling type definitions
 */

// Game Error Types
export enum ErrorType {
  GPS_UNAVAILABLE = 'GPS_UNAVAILABLE',
  LOCATION_TOO_FAR = 'LOCATION_TOO_FAR',
  INVALID_PROOF = 'INVALID_PROOF',
  CHALLENGE_EXPIRED = 'CHALLENGE_EXPIRED',
  ALREADY_COMPLETED = 'ALREADY_COMPLETED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

export interface GameError {
  type: ErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
  context?: Record<string, any>;
  timestamp: Date;
}

// Validation Result Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Fraud Detection Types
export interface FraudDetectionResult {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  flags: FraudFlag[];
  recommendation: 'approve' | 'review' | 'reject';
}

export interface FraudFlag {
  type: 'gps_spoofing' | 'impossible_travel' | 'duplicate_submission' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence: Record<string, any>;
}

// Error Recovery Types
export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'manual' | 'ignore';
  maxAttempts?: number;
  delay?: number;
  fallbackAction?: () => Promise<void>;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}