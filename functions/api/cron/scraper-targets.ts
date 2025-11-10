/**
 * Scraper Target Configurations
 *
 * Add new business directory websites here to scrape
 * Each target must respect robots.txt and terms of service
 */

export interface ScraperTarget {
  name: string;
  url: string;
  type: string;
  city?: string;
  enabled: boolean;
  selectors: {
    container: string; // CSS selector for business listings container
    name: string; // CSS selector or regex for business name
    address?: string;
    phone?: string;
    website?: string;
    description?: string;
  };
  pagination?: {
    nextPageSelector?: string;
    maxPages?: number;
  };
}

/**
 * Public business directories that can be scraped
 * Only includes sites with public listings and no auth required
 */
export const SCRAPER_TARGETS: ScraperTarget[] = [
  // WORKING TARGET - Petoskey Chamber (all letters use same structure)
  {
    name: 'Petoskey Chamber - A',
    url: 'http://www.petoskeychamber.com/list/searchalpha/a.htm',
    type: 'local_business',
    city: 'Petoskey',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a', // Link inside card contains business name
      address: 'p', // Paragraphs in .card-contact contain address/phone
      phone: 'a', // Links contain phone numbers
      website: 'a',
    },
  },
  {
    name: 'Petoskey Chamber - B',
    url: 'http://www.petoskeychamber.com/list/searchalpha/b.htm',
    type: 'local_business',
    city: 'Petoskey',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  {
    name: 'Petoskey Chamber - C',
    url: 'http://www.petoskeychamber.com/list/searchalpha/c.htm',
    type: 'local_business',
    city: 'Petoskey',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  {
    name: 'Petoskey Chamber - D-F',
    url: 'http://www.petoskeychamber.com/list/searchalpha/d.htm',
    type: 'local_business',
    city: 'Petoskey',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  {
    name: 'Petoskey Chamber - G-M',
    url: 'http://www.petoskeychamber.com/list/searchalpha/g.htm',
    type: 'local_business',
    city: 'Petoskey',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  {
    name: 'Petoskey Chamber - N-S',
    url: 'http://www.petoskeychamber.com/list/searchalpha/n.htm',
    type: 'local_business',
    city: 'Petoskey',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  {
    name: 'Petoskey Chamber - T-Z',
    url: 'http://www.petoskeychamber.com/list/searchalpha/t.htm',
    type: 'local_business',
    city: 'Petoskey',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  // DISABLED - Frankenmuth uses JavaScript rendering (not compatible with static scraper)
  {
    name: 'Frankenmuth River Place Shops',
    url: 'https://frankenmuthriverplace.com/directory/',
    type: 'retail',
    city: 'Frankenmuth',
    enabled: false, // ❌ Uses client-side JavaScript rendering
    selectors: {
      container: 'h3', // Each business starts with h3 (name), followed by p tags
      name: 'h3',
      description: 'p',
      phone: 'strong', // Phone/website in <strong> tags within <p>
      website: 'strong',
    },
  },
  // WORKING TARGET - Traverse Connect (same platform as Petoskey)
  {
    name: 'Traverse Connect - A-C',
    url: 'https://business.traverseconnect.com/list/searchalpha/a',
    type: 'local_business',
    city: 'Traverse City',
    enabled: true, // ✅ Uses GrowthZone platform (same as Petoskey)
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  {
    name: 'Traverse Connect - D-H',
    url: 'https://business.traverseconnect.com/list/searchalpha/d',
    type: 'local_business',
    city: 'Traverse City',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  {
    name: 'Traverse Connect - I-M',
    url: 'https://business.traverseconnect.com/list/searchalpha/i',
    type: 'local_business',
    city: 'Traverse City',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  {
    name: 'Traverse Connect - N-S',
    url: 'https://business.traverseconnect.com/list/searchalpha/n',
    type: 'local_business',
    city: 'Traverse City',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },
  {
    name: 'Traverse Connect - T-Z',
    url: 'https://business.traverseconnect.com/list/searchalpha/t',
    type: 'local_business',
    city: 'Traverse City',
    enabled: true,
    selectors: {
      container: '.gz-list-card-wrapper',
      name: 'a',
      address: 'p',
      phone: 'a',
      website: 'a',
    },
  },

  // DISABLED - These use JavaScript rendering and won't work with static HTML scraper
  {
    name: 'Detroit Chamber (Angular - NOT COMPATIBLE)',
    url: 'https://www.detroitchamber.com/membership/business-directory/',
    type: 'local_business',
    city: 'Detroit',
    enabled: false, // ❌ Uses Angular client-side rendering
    selectors: {
      container: '.member-listing',
      name: 'h3',
      address: '.address',
      phone: '.phone',
      website: 'a',
    },
  },
  {
    name: 'Marquette Chamber (AJAX - NOT COMPATIBLE)',
    url: 'https://business.marquette.org/list',
    type: 'local_business',
    city: 'Marquette',
    enabled: false, // ❌ Uses AJAX/Bloodhound typeahead
    selectors: {
      container: '.gz-list-card-wrapper',
      name: '.gz-autocomplete-name',
      address: '.address',
      phone: '.phone',
    },
  },
];

/**
 * Get enabled targets for scraping
 */
export function getEnabledTargets(): ScraperTarget[] {
  return SCRAPER_TARGETS.filter((target) => target.enabled);
}

/**
 * Get target for today (rotates through enabled targets)
 */
export function getTodaysTarget(): ScraperTarget | null {
  const enabled = getEnabledTargets();
  if (enabled.length === 0) return null;

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % enabled.length;

  return enabled[index];
}

/**
 * Add a new scraper target
 * Use this function to programmatically add targets
 */
export function addScraperTarget(target: ScraperTarget): void {
  SCRAPER_TARGETS.push(target);
}

/**
 * Instructions for adding new scraper targets:
 *
 * 1. Find a Michigan business directory website
 * 2. Check robots.txt: https://example.com/robots.txt
 * 3. Verify the site allows scraping (no "Disallow: /")
 * 4. Open the business listings page
 * 5. Inspect the HTML to find CSS selectors
 * 6. Add a new entry to SCRAPER_TARGETS array above
 * 7. Test with enabled: false first
 * 8. Run: curl https://michiganspot.pages.dev/api/cron/web-scraper
 * 9. Verify results, then set enabled: true
 *
 * Example: Finding selectors
 * - Open Chrome DevTools
 * - Right-click a business name → Inspect
 * - Look for the container element (usually <div>, <article>, <li>)
 * - Find selectors for name, address, phone, etc.
 * - Use classes like '.business-name' or tags like 'h3.title'
 */
