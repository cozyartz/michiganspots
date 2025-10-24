/**
 * Admin API: Verify PayPal Zettle Payment
 *
 * GET /api/admin/verify-payment?transactionId=XXX
 * Verifies a PayPal Zettle transaction and optionally links it to an in-person signup
 */

import type { APIRoute } from 'astro';
import { verifyZettleTransaction } from '../../../lib/paypal-zettle';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');
    const confirmationId = url.searchParams.get('confirmationId');

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'transactionId parameter required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get PayPal Zettle API key from environment
    const apiKey = locals.runtime?.env?.PAYPAL_ZETTLE_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'PayPal Zettle API not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify transaction with PayPal Zettle
    const transaction = await verifyZettleTransaction(apiKey, transactionId);

    if (!transaction) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: 'Transaction not found in PayPal Zettle'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If confirmationId provided, update the in_person_signup record
    if (confirmationId && locals.runtime?.env?.DB) {
      const DB = locals.runtime.env.DB;

      await DB.prepare(`
        UPDATE in_person_signups
        SET
          payment_status = 'completed',
          payment_collected_at = ?,
          payment_transaction_id = ?,
          status = 'active',
          updated_at = ?
        WHERE confirmation_id = ?
      `).bind(
        new Date().toISOString(),
        transactionId,
        new Date().toISOString(),
        confirmationId
      ).run();
    }

    return new Response(
      JSON.stringify({
        verified: true,
        transaction: {
          id: transaction.purchaseUUID,
          amount: transaction.amount / 100, // Convert cents to dollars
          timestamp: transaction.timestamp,
          seller: transaction.userDisplayName,
        },
        updated: !!confirmationId
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment verification error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Payment verification failed'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
