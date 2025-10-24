/**
 * Platform Service - Cloudflare for Platforms Integration
 * Manages custom hostnames and platform-level operations
 */

import { Env } from '../index';

export interface CustomHostnameRequest {
  hostname: string;
  partnerId: string;
  businessName: string;
}

export interface CustomHostnameResult {
  id: string;
  hostname: string;
  status: string;
  ssl_status: string;
  verification_errors: string[];
  created_at: string;
}

export class PlatformService {
  constructor(private env: Env) {}

  async provisionCustomHostname(request: CustomHostnameRequest): Promise<CustomHostnameResult> {
    try {
      console.log(`🌐 Provisioning custom hostname: ${request.hostname}`);

      // Create custom hostname via Cloudflare API
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.env.CLOUDFLARE_ZONE_ID}/custom_hostnames`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            hostname: request.hostname,
            ssl: {
              method: 'http',
              type: 'dv',
              settings: {
                http2: 'on',
                min_tls_version: '1.2',
                tls_1_3: 'on'
              }
            },
            custom_metadata: {
              partner_id: request.partnerId,
              business_name: request.businessName,
              created_by: 'michigan-spots-platform'
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Custom hostname creation failed: ${error}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`Custom hostname creation failed: ${result.errors?.[0]?.message || 'Unknown error'}`);
      }

      const hostnameData = result.result;

      // Store hostname information
      await this.storeHostnameData(request.partnerId, {
        id: hostnameData.id,
        hostname: hostnameData.hostname,
        status: hostnameData.status,
        ssl_status: hostnameData.ssl?.status || 'pending',
        verification_errors: hostnameData.verification_errors || [],
        created_at: hostnameData.created_at
      });

      console.log(`✅ Custom hostname provisioned: ${request.hostname} (${hostnameData.status})`);

      return {
        id: hostnameData.id,
        hostname: hostnameData.hostname,
        status: hostnameData.status,
        ssl_status: hostnameData.ssl?.status || 'pending',
        verification_errors: hostnameData.verification_errors || [],
        created_at: hostnameData.created_at
      };

    } catch (error) {
      console.error('Custom hostname provisioning error:', error);
      throw error;
    }
  }

  async getCustomHostnameStatus(partnerId: string): Promise<CustomHostnameResult | null> {
    try {
      // Get hostname data from storage
      const hostnameData = await this.getHostnameData(partnerId);
      
      if (!hostnameData) {
        return null;
      }

      // Check current status via API
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.env.CLOUDFLARE_ZONE_ID}/custom_hostnames/${hostnameData.id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('Failed to get hostname status:', await response.text());
        return hostnameData; // Return cached data
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('Hostname status check failed:', result.errors);
        return hostnameData; // Return cached data
      }

      const currentData = result.result;
      
      // Update cached data
      const updatedData = {
        id: currentData.id,
        hostname: currentData.hostname,
        status: currentData.status,
        ssl_status: currentData.ssl?.status || 'pending',
        verification_errors: currentData.verification_errors || [],
        created_at: currentData.created_at
      };

      await this.storeHostnameData(partnerId, updatedData);

      return updatedData;

    } catch (error) {
      console.error('Get hostname status error:', error);
      return null;
    }
  }

  async deleteCustomHostname(partnerId: string): Promise<boolean> {
    try {
      const hostnameData = await this.getHostnameData(partnerId);
      
      if (!hostnameData) {
        console.log('No hostname found to delete');
        return true;
      }

      // Delete via API
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.env.CLOUDFLARE_ZONE_ID}/custom_hostnames/${hostnameData.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(`Custom hostname deletion failed: ${error}`);
      }

      // Remove from storage
      await this.env.PARTNERS_PLATFORM.delete(`hostname:${partnerId}`);

      console.log(`✅ Custom hostname deleted for partner: ${partnerId}`);
      return true;

    } catch (error) {
      console.error('Delete hostname error:', error);
      return false;
    }
  }

  async listCustomHostnames(): Promise<CustomHostnameResult[]> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.env.CLOUDFLARE_ZONE_ID}/custom_hostnames?per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list hostnames: ${await response.text()}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`List hostnames failed: ${result.errors?.[0]?.message || 'Unknown error'}`);
      }

      return result.result.map((hostname: any) => ({
        id: hostname.id,
        hostname: hostname.hostname,
        status: hostname.status,
        ssl_status: hostname.ssl?.status || 'pending',
        verification_errors: hostname.verification_errors || [],
        created_at: hostname.created_at
      }));

    } catch (error) {
      console.error('List hostnames error:', error);
      return [];
    }
  }

  async getPlatformStatus(): Promise<any> {
    try {
      // Get platform-wide statistics
      const [hostnames, partners] = await Promise.all([
        this.listCustomHostnames(),
        this.getAllPartners()
      ]);

      const activeHostnames = hostnames.filter(h => h.status === 'active').length;
      const pendingHostnames = hostnames.filter(h => h.status === 'pending').length;
      const sslActive = hostnames.filter(h => h.ssl_status === 'active').length;

      return {
        platform: {
          name: this.env.PLATFORM_NAME,
          environment: this.env.ENVIRONMENT,
          base_domain: this.env.BASE_DOMAIN
        },
        partners: {
          total: partners.length,
          active: partners.filter(p => p.status === 'active').length
        },
        hostnames: {
          total: hostnames.length,
          active: activeHostnames,
          pending: pendingHostnames,
          ssl_active: sslActive
        },
        health: {
          status: 'operational',
          last_check: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Get platform status error:', error);
      return {
        platform: {
          name: this.env.PLATFORM_NAME,
          environment: this.env.ENVIRONMENT
        },
        health: {
          status: 'degraded',
          error: error instanceof Error ? error.message : 'Unknown error',
          last_check: new Date().toISOString()
        }
      };
    }
  }

  private async storeHostnameData(partnerId: string, data: CustomHostnameResult): Promise<void> {
    await this.env.PARTNERS_PLATFORM.put(
      `hostname:${partnerId}`,
      JSON.stringify(data),
      { expirationTtl: 86400 * 365 } // 1 year
    );
  }

  private async getHostnameData(partnerId: string): Promise<CustomHostnameResult | null> {
    try {
      const data = await this.env.PARTNERS_PLATFORM.get(`hostname:${partnerId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get hostname data error:', error);
      return null;
    }
  }

  private async getAllPartners(): Promise<any[]> {
    try {
      const { keys } = await this.env.PARTNERS_PLATFORM.list({ prefix: 'partner:' });
      
      const partners = [];
      for (const key of keys) {
        try {
          const data = await this.env.PARTNERS_PLATFORM.get(key.name);
          if (data) {
            partners.push(JSON.parse(data));
          }
        } catch (error) {
          console.error(`Error loading partner ${key.name}:`, error);
        }
      }

      return partners;
    } catch (error) {
      console.error('Get all partners error:', error);
      return [];
    }
  }

  async setupFallbackOrigin(): Promise<boolean> {
    try {
      // This would set up the fallback origin for custom hostnames
      // The fallback origin is the Worker URL that handles all custom hostname requests
      
      console.log('Setting up fallback origin for custom hostnames...');
      
      // In practice, this is configured once during platform setup
      // The fallback origin would be: michiganspots-platform.your-subdomain.workers.dev
      
      return true;
    } catch (error) {
      console.error('Setup fallback origin error:', error);
      return false;
    }
  }
}