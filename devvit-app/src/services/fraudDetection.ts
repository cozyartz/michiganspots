/**
 * Fraud detection service for GPS spoofing and suspicious submission patterns
 */

import { GPSCoordinate, Submission, LocationVerification } from '../types/core.js';
import { calculateDistance, calculateSpeed, validateAndNormalizeCoordinate } from '../utils/gpsUtils.js';

export interface FraudDetectionResult {
  isValid: boolean;
  fraudRisk: 'low' | 'medium' | 'high';
  reasons: string[];
  confidence: number; // 0-1 scale
  recommendedAction: 'approve' | 'review' | 'reject';
}

export interface UserSubmissionHistory {
  userRedditUsername: string;
  submissions: Submission[];
  lastSubmissionAt?: Date;
  totalSubmissions: number;
  suspiciousActivityCount: number;
}

export interface ValidationCheck {
  passed: boolean;
  confidence: number;
  details: Record<string, any>;
  reason?: string;
}

/**
 * Fraud Detection Service for validating GPS submissions and detecting suspicious patterns
 */
export class FraudDetectionService {
  // Maximum reasonable travel speeds (m/s)
  private static readonly MAX_WALKING_SPEED = 2.5; // ~9 km/h
  private static readonly MAX_DRIVING_SPEED = 50; // ~180 km/h (highway + buffer)
  private static readonly MAX_FLIGHT_SPEED = 250; // ~900 km/h (commercial aircraft)
  
  // Minimum time between submissions (seconds)
  private static readonly MIN_SUBMISSION_INTERVAL = 60; // 1 minute
  
  // Maximum submissions per day per user
  private static readonly MAX_DAILY_SUBMISSIONS = 50;
  
  // GPS accuracy thresholds
  private static readonly GOOD_GPS_ACCURACY = 10; // meters
  private static readonly POOR_GPS_ACCURACY = 100; // meters

  /**
   * Validate a submission for potential fraud
   * @param submission The submission to validate
   * @param userHistory User's submission history
   * @param challengeLocation The challenge's GPS location
   * @returns Fraud detection result
   */
  async validateSubmission(
    submission: Submission,
    userHistory: UserSubmissionHistory,
    challengeLocation: GPSCoordinate
  ): Promise<FraudDetectionResult> {
    const checks = await Promise.all([
      this.validateGPSLocation(submission.gpsCoordinates, challengeLocation),
      this.validateTravelSpeed(submission, userHistory),
      this.validateSubmissionTiming(submission, userHistory),
      this.validateSubmissionPattern(submission, userHistory),
      this.validateGPSAccuracy(submission.gpsCoordinates)
    ]);

    return this.aggregateValidationResults(checks);
  }

  /**
   * Validate GPS location against known spoofing patterns
   * @param userLocation User's reported GPS coordinates
   * @param challengeLocation Challenge's actual GPS coordinates
   * @returns Validation check result
   */
  private async validateGPSLocation(
    userLocation: GPSCoordinate,
    challengeLocation: GPSCoordinate
  ): Promise<ValidationCheck> {
    const validation = validateAndNormalizeCoordinate(userLocation);
    
    if (!validation.isValid) {
      return {
        passed: false,
        confidence: 0,
        details: { errors: validation.errors },
        reason: 'Invalid GPS coordinates'
      };
    }

    const distance = calculateDistance(userLocation, challengeLocation);
    
    // Check for exact coordinate matches (potential spoofing)
    const isExactMatch = userLocation.latitude === challengeLocation.latitude &&
                        userLocation.longitude === challengeLocation.longitude;
    
    if (isExactMatch) {
      return {
        passed: false,
        confidence: 0.9,
        details: { distance, exactMatch: true },
        reason: 'Exact coordinate match suggests GPS spoofing'
      };
    }

    // Check for suspiciously perfect accuracy
    if (userLocation.accuracy && userLocation.accuracy < 1) {
      return {
        passed: false,
        confidence: 0.8,
        details: { accuracy: userLocation.accuracy },
        reason: 'Unrealistically high GPS accuracy'
      };
    }

    // Check for common spoofing coordinates (0,0 or other defaults)
    if (this.isCommonSpoofingCoordinate(userLocation)) {
      return {
        passed: false,
        confidence: 0.95,
        details: { coordinates: userLocation },
        reason: 'Common GPS spoofing coordinate detected'
      };
    }

    return {
      passed: true,
      confidence: 0.8,
      details: { distance, accuracy: userLocation.accuracy }
    };
  }

  /**
   * Validate travel speed between submissions
   * @param submission Current submission
   * @param userHistory User's submission history
   * @returns Validation check result
   */
  private async validateTravelSpeed(
    submission: Submission,
    userHistory: UserSubmissionHistory
  ): Promise<ValidationCheck> {
    if (userHistory.submissions.length === 0) {
      return {
        passed: true,
        confidence: 0.5,
        details: { reason: 'No previous submissions to compare' }
      };
    }

    // Get the most recent submission
    const lastSubmission = userHistory.submissions
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

    if (!lastSubmission.gpsCoordinates.timestamp || !submission.gpsCoordinates.timestamp) {
      return {
        passed: true,
        confidence: 0.3,
        details: { reason: 'Missing timestamps for speed calculation' }
      };
    }

    const speed = calculateSpeed(lastSubmission.gpsCoordinates, submission.gpsCoordinates);
    
    if (speed === null) {
      return {
        passed: true,
        confidence: 0.3,
        details: { reason: 'Could not calculate speed' }
      };
    }

    const distance = calculateDistance(lastSubmission.gpsCoordinates, submission.gpsCoordinates);
    const timeDiff = Math.abs(
      submission.gpsCoordinates.timestamp.getTime() - 
      lastSubmission.gpsCoordinates.timestamp.getTime()
    ) / 1000;

    // Check for impossible travel speeds
    if (speed > FraudDetectionService.MAX_FLIGHT_SPEED) {
      return {
        passed: false,
        confidence: 0.95,
        details: { speed, distance, timeDiff, maxSpeed: FraudDetectionService.MAX_FLIGHT_SPEED },
        reason: 'Impossible travel speed detected'
      };
    }

    // Flag suspicious but possible speeds
    if (speed > FraudDetectionService.MAX_DRIVING_SPEED) {
      return {
        passed: true,
        confidence: 0.4,
        details: { speed, distance, timeDiff, suspicious: true },
        reason: 'High travel speed detected'
      };
    }

    return {
      passed: true,
      confidence: 0.8,
      details: { speed, distance, timeDiff }
    };
  }

  /**
   * Validate submission timing patterns
   * @param submission Current submission
   * @param userHistory User's submission history
   * @returns Validation check result
   */
  private async validateSubmissionTiming(
    submission: Submission,
    userHistory: UserSubmissionHistory
  ): Promise<ValidationCheck> {
    const now = submission.submittedAt;
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count submissions in the last 24 hours
    const recentSubmissions = userHistory.submissions.filter(
      s => s.submittedAt >= oneDayAgo
    );

    // Check for too many submissions in one day
    if (recentSubmissions.length >= FraudDetectionService.MAX_DAILY_SUBMISSIONS) {
      return {
        passed: false,
        confidence: 0.9,
        details: { 
          dailySubmissions: recentSubmissions.length,
          maxAllowed: FraudDetectionService.MAX_DAILY_SUBMISSIONS
        },
        reason: 'Exceeded maximum daily submissions'
      };
    }

    // Check for rapid-fire submissions
    if (userHistory.lastSubmissionAt) {
      const timeSinceLastSubmission = (now.getTime() - userHistory.lastSubmissionAt.getTime()) / 1000;
      
      if (timeSinceLastSubmission < FraudDetectionService.MIN_SUBMISSION_INTERVAL) {
        return {
          passed: false,
          confidence: 0.8,
          details: { 
            timeSinceLastSubmission,
            minInterval: FraudDetectionService.MIN_SUBMISSION_INTERVAL
          },
          reason: 'Submissions too close together'
        };
      }
    }

    // Check for suspicious timing patterns (e.g., submissions at exact intervals)
    const intervals = this.calculateSubmissionIntervals(userHistory.submissions);
    const suspiciousPattern = this.detectSuspiciousTimingPattern(intervals);
    
    if (suspiciousPattern) {
      return {
        passed: true,
        confidence: 0.4,
        details: { intervals, pattern: suspiciousPattern },
        reason: 'Suspicious timing pattern detected'
      };
    }

    return {
      passed: true,
      confidence: 0.8,
      details: { 
        dailySubmissions: recentSubmissions.length,
        timeSinceLastSubmission: userHistory.lastSubmissionAt ? 
          (now.getTime() - userHistory.lastSubmissionAt.getTime()) / 1000 : null
      }
    };
  }

  /**
   * Validate submission patterns for suspicious behavior
   * @param submission Current submission
   * @param userHistory User's submission history
   * @returns Validation check result
   */
  private async validateSubmissionPattern(
    submission: Submission,
    userHistory: UserSubmissionHistory
  ): Promise<ValidationCheck> {
    // Check for duplicate challenge attempts
    const duplicateAttempts = userHistory.submissions.filter(
      s => s.challengeId === submission.challengeId
    );

    if (duplicateAttempts.length > 0) {
      return {
        passed: false,
        confidence: 0.9,
        details: { duplicateAttempts: duplicateAttempts.length },
        reason: 'Duplicate challenge submission detected'
      };
    }

    // Check for suspicious proof patterns
    const sameProofTypeCount = userHistory.submissions.filter(
      s => s.proofType === submission.proofType
    ).length;

    const totalSubmissions = userHistory.totalSubmissions;
    const proofTypeRatio = totalSubmissions > 0 ? sameProofTypeCount / totalSubmissions : 0;

    // Flag if user only uses one type of proof (potential automation)
    if (totalSubmissions > 10 && proofTypeRatio > 0.9) {
      return {
        passed: true,
        confidence: 0.5,
        details: { 
          proofTypeRatio,
          sameProofTypeCount,
          totalSubmissions
        },
        reason: 'Suspicious proof type pattern'
      };
    }

    // Check for rapid completion patterns
    const avgCompletionTime = this.calculateAverageCompletionTime(userHistory.submissions);
    if (avgCompletionTime < 30) { // Less than 30 seconds average
      return {
        passed: true,
        confidence: 0.4,
        details: { avgCompletionTime },
        reason: 'Unusually fast completion times'
      };
    }

    return {
      passed: true,
      confidence: 0.8,
      details: { 
        proofTypeRatio,
        avgCompletionTime,
        duplicateAttempts: duplicateAttempts.length
      }
    };
  }

  /**
   * Validate GPS accuracy for potential spoofing
   * @param coordinates GPS coordinates to validate
   * @returns Validation check result
   */
  private async validateGPSAccuracy(coordinates: GPSCoordinate): Promise<ValidationCheck> {
    if (!coordinates.accuracy) {
      return {
        passed: true,
        confidence: 0.3,
        details: { reason: 'No accuracy information provided' }
      };
    }

    // Very poor accuracy suggests potential issues
    if (coordinates.accuracy > FraudDetectionService.POOR_GPS_ACCURACY) {
      return {
        passed: true,
        confidence: 0.4,
        details: { 
          accuracy: coordinates.accuracy,
          threshold: FraudDetectionService.POOR_GPS_ACCURACY
        },
        reason: 'Poor GPS accuracy'
      };
    }

    // Good accuracy increases confidence
    if (coordinates.accuracy <= FraudDetectionService.GOOD_GPS_ACCURACY) {
      return {
        passed: true,
        confidence: 0.9,
        details: { accuracy: coordinates.accuracy }
      };
    }

    return {
      passed: true,
      confidence: 0.7,
      details: { accuracy: coordinates.accuracy }
    };
  }

  /**
   * Aggregate validation results into a final fraud detection result
   * @param checks Array of validation checks
   * @returns Final fraud detection result
   */
  private aggregateValidationResults(checks: ValidationCheck[]): FraudDetectionResult {
    const failedChecks = checks.filter(check => !check.passed);
    const reasons = checks.filter(check => check.reason).map(check => check.reason!);
    
    // Calculate overall confidence (weighted average)
    const totalConfidence = checks.reduce((sum, check) => sum + check.confidence, 0);
    const avgConfidence = totalConfidence / checks.length;
    
    // Determine fraud risk
    let fraudRisk: 'low' | 'medium' | 'high' = 'low';
    let recommendedAction: 'approve' | 'review' | 'reject' = 'approve';
    
    if (failedChecks.length > 0) {
      fraudRisk = 'high';
      recommendedAction = 'reject';
    } else if (avgConfidence < 0.5 || reasons.length > 2) {
      fraudRisk = 'medium';
      recommendedAction = 'review';
    } else if (avgConfidence < 0.7 || reasons.length > 0) {
      fraudRisk = 'medium';
      recommendedAction = 'review';
    }

    return {
      isValid: failedChecks.length === 0,
      fraudRisk,
      reasons,
      confidence: avgConfidence,
      recommendedAction
    };
  }

  /**
   * Check if coordinates match common spoofing patterns
   * @param coordinates GPS coordinates to check
   * @returns True if coordinates match known spoofing patterns
   */
  private isCommonSpoofingCoordinate(coordinates: GPSCoordinate): boolean {
    const commonSpoofingCoords = [
      { lat: 0, lon: 0 }, // Null Island
      { lat: 37.7749, lon: -122.4194 }, // San Francisco (common default)
      { lat: 40.7128, lon: -74.0060 }, // New York (common default)
      { lat: 51.5074, lon: -0.1278 }, // London (common default)
    ];

    return commonSpoofingCoords.some(coord => 
      Math.abs(coordinates.latitude - coord.lat) < 0.0001 &&
      Math.abs(coordinates.longitude - coord.lon) < 0.0001
    );
  }

  /**
   * Calculate intervals between submissions
   * @param submissions Array of submissions
   * @returns Array of intervals in seconds
   */
  private calculateSubmissionIntervals(submissions: Submission[]): number[] {
    if (submissions.length < 2) return [];
    
    const sortedSubmissions = submissions.sort((a, b) => 
      a.submittedAt.getTime() - b.submittedAt.getTime()
    );
    
    const intervals: number[] = [];
    for (let i = 1; i < sortedSubmissions.length; i++) {
      const interval = (sortedSubmissions[i].submittedAt.getTime() - 
                       sortedSubmissions[i-1].submittedAt.getTime()) / 1000;
      intervals.push(interval);
    }
    
    return intervals;
  }

  /**
   * Detect suspicious timing patterns in submission intervals
   * @param intervals Array of submission intervals in seconds
   * @returns Description of suspicious pattern if found
   */
  private detectSuspiciousTimingPattern(intervals: number[]): string | null {
    if (intervals.length < 3) return null;
    
    // Check for exact intervals (automation)
    const exactIntervals = intervals.filter((interval, index) => 
      index > 0 && Math.abs(interval - intervals[index - 1]) < 5
    );
    
    if (exactIntervals.length > intervals.length * 0.7) {
      return 'Regular interval pattern suggests automation';
    }
    
    // Check for very short intervals
    const shortIntervals = intervals.filter(interval => interval < 60);
    if (shortIntervals.length > intervals.length * 0.5) {
      return 'Many rapid submissions detected';
    }
    
    return null;
  }

  /**
   * Calculate average completion time for submissions
   * @param submissions Array of submissions
   * @returns Average completion time in seconds
   */
  private calculateAverageCompletionTime(submissions: Submission[]): number {
    if (submissions.length === 0) return 0;
    
    // This is a simplified calculation - in a real implementation,
    // you'd track when users started viewing challenges
    const completionTimes = submissions.map(submission => {
      // Assume average viewing time before submission
      return 120; // 2 minutes default
    });
    
    return completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
  }
}