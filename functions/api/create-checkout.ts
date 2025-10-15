/**
 * Stripe Checkout Session Creation
 * Creates a Stripe Checkout session for partnership payments
 */

interface CheckoutRequest {
  email: string;
  name: string;
  organizationName: string;
  partnershipType: 'chamber' | 'business' | 'community';
  partnershipTier: string;
  priceId?: string;
  city?: string;
  phone?: string;
  intakeFormId?: string; // If coming from intake form
}

// Price ID mapping
const PRICE_MAP = {
  chamber: {
    launch: process.env.STRIPE_PRICE_CHAMBER_LAUNCH,
    city: process.env.STRIPE_PRICE_CHAMBER_CITY,
    regional: process.env.STRIPE_PRICE_CHAMBER_REGIONAL
  },
  business: {
    single: process.env.STRIPE_PRICE_BUSINESS_SINGLE,
    seasonal: process.env.STRIPE_PRICE_BUSINESS_SEASONAL,
    multi_location: process.env.STRIPE_PRICE_BUSINESS_MULTI_LOCATION,
    event: process.env.STRIPE_PRICE_BUSINESS_EVENT
  },
  community: {
    minimal: process.env.STRIPE_PRICE_COMMUNITY_MINIMAL,
    modest: process.env.STRIPE_PRICE_COMMUNITY_MODEST
  }
};

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SITE_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as CheckoutRequest;
    const {
      email,
      name,
      organizationName,
      partnershipType,
      partnershipTier,
      priceId,
      city,
      phone,
      intakeFormId
    } = body;

    // Validation
    if (!email || !name || !organizationName || !partnershipType || !partnershipTier) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get price ID from mapping
    let finalPriceId = priceId;
    if (!finalPriceId) {
      finalPriceId = PRICE_MAP[partnershipType]?.[partnershipTier];
      if (!finalPriceId) {
        return new Response(
          JSON.stringify({ error: 'Invalid partnership type or tier' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Initialize Stripe (using fetch API for Cloudflare Workers compatibility)
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
          'metadata[partnership_type]': partnershipType,
          'metadata[partnership_tier]': partnershipTier,
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
          JSON.stringify({ partnership_type: partnershipType, partnership_tier: partnershipTier }),
          new Date().toISOString()
        )
        .run();
    }

    // Create Checkout Session
    const sessionParams = new URLSearchParams({
      'customer': customerId,
      'mode': partnershipType === 'chamber' ? 'subscription' : 'payment',
      'line_items[0][price]': finalPriceId,
      'line_items[0][quantity]': '1',
      'success_url': `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${siteUrl}/partnerships`,
      'client_reference_id': `${partnershipType}_${partnershipTier}_${Date.now()}`,
      'metadata[email]': email,
      'metadata[organization_name]': organizationName,
      'metadata[partnership_type]': partnershipType,
      'metadata[partnership_tier]': partnershipTier,
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
        partnershipType,
        partnershipTier,
        customerId,
        finalPriceId,
        0, // Will be updated by webhook
        'pending',
        partnershipType === 'chamber' ? 1 : 0,
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
