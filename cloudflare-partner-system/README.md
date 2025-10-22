# Michigan Spots Partner System 🤖

AI-powered partner onboarding system that automatically generates branded pages, QR codes, and dedicated Cloudflare Workers for each business partner.

## 🌟 Features

### 🤖 **AI-Powered Page Generation**
- Automatically creates branded partner pages using Cloudflare AI
- Matches Michigan Spots branding and design guidelines
- Responsive, mobile-first design
- SEO-optimized with structured data

### 📱 **QR Code Generation**
- Custom branded QR codes for each partner
- SVG and PNG formats
- Analytics tracking for scans
- Downloadable assets

### 🚀 **Dedicated Worker Deployment**
- Each partner gets their own Cloudflare Worker
- Custom subdomains (optional)
- Independent scaling and performance
- Built-in analytics and tracking

### 📊 **Analytics & Insights**
- Real-time visit tracking
- QR code scan analytics
- Challenge completion metrics
- Partner performance dashboards

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Reddit App    │───▶│  Partner System  │───▶│ Individual      │
│   (Moderator)   │    │  (Main Worker)   │    │ Partner Workers │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   AI Services    │
                       │ • Page Generator │
                       │ • QR Code Gen    │
                       │ • Branding       │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │    Storage       │
                       │ • D1 Database    │
                       │ • KV Store       │
                       │ • Analytics      │
                       └──────────────────┘
```

## 🚀 Quick Start

### 1. **Prerequisites**
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Clone and setup
git clone <repository>
cd cloudflare-partner-system
npm install
```

### 2. **Configuration**
```bash
# Copy and configure wrangler.toml
cp wrangler.toml.example wrangler.toml

# Set up secrets
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put CLOUDFLARE_API_TOKEN --env production
wrangler secret put PARTNER_WEBHOOK_SECRET --env production
```

### 3. **Deploy**
```bash
# Run the deployment script
./deploy.sh

# Or deploy manually
wrangler deploy --env production
```

## 📡 API Endpoints

### **Partner Onboarding**
```http
POST /api/partners/onboard
Content-Type: application/json

{
  "businessName": "Downtown Coffee Co",
  "description": "Cozy coffee shop in downtown Grand Rapids",
  "address": "123 Main St",
  "city": "Grand Rapids",
  "state": "MI",
  "zipCode": "49503",
  "phone": "(616) 555-0123",
  "email": "hello@downtowncoffee.com",
  "website": "https://downtowncoffee.com",
  "category": "cafe",
  "hours": {
    "monday": "7:00 AM - 6:00 PM",
    "tuesday": "7:00 AM - 6:00 PM",
    "wednesday": "7:00 AM - 6:00 PM",
    "thursday": "7:00 AM - 6:00 PM",
    "friday": "7:00 AM - 8:00 PM",
    "saturday": "8:00 AM - 8:00 PM",
    "sunday": "8:00 AM - 4:00 PM"
  },
  "amenities": ["WiFi", "Outdoor Seating", "Pet Friendly"],
  "specialOffers": "10% off for Michigan Spots members!"
}
```

**Response:**
```json
{
  "success": true,
  "partnerId": "downtown-coffee-co-abc123",
  "urls": {
    "partnerPage": "https://downtown-coffee-co-abc123.michiganspots.workers.dev",
    "qrCode": "https://michiganspots.com/api/partners/downtown-coffee-co-abc123/qr",
    "dashboard": "https://michiganspots.com/partners/downtown-coffee-co-abc123/dashboard"
  },
  "qrCode": {
    "svg": "<svg>...</svg>",
    "png": "data:image/png;base64,...",
    "downloadUrl": "https://michiganspots.com/api/partners/downtown-coffee-co-abc123/qr"
  },
  "worker": {
    "name": "michiganspots-downtown-coffee-co-abc123",
    "url": "https://downtown-coffee-co-abc123.michiganspots.workers.dev",
    "status": "deployed"
  }
}
```

### **Get Partner Info**
```http
GET /api/partners/{partnerId}
```

### **Regenerate Partner Page**
```http
PUT /api/partners/{partnerId}/regenerate
Content-Type: application/json

{
  "updates": {
    "description": "Updated business description",
    "specialOffers": "New special offer!"
  },
  "reason": "Business information updated"
}
```

### **Get QR Code**
```http
GET /api/partners/{partnerId}/qr?format=png
GET /api/partners/{partnerId}/qr?format=svg
```

### **Analytics**
```http
GET /api/partners/{partnerId}/analytics?timeframe=30d
```

## 🎨 Branding System

The system automatically applies Michigan Spots branding:

### **Color Palette**
- **Primary:** `#059669` (Michigan Green)
- **Secondary:** `#0ea5e9` (Great Lakes Blue)  
- **Accent:** `#f59e0b` (Michigan Maize)

### **Typography**
- **Font:** Inter, system-ui, sans-serif
- **Responsive sizing**
- **Accessibility compliant**

### **Components**
- Michigan Spots partner badge
- Treasure hunt challenge sections
- Branded QR codes
- Consistent button styles
- Mobile-responsive layouts

## 🔧 Integration with Reddit App

### **Moderator Tools Integration**
```typescript
// In your Reddit app's moderator tools
const onboardPartner = async (businessData) => {
  const response = await fetch('https://partners.michiganspots.com/api/partners/onboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key'
    },
    body: JSON.stringify(businessData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Partner onboarded successfully
    console.log('Partner page:', result.urls.partnerPage);
    console.log('QR code:', result.urls.qrCode);
    
    // Create Reddit post announcing new partner
    await createPartnerAnnouncementPost(result);
  }
};
```

### **Challenge Integration**
```typescript
// Track when challenges are completed at partner locations
const trackChallengeCompletion = async (partnerId, challengeId, userId) => {
  await fetch('https://partners.michiganspots.com/api/webhook/reddit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': generateSignature(data)
    },
    body: JSON.stringify({
      event: 'challenge_completed',
      partnerId,
      challengeId,
      userId,
      timestamp: new Date().toISOString()
    })
  });
};
```

## 📊 Analytics & Monitoring

### **Built-in Analytics**
- Page views and unique visitors
- QR code scan tracking
- Challenge completion rates
- Geographic distribution
- Device and browser analytics

### **Partner Dashboard**
Each partner gets access to:
- Real-time visitor metrics
- QR code performance
- Challenge engagement
- Revenue impact tracking
- Customer feedback

### **System Monitoring**
```bash
# View real-time logs
wrangler tail --env production

# Check system health
curl https://partners.michiganspots.com/health

# Database queries
wrangler d1 execute michiganspots-partners --command "SELECT COUNT(*) FROM partners;" --env production
```

## 🔒 Security & Privacy

### **Data Protection**
- All partner data encrypted at rest
- GDPR compliant data handling
- Secure API key management
- Rate limiting and DDoS protection

### **Access Control**
- Moderator-only partner creation
- API key authentication
- Webhook signature verification
- Partner data isolation

## 🚀 Deployment Options

### **Automatic Deployment**
```bash
# One-command deployment
./deploy.sh
```

### **Manual Deployment**
```bash
# Step by step
npm install
npm run type-check
wrangler d1 create michiganspots-partners
wrangler kv:namespace create michiganspots-partners-kv
wrangler secret put OPENAI_API_KEY --env production
wrangler deploy --env production
```

### **CI/CD Integration**
```yaml
# GitHub Actions example
name: Deploy Partner System
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 🧪 Testing

### **Local Development**
```bash
# Start local development server
npm run dev

# Test API endpoints
curl http://localhost:8787/health
```

### **Integration Testing**
```bash
# Run test suite
npm test

# Test partner onboarding flow
npm run test:integration
```

## 📈 Scaling & Performance

### **Auto-scaling**
- Cloudflare Workers automatically scale
- No server management required
- Global edge deployment
- Sub-100ms response times

### **Performance Optimization**
- KV caching for partner data
- CDN-optimized assets
- Compressed QR codes
- Lazy-loaded images

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation:** [docs.michiganspots.com](https://docs.michiganspots.com)
- **Issues:** GitHub Issues
- **Discord:** [Michigan Spots Community](https://discord.gg/michiganspots)
- **Email:** support@michiganspots.com

---

**Built with ❤️ for Michigan businesses and treasure hunters!** 🗺️✨