/**
 * AI System Tests
 * Comprehensive tests for all AI services and functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from '@devvit/public-api';

// Mock Context for testing
const mockContext = {
  settings: {
    get: vi.fn((key: string) => {
      const settings: Record<string, any> = {
        'CLOUDFLARE_AI_API_KEY': 'test_ai_key',
        'CLOUDFLARE_ACCOUNT_ID': 'test_account_id',
        'AI_VALIDATION_ENABLED': true,
        'AI_CHALLENGE_GENERATION_ENABLED': true,
        'AI_PERSONALIZATION_ENABLED': true,
      };
      return settings[key];
    }),
    getAll: vi.fn(() => Promise.resolve({
      'CLOUDFLARE_AI_API_KEY': 'test_ai_key',
      'CLOUDFLARE_ACCOUNT_ID': 'test_account_id',
      'AI_VALIDATION_ENABLED': true,
    })),
  },
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    hGet: vi.fn(),
    hSet: vi.fn(),
    hGetAll: vi.fn(() => Promise.resolve({})),
    hIncrBy: vi.fn(),
    lPush: vi.fn(),
    sMembers: vi.fn(() => Promise.resolve([])),
    sAdd: vi.fn(),
    expire: vi.fn(),
  },
  userId: 'test_user_123',
} as unknown as Context;

// Mock fetch for AI API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      result: {
        response: JSON.stringify({
          valid: true,
          confidence: 0.9,
          reason: 'Test validation successful',
        }),
      },
    }),
  })
) as any;

describe('AI Service Core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize CloudflareAIService with correct configuration', async () => {
    const { CloudflareAIService } = await import('../services/aiService.js');
    
    const aiService = new CloudflareAIService(mockContext);
    expect(aiService).toBeDefined();
  });

  it('should validate photo submissions', async () => {
    const { CloudflareAIService } = await import('../services/aiService.js');
    
    const aiService = new CloudflareAIService(mockContext);
    
    const validationRequest = {
      imageUrl: 'https://example.com/test-image.jpg',
      expectedBusiness: 'Test Restaurant',
      expectedLocation: { lat: 42.3601, lng: -71.0589 },
      validationType: 'business_signage' as const,
    };

    const result = await aiService.validatePhoto(validationRequest);
    
    expect(result).toBeDefined();
    expect(result.isValid).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.suggestedAction).toBeDefined();
  });

  it('should generate challenges with AI', async () => {
    const { CloudflareAIService } = await import('../services/aiService.js');
    
    const aiService = new CloudflareAIService(mockContext);
    
    const challengeRequest = {
      businessInfo: {
        name: 'Test Cafe',
        category: 'restaurant',
        location: { lat: 42.3601, lng: -71.0589 },
        description: 'Cozy coffee shop',
      },
      difficulty: 'medium' as const,
      seasonalContext: 'winter season',
    };

    const result = await aiService.generateChallenge(challengeRequest);
    
    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.description).toBeDefined();
    expect(result.requirements).toBeInstanceOf(Array);
    expect(result.proofType).toBeDefined();
  });
});

describe('AI Validation Service', () => {
  it('should perform enhanced validation with fraud detection', async () => {
    const { AIValidationService } = await import('../services/aiValidationService.js');
    
    const validationService = new AIValidationService(mockContext);
    
    const mockSubmission = {
      id: 'test_submission',
      userId: 'test_user',
      challengeId: 'test_challenge',
      proofImageUrl: 'https://example.com/proof.jpg',
      gpsLocation: { lat: 42.3601, lng: -71.0589 },
      submittedAt: new Date(),
    };

    const mockChallenge = {
      id: 'test_challenge',
      title: 'Test Challenge',
      partnerInfo: { businessName: 'Test Business' },
      location: { lat: 42.3601, lng: -71.0589 },
      proofRequirements: { type: 'photo' },
    };

    const result = await validationService.validateSubmission(
      mockSubmission,
      mockChallenge,
      'test_user'
    );
    
    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.finalDecision).toMatch(/approved|rejected|manual_review/);
  });

  it('should get validation metrics', async () => {
    const { AIValidationService } = await import('../services/aiValidationService.js');
    
    const validationService = new AIValidationService(mockContext);
    
    const metrics = await validationService.getValidationMetrics('day');
    
    expect(metrics).toBeDefined();
    expect(metrics.totalSubmissions).toBeGreaterThanOrEqual(0);
    expect(metrics.averageConfidence).toBeGreaterThanOrEqual(0);
  });
});

describe('AI Challenge Service', () => {
  it('should generate personalized challenges', async () => {
    const { AIChallengeService } = await import('../services/aiChallengeService.js');
    
    const challengeService = new AIChallengeService(mockContext);
    
    const mockBusinesses = [
      {
        name: 'Test Restaurant',
        category: 'restaurant',
        location: { lat: 42.3601, lng: -71.0589 },
        description: 'Great food',
      },
    ];

    const mockUserPatterns = [
      {
        userId: 'test_user',
        stats: { completionRate: 0.8, totalPoints: 200 },
        preferences: { categories: ['restaurant'] },
      },
    ];

    const challenges = await challengeService.generateChallenges(
      mockBusinesses,
      mockUserPatterns,
      undefined,
      1
    );
    
    expect(challenges).toBeInstanceOf(Array);
    expect(challenges.length).toBeGreaterThan(0);
    
    if (challenges.length > 0) {
      const challenge = challenges[0];
      expect(challenge.title).toBeDefined();
      expect(challenge.description).toBeDefined();
      expect(challenge.isAIGenerated).toBe(true);
    }
  });

  it('should get personalized recommendations', async () => {
    const { AIChallengeService } = await import('../services/aiChallengeService.js');
    
    const challengeService = new AIChallengeService(mockContext);
    
    const mockUserProfile = {
      userId: 'test_user',
      stats: { completionRate: 0.7, totalPoints: 150 },
      preferences: { categories: ['restaurant', 'retail'] },
    };

    const mockChallenges = [
      {
        id: 'challenge1',
        title: 'Restaurant Challenge',
        partnerInfo: { category: 'restaurant' },
        difficulty: 'medium',
      },
    ];

    const recommendations = await challengeService.getPersonalizedRecommendations(
      'test_user',
      mockUserProfile,
      mockChallenges,
      3
    );
    
    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations.length).toBeGreaterThanOrEqual(0);
  });
});

describe('AI Personalization Service', () => {
  it('should generate personalization insights', async () => {
    const { AIPersonalizationService } = await import('../services/aiPersonalizationService.js');
    
    const personalizationService = new AIPersonalizationService(mockContext);
    
    const mockUserProfile = {
      userId: 'test_user',
      stats: { completionRate: 0.8, totalPoints: 250 },
      preferences: { categories: ['restaurant'] },
      lastActive: new Date(),
    };

    const mockActivityHistory = [
      { action: 'challenge_completed', timestamp: Date.now(), engagement: 0.8 },
    ];

    const insights = await personalizationService.generatePersonalizationInsights(
      'test_user',
      mockUserProfile,
      mockActivityHistory
    );
    
    expect(insights).toBeDefined();
    expect(insights.userId).toBe('test_user');
    expect(insights.preferredCategories).toBeInstanceOf(Array);
    expect(insights.churnRisk).toBeGreaterThanOrEqual(0);
    expect(insights.churnRisk).toBeLessThanOrEqual(1);
    expect(insights.nextBestActions).toBeInstanceOf(Array);
  });

  it('should optimize notifications', async () => {
    const { AIPersonalizationService } = await import('../services/aiPersonalizationService.js');
    
    const personalizationService = new AIPersonalizationService(mockContext);
    
    const mockInsights = {
      userId: 'test_user',
      preferredCategories: ['restaurant'],
      optimalChallengeTime: 'evening' as const,
      difficultyPreference: 'medium' as const,
      locationRadius: 5,
      engagementPatterns: {
        mostActiveDay: 'Saturday',
        averageSessionLength: 15,
        preferredProofTypes: ['photo'],
      },
      churnRisk: 0.3,
      nextBestActions: ['complete_challenge'],
    };

    const optimization = await personalizationService.optimizeNotifications(
      'test_user',
      mockInsights,
      []
    );
    
    expect(optimization).toBeDefined();
    expect(optimization.userId).toBe('test_user');
    expect(optimization.optimalTimes).toBeInstanceOf(Array);
    expect(optimization.frequency).toMatch(/high|medium|low/);
    expect(optimization.channels).toBeInstanceOf(Array);
  });
});

describe('AI Game Intelligence', () => {
  it('should generate personalized narratives', async () => {
    const { AIGameIntelligence } = await import('../services/aiGameIntelligence.js');
    
    const gameIntelligence = new AIGameIntelligence(mockContext);
    
    const mockUserProfile = {
      userId: 'test_user',
      stats: { completionRate: 0.7, totalPoints: 180 },
      preferences: { categories: ['restaurant'] },
      lastActive: new Date(),
    };

    const mockCompletedChallenges = [
      {
        id: 'challenge1',
        partnerInfo: { category: 'restaurant' },
        completedAt: new Date(),
      },
    ];

    const narrative = await gameIntelligence.generatePersonalizedNarrative(
      'test_user',
      mockUserProfile,
      mockCompletedChallenges,
      { lat: 42.3601, lng: -71.0589 }
    );
    
    expect(narrative).toBeDefined();
    expect(narrative.storyArc).toBeDefined();
    expect(narrative.currentChapter).toBeDefined();
    expect(narrative.emotionalTone).toMatch(/adventurous|mysterious|competitive|social|relaxing/);
    expect(narrative.nextStoryBeats).toBeInstanceOf(Array);
  });

  it('should create dynamic events', async () => {
    const { AIGameIntelligence } = await import('../services/aiGameIntelligence.js');
    
    const gameIntelligence = new AIGameIntelligence(mockContext);
    
    const mockConditions = {
      activeUsers: 100,
      timeOfDay: 'evening',
      weather: 'clear',
      socialActivity: 8,
      businessPartners: [{ id: 'partner1', name: 'Test Business' }],
    };

    const event = await gameIntelligence.createDynamicEvent(
      'flash_mob',
      mockConditions
    );
    
    expect(event).toBeDefined();
    expect(event.id).toBeDefined();
    expect(event.type).toBe('flash_mob');
    expect(event.title).toBeDefined();
    expect(event.duration).toBeGreaterThan(0);
    expect(event.rewards).toBeDefined();
  });

  it('should create mystery hunts', async () => {
    const { AIGameIntelligence } = await import('../services/aiGameIntelligence.js');
    
    const gameIntelligence = new AIGameIntelligence(mockContext);
    
    const mysteryHunt = await gameIntelligence.createMysteryHunt(
      'winter_theme',
      'medium',
      50,
      { north: 42.4, south: 42.3, east: -71.0, west: -71.1 }
    );
    
    expect(mysteryHunt).toBeDefined();
    expect(mysteryHunt.huntId).toBeDefined();
    expect(mysteryHunt.title).toBeDefined();
    expect(mysteryHunt.backstory).toBeDefined();
    expect(mysteryHunt.clues).toBeInstanceOf(Array);
    expect(mysteryHunt.finalReward).toBeDefined();
  });
});

describe('AI Community Manager', () => {
  it('should analyze community health', async () => {
    const { AICommunityManager } = await import('../services/aiCommunityManager.js');
    
    const communityManager = new AICommunityManager(mockContext);
    
    const mockUserActivity = [
      { userId: 'user1', action: 'challenge_completed', timestamp: Date.now(), engagement: 0.8 },
    ];

    const mockContentMetrics = [
      { contentId: 'post1', engagement: 0.7, sentiment: 0.8 },
    ];

    const mockModerationEvents = [
      { contentId: 'post1', action: 'approved', timestamp: Date.now() },
    ];

    const health = await communityManager.analyzeCommunityHealth(
      mockUserActivity,
      mockContentMetrics,
      mockModerationEvents
    );
    
    expect(health).toBeDefined();
    expect(health.overallScore).toBeGreaterThanOrEqual(0);
    expect(health.overallScore).toBeLessThanOrEqual(1);
    expect(health.engagement).toBeGreaterThanOrEqual(0);
    expect(health.toxicity).toBeGreaterThanOrEqual(0);
    expect(health.recommendations).toBeInstanceOf(Array);
  });

  it('should moderate content', async () => {
    const { AICommunityManager } = await import('../services/aiCommunityManager.js');
    
    const communityManager = new AICommunityManager(mockContext);
    
    const moderation = await communityManager.moderateContent(
      'This is a great treasure hunt challenge!',
      'test_user',
      {
        isNewUser: false,
        previousViolations: 0,
        communityStanding: 8,
      }
    );
    
    expect(moderation).toBeDefined();
    expect(moderation.action).toMatch(/approve|flag|remove|escalate/);
    expect(moderation.confidence).toBeGreaterThanOrEqual(0);
    expect(moderation.confidence).toBeLessThanOrEqual(1);
    expect(moderation.reason).toBeDefined();
  });
});

describe('AI Business Intelligence', () => {
  it('should generate business insights', async () => {
    const { AIBusinessIntelligence } = await import('../services/aiBusinessIntelligence.js');
    
    const businessIntelligence = new AIBusinessIntelligence(mockContext);
    
    const mockBusinessData = {
      challengeMetrics: [{ challengeId: 'c1', completions: 25 }],
      userEngagement: [{ userId: 'u1', engagement: 0.8 }],
      revenueData: [{ month: 'November', revenue: 1200 }],
    };

    const insights = await businessIntelligence.generateBusinessInsights(
      'test_partner',
      mockBusinessData
    );
    
    expect(insights).toBeDefined();
    expect(insights.partnerId).toBe('test_partner');
    expect(insights.performanceScore).toBeGreaterThanOrEqual(0);
    expect(insights.performanceScore).toBeLessThanOrEqual(1);
    expect(insights.metrics).toBeDefined();
    expect(insights.recommendations).toBeInstanceOf(Array);
  });

  it('should calculate ROI', async () => {
    const { AIBusinessIntelligence } = await import('../services/aiBusinessIntelligence.js');
    
    const businessIntelligence = new AIBusinessIntelligence(mockContext);
    
    const mockInvestment = {
      challengeCreationCost: 500,
      rewardsCost: 300,
      marketingSpend: 200,
      operationalCost: 100,
    };

    const mockOutcomes = {
      newCustomers: 50,
      repeatVisits: 100,
      averageSpend: 25,
      brandAwarenessLift: 25,
    };

    const roi = await businessIntelligence.calculateTreasureHuntROI(
      'test_partner',
      mockInvestment,
      mockOutcomes
    );
    
    expect(roi).toBeDefined();
    expect(roi.roi).toBeGreaterThanOrEqual(-1); // ROI can be negative
    expect(roi.paybackPeriod).toBeGreaterThan(0);
    expect(roi.breakdown).toBeDefined();
    expect(roi.projections).toBeDefined();
    expect(roi.recommendations).toBeInstanceOf(Array);
  });
});

describe('AI Master Orchestrator', () => {
  it('should initialize master orchestrator', async () => {
    const { AIMasterOrchestrator } = await import('../services/aiMasterOrchestrator.js');
    
    const masterOrchestrator = new AIMasterOrchestrator(mockContext);
    expect(masterOrchestrator).toBeDefined();
  });

  it('should create hyper-personalized experiences', async () => {
    const { AIMasterOrchestrator } = await import('../services/aiMasterOrchestrator.js');
    
    const masterOrchestrator = new AIMasterOrchestrator(mockContext);
    
    const mockUserProfile = {
      userId: 'test_user',
      stats: { completionRate: 0.8, totalPoints: 200 },
      preferences: { categories: ['restaurant'] },
      lastActive: new Date(),
    };

    const mockContext = {
      location: { lat: 42.3601, lng: -71.0589 },
      timeOfDay: 'evening',
      weather: 'clear',
      socialContext: { friends: 10 },
      recentActivity: [{ action: 'challenge_completed', timestamp: Date.now() }],
    };

    const experience = await masterOrchestrator.createHyperPersonalizedExperience(
      'test_user',
      mockUserProfile,
      mockContext
    );
    
    expect(experience).toBeDefined();
    expect(experience.personalizedNarrative).toBeDefined();
    expect(experience.dynamicChallenges).toBeInstanceOf(Array);
    expect(experience.aiConfidence).toBeGreaterThanOrEqual(0);
    expect(experience.aiConfidence).toBeLessThanOrEqual(1);
  });
});

describe('AI Experiment Service', () => {
  it('should create experiments', async () => {
    const { AIExperimentService } = await import('../services/aiExperimentService.js');
    
    const experimentService = new AIExperimentService(mockContext);
    
    const mockConfig = {
      id: 'test_experiment',
      name: 'Test A/B Experiment',
      description: 'Testing AI features',
      type: 'validation' as const,
      status: 'running' as const,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      targetUsers: 'all' as const,
      variants: [
        {
          id: 'variant_a',
          name: 'Control',
          description: 'Control group',
          weight: 0.5,
          config: { threshold: 0.8 },
        },
        {
          id: 'variant_b',
          name: 'Test',
          description: 'Test group',
          weight: 0.5,
          config: { threshold: 0.9 },
        },
      ],
      successMetrics: ['accuracy', 'speed'],
      minimumSampleSize: 100,
      confidenceLevel: 0.95,
    };

    const result = await experimentService.createExperiment(mockConfig);
    
    expect(result).toBeDefined();
    expect(result.experimentId).toBe('test_experiment');
    expect(result.userAssignments).toBeDefined();
    expect(result.estimatedDuration).toBeGreaterThan(0);
  });

  it('should get user variants', async () => {
    const { AIExperimentService } = await import('../services/aiExperimentService.js');
    
    const experimentService = new AIExperimentService(mockContext);
    
    const variant = await experimentService.getUserVariant('test_user', 'validation');
    
    // Should return null if no active experiments
    expect(variant).toBeNull();
  });
});

describe('Integration Tests', () => {
  it('should integrate AI orchestrator with all services', async () => {
    const { AIOrchestrator } = await import('../services/aiOrchestrator.js');
    
    const aiOrchestrator = new AIOrchestrator(mockContext, {
      enableAutoValidation: true,
      enableChallengeGeneration: true,
      enablePersonalization: true,
      enableNotificationOptimization: true,
      validationThresholds: {
        autoApprove: 0.85,
        autoReject: 0.3,
      },
      challengeGeneration: {
        frequency: 'weekly',
        maxPerBusiness: 3,
        seasonalAdjustment: true,
      },
      personalization: {
        updateFrequency: 'daily',
        segmentationEnabled: true,
      },
    });
    
    expect(aiOrchestrator).toBeDefined();
  });

  it('should handle AI system failures gracefully', async () => {
    // Mock a failing AI service
    global.fetch = vi.fn(() => Promise.reject(new Error('AI service unavailable')));
    
    const { CloudflareAIService } = await import('../services/aiService.js');
    const aiService = new CloudflareAIService(mockContext);
    
    const validationRequest = {
      imageUrl: 'https://example.com/test-image.jpg',
      expectedBusiness: 'Test Restaurant',
      expectedLocation: { lat: 42.3601, lng: -71.0589 },
      validationType: 'business_signage' as const,
    };

    const result = await aiService.validatePhoto(validationRequest);
    
    // Should return fallback result instead of throwing
    expect(result).toBeDefined();
    expect(result.isValid).toBe(false);
    expect(result.suggestedAction).toBe('manual_review');
  });
});

describe('Performance Tests', () => {
  it('should handle multiple concurrent AI requests', async () => {
    const { CloudflareAIService } = await import('../services/aiService.js');
    
    // Reset fetch mock to successful response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          result: {
            response: JSON.stringify({
              valid: true,
              confidence: 0.9,
            }),
          },
        }),
      })
    ) as any;
    
    const aiService = new CloudflareAIService(mockContext);
    
    const requests = Array.from({ length: 5 }, (_, i) => ({
      imageUrl: `https://example.com/test-image-${i}.jpg`,
      expectedBusiness: `Test Restaurant ${i}`,
      expectedLocation: { lat: 42.3601, lng: -71.0589 },
      validationType: 'business_signage' as const,
    }));

    const startTime = Date.now();
    const results = await Promise.all(
      requests.map(req => aiService.validatePhoto(req))
    );
    const endTime = Date.now();
    
    expect(results).toHaveLength(5);
    expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    
    results.forEach(result => {
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});