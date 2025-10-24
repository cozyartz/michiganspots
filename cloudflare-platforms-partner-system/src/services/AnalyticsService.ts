/**
 * Analytics Service - Track visits, events, and partner performance
 */

import { Env } from '../index';

export interface VisitData {
  hostname?: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
  country?: string;
  timestamp: string;
}

export interface CustomEvent {
  event: string;
  data: any;
  timestamp: string;
}

export class AnalyticsService {
  constructor(private env: Env) {}

  async setupPartnerTracking(partnerId: string, customHostname: string): Promise<void> {
    try {
      console.log(`📊 Setting up analytics for partner: ${partnerId}`);

      // Initialize analytics data structure
      const analyticsSetup = {
        partnerId,
        customHostname,
        setupAt: new Date().toISOString(),
        totalVisits: 0,
        totalQRScans: 0,
        totalChallenges: 0,
        firstVisit: null,
        lastVisit: null
      };

      // Store in KV
      await this.env.PARTNERS_PLATFORM.put(
        `analytics:${partnerId}:setup`,
        JSON.stringify(analyticsSetup),
        { expirationTtl: 86400 * 365 * 2 } // 2 years
      );

      console.log(`✅ Analytics tracking set up for ${partnerId}`);

    } catch (error) {
      console.error('Setup partner tracking error:', error);
      // Don't throw - analytics setup failures shouldn't block partner onboarding
    }
  }

  async trackVisit(partnerId: string, visitData: VisitData): Promise<void> {
    try {
      // Generate unique visit ID
      const visitId = crypto.randomUUID();

      // Store visit event
      const visitEvent = {
        visitId,
        partnerId,
        ...visitData,
        type: 'visit'
      };

      // Store in KV (short-term for recent activity)
      await this.env.PARTNERS_PLATFORM.put(
        `visit:${partnerId}:${visitId}`,
        JSON.stringify(visitEvent),
        { expirationTtl: 86400 * 30 } // 30 days
      );

      // Update daily visit count
      const today = new Date().toISOString().split('T')[0];
      const dailyKey = `daily_visits:${partnerId}:${today}`;

      const currentCount = await this.env.PARTNERS_PLATFORM.get(dailyKey);
      const newCount = currentCount ? parseInt(currentCount) + 1 : 1;

      await this.env.PARTNERS_PLATFORM.put(
        dailyKey,
        newCount.toString(),
        { expirationTtl: 86400 * 365 } // 1 year
      );

      // Update total visit counter
      await this.incrementPartnerMetric(partnerId, 'totalVisits');

      // Store in D1 for long-term analytics
      await this.env.DB.prepare(`
        INSERT INTO analytics_events (
          partner_id, event_type, event_data, hostname,
          user_agent, referer, ip_address, country, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        partnerId,
        'visit',
        JSON.stringify(visitData),
        visitData.hostname,
        visitData.userAgent,
        visitData.referer,
        visitData.ip,
        visitData.country,
        visitData.timestamp
      ).run();

      console.log(`📊 Visit tracked for partner ${partnerId}`);

    } catch (error) {
      console.error('Track visit error:', error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  async trackCustomEvent(partnerId: string, eventData: CustomEvent): Promise<void> {
    try {
      const eventId = crypto.randomUUID();

      const customEvent = {
        eventId,
        partnerId,
        ...eventData
      };

      // Store in KV
      await this.env.PARTNERS_PLATFORM.put(
        `event:${partnerId}:${eventId}`,
        JSON.stringify(customEvent),
        { expirationTtl: 86400 * 90 } // 90 days
      );

      // Store in D1
      await this.env.DB.prepare(`
        INSERT INTO analytics_events (
          partner_id, event_type, event_data, timestamp
        ) VALUES (?, ?, ?, ?)
      `).bind(
        partnerId,
        eventData.event,
        JSON.stringify(eventData.data),
        eventData.timestamp
      ).run();

      console.log(`📊 Custom event tracked: ${eventData.event} for partner ${partnerId}`);

    } catch (error) {
      console.error('Track custom event error:', error);
      // Don't throw
    }
  }

  async getPartnerAnalytics(partnerId: string, timeframe: string = '30d'): Promise<any> {
    try {
      // Parse timeframe (e.g., '30d', '7d', '90d')
      const days = parseInt(timeframe.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString();

      // Get total visits
      const visitsQuery = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_visits
        FROM analytics_events
        WHERE partner_id = ? AND event_type = 'visit' AND timestamp >= ?
      `).bind(partnerId, startDateStr).first();

      // Get QR scans
      const qrScansQuery = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_scans
        FROM qr_scans
        WHERE partner_id = ? AND timestamp >= ?
      `).bind(partnerId, startDateStr).first();

      // Get challenges completed
      const challengesQuery = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_challenges
        FROM challenge_completions
        WHERE partner_id = ? AND timestamp >= ?
      `).bind(partnerId, startDateStr).first();

      // Get top referrers
      const referrersQuery = await this.env.DB.prepare(`
        SELECT referer, COUNT(*) as count
        FROM analytics_events
        WHERE partner_id = ? AND event_type = 'visit' AND timestamp >= ? AND referer IS NOT NULL
        GROUP BY referer
        ORDER BY count DESC
        LIMIT 5
      `).bind(partnerId, startDateStr).all();

      // Get country breakdown
      const countriesQuery = await this.env.DB.prepare(`
        SELECT country, COUNT(*) as count
        FROM analytics_events
        WHERE partner_id = ? AND event_type = 'visit' AND timestamp >= ? AND country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      `).bind(partnerId, startDateStr).all();

      const totalVisits = (visitsQuery?.total_visits as number) || 0;
      const totalScans = (qrScansQuery?.total_scans as number) || 0;
      const totalChallenges = (challengesQuery?.total_challenges as number) || 0;

      // Calculate conversion rate (challenges / visits)
      const conversionRate = totalVisits > 0
        ? ((totalChallenges / totalVisits) * 100).toFixed(2)
        : '0.00';

      return {
        partnerId,
        timeframe,
        visits: {
          total: totalVisits,
          unique: totalVisits, // Simplified - would need IP tracking for true unique count
        },
        qrScans: {
          total: totalScans
        },
        challenges: {
          total: totalChallenges
        },
        conversionRate,
        topReferrers: referrersQuery?.results || [],
        topCountries: countriesQuery?.results || [],
        social: {
          total: 0 // Placeholder for social media metrics
        },
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Get partner analytics error:', error);
      // Return default structure on error
      return {
        partnerId,
        timeframe,
        visits: { total: 0, unique: 0 },
        qrScans: { total: 0 },
        challenges: { total: 0 },
        conversionRate: '0.00',
        topReferrers: [],
        topCountries: [],
        social: { total: 0 },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async getPlatformSummary(): Promise<any> {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Get platform stats
      const statsQuery = await this.env.DB.prepare(`
        SELECT * FROM platform_stats WHERE date = ?
      `).bind(today).first();

      // If no stats for today, calculate them
      if (!statsQuery) {
        await this.updatePlatformStats();
        const newStatsQuery = await this.env.DB.prepare(`
          SELECT * FROM platform_stats WHERE date = ?
        `).bind(today).first();

        return this.formatPlatformStats(newStatsQuery);
      }

      return this.formatPlatformStats(statsQuery);

    } catch (error) {
      console.error('Get platform summary error:', error);
      return {
        totalPartners: 0,
        activePartners: 0,
        totalVisits: 0,
        totalQRScans: 0,
        totalChallenges: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private formatPlatformStats(stats: any) {
    return {
      totalPartners: stats?.total_partners || 0,
      activePartners: stats?.active_partners || 0,
      totalHostnames: stats?.total_hostnames || 0,
      activeHostnames: stats?.active_hostnames || 0,
      sslActiveHostnames: stats?.ssl_active_hostnames || 0,
      totalVisits: stats?.total_visits || 0,
      totalQRScans: stats?.total_qr_scans || 0,
      totalChallenges: stats?.total_challenges || 0,
      date: stats?.date || new Date().toISOString().split('T')[0],
      lastUpdated: stats?.created_at || new Date().toISOString()
    };
  }

  private async updatePlatformStats(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get partner counts
      const partnersQuery = await this.env.DB.prepare(`
        SELECT
          COUNT(*) as total_partners,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_partners,
          COUNT(CASE WHEN hostname_status = 'active' THEN 1 END) as active_hostnames,
          COUNT(CASE WHEN ssl_status = 'active' THEN 1 END) as ssl_active_hostnames
        FROM partners
      `).first();

      // Get total visits (today)
      const visitsQuery = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_visits
        FROM analytics_events
        WHERE event_type = 'visit' AND DATE(timestamp) = ?
      `).bind(today).first();

      // Get total QR scans (today)
      const scansQuery = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_scans
        FROM qr_scans
        WHERE DATE(timestamp) = ?
      `).bind(today).first();

      // Get total challenges (today)
      const challengesQuery = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_challenges
        FROM challenge_completions
        WHERE DATE(timestamp) = ?
      `).bind(today).first();

      // Insert or update platform stats
      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO platform_stats (
          date, total_partners, active_partners,
          total_hostnames, active_hostnames, ssl_active_hostnames,
          total_visits, total_qr_scans, total_challenges, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        today,
        partnersQuery?.total_partners || 0,
        partnersQuery?.active_partners || 0,
        partnersQuery?.total_partners || 0,
        partnersQuery?.active_hostnames || 0,
        partnersQuery?.ssl_active_hostnames || 0,
        visitsQuery?.total_visits || 0,
        scansQuery?.total_scans || 0,
        challengesQuery?.total_challenges || 0,
        new Date().toISOString()
      ).run();

      console.log('✅ Platform stats updated');

    } catch (error) {
      console.error('Update platform stats error:', error);
    }
  }

  private async incrementPartnerMetric(partnerId: string, metric: string): Promise<void> {
    try {
      const setupKey = `analytics:${partnerId}:setup`;
      const setupData = await this.env.PARTNERS_PLATFORM.get(setupKey);

      if (setupData) {
        const analytics = JSON.parse(setupData);
        analytics[metric] = (analytics[metric] || 0) + 1;
        analytics.lastVisit = new Date().toISOString();

        if (!analytics.firstVisit) {
          analytics.firstVisit = analytics.lastVisit;
        }

        await this.env.PARTNERS_PLATFORM.put(
          setupKey,
          JSON.stringify(analytics),
          { expirationTtl: 86400 * 365 * 2 }
        );
      }
    } catch (error) {
      console.error('Increment partner metric error:', error);
      // Don't throw
    }
  }

  async getDailyAnalytics(partnerId: string, days: number = 30): Promise<any[]> {
    try {
      const results = [];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dailyVisits = await this.env.PARTNERS_PLATFORM.get(`daily_visits:${partnerId}:${dateStr}`);
        const dailyScans = await this.env.PARTNERS_PLATFORM.get(`daily_scans:${partnerId}:${dateStr}`);

        results.push({
          date: dateStr,
          visits: dailyVisits ? parseInt(dailyVisits) : 0,
          qrScans: dailyScans ? parseInt(dailyScans) : 0
        });
      }

      return results.reverse(); // Oldest to newest

    } catch (error) {
      console.error('Get daily analytics error:', error);
      return [];
    }
  }
}
