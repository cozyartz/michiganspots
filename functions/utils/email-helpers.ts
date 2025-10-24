// Email service using PurelyMail SMTP
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Create transporter (will be initialized with credentials)
export function createEmailTransporter(smtpUser: string, smtpPassword: string): Transporter {
  return nodemailer.createTransport({
    host: 'smtp.purelymail.com',
    port: 465,
    secure: true, // SSL/TLS
    auth: {
      user: smtpUser, // Full email address (e.g., noreply@michiganspots.com)
      pass: smtpPassword, // PurelyMail password or App Password if 2FA enabled
    },
  });
}

// Email templates
export interface MagicLinkEmailData {
  to: string;
  name: string;
  magicLink: string;
}

export async function sendMagicLinkEmail(
  transporter: Transporter,
  data: MagicLinkEmailData
): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: '"Michigan Spots" <noreply@michiganspots.com>',
      to: data.to,
      subject: 'Your Michigan Spots Login Link',
      html: `
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
              <div style="font-size: 48px; margin-bottom: 8px;">🔑</div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; font-family: 'Crimson Pro', Georgia, serif; text-shadow: 0 2px 8px rgba(26, 11, 46, 0.2);">Secure Login</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.95;">Your magic link is ready</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 28px;">
              <p style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1A0B2E;">Hi ${data.name || 'there'}!</p>

              <p style="margin-bottom: 24px; color: #3D2963; font-size: 16px;">Click the button below to securely log in to your Michigan Spots account:</p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.magicLink}" style="display: inline-block; background: linear-gradient(135deg, #41C6BB 0%, #2BA89E 100%); color: #FAFBFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(65, 198, 187, 0.3);">Log In to Michigan Spots</a>
              </div>

              <div style="background: linear-gradient(135deg, rgba(255, 184, 0, 0.1) 0%, rgba(255, 201, 51, 0.1) 100%); border-left: 4px solid #FFB800; padding: 20px; margin: 28px 0; border-radius: 8px;">
                <p style="margin: 0 0 12px 0; font-weight: 600; color: #1A0B2E; font-size: 15px;">🔒 Security Notice:</p>
                <div style="color: #3D2963; font-size: 14px; line-height: 1.8;">
                  <div style="margin-bottom: 6px;"><span style="color: #41C6BB; margin-right: 6px;">•</span> This link expires in <strong>15 minutes</strong></div>
                  <div style="margin-bottom: 6px;"><span style="color: #41C6BB; margin-right: 6px;">•</span> It can only be used <strong>once</strong></div>
                  <div><span style="color: #41C6BB; margin-right: 6px;">•</span> Never share this link with anyone</div>
                </div>
              </div>

              <p style="color: #3D2963; font-size: 14px; margin-bottom: 24px;">If you didn't request this login link, you can safely ignore this email.</p>

              <div style="background-color: #F5F7FA; border-radius: 8px; padding: 16px; margin-top: 28px;">
                <p style="font-size: 13px; color: #6B5B8C; margin: 0 0 8px 0;">Or copy and paste this link:</p>
                <code style="background: #FFFFFF; border: 1px solid rgba(65, 198, 187, 0.2); padding: 10px; display: block; border-radius: 4px; word-break: break-all; font-size: 12px; color: #1A0B2E;">${data.magicLink}</code>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #F5F7FA; padding: 24px 28px; border-top: 2px solid rgba(65, 198, 187, 0.15); text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1A0B2E;">
                Michigan Spots - Discover Michigan's Hidden Gems
              </p>
              <p style="margin: 0;">
                <a href="https://michiganspots.com" style="color: #41C6BB; text-decoration: none; font-weight: 600;">michiganspots.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${data.name || 'there'}!

Click the link below to log in to your Michigan Spots account:

${data.magicLink}

This link expires in 15 minutes and can only be used once.

If you didn't request this login link, you can safely ignore this email.

---
Michigan Spots - Discover Michigan's Hidden Gems
https://michiganspots.com
      `.trim(),
    });

    console.log('Magic link email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending magic link email:', error);
    return false;
  }
}

// Generate secure random token for magic links
export function generateMagicLinkToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
