/**
 * Super Admin Dashboard API
 *
 * Returns comprehensive platform analytics for super admin
 * Endpoint: GET /api/dashboard/superadmin
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    // TODO: Add super admin authentication here
    // For now, just return the data

    // Get all signups using the view
    const signups = await db.prepare(`
      SELECT * FROM admin_signups_dashboard
      ORDER BY created_at DESC
    `).all();

    // Get comprehensive stats
    const stats = await db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM signups) as waitlist_count,
        (SELECT COUNT(*) FROM partnership_activations) as partner_count,
        (SELECT COUNT(*) FROM partnership_activations WHERE agreement_accepted = 1) as partners_signed,
        (SELECT COALESCE(SUM(amount), 0) FROM partner_payments) as total_revenue,
        (SELECT COUNT(*) FROM challenges) as total_challenges,
        (SELECT COUNT(*) FROM challenges WHERE status = 'active') as active_challenges,
        (SELECT COALESCE(SUM(challenge_completions), 0) FROM partner_analytics_daily) as total_completions,
        (SELECT COALESCE(SUM(challenge_views), 0) FROM partner_analytics_daily) as total_views,
        (SELECT COUNT(DISTINCT user_reddit_username) FROM challenge_completions) as total_unique_users
    `).first();

    // Get top performing partners
    const topPerformingPartners = await db.prepare(`
      SELECT
        sc.organization_name,
        COALESCE(SUM(pad.challenge_completions), 0) as completions,
        COALESCE(SUM(pad.challenge_views), 0) as views,
        CASE
          WHEN SUM(pad.challenge_views) > 0
          THEN (CAST(SUM(pad.challenge_completions) AS REAL) / SUM(pad.challenge_views)) * 100
          ELSE 0
        END as engagement_rate
      FROM partnership_activations pa
      LEFT JOIN stripe_customers sc ON pa.stripe_customer_id = sc.stripe_customer_id
      LEFT JOIN partner_analytics_daily pad ON pa.id = pad.partner_id
      WHERE pa.is_active = 1
      GROUP BY pa.id, sc.organization_name
      HAVING completions > 0
      ORDER BY completions DESC
      LIMIT 10
    `).all();

    // Calculate platform metrics
    const totalViews = (stats?.total_views as number) || 0;
    const totalCompletions = (stats?.total_completions as number) || 0;
    const avgEngagementRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;

    const platformMetrics = {
      avgEngagementRate,
      avgCostPerVisit: 0, // Calculate based on actual partner payments
      totalFootTraffic: totalCompletions,
      growthRate: 0 // TODO: Calculate growth rate from historical data
    };

    return new Response(JSON.stringify({
      success: true,
      data: {
        signups: signups.results,
        stats: stats,
        topPerformingPartners: topPerformingPartners.results,
        platformMetrics: platformMetrics,
        recentActivity: [] // TODO: Implement recent activity feed
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching super admin dashboard:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
