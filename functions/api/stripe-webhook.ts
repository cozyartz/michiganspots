/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payment confirmations
 */

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
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
        await handleCheckoutCompleted(event.data.object, db);
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

async function handleCheckoutCompleted(session: any, db: D1Database) {
  const email = session.customer_details?.email || session.metadata?.email;
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const paymentIntentId = session.payment_intent;

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
  const partnershipType = session.metadata?.partnership_type;
  const partnershipTier = session.metadata?.partnership_tier;
  const organizationName = session.metadata?.organization_name;

  if (partnershipType && partnershipTier) {
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
          partnershipType,
          partnershipTier,
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
  const endsAt = new Date(subscription.current_period_end * 1000);

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

  // Log recurring payment
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
