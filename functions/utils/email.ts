/**
 * Email sending utility using Purelymail SMTP
 *
 * SMTP Settings:
 * - Server: smtp.purelymail.com
 * - Port: 465 (SSL/TLS)
 * - Username: hello@michiganspots.com (from SMTP_USER env var)
 * - Password: App password from SMTP_PASSWORD secret
 */

import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface Env {
  SMTP_USER?: string;
  SMTP_PASSWORD: string;
}

/**
 * Send email using Purelymail SMTP
 */
export async function sendEmail(params: EmailParams, env: Env): Promise<boolean> {
  const { to, subject, text, html } = params;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.purelymail.com',
      port: 465,
      secure: true, // SSL/TLS
      auth: {
        user: env.SMTP_USER || 'hello@michiganspots.com',
        pass: env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: '"Michigan Spots" <hello@michiganspots.com>',
      to,
      subject,
      text,
      html,
    });

    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

/**
 * Send welcome email to new signup
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  env: Env
): Promise<boolean> {
  const subject = 'Welcome to Michigan Spots!';

  const text = `Hi ${name},

Welcome to Michigan Spots! We're excited to have you join our community of Michigan explorers.

Michigan Spots is launching in October 2025 as part of Reddit Community Games 2025. Get ready to:

- Discover hidden gems across Michigan
- Complete challenges and earn badges
- Compete in city rivalries
- Connect with local businesses

We'll keep you updated on our launch and send you early access when we go live.

What to Expect:
- Launch announcement (October 2025)
- Early access invitation
- Challenge previews
- Community updates

Stay tuned!

The Michigan Spots Team
https://michiganspots.com

---
Questions? Reply to this email or visit our website.
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Michigan Spots</title>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700&family=Merriweather:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1A0B2E; background-color: #FAFBFC; background-image: repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(65, 198, 187, 0.02) 50px, rgba(65, 198, 187, 0.02) 51px); margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, rgba(250, 251, 252, 0.98) 0%, rgba(245, 247, 250, 0.95) 100%); border: 2px solid rgba(65, 198, 187, 0.3); border-radius: 12px; box-shadow: inset 0 0 0 1px rgba(65, 198, 187, 0.1), 0 4px 12px rgba(65, 198, 187, 0.15); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #41C6BB 0%, #5FD9D1 100%); color: #FAFBFC; padding: 40px 24px; text-align: center; position: relative;">
      <div style="font-size: 48px; margin-bottom: 8px;">🗺️</div>
      <h1 style="margin: 0; font-size: 36px; font-weight: 700; font-family: 'Crimson Pro', Georgia, serif; text-shadow: 0 2px 8px rgba(26, 11, 46, 0.2);">Welcome to Michigan Spots!</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.95;">Your treasure hunt adventure begins</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 28px;">
      <p style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1A0B2E;">Hi ${name},</p>

      <p style="margin-bottom: 20px; color: #3D2963; font-size: 16px;">Welcome to Michigan Spots! We're excited to have you join our community of Michigan explorers and treasure hunters.</p>

      <p style="margin-bottom: 24px; color: #3D2963; font-size: 16px;">Michigan Spots launches <strong style="color: #41C6BB;">October 2025</strong> as part of Reddit Community Games 2025. Get ready to:</p>

      <div style="background: linear-gradient(135deg, rgba(65, 198, 187, 0.08) 0%, rgba(156, 237, 225, 0.08) 100%); border-left: 4px solid #41C6BB; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
        <div style="margin-bottom: 12px; font-size: 15px; color: #1A0B2E;">
          <span style="color: #41C6BB; font-size: 20px; margin-right: 8px;">🏆</span>
          <strong>Complete challenges</strong> and earn badges
        </div>
        <div style="margin-bottom: 12px; font-size: 15px; color: #1A0B2E;">
          <span style="color: #FFB800; font-size: 20px; margin-right: 8px;">💎</span>
          <strong>Discover hidden gems</strong> across Michigan
        </div>
        <div style="margin-bottom: 12px; font-size: 15px; color: #1A0B2E;">
          <span style="color: #FF6B9D; font-size: 20px; margin-right: 8px;">🎯</span>
          <strong>Compete in city rivalries</strong> and climb leaderboards
        </div>
        <div style="font-size: 15px; color: #1A0B2E;">
          <span style="color: #2D7A5F; font-size: 20px; margin-right: 8px;">🤝</span>
          <strong>Connect with local businesses</strong> and win rewards
        </div>
      </div>

      <div style="background-color: #F5F7FA; border: 2px solid rgba(65, 198, 187, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 28px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-family: 'Merriweather', Georgia, serif; color: #1A0B2E;">What to Expect:</h3>
        <div style="display: table; width: 100%;">
          <div style="margin-bottom: 10px; color: #3D2963; font-size: 14px;">
            <span style="color: #41C6BB; margin-right: 8px;">✓</span> Launch announcement (October 2025)
          </div>
          <div style="margin-bottom: 10px; color: #3D2963; font-size: 14px;">
            <span style="color: #41C6BB; margin-right: 8px;">✓</span> Early access invitation
          </div>
          <div style="margin-bottom: 10px; color: #3D2963; font-size: 14px;">
            <span style="color: #41C6BB; margin-right: 8px;">✓</span> Challenge previews and sneak peeks
          </div>
          <div style="color: #3D2963; font-size: 14px;">
            <span style="color: #41C6BB; margin-right: 8px;">✓</span> Community updates and events
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://reddit.com/r/michiganspots" style="display: inline-block; background: linear-gradient(135deg, #41C6BB 0%, #2BA89E 100%); color: #FAFBFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(65, 198, 187, 0.3);">Join r/michiganspots</a>
      </div>

      <p style="margin: 28px 0 8px 0; font-weight: 600; color: #1A0B2E;">The Michigan Spots Team</p>
      <p style="margin: 0;"><a href="https://michiganspots.com" style="color: #41C6BB; text-decoration: none; font-weight: 600;">michiganspots.com</a></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #F5F7FA; padding: 24px 28px; border-top: 2px solid rgba(65, 198, 187, 0.15); text-align: center;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #6B5B8C;">
        Questions? Reply to this email or visit our <a href="https://michiganspots.com" style="color: #41C6BB; text-decoration: none;">website</a>.
      </p>
      <p style="margin: 0; font-size: 12px; color: #6B5B8C;">
        You're receiving this because you signed up for Michigan Spots at michiganspots.com
      </p>
    </div>

  </div>
</body>
</html>
`;

  return await sendEmail({ to: email, subject, text, html }, env);
}
