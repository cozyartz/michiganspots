/**
 * Partnership confirmation email templates using Purelymail SMTP
 */

import nodemailer from 'nodemailer';

interface PartnershipEmailParams {
  email: string;
  organizationName: string;
  contactName: string;
  partnershipType: string;
  partnershipTier: string;
  amount: number;
  transactionId: string;
  sessionId: string;
  acceptanceUrl: string;
}

interface Env {
  SMTP_USER?: string;
  SMTP_PASSWORD: string;
}

export async function sendPartnershipConfirmationEmail(
  params: PartnershipEmailParams,
  env: Env
): Promise<boolean> {
  const {
    email,
    organizationName,
    contactName,
    partnershipType,
    partnershipTier,
    amount,
    transactionId,
    sessionId,
    acceptanceUrl
  } = params;

  const tierName = getTierDisplayName(partnershipType, partnershipTier);
  const amountFormatted = `$${(amount / 100).toFixed(2)}`;

  const subject = `Partnership Confirmed - ${tierName} | Michigan Spots`;

  const text = `Partnership Confirmation

Hi ${contactName},

Welcome to Michigan Spots! Your ${tierName} partnership has been confirmed.

PAYMENT RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━
Organization: ${organizationName}
Partnership: ${tierName}
Amount Paid: ${amountFormatted}
Transaction ID: ${transactionId}
Date: ${new Date().toLocaleDateString()}

NEXT STEP: Accept Partnership Agreement
━━━━━━━━━━━━━━━━━━━━━━━
To activate your partnership, you must review and electronically sign the Partnership Agreement:

${acceptanceUrl}

This agreement outlines:
✓ Services provided by Michigan Spots
✓ Your partnership benefits and obligations
✓ Payment terms and refund policy
✓ Intellectual property rights
✓ Liability limitations and indemnification
✓ Dispute resolution and governing law

IMPORTANT: All partnerships require electronic signature acceptance. Please complete this within 7 days.

WHAT'S NEXT
━━━━━━━━━━━━━━━━━━━━━━━
After accepting the agreement:
1. You'll receive access to your Partner Dashboard
2. Create your first challenge
3. Access analytics and performance metrics
4. Promote your partnership to members

PARTNERSHIP DETAILS
━━━━━━━━━━━━━━━━━━━━━━━
• Profile page on Michigan Spots
• Sponsored challenge creation tools
• Analytics dashboard
• Technical support
• Community engagement metrics

Questions? Reply to this email or contact partnerships@michiganspots.com

Thank you for partnering with Michigan Spots!

The Michigan Spots Team
https://michiganspots.com

---
© 2025 Cozyartz Media Group. All rights reserved.
Battle Creek, Michigan
`;

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
      <div style="font-size: 48px; margin-bottom: 8px;">🤝</div>
      <h1 style="margin: 0; font-size: 32px; font-weight: 700; font-family: 'Crimson Pro', Georgia, serif; text-shadow: 0 2px 8px rgba(26, 11, 46, 0.2);">Partnership Confirmed!</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.95;">Welcome to Michigan Spots</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 28px;">
      <p style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1A0B2E;">Hi ${contactName},</p>

      <p style="margin-bottom: 24px; color: #3D2963; font-size: 16px;">Welcome to Michigan Spots! Your <strong style="color: #41C6BB;">${tierName}</strong> partnership has been confirmed.</p>

      <!-- Payment Receipt -->
      <div style="background-color: #F5F7FA; border: 2px solid rgba(65, 198, 187, 0.2); border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <h2 style="margin: 0 0 20px 0; font-size: 20px; font-family: 'Merriweather', Georgia, serif; color: #1A0B2E; border-bottom: 2px solid rgba(65, 198, 187, 0.2); padding-bottom: 12px;">💳 Payment Receipt</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #6B5B8C; font-size: 14px;"><strong>Organization:</strong></td>
            <td style="padding: 10px 0; text-align: right; color: #1A0B2E; font-size: 14px;">${organizationName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6B5B8C; font-size: 14px;"><strong>Partnership:</strong></td>
            <td style="padding: 10px 0; text-align: right; color: #1A0B2E; font-size: 14px;">${tierName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6B5B8C; font-size: 14px;"><strong>Amount Paid:</strong></td>
            <td style="padding: 10px 0; text-align: right; font-size: 24px; font-weight: bold; color: #2D7A5F;">${amountFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6B5B8C; font-size: 14px;"><strong>Transaction ID:</strong></td>
            <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 11px; color: #6B5B8C;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6B5B8C; font-size: 14px;"><strong>Date:</strong></td>
            <td style="padding: 10px 0; text-align: right; color: #1A0B2E; font-size: 14px;">${new Date().toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="background: linear-gradient(135deg, rgba(255, 184, 0, 0.1) 0%, rgba(255, 201, 51, 0.1) 100%); border-left: 4px solid #FFB800; padding: 24px; margin-bottom: 28px; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-family: 'Merriweather', Georgia, serif; color: #1A0B2E;">📋 Action Required: Accept Partnership Agreement</h3>
        <p style="margin: 0 0 20px 0; color: #3D2963; font-size: 15px;">To activate your partnership, review and electronically sign the Partnership Agreement:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${acceptanceUrl}" style="display: inline-block; background: linear-gradient(135deg, #41C6BB 0%, #2BA89E 100%); color: #FAFBFC; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(65, 198, 187, 0.3);">Review & Accept Agreement →</a>
        </div>
        <p style="margin: 16px 0 0 0; font-size: 13px; color: #6B5B8C;">This agreement outlines services, payment terms, refund policy, IP rights, liability limitations, and dispute resolution.</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #FF6B9D; font-weight: 600;">⏰ Please complete within 7 days</p>
      </div>

      <!-- What's Next -->
      <div style="margin-bottom: 28px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-family: 'Merriweather', Georgia, serif; color: #1A0B2E;">🚀 What's Next</h3>
        <div style="background: linear-gradient(135deg, rgba(65, 198, 187, 0.08) 0%, rgba(156, 237, 225, 0.08) 100%); border-radius: 8px; padding: 16px;">
          <div style="margin-bottom: 12px; color: #1A0B2E; font-size: 14px;">
            <span style="color: #41C6BB; margin-right: 8px;">1.</span> Accept the Partnership Agreement (link above)
          </div>
          <div style="margin-bottom: 12px; color: #1A0B2E; font-size: 14px;">
            <span style="color: #FFB800; margin-right: 8px;">2.</span> Access your Partner Dashboard
          </div>
          <div style="margin-bottom: 12px; color: #1A0B2E; font-size: 14px;">
            <span style="color: #FF6B9D; margin-right: 8px;">3.</span> Create your first discovery challenge
          </div>
          <div style="color: #1A0B2E; font-size: 14px;">
            <span style="color: #2D7A5F; margin-right: 8px;">4.</span> Track analytics and engagement metrics
          </div>
        </div>
      </div>

      <!-- Partnership Benefits -->
      <div style="background-color: #F5F7FA; border: 2px solid rgba(65, 198, 187, 0.2); border-radius: 8px; padding: 20px; margin-bottom: 28px;">
        <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1A0B2E;">✨ Your Partnership Includes:</h4>
        <div style="color: #3D2963; font-size: 14px; line-height: 2;">
          <div style="margin-bottom: 8px;"><span style="color: #41C6BB; margin-right: 8px;">✓</span> Profile page on Michigan Spots platform</div>
          <div style="margin-bottom: 8px;"><span style="color: #41C6BB; margin-right: 8px;">✓</span> Sponsored challenge creation tools</div>
          <div style="margin-bottom: 8px;"><span style="color: #41C6BB; margin-right: 8px;">✓</span> Real-time analytics dashboard</div>
          <div style="margin-bottom: 8px;"><span style="color: #41C6BB; margin-right: 8px;">✓</span> Technical support and guidance</div>
          <div><span style="color: #41C6BB; margin-right: 8px;">✓</span> Community engagement metrics</div>
        </div>
      </div>

      <p style="margin-bottom: 8px; color: #3D2963; font-size: 14px;">Questions? Reply to this email or contact <a href="mailto:partnerships@michiganspots.com" style="color: #41C6BB; text-decoration: none; font-weight: 600;">partnerships@michiganspots.com</a></p>

      <p style="margin: 24px 0 0 0; font-weight: 600; color: #41C6BB; font-size: 16px;">Thank you for partnering with Michigan Spots!</p>
    </div>

    <!-- Footer -->
    <div style="background-color: #F5F7FA; padding: 24px 28px; border-top: 2px solid rgba(65, 198, 187, 0.15); text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1A0B2E;">
        The Michigan Spots Team
      </p>
      <p style="margin: 0 0 16px 0;">
        <a href="https://michiganspots.com" style="color: #41C6BB; text-decoration: none; font-weight: 600;">michiganspots.com</a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #6B5B8C;">
        © 2025 Cozyartz Media Group. All rights reserved.<br />
        Battle Creek, Michigan
      </p>
    </div>

  </div>
</body>
</html>
`;

  // Send via Purelymail SMTP
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.purelymail.com',
      port: 465,
      secure: true, // SSL/TLS
      auth: {
        user: env.SMTP_USER || 'partnerships@michiganspots.com',
        pass: env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: '"Michigan Spots Partnerships" <partnerships@michiganspots.com>',
      to: email,
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

function getTierDisplayName(type: string, tier: string): string {
  const names: Record<string, Record<string, string>> = {
    chamber: {
      launch: 'Chamber Launch Partner',
      city: 'Chamber City Champion',
      regional: 'Chamber Regional Leader'
    },
    business: {
      single: 'Business Single Challenge',
      seasonal: 'Business Seasonal Package',
      multi_location: 'Business Multi-Location',
      event: 'Business Event Promotion'
    },
    community: {
      minimal: 'Community Minimal Partnership',
      modest: 'Community Modest Partnership'
    }
  };

  return names[type]?.[tier] || `${type} ${tier}`;
}
