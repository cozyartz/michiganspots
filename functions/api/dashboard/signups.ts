/**
 * Admin Dashboard API: All Signups
 *
 * Returns all signups (waitlist + partners) for admin dashboard
 * Endpoint: GET /api/dashboard/signups
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    // TODO: Add admin authentication here
    // For now, just return the data

    // Get all signups using the view
    const signups = await db.prepare(`
      SELECT * FROM admin_signups_dashboard
      ORDER BY created_at DESC
    `).all();

    // Get summary stats
    const stats = await db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM signups) as waitlist_count,
        (SELECT COUNT(*) FROM partnership_activations) as partner_count,
        (SELECT COUNT(*) FROM partnership_activations WHERE agreement_accepted = 1) as partners_signed,
        (SELECT COALESCE(SUM(amount), 0) FROM partner_payments) as total_revenue
    `).first();

    return new Response(JSON.stringify({
      success: true,
      data: {
        signups: signups.results,
        stats: stats
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching signups:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
