import { Context } from '@devvit/public-api';
import { CloudflareAIService, AIValidationResult, PhotoValidationRequest } from './aiService.js';
import { FraudDetectionService } from './fraudDetection.js';
import { Challenge, Submission } from '../types/index.js';

export interface EnhancedValidationResult {
  isValid: boolean;
  confidence: number;
  aiValidation: AIValidationResult;
  fraudCheck: {
    passed: boolean;
    flags: string[];
  };
  finalDecision: 'approved' | 'rejected' | 'manual_review';
  reviewReason?: string;
}

export interface ValidationMetrics {
  totalSubmissions: number;
  aiApproved: number;
  aiRejected: number;
  manualReviews: number;
  fraudDetected: number;
  averageConfidence: number;
}

export class AIValidationService {
  private aiService: CloudflareAIService;
  private fraudService: FraudDetectionService;
  private context: Context;

  // Confidence thresholds for automated decisions
  private readonly AUTO_APPROVE_THRESHOLD = 0.85;
  private readonly AUTO_REJECT_THRESHOLD = 0.3;

  constructor(context: Context) {
    this.context = context;
    this.aiService = new CloudflareAIService(context);
    this.fraudService = new FraudDetectionService(context);
  }

  /**
   * Comprehensive validation combining AI analysis and fraud detection
   */
  async validateSubmission(
    submission: Submission,
    challenge: Challenge,
    userId: string
  ): Promise<EnhancedValidationResult> {
    try {
      // Run AI validation and fraud detection in parallel
      const [aiResult, fraudResult] = await Promise.all([
        this.performAIValidation(submission, challenge),
        this.performFraudDetection(submission, userId, challenge),
      ]);

      // Combine results to make final decision
      const finalDecision = this.makeFinalDecision(aiResult, fraudResult);
      
      // Log validation metrics
      await this.logValidationMetrics(aiResult, fraudResult, finalDecision);

      return {
        isValid: finalDecision === 'approved',
        confidence: aiResult.confidence,
        aiValidation: aiResult,
        fraudCheck: fraudResult,
        finalDecision,
        reviewReason: this.getReviewReason(aiResult, fraudResult, finalDecision),
      };
    } catch (error) {
      console.error('Enhanced validation failed:', error);
      
      // Fallback to manual review on error
      return {
        isValid: false,
        confidence: 0,
        aiValidation: {
          isValid: false,
          confidence: 0,
          reason: 'Validation service error',
          suggestedAction: 'manual_review',
        },
        fraudCheck: { passed: false, flags: ['validation_error'] },
        finalDecision: 'manual_review',
        reviewReason: 'System error during validation',
      };
    }
  }

  /**
   * Batch validate multiple submissions for efficiency
   */
  async batchValidateSubmissions(
    submissions: Array<{ submission: Submission; challenge: Challenge; userId: string }>
  ): Promise<EnhancedValidationResult[]> {
    const batchSize = 5; // Process in small batches to avoid rate limits
    const results: EnhancedValidationResult[] = [];

    for (let i = 0; i < submissions.length; i += batchSize) {
      const batch = submissions.slice(i, i + batchSize);
      const batchPromises = batch.map(({ submission, challenge, userId }) =>
        this.validateSubmission(submission, challenge, userId)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < submissions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get validation performance metrics
   */
  async getValidationMetrics(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<ValidationMetrics> {
    const redis = this.context.redis;
    const key = `validation_metrics:${timeframe}`;
    
    try {
      const metrics = await redis.hGetAll(key);
      
      return {
        totalSubmissions: parseInt(metrics.total || '0'),
        aiApproved: parseInt(metrics.aiApproved || '0'),
        aiRejected: parseInt(metrics.aiRejected || '0'),
        manualReviews: parseInt(metrics.manualReviews || '0'),
        fraudDetected: parseInt(metrics.fraudDetected || '0'),
        averageConfidence: parseFloat(metrics.avgConfidence || '0'),
      };
    } catch (error) {
      console.error('Failed to get validation metrics:', error);
      return {
        totalSubmissions: 0,
        aiApproved: 0,
        aiRejected: 0,
        manualReviews: 0,
        fraudDetected: 0,
        averageConfidence: 0,
      };
    }
  }

  /**
   * Update validation thresholds based on performance data
   */
  async optimizeValidationThresholds(): Promise<{
    newApproveThreshold: number;
    newRejectThreshold: number;
    reasoning: string;
  }> {
    const metrics = await this.getValidationMetrics('week');
    
    // Simple optimization logic - can be enhanced with ML
    let newApproveThreshold = this.AUTO_APPROVE_THRESHOLD;
    let newRejectThreshold = this.AUTO_REJECT_THRESHOLD;
    let reasoning = 'No changes needed';

    // If too many manual reviews, lower thresholds
    const manualReviewRate = metrics.manualReviews / Math.max(metrics.totalSubmissions, 1);
    if (manualReviewRate > 0.4) {
      newApproveThreshold = Math.max(0.7, this.AUTO_APPROVE_THRESHOLD - 0.05);
      newRejectThreshold = Math.min(0.5, this.AUTO_REJECT_THRESHOLD + 0.05);
      reasoning = 'Reduced thresholds to decrease manual review load';
    }

    // If fraud rate is high, increase approve threshold
    const fraudRate = metrics.fraudDetected / Math.max(metrics.totalSubmissions, 1);
    if (fraudRate > 0.1) {
      newApproveThreshold = Math.min(0.95, newApproveThreshold + 0.05);
      reasoning = 'Increased approve threshold due to high fraud rate';
    }

    return {
      newApproveThreshold,
      newRejectThreshold,
      reasoning,
    };
  }

  private async performAIValidation(
    submission: Submission,
    challenge: Challenge
  ): Promise<AIValidationResult> {
    if (!submission.proofImageUrl) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'No image provided for validation',
        suggestedAction: 'reject',
      };
    }

    const validationRequest: PhotoValidationRequest = {
      imageUrl: submission.proofImageUrl,
      expectedBusiness: challenge.partnerInfo.businessName,
      expectedLocation: {
        lat: challenge.location.lat,
        lng: challenge.location.lng,
      },
      validationType: this.mapProofTypeToValidationType(challenge.proofRequirements.type),
    };

    return await this.aiService.validatePhoto(validationRequest);
  }

  private async performFraudDetection(
    submission: Submission,
    userId: string,
    challenge: Challenge
  ): Promise<{ passed: boolean; flags: string[] }> {
    const flags: string[] = [];

    // GPS fraud detection
    if (submission.gpsLocation) {
      const gpsValid = await this.fraudService.validateGPSLocation(
        submission.gpsLocation,
        challenge.location,
        userId
      );
      if (!gpsValid) {
        flags.push('gps_fraud');
      }
    }

    // Duplicate submission check
    const isDuplicate = await this.fraudService.checkDuplicateSubmission(
      userId,
      challenge.id,
      submission.proofImageUrl || ''
    );
    if (isDuplicate) {
      flags.push('duplicate_submission');
    }

    // Rate limiting check
    const rateLimitPassed = await this.fraudService.checkRateLimit(userId);
    if (!rateLimitPassed) {
      flags.push('rate_limit_exceeded');
    }

    // Temporal validation (reasonable time between submissions)
    const temporalValid = await this.fraudService.validateSubmissionTiming(userId);
    if (!temporalValid) {
      flags.push('suspicious_timing');
    }

    return {
      passed: flags.length === 0,
      flags,
    };
  }

  private makeFinalDecision(
    aiResult: AIValidationResult,
    fraudResult: { passed: boolean; flags: string[] }
  ): 'approved' | 'rejected' | 'manual_review' {
    // Immediate rejection for fraud
    if (!fraudResult.passed) {
      return 'rejected';
    }

    // High confidence AI approval
    if (aiResult.confidence >= this.AUTO_APPROVE_THRESHOLD && aiResult.isValid) {
      return 'approved';
    }

    // Low confidence AI rejection
    if (aiResult.confidence <= this.AUTO_REJECT_THRESHOLD || !aiResult.isValid) {
      return 'rejected';
    }

    // Medium confidence requires manual review
    return 'manual_review';
  }

  private getReviewReason(
    aiResult: AIValidationResult,
    fraudResult: { passed: boolean; flags: string[] },
    decision: 'approved' | 'rejected' | 'manual_review'
  ): string {
    if (!fraudResult.passed) {
      return `Fraud detected: ${fraudResult.flags.join(', ')}`;
    }

    if (decision === 'manual_review') {
      return `Medium confidence (${(aiResult.confidence * 100).toFixed(1)}%) requires human review`;
    }

    if (decision === 'rejected') {
      return aiResult.reason || 'AI validation failed';
    }

    return `AI validation passed with ${(aiResult.confidence * 100).toFixed(1)}% confidence`;
  }

  private mapProofTypeToValidationType(proofType: string): 'business_signage' | 'receipt' | 'location_proof' {
    switch (proofType) {
      case 'receipt':
        return 'receipt';
      case 'photo':
        return 'business_signage';
      default:
        return 'location_proof';
    }
  }

  private async logValidationMetrics(
    aiResult: AIValidationResult,
    fraudResult: { passed: boolean; flags: string[] },
    decision: 'approved' | 'rejected' | 'manual_review'
  ): Promise<void> {
    const redis = this.context.redis;
    const key = 'validation_metrics:day';

    try {
      await redis.hIncrBy(key, 'total', 1);
      
      if (decision === 'approved') {
        await redis.hIncrBy(key, 'aiApproved', 1);
      } else if (decision === 'rejected') {
        await redis.hIncrBy(key, 'aiRejected', 1);
      } else {
        await redis.hIncrBy(key, 'manualReviews', 1);
      }

      if (!fraudResult.passed) {
        await redis.hIncrBy(key, 'fraudDetected', 1);
      }

      // Update running average confidence
      const currentAvg = parseFloat(await redis.hGet(key, 'avgConfidence') || '0');
      const currentTotal = parseInt(await redis.hGet(key, 'total') || '1');
      const newAvg = (currentAvg * (currentTotal - 1) + aiResult.confidence) / currentTotal;
      await redis.hSet(key, 'avgConfidence', newAvg.toString());

      // Set expiration for daily metrics
      await redis.expire(key, 86400); // 24 hours
    } catch (error) {
      console.error('Failed to log validation metrics:', error);
    }
  }
}