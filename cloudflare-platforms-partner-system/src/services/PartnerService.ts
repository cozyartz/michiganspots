/**
 * Partner Service - Partner data management for Cloudflare for Platforms
 */

import { Env } from '../index';

export interface PartnerData {
  partnerId: string;
  businessInfo: any;
  subdomain: string;
  customHostname: string;
  pageContent: string;
  qrCodeData: any;
  hostnameStatus: any;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastUpdated?: string;
}

export class PartnerService {
  constructor(private env: Env) {}

  async generatePartnerId(businessInfo: any): Promise<string> {
    // Generate unique partner ID
    const businessSlug = businessInfo.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);
    
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    
    return `${businessSlug}-${timestamp}-${random}`;
  }

  async generateSubdomain(businessName: string): Promise<string> {
    // Generate subdomain from business name
    let subdomain = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    // Ensure subdomain is unique
    let counter = 1;
    let originalSubdomain = subdomain;
    
    while (await this.subdomainExists(subdomain)) {
      subdomain = `${originalSubdomain}-${counter}`;
      counter++;
    }

    return subdomain;
  }

  async subdomainExists(subdomain: string): Promise<boolean> {
    try {
      const result = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM partners WHERE subdomain = ?'
      ).bind(subdomain).first();
      
      return (result?.count as number) > 0;
    } catch (error) {
      console.error('Subdomain check error:', error);
      return false;
    }
  }

  async storePartnerData(data: PartnerData): Promise<void> {
    try {
      // Store in KV for fast access
      await this.env.PARTNERS_PLATFORM.put(
        `partner:${data.partnerId}`,
        JSON.stringify(data),
        { expirationTtl: 86400 * 365 * 2 } // 2 years
      );

      // Store subdomain mapping for routing
      await this.env.PARTNERS_PLATFORM.put(
        `subdomain:${data.subdomain}`,
        data.partnerId,
        { expirationTtl: 86400 * 365 * 2 }
      );

      // Store in D1 database for querying
      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO partners (
          partner_id, business_name, subdomain, custom_hostname,
          business_info, page_content, qr_code_data, hostname_status,
          ssl_status, status, created_at, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.partnerId,
        data.businessInfo.businessName,
        data.subdomain,
        data.customHostname,
        JSON.stringify(data.businessInfo),
        data.pageContent,
        JSON.stringify(data.qrCodeData),
        data.hostnameStatus?.status || 'pending',
        data.hostnameStatus?.ssl_status || 'pending',
        data.status,
        data.createdAt,
        data.lastUpdated || data.createdAt
      ).run();

      console.log(`✅ Partner data stored: ${data.partnerId} (${data.subdomain})`);

    } catch (error) {
      console.error('Store partner data error:', error);
      throw error;
    }
  }

  async getPartnerData(partnerId: string): Promise<PartnerData | null> {
    try {
      // Try KV first for speed
      const kvData = await this.env.PARTNERS_PLATFORM.get(`partner:${partnerId}`);
      if (kvData) {
        return JSON.parse(kvData);
      }

      // Fallback to D1
      const dbResult = await this.env.DB.prepare(
        'SELECT * FROM partners WHERE partner_id = ?'
      ).bind(partnerId).first();

      if (!dbResult) {
        return null;
      }

      const partnerData: PartnerData = {
        partnerId: dbResult.partner_id as string,
        businessInfo: JSON.parse(dbResult.business_info as string),
        subdomain: dbResult.subdomain as string,
        customHostname: dbResult.custom_hostname as string,
        pageContent: dbResult.page_content as string,
        qrCodeData: JSON.parse(dbResult.qr_code_data as string || '{}'),
        hostnameStatus: {
          status: dbResult.hostname_status,
          ssl_status: dbResult.ssl_status
        },
        status: dbResult.status as 'active' | 'inactive' | 'suspended',
        createdAt: dbResult.created_at as string,
        lastUpdated: dbResult.last_updated as string
      };

      // Cache in KV
      await this.env.PARTNERS_PLATFORM.put(
        `partner:${partnerId}`,
        JSON.stringify(partnerData),
        { expirationTtl: 86400 } // 1 day
      );

      return partnerData;

    } catch (error) {
      console.error('Get partner data error:', error);
      return null;
    }
  }

  async getPartnerBySubdomain(subdomain: string): Promise<PartnerData | null> {
    try {
      // Get partner ID from subdomain mapping
      const partnerId = await this.env.PARTNERS_PLATFORM.get(`subdomain:${subdomain}`);
      
      if (!partnerId) {
        // Try D1 as fallback
        const dbResult = await this.env.DB.prepare(
          'SELECT partner_id FROM partners WHERE subdomain = ?'
        ).bind(subdomain).first();
        
        if (!dbResult) {
          return null;
        }
        
        // Cache the mapping
        await this.env.PARTNERS_PLATFORM.put(
          `subdomain:${subdomain}`,
          dbResult.partner_id as string,
          { expirationTtl: 86400 }
        );
        
        return await this.getPartnerData(dbResult.partner_id as string);
      }

      return await this.getPartnerData(partnerId);

    } catch (error) {
      console.error('Get partner by subdomain error:', error);
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
      console.error('Update partner data error:', error);
      throw error;
    }
  }

  async getAllPartners(): Promise<PartnerData[]> {
    try {
      // Get from D1 database
      const results = await this.env.DB.prepare(
        'SELECT * FROM partners ORDER BY created_at DESC'
      ).all();

      return results.results.map((row: any) => ({
        partnerId: row.partner_id,
        businessInfo: JSON.parse(row.business_info),
        subdomain: row.subdomain,
        customHostname: row.custom_hostname,
        pageContent: row.page_content,
        qrCodeData: JSON.parse(row.qr_code_data || '{}'),
        hostnameStatus: {
          status: row.hostname_status,
          ssl_status: row.ssl_status
        },
        status: row.status,
        createdAt: row.created_at,
        lastUpdated: row.last_updated
      }));

    } catch (error) {
      console.error('Get all partners error:', error);
      return [];
    }
  }

  async deletePartner(partnerId: string): Promise<boolean> {
    try {
      const partnerData = await this.getPartnerData(partnerId);
      
      if (!partnerData) {
        return false;
      }

      // Remove from KV
      await this.env.PARTNERS_PLATFORM.delete(`partner:${partnerId}`);
      await this.env.PARTNERS_PLATFORM.delete(`subdomain:${partnerData.subdomain}`);

      // Remove from D1
      await this.env.DB.prepare(
        'DELETE FROM partners WHERE partner_id = ?'
      ).bind(partnerId).run();

      console.log(`✅ Partner deleted: ${partnerId}`);
      return true;

    } catch (error) {
      console.error('Delete partner error:', error);
      return false;
    }
  }

  async getPartnerStats(): Promise<any> {
    try {
      const stats = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_partners,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_partners,
          COUNT(CASE WHEN hostname_status = 'active' THEN 1 END) as active_hostnames,
          COUNT(CASE WHEN ssl_status = 'active' THEN 1 END) as ssl_active_hostnames
        FROM partners
      `).first();

      return {
        totalPartners: stats?.total_partners || 0,
        activePartners: stats?.active_partners || 0,
        activeHostnames: stats?.active_hostnames || 0,
        sslActiveHostnames: stats?.ssl_active_hostnames || 0
      };

    } catch (error) {
      console.error('Get partner stats error:', error);
      return {
        totalPartners: 0,
        activePartners: 0,
        activeHostnames: 0,
        sslActiveHostnames: 0
      };
    }
  }

  async updateHostnameStatus(partnerId: string, status: string, sslStatus: string): Promise<void> {
    try {
      // Update D1
      await this.env.DB.prepare(`
        UPDATE partners 
        SET hostname_status = ?, ssl_status = ?, last_updated = ?
        WHERE partner_id = ?
      `).bind(status, sslStatus, new Date().toISOString(), partnerId).run();

      // Update KV cache
      const partnerData = await this.getPartnerData(partnerId);
      if (partnerData) {
        partnerData.hostnameStatus = { status, ssl_status: sslStatus };
        partnerData.lastUpdated = new Date().toISOString();
        
        await this.env.PARTNERS_PLATFORM.put(
          `partner:${partnerId}`,
          JSON.stringify(partnerData),
          { expirationTtl: 86400 }
        );
      }

    } catch (error) {
      console.error('Update hostname status error:', error);
      throw error;
    }
  }
}