/**
 * Daily Analytics Aggregation Worker
 *
 * Scheduled Cloudflare Worker that aggregates raw engagement events
 * into partner_analytics_daily table for efficient reporting
 *
 * Schedule: Runs daily at 2 AM EST (7 AM UTC)
 */

import type { Env } from '../../../types/cloudflare';

export async function aggregateDailyAnalytics(env: Env): Promise<{ success: boolean; processed: number }> {
  const db = env.DB;

  try {
    // Get yesterday's date (the day we're aggregating)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`Starting daily analytics aggregation for ${dateStr}`);

    // Get all active partners
    const partners = await db.prepare(`
      SELECT id FROM partnership_activations
      WHERE is_active = 1
    `).all();

    let processed = 0;

    for (const partner of partners.results) {
      const partnerId = partner.id as number;

      // Aggregate metrics for this partner for yesterday
      const metrics = await db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN ee.event_type = 'view' THEN 1 ELSE 0 END), 0) as views,
          COALESCE(SUM(CASE WHEN ee.event_type = 'completion' THEN 1 ELSE 0 END), 0) as completions,
          COALESCE(SUM(CASE WHEN ee.event_type = 'comment' THEN 1 ELSE 0 END), 0) as comments,
          COALESCE(SUM(CASE WHEN ee.event_type = 'upvote' THEN 1 ELSE 0 END), 0) as upvotes,
          COALESCE(SUM(CASE WHEN ee.event_type = 'share' THEN 1 ELSE 0 END), 0) as shares,
          COALESCE(SUM(CASE WHEN ee.event_type = 'award' THEN 1 ELSE 0 END), 0) as awards,
          COUNT(DISTINCT ee.user_reddit_username) as unique_participants
        FROM engagement_events ee
        LEFT JOIN challenges c ON ee.challenge_id = c.id
        WHERE c.sponsor_id = ?
        AND DATE(ee.created_at) = ?
      `).bind(partnerId, dateStr).first();

      // Check if record already exists for this date
      const existing = await db.prepare(`
        SELECT id FROM partner_analytics_daily
        WHERE partner_id = ? AND date = ?
      `).bind(partnerId, dateStr).first();

      if (existing) {
        // Update existing record
        await db.prepare(`
          UPDATE partner_analytics_daily
          SET
            challenge_views = ?,
            challenge_completions = ?,
            challenge_comments = ?,
            challenge_upvotes = ?,
            challenge_shares = ?,
            challenge_awards = ?,
            unique_participants = ?,
            updated_at = datetime('now')
          WHERE partner_id = ? AND date = ?
        `).bind(
          metrics?.views || 0,
          metrics?.completions || 0,
          metrics?.comments || 0,
          metrics?.upvotes || 0,
          metrics?.shares || 0,
          metrics?.awards || 0,
          metrics?.unique_participants || 0,
          partnerId,
          dateStr
        ).run();
      } else {
        // Insert new record
        await db.prepare(`
          INSERT INTO partner_analytics_daily
          (partner_id, date, challenge_views, challenge_completions, challenge_comments,
           challenge_upvotes, challenge_shares, challenge_awards, unique_participants,
           created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          partnerId,
          dateStr,
          metrics?.views || 0,
          metrics?.completions || 0,
          metrics?.comments || 0,
          metrics?.upvotes || 0,
          metrics?.shares || 0,
          metrics?.awards || 0,
          metrics?.unique_participants || 0
        ).run();
      }

      processed++;
    }

    console.log(`Completed daily analytics aggregation. Processed ${processed} partners.`);

    return { success: true, processed };
  } catch (error) {
    console.error('Error aggregating daily analytics:', error);
    throw error;
  }
}

// Cloudflare Scheduled Handler
export const onRequestGet = async (context: any) => {
  try {
    const result = await aggregateDailyAnalytics(context.env);

    return new Response(JSON.stringify({
      success: true,
      message: `Aggregated analytics for ${result.processed} partners`,
      ...result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to aggregate analytics'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
