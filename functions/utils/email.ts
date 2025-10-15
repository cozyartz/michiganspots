/**
 * Email sending utility using Purelymail SMTP
 *
 * SMTP Settings:
 * - Server: smtp.purelymail.com
 * - Port: 465 (SSL/TLS) or 587 (STARTTLS)
 * - Username: hello@michiganspots.com
 * - Password: App password from SMTP_PASSWORD secret
 */

interface EmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface Env {
  SMTP_PASSWORD: string;
}

/**
 * Send email using Purelymail SMTP via MailChannels
 * Note: Cloudflare Workers don't support direct SMTP connections
 * We'll use MailChannels which is free for Cloudflare customers
 */
export async function sendEmail(params: EmailParams, env: Env): Promise<boolean> {
  const { to, subject, text, html } = params;

  try {
    // Use MailChannels API (free for Cloudflare Workers)
    // https://support.mailchannels.com/hc/en-us/articles/4565898358413-Sending-Email-from-Cloudflare-Workers-using-MailChannels-Send-API
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: {
          email: 'hello@michiganspots.com',
          name: 'Michigan Spots',
        },
        subject,
        content: [
          {
            type: 'text/plain',
            value: text,
          },
          ...(html
            ? [
                {
                  type: 'text/html',
                  value: html,
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      console.error('Email sending failed:', await response.text());
      return false;
    }

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
  const subject = '🎉 Welcome to Michigan Spots!';

  const text = `Hi ${name},

Welcome to Michigan Spots! We're excited to have you join our community of Michigan explorers.

Michigan Spots is launching in October 2025 as part of Reddit Community Games 2025. Get ready to:

✨ Discover hidden gems across Michigan
🏆 Complete challenges and earn badges
🎯 Compete in city rivalries
🤝 Connect with local businesses

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
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2c1810; background-color: #faf8f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 2px solid #2c1810; border-radius: 8px; overflow: hidden;">

    <!-- Header -->
    <div style="background-color: #2c1810; color: #faf8f5; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎉 Welcome to Michigan Spots!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 18px; margin-bottom: 24px;">Hi ${name},</p>

      <p style="margin-bottom: 16px;">Welcome to Michigan Spots! We're excited to have you join our community of Michigan explorers.</p>

      <p style="margin-bottom: 24px;">Michigan Spots is launching in <strong>October 2025</strong> as part of Reddit Community Games 2025. Get ready to:</p>

      <ul style="margin-bottom: 24px; padding-left: 24px;">
        <li style="margin-bottom: 8px;">✨ Discover hidden gems across Michigan</li>
        <li style="margin-bottom: 8px;">🏆 Complete challenges and earn badges</li>
        <li style="margin-bottom: 8px;">🎯 Compete in city rivalries</li>
        <li style="margin-bottom: 8px;">🤝 Connect with local businesses</li>
      </ul>

      <p style="margin-bottom: 24px;">We'll keep you updated on our launch and send you early access when we go live.</p>

      <!-- Info Box -->
      <div style="background-color: #faf8f5; border-left: 4px solid #d4884e; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #2c1810;">What to Expect:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Launch announcement (October 2025)</li>
          <li>Early access invitation</li>
          <li>Challenge previews</li>
          <li>Community updates</li>
        </ul>
      </div>

      <p style="margin-bottom: 24px; font-size: 18px; font-weight: bold; color: #d4884e;">Stay tuned!</p>

      <p style="margin-bottom: 8px;">The Michigan Spots Team</p>
      <p style="margin: 0;"><a href="https://michiganspots.com" style="color: #0066cc; text-decoration: none;">https://michiganspots.com</a></p>
    </div>

    <!-- Footer -->
    <div style="background-color: #faf8f5; padding: 24px; border-top: 1px solid #e5dfd6; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #6b5d52;">
        Questions? Reply to this email or visit our <a href="https://michiganspots.com" style="color: #0066cc; text-decoration: none;">website</a>.
      </p>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #9b8b7e;">
        You're receiving this because you signed up for Michigan Spots at michiganspots.com
      </p>
    </div>

  </div>
</body>
</html>
`;

  return await sendEmail({ to: email, subject, text, html }, env);
}
