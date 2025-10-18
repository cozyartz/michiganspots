/**
 * Unit tests for Challenge Detail and Proof Submission components
 * 
 * Tests challenge detail component rendering with various challenge states,
 * proof submission validation and GPS verification, and analytics event triggering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChallengeDetailComponent } from '../components/ChallengeDetail.js';
import { ChallengeDetailViewComponent } from '../components/ChallengeDetailView.js';
import { ProofSubmissionComponent } from '../components/ProofSubmission.js';
import type { 
  Challenge, 
  GPSCoordinate, 
  ProofSubmission, 
  Submission,
  ProofType 
} from '../types/core.js';
import type { EngagementEvent, ChallengeCompletion } from '../types/analytics.js';

// Mock the analytics service
const mockAnalyticsClient = {
  trackEngagement: vi.fn(),
  trackChallenge: vi.fn(),
  validateEngagement: vi.fn(),
  validateCompletion: vi.fn()
};

vi.mock('../services/analytics.js', () => ({
  getAnalyticsClient: () => mockAnalyticsClient
}));

// Mock GPS utilities
vi.mock('../utils/gpsUtils.js', () => ({
  verifyLocationWithinRadius: vi.fn(),
  validateAndNormalizeCoordinate: vi.fn(),
  calculateDistance: vi.fn()
}));

// Mock Devvit context
const mockDevvitContext = {
  reddit: {
    getCurrentUser: vi.fn(),
    submitPost: vi.fn(),
    submitComment: vi.fn()
  },
  redis: {
    get: vi.fn(),
    set: vi.fn()
  },
  postId: 'test-post-123'
};

// Mock data
const mockGPSCoordinate: GPSCoordinate = {
  latitude: 42.3314,
  longitude: -83.0458,
  accuracy: 10,
  timestamp: new Date('2024-01-01T12:00:00Z')
};

const mockBusinessLocation: GPSCoordinate = {
  latitude: 42.3320,
  longitude: -83.0460,
  accuracy: 5
};

const createMockChallenge = (overrides: Partial<Challenge> = {}): Challenge => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    id: 'challenge-1',
    title: 'Visit Local Coffee Shop',
    description: 'Take a photo at our amazing local coffee shop and earn points!',
    partnerId: 'partner-1',
    partnerName: 'Amazing Coffee Shop',
    partnerBranding: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#8B4513',
      secondaryColor: '#D2691E'
    },
    difficulty: 'medium',
    points: 25,
    startDate: yesterday,
    endDate: tomorrow,
    location: {
      coordinates: mockBusinessLocation,
      address: '123 Coffee St, Detroit, MI 48201',
      businessName: 'Amazing Coffee Shop',
      verificationRadius: 100
    },
    proofRequirements: {
      types: ['photo'],
      instructions: 'Take a photo of the storefront showing the business name',
      examples: ['Photo of the front entrance', 'Photo of the business sign']
    },
    status: 'active',
    maxCompletions: undefined,
    redditPostId: 'reddit-post-123',
    createdAt: yesterday,
    updatedAt: now,
    ...overrides
  };
};

describe('ChallengeDetailComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalyticsClient.trackEngagement.mockResolvedValue({ success: true, processedEvents: 1 });
  });

  describe('trackChallengeView', () => {
    it('should send analytics event when challenge is viewed', async () => {
      const challengeId = 'challenge-1';
      const username = 'testuser';
      const postId = 'post-123';

      await ChallengeDetailComponent.trackChallengeView(challengeId, username, postId);

      expect(mockAnalyticsClient.trackEngagement).toHaveBeenCalledWith({
        eventType: 'view',
        challengeId: parseInt(challengeId),
        userRedditUsername: username,
        postId: postId,
        timestamp: expect.any(String)
      });
    });

    it('should handle analytics errors gracefully', async () => {
      mockAnalyticsClient.trackEngagement.mockRejectedValue(new Error('Network error'));
      
      // Should not throw error
      await expect(
        ChallengeDetailComponent.trackChallengeView('challenge-1', 'testuser', 'post-123')
      ).resolves.toBeUndefined();
    });
  });

  describe('getChallengeStatus', () => {
    it('should return "completed" for user completed challenges', () => {
      const challenge = createMockChallenge();
      const userCompletedChallenges = ['challenge-1'];

      const status = ChallengeDetailComponent.getChallengeStatus(challenge, userCompletedChallenges);

      expect(status.status).toBe('completed');
      expect(status.text).toBe('✅ Completed');
      expect(status.color).toBe('#059669');
      expect(status.canSubmit).toBe(false);
    });

    it('should return "expired" for challenges past end date', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const challenge = createMockChallenge({
        endDate: yesterday
      });

      const status = ChallengeDetailComponent.getChallengeStatus(challenge, []);

      expect(status.status).toBe('expired');
      expect(status.text).toBe('⏰ Challenge Expired');
      expect(status.color).toBe('#dc2626');
      expect(status.canSubmit).toBe(false);
    });

    it('should return "upcoming" for challenges not yet started', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const dayAfterTomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const challenge = createMockChallenge({
        startDate: tomorrow,
        endDate: dayAfterTomorrow
      });

      const status = ChallengeDetailComponent.getChallengeStatus(challenge, []);

      expect(status.status).toBe('upcoming');
      expect(status.text).toBe('🔜 Coming Soon');
      expect(status.color).toBe('#f59e0b');
      expect(status.canSubmit).toBe(false);
    });

    it('should return "active" for valid active challenges', () => {
      const challenge = createMockChallenge();

      const status = ChallengeDetailComponent.getChallengeStatus(challenge, []);

      expect(status.status).toBe('active');
      expect(status.text).toBe('🎯 Active Challenge');
      expect(status.color).toBe('#059669');
      expect(status.canSubmit).toBe(true);
    });
  });

  describe('getExpirationInfo', () => {
    it('should return "Expired" for past challenges', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const challenge = createMockChallenge({ endDate: yesterday });

      const info = ChallengeDetailComponent.getExpirationInfo(challenge);

      expect(info).toBe('Expired');
    });

    it('should return days remaining for challenges ending in multiple days', () => {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const challenge = createMockChallenge({ endDate: threeDaysFromNow });

      const info = ChallengeDetailComponent.getExpirationInfo(challenge);

      expect(info).toBe('3 days remaining');
    });

    it('should return hours remaining for challenges ending today', () => {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const challenge = createMockChallenge({ endDate: twoHoursFromNow });

      const info = ChallengeDetailComponent.getExpirationInfo(challenge);

      expect(info).toBe('2 hours remaining');
    });

    it('should return "Less than 1 hour remaining" for challenges ending very soon', () => {
      const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);
      const challenge = createMockChallenge({ endDate: thirtyMinutesFromNow });

      const info = ChallengeDetailComponent.getExpirationInfo(challenge);

      expect(info).toBe('Less than 1 hour remaining');
    });
  });

  describe('getDifficultyInfo', () => {
    it('should return correct info for easy difficulty', () => {
      const info = ChallengeDetailComponent.getDifficultyInfo('easy');

      expect(info.emoji).toBe('🟢');
      expect(info.color).toBe('#059669');
      expect(info.label).toBe('Easy');
    });

    it('should return correct info for medium difficulty', () => {
      const info = ChallengeDetailComponent.getDifficultyInfo('medium');

      expect(info.emoji).toBe('🟡');
      expect(info.color).toBe('#f59e0b');
      expect(info.label).toBe('Medium');
    });

    it('should return correct info for hard difficulty', () => {
      const info = ChallengeDetailComponent.getDifficultyInfo('hard');

      expect(info.emoji).toBe('🔴');
      expect(info.color).toBe('#dc2626');
      expect(info.label).toBe('Hard');
    });
  });

  describe('formatProofRequirements', () => {
    it('should format single proof type correctly', () => {
      const formatted = ChallengeDetailComponent.formatProofRequirements(['photo']);

      expect(formatted).toBe('📸 Photo of business');
    });

    it('should format multiple proof types with OR separator', () => {
      const formatted = ChallengeDetailComponent.formatProofRequirements(['photo', 'receipt']);

      expect(formatted).toBe('📸 Photo of business OR 🧾 Receipt/purchase proof');
    });

    it('should handle all proof types', () => {
      const formatted = ChallengeDetailComponent.formatProofRequirements([
        'photo', 'receipt', 'gps_checkin', 'location_question'
      ]);

      expect(formatted).toBe(
        '📸 Photo of business OR 🧾 Receipt/purchase proof OR 📍 GPS check-in OR ❓ Answer location question'
      );
    });
  });

  describe('createChallengeDetailBlocks', () => {
    it('should create correct blocks for active challenge', () => {
      const challenge = createMockChallenge();
      const props = {
        challenge,
        userCompletedChallenges: [],
        onSubmissionStart: vi.fn()
      };

      const blocks = ChallengeDetailComponent.createChallengeDetailBlocks(props);

      expect(blocks).toHaveLength(6); // Header, status, description, location, proof requirements, submit button
      
      // Check header block
      expect(blocks[0].type).toBe('vstack');
      expect(blocks[0].children[0].text).toBe(challenge.title);
      expect(blocks[0].children[1].text).toBe(challenge.partnerName);
      
      // Check submit button is present
      const submitButtonBlock = blocks[blocks.length - 1];
      expect(submitButtonBlock.children[0].text).toBe('📤 Submit Proof');
    });

    it('should not show submit button for completed challenges', () => {
      const challenge = createMockChallenge();
      const props = {
        challenge,
        userCompletedChallenges: ['challenge-1'],
        onSubmissionStart: vi.fn()
      };

      const blocks = ChallengeDetailComponent.createChallengeDetailBlocks(props);

      expect(blocks).toHaveLength(5); // No submit button block
      
      // Verify no submit button
      const hasSubmitButton = blocks.some(block => 
        block.children && block.children.some((child: any) => 
          child.text === '📤 Submit Proof'
        )
      );
      expect(hasSubmitButton).toBe(false);
    });

    it('should not show submit button for expired challenges', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const challenge = createMockChallenge({ endDate: yesterday });
      const props = {
        challenge,
        userCompletedChallenges: [],
        onSubmissionStart: vi.fn()
      };

      const blocks = ChallengeDetailComponent.createChallengeDetailBlocks(props);

      expect(blocks).toHaveLength(5); // No submit button block
    });

    it('should call onSubmissionStart when submit button is pressed', () => {
      const challenge = createMockChallenge();
      const onSubmissionStart = vi.fn();
      const props = {
        challenge,
        userCompletedChallenges: [],
        onSubmissionStart
      };

      const blocks = ChallengeDetailComponent.createChallengeDetailBlocks(props);
      const submitButtonBlock = blocks[blocks.length - 1];
      
      // Simulate button press
      submitButtonBlock.children[0].onPress();
      
      expect(onSubmissionStart).toHaveBeenCalledWith(challenge.id);
    });
  });
});

describe('ProofSubmissionComponent', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock GPS utilities
    const { verifyLocationWithinRadius } = await import('../utils/gpsUtils.js');
    vi.mocked(verifyLocationWithinRadius).mockReturnValue({
      isValid: true,
      distance: 50,
      accuracy: 10,
      fraudRisk: 'low',
      verificationMethod: 'gps'
    });
  });

  describe('getCurrentLocation', () => {
    beforeEach(() => {
      // Mock navigator.geolocation
      const mockGeolocation = {
        getCurrentPosition: vi.fn()
      };
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });
    });

    it('should return GPS coordinates when successful', async () => {
      const mockPosition = {
        coords: {
          latitude: 42.3314,
          longitude: -83.0458,
          accuracy: 10
        }
      };

      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) => {
        success(mockPosition);
      });

      const location = await ProofSubmissionComponent.getCurrentLocation();

      expect(location).toEqual({
        latitude: 42.3314,
        longitude: -83.0458,
        accuracy: 10,
        timestamp: expect.any(Date)
      });
    });

    it('should return null when geolocation fails', async () => {
      const mockError = { code: 1, message: 'Permission denied' };

      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success, error) => {
        error!(mockError);
      });

      const location = await ProofSubmissionComponent.getCurrentLocation();

      expect(location).toBeNull();
    });

    it('should return null when geolocation is not available', async () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      });

      const location = await ProofSubmissionComponent.getCurrentLocation();

      expect(location).toBeNull();
    });

    it('should timeout after specified time', async () => {
      vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation(() => {
        // Don't call success or error - simulate hanging request
      });

      const location = await ProofSubmissionComponent.getCurrentLocation(100); // 100ms timeout

      expect(location).toBeNull();
    });
  });

  describe('verifyGPSLocation', () => {
    it('should return valid result when location is within radius', () => {
      const challenge = createMockChallenge();
      const userLocation = mockGPSCoordinate;

      const result = ProofSubmissionComponent.verifyGPSLocation(userLocation, challenge);

      expect(result.isValid).toBe(true);
      expect(result.distance).toBe(50);
      expect(result.message).toContain('Location verified!');
    });

    it('should return invalid result when location is too far', async () => {
      const { verifyLocationWithinRadius } = await import('../utils/gpsUtils.js');
      vi.mocked(verifyLocationWithinRadius).mockReturnValue({
        isValid: false,
        distance: 200,
        accuracy: 10,
        fraudRisk: 'low',
        verificationMethod: 'gps'
      });

      const challenge = createMockChallenge();
      const userLocation = mockGPSCoordinate;

      const result = ProofSubmissionComponent.verifyGPSLocation(userLocation, challenge);

      expect(result.isValid).toBe(false);
      expect(result.distance).toBe(200);
      expect(result.message).toContain('You must be within 100m');
    });

    it('should return invalid result for high fraud risk', async () => {
      const { verifyLocationWithinRadius } = await import('../utils/gpsUtils.js');
      vi.mocked(verifyLocationWithinRadius).mockReturnValue({
        isValid: true,
        distance: 50,
        accuracy: 10,
        fraudRisk: 'high',
        verificationMethod: 'gps'
      });

      const challenge = createMockChallenge();
      const userLocation = mockGPSCoordinate;

      const result = ProofSubmissionComponent.verifyGPSLocation(userLocation, challenge);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('GPS location could not be verified');
    });
  });

  describe('validatePhotoProof', () => {
    it('should validate correct photo proof', () => {
      const photoData = {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      };

      const result = ProofSubmissionComponent.validatePhotoProof(photoData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject photo proof without image URL', () => {
      const photoData = {
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      };

      const result = ProofSubmissionComponent.validatePhotoProof(photoData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Photo is required');
    });

    it('should reject photo proof with invalid image data', () => {
      const photoData = {
        imageUrl: 'invalid',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      };

      const result = ProofSubmissionComponent.validatePhotoProof(photoData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid photo data');
    });
  });

  describe('validateReceiptProof', () => {
    it('should validate correct receipt proof', () => {
      const receiptData = {
        imageUrl: 'https://example.com/receipt.jpg',
        businessName: 'Amazing Coffee Shop',
        timestamp: new Date(),
        amount: 15.99
      };

      const result = ProofSubmissionComponent.validateReceiptProof(receiptData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject receipt proof with missing required fields', () => {
      const receiptData = {
        amount: 15.99
      };

      const result = ProofSubmissionComponent.validateReceiptProof(receiptData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Receipt photo is required');
      expect(result.errors).toContain('Business name is required');
      expect(result.errors).toContain('Receipt timestamp is required');
    });
  });

  describe('validateQuestionProof', () => {
    it('should validate correct question proof', () => {
      const questionData = {
        question: 'What color is the front door?',
        answer: 'Blue',
        correctAnswer: 'Blue',
        isCorrect: true
      };
      const challenge = createMockChallenge();

      const result = ProofSubmissionComponent.validateQuestionProof(questionData, challenge);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject question proof without answer', () => {
      const questionData = {
        question: 'What color is the front door?',
        correctAnswer: 'Blue',
        isCorrect: false
      };
      const challenge = createMockChallenge();

      const result = ProofSubmissionComponent.validateQuestionProof(questionData, challenge);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer is required');
    });

    it('should reject question proof with too short answer', () => {
      const questionData = {
        question: 'What color is the front door?',
        answer: 'B',
        correctAnswer: 'Blue',
        isCorrect: false
      };
      const challenge = createMockChallenge();

      const result = ProofSubmissionComponent.validateQuestionProof(questionData, challenge);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Answer is too short');
    });
  });

  describe('submitProof', () => {
    beforeEach(() => {
      mockDevvitContext.reddit.getCurrentUser.mockResolvedValue({
        username: 'testuser'
      });
      mockDevvitContext.reddit.submitComment.mockResolvedValue({
        permalink: '/r/michiganspots/comments/abc123/def456'
      });
      mockDevvitContext.redis.get.mockResolvedValue(null);
      mockDevvitContext.redis.set.mockResolvedValue(true);
      mockAnalyticsClient.trackChallenge.mockResolvedValue({ success: true, processedEvents: 1 });
    });

    it('should successfully submit photo proof', async () => {
      const challenge = createMockChallenge();
      const proofSubmission: ProofSubmission = {
        type: 'photo',
        data: {
          imageUrl: 'https://example.com/photo.jpg',
          hasBusinessSignage: true,
          hasInteriorView: false,
          gpsEmbedded: true
        },
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(true);
      expect(result.submission).toBeDefined();
      expect(result.submission!.challengeId).toBe(challenge.id);
      expect(result.submission!.proofType).toBe('photo');
      expect(result.submission!.verificationStatus).toBe('approved');
    });

    it('should fail when user is not authenticated', async () => {
      mockDevvitContext.reddit.getCurrentUser.mockResolvedValue(null);

      const challenge = createMockChallenge();
      const proofSubmission: ProofSubmission = {
        type: 'photo',
        data: { imageUrl: 'https://example.com/photo.jpg' },
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });

    it('should fail when GPS verification fails', async () => {
      const { verifyLocationWithinRadius } = await import('../utils/gpsUtils.js');
      vi.mocked(verifyLocationWithinRadius).mockReturnValue({
        isValid: false,
        distance: 200,
        accuracy: 10,
        fraudRisk: 'low',
        verificationMethod: 'gps'
      });

      const challenge = createMockChallenge();
      const proofSubmission: ProofSubmission = {
        type: 'photo',
        data: { imageUrl: 'https://example.com/photo.jpg' },
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('You must be within 100m');
    });

    it('should fail when proof validation fails', async () => {
      const challenge = createMockChallenge();
      const proofSubmission: ProofSubmission = {
        type: 'photo',
        data: { imageUrl: '' }, // Invalid photo data
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Photo is required');
    });

    it('should create Reddit comment when challenge has reddit post ID', async () => {
      const challenge = createMockChallenge({ redditPostId: 'reddit-post-123' });
      const proofSubmission: ProofSubmission = {
        type: 'gps_checkin',
        data: {},
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(true);
      expect(mockDevvitContext.reddit.submitComment).toHaveBeenCalledWith({
        id: 'reddit-post-123',
        text: expect.stringContaining('Challenge Completed: Visit Local Coffee Shop')
      });
      expect(result.submission!.redditCommentUrl).toBe('https://reddit.com/r/michiganspots/comments/abc123/def456');
    });

    it('should create Reddit post when challenge has no reddit post ID', async () => {
      const challenge = createMockChallenge({ redditPostId: undefined });
      mockDevvitContext.reddit.submitPost.mockResolvedValue({
        permalink: '/r/michiganspots/comments/xyz789'
      });

      const proofSubmission: ProofSubmission = {
        type: 'gps_checkin',
        data: {},
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(true);
      expect(mockDevvitContext.reddit.submitPost).toHaveBeenCalledWith({
        title: 'Challenge Completed: Visit Local Coffee Shop',
        text: expect.stringContaining('Challenge Completed: Visit Local Coffee Shop'),
        subredditName: 'michiganspots'
      });
      expect(result.submission!.redditPostUrl).toBe('https://reddit.com/r/michiganspots/comments/xyz789');
    });

    it('should continue submission even if Reddit post creation fails', async () => {
      mockDevvitContext.reddit.submitComment.mockRejectedValue(new Error('Reddit API error'));

      const challenge = createMockChallenge();
      const proofSubmission: ProofSubmission = {
        type: 'gps_checkin',
        data: {},
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(true);
      expect(result.submission).toBeDefined();
    });

    it('should update user profile with points and completed challenges', async () => {
      const existingUserData = {
        redditUsername: 'testuser',
        totalPoints: 50,
        completedChallenges: ['other-challenge'],
        badges: [],
        statistics: {
          totalSubmissions: 5,
          successfulSubmissions: 4
        }
      };
      mockDevvitContext.redis.get.mockResolvedValue(JSON.stringify(existingUserData));

      const challenge = createMockChallenge();
      const proofSubmission: ProofSubmission = {
        type: 'gps_checkin',
        data: {},
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(true);
      
      // Verify user profile was updated
      const setCall = mockDevvitContext.redis.set.mock.calls.find(call => 
        call[0] === 'user:testuser'
      );
      expect(setCall).toBeDefined();
      
      const updatedProfile = JSON.parse(setCall[1]);
      expect(updatedProfile.totalPoints).toBe(75); // 50 + 25 points
      expect(updatedProfile.completedChallenges).toContain('challenge-1');
      expect(updatedProfile.statistics.totalSubmissions).toBe(6);
      expect(updatedProfile.statistics.successfulSubmissions).toBe(5);
    });

    it('should send analytics event for challenge completion', async () => {
      const challenge = createMockChallenge();
      const proofSubmission: ProofSubmission = {
        type: 'photo',
        data: { imageUrl: 'https://example.com/photo.jpg' },
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(true);
      expect(mockAnalyticsClient.trackChallenge).toHaveBeenCalledWith({
        challengeId: parseInt(challenge.id),
        userRedditUsername: 'testuser',
        submissionUrl: expect.any(String),
        submissionType: 'comment',
        completedAt: expect.any(String),
        gpsCoordinates: mockGPSCoordinate,
        proofType: 'photo',
        pointsAwarded: 25,
        verificationStatus: 'approved',
        timestamp: expect.any(String)
      });
    });

    it('should continue submission even if analytics fails', async () => {
      mockAnalyticsClient.trackChallenge.mockRejectedValue(new Error('Analytics error'));

      const challenge = createMockChallenge();
      const proofSubmission: ProofSubmission = {
        type: 'gps_checkin',
        data: {},
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const result = await ProofSubmissionComponent.submitProof(
        mockDevvitContext as any,
        challenge,
        proofSubmission,
        mockGPSCoordinate
      );

      expect(result.success).toBe(true);
      expect(result.submission).toBeDefined();
    });
  });

  describe('generateRedditContent', () => {
    it('should generate correct Reddit content for photo proof', () => {
      const challenge = createMockChallenge();
      const proofSubmission: ProofSubmission = {
        type: 'photo',
        data: { imageUrl: 'https://example.com/photo.jpg' },
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };
      const distance = 50;

      const content = ProofSubmissionComponent.generateRedditContent(challenge, proofSubmission, distance);

      expect(content).toContain('Challenge Completed: Visit Local Coffee Shop');
      expect(content).toContain('**Business:** Amazing Coffee Shop');
      expect(content).toContain('**Points Earned:** 25');
      expect(content).toContain('**Proof Type:** 📸 Photo proof');
      expect(content).toContain('**Distance:** 50m from location');
      expect(content).toContain('#MichiganSpots #LocalBusiness #TreasureHunt');
    });

    it('should generate correct content for different proof types', () => {
      const challenge = createMockChallenge();
      const receiptProof: ProofSubmission = {
        type: 'receipt',
        data: { imageUrl: 'https://example.com/receipt.jpg' },
        metadata: {
          timestamp: new Date(),
          location: mockGPSCoordinate,
          deviceInfo: 'Devvit App'
        }
      };

      const content = ProofSubmissionComponent.generateRedditContent(challenge, receiptProof, 25);

      expect(content).toContain('**Proof Type:** 🧾 Receipt proof');
    });
  });

  describe('createProofTypeSelectionBlocks', () => {
    it('should create blocks for all available proof types', () => {
      const challenge = createMockChallenge({
        proofRequirements: {
          types: ['photo', 'receipt', 'gps_checkin'],
          instructions: 'Choose your proof method'
        }
      });
      const onProofTypeSelected = vi.fn();

      const blocks = ProofSubmissionComponent.createProofTypeSelectionBlocks(challenge, onProofTypeSelected);

      expect(blocks).toHaveLength(5); // Title, description, + 3 proof type blocks
      expect(blocks[0].text).toBe('Select Proof Type');
      
      // Check that all proof types are represented
      const proofTypeBlocks = blocks.slice(2); // Skip title and description
      expect(proofTypeBlocks).toHaveLength(3);
    });

    it('should call callback when proof type is selected', () => {
      const challenge = createMockChallenge({
        proofRequirements: {
          types: ['photo'],
          instructions: 'Take a photo'
        }
      });
      const onProofTypeSelected = vi.fn();

      const blocks = ProofSubmissionComponent.createProofTypeSelectionBlocks(challenge, onProofTypeSelected);
      const photoBlock = blocks[2]; // First proof type block
      
      // Simulate button press (button is at children[2])
      photoBlock.children[2].onPress();
      
      expect(onProofTypeSelected).toHaveBeenCalledWith('photo');
    });
  });

  describe('createGPSVerificationBlocks', () => {
    it('should create location request blocks when no location provided', () => {
      const challenge = createMockChallenge();
      const onLocationCaptured = vi.fn();

      const blocks = ProofSubmissionComponent.createGPSVerificationBlocks(
        challenge,
        undefined,
        onLocationCaptured
      );

      expect(blocks).toHaveLength(3); // Title, description, get location button
      expect(blocks[0].text).toBe('📍 Location Verification Required');
      expect(blocks[2].text).toBe('📍 Get My Location');
    });

    it('should create success blocks when location is verified', () => {
      const challenge = createMockChallenge();
      const userLocation = mockGPSCoordinate;

      const blocks = ProofSubmissionComponent.createGPSVerificationBlocks(
        challenge,
        userLocation
      );

      expect(blocks).toHaveLength(2); // Success title and message
      expect(blocks[0].text).toBe('✅ Location Verified');
      expect(blocks[0].color).toBe('#059669');
    });

    it('should create failure blocks when location verification fails', async () => {
      const { verifyLocationWithinRadius } = await import('../utils/gpsUtils.js');
      vi.mocked(verifyLocationWithinRadius).mockReturnValue({
        isValid: false,
        distance: 200,
        accuracy: 10,
        fraudRisk: 'low',
        verificationMethod: 'gps'
      });

      const challenge = createMockChallenge();
      const userLocation = mockGPSCoordinate;
      const onRetry = vi.fn();

      const blocks = ProofSubmissionComponent.createGPSVerificationBlocks(
        challenge,
        userLocation,
        undefined,
        onRetry
      );

      expect(blocks).toHaveLength(3); // Failure title, message, retry button
      expect(blocks[0].text).toBe('❌ Location Verification Failed');
      expect(blocks[0].color).toBe('#dc2626');
      expect(blocks[2].text).toBe('🔄 Try Again');
    });
  });
});

describe('ChallengeDetailViewComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createChallengeDetailView', () => {
    it('should create detail view by default', () => {
      const props = {
        challenge: createMockChallenge(),
        userCompletedChallenges: []
      };

      const view = ChallengeDetailViewComponent.createChallengeDetailView(
        mockDevvitContext as any,
        props
      );

      expect(view.type).toBe('vstack');
      expect(view.children).toBeDefined();
      expect(view.children.length).toBeGreaterThan(0);
    });

    it('should create submission view when state is set to submission', () => {
      const props = {
        challenge: createMockChallenge(),
        userCompletedChallenges: []
      };
      const state = {
        currentView: 'submission' as const,
        userLocation: mockGPSCoordinate
      };

      const view = ChallengeDetailViewComponent.createChallengeDetailView(
        mockDevvitContext as any,
        props,
        state
      );

      expect(view.type).toBe('vstack');
      // Should contain submission-specific elements
      const hasSubmissionTitle = view.children.some((child: any) => 
        child.text === '📤 Submit Proof'
      );
      expect(hasSubmissionTitle).toBe(true);
    });

    it('should create success view when state is set to success', () => {
      const mockSubmission: Submission = {
        id: 'sub-123',
        challengeId: 'challenge-1',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: {},
        submittedAt: new Date(),
        verificationStatus: 'approved',
        gpsCoordinates: mockGPSCoordinate,
        fraudRiskScore: 0.1,
        redditPostUrl: 'https://reddit.com/r/michiganspots/comments/abc123'
      };

      const props = {
        challenge: createMockChallenge(),
        userCompletedChallenges: []
      };
      const state = {
        currentView: 'success' as const,
        submissionResult: mockSubmission
      };

      const view = ChallengeDetailViewComponent.createChallengeDetailView(
        mockDevvitContext as any,
        props,
        state
      );

      expect(view.type).toBe('vstack');
      // Should contain success-specific elements
      const hasSuccessTitle = view.children.some((child: any) => 
        child.text === '🎉 Challenge Completed!'
      );
      expect(hasSuccessTitle).toBe(true);
    });
  });

  describe('handleProofTypeSelection', () => {
    it('should succeed when location verification passes', async () => {
      // Mock the verifyGPSLocation method directly on ProofSubmissionComponent
      vi.spyOn(ProofSubmissionComponent, 'verifyGPSLocation').mockReturnValue({
        isValid: true,
        distance: 50,
        message: 'Location verified!'
      });

      const challenge = createMockChallenge();
      const userLocation = mockGPSCoordinate;

      const result = await ChallengeDetailViewComponent.handleProofTypeSelection(
        mockDevvitContext as any,
        challenge,
        'photo',
        userLocation
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail when location verification fails', async () => {
      // Mock the verifyGPSLocation method directly on ProofSubmissionComponent
      vi.spyOn(ProofSubmissionComponent, 'verifyGPSLocation').mockReturnValue({
        isValid: false,
        distance: 200,
        message: 'You must be within 100m of Amazing Coffee Shop. You are 200m away.'
      });

      const challenge = createMockChallenge();
      const userLocation = mockGPSCoordinate;

      const result = await ChallengeDetailViewComponent.handleProofTypeSelection(
        mockDevvitContext as any,
        challenge,
        'photo',
        userLocation
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('You must be within 100m');
    });
  });

  describe('handleSubmissionFlow', () => {
    beforeEach(() => {
      mockDevvitContext.reddit.getCurrentUser.mockResolvedValue({
        username: 'testuser'
      });
      mockDevvitContext.reddit.submitComment.mockResolvedValue({
        permalink: '/r/michiganspots/comments/abc123/def456'
      });
      mockDevvitContext.redis.get.mockResolvedValue(null);
      mockDevvitContext.redis.set.mockResolvedValue(true);
      mockAnalyticsClient.trackChallenge.mockResolvedValue({ success: true, processedEvents: 1 });
    });

    it('should successfully handle complete submission flow', async () => {
      // Mock the submitProof method directly on ProofSubmissionComponent
      const mockSubmission: Submission = {
        id: 'sub-123',
        challengeId: 'challenge-1',
        userRedditUsername: 'testuser',
        proofType: 'photo',
        proofData: {},
        submittedAt: new Date(),
        verificationStatus: 'approved',
        gpsCoordinates: mockGPSCoordinate,
        fraudRiskScore: 0.1
      };

      vi.spyOn(ProofSubmissionComponent, 'submitProof').mockResolvedValue({
        success: true,
        submission: mockSubmission
      });

      const challenge = createMockChallenge();
      const proofData = {
        imageUrl: 'https://example.com/photo.jpg',
        hasBusinessSignage: true,
        hasInteriorView: false,
        gpsEmbedded: true
      };
      const userLocation = mockGPSCoordinate;

      const result = await ChallengeDetailViewComponent.handleSubmissionFlow(
        mockDevvitContext as any,
        challenge,
        'photo',
        proofData,
        userLocation
      );

      expect(result.success).toBe(true);
      expect(result.submission).toBeDefined();
      expect(result.submission!.proofType).toBe('photo');
    });

    it('should handle submission errors gracefully', async () => {
      // Mock the submitProof method to return an error
      vi.spyOn(ProofSubmissionComponent, 'submitProof').mockResolvedValue({
        success: false,
        error: 'User not authenticated'
      });

      const challenge = createMockChallenge();
      const proofData = { imageUrl: 'https://example.com/photo.jpg' };
      const userLocation = mockGPSCoordinate;

      const result = await ChallengeDetailViewComponent.handleSubmissionFlow(
        mockDevvitContext as any,
        challenge,
        'photo',
        proofData,
        userLocation
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });
  });
});