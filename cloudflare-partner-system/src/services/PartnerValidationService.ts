/**
 * Partner Validation Service
 * Validates partner data and ensures data quality
 */

import { z } from 'zod';

const BusinessHoursSchema = z.object({
  monday: z.string(),
  tuesday: z.string(),
  wednesday: z.string(),
  thursday: z.string(),
  friday: z.string(),
  saturday: z.string(),
  sunday: z.string()
});

const SocialMediaSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  twitter: z.string().url().optional(),
  tiktok: z.string().url().optional()
}).optional();

const PartnerDataSchema = z.object({
  businessName: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(50),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
  phone: z.string().regex(/^\+?[\d\s\-\(\)\.]{10,}$/),
  email: z.string().email(),
  website: z.string().url().optional(),
  category: z.enum([
    'restaurant',
    'cafe',
    'retail',
    'entertainment',
    'services',
    'tourism',
    'outdoor',
    'arts',
    'other'
  ]),
  hours: BusinessHoursSchema,
  amenities: z.array(z.string()).max(20),
  specialOffers: z.string().max(300).optional(),
  socialMedia: SocialMediaSchema
});

export interface ValidationResult {
  isValid: boolean;
  data?: any;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export class PartnerValidationService {
  async validatePartnerData(data: any): Promise<ValidationResult> {
    try {
      // Basic schema validation
      const validatedData = PartnerDataSchema.parse(data);
      
      // Additional business logic validation
      const businessValidation = await this.validateBusinessLogic(validatedData);
      
      if (!businessValidation.isValid) {
        return businessValidation;
      }

      // Location validation
      const locationValidation = await this.validateLocation(validatedData);
      
      if (!locationValidation.isValid) {
        return locationValidation;
      }

      return {
        isValid: true,
        data: validatedData
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        };
      }

      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Validation failed'
        }]
      };
    }
  }

  private async validateBusinessLogic(data: any): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string }> = [];

    // Validate business hours
    const hoursValidation = this.validateBusinessHours(data.hours);
    if (!hoursValidation.isValid) {
      errors.push(...hoursValidation.errors!);
    }

    // Validate phone number format
    if (!this.isValidPhoneNumber(data.phone)) {
      errors.push({
        field: 'phone',
        message: 'Invalid phone number format'
      });
    }

    // Validate Michigan location
    if (data.state !== 'MI') {
      errors.push({
        field: 'state',
        message: 'Business must be located in Michigan (MI)'
      });
    }

    // Validate amenities
    if (data.amenities.length === 0) {
      errors.push({
        field: 'amenities',
        message: 'At least one amenity must be specified'
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private validateBusinessHours(hours: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];
    const timeRegex = /^(Closed|(\d{1,2}:\d{2}\s?(AM|PM)\s?-\s?\d{1,2}:\d{2}\s?(AM|PM)))$/i;

    Object.entries(hours).forEach(([day, time]) => {
      if (typeof time !== 'string' || !timeRegex.test(time)) {
        errors.push({
          field: `hours.${day}`,
          message: `Invalid time format for ${day}. Use format like "9:00 AM - 5:00 PM" or "Closed"`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check if it's a valid US phone number (10 or 11 digits)
    return digits.length === 10 || (digits.length === 11 && digits[0] === '1');
  }

  private async validateLocation(data: any): Promise<ValidationResult> {
    try {
      // Validate that the address is in Michigan
      const fullAddress = `${data.address}, ${data.city}, ${data.state} ${data.zipCode}`;
      
      // In a real implementation, you'd use a geocoding service
      // For now, we'll do basic validation
      
      const michiganCities = [
        'detroit', 'grand rapids', 'warren', 'sterling heights', 'lansing',
        'ann arbor', 'flint', 'dearborn', 'livonia', 'westland', 'troy',
        'farmington hills', 'kalamazoo', 'wyoming', 'southfield', 'rochester hills',
        'taylor', 'pontiac', 'st. clair shores', 'royal oak', 'novi',
        'dearborn heights', 'battle creek', 'saginaw', 'kentwood'
      ];

      const cityLower = data.city.toLowerCase();
      const isKnownMichiganCity = michiganCities.some(city => 
        cityLower.includes(city) || city.includes(cityLower)
      );

      if (!isKnownMichiganCity) {
        // This is just a warning, not a hard failure
        console.warn(`Unknown Michigan city: ${data.city}`);
      }

      return {
        isValid: true
      };

    } catch (error) {
      console.error('Location validation error:', error);
      
      return {
        isValid: false,
        errors: [{
          field: 'location',
          message: 'Unable to validate location'
        }]
      };
    }
  }

  async validateBusinessExists(businessName: string, address: string): Promise<boolean> {
    try {
      // In a real implementation, you'd check against business registries
      // or use Google Places API to verify the business exists
      
      // For now, return true (assume business exists)
      return true;

    } catch (error) {
      console.error('Business existence validation error:', error);
      return false;
    }
  }

  async checkDuplicatePartner(businessName: string, address: string): Promise<boolean> {
    try {
      // Check if a partner with the same business name and address already exists
      // This would query your partner database
      
      // For now, return false (no duplicate)
      return false;

    } catch (error) {
      console.error('Duplicate partner check error:', error);
      return false;
    }
  }

  sanitizePartnerData(data: any): any {
    return {
      ...data,
      businessName: data.businessName.trim(),
      description: data.description.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      email: data.email.toLowerCase().trim(),
      phone: this.formatPhoneNumber(data.phone),
      website: data.website ? data.website.trim() : undefined,
      specialOffers: data.specialOffers ? data.specialOffers.trim() : undefined,
      amenities: data.amenities.map((amenity: string) => amenity.trim()).filter(Boolean)
    };
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone; // Return original if can't format
  }
}