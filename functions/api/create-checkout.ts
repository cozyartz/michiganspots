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
  city?: string;
  phone?: string;
  intakeFormId?: string; // If coming from intake form
}

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SITE_URL: string;
}

// Helper function to fetch price ID from Stripe based on partnership type and tier
async function getPriceIdFromStripe(
  stripeKey: string,
  partnershipType: string,
  partnershipTier: string
): Promise<string | null> {
  try {
    // Fetch all products from Stripe
    const productsResponse = await fetch('https://api.stripe.com/v1/products?active=true&limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    if (!productsResponse.ok) {
      console.error('Failed to fetch products from Stripe');
      return null;
    }

    const productsData = await productsResponse.json();

    // Find the product matching our partnership type and tier
    const matchingProduct = productsData.data.find((product: any) => {
      return product.metadata?.partnership_type === partnershipType &&
             product.metadata?.tier === partnershipTier;
    });

    if (!matchingProduct) {
      console.error(`No product found for ${partnershipType} - ${partnershipTier}`);
      return null;
    }

    // Fetch prices for this product
    const pricesResponse = await fetch(
      `https://api.stripe.com/v1/prices?product=${matchingProduct.id}&active=true`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }
    );

    if (!pricesResponse.ok) {
      console.error('Failed to fetch prices from Stripe');
      return null;
    }

    const pricesData = await pricesResponse.json();

    // Return the first active price for this product
    if (pricesData.data && pricesData.data.length > 0) {
      return pricesData.data[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error fetching price from Stripe:', error);
    return null;
  }
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

    // Initialize Stripe API key
    const stripeKey = context.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('Stripe API key not configured');
    }

    // Fetch price ID dynamically from Stripe API based on partnership type and tier
    const priceId = await getPriceIdFromStripe(stripeKey, partnershipType, partnershipTier);

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Unable to find pricing for the selected partnership tier. Please contact support.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
      'line_items[0][price]': priceId,
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
        priceId,
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
