/**
 * Web Scraper for Michigan Businesses - Astro API Route
 *
 * Scrapes public business directories to extract business data
 * NO EXTERNAL APIS - Pure HTML web scraping
 *
 * Schedule: 0 3 * * * (daily at 3 AM UTC)
 */

import type { APIRoute } from 'astro';
import { getTodaysTarget, getEnabledTargets, type ScraperTarget } from '../../../../functions/api/cron/scraper-targets';
import { parse } from 'node-html-parser';
import { initErrorTracking, captureError, addBreadcrumb } from '../../../lib/error-tracking';

interface ScrapedBusiness {
  business_name: string;
  business_category: string;
  city: string;
  address?: string;
  phone?: string;
  website?: string;
  short_description?: string;
}

export const GET: APIRoute = async ({ locals, request }) => {
  // Initialize error tracking
  const sentry = initErrorTracking(request, locals.runtime?.env || {}, locals.runtime?.ctx);

  const runtime = locals.runtime as {
    env: {
      DB: D1Database;
      SEED_API_SECRET: string;
    };
  };

  try {
    console.log('[WebScraper] Starting web scraper...');
    addBreadcrumb(sentry, 'Web scraper started');

    // Check if a specific target index was requested (for manual testing)
    const url = new URL(request.url);
    const targetIndexParam = url.searchParams.get('target');

    let target;
    if (targetIndexParam !== null) {
      // Manual target selection by index
      const targetIndex = parseInt(targetIndexParam, 10);
      const enabledTargets = getEnabledTargets();
      if (targetIndex >= 0 && targetIndex < enabledTargets.length) {
        target = enabledTargets[targetIndex];
        console.log(`[WebScraper] Using manual target #${targetIndex}: ${target.name}`);
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Invalid target index ${targetIndex}. Valid range: 0-${enabledTargets.length - 1}`,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Get today's target (for daily cron)
      target = getTodaysTarget();
    }

    if (!target) {
      console.log('[WebScraper] No enabled targets configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No scraper targets enabled. Add targets to scraper-targets.ts',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[WebScraper] Today's target: ${target.name} - ${target.url}`);

    const results = {
      target: target.name,
      url: target.url,
      discovered: 0,
      imported: 0,
      duplicates: 0,
      errors: 0,
      businesses: [] as any[],
    };

    // Fetch target URL
    const response = await fetch(target.url, {
      headers: {
        'User-Agent': 'MichiganSpots Directory Bot (michiganspots.com) - Building Michigan business directory',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Parse HTML to extract businesses
    const businesses = await parseBusinessListings(html, target);

    console.log(`[WebScraper] Found ${businesses.length} businesses on page`);
    results.discovered = businesses.length;

    // Get limit from query parameter or use default of 100
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    // Import each business (configurable limit, default 100)
    const toImport = businesses.slice(0, Math.min(limit, businesses.length));
    console.log(`[WebScraper] Importing ${toImport.length} of ${businesses.length} businesses (limit: ${limit})`);

    for (const business of toImport) {
      try {
        // Import via seed-business API
        const importUrl = new URL('/api/directory/seed-business', request.url);
        const importResponse = await fetch(importUrl.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-seed-api-secret': runtime.env.SEED_API_SECRET || 'michigan-spots-seed-2025',
          },
          body: JSON.stringify(business),
        });

        const importResult = await importResponse.json();

        if (importResult.success) {
          if (importResult.duplicateSkipped) {
            results.duplicates++;
            console.log(`[WebScraper] Duplicate: ${business.business_name}`);
          } else {
            results.imported++;
            console.log(`[WebScraper] Imported: ${business.business_name} (ID: ${importResult.business?.id})`);
          }

          results.businesses.push({
            name: business.business_name,
            city: business.city,
            imported: !importResult.duplicateSkipped,
            duplicate: importResult.duplicateSkipped,
            id: importResult.business?.id,
          });
        } else {
          results.errors++;
          console.error(`[WebScraper] Error importing ${business.business_name}:`, importResult.error);
        }

        // Delay between requests (be respectful - 1 second delay)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.errors++;
        captureError(sentry, error, {
          context: 'business_import',
          business_name: business.business_name,
          target: target.name,
        });
        console.error('[WebScraper] Import error:', error);
      }
    }

    console.log(
      `[WebScraper] Complete: ${results.imported} imported, ${results.duplicates} duplicates, ${results.errors} errors`
    );

    // Log scraper run to database
    await runtime.env.DB.prepare(
      `INSERT INTO scraper_run_log (
        search_city,
        search_category,
        businesses_discovered,
        businesses_imported,
        duplicates_skipped,
        errors,
        run_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
      .bind(
        target.city || 'Michigan',
        target.type,
        results.discovered,
        results.imported,
        results.duplicates,
        results.errors
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped ${target.name}: ${results.imported} new, ${results.duplicates} duplicates`,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Capture error in Sentry
    captureError(sentry, error, {
      endpoint: '/api/cron/web-scraper',
      method: 'GET',
      url: request.url,
    });

    console.error('[WebScraper] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Scraper failed',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Parse HTML to extract business listings based on target configuration
 */
async function parseBusinessListings(html: string, target: ScraperTarget): Promise<ScrapedBusiness[]> {
  const businesses: ScrapedBusiness[] = [];

  // Method 1: Try CSS selector parsing (if selectors are provided)
  if (target.selectors.container) {
    const extracted = extractByCSSSelectors(html, target);
    businesses.push(...extracted);
  }

  // Method 2: Fallback to regex-based extraction if CSS selectors don't work
  if (businesses.length === 0) {
    console.log('[WebScraper] CSS selectors found nothing, trying regex patterns...');
    const extracted = extractByRegexPatterns(html, target);
    businesses.push(...extracted);
  }

  return businesses;
}

/**
 * Extract businesses using CSS selectors with proper HTML parsing
 */
function extractByCSSSelectors(html: string, target: ScraperTarget): ScrapedBusiness[] {
  const businesses: ScrapedBusiness[] = [];

  try {
    // Parse HTML with node-html-parser
    const root = parse(html);

    // Find all container elements matching the selector
    const containers = root.querySelectorAll(target.selectors.container);

    console.log(`[WebScraper] Found ${containers.length} containers matching ${target.selectors.container}`);

    for (const container of containers) {
      try {
        // Extract business name (first matching link or text)
        const nameElement = container.querySelector(target.selectors.name);
        const name = nameElement?.text.trim();

        if (!name || name === 'Members' || name.length < 2) {
          continue; // Skip empty, navigation, or invalid names
        }

        // Extract address (first paragraph)
        let address: string | undefined;
        if (target.selectors.address) {
          const addressElements = container.querySelectorAll(target.selectors.address);
          // Find paragraph that looks like an address (contains street/city)
          for (const elem of addressElements) {
            const text = elem.text.trim();
            if (text && (text.match(/\d+/  ) || text.match(/,/))) {
              address = text;
              break;
            }
          }
        }

        // Extract phone (look for tel: links or phone patterns)
        let phone: string | undefined;
        if (target.selectors.phone) {
          const phoneLinks = container.querySelectorAll('a[href^="tel:"]');
          if (phoneLinks.length > 0) {
            phone = phoneLinks[0].text.trim();
          }
        }

        // Extract website (look for external http links, not internal /list/ links)
        let website: string | undefined;
        if (target.selectors.website) {
          const links = container.querySelectorAll('a');
          for (const link of links) {
            const href = link.getAttribute('href');
            if (href && (href.startsWith('http://') || href.startsWith('https://')) && !href.includes('/list/')) {
              website = href;
              break;
            }
          }
        }

        // Extract description
        let description: string | undefined;
        if (target.selectors.description) {
          const descElement = container.querySelector(target.selectors.description);
          description = descElement?.text.trim();
        }

        // Extract city from address or use target city
        let city = target.city || 'Michigan';
        if (address) {
          const cityMatch = address.match(/,\s*([\w\s]+),\s*MI/);
          if (cityMatch) {
            city = cityMatch[1].trim();
          }
        }

        businesses.push({
          business_name: name,
          business_category: mapTypeToCategory(target.type),
          city: city,
          address: address,
          phone: phone,
          website: website,
          short_description: description || `${mapTypeToCategory(target.type)} in ${city}, Michigan`,
        });
      } catch (error) {
        console.error('[WebScraper] Error extracting from container:', error);
        continue;
      }
    }
  } catch (error) {
    console.error('[WebScraper] Error parsing HTML:', error);
  }

  return businesses;
}

/**
 * Extract text content by CSS selector
 */
function extractBySelector(html: string, selector: string): string | undefined {
  // Handle class selectors (.classname)
  if (selector.startsWith('.')) {
    const className = selector.substring(1);
    const regex = new RegExp(`class="[^"]*${className}[^"]*"[^>]*>([^<]+)<`, 'i');
    const match = html.match(regex);
    return match ? stripHtml(match[1]).trim() : undefined;
  }

  // Handle tag selectors (h2, h3, etc.)
  const tagMatch = selector.match(/^([a-z][a-z0-9]*)/i);
  if (tagMatch) {
    const tag = tagMatch[1];
    const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i');
    const match = html.match(regex);
    return match ? stripHtml(match[1]).trim() : undefined;
  }

  return undefined;
}

/**
 * Extract href attribute from link matching selector
 */
function extractLinkBySelector(html: string, selector: string): string | undefined {
  const className = selector.replace('.', '').replace('a.', '');
  const regex = new RegExp(`<a[^>]*class="[^"]*${className}[^"]*"[^>]*href="([^"]+)"`, 'i');
  const match = html.match(regex);
  return match ? match[1] : undefined;
}

/**
 * Extract businesses using regex patterns (fallback method)
 */
function extractByRegexPatterns(html: string, target: ScraperTarget): ScrapedBusiness[] {
  const businesses: ScrapedBusiness[] = [];

  const patterns = [
    {
      container: /<article[^>]*>(.*?)<\/article>/gis,
      name: /<h[2-4][^>]*>(.*?)<\/h[2-4]>/i,
      address: /(\d+\s+[\w\s]+,\s*[\w\s]+,\s*MI\s*\d{5})/i,
      phone: /(\(\d{3}\)\s*\d{3}-\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/,
      website: /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>website|visit|site<\/a>/i,
    },
    {
      container: /<div[^>]*class="[^"]*(business|listing|member|directory|company)[^"]*"[^>]*>(.*?)<\/div>/gis,
      name: /<h[2-4][^>]*>(.*?)<\/h[2-4]>/i,
      address: /(\d+\s+[\w\s]+,\s*[\w\s]+,\s*MI\s*\d{5})/i,
      phone: /(\(\d{3}\)\s*\d{3}-\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/,
    },
    {
      container: /<li[^>]*class="[^"]*(business|listing|member)[^"]*"[^>]*>(.*?)<\/li>/gis,
      name: /<h[2-4][^>]*>(.*?)<\/h[2-4]>/i,
      address: /(\d+\s+[\w\s]+,\s*[\w\s]+,\s*MI\s*\d{5})/i,
      phone: /(\(\d{3}\)\s*\d{3}-\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/,
    },
  ];

  for (const pattern of patterns) {
    const containers = html.matchAll(pattern.container);

    for (const container of containers) {
      const content = container[2] || container[1];

      const nameMatch = content.match(pattern.name);
      if (!nameMatch) continue;

      const name = stripHtml(nameMatch[1]).trim();
      const addressMatch = content.match(pattern.address);
      const phoneMatch = content.match(pattern.phone);
      const websiteMatch = pattern.website ? content.match(pattern.website) : null;

      const address = addressMatch ? addressMatch[1].trim() : undefined;

      // Extract city
      let city = target.city || 'Michigan';
      if (address) {
        const cityMatch = address.match(/,\s*([\w\s]+),\s*MI/);
        if (cityMatch) {
          city = cityMatch[1].trim();
        }
      }

      businesses.push({
        business_name: name,
        business_category: mapTypeToCategory(target.type),
        city: city,
        address: address,
        phone: phoneMatch ? phoneMatch[1] : undefined,
        website: websiteMatch ? websiteMatch[1] : undefined,
        short_description: `${mapTypeToCategory(target.type)} in ${city}, Michigan`,
      });
    }

    if (businesses.length > 0) break;
  }

  return businesses;
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

/**
 * Map scraper type to business category
 */
function mapTypeToCategory(type: string): string {
  const categoryMap: Record<string, string> = {
    restaurant: 'Restaurant & Bar',
    hotel: 'Lodging',
    lodging: 'Lodging',
    attraction: 'Tourism & Attractions',
    tourism: 'Tourism & Attractions',
    museum: 'Arts & Culture',
    park: 'Outdoor Recreation',
    brewery: 'Restaurant & Bar',
    winery: 'Food & Beverage',
    shop: 'Retail',
    retail: 'Retail',
    local_business: 'Local Business',
  };

  return categoryMap[type.toLowerCase()] || 'Local Business';
}
