/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

/**
 * Stripe Price Configuration
 * Maps partnership tiers to Stripe Price IDs
 *
 * Note: Actual Price IDs are stored as environment variables in Cloudflare
 * and accessed by Workers functions at runtime. This file is for frontend
 * display information only.
 */

// Price IDs are managed via Cloudflare environment variables
// Access them via context.env in Workers functions
export const STRIPE_PRICES = {
  spot_partner: {
    monthly: '',
    quarterly: '',
    yearly: ''
  },
  featured_partner: {
    quarterly: '',
    yearly: ''
  },
  premium_sponsor: {
    quarterly: '',
    yearly: ''
  },
  title_sponsor: {
    quarterly: '',
    yearly: ''
  },
  chamber_tourism: {
    quarterly: '',
    yearly: ''
  },
  // Prize package add-ons (variable pricing based on tier and value)
  prize_addon: {
    spot_monthly: '',
    spot_quarterly: '',
    featured_quarterly: '',
    premium_quarterly: '',
    title_quarterly: '',
    chamber_quarterly: ''
  },
  // Web/dev services (one-time)
  webdev: {
    landing_page: '',
    ecommerce: '',
    dashboard: '',
    api_integration: '',
    full_website: ''
  }
};

export const PARTNERSHIP_PRICES = {
  spot_partner: {
    monthly: {
      amount: 99,
      label: '$99/mo',
      interval: 'month',
      description: '1 challenge/month, basic profile, monthly analytics'
    },
    quarterly: {
      amount: 249,
      label: '$249/quarter',
      perMonth: '$83/mo',
      interval: 'quarter',
      savings: '$48',
      description: '1 challenge/month, save $48 vs monthly'
    },
    yearly: {
      amount: 999,
      label: '$999/year',
      perMonth: '$83/mo',
      interval: 'year',
      savings: '$189 (2 months free)',
      description: '1 challenge/month, save 2 months vs monthly'
    }
  },
  featured_partner: {
    quarterly: {
      amount: 699,
      label: '$699/quarter',
      perMonth: '$233/mo',
      interval: 'quarter',
      savings: '$198',
      description: '2-3 challenges/month, enhanced profile, strategy calls'
    },
    yearly: {
      amount: 2399,
      label: '$2,399/year',
      perMonth: '$200/mo',
      interval: 'year',
      savings: '$999 (3 months free)',
      description: '2-3 challenges/month, save 3 months'
    }
  },
  premium_sponsor: {
    quarterly: {
      amount: 1499,
      label: '$1,499/quarter',
      perMonth: '$500/mo',
      interval: 'quarter',
      savings: '$597',
      description: 'Unlimited challenges, web/dev services, consulting'
    },
    yearly: {
      amount: 4999,
      label: '$4,999/year',
      perMonth: '$417/mo',
      interval: 'year',
      savings: '$2,989 (3 months free)',
      description: 'Unlimited challenges, web/dev, save 3 months'
    }
  },
  title_sponsor: {
    quarterly: {
      amount: 3999,
      label: '$3,999/quarter',
      perMonth: '$1,333/mo',
      interval: 'quarter',
      description: 'Full web/dev package, comprehensive marketing, enterprise features'
    },
    yearly: {
      amount: 12999,
      label: '$12,999/year',
      perMonth: '$1,083/mo',
      interval: 'year',
      savings: '$2,989 (3 months free)',
      description: 'Enterprise tier, save 3 months'
    }
  },
  chamber_tourism: {
    quarterly: {
      amount: 899,
      label: '$899/quarter',
      perMonth: '$300/mo',
      interval: 'quarter',
      description: 'Up to 10 member businesses, chamber branding'
    },
    yearly: {
      amount: 2999,
      label: '$2,999/year',
      perMonth: '$250/mo',
      interval: 'year',
      savings: '$599 (2 months free)',
      description: '10 members, save 2 months'
    }
  },
  // Prize package add-on pricing guidelines
  prize_addon: {
    spot_monthly: { amount: 50, max: 100, label: '$50-100/mo' },
    spot_quarterly: { amount: 50, max: 100, label: '$50-100/quarter' },
    featured_quarterly: { amount: 100, max: 250, label: '$100-250/quarter' },
    premium_quarterly: { amount: 500, max: 1000, label: '$500-1,000/quarter' },
    title_quarterly: { amount: 2000, max: 5000, label: '$2,000-5,000/quarter' },
    chamber_quarterly: { amount: 300, max: 600, label: '$300-600/quarter' }
  },
  // Web/dev services pricing
  webdev: {
    landing_page: { amount: 499, label: '$499', description: 'Single landing page' },
    ecommerce: { amount: 999, label: '$999', description: 'E-commerce integration' },
    dashboard: { amount: 799, label: '$799', description: 'Custom analytics dashboard' },
    api_integration: { amount: 1299, label: '$1,299', description: 'API integration' },
    full_website: { amount: 2999, max: 5999, label: '$2,999-5,999', description: 'Full website build' }
  }
};

export function getPriceId(tier: string, duration: string): string {
  return STRIPE_PRICES[tier]?.[duration] || '';
}

export function getPriceInfo(tier: string, duration: string) {
  return PARTNERSHIP_PRICES[tier]?.[duration];
}

export function getPrizeAddonPrice(tier: string, duration: string) {
  const key = `${tier}_${duration}`;
  return PARTNERSHIP_PRICES.prize_addon?.[key];
}

export function getWebDevPrice(service: string) {
  return PARTNERSHIP_PRICES.webdev?.[service];
}

// Helper to get all tier options for display
export function getAllTiers() {
  return [
    { id: 'spot_partner', name: 'Spot Partner', icon: '💡' },
    { id: 'featured_partner', name: 'Featured Partner', icon: '⭐' },
    { id: 'premium_sponsor', name: 'Premium Sponsor', icon: '🏆' },
    { id: 'title_sponsor', name: 'Title Sponsor', icon: '👑' },
    { id: 'chamber_tourism', name: 'Chamber & Tourism', icon: '🏛️' }
  ];
}

// Helper to get available durations for a tier
export function getAvailableDurations(tier: string) {
  const prices = PARTNERSHIP_PRICES[tier];
  if (!prices) return [];

  return Object.keys(prices).map(duration => ({
    id: duration,
    name: duration.charAt(0).toUpperCase() + duration.slice(1),
    ...prices[duration]
  }));
}
