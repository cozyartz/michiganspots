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
    const { confirmationId, action, paymentTransactionId, collectedBy, partialPayment } = await request.json();

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
    const STRIPE_SECRET_KEY = locals.runtime?.env?.STRIPE_SECRET_KEY;

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
      // Get the signup record
      const signup = await DB.prepare(`
        SELECT * FROM in_person_signups WHERE confirmation_id = ?
      `).bind(confirmationId).first();

      if (!signup) {
        return new Response(
          JSON.stringify({ error: 'Signup not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

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

      // Create partnership activation so partner can log in
      const startsAt = new Date();
      let endsAt: Date | null = null;
      const isPartialPayment = partialPayment === true;

      // Calculate end date based on duration and payment type
      if (signup.duration === 'yearly' && !isPartialPayment) {
        // Full year paid upfront
        endsAt = new Date(startsAt);
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      } else if (signup.duration === 'quarterly' && !isPartialPayment) {
        // Full quarter paid upfront
        endsAt = new Date(startsAt);
        endsAt.setMonth(endsAt.getMonth() + 3);
      } else if (signup.duration === 'monthly' || isPartialPayment) {
        // Monthly or partial payment - only covers this period
        endsAt = new Date(startsAt);
        endsAt.setMonth(endsAt.getMonth() + 1);
      }

      // Check if partnership activation already exists
      const existingActivation = await DB.prepare(`
        SELECT id FROM partnership_activations
        WHERE email = ? AND partnership_type = ?
      `).bind(signup.email, signup.partnership_type || 'business').first();

      if (!existingActivation) {
        // Create new partnership activation
        await DB.prepare(`
          INSERT INTO partnership_activations (
            email,
            organization_name,
            partnership_type,
            partnership_tier,
            starts_at,
            ends_at,
            is_active,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        `).bind(
          signup.email,
          signup.organization_name,
          signup.partnership_type || 'business',
          signup.tier,
          startsAt.toISOString(),
          endsAt ? endsAt.toISOString() : null,
          new Date().toISOString()
        ).run();
      } else {
        // Update existing activation
        await DB.prepare(`
          UPDATE partnership_activations
          SET
            organization_name = ?,
            partnership_tier = ?,
            starts_at = ?,
            ends_at = ?,
            is_active = 1,
            updated_at = ?
          WHERE id = ?
        `).bind(
          signup.organization_name,
          signup.tier,
          startsAt.toISOString(),
          endsAt ? endsAt.toISOString() : null,
          new Date().toISOString(),
          existingActivation.id
        ).run();
      }

      // If monthly or partial payment, create Stripe customer and send payment link
      if ((signup.duration === 'monthly' || isPartialPayment) && STRIPE_SECRET_KEY) {
        try {
          // Create or get Stripe customer
          const stripeCustomerResponse = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              email: signup.email as string,
              name: signup.organization_name as string,
              metadata: JSON.stringify({
                partnership_id: existingActivation?.id || 'new',
                tier: signup.tier,
                confirmation_id: confirmationId
              })
            })
          });

          if (stripeCustomerResponse.ok) {
            const stripeCustomer = await stripeCustomerResponse.json();

            // Get the correct Stripe price ID based on tier
            const priceIdMap: Record<string, string> = {
              'spot_partner': locals.runtime?.env?.STRIPE_PRICE_SPOT_MONTHLY || '',
              'featured_partner': locals.runtime?.env?.STRIPE_PRICE_FEATURED_QUARTERLY || '',
              'premium_sponsor': locals.runtime?.env?.STRIPE_PRICE_PREMIUM_QUARTERLY || '',
              'title_sponsor': locals.runtime?.env?.STRIPE_PRICE_TITLE_QUARTERLY || '',
              'chamber_partner': locals.runtime?.env?.STRIPE_PRICE_CHAMBER_QUARTERLY || '',
            };

            const priceId = priceIdMap[signup.tier as string];

            if (priceId) {
              // Create Stripe subscription (will send invoice to customer email)
              const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                  customer: stripeCustomer.id,
                  items: JSON.stringify([{ price: priceId }]),
                  collection_method: 'send_invoice',
                  days_until_due: '10',
                  metadata: JSON.stringify({
                    partnership_id: existingActivation?.id || 'new',
                    confirmation_id: confirmationId,
                    source: 'in_person_signup'
                  })
                })
              });

              if (subscriptionResponse.ok) {
                const subscription = await subscriptionResponse.json();

                // Update partnership activation with Stripe info
                await DB.prepare(`
                  UPDATE partnership_activations
                  SET stripe_customer_id = ?,
                      stripe_subscription_id = ?,
                      updated_at = ?
                  WHERE id = ?
                `).bind(
                  stripeCustomer.id,
                  subscription.id,
                  new Date().toISOString(),
                  existingActivation?.id
                ).run();
              }
            }
          }
        } catch (stripeError) {
          console.error('Stripe subscription creation failed:', stripeError);
          // Don't fail the whole operation, just log the error
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment marked as collected and partnership activated',
          stripe_subscription_created: (signup.duration === 'monthly' || isPartialPayment)
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
