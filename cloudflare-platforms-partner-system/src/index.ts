/**
 * Michigan Spots Platform Worker - Cloudflare for Platforms
 * Multi-tenant partner system with automatic custom domains
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PlatformService } from './services/PlatformService';
import { PartnerService } from './services/PartnerService';
import { AIPageService } from './services/AIPageService';
import { QRCodeService } from './services/QRCodeService';
import { AnalyticsService } from './services/AnalyticsService';
import { routeByHostname } from './utils/routing';
import { validatePartnerData } from './utils/validation';

export interface Env {
  AI: Ai;
  PARTNERS_PLATFORM: KVNamespace;
  DB: D1Database;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_ZONE_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  PARTNER_WEBHOOK_SECRET: string;
  OPENAI_API_KEY?: string;
  BASE_DOMAIN: string;
  PLATFORM_NAME: string;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env; Variables: {} }>();

// CORS configuration
app.use('*', cors({
  origin: ['https://michiganspots.com', 'https://www.reddit.com', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    platform: 'Michigan Spots Partners',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    services: {
      ai: 'operational',
      kv: 'operational',
      d1: 'operational',
      platforms: 'operational'
    }
  });
});

// Platform management endpoints
app.get('/api/platform/status', async (c) => {
  try {
    const platformService = new PlatformService(c.env);
    const status = await platformService.getPlatformStatus();
    
    return c.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Platform status error:', error);
    return c.json({
      success: false,
      error: 'Failed to get platform status'
    }, 500);
  }
});

// Partner onboarding endpoint
app.post('/api/partners/onboard', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate partner data
    const validation = validatePartnerData(body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: 'Invalid partner data',
        details: validation.errors
      }, 400);
    }

    // Initialize services
    const platformService = new PlatformService(c.env);
    const partnerService = new PartnerService(c.env);
    const aiPageService = new AIPageService(c.env);
    const qrCodeService = new QRCodeService(c.env);
    const analyticsService = new AnalyticsService(c.env);

    console.log(`🚀 Onboarding partner: ${validation.data.businessName}`);

    // Generate partner ID and subdomain
    const partnerId = await partnerService.generatePartnerId(validation.data);
    const subdomain = await partnerService.generateSubdomain(validation.data.businessName);
    const customHostname = `${subdomain}.${c.env.BASE_DOMAIN}`;

    // Generate AI-powered partner page
    console.log('🤖 Generating AI-powered partner page...');
    const pageContent = await aiPageService.generatePartnerPage({
      partnerId,
      businessInfo: validation.data,
      customHostname
    });

    // Generate branded QR code
    console.log('📱 Generating branded QR code...');
    const qrCodeData = await qrCodeService.generateQRCode({
      partnerId,
      businessName: validation.data.businessName,
      targetUrl: `https://${customHostname}`
    });

    // Provision custom hostname via Cloudflare for Platforms
    console.log('🌐 Provisioning custom hostname...');
    const hostnameResult = await platformService.provisionCustomHostname({
      hostname: customHostname,
      partnerId,
      businessName: validation.data.businessName
    });

    // Store partner data
    const partnerData = {
      partnerId,
      businessInfo: validation.data,
      subdomain,
      customHostname,
      pageContent,
      qrCodeData,
      hostnameStatus: hostnameResult,
      createdAt: new Date().toISOString(),
      status: 'active' as const
    };

    await partnerService.storePartnerData(partnerData);

    // Set up analytics tracking
    await analyticsService.setupPartnerTracking(partnerId, customHostname);

    console.log(`✅ Partner onboarded successfully: ${customHostname}`);

    return c.json({
      success: true,
      partnerId,
      customHostname,
      urls: {
        partnerSite: `https://${customHostname}`,
        qrCode: `https://${customHostname}/qr`,
        analytics: `https://${customHostname}/analytics`,
        api: `https://platform.michiganspots.com/api/partners/${partnerId}`
      },
      qrCode: {
        svg: qrCodeData.svg,
        png: qrCodeData.png,
        downloadUrl: `https://${customHostname}/qr/download`
      },
      hostname: {
        status: hostnameResult.status,
        ssl: hostnameResult.ssl_status,
        verification: hostnameResult.verification_errors
      },
      message: `Partner successfully onboarded! Site will be available at https://${customHostname} once DNS propagates.`
    });

  } catch (error) {
    console.error('Partner onboarding error:', error);
    return c.json({
      success: false,
      error: 'Failed to onboard partner',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get partner information
app.get('/api/partners/:partnerId', async (c) => {
  try {
    const partnerId = c.req.param('partnerId');
    const partnerService = new PartnerService(c.env);
    
    const partnerData = await partnerService.getPartnerData(partnerId);
    
    if (!partnerData) {
      return c.json({
        success: false,
        error: 'Partner not found'
      }, 404);
    }

    return c.json({
      success: true,
      partner: partnerData
    });

  } catch (error) {
    console.error('Get partner error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve partner data'
    }, 500);
  }
});

// Update partner information
app.put('/api/partners/:partnerId', async (c) => {
  try {
    const partnerId = c.req.param('partnerId');
    const updates = await c.req.json();
    
    const partnerService = new PartnerService(c.env);
    const aiPageService = new AIPageService(c.env);
    
    // Get existing partner data
    const existingData = await partnerService.getPartnerData(partnerId);
    if (!existingData) {
      return c.json({
        success: false,
        error: 'Partner not found'
      }, 404);
    }

    // Regenerate page with updates
    const updatedPageContent = await aiPageService.generatePartnerPage({
      partnerId,
      businessInfo: { ...existingData.businessInfo, ...updates },
      customHostname: existingData.customHostname
    });

    // Update partner data
    await partnerService.updatePartnerData(partnerId, {
      businessInfo: { ...existingData.businessInfo, ...updates },
      pageContent: updatedPageContent,
      lastUpdated: new Date().toISOString()
    });

    return c.json({
      success: true,
      message: 'Partner updated successfully',
      customHostname: existingData.customHostname
    });

  } catch (error) {
    console.error('Partner update error:', error);
    return c.json({
      success: false,
      error: 'Failed to update partner'
    }, 500);
  }
});

// List all partners (admin endpoint)
app.get('/api/partners', async (c) => {
  try {
    const apiKey = c.req.header('X-API-Key');
    
    // Validate admin access
    if (!apiKey || apiKey !== c.env.PARTNER_WEBHOOK_SECRET) {
      return c.json({
        success: false,
        error: 'Unauthorized'
      }, 401);
    }

    const partnerService = new PartnerService(c.env);
    const partners = await partnerService.getAllPartners();

    return c.json({
      success: true,
      partners,
      total: partners.length
    });

  } catch (error) {
    console.error('List partners error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve partners'
    }, 500);
  }
});

// Analytics endpoints
app.get('/api/analytics/:partnerId', async (c) => {
  try {
    const partnerId = c.req.param('partnerId');
    const timeframe = c.req.query('timeframe') || '30d';
    
    const analyticsService = new AnalyticsService(c.env);
    const analytics = await analyticsService.getPartnerAnalytics(partnerId, timeframe);

    return c.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve analytics'
    }, 500);
  }
});

// Platform-wide analytics
app.get('/api/analytics/platform/summary', async (c) => {
  try {
    const apiKey = c.req.header('X-API-Key');
    
    if (!apiKey || apiKey !== c.env.PARTNER_WEBHOOK_SECRET) {
      return c.json({
        success: false,
        error: 'Unauthorized'
      }, 401);
    }

    const analyticsService = new AnalyticsService(c.env);
    const summary = await analyticsService.getPlatformSummary();

    return c.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Platform analytics error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve platform analytics'
    }, 500);
  }
});

// Domain-based routing for partner sites
app.get('*', async (c) => {
  try {
    const hostname = c.req.header('host') || '';
    
    // Check if this is a partner domain
    if (hostname.endsWith(`.${c.env.BASE_DOMAIN}`) && hostname !== c.env.BASE_DOMAIN) {
      return await routeByHostname(c, hostname);
    }

    // Default response for platform domain
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Michigan Spots Partner Platform</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #059669, #0ea5e9);
              color: white;
              min-height: 100vh;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: rgba(255,255,255,0.1);
              padding: 40px;
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🗺️ Michigan Spots Partner Platform</h1>
            <p>Multi-tenant partner system powered by Cloudflare for Platforms</p>
            <p><strong>Status:</strong> Operational</p>
            <p><strong>Partners:</strong> Serving custom domains automatically</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Routing error:', error);
    return c.html(`
      <html>
        <body style="font-family: system-ui; text-align: center; padding: 50px;">
          <h1>⚠️ Error</h1>
          <p>Something went wrong. Please try again later.</p>
        </body>
      </html>
    `, 500);
  }
});

export default app;