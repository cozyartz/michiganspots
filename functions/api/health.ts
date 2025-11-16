/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

/**
 * Reddit Sync API: Health Check
 *
 * Basic health check endpoint for monitoring
 * Endpoint: GET /api/health
 */

import type { PagesFunction, Env } from '../../types/cloudflare';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    // Verify API key
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

    // Test database connectivity
    const result = await db.prepare('SELECT 1 as health').first<{ health: number }>();
    const dbHealthy = result?.health === 1;

    // Get recent sync errors
    const recentErrors = await db.prepare(`
      SELECT COUNT(*) as count
      FROM sync_status
      WHERE status = 'error' AND timestamp > ?
    `).bind(Date.now() - 3600000).first<{ count: number }>(); // Last hour

    const hasRecentErrors = (recentErrors?.count || 0) > 0;

    return new Response(JSON.stringify({
      status: dbHealthy && !hasRecentErrors ? 'healthy' : 'degraded',
      database: dbHealthy ? 'connected' : 'disconnected',
      sync: hasRecentErrors ? 'errors_detected' : 'operational',
      timestamp: Date.now(),
      version: '1.0.0'
    }), {
      status: dbHealthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
