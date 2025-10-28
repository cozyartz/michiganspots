/**
 * Database Tables API
 * Lists all tables in the D1 database
 * Endpoint: GET /api/database/tables
 */
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Database not available'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // TODO: Add admin authentication here

    const db = env.DB as D1Database;

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
