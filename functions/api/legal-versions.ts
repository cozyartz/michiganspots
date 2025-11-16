/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

/**
 * Legal Version Control API
 *
 * Manages versioned legal documents (partnership agreements, terms of service, etc.)
 * GET: Retrieve current or specific version
 * POST: Create new version (admin only)
 */

import { logLegalEvent } from '../../src/lib/legalAuditLog';

interface Env {
  DB: D1Database;
  ADMIN_API_KEY?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (request.method === 'GET') {
      return await handleGetAgreement(env, url, corsHeaders);
    } else if (request.method === 'POST') {
      return await handleCreateVersion(env, request, corsHeaders);
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error('Legal versions API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
};

/**
 * GET /api/legal-versions?type=partnership_agreement&version=1.0
 * GET /api/legal-versions?type=partnership_agreement (gets current version)
 */
async function handleGetAgreement(
  env: Env,
  url: URL,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const documentType = url.searchParams.get('type') || 'partnership_agreement';
  const version = url.searchParams.get('version');

  let query: D1PreparedStatement;

  if (version) {
    // Get specific version
    query = env.DB.prepare(
      `SELECT * FROM legal_documents
       WHERE document_type = ? AND version_number = ?`
    ).bind(documentType, version);
  } else {
    // Get current version
    query = env.DB.prepare(
      `SELECT * FROM legal_documents
       WHERE document_type = ? AND is_current = 1`
    ).bind(documentType);
  }

  const result = await query.first();

  if (!result) {
    return new Response(
      JSON.stringify({ error: 'Document not found' }),
      { status: 404, headers: corsHeaders }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      document: {
        id: result.id,
        type: result.document_type,
        version: result.version_number,
        effectiveDate: result.effective_date,
        expirationDate: result.expiration_date,
        html: result.agreement_html,
        text: result.agreement_text,
        isCurrent: result.is_current === 1
      }
    }),
    { status: 200, headers: corsHeaders }
  );
}

/**
 * POST /api/legal-versions
 * Create new version of legal document (admin only)
 */
async function handleCreateVersion(
  env: Env,
  request: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Verify admin authentication
  const authHeader = request.headers.get('Authorization');
  const adminKey = env.ADMIN_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const body = await request.json() as {
    documentType: string;
    versionNumber: string;
    agreementHtml: string;
    agreementText: string;
    changelog?: string;
    createdBy: string;
  };

  // Validate required fields
  if (!body.documentType || !body.versionNumber || !body.agreementHtml || !body.agreementText) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const now = new Date().toISOString();

  // Start transaction
  try {
    // 1. Mark current version as expired
    await env.DB.prepare(
      `UPDATE legal_documents
       SET is_current = 0,
           expiration_date = ?
       WHERE document_type = ? AND is_current = 1`
    )
      .bind(now, body.documentType)
      .run();

    // 2. Insert new version as current
    const result = await env.DB.prepare(
      `INSERT INTO legal_documents
       (document_type, version_number, effective_date, agreement_html, agreement_text, changelog, created_by, created_at, is_current)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
      .bind(
        body.documentType,
        body.versionNumber,
        now,
        body.agreementHtml,
        body.agreementText,
        body.changelog || null,
        body.createdBy,
        now
      )
      .run();

    // 3. Log version creation
    await logLegalEvent(env.DB, {
      eventType: 'agreement_pdf_generated', // Reusing event type, could add new one
      metadata: {
        action: 'version_created',
        documentType: body.documentType,
        versionNumber: body.versionNumber,
        createdBy: body.createdBy
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'New version created successfully',
        documentId: result.meta.last_row_id,
        version: body.versionNumber
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error creating legal document version:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create version' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
