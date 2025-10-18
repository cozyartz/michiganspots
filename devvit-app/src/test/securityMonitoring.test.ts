/**
 * Unit tests for security monitoring service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityMonitoringService, SecurityEventType } from '../services/securityMonitoring.js';
import { ValidationResult, FraudDetectionResult } from '../types/errors.js';

describe('SecurityMonitoringService', () => {
  let securityService: SecurityMonitoringService;

  beforeEach(() => {
    securityService = new SecurityMonitoringService();
    vi.clearAllMocks();
  });

  describe('logSecurityEvent', () => {
    it('should log a security event successfully', async () => {
      const eventId = await securityService.logSecurityEvent(
        SecurityEventType.FRAUD_DETECTED,
        'high',
        'testuser',
        'Test fraud detection',
        { testData: 'value' },
        'challenge_1',
        'submission_1'
      );

      expect(eventId).toMatch(/^sec_\d+_[a-z0-9]+$/);
    });

    it('should log events with different severity levels', async () => {
      const lowEventId = await securityService.logSecurityEvent(
        SecurityEventType.POOR_GPS_ACCURACY,
        'low',
        'testuser',
        'Poor GPS accuracy detected'
      );

      const highEventId = await securityService.logSecurityEvent(
        SecurityEventType.GPS_SPOOFING,
        'high',
        'testuser',
        'GPS spoofing detected'
      );

      expect(lowEventId).toBeDefined();
      expect(highEventId).toBeDefined();
      expect(lowEventId).not.toBe(highEventId);
    });
  });

  describe('logValidationFailure', () => {
    it('should log validation failures as security events', async () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'gpsCoordinates',
            message: 'GPS spoofing detected',
            code: 'GPS_SPOOFING_DETECTED'
          },
          {
            field: 'submission',
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED'
          }
        ],
        warnings: []
      };

      await securityService.logValidationFailure(
        'testuser',
        'challenge_1',
        'submission_1',
        validationResult
      );

      const userEvents = securityService.getUserSecurityEvents('testuser');
      expect(userEvents).toHaveLength(2);
      expect(userEvents[0].type).toBe(SecurityEventType.GPS_SPOOFING);
      expect(userEvents[1].type).toBe(SecurityEventType.RATE_LIMIT_EXCEEDED);
    });

    it('should map validation error codes to correct security event types', async () => {
      const validationResult: ValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'challengeId',
            message: 'Duplicate submission',
            code: 'DUPLICATE_SUBMISSION'
          }
        ],
        warnings: []
      };

      await securityService.logValidationFailure(
        'testuser',
        'challenge_1',
        'submission_1',
        validationResult
      );

      const userEvents = securityService.getUserSecurityEvents('testuser');
      expect(userEvents[0].type).toBe(SecurityEventType.DUPLICATE_SUBMISSION);
      expect(userEvents[0].severity).toBe('medium');
    });
  });

  describe('logFraudDetection', () => {
    it('should log fraud detection results', async () => {
      const fraudResult: FraudDetectionResult = {
        isValid: false,
        fraudRisk: 'high',
        reasons: ['GPS spoofing detected', 'Impossible travel speed'],
        confidence: 0.9,
        recommendedAction: 'reject'
      };

      await securityService.logFraudDetection(
        'testuser',
        'challenge_1',
        'submission_1',
        fraudResult
      );

      const userEvents = securityService.getUserSecurityEvents('testuser');
      expect(userEvents.length).toBeGreaterThan(0);
      
      const fraudEvent = userEvents.find(e => e.type === SecurityEventType.FRAUD_DETECTED);
      expect(fraudEvent).toBeDefined();
      expect(fraudEvent?.severity).toBe('high');
    });

    it('should log specific fraud types based on reasons', async () => {
      const fraudResult: FraudDetectionResult = {
        isValid: false,
        fraudRisk: 'high',
        reasons: [
          'GPS spoofing coordinate detected',
          'Impossible travel speed detected',
          'rapid submission pattern detected',
          'automation pattern detected'
        ],
        confidence: 0.95,
        recommendedAction: 'reject'
      };

      await securityService.logFraudDetection(
        'testuser',
        'challenge_1',
        'submission_1',
        fraudResult
      );

      const userEvents = securityService.getUserSecurityEvents('testuser');
      
      const eventTypes = userEvents.map(e => e.type);
      expect(eventTypes).toContain(SecurityEventType.FRAUD_DETECTED);
      expect(eventTypes).toContain(SecurityEventType.GPS_SPOOFING);
      expect(eventTypes).toContain(SecurityEventType.IMPOSSIBLE_TRAVEL);
      expect(eventTypes).toContain(SecurityEventType.RAPID_SUBMISSIONS);
      expect(eventTypes).toContain(SecurityEventType.AUTOMATED_BEHAVIOR);
    });
  });

  describe('flagSubmissionForReview', () => {
    it('should flag submission for manual review', async () => {
      await securityService.flagSubmissionForReview(
        'submission_1',
        'testuser',
        'challenge_1',
        'Suspicious GPS pattern',
        'medium',
        ['gps_accuracy_warning'],
        0.6,
        { gpsAccuracy: 150 }
      );

      const flaggedSubmissions = securityService.getFlaggedSubmissions('pending');
      expect(flaggedSubmissions).toHaveLength(1);
      expect(flaggedSubmissions[0].submissionId).toBe('submission_1');
      expect(flaggedSubmissions[0].flagReason).toBe('Suspicious GPS pattern');
      expect(flaggedSubmissions[0].severity).toBe('medium');
    });

    it('should create security event when flagging submission', async () => {
      await securityService.flagSubmissionForReview(
        'submission_1',
        'testuser',
        'challenge_1',
        'Test flag reason',
        'high'
      );

      const userEvents = securityService.getUserSecurityEvents('testuser');
      const flagEvent = userEvents.find(e => e.type === SecurityEventType.SUSPICIOUS_PATTERN);
      expect(flagEvent).toBeDefined();
      expect(flagEvent?.description).toContain('flagged for review');
    });
  });

  describe('reviewFlaggedSubmission', () => {
    it('should review flagged submission successfully', async () => {
      // First flag a submission
      await securityService.flagSubmissionForReview(
        'submission_1',
        'testuser',
        'challenge_1',
        'Test flag',
        'medium'
      );

      // Then review it
      const result = await securityService.reviewFlaggedSubmission(
        'submission_1',
        'reviewer',
        'approved',
        'Looks legitimate'
      );

      expect(result).toBe(true);

      const flaggedSubmissions = securityService.getFlaggedSubmissions('approved');
      expect(flaggedSubmissions).toHaveLength(1);
      expect(flaggedSubmissions[0].reviewStatus).toBe('approved');
      expect(flaggedSubmissions[0].reviewedBy).toBe('reviewer');
      expect(flaggedSubmissions[0].reviewNotes).toBe('Looks legitimate');
    });

    it('should return false for non-existent submission', async () => {
      const result = await securityService.reviewFlaggedSubmission(
        'nonexistent',
        'reviewer',
        'approved'
      );

      expect(result).toBe(false);
    });
  });

  describe('getSecurityMetrics', () => {
    it('should return security metrics for different timeframes', async () => {
      // Log some events
      await securityService.logSecurityEvent(
        SecurityEventType.FRAUD_DETECTED,
        'high',
        'user1',
        'Fraud detected'
      );
      
      await securityService.logSecurityEvent(
        SecurityEventType.GPS_SPOOFING,
        'medium',
        'user2',
        'GPS spoofing'
      );

      const metrics = securityService.getSecurityMetrics('day');

      expect(metrics.totalEvents).toBe(2);
      expect(metrics.eventsByType[SecurityEventType.FRAUD_DETECTED]).toBe(1);
      expect(metrics.eventsByType[SecurityEventType.GPS_SPOOFING]).toBe(1);
      expect(metrics.eventsBySeverity.high).toBe(1);
      expect(metrics.eventsBySeverity.medium).toBe(1);
      expect(metrics.uniqueUsersAffected).toBe(2);
    });

    it('should calculate top offending users', async () => {
      // Log multiple events for same user
      await securityService.logSecurityEvent(
        SecurityEventType.FRAUD_DETECTED,
        'high',
        'baduser',
        'Fraud 1'
      );
      
      await securityService.logSecurityEvent(
        SecurityEventType.GPS_SPOOFING,
        'high',
        'baduser',
        'Fraud 2'
      );

      await securityService.logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        'medium',
        'normaluser',
        'Rate limit'
      );

      const metrics = securityService.getSecurityMetrics('day');

      expect(metrics.topOffendingUsers).toHaveLength(2);
      expect(metrics.topOffendingUsers[0].userId).toBe('baduser');
      expect(metrics.topOffendingUsers[0].eventCount).toBe(2);
      expect(metrics.topOffendingUsers[1].userId).toBe('normaluser');
      expect(metrics.topOffendingUsers[1].eventCount).toBe(1);
    });

    it('should include recent trends data', async () => {
      await securityService.logSecurityEvent(
        SecurityEventType.FRAUD_DETECTED,
        'high',
        'user1',
        'Fraud detected'
      );

      const metrics = securityService.getSecurityMetrics('week');

      expect(metrics.recentTrends).toHaveLength(7);
      expect(metrics.recentTrends.some(trend => trend.fraudAttempts > 0)).toBe(true);
    });
  });

  describe('alert system', () => {
    it('should create alerts when thresholds are exceeded', async () => {
      // Log many fraud events to trigger alert
      for (let i = 0; i < 12; i++) {
        await securityService.logSecurityEvent(
          SecurityEventType.FRAUD_DETECTED,
          'high',
          `user${i}`,
          `Fraud ${i}`
        );
      }

      const alerts = securityService.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      
      const fraudAlert = alerts.find(a => a.title.includes('Fraud Activity'));
      expect(fraudAlert).toBeDefined();
      expect(fraudAlert?.severity).toBe('critical');
    });

    it('should acknowledge alerts', async () => {
      // Create an alert by logging many events
      for (let i = 0; i < 6; i++) {
        await securityService.logSecurityEvent(
          SecurityEventType.GPS_SPOOFING,
          'high',
          `user${i}`,
          `GPS spoofing ${i}`
        );
      }

      const activeAlerts = securityService.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);

      const alertId = activeAlerts[0].id;
      const result = await securityService.acknowledgeAlert(alertId, 'admin');

      expect(result).toBe(true);
      
      const updatedAlerts = securityService.getActiveAlerts();
      expect(updatedAlerts.find(a => a.id === alertId)).toBeUndefined();
    });
  });

  describe('resolveSecurityEvent', () => {
    it('should resolve security events', async () => {
      const eventId = await securityService.logSecurityEvent(
        SecurityEventType.FRAUD_DETECTED,
        'high',
        'testuser',
        'Test fraud'
      );

      const result = await securityService.resolveSecurityEvent(
        eventId,
        'admin',
        'False positive - user verified'
      );

      expect(result).toBe(true);
    });

    it('should return false for non-existent event', async () => {
      const result = await securityService.resolveSecurityEvent(
        'nonexistent',
        'admin',
        'Test resolution'
      );

      expect(result).toBe(false);
    });
  });

  describe('getUserSecurityEvents', () => {
    it('should return events for specific user', async () => {
      await securityService.logSecurityEvent(
        SecurityEventType.FRAUD_DETECTED,
        'high',
        'user1',
        'Fraud for user1'
      );

      await securityService.logSecurityEvent(
        SecurityEventType.GPS_SPOOFING,
        'medium',
        'user2',
        'GPS issue for user2'
      );

      const user1Events = securityService.getUserSecurityEvents('user1');
      const user2Events = securityService.getUserSecurityEvents('user2');

      expect(user1Events).toHaveLength(1);
      expect(user2Events).toHaveLength(1);
      expect(user1Events[0].userId).toBe('user1');
      expect(user2Events[0].userId).toBe('user2');
    });

    it('should limit number of returned events', async () => {
      // Log many events for one user
      for (let i = 0; i < 25; i++) {
        await securityService.logSecurityEvent(
          SecurityEventType.VALIDATION_FAILURE,
          'low',
          'testuser',
          `Event ${i}`
        );
      }

      const events = securityService.getUserSecurityEvents('testuser', 10);
      expect(events).toHaveLength(10);
    });
  });
});