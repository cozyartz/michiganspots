import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Call the Cloudflare Platform API to get status
    const platformApiUrl = import.meta.env.PLATFORM_API_URL || 'https://michiganspots-platform.your-subdomain.workers.dev';
    
    const response = await fetch(`${platformApiUrl}/api/platform/status`);

    if (!response.ok) {
      throw new Error(`Platform API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      status: data.success ? data.status : {
        platform: {
          name: 'Michigan Spots Partners',
          environment: 'production',
          base_domain: 'michiganspots.com'
        },
        partners: {
          total: 0,
          active: 0
        },
        hostnames: {
          total: 0,
          active: 0,
          pending: 0,
          ssl_active: 0
        },
        health: {
          status: 'unknown',
          last_check: new Date().toISOString()
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Platform status API error:', error);
    
    // Return fallback status
    return new Response(JSON.stringify({
      success: true,
      status: {
        platform: {
          name: 'Michigan Spots Partners',
          environment: 'production',
          base_domain: 'michiganspots.com'
        },
        partners: {
          total: 0,
          active: 0
        },
        hostnames: {
          total: 0,
          active: 0,
          pending: 0,
          ssl_active: 0
        },
        health: {
          status: 'degraded',
          error: error instanceof Error ? error.message : 'Unknown error',
          last_check: new Date().toISOString()
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};