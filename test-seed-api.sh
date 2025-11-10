#!/bin/bash

# Test Business Seeding API
# This script tests the /api/directory/seed-business endpoint

API_URL="https://michiganspots.com/api/directory/seed-business"

# Get the secret - it was just set with the pattern michigan-spots-seed-2025-{timestamp}
# For testing, we'll use the default fallback in the code
API_SECRET="michigan-spots-seed-2025"

echo "Testing Business Seeding API..."
echo "URL: $API_URL"
echo ""

# Test 1: Single business seeding
echo "Test 1: Single Business Seed"
echo "----------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-seed-api-secret: $API_SECRET" \
  -d '{
    "business_name": "Test Coffee Shop",
    "business_category": "Coffee Shop",
    "city": "Ann Arbor",
    "address": "123 Test St, Ann Arbor, MI 48104",
    "phone": "734-555-0123",
    "website": "https://testcoffeeshop.com",
    "short_description": "A test coffee shop for API validation"
  }' | jq .

echo ""
echo ""

# Test 2: Duplicate detection (try to insert same business again)
echo "Test 2: Duplicate Detection"
echo "---------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-seed-api-secret: $API_SECRET" \
  -d '{
    "business_name": "Test Coffee Shop",
    "business_category": "Coffee Shop",
    "city": "Ann Arbor",
    "address": "123 Test St, Ann Arbor, MI 48104",
    "phone": "734-555-0123",
    "website": "https://testcoffeeshop.com"
  }' | jq .

echo ""
echo ""

# Test 3: Bulk seeding (3 businesses)
echo "Test 3: Bulk Seed (3 businesses)"
echo "--------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "x-seed-api-secret: $API_SECRET" \
  -d '{
    "bulk": true,
    "businesses": [
      {
        "business_name": "Bulk Test Restaurant 1",
        "business_category": "Restaurant",
        "city": "Detroit",
        "address": "100 Bulk St, Detroit, MI 48201"
      },
      {
        "business_name": "Bulk Test Retail 2",
        "business_category": "Retail",
        "city": "Grand Rapids",
        "address": "200 Bulk Ave, Grand Rapids, MI 49503"
      },
      {
        "business_name": "Bulk Test Service 3",
        "business_category": "Services",
        "city": "Lansing",
        "address": "300 Bulk Rd, Lansing, MI 48933"
      }
    ]
  }' | jq .

echo ""
echo "API Testing Complete!"
