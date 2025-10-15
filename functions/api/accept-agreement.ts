interface AcceptanceRequest {
  sessionId: string;
  fullName: string;
  title: string;
  ipAddress: string;
  acceptedDate: string;
  checkboxes: Record<string, boolean>;
}

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as AcceptanceRequest;
    const { sessionId, fullName, title, ipAddress, acceptedDate, checkboxes } = body;

    if (!sessionId || !fullName || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = context.env.DB;

    // Find the partnership activation for this session
    const activation = await db
      .prepare(`
        SELECT pa.*, pp.stripe_customer_id, pp.partnership_type, pp.partnership_tier
        FROM partnership_activations pa
        JOIN partner_payments pp ON pa.partner_payment_id = pp.id
        WHERE pp.payment_metadata LIKE ?
        LIMIT 1
      `)
      .bind(`%${sessionId}%`)
      .first();

    if (!activation) {
      return new Response(
        JSON.stringify({ error: 'Partnership not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Record the agreement acceptance
    await db
      .prepare(`
        INSERT INTO partnership_agreements
        (partnership_activation_id, full_name, title, ip_address, accepted_date, checkboxes_accepted, agreement_version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        activation.id,
        fullName,
        title,
        ipAddress,
        acceptedDate,
        JSON.stringify(checkboxes),
        '1.0',
        new Date().toISOString()
      )
      .run();

    // Update partnership activation status
    await db
      .prepare('UPDATE partnership_activations SET agreement_accepted = 1, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), activation.id)
      .run();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Agreement acceptance error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
