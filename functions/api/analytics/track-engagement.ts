/**
 * Analytics API: Track Engagement Event
 *
 * Receives engagement events from Devvit app (views, comments, upvotes, etc.)
 * Endpoint: POST /api/analytics/track-engagement
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface EngagementEventRequest {
  eventType: 'view' | 'comment' | 'upvote' | 'share' | 'award';
  challengeId?: number;
  spotId?: number;
  userRedditUsername?: string;
  postId?: string;
  commentId?: string;
  eventData?: Record<string, any>;
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

    const body = await context.request.json() as EngagementEventRequest;

    // Validate required fields
    if (!body.eventType) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing eventType'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert engagement event
    await db.prepare(`
      INSERT INTO engagement_events
      (event_type, challenge_id, spot_id, user_reddit_username, post_id, comment_id, event_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      body.eventType,
      body.challengeId || null,
      body.spotId || null,
      body.userRedditUsername || null,
      body.postId || null,
      body.commentId || null,
      body.eventData ? JSON.stringify(body.eventData) : null
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Engagement event tracked'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error tracking engagement event:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
