---
title: Development Commands
description: Complete reference for all development commands in Michigan Spots
---

# 🛠️ Development Commands

Complete reference for all development, testing, and deployment commands in the Michigan Spots platform.

## 🚀 Quick Reference

### **Essential Commands**
```bash
npm run ai:setup     # Complete AI deployment (recommended)
npm run ai:verify    # Validate all AI systems
npm run dev          # Start development server
npm test             # Run all tests
```

## 📦 Installation & Setup

### **Initial Setup**
```bash
# Clone repository
git clone https://github.com/michiganspots/platform.git
cd platform/devvit-app

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials
```

### **Environment Configuration**
```bash
# Validate configuration
npm run validate:config

# Check environment variables
echo $CLOUDFLARE_AI_API_KEY
echo $CLOUDFLARE_ACCOUNT_ID
```

## 🔧 Development Commands

### **Core Development**
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build application for production
npm run preview      # Preview production build locally
npm run upload       # Upload app to Devvit platform
```

### **Code Quality**
```bash
npm run lint         # Run ESLint code analysis
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
```

### **Development Utilities**
```bash
npm run clean        # Clean build artifacts
npm run reset        # Reset development environment
npm run logs         # View application logs
npm run debug        # Start debug mode
```

## 🧪 Testing Commands

### **Test Suites**
```bash
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
npm run test:ci             # Run tests for CI/CD
```

### **Specific Test Types**
```bash
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
npm run test:ai             # AI system tests
npm run test:performance    # Performance tests
npm run test:e2e            # End-to-end tests
```

### **Test Utilities**
```bash
npm run test:debug          # Debug failing tests
npm run test:update         # Update test snapshots
npm run test:clear          # Clear test cache
```

## 🤖 AI System Commands

### **AI Deployment**
```bash
npm run ai:setup            # Complete AI system deployment
npm run deploy:ai-production # Deploy AI to production
npm run ai:init             # Initialize AI services only
```

### **AI Validation**
```bash
npm run validate:ai-systems # Validate all AI services
npm run ai:verify          # Complete AI verification
npm run ai:health          # Check AI system health
npm run ai:status          # Get AI service status
```

### **AI Development**
```bash
npm run ai:demo            # Run AI feature demonstration
npm run ai:experiment      # Test A/B testing framework
npm run ai:benchmark       # Performance benchmarking
npm run ai:optimize        # Optimize AI performance
```

### **AI Monitoring**
```bash
npm run ai:metrics         # View AI performance metrics
npm run ai:logs            # View AI service logs
npm run ai:debug           # Debug AI issues
npm run ai:reset           # Reset AI services
```

## 🌐 Multi-Subreddit Commands

### **Content Generation**
```bash
npm run generate-posts:all              # Generate all subreddit posts
npm run generate-posts generate michigan # Generate specific subreddit post
npm run generate-posts generate detroit  # Generate Detroit-specific post
npm run generate-posts generate ai       # Generate AI community post
```

### **Cross-Posting Management**
```bash
npm run cross-post:schedule    # Schedule cross-posts
npm run cross-post:monitor     # Monitor cross-post performance
npm run cross-post:optimize    # Optimize cross-posting strategy
```

## 🚀 Deployment Commands

### **Production Deployment**
```bash
npm run deploy:production      # Standard production deployment
npm run deploy:ai-production   # Production with AI features
npm run production:setup       # Complete production setup
npm run production:verify      # Verify production deployment
```

### **Environment-Specific**
```bash
npm run deploy:staging         # Deploy to staging environment
npm run deploy:development     # Deploy to development
npm run deploy:preview         # Deploy preview version
```

### **Deployment Utilities**
```bash
npm run deploy:rollback        # Rollback to previous version
npm run deploy:status          # Check deployment status
npm run deploy:logs            # View deployment logs
```

## 🔍 Monitoring & Health Checks

### **Health Monitoring**
```bash
npm run health:check           # Complete system health check
npm run health-check:production # Production health validation
npm run health:ai              # AI-specific health check
npm run health:services        # Check all services
```

### **Performance Monitoring**
```bash
npm run monitor:performance    # Performance monitoring
npm run monitor:errors         # Error rate monitoring
npm run monitor:usage          # Usage analytics
npm run monitor:costs          # Cost monitoring
```

### **System Validation**
```bash
npm run validate:config        # Validate configuration
npm run validate:production    # Production validation
npm run validate:security      # Security validation
npm run validate:performance   # Performance validation
```

## 🔧 Maintenance Commands

### **Database Management**
```bash
npm run db:migrate             # Run database migrations
npm run db:seed                # Seed database with test data
npm run db:backup              # Create database backup
npm run db:restore             # Restore from backup
```

### **Cache Management**
```bash
npm run cache:clear            # Clear all caches
npm run cache:warm             # Warm up caches
npm run cache:stats            # View cache statistics
```

### **Log Management**
```bash
npm run logs:view              # View application logs
npm run logs:clear             # Clear log files
npm run logs:archive           # Archive old logs
npm run logs:analyze           # Analyze log patterns
```

## 🐛 Debugging Commands

### **Debug Tools**
```bash
npm run debug:start            # Start debug session
npm run debug:ai               # Debug AI services
npm run debug:performance      # Debug performance issues
npm run debug:memory           # Memory usage analysis
```

### **Troubleshooting**
```bash
npm run troubleshoot:ai        # AI troubleshooting
npm run troubleshoot:network   # Network connectivity issues
npm run troubleshoot:auth      # Authentication problems
npm run troubleshoot:config    # Configuration issues
```

## 📊 Analytics Commands

### **Business Analytics**
```bash
npm run analytics:generate     # Generate analytics reports
npm run analytics:export       # Export analytics data
npm run analytics:dashboard    # Launch analytics dashboard
```

### **Performance Analytics**
```bash
npm run perf:analyze           # Performance analysis
npm run perf:report            # Generate performance report
npm run perf:optimize          # Performance optimization
```

## 🔐 Security Commands

### **Security Validation**
```bash
npm run security:audit         # Security audit
npm run security:scan          # Vulnerability scanning
npm run security:update        # Update security patches
```

### **Key Management**
```bash
npm run keys:rotate            # Rotate API keys
npm run keys:validate          # Validate key permissions
npm run keys:backup            # Backup key configurations
```

## 🎯 Workflow Examples

### **Daily Development Workflow**
```bash
# Start development session
npm run dev

# Run tests during development
npm run test:watch

# Validate changes
npm run validate:config
npm run test:ai

# Deploy to staging
npm run deploy:staging
```

### **Production Deployment Workflow**
```bash
# Pre-deployment validation
npm run validate:config
npm test
npm run test:ai
npm run test:integration

# Deploy with AI features
npm run deploy:ai-production

# Post-deployment validation
npm run health-check:production
npm run validate:ai-systems
```

### **AI Development Workflow**
```bash
# Develop AI features
npm run ai:demo
npm run test:ai

# Validate AI systems
npm run validate:ai-systems

# Deploy AI updates
npm run deploy:ai-production

# Monitor AI performance
npm run ai:metrics
```

## 🆘 Emergency Commands

### **Quick Fixes**
```bash
npm run emergency:rollback     # Emergency rollback
npm run emergency:disable-ai   # Disable AI if issues
npm run emergency:health       # Emergency health check
npm run emergency:logs         # Emergency log analysis
```

### **System Recovery**
```bash
npm run recovery:start         # Start recovery process
npm run recovery:validate      # Validate recovery
npm run recovery:complete      # Complete recovery
```

## 📝 Command Aliases

### **Shortcuts**
```bash
npm run dev     # Same as npm run start
npm run ai      # Same as npm run ai:verify
npm run deploy  # Same as npm run deploy:production
npm run check   # Same as npm run health:check
```

## 🔧 Custom Scripts

You can also create custom scripts in `package.json`:

```json
{
  "scripts": {
    "my-workflow": "npm run validate:config && npm test && npm run deploy:staging",
    "quick-deploy": "npm run build && npm run upload",
    "full-check": "npm run validate:ai-systems && npm run health:check"
  }
}
```

## 📚 Related Documentation

- **[AI Commands](/commands/ai/)** - Detailed AI command reference
- **[Testing Commands](/commands/testing/)** - Complete testing reference
- **[Production Deployment](/deployment/production/)** - Production deployment guide
- **[Troubleshooting](/deployment/troubleshooting/)** - Problem resolution guide

**Master these commands to efficiently develop and maintain your AI-powered treasure hunt platform!** 🚀