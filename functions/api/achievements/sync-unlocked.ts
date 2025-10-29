/**
 * Reddit Sync API: Achievement Unlocks
 *
 * Receives achievement unlock data from Reddit Devvit app
 * Endpoint: POST /api/achievements/sync-unlocked
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt: number;
}

interface AchievementUnlockRequest {
  username: string;
  newlyUnlocked: Achievement[];
  totalUnlocked: number;
  totalAchievements: number;
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

    const body = await context.request.json() as AchievementUnlockRequest;

    // Validate required fields
    if (!body.username || !body.newlyUnlocked || !Array.isArray(body.newlyUnlocked) || !body.timestamp) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: username, newlyUnlocked, timestamp'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();

    // Insert each newly unlocked achievement
    let insertedCount = 0;
    for (const achievement of body.newlyUnlocked) {
      try {
        await db.prepare(`
          INSERT INTO achievement_unlocks
          (username, achievement_id, achievement_name, achievement_description, achievement_icon,
           achievement_points, unlocked_at, timestamp, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(username, achievement_id) DO UPDATE SET
            achievement_name = excluded.achievement_name,
            achievement_description = excluded.achievement_description,
            achievement_icon = excluded.achievement_icon,
            achievement_points = excluded.achievement_points,
            unlocked_at = excluded.unlocked_at,
            timestamp = excluded.timestamp,
            source = excluded.source
        `).bind(
          body.username,
          achievement.id,
          achievement.name,
          achievement.description,
          achievement.icon,
          achievement.points,
          achievement.unlockedAt,
          body.timestamp,
          body.source || 'reddit-devvit'
        ).run();
        insertedCount++;
      } catch (error) {
        console.error(`Error inserting achievement ${achievement.id} for ${body.username}:`, error);
      }
    }

    const duration = Date.now() - startTime;

    // Track sync status
    await db.prepare(`
      INSERT INTO sync_status
      (endpoint, status, record_count, duration_ms, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      '/api/achievements/sync-unlocked',
      'success',
      insertedCount,
      duration,
      Date.now()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Achievement unlocks synced successfully',
      inserted: insertedCount,
      total: body.newlyUnlocked.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing achievement unlocks:', error);

    // Track sync error
    try {
      await db.prepare(`
        INSERT INTO sync_status
        (endpoint, status, error_message, timestamp)
        VALUES (?, ?, ?, ?)
      `).bind(
        '/api/achievements/sync-unlocked',
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
