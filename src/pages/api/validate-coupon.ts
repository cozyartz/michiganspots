/**
 * Coupon Validation API
 * POST /api/validate-coupon
 * Validates discount coupon codes and returns discount details
 */

import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { code, purchaseType, amount } = await request.json();

    if (!code || !purchaseType || amount === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: code, purchaseType, amount' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const DB = locals.runtime?.env?.DB;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Lookup coupon
    const coupon = await DB.prepare(`
      SELECT *
      FROM coupons
      WHERE code = ? COLLATE NOCASE
        AND is_active = 1
        AND (valid_until IS NULL OR datetime(valid_until) > datetime('now'))
        AND (max_uses IS NULL OR uses_count < max_uses)
    `).bind(code.toUpperCase()).first();

    if (!coupon) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Invalid or expired coupon code'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if coupon applies to this purchase type
    const appliesTo = coupon.applies_to as string;

    if (appliesTo === 'yearly_only' && purchaseType !== 'yearly') {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'This coupon only applies to yearly plans'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (appliesTo === 'services_only' && purchaseType !== 'services') {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'This coupon only applies to web/dev services'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check minimum purchase
    const minPurchase = coupon.min_purchase as number | null;
    if (minPurchase && amount < minPurchase) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: `Minimum purchase of $${minPurchase / 100} required for this coupon`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate discount
    let discountAmount = 0;
    const discountType = coupon.discount_type as string;
    const discountValue = coupon.discount_value as number;

    if (discountType === 'percentage') {
      discountAmount = Math.floor((amount * discountValue) / 100);
    } else if (discountType === 'fixed') {
      discountAmount = Math.min(discountValue, amount); // Can't discount more than amount
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    return new Response(
      JSON.stringify({
        valid: true,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: discountType,
          discountValue: discountValue,
        },
        calculation: {
          originalAmount: amount,
          discountAmount: discountAmount,
          finalAmount: finalAmount,
          savings: discountAmount,
          savingsPercent: Math.round((discountAmount / amount) * 100)
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Coupon validation error:', error);

    return new Response(
      JSON.stringify({
        valid: false,
        error: error instanceof Error ? error.message : 'Coupon validation failed'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
