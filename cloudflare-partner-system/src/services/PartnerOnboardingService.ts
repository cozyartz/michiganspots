/**
 * Partner Onboarding Service
 * Manages the complete partner onboarding process and data storage
 */

import { Env } from '../index';

export interface PartnerData {
  partnerId: string;
  businessInfo: any;
  pageContent: string;
  qrCodeData: any;
  workerInfo: any;
  createdAt: string;
  status: 'active' | 'inactive' | 'pending';
  lastUpdated?: string;
}

export class PartnerOnboardingService {
  constructor(private env: Env) {}

  async generatePartnerId(businessInfo: any): Promise<string> {
    // Generate unique partner ID based on business info and timestamp
    const businessSlug = businessInfo.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);
    
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${businessSlug}-${timestamp}-${random}`;
  }

  async storePartnerData(data: PartnerData): Promise<void> {
    try {
      // Store in KV
      await this.env.PARTNERS.put(
        `partner:${data.partnerId}`,
        JSON.stringify(data),
        { expirationTtl: 86400 * 365 * 2 } // 2 years
      );

      // Store in D1 database for querying
      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO partners (
          partner_id, business_name, business_info, status, created_at, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        data.partnerId,
        data.businessInfo.businessName,
        JSON.stringify(data.businessInfo),
        data.status,
        data.createdAt,
        data.lastUpdated || data.createdAt
      ).run();

      console.log(`✅ Partner data stored: ${data.partnerId}`);

    } catch (error) {
      console.error('Partner data storage error:', error);
      throw error;
    }
  }

  async getPartnerData(partnerId: string): Promise<PartnerData | null> {
    try {
      const data = await this.env.PARTNERS.get(`partner:${partnerId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Partner data retrieval error:', error);
      return null;
    }
  }

  async updatePartnerData(partnerId: string, updates: Partial<PartnerData>): Promise<void> {
    try {
      const existingData = await this.getPartnerData(partnerId);
      
      if (!existingData) {
        throw new Error('Partner not found');
      }

      const updatedData: PartnerData = {
        ...existingData,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      await this.storePartnerData(updatedData);

    } catch (error) {
      console.error('Partner data update error:', error);
      throw error;
    }
  }

  async getAllPartners(): Promise<PartnerData[]> {
    try {
      const { keys } = await this.env.PARTNERS.list({ prefix: 'partner:' });
      
      const partners: PartnerData[] = [];
      
      for (const key of keys) {
        try {
          const data = await this.env.PARTNERS.get(key.name);
          if (data) {
            partners.push(JSON.parse(data));
          }
        } catch (error) {
          console.error(`Error loading partner ${key.name}:`, error);
        }
      }

      return partners.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    } catch (error) {
      console.error('Get all partners error:', error);
      return [];
    }
  }

  async getPartnerAnalytics(partnerId: string, timeframe: string): Promise<any> {
    try {
      // Get analytics data from various sources
      const [visits, qrScans, challenges] = await Promise.all([
        this.getVisitAnalytics(partnerId, timeframe),
        this.getQRScanAnalytics(partnerId, timeframe),
        this.getChallengeAnalytics(partnerId, timeframe)
      ]);

      return {
        partnerId,
        timeframe,
        visits,
        qrScans,
        challenges,
        summary: {
          totalVisits: visits.total,
          totalQRScans: qrScans.total,
          totalChallenges: challenges.total,
          conversionRate: visits.total > 0 ? (challenges.total / visits.total * 100).toFixed(2) : 0
        },
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Partner analytics error:', error);
      return null;
    }
  }

  async recordChallengeCompletion(partnerId: string, challengeId: string, userId: string): Promise<void> {
    try {
      const event = {
        partnerId,
        challengeId,
        userId,
        timestamp: new Date().toISOString(),
        eventId: crypto.randomUUID()
      };

      await this.env.PARTNERS.put(
        `challenge:${partnerId}:${event.eventId}`,
        JSON.stringify(event),
        { expirationTtl: 86400 * 365 } // 1 year
      );

      // Update daily challenge count
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `daily_challenges:${partnerId}:${today}`;
      
      const currentCount = await this.env.PARTNERS.get(dailyKey);
      const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
      
      await this.env.PARTNERS.put(
        dailyKey,
        newCount.toString(),
        { expirationTtl: 86400 * 365 }
      );

    } catch (error) {
      console.error('Challenge completion recording error:', error);
    }
  }

  async recordPartnerVisit(partnerId: string, source: string): Promise<void> {
    try {
      const event = {
        partnerId,
        source,
        timestamp: new Date().toISOString(),
        eventId: crypto.randomUUID()
      };

      await this.env.PARTNERS.put(
        `visit:${partnerId}:${event.eventId}`,
        JSON.stringify(event),
        { expirationTtl: 86400 * 90 } // 90 days
      );

      // Update daily visit count
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `daily_visits:${partnerId}:${today}`;
      
      const currentCount = await this.env.PARTNERS.get(dailyKey);
      const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
      
      await this.env.PARTNERS.put(
        dailyKey,
        newCount.toString(),
        { expirationTtl: 86400 * 365 }
      );

    } catch (error) {
      console.error('Partner visit recording error:', error);
    }
  }

  private async getVisitAnalytics(partnerId: string, timeframe: string): Promise<any> {
    // Implementation would aggregate visit data based on timeframe
    return {
      total: 0,
      byDay: [],
      bySources: []
    };
  }

  private async getQRScanAnalytics(partnerId: string, timeframe: string): Promise<any> {
    // Implementation would aggregate QR scan data
    return {
      total: 0,
      byDay: [],
      uniqueScans: 0
    };
  }

  private async getChallengeAnalytics(partnerId: string, timeframe: string): Promise<any> {
    // Implementation would aggregate challenge completion data
    return {
      total: 0,
      byDay: [],
      completionRate: 0
    };
  }
}