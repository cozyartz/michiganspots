/**
 * Production Health Check Script
 * Validates that the production deployment is working correctly
 */

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  responseTime?: number;
  details?: any;
}

interface HealthCheckSummary {
  overall: 'healthy' | 'unhealthy' | 'warning';
  checks: HealthCheckResult[];
  timestamp: string;
}

class ProductionHealthChecker {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async runAllChecks(): Promise<HealthCheckSummary> {
    console.log('🏥 Running production health checks...\n');

    const checks: HealthCheckResult[] = [];

    // Check analytics API endpoints
    checks.push(await this.checkAnalyticsEndpoint('/track-engagement'));
    checks.push(await this.checkAnalyticsEndpoint('/track-challenge'));
    
    // Check Reddit API connectivity (mock check)
    checks.push(await this.checkRedditConnectivity());
    
    // Check configuration
    checks.push(await this.checkConfiguration());

    // Determine overall health
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasWarnings = checks.some(check => check.status === 'warning');
    
    let overall: 'healthy' | 'unhealthy' | 'warning' = 'healthy';
    if (hasUnhealthy) {
      overall = 'unhealthy';
    } else if (hasWarnings) {
      overall = 'warning';
    }

    return {
      overall,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  private async checkAnalyticsEndpoint(endpoint: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          eventType: 'health_check',
          challengeId: 999999,
          userRedditUsername: 'health_check_user',
          postId: 'health_check_post'
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          service: `Analytics API ${endpoint}`,
          status: responseTime > 2000 ? 'warning' : 'healthy',
          message: responseTime > 2000 ? 'Slow response time' : 'Endpoint responding correctly',
          responseTime,
          details: { status: response.status }
        };
      } else {
        return {
          service: `Analytics API ${endpoint}`,
          status: 'unhealthy',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
          details: { status: response.status }
        };
      }
    } catch (error) {
      return {
        service: `Analytics API ${endpoint}`,
        status: 'unhealthy',
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime: Date.now() - startTime
      };
    }
  }

  private async checkRedditConnectivity(): Promise<HealthCheckResult> {
    // This is a mock check since we can't easily test Reddit API from this script
    // In a real implementation, this would test Reddit API connectivity
    return {
      service: 'Reddit API Connectivity',
      status: 'healthy',
      message: 'Mock check - Reddit API connectivity should be tested via Devvit app',
      details: { note: 'This check requires Devvit runtime environment' }
    };
  }

  private async checkConfiguration(): Promise<HealthCheckResult> {
    const issues: string[] = [];

    if (!this.baseUrl) {
      issues.push('Missing analytics base URL');
    } else if (!this.baseUrl.startsWith('https://')) {
      issues.push('Analytics URL should use HTTPS');
    }

    if (!this.apiKey) {
      issues.push('Missing API key');
    } else if (this.apiKey === 'your_production_api_key_here') {
      issues.push('API key not configured for production');
    }

    if (issues.length > 0) {
      return {
        service: 'Configuration',
        status: 'unhealthy',
        message: `Configuration issues: ${issues.join(', ')}`,
        details: { issues }
      };
    }

    return {
      service: 'Configuration',
      status: 'healthy',
      message: 'All configuration values are properly set'
    };
  }
}

// CLI usage
async function main() {
  const fs = await import('fs');
  const path = await import('path');

  // Load configuration
  const envPath = path.join(process.cwd(), '.env.production');
  let baseUrl = 'https://michiganspots.com/api/analytics';
  let apiKey = '';

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          const cleanKey = key.trim();
          const cleanValue = value.trim();
          
          if (cleanKey === 'ANALYTICS_BASE_URL') {
            baseUrl = cleanValue;
          } else if (cleanKey === 'CLOUDFLARE_API_KEY') {
            apiKey = cleanValue;
          }
        }
      }
    }
  }

  const checker = new ProductionHealthChecker(baseUrl, apiKey);
  
  checker.runAllChecks().then(summary => {
    console.log('📊 Health Check Results:\n');
    
    summary.checks.forEach(check => {
      const icon = check.status === 'healthy' ? '✅' : 
                   check.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${icon} ${check.service}: ${check.message}`);
      if (check.responseTime) {
        console.log(`   Response time: ${check.responseTime}ms`);
      }
      if (check.details) {
        console.log(`   Details: ${JSON.stringify(check.details)}`);
      }
      console.log('');
    });

    const overallIcon = summary.overall === 'healthy' ? '✅' : 
                       summary.overall === 'warning' ? '⚠️' : '❌';
    
    console.log(`${overallIcon} Overall Status: ${summary.overall.toUpperCase()}`);
    console.log(`🕐 Checked at: ${summary.timestamp}`);

    if (summary.overall === 'unhealthy') {
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

// Run main function
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});