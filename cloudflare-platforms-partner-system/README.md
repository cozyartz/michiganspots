# Michigan Spots Partner System - Cloudflare for Platforms 🚀

**Multi-tenant partner system using Cloudflare for Platforms for automatic custom domains and optimized performance.**

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Reddit App    │───▶│  Platform Worker     │───▶│ Custom Domains      │
│   (Moderators)  │    │  (Single Instance)   │    │ • cafe.michiganspots│
└─────────────────┘    │                      │    │ • shop.michiganspots│
                       │  Dynamic Routing     │    │ • brew.michiganspots│
                       │  Based on Hostname   │    └─────────────────────┘
                       └──────────────────────┘
                              │
                              ▼
                       ┌──────────────────────┐
                       │   Partner Data       │
                       │   • KV Storage       │
                       │   • D1 Database      │
                       │   • AI Generation    │
                       └──────────────────────┘
```

## 🌟 **Key Benefits**

### **🎯 Multi-tenant Architecture**
- **Single Worker** serves all partners
- **Dynamic routing** based on subdomain
- **Automatic custom domains** for each partner
- **Centralized management** and updates

### **🚀 Cloudflare for Platforms Features**
- **Automatic SSL/TLS** certificates
- **Custom domain provisioning** via API
- **Built-in analytics** and monitoring
- **Edge optimization** for all partner sites
- **DDoS protection** included

### **💡 AI-Powered Generation**
- **Branded partner pages** generated with AI
- **Custom QR codes** with Michigan Spots branding
- **Responsive design** optimized for mobile
- **SEO optimization** with structured data

## 📁 **File Structure**

```
cloudflare-platforms-partner-system/
├── src/
│   ├── index.ts                 # Main platform worker
│   ├── services/
│   │   ├── PlatformService.ts   # Cloudflare for Platforms API
│   │   ├── PartnerService.ts    # Partner management
│   │   ├── AIPageService.ts     # AI page generation
│   │   ├── QRCodeService.ts     # QR code generation
│   │   └── AnalyticsService.ts  # Analytics tracking
│   ├── templates/
│   │   ├── PartnerPage.ts       # Partner page template
│   │   └── Dashboard.ts         # Analytics dashboard
│   └── utils/
│       ├── routing.ts           # Domain-based routing
│       └── branding.ts          # Michigan Spots branding
├── wrangler.toml               # Cloudflare configuration
├── schema.sql                  # Database schema
├── deploy.sh                   # Deployment script
└── package.json               # Dependencies
```

## 🚀 **Quick Start for Claude AI**

### **1. Prerequisites**
- Cloudflare account with Cloudflare for Platforms enabled
- Domain: `michiganspots.com` configured in Cloudflare
- API tokens with appropriate permissions

### **2. Required Cloudflare API Permissions**
```
Zone:Zone Settings:Edit
Zone:Zone:Edit
Zone:DNS:Edit
Account:Cloudflare for Platforms:Edit
Account:D1:Edit
Account:Workers KV Storage:Edit
```

### **3. Deployment Steps**
```bash
# 1. Install dependencies
npm install

# 2. Configure wrangler.toml with your account details
# 3. Create D1 database and KV namespace
# 4. Set up custom hostname fallback origin
# 5. Deploy the platform worker
# 6. Configure DNS for *.michiganspots.com
```

## 🔧 **Configuration Required**

### **Environment Variables**
```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ZONE_ID=your_zone_id_for_michiganspots_com
CLOUDFLARE_API_TOKEN=your_api_token
PARTNER_WEBHOOK_SECRET=random_secret_string
BASE_DOMAIN=michiganspots.com
```

### **DNS Configuration**
```
# Add CNAME record for wildcard subdomain
*.michiganspots.com CNAME michiganspots-platform.your-subdomain.workers.dev
```

## 📡 **API Endpoints**

### **Partner Management**
```http
POST /api/partners/onboard
GET /api/partners/{partnerId}
PUT /api/partners/{partnerId}
DELETE /api/partners/{partnerId}
```

### **Domain Management**
```http
POST /api/domains/provision
GET /api/domains/{partnerId}/status
DELETE /api/domains/{partnerId}
```

### **Analytics**
```http
GET /api/analytics/{partnerId}
GET /api/analytics/platform/summary
```

## 🎨 **Partner Experience**

### **Automatic Domain Setup**
1. Partner onboarded via Reddit moderator tools
2. AI generates branded page content
3. Custom domain automatically provisioned: `businessname.michiganspots.com`
4. SSL certificate automatically issued
5. Partner receives branded QR code and analytics dashboard

### **Partner Gets**
- 🌐 **Custom domain**: `businessname.michiganspots.com`
- 📱 **Branded QR code** for marketing
- 📊 **Analytics dashboard** with real-time metrics
- 🎯 **Treasure hunt integration** with Reddit app
- 🔄 **Automatic updates** when information changes

## 🔒 **Security & Compliance**

### **Data Protection**
- Partner data encrypted at rest in KV and D1
- HTTPS enforced for all partner domains
- API authentication with secure tokens
- Rate limiting and DDoS protection

### **Access Control**
- Moderator-only partner creation
- Partner-specific analytics access
- Secure webhook validation
- Audit logging for all operations

## 📊 **Analytics & Monitoring**

### **Platform-Level Analytics**
- Total partners onboarded
- Aggregate traffic across all partners
- Performance metrics and uptime
- Error rates and debugging info

### **Partner-Level Analytics**
- Unique visitors and page views
- QR code scan tracking
- Geographic distribution
- Device and browser analytics
- Conversion tracking for treasure hunts

## 🚀 **Deployment Instructions for Claude**

### **Step 1: Create Cloudflare Resources**
```bash
# Create D1 database
wrangler d1 create michiganspots-partners-platform

# Create KV namespace
wrangler kv:namespace create PARTNERS_PLATFORM

# Create custom hostname fallback origin
# (This will be done via API calls)
```

### **Step 2: Configure Custom Hostname Fallback**
```javascript
// API call to set up custom hostname fallback
const fallbackOrigin = {
  origin: "michiganspots-platform.your-subdomain.workers.dev",
  zone_id: "your_zone_id"
};
```

### **Step 3: Deploy Platform Worker**
```bash
# Deploy the main platform worker
wrangler deploy

# Verify deployment
curl https://michiganspots-platform.your-subdomain.workers.dev/health
```

### **Step 4: Test Partner Onboarding**
```bash
# Test partner creation
curl -X POST https://michiganspots-platform.your-subdomain.workers.dev/api/partners/onboard \
  -H "Content-Type: application/json" \
  -d '{"businessName": "Test Cafe", ...}'
```

## 🔄 **Integration with Reddit App**

### **Moderator Tools Integration**
```typescript
// In Reddit app moderator tools
const onboardPartner = async (partnerData) => {
  const response = await fetch('https://platform.michiganspots.com/api/partners/onboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'moderator-api-key'
    },
    body: JSON.stringify(partnerData)
  });
  
  const result = await response.json();
  // Partner now has: businessname.michiganspots.com
};
```

## 📈 **Scaling & Performance**

### **Platform Benefits**
- **Unlimited partners** on single worker instance
- **Global edge deployment** for all partner sites
- **Automatic scaling** based on traffic
- **Sub-100ms response times** worldwide
- **99.9% uptime** with Cloudflare's infrastructure

### **Cost Optimization**
- **Single worker** vs hundreds of individual workers
- **Shared resources** across all partners
- **Efficient caching** and optimization
- **Reduced API calls** and management overhead

## 🆘 **Support & Troubleshooting**

### **Common Issues**
- **Domain not resolving**: Check DNS configuration
- **SSL certificate issues**: Verify custom hostname setup
- **Partner page not loading**: Check partner data in KV
- **Analytics not tracking**: Verify webhook configuration

### **Monitoring**
```bash
# View platform logs
wrangler tail

# Check partner status
curl https://platform.michiganspots.com/api/partners/status

# Monitor analytics
curl https://platform.michiganspots.com/api/analytics/platform/summary
```

---

**This architecture is production-ready and designed to scale to thousands of partners efficiently using Cloudflare for Platforms! 🚀**