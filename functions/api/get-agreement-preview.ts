/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

/**
 * Get Agreement Preview API
 *
 * Returns the current partnership agreement for preview before payment.
 * Logs preview events to audit trail.
 */

import { logLegalEventFromRequest } from '../../src/lib/legalAuditLog';

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'GET' && request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Get current partnership agreement
    const agreementResult = await env.DB.prepare(
      `SELECT * FROM legal_documents
       WHERE document_type = 'partnership_agreement'
       AND is_current = 1`
    ).first();

    if (!agreementResult) {
      return new Response(
        JSON.stringify({ error: 'Agreement not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // If POST, log the preview event with partner_signup_id
    if (request.method === 'POST') {
      const body = await request.json() as {
        partnerSignupId?: number;
        action: 'opened' | 'checkbox_checked' | 'expanded' | 'collapsed';
      };

      const eventTypeMap = {
        opened: 'agreement_preview_opened',
        checkbox_checked: 'agreement_preview_checkbox_checked',
        expanded: 'agreement_preview_expanded',
        collapsed: 'agreement_preview_collapsed'
      } as const;

      await logLegalEventFromRequest(
        env.DB,
        request,
        eventTypeMap[body.action],
        undefined, // No partnership_activation_id yet
        {
          partnerSignupId: body.partnerSignupId,
          documentId: agreementResult.id,
          documentVersion: agreementResult.version_number
        }
      );

      // Also log to agreement_preview_log table if partnerSignupId provided
      if (body.partnerSignupId && body.action === 'opened') {
        await env.DB.prepare(
          `INSERT INTO agreement_preview_log
           (partner_signup_id, legal_document_id, preview_opened_at, ip_address, user_agent, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(
            body.partnerSignupId,
            agreementResult.id,
            new Date().toISOString(),
            request.headers.get('CF-Connecting-IP') || 'unknown',
            request.headers.get('User-Agent') || 'unknown',
            new Date().toISOString()
          )
          .run();
      }

      if (body.action === 'checkbox_checked' && body.partnerSignupId) {
        await env.DB.prepare(
          `UPDATE agreement_preview_log
           SET preview_checkbox_checked = 1
           WHERE partner_signup_id = ?
           ORDER BY preview_opened_at DESC
           LIMIT 1`
        )
          .bind(body.partnerSignupId)
          .run();
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        agreement: {
          id: agreementResult.id,
          version: agreementResult.version_number,
          effectiveDate: agreementResult.effective_date,
          html: agreementResult.agreement_html,
          text: agreementResult.agreement_text
        }
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Get agreement preview error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve agreement' }),
      { status: 500, headers: corsHeaders }
    );
  }
};
