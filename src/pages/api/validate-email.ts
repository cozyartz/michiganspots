/**
 * Email Validation API Endpoint
 *
 * POST /api/validate-email
 * Body: { email: string }
 *
 * Returns validation result from eValidate service
 */

import type { APIRoute } from 'astro';
import { validateEmail } from '../../lib/emailValidator';

// Mark as server-side rendered to handle POST requests
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Email is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get API key from runtime environment (Cloudflare Pages secret) or import.meta.env (local dev)
    const apiKey = (locals.runtime?.env?.EVALIDATE_API_KEY as string) || import.meta.env.EVALIDATE_API_KEY || '';

    if (!apiKey) {
      console.error('EVALIDATE_API_KEY not configured');
      // Fallback to basic validation if service is not configured
      const basicValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      return new Response(
        JSON.stringify({
          email,
          isValid: basicValid,
          severity: basicValid ? 'valid' : 'invalid',
          score: basicValid ? 70 : 0,
          recommendations: basicValid
            ? ['Email format is valid']
            : ['Invalid email format'],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate using eValidate service
    const result = await validateEmail(email, apiKey);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Email validation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Validation service unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
