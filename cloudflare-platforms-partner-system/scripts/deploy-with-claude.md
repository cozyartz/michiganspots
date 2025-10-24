# Deployment Instructions for Claude AI

**This document provides step-by-step instructions for Claude AI to deploy the Michigan Spots Partner Platform using Cloudflare for Platforms.**

## 🎯 **Deployment Overview**

You'll be deploying a multi-tenant partner system that automatically provisions custom domains for each business partner using Cloudflare for Platforms.

## 📋 **Prerequisites Checklist**

Before starting, ensure you have:
- ✅ Cloudflare account with Cloudflare for Platforms enabled
- ✅ Domain `michiganspots.com` added to Cloudflare
- ✅ API token with required permissions
- ✅ Wrangler CLI installed and authenticated

## 🔧 **Required API Permissions**

Your Cloudflare API token needs these permissions:
```
Zone:Zone Settings:Edit
Zone:Zone:Edit  
Zone:DNS:Edit
Zone:Custom Hostnames:Edit
Account:Cloudflare for Platforms:Edit
Account:D1:Edit
Account:Workers KV Storage:Edit
Account:Workers Scripts:Edit
```

## 🚀 **Step-by-Step Deployment**

### **Step 1: Create Cloudflare Resources**

```bash
# Create D1 database
wrangler d1 create michiganspots-partners-platform

# Create KV namespace
wrangler kv:namespace create PARTNERS_PLATFORM

# Note the IDs returned and update wrangler.toml
```

### **Step 2: Update Configuration**

Update `wrangler.toml` with the actual resource IDs:
```toml
[[kv_namespaces]]
binding = "PARTNERS_PLATFORM"
id = "ACTUAL_KV_ID_HERE"

[[d1_databases]]
binding = "DB"
database_name = "michiganspots-partners-platform"
database_id = "ACTUAL_D1_ID_HERE"
```

### **Step 3: Set Environment Secrets**

```bash
# Required secrets
wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Enter your Cloudflare account ID

wrangler secret put CLOUDFLARE_ZONE_ID  
# Enter the zone ID for michiganspots.com

wrangler secret put CLOUDFLARE_API_TOKEN
# Enter your API token with custom hostname permissions

wrangler secret put PARTNER_WEBHOOK_SECRET
# Enter a random secret string for webhook validation

# Optional secrets
wrangler secret put OPENAI_API_KEY
# Enter OpenAI API key if you want to use OpenAI instead of Cloudflare AI
```

### **Step 4: Initialize Database**

```bash
# Run database migrations
wrangler d1 execute michiganspots-partners-platform --file=./schema.sql
```

### **Step 5: Deploy the Platform Worker**

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Deploy to Cloudflare
wrangler deploy
```

### **Step 6: Configure DNS**

Add a CNAME record for wildcard subdomains:
```
Type: CNAME
Name: *
Target: michiganspots-platform.your-subdomain.workers.dev
Proxy: Yes (Orange cloud)
```

### **Step 7: Test the Deployment**

```bash
# Test health endpoint
curl https://michiganspots-platform.your-subdomain.workers.dev/health

# Test platform status
curl https://michiganspots-platform.your-subdomain.workers.dev/api/platform/status
```

## 🧪 **Testing Partner Onboarding**

### **Create Test Partner**

```bash
curl -X POST https://michiganspots-platform.your-subdomain.workers.dev/api/partners/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Coffee Shop",
    "description": "A cozy coffee shop for testing",
    "address": "123 Test St",
    "city": "Grand Rapids", 
    "state": "MI",
    "zipCode": "49503",
    "phone": "(616) 555-0123",
    "email": "test@testcoffee.com",
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
    "amenities": ["WiFi", "Outdoor Seating"],
    "specialOffers": "10% off for Michigan Spots members!"
  }'
```

### **Expected Response**

```json
{
  "success": true,
  "partnerId": "test-coffee-shop-abc123",
  "customHostname": "test-coffee-shop.michiganspots.com",
  "urls": {
    "partnerSite": "https://test-coffee-shop.michiganspots.com",
    "qrCode": "https://test-coffee-shop.michiganspots.com/qr",
    "analytics": "https://test-coffee-shop.michiganspots.com/analytics"
  },
  "hostname": {
    "status": "pending",
    "ssl": "pending"
  }
}
```

### **Verify Partner Site**

After DNS propagation (5-10 minutes):
```bash
# Check if partner site is accessible
curl -I https://test-coffee-shop.michiganspots.com

# Should return 200 OK with partner page
```

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Custom hostname not resolving**
   - Check DNS configuration for wildcard CNAME
   - Verify zone ID is correct
   - Wait for DNS propagation (up to 24 hours)

2. **SSL certificate pending**
   - Custom hostnames can take up to 24 hours for SSL
   - Check hostname status via API
   - Ensure domain is properly configured

3. **API permissions error**
   - Verify API token has all required permissions
   - Check account ID and zone ID are correct
   - Ensure Cloudflare for Platforms is enabled

4. **Database errors**
   - Verify D1 database was created successfully
   - Check database ID in wrangler.toml
   - Ensure schema.sql was executed

### **Debugging Commands**

```bash
# View worker logs
wrangler tail

# Check D1 database
wrangler d1 execute michiganspots-partners-platform --command "SELECT * FROM partners LIMIT 5;"

# List KV keys
wrangler kv:key list --binding PARTNERS_PLATFORM

# Check custom hostnames via API
curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/custom_hostnames" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## ✅ **Deployment Verification**

After successful deployment, verify:

- [ ] Platform worker is accessible at main domain
- [ ] Health endpoint returns "healthy" status
- [ ] Test partner can be onboarded successfully
- [ ] Custom hostname is provisioned automatically
- [ ] Partner site loads with AI-generated content
- [ ] QR code is accessible and downloads properly
- [ ] Analytics dashboard shows data
- [ ] DNS wildcard routing works correctly

## 🎉 **Success Indicators**

You'll know the deployment is successful when:

1. **Platform Status**: `/api/platform/status` shows operational
2. **Partner Onboarding**: Test partner creation returns success
3. **Custom Domain**: Partner site loads at `partner.michiganspots.com`
4. **SSL Certificate**: HTTPS works for partner domains
5. **QR Codes**: QR codes generate and download properly
6. **Analytics**: Visit tracking and analytics work

## 📞 **Next Steps**

After successful deployment:

1. **Integration**: Connect with Reddit app moderator tools
2. **Testing**: Onboard a few real partners for testing
3. **Monitoring**: Set up alerts and monitoring
4. **Documentation**: Update partner onboarding documentation
5. **Launch**: Announce the new partner platform!

---

**The platform is now ready to automatically onboard partners with custom domains! 🚀**