/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

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
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #9B7B7B 0%, #7D6262 100%);
              color: white;
              padding: 30px 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #F5E6D3;
              padding: 30px 20px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #0EA5E9;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">🗺️ Michigan Spots</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name || 'there'}!</h2>
            <p>Click the button below to securely log in to your Michigan Spots account:</p>

            <div style="text-align: center;">
              <a href="${data.magicLink}" class="button">Log In to Michigan Spots</a>
            </div>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                <li>This link expires in <strong>15 minutes</strong></li>
                <li>It can only be used <strong>once</strong></li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>

            <p>If you didn't request this login link, you can safely ignore this email.</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:<br>
              <code style="background: #fff; padding: 8px; display: inline-block; margin-top: 8px; word-break: break-all;">${data.magicLink}</code>
            </p>
          </div>
          <div class="footer">
            <p>
              Michigan Spots - Discover Michigan's Hidden Gems<br>
              <a href="https://michiganspots.com">michiganspots.com</a>
            </p>
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

// Simple email sending function for general use
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

export async function sendEmail(params: EmailParams, env: Env): Promise<boolean> {
  const { to, subject, text, html } = params;

  try {
    const transporter = createEmailTransporter(
      env.SMTP_USER || 'hello@michiganspots.com',
      env.SMTP_PASSWORD
    );

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
