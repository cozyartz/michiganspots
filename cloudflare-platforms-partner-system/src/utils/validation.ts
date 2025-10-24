/**
 * Validation utilities for partner data
 * Uses Zod for schema validation
 */

import { z } from 'zod';

// Business hours schema
const businessHoursSchema = z.object({
  monday: z.string(),
  tuesday: z.string(),
  wednesday: z.string(),
  thursday: z.string(),
  friday: z.string(),
  saturday: z.string(),
  sunday: z.string()
});

// Social media links schema (all optional)
const socialMediaSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  twitter: z.string().url().optional(),
  tiktok: z.string().url().optional()
}).optional();

// Main partner data schema
const partnerDataSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2-letter code (e.g., MI)'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  phone: z.string().regex(/^\(\d{3}\)\s?\d{3}-\d{4}$/, 'Phone must be in format (xxx) xxx-xxxx'),
  email: z.string().email('Invalid email address'),
  website: z.string().url('Invalid website URL').optional(),
  category: z.string().min(1, 'Category is required'),
  hours: businessHoursSchema,
  amenities: z.array(z.string()).default([]),
  specialOffers: z.string().max(300).optional(),
  socialMedia: socialMediaSchema
});

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export function validatePartnerData(data: any): ValidationResult {
  try {
    // Attempt to parse and validate the data
    const validatedData = partnerDataSchema.parse(data);

    return {
      success: true,
      data: validatedData
    };

  } catch (error) {
    // If validation fails, format the errors
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return {
        success: false,
        errors
      };
    }

    // Handle unexpected errors
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'An unexpected validation error occurred'
      }]
    };
  }
}

// Helper function to validate subdomain format
export function validateSubdomain(subdomain: string): boolean {
  // Subdomain must be 3-63 characters, lowercase alphanumeric and hyphens
  // Cannot start or end with hyphen
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  return subdomainRegex.test(subdomain);
}

// Helper function to validate custom hostname
export function validateCustomHostname(hostname: string, baseDomain: string): boolean {
  // Must end with the base domain
  if (!hostname.endsWith(`.${baseDomain}`)) {
    return false;
  }

  // Extract subdomain
  const subdomain = hostname.replace(`.${baseDomain}`, '');

  // Validate subdomain format
  return validateSubdomain(subdomain);
}

// Helper function to sanitize business name for subdomain
export function sanitizeForSubdomain(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
    .substring(0, 30);            // Limit length
}

// Validate Michigan ZIP code (optional - for Michigan-specific validation)
export function isMichiganZipCode(zipCode: string): boolean {
  const michiganZipRanges = [
    { min: 48001, max: 49971 }  // Michigan ZIP code range
  ];

  const zip = parseInt(zipCode.substring(0, 5));

  return michiganZipRanges.some(range =>
    zip >= range.min && zip <= range.max
  );
}

// Validate category
const validCategories = [
  'restaurant',
  'cafe',
  'bar',
  'brewery',
  'winery',
  'retail',
  'entertainment',
  'outdoors',
  'attractions',
  'hotel',
  'services',
  'other'
];

export function isValidCategory(category: string): boolean {
  return validCategories.includes(category.toLowerCase());
}

// Export valid categories for frontend use
export { validCategories };
