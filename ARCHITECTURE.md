# Michigan Spots Architecture

## System Overview

Michigan Spots requires a **hybrid architecture** combining:
1. **Devvit App** (runs ON Reddit) - Required for Reddit Community Games 2025
2. **Cloudflare Infrastructure** (michiganspots.com) - Payments, analytics, partner portal
3. **Communication Bridge** - Sync data between Reddit and Cloudflare

---

## Current State Analysis

### ✅ What We Have Built
- **Website (michiganspots.com)**:
  - Marketing landing pages
  - Waitlist signup system
  - Partnership payment processing (Stripe)
  - Email system (welcome emails, partnership confirmations)
  - 38-table database schema (Cloudflare D1)
  - Partnership agreement acceptance flow

### ❌ What's Missing (Critical for Competition)
- **Devvit App**: The actual game mechanics (runs in r/michiganspots)
- **Data Sync**: Bridge between Devvit and Cloudflare
- **Partner Dashboard**: Analytics portal for sponsors
- **Analytics Engine**: Track challenge performance
- **Email Reporting**: Automated partner reports

---

## Architecture Decision: Hybrid System

### Why We Need BOTH Devvit + Cloudflare

**Devvit App (Required for Competition)**
- ✅ Runs directly on Reddit as interactive posts
- ✅ Access to Reddit's event triggers (PostSubmit, CommentSubmit)
- ✅ Meets Reddit Community Games requirements
- ❌ Cannot process Stripe payments
- ❌ Limited external API access
- ❌ No direct email capabilities
- ❌ Redis-only storage (no SQL)

**Cloudflare Workers (Required for Business Logic)**
- ✅ Process Stripe payments for partners
- ✅ Send email reports via MailChannels
- ✅ SQL database (D1) for complex analytics
- ✅ Build partner dashboards
- ✅ Generate comprehensive reports
- ❌ Cannot run inside Reddit posts

**Conclusion**: We need both systems working together.

---

## System Components

### 1. Devvit App (Reddit Game Engine)

**Location**: `r/michiganspots` subreddit
**Technology**: Devvit Web (TypeScript)
**Purpose**: Core game mechanics

**Features**:
- **Challenge Posts**: Weekly challenge threads with embedded game UI
- **Spot Submissions**: Users submit photos/locations via Reddit comments/posts
- **Badge System**: Award badges based on participation
- **Leaderboards**: Real-time rankings displayed in custom posts
- **Event Tracking**: Listen to PostSubmit, CommentSubmit events

**Data Storage** (Devvit Redis):
- User participation counts
- Challenge completion status
- Badge awards
- Leaderboard rankings

**Communication**:
- **Outbound**: HTTP requests to Cloudflare Workers API for analytics sync
- **Trigger**: On every significant event (challenge complete, spot submitted, badge earned)

### 2. Cloudflare Infrastructure (Business Platform)

**Location**: `michiganspots.com`
**Technology**: Astro + React + Cloudflare Workers + D1
**Purpose**: Payments, analytics, partner portal

**Features**:
- **Partner Portal**: Dashboard showing challenge performance
- **Analytics API**: Receive data from Devvit app
- **Email Reports**: Weekly/monthly automated reports to partners
- **Payment Processing**: Stripe integration for partnerships
- **User Management**: Waitlist, signups, partner accounts

**Data Storage** (Cloudflare D1):
- Partner payment records
- User waitlist signups
- Challenge analytics (aggregated from Devvit)
- Email report history
- Partner engagement metrics

**API Endpoints**:
```
POST /api/analytics/track-challenge    - Receive challenge completion from Devvit
POST /api/analytics/track-engagement   - Receive user interactions from Devvit
GET  /api/analytics/partner/:id        - Partner dashboard data
POST /api/reports/send-partner-email   - Trigger partner report email
GET  /api/dashboard/signups            - Admin dashboard for all signups
```

### 3. Communication Bridge

**Devvit → Cloudflare Flow**:
1. User completes challenge in Devvit app
2. Devvit app calls `POST /api/analytics/track-challenge`
3. Cloudflare Worker stores data in D1 database
4. Analytics accumulate for partner reporting

**Example Devvit Code**:
```typescript
// In Devvit app when challenge is completed
async function onChallengeComplete(challengeId: string, userId: string) {
  // Track locally in Redis
  await redis.incr(`challenge:${challengeId}:completions`);

  // Sync to Cloudflare for partner analytics
  await fetch('https://michiganspots.com/api/analytics/track-challenge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': settings.get('CLOUDFLARE_API_KEY')
    },
    body: JSON.stringify({
      challengeId,
      userId,
      timestamp: new Date().toISOString(),
      type: 'completion'
    })
  });
}
```

**Cloudflare → Devvit Flow**:
1. Partner creates challenge via website
2. Cloudflare stores challenge in D1
3. Cloudflare calls Reddit API to create challenge post in r/michiganspots
4. Challenge ID linked between both systems

---

## Database Schema Updates

### New Tables for Analytics Tracking

```sql
-- Track individual challenge completions from Devvit
CREATE TABLE challenge_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  user_reddit_username TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  submission_url TEXT, -- Reddit post/comment URL
  FOREIGN KEY (challenge_id) REFERENCES challenges(id)
);
CREATE INDEX idx_challenge_completions_challenge ON challenge_completions(challenge_id);
CREATE INDEX idx_challenge_completions_user ON challenge_completions(user_reddit_username);

-- Track engagement events from Devvit
CREATE TABLE engagement_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'view', 'comment', 'upvote', 'share'
  challenge_id INTEGER,
  spot_id INTEGER,
  user_reddit_username TEXT,
  event_data TEXT, -- JSON blob
  created_at TEXT NOT NULL
);
CREATE INDEX idx_engagement_events_type ON engagement_events(event_type);
CREATE INDEX idx_engagement_events_challenge ON engagement_events(challenge_id);

-- Partner analytics summary (aggregated daily)
CREATE TABLE partner_analytics_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  challenge_views INTEGER DEFAULT 0,
  challenge_completions INTEGER DEFAULT 0,
  challenge_comments INTEGER DEFAULT 0,
  challenge_upvotes INTEGER DEFAULT 0,
  unique_participants INTEGER DEFAULT 0,
  FOREIGN KEY (partner_id) REFERENCES partnership_activations(id),
  UNIQUE(partner_id, date)
);
CREATE INDEX idx_partner_analytics_daily_partner ON partner_analytics_daily(partner_id);
CREATE INDEX idx_partner_analytics_daily_date ON partner_analytics_daily(date);

-- Email report tracking
CREATE TABLE partner_reports_sent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  report_type TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly'
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  email_to TEXT NOT NULL,
  report_data TEXT, -- JSON snapshot of metrics
  FOREIGN KEY (partner_id) REFERENCES partnership_activations(id)
);
CREATE INDEX idx_partner_reports_partner ON partner_reports_sent(partner_id);
```

---

## Partner Dashboard Requirements

### Dashboard Features

**Overview Page**:
- Total challenge views
- Total completions
- Unique participants
- Engagement rate (completions / views)
- Trending graph (last 30 days)

**Challenge Performance**:
- List of all challenges sponsored by partner
- Per-challenge metrics:
  - Views
  - Completions
  - Comments
  - Upvotes
  - Top participants
  - Reddit post link

**User Engagement**:
- Demographics (by city/team)
- Participation timeline
- Repeat visitors
- Badge awards related to partner challenges

**Export Options**:
- Download CSV of all metrics
- Request custom report via email

---

## Email Reporting System

### Report Types

**Weekly Report** (Sent every Monday):
- Summary of past week's activity
- Top performing challenges
- New participants
- Engagement trends

**Monthly Report** (Sent first of month):
- Comprehensive monthly summary
- Month-over-month comparison
- ROI analysis (cost per engagement)
- Recommendations for next month

**Quarterly Report** (End of partnership period):
- Full partnership summary
- Total impact metrics
- Success stories
- Renewal offer

### Email Report Logic

**Scheduler**: Cloudflare Workers Cron Triggers
```typescript
// Cloudflare Worker scheduled job
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    if (event.cron === '0 9 * * MON') {
      // Every Monday at 9 AM
      await sendWeeklyReportsToAllPartners(env);
    }

    if (event.cron === '0 9 1 * *') {
      // First of every month at 9 AM
      await sendMonthlyReportsToAllPartners(env);
    }
  }
};
```

**Report Generation**:
1. Query `partner_analytics_daily` for date range
2. Aggregate metrics per partner
3. Generate HTML email with charts (using inline CSS)
4. Send via MailChannels API
5. Log in `partner_reports_sent`

---

## Reddit API vs Devvit

### What We Should Use

**Devvit (Recommended)**:
- ✅ Official Reddit Developer Platform
- ✅ Event triggers built-in
- ✅ Runs directly in subreddit
- ✅ Required for Competition
- ✅ Better UX (embedded in Reddit)

**Reddit Data API** (Legacy):
- ❌ Requires OAuth authentication
- ❌ Rate limited (60 requests/minute)
- ❌ Polling required (no webhooks)
- ❌ Not eligible for Competition

**Conclusion**: Build primary game logic in **Devvit**, use Reddit Data API only for read-only operations if needed (e.g., pulling historical data).

---

## Devvit Event Triggers

### Available Triggers

Based on Devvit documentation, we can listen to:

**Post Events**:
- `PostSubmit` - New post created
- `PostCreate` - Post creation confirmed
- `PostUpdate` - Post edited
- `PostDelete` - Post deleted

**Comment Events**:
- `CommentSubmit` - New comment created
- `CommentCreate` - Comment creation confirmed
- `CommentUpdate` - Comment edited
- `CommentDelete` - Comment deleted

**Moderation Events**:
- `ModAction` - Moderator action taken
- `PostReport` - Post reported
- `CommentReport` - Comment reported

**App Events**:
- `AppInstall` - App installed in subreddit
- `AppUpgrade` - App upgraded

### How We'll Use Them

**Challenge Completion Tracking**:
```typescript
Devvit.addTrigger({
  event: 'PostSubmit',
  onEvent: async (event, context) => {
    const post = await context.reddit.getPostById(event.postId);

    // Check if post is challenge submission
    if (post.linkFlairText === 'Challenge Submission') {
      const challengeId = extractChallengeId(post.title);

      // Track locally
      await context.redis.incr(`challenge:${challengeId}:count`);

      // Sync to Cloudflare
      await trackChallengeCompletion(challengeId, post.authorName, post.id);
    }
  }
});
```

**Engagement Tracking**:
```typescript
Devvit.addTrigger({
  event: 'CommentSubmit',
  onEvent: async (event, context) => {
    const comment = await context.reddit.getCommentById(event.commentId);
    const post = await context.reddit.getPostById(comment.postId);

    // Track engagement
    await trackEngagementEvent({
      type: 'comment',
      challengeId: extractChallengeId(post.title),
      username: comment.authorName,
      postId: post.id
    });
  }
});
```

---

## Scheduler Implementation

### Cloudflare Workers Cron (for emails/reports)

**wrangler.toml**:
```toml
[triggers]
crons = [
  "0 9 * * MON",    # Weekly reports (Monday 9 AM)
  "0 9 1 * *",      # Monthly reports (1st of month 9 AM)
  "0 */6 * * *"     # Analytics aggregation (every 6 hours)
]
```

### Devvit Scheduler (for game mechanics)

```typescript
Devvit.addSchedulerJob({
  name: 'weekly-challenge-post',
  cron: '0 12 * * MON', // Every Monday at noon
  onRun: async (event, context) => {
    // Create new weekly challenge post
    const challenge = await getNextChallenge();
    await context.reddit.submitPost({
      subredditName: 'michiganspots',
      title: challenge.title,
      richtext: challenge.description,
      linkFlairTemplateId: 'challenge-flair-id'
    });
  }
});
```

---

## Implementation Priority

### Phase 1: Foundation (This Week)
1. ✅ Analytics database tables
2. ✅ Analytics API endpoints (Cloudflare Workers)
3. ✅ Partner dashboard page (basic)
4. ✅ Email reporting system setup

### Phase 2: Devvit App (Next Week)
1. Create Devvit app project
2. Implement challenge post custom UI
3. Add event triggers (PostSubmit, CommentSubmit)
4. Connect to Cloudflare analytics API
5. Test in r/michiganspots

### Phase 3: Integration (Week 3)
1. End-to-end testing
2. Partner onboarding flow
3. Email report automation
4. Dashboard refinements

### Phase 4: Competition Submission (Week 4)
1. Deploy to production
2. Submit to Reddit Community Games
3. Create demo video
4. Write submission documentation

---

## Security Considerations

### API Authentication

**Devvit → Cloudflare**:
- Use API key stored in Devvit settings
- Validate API key in Cloudflare Worker
- Rate limit requests per API key

**Partner Dashboard**:
- JWT authentication for partners
- Session management
- Partner can only see their own analytics

### Data Privacy

- Store Reddit usernames, not real names
- Aggregate data for reporting
- Allow users to opt-out of tracking
- GDPR compliance for EU users

---

## Success Metrics

### Technical Metrics
- API response time <100ms
- Zero data loss between Devvit and Cloudflare
- 99.9% uptime for analytics endpoints
- Email delivery rate >95%

### Business Metrics
- Partner dashboard usage >80%
- Email open rate >40%
- Partner renewals >60%
- Challenge completion rate >30%

---

## Questions to Answer

1. ✅ **Do we need Cloudflare Workers?** YES - for payments, emails, analytics aggregation
2. ✅ **Do we need Devvit?** YES - required for Reddit Community Games
3. ✅ **How do they communicate?** Devvit calls Cloudflare API via HTTP
4. ✅ **Where is analytics stored?** Cloudflare D1 (aggregated from Devvit events)
5. ✅ **How do partners get reports?** Automated emails + dashboard portal

---

## Next Steps

1. Create analytics database migrations
2. Build analytics API endpoints
3. Create partner dashboard UI
4. Implement email reporting logic
5. Set up Devvit project
6. Connect Devvit to Cloudflare APIs
