/**
 * Worker Deployment Service
 * Automatically deploys dedicated Cloudflare Workers for each business partner
 */

import { Env } from '../index';

export interface WorkerDeploymentRequest {
  partnerId: string;
  pageContent: string;
  qrCodeData: any;
  businessInfo: any;
}

export interface WorkerInfo {
  name: string;
  url: string;
  status: 'deployed' | 'deploying' | 'failed';
  deployedAt: string;
  subdomain?: string;
}

export class WorkerDeploymentService {
  constructor(private env: Env) {}

  async deployPartnerWorker(request: WorkerDeploymentRequest): Promise<WorkerInfo> {
    try {
      console.log(`🚀 Deploying worker for partner: ${request.partnerId}`);

      // Generate unique worker name
      const workerName = this.generateWorkerName(request.partnerId, request.businessInfo);
      
      // Create worker script content
      const workerScript = this.generateWorkerScript(request);
      
      // Deploy worker using Cloudflare API
      const deploymentResult = await this.deployToCloudflare(workerName, workerScript);
      
      // Set up custom subdomain if needed
      const subdomain = await this.setupCustomSubdomain(workerName, request.partnerId);
      
      const workerInfo: WorkerInfo = {
        name: workerName,
        url: deploymentResult.url,
        status: 'deployed',
        deployedAt: new Date().toISOString(),
        subdomain
      };

      // Store worker information
      await this.storeWorkerInfo(request.partnerId, workerInfo);

      console.log(`✅ Worker deployed successfully: ${workerInfo.url}`);
      return workerInfo;

    } catch (error) {
      console.error('Worker deployment error:', error);
      
      // Return failed status but don't throw - we can fallback to main domain
      return {
        name: `failed-${request.partnerId}`,
        url: `${this.env.BASE_URL}/partners/${request.partnerId}`,
        status: 'failed',
        deployedAt: new Date().toISOString()
      };
    }
  }

  async updatePartnerWorker(request: {
    partnerId: string;
    pageContent: string;
    businessInfo: any;
  }): Promise<WorkerInfo> {
    try {
      console.log(`🔄 Updating worker for partner: ${request.partnerId}`);

      // Get existing worker info
      const existingWorker = await this.getWorkerInfo(request.partnerId);
      
      if (!existingWorker || existingWorker.status === 'failed') {
        // If no existing worker or failed, deploy new one
        return await this.deployPartnerWorker({
          partnerId: request.partnerId,
          pageContent: request.pageContent,
          qrCodeData: null, // Will be loaded from existing data
          businessInfo: request.businessInfo
        });
      }

      // Update existing worker
      const workerScript = this.generateWorkerScript({
        partnerId: request.partnerId,
        pageContent: request.pageContent,
        qrCodeData: null,
        businessInfo: request.businessInfo
      });

      await this.updateCloudflareWorker(existingWorker.name, workerScript);

      const updatedWorkerInfo: WorkerInfo = {
        ...existingWorker,
        status: 'deployed',
        deployedAt: new Date().toISOString()
      };

      await this.storeWorkerInfo(request.partnerId, updatedWorkerInfo);

      console.log(`✅ Worker updated successfully: ${updatedWorkerInfo.url}`);
      return updatedWorkerInfo;

    } catch (error) {
      console.error('Worker update error:', error);
      throw error;
    }
  }

  async deletePartnerWorker(partnerId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting worker for partner: ${partnerId}`);

      const workerInfo = await this.getWorkerInfo(partnerId);
      
      if (!workerInfo) {
        console.log('No worker found to delete');
        return true;
      }

      // Delete from Cloudflare
      await this.deleteFromCloudflare(workerInfo.name);
      
      // Remove from storage
      await this.env.PARTNERS.delete(`worker:${partnerId}`);

      console.log(`✅ Worker deleted successfully: ${workerInfo.name}`);
      return true;

    } catch (error) {
      console.error('Worker deletion error:', error);
      return false;
    }
  }

  private generateWorkerName(partnerId: string, businessInfo: any): string {
    // Create a safe worker name from business info
    const safeName = businessInfo.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
    
    return `michiganspots-${safeName}-${partnerId.substring(0, 8)}`;
  }

  private generateWorkerScript(request: WorkerDeploymentRequest): string {
    return `
/**
 * Dedicated Michigan Spots Partner Worker
 * Auto-generated for: ${request.businessInfo?.businessName || 'Partner'}
 * Partner ID: ${request.partnerId}
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle different routes
    switch (url.pathname) {
      case '/':
      case '/home':
        return handleHomePage(request, env);
      
      case '/qr':
        return handleQRCode(request, env);
      
      case '/analytics':
        return handleAnalytics(request, env);
      
      case '/api/visit':
        return handleVisitTracking(request, env);
      
      default:
        return handleHomePage(request, env);
    }
  }
};

async function handleHomePage(request, env) {
  // Track page visit
  await trackVisit(request, env);
  
  const pageContent = \`${request.pageContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
  
  return new Response(pageContent, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600',
      'X-Partner-ID': '${request.partnerId}'
    }
  });
}

async function handleQRCode(request, env) {
  try {
    // Get QR code from main system
    const qrResponse = await fetch(\`https://michiganspots.com/api/partners/${request.partnerId}/qr\`);
    
    if (!qrResponse.ok) {
      throw new Error('QR code not found');
    }
    
    const qrCode = await qrResponse.arrayBuffer();
    
    return new Response(qrCode, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400'
      }
    });
    
  } catch (error) {
    return new Response('QR Code Unavailable', { status: 404 });
  }
}

async function handleAnalytics(request, env) {
  // Simple analytics page for business owner
  const analyticsHTML = \`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics - ${request.businessInfo?.businessName || 'Partner'}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { background: #f0f9ff; padding: 20px; margin: 10px 0; border-radius: 8px; }
        .number { font-size: 2em; font-weight: bold; color: #059669; }
      </style>
    </head>
    <body>
      <h1>📊 ${request.businessInfo?.businessName || 'Partner'} Analytics</h1>
      
      <div class="metric">
        <div class="number" id="visits">Loading...</div>
        <div>Total Visits</div>
      </div>
      
      <div class="metric">
        <div class="number" id="qr-scans">Loading...</div>
        <div>QR Code Scans</div>
      </div>
      
      <div class="metric">
        <div class="number" id="challenges">Loading...</div>
        <div>Challenges Completed</div>
      </div>
      
      <script>
        // Load analytics data
        fetch('/api/analytics')
          .then(response => response.json())
          .then(data => {
            document.getElementById('visits').textContent = data.visits || 0;
            document.getElementById('qr-scans').textContent = data.qrScans || 0;
            document.getElementById('challenges').textContent = data.challenges || 0;
          })
          .catch(error => {
            console.error('Analytics loading error:', error);
          });
      </script>
    </body>
    </html>
  \`;
  
  return new Response(analyticsHTML, {
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

async function handleVisitTracking(request, env) {
  try {
    const visitData = await request.json();
    
    // Track visit in main system
    await fetch('https://michiganspots.com/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.ANALYTICS_API_KEY
      },
      body: JSON.stringify({
        event: 'partner_visit',
        partnerId: '${request.partnerId}',
        timestamp: new Date().toISOString(),
        data: visitData
      })
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

async function trackVisit(request, env) {
  try {
    const visitData = {
      userAgent: request.headers.get('User-Agent'),
      referer: request.headers.get('Referer'),
      ip: request.headers.get('CF-Connecting-IP'),
      country: request.cf?.country,
      timestamp: new Date().toISOString()
    };
    
    // Send to main analytics system
    await fetch('https://michiganspots.com/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'partner_page_view',
        partnerId: '${request.partnerId}',
        timestamp: visitData.timestamp,
        data: visitData
      })
    });
    
  } catch (error) {
    console.error('Visit tracking error:', error);
    // Don't throw - tracking failures shouldn't break the page
  }
}
`;
  }

  private async deployToCloudflare(workerName: string, script: string): Promise<{ url: string }> {
    try {
      // Use Cloudflare API to deploy worker
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${await this.getAccountId()}/workers/scripts/${workerName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/javascript'
        },
        body: script
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudflare deployment failed: ${error}`);
      }

      // Set up subdomain routing
      await this.setupWorkerRoute(workerName);

      return {
        url: `https://${workerName}.michiganspots.workers.dev`
      };

    } catch (error) {
      console.error('Cloudflare deployment error:', error);
      throw error;
    }
  }

  private async updateCloudflareWorker(workerName: string, script: string): Promise<void> {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${await this.getAccountId()}/workers/scripts/${workerName}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/javascript'
        },
        body: script
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudflare update failed: ${error}`);
      }

    } catch (error) {
      console.error('Cloudflare update error:', error);
      throw error;
    }
  }

  private async deleteFromCloudflare(workerName: string): Promise<void> {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${await this.getAccountId()}/workers/scripts/${workerName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`
        }
      });

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Cloudflare deletion failed: ${error}`);
      }

    } catch (error) {
      console.error('Cloudflare deletion error:', error);
      throw error;
    }
  }

  private async setupWorkerRoute(workerName: string): Promise<void> {
    // Set up custom routing for the worker
    // This would configure the worker to respond to requests
    // Implementation depends on your Cloudflare zone setup
  }

  private async setupCustomSubdomain(workerName: string, partnerId: string): Promise<string | undefined> {
    try {
      // Create a custom subdomain like: businessname.michiganspots.com
      // This requires DNS configuration and is optional
      const subdomain = `${partnerId}.michiganspots.com`;
      
      // Implementation would set up DNS records and routing
      // For now, return the workers.dev subdomain
      return `${workerName}.michiganspots.workers.dev`;

    } catch (error) {
      console.error('Subdomain setup error:', error);
      return undefined;
    }
  }

  private async getAccountId(): Promise<string> {
    // Get Cloudflare account ID from environment
    // This should be set as an environment variable
    return this.env.CLOUDFLARE_ACCOUNT_ID || 'placeholder-account-id';
  }

  private async storeWorkerInfo(partnerId: string, workerInfo: WorkerInfo): Promise<void> {
    await this.env.PARTNERS.put(
      `worker:${partnerId}`,
      JSON.stringify(workerInfo),
      { expirationTtl: 86400 * 365 } // 1 year
    );
  }

  private async getWorkerInfo(partnerId: string): Promise<WorkerInfo | null> {
    try {
      const data = await this.env.PARTNERS.get(`worker:${partnerId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Worker info retrieval error:', error);
      return null;
    }
  }

  async listAllWorkers(): Promise<WorkerInfo[]> {
    try {
      // Get all worker keys
      const { keys } = await this.env.PARTNERS.list({ prefix: 'worker:' });
      
      const workers: WorkerInfo[] = [];
      
      for (const key of keys) {
        try {
          const data = await this.env.PARTNERS.get(key.name);
          if (data) {
            workers.push(JSON.parse(data));
          }
        } catch (error) {
          console.error(`Error loading worker ${key.name}:`, error);
        }
      }

      return workers;

    } catch (error) {
      console.error('List workers error:', error);
      return [];
    }
  }

  async getWorkerStatus(partnerId: string): Promise<'deployed' | 'deploying' | 'failed' | 'not_found'> {
    try {
      const workerInfo = await this.getWorkerInfo(partnerId);
      return workerInfo ? workerInfo.status : 'not_found';
    } catch (error) {
      console.error('Worker status check error:', error);
      return 'failed';
    }
  }
}