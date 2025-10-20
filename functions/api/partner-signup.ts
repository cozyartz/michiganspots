interface PartnerSignupRequest {
  // Basic info
  email: string;
  name: string;
  organizationName: string;
  city: string;
  phone: string;
  address: string;
  website?: string;
  partnershipType: 'chamber' | 'business' | 'community';

  // Tier selection
  tier: string;
  duration: string;
  tierAmount: number;

  // Prize package
  hasPrizePackage: boolean;
  prizeTypes: string[];
  prizeValue: number;
  prizeDescription: string;
  prizeAddonFee: number;

  // Web/dev services
  hasWebdevServices: boolean;
  webdevServices: string[];
  webdevTotalFee: number;
  webdevNotes?: string;

  // Total
  totalPaid: number;
}

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY: string;
  PUBLIC_SITE_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as PartnerSignupRequest;
    const {
      email, name, organizationName, city, phone, address, website, partnershipType,
      tier, duration, tierAmount,
      hasPrizePackage, prizeTypes, prizeValue, prizeDescription, prizeAddonFee,
      hasWebdevServices, webdevServices, webdevTotalFee, webdevNotes,
      totalPaid
    } = body;

    // Validation
    if (!email || !name || !organizationName || !city || !phone || !address || !tier || !duration) {
      return new Response(
        JSON.stringify({ error: 'Required fields missing' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Amount validation
    if (totalPaid < 99) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment amount' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = context.env.DB;

    // Check if email already exists with active partnership
    const existing = await db
      .prepare('SELECT email, tier FROM partner_signups WHERE email = ? AND status = ?')
      .bind(email, 'active')
      .first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Email already has an active partnership' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate billing dates
    const billingStart = new Date().toISOString();
    let billingEnd = new Date();

    switch (duration) {
      case 'monthly':
        billingEnd.setMonth(billingEnd.getMonth() + 1);
        break;
      case 'quarterly':
        billingEnd.setMonth(billingEnd.getMonth() + 3);
        break;
      case 'yearly':
        billingEnd.setFullYear(billingEnd.getFullYear() + 1);
        break;
    }

    // Insert new partner signup (pending until payment)
    const result = await db
      .prepare(`
        INSERT INTO partner_signups (
          email, name, organization_name, partnership_type, city, phone, address, website,
          tier, duration, tier_amount,
          has_prize_package, prize_package_fee, prize_value, prize_types, prize_description,
          has_webdev_services, webdev_services, webdev_total_fee,
          total_paid, billing_start_date, billing_end_date,
          auto_renew, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        email, name, organizationName, partnershipType, city, phone, address, website || null,
        tier, duration, tierAmount,
        hasPrizePackage ? 1 : 0, prizeAddonFee, prizeValue, JSON.stringify(prizeTypes), prizeDescription || null,
        hasWebdevServices ? 1 : 0, JSON.stringify(webdevServices), webdevTotalFee,
        totalPaid, billingStart, billingEnd.toISOString(),
        duration === 'monthly' ? 1 : 0,
        'pending',
        new Date().toISOString()
      )
      .run();

    const partnerSignupId = result.meta.last_row_id;

    // Store web/dev service requests if any
    if (hasWebdevServices && webdevServices.length > 0) {
      for (const serviceType of webdevServices) {
        const serviceAmount = getServiceAmount(serviceType);
        await db
          .prepare(`
            INSERT INTO partner_webdev_services (
              partner_signup_id, service_type, service_amount, status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `)
          .bind(
            partnerSignupId,
            serviceType,
            serviceAmount,
            'pending',
            webdevNotes || null,
            new Date().toISOString()
          )
          .run();
      }
    }

    // Create Stripe checkout session
    const stripe = await createStripeCheckout(
      context.env.STRIPE_SECRET_KEY,
      context.env.PUBLIC_SITE_URL || 'https://michiganspots.com',
      {
        partnerSignupId: partnerSignupId as number,
        email,
        organizationName,
        tier,
        duration,
        tierAmount,
        prizeAddonFee,
        webdevTotalFee,
        totalPaid
      }
    );

    if (!stripe.success) {
      return new Response(
        JSON.stringify({ error: 'Failed to create payment session. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: stripe.checkoutUrl,
        partnerSignupId
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Partner signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Helper function to get service pricing
function getServiceAmount(serviceType: string): number {
  const pricing = {
    landing_page: 499,
    ecommerce: 999,
    dashboard: 799,
    api_integration: 1299,
    full_website: 2999
  };
  return pricing[serviceType] || 0;
}

// Helper function to create Stripe checkout session
async function createStripeCheckout(
  stripeKey: string,
  siteUrl: string,
  data: {
    partnerSignupId: number;
    email: string;
    organizationName: string;
    tier: string;
    duration: string;
    tierAmount: number;
    prizeAddonFee: number;
    webdevTotalFee: number;
    totalPaid: number;
  }
): Promise<{ success: boolean; checkoutUrl?: string }> {
  try {
    // Create line items for Stripe
    const lineItems: any[] = [];

    // Main tier item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${getTierDisplayName(data.tier)} - ${data.duration}`,
          description: `Michigan Spots Partnership - ${data.organizationName}`,
        },
        unit_amount: data.tierAmount * 100, // Stripe uses cents
      },
      quantity: 1,
    });

    // Prize package addon if any
    if (data.prizeAddonFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Prize Package Add-On',
            description: 'Priority placement, prize management, and platform bonus matching',
          },
          unit_amount: data.prizeAddonFee * 100,
        },
        quantity: 1,
      });
    }

    // Web/dev services if any
    if (data.webdevTotalFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Web/Dev Services',
            description: 'Professional web development services',
          },
          unit_amount: data.webdevTotalFee * 100,
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const checkoutSession = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': `${siteUrl}/partner/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${siteUrl}/partnerships?canceled=true`,
        'customer_email': data.email,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': `${getTierDisplayName(data.tier)} - ${data.duration}`,
        'line_items[0][price_data][unit_amount]': (data.tierAmount * 100).toString(),
        'line_items[0][quantity]': '1',
        'metadata[partner_signup_id]': data.partnerSignupId.toString(),
        'metadata[tier]': data.tier,
        'metadata[duration]': data.duration,
      }).toString(),
    });

    if (!checkoutSession.ok) {
      console.error('Stripe error:', await checkoutSession.text());
      return { success: false };
    }

    const session = await checkoutSession.json();

    return {
      success: true,
      checkoutUrl: session.url
    };
  } catch (error) {
    console.error('Stripe checkout creation error:', error);
    return { success: false };
  }
}

// Helper to get display name for tier
function getTierDisplayName(tier: string): string {
  const names = {
    spot_partner: 'Spot Partner',
    featured_partner: 'Featured Partner',
    premium_sponsor: 'Premium Sponsor',
    title_sponsor: 'Title Sponsor',
    chamber_tourism: 'Chamber & Tourism Partnership'
  };
  return names[tier] || tier;
}
