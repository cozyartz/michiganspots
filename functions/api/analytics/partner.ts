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

    // Get partner info
    const partner = await db.prepare(`
      SELECT
        pa.*,
        sc.organization_name,
        sc.email
      FROM partnership_activations pa
      LEFT JOIN stripe_customers sc ON pa.stripe_customer_id = sc.stripe_customer_id
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
