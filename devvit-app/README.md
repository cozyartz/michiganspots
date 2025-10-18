# Reddit Treasure Hunt Game - Devvit App

A Reddit-native treasure hunt game for r/michiganspots that connects local businesses with Reddit users through GPS-verified challenges.

## Overview

This Devvit app provides an interactive treasure hunt experience where users can:
- Browse active challenges from local Michigan businesses
- Complete location-based challenges with GPS verification
- Earn points and badges for visiting businesses
- Compete on leaderboards with other community members
- Engage with challenges through Reddit's social features

## Project Structure

```
src/
├── main.tsx              # Main app entry point
├── types/                # TypeScript type definitions
│   ├── index.ts         # Main types export
│   ├── core.ts          # Core game types
│   ├── analytics.ts     # Analytics event types
│   └── errors.ts        # Error handling types
└── utils/               # Utility functions
    └── config.ts        # Configuration utilities
```

## Configuration

The app requires the following settings to be configured in the Devvit dashboard:

- **CLOUDFLARE_API_KEY**: API key for Cloudflare Workers analytics integration
- **ANALYTICS_BASE_URL**: Base URL for analytics API (default: https://michiganspots.com/api/analytics)
- **GPS_VERIFICATION_RADIUS**: GPS verification radius in meters (default: 100)
- **MAX_SUBMISSIONS_PER_USER_PER_DAY**: Rate limiting for submissions (default: 10)

## Development

### Prerequisites

- Node.js 18+
- Devvit CLI installed (`npm install -g devvit`)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the app:
   ```bash
   npm run build
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

### Testing

Run tests with:
```bash
npm test
```

For watch mode during development:
```bash
npm run test:watch
```

## Deployment

1. Build the app:
   ```bash
   npm run build
   ```

2. Upload to Reddit:
   ```bash
   npm run upload
   ```

## Features

### Core Features
- Challenge browsing and filtering
- GPS-verified challenge completion
- Points and badge system
- Leaderboards and rankings
- Social engagement tracking

### Analytics Integration
- Real-time event tracking to Cloudflare Workers
- Partner ROI analytics
- User engagement metrics
- Fraud prevention and validation

### Security Features
- GPS spoofing detection
- Rate limiting and abuse prevention
- Submission validation
- Privacy controls

## Architecture

The app integrates with the existing Michigan Spots infrastructure:
- **Devvit App**: Native Reddit interface and game logic
- **Cloudflare Workers**: Analytics processing and partner services
- **D1 Database**: Persistent storage for analytics and user data
- **Redis**: Real-time data and caching

## Requirements Mapping

This implementation addresses the following requirements:
- 9.1: Reddit OAuth integration and native interface
- 9.2: Devvit KV store for game data
- 9.3: Reddit UI/UX patterns and responsive performance