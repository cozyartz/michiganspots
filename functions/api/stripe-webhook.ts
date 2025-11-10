/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payment confirmations
 */

import { sendPartnershipConfirmationEmail } from '../utils/partnershipEmail';
import { onboardPartnerToWorker, formatPartnerDataForWorker } from '../utils/partnerWorker';

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SMTP_PASSWORD: string;
  SITE_URL: string;
}

// Helper function to verify Stripe webhook signature
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureParts = signature.split(',');
    const timestamp = signatureParts.find(p => p.startsWith('t='))?.slice(2);
    const signatureHash = signatureParts.find(p => p.startsWith('v1='))?.slice(3);

    if (!timestamp || !signatureHash) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      hexToBytes(signatureHash),
      encoder.encode(signedPayload)
    );

    return expectedSignature;
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const signature = context.request.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Missing signature', { status: 400 });
    }

    const payload = await context.request.text();
    const webhookSecret = context.env.STRIPE_WEBHOOK_SECRET;

    // Verify webhook signature
    const isValid = await verifyStripeSignature(payload, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(payload);
    const db = context.env.DB;

    // Log the webhook event
    await db
      .prepare(
        'INSERT INTO stripe_webhook_events (stripe_event_id, event_type, event_data, created_at) VALUES (?, ?, ?, ?)'
      )
      .bind(
        event.id,
        event.type,
        payload,
        new Date().toISOString()
      )
      .run();

    // Process the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, db, context.env);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object, db);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, db);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, db);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, db);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, db);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await db
      .prepare('UPDATE stripe_webhook_events SET processed = 1 WHERE stripe_event_id = ?')
      .bind(event.id)
      .run();

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);

    // Log processing error
    try {
      const event = JSON.parse(await context.request.text());
      await context.env.DB
        .prepare('UPDATE stripe_webhook_events SET processing_error = ? WHERE stripe_event_id = ?')
        .bind(error.message, event.id)
        .run();
    } catch {}

    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function handleCheckoutCompleted(session: any, db: D1Database, env?: Env) {
  const email = session.customer_details?.email || session.metadata?.email;
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const paymentIntentId = session.payment_intent;
  const productType = session.metadata?.product_type;

  // Handle directory advertising subscriptions separately
  if (productType === 'directory_advertising') {
    await handleDirectorySubscription(session, db, env);
    return;
  }

  // Update payment record
  await db
    .prepare(
      `UPDATE partner_payments
       SET stripe_payment_intent_id = ?,
           stripe_subscription_id = ?,
           payment_status = 'succeeded',
           amount = ?,
           updated_at = ?
       WHERE stripe_customer_id = ?
       AND payment_status = 'pending'`
    )
    .bind(
      paymentIntentId || null,
      subscriptionId || null,
      session.amount_total,
      new Date().toISOString(),
      customerId
    )
    .run();

  // Create partnership activation
  const tier = session.metadata?.tier;
  const duration = session.metadata?.duration;
  const organizationName = session.metadata?.organization_name;

  if (tier && duration) {
    const payment = await db
      .prepare('SELECT id, is_recurring FROM partner_payments WHERE stripe_customer_id = ? ORDER BY id DESC LIMIT 1')
      .bind(customerId)
      .first();

    if (payment) {
      const startsAt = new Date();
      let endsAt = null;

      // Calculate end date for subscriptions
      if (payment.is_recurring === 1) {
        endsAt = new Date(startsAt);
        endsAt.setMonth(endsAt.getMonth() + 3); // Quarterly subscriptions
      }

      await db
        .prepare(
          'INSERT INTO partnership_activations (email, organization_name, partnership_type, partnership_tier, partner_payment_id, stripe_customer_id, starts_at, ends_at, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          email,
          organizationName,
          tier,
          duration,
          payment.id,
          customerId,
          startsAt.toISOString(),
          endsAt ? endsAt.toISOString() : null,
          1,
          new Date().toISOString()
        )
        .run();

      // Update customer subscription status
      if (subscriptionId) {
        await db
          .prepare('UPDATE stripe_customers SET has_active_subscription = 1, subscription_ends_at = ?, updated_at = ? WHERE stripe_customer_id = ?')
          .bind(endsAt ? endsAt.toISOString() : null, new Date().toISOString(), customerId)
          .run();
      }

      // Onboard partner to Cloudflare Worker system
      try {
        console.log('🚀 Onboarding partner to worker system:', email);

        // Get full partner signup data
        const signupData = await db
          .prepare('SELECT * FROM partner_signups WHERE email = ?')
          .bind(email)
          .first();

        if (signupData) {
          // Format data for worker API
          const workerData = formatPartnerDataForWorker({
            ...signupData,
            tier: tier,
            duration: duration,
            organization_name: organizationName
          });

          // Call worker to generate AI page, QR code, and setup
          const workerResult = await onboardPartnerToWorker(workerData);

          if (workerResult.success) {
            // Update database with worker response
            await db
              .prepare(`
                UPDATE partner_signups
                SET worker_partner_id = ?,
                    worker_page_url = ?,
                    worker_qr_code_url = ?,
                    worker_qr_download_url = ?,
                    worker_analytics_url = ?,
                    worker_onboarded_at = ?,
                    worker_status = 'active'
                WHERE email = ?
              `)
              .bind(
                workerResult.partnerId,
                workerResult.urls.partnerPage,
                workerResult.urls.qrCode,
                workerResult.qrCode.downloadUrl,
                workerResult.urls.analytics,
                new Date().toISOString(),
                email
              )
              .run();

            console.log('✅ Partner successfully onboarded to worker:', workerResult.partnerId);
          }
        } else {
          console.warn('⚠️ No signup data found for email:', email);
        }
      } catch (workerError) {
        console.error('❌ Worker onboarding failed (non-fatal):', workerError);
        // Don't fail the webhook - partner is still activated, just log the error
        await db
          .prepare('UPDATE partner_signups SET worker_status = ?, updated_at = ? WHERE email = ?')
          .bind('failed', new Date().toISOString(), email)
          .run()
          .catch(() => {}); // Silent fail if column doesn't exist yet
      }

      // Send partnership confirmation email
      if (env && payment) {
        const customer = await db
          .prepare('SELECT * FROM stripe_customers WHERE stripe_customer_id = ?')
          .bind(customerId)
          .first();

        if (customer) {
          const siteUrl = env.SITE_URL || 'https://michiganspots.com';
          const acceptanceUrl = `${siteUrl}/partnership-acceptance?session_id=${session.id}`;

          sendPartnershipConfirmationEmail({
            email: customer.email as string,
            organizationName: customer.organization_name as string,
            contactName: customer.name as string,
            partnershipType: tier,
            partnershipTier: duration,
            amount: session.amount_total,
            transactionId: paymentIntentId || session.id,
            sessionId: session.id,
            acceptanceUrl
          }, env).catch(error => {
            console.error('Failed to send partnership confirmation email:', error);
          });
        }
      }
    }
  }
}

async function handlePaymentSucceeded(paymentIntent: any, db: D1Database) {
  await db
    .prepare('UPDATE partner_payments SET payment_status = ?, updated_at = ? WHERE stripe_payment_intent_id = ?')
    .bind('succeeded', new Date().toISOString(), paymentIntent.id)
    .run();
}

async function handlePaymentFailed(paymentIntent: any, db: D1Database) {
  await db
    .prepare('UPDATE partner_payments SET payment_status = ?, updated_at = ? WHERE stripe_payment_intent_id = ?')
    .bind('failed', new Date().toISOString(), paymentIntent.id)
    .run();
}

async function handleSubscriptionUpdated(subscription: any, db: D1Database) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const endsAt = new Date(subscription.current_period_end * 1000);
  const status = subscription.status; // active, past_due, canceled, etc.

  // Check if this is a directory subscription
  const business = await db
    .prepare('SELECT id FROM business_directory WHERE stripe_subscription_id = ?')
    .bind(subscriptionId)
    .first();

  if (business) {
    // Handle directory subscription update
    const paymentStatus = status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : 'inactive';

    await db
      .prepare(
        `UPDATE business_directory
         SET payment_status = ?,
             subscription_end_date = ?,
             next_billing_date = ?,
             tier_end_date = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .bind(
        paymentStatus,
        endsAt.toISOString(),
        endsAt.toISOString(),
        endsAt.toISOString(),
        new Date().toISOString(),
        business.id
      )
      .run();

    console.log(`✅ Directory subscription updated: Business #${business.id}, Status: ${paymentStatus}`);
    return;
  }

  // Handle partnership subscriptions
  await db
    .prepare('UPDATE stripe_customers SET has_active_subscription = 1, subscription_ends_at = ?, updated_at = ? WHERE stripe_customer_id = ?')
    .bind(endsAt.toISOString(), new Date().toISOString(), customerId)
    .run();

  // Update partnership activation end date
  await db
    .prepare('UPDATE partnership_activations SET ends_at = ?, updated_at = ? WHERE stripe_customer_id = ? AND is_active = 1')
    .bind(endsAt.toISOString(), new Date().toISOString(), customerId)
    .run();
}

async function handleSubscriptionDeleted(subscription: any, db: D1Database) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  // Check if this is a directory subscription
  const business = await db
    .prepare('SELECT id, directory_tier FROM business_directory WHERE stripe_subscription_id = ?')
    .bind(subscriptionId)
    .first();

  if (business) {
    // Downgrade directory business to FREE tier
    await db
      .prepare(
        `UPDATE business_directory
         SET payment_status = 'canceled',
             directory_tier = 'free',
             stripe_subscription_id = NULL,
             tier_end_date = ?,
             subscription_end_date = ?,
             updated_at = ?
         WHERE id = ?`
      )
      .bind(
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        business.id
      )
      .run();

    console.log(`⚠️ Directory subscription canceled: Business #${business.id} downgraded to FREE tier`);
    return;
  }

  // Handle partnership cancellation
  await db
    .prepare('UPDATE stripe_customers SET has_active_subscription = 0, updated_at = ? WHERE stripe_customer_id = ?')
    .bind(new Date().toISOString(), customerId)
    .run();

  // Deactivate partnership
  await db
    .prepare('UPDATE partnership_activations SET is_active = 0, updated_at = ? WHERE stripe_customer_id = ? AND is_active = 1')
    .bind(new Date().toISOString(), customerId)
    .run();
}

async function handleInvoicePaymentSucceeded(invoice: any, db: D1Database) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  // Check if this is a directory subscription renewal
  const subscription = await getStripeSubscription(subscriptionId, db);
  if (subscription?.metadata?.product_type === 'directory_advertising') {
    await handleDirectorySubscriptionRenewal(invoice, db);
    return;
  }

  // Log recurring payment for partnerships
  if (subscriptionId) {
    const customer = await db
      .prepare('SELECT * FROM stripe_customers WHERE stripe_customer_id = ?')
      .bind(customerId)
      .first();

    if (customer) {
      await db
        .prepare(
          'INSERT INTO partner_payments (email, name, organization_name, partnership_type, partnership_tier, stripe_customer_id, stripe_subscription_id, stripe_price_id, amount, payment_status, is_recurring, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          customer.email,
          customer.name,
          customer.organization_name,
          'subscription_renewal',
          'recurring',
          customerId,
          subscriptionId,
          invoice.lines.data[0]?.price?.id || '',
          invoice.amount_paid,
          'succeeded',
          1,
          new Date().toISOString()
        )
        .run();
    }
  }
}

/**
 * Handle directory advertising subscription checkout
 */
async function handleDirectorySubscription(session: any, db: D1Database, env?: Env) {
  const businessId = session.metadata?.business_id;
  const directoryTier = session.metadata?.directory_tier;
  const subscriptionId = session.subscription;
  const email = session.customer_details?.email || session.metadata?.email;

  if (!businessId || !directoryTier) {
    console.error('Missing business_id or directory_tier in session metadata');
    return;
  }

  // Calculate subscription dates (monthly recurring)
  const now = new Date();
  const tierStartDate = now.toISOString();
  const subscriptionEndDate = new Date(now);
  subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // Monthly subscription
  const nextBillingDate = subscriptionEndDate.toISOString();

  // Update business_directory with subscription details
  await db
    .prepare(
      `UPDATE business_directory
       SET stripe_subscription_id = ?,
           payment_status = 'active',
           directory_tier = ?,
           tier_start_date = ?,
           tier_end_date = ?,
           subscription_start_date = ?,
           subscription_end_date = ?,
           next_billing_date = ?,
           last_payment_date = ?,
           owner_email = ?,
           is_claimed = 1,
           ai_processing_status = 'pending',
           updated_at = ?
       WHERE id = ?`
    )
    .bind(
      subscriptionId,
      directoryTier,
      tierStartDate,
      nextBillingDate, // tier_end_date matches next billing
      tierStartDate,
      nextBillingDate,
      nextBillingDate,
      now.toISOString(),
      email,
      now.toISOString(),
      businessId
    )
    .run();

  console.log(`✅ Directory subscription activated: Business #${businessId}, Tier: ${directoryTier}, Subscription: ${subscriptionId}`);

  // TODO: Trigger AI processing for the business
  // TODO: Send confirmation email to business owner
}

/**
 * Handle directory subscription renewal payments
 */
async function handleDirectorySubscriptionRenewal(invoice: any, db: D1Database) {
  const subscriptionId = invoice.subscription;

  // Find the business associated with this subscription
  const business = await db
    .prepare('SELECT id, directory_tier FROM business_directory WHERE stripe_subscription_id = ?')
    .bind(subscriptionId)
    .first();

  if (!business) {
    console.error(`No business found for subscription: ${subscriptionId}`);
    return;
  }

  // Update billing dates for next month
  const now = new Date();
  const nextBillingDate = new Date(now);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  await db
    .prepare(
      `UPDATE business_directory
       SET payment_status = 'active',
           last_payment_date = ?,
           next_billing_date = ?,
           tier_end_date = ?,
           subscription_end_date = ?,
           updated_at = ?
       WHERE id = ?`
    )
    .bind(
      now.toISOString(),
      nextBillingDate.toISOString(),
      nextBillingDate.toISOString(),
      nextBillingDate.toISOString(),
      now.toISOString(),
      business.id
    )
    .run();

  console.log(`✅ Directory subscription renewed: Business #${business.id}, Amount: $${invoice.amount_paid / 100}`);
}

/**
 * Helper to get Stripe subscription details (stub for now)
 */
async function getStripeSubscription(subscriptionId: string, db: D1Database) {
  // In a real implementation, we'd fetch from Stripe API or cache in DB
  // For now, check business_directory table
  const business = await db
    .prepare('SELECT id FROM business_directory WHERE stripe_subscription_id = ?')
    .bind(subscriptionId)
    .first();

  if (business) {
    return { metadata: { product_type: 'directory_advertising' } };
  }

  return null;
}
