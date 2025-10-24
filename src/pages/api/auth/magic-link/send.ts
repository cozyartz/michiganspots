/**
 * User Magic Link Authentication - Send Link
 * Endpoint: POST /api/auth/magic-link/send
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals, request }) => {
  const env = locals.runtime?.env;

  if (!env) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Runtime environment not available'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = env.DB as D1Database;

  if (!db) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Database not available'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json() as { email: string };

    if (!body.email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find user by email
    const user = await db.prepare(`
      SELECT id, email, role, name
      FROM users
      WHERE email = ?
      LIMIT 1
    `).bind(body.email).first();

    if (!user) {
      // Don't reveal if email exists or not for security
      return new Response(JSON.stringify({
        success: true,
        message: 'If this email is registered, you will receive a login link shortly.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is a partner (not super admin) and verify payment status
    if (user.role !== 'super_admin') {
      const partnerCheck = await db.prepare(`
        SELECT ends_at, is_active
        FROM partnership_activations
        WHERE email = ?
        AND is_active = 1
      `).bind(body.email).first();

      if (partnerCheck && partnerCheck.ends_at) {
        const endsAt = new Date(partnerCheck.ends_at as string);
        const gracePeriodEnd = new Date(endsAt);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 10); // 10 day grace period

        if (new Date() > gracePeriodEnd) {
          // Don't reveal payment status for security
          return new Response(JSON.stringify({
            success: true,
            message: 'If this email is registered, you will receive a login link shortly.'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Generate secure token (valid for 24 hours)
    const token = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // Unix timestamp, 24 hours from now

    // Store token in database
    await db.prepare(`
      INSERT INTO magic_link_tokens
      (email, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(body.email, token, expiresAt).run();

    // Send magic link email
    const magicLink = `https://michiganspots.com/api/auth/magic-link/verify?token=${token}`;

    // Import email utility
    const { sendEmail } = await import('../../../../functions/utils/email');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700&family=Merriweather:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1A0B2E; background-color: #FAFBFC; background-image: repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(65, 198, 187, 0.02) 50px, rgba(65, 198, 187, 0.02) 51px); margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, rgba(250, 251, 252, 0.98) 0%, rgba(245, 247, 250, 0.95) 100%); border: 2px solid rgba(65, 198, 187, 0.3); border-radius: 12px; box-shadow: inset 0 0 0 1px rgba(65, 198, 187, 0.1), 0 4px 12px rgba(65, 198, 187, 0.15); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #41C6BB 0%, #5FD9D1 100%); color: #FAFBFC; padding: 40px 24px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 8px;">🎯</div>
      <h1 style="margin: 0; font-size: 32px; font-weight: 700; font-family: 'Crimson Pro', Georgia, serif; text-shadow: 0 2px 8px rgba(26, 11, 46, 0.2);">Michigan Spots Login</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.95;">Secure access link</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 28px;">
      <p style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1A0B2E;">Hello ${user.name || 'there'}!</p>

      <p style="margin-bottom: 24px; color: #3D2963; font-size: 16px;">You requested to log in to Michigan Spots. Click the button below to securely access your account:</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #41C6BB 0%, #2BA89E 100%); color: #FAFBFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(65, 198, 187, 0.3);">Log In to Michigan Spots →</a>
      </div>

      <div style="background: linear-gradient(135deg, rgba(255, 184, 0, 0.1) 0%, rgba(255, 201, 51, 0.1) 100%); border-left: 4px solid #FFB800; padding: 20px; margin: 28px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #1A0B2E; font-size: 15px;">🔒 Security Information:</p>
        <div style="color: #3D2963; font-size: 14px; line-height: 1.8;">
          <div style="margin-bottom: 6px;"><span style="color: #41C6BB; margin-right: 6px;">•</span> This link expires in <strong>24 hours</strong></div>
          <div><span style="color: #41C6BB; margin-right: 6px;">•</span> Can only be used <strong>once</strong> for security</div>
        </div>
      </div>

      <p style="color: #3D2963; font-size: 14px; margin-bottom: 20px;">If you didn't request this link, you can safely ignore this email.</p>

      <div style="background-color: #F5F7FA; border-radius: 8px; padding: 16px; margin-top: 28px;">
        <p style="font-size: 13px; color: #6B5B8C; margin: 0 0 8px 0;">Or copy and paste this link:</p>
        <code style="background: #FFFFFF; border: 1px solid rgba(65, 198, 187, 0.2); padding: 10px; display: block; border-radius: 4px; word-break: break-all; font-size: 12px; color: #1A0B2E;">${magicLink}</code>
      </div>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid rgba(65, 198, 187, 0.1);">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #1A0B2E; font-size: 15px;">Need help?</p>
        <p style="margin: 0; color: #3D2963; font-size: 14px;">Contact us at <a href="mailto:support@michiganspots.com" style="color: #41C6BB; text-decoration: none; font-weight: 600;">support@michiganspots.com</a></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #F5F7FA; padding: 24px 28px; border-top: 2px solid rgba(65, 198, 187, 0.15); text-align: center;">
      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1A0B2E;">
        Michigan Spots - A Community-Powered Discovery Game
      </p>
      <p style="margin: 0 0 12px 0;">
        <a href="https://michiganspots.com" style="color: #41C6BB; text-decoration: none; font-weight: 600; margin-right: 12px;">michiganspots.com</a>
        <a href="https://reddit.com/r/michiganspots" style="color: #41C6BB; text-decoration: none; font-weight: 600;">r/michiganspots</a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #6B5B8C;">
        © 2025 Cozyartz Media Group. All rights reserved.<br>
        Battle Creek, Michigan
      </p>
    </div>

  </div>
</body>
</html>
    `;

    const text = `
Michigan Spots - Login Link

Hello ${user.name || 'there'}!

You requested to log in to Michigan Spots.

Click here to securely access your account:
${magicLink}

This link expires in 24 hours and can only be used once.

If you didn't request this link, you can safely ignore this email.

Need help? Contact us at support@michiganspots.com

---
Michigan Spots | https://michiganspots.com | r/michiganspots
© 2025 Cozyartz Media Group | Battle Creek, Michigan
    `;

    await sendEmail({
      to: user.email as string,
      subject: 'Your Michigan Spots Login Link',
      text,
      html
    }, env);

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
