/**
 * Reddit Sync API: Game Completion
 *
 * Receives game completion data from Reddit Devvit app
 * Endpoint: POST /api/analytics/game-complete
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface GameCompleteRequest {
  username: string;
  game: 'photo-hunt' | 'trivia' | 'word-search' | 'memory-match';
  score: number;
  quality?: number;
  michiganRelevance?: number;
  landmarkBonus?: number;
  creativity?: number;
  postId?: string;
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

    const body = await context.request.json() as GameCompleteRequest;

    // Validate required fields
    if (!body.username || !body.game || body.score === undefined || !body.timestamp) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: username, game, score, timestamp'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();

    // Insert game completion
    await db.prepare(`
      INSERT INTO game_completions
      (username, game, score, quality, michigan_relevance, landmark_bonus, creativity, post_id, timestamp, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.username,
      body.game,
      body.score,
      body.quality || 0,
      body.michiganRelevance || 0,
      body.landmarkBonus || 0,
      body.creativity || 0,
      body.postId || null,
      body.timestamp,
      body.source || 'reddit-devvit'
    ).run();

    const duration = Date.now() - startTime;

    // Track sync status
    await db.prepare(`
      INSERT INTO sync_status
      (endpoint, status, record_count, duration_ms, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      '/api/analytics/game-complete',
      'success',
      1,
      duration,
      Date.now()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Game completion synced successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing game completion:', error);

    // Track sync error
    try {
      await db.prepare(`
        INSERT INTO sync_status
        (endpoint, status, error_message, timestamp)
        VALUES (?, ?, ?, ?)
      `).bind(
        '/api/analytics/game-complete',
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
