/**
 * Michigan Spots Partner System - AI-Powered Partner Onboarding
 * Automatically generates branded pages, QR codes, and worker instances for business partners
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PartnerOnboardingService } from './services/PartnerOnboardingService';
import { AIPageGeneratorService } from './services/AIPageGeneratorService';
import { QRCodeService } from './services/QRCodeService';
import { WorkerDeploymentService } from './services/WorkerDeploymentService';
import { PartnerValidationService } from './services/PartnerValidationService';
import { BrandingService } from './services/BrandingService';

export interface Env {
  AI: Ai;
  PARTNERS: KVNamespace;
  DB: D1Database;
  OPENAI_API_KEY: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  PARTNER_WEBHOOK_SECRET: string;
  QR_API_KEY: string;
  BASE_URL: string;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

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
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    services: {
      ai: 'operational',
      kv: 'operational',
      d1: 'operational'
    }
  });
});

// Partner onboarding endpoint
app.post('/api/partners/onboard', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate partner data
    const validationService = new PartnerValidationService();
    const validatedData = await validationService.validatePartnerData(body);
    
    if (!validatedData.isValid) {
      return c.json({
        success: false,
        error: 'Invalid partner data',
        details: validatedData.errors
      }, 400);
    }

    // Initialize services
    const onboardingService = new PartnerOnboardingService(c.env);
    const aiPageGenerator = new AIPageGeneratorService(c.env);
    const qrCodeService = new QRCodeService(c.env);
    const workerDeployment = new WorkerDeploymentService(c.env);
    const brandingService = new BrandingService(c.env);

    // Generate unique partner ID
    const partnerId = await onboardingService.generatePartnerId(validatedData.data);
    
    // Generate AI-powered branded page
    console.log('🤖 Generating AI-powered partner page...');
    const pageContent = await aiPageGenerator.generatePartnerPage({
      partnerId,
      businessInfo: validatedData.data,
      brandingGuidelines: await brandingService.getBrandingGuidelines()
    });

    // Generate QR code for the partner
    console.log('📱 Generating QR code...');
    const qrCodeData = await qrCodeService.generatePartnerQRCode({
      partnerId,
      businessName: validatedData.data.businessName,
      location: validatedData.data.location
    });

    // Deploy dedicated worker for this partner
    console.log('🚀 Deploying partner worker...');
    const workerInfo = await workerDeployment.deployPartnerWorker({
      partnerId,
      pageContent,
      qrCodeData,
      businessInfo: validatedData.data
    });

    // Store partner data
    await onboardingService.storePartnerData({
      partnerId,
      businessInfo: validatedData.data,
      pageContent,
      qrCodeData,
      workerInfo,
      createdAt: new Date().toISOString(),
      status: 'active'
    });

    // Generate analytics dashboard for partner
    const dashboardUrl = await aiPageGenerator.generatePartnerDashboard({
      partnerId,
      businessInfo: validatedData.data
    });

    return c.json({
      success: true,
      partnerId,
      urls: {
        partnerPage: workerInfo.url,
        qrCode: qrCodeData.url,
        dashboard: dashboardUrl,
        api: `${c.env.BASE_URL}/api/partners/${partnerId}`
      },
      qrCode: {
        svg: qrCodeData.svg,
        png: qrCodeData.png,
        downloadUrl: qrCodeData.downloadUrl
      },
      worker: {
        name: workerInfo.name,
        url: workerInfo.url,
        status: workerInfo.status
      },
      message: 'Partner successfully onboarded with AI-generated page and QR code!'
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
    const onboardingService = new PartnerOnboardingService(c.env);
    
    const partnerData = await onboardingService.getPartnerData(partnerId);
    
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

// Update partner page (regenerate with AI)
app.put('/api/partners/:partnerId/regenerate', async (c) => {
  try {
    const partnerId = c.req.param('partnerId');
    const body = await c.req.json();
    
    const onboardingService = new PartnerOnboardingService(c.env);
    const aiPageGenerator = new AIPageGeneratorService(c.env);
    const workerDeployment = new WorkerDeploymentService(c.env);
    const brandingService = new BrandingService(c.env);

    // Get existing partner data
    const existingData = await onboardingService.getPartnerData(partnerId);
    if (!existingData) {
      return c.json({
        success: false,
        error: 'Partner not found'
      }, 404);
    }

    // Regenerate page with updated information
    const updatedPageContent = await aiPageGenerator.generatePartnerPage({
      partnerId,
      businessInfo: { ...existingData.businessInfo, ...body.updates },
      brandingGuidelines: await brandingService.getBrandingGuidelines(),
      regenerationReason: body.reason || 'Manual update'
    });

    // Update worker deployment
    const updatedWorkerInfo = await workerDeployment.updatePartnerWorker({
      partnerId,
      pageContent: updatedPageContent,
      businessInfo: { ...existingData.businessInfo, ...body.updates }
    });

    // Update stored data
    await onboardingService.updatePartnerData(partnerId, {
      pageContent: updatedPageContent,
      workerInfo: updatedWorkerInfo,
      lastUpdated: new Date().toISOString()
    });

    return c.json({
      success: true,
      message: 'Partner page regenerated successfully',
      urls: {
        partnerPage: updatedWorkerInfo.url,
        dashboard: `${c.env.BASE_URL}/partners/${partnerId}/dashboard`
      }
    });

  } catch (error) {
    console.error('Partner regeneration error:', error);
    return c.json({
      success: false,
      error: 'Failed to regenerate partner page'
    }, 500);
  }
});

// Get partner QR code
app.get('/api/partners/:partnerId/qr', async (c) => {
  try {
    const partnerId = c.req.param('partnerId');
    const format = c.req.query('format') || 'png';
    
    const onboardingService = new PartnerOnboardingService(c.env);
    const partnerData = await onboardingService.getPartnerData(partnerId);
    
    if (!partnerData) {
      return c.json({
        success: false,
        error: 'Partner not found'
      }, 404);
    }

    const qrCodeService = new QRCodeService(c.env);
    const qrCode = await qrCodeService.getQRCode(partnerId, format as 'png' | 'svg');

    if (format === 'svg') {
      return new Response(qrCode, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    } else {
      return new Response(qrCode, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

  } catch (error) {
    console.error('QR code retrieval error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve QR code'
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

    const onboardingService = new PartnerOnboardingService(c.env);
    const partners = await onboardingService.getAllPartners();

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

// Partner analytics endpoint
app.get('/api/partners/:partnerId/analytics', async (c) => {
  try {
    const partnerId = c.req.param('partnerId');
    const timeframe = c.req.query('timeframe') || '30d';
    
    const onboardingService = new PartnerOnboardingService(c.env);
    const analytics = await onboardingService.getPartnerAnalytics(partnerId, timeframe);

    return c.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Partner analytics error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve analytics'
    }, 500);
  }
});

// Webhook for Reddit app integration
app.post('/api/webhook/reddit', async (c) => {
  try {
    const signature = c.req.header('X-Webhook-Signature');
    const body = await c.req.text();
    
    // Validate webhook signature
    if (!signature || !await validateWebhookSignature(body, signature, c.env.PARTNER_WEBHOOK_SECRET)) {
      return c.json({
        success: false,
        error: 'Invalid webhook signature'
      }, 401);
    }

    const data = JSON.parse(body);
    
    // Handle different webhook events
    switch (data.event) {
      case 'challenge_completed':
        await handleChallengeCompleted(data, c.env);
        break;
      case 'partner_visited':
        await handlePartnerVisited(data, c.env);
        break;
      default:
        console.log('Unknown webhook event:', data.event);
    }

    return c.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({
      success: false,
      error: 'Failed to process webhook'
    }, 500);
  }
});

// Serve partner pages (dynamic routing)
app.get('/partners/:partnerId', async (c) => {
  try {
    const partnerId = c.req.param('partnerId');
    const onboardingService = new PartnerOnboardingService(c.env);
    
    const partnerData = await onboardingService.getPartnerData(partnerId);
    
    if (!partnerData) {
      return c.html(`
        <html>
          <head>
            <title>Partner Not Found - Michigan Spots</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>🗺️ Partner Not Found</h1>
            <p>The partner page you're looking for doesn't exist.</p>
            <a href="https://michiganspots.com" style="color: #059669;">← Back to Michigan Spots</a>
          </body>
        </html>
      `, 404);
    }

    // Serve the AI-generated partner page
    return c.html(partnerData.pageContent);

  } catch (error) {
    console.error('Partner page serving error:', error);
    return c.html(`
      <html>
        <head>
          <title>Error - Michigan Spots</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>⚠️ Something went wrong</h1>
          <p>We're having trouble loading this partner page.</p>
          <a href="https://michiganspots.com" style="color: #059669;">← Back to Michigan Spots</a>
        </body>
      </html>
    `, 500);
  }
});

// Helper functions
async function validateWebhookSignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === `sha256=${expectedHex}`;
}

async function handleChallengeCompleted(data: any, env: Env): Promise<void> {
  // Update partner analytics when a challenge is completed
  const onboardingService = new PartnerOnboardingService(env);
  await onboardingService.recordChallengeCompletion(data.partnerId, data.challengeId, data.userId);
}

async function handlePartnerVisited(data: any, env: Env): Promise<void> {
  // Track partner page visits
  const onboardingService = new PartnerOnboardingService(env);
  await onboardingService.recordPartnerVisit(data.partnerId, data.source);
}

export default app;