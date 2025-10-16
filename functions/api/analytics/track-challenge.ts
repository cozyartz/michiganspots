/**
 * Analytics API: Track Challenge Completion
 *
 * Receives challenge completion events from Devvit app
 * Endpoint: POST /api/analytics/track-challenge
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface ChallengeCompletionRequest {
  challengeId: number;
  userRedditUsername: string;
  submissionUrl: string;
  submissionType: 'post' | 'comment';
  completedAt: string; // ISO 8601 timestamp
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    // Verify API key from Devvit app
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

    const body = await context.request.json() as ChallengeCompletionRequest;

    // Validate required fields
    if (!body.challengeId || !body.userRedditUsername || !body.completedAt) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert challenge completion
    await db.prepare(`
      INSERT INTO challenge_completions
      (challenge_id, user_reddit_username, completed_at, submission_url, submission_type, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      body.challengeId,
      body.userRedditUsername,
      body.completedAt,
      body.submissionUrl || null,
      body.submissionType || 'post'
    ).run();

    // Also log as engagement event
    await db.prepare(`
      INSERT INTO engagement_events
      (event_type, challenge_id, user_reddit_username, post_id, created_at)
      VALUES ('completion', ?, ?, ?, datetime('now'))
    `).bind(
      body.challengeId,
      body.userRedditUsername,
      body.submissionUrl || null
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Challenge completion tracked'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error tracking challenge completion:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
