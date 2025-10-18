/**
 * Database Query API
 *
 * Executes custom SQL queries against D1 database
 * Endpoint: POST /api/database/query
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

interface QueryRequest {
  query: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    // TODO: Add admin authentication here

    const body = await context.request.json() as QueryRequest;

    if (!body.query || typeof body.query !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Basic SQL injection protection - only allow SELECT queries for now
    const normalizedQuery = body.query.trim().toLowerCase();
    if (!normalizedQuery.startsWith('select')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only SELECT queries are allowed for safety. Use Wrangler CLI for INSERT/UPDATE/DELETE operations.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Execute query with timing
    const startTime = Date.now();
    const result = await db.prepare(body.query).all();
    const executionTime = Date.now() - startTime;

    // Extract column names from first row
    const columns = result.results.length > 0
      ? Object.keys(result.results[0])
      : [];

    return new Response(JSON.stringify({
      success: true,
      data: {
        columns,
        rows: result.results,
        rowCount: result.results.length,
        executionTime
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error executing query:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Query execution failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
