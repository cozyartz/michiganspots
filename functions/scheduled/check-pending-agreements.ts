/**
 * Auto-Refund Cron Job
 *
 * Runs daily to process partnerships that paid but never accepted agreement.
 * Issues refunds after 7-day grace period.
 *
 * Schedule in wrangler.toml:
 * [triggers]
 * crons = ["0 3 * * *"]  # Daily at 3 AM UTC
 */

import { logLegalEvent } from '../../src/lib/legalAuditLog';

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const now = new Date().toISOString();

    // Find partnerships eligible for refund:
    // - Payment succeeded
    // - Agreement NOT accepted
    // - More than 7 days since payment
    // - Not already refunded
    const eligiblePartnerships = await env.DB.prepare(
      `SELECT
        pa.id as activation_id,
        pa.email,
        pa.organization_name,
        pa.partnership_tier,
        pp.payment_intent_id,
        pp.amount,
        pp.created_at as payment_date
      FROM partnership_activations pa
      JOIN partner_payments pp ON pa.partner_payment_id = pp.id
      WHERE pa.agreement_accepted = 0
      AND pp.payment_status = 'succeeded'
      AND datetime(pp.created_at, '+7 days') <= datetime('now')
      AND pa.refund_initiated_at IS NULL
      LIMIT 100`
    ).all();

    const results = {
      processed: 0,
      refunded: 0,
      errors: 0,
      partnerships: [] as any[]
    };

    for (const partnership of eligiblePartnerships.results || []) {
      try {
        // Send warning email first (3 days before refund)
        const paymentDate = new Date(partnership.payment_date as string);
        const daysSincePayment = Math.floor(
          (Date.now() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSincePayment === 4) {
          // Send warning at day 4 (3 days before refund)
          await logLegalEvent(env.DB, {
            eventType: 'refund_warning_sent',
            partnershipActivationId: partnership.activation_id as number,
            metadata: {
              email: partnership.email,
              daysRemaining: 3
            }
          });

          // TODO: Send actual warning email here
          console.log(`Warning sent to ${partnership.email} - 3 days until auto-refund`);
        } else if (daysSincePayment >= 7) {
          // Process refund
          const refundResult = await processRefund(
            env,
            partnership.payment_intent_id as string,
            partnership.amount as number,
            partnership.activation_id as number
          );

          if (refundResult.success) {
            // Update partnership activation record
            await env.DB.prepare(
              `UPDATE partnership_activations
               SET refund_initiated_at = ?,
                   refund_reason = ?,
                   refund_amount = ?
               WHERE id = ?`
            )
              .bind(
                now,
                'Agreement not accepted within 7 days',
                partnership.amount,
                partnership.activation_id
              )
              .run();

            // Log refund to audit trail
            await logLegalEvent(env.DB, {
              eventType: 'refund_completed',
              partnershipActivationId: partnership.activation_id as number,
              metadata: {
                refundId: refundResult.refundId,
                amount: partnership.amount,
                reason: 'Agreement not accepted within 7 days'
              }
            });

            // TODO: Send refund confirmation email

            results.refunded++;
          } else {
            results.errors++;

            // Log failed refund
            await logLegalEvent(env.DB, {
              eventType: 'refund_failed',
              partnershipActivationId: partnership.activation_id as number,
              metadata: {
                error: refundResult.error,
                amount: partnership.amount
              }
            });
          }
        }

        results.processed++;
        results.partnerships.push({
          activationId: partnership.activation_id,
          email: partnership.email,
          tier: partnership.partnership_tier,
          daysSincePayment,
          action: daysSincePayment === 4 ? 'warning_sent' : daysSincePayment >= 7 ? 'refunded' : 'monitored'
        });
      } catch (error) {
        console.error(`Error processing partnership ${partnership.activation_id}:`, error);
        results.errors++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now,
        ...results
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Auto-refund cron job error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Process Stripe refund
 */
async function processRefund(
  env: Env,
  paymentIntentId: string,
  amount: number,
  activationId: number
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const refundResponse = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer', // Or 'duplicate', 'fraudulent'
        metadata: JSON.stringify({
          activation_id: activationId,
          reason: 'Agreement not accepted within 7 days'
        })
      })
    });

    if (!refundResponse.ok) {
      const errorData = await refundResponse.json();
      console.error('Stripe refund error:', errorData);
      return {
        success: false,
        error: errorData.error?.message || 'Stripe refund failed'
      };
    }

    const refundData = await refundResponse.json();

    return {
      success: true,
      refundId: refundData.id
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
