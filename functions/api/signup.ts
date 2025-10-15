interface SignupRequest {
  email: string;
  name: string;
  city: string;
  userType: string;
}

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as SignupRequest;
    const { email, name, city, userType } = body;

    // Validation
    if (!email || !name || !city || !userType) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
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

    // Store in D1 database
    const db = context.env.DB;

    // Check if email already exists
    const existing = await db
      .prepare('SELECT email FROM signups WHERE email = ?')
      .bind(email)
      .first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert new signup
    await db
      .prepare('INSERT INTO signups (email, name, city, user_type, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(email, name, city, userType, new Date().toISOString())
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully signed up!',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
