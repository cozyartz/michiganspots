/**
 * Database Tables API
 *
 * Lists all tables in the D1 database
 * Endpoint: GET /api/database/tables
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    // TODO: Add admin authentication here

    // Get all tables from sqlite_master
    const result = await db.prepare(`
      SELECT
        name,
        type,
        sql
      FROM sqlite_master
      WHERE type IN ('table', 'view')
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_cf_%'
      ORDER BY name
    `).all();

    return new Response(JSON.stringify({
      success: true,
      data: {
        tables: result.results,
        count: result.results.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch tables'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
