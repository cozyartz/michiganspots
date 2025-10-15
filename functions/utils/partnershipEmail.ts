/**
 * Partnership confirmation email templates
 */

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
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2c1810; background-color: #faf8f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 2px solid #2c1810; border-radius: 8px; overflow: hidden;">

    <!-- Header -->
    <div style="background-color: #2c1810; color: #faf8f5; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Partnership Confirmed!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 18px; margin-bottom: 24px;">Hi ${contactName},</p>

      <p style="margin-bottom: 24px;">Welcome to Michigan Spots! Your <strong>${tierName}</strong> partnership has been confirmed.</p>

      <!-- Payment Receipt -->
      <div style="background-color: #faf8f5; border: 2px solid #2c1810; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
        <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #2c1810; border-bottom: 2px solid #2c1810; padding-bottom: 8px;">Payment Receipt</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b5d52;"><strong>Organization:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${organizationName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b5d52;"><strong>Partnership:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${tierName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b5d52;"><strong>Amount Paid:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-size: 20px; font-weight: bold; color: #1a7f4b;">${amountFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b5d52;"><strong>Transaction ID:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 11px;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b5d52;"><strong>Date:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${new Date().toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="background-color: #fff3cd; border-left: 4px solid: #d4884e; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #2c1810;">⚠️ Action Required: Accept Partnership Agreement</h3>
        <p style="margin: 0 0 16px 0;">To activate your partnership, you must review and electronically sign the Partnership Agreement:</p>
        <a href="${acceptanceUrl}" style="display: inline-block; background-color: #0066cc; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Review & Accept Agreement →</a>
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b5d52;">This agreement outlines services, payment terms, refund policy, IP rights, liability limitations, and dispute resolution.</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #c53030;"><strong>Please complete within 7 days.</strong></p>
      </div>

      <!-- What's Next -->
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #2c1810;">What's Next</h3>
        <ol style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Accept the Partnership Agreement (link above)</li>
          <li style="margin-bottom: 8px;">Access your Partner Dashboard</li>
          <li style="margin-bottom: 8px;">Create your first discovery challenge</li>
          <li style="margin-bottom: 8px;">Track analytics and engagement metrics</li>
        </ol>
      </div>

      <!-- Partnership Benefits -->
      <div style="background-color: #e6f2ff; border-left: 4px solid #0066cc; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
        <h4 style="margin: 0 0 8px 0; color: #2c1810;">Your Partnership Includes:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Profile page on Michigan Spots platform</li>
          <li>Sponsored challenge creation tools</li>
          <li>Real-time analytics dashboard</li>
          <li>Technical support and guidance</li>
          <li>Community engagement metrics</li>
        </ul>
      </div>

      <p style="margin-bottom: 8px;">Questions? Reply to this email or contact <a href="mailto:partnerships@michiganspots.com" style="color: #0066cc; text-decoration: none;">partnerships@michiganspots.com</a></p>

      <p style="margin: 16px 0 0 0; font-weight: bold; color: #d4884e;">Thank you for partnering with Michigan Spots!</p>
    </div>

    <!-- Footer -->
    <div style="background-color: #faf8f5; padding: 24px; border-top: 1px solid #e5dfd6; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #6b5d52;">
        The Michigan Spots Team<br />
        <a href="https://michiganspots.com" style="color: #0066cc; text-decoration: none;">https://michiganspots.com</a>
      </p>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #9b8b7e;">
        © 2025 Cozyartz Media Group. All rights reserved.<br />
        Battle Creek, Michigan
      </p>
    </div>

  </div>
</body>
</html>
`;

  // Send via MailChannels
  try {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
          },
        ],
        from: {
          email: 'partnerships@michiganspots.com',
          name: 'Michigan Spots Partnerships',
        },
        subject,
        content: [
          {
            type: 'text/plain',
            value: text,
          },
          {
            type: 'text/html',
            value: html,
          },
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
