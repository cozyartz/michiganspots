-- ========================================
-- Category Normalization Script
-- REMOTE PRODUCTION DATABASE ONLY
-- ========================================
-- Purpose: Normalize 36 category variations into 12 standard categories
-- Affects: 304 businesses in michiganspot-db (remote)
-- Backup: database/backups/business_directory_backup_20251110_154527.json
-- Date: 2025-11-10
-- ========================================

-- BEFORE: 36 different category names
-- AFTER: 12 standard categories matching frontend filters

-- Standard Categories:
-- 1. Restaurants
-- 2. Coffee Shops
-- 3. Shopping
-- 4. Arts & Culture
-- 5. Services
-- 6. Health & Wellness
-- 7. Automotive
-- 8. Home & Garden
-- 9. Tourism
-- 10. Construction
-- 11. Education
-- 12. Real Estate

-- ========================================
-- 1. RESTAURANTS (currently: Restaurant, Restaurant & Bar, Restaurant & Bakery)
-- ========================================
UPDATE business_directory
SET business_category = 'Restaurants'
WHERE business_category IN (
  'Restaurant',
  'Restaurant & Bar',
  'Restaurant & Bakery',
  'Food & Beverage'
);

-- ========================================
-- 2. COFFEE SHOPS (currently: Coffee Shop)
-- ========================================
UPDATE business_directory
SET business_category = 'Coffee Shops'
WHERE business_category IN (
  'Coffee Shop',
  'Bakery'
);

-- ========================================
-- 3. SHOPPING (currently: Retail, Shopping & Dining, Shopping & Food Hall)
-- ========================================
UPDATE business_directory
SET business_category = 'Shopping'
WHERE business_category IN (
  'Retail',
  'Shopping & Dining',
  'Shopping & Food Hall',
  'Retail & Attractions',
  'Music Store'
);

-- ========================================
-- 4. ARTS & CULTURE (currently: Entertainment, Religious & Community)
-- ========================================
UPDATE business_directory
SET business_category = 'Arts & Culture'
WHERE business_category IN (
  'Entertainment',
  'Bar & Entertainment',
  'Religious & Community'
);

-- ========================================
-- 5. HEALTH & WELLNESS (currently: Healthcare, Healthcare & Wellness)
-- ========================================
UPDATE business_directory
SET business_category = 'Health & Wellness'
WHERE business_category IN (
  'Healthcare',
  'Healthcare & Wellness'
);

-- ========================================
-- 6. AUTOMOTIVE (currently: Automotive Service, Automotive Sales)
-- ========================================
UPDATE business_directory
SET business_category = 'Automotive'
WHERE business_category IN (
  'Automotive Service',
  'Automotive Sales'
);

-- ========================================
-- 7. TOURISM (currently: Lodging, Tourism & Attractions, Tourism & Culture, Recreation, Parks & Recreation, Parks & Gardens, Zoo & Attractions)
-- ========================================
UPDATE business_directory
SET business_category = 'Tourism'
WHERE business_category IN (
  'Lodging',
  'Tourism & Attractions',
  'Tourism & Culture',
  'Recreation',
  'Parks & Recreation',
  'Parks & Gardens',
  'Zoo & Attractions'
);

-- ========================================
-- 8. LOCAL BUSINESS CATEGORY (200+ businesses)
-- ========================================
-- This is the tricky one - "Local Business" is too generic
-- We'll keep it as-is for now and let AI re-categorize them
-- OR manually review and update based on business_name

-- For now, map "Local Business" to "Services" as catch-all
UPDATE business_directory
SET business_category = 'Services'
WHERE business_category = 'Local Business';

-- NOTE: After this script runs, you may want to review these 200+ businesses
-- and manually assign better categories based on their names/descriptions

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these AFTER executing the updates to verify:

-- Count by category (should only show 12 categories)
-- SELECT business_category, COUNT(*) as count
-- FROM business_directory
-- GROUP BY business_category
-- ORDER BY count DESC;

-- Find any remaining non-standard categories
-- SELECT DISTINCT business_category
-- FROM business_directory
-- WHERE business_category NOT IN (
--   'Restaurants',
--   'Coffee Shops',
--   'Shopping',
--   'Arts & Culture',
--   'Services',
--   'Health & Wellness',
--   'Automotive',
--   'Home & Garden',
--   'Tourism',
--   'Construction',
--   'Education',
--   'Real Estate'
-- );
