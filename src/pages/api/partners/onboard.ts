import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
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

    const partnerData = await request.json();

    // Validate required fields
    const requiredFields = ['businessName', 'description', 'address', 'city', 'state', 'zipCode', 'phone', 'email', 'category'];
    const missingFields = requiredFields.filter(field => !partnerData[field]);
    
    if (missingFields.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call the Cloudflare Platform API to onboard partner
    const platformApiUrl = import.meta.env.PLATFORM_API_URL || 'https://michiganspots-platform.your-subdomain.workers.dev';
    
    const response = await fetch(`${platformApiUrl}/api/partners/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': import.meta.env.PARTNER_WEBHOOK_SECRET || 'your-webhook-secret'
      },
      body: JSON.stringify(partnerData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Platform API error: ${response.status}`);
    }

    // Log the successful onboarding
    console.log(`✅ Partner onboarded: ${result.partnerId} - ${partnerData.businessName}`);
    console.log(`🌐 Custom domain: ${result.customHostname}`);

    return new Response(JSON.stringify({
      success: true,
      partnerId: result.partnerId,
      customHostname: result.customHostname,
      urls: result.urls,
      message: `Partner ${partnerData.businessName} successfully onboarded! Site will be available at https://${result.customHostname}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Partner onboarding API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to onboard partner',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};