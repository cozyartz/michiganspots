/**
 * Directory Advertising Checkout
 * Creates Stripe Checkout sessions for business directory subscriptions
 * Separate from Spots game partnerships
 */

interface DirectoryCheckoutRequest {
  email: string;
  businessName: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  website?: string;
  description: string;
  tier: 'starter' | 'growth' | 'pro'; // Free tier doesn't need checkout
}

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;
  SITE_URL: string;
  // Directory price IDs
  STRIPE_PRICE_DIRECTORY_STARTER_MONTHLY: string;
  STRIPE_PRICE_DIRECTORY_GROWTH_MONTHLY: string;
  STRIPE_PRICE_DIRECTORY_PRO_MONTHLY: string;
}

// Price ID mapping for directory tiers
function getDirectoryPriceId(env: Env, tier: string): string | null {
  const priceMap: Record<string, string> = {
    starter: env.STRIPE_PRICE_DIRECTORY_STARTER_MONTHLY,
    growth: env.STRIPE_PRICE_DIRECTORY_GROWTH_MONTHLY,
    pro: env.STRIPE_PRICE_DIRECTORY_PRO_MONTHLY,
  };

  return priceMap[tier] || null;
}

// Get price amount for database storage
function getTierAmount(tier: string): number {
  const amounts: Record<string, number> = {
    starter: 4900, // $49.00 in cents
    growth: 9900,  // $99.00 in cents
    pro: 19900,    // $199.00 in cents
  };
  return amounts[tier] || 0;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as DirectoryCheckoutRequest;
    const {
      email,
      businessName,
      category,
      city,
      address,
      phone,
      website,
      description,
      tier
    } = body;

    // Validation
    if (!email || !businessName || !category || !city || !address || !phone || !description || !tier) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Free tier doesn't need Stripe checkout
    if (tier === 'free') {
      return new Response(
        JSON.stringify({ error: 'Free tier does not require checkout' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get price ID from environment variables
    const priceId = getDirectoryPriceId(context.env, tier);

    if (!priceId || priceId.includes('placeholder')) {
      return new Response(
        JSON.stringify({
          error: 'Directory pricing not yet configured in Stripe. Please use the free tier or contact support.',
          needsSetup: true
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stripeKey = context.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('Stripe API key not configured');
    }

    const siteUrl = context.env.SITE_URL || 'https://michiganspots.com';
    const db = context.env.DB;

    // First, save the business claim to database
    const businessClaimResult = await db
      .prepare(
        `INSERT INTO business_directory (
          business_name,
          business_category,
          city,
          address,
          phone,
          email,
          website,
          short_description,
          directory_tier,
          ai_processing_status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        businessName,
        category,
        city,
        address,
        phone,
        email,
        website || null,
        description,
        tier,
        'pending',
        new Date().toISOString()
      )
      .run();

    const businessId = businessClaimResult.meta.last_row_id;

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
          name: businessName,
          'metadata[business_name]': businessName,
          'metadata[directory_tier]': tier,
          'metadata[business_id]': businessId.toString(),
          'metadata[product_type]': 'directory_advertising',
          phone: phone,
          'metadata[city]': city
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
          businessName,
          businessName,
          customerId,
          phone,
          city,
          JSON.stringify({ tier, business_id: businessId, type: 'directory' }),
          new Date().toISOString()
        )
        .run();
    }

    // Create Stripe Checkout Session for subscription
    const sessionParams = new URLSearchParams({
      'customer': customerId,
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${siteUrl}/directory/claim-success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${siteUrl}/directory/claim?tier=${tier}`,
      'client_reference_id': `directory_${tier}_${businessId}_${Date.now()}`,
      'metadata[email]': email,
      'metadata[business_name]': businessName,
      'metadata[business_id]': businessId.toString(),
      'metadata[directory_tier]': tier,
      'metadata[product_type]': 'directory_advertising',
      'metadata[category]': category,
      'metadata[city]': city,
      'subscription_data[metadata][business_id]': businessId.toString(),
      'subscription_data[metadata][product_type]': 'directory_advertising'
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

    // Update business record with Stripe session info
    await db
      .prepare(
        'UPDATE business_directory SET stripe_subscription_id = ? WHERE id = ?'
      )
      .bind(session.id, businessId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url,
        businessId: businessId
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Directory checkout creation error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: 'Failed to create directory subscription checkout'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
