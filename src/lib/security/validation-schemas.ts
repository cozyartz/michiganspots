/**
 * Zod validation schemas for API endpoints
 */
import { z } from 'zod';

// Common validators
export const emailSchema = z.string().email().max(255);
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/).max(20).optional();
export const urlSchema = z.string().url().max(500).optional();
export const sanitizedStringSchema = z.string().max(1000).transform(str =>
  str.replace(/<script[^>]*>.*?<\/script>/gi, '').trim()
);

// Directory search validation
export const directorySearchSchema = z.object({
  query: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  page: z.number().int().min(1).max(100).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// Business validation
export const businessSchema = z.object({
  business_name: z.string().min(1).max(200),
  business_category: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  address: z.string().max(500).optional(),
  phone: phoneSchema,
  website: urlSchema,
  short_description: sanitizedStringSchema.optional(),
  email: emailSchema.optional(),
});

// Semantic search validation
export const semanticSearchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).optional(),
  threshold: z.number().min(0).max(1).optional(),
});

// AI moderation validation
export const aiModerationSchema = z.object({
  businessId: z.number().int().positive(),
  action: z.enum(['approve', 'reject', 'flag']),
  reason: z.string().max(500).optional(),
});

// Newsletter subscription validation
export const newsletterSchema = z.object({
  email: emailSchema,
  consent: z.boolean().refine(val => val === true, {
    message: 'You must consent to receive emails',
  }),
});

// Partnership signup validation
export const partnershipSchema = z.object({
  business_name: z.string().min(1).max(200),
  contact_name: z.string().min(1).max(100),
  email: emailSchema,
  phone: phoneSchema,
  tier: z.enum(['spot', 'featured', 'premium', 'title', 'chamber']),
  billing_cycle: z.enum(['monthly', 'quarterly', 'yearly']),
});

// Scraper target validation (for admin)
export const scraperTargetSchema = z.object({
  target: z.number().int().min(0).max(100),
  limit: z.number().int().min(1).max(1000).optional(),
});

// Generic pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Validate and parse request body with Zod
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: 'Invalid JSON body' };
  }
}

/**
 * Validate URL search params
 */
export function validateSearchParams<T>(
  url: URL,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const params: any = {};

    for (const [key, value] of url.searchParams) {
      // Convert to number if it looks like a number
      if (/^\d+$/.test(value)) {
        params[key] = parseInt(value, 10);
      } else if (value === 'true') {
        params[key] = true;
      } else if (value === 'false') {
        params[key] = false;
      } else {
        params[key] = value;
      }
    }

    const result = schema.safeParse(params);

    if (!result.success) {
      return {
        success: false,
        error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: 'Invalid search parameters' };
  }
}
