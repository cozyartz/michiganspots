/**
 * Legal Audit Logging System
 *
 * Provides comprehensive audit trail for all legal and compliance events.
 * Logs to legal_audit_log table with full metadata capture.
 */

export type LegalEventType =
  // Pre-payment events
  | 'agreement_preview_opened'
  | 'agreement_preview_checkbox_checked'
  | 'agreement_preview_expanded'
  | 'agreement_preview_collapsed'

  // Payment events
  | 'payment_initiated'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_canceled'

  // Agreement events
  | 'agreement_email_sent'
  | 'agreement_email_opened'
  | 'agreement_email_clicked'
  | 'agreement_pdf_generated'
  | 'agreement_pdf_uploaded'
  | 'agreement_accepted'
  | 'agreement_rejected'

  // Activation events
  | 'partnership_activated'
  | 'partnership_deactivated'

  // Admin review events
  | 'admin_review_requested'
  | 'admin_review_started'
  | 'admin_approved'
  | 'admin_rejected'
  | 'admin_requested_more_info'

  // Refund events
  | 'refund_eligibility_reached'
  | 'refund_warning_sent'
  | 'refund_initiated'
  | 'refund_completed'
  | 'refund_failed';

export interface AuditLogEntry {
  eventType: LegalEventType;
  partnershipActivationId?: number;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Log a legal/compliance event to audit trail
 */
export async function logLegalEvent(
  db: D1Database,
  entry: AuditLogEntry
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO legal_audit_log
       (event_type, partnership_activation_id, user_id, ip_address, user_agent, event_timestamp, event_metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      entry.eventType,
      entry.partnershipActivationId || null,
      entry.userId || null,
      entry.ipAddress || null,
      entry.userAgent || null,
      now,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      now
    )
    .run();
}

/**
 * Get audit history for a specific partnership
 */
export async function getPartnershipAuditHistory(
  db: D1Database,
  partnershipActivationId: number
): Promise<any[]> {
  const result = await db
    .prepare(
      `SELECT * FROM legal_audit_log
       WHERE partnership_activation_id = ?
       ORDER BY event_timestamp DESC`
    )
    .bind(partnershipActivationId)
    .all();

  return result.results || [];
}

/**
 * Get audit events by type within date range
 */
export async function getAuditEventsByType(
  db: D1Database,
  eventType: LegalEventType,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const result = await db
    .prepare(
      `SELECT * FROM legal_audit_log
       WHERE event_type = ?
       AND event_timestamp BETWEEN ? AND ?
       ORDER BY event_timestamp DESC`
    )
    .bind(eventType, startDate, endDate)
    .all();

  return result.results || [];
}

/**
 * Capture client metadata for audit logging
 */
export function captureClientMetadata(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  // Try multiple headers for IP address (Cloudflare sets CF-Connecting-IP)
  const ipAddress =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
    request.headers.get('X-Real-IP') ||
    'unknown';

  const userAgent = request.headers.get('User-Agent') || 'unknown';

  return {
    ipAddress,
    userAgent
  };
}

/**
 * Enhanced audit log with automatic metadata capture
 */
export async function logLegalEventFromRequest(
  db: D1Database,
  request: Request,
  eventType: LegalEventType,
  partnershipActivationId?: number,
  metadata?: Record<string, any>
): Promise<void> {
  const clientMetadata = captureClientMetadata(request);

  await logLegalEvent(db, {
    eventType,
    partnershipActivationId,
    ipAddress: clientMetadata.ipAddress,
    userAgent: clientMetadata.userAgent,
    metadata
  });
}

/**
 * Verify audit trail completeness for a partnership
 * Returns true if all required events are present
 */
export async function verifyAuditTrailCompleteness(
  db: D1Database,
  partnershipActivationId: number
): Promise<{
  complete: boolean;
  missingEvents: string[];
}> {
  const requiredEvents: LegalEventType[] = [
    'payment_succeeded',
    'agreement_email_sent',
    'agreement_pdf_generated',
    'agreement_accepted',
    'partnership_activated'
  ];

  const history = await getPartnershipAuditHistory(db, partnershipActivationId);
  const eventTypes = new Set(history.map(log => log.event_type));

  const missingEvents = requiredEvents.filter(event => !eventTypes.has(event));

  return {
    complete: missingEvents.length === 0,
    missingEvents
  };
}
