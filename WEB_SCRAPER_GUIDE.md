# Web Scraper Guide - Pure HTML Scraping

## Overview

This is a **pure HTML web scraper** that crawls public Michigan business directories and extracts business data. **NO external APIs required** - it's 100% self-contained.

## How It Works

1. **Fetches HTML** from public business directory websites
2. **Parses HTML** using regex patterns and CSS selectors
3. **Extracts** business name, address, phone, website
4. **Imports** businesses via your seed-business API
5. **Logs** everything to database

## Quick Start

### Step 1: Add Scraper Targets

Edit `functions/api/cron/scraper-targets.ts` and add Michigan business directories:

```typescript
{
  name: 'Detroit Chamber of Commerce',
  url: 'https://detroitchamber.com/directory/',
  type: 'local_business',
  city: 'Detroit',
  enabled: true,  // Set to true to enable
  selectors: {
    container: '.member-listing',  // CSS class for business container
    name: 'h3.business-name',       // CSS selector for business name
    address: '.address',             // CSS selector for address
    phone: '.phone',                 // CSS selector for phone
    website: 'a.website',            // CSS selector for website link
  },
}
```

### Step 2: Test the Scraper

```bash
# Test manually before enabling cron
curl https://michiganspot.pages.dev/api/cron/web-scraper
```

Check the output to see if it's finding businesses correctly.

### Step 3: Configure Cron Trigger

1. Cloudflare Dashboard → Workers & Pages → michiganspot
2. Settings → Triggers → Cron Triggers
3. Add trigger: `0 3 * * *` (daily at 3 AM UTC)
4. Route: `/api/cron/web-scraper`

## Finding CSS Selectors

### Method 1: Chrome DevTools

1. Go to the business directory website
2. Right-click a business name → **Inspect**
3. Look at the HTML structure:
   - Container element (usually `<div>`, `<article>`, `<li>`)
   - Business name (usually `<h2>`, `<h3>`, `<h4>`)
   - Address, phone, website elements
4. Note the CSS classes and tags

Example HTML:
```html
<div class="business-card">
  <h3 class="business-name">Joe's Pizza</h3>
  <p class="business-address">123 Main St, Detroit, MI 48201</p>
  <p class="business-phone">(313) 555-1234</p>
  <a href="https://joespizza.com" class="business-link">Website</a>
</div>
```

Selectors:
```typescript
selectors: {
  container: '.business-card',
  name: 'h3.business-name',  // or just '.business-name'
  address: '.business-address',
  phone: '.business-phone',
  website: 'a.business-link',
}
```

### Method 2: View Page Source

1. Visit the directory page
2. Right-click → View Page Source
3. Search for a business name you see on the page
4. Look at the surrounding HTML structure
5. Identify patterns and classes

## Good Scraper Targets

### ✅ What to Scrape

- **Chamber of Commerce directories** (public member lists)
- **City tourism websites** (visitor guides, business listings)
- **Trade association directories** (restaurants, hotels, etc.)
- **Public business registries** (government-published lists)
- **Community resource pages** (local business guides)

### ❌ What NOT to Scrape

- Sites with "no scraping" in robots.txt
- Sites requiring login/authentication
- Sites with anti-scraping measures (CAPTCHAs, etc.)
- Commercial directories (Yelp, Yellow Pages) - they have APIs
- Sites with aggressive rate limiting

## Checking robots.txt

Before adding a target, check their robots.txt:

```bash
curl https://example.com/robots.txt
```

Look for:
```
User-agent: *
Disallow: /admin/
```

- **Disallow: /** = Don't scrape anything
- **Disallow: /admin/** = Don't scrape /admin, but rest is OK
- **Allow: /** = Scraping allowed

## Example Targets

### Example 1: Generic Business Directory

```typescript
{
  name: 'Ann Arbor Local Businesses',
  url: 'https://www.annarbor.com/business-directory/',
  type: 'local_business',
  city: 'Ann Arbor',
  enabled: true,
  selectors: {
    container: 'article.business',
    name: 'h2',
    address: '.address',
    phone: '.phone',
    website: 'a.website',
  },
}
```

### Example 2: Restaurant Directory

```typescript
{
  name: 'Grand Rapids Restaurants',
  url: 'https://grandrapidsrestaurants.org/directory',
  type: 'restaurant',
  city: 'Grand Rapids',
  enabled: true,
  selectors: {
    container: '.restaurant-listing',
    name: '.restaurant-name',
    address: '.restaurant-address',
    phone: '.contact-phone',
    website: 'a.visit-site',
  },
}
```

## How the Scraper Works

### Step 1: Rotation

Scraper rotates through enabled targets daily:
- Day 1: Target #1
- Day 2: Target #2
- Day 3: Target #3
- Day 4: Back to Target #1

### Step 2: Fetching

```typescript
const response = await fetch(target.url, {
  headers: {
    'User-Agent': 'MichiganSpots Directory Bot (michiganspots.com)',
  },
});
const html = await response.text();
```

### Step 3: Parsing

**Method 1**: Try CSS selectors first
```typescript
// Find all containers matching `.business-card`
// Extract name, address, phone from each
```

**Method 2**: If selectors fail, try regex patterns
```typescript
// Look for common HTML patterns like:
// <article>...</article>
// <div class="business">...</div>
// <li class="listing">...</li>
```

### Step 4: Importing

Each extracted business is sent to `/api/directory/seed-business`:
```typescript
{
  business_name: "Joe's Pizza",
  business_category: "Restaurant & Bar",
  city: "Detroit",
  address: "123 Main St, Detroit, MI 48201",
  phone: "(313) 555-1234",
  website: "https://joespizza.com"
}
```

Your existing duplicate detection prevents re-importing.

### Step 5: Logging

Results logged to `scraper_run_log` table:
```sql
INSERT INTO scraper_run_log (
  search_city,
  search_category,
  businesses_discovered,
  businesses_imported,
  duplicates_skipped,
  errors
) VALUES (...)
```

## Monitoring

### View Logs

```sql
-- Last 10 scraper runs
SELECT * FROM scraper_run_log
ORDER BY run_at DESC
LIMIT 10;

-- Total businesses imported
SELECT SUM(businesses_imported) FROM scraper_run_log;
```

### Cloudflare Logs

1. Dashboard → Workers & Pages → michiganspot
2. Logs → Real-time Logs
3. Filter: `/api/cron/web-scraper`
4. Look for `[WebScraper]` messages

## Expected Performance

### With 3 Enabled Targets

- **Rotation**: Each target scraped every 3 days
- **Per Run**: 10-20 businesses imported
- **Per Month**: ~200-400 new businesses
- **Per Year**: ~2,400-4,800 businesses

### Scaling

To scrape more frequently:
- Add more targets (10 targets = 10x data)
- Run cron more often (every 12 hours instead of daily)
- Increase `toImport.slice(0, 20)` to 50 or 100

## Troubleshooting

### No Businesses Found

**Problem**: Scraper returns 0 businesses

**Solutions**:
1. Check if URL is correct and accessible
2. Verify CSS selectors are accurate (inspect HTML)
3. Look at Cloudflare logs for error messages
4. Try fallback regex patterns (disable CSS selectors temporarily)

### Wrong Data Extracted

**Problem**: Business names are wrong/incomplete

**Solutions**:
1. Refine CSS selectors (be more specific)
2. Check if HTML uses different structure than expected
3. Look for nested elements (might need deeper selectors)

### Rate Limiting / Blocked

**Problem**: HTTP 429 or 403 errors

**Solutions**:
1. Reduce scraping frequency (daily → weekly)
2. Add longer delays between requests (1000ms → 2000ms)
3. Check robots.txt compliance
4. Rotate User-Agent strings

### Duplicates

**Problem**: High duplicate rate

**Solution**: This is normal and expected! Your duplicate detection is working. Just means you've already scraped most businesses from that source.

## Legal & Ethics

### ✅ Best Practices

1. **Check robots.txt** before adding targets
2. **Use delays** (1 second between requests)
3. **Identify yourself** (User-Agent header)
4. **Respect rate limits**
5. **Don't overload servers** (max 20 businesses per run)
6. **Add value** (you're building a better directory with AI enhancements)

### ❌ Don't Do This

1. Scrape sites that explicitly forbid it
2. Bypass CAPTCHAs or authentication
3. Hammer servers with rapid requests
4. Ignore HTTP error codes
5. Scrape personal/private data

## Adding New Targets

### Checklist

- [ ] Check robots.txt
- [ ] Inspect HTML structure
- [ ] Identify CSS selectors
- [ ] Add to `scraper-targets.ts` with `enabled: false`
- [ ] Test manually: `curl .../api/cron/web-scraper`
- [ ] Verify data looks correct
- [ ] Set `enabled: true`
- [ ] Monitor first few runs

## Cost

**FREE!** No APIs, no external costs.

Only costs:
- Cloudflare Workers execution time (covered by free tier)
- Your time setting up targets

## Files

- `functions/api/cron/web-scraper.ts` - Main scraper logic
- `functions/api/cron/scraper-targets.ts` - Target configuration
- `database/migration_033_business_scraper.sql` - Database tables
- `WEB_SCRAPER_GUIDE.md` - This guide

## Next Steps

1. Find 3-5 Michigan business directories
2. Inspect their HTML to get CSS selectors
3. Add them to `scraper-targets.ts`
4. Test each one manually
5. Enable working targets
6. Set up cron trigger
7. Monitor results daily

Happy scraping! 🕷️
