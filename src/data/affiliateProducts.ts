export interface AffiliateProduct {
  asin: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  affiliateUrl?: string; // Custom affiliate URL (overrides ASIN-based URL generation)
}

// Michigan-themed product recommendations
export const michiganProducts: AffiliateProduct[] = [
  // Travel Guides & Books
  {
    asin: 'B08KGLVH6L',
    title: 'Moon Michigan: Explore the Great Lakes State',
    description: 'The ultimate guide to exploring Michigan, from Mackinac Island to Sleeping Bear Dunes.',
    category: 'Travel Guide',
    tags: ['travel', 'guide', 'planning'],
    affiliateUrl: 'https://amzn.to/3Lv2sz3',
  },
  {
    asin: '1634043340',
    title: '100 Things to Do in Michigan Before You Die',
    description: 'Discover the must-see attractions and hidden gems across the Great Lakes State.',
    category: 'Travel Guide',
    tags: ['travel', 'bucket-list'],
    affiliateUrl: 'https://amzn.to/3LCPNKi',
  },
  {
    asin: '0762779543',
    title: 'Hiking Michigan: A Guide to the State\'s Greatest Hikes',
    description: 'Detailed trail maps and descriptions for the best hikes in Michigan.',
    category: 'Outdoor Guide',
    tags: ['hiking', 'trails', 'outdoor'],
  },

  // Outdoor Gear
  {
    asin: 'B08RNJW7T9',
    title: 'Garmin eTrex GPS Navigator',
    description: 'Essential GPS for geocaching and exploring Michigan\'s wilderness areas.',
    category: 'GPS & Navigation',
    tags: ['geocaching', 'gps', 'outdoor', 'navigation'],
  },
  {
    asin: 'B07PXQXQMM',
    title: 'CamelBak Hydration Pack',
    description: 'Stay hydrated during your Michigan adventures with hands-free water storage.',
    category: 'Outdoor Gear',
    tags: ['hiking', 'outdoor', 'hydration'],
    affiliateUrl: 'https://amzn.to/4oHWEAT',
  },
  {
    asin: 'B00H192IPE',
    title: 'Columbia Rain Jacket',
    description: 'Weather-resistant jacket perfect for Michigan\'s unpredictable weather.',
    category: 'Outdoor Gear',
    tags: ['hiking', 'outdoor', 'weather'],
    affiliateUrl: 'https://amzn.to/3JUigLa',
  },

  // Photography
  {
    asin: 'B07QD6HQ4V',
    title: 'Smartphone Camera Lens Kit',
    description: 'Capture stunning photos of Michigan spots with professional-quality lenses.',
    category: 'Photography',
    tags: ['photography', 'camera', 'mobile'],
    affiliateUrl: 'https://amzn.to/3Lv37jX',
  },
  {
    asin: 'B075DHSG77',
    title: 'Portable Phone Tripod',
    description: 'Stable shots for your Michigan Spots photo submissions.',
    category: 'Photography',
    tags: ['photography', 'tripod', 'mobile'],
    affiliateUrl: 'https://amzn.to/4qXntmk',
  },

  // Camping & Recreation
  {
    asin: 'B004BBKGQQ',
    title: 'ENO DoubleNest Hammock',
    description: 'Relax at Michigan beaches and parks with this portable hammock.',
    category: 'Camping',
    tags: ['camping', 'outdoor', 'beach', 'park'],
    affiliateUrl: 'https://amzn.to/47KOnor',
  },
  {
    asin: 'B01LSUQH5C',
    title: 'Portable Picnic Blanket',
    description: 'Waterproof blanket for beach days on the Great Lakes.',
    category: 'Beach & Park',
    tags: ['beach', 'park', 'picnic'],
  },

  // Michigan-Specific Products
  {
    asin: 'B0845VKNQT',
    title: 'Michigan State Parks Passport',
    description: 'Track your visits to all 103 Michigan State Parks.',
    category: 'Michigan Collectible',
    tags: ['parks', 'badge', 'collection'],
  },
  {
    asin: 'B089QT5VQN',
    title: 'Great Lakes Water Bottle',
    description: 'Show your Michigan pride while staying hydrated on adventures.',
    category: 'Michigan Merch',
    tags: ['michigan', 'water', 'outdoor'],
  },

  // Maps & Planning
  {
    asin: 'B08TW4N7JL',
    title: 'Michigan Wall Map',
    description: 'Large detailed map to plan your Michigan Spots adventures.',
    category: 'Maps & Planning',
    tags: ['map', 'planning', 'wall-decor'],
  },
  {
    asin: 'B093Q7L7L7',
    title: 'National Geographic Michigan Atlas',
    description: 'Detailed topographic maps of every corner of Michigan.',
    category: 'Maps & Planning',
    tags: ['map', 'planning', 'topographic'],
  },

  // Winter Activities
  {
    asin: 'B08L7HRKPF',
    title: 'Snowshoes for Winter Hiking',
    description: 'Explore Michigan trails year-round with quality snowshoes.',
    category: 'Winter Gear',
    tags: ['winter', 'hiking', 'outdoor', 'snow'],
  },
];

// Get products by category
export function getProductsByCategory(category: string): AffiliateProduct[] {
  return michiganProducts.filter(p => p.category === category);
}

// Get products by tag
export function getProductsByTag(tag: string): AffiliateProduct[] {
  return michiganProducts.filter(p => p.tags.includes(tag));
}

// Get products for spot types
export function getProductsForSpotType(spotType: string): AffiliateProduct[] {
  const tagMap: Record<string, string[]> = {
    'hiking': ['hiking', 'outdoor', 'gps', 'hydration'],
    'beach': ['beach', 'water', 'outdoor'],
    'park': ['park', 'picnic', 'outdoor'],
    'attraction': ['travel', 'guide', 'photography'],
    'geocaching': ['geocaching', 'gps', 'navigation'],
    'photography': ['photography', 'camera'],
    'winter': ['winter', 'snow'],
  };

  const relevantTags = tagMap[spotType.toLowerCase()] || ['travel'];
  return michiganProducts.filter(p =>
    p.tags.some(tag => relevantTags.includes(tag))
  );
}
