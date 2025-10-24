/**
 * QR Code Service
 * Generates and manages QR codes for Michigan Spots partners
 */

import { Env } from '../index';

export interface QRCodeRequest {
  partnerId: string;
  businessName: string;
  targetUrl: string;
}

export interface QRCodeData {
  partnerId: string;
  url: string;
  svg: string;
  png: string;
  downloadUrl: string;
  metadata: {
    size: string;
    errorCorrectionLevel: string;
    createdAt: string;
  };
}

export class QRCodeService {
  constructor(private env: Env) {}

  async generateQRCode(request: QRCodeRequest): Promise<QRCodeData> {
    try {
      console.log(`📱 Generating QR code for partner: ${request.businessName}`);

      const targetUrl = request.targetUrl;

      // QR code options
      const qrOptions = {
        errorCorrectionLevel: 'M' as const,
        type: 'image/png' as const,
        quality: 0.92,
        margin: 2,
        color: {
          dark: '#1f2937', // Dark gray
          light: '#ffffff'  // White
        },
        width: 400
      };

      // Generate QR code using external API (since Node.js qrcode doesn't work in Workers)
      const qrApiResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}&format=png&bgcolor=ffffff&color=1f2937&margin=10`);

      if (!qrApiResponse.ok) {
        throw new Error('Failed to generate QR code via API');
      }

      const pngBuffer = await qrApiResponse.arrayBuffer();
      const pngBase64 = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(pngBuffer)))}`;

      // Generate SVG version with Michigan Spots branding
      const svgString = await this.generateBrandedSVGQRCode(targetUrl, request);

      // Store QR code data in KV
      const qrCodeData: QRCodeData = {
        partnerId: request.partnerId,
        url: targetUrl,
        svg: svgString,
        png: pngBase64,
        downloadUrl: `/qr/download`,
        metadata: {
          size: '400x400',
          errorCorrectionLevel: 'M',
          createdAt: new Date().toISOString()
        }
      };

      // Store in KV for quick retrieval
      await this.env.PARTNERS_PLATFORM.put(
        `qr:${request.partnerId}`,
        JSON.stringify(qrCodeData),
        { expirationTtl: 86400 * 365 } // 1 year
      );

      console.log(`✅ QR code generated successfully for ${request.businessName}`);
      return qrCodeData;

    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getQRCode(partnerId: string, format: 'png' | 'svg' = 'png'): Promise<string> {
    try {
      // Try to get from KV first
      const cachedData = await this.env.PARTNERS_PLATFORM.get(`qr:${partnerId}`);

      if (cachedData) {
        const qrData: QRCodeData = JSON.parse(cachedData);
        return format === 'svg' ? qrData.svg : qrData.png;
      }

      // If not cached, regenerate (this shouldn't happen in normal flow)
      throw new Error('QR code not found - partner may need to be re-onboarded');

    } catch (error) {
      console.error('QR code retrieval error:', error);
      throw error;
    }
  }

  async updateQRCode(partnerId: string, updates: Partial<QRCodeRequest>): Promise<QRCodeData> {
    try {
      // Get existing QR code data
      const existingData = await this.env.PARTNERS_PLATFORM.get(`qr:${partnerId}`);

      if (!existingData) {
        throw new Error('QR code not found for partner');
      }

      const currentData: QRCodeData = JSON.parse(existingData);

      // If no updates needed, return current data
      if (!updates.businessName && !updates.targetUrl) {
        return currentData;
      }

      // Regenerate QR code with updates
      const updatedRequest: QRCodeRequest = {
        partnerId,
        businessName: updates.businessName || 'Updated Business',
        targetUrl: updates.targetUrl || currentData.url
      };

      return await this.generateQRCode(updatedRequest);

    } catch (error) {
      console.error('QR code update error:', error);
      throw error;
    }
  }

  async generateBulkQRCodes(requests: QRCodeRequest[]): Promise<QRCodeData[]> {
    console.log(`📱 Generating ${requests.length} QR codes in bulk...`);

    const results: QRCodeData[] = [];
    const batchSize = 5; // Process in batches to avoid overwhelming the system

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      const batchPromises = batch.map(request =>
        this.generateQRCode(request).catch(error => {
          console.error(`Failed to generate QR code for ${request.businessName}:`, error);
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null) as QRCodeData[]);
    }

    console.log(`✅ Successfully generated ${results.length}/${requests.length} QR codes`);
    return results;
  }

  private async generateBrandedSVGQRCode(url: string, request: QRCodeRequest): Promise<string> {
    try {
      // Generate basic SVG QR code using external API
      const svgApiResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&format=svg&bgcolor=ffffff&color=1f2937&margin=10`);

      if (!svgApiResponse.ok) {
        throw new Error('Failed to generate SVG QR code via API');
      }

      const basicSvg = await svgApiResponse.text();

      // Enhance SVG with Michigan Spots branding
      const brandedSvg = this.addBrandingToSVG(basicSvg, request);

      return brandedSvg;

    } catch (error) {
      console.error('Branded SVG generation error:', error);

      // Fallback to basic SVG via API
      try {
        const fallbackResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&format=svg`);
        return await fallbackResponse.text();
      } catch (fallbackError) {
        // Ultimate fallback - return a simple SVG placeholder
        return `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#f3f4f6"/>
          <text x="200" y="200" text-anchor="middle" fill="#6b7280" font-size="16">QR Code Unavailable</text>
        </svg>`;
      }
    }
  }

  private addBrandingToSVG(svgString: string, request: QRCodeRequest): string {
    // Add Michigan Spots branding elements to the SVG
    const brandingElements = `
      <!-- Michigan Spots Branding -->
      <defs>
        <linearGradient id="michiganGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- Background circle -->
      <circle cx="200" cy="200" r="190" fill="url(#michiganGradient)" opacity="0.1"/>

      <!-- Michigan Spots logo/text at bottom -->
      <rect x="50" y="350" width="300" height="40" rx="20" fill="url(#michiganGradient)" filter="url(#shadow)"/>
      <text x="200" y="375" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
        🗺️ Michigan Spots Partner
      </text>

      <!-- Business name at top -->
      <rect x="50" y="10" width="300" height="30" rx="15" fill="white" filter="url(#shadow)" opacity="0.9"/>
      <text x="200" y="30" text-anchor="middle" fill="#1f2937" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
        ${request.businessName.length > 25 ? request.businessName.substring(0, 25) + '...' : request.businessName}
      </text>
    `;

    // Insert branding elements before the closing </svg> tag
    const brandedSvg = svgString.replace('</svg>', `${brandingElements}</svg>`);

    // Update viewBox to accommodate branding elements
    return brandedSvg.replace(
      /viewBox="[^"]*"/,
      'viewBox="0 0 400 400"'
    );
  }

  async getQRCodeAnalytics(partnerId: string, timeframe: string = '30d'): Promise<any> {
    try {
      // Get QR code scan analytics from KV or database
      const analyticsKey = `qr_analytics:${partnerId}:${timeframe}`;
      const analytics = await this.env.PARTNERS_PLATFORM.get(analyticsKey);

      if (analytics) {
        return JSON.parse(analytics);
      }

      // Return default analytics structure
      return {
        partnerId,
        timeframe,
        totalScans: 0,
        uniqueScans: 0,
        scansByDay: [],
        topSources: [],
        conversionRate: 0,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('QR analytics retrieval error:', error);
      return null;
    }
  }

  async trackQRCodeScan(partnerId: string, scanData: {
    userAgent?: string;
    referrer?: string;
    location?: string;
    timestamp: string;
  }): Promise<void> {
    try {
      // Store scan event for analytics
      const scanEvent = {
        partnerId,
        timestamp: scanData.timestamp,
        userAgent: scanData.userAgent,
        referrer: scanData.referrer,
        location: scanData.location,
        scanId: crypto.randomUUID()
      };

      // Store individual scan event
      await this.env.PARTNERS_PLATFORM.put(
        `scan:${partnerId}:${scanEvent.scanId}`,
        JSON.stringify(scanEvent),
        { expirationTtl: 86400 * 90 } // 90 days
      );

      // Update daily scan count
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `daily_scans:${partnerId}:${today}`;

      const currentCount = await this.env.PARTNERS_PLATFORM.get(dailyKey);
      const newCount = currentCount ? parseInt(currentCount) + 1 : 1;

      await this.env.PARTNERS_PLATFORM.put(
        dailyKey,
        newCount.toString(),
        { expirationTtl: 86400 * 365 } // 1 year
      );

      console.log(`📊 QR scan tracked for partner ${partnerId}`);

    } catch (error) {
      console.error('QR scan tracking error:', error);
      // Don't throw - analytics failures shouldn't break the user experience
    }
  }
}
