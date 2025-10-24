/**
 * In-Person Signups Admin API
 * GET /api/admin/in-person-signups
 * Lists all in-person signups with status filtering
 */

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const DB = locals.runtime?.env?.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build query based on status filter
    let query = `
      SELECT
        id,
        confirmation_id,
        email,
        name,
        title,
        organization_name,
        phone,
        city,
        tier,
        duration,
        tier_amount,
        total_paid,
        payment_status,
        payment_method,
        payment_transaction_id,
        status,
        created_at,
        payment_collected_at,
        payment_collected_by
      FROM in_person_signups
    `;

    if (status !== 'all') {
      query += ` WHERE payment_status = ?`;
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;

    const stmt = status !== 'all'
      ? DB.prepare(query).bind(status, limit)
      : DB.prepare(query).bind(limit);

    const result = await stmt.all();

    // Calculate totals
    const totals = {
      pending: 0,
      completed: 0,
      pendingAmount: 0,
      completedAmount: 0,
      totalSignups: result.results?.length || 0
    };

    if (result.results) {
      for (const signup of result.results as any[]) {
        if (signup.payment_status === 'pending') {
          totals.pending++;
          totals.pendingAmount += signup.total_paid || 0;
        } else if (signup.payment_status === 'completed') {
          totals.completed++;
          totals.completedAmount += signup.total_paid || 0;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        signups: result.results || [],
        totals,
        filter: status
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching in-person signups:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { confirmationId, action, paymentTransactionId, collectedBy } = await request.json();

    if (!confirmationId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing confirmation ID or action' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const DB = locals.runtime?.env?.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'mark_paid') {
      // Mark payment as collected
      await DB.prepare(`
        UPDATE in_person_signups
        SET
          payment_status = 'completed',
          payment_collected_at = ?,
          payment_collected_by = ?,
          payment_transaction_id = ?,
          status = 'active',
          updated_at = ?
        WHERE confirmation_id = ?
      `).bind(
        new Date().toISOString(),
        collectedBy || 'admin',
        paymentTransactionId || '',
        new Date().toISOString(),
        confirmationId
      ).run();

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment marked as collected'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error updating signup:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
