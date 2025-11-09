# Business Auto-Seeding API Guide

This guide explains how to use the Cloudflare Worker-powered business auto-seeding system for the MichiganSpots Business Directory.

## Overview

The business seeding API provides:
- **Automated business data import** from external sources
- **Intelligent duplicate detection** using multiple matching strategies
- **Bulk import capabilities** for seeding large datasets
- **Data validation** to ensure quality listings
- **Secure API access** with secret key authentication

## Endpoint

```
POST /api/directory/seed-business
```

## Authentication

All requests must include the API secret in the header:

```
x-seed-api-secret: your-secret-key-here
```

The secret is configured in Cloudflare environment variables as `SEED_API_SECRET`.

## Single Business Seeding

### Request Body

```json
{
  "business_name": "Founders Brewing Co.",
  "business_category": "Restaurant & Bar",
  "city": "Grand Rapids",
  "address": "235 Grandville Ave SW, Grand Rapids, MI 49503",
  "phone": "(616) 776-1195",
  "email": "info@foundersbrewing.com",
  "website": "https://foundersbrewing.com",
  "short_description": "Award-winning craft brewery and restaurant.",
  "directory_tier": "free",
  "hours_of_operation": {
    "monday": "11am-11pm",
    "tuesday": "11am-11pm",
    "wednesday": "11am-11pm",
    "thursday": "11am-12am",
    "friday": "11am-12am",
    "saturday": "10am-12am",
    "sunday": "10am-10pm"
  },
  "price_level": 2,
  "amenities": ["parking", "outdoor_seating", "wifi"],
  "tags": ["craft_beer", "live_music", "dog_friendly"],
  "sub_categories": ["Brewery", "American Food", "Live Entertainment"]
}
```

### Required Fields

- `business_name` (string) - Name of the business
- `business_category` (string) - Primary category
- `city` (string) - City location in Michigan

### Optional Fields

- `address` (string) - Street address
- `state` (string) - Default: "Michigan"
- `zip_code` (string) - ZIP code
- `phone` (string) - Contact phone number
- `email` (string) - Contact email
- `website` (string) - Business website URL
- `short_description` (string) - Brief description
- `directory_tier` (string) - Tier: "free", "starter", "growth", "pro" (default: "free")
- `hours_of_operation` (object) - JSON object with day/hours
- `price_level` (number) - 1-4 ($, $$, $$$, $$$$) (default: 2)
- `amenities` (array) - Array of amenity strings
- `tags` (array) - Array of tag strings
- `sub_categories` (array) - Array of sub-category strings

### Response (Success - New Business)

```json
{
  "success": true,
  "message": "Business added successfully",
  "business": {
    "id": 75,
    "business_name": "Founders Brewing Co.",
    "business_category": "Restaurant & Bar",
    "city": "Grand Rapids",
    "directory_tier": "free",
    "ai_processing_status": "pending",
    "created_at": "2025-11-09T12:00:00.000Z"
  }
}
```

### Response (Duplicate Detected)

```json
{
  "success": true,
  "message": "Business already exists (duplicate detected)",
  "duplicateSkipped": true,
  "matchedOn": "website",
  "existingBusiness": {
    "id": 25,
    "business_name": "Founders Brewing Co.",
    "city": "Grand Rapids"
  }
}
```

### Response (Validation Error)

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    "business_name is required",
    "Invalid email format"
  ]
}
```

## Bulk Business Seeding

### Request Body

```json
{
  "bulk": true,
  "businesses": [
    {
      "business_name": "Business One",
      "business_category": "Restaurant",
      "city": "Detroit",
      "address": "123 Main St"
    },
    {
      "business_name": "Business Two",
      "business_category": "Retail",
      "city": "Ann Arbor",
      "address": "456 State St"
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "message": "Bulk seed completed: 45 inserted, 5 duplicates skipped, 0 errors",
  "results": {
    "total": 50,
    "inserted": 45,
    "duplicatesSkipped": 5,
    "errors": 0,
    "results": [
      {
        "business_name": "Business One",
        "success": true,
        "id": 75
      },
      {
        "business_name": "Business Two",
        "success": true,
        "duplicateSkipped": true,
        "matchedOn": "name + address",
        "existingId": 32
      }
    ]
  }
}
```

## Duplicate Detection Strategies

The API uses multiple strategies to detect duplicates (in order of priority):

### 1. Name + Address Match
Normalized comparison of business name and address.
- Lowercase conversion
- Whitespace normalization
- Special character removal

**Example:**
- "Founder's Brewing Co." at "235 Grandville Ave SW"
- Matches: "founders brewing co" at "235 grandville ave sw"

### 2. Website Match
Exact match on normalized website URL.
- Protocol removal (http://, https://)
- www prefix removal
- Trailing slash removal

**Example:**
- "https://www.foundersbrewing.com/"
- Matches: "foundersbrewing.com"

### 3. Phone Number Match
Matches last 10 digits of phone number (handles formatting differences).

**Example:**
- "(616) 776-1195"
- Matches: "616-776-1195", "6167761195", "+1 616 776 1195"

### 4. Name Similarity + City
Fuzzy matching using Levenshtein distance (80% similarity threshold) within the same city.

**Example:**
- "Founder's Brewing" in "Grand Rapids"
- Matches: "Founders Brewing Co" in "Grand Rapids" (85% similar)
- Does NOT match: "Founders Pizza" (only 60% similar)

## Usage Examples

### cURL Example

```bash
curl -X POST https://michiganspots.com/api/directory/seed-business \
  -H "Content-Type: application/json" \
  -H "x-seed-api-secret: michigan-spots-seed-2025" \
  -d '{
    "business_name": "Test Business",
    "business_category": "Restaurant",
    "city": "Detroit",
    "address": "123 Main St, Detroit, MI 48201",
    "phone": "313-555-1234",
    "website": "https://testbusiness.com"
  }'
```

### JavaScript Example

```javascript
async function seedBusiness(businessData) {
  const response = await fetch('https://michiganspots.com/api/directory/seed-business', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-seed-api-secret': 'michigan-spots-seed-2025',
    },
    body: JSON.stringify(businessData),
  });

  return await response.json();
}

// Seed a single business
const result = await seedBusiness({
  business_name: 'Great Lakes Coffee',
  business_category: 'Coffee Shop',
  city: 'Detroit',
  address: '4160 Woodward Ave, Detroit, MI 48201',
});

console.log(result);
```

### Python Example

```python
import requests
import json

def seed_business(business_data):
    url = 'https://michiganspots.com/api/directory/seed-business'
    headers = {
        'Content-Type': 'application/json',
        'x-seed-api-secret': 'michigan-spots-seed-2025'
    }

    response = requests.post(url, headers=headers, json=business_data)
    return response.json()

# Seed a single business
business = {
    'business_name': 'Zingerman\'s Deli',
    'business_category': 'Restaurant',
    'city': 'Ann Arbor',
    'address': '422 Detroit St, Ann Arbor, MI 48104',
    'website': 'https://zingermansdeli.com'
}

result = seed_business(business)
print(json.dumps(result, indent=2))
```

### Bulk Seeding from CSV

```python
import csv
import requests

def bulk_seed_from_csv(csv_file_path):
    businesses = []

    with open(csv_file_path, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            businesses.append({
                'business_name': row['name'],
                'business_category': row['category'],
                'city': row['city'],
                'address': row['address'],
                'phone': row.get('phone'),
                'website': row.get('website'),
                'short_description': row.get('description'),
            })

    url = 'https://michiganspots.com/api/directory/seed-business'
    headers = {
        'Content-Type': 'application/json',
        'x-seed-api-secret': 'michigan-spots-seed-2025'
    }

    response = requests.post(url, headers=headers, json={
        'bulk': True,
        'businesses': businesses
    })

    return response.json()

# Execute bulk import
result = bulk_seed_from_csv('michigan_businesses.csv')
print(f"Inserted: {result['results']['inserted']}")
print(f"Duplicates: {result['results']['duplicatesSkipped']}")
print(f"Errors: {result['results']['errors']}")
```

## Integration with Directory System

### Automatic AI Processing

All seeded businesses are automatically queued for AI processing:
- `ai_processing_status` set to "pending"
- Cloudflare AI cron job processes every 6 hours
- Generates quality scores, descriptions, keywords

### Claiming Flow

Seeded businesses can be claimed by owners:
1. Business appears in directory with `is_claimed = 0`
2. Owner visits `/directory` and finds their business
3. Clicks "Claim Your FREE Listing"
4. Verifies ownership and updates information
5. Business marked as `is_claimed = 1`

### Tier Upgrades

Free seeded businesses can upgrade to paid tiers:
- **Starter**: $49/month - AI descriptions, insights, analytics
- **Growth**: $99/month - Priority placement, featured badge
- **Pro**: $199/month - Daily intelligence, API access, dedicated support

## Best Practices

### 1. Provide Complete Data
Include as many fields as possible (especially address, phone, website) to improve duplicate detection accuracy.

### 2. Normalize Before Sending
Pre-normalize data to reduce duplicate detection failures:
- Trim whitespace
- Consistent address formatting
- Standard phone number format

### 3. Use Bulk API for Large Datasets
For 10+ businesses, use the bulk endpoint to avoid rate limiting and improve performance.

### 4. Handle Duplicates Gracefully
Check `duplicateSkipped` in response and log for review. Some duplicates may be legitimate variations.

### 5. Monitor AI Processing
After seeding, monitor businesses for AI enrichment completion:
- Check `ai_processing_status` field
- Next cron run processes pending businesses
- Manually trigger via `/api/directory/enrich` if urgent

### 6. Rate Limiting
The API includes small delays (50ms) between bulk inserts to prevent database overload. For very large datasets (1000+), break into batches of 100-200.

## Database Schema Reference

Businesses are inserted into the `business_directory` table with these key fields:

```sql
CREATE TABLE business_directory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  business_category TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  short_description TEXT,
  directory_tier TEXT DEFAULT 'free',
  ai_processing_status TEXT DEFAULT 'pending',
  is_claimed INTEGER DEFAULT 0,
  quality_score REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Security Notes

1. **API Secret**: Keep `SEED_API_SECRET` confidential. Rotate periodically.
2. **Input Validation**: All inputs are validated and sanitized before insertion.
3. **SQL Injection Protection**: Uses parameterized queries (D1 prepared statements).
4. **Rate Limiting**: Implement rate limiting on client side for large imports.
5. **Monitoring**: Log all seeding requests for audit trail.

## Troubleshooting

### Error: "Unauthorized"
- Check `x-seed-api-secret` header is included
- Verify secret matches `SEED_API_SECRET` environment variable
- Check for typos or extra whitespace

### Error: "Database not available"
- Verify D1 database binding is configured in `wrangler.toml`
- Check Cloudflare dashboard for database status
- Ensure database migration has been applied

### Duplicate Not Detected (False Negative)
- Review duplicate detection strategies
- Check if business data differs significantly (e.g., different address formats)
- Consider manually merging duplicates after import

### Legitimate Business Flagged as Duplicate (False Positive)
- Review `matchedOn` field to understand why it matched
- Adjust similarity threshold if needed (currently 80%)
- Manually insert with different data if truly unique

## Support

For issues or questions:
- GitHub: https://github.com/cozyartz/michiganspots/issues
- Email: support@michiganspots.com
- Documentation: https://michiganspots.com/directory-api-docs
