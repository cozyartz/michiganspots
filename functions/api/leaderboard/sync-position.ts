/**
 * Reddit Sync API: Leaderboard Position
 *
 * Receives individual leaderboard position from Reddit Devvit app
 * Endpoint: POST /api/leaderboard/sync-position
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface LeaderboardPositionRequest {
  username: string;
  game: 'photo-hunt' | 'trivia' | 'word-search' | 'memory-match' | 'overall';
  score: number;
  totalScore?: number;
  globalRank: number;
  timestamp: number;
  source?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    // Verify API key from Reddit Devvit app
    const apiKey = context.request.headers.get('X-API-Key');
    const expectedKey = context.env.DEVVIT_API_KEY;

    if (!apiKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json() as LeaderboardPositionRequest;

    // Validate required fields
    if (!body.username || !body.game || body.score === undefined || body.globalRank === undefined || !body.timestamp) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: username, game, score, globalRank, timestamp'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();

    // Determine period keys
    const date = new Date(body.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const week = getWeekNumber(date);

    // Insert leaderboard positions for all time periods
    const periods = [
      { period: 'alltime', periodKey: 'alltime' },
      { period: 'weekly', periodKey: `${year}-W${week}` },
      { period: 'monthly', periodKey: `${year}-${month}` }
    ];

    for (const { period, periodKey } of periods) {
      await db.prepare(`
        INSERT INTO leaderboard_positions
        (username, game, period, period_key, score, total_score, rank, timestamp, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(username, game, period_key) DO UPDATE SET
          score = excluded.score,
          total_score = excluded.total_score,
          rank = excluded.rank,
          timestamp = excluded.timestamp,
          source = excluded.source
      `).bind(
        body.username,
        body.game,
        period,
        periodKey,
        body.score,
        body.totalScore || null,
        body.globalRank,
        body.timestamp,
        body.source || 'reddit-devvit'
      ).run();
    }

    const duration = Date.now() - startTime;

    // Track sync status
    await db.prepare(`
      INSERT INTO sync_status
      (endpoint, status, record_count, duration_ms, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      '/api/leaderboard/sync-position',
      'success',
      periods.length,
      duration,
      Date.now()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Leaderboard position synced successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing leaderboard position:', error);

    // Track sync error
    try {
      await db.prepare(`
        INSERT INTO sync_status
        (endpoint, status, error_message, timestamp)
        VALUES (?, ?, ?, ?)
      `).bind(
        '/api/leaderboard/sync-position',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        Date.now()
      ).run();
    } catch (logError) {
      console.error('Error logging sync status:', logError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper function to get ISO week number
function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return String(weekNo).padStart(2, '0');
}
