import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verify admin authentication
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== 'admin-key') { // This should be properly secured
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call the Cloudflare Platform API to get partners
    const platformApiUrl = import.meta.env.PLATFORM_API_URL || 'https://michiganspots-platform.your-subdomain.workers.dev';
    
    const response = await fetch(`${platformApiUrl}/api/partners`, {
      headers: {
        'X-API-Key': import.meta.env.PARTNER_WEBHOOK_SECRET || 'your-webhook-secret'
      }
    });

    if (!response.ok) {
      throw new Error(`Platform API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      partners: data.partners || [],
      total: data.total || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('List partners API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch partners',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};