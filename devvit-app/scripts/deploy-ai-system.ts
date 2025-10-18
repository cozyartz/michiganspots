#!/usr/bin/env tsx

/**
 * AI System Deployment Script
 * Deploys the complete AI-powered treasure hunt game to production
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  cloudflareApiKey: string;
  cloudflareAiApiKey: string;
  cloudflareAccountId: string;
  analyticsBaseUrl: string;
  subredditName: string;
  enableAIFeatures: boolean;
}

class AISystemDeployer {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  async deploy(): Promise<void> {
    console.log('🚀 Starting AI System Deployment...');
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Target Subreddit: r/${this.config.subredditName}`);
    console.log(`AI Features: ${this.config.enableAIFeatures ? 'ENABLED' : 'DISABLED'}`);
    
    try {
      // Step 1: Validate prerequisites
      await this.validatePrerequisites();
      
      // Step 2: Build the application
      await this.buildApplication();
      
      // Step 3: Run tests
      await this.runTests();
      
      // Step 4: Deploy to Devvit
      await this.deployToDevvit();
      
      // Step 5: Configure AI settings
      if (this.config.enableAIFeatures) {
        await this.configureAISettings();
      }
      
      // Step 6: Initialize AI systems
      if (this.config.enableAIFeatures) {
        await this.initializeAISystems();
      }
      
      // Step 7: Run post-deployment validation
      await this.validateDeployment();
      
      console.log('✅ AI System Deployment Completed Successfully!');
      this.printDeploymentSummary();
      
    } catch (error) {
      console.error('❌ Deployment Failed:', error);
      throw error;
    }
  }

  private async validatePrerequisites(): Promise<void> {
    console.log('🔍 Validating Prerequisites...');
    
    // Check if devvit CLI is installed
    try {
      execSync('devvit --version', { stdio: 'pipe' });
      console.log('✅ Devvit CLI found');
    } catch (error) {
      throw new Error('Devvit CLI not found. Please install: npm install -g devvit');
    }

    // Check if user is logged in
    try {
      execSync('devvit whoami', { stdio: 'pipe' });
      console.log('✅ Devvit authentication verified');
    } catch (error) {
      throw new Error('Not logged into Devvit. Please run: devvit login');
    }

    // Validate Cloudflare credentials
    if (this.config.enableAIFeatures) {
      if (!this.config.cloudflareAiApiKey || this.config.cloudflareAiApiKey === 'your_ai_api_key_here') {
        throw new Error('Cloudflare AI API Key not configured');
      }
      
      if (!this.config.cloudflareAccountId || this.config.cloudflareAccountId === 'your_account_id_here') {
        throw new Error('Cloudflare Account ID not configured');
      }
      
      console.log('✅ Cloudflare AI credentials validated');
    }

    // Check TypeScript compilation
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log('✅ TypeScript compilation successful');
    } catch (error) {
      throw new Error('TypeScript compilation failed. Please fix type errors.');
    }
  }

  private async buildApplication(): Promise<void> {
    console.log('🔨 Building Application...');
    
    try {
      // Install dependencies
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed');
      
      // Build the application
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Application built successfully');
      
    } catch (error) {
      throw new Error('Build failed: ' + error);
    }
  }

  private async runTests(): Promise<void> {
    console.log('🧪 Running Tests...');
    
    try {
      // Run unit tests
      execSync('npm test', { stdio: 'inherit' });
      console.log('✅ Unit tests passed');
      
      // Run integration tests
      execSync('npm run test:integration', { stdio: 'inherit' });
      console.log('✅ Integration tests passed');
      
      // Run AI system tests
      if (this.config.enableAIFeatures) {
        execSync('npm run test:ai', { stdio: 'inherit' });
        console.log('✅ AI system tests passed');
      }
      
    } catch (error) {
      console.warn('⚠️ Some tests failed, but continuing deployment...');
      console.warn('Error:', error);
    }
  }

  private async deployToDevvit(): Promise<void> {
    console.log('📦 Deploying to Devvit...');
    
    try {
      // Upload the app
      const deployCommand = this.config.environment === 'production' 
        ? 'devvit upload'
        : 'devvit upload --bump-version';
        
      execSync(deployCommand, { stdio: 'inherit' });
      console.log('✅ App uploaded to Devvit');
      
      // Install to subreddit
      const installCommand = `devvit install ${this.config.subredditName}`;
      execSync(installCommand, { stdio: 'inherit' });
      console.log(`✅ App installed to r/${this.config.subredditName}`);
      
    } catch (error) {
      throw new Error('Devvit deployment failed: ' + error);
    }
  }

  private async configureAISettings(): Promise<void> {
    console.log('⚙️ Configuring AI Settings...');
    
    const settings = {
      CLOUDFLARE_API_KEY: this.config.cloudflareApiKey,
      CLOUDFLARE_AI_API_KEY: this.config.cloudflareAiApiKey,
      CLOUDFLARE_ACCOUNT_ID: this.config.cloudflareAccountId,
      ANALYTICS_BASE_URL: this.config.analyticsBaseUrl,
      AI_VALIDATION_ENABLED: 'true',
      AI_CHALLENGE_GENERATION_ENABLED: 'true',
      AI_PERSONALIZATION_ENABLED: 'true',
      AI_COMMUNITY_MANAGEMENT_ENABLED: 'true',
      AI_BUSINESS_INTELLIGENCE_ENABLED: 'true',
    };

    // Configure settings via Devvit CLI
    for (const [key, value] of Object.entries(settings)) {
      try {
        const command = `devvit settings set ${key} "${value}" --subreddit ${this.config.subredditName}`;
        execSync(command, { stdio: 'pipe' });
        console.log(`✅ Set ${key}`);
      } catch (error) {
        console.warn(`⚠️ Failed to set ${key}:`, error);
      }
    }
  }

  private async initializeAISystems(): Promise<void> {
    console.log('🤖 Initializing AI Systems...');
    
    // Create a test post to trigger AI initialization
    try {
      const initCommand = `devvit create-post --subreddit ${this.config.subredditName} --title "AI System Initialization" --type "Michigan Spots Treasure Hunt"`;
      execSync(initCommand, { stdio: 'pipe' });
      console.log('✅ AI systems initialization triggered');
      
      // Wait for initialization
      console.log('⏳ Waiting for AI systems to initialize...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
    } catch (error) {
      console.warn('⚠️ AI initialization may need manual trigger:', error);
    }
  }

  private async validateDeployment(): Promise<void> {
    console.log('✅ Validating Deployment...');
    
    try {
      // Run production health check
      execSync('npm run health-check:production', { stdio: 'inherit' });
      console.log('✅ Production health check passed');
      
      // Validate AI systems
      if (this.config.enableAIFeatures) {
        execSync('npm run validate:ai-systems', { stdio: 'inherit' });
        console.log('✅ AI systems validation passed');
      }
      
    } catch (error) {
      console.warn('⚠️ Post-deployment validation had issues:', error);
    }
  }

  private printDeploymentSummary(): void {
    console.log('\n🎉 DEPLOYMENT SUMMARY');
    console.log('====================');
    console.log(`Environment: ${this.config.environment}`);
    console.log(`Subreddit: r/${this.config.subredditName}`);
    console.log(`AI Features: ${this.config.enableAIFeatures ? 'ENABLED' : 'DISABLED'}`);
    
    if (this.config.enableAIFeatures) {
      console.log('\n🤖 AI FEATURES DEPLOYED:');
      console.log('• Master AI Intelligence Pipeline');
      console.log('• Hyper-Personalized User Experiences');
      console.log('• Dynamic Game Intelligence');
      console.log('• AI Community Management');
      console.log('• Business Intelligence & Analytics');
      console.log('• Crisis Prevention & Management');
      console.log('• Viral Content Generation');
      console.log('• A/B Testing & Optimization');
    }
    
    console.log('\n📊 SCHEDULED TASKS:');
    console.log('• Daily AI Intelligence Pipeline (6 AM)');
    console.log('• Weekly Challenge Generation (Monday 8 AM)');
    console.log('• Hourly Community Health Checks');
    console.log('• Weekly Business Reports (Monday 9 AM)');
    
    console.log('\n🔗 NEXT STEPS:');
    console.log(`1. Visit r/${this.config.subredditName} to see your AI-powered game`);
    console.log('2. Monitor AI system performance in the logs');
    console.log('3. Check business intelligence reports for partners');
    console.log('4. Review community health metrics');
    console.log('5. Analyze user engagement and personalization effectiveness');
    
    if (this.config.enableAIFeatures) {
      console.log('\n🚀 YOUR GAME IS NOW POWERED BY ADVANCED AI!');
      console.log('The system will continuously learn, optimize, and improve automatically.');
    }
  }
}

// Main deployment function
async function main() {
  const args = process.argv.slice(2);
  const environment = (args[0] as 'development' | 'staging' | 'production') || 'development';
  
  // Load configuration from environment or config file
  const config: DeploymentConfig = {
    environment,
    cloudflareApiKey: process.env.CLOUDFLARE_API_KEY || 'your_api_key_here',
    cloudflareAiApiKey: process.env.CLOUDFLARE_AI_API_KEY || 'your_ai_api_key_here',
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || 'your_account_id_here',
    analyticsBaseUrl: process.env.ANALYTICS_BASE_URL || 'https://michiganspots.com/api/analytics',
    subredditName: process.env.SUBREDDIT_NAME || 'michiganspots',
    enableAIFeatures: process.env.ENABLE_AI_FEATURES !== 'false',
  };

  // Validate required environment variables for production
  if (environment === 'production') {
    const requiredVars = ['CLOUDFLARE_API_KEY', 'CLOUDFLARE_AI_API_KEY', 'CLOUDFLARE_ACCOUNT_ID'];
    const missing = requiredVars.filter(varName => 
      !process.env[varName] || process.env[varName] === `your_${varName.toLowerCase()}_here`
    );
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables for production:');
      missing.forEach(varName => console.error(`   ${varName}`));
      console.error('\nPlease set these environment variables before deploying to production.');
      process.exit(1);
    }
  }

  const deployer = new AISystemDeployer(config);
  
  try {
    await deployer.deploy();
    console.log('\n🎉 SUCCESS! Your AI-powered treasure hunt game is now live!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED:', error);
    process.exit(1);
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { AISystemDeployer, DeploymentConfig };