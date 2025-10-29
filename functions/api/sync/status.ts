/**
 * Reddit Sync API: Sync Status Check
 *
 * Returns sync system health and statistics
 * Endpoint: GET /api/sync/status
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    // Get recent sync status (last 100 records)
    const recentSyncs = await db.prepare(`
      SELECT endpoint, status, record_count, error_message, duration_ms, timestamp
      FROM sync_status
      ORDER BY timestamp DESC
      LIMIT 100
    `).all();

    // Count records in each table
    const userStats = await db.prepare(`SELECT COUNT(*) as count FROM user_statistics`).first<{ count: number }>();
    const challengeProgress = await db.prepare(`SELECT COUNT(*) as count FROM challenge_progress`).first<{ count: number }>();
    const achievements = await db.prepare(`SELECT COUNT(*) as count FROM achievement_unlocks`).first<{ count: number }>();
    const gameCompletions = await db.prepare(`SELECT COUNT(*) as count FROM game_completions`).first<{ count: number }>();

    // Check for recent errors
    const recentErrors = await db.prepare(`
      SELECT COUNT(*) as count
      FROM sync_status
      WHERE status = 'error' AND timestamp > ?
    `).bind(Date.now() - 3600000).first<{ count: number }>(); // Last hour

    const hasErrors = (recentErrors?.count || 0) > 0;

    return new Response(JSON.stringify({
      status: hasErrors ? 'warning' : 'success',
      message: hasErrors ? 'Sync system operational with recent errors' : 'Sync system operational',
      cloudflareSync: true,
      dataStats: {
        users: userStats?.count || 0,
        challengeProgress: challengeProgress?.count || 0,
        achievements: achievements?.count || 0,
        gameCompletions: gameCompletions?.count || 0
      },
      recentSyncs: recentSyncs.results,
      recentErrors: recentErrors?.count || 0,
      lastChecked: Date.now()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to check sync status',
      cloudflareSync: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: Date.now()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
