/**
 * Enhanced Agreement Acceptance API
 *
 * Handles:
 * - Agreement acceptance with full audit trail
 * - PDF generation and storage
 * - Tier-based activation logic
 * - Auto-refund queue removal
 * - Email notifications
 */

import { logLegalEventFromRequest, captureClientMetadata } from '../../src/lib/legalAuditLog';
import { generateAndStorePDF } from '../../src/lib/pdfGenerator';

interface AcceptanceRequest {
  sessionId: string;
  fullName: string;
  title: string;
  ipAddress: string;
  acceptedDate: string;
  checkboxes: Record<string, boolean>;
}

interface Env {
  DB: D1Database;
  R2?: R2Bucket; // Optional until R2 is configured
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as AcceptanceRequest;
    const { sessionId, fullName, title, ipAddress, acceptedDate, checkboxes } = body;

    // Validate all 7 required checkboxes
    const requiredCheckboxes = [
      'readAgreement',
      'authorityToBind',
      'noRefunds',
      'liabilityLimitations',
      'indemnification',
      'jurisdiction',
      'electronicSignature'
    ];

    const missingCheckboxes = requiredCheckboxes.filter(cb => !checkboxes[cb]);

    if (missingCheckboxes.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'All required checkboxes must be accepted',
          missing: missingCheckboxes
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!sessionId || !fullName || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = context.env.DB;
    const clientMetadata = captureClientMetadata(context.request);

    // Find the partnership activation for this session
    const activation = await db
      .prepare(`
        SELECT pa.*, pp.stripe_customer_id, pp.partnership_type, pp.partnership_tier, pp.email, pp.organization_name
        FROM partnership_activations pa
        JOIN partner_payments pp ON pa.partner_payment_id = pp.id
        WHERE pp.payment_metadata LIKE ?
        LIMIT 1
      `)
      .bind(`%${sessionId}%`)
      .first();

    if (!activation) {
      return new Response(
        JSON.stringify({ error: 'Partnership not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current legal document version
    const legalDoc = await db
      .prepare('SELECT * FROM legal_documents WHERE document_type = ? AND is_current = 1')
      .bind('partnership_agreement')
      .first();

    const now = new Date().toISOString();

    // Record the agreement acceptance with enhanced metadata
    const agreementResult = await db
      .prepare(`
        INSERT INTO partnership_agreements
        (partnership_activation_id, full_name, title, ip_address, accepted_date, checkboxes_accepted,
         agreement_version, user_agent, document_version_id, acceptance_timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        activation.id,
        fullName,
        title,
        ipAddress,
        acceptedDate,
        JSON.stringify(checkboxes),
        legalDoc?.version_number || '1.0',
        clientMetadata.userAgent,
        legalDoc?.id || null,
        now,
        now
      )
      .run();

    // Log agreement acceptance to audit trail
    await logLegalEventFromRequest(
      db,
      context.request,
      'agreement_accepted',
      activation.id,
      {
        fullName,
        title,
        checkboxes: Object.keys(checkboxes).filter(k => checkboxes[k]),
        documentVersion: legalDoc?.version_number || '1.0'
      }
    );

    // Generate and store signed PDF (if R2 is configured)
    let pdfUrl = null;
    let pdfStorageKey = null;

    if (context.env.R2 && legalDoc) {
      try {
        const pdfData = {
          agreementHtml: legalDoc.agreement_html,
          agreementVersion: legalDoc.version_number,
          partnershipDetails: {
            partnerName: fullName,
            organizationName: activation.organization_name || 'Unknown',
            email: activation.email || 'Unknown',
            phone: 'N/A', // Would need to add to schema
            address: 'N/A', // Would need to add to schema
            tier: activation.partnership_tier || 'Unknown',
            duration: 'N/A', // Would need to add to schema
            pricing: {
              amount: 0, // Would need to retrieve from payment
              interval: 'month'
            }
          },
          signatureDetails: {
            fullName,
            title,
            signedDate: acceptedDate,
            ipAddress,
            userAgent: clientMetadata.userAgent
          }
        };

        const pdfResult = await generateAndStorePDF(
          db,
          context.env.R2,
          activation.id as number,
          pdfData
        );

        pdfUrl = pdfResult.url;
        pdfStorageKey = pdfResult.storageKey;

        // Update agreement record with PDF info
        await db
          .prepare('UPDATE partnership_agreements SET pdf_url = ?, pdf_storage_key = ? WHERE id = ?')
          .bind(pdfUrl, pdfStorageKey, agreementResult.meta.last_row_id)
          .run();
      } catch (pdfError) {
        console.error('PDF generation failed (non-fatal):', pdfError);
        // Continue - PDF generation failure shouldn't block agreement acceptance
      }
    }

    // Determine if manual review required based on tier
    const tierName = activation.partnership_tier as string;
    const requiresReview = tierName === 'Premium Sponsor' || tierName === 'Title Sponsor';

    // Update partnership activation status
    await db
      .prepare(`UPDATE partnership_activations
                SET agreement_accepted = 1,
                    requires_manual_review = ?,
                    admin_review_status = ?,
                    updated_at = ?
                WHERE id = ?`)
      .bind(
        requiresReview ? 1 : 0,
        requiresReview ? 'pending' : 'auto_approved',
        now,
        activation.id
      )
      .run();

    // Remove from refund queue if present
    await db
      .prepare('UPDATE refund_queue SET refund_processed = 1, refund_processed_at = ? WHERE partnership_activation_id = ?')
      .bind(now, activation.id)
      .run();

    // Log appropriate activation event
    if (requiresReview) {
      await logLegalEventFromRequest(
        db,
        context.request,
        'admin_review_requested',
        activation.id,
        { tier: tierName }
      );
    } else {
      await logLegalEventFromRequest(
        db,
        context.request,
        'partnership_activated',
        activation.id,
        { tier: tierName, autoApproved: true }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        requiresReview,
        pdfUrl,
        message: requiresReview
          ? 'Agreement accepted. Your partnership is pending admin review.'
          : 'Agreement accepted. Your partnership is now active!'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Agreement acceptance error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
