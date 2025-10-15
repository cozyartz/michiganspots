interface PartnerSignupRequest {
  email: string;
  name: string;
  organizationName: string;
  city: string;
  phone?: string;
  message?: string;
  partnershipType: 'chamber' | 'business' | 'community';
}

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as PartnerSignupRequest;
    const { email, name, organizationName, city, phone, message, partnershipType } = body;

    // Validation
    if (!email || !name || !organizationName || !city || !partnershipType) {
      return new Response(
        JSON.stringify({ error: 'Required fields: email, name, organization name, city, and partnership type' }),
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

    // Partnership type validation
    if (!['chamber', 'business', 'community'].includes(partnershipType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid partnership type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store in D1 database
    const db = context.env.DB;

    // Check if email already exists
    const existing = await db
      .prepare('SELECT email FROM partner_signups WHERE email = ?')
      .bind(email)
      .first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Email already registered for partnership interest' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert new partner signup
    await db
      .prepare(
        'INSERT INTO partner_signups (email, name, organization_name, partnership_type, city, phone, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        email,
        name,
        organizationName,
        partnershipType,
        city,
        phone || null,
        message || null,
        new Date().toISOString()
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully submitted partnership interest!',
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
