/**
 * Proof Submission Component for handling different types of challenge proof submissions
 */

import { Devvit } from '@devvit/public-api';
import { 
  Challenge, 
  ProofType, 
  ProofSubmission, 
  PhotoProof, 
  ReceiptProof, 
  GPSProof, 
  QuestionProof,
  GPSCoordinate,
  Submission
} from '../types/core.js';
import { verifyLocationWithinRadius, validateAndNormalizeCoordinate } from '../utils/gpsUtils.js';
import { getAnalyticsClient } from '../services/analytics.js';
import { ChallengeCompletion } from '../types/analytics.js';
import { SubmissionValidationService } from '../services/submissionValidation.js';
import { SecurityMonitoringService } from '../services/securityMonitoring.js';
import { ValidationResult } from '../types/errors.js';

export interface ProofSubmissionProps {
  challenge: Challenge;
  userLocation?: GPSCoordinate;
  onSubmissionComplete?: (submission: Submission) => void;
  onCancel?: () => void;
}

export interface SubmissionFormState {
  selectedProofType?: ProofType;
  isSubmitting: boolean;
  error?: string;
  success?: boolean;
  currentStep: 'select' | 'capture' | 'verify' | 'submit' | 'complete';
}

/**
 * Proof Submission Component
 * Handles the complete proof submission flow including GPS verification
 */
export class ProofSubmissionComponent {
  private static validationService = new SubmissionValidationService();
  private static securityService = new SecurityMonitoringService();

  /**
   * Get current user location with timeout and error handling
   */
  static async getCurrentLocation(timeoutMs: number = 10000): Promise<GPSCoordinate | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null);
      }, timeoutMs);

      if (!navigator.geolocation) {
        clearTimeout(timeout);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          });
        },
        (error) => {
          clearTimeout(timeout);
          console.error('GPS error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs - 1000,
          maximumAge: 30000 // 30 seconds
        }
      );
    });
  }

  /**
   * Verify GPS location against challenge requirements
   */
  static verifyGPSLocation(
    userLocation: GPSCoordinate,
    challenge: Challenge
  ): { isValid: boolean; message: string; distance: number } {
    const verification = verifyLocationWithinRadius(
      userLocation,
      challenge.location.coordinates,
      challenge.location.verificationRadius
    );

    if (!verification.isValid) {
      return {
        isValid: false,
        message: `You must be within ${challenge.location.verificationRadius}m of ${challenge.location.businessName}. You are ${verification.distance}m away.`,
        distance: verification.distance
      };
    }

    if (verification.fraudRisk === 'high') {
      return {
        isValid: false,
        message: 'GPS location could not be verified. Please ensure location services are enabled and try again.',
        distance: verification.distance
      };
    }

    return {
      isValid: true,
      message: `Location verified! You are ${verification.distance}m from ${challenge.location.businessName}.`,
      distance: verification.distance
    };
  }

  /**
   * Validate photo proof submission
   */
  static validatePhotoProof(photoData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!photoData.imageUrl) {
      errors.push('Photo is required');
    }

    // Basic validation - in a real implementation, this would use image analysis
    if (photoData.imageUrl && photoData.imageUrl.length < 10) {
      errors.push('Invalid photo data');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate receipt proof submission
   */
  static validateReceiptProof(receiptData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!receiptData.imageUrl) {
      errors.push('Receipt photo is required');
    }

    if (!receiptData.businessName) {
      errors.push('Business name is required');
    }

    if (!receiptData.timestamp) {
      errors.push('Receipt timestamp is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate location question proof
   */
  static validateQuestionProof(questionData: any, challenge: Challenge): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!questionData.answer) {
      errors.push('Answer is required');
    }

    // In a real implementation, this would check against stored correct answers
    // For now, we'll assume any non-empty answer is valid
    if (questionData.answer && questionData.answer.trim().length < 2) {
      errors.push('Answer is too short');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Submit proof and create Reddit post/comment
   */
  static async submitProof(
    context: Devvit.Context,
    challenge: Challenge,
    proofSubmission: ProofSubmission,
    userLocation: GPSCoordinate
  ): Promise<{ success: boolean; submission?: Submission; error?: string }> {
    try {
      // Get current user
      const currentUser = await context.reddit.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Create preliminary submission for validation
      const preliminarySubmission: Submission = {
        id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        challengeId: challenge.id,
        userRedditUsername: currentUser.username,
        proofType: proofSubmission.type,
        proofData: proofSubmission.data,
        submittedAt: new Date(),
        verificationStatus: 'pending',
        gpsCoordinates: userLocation,
        fraudRiskScore: 0,
      };

      // Get user submission history for validation
      const userHistory = await this.getUserSubmissionHistory(context, currentUser.username);

      // Comprehensive validation using the new validation service
      const validationResult = await this.validationService.validateSubmission(
        preliminarySubmission,
        challenge,
        userHistory,
        proofSubmission
      );

      // Log validation failures to security monitoring
      if (!validationResult.isValid) {
        await this.securityService.logValidationFailure(
          currentUser.username,
          challenge.id,
          preliminarySubmission.id,
          validationResult
        );

        return { 
          success: false, 
          error: validationResult.errors.map(e => e.message).join(', ') 
        };
      }

      // Check for warnings that might require flagging
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        const warningMessages = validationResult.warnings.map(w => w.message);
        await this.securityService.flagSubmissionForReview(
          preliminarySubmission.id,
          currentUser.username,
          challenge.id,
          `Validation warnings: ${warningMessages.join(', ')}`,
          'low',
          warningMessages,
          0.3,
          { validationWarnings: validationResult.warnings }
        );
      }

      // Create submission record
      const submission: Submission = {
        id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        challengeId: challenge.id,
        userRedditUsername: currentUser.username,
        proofType: proofSubmission.type,
        proofData: proofSubmission.data,
        submittedAt: new Date(),
        verificationStatus: 'approved', // Auto-approve for now
        gpsCoordinates: userLocation,
        fraudRiskScore: 0.1, // Low risk for now
        redditPostUrl: '', // Will be filled after Reddit post creation
      };

      // Create Reddit post or comment
      const redditContent = this.generateRedditContent(challenge, proofSubmission, locationVerification.distance);
      
      try {
        // Try to create a comment on the challenge post if it exists
        if (challenge.redditPostId) {
          const comment = await context.reddit.submitComment({
            id: challenge.redditPostId,
            text: redditContent
          });
          submission.redditCommentUrl = `https://reddit.com${comment.permalink}`;
        } else {
          // Create a new post in the subreddit
          const post = await context.reddit.submitPost({
            title: `Challenge Completed: ${challenge.title}`,
            text: redditContent,
            subredditName: 'michiganspots'
          });
          submission.redditPostUrl = `https://reddit.com${post.permalink}`;
        }
      } catch (redditError) {
        console.error('Failed to create Reddit post/comment:', redditError);
        // Continue with submission even if Reddit post fails
      }

      // Store submission in Redis
      await context.redis.set(
        `submission:${submission.id}`,
        JSON.stringify(submission),
        { expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } // 1 year
      );

      // Update user's completed challenges
      const userKey = `user:${currentUser.username}`;
      const userData = await context.redis.get(userKey);
      let userProfile = userData ? JSON.parse(userData) : {
        redditUsername: currentUser.username,
        totalPoints: 0,
        completedChallenges: [],
        badges: [],
        joinedAt: new Date(),
        lastActiveAt: new Date(),
        preferences: {
          notifications: true,
          leaderboardVisible: true,
          locationSharing: true
        },
        statistics: {
          totalSubmissions: 0,
          successfulSubmissions: 0,
          averageCompletionTime: 0,
          favoritePartners: []
        }
      };

      // Update user profile
      if (!userProfile.completedChallenges.includes(challenge.id)) {
        userProfile.completedChallenges.push(challenge.id);
        userProfile.totalPoints += challenge.points;
        userProfile.statistics.totalSubmissions += 1;
        userProfile.statistics.successfulSubmissions += 1;
        userProfile.lastActiveAt = new Date();
      }

      await context.redis.set(userKey, JSON.stringify(userProfile));

      // Send analytics event
      try {
        const analyticsClient = getAnalyticsClient();
        const completionEvent: ChallengeCompletion = {
          challengeId: parseInt(challenge.id),
          userRedditUsername: currentUser.username,
          submissionUrl: submission.redditPostUrl || submission.redditCommentUrl || '',
          submissionType: submission.redditPostUrl ? 'post' : 'comment',
          completedAt: submission.submittedAt.toISOString(),
          gpsCoordinates: userLocation,
          proofType: proofSubmission.type,
          pointsAwarded: challenge.points,
          verificationStatus: 'approved',
          timestamp: submission.submittedAt.toISOString()
        };

        await analyticsClient.trackChallenge(completionEvent);
      } catch (analyticsError) {
        console.error('Failed to send analytics event:', analyticsError);
        // Don't fail the submission if analytics fails
      }

      return { success: true, submission };

    } catch (error) {
      console.error('Proof submission error:', error);
      
      // Log system errors to security monitoring
      if (currentUser) {
        await this.securityService.logSecurityEvent(
          'VALIDATION_FAILURE' as any,
          'medium',
          currentUser.username,
          `System error during submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { 
            error: error instanceof Error ? error.message : 'Unknown error',
            challengeId: challenge.id,
            proofType: proofSubmission.type
          },
          challenge.id
        );
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get user submission history for validation
   */
  private static async getUserSubmissionHistory(
    context: Devvit.Context,
    username: string
  ): Promise<UserSubmissionHistory> {
    try {
      // Get user's submission history from Redis
      const submissionKeys = await context.redis.scan({
        pattern: `submission:*`,
        count: 1000
      });

      const userSubmissions: Submission[] = [];
      let lastSubmissionAt: Date | undefined;
      let suspiciousActivityCount = 0;

      for (const key of submissionKeys) {
        const submissionData = await context.redis.get(key);
        if (submissionData) {
          const submission: Submission = JSON.parse(submissionData);
          if (submission.userRedditUsername === username) {
            userSubmissions.push(submission);
            
            if (!lastSubmissionAt || submission.submittedAt > lastSubmissionAt) {
              lastSubmissionAt = submission.submittedAt;
            }

            // Count suspicious activities (rejected submissions)
            if (submission.verificationStatus === 'rejected') {
              suspiciousActivityCount++;
            }
          }
        }
      }

      return {
        userRedditUsername: username,
        submissions: userSubmissions,
        lastSubmissionAt,
        totalSubmissions: userSubmissions.length,
        suspiciousActivityCount
      };

    } catch (error) {
      console.error('Error getting user submission history:', error);
      return {
        userRedditUsername: username,
        submissions: [],
        totalSubmissions: 0,
        suspiciousActivityCount: 0
      };
    }
  }

  /**
   * Generate Reddit post/comment content for submission
   */
  static generateRedditContent(
    challenge: Challenge,
    proofSubmission: ProofSubmission,
    distance: number
  ): string {
    const proofTypeText = {
      photo: '📸 Photo proof',
      receipt: '🧾 Receipt proof',
      gps_checkin: '📍 GPS check-in',
      location_question: '❓ Location question answered'
    };

    return `🎯 **Challenge Completed: ${challenge.title}**

🏢 **Business:** ${challenge.partnerName}
📍 **Location:** ${challenge.location.businessName}
🎖️ **Points Earned:** ${challenge.points}
📋 **Proof Type:** ${proofTypeText[proofSubmission.type]}
📏 **Distance:** ${distance}m from location

Thanks to ${challenge.partnerName} for participating in Michigan Spots! 

#MichiganSpots #LocalBusiness #TreasureHunt`;
  }

  /**
   * Create proof type selection blocks
   */
  static createProofTypeSelectionBlocks(
    challenge: Challenge,
    onProofTypeSelected: (proofType: ProofType) => void
  ): any[] {
    const proofTypeInfo = {
      photo: {
        emoji: '📸',
        title: 'Photo Proof',
        description: 'Take a photo showing the business signage or interior',
        instructions: 'Make sure the business name or logo is clearly visible'
      },
      receipt: {
        emoji: '🧾',
        title: 'Receipt Proof',
        description: 'Upload a photo of your receipt or purchase',
        instructions: 'Receipt must show the business name and recent timestamp'
      },
      gps_checkin: {
        emoji: '📍',
        title: 'GPS Check-in',
        description: 'Simple location verification at the business',
        instructions: 'Must be within 100 meters of the business location'
      },
      location_question: {
        emoji: '❓',
        title: 'Location Question',
        description: 'Answer a question about the business location',
        instructions: 'Visit the business to find the answer'
      }
    };

    return [
      {
        type: 'text',
        size: 'large',
        weight: 'bold',
        color: 'black',
        text: 'Select Proof Type'
      },
      {
        type: 'text',
        size: 'medium',
        color: '#6b7280',
        text: 'Choose how you want to prove you visited this business:'
      },
      ...challenge.proofRequirements.types.map(proofType => {
        const info = proofTypeInfo[proofType];
        return {
          type: 'vstack',
          gap: 'small',
          padding: 'medium',
          backgroundColor: 'white',
          cornerRadius: 'medium',
          border: 'thin',
          borderColor: '#e5e7eb',
          children: [
            {
              type: 'hstack',
              gap: 'medium',
              children: [
                {
                  type: 'text',
                  size: 'large',
                  text: info.emoji
                },
                {
                  type: 'vstack',
                  gap: 'small',
                  children: [
                    {
                      type: 'text',
                      size: 'medium',
                      weight: 'bold',
                      color: 'black',
                      text: info.title
                    },
                    {
                      type: 'text',
                      size: 'small',
                      color: '#6b7280',
                      text: info.description
                    }
                  ]
                }
              ]
            },
            {
              type: 'text',
              size: 'small',
              color: '#9ca3af',
              text: info.instructions
            },
            {
              type: 'button',
              text: `Select ${info.title}`,
              appearance: 'secondary' as const,
              onPress: () => onProofTypeSelected(proofType)
            }
          ]
        };
      })
    ];
  }

  /**
   * Create GPS verification blocks
   */
  static createGPSVerificationBlocks(
    challenge: Challenge,
    userLocation?: GPSCoordinate,
    onLocationCaptured?: (location: GPSCoordinate) => void,
    onRetry?: () => void
  ): any[] {
    if (!userLocation) {
      return [
        {
          type: 'text',
          size: 'large',
          weight: 'bold',
          color: 'black',
          text: '📍 Location Verification Required'
        },
        {
          type: 'text',
          size: 'medium',
          color: '#6b7280',
          text: `You must be within ${challenge.location.verificationRadius}m of ${challenge.location.businessName} to submit proof.`
        },
        {
          type: 'button',
          text: '📍 Get My Location',
          appearance: 'primary' as const,
          onPress: async () => {
            const location = await ProofSubmissionComponent.getCurrentLocation();
            if (location && onLocationCaptured) {
              onLocationCaptured(location);
            }
          }
        }
      ];
    }

    const verification = this.verifyGPSLocation(userLocation, challenge);
    
    return [
      {
        type: 'text',
        size: 'large',
        weight: 'bold',
        color: verification.isValid ? '#059669' : '#dc2626',
        text: verification.isValid ? '✅ Location Verified' : '❌ Location Verification Failed'
      },
      {
        type: 'text',
        size: 'medium',
        color: '#374151',
        text: verification.message
      },
      ...(verification.isValid ? [] : [{
        type: 'button',
        text: '🔄 Try Again',
        appearance: 'secondary' as const,
        onPress: onRetry
      }])
    ];
  }
}

/**
 * Render function for proof submission component
 */
export function renderProofSubmission(
  context: Devvit.Context,
  props: ProofSubmissionProps
): any {
  // This would typically use state management in a real Devvit app
  // For now, we'll create a simplified version that shows the proof selection
  
  const proofSelectionBlocks = ProofSubmissionComponent.createProofTypeSelectionBlocks(
    props.challenge,
    (proofType: ProofType) => {
      console.log(`Selected proof type: ${proofType}`);
      // In a real implementation, this would update component state
      // and show the appropriate capture interface
    }
  );

  const gpsBlocks = ProofSubmissionComponent.createGPSVerificationBlocks(
    props.challenge,
    props.userLocation,
    (location: GPSCoordinate) => {
      console.log('Location captured:', location);
      // In a real implementation, this would update the component state
    },
    () => {
      console.log('Retrying location capture');
      // In a real implementation, this would retry location capture
    }
  );

  return {
    type: 'vstack',
    gap: 'medium',
    padding: 'medium',
    children: [
      {
        type: 'text',
        size: 'xxlarge',
        weight: 'bold',
        color: 'black',
        text: '📤 Submit Proof'
      },
      {
        type: 'text',
        size: 'medium',
        color: '#6b7280',
        text: `Challenge: ${props.challenge.title}`
      },
      
      // GPS Verification Section
      {
        type: 'vstack',
        gap: 'small',
        padding: 'medium',
        backgroundColor: '#f8fafc',
        cornerRadius: 'medium',
        border: 'thin',
        borderColor: '#e2e8f0',
        children: gpsBlocks
      },

      // Proof Type Selection Section
      {
        type: 'vstack',
        gap: 'medium',
        children: proofSelectionBlocks
      },

      // Cancel button
      {
        type: 'button',
        text: 'Cancel',
        appearance: 'secondary' as const,
        onPress: () => {
          if (props.onCancel) {
            props.onCancel();
          }
        }
      }
    ]
  };
}