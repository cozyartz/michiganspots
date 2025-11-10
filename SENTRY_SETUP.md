# Sentry Error Tracking Setup Guide

This guide will help you set up Sentry error tracking for Michigan Spots using Toucan-js, the official Sentry client for Cloudflare Workers.

## Why Error Tracking?

Currently, the codebase has **43 console.error calls** that go into the void in production. With Sentry, you'll get:

- 🔔 **Real-time error alerts** via email, Slack, or PagerDuty
- 📊 **Stack traces with source maps** showing exact line numbers
- 🎯 **User impact tracking** - see how many users are affected
- 🔍 **Request context** - IP, user agent, headers, query params
- 📈 **Performance monitoring** - track slow API endpoints
- 🍞 **Breadcrumbs** - see the sequence of events leading to errors

## Step 1: Create a Sentry Account (FREE)

1. Go to https://sentry.io/signup/
2. Sign up with GitHub, Google, or email
3. Create a new organization (e.g., "Cozyartz Media Group")

**Note:** Sentry's free tier includes:
- 5,000 errors per month
- 10,000 performance transactions per month
- 1 project
- Perfect for small to medium projects!

## Step 2: Create a Project

1. Click "Create Project" in the Sentry dashboard
2. Select platform: **"JavaScript"**
3. Choose framework: **"Cloudflare Workers"** (or just "Other")
4. Project name: **"michiganspot"** or **"michigan-spots"**
5. Click "Create Project"

## Step 3: Get Your DSN

After creating the project, you'll see your **DSN (Data Source Name)**. It looks like:

```
https://a1b2c3d4e5f6g7h8i9j0@o123456.ingest.sentry.io/789012
```

**Or find it later:**
1. Go to **Settings** > **Projects** > **michiganspot**
2. Click **"Client Keys (DSN)"**
3. Copy the **DSN** value

## Step 4: Add DSN to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended)

1. Go to https://dash.cloudflare.com
2. Navigate to **Workers & Pages**
3. Click on **"michiganspot"**
4. Go to **Settings** > **Environment variables**
5. Click **"Add variable"**
6. Add the following:

   **Production Environment:**
   - Variable name: `SENTRY_DSN`
   - Value: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx` (your actual DSN)
   - Environment: **Production**

   **Optional - Set environment name:**
   - Variable name: `SENTRY_ENVIRONMENT`
   - Value: `production`
   - Environment: **Production**

7. Click **"Save"**

### Option B: Via Wrangler CLI

```bash
# Navigate to project directory
cd /Users/cozart-lundin/code/michiganspot

# Add Sentry DSN as a secret
npx wrangler secret put SENTRY_DSN --env production

# When prompted, paste your DSN:
# https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Optional: Set environment name
npx wrangler secret put SENTRY_ENVIRONMENT --env production
# Enter: production
```

## Step 5: Deploy to Production

The error tracking code is already integrated into these critical endpoints:
- `/api/directory/search` - Directory search
- `/api/directory/semantic-search` - AI-powered semantic search
- `/api/directory/ai-chat` - AI chat assistant

Deploy to activate error tracking:

```bash
npm run build
npx wrangler pages deploy dist --project-name michiganspot
```

**Or push to GitHub** (if auto-deploy is enabled):
```bash
git add -A
git commit -m "Add Sentry error tracking"
git push origin main
```

## Step 6: Test Error Tracking

### Test 1: Trigger a Test Error

Add this temporary test endpoint to verify Sentry is working:

**File:** `src/pages/api/test-sentry.ts`
```typescript
import type { APIRoute } from 'astro';
import { initErrorTracking, captureError } from '../../lib/error-tracking';

export const GET: APIRoute = async ({ request, locals }) => {
  const sentry = initErrorTracking(request, locals.runtime?.env || {}, locals.runtime?.ctx);

  try {
    // Intentionally throw an error
    throw new Error('Test error from Sentry integration');
  } catch (error) {
    captureError(sentry, error, {
      test: true,
      endpoint: '/api/test-sentry',
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Test error sent to Sentry!' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

Then visit: `https://michiganspots.com/api/test-sentry`

### Test 2: Check Sentry Dashboard

1. Go to https://sentry.io
2. Select your **"michiganspot"** project
3. You should see the test error appear in the **Issues** tab within 1-2 minutes
4. Click on the error to see:
   - Stack trace
   - Request URL and method
   - Headers and IP
   - Breadcrumbs
   - User impact

## What's Integrated?

### Endpoints with Error Tracking

✅ **GET /api/directory/search**
- Tracks search queries
- Monitors rate limiting
- Captures database errors
- Performance monitoring (10% sample rate)

✅ **GET /api/directory/semantic-search**
- Tracks AI embedding generation
- Monitors Vectorize queries
- Captures AI service errors
- Expensive operation monitoring

✅ **POST /api/directory/ai-chat**
- Tracks AI chat requests
- Monitors business search
- Captures AI response errors
- Session and conversation tracking

### Error Context Captured

Every error includes:
- **Request details**: URL, method, headers
- **Client info**: IP address, user agent, country
- **Breadcrumbs**: Step-by-step actions before error
- **Custom data**: Endpoint-specific context
- **Performance data**: Request duration, database query times
- **Cloudflare headers**: CF-Ray, CF-Connecting-IP, CF-IPCountry

## Understanding Your Dashboard

### Issues Tab
- See all errors grouped by type
- Sort by frequency, users affected, or last seen
- Filter by endpoint, browser, or location

### Performance Tab
- View API endpoint response times
- Identify slow database queries
- Track AI operation performance
- See 95th percentile latencies

### Releases Tab
- Track errors by deployment
- Compare error rates between versions
- See which deployment introduced bugs

## Alerting Setup (Optional)

### Email Alerts
1. Go to **Settings** > **Alerts**
2. Create a new alert rule
3. Set conditions (e.g., "When error occurs more than 5 times in 1 hour")
4. Add your email

### Slack Integration
1. Go to **Settings** > **Integrations**
2. Search for "Slack"
3. Click **"Add to Slack"**
4. Choose channel (e.g., `#alerts` or `#engineering`)
5. Errors will post to Slack in real-time

## Performance Monitoring

The integration includes **10% sampling** for performance monitoring:
- Tracks request duration
- Measures database query times
- Monitors AI operation latency
- Identifies slow endpoints

### View Performance Data
1. Go to **Performance** tab in Sentry
2. Click **"Web Vitals"** or **"Backend"**
3. Sort by **"P95 Duration"** to find slowest endpoints
4. Click on an operation to see detailed breakdown

## Troubleshooting

### "No errors appearing in Sentry"

**Check 1: DSN configured correctly?**
```bash
# Test in local development
cd /Users/cozart-lundin/code/michiganspot
echo "SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx" > .env
npm run dev
```

**Check 2: Environment variable set in production?**
1. Go to Cloudflare Dashboard > michiganspot > Settings > Environment variables
2. Verify `SENTRY_DSN` exists for **Production** environment

**Check 3: Re-deploy after adding DSN**
```bash
npm run build
npx wrangler pages deploy dist --project-name michiganspot
```

### "Rate limit exceeded" errors

The free tier has limits:
- **5,000 errors/month** - If exceeded, errors stop being tracked
- **10,000 transactions/month** - Performance data stops

**Solutions:**
- Upgrade to paid plan ($26/month for 50K errors)
- Reduce sampling rate in `src/lib/error-tracking.ts`:
  ```typescript
  tracesSampleRate: 0.05, // Lower from 0.1 to 0.05 (5%)
  ```

### "Source maps not working"

Source maps allow Sentry to show original TypeScript line numbers instead of compiled JavaScript.

**Setup source maps:**
1. In Sentry dashboard, go to **Settings** > **Source Maps**
2. Get your auth token from **Settings** > **Auth Tokens**
3. Add to build script in `package.json`:
   ```json
   "scripts": {
     "build": "astro build && node scripts/fix-routes.js && node scripts/upload-source-maps.js"
   }
   ```

## Cost Estimation

### Free Tier (Perfect for starting)
- ✅ 5,000 errors per month
- ✅ 10,000 performance transactions per month
- ✅ 1 project
- ✅ 30 days of data retention
- ✅ Unlimited team members

### Developer Plan ($26/month)
- ✅ 50,000 errors per month
- ✅ 100,000 performance transactions per month
- ✅ 5 projects
- ✅ 90 days of data retention
- ✅ Email + Slack alerts

**For Michigan Spots**, the free tier should be sufficient unless you have:
- >166 errors per day (5,000/month)
- >333 API requests per day with 10% sampling (10,000 transactions/month)

## Next Steps

1. ✅ **Set up Sentry account** (10 minutes)
2. ✅ **Add DSN to Cloudflare** (2 minutes)
3. ✅ **Deploy to production** (5 minutes)
4. ✅ **Test with /api/test-sentry** (1 minute)
5. ✅ **Configure Slack alerts** (optional, 5 minutes)
6. ✅ **Monitor dashboard daily** (2 minutes/day)

## Questions?

- **Sentry Documentation**: https://docs.sentry.io/platforms/javascript/guides/cloudflare/
- **Toucan-js GitHub**: https://github.com/robertcepa/toucan-js
- **Cloudflare Workers Integration**: https://developers.cloudflare.com/pages/functions/plugins/sentry/

---

**Ready to get started?** Create your free Sentry account at https://sentry.io/signup/ 🚀
