/**
 * Production Configuration Validation Script
 * Validates that all required production settings are properly configured
 */

interface ProductionConfig {
  CLOUDFLARE_API_KEY?: string;
  ANALYTICS_BASE_URL?: string;
  GPS_VERIFICATION_RADIUS?: number;
  MAX_SUBMISSIONS_PER_USER_PER_DAY?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class ProductionConfigValidator {
  private config: ProductionConfig;

  constructor(config: ProductionConfig) {
    this.config = config;
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required settings validation
    if (!this.config.CLOUDFLARE_API_KEY) {
      errors.push('CLOUDFLARE_API_KEY is required for analytics integration');
    } else if (this.config.CLOUDFLARE_API_KEY === 'your_production_api_key_here') {
      errors.push('CLOUDFLARE_API_KEY must be set to actual production key');
    }

    if (!this.config.ANALYTICS_BASE_URL) {
      errors.push('ANALYTICS_BASE_URL is required');
    } else if (!this.isValidUrl(this.config.ANALYTICS_BASE_URL)) {
      errors.push('ANALYTICS_BASE_URL must be a valid URL');
    } else if (!this.config.ANALYTICS_BASE_URL.startsWith('https://')) {
      warnings.push('ANALYTICS_BASE_URL should use HTTPS in production');
    }

    // Optional settings validation with defaults
    if (this.config.GPS_VERIFICATION_RADIUS !== undefined) {
      if (this.config.GPS_VERIFICATION_RADIUS < 10 || this.config.GPS_VERIFICATION_RADIUS > 1000) {
        warnings.push('GPS_VERIFICATION_RADIUS should be between 10-1000 meters');
      }
    }

    if (this.config.MAX_SUBMISSIONS_PER_USER_PER_DAY !== undefined) {
      if (this.config.MAX_SUBMISSIONS_PER_USER_PER_DAY < 1 || this.config.MAX_SUBMISSIONS_PER_USER_PER_DAY > 100) {
        warnings.push('MAX_SUBMISSIONS_PER_USER_PER_DAY should be between 1-100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Test configuration validation
export function validateProductionConfig(config: ProductionConfig): ValidationResult {
  const validator = new ProductionConfigValidator(config);
  return validator.validate();
}

// CLI usage
async function main() {
  const fs = await import('fs');
  const path = await import('path');

  console.log('🔍 Validating production configuration...\n');

  // Load configuration from .env.production
  const envPath = path.join(process.cwd(), '.env.production');
  let config: ProductionConfig = {};

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          const cleanKey = key.trim();
          const cleanValue = value.trim();
          
          if (cleanKey === 'GPS_VERIFICATION_RADIUS' || cleanKey === 'MAX_SUBMISSIONS_PER_USER_PER_DAY') {
            config[cleanKey as keyof ProductionConfig] = parseInt(cleanValue) as any;
          } else {
            config[cleanKey as keyof ProductionConfig] = cleanValue as any;
          }
        }
      }
    }
  } else {
    console.log('⚠️  .env.production file not found');
  }

  const result = validateProductionConfig(config);

  if (result.errors.length > 0) {
    console.log('❌ Configuration Errors:');
    result.errors.forEach(error => console.log(`   • ${error}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  Configuration Warnings:');
    result.warnings.forEach(warning => console.log(`   • ${warning}`));
    console.log('');
  }

  if (result.isValid) {
    console.log('✅ Production configuration is valid!');
    process.exit(0);
  } else {
    console.log('❌ Production configuration has errors that must be fixed before deployment.');
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});