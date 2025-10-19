---
title: AI Commands Reference
description: Complete reference for all AI-related commands and operations
---

# 🤖 AI Commands Reference

Comprehensive guide to all AI-related commands for managing Michigan Spots' advanced AI system.

## ⚡ Quick AI Commands

### **Essential AI Operations**
```bash
npm run ai:setup     # Complete AI system deployment
npm run ai:verify    # Validate all AI services
npm run ai:demo      # Run AI feature demonstration
npm run ai:health    # Check AI system health
```

## 🚀 AI Deployment Commands

### **Initial AI Setup**
```bash
# Complete AI system deployment (recommended)
npm run ai:setup

# Deploy AI to production environment
npm run deploy:ai-production

# Initialize AI services only (without full deployment)
npm run ai:init

# Deploy AI with specific environment
ENABLE_AI_FEATURES=true npm run deploy:ai-production
```

**What `ai:setup` does:**
- ✅ Validates Cloudflare AI credentials
- ✅ Runs all AI system tests
- ✅ Deploys to Reddit/Devvit platform
- ✅ Initializes all 8 AI services
- ✅ Starts scheduled AI tasks
- ✅ Configures AI monitoring

### **Environment-Specific AI Deployment**
```bash
# Development environment
ENVIRONMENT=development npm run ai:setup

# Staging environment
ENVIRONMENT=staging npm run ai:setup

# Production environment (default)
ENVIRONMENT=production npm run ai:setup
```

## 🔍 AI Validation & Health Commands

### **System Validation**
```bash
# Validate all AI services
npm run validate:ai-systems

# Complete AI verification (includes performance tests)
npm run ai:verify

# Quick AI health check
npm run ai:health

# Get detailed AI service status
npm run ai:status
```

**Expected validation output:**
```
🤖 AI SYSTEMS VALIDATION REPORT
================================
Overall Status: ✅ HEALTHY
Systems Checked: 8
Healthy: 8 | Warnings: 0 | Errors: 0

📊 SYSTEM STATUS:
✅ Master AI Orchestrator: HEALTHY
   Pipeline running regularly
   Metrics: ecosystemHealth: 0.85, daysSinceLastRun: 0.2

✅ Game Intelligence: HEALTHY
   Narrative generation and dynamic events working
   Metrics: testNarrativeGeneration: 1, dynamicEventCapability: 1

✅ Community Manager: HEALTHY
   Community health monitoring active
   Metrics: overallHealth: 0.9, engagement: 0.8, toxicity: 0.05
```

### **Individual Service Health Checks**
```bash
# Check specific AI services
npm run ai:health:orchestrator    # Master orchestrator only
npm run ai:health:validation      # Validation service only
npm run ai:health:personalization # Personalization service only
npm run ai:health:community       # Community management only
```

## 🧪 AI Testing Commands

### **AI Test Suites**
```bash
# Run all AI tests
npm run test:ai

# Run AI integration tests
npm run test:ai:integration

# Run AI performance tests
npm run test:ai:performance

# Run AI system validation tests
npm run test:ai:validation
```

### **Specific AI Service Tests**
```bash
# Test photo validation AI
npm run test:ai:photo-validation

# Test challenge generation AI
npm run test:ai:challenge-generation

# Test personalization engine
npm run test:ai:personalization

# Test community management AI
npm run test:ai:community
```

### **AI Load Testing**
```bash
# Test AI services under load
npm run test:ai:load

# Stress test AI validation
npm run test:ai:stress

# Test AI rate limiting
npm run test:ai:rate-limits
```

## 🎮 AI Feature Demonstration

### **Interactive AI Demos**
```bash
# Complete AI feature demonstration
npm run ai:demo

# Demo specific AI features
npm run ai:demo:validation        # Photo validation demo
npm run ai:demo:generation        # Challenge generation demo
npm run ai:demo:personalization   # Personalization demo
npm run ai:demo:community         # Community management demo
```

### **AI Experiment Demos**
```bash
# Run A/B testing demonstration
npm run ai:experiment

# Demo specific experiment types
npm run ai:experiment:validation     # Validation threshold experiments
npm run ai:experiment:challenges     # Challenge generation experiments
npm run ai:experiment:notifications  # Notification timing experiments
```

## 📊 AI Monitoring Commands

### **Performance Monitoring**
```bash
# View AI performance metrics
npm run ai:metrics

# Get AI cost analysis
npm run ai:costs

# Monitor AI response times
npm run ai:performance

# Check AI error rates
npm run ai:errors
```

### **AI Analytics**
```bash
# Generate AI performance report
npm run ai:report

# Export AI metrics data
npm run ai:export-metrics

# View AI usage statistics
npm run ai:usage

# Analyze AI effectiveness
npm run ai:analyze
```

### **Real-Time AI Monitoring**
```bash
# Start AI monitoring dashboard
npm run ai:monitor

# Watch AI logs in real-time
npm run ai:logs:watch

# Monitor AI service health continuously
npm run ai:health:watch
```

## 🔧 AI Configuration Commands

### **AI Settings Management**
```bash
# View current AI configuration
npm run ai:config:show

# Validate AI configuration
npm run ai:config:validate

# Update AI thresholds
npm run ai:config:update-thresholds

# Reset AI configuration to defaults
npm run ai:config:reset
```

### **AI Model Management**
```bash
# List available AI models
npm run ai:models:list

# Switch AI models
npm run ai:models:switch --model=llama-2-13b

# Test AI model performance
npm run ai:models:benchmark

# Update AI model configurations
npm run ai:models:update
```

## 🛠️ AI Development Commands

### **AI Service Development**
```bash
# Start AI development mode
npm run ai:dev

# Hot reload AI services
npm run ai:dev:reload

# Debug AI services
npm run ai:debug

# Profile AI performance
npm run ai:profile
```

### **AI Code Generation**
```bash
# Generate AI service boilerplate
npm run ai:generate:service --name=MyAIService

# Generate AI test templates
npm run ai:generate:tests --service=validation

# Generate AI configuration templates
npm run ai:generate:config
```

## 🔄 AI Pipeline Management

### **Scheduled AI Tasks**
```bash
# View scheduled AI tasks
npm run ai:tasks:list

# Run daily AI pipeline manually
npm run ai:pipeline:daily

# Run weekly challenge generation
npm run ai:pipeline:weekly-challenges

# Run hourly community health check
npm run ai:pipeline:hourly-health
```

### **AI Task Management**
```bash
# Start AI task scheduler
npm run ai:scheduler:start

# Stop AI task scheduler
npm run ai:scheduler:stop

# Restart AI task scheduler
npm run ai:scheduler:restart

# View AI task history
npm run ai:tasks:history
```

## 🧠 AI Training & Optimization

### **AI Model Training**
```bash
# Retrain personalization models
npm run ai:train:personalization

# Update fraud detection models
npm run ai:train:fraud-detection

# Optimize validation thresholds
npm run ai:optimize:thresholds

# Calibrate AI confidence scores
npm run ai:calibrate
```

### **AI Performance Optimization**
```bash
# Optimize AI response times
npm run ai:optimize:performance

# Reduce AI costs
npm run ai:optimize:costs

# Improve AI accuracy
npm run ai:optimize:accuracy

# Balance AI trade-offs
npm run ai:optimize:balance
```

## 🔍 AI Debugging Commands

### **AI Troubleshooting**
```bash
# Debug AI service issues
npm run ai:debug:services

# Troubleshoot AI connectivity
npm run ai:debug:connectivity

# Debug AI authentication
npm run ai:debug:auth

# Analyze AI errors
npm run ai:debug:errors
```

### **AI Log Analysis**
```bash
# View AI service logs
npm run ai:logs

# Filter AI error logs
npm run ai:logs:errors

# Search AI logs
npm run ai:logs:search --query="validation failed"

# Export AI logs
npm run ai:logs:export
```

## 🚨 AI Emergency Commands

### **Emergency AI Management**
```bash
# Disable AI services (emergency)
npm run ai:emergency:disable

# Enable AI services after emergency
npm run ai:emergency:enable

# Fallback to manual processing
npm run ai:emergency:fallback

# Emergency AI health check
npm run ai:emergency:health
```

### **AI Recovery**
```bash
# Restart failed AI services
npm run ai:recovery:restart

# Reset AI service state
npm run ai:recovery:reset

# Recover from AI failures
npm run ai:recovery:auto

# Validate AI recovery
npm run ai:recovery:validate
```

## 📈 AI Experiment Commands

### **A/B Testing Management**
```bash
# List active AI experiments
npm run ai:experiments:list

# Create new AI experiment
npm run ai:experiments:create --type=validation

# Stop AI experiment
npm run ai:experiments:stop --id=exp_123

# Analyze experiment results
npm run ai:experiments:analyze --id=exp_123
```

### **Experiment Types**
```bash
# Validation threshold experiments
npm run ai:experiments:validation-thresholds

# Challenge generation strategy experiments
npm run ai:experiments:challenge-strategies

# Personalization algorithm experiments
npm run ai:experiments:personalization-algorithms

# Notification timing experiments
npm run ai:experiments:notification-timing
```

## 🔐 AI Security Commands

### **AI Security Validation**
```bash
# Audit AI security
npm run ai:security:audit

# Validate AI permissions
npm run ai:security:permissions

# Check AI data privacy
npm run ai:security:privacy

# Scan for AI vulnerabilities
npm run ai:security:scan
```

### **AI Key Management**
```bash
# Rotate AI API keys
npm run ai:keys:rotate

# Validate AI key permissions
npm run ai:keys:validate

# Test AI authentication
npm run ai:auth:test
```

## 📊 AI Reporting Commands

### **AI Performance Reports**
```bash
# Generate daily AI report
npm run ai:report:daily

# Generate weekly AI summary
npm run ai:report:weekly

# Generate monthly AI analysis
npm run ai:report:monthly

# Custom AI report
npm run ai:report:custom --start=2024-01-01 --end=2024-01-31
```

### **Business AI Reports**
```bash
# AI ROI analysis
npm run ai:report:roi

# AI cost-benefit analysis
npm run ai:report:cost-benefit

# AI impact on user engagement
npm run ai:report:engagement-impact

# AI business value report
npm run ai:report:business-value
```

## 🎯 AI Workflow Examples

### **Daily AI Operations**
```bash
# Morning AI health check
npm run ai:health

# Check overnight AI performance
npm run ai:metrics

# Review AI errors
npm run ai:logs:errors

# Optimize if needed
npm run ai:optimize:performance
```

### **AI Development Workflow**
```bash
# Start AI development
npm run ai:dev

# Test AI changes
npm run test:ai

# Validate AI services
npm run validate:ai-systems

# Deploy AI updates
npm run deploy:ai-production
```

### **AI Troubleshooting Workflow**
```bash
# Identify AI issues
npm run ai:debug:services

# Check AI logs
npm run ai:logs:errors

# Test AI connectivity
npm run ai:debug:connectivity

# Restart if needed
npm run ai:recovery:restart
```

## 🔧 Custom AI Scripts

Create custom AI workflows in `package.json`:

```json
{
  "scripts": {
    "ai:full-check": "npm run ai:health && npm run ai:metrics && npm run ai:costs",
    "ai:deploy-safe": "npm run test:ai && npm run validate:ai-systems && npm run deploy:ai-production",
    "ai:morning-routine": "npm run ai:health && npm run ai:report:daily && npm run ai:optimize:costs"
  }
}
```

## 📚 Related Documentation

- **[AI System Overview](/ai-system/overview/)** - Complete AI architecture guide
- **[Development Commands](/commands/development/)** - General development commands
- **[Deployment Commands](/deployment/production/)** - Production deployment guide
- **[AI Troubleshooting](/deployment/troubleshooting/)** - AI-specific problem resolution

**Master these AI commands to efficiently manage your revolutionary AI-powered treasure hunt platform!** 🤖✨