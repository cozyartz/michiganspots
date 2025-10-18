/**
 * Production Integration Test Script
 * Tests the complete integration between Devvit app and Cloudflare Workers
 */

interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  name: string;
  results: IntegrationTestResult[];
  passed: boolean;
  totalDuration: number;
}

class ProductionIntegrationTester {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async runAllTests(): Promise<TestSuite> {
    console.log('🧪 Running production integration tests...\n');

    const startTime = Date.now();
    const results: IntegrationTestResult[] = [];

    // Test analytics endpoints
    results.push(await this.testEngagementTracking());
    results.push(await this.testChallengeCompletion());
    results.push(await this.testErrorHandling());
    results.push(await this.testRateLimiting());
    results.push(await this.testDataValidation());

    const totalDuration = Date.now() - startTime;
    const passed = results.every(result => result.passed);

    return {
      name: 'Production Integration Tests',
      results,
      passed,
      totalDuration
    };
  }

  private async testEngagementTracking(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      const testData = {
        eventType: 'view',
        challengeId: 1,
        userRedditUsername: 'test_user_integration',
        postId: 'test_post_123',
        eventData: {
          source: 'integration_test',
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch(`${this.baseUrl}/track-engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(testData)
      });

      const duration = Date.now() - startTime;
      const responseData = await response.json();

      if (response.ok && responseData.success) {
        return {
          testName: 'Engagement Tracking',
          passed: true,
          message: 'Successfully tracked engagement event',
          duration,
          details: { status: response.status, response: responseData }
        };
      } else {
        return {
          testName: 'Engagement Tracking',
          passed: false,
          message: `Failed to track engagement: ${responseData.error || 'Unknown error'}`,
          duration,
          details: { status: response.status, response: responseData }
        };
      }
    } catch (error) {
      return {
        testName: 'Engagement Tracking',
        passed: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testChallengeCompletion(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      const testData = {
        challengeId: 1,
        userRedditUsername: 'test_user_completion',
        submissionUrl: 'https://reddit.com/r/michiganspots/comments/test123',
        submissionType: 'post',
        completedAt: new Date().toISOString()
      };

      const response = await fetch(`${this.baseUrl}/track-challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(testData)
      });

      const duration = Date.now() - startTime;
      const responseData = await response.json();

      if (response.ok && responseData.success) {
        return {
          testName: 'Challenge Completion',
          passed: true,
          message: 'Successfully tracked challenge completion',
          duration,
          details: { status: response.status, response: responseData }
        };
      } else {
        return {
          testName: 'Challenge Completion',
          passed: false,
          message: `Failed to track completion: ${responseData.error || 'Unknown error'}`,
          duration,
          details: { status: response.status, response: responseData }
        };
      }
    } catch (error) {
      return {
        testName: 'Challenge Completion',
        passed: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testErrorHandling(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      // Test with invalid data to check error handling
      const invalidData = {
        eventType: 'invalid_type',
        // Missing required fields
      };

      const response = await fetch(`${this.baseUrl}/track-engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(invalidData)
      });

      const duration = Date.now() - startTime;
      const responseData = await response.json();

      // We expect this to fail with a 400 error
      if (response.status === 400 && !responseData.success) {
        return {
          testName: 'Error Handling',
          passed: true,
          message: 'Correctly handled invalid data with proper error response',
          duration,
          details: { status: response.status, response: responseData }
        };
      } else {
        return {
          testName: 'Error Handling',
          passed: false,
          message: 'Did not properly handle invalid data',
          duration,
          details: { status: response.status, response: responseData }
        };
      }
    } catch (error) {
      return {
        testName: 'Error Handling',
        passed: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testRateLimiting(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      // Test authentication with wrong API key
      const testData = {
        eventType: 'view',
        challengeId: 1,
        userRedditUsername: 'test_user_auth',
        postId: 'test_post_auth'
      };

      const response = await fetch(`${this.baseUrl}/track-engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'invalid_api_key'
        },
        body: JSON.stringify(testData)
      });

      const duration = Date.now() - startTime;
      const responseData = await response.json();

      // We expect this to fail with a 401 error
      if (response.status === 401 && !responseData.success) {
        return {
          testName: 'Authentication & Rate Limiting',
          passed: true,
          message: 'Correctly rejected invalid API key',
          duration,
          details: { status: response.status, response: responseData }
        };
      } else {
        return {
          testName: 'Authentication & Rate Limiting',
          passed: false,
          message: 'Did not properly reject invalid API key',
          duration,
          details: { status: response.status, response: responseData }
        };
      }
    } catch (error) {
      return {
        testName: 'Authentication & Rate Limiting',
        passed: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  private async testDataValidation(): Promise<IntegrationTestResult> {
    const startTime = Date.now();
    
    try {
      // Test with missing required fields
      const incompleteData = {
        challengeId: 1,
        // Missing userRedditUsername and completedAt
      };

      const response = await fetch(`${this.baseUrl}/track-challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(incompleteData)
      });

      const duration = Date.now() - startTime;
      const responseData = await response.json();

      // We expect this to fail with a 400 error
      if (response.status === 400 && !responseData.success) {
        return {
          testName: 'Data Validation',
          passed: true,
          message: 'Correctly validated required fields',
          duration,
          details: { status: response.status, response: responseData }
        };
      } else {
        return {
          testName: 'Data Validation',
          passed: false,
          message: 'Did not properly validate required fields',
          duration,
          details: { status: response.status, response: responseData }
        };
      }
    } catch (error) {
      return {
        testName: 'Data Validation',
        passed: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
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

  if (!apiKey || apiKey === 'your_production_api_key_here') {
    console.error('❌ Production API key not configured');
    console.error('Please set CLOUDFLARE_API_KEY in .env.production');
    process.exit(1);
  }

  const tester = new ProductionIntegrationTester(baseUrl, apiKey);
  
  tester.runAllTests().then(suite => {
    console.log('📊 Integration Test Results:\n');
    
    suite.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.message}`);
      console.log(`   Duration: ${result.duration}ms`);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      console.log('');
    });

    const overallIcon = suite.passed ? '✅' : '❌';
    console.log(`${overallIcon} Overall: ${suite.passed ? 'PASSED' : 'FAILED'}`);
    console.log(`🕐 Total Duration: ${suite.totalDuration}ms`);
    console.log(`📈 Tests Passed: ${suite.results.filter(r => r.passed).length}/${suite.results.length}`);

    if (!suite.passed) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Integration tests failed:', error);
    process.exit(1);
  });
}

// Run main function
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});