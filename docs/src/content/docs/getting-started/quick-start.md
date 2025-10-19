---
title: Quick Start Guide
description: Get Michigan Spots up and running in 5 minutes
---

# ⚡ Quick Start Guide

Get your AI-powered treasure hunt platform running in just 5 minutes!

## 🚀 Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** installed
- **Devvit CLI** installed (`npm install -g devvit`)
- **Cloudflare Account** with Workers AI access
- **Reddit Developer Account** with app permissions

## 📦 Installation

### 1. Clone and Setup
```bash
git clone https://github.com/michiganspots/platform.git
cd platform/devvit-app
npm install
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

Required environment variables:
```bash
CLOUDFLARE_AI_API_KEY=your_ai_api_key_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_KEY=your_analytics_api_key_here
ANALYTICS_BASE_URL=https://michiganspots.com/api/analytics
SUBREDDIT_NAME=michiganspots
```

### 3. Deploy AI System
```bash
# Run complete AI deployment
npm run ai:setup
```

This command will:
- ✅ Validate your configuration
- ✅ Run all tests (including AI system tests)
- ✅ Deploy to Reddit/Devvit
- ✅ Initialize all AI services
- ✅ Start scheduled AI tasks

### 4. Verify Deployment
```bash
# Validate all AI systems are working
npm run ai:verify
```

Expected output:
```
🤖 AI SYSTEMS VALIDATION REPORT
================================
Overall Status: ✅ HEALTHY
Systems Checked: 8
Healthy: 8 | Warnings: 0 | Errors: 0

✅ Master AI Orchestrator: HEALTHY
✅ Game Intelligence: HEALTHY  
✅ Community Manager: HEALTHY
✅ Business Intelligence: HEALTHY
✅ Personalization Service: HEALTHY
✅ Experiment Service: HEALTHY
✅ AI Validation Service: HEALTHY
✅ Multi-Subreddit Manager: HEALTHY
```

## 🎯 First Steps

### 1. Visit Your Platform
Go to `https://reddit.com/r/your_subreddit` and create a new post using the "Michigan Spots Treasure Hunt" post type.

### 2. Check AI Features
Your platform now includes:
- 🤖 **AI-generated challenges** appearing automatically
- 🎯 **Personalized recommendations** for each user
- 👥 **Automated community management** maintaining health
- 📊 **Business intelligence** reports for partners
- 🚀 **Viral content generation** for organic growth

### 3. Monitor AI Performance
```bash
# Check daily AI metrics
npm run validate:ai-systems

# View AI performance dashboard
npm run ai:demo
```

## 🔧 Essential Commands

### **Development**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run all tests
npm run test:ai      # Run AI system tests
```

### **AI Management**
```bash
npm run ai:setup     # Complete AI deployment
npm run ai:verify    # Validate AI systems
npm run ai:demo      # Run AI feature demo
npm run ai:experiment # Run A/B testing demo
```

### **Multi-Subreddit**
```bash
npm run generate-posts:all    # Generate all subreddit posts
npm run generate-posts generate michigan  # Generate specific post
```

### **Production**
```bash
npm run deploy:ai-production  # Deploy to production with AI
npm run health-check:production  # Check system health
npm run validate:ai-systems   # Validate AI functionality
```

## 🎉 You're Ready!

Congratulations! You now have the most advanced AI-powered treasure hunt platform running. Your system will:

- **Learn continuously** from user interactions
- **Optimize automatically** for maximum engagement
- **Generate content** dynamically based on real-time conditions
- **Manage community** health without manual intervention
- **Create business value** for all partners
- **Scale intelligently** as your community grows

## 📚 Next Steps

1. **[Explore AI Features](/ai-system/overview/)** - Understand your AI capabilities
2. **[Configure Multi-Subreddit](/multi-subreddit/strategy/)** - Expand to other communities
3. **[Set Up Business Partners](/business/partner-onboarding/)** - Onboard local businesses
4. **[Monitor Performance](/deployment/monitoring/)** - Track your success metrics

## 🆘 Need Help?

- **Technical Issues**: Check our [Troubleshooting Guide](/deployment/troubleshooting/)
- **AI Problems**: Review [AI System Documentation](/ai-system/overview/)
- **Business Questions**: See [Partner Documentation](/business/partner-onboarding/)
- **Community Support**: Join our Discord or GitHub discussions

**Your AI-powered treasure hunt platform is now live and ready to revolutionize local discovery!** 🌟