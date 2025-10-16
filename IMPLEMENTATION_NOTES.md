# Implementation Notes: Analytics & Reporting System

## ✅ What Has Been Implemented

### 1. Database Schema (migration_006_analytics_system.sql)
- ✅ `challenge_completions` table - Track challenge completions from Devvit
- ✅ `engagement_events` table - Track all engagement (views, comments, upvotes, etc.)
- ✅ `partner_analytics_daily` table - Aggregated daily metrics per partner
- ✅ `partner_reports_sent` table - Email report tracking
- ✅ `admin_signups_dashboard` view - Combined view of all signups

### 2. Analytics API Endpoints
- ✅ `POST /api/analytics/track-challenge` - Receive challenge completions from Devvit
- ✅ `POST /api/analytics/track-engagement` - Receive engagement events from Devvit
- ✅ `GET /api/analytics/partner?id=X` - Get partner analytics data
- ✅ `GET /api/dashboard/signups` - Admin dashboard with all signups

### 3. Email Reporting System
- ✅ `functions/utils/partnerReports.ts` - Generate and send partner reports
- ✅ Support for weekly, monthly, quarterly reports
- ✅ Comprehensive HTML email templates
- ✅ Report tracking in database

### 4. Architecture Documentation
- ✅ ARCHITECTURE.md - Complete system architecture
- ✅ Hybrid Devvit + Cloudflare approach documented
- ✅ Data flow diagrams and examples

---

## ⚠️ Important: Scheduled Jobs (Cron) Limitation

**Issue**: Cloudflare Pages Functions do NOT support scheduled/cron jobs.
**Solution**: We have 3 options:

### Option A: Separate Cloudflare Worker (Recommended)
Create a separate Cloudflare Worker specifically for scheduled jobs.

**Steps**:
1. Create new directory: `/workers/scheduled-jobs/`
2. Create standalone Worker with `wrangler.toml` and cron triggers
3. Worker calls Pages Function APIs to trigger reports
4. Deploy independently from Pages

**Pros**:
- Native Cloudflare cron support
- Clean separation of concerns
- Easy to monitor/debug

**Cons**:
- Requires separate deployment
- Additional configuration

### Option B: External Cron Service
Use a service like cron-job.org, EasyCron, or GitHub Actions.

**Steps**:
1. Create API endpoint: `POST /api/scheduled/send-reports`
2. Add authentication (API key)
3. Configure external service to call endpoint on schedule
4. No additional Cloudflare infrastructure needed

**Pros**:
- Simple setup
- No additional Cloudflare resources
- Easy to change schedules

**Cons**:
- Depends on external service
- Additional point of failure

### Option C: Manual Trigger + UI
Create admin UI to manually trigger reports.

**Steps**:
1. Create `POST /api/reports/send-weekly` endpoint
2. Build admin dashboard page with "Send Reports" button
3. Run reports on-demand

**Pros**:
- Full control over timing
- Useful for testing
- No cron setup needed

**Cons**:
- Not automated
- Requires manual action

---

## 📋 Next Steps to Complete the System

### 1. Run Database Migration
```bash
# Local development
npx wrangler d1 execute michiganspot-db --file database/migration_006_analytics_system.sql

# Production
npx wrangler d1 execute michiganspot-db --file database/migration_006_analytics_system.sql --remote
```

### 2. Set Environment Variables
Add these secrets to Cloudflare Pages:
```bash
# API key for Devvit app to call our analytics endpoints
npx wrangler pages secret put DEVVIT_API_KEY --project-name=michiganspot

# Use value: Generate a secure random string
openssl rand -hex 32
```

### 3. Choose and Implement Scheduled Jobs Solution

**If choosing Option A (Separate Worker)**:
```bash
mkdir workers/scheduled-jobs
cd workers/scheduled-jobs
npx wrangler init
# Copy over scheduled.ts logic
# Deploy: npx wrangler deploy
```

**If choosing Option B (External Cron)**:
1. Create trigger endpoint (see implementation below)
2. Sign up at cron-job.org
3. Add jobs:
   - Weekly: `POST https://michiganspots.com/api/scheduled/send-reports?type=weekly`
   - Monthly: `POST https://michiganspots.com/api/scheduled/send-reports?type=monthly`

**If choosing Option C (Manual)**:
1. Create admin dashboard page
2. Add "Send Reports" buttons
3. Document process for team

### 4. Build Admin Dashboard UI
Create `/src/pages/admin/dashboard.astro`:
- Display all signups from API
- Show summary stats
- Link to partner analytics
- Manual report trigger buttons (if Option C)

### 5. Build Partner Dashboard UI
Create `/src/pages/dashboard.astro`:
- Query string: `?partner=123`
- Fetch from `/api/analytics/partner?id=123`
- Display charts and metrics
- Link to Reddit posts

### 6. Create Devvit App
This is the big one - see DEVVIT_SETUP.md (to be created)

---

## 🔧 Option B Implementation (External Cron Trigger)

If you choose Option B, here's the implementation:

```typescript
// functions/api/scheduled/send-reports.ts
import type { PagesFunction, Env } from '../../../types/cloudflare';
import { sendAllPartnerReports } from '../../utils/partnerReports';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Verify API key
    const apiKey = context.request.headers.get('X-API-Key');
    const expectedKey = context.env.SCHEDULED_API_KEY; // Add this secret

    if (!apiKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get report type from query params
    const url = new URL(context.request.url);
    const reportType = url.searchParams.get('type') as 'weekly' | 'monthly' | 'quarterly';

    if (!reportType || !['weekly', 'monthly', 'quarterly'].includes(reportType)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid report type'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send reports
    const results = await sendAllPartnerReports(reportType, context.env);

    return new Response(JSON.stringify({
      success: true,
      data: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error sending reports:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

Then set up cron-job.org with these jobs:
- **Weekly**: Every Monday at 9:00 AM UTC
  - URL: `https://michiganspots.com/api/scheduled/send-reports?type=weekly`
  - Method: POST
  - Header: `X-API-Key: your_secret_key`

- **Monthly**: 1st of each month at 9:00 AM UTC
  - URL: `https://michiganspots.com/api/scheduled/send-reports?type=monthly`
  - Method: POST
  - Header: `X-API-Key: your_secret_key`

---

## 🎯 Testing the System

### Test Analytics API
```bash
# Test track-challenge endpoint
curl -X POST https://michiganspots.com/api/analytics/track-challenge \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_devvit_api_key" \
  -d '{
    "challengeId": 1,
    "userRedditUsername": "test_user",
    "completedAt": "2025-10-15T12:00:00Z",
    "submissionUrl": "https://reddit.com/r/michiganspots/comments/abc123",
    "submissionType": "post"
  }'

# Test track-engagement endpoint
curl -X POST https://michiganspots.com/api/analytics/track-engagement \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_devvit_api_key" \
  -d '{
    "eventType": "view",
    "challengeId": 1,
    "userRedditUsername": "test_user"
  }'
```

### Test Partner Analytics API
```bash
curl https://michiganspots.com/api/analytics/partner?id=1
```

### Test Admin Dashboard API
```bash
curl https://michiganspots.com/api/dashboard/signups
```

### Test Manual Report Sending
```typescript
// In browser console on admin page:
fetch('/api/reports/send-test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    partnerId: 1,
    reportType: 'weekly'
  })
}).then(r => r.json()).then(console.log);
```

---

## 🚀 Deployment Checklist

- [ ] Run database migration (local and production)
- [ ] Set DEVVIT_API_KEY secret
- [ ] Set SCHEDULED_API_KEY secret (if using Option B)
- [ ] Deploy updated code to production
- [ ] Test analytics endpoints with curl
- [ ] Test partner analytics API
- [ ] Set up scheduled jobs (Option A, B, or C)
- [ ] Build and deploy admin dashboard UI
- [ ] Build and deploy partner dashboard UI
- [ ] Create and deploy Devvit app
- [ ] Test end-to-end flow (Devvit → API → Dashboard → Email)

---

## 📊 Success Metrics

After implementation, monitor these metrics:

**Technical**:
- API response time < 200ms
- Zero data loss from Devvit
- Email delivery rate > 95%
- Dashboard load time < 2 seconds

**Business**:
- Partner dashboard usage > 80% of partners
- Email open rate > 40%
- Partner satisfaction score > 8/10
- Challenge completion tracking accuracy > 99%

---

## 🆘 Troubleshooting

### Analytics Not Tracking
1. Check DEVVIT_API_KEY is set correctly
2. Verify Devvit app is calling correct API endpoint
3. Check Cloudflare logs for errors
4. Test endpoint manually with curl

### Emails Not Sending
1. Check SMTP_PASSWORD secret is set
2. Verify MailChannels API is working
3. Check partner_reports_sent table for failures
4. Test email sending manually

### Dashboard Not Loading
1. Check API endpoints return data
2. Verify database has data
3. Check browser console for errors
4. Test API calls with curl

---

## 📚 Related Documentation

- ARCHITECTURE.md - Full system architecture
- DEVVIT_SETUP.md - How to build the Devvit app (to be created)
- README.md - Project overview
- database/migration_006_analytics_system.sql - Database schema
