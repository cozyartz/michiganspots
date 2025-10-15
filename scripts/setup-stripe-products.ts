/**
 * Stripe Product Setup Script
 * Run this once to create all partnership products and prices in Stripe
 *
 * Usage: STRIPE_SECRET_KEY="sk_..." npx tsx scripts/setup-stripe-products.ts
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia'
});

interface ProductConfig {
  name: string;
  description: string;
  metadata: {
    partnership_type: string;
    tier: string;
    regular_price?: string;
    savings?: string;
  };
  price: {
    unit_amount: number; // in cents
    currency: string;
    recurring?: {
      interval: 'month' | 'year';
      interval_count?: number;
    };
    metadata?: any;
  };
}

const products: ProductConfig[] = [
  // CHAMBER PARTNERSHIPS
  {
    name: 'Chamber Launch Partner',
    description: 'Perfect for smaller communities and single-city chambers. Includes 1-2 sponsored challenges per quarter, partner branding, quarterly analytics, and newsletter templates.',
    metadata: {
      partnership_type: 'chamber',
      tier: 'launch',
      regular_price: '$2,500',
      savings: '$2,001'
    },
    price: {
      unit_amount: 29900, // $299.00
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 3 // quarterly
      },
      metadata: {
        founding_partner: 'true',
        lock_in_period: '12_months'
      }
    }
  },
  {
    name: 'Chamber City Launch Partner',
    description: 'Ideal for mid-sized cities and regional chambers. Multi-challenge packages, deeper analytics with member business breakdowns, event tie-ins, dedicated partner page, and monthly check-ins.',
    metadata: {
      partnership_type: 'chamber',
      tier: 'city',
      regular_price: '$5,000',
      savings: '$4,001'
    },
    price: {
      unit_amount: 59900, // $599.00
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 3
      },
      metadata: {
        founding_partner: 'true',
        lock_in_period: '12_months'
      }
    }
  },
  {
    name: 'Chamber Regional Launch Partner',
    description: 'For major metros and state-level organizations. Full platform branding, custom content development, premium analytics, dedicated account manager, co-marketing, and API access.',
    metadata: {
      partnership_type: 'chamber',
      tier: 'regional',
      regular_price: '$10,000+',
      savings: '$8,001+'
    },
    price: {
      unit_amount: 199900, // $1,999.00
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: 3
      },
      metadata: {
        founding_partner: 'true',
        lock_in_period: '12_months'
      }
    }
  },

  // BUSINESS PARTNERSHIPS
  {
    name: 'Single Challenge',
    description: 'Perfect for testing the waters with one 30-day challenge. Includes custom challenge page with branding, social media promotion, analytics report, and no long-term commitment.',
    metadata: {
      partnership_type: 'business',
      tier: 'single',
      regular_price: '$299',
      savings: '$200'
    },
    price: {
      unit_amount: 9900, // $99.00
      currency: 'usd',
      metadata: {
        founding_partner: 'true',
        duration: '30_days'
      }
    }
  },
  {
    name: 'Seasonal Campaign',
    description: 'Sustained engagement with 3 consecutive monthly challenges. Includes seasonal theme integration, progressive badges, detailed monthly analytics, enhanced social media promotion, and priority support.',
    metadata: {
      partnership_type: 'business',
      tier: 'seasonal',
      regular_price: '$899',
      savings: '$650'
    },
    price: {
      unit_amount: 24900, // $249.00
      currency: 'usd',
      metadata: {
        founding_partner: 'true',
        duration: '3_months',
        challenges_included: '3'
      }
    }
  },
  {
    name: 'Multi-Location Package',
    description: 'Perfect for businesses with multiple Michigan locations. Multi-stop challenges across 3-5 locations, 45-day runtime, unified analytics, and brand consistency.',
    metadata: {
      partnership_type: 'business',
      tier: 'multi_location',
      regular_price: '$399',
      savings: '$250'
    },
    price: {
      unit_amount: 14900, // $149.00 per location
      currency: 'usd',
      metadata: {
        founding_partner: 'true',
        per_location: 'true',
        min_locations: '3'
      }
    }
  },
  {
    name: 'Event Sponsorship',
    description: 'Promote festivals, concerts, seasonal events with challenges. Event-specific challenge (2-4 weeks), pre-event buzz and post-event follow-up, social media amplification, and attendance tracking.',
    metadata: {
      partnership_type: 'business',
      tier: 'event',
      regular_price: '$599',
      savings: '$400'
    },
    price: {
      unit_amount: 19900, // $199.00
      currency: 'usd',
      metadata: {
        founding_partner: 'true',
        duration: '2_4_weeks'
      }
    }
  },

  // COMMUNITY PARTNERSHIPS (paid options)
  {
    name: 'Community Partnership - Minimal Budget',
    description: 'For community organizations with minimal budget. Basic challenge creation, social media promotion, and analytics.',
    metadata: {
      partnership_type: 'community',
      tier: 'minimal',
      regular_price: '$199',
      savings: 'varies'
    },
    price: {
      unit_amount: 5000, // $50.00
      currency: 'usd',
      metadata: {
        founding_partner: 'true',
        budget_tier: 'minimal'
      }
    }
  },
  {
    name: 'Community Partnership - Modest Budget',
    description: 'For community organizations with modest budget. Enhanced challenge creation, multiple locations, expanded social media promotion, and detailed analytics.',
    metadata: {
      partnership_type: 'community',
      tier: 'modest',
      regular_price: '$399',
      savings: 'varies'
    },
    price: {
      unit_amount: 10000, // $100.00
      currency: 'usd',
      metadata: {
        founding_partner: 'true',
        budget_tier: 'modest'
      }
    }
  }
];

async function setupStripeProducts() {
  console.log('🚀 Starting Stripe product setup...\n');

  const createdProducts = [];

  for (const productConfig of products) {
    try {
      console.log(`Creating product: ${productConfig.name}`);

      // Create the product
      const product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: productConfig.metadata
      });

      console.log(`✅ Product created: ${product.id}`);

      // Create the price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productConfig.price.unit_amount,
        currency: productConfig.price.currency,
        recurring: productConfig.price.recurring,
        metadata: productConfig.price.metadata
      });

      console.log(`✅ Price created: ${price.id}`);
      console.log(`   Amount: $${(productConfig.price.unit_amount / 100).toFixed(2)}`);
      if (productConfig.price.recurring) {
        console.log(`   Recurring: Every ${productConfig.price.recurring.interval_count || 1} ${productConfig.price.recurring.interval}(s)`);
      }

      createdProducts.push({
        product_id: product.id,
        price_id: price.id,
        name: productConfig.name,
        partnership_type: productConfig.metadata.partnership_type,
        tier: productConfig.metadata.tier
      });

      console.log('');
    } catch (error) {
      console.error(`❌ Error creating ${productConfig.name}:`, error.message);
      console.log('');
    }
  }

  console.log('\n📋 Summary of Created Products:\n');
  console.log('Copy these Price IDs to your .env file:\n');

  createdProducts.forEach(product => {
    const envVarName = `STRIPE_PRICE_${product.partnership_type.toUpperCase()}_${product.tier.toUpperCase()}`;
    console.log(`${envVarName}=${product.price_id}`);
  });

  console.log('\n✨ Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Add the Price IDs above to your .env file');
  console.log('2. Add them to wrangler.toml [vars] section');
  console.log('3. Test the checkout flow');
}

setupStripeProducts().catch(console.error);
