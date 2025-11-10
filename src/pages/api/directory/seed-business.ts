import type { APIRoute } from 'astro';
import { checkRateLimit, RATE_LIMITS } from '../../../lib/security/rate-limiter';
import { getSecurityHeaders, getClientIP } from '../../../lib/security/headers';
import { businessSchema } from '../../../lib/security/validation-schemas';

/**
 * Cloudflare Worker-Powered Business Auto-Seeding API
 *
 * This endpoint handles automated business seeding with duplicate prevention.
 *
 * Usage:
 * POST /api/directory/seed-business
 * Body: {
 *   business_name: string,
 *   business_category: string,
 *   city: string,
 *   address?: string,
 *   phone?: string,
 *   email?: string,
 *   website?: string,
 *   short_description?: string,
 *   directory_tier?: 'free' | 'starter' | 'growth' | 'pro',
 *   hours_of_operation?: object,
 *   price_level?: 1 | 2 | 3 | 4,
 *   amenities?: string[],
 *   tags?: string[]
 * }
 *
 * Or for bulk seeding:
 * POST /api/directory/seed-business
 * Body: {
 *   bulk: true,
 *   businesses: [{ business_name, business_category, city, ... }, ...]
 * }
 *
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   business?: { id, business_name, ... },
 *   duplicateSkipped?: boolean,
 *   matchedOn?: string
 * }
 */

interface BusinessInput {
  business_name: string;
  business_category: string;
  city: string;
  address?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  short_description?: string;
  directory_tier?: 'free' | 'starter' | 'growth' | 'pro';
  hours_of_operation?: Record<string, string>;
  price_level?: number;
  amenities?: string[];
  tags?: string[];
  sub_categories?: string[];
}

interface BulkInput {
  bulk: true;
  businesses: BusinessInput[];
}

/**
 * Normalize text for duplicate detection
 * - Lowercase
 * - Trim whitespace
 * - Remove extra spaces
 * - Remove special characters for comparison
 */
function normalizeForComparison(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

/**
 * Normalize phone number for comparison
 * Removes all non-numeric characters
 */
function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, ''); // Keep only digits
}

/**
 * Normalize website URL for comparison
 * Removes protocol, www, and trailing slashes
 */
function normalizeWebsite(website: string): string {
  if (!website) return '';
  return website
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

/**
 * Check for duplicate business in database
 * Returns existing business if found, null otherwise
 */
async function checkForDuplicate(
  db: D1Database,
  business: BusinessInput
): Promise<{ isDuplicate: boolean; matchedOn?: string; existingBusiness?: any }> {
  const normName = normalizeForComparison(business.business_name);
  const normAddress = normalizeForComparison(business.address || '');
  const normPhone = normalizePhone(business.phone || '');
  const normWebsite = normalizeWebsite(business.website || '');

  // Strategy 1: Exact match on normalized name + address
  if (normName && normAddress) {
    const nameAddressMatch = await db
      .prepare(
        `SELECT * FROM business_directory
         WHERE LOWER(REPLACE(REPLACE(business_name, ' ', ''), '-', '')) = ?
         AND LOWER(REPLACE(REPLACE(address, ' ', ''), '-', '')) = ?
         LIMIT 1`
      )
      .bind(normName.replace(/\s/g, ''), normAddress.replace(/\s/g, ''))
      .first();

    if (nameAddressMatch) {
      return {
        isDuplicate: true,
        matchedOn: 'name + address',
        existingBusiness: nameAddressMatch,
      };
    }
  }

  // Strategy 2: Match on website (if provided)
  if (normWebsite) {
    const websiteMatch = await db
      .prepare(
        `SELECT * FROM business_directory
         WHERE LOWER(REPLACE(REPLACE(REPLACE(website, 'https://', ''), 'http://', ''), 'www.', '')) = ?
         LIMIT 1`
      )
      .bind(normWebsite)
      .first();

    if (websiteMatch) {
      return {
        isDuplicate: true,
        matchedOn: 'website',
        existingBusiness: websiteMatch,
      };
    }
  }

  // Strategy 3: Match on phone number (if provided)
  if (normPhone && normPhone.length >= 10) {
    const phoneMatch = await db
      .prepare(
        `SELECT * FROM business_directory
         WHERE REPLACE(REPLACE(REPLACE(phone, '-', ''), '(', ''), ')', '') LIKE ?
         LIMIT 1`
      )
      .bind(`%${normPhone.slice(-10)}%`) // Match last 10 digits
      .first();

    if (phoneMatch) {
      return {
        isDuplicate: true,
        matchedOn: 'phone',
        existingBusiness: phoneMatch,
      };
    }
  }

  // Strategy 4: Fuzzy match on name + city (very similar names in same city)
  if (normName && business.city) {
    const cityMatch = await db
      .prepare(
        `SELECT * FROM business_directory
         WHERE LOWER(business_name) LIKE ?
         AND LOWER(city) = ?
         LIMIT 1`
      )
      .bind(`%${normName.slice(0, 15)}%`, business.city.toLowerCase())
      .first();

    if (cityMatch) {
      // Additional similarity check to avoid false positives
      const existingNormName = normalizeForComparison(cityMatch.business_name as string);
      const similarity = calculateSimilarity(normName, existingNormName);

      if (similarity > 0.8) {
        // 80% similar
        return {
          isDuplicate: true,
          matchedOn: 'name similarity + city',
          existingBusiness: cityMatch,
        };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Simple string similarity calculation (Levenshtein distance)
 * Returns value between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Validate business input data
 */
function validateBusinessInput(business: BusinessInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!business.business_name || business.business_name.trim().length === 0) {
    errors.push('business_name is required');
  }

  if (!business.business_category || business.business_category.trim().length === 0) {
    errors.push('business_category is required');
  }

  if (!business.city || business.city.trim().length === 0) {
    errors.push('city is required');
  }

  if (business.email && !isValidEmail(business.email)) {
    errors.push('Invalid email format');
  }

  if (business.website && !isValidWebsite(business.website)) {
    errors.push('Invalid website URL');
  }

  if (business.price_level && (business.price_level < 1 || business.price_level > 4)) {
    errors.push('price_level must be 1-4');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidWebsite(website: string): boolean {
  try {
    new URL(website.startsWith('http') ? website : `https://${website}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Insert business into database
 */
async function insertBusiness(db: D1Database, business: BusinessInput): Promise<any> {
  const result = await db
    .prepare(
      `INSERT INTO business_directory (
        business_name,
        business_category,
        sub_categories,
        address,
        city,
        state,
        zip_code,
        phone,
        email,
        website,
        short_description,
        hours_of_operation,
        price_level,
        amenities,
        tags,
        directory_tier,
        ai_processing_status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`
    )
    .bind(
      business.business_name.trim(),
      business.business_category.trim(),
      business.sub_categories ? JSON.stringify(business.sub_categories) : null,
      business.address?.trim() || null,
      business.city.trim(),
      business.state || 'Michigan',
      business.zip_code || null,
      business.phone || null,
      business.email || null,
      business.website || null,
      business.short_description?.trim() || null,
      business.hours_of_operation ? JSON.stringify(business.hours_of_operation) : null,
      business.price_level || 2,
      business.amenities ? JSON.stringify(business.amenities) : null,
      business.tags ? JSON.stringify(business.tags) : null,
      business.directory_tier || 'free'
    )
    .first();

  return result;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get client info
    const clientIP = getClientIP(request);

    // Rate limiting - strict for business submissions
    const rateLimit = await checkRateLimit(clientIP, RATE_LIMITS.STRICT);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            ...getSecurityHeaders(),
          },
        }
      );
    }

    const runtime = locals.runtime as {
      env: {
        DB: D1Database;
        SEED_API_SECRET?: string;
      };
    };

    // REQUIRED: Verify API secret for security
    const apiSecret = request.headers.get('x-seed-api-secret');
    const expectedSecret = runtime.env.SEED_API_SECRET || 'michigan-spots-seed-2025';

    if (apiSecret !== expectedSecret) {
      console.warn(`[Security] Unauthorized seed request from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...getSecurityHeaders() },
        }
      );
    }

    const db = runtime.env.DB;
    if (!db) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database not available',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json() as BusinessInput | BulkInput;

    // Handle bulk seeding
    if ('bulk' in body && body.bulk) {
      const bulkResults = {
        total: body.businesses.length,
        inserted: 0,
        duplicatesSkipped: 0,
        errors: 0,
        results: [] as any[],
      };

      for (const business of body.businesses) {
        try {
          // Validate input
          const validation = validateBusinessInput(business);
          if (!validation.valid) {
            bulkResults.errors++;
            bulkResults.results.push({
              business_name: business.business_name,
              success: false,
              errors: validation.errors,
            });
            continue;
          }

          // Check for duplicates
          const duplicateCheck = await checkForDuplicate(db, business);
          if (duplicateCheck.isDuplicate) {
            bulkResults.duplicatesSkipped++;
            bulkResults.results.push({
              business_name: business.business_name,
              success: true,
              duplicateSkipped: true,
              matchedOn: duplicateCheck.matchedOn,
              existingId: duplicateCheck.existingBusiness?.id,
            });
            continue;
          }

          // Insert business
          const insertedBusiness = await insertBusiness(db, business);
          bulkResults.inserted++;
          bulkResults.results.push({
            business_name: business.business_name,
            success: true,
            id: insertedBusiness.id,
          });

          // Small delay between inserts to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          bulkResults.errors++;
          bulkResults.results.push({
            business_name: business.business_name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Bulk seed completed: ${bulkResults.inserted} inserted, ${bulkResults.duplicatesSkipped} duplicates skipped, ${bulkResults.errors} errors`,
          results: bulkResults,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle single business seeding
    const business = body as BusinessInput;

    // Validate input
    const validation = validateBusinessInput(business);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation failed',
          errors: validation.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for duplicates
    const duplicateCheck = await checkForDuplicate(db, business);
    if (duplicateCheck.isDuplicate) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Business already exists (duplicate detected)',
          duplicateSkipped: true,
          matchedOn: duplicateCheck.matchedOn,
          existingBusiness: duplicateCheck.existingBusiness,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert business
    const insertedBusiness = await insertBusiness(db, business);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Business added successfully',
        business: insertedBusiness,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Seed business API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
