/**
 * Stripe Price Configuration
 * Maps partnership tiers to Stripe Price IDs
 *
 * TODO: Update these with actual Price IDs from Stripe after running:
 * npx tsx scripts/setup-stripe-products.ts
 */

export const STRIPE_PRICES = {
  chamber: {
    launch: process.env.STRIPE_PRICE_CHAMBER_LAUNCH || '',
    city: process.env.STRIPE_PRICE_CHAMBER_CITY || '',
    regional: process.env.STRIPE_PRICE_CHAMBER_REGIONAL || ''
  },
  business: {
    single: process.env.STRIPE_PRICE_BUSINESS_SINGLE || '',
    seasonal: process.env.STRIPE_PRICE_BUSINESS_SEASONAL || '',
    multi_location: process.env.STRIPE_PRICE_BUSINESS_MULTI_LOCATION || '',
    event: process.env.STRIPE_PRICE_BUSINESS_EVENT || ''
  },
  community: {
    minimal: process.env.STRIPE_PRICE_COMMUNITY_MINIMAL || '',
    modest: process.env.STRIPE_PRICE_COMMUNITY_MODEST || ''
  }
};

export const PARTNERSHIP_PRICES = {
  chamber: {
    launch: { amount: 299, label: '$299', regular: '$2,500', savings: '$2,001' },
    city: { amount: 599, label: '$599', regular: '$5,000', savings: '$4,001' },
    regional: { amount: 1999, label: '$1,999', regular: '$10,000+', savings: '$8,001+' }
  },
  business: {
    single: { amount: 99, label: '$99', regular: '$299', savings: '$200' },
    seasonal: { amount: 249, label: '$249', regular: '$899', savings: '$650' },
    multi_location: { amount: 149, label: '$149/location', regular: '$399', savings: '$250' },
    event: { amount: 199, label: '$199', regular: '$599', savings: '$400' }
  },
  community: {
    minimal: { amount: 50, label: '$50', regular: '$199', savings: 'varies' },
    modest: { amount: 100, label: '$100', regular: '$399', savings: 'varies' }
  }
};

export function getPriceId(type: string, tier: string): string {
  return STRIPE_PRICES[type]?.[tier] || '';
}

export function getPriceInfo(type: string, tier: string) {
  return PARTNERSHIP_PRICES[type]?.[tier];
}
