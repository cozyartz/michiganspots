// Generate and send magic link for passwordless login
import type { APIRoute } from 'astro';
import { createEmailTransporter, sendMagicLinkEmail, generateMagicLinkToken } from '../../../../lib/email';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get environment variables
    const runtime = locals.runtime as any;
    const env = runtime?.env || import.meta.env;

    const smtpUser = env.SMTP_USER;
    const smtpPassword = env.SMTP_PASSWORD;
    const siteUrl = env.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

    if (!smtpUser || !smtpPassword) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Access database
    const db = env.DB || runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user exists with this email
    const user = await db
      .prepare('SELECT id, name, email, role FROM users WHERE email = ?')
      .bind(email.toLowerCase().trim())
      .first();

    if (!user) {
      // For security, don't reveal if email exists or not
      // Always return success to prevent email enumeration
      return new Response(JSON.stringify({
        success: true,
        message: 'If an account exists with this email, you will receive a login link shortly.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate magic link token
    const token = generateMagicLinkToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // For partner magic links, check if user is a partner
    if (user.role === 'partner' || user.role === 'super_admin') {
      // Check if user has an associated partnership
      const partnership = await db
        .prepare('SELECT id FROM partnership_activations WHERE email = ? LIMIT 1')
        .bind(email.toLowerCase().trim())
        .first();

      const partnerId = partnership?.id || null;

      // Store magic link in database
      await db
        .prepare(`
          INSERT INTO partner_magic_links (partner_id, token, expires_at, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `)
        .bind(partnerId, token, expiresAt.toISOString())
        .run();
    }

    // Also store in a general magic_links table for all users
    await db
      .prepare(`
        CREATE TABLE IF NOT EXISTS magic_links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at TEXT NOT NULL,
          used INTEGER DEFAULT 0,
          used_at TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `)
      .run();

    await db
      .prepare(`
        INSERT INTO magic_links (user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `)
      .bind(user.id, token, expiresAt.toISOString())
      .run();

    // Create magic link URL
    const magicLink = `${siteUrl}/api/auth/magic-link/verify?token=${token}`;

    // Send email
    const transporter = createEmailTransporter(smtpUser, smtpPassword);
    const emailSent = await sendMagicLinkEmail(transporter, {
      to: email,
      name: user.name || 'there',
      magicLink,
    });

    if (!emailSent) {
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Login link sent! Check your email.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Magic link generation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
