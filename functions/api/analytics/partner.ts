/**
 * Partner Analytics API
 *
 * Returns analytics for a specific partner
 * Endpoint: GET /api/analytics/partner?id=123
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    // Get partner ID from query params
    const url = new URL(context.request.url);
    const partnerId = url.searchParams.get('id');

    if (!partnerId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing partner ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: Add partner authentication - verify the partner can only see their own data

    // Get partner info with worker integration fields
    const partner = await db.prepare(`
      SELECT
        pa.*,
        sc.organization_name,
        sc.email,
        ps.worker_partner_id,
        ps.worker_page_url,
        ps.worker_qr_code_url,
        ps.worker_qr_download_url,
        ps.worker_analytics_url,
        ps.worker_onboarded_at,
        ps.worker_status
      FROM partnership_activations pa
      LEFT JOIN stripe_customers sc ON pa.stripe_customer_id = sc.stripe_customer_id
      LEFT JOIN partner_signups ps ON pa.email = ps.email
      WHERE pa.id = ?
    `).bind(partnerId).first();

    if (!partner) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Partner not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if partnership is past due (more than 10 days after end date)
    if (partner.ends_at) {
      const endsAt = new Date(partner.ends_at as string);
      const gracePeriodEnd = new Date(endsAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 10); // 10 day grace period

      const now = new Date();

      if (now > gracePeriodEnd) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Your partnership payment is overdue. Please contact us to renew your partnership.',
          past_due: true
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Get partner's challenges
    const challenges = await db.prepare(`
      SELECT * FROM challenges
      WHERE sponsor_id = ?
      ORDER BY created_at DESC
    `).bind(partnerId).all();

    // Get daily analytics for last 30 days
    const dailyAnalytics = await db.prepare(`
      SELECT * FROM partner_analytics_daily
      WHERE partner_id = ?
      AND date >= date('now', '-30 days')
      ORDER BY date DESC
    `).bind(partnerId).all();

    // Get total metrics
    const totalMetrics = await db.prepare(`
      SELECT
        SUM(challenge_views) as total_views,
        SUM(challenge_completions) as total_completions,
        SUM(challenge_comments) as total_comments,
        SUM(challenge_upvotes) as total_upvotes,
        SUM(challenge_shares) as total_shares,
        SUM(unique_participants) as total_unique_participants
      FROM partner_analytics_daily
      WHERE partner_id = ?
    `).bind(partnerId).first();

    // Get recent completions
    const recentCompletions = await db.prepare(`
      SELECT
        cc.*,
        c.title as challenge_title
      FROM challenge_completions cc
      LEFT JOIN challenges c ON cc.challenge_id = c.id
      WHERE c.sponsor_id = ?
      ORDER BY cc.completed_at DESC
      LIMIT 10
    `).bind(partnerId).all();

    return new Response(JSON.stringify({
      success: true,
      data: {
        partner: partner,
        challenges: challenges.results,
        dailyAnalytics: dailyAnalytics.results,
        totalMetrics: totalMetrics,
        recentCompletions: recentCompletions.results
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching partner analytics:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
