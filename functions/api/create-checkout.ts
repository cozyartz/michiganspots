/**
 * Stripe Checkout Session Creation
 * Creates a Stripe Checkout session for partnership payments
 */

interface CheckoutRequest {
  email: string;
  name: string;
  organizationName: string;
  tier: 'spot_partner' | 'featured_partner' | 'premium_sponsor' | 'title_sponsor' | 'chamber_tourism';
  duration: 'monthly' | 'quarterly' | 'yearly';
  city?: string;
  phone?: string;
  intakeFormId?: string; // If coming from intake form
}

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;
  SITE_URL: string;
  // Spot Partner price IDs
  STRIPE_PRICE_SPOT_MONTHLY: string;
  STRIPE_PRICE_SPOT_QUARTERLY: string;
  STRIPE_PRICE_SPOT_YEARLY: string;
  // Featured Partner price IDs
  STRIPE_PRICE_FEATURED_QUARTERLY: string;
  STRIPE_PRICE_FEATURED_YEARLY: string;
  // Premium Sponsor price IDs
  STRIPE_PRICE_PREMIUM_QUARTERLY: string;
  STRIPE_PRICE_PREMIUM_YEARLY: string;
  // Title Sponsor price IDs
  STRIPE_PRICE_TITLE_QUARTERLY: string;
  STRIPE_PRICE_TITLE_YEARLY: string;
  // Chamber & Tourism price IDs
  STRIPE_PRICE_CHAMBER_QUARTERLY: string;
  STRIPE_PRICE_CHAMBER_YEARLY: string;
}

// Price ID mapping - reads from environment variables
function getPriceId(env: Env, tier: string, duration: string): string | null {
  const priceMap: Record<string, Record<string, string>> = {
    spot_partner: {
      monthly: env.STRIPE_PRICE_SPOT_MONTHLY,
      quarterly: env.STRIPE_PRICE_SPOT_QUARTERLY,
      yearly: env.STRIPE_PRICE_SPOT_YEARLY
    },
    featured_partner: {
      quarterly: env.STRIPE_PRICE_FEATURED_QUARTERLY,
      yearly: env.STRIPE_PRICE_FEATURED_YEARLY
    },
    premium_sponsor: {
      quarterly: env.STRIPE_PRICE_PREMIUM_QUARTERLY,
      yearly: env.STRIPE_PRICE_PREMIUM_YEARLY
    },
    title_sponsor: {
      quarterly: env.STRIPE_PRICE_TITLE_QUARTERLY,
      yearly: env.STRIPE_PRICE_TITLE_YEARLY
    },
    chamber_tourism: {
      quarterly: env.STRIPE_PRICE_CHAMBER_QUARTERLY,
      yearly: env.STRIPE_PRICE_CHAMBER_YEARLY
    }
  };

  return priceMap[tier]?.[duration] || null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as CheckoutRequest;
    const {
      email,
      name,
      organizationName,
      tier,
      duration,
      city,
      phone,
      intakeFormId
    } = body;

    // Validation
    if (!email || !name || !organizationName || !tier || !duration) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get price ID from environment variables
    const priceId = getPriceId(context.env, tier, duration);

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Invalid partnership tier or duration. Please contact support.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe API key
    const stripeKey = context.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('Stripe API key not configured');
    }

    const siteUrl = context.env.SITE_URL || 'https://michiganspots.com';
    const db = context.env.DB;

    // Create or retrieve Stripe customer
    let customerId: string;

    const existingCustomer = await db
      .prepare('SELECT stripe_customer_id FROM stripe_customers WHERE email = ?')
      .bind(email)
      .first();

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id as string;
    } else {
      // Create new Stripe customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: email,
          name: name,
          'metadata[organization_name]': organizationName,
          'metadata[tier]': tier,
          'metadata[duration]': duration,
          ...(phone && { phone: phone }),
          ...(city && { 'metadata[city]': city })
        })
      });

      if (!customerResponse.ok) {
        const error = await customerResponse.text();
        throw new Error(`Failed to create Stripe customer: ${error}`);
      }

      const customer = await customerResponse.json();
      customerId = customer.id;

      // Store customer in database
      await db
        .prepare(
          'INSERT INTO stripe_customers (email, name, organization_name, stripe_customer_id, phone, city, customer_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(
          email,
          name,
          organizationName,
          customerId,
          phone || null,
          city || null,
          JSON.stringify({ tier, duration }),
          new Date().toISOString()
        )
        .run();
    }

    // Create Checkout Session - all tiers now use subscription mode
    const sessionParams = new URLSearchParams({
      'customer': customerId,
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${siteUrl}/partnerships`,
      'client_reference_id': `${tier}_${duration}_${Date.now()}`,
      'metadata[email]': email,
      'metadata[organization_name]': organizationName,
      'metadata[tier]': tier,
      'metadata[duration]': duration,
      ...(intakeFormId && { 'metadata[intake_form_id]': intakeFormId })
    });

    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sessionParams
    });

    if (!sessionResponse.ok) {
      const error = await sessionResponse.text();
      throw new Error(`Failed to create checkout session: ${error}`);
    }

    const session = await sessionResponse.json();

    // Log the checkout creation
    await db
      .prepare(
        'INSERT INTO partner_payments (email, name, organization_name, partnership_type, partnership_tier, stripe_customer_id, stripe_price_id, amount, payment_status, is_recurring, payment_metadata, intake_form_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        email,
        name,
        organizationName,
        tier,
        duration,
        customerId,
        priceId,
        0, // Will be updated by webhook
        'pending',
        1, // All partnerships are now subscriptions
        JSON.stringify({ session_id: session.id }),
        intakeFormId || null,
        new Date().toISOString()
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Checkout creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
