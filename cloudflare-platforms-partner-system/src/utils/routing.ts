/**
 * Domain-based routing for partner sites
 * Routes requests based on custom hostname to appropriate partner content
 */

import { Context } from 'hono';
import { Env } from '../index';
import { PartnerService } from '../services/PartnerService';
import { AnalyticsService } from '../services/AnalyticsService';
import { QRCodeService } from '../services/QRCodeService';

export async function routeByHostname(c: Context<{ Bindings: Env }>, hostname: string): Promise<Response> {
  try {
    // Extract subdomain from hostname
    const subdomain = hostname.replace(`.${c.env.BASE_DOMAIN}`, '');
    
    console.log(`🔀 Routing request for subdomain: ${subdomain}`);

    // Get partner data by subdomain
    const partnerService = new PartnerService(c.env);
    const partnerData = await partnerService.getPartnerBySubdomain(subdomain);

    if (!partnerData) {
      return createNotFoundResponse(subdomain, c.env.BASE_DOMAIN);
    }

    // Track the visit
    const analyticsService = new AnalyticsService(c.env);
    await analyticsService.trackVisit(partnerData.partnerId, {
      hostname,
      userAgent: c.req.header('user-agent'),
      referer: c.req.header('referer'),
      ip: c.req.header('cf-connecting-ip'),
      country: c.req.raw.cf?.country as string,
      timestamp: new Date().toISOString()
    });

    // Handle different routes
    const pathname = new URL(c.req.url).pathname;

    switch (pathname) {
      case '/':
        return servePartnerHomePage(partnerData, c);
      
      case '/qr':
      case '/qr.png':
        return serveQRCode(partnerData, 'png', c);
      
      case '/qr.svg':
        return serveQRCode(partnerData, 'svg', c);
      
      case '/qr/download':
        return serveQRCodeDownload(partnerData, c);
      
      case '/analytics':
        return serveAnalyticsDashboard(partnerData, c);
      
      case '/api/visit':
        return handleVisitTracking(partnerData, c);
      
      case '/health':
        return c.json({
          status: 'healthy',
          partner: partnerData.businessInfo.businessName,
          hostname,
          timestamp: new Date().toISOString()
        });
      
      default:
        // Serve partner home page for any other route
        return servePartnerHomePage(partnerData, c);
    }

  } catch (error) {
    console.error('Routing error:', error);
    return createErrorResponse(hostname, error);
  }
}

async function servePartnerHomePage(partnerData: any, c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Serve the AI-generated partner page
    return new Response(partnerData.pageContent, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
        'X-Partner-ID': partnerData.partnerId,
        'X-Powered-By': 'Michigan Spots Platform'
      }
    });
  } catch (error) {
    console.error('Serve partner page error:', error);
    return createErrorResponse(partnerData.customHostname, error);
  }
}

async function serveQRCode(partnerData: any, format: 'png' | 'svg', c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const qrCodeService = new QRCodeService(c.env);
    const qrCode = await qrCodeService.getQRCode(partnerData.partnerId, format);

    const contentType = format === 'svg' ? 'image/svg+xml' : 'image/png';
    
    return new Response(qrCode, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Partner-ID': partnerData.partnerId
      }
    });
  } catch (error) {
    console.error('Serve QR code error:', error);
    return new Response('QR Code Unavailable', { status: 404 });
  }
}

async function serveQRCodeDownload(partnerData: any, c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const qrCodeService = new QRCodeService(c.env);
    const qrCode = await qrCodeService.getQRCode(partnerData.partnerId, 'png');

    const filename = `${partnerData.businessInfo.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-QR-Code.png`;
    
    return new Response(qrCode, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Partner-ID': partnerData.partnerId
      }
    });
  } catch (error) {
    console.error('Serve QR download error:', error);
    return new Response('QR Code Download Unavailable', { status: 404 });
  }
}

async function serveAnalyticsDashboard(partnerData: any, c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const analyticsService = new AnalyticsService(c.env);
    const analytics = await analyticsService.getPartnerAnalytics(partnerData.partnerId, '30d');

    const dashboardHTML = generateAnalyticsDashboard(partnerData, analytics);
    
    return new Response(dashboardHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'private, max-age=300', // 5 minutes
        'X-Partner-ID': partnerData.partnerId
      }
    });
  } catch (error) {
    console.error('Serve analytics dashboard error:', error);
    return createErrorResponse(partnerData.customHostname, error);
  }
}

async function handleVisitTracking(partnerData: any, c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json();
    
    const analyticsService = new AnalyticsService(c.env);
    await analyticsService.trackCustomEvent(partnerData.partnerId, {
      event: body.event || 'custom_visit',
      data: body.data || {},
      timestamp: new Date().toISOString()
    });

    return c.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Visit tracking error:', error);
    return c.json({
      success: false,
      error: 'Failed to track event'
    }, 500);
  }
}

function generateAnalyticsDashboard(partnerData: any, analytics: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics - ${partnerData.businessInfo.businessName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .metric-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
        }
        
        .metric-label {
            color: #6b7280;
            font-size: 1.1em;
        }
        
        .chart-container {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .michigan-badge {
            background: linear-gradient(135deg, #059669, #0ea5e9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="michigan-badge">🗺️ Michigan Spots Partner</div>
            <h1>${partnerData.businessInfo.businessName}</h1>
            <p>Analytics Dashboard - Last 30 Days</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-number">${analytics?.visits?.total || 0}</div>
                <div class="metric-label">Total Visits</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-number">${analytics?.qrScans?.total || 0}</div>
                <div class="metric-label">QR Code Scans</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-number">${analytics?.challenges?.total || 0}</div>
                <div class="metric-label">Challenges Completed</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-number">${analytics?.conversionRate || '0.0'}%</div>
                <div class="metric-label">Conversion Rate</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3>📊 Performance Overview</h3>
            <p>Your Michigan Spots partnership is driving engagement and bringing customers to your business!</p>
            <br>
            <p><strong>Top Traffic Sources:</strong></p>
            <ul>
                <li>QR Code Scans: ${analytics?.qrScans?.total || 0}</li>
                <li>Direct Visits: ${(analytics?.visits?.total || 0) - (analytics?.qrScans?.total || 0)}</li>
                <li>Social Media: ${analytics?.social?.total || 0}</li>
            </ul>
        </div>
        
        <div class="chart-container">
            <h3>🎯 Michigan Spots Integration</h3>
            <p>Customers are discovering your business through our treasure hunt platform!</p>
            <br>
            <p><strong>Recent Activity:</strong></p>
            <ul>
                <li>Treasure hunt challenges completed at your location</li>
                <li>QR code scans from marketing materials</li>
                <li>Social media shares and engagement</li>
                <li>Customer reviews and feedback</li>
            </ul>
        </div>
    </div>
    
    <script>
        // Auto-refresh analytics every 5 minutes
        setTimeout(() => {
            window.location.reload();
        }, 300000);
    </script>
</body>
</html>
  `;
}

function createNotFoundResponse(subdomain: string, baseDomain: string): Response {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Partner Not Found - Michigan Spots</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        .michigan-badge {
            background: linear-gradient(135deg, #059669, #0ea5e9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="michigan-badge">🗺️ Michigan Spots</div>
        <h1>Partner Not Found</h1>
        <p>The partner site <strong>${subdomain}.${baseDomain}</strong> doesn't exist or hasn't been set up yet.</p>
        <p>If you're a business owner looking to join Michigan Spots, please contact us!</p>
        <br>
        <a href="https://${baseDomain}" style="color: #059669; text-decoration: none; font-weight: bold;">
            ← Back to Michigan Spots
        </a>
    </div>
</body>
</html>
  `;

  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

function createErrorResponse(hostname: string, error: any): Response {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Michigan Spots</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            max-width: 500px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Something went wrong</h1>
        <p>We're having trouble loading the partner site for <strong>${hostname}</strong>.</p>
        <p>Please try again in a few moments.</p>
        <br>
        <a href="/" style="color: #059669; text-decoration: none; font-weight: bold;">
            🔄 Try Again
        </a>
    </div>
</body>
</html>
  `;

  return new Response(html, {
    status: 500,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}