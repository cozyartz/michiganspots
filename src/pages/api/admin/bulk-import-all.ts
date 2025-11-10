/**
 * Bulk Import All Targets - Admin Endpoint
 *
 * Triggers the web scraper for ALL enabled targets sequentially
 * Imports 50-100 businesses from each target
 *
 * Usage:
 * - Browser: https://michiganspots.com/api/admin/bulk-import-all
 * - CLI: curl https://michiganspots.com/api/admin/bulk-import-all
 */

import type { APIRoute } from 'astro';
import { getEnabledTargets } from '../../../../functions/api/cron/scraper-targets';

export const GET: APIRoute = async ({ request, locals }) => {
  const runtime = locals.runtime as {
    env: {
      DB: D1Database;
    };
  };

  try {
    console.log('[BulkImport] Starting bulk import for all enabled targets...');

    const enabledTargets = getEnabledTargets();

    if (enabledTargets.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No enabled targets configured',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[BulkImport] Found ${enabledTargets.length} enabled targets`);

    const results = [];
    let totalDiscovered = 0;
    let totalImported = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;

    // Import from each target sequentially
    for (let i = 0; i < enabledTargets.length; i++) {
      const target = enabledTargets[i];
      console.log(`[BulkImport] Processing target ${i + 1}/${enabledTargets.length}: ${target.name}`);

      try {
        // Call the web scraper for this specific target
        const scraperUrl = new URL('/api/cron/web-scraper', request.url);
        scraperUrl.searchParams.set('target', i.toString());
        scraperUrl.searchParams.set('limit', '100');

        const scraperResponse = await fetch(scraperUrl.toString(), {
          headers: {
            'User-Agent': request.headers.get('User-Agent') || 'MichiganSpots Bulk Import',
          },
        });

        const scraperResult = await scraperResponse.json();

        if (scraperResult.success) {
          totalDiscovered += scraperResult.results.discovered || 0;
          totalImported += scraperResult.results.imported || 0;
          totalDuplicates += scraperResult.results.duplicates || 0;
          totalErrors += scraperResult.results.errors || 0;

          results.push({
            target: target.name,
            success: true,
            discovered: scraperResult.results.discovered,
            imported: scraperResult.results.imported,
            duplicates: scraperResult.results.duplicates,
            errors: scraperResult.results.errors,
          });

          console.log(
            `[BulkImport] ${target.name}: ${scraperResult.results.imported} imported, ${scraperResult.results.duplicates} duplicates`
          );
        } else {
          results.push({
            target: target.name,
            success: false,
            error: scraperResult.error || 'Unknown error',
          });
          totalErrors++;
          console.error(`[BulkImport] ${target.name} failed:`, scraperResult.error);
        }

        // Delay between targets to be respectful (5 seconds)
        if (i < enabledTargets.length - 1) {
          console.log('[BulkImport] Waiting 5 seconds before next target...');
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (error) {
        results.push({
          target: target.name,
          success: false,
          error: error instanceof Error ? error.message : 'Request failed',
        });
        totalErrors++;
        console.error(`[BulkImport] Error processing ${target.name}:`, error);
      }
    }

    console.log(
      `[BulkImport] Complete: ${totalImported} imported, ${totalDuplicates} duplicates, ${totalErrors} errors from ${results.length} targets`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bulk import complete: ${totalImported} businesses imported from ${enabledTargets.length} targets`,
        summary: {
          targets_processed: results.length,
          total_discovered: totalDiscovered,
          total_imported: totalImported,
          total_duplicates: totalDuplicates,
          total_errors: totalErrors,
        },
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[BulkImport] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Bulk import failed',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
