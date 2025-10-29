/**
 * Reddit Sync API: Challenge Progress
 *
 * Receives challenge progress data from Reddit Devvit app
 * Endpoint: POST /api/challenges/sync-progress
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface GPS {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface ChallengeProgress {
  challengeId: string;
  completedLandmarks: string[];
  totalScore: number;
  completedAt: number | null;
}

interface ChallengeProgressRequest {
  username: string;
  challengeId: string;
  landmarkName: string;
  photoScore: number;
  gps?: GPS;
  progress: ChallengeProgress;
  challengeCompleted: boolean;
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

    const body = await context.request.json() as ChallengeProgressRequest;

    // Validate required fields
    if (!body.username || !body.challengeId || !body.landmarkName || body.photoScore === undefined || !body.progress || !body.timestamp) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: username, challengeId, landmarkName, photoScore, progress, timestamp'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const startTime = Date.now();

    // Insert or update challenge progress
    await db.prepare(`
      INSERT INTO challenge_progress
      (username, challenge_id, landmark_name, photo_score, gps_latitude, gps_longitude, gps_accuracy,
       completed_landmarks, total_score, challenge_completed, completed_at, timestamp, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username, challenge_id, landmark_name) DO UPDATE SET
        photo_score = excluded.photo_score,
        gps_latitude = excluded.gps_latitude,
        gps_longitude = excluded.gps_longitude,
        gps_accuracy = excluded.gps_accuracy,
        completed_landmarks = excluded.completed_landmarks,
        total_score = excluded.total_score,
        challenge_completed = excluded.challenge_completed,
        completed_at = excluded.completed_at,
        timestamp = excluded.timestamp,
        source = excluded.source
    `).bind(
      body.username,
      body.challengeId,
      body.landmarkName,
      body.photoScore,
      body.gps?.latitude || null,
      body.gps?.longitude || null,
      body.gps?.accuracy || null,
      JSON.stringify(body.progress.completedLandmarks),
      body.progress.totalScore,
      body.challengeCompleted ? 1 : 0,
      body.progress.completedAt || null,
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
      '/api/challenges/sync-progress',
      'success',
      1,
      duration,
      Date.now()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Challenge progress synced successfully',
      challengeCompleted: body.challengeCompleted
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing challenge progress:', error);

    // Track sync error
    try {
      await db.prepare(`
        INSERT INTO sync_status
        (endpoint, status, error_message, timestamp)
        VALUES (?, ?, ?, ?)
      `).bind(
        '/api/challenges/sync-progress',
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
