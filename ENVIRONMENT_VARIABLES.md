# Michigan Spots - Environment Configuration Guide

**Last Updated:** November 17, 2025

This guide explains all environment variables and secrets required for Michigan Spots to function properly in production.

---

## 🔐 Cloudflare Secrets (Production)

These secrets must be configured in Cloudflare Dashboard:
**Workers & Pages > michiganspot > Settings > Environment Variables > Production**

### 1. Stripe (Payment Processing)

#### STRIPE_SECRET_KEY
- **Type:** Secret
- **Format:** `sk_live_...` (51+ characters)
- **Source:** Stripe Dashboard > Developers > API Keys
- **Purpose:** Process payments and manage subscriptions
- **Required:** YES (Critical - partner signups will fail without this)

```bash
# To set:
# Go to Cloudflare Dashboard > Workers & Pages > michiganspot > Settings > Environment Variables
# Click "Add Variable" > Select "Encrypt" > Add secret
```

#### STRIPE_WEBHOOK_SECRET
- **Type:** Secret
- **Format:** `whsec_...` (starts with whsec_)
- **Source:** Stripe Dashboard > Developers > Webhooks
- **Purpose:** Verify webhook signatures for security
- **Required:** YES (Critical - partnership activation will fail without this)

**Setup Steps:**
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add Endpoint"
3. Enter URL: `https://michiganspots.com/api/stripe-webhook`
4. Select events (see PRODUCTION_CHECKLIST.md)
5. Copy the "Signing Secret" (whsec_...)
6. Add to Cloudflare as `STRIPE_WEBHOOK_SECRET`

---

### 2. Email Validation

#### EVALIDATE_API_KEY
- **Type:** Secret
- **Format:** API key string from eValidate service
- **Source:** https://evalidate.andrea-b56.workers.dev
- **Purpose:** Validate email addresses during signup
- **Required:** RECOMMENDED (has fallback to basic regex)
- **Fallback:** If not set, uses basic email regex validation

**Features when enabled:**
- Checks email syntax, domain, MX records
- Detects disposable email addresses
- Identifies role-based emails (info@, support@)
- Provides validation scores and recommendations

---

### 3. Email Sending

#### SMTP_PASSWORD
- **Type:** Secret
- **Format:** Your SMTP server password
- **Source:** Your email service provider
- **Purpose:** Send welcome and confirmation emails
- **Required:** YES (users won't receive emails without this)

**Used For:**
- Welcome emails to regular signups
- Partnership confirmation emails
- Payment receipts
- Important notifications

---

### 4. API Security

#### SEED_API_SECRET
- **Type:** Secret
- **Format:** Random string (generate with `openssl rand -base64 32`)
- **Source:** Generate yourself
- **Purpose:** Authenticate requests to business seeding API
- **Required:** YES (if using auto-seeding features)

**API Endpoint:** `POST /api/directory/seed-business`
**Header:** `x-seed-api-secret: YOUR_SECRET_HERE`

#### CRON_SECRET
- **Type:** Secret
- **Format:** Random string (generate with `openssl rand -base64 32`)
- **Source:** Generate yourself
- **Purpose:** Authenticate cron job requests
- **Required:** YES (cron jobs will fail without this)

**Cron Jobs Protected:**
- `/api/directory-enrichment-cron` (every 6 hours)
- `/api/cron/embedding-health-check` (daily)
- `/api/cron/web-scraper` (daily)
- Other scheduled tasks

---

### 5. Error Tracking

#### SENTRY_DSN
- **Type:** Secret
- **Format:** `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
- **Source:** Sentry.io > Project Settings > Client Keys (DSN)
- **Purpose:** Server-side error tracking and monitoring
- **Required:** RECOMMENDED (helps debug production issues)

**What Gets Tracked:**
- Server-side errors in API endpoints
- Webhook processing failures
- Email sending failures
- Database query errors
- Unexpected exceptions

---

## 🌍 Public Environment Variables

These are configured in `wrangler.toml` and are **publicly accessible** (safe to expose in browser).

### STRIPE_PUBLISHABLE_KEY
- **Type:** Public Variable
- **Value:** `pk_live_51SQcd8RBOZWADDgw...`
- **Location:** `wrangler.toml` line 60 (dev) and 129 (production)
- **Purpose:** Initialize Stripe.js on client-side
- **Public:** YES - safe to expose in browser

### PUBLIC_SENTRY_CLIENT_DSN
- **Type:** Public Variable
- **Value:** `https://704cddde6de4294b5a84f73c1b5029c0@o4510339428777984...`
- **Location:** `wrangler.toml` line 63 (dev) and 132 (production)
- **Purpose:** Client-side error tracking in browser
- **Public:** YES - intentionally public for browser errors

### SITE_URL
- **Type:** Public Variable
- **Value Dev:** `http://localhost:4321`
- **Value Prod:** `https://michiganspots.com`
- **Location:** `wrangler.toml` line 59 (dev) and 128 (production)
- **Purpose:** Base URL for email links and redirects

---

## 💰 Stripe Price IDs (Partnership Tiers)

All configured in `wrangler.toml` lines 65-92 (dev) and 134-159 (production).

### Spot Partner
- Monthly: `price_1SQcyRRBOZWADDgwLZZr5RZZ` ($99/mo)
- Quarterly: `price_1SQcypRBOZWADDgwPxFKp9YG` ($249/qtr)
- Yearly: `price_1SQcypRBOZWADDgwev52m2Jk` ($999/yr)

### Featured Partner
- Quarterly: `price_1SQczkRBOZWADDgwbiGbeJG5` ($699/qtr)
- Yearly: `price_1SQczkRBOZWADDgwEIQEmtvJ` ($2,399/yr)

### Premium Sponsor
- Quarterly: `price_1SQd07RBOZWADDgw1w4GIxIB` ($1,499/qtr)
- Yearly: `price_1SQd08RBOZWADDgwmJzAeHQ4` ($4,999/yr)

### Title Sponsor
- Quarterly: `price_1SQd0XRBOZWADDgwzxJgD4yg` ($3,999/qtr)
- Yearly: `price_1SQd0XRBOZWADDgwVWUZHrm4` ($12,999/yr)

### Chamber Partnership
- Quarterly: `price_1SQd0sRBOZWADDgwCKQ0aIUf` ($899/qtr)
- Yearly: `price_1SQd0tRBOZWADDgwKd1RoR6Q` ($2,999/yr)

### Directory Advertising (Business Directory)
- Starter Monthly: `price_1SR0QERBOZWADDgwvWIoqgLE`
- Growth Monthly: `price_1SR0SURBOZWADDgwrwOFHuQ8`
- Pro Monthly: `price_1SR0SXRBOZWADDgwCJpEDnQl`

---

## 🗄️ Cloudflare Bindings

Configured in `wrangler.toml` and automatically available in runtime.

### D1 Database
- **Binding:** `DB`
- **Database Name:** `michiganspot-db`
- **Database ID:** `3e7a780d-0058-43af-9e17-96d7925843b3`
- **Purpose:** Primary SQLite database for all data

### R2 Bucket
- **Binding:** `R2`
- **Bucket Name:** `michigan-spots-legal-documents`
- **Purpose:** Store partnership agreements, PDFs, signed documents

### Cloudflare AI
- **Binding:** `AI`
- **Purpose:** Business analysis, content generation, semantic search

### Vectorize Index
- **Binding:** `VECTORIZE`
- **Index Name:** `michiganspots-embeddings`
- **Dimensions:** 768 (BGE-base-en-v1.5 embeddings)
- **Purpose:** Semantic search for business directory

---

## 🚀 Quick Setup Guide

### For Local Development

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add secrets to `.env.local`:**
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   EVALIDATE_API_KEY=your_key_here
   SMTP_PASSWORD=your_smtp_password
   SEED_API_SECRET=your_random_secret
   CRON_SECRET=your_random_secret
   SENTRY_DSN=https://...
   ```

3. **Never commit `.env.local` to git**
   - Already in `.gitignore`

### For Production Deployment

1. **Go to Cloudflare Dashboard:**
   - Navigate to: Workers & Pages > michiganspot > Settings

2. **Add Environment Variables:**
   - Click "Add Variable"
   - Select "Encrypt" for secrets
   - Add each secret from the list above

3. **Verify in Production:**
   ```bash
   # Check variables are set (won't show values)
   npx wrangler pages deployment list michiganspot
   ```

---

## 🔍 Verification Commands

### Check Local Environment

```bash
# List environment variables (won't show secret values)
cat .env.local

# Test if variables are loaded
npm run dev
# Check console for any missing variable warnings
```

### Check Production Environment

```bash
# View configured variables (values hidden)
# Go to: Cloudflare Dashboard > Workers & Pages > michiganspot > Settings > Environment Variables

# Test production deployment
curl https://michiganspots.com/api/validate-email \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Should return validation result (if EVALIDATE_API_KEY is set)
# Or basic validation (if using fallback)
```

---

## 🛠️ Troubleshooting

### "EVALIDATE_API_KEY not configured"

**Symptom:** Email validation falls back to basic regex
**Impact:** Lower quality email validation, disposable emails not detected
**Solution:** Add `EVALIDATE_API_KEY` to Cloudflare environment variables

### "Stripe error: Invalid API Key"

**Symptom:** Partner signup fails at payment step
**Impact:** Cannot process payments
**Solution:**
1. Check `STRIPE_SECRET_KEY` is set
2. Verify it's the **live mode** key (starts with `sk_live_`)
3. Check key hasn't been revoked in Stripe Dashboard

### "Webhook signature verification failed"

**Symptom:** Partnerships stay in "pending" status after payment
**Impact:** Partnerships not activated, emails not sent
**Solution:**
1. Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Verify webhook endpoint URL is correct
3. Check webhook events are being sent (Stripe Dashboard > Developers > Webhooks)

### "Failed to send email"

**Symptom:** No welcome/confirmation emails received
**Impact:** Poor user experience, missing notifications
**Solution:**
1. Check `SMTP_PASSWORD` is set correctly
2. Verify SMTP server credentials
3. Check email logs in Sentry (if configured)
4. Test SMTP connection independently

---

## 📋 Environment Checklist

Use this checklist before deploying to production:

- [ ] `STRIPE_SECRET_KEY` - Live mode key added
- [ ] `STRIPE_WEBHOOK_SECRET` - From webhook endpoint
- [ ] `EVALIDATE_API_KEY` - Email validation key added
- [ ] `SMTP_PASSWORD` - Email sending configured
- [ ] `SEED_API_SECRET` - Random secret generated
- [ ] `CRON_SECRET` - Random secret generated
- [ ] `SENTRY_DSN` - Error tracking configured
- [ ] All Stripe Price IDs verified in Stripe Dashboard
- [ ] Webhook endpoint created and tested
- [ ] Environment variables encrypted in Cloudflare
- [ ] No secrets committed to git repository

---

## 🔒 Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.local` for local development
   - Add to `.gitignore`

2. **Rotate secrets regularly**
   - Change API keys every 90 days
   - Update after team member departure

3. **Use different keys for dev/prod**
   - Test mode Stripe keys for development
   - Live mode keys only in production

4. **Limit access**
   - Only give Cloudflare Dashboard access to necessary team members
   - Use audit logs to track changes

5. **Monitor usage**
   - Review Stripe API usage
   - Check for unauthorized access attempts
   - Monitor Sentry for suspicious errors

---

## 📞 Support

If you need help configuring environment variables:

- **Documentation:** This file and `PRODUCTION_CHECKLIST.md`
- **Stripe Support:** https://support.stripe.com
- **Cloudflare Support:** https://support.cloudflare.com
- **Email:** partnerships@michiganspots.com

---

**Last Updated:** November 17, 2025
**Maintained By:** Development Team
