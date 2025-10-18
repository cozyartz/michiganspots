/**
 * Send magic link for passwordless authentication
 */
import { createEmailTransporter, sendMagicLinkEmail, generateMagicLinkToken } from '../../../utils/email-helpers';

interface Env {
  DB: D1Database;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  PUBLIC_SITE_URL?: string;
}

interface RequestBody {
  email: string;
  name?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as RequestBody;
    const { email, name } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email address'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if SMTP is configured
    if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
      console.error('SMTP not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Email service not configured. Please try another login method.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate magic link token
    const token = generateMagicLinkToken();
    const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes

    // Store token in database
    await env.DB.prepare(`
      INSERT INTO magic_link_tokens (email, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(normalizedEmail, token, expiresAt).run();

    // Create magic link URL
    const siteUrl = env.PUBLIC_SITE_URL || 'http://localhost:4321';
    const magicLink = `${siteUrl}/api/auth/magic-link/verify?token=${token}`;

    // Send email
    const transporter = createEmailTransporter(env.SMTP_USER, env.SMTP_PASSWORD);
    const emailSent = await sendMagicLinkEmail(transporter, {
      to: normalizedEmail,
      name: name || normalizedEmail.split('@')[0],
      magicLink,
    });

    if (!emailSent) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send email. Please try again later.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Success - don't reveal if email exists or not (security)
    return new Response(JSON.stringify({
      success: true,
      message: 'If an account exists with this email, a login link has been sent.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending magic link:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send magic link. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
