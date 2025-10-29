/**
 * Reddit Sync API: Bulk Leaderboard Sync
 *
 * Receives bulk leaderboard data from Reddit Devvit app
 * Endpoint: POST /api/leaderboard/sync-bulk
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface LeaderboardScore {
  rank: number;
  username: string;
  score: number;
  timestamp: number;
  game: string;
}

interface BulkLeaderboardRequest {
  game: 'photo-hunt' | 'trivia' | 'word-search' | 'memory-match' | 'overall';
  period: string;
  periodKey: string;
  scores: LeaderboardScore[];
  lastSynced: number;
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

    const body = await context.request.json() as BulkLeaderboardRequest;

    // Validate required fields
    if (!body.game || !body.period || !body.periodKey || !body.scores || !Array.isArray(body.scores)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: game, period, periodKey, scores'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();

    // Process bulk insert
    let insertedCount = 0;
    for (const score of body.scores) {
      try {
        await db.prepare(`
          INSERT INTO leaderboard_positions
          (username, game, period, period_key, score, rank, timestamp, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(username, game, period_key) DO UPDATE SET
            score = excluded.score,
            rank = excluded.rank,
            timestamp = excluded.timestamp,
            source = excluded.source
        `).bind(
          score.username,
          body.game,
          body.period,
          body.periodKey,
          score.score,
          score.rank,
          score.timestamp,
          body.source || 'reddit-devvit-bulk'
        ).run();
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting score for ${score.username}:`, error);
      }
    }

    const duration = Date.now() - startTime;

    // Track sync status
    await db.prepare(`
      INSERT INTO sync_status
      (endpoint, status, record_count, duration_ms, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      '/api/leaderboard/sync-bulk',
      'success',
      insertedCount,
      duration,
      Date.now()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Bulk leaderboard synced successfully',
      inserted: insertedCount,
      total: body.scores.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing bulk leaderboard:', error);

    // Track sync error
    try {
      await db.prepare(`
        INSERT INTO sync_status
        (endpoint, status, error_message, timestamp)
        VALUES (?, ?, ?, ?)
      `).bind(
        '/api/leaderboard/sync-bulk',
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
