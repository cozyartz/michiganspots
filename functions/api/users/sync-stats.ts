/**
 * Reddit Sync API: User Statistics
 *
 * Receives user statistics from Reddit Devvit app
 * Endpoint: POST /api/users/sync-stats
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface GameBreakdown {
  plays: number;
  totalScore: number;
  bestScore: number;
}

interface UserStatsRequest {
  username: string;
  stats: {
    totalScore: number;
    gamesPlayed: number;
    gameBreakdown: {
      [game: string]: GameBreakdown;
    };
    globalRank?: number;
    lastPlayed: number;
    lastUpdated: number;
    source?: string;
  };
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

    const body = await context.request.json() as UserStatsRequest;

    // Validate required fields
    if (!body.username || !body.stats) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: username, stats'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();

    // Upsert user statistics
    await db.prepare(`
      INSERT INTO user_statistics
      (username, total_score, games_played, game_breakdown, global_rank, last_played, last_updated, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        total_score = excluded.total_score,
        games_played = excluded.games_played,
        game_breakdown = excluded.game_breakdown,
        global_rank = excluded.global_rank,
        last_played = excluded.last_played,
        last_updated = excluded.last_updated,
        source = excluded.source
    `).bind(
      body.username,
      body.stats.totalScore,
      body.stats.gamesPlayed,
      JSON.stringify(body.stats.gameBreakdown),
      body.stats.globalRank || null,
      body.stats.lastPlayed,
      body.stats.lastUpdated,
      body.stats.source || 'reddit-devvit'
    ).run();

    const duration = Date.now() - startTime;

    // Track sync status
    await db.prepare(`
      INSERT INTO sync_status
      (endpoint, status, record_count, duration_ms, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      '/api/users/sync-stats',
      'success',
      1,
      duration,
      Date.now()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'User statistics synced successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing user statistics:', error);

    // Track sync error
    try {
      await db.prepare(`
        INSERT INTO sync_status
        (endpoint, status, error_message, timestamp)
        VALUES (?, ?, ?, ?)
      `).bind(
        '/api/users/sync-stats',
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
