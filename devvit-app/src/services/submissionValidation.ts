/**
 * Comprehensive submission validation system for fraud prevention and security
 */

import { 
  Submission, 
  Challenge, 
  ProofSubmission, 
  GPSCoordinate, 
  UserSubmissionHistory,
  ProofType,
  PhotoProof,
  ReceiptProof,
  GPSProof,
  QuestionProof
} from '../types/core.js';
import { 
  ValidationResult, 
  ValidationError, 
  FraudDetectionResult,
  ErrorType 
} from '../types/errors.js';
import { FraudDetectionService } from './fraudDetection.js';
import { verifyLocationWithinRadius } from '../utils/gpsUtils.js';

export interface SubmissionValidationConfig {
  maxDailySubmissions: number;
  minSubmissionInterval: number; // seconds
  maxPhotoSize: number; // bytes
  allowedImageTypes: string[];
  gpsAccuracyThreshold: number; // meters
  duplicatePreventionEnabled: boolean;
  rateLimitingEnabled: boolean;
  photoValidationEnabled: boolean;
}

export interface RateLimitInfo {
  userId: string;
  submissionCount: number;
  windowStart: Date;
  windowEnd: Date;
  isBlocked: boolean;
  nextAllowedSubmission?: Date;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingSubmissionId?: string;
  submissionDate?: Date;
}

/**
 * Comprehensive submission validation service
 */
export class SubmissionValidationService {
  private fraudDetectionService: FraudDetectionService;
  private config: SubmissionValidationConfig;

  constructor(config?: Partial<SubmissionValidationConfig>) {
    this.fraudDetectionService = new FraudDetectionService();
    this.config = {
      maxDailySubmissions: 50,
      minSubmissionInterval: 60, // 1 minute
      maxPhotoSize: 10 * 1024 * 1024, // 10MB
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      gpsAccuracyThreshold: 100, // meters
      duplicatePreventionEnabled: true,
      rateLimitingEnabled: true,
      photoValidationEnabled: true,
      ...config
    };
  }

  /**
   * Validate a complete submission for all security and fraud concerns
   */
  async validateSubmission(
    submission: Submission,
    challenge: Challenge,
    userHistory: UserSubmissionHistory,
    proofSubmission: ProofSubmission
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: any[] = [];

    try {
      // 1. Basic submission validation
      const basicValidation = await this.validateBasicSubmission(submission, challenge);
      errors.push(...basicValidation.errors);

      // 2. Duplicate submission check
      if (this.config.duplicatePreventionEnabled) {
        const duplicateCheck = await this.checkDuplicateSubmission(
          submission.userRedditUsername,
          submission.challengeId,
          userHistory
        );
        if (duplicateCheck.isDuplicate) {
          errors.push({
            field: 'challengeId',
            message: `You have already completed this challenge on ${duplicateCheck.submissionDate?.toLocaleDateString()}`,
            code: 'DUPLICATE_SUBMISSION'
          });
        }
      }

      // 3. Rate limiting check
      if (this.config.rateLimitingEnabled) {
        const rateLimitCheck = await this.checkRateLimit(
          submission.userRedditUsername,
          userHistory
        );
        if (rateLimitCheck.isBlocked) {
          errors.push({
            field: 'submission',
            message: `Rate limit exceeded. Next submission allowed at ${rateLimitCheck.nextAllowedSubmission?.toLocaleTimeString()}`,
            code: 'RATE_LIMIT_EXCEEDED'
          });
        }
      }

      // 4. GPS location validation
      const gpsValidation = await this.validateGPSLocation(
        submission.gpsCoordinates,
        challenge
      );
      errors.push(...gpsValidation.errors);

      // 5. Proof-specific validation
      const proofValidation = await this.validateProofData(
        proofSubmission,
        challenge
      );
      errors.push(...proofValidation.errors);

      // 6. Fraud detection
      const fraudResult = await this.fraudDetectionService.validateSubmission(
        submission,
        userHistory,
        challenge.location.coordinates
      );

      if (!fraudResult.isValid) {
        errors.push({
          field: 'submission',
          message: `Fraud detected: ${fraudResult.reasons.join(', ')}`,
          code: 'FRAUD_DETECTED'
        });
      }

      // Add fraud warnings for medium risk
      if (fraudResult.fraudRisk === 'medium') {
        warnings.push({
          field: 'submission',
          message: `Submission flagged for review: ${fraudResult.reasons.join(', ')}`,
          code: 'FRAUD_WARNING'
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Submission validation error:', error);
      return {
        isValid: false,
        errors: [{
          field: 'submission',
          message: 'Validation system error. Please try again.',
          code: 'VALIDATION_SYSTEM_ERROR'
        }],
        warnings: []
      };
    }
  }

  /**
   * Validate basic submission requirements
   */
  private async validateBasicSubmission(
    submission: Submission,
    challenge: Challenge
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Check required fields
    if (!submission.challengeId) {
      errors.push({
        field: 'challengeId',
        message: 'Challenge ID is required',
        code: 'MISSING_CHALLENGE_ID'
      });
    }

    if (!submission.userRedditUsername) {
      errors.push({
        field: 'userRedditUsername',
        message: 'User authentication required',
        code: 'MISSING_USER'
      });
    }

    if (!submission.proofType) {
      errors.push({
        field: 'proofType',
        message: 'Proof type is required',
        code: 'MISSING_PROOF_TYPE'
      });
    }

    if (!submission.gpsCoordinates) {
      errors.push({
        field: 'gpsCoordinates',
        message: 'GPS coordinates are required',
        code: 'MISSING_GPS'
      });
    }

    // Check challenge status
    const now = new Date();
    if (challenge.status !== 'active') {
      errors.push({
        field: 'challenge',
        message: 'Challenge is not active',
        code: 'CHALLENGE_INACTIVE'
      });
    }

    if (challenge.endDate < now) {
      errors.push({
        field: 'challenge',
        message: 'Challenge has expired',
        code: 'CHALLENGE_EXPIRED'
      });
    }

    if (challenge.startDate > now) {
      errors.push({
        field: 'challenge',
        message: 'Challenge has not started yet',
        code: 'CHALLENGE_NOT_STARTED'
      });
    }

    // Check if proof type is allowed for this challenge
    if (!challenge.proofRequirements.types.includes(submission.proofType)) {
      errors.push({
        field: 'proofType',
        message: `Proof type '${submission.proofType}' is not allowed for this challenge`,
        code: 'INVALID_PROOF_TYPE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Check for duplicate submissions
   */
  private async checkDuplicateSubmission(
    userRedditUsername: string,
    challengeId: string,
    userHistory: UserSubmissionHistory
  ): Promise<DuplicateCheckResult> {
    const existingSubmission = userHistory.submissions.find(
      submission => submission.challengeId === challengeId &&
                   submission.verificationStatus === 'approved'
    );

    if (existingSubmission) {
      return {
        isDuplicate: true,
        existingSubmissionId: existingSubmission.id,
        submissionDate: existingSubmission.submittedAt
      };
    }

    return { isDuplicate: false };
  }

  /**
   * Check rate limiting for user submissions
   */
  private async checkRateLimit(
    userRedditUsername: string,
    userHistory: UserSubmissionHistory
  ): Promise<RateLimitInfo> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Count submissions in the last 24 hours
    const recentSubmissions = userHistory.submissions.filter(
      submission => submission.submittedAt >= oneDayAgo
    );

    // Check daily limit
    if (recentSubmissions.length >= this.config.maxDailySubmissions) {
      const oldestRecentSubmission = recentSubmissions
        .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())[0];
      
      const nextAllowedSubmission = new Date(
        oldestRecentSubmission.submittedAt.getTime() + 24 * 60 * 60 * 1000
      );

      return {
        userId: userRedditUsername,
        submissionCount: recentSubmissions.length,
        windowStart: oneDayAgo,
        windowEnd: now,
        isBlocked: true,
        nextAllowedSubmission
      };
    }

    // Check minimum interval between submissions
    if (userHistory.lastSubmissionAt) {
      const timeSinceLastSubmission = (now.getTime() - userHistory.lastSubmissionAt.getTime()) / 1000;
      
      if (timeSinceLastSubmission < this.config.minSubmissionInterval) {
        const nextAllowedSubmission = new Date(
          userHistory.lastSubmissionAt.getTime() + this.config.minSubmissionInterval * 1000
        );

        return {
          userId: userRedditUsername,
          submissionCount: recentSubmissions.length,
          windowStart: oneDayAgo,
          windowEnd: now,
          isBlocked: true,
          nextAllowedSubmission
        };
      }
    }

    return {
      userId: userRedditUsername,
      submissionCount: recentSubmissions.length,
      windowStart: oneDayAgo,
      windowEnd: now,
      isBlocked: false
    };
  }

  /**
   * Validate GPS location requirements
   */
  private async validateGPSLocation(
    gpsCoordinates: GPSCoordinate,
    challenge: Challenge
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Check GPS coordinate validity
    if (!gpsCoordinates.latitude || !gpsCoordinates.longitude) {
      errors.push({
        field: 'gpsCoordinates',
        message: 'Valid GPS coordinates are required',
        code: 'INVALID_GPS_COORDINATES'
      });
      return { isValid: false, errors, warnings: [] };
    }

    // Check GPS accuracy
    if (gpsCoordinates.accuracy && gpsCoordinates.accuracy > this.config.gpsAccuracyThreshold) {
      errors.push({
        field: 'gpsCoordinates',
        message: `GPS accuracy too low (${gpsCoordinates.accuracy}m). Please try again with better signal.`,
        code: 'POOR_GPS_ACCURACY'
      });
    }

    // Verify location within required radius
    const locationVerification = verifyLocationWithinRadius(
      gpsCoordinates,
      challenge.location.coordinates,
      challenge.location.verificationRadius
    );

    if (!locationVerification.isValid) {
      errors.push({
        field: 'gpsCoordinates',
        message: `You must be within ${challenge.location.verificationRadius}m of ${challenge.location.businessName}. You are ${locationVerification.distance}m away.`,
        code: 'LOCATION_TOO_FAR'
      });
    }

    if (locationVerification.fraudRisk === 'high') {
      errors.push({
        field: 'gpsCoordinates',
        message: 'GPS location verification failed. Potential spoofing detected.',
        code: 'GPS_SPOOFING_DETECTED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Validate proof data based on proof type
   */
  private async validateProofData(
    proofSubmission: ProofSubmission,
    challenge: Challenge
  ): Promise<ValidationResult> {
    switch (proofSubmission.type) {
      case 'photo':
        return this.validatePhotoProof(proofSubmission.data as PhotoProof);
      case 'receipt':
        return this.validateReceiptProof(proofSubmission.data as ReceiptProof);
      case 'gps_checkin':
        return this.validateGPSProof(proofSubmission.data as GPSProof);
      case 'location_question':
        return this.validateQuestionProof(proofSubmission.data as QuestionProof, challenge);
      default:
        return {
          isValid: false,
          errors: [{
            field: 'proofType',
            message: 'Invalid proof type',
            code: 'INVALID_PROOF_TYPE'
          }],
          warnings: []
        };
    }
  }

  /**
   * Validate photo proof submission
   */
  private async validatePhotoProof(photoData: PhotoProof): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!photoData.imageUrl) {
      errors.push({
        field: 'imageUrl',
        message: 'Photo is required',
        code: 'MISSING_PHOTO'
      });
      return { isValid: false, errors, warnings: [] };
    }

    if (this.config.photoValidationEnabled) {
      // Basic photo validation
      const photoValidation = await this.validatePhotoContent(photoData);
      errors.push(...photoValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Validate photo content for business signage
   */
  private async validatePhotoContent(photoData: PhotoProof): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: any[] = [];

    // Basic validation checks
    if (photoData.imageUrl.length < 10) {
      errors.push({
        field: 'imageUrl',
        message: 'Invalid photo data',
        code: 'INVALID_PHOTO_DATA'
      });
    }

    // Check for business signage indicators
    if (!photoData.hasBusinessSignage && !photoData.hasInteriorView) {
      warnings.push({
        field: 'photo',
        message: 'Photo should show business signage or interior for verification',
        code: 'NO_BUSINESS_INDICATORS'
      });
    }

    // Check for GPS embedded in photo
    if (!photoData.gpsEmbedded) {
      warnings.push({
        field: 'photo',
        message: 'Photo does not contain GPS metadata',
        code: 'NO_GPS_METADATA'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate receipt proof submission
   */
  private async validateReceiptProof(receiptData: ReceiptProof): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!receiptData.imageUrl) {
      errors.push({
        field: 'imageUrl',
        message: 'Receipt photo is required',
        code: 'MISSING_RECEIPT_PHOTO'
      });
    }

    if (!receiptData.businessName || receiptData.businessName.trim().length < 2) {
      errors.push({
        field: 'businessName',
        message: 'Business name is required',
        code: 'MISSING_BUSINESS_NAME'
      });
    }

    if (!receiptData.timestamp) {
      errors.push({
        field: 'timestamp',
        message: 'Receipt timestamp is required',
        code: 'MISSING_RECEIPT_TIMESTAMP'
      });
    } else {
      // Check if receipt is recent (within 24 hours)
      const now = new Date();
      const receiptAge = (now.getTime() - receiptData.timestamp.getTime()) / (1000 * 60 * 60);
      
      if (receiptAge > 24) {
        errors.push({
          field: 'timestamp',
          message: 'Receipt must be from within the last 24 hours',
          code: 'RECEIPT_TOO_OLD'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Validate GPS check-in proof
   */
  private async validateGPSProof(gpsData: GPSProof): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!gpsData.coordinates) {
      errors.push({
        field: 'coordinates',
        message: 'GPS coordinates are required for check-in',
        code: 'MISSING_GPS_COORDINATES'
      });
    }

    if (!gpsData.checkInTime) {
      errors.push({
        field: 'checkInTime',
        message: 'Check-in timestamp is required',
        code: 'MISSING_CHECKIN_TIME'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Validate location question proof
   */
  private async validateQuestionProof(
    questionData: QuestionProof,
    challenge: Challenge
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!questionData.answer || questionData.answer.trim().length < 2) {
      errors.push({
        field: 'answer',
        message: 'Answer is required and must be at least 2 characters',
        code: 'INVALID_ANSWER'
      });
    }

    if (!questionData.question) {
      errors.push({
        field: 'question',
        message: 'Question is required',
        code: 'MISSING_QUESTION'
      });
    }

    // In a real implementation, this would validate against stored correct answers
    // For now, we'll do basic validation
    if (questionData.answer && questionData.correctAnswer) {
      const isCorrect = questionData.answer.toLowerCase().trim() === 
                       questionData.correctAnswer.toLowerCase().trim();
      
      if (!isCorrect) {
        errors.push({
          field: 'answer',
          message: 'Incorrect answer. Please visit the location to find the correct answer.',
          code: 'INCORRECT_ANSWER'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Get validation configuration
   */
  getConfig(): SubmissionValidationConfig {
    return { ...this.config };
  }

  /**
   * Update validation configuration
   */
  updateConfig(newConfig: Partial<SubmissionValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}