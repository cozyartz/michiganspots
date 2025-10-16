/**
 * Cloudflare Workers Scheduled Jobs
 *
 * Handles cron-triggered tasks:
 * - Weekly partner reports (every Monday at 9 AM)
 * - Monthly partner reports (1st of month at 9 AM)
 * - Daily analytics aggregation (every 6 hours)
 */

import type { Env } from '../types/cloudflare';
import { sendAllPartnerReports } from './utils/partnerReports';

export const onScheduled: ExportedHandlerScheduledHandler<Env> = async (
  event,
  env,
  ctx
) => {
  const cron = event.cron;

  console.log(`Running scheduled job: ${cron}`);

  try {
    // Weekly reports - Every Monday at 9 AM UTC
    if (cron === '0 9 * * MON') {
      console.log('Sending weekly partner reports...');
      const results = await sendAllPartnerReports('weekly', env);
      console.log(`Weekly reports sent: ${results.sent}, failed: ${results.failed}`);
    }

    // Monthly reports - 1st of every month at 9 AM UTC
    if (cron === '0 9 1 * *') {
      console.log('Sending monthly partner reports...');
      const results = await sendAllPartnerReports('monthly', env);
      console.log(`Monthly reports sent: ${results.sent}, failed: ${results.failed}`);
    }

    // Analytics aggregation - Every 6 hours
    if (cron === '0 */6 * * *') {
      console.log('Aggregating analytics...');
      await aggregateDailyAnalytics(env);
      console.log('Analytics aggregation complete');
    }
  } catch (error) {
    console.error('Error in scheduled job:', error);
    // Don't throw - let the job complete even if there's an error
  }
};

/**
 * Aggregate engagement events into daily partner analytics
 */
async function aggregateDailyAnalytics(env: Env) {
  const db = env.DB;

  // Get yesterday's date (we aggregate the previous day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

  // Get all active partners
  const partners = await db.prepare(`
    SELECT id FROM partnership_activations
    WHERE is_active = 1
  `).all();

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

    // Insert or update daily analytics
    await db.prepare(`
      INSERT INTO partner_analytics_daily
      (partner_id, date, challenge_views, challenge_completions, challenge_comments,
       challenge_upvotes, challenge_shares, challenge_awards, unique_participants, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(partner_id, date) DO UPDATE SET
        challenge_views = excluded.challenge_views,
        challenge_completions = excluded.challenge_completions,
        challenge_comments = excluded.challenge_comments,
        challenge_upvotes = excluded.challenge_upvotes,
        challenge_shares = excluded.challenge_shares,
        challenge_awards = excluded.challenge_awards,
        unique_participants = excluded.unique_participants,
        updated_at = datetime('now')
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
}

// Export handler type for TypeScript
declare global {
  type ExportedHandlerScheduledHandler<Env = unknown> = (
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ) => void | Promise<void>;
}

interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}
