# Michigan Spots Analytics System

## Overview

Comprehensive analytics platform for tracking partner performance using Reddit Devvit API integration and Cloudflare Workers.

## Architecture

### Data Flow
```
Reddit Devvit App
    ↓ (POST events)
Cloudflare Workers API
    ↓ (store raw events)
D1 Database (engagement_events, challenge_completions)
    ↓ (daily aggregation)
Partner Analytics Daily (partner_analytics_daily)
    ↓ (display)
Partner Dashboard / Email Reports
```

### Key Components

#### 1. Data Collection
- **Devvit App Events**: Reddit app sends POST requests to Cloudflare Workers
- **Event Types**: views, completions, comments, upvotes, shares, awards
- **Authentication**: API key validation (`DEVVIT_API_KEY`)

**Endpoints:**
- `POST /api/analytics/track-challenge` - Track challenge completions
- `POST /api/analytics/track-engagement` - Track engagement events (views, comments, etc.)

#### 2. Daily Aggregation
- **Scheduled Worker**: Runs daily at 2 AM EST (7 AM UTC)
- **Process**: Aggregates raw events into `partner_analytics_daily` table
- **Endpoint**: `GET /api/scheduled/aggregate-analytics`

**Configure in wrangler.toml:**
```toml
[triggers]
crons = ["0 7 * * *"]  # Daily at 7 AM UTC (2 AM EST)
```

#### 3. Partner Dashboard
- **URL**: `/partner/dashboard?token={magic_link_token}`
- **Authentication**: Magic link (email-based, 24-hour expiration)
- **Real-time**: No (daily batch updates)

**Key Metrics Displayed:**
- Foot Traffic Visits (challenge completions)
- Challenge Views (Reddit impressions)
- Unique Explorers (unique Reddit usernames)
- Community Buzz (comments + discussions)
- Engagement Rate (completions / views)
- Cost Per Visit (estimated ROI)

#### 4. Super Admin Dashboard
- **URL**: `/admin/dashboard`
- **Authentication**: TODO - Add admin auth
- **Features**:
  - Platform-wide statistics
  - All signups (waitlist + partners)
  - Top performing partners
  - Revenue tracking
  - Search and filter capabilities

## Database Schema

### Raw Event Tables

**engagement_events**
```sql
- event_type: 'view' | 'comment' | 'upvote' | 'share' | 'award'
- challenge_id, spot_id (nullable)
- user_reddit_username (nullable)
- post_id, comment_id (nullable)
- event_data: JSON
- created_at: timestamp
```

**challenge_completions**
```sql
- challenge_id: foreign key
- user_reddit_username: Reddit username
- completed_at: ISO 8601 timestamp
- submission_url: Reddit post/comment URL
- submission_type: 'post' | 'comment'
```

### Aggregated Analytics

**partner_analytics_daily**
```sql
- partner_id: foreign key to partnership_activations
- date: YYYY-MM-DD
- challenge_views: INT
- challenge_completions: INT
- challenge_comments: INT
- challenge_upvotes: INT
- challenge_shares: INT
- challenge_awards: INT
- unique_participants: INT
- created_at, updated_at
```

### Authentication

**partner_magic_links**
```sql
- partner_id: foreign key
- token: UUID
- expires_at: timestamp
- used: boolean
- used_at: timestamp (nullable)
```

## Partner Authentication Flow

1. Partner requests access via email form
2. System generates unique token (UUID)
3. Token stored in `partner_magic_links` with 24-hour expiration
4. Email sent with magic link: `/partner/dashboard?token={token}`
5. Partner clicks link, token validated
6. Token marked as used, dashboard access granted
7. Partner dashboard loads data via `/api/analytics/partner?id={partner_id}`

**Request Magic Link:**
```bash
POST /api/partner-auth/send-magic-link
Content-Type: application/json

{
  "email": "partner@example.com"
}
```

## Email Reports

### Automated Partner Reports
- **Frequency**: Weekly, Monthly, Quarterly (configurable per partner)
- **Delivery**: Email via Cloudflare Email Workers
- **Content**:
  - Overall performance metrics
  - Top performing challenges
  - Top participants (Reddit users)
  - Week-over-week/month-over-month trends

**Trigger Reports:**
```bash
GET /api/scheduled/send-reports?type=weekly
```

### Report Generation
```typescript
import { generatePartnerReport, sendPartnerReport } from './utils/partnerReports';

const reportData = await generatePartnerReport(partnerId, 'monthly', env);
await sendPartnerReport(reportData, 'monthly', env);
```

## API Endpoints Summary

### Analytics Collection
- `POST /api/analytics/track-challenge` - Devvit app challenge completion events
- `POST /api/analytics/track-engagement` - Devvit app engagement events

### Partner Access
- `POST /api/partner-auth/send-magic-link` - Request dashboard access
- `GET /api/analytics/partner?id={id}` - Get partner analytics data

### Admin
- `GET /api/dashboard/signups` - Basic admin stats
- `GET /api/dashboard/superadmin` - Comprehensive platform analytics

### Scheduled Jobs
- `GET /api/scheduled/aggregate-analytics` - Daily aggregation
- `GET /api/scheduled/send-reports` - Send partner reports

## Environment Variables

Required in Cloudflare Workers:

```bash
# Devvit API Authentication
DEVVIT_API_KEY="your-secure-api-key"

# Email Service (for magic links and reports)
# Configure via Cloudflare Email Workers or SendGrid

# Database
# Configured via wrangler.toml bindings
```

## Deployment

### 1. Apply Database Migrations
```bash
# Apply all migrations in order
npx wrangler d1 execute michiganspot-db --remote --file=database/schema.sql
npx wrangler d1 execute michiganspot-db --remote --file=database/migration_006_analytics_system.sql
npx wrangler d1 execute michiganspot-db --remote --file=database/migration_007_magic_links.sql
```

### 2. Configure Scheduled Workers
Add to `wrangler.toml`:
```toml
[triggers]
crons = ["0 7 * * *"]  # Daily at 7 AM UTC for analytics aggregation
```

### 3. Deploy
```bash
npm run deploy
```

## Development

### Local Testing
```bash
# Start dev server
npm run dev

# Test analytics endpoint
curl -X POST http://localhost:4321/api/analytics/track-engagement \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-dev-key" \
  -d '{
    "eventType": "view",
    "challengeId": 1,
    "userRedditUsername": "test_user"
  }'
```

### Manual Aggregation (Testing)
```bash
curl http://localhost:4321/api/scheduled/aggregate-analytics
```

## Business Value Metrics

### For Partners
- **Foot Traffic**: Direct business visits from challenge completions
- **Brand Awareness**: Total views and impressions on Reddit
- **Community Engagement**: Comments showing authentic interest
- **Virality**: Shares and awards indicating content quality
- **ROI**: Cost per visit calculation

### For Platform (Admin)
- **Growth Rate**: New partners and users over time
- **Engagement Quality**: Platform-wide engagement rate
- **Revenue**: Total and per-partner revenue
- **Top Performers**: Identify successful partnership models

## Future Enhancements

- [ ] Real-time WebSocket updates for dashboards
- [ ] CSV/PDF export functionality
- [ ] Custom date range filtering
- [ ] Demographic breakdowns (by city, age, etc.)
- [ ] A/B testing for challenge formats
- [ ] Predictive analytics (ML-based forecasting)
- [ ] Partner API access for custom integrations
- [ ] Mobile app analytics integration
