/**
 * Reddit Sync API: Full Data Sync
 *
 * Comprehensive data synchronization endpoint
 * Endpoint: POST /api/sync/cloudflare
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface SyncRequest {
  syncType: 'full' | 'users' | 'leaderboards' | 'challenges' | 'achievements';
  username?: string;
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

    const body = await context.request.json() as SyncRequest;

    // Validate sync type
    const validSyncTypes = ['full', 'users', 'leaderboards', 'challenges', 'achievements'];
    if (!body.syncType || !validSyncTypes.includes(body.syncType)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid syncType. Must be: full, users, leaderboards, challenges, or achievements'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results: Record<string, number> = {};
    const errors: string[] = [];
    const startTime = Date.now();

    // Determine which tables to sync
    const syncUsers = body.syncType === 'full' || body.syncType === 'users';
    const syncLeaderboards = body.syncType === 'full' || body.syncType === 'leaderboards';
    const syncChallenges = body.syncType === 'full' || body.syncType === 'challenges';
    const syncAchievements = body.syncType === 'full' || body.syncType === 'achievements';

    // Sync users
    if (syncUsers) {
      try {
        let query = 'SELECT COUNT(*) as count FROM user_statistics';
        if (body.username) {
          query += ` WHERE username = '${body.username}'`;
        }
        const result = await db.prepare(query).first<{ count: number }>();
        results.users = result?.count || 0;
      } catch (error) {
        errors.push(`Users sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Sync leaderboards
    if (syncLeaderboards) {
      try {
        let query = 'SELECT COUNT(*) as count FROM leaderboard_positions';
        if (body.username) {
          query += ` WHERE username = '${body.username}'`;
        }
        const result = await db.prepare(query).first<{ count: number }>();
        results.scores = result?.count || 0;
      } catch (error) {
        errors.push(`Leaderboard sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Sync challenges
    if (syncChallenges) {
      try {
        let query = 'SELECT COUNT(*) as count FROM challenge_progress';
        if (body.username) {
          query += ` WHERE username = '${body.username}'`;
        }
        const result = await db.prepare(query).first<{ count: number }>();
        results.challenges = result?.count || 0;
      } catch (error) {
        errors.push(`Challenge sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Sync achievements
    if (syncAchievements) {
      try {
        let query = 'SELECT COUNT(*) as count FROM achievement_unlocks';
        if (body.username) {
          query += ` WHERE username = '${body.username}'`;
        }
        const result = await db.prepare(query).first<{ count: number }>();
        results.achievements = result?.count || 0;
      } catch (error) {
        errors.push(`Achievement sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const duration = Date.now() - startTime;

    // Track sync status
    await db.prepare(`
      INSERT INTO sync_status
      (endpoint, status, record_count, duration_ms, timestamp, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      '/api/sync/cloudflare',
      errors.length > 0 ? 'warning' : 'success',
      Object.values(results).reduce((a, b) => a + b, 0),
      duration,
      Date.now(),
      errors.length > 0 ? errors.join('; ') : null
    ).run();

    return new Response(JSON.stringify({
      status: errors.length > 0 ? 'warning' : 'success',
      message: errors.length > 0
        ? 'Data synced to Cloudflare with some errors'
        : 'Data synced to Cloudflare successfully',
      results,
      errors,
      syncType: body.syncType,
      username: body.username || null,
      duration
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing data to Cloudflare:', error);

    // Track sync error
    try {
      await db.prepare(`
        INSERT INTO sync_status
        (endpoint, status, error_message, timestamp)
        VALUES (?, ?, ?, ?)
      `).bind(
        '/api/sync/cloudflare',
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
