/**
 * Partner Magic Link Authentication
 *
 * Sends a magic link to partner's email for dashboard access
 * Endpoint: POST /api/partner-auth/send-magic-link
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';
import { sendEmail } from '../../utils/email';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as { email: string };

    if (!body.email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find partner by email
    const partner = await db.prepare(`
      SELECT
        pa.id,
        pa.organization_name,
        pa.email,
        pa.is_active
      FROM partnership_activations pa
      WHERE pa.email = ?
      AND pa.is_active = 1
      ORDER BY pa.created_at DESC
      LIMIT 1
    `).bind(body.email).first();

    if (!partner) {
      // Don't reveal if email exists or not for security
      return new Response(JSON.stringify({
        success: true,
        message: 'If this email is associated with an active partnership, you will receive a login link shortly.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate secure token (valid for 24 hours)
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store token in database
    await db.prepare(`
      INSERT INTO partner_magic_links
      (partner_id, token, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(partner.id, token, expiresAt.toISOString()).run();

    // Send magic link email
    const magicLink = `https://michiganspots.com/partner/dashboard?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #FAFBFC; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
    .header { background: linear-gradient(135deg, #41C6BB 0%, #5FD9D1 100%); color: #FFFFFF; padding: 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 40px; }
    .button { display: inline-block; background: linear-gradient(135deg, #41C6BB 0%, #2BA89E 100%); color: #FFFFFF !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 12px rgba(65, 198, 187, 0.3); }
    .button:hover { box-shadow: 0 6px 16px rgba(65, 198, 187, 0.4); }
    .info-box { background-color: #F5F7FA; border-left: 4px solid #41C6BB; padding: 15px; margin: 20px 0; }
    .footer { background-color: #1A0B2E; color: #FAFBFC; padding: 30px; text-align: center; font-size: 14px; }
    .footer a { color: #41C6BB; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗺️ Michigan Spots</h1>
      <p style="margin: 10px 0 0 0;">Partner Dashboard Access</p>
    </div>

    <div class="content">
      <h2 style="color: #1A0B2E; margin-top: 0;">Hello ${partner.organization_name}!</h2>

      <p style="color: #1A0B2E; line-height: 1.6;">
        You requested access to your Michigan Spots partner dashboard. Click the button below to securely log in:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${magicLink}" class="button">
          Access Your Dashboard →
        </a>
      </div>

      <div class="info-box">
        <p style="margin: 0; color: #1A0B2E; font-size: 14px;">
          <strong>⏱️ This link expires in 24 hours</strong><br>
          For security, this magic link can only be used once and will expire after 24 hours.
        </p>
      </div>

      <p style="color: #6B5B8C; font-size: 14px; line-height: 1.6;">
        If you didn't request this link, you can safely ignore this email. If you're having trouble clicking the button,
        copy and paste this link into your browser:
      </p>

      <p style="color: #6B5B8C; font-size: 12px; word-break: break-all; background: #F5F7FA; padding: 10px; border-radius: 4px;">
        ${magicLink}
      </p>

      <p style="color: #1A0B2E; line-height: 1.6; margin-top: 30px;">
        <strong>Need help?</strong><br>
        Contact us at <a href="mailto:partners@michiganspots.com" style="color: #41C6BB;">partners@michiganspots.com</a>
      </p>
    </div>

    <div class="footer">
      <p><strong>Michigan Spots</strong> | A Community-Powered Discovery Game</p>
      <p>
        <a href="https://michiganspots.com">michiganspots.com</a> |
        <a href="https://reddit.com/r/michiganspots">r/michiganspots</a>
      </p>
      <p style="margin-top: 15px; color: #9CEDE1;">
        © 2025 Cozyartz Media Group. All rights reserved.<br>
        Battle Creek, Michigan
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Michigan Spots - Partner Dashboard Access

Hello ${partner.organization_name}!

You requested access to your Michigan Spots partner dashboard.

Click here to securely log in:
${magicLink}

This link expires in 24 hours and can only be used once.

If you didn't request this link, you can safely ignore this email.

Need help? Contact us at partners@michiganspots.com

---
Michigan Spots | https://michiganspots.com | r/michiganspots
© 2025 Cozyartz Media Group | Battle Creek, Michigan
    `;

    await sendEmail({
      to: partner.email as string,
      subject: 'Your Michigan Spots Dashboard Login Link',
      text,
      html
    }, context.env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Magic link sent! Check your email.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error sending magic link:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to send magic link'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
