/**
 * Partner Report Generation and Email Sending
 *
 * Generates comprehensive reports for partners and sends via email
 */

import type { Env } from '../../types/cloudflare';
import { sendEmail } from './email';

interface PartnerReportData {
  partnerId: number;
  organizationName: string;
  email: string;
  periodStart: string;
  periodEnd: string;
  metrics: {
    totalViews: number;
    totalCompletions: number;
    totalComments: number;
    totalUpvotes: number;
    totalShares: number;
    uniqueParticipants: number;
    engagementRate: number; // completions / views
  };
  challenges: Array<{
    title: string;
    views: number;
    completions: number;
    comments: number;
    redditUrl: string;
  }>;
  topParticipants: Array<{
    username: string;
    completions: number;
  }>;
}

export async function generatePartnerReport(
  partnerId: number,
  reportType: 'weekly' | 'monthly' | 'quarterly',
  env: Env
): Promise<PartnerReportData | null> {
  const db = env.DB;

  // Calculate date range based on report type
  let periodStart: string;
  let periodEnd: string;

  const now = new Date();
  periodEnd = now.toISOString().split('T')[0]; // YYYY-MM-DD

  switch (reportType) {
    case 'weekly':
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      periodStart = weekAgo.toISOString().split('T')[0];
      break;
    case 'monthly':
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      periodStart = monthAgo.toISOString().split('T')[0];
      break;
    case 'quarterly':
      const quarterAgo = new Date(now);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      periodStart = quarterAgo.toISOString().split('T')[0];
      break;
  }

  // Get partner info
  const partner = await db.prepare(`
    SELECT
      pa.id,
      sc.organization_name,
      sc.email,
      pa.partnership_type,
      pa.partnership_tier
    FROM partnership_activations pa
    LEFT JOIN stripe_customers sc ON pa.stripe_customer_id = sc.stripe_customer_id
    WHERE pa.id = ?
  `).bind(partnerId).first();

  if (!partner) {
    return null;
  }

  // Get metrics for the period
  const metrics = await db.prepare(`
    SELECT
      COALESCE(SUM(challenge_views), 0) as total_views,
      COALESCE(SUM(challenge_completions), 0) as total_completions,
      COALESCE(SUM(challenge_comments), 0) as total_comments,
      COALESCE(SUM(challenge_upvotes), 0) as total_upvotes,
      COALESCE(SUM(challenge_shares), 0) as total_shares,
      COALESCE(SUM(unique_participants), 0) as unique_participants
    FROM partner_analytics_daily
    WHERE partner_id = ?
    AND date >= ?
    AND date <= ?
  `).bind(partnerId, periodStart, periodEnd).first();

  const engagementRate = metrics && metrics.total_views > 0
    ? ((metrics.total_completions as number) / (metrics.total_views as number) * 100)
    : 0;

  // Get challenge performance
  const challenges = await db.prepare(`
    SELECT
      c.title,
      c.reddit_post_url as reddit_url,
      COALESCE(SUM(CASE WHEN ee.event_type = 'view' THEN 1 ELSE 0 END), 0) as views,
      COALESCE(SUM(CASE WHEN ee.event_type = 'completion' THEN 1 ELSE 0 END), 0) as completions,
      COALESCE(SUM(CASE WHEN ee.event_type = 'comment' THEN 1 ELSE 0 END), 0) as comments
    FROM challenges c
    LEFT JOIN engagement_events ee ON c.id = ee.challenge_id
      AND ee.created_at >= ?
      AND ee.created_at <= ?
    WHERE c.sponsor_id = ?
    GROUP BY c.id, c.title, c.reddit_post_url
    ORDER BY completions DESC
  `).bind(periodStart, periodEnd, partnerId).all();

  // Get top participants
  const topParticipants = await db.prepare(`
    SELECT
      cc.user_reddit_username as username,
      COUNT(*) as completions
    FROM challenge_completions cc
    LEFT JOIN challenges c ON cc.challenge_id = c.id
    WHERE c.sponsor_id = ?
    AND cc.completed_at >= ?
    AND cc.completed_at <= ?
    GROUP BY cc.user_reddit_username
    ORDER BY completions DESC
    LIMIT 5
  `).bind(partnerId, periodStart, periodEnd).all();

  return {
    partnerId,
    organizationName: partner.organization_name as string,
    email: partner.email as string,
    periodStart,
    periodEnd,
    metrics: {
      totalViews: metrics?.total_views as number || 0,
      totalCompletions: metrics?.total_completions as number || 0,
      totalComments: metrics?.total_comments as number || 0,
      totalUpvotes: metrics?.total_upvotes as number || 0,
      totalShares: metrics?.total_shares as number || 0,
      uniqueParticipants: metrics?.unique_participants as number || 0,
      engagementRate: Math.round(engagementRate * 100) / 100
    },
    challenges: challenges.results as any[],
    topParticipants: topParticipants.results as any[]
  };
}

export async function sendPartnerReport(
  reportData: PartnerReportData,
  reportType: 'weekly' | 'monthly' | 'quarterly',
  env: Env
): Promise<boolean> {
  const db = env.DB;

  const reportTypeLabel = reportType.charAt(0).toUpperCase() + reportType.slice(1);
  const subject = `${reportTypeLabel} Report: ${reportData.organizationName} | Michigan Spots`;

  // Generate HTML email
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #F4EFE5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
    .header { background-color: #2E5077; color: #F4EFE5; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .content { padding: 30px; }
    .metric-card { background-color: #F4EFE5; border: 2px solid #2C1810; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
    .metric-card h2 { margin: 0 0 15px 0; font-size: 18px; color: #2C1810; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .metric-item { text-align: center; }
    .metric-value { font-size: 32px; font-weight: bold; color: #D97642; margin: 0; }
    .metric-label { font-size: 14px; color: #2C1810; margin: 5px 0 0 0; }
    .challenge-list { list-style: none; padding: 0; }
    .challenge-item { background-color: #F4EFE5; padding: 15px; margin-bottom: 10px; border-left: 4px solid #4A7C59; }
    .challenge-item h3 { margin: 0 0 10px 0; font-size: 16px; color: #2C1810; }
    .challenge-stats { font-size: 14px; color: #2C1810; }
    .cta-button { display: inline-block; background-color: #D97642; color: #F4EFE5; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #2C1810; color: #F4EFE5; padding: 20px; text-align: center; font-size: 12px; }
    .footer a { color: #D97642; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗺️ Michigan Spots</h1>
      <p>${reportTypeLabel} Partnership Report</p>
      <p style="font-size: 14px; margin: 10px 0 0 0;">${reportData.periodStart} to ${reportData.periodEnd}</p>
    </div>

    <div class="content">
      <h2 style="color: #2C1810; margin-top: 0;">Hello ${reportData.organizationName}!</h2>
      <p style="color: #2C1810; line-height: 1.6;">
        Here's your ${reportType} performance report for your Michigan Spots partnership.
        Your challenges are helping Michigan explorers discover amazing places!
      </p>

      <div class="metric-card">
        <h2>📊 Overall Performance</h2>
        <div class="metric-grid">
          <div class="metric-item">
            <p class="metric-value">${reportData.metrics.totalViews.toLocaleString()}</p>
            <p class="metric-label">Challenge Views</p>
          </div>
          <div class="metric-item">
            <p class="metric-value">${reportData.metrics.totalCompletions.toLocaleString()}</p>
            <p class="metric-label">Completions</p>
          </div>
          <div class="metric-item">
            <p class="metric-value">${reportData.metrics.totalComments.toLocaleString()}</p>
            <p class="metric-label">Comments</p>
          </div>
          <div class="metric-item">
            <p class="metric-value">${reportData.metrics.engagementRate}%</p>
            <p class="metric-label">Engagement Rate</p>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <h2>🏆 Top Performing Challenges</h2>
        <ul class="challenge-list">
          ${reportData.challenges.slice(0, 3).map(challenge => `
            <li class="challenge-item">
              <h3>${challenge.title}</h3>
              <div class="challenge-stats">
                <strong>${challenge.completions}</strong> completions •
                <strong>${challenge.comments}</strong> comments •
                <strong>${challenge.views}</strong> views
                ${challenge.reddit_url ? `<br><a href="${challenge.reddit_url}" style="color: #2E5077;">View on Reddit →</a>` : ''}
              </div>
            </li>
          `).join('')}
        </ul>
      </div>

      ${reportData.topParticipants.length > 0 ? `
      <div class="metric-card">
        <h2>⭐ Top Participants</h2>
        <p style="color: #2C1810;">These users completed the most of your challenges:</p>
        <ul style="color: #2C1810;">
          ${reportData.topParticipants.map(p => `
            <li><strong>u/${p.username}</strong> - ${p.completions} completions</li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://michiganspots.com/dashboard?partner=${reportData.partnerId}" class="cta-button">
          View Full Dashboard
        </a>
      </div>

      <p style="color: #2C1810; line-height: 1.6; font-size: 14px;">
        <strong>Questions or feedback?</strong><br>
        Reply to this email or contact us at
        <a href="mailto:partners@michiganspots.com" style="color: #2E5077;">partners@michiganspots.com</a>
      </p>
    </div>

    <div class="footer">
      <p><strong>Michigan Spots</strong> | A Community-Powered Discovery Game</p>
      <p>
        <a href="https://michiganspots.com">michiganspots.com</a> |
        <a href="https://reddit.com/r/michiganspots">r/michiganspots</a>
      </p>
      <p style="margin-top: 15px;">
        © 2025 Cozyartz Media Group. All rights reserved.<br>
        Battle Creek, Michigan
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Michigan Spots - ${reportTypeLabel} Partnership Report
${reportData.periodStart} to ${reportData.periodEnd}

Hello ${reportData.organizationName}!

Here's your ${reportType} performance report for your Michigan Spots partnership.

OVERALL PERFORMANCE:
- Challenge Views: ${reportData.metrics.totalViews.toLocaleString()}
- Completions: ${reportData.metrics.totalCompletions.toLocaleString()}
- Comments: ${reportData.metrics.totalComments.toLocaleString()}
- Engagement Rate: ${reportData.metrics.engagementRate}%

TOP PERFORMING CHALLENGES:
${reportData.challenges.slice(0, 3).map((c, i) => `
${i + 1}. ${c.title}
   ${c.completions} completions • ${c.comments} comments • ${c.views} views
   ${c.reddit_url || ''}
`).join('\n')}

View your full dashboard at: https://michiganspots.com/dashboard?partner=${reportData.partnerId}

Questions? Contact us at partners@michiganspots.com

---
Michigan Spots | https://michiganspots.com | r/michiganspots
© 2025 Cozyartz Media Group | Battle Creek, Michigan
  `;

  // Send email
  const emailSent = await sendEmail({
    to: reportData.email,
    subject,
    text,
    html
  }, env);

  // Log the report
  await db.prepare(`
    INSERT INTO partner_reports_sent
    (partner_id, report_type, period_start, period_end, sent_at, email_to, report_data, delivery_status)
    VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?)
  `).bind(
    reportData.partnerId,
    reportType,
    reportData.periodStart,
    reportData.periodEnd,
    reportData.email,
    JSON.stringify(reportData.metrics),
    emailSent ? 'sent' : 'failed'
  ).run();

  return emailSent;
}

export async function sendAllPartnerReports(
  reportType: 'weekly' | 'monthly' | 'quarterly',
  env: Env
): Promise<{ sent: number; failed: number }> {
  const db = env.DB;

  // Get all active partners
  const partners = await db.prepare(`
    SELECT id FROM partnership_activations
    WHERE is_active = 1
    ORDER BY id
  `).all();

  let sent = 0;
  let failed = 0;

  for (const partner of partners.results) {
    try {
      const reportData = await generatePartnerReport(
        partner.id as number,
        reportType,
        env
      );

      if (reportData) {
        const success = await sendPartnerReport(reportData, reportType, env);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      }
    } catch (error) {
      console.error(`Failed to send report for partner ${partner.id}:`, error);
      failed++;
    }
  }

  return { sent, failed };
}
