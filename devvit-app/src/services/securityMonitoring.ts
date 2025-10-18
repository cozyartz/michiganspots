/**
 * Security monitoring service for logging suspicious activities and flagging submissions
 */

import { 
  Submission, 
  Challenge, 
  UserSubmissionHistory,
  GPSCoordinate 
} from '../types/core.js';
import { 
  ValidationResult, 
  ErrorType 
} from '../types/errors.js';
import { FraudDetectionResult } from './fraudDetection.js';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  challengeId?: string;
  submissionId?: string;
  timestamp: Date;
  description: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

export enum SecurityEventType {
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  GPS_SPOOFING = 'GPS_SPOOFING',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  DUPLICATE_SUBMISSION = 'DUPLICATE_SUBMISSION',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
  VALIDATION_FAILURE = 'VALIDATION_FAILURE',
  IMPOSSIBLE_TRAVEL = 'IMPOSSIBLE_TRAVEL',
  POOR_GPS_ACCURACY = 'POOR_GPS_ACCURACY',
  RAPID_SUBMISSIONS = 'RAPID_SUBMISSIONS',
  AUTOMATED_BEHAVIOR = 'AUTOMATED_BEHAVIOR',
  PHOTO_VALIDATION_FAILED = 'PHOTO_VALIDATION_FAILED',
  LOCATION_VERIFICATION_FAILED = 'LOCATION_VERIFICATION_FAILED'
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<string, number>;
  uniqueUsersAffected: number;
  resolvedEvents: number;
  pendingReview: number;
  averageResolutionTime: number; // in hours
  topOffendingUsers: Array<{
    userId: string;
    eventCount: number;
    lastEventDate: Date;
  }>;
  recentTrends: Array<{
    date: string;
    eventCount: number;
    fraudAttempts: number;
  }>;
}

export interface FlaggedSubmission {
  submissionId: string;
  userId: string;
  challengeId: string;
  flaggedAt: Date;
  flagReason: string;
  severity: 'low' | 'medium' | 'high';
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'escalated';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  automaticFlags: string[];
  manualFlags: string[];
  fraudScore: number;
  metadata: Record<string, any>;
}

export interface SecurityAlert {
  id: string;
  type: 'threshold_exceeded' | 'pattern_detected' | 'critical_event';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  relatedEvents: string[];
  actionRequired: boolean;
  suggestedActions: string[];
}

/**
 * Security monitoring and alerting service
 */
export class SecurityMonitoringService {
  private events: Map<string, SecurityEvent> = new Map();
  private flaggedSubmissions: Map<string, FlaggedSubmission> = new Map();
  private alerts: Map<string, SecurityAlert> = new Map();
  
  // Thresholds for automatic alerting
  private readonly ALERT_THRESHOLDS = {
    FRAUD_EVENTS_PER_HOUR: 10,
    UNIQUE_USERS_WITH_FRAUD_PER_DAY: 5,
    GPS_SPOOFING_EVENTS_PER_HOUR: 5,
    RATE_LIMIT_VIOLATIONS_PER_HOUR: 20,
    HIGH_SEVERITY_EVENTS_PER_HOUR: 3
  };

  /**
   * Log a security event
   */
  async logSecurityEvent(
    type: SecurityEventType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId: string,
    description: string,
    metadata: Record<string, any> = {},
    challengeId?: string,
    submissionId?: string
  ): Promise<string> {
    const eventId = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const event: SecurityEvent = {
      id: eventId,
      type,
      severity,
      userId,
      challengeId,
      submissionId,
      timestamp: new Date(),
      description,
      metadata,
      resolved: false
    };

    this.events.set(eventId, event);

    // Log to console for debugging
    console.log(`[SECURITY] ${severity.toUpperCase()}: ${type} - ${description}`, {
      userId,
      challengeId,
      submissionId,
      metadata
    });

    // Check if this event should trigger an alert
    await this.checkAlertThresholds(event);

    return eventId;
  }

  /**
   * Log validation failure as security event
   */
  async logValidationFailure(
    userId: string,
    challengeId: string,
    submissionId: string,
    validationResult: ValidationResult
  ): Promise<void> {
    const errors = validationResult.errors;
    
    for (const error of errors) {
      let eventType: SecurityEventType;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

      // Map validation errors to security event types
      switch (error.code) {
        case 'FRAUD_DETECTED':
          eventType = SecurityEventType.FRAUD_DETECTED;
          severity = 'high';
          break;
        case 'GPS_SPOOFING_DETECTED':
          eventType = SecurityEventType.GPS_SPOOFING;
          severity = 'high';
          break;
        case 'RATE_LIMIT_EXCEEDED':
          eventType = SecurityEventType.RATE_LIMIT_EXCEEDED;
          severity = 'medium';
          break;
        case 'DUPLICATE_SUBMISSION':
          eventType = SecurityEventType.DUPLICATE_SUBMISSION;
          severity = 'medium';
          break;
        case 'LOCATION_TOO_FAR':
          eventType = SecurityEventType.LOCATION_VERIFICATION_FAILED;
          severity = 'low';
          break;
        case 'POOR_GPS_ACCURACY':
          eventType = SecurityEventType.POOR_GPS_ACCURACY;
          severity = 'low';
          break;
        default:
          eventType = SecurityEventType.VALIDATION_FAILURE;
          severity = 'low';
      }

      await this.logSecurityEvent(
        eventType,
        severity,
        userId,
        error.message,
        { 
          errorCode: error.code,
          errorField: error.field,
          validationContext: 'submission_validation'
        },
        challengeId,
        submissionId
      );
    }
  }

  /**
   * Log fraud detection results
   */
  async logFraudDetection(
    userId: string,
    challengeId: string,
    submissionId: string,
    fraudResult: FraudDetectionResult
  ): Promise<void> {
    if (!fraudResult.isValid || fraudResult.fraudRisk === 'high') {
      await this.logSecurityEvent(
        SecurityEventType.FRAUD_DETECTED,
        fraudResult.fraudRisk === 'high' ? 'high' : 'medium',
        userId,
        `Fraud detection: ${fraudResult.reasons.join(', ')}`,
        {
          fraudRisk: fraudResult.fraudRisk,
          confidence: fraudResult.confidence,
          recommendation: fraudResult.recommendedAction,
          reasons: fraudResult.reasons
        },
        challengeId,
        submissionId
      );
    }

    // Log specific fraud types
    for (const reason of fraudResult.reasons) {
      if (reason.includes('GPS spoofing') || reason.includes('coordinate')) {
        await this.logSecurityEvent(
          SecurityEventType.GPS_SPOOFING,
          'high',
          userId,
          reason,
          { fraudScore: fraudResult.confidence },
          challengeId,
          submissionId
        );
      }
      
      if (reason.includes('travel speed') || reason.includes('impossible')) {
        await this.logSecurityEvent(
          SecurityEventType.IMPOSSIBLE_TRAVEL,
          'medium',
          userId,
          reason,
          { fraudScore: fraudResult.confidence },
          challengeId,
          submissionId
        );
      }
      
      if (reason.includes('rapid') || reason.includes('timing')) {
        await this.logSecurityEvent(
          SecurityEventType.RAPID_SUBMISSIONS,
          'medium',
          userId,
          reason,
          { fraudScore: fraudResult.confidence },
          challengeId,
          submissionId
        );
      }
      
      if (reason.includes('pattern') || reason.includes('automation')) {
        await this.logSecurityEvent(
          SecurityEventType.AUTOMATED_BEHAVIOR,
          'medium',
          userId,
          reason,
          { fraudScore: fraudResult.confidence },
          challengeId,
          submissionId
        );
      }
    }
  }

  /**
   * Flag a submission for manual review
   */
  async flagSubmissionForReview(
    submissionId: string,
    userId: string,
    challengeId: string,
    flagReason: string,
    severity: 'low' | 'medium' | 'high',
    automaticFlags: string[] = [],
    fraudScore: number = 0,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const flaggedSubmission: FlaggedSubmission = {
      submissionId,
      userId,
      challengeId,
      flaggedAt: new Date(),
      flagReason,
      severity,
      reviewStatus: 'pending',
      automaticFlags,
      manualFlags: [],
      fraudScore,
      metadata
    };

    this.flaggedSubmissions.set(submissionId, flaggedSubmission);

    // Log the flagging as a security event
    await this.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_PATTERN,
      severity,
      userId,
      `Submission flagged for review: ${flagReason}`,
      {
        submissionId,
        flagReason,
        automaticFlags,
        fraudScore,
        ...metadata
      },
      challengeId,
      submissionId
    );

    console.log(`[SECURITY] Submission ${submissionId} flagged for review: ${flagReason}`);
  }

  /**
   * Review a flagged submission
   */
  async reviewFlaggedSubmission(
    submissionId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected' | 'escalated',
    reviewNotes?: string
  ): Promise<boolean> {
    const flaggedSubmission = this.flaggedSubmissions.get(submissionId);
    
    if (!flaggedSubmission) {
      console.error(`Flagged submission ${submissionId} not found`);
      return false;
    }

    flaggedSubmission.reviewStatus = decision;
    flaggedSubmission.reviewedBy = reviewerId;
    flaggedSubmission.reviewedAt = new Date();
    flaggedSubmission.reviewNotes = reviewNotes;

    this.flaggedSubmissions.set(submissionId, flaggedSubmission);

    // Log the review decision
    await this.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_PATTERN,
      'low',
      flaggedSubmission.userId,
      `Flagged submission reviewed: ${decision}`,
      {
        submissionId,
        reviewerId,
        decision,
        reviewNotes,
        originalFlagReason: flaggedSubmission.flagReason
      },
      flaggedSubmission.challengeId,
      submissionId
    );

    console.log(`[SECURITY] Submission ${submissionId} reviewed by ${reviewerId}: ${decision}`);
    return true;
  }

  /**
   * Get security metrics for monitoring dashboard
   */
  getSecurityMetrics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): SecurityMetrics {
    const now = new Date();
    let startTime: Date;

    switch (timeframe) {
      case 'hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const relevantEvents = Array.from(this.events.values())
      .filter(event => event.timestamp >= startTime);

    const eventsByType: Record<SecurityEventType, number> = {} as any;
    const eventsBySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const uniqueUsers = new Set<string>();
    let resolvedEvents = 0;

    for (const event of relevantEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity]++;
      uniqueUsers.add(event.userId);
      if (event.resolved) resolvedEvents++;
    }

    // Calculate top offending users
    const userEventCounts = new Map<string, { count: number; lastEvent: Date }>();
    for (const event of relevantEvents) {
      const current = userEventCounts.get(event.userId) || { count: 0, lastEvent: event.timestamp };
      userEventCounts.set(event.userId, {
        count: current.count + 1,
        lastEvent: event.timestamp > current.lastEvent ? event.timestamp : current.lastEvent
      });
    }

    const topOffendingUsers = Array.from(userEventCounts.entries())
      .map(([userId, data]) => ({
        userId,
        eventCount: data.count,
        lastEventDate: data.lastEvent
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    // Calculate recent trends (daily breakdown for the timeframe)
    const recentTrends: Array<{ date: string; eventCount: number; fraudAttempts: number }> = [];
    const daysToShow = timeframe === 'hour' ? 1 : timeframe === 'day' ? 7 : timeframe === 'week' ? 7 : 30;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayEvents = relevantEvents.filter(
        event => event.timestamp >= dayStart && event.timestamp < dayEnd
      );
      
      const fraudAttempts = dayEvents.filter(
        event => event.type === SecurityEventType.FRAUD_DETECTED ||
                event.type === SecurityEventType.GPS_SPOOFING
      ).length;

      recentTrends.push({
        date: dayStart.toISOString().split('T')[0],
        eventCount: dayEvents.length,
        fraudAttempts
      });
    }

    // Calculate average resolution time
    const resolvedEventsWithTime = relevantEvents.filter(
      event => event.resolved && event.resolvedAt
    );
    
    let averageResolutionTime = 0;
    if (resolvedEventsWithTime.length > 0) {
      const totalResolutionTime = resolvedEventsWithTime.reduce((sum, event) => {
        const resolutionTime = (event.resolvedAt!.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60);
        return sum + resolutionTime;
      }, 0);
      averageResolutionTime = totalResolutionTime / resolvedEventsWithTime.length;
    }

    const pendingReview = Array.from(this.flaggedSubmissions.values())
      .filter(submission => submission.reviewStatus === 'pending').length;

    return {
      totalEvents: relevantEvents.length,
      eventsByType,
      eventsBySeverity,
      uniqueUsersAffected: uniqueUsers.size,
      resolvedEvents,
      pendingReview,
      averageResolutionTime,
      topOffendingUsers,
      recentTrends
    };
  }

  /**
   * Get flagged submissions for review
   */
  getFlaggedSubmissions(
    status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'all' = 'pending',
    limit: number = 50
  ): FlaggedSubmission[] {
    let submissions = Array.from(this.flaggedSubmissions.values());
    
    if (status !== 'all') {
      submissions = submissions.filter(submission => submission.reviewStatus === status);
    }

    return submissions
      .sort((a, b) => b.flaggedAt.getTime() - a.flaggedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get security events for a specific user
   */
  getUserSecurityEvents(userId: string, limit: number = 20): SecurityEvent[] {
    return Array.from(this.events.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Check alert thresholds and create alerts if necessary
   */
  private async checkAlertThresholds(event: SecurityEvent): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentEvents = Array.from(this.events.values())
      .filter(e => e.timestamp >= oneHourAgo);

    // Check fraud events per hour
    const fraudEvents = recentEvents.filter(
      e => e.type === SecurityEventType.FRAUD_DETECTED
    );
    
    if (fraudEvents.length >= this.ALERT_THRESHOLDS.FRAUD_EVENTS_PER_HOUR) {
      await this.createAlert(
        'threshold_exceeded',
        'High Fraud Activity Detected',
        `${fraudEvents.length} fraud events detected in the last hour`,
        'high',
        fraudEvents.map(e => e.id),
        true,
        ['Review flagged submissions', 'Investigate user patterns', 'Consider temporary restrictions']
      );
    }

    // Check GPS spoofing events
    const gpsEvents = recentEvents.filter(
      e => e.type === SecurityEventType.GPS_SPOOFING
    );
    
    if (gpsEvents.length >= this.ALERT_THRESHOLDS.GPS_SPOOFING_EVENTS_PER_HOUR) {
      await this.createAlert(
        'threshold_exceeded',
        'GPS Spoofing Spike Detected',
        `${gpsEvents.length} GPS spoofing events detected in the last hour`,
        'high',
        gpsEvents.map(e => e.id),
        true,
        ['Review GPS validation logic', 'Check for coordinated attacks', 'Update fraud detection rules']
      );
    }

    // Check high severity events
    const highSeverityEvents = recentEvents.filter(
      e => e.severity === 'high' || e.severity === 'critical'
    );
    
    if (highSeverityEvents.length >= this.ALERT_THRESHOLDS.HIGH_SEVERITY_EVENTS_PER_HOUR) {
      await this.createAlert(
        'threshold_exceeded',
        'Multiple High Severity Security Events',
        `${highSeverityEvents.length} high/critical severity events in the last hour`,
        'critical',
        highSeverityEvents.map(e => e.id),
        true,
        ['Immediate investigation required', 'Review all recent submissions', 'Consider system lockdown']
      );
    }

    // Check unique users with fraud per day
    const dailyEvents = Array.from(this.events.values())
      .filter(e => e.timestamp >= oneDayAgo && e.type === SecurityEventType.FRAUD_DETECTED);
    
    const uniqueFraudUsers = new Set(dailyEvents.map(e => e.userId));
    
    if (uniqueFraudUsers.size >= this.ALERT_THRESHOLDS.UNIQUE_USERS_WITH_FRAUD_PER_DAY) {
      await this.createAlert(
        'pattern_detected',
        'Widespread Fraud Activity',
        `${uniqueFraudUsers.size} unique users involved in fraud attempts today`,
        'critical',
        dailyEvents.map(e => e.id),
        true,
        ['Investigate for coordinated attack', 'Review user registration patterns', 'Implement additional verification']
      );
    }
  }

  /**
   * Create a security alert
   */
  private async createAlert(
    type: 'threshold_exceeded' | 'pattern_detected' | 'critical_event',
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    relatedEvents: string[],
    actionRequired: boolean,
    suggestedActions: string[]
  ): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: SecurityAlert = {
      id: alertId,
      type,
      title,
      description,
      severity,
      triggeredAt: new Date(),
      acknowledged: false,
      relatedEvents,
      actionRequired,
      suggestedActions
    };

    this.alerts.set(alertId, alert);

    console.log(`[SECURITY ALERT] ${severity.toUpperCase()}: ${title} - ${description}`);
    
    return alertId;
  }

  /**
   * Get active security alerts
   */
  getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => {
        // Sort by severity first, then by time
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.triggeredAt.getTime() - a.triggeredAt.getTime();
      });
  }

  /**
   * Acknowledge a security alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    this.alerts.set(alertId, alert);
    
    console.log(`[SECURITY] Alert ${alertId} acknowledged by ${acknowledgedBy}`);
    return true;
  }

  /**
   * Resolve a security event
   */
  async resolveSecurityEvent(
    eventId: string,
    resolvedBy: string,
    resolutionNotes?: string
  ): Promise<boolean> {
    const event = this.events.get(eventId);
    
    if (!event) {
      return false;
    }

    event.resolved = true;
    event.resolvedBy = resolvedBy;
    event.resolvedAt = new Date();
    event.resolutionNotes = resolutionNotes;

    this.events.set(eventId, event);
    
    console.log(`[SECURITY] Event ${eventId} resolved by ${resolvedBy}`);
    return true;
  }
}