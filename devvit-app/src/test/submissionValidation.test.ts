/**
 * Unit tests for submission validation service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubmissionValidationService } from '../services/submissionValidation.js';
import { FraudDetectionService } from '../services/fraudDetection.js';
import { 
  Submission, 
  Challenge, 
  UserSubmissionHistory, 
  ProofSubmission,
  GPSCoordinate,
  PhotoProof,
  ReceiptProof,
  GPSProof,
  QuestionProof
} from '../types/core.js';

describe('SubmissionValidationService', () => {
  let validationService: SubmissionValidationService;
  let mockChallenge: Challenge;
  let mockSubmission: Submission;
  let mockUserHistory: UserSubmissionHistory;
  let mockProofSubmission: ProofSubmission;

  beforeEach(() => {
    // Mock the fraud detection service to return valid results by default
    vi.spyOn(FraudDetectionService.prototype, 'validateSubmission').mockResolvedValue({
      isValid: true,
      fraudRisk: 'low',
      reasons: [],
      confidence: 0.9,
      recommendedAction: 'approve'
    });
    
    validationService = new SubmissionValidationService();
    
    mockChallenge = {
      id: 'challenge_1',
      title: 'Test Challenge',
      description: 'Test description',
      partnerId: 'partner_1',
      partnerName: 'Test Partner',
      partnerBranding: {
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#000000',
        secondaryColor: '#ffffff'
      },
      difficulty: 'medium',
      points: 25,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      location: {
        coordinates: { latitude: 42.3314, longitude: -83.0458 },
        address: '123 Test St, Detroit, MI',
        businessName: 'Test Business',
        verificationRadius: 100
      },
      proofRequirements: {
        types: ['photo', 'gps_checkin'],
        instructions: 'Take a photo or check in'
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockSubmission = {
      id: 'submission_1',
      challengeId: 'challenge_1',
      userRedditUsername: 'testuser',
      proofType: 'photo',
      proofData: {},
      submittedAt: new Date(),
      verificationStatus: 'pending',
      gpsCoordinates: { latitude: 42.3315, longitude: -83.0459, accuracy: 10 }, // Slightly different to avoid exact match
      fraudRiskScore: 0.1
    };

    mockUserHistory = {
      userRedditUsername: 'testuser',
      submissions: [],
      totalSubmissions: 0,
      suspiciousActivityCount: 0
    };

    mockProofSubmission = {
      type: 'photo',
      data: {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      } as PhotoProof,
      metadata: {
        timestamp: new Date(),
        location: { latitude: 42.3315, longitude: -83.0459 },
        deviceInfo: 'test-device'
      }
    };
  });

  describe('validateSubmission', () => {
    it('should validate a correct submission', async () => {
      const result = await validationService.validateSubmission(
        mockSubmission,
        mockChallenge,
        mockUserHistory,
        mockProofSubmission
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject submission with missing required fields', async () => {
      const invalidSubmission = { ...mockSubmission, challengeId: '' };
      
      const result = await validationService.validateSubmission(
        invalidSubmission,
        mockChallenge,
        mockUserHistory,
        mockProofSubmission
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'challengeId',
          code: 'MISSING_CHALLENGE_ID'
        })
      );
    });

    it('should reject submission for expired challenge', async () => {
      const expiredChallenge = {
        ...mockChallenge,
        endDate: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      };
      
      const result = await validationService.validateSubmission(
        mockSubmission,
        expiredChallenge,
        mockUserHistory,
        mockProofSubmission
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'challenge',
          code: 'CHALLENGE_EXPIRED'
        })
      );
    });

    it('should reject duplicate submission', async () => {
      const historyWithDuplicate = {
        ...mockUserHistory,
        submissions: [{
          ...mockSubmission,
          verificationStatus: 'approved' as const
        }]
      };
      
      const result = await validationService.validateSubmission(
        mockSubmission,
        mockChallenge,
        historyWithDuplicate,
        mockProofSubmission
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'challengeId',
          code: 'DUPLICATE_SUBMISSION'
        })
      );
    });

    it('should reject submission when rate limit exceeded', async () => {
      // Create history with many recent submissions
      const recentSubmissions = Array.from({ length: 51 }, (_, i) => ({
        ...mockSubmission,
        id: `submission_${i}`,
        challengeId: `challenge_${i}`,
        submittedAt: new Date(Date.now() - i * 60 * 1000) // Spread over last hour
      }));

      const historyWithManySubmissions = {
        ...mockUserHistory,
        submissions: recentSubmissions,
        totalSubmissions: 51
      };
      
      const result = await validationService.validateSubmission(
        mockSubmission,
        mockChallenge,
        historyWithManySubmissions,
        mockProofSubmission
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'RATE_LIMIT_EXCEEDED'
        })
      );
    });

    it('should reject submission with invalid proof type', async () => {
      const invalidSubmission = {
        ...mockSubmission,
        proofType: 'receipt' as const // Challenge only allows 'photo' and 'gps_checkin'
      };
      
      const result = await validationService.validateSubmission(
        invalidSubmission,
        mockChallenge,
        mockUserHistory,
        mockProofSubmission
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'proofType',
          code: 'INVALID_PROOF_TYPE'
        })
      );
    });

    it('should reject submission with location too far', async () => {
      const farLocation = { latitude: 42.4000, longitude: -83.1000, accuracy: 10 };
      const submissionTooFar = {
        ...mockSubmission,
        gpsCoordinates: farLocation
      };
      
      const result = await validationService.validateSubmission(
        submissionTooFar,
        mockChallenge,
        mockUserHistory,
        mockProofSubmission
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'gpsCoordinates',
          code: 'LOCATION_TOO_FAR'
        })
      );
    });
  });

  describe('photo proof validation', () => {
    it('should validate correct photo proof', async () => {
      const photoProof: ProofSubmission = {
        type: 'photo',
        data: {
          imageUrl: 'https://example.com/valid-photo.jpg',
          hasBusinessSignage: true,
          hasInteriorView: true,
          gpsEmbedded: true
        } as PhotoProof,
        metadata: {
          timestamp: new Date(),
          location: mockSubmission.gpsCoordinates,
          deviceInfo: 'test-device'
        }
      };

      const result = await validationService.validateSubmission(
        mockSubmission,
        mockChallenge,
        mockUserHistory,
        photoProof
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject photo proof without image', async () => {
      const invalidPhotoProof: ProofSubmission = {
        type: 'photo',
        data: {
          imageUrl: '',
          hasBusinessSignage: false,
          hasInteriorView: false,
          gpsEmbedded: false
        } as PhotoProof,
        metadata: {
          timestamp: new Date(),
          location: mockSubmission.gpsCoordinates,
          deviceInfo: 'test-device'
        }
      };

      const result = await validationService.validateSubmission(
        mockSubmission,
        mockChallenge,
        mockUserHistory,
        invalidPhotoProof
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'imageUrl',
          code: 'MISSING_PHOTO'
        })
      );
    });
  });

  describe('receipt proof validation', () => {
    it('should validate correct receipt proof', async () => {
      const receiptProof: ProofSubmission = {
        type: 'receipt',
        data: {
          imageUrl: 'https://example.com/receipt.jpg',
          businessName: 'Test Business',
          timestamp: new Date(),
          amount: 25.50
        } as ReceiptProof,
        metadata: {
          timestamp: new Date(),
          location: mockSubmission.gpsCoordinates,
          deviceInfo: 'test-device'
        }
      };

      const receiptChallenge = {
        ...mockChallenge,
        proofRequirements: {
          types: ['receipt' as const],
          instructions: 'Upload receipt'
        }
      };

      const receiptSubmission = {
        ...mockSubmission,
        proofType: 'receipt' as const
      };

      const result = await validationService.validateSubmission(
        receiptSubmission,
        receiptChallenge,
        mockUserHistory,
        receiptProof
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject old receipt', async () => {
      const oldReceiptProof: ProofSubmission = {
        type: 'receipt',
        data: {
          imageUrl: 'https://example.com/receipt.jpg',
          businessName: 'Test Business',
          timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
          amount: 25.50
        } as ReceiptProof,
        metadata: {
          timestamp: new Date(),
          location: mockSubmission.gpsCoordinates,
          deviceInfo: 'test-device'
        }
      };

      const receiptChallenge = {
        ...mockChallenge,
        proofRequirements: {
          types: ['receipt' as const],
          instructions: 'Upload receipt'
        }
      };

      const receiptSubmission = {
        ...mockSubmission,
        proofType: 'receipt' as const
      };

      const result = await validationService.validateSubmission(
        receiptSubmission,
        receiptChallenge,
        mockUserHistory,
        oldReceiptProof
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'timestamp',
          code: 'RECEIPT_TOO_OLD'
        })
      );
    });
  });

  describe('GPS proof validation', () => {
    it('should validate correct GPS proof', async () => {
      const gpsProof: ProofSubmission = {
        type: 'gps_checkin',
        data: {
          coordinates: mockSubmission.gpsCoordinates,
          verificationRadius: 100,
          checkInTime: new Date()
        } as GPSProof,
        metadata: {
          timestamp: new Date(),
          location: mockSubmission.gpsCoordinates,
          deviceInfo: 'test-device'
        }
      };

      const gpsSubmission = {
        ...mockSubmission,
        proofType: 'gps_checkin' as const
      };

      const result = await validationService.validateSubmission(
        gpsSubmission,
        mockChallenge,
        mockUserHistory,
        gpsProof
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('question proof validation', () => {
    it('should validate correct answer', async () => {
      const questionProof: ProofSubmission = {
        type: 'location_question',
        data: {
          question: 'What color is the front door?',
          answer: 'blue',
          correctAnswer: 'blue',
          isCorrect: true
        } as QuestionProof,
        metadata: {
          timestamp: new Date(),
          location: mockSubmission.gpsCoordinates,
          deviceInfo: 'test-device'
        }
      };

      const questionChallenge = {
        ...mockChallenge,
        proofRequirements: {
          types: ['location_question' as const],
          instructions: 'Answer the question'
        }
      };

      const questionSubmission = {
        ...mockSubmission,
        proofType: 'location_question' as const
      };

      const result = await validationService.validateSubmission(
        questionSubmission,
        questionChallenge,
        mockUserHistory,
        questionProof
      );

      expect(result.isValid).toBe(true);
    });

    it('should reject incorrect answer', async () => {
      const questionProof: ProofSubmission = {
        type: 'location_question',
        data: {
          question: 'What color is the front door?',
          answer: 'red',
          correctAnswer: 'blue',
          isCorrect: false
        } as QuestionProof,
        metadata: {
          timestamp: new Date(),
          location: mockSubmission.gpsCoordinates,
          deviceInfo: 'test-device'
        }
      };

      const questionChallenge = {
        ...mockChallenge,
        proofRequirements: {
          types: ['location_question' as const],
          instructions: 'Answer the question'
        }
      };

      const questionSubmission = {
        ...mockSubmission,
        proofType: 'location_question' as const
      };

      const result = await validationService.validateSubmission(
        questionSubmission,
        questionChallenge,
        mockUserHistory,
        questionProof
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'answer',
          code: 'INCORRECT_ANSWER'
        })
      );
    });
  });

  describe('configuration', () => {
    it('should allow updating configuration', () => {
      const newConfig = {
        maxDailySubmissions: 100,
        minSubmissionInterval: 30
      };

      validationService.updateConfig(newConfig);
      const config = validationService.getConfig();

      expect(config.maxDailySubmissions).toBe(100);
      expect(config.minSubmissionInterval).toBe(30);
    });

    it('should disable duplicate prevention when configured', async () => {
      validationService.updateConfig({ duplicatePreventionEnabled: false });

      const historyWithDuplicate = {
        ...mockUserHistory,
        submissions: [{
          ...mockSubmission,
          verificationStatus: 'approved' as const
        }]
      };
      
      const result = await validationService.validateSubmission(
        mockSubmission,
        mockChallenge,
        historyWithDuplicate,
        mockProofSubmission
      );

      expect(result.isValid).toBe(true);
    });
  });
});