/**
 * Partner Magic Link Verification
 *
 * Verifies magic link token and creates partner session
 * Endpoint: POST /api/partner-auth/verify-magic-link
 */

import type { PagesFunction, Env } from '../../../types/cloudflare';
import { createSession, createSessionCookie } from '../../utils/auth-helpers';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;

  try {
    const body = await context.request.json() as { token: string };

    if (!body.token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find valid magic link
    const magicLink = await db.prepare(`
      SELECT
        ml.id as magic_link_id,
        ml.partner_id,
        ml.expires_at,
        ml.used_at,
        pa.id as partnership_id,
        pa.email,
        pa.organization_name,
        pa.is_active,
        pa.ends_at,
        pa.payment_status
      FROM partner_magic_links ml
      INNER JOIN partnership_activations pa ON ml.partner_id = pa.id
      WHERE ml.token = ?
      AND pa.is_active = 1
    `).bind(body.token).first();

    if (!magicLink) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid or expired magic link'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if partnership is past due (more than 10 days after end date)
    if (magicLink.ends_at) {
      const partnershipEndsAt = new Date(magicLink.ends_at as string);
      const gracePeriodEnd = new Date(partnershipEndsAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 10); // 10 day grace period

      const now = new Date();

      if (now > gracePeriodEnd) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Your partnership payment is overdue. Please contact us to renew your partnership.'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if already used
    if (magicLink.used_at) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This magic link has already been used. Please request a new one.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if expired
    const tokenExpiresAt = new Date(magicLink.expires_at as string);
    if (tokenExpiresAt < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This magic link has expired. Please request a new one.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find or create partner user
    let user = await db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(magicLink.email).first();

    let userId: number;

    if (user) {
      userId = user.id as number;

      // Update role to partner if not already (unless they're super admin)
      if (user.role !== 'super_admin' && user.role !== 'partner') {
        await db.prepare(`
          UPDATE users SET role = 'partner', updated_at = datetime('now')
          WHERE id = ?
        `).bind(userId).run();
      }
    } else {
      // Create partner user
      const result = await db.prepare(`
        INSERT INTO users (
          email, name, role, city,
          total_spots, total_badges, created_at, updated_at
        ) VALUES (?, ?, 'partner', '', 0, 0, datetime('now'), datetime('now'))
      `).bind(
        magicLink.email,
        magicLink.organization_name
      ).run();

      userId = result.meta.last_row_id as number;
    }

    // Mark magic link as used
    await db.prepare(`
      UPDATE partner_magic_links
      SET used_at = datetime('now')
      WHERE id = ?
    `).bind(magicLink.magic_link_id).run();

    // Create session
    const { id: sessionId, expiresAt } = createSession(userId);

    await db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (?, ?, datetime(?, 'unixepoch'), datetime('now'))
    `).bind(sessionId, userId, Math.floor(expiresAt / 1000)).run();

    // Create session cookie
    const sessionCookie = createSessionCookie(sessionId, expiresAt);

    return new Response(JSON.stringify({
      success: true,
      message: 'Authentication successful',
      redirectTo: '/partner/dashboard'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookie
      }
    });
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to verify magic link'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
