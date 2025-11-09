-- Seed data for Michigan Business Directory
-- 25 prominent Michigan businesses across various categories and cities
-- These will be enriched with Clodura API data via the cron job

-- Detroit Area Businesses
INSERT INTO business_directory (
  business_name, business_category, city, address, short_description, directory_tier, ai_processing_status
) VALUES
  (
    'Slows Bar BQ',
    'Restaurants',
    'Detroit',
    '2138 Michigan Ave, Detroit, MI 48216',
    'Award-winning barbecue restaurant in Detroit''s Corktown neighborhood, famous for their pulled pork and ribs.',
    'free',
    'pending'
  ),
  (
    'Detroit Institute of Arts',
    'Arts & Culture',
    'Detroit',
    '5200 Woodward Ave, Detroit, MI 48202',
    'World-renowned art museum featuring over 65,000 works including Diego Rivera murals.',
    'free',
    'pending'
  ),
  (
    'Shinola',
    'Shopping',
    'Detroit',
    '441 W Canfield St, Detroit, MI 48201',
    'Premium American-made watches, leather goods, and lifestyle products.',
    'free',
    'pending'
  );

-- Grand Rapids Businesses
INSERT INTO business_directory (
  business_name, business_category, city, address, short_description, directory_tier, ai_processing_status
) VALUES
  (
    'Founders Brewing Co.',
    'Restaurants',
    'Grand Rapids',
    '235 Grandville Ave SW, Grand Rapids, MI 49503',
    'Iconic craft brewery serving award-winning beers and pub food in Beer City USA.',
    'free',
    'pending'
  ),
  (
    'Frederik Meijer Gardens & Sculpture Park',
    'Arts & Culture',
    'Grand Rapids',
    '1000 East Beltline Ave NE, Grand Rapids, MI 49525',
    '158-acre botanical garden and outdoor sculpture park, one of the nation''s top attractions.',
    'free',
    'pending'
  );

-- Ann Arbor Businesses
INSERT INTO business_directory (
  business_name, business_category, city, address, short_description, directory_tier, ai_processing_status
) VALUES
  (
    'Zingerman''s Delicatessen',
    'Restaurants',
    'Ann Arbor',
    '422 Detroit St, Ann Arbor, MI 48104',
    'World-famous deli known for exceptional sandwiches, cheeses, and baked goods.',
    'free',
    'pending'
  ),
  (
    'The Ark',
    'Arts & Culture',
    'Ann Arbor',
    '316 S Main St, Ann Arbor, MI 48104',
    'Legendary acoustic music venue hosting national and international artists.',
    'free',
    'pending'
  ),
  (
    'Literati Bookstore',
    'Shopping',
    'Ann Arbor',
    '124 E Washington St, Ann Arbor, MI 48104',
    'Independent bookstore featuring curated selections, author events, and rooftop bar.',
    'free',
    'pending'
  );

-- Traverse City Businesses
INSERT INTO business_directory (
  business_name, business_category, city, address, short_description, directory_tier, ai_processing_status
) VALUES
  (
    'Chateau Chantal Winery',
    'Tourism',
    'Traverse City',
    '15900 Rue de Vin, Traverse City, MI 49686',
    'Scenic winery on Old Mission Peninsula offering wine tastings, tours, and stunning views.',
    'free',
    'pending'
  ),
  (
    'The Cooks'' House',
    'Restaurants',
    'Traverse City',
    '115 Wellington St, Traverse City, MI 49686',
    'Farm-to-table restaurant showcasing seasonal Northern Michigan ingredients.',
    'free',
    'pending'
  );

-- Lansing Businesses
INSERT INTO business_directory (
  business_name, business_category, city, address, short_description, directory_tier, ai_processing_status
) VALUES
  (
    'MSU Museum',
    'Arts & Culture',
    'Lansing',
    '409 W Circle Dr, East Lansing, MI 48824',
    'Michigan State University natural and cultural history museum.',
    'free',
    'pending'
  ),
  (
    'Lansing Brewing Company',
    'Restaurants',
    'Lansing',
    '518 E Shiawassee St, Lansing, MI 48912',
    'Craft brewery and restaurant in a historic building in downtown Lansing.',
    'free',
    'pending'
  );

-- Kalamazoo Businesses
INSERT INTO business_directory (
  business_name, business_category, city, address, short_description, directory_tier, ai_processing_status
) VALUES
  (
    'Bell''s Brewery',
    'Restaurants',
    'Kalamazoo',
    '355 E Kalamazoo Ave, Kalamazoo, MI 49007',
    'Pioneering craft brewery, home of Two Hearted Ale and Oberon.',
    'free',
    'pending'
  ),
  (
    'Kalamazoo Institute of Arts',
    'Arts & Culture',
    'Kalamazoo',
    '314 S Park St, Kalamazoo, MI 49007',
    'Community art museum featuring permanent collection and rotating exhibitions.',
    'free',
    'pending'
  );

-- Marquette Businesses
INSERT INTO business_directory (
  business_name, business_category, city, address, short_description, directory_tier, ai_processing_status
) VALUES
  (
    'Blackrocks Brewery',
    'Restaurants',
    'Marquette',
    '424 N 3rd St, Marquette, MI 49855',
    'Upper Peninsula craft brewery known for 51K IPA and outdoor beer garden.',
    'free',
    'pending'
  ),
  (
    'Down Wind Sports',
    'Shopping',
    'Marquette',
    '514 N 3rd St, Marquette, MI 49855',
    'Outdoor recreation outfitter for skiing, biking, camping, and water sports.',
    'free',
    'pending'
  );

-- Holland Businesses
INSERT INTO business_directory (
  business_name, business_category, city, address, short_description, directory_tier, ai_processing_status
) VALUES
  (
    'New Holland Brewing',
    'Restaurants',
    'Holland',
    '66 E 8th St, Holland, MI 49423',
    'Craft brewery and pub known for Dragon''s Milk and innovative beers.',
    'free',
    'pending'
  ),
  (
    'Windmill Island Gardens',
    'Tourism',
    'Holland',
    '1 Lincoln Ave, Holland, MI 49423',
    'Authentic Dutch windmill, gardens, and cultural experience.',
    'free',
    'pending'
  );

-- Additional Diverse Businesses
INSERT INTO business_directory (
  business_name, business_category, city, address, short_description, directory_tier, ai_processing_status
) VALUES
  (
    'Henry Ford Museum',
    'Tourism',
    'Detroit',
    '20900 Oakwood Blvd, Dearborn, MI 48124',
    'National historic landmark showcasing American innovation and history.',
    'free',
    'pending'
  ),
  (
    'Traverse City Coffee Roasters',
    'Coffee Shops',
    'Traverse City',
    '1450 S Centre St, Traverse City, MI 49686',
    'Local coffee roaster and cafe serving specialty coffee and baked goods.',
    'free',
    'pending'
  ),
  (
    'Motor City Tattoo & Piercing',
    'Services',
    'Detroit',
    '34 Canfield St, Detroit, MI 48201',
    'Professional tattoo and piercing studio in Midtown Detroit.',
    'free',
    'pending'
  ),
  (
    'PURE Health & Fitness',
    'Health & Wellness',
    'Ann Arbor',
    '210 Little Lake Dr, Ann Arbor, MI 48103',
    'Full-service fitness center with personal training, classes, and spa.',
    'free',
    'pending'
  ),
  (
    'Suburban Chevrolet',
    'Automotive',
    'Grand Rapids',
    '3515 28th St SE, Grand Rapids, MI 49512',
    'Full-service Chevrolet dealership with sales and service.',
    'free',
    'pending'
  ),
  (
    'Rennie & Associates Real Estate',
    'Real Estate',
    'Traverse City',
    '147 E Front St, Traverse City, MI 49684',
    'Premier Northern Michigan real estate agency specializing in waterfront properties.',
    'free',
    'pending'
  );

-- Count businesses
SELECT 'Seed data inserted successfully. Total businesses:' as message, COUNT(*) as count
FROM business_directory
WHERE created_at >= datetime('now', '-1 minute');
