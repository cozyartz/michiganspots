# Michigan Spots - Kiro Steering Document

## Project Context

This is a Reddit Devvit app for r/michiganspots - a community treasure hunt game where users discover local Michigan businesses through GPS-verified challenges.

## Critical Integration Info

### Cloudflare Workers API (Already Deployed)
**Base URL:** `https://michiganspots.com`

**Analytics Endpoints:**
- `POST /api/analytics/track-engagement` - Track views, comments, upvotes, shares
- `POST /api/analytics/track-challenge` - Track challenge completions (foot traffic)

**Authentication Header:**
```
X-API-Key: DEVVIT_API_KEY
```

### Reddit Subreddit
**Target:** r/michiganspots

## Database Schema (Backend Reference)

### challenges
- id (INTEGER)
- title (TEXT)
- description (TEXT)
- status (TEXT): 'active', 'completed', 'pending'
- sponsor_id (INTEGER) - partner who created it
- start_date (TEXT)
- end_date (TEXT)
- reddit_post_url (TEXT)
- created_at (TEXT)

### engagement_events
- id (INTEGER)
- event_type (TEXT): 'view', 'comment', 'upvote', 'share', 'award'
- challenge_id (INTEGER)
- spot_id (INTEGER)
- user_reddit_username (TEXT)
- post_id (TEXT)
- comment_id (TEXT)
- event_data (TEXT - JSON)
- created_at (TEXT)

### challenge_completions
- id (INTEGER)
- challenge_id (INTEGER)
- user_reddit_username (TEXT)
- completed_at (TEXT - ISO 8601)
- submission_url (TEXT)
- submission_type (TEXT): 'post' or 'comment'
- created_at (TEXT)

## API Request Examples

### Track View Event
```typescript
await fetch('https://michiganspots.com/api/analytics/track-engagement', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': context.settings.get('DEVVIT_API_KEY')
  },
  body: JSON.stringify({
    eventType: 'view',
    challengeId: 1,
    userRedditUsername: username,
    postId: postId
  })
});
```

### Track Challenge Completion
```typescript
await fetch('https://michiganspots.com/api/analytics/track-challenge', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': context.settings.get('DEVVIT_API_KEY')
  },
  body: JSON.stringify({
    challengeId: 1,
    userRedditUsername: username,
    submissionUrl: 'https://reddit.com/r/michiganspots/...',
    submissionType: 'post',
    completedAt: new Date().toISOString()
  })
});
```

## Environment/Settings

Configure these in Devvit app settings:
- `DEVVIT_API_KEY` - Secret key for API authentication
- `CLOUDFLARE_API_URL` - https://michiganspots.com/api

## Key Business Rules

1. **GPS Verification:** User must be within 100 meters of business location
2. **One completion per user per challenge**
3. **Valid time window:** Challenges only active between start_date and end_date
4. **Photo verification:** Must show business signage/interior

## Points System
- Easy: 10 points
- Medium: 25 points
- Hard: 50 points

## Event Tracking Requirements

**Send events at these moments:**
- User views challenge → `eventType: 'view'`
- User comments → `eventType: 'comment'`
- User upvotes → `eventType: 'upvote'`
- User completes challenge → Track via `/track-challenge` endpoint
- User shares → `eventType: 'share'`

## Partner Types

1. **Chamber of Commerce** - Multi-challenge quarterly packages
2. **Individual Business** - Single business challenges
3. **Community Org** - Event-based challenges

## Tech Stack

- **Platform:** Reddit Devvit
- **Language:** TypeScript
- **Storage:** Devvit KV Store (for game state, user data, leaderboards)
- **Analytics:** Cloudflare Workers API (external)
- **Auth:** Devvit's built-in Reddit OAuth

## Success Metrics

Optimize for:
1. High completion rate (foot traffic)
2. Accurate analytics for partners
3. Community engagement
4. Data integrity

## Testing

Use Database Viewer to verify events:
https://michiganspots.com/admin/database

Partner Dashboard (to see analytics flow):
https://michiganspots.com/partner/dashboard

## Important Notes

- Backend analytics system is ALREADY BUILT and deployed
- Just need to send events from this Devvit app
- Focus on game experience and API integration
- All analytics will automatically flow to partner dashboards
