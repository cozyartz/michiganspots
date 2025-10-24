/**
 * In-Person Partner Signup API Endpoint
 *
 * POST /api/in-person-signup
 * Handles iPad/tablet in-person partner signups with digital signatures
 */

import type { APIRoute } from 'astro';

export const prerender = false;

// Generate a unique confirmation ID
function generateConfirmationId(): string {
  const prefix = 'MS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Convert base64 to Uint8Array for R2 storage
function base64ToUint8Array(base64: string): Uint8Array {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      'email',
      'name',
      'title',
      'organizationName',
      'phone',
      'address',
      'city',
      'tier',
      'duration',
      'tierAmount',
      'totalPaid',
      'signature',
      'hasReadAgreement'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Access Cloudflare bindings
    const DB = locals.runtime?.env?.DB;
    const R2 = locals.runtime?.env?.R2;

    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate confirmation ID
    const confirmationId = generateConfirmationId();
    const now = new Date().toISOString();

    // Save signature to R2 if available
    let signatureUrl = null;
    if (R2 && data.signature) {
      try {
        const signatureKey = `signatures/${confirmationId}.png`;
        const signatureBytes = base64ToUint8Array(data.signature);

        await R2.put(signatureKey, signatureBytes, {
          httpMetadata: {
            contentType: 'image/png',
          },
          customMetadata: {
            confirmationId,
            email: data.email,
            uploadedAt: now,
          },
        });

        signatureUrl = signatureKey;
      } catch (error) {
        console.error('Error saving signature to R2:', error);
        // Continue without signature URL if R2 fails
      }
    }

    // Insert into database
    try {
      await DB.prepare(`
        INSERT INTO in_person_signups (
          confirmation_id,
          email,
          name,
          title,
          organization_name,
          phone,
          address,
          city,
          partnership_type,
          tier,
          duration,
          tier_amount,
          total_paid,
          has_read_agreement,
          signature_url,
          signature_date,
          ip_address,
          payment_method,
          payment_status,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        confirmationId,
        data.email,
        data.name,
        data.title,
        data.organizationName,
        data.phone,
        data.address,
        data.city,
        data.partnershipType || 'business',
        data.tier,
        data.duration,
        data.tierAmount,
        data.totalPaid,
        data.hasReadAgreement ? 1 : 0,
        signatureUrl,
        now,
        clientAddress || 'unknown',
        data.paymentMethod || 'in_person_paypal',
        data.paymentStatus || 'pending',
        'pending_payment',
        now
      ).run();

      // Return success with confirmation ID
      return new Response(
        JSON.stringify({
          success: true,
          confirmationId,
          message: 'Agreement signed successfully',
          amountToPay: data.totalPaid,
          partnerName: data.organizationName
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);

      // Check if it's a unique constraint error
      if (dbError instanceof Error && dbError.message.includes('UNIQUE')) {
        return new Response(
          JSON.stringify({
            error: 'An account with this email already exists. Please use a different email or contact support.'
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Failed to save signup data. Please try again.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('In-person signup error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
