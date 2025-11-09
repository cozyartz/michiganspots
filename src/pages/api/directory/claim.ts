import type { APIRoute } from 'astro';

/**
 * FREE Directory Listing Claim API
 * Handles FREE tier business claims (no Stripe needed)
 */

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();
    const {
      businessName,
      category,
      city,
      address,
      phone,
      email,
      website,
      description,
      tier
    } = data;

    // Validation
    if (!businessName || !category || !city || !address || !phone || !email || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Only handle FREE tier here (paid tiers go through directory-checkout)
    if (tier !== 'free') {
      return new Response(
        JSON.stringify({ error: 'This endpoint only handles FREE tier claims' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const runtime = locals.runtime;
    const db = runtime.env.DB;

    // Check for duplicate email
    const existing = await db
      .prepare('SELECT id FROM business_directory WHERE email = ?')
      .bind(email)
      .first();

    if (existing) {
      return new Response(
        JSON.stringify({
          error: 'A business with this email already exists. Please contact support to claim your listing.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert FREE tier business claim
    const result = await db
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
          is_claimed,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
        'free',
        'pending', // Will be processed by AI enrichment job
        1, // Claimed by owner
        new Date().toISOString()
      )
      .run();

    const businessId = result.meta.last_row_id;

    // Send confirmation email (optional - implement later)
    // await sendBusinessClaimConfirmation(email, businessName);

    return new Response(
      JSON.stringify({
        success: true,
        businessId,
        message: 'Your FREE listing has been submitted! We\'ll verify and activate it within 24 hours.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('FREE claim submission error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to submit your claim. Please try again or contact support.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
