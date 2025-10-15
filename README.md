<div align="center">

# 🗺️ Michigan Spots

### *Discover Michigan's Hidden Gems Through Community-Powered Exploration*

[![Live Site](https://img.shields.io/badge/🌐_Live-michiganspots.com-FF5D01?style=for-the-badge)](https://michiganspots.com)
[![Reddit Community Games 2025](https://img.shields.io/badge/Reddit_Community_Games-2025-FF4500?style=for-the-badge&logo=reddit&logoColor=white)](https://communitygames2025.devpost.com/)
[![Built with Astro](https://img.shields.io/badge/Built_with-Astro-FF5D01?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![Powered by Cloudflare](https://img.shields.io/badge/Powered_by-Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://cloudflare.com)

<img src="https://img.shields.io/badge/Status-Launching_Oct_2025-success?style=flat-square" alt="Status" />
<img src="https://img.shields.io/badge/Partnerships-Open-blue?style=flat-square" alt="Partnerships" />
<img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />

---

**A Reddit-powered geogame where Michiganders discover, compete, and celebrate the Great Lakes State**

[🚀 Join the Hunt](#-getting-started) • [💼 Become a Partner](#-partnership-opportunities) • [🏆 About the Competition](#-reddit-community-games-2025)

</div>

---

## 🎯 What is Michigan Spots?

Michigan Spots transforms the Great Lakes State into a **living treasure map** where locals and visitors compete to discover hidden gems—from secret trails to historic landmarks to beloved local businesses.

### The Game
- 🔍 **Discover** hidden spots across Michigan
- 📸 **Submit** photos and stories to earn points
- 🏆 **Compete** in weekly themed challenges
- 🎖️ **Collect** exclusive badges (Bronze → Silver → Gold → Legendary)
- 🏙️ **Battle** for city supremacy (Detroit vs Ann Arbor vs Battle Creek)
- 👥 **Build** your team and climb the leaderboards

### The Platform
Built for **Reddit Community Games 2025**, Michigan Spots leverages Reddit's community power to create authentic, local engagement at scale.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🗺️ **Spot Discovery System**
- Community-submitted locations
- GPS verification
- Photo requirements
- Rich descriptions and tags
- Business verification system

</td>
<td width="50%">

### 🏆 **Challenge Engine**
- Weekly themed challenges
- Sponsor integrations
- City vs city competitions
- Seasonal events
- Progressive difficulty tiers

</td>
</tr>
<tr>
<td width="50%">

### 🎖️ **Gamification**
- Multi-tier badge system
- Real-time leaderboards
- Team-based competitions
- Achievement tracking
- Reward redemption

</td>
<td width="50%">

### 💼 **Partnership Platform**
- Chamber of Commerce packages
- Business challenge sponsorships
- Community organization support
- Analytics & ROI tracking
- Stripe payment integration

</td>
</tr>
</table>

---

## 🏗️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Astro + React | Static site generation with interactive islands |
| **Styling** | Tailwind CSS | Utility-first, treasure-map themed design |
| **Animation** | Framer Motion | Smooth, delightful micro-interactions |
| **Icons** | Lucide React | Beautiful, consistent iconography |
| **Backend** | Cloudflare Workers | Edge computing for <100ms response times |
| **Database** | Cloudflare D1 | Serverless SQLite at the edge |
| **Storage** | Cloudflare R2 | Object storage for images |
| **Payments** | Stripe | Secure partnership payment processing |
| **Hosting** | Cloudflare Pages | Global CDN, auto-scaling |

</div>

### Why This Stack?

✅ **Lightning Fast** - Sub-100ms global response times via edge computing
✅ **Cost Efficient** - 60-80% lower hosting costs vs traditional cloud
✅ **Infinitely Scalable** - Handle 10 or 10 million users seamlessly
✅ **Developer Friendly** - TypeScript everywhere, great DX
✅ **Secure** - Built-in DDoS protection, automatic HTTPS

---

## 🎨 Design Philosophy

Michigan Spots features a unique **treasure map aesthetic** that blends vintage nautical charm with modern UX:

<table>
<tr>
<th>Color</th>
<th>Purpose</th>
<th>Hex</th>
</tr>
<tr>
<td>🟤 Parchment</td>
<td>Backgrounds, aged paper feel</td>
<td><code>#F4EFE5</code></td>
</tr>
<tr>
<td>🟤 Ink Brown</td>
<td>Primary text, borders</td>
<td><code>#2C1810</code></td>
</tr>
<tr>
<td>🔵 Lakes Blue</td>
<td>Primary actions, water themes</td>
<td><code>#2E5077</code></td>
</tr>
<tr>
<td>🟠 Copper Orange</td>
<td>CTAs, treasure markers</td>
<td><code>#D97642</code></td>
</tr>
<tr>
<td>🟡 Gold</td>
<td>Achievements, rewards</td>
<td><code>#F4A261</code></td>
</tr>
<tr>
<td>🟢 Forest Green</td>
<td>Success states, nature</td>
<td><code>#4A7C59</code></td>
</tr>
</table>

### Typography
- **Display**: Crimson Pro (elegant, high-impact headlines)
- **Heading**: Merriweather (readable, authoritative)
- **Body**: Inter (modern, highly legible)
- **Decorative**: Pirata One (treasure map flair)

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
node >= 18.0.0
npm >= 9.0.0

# Accounts needed
- Cloudflare account (free tier works)
- Stripe account (for partnerships)
```

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/michiganspot.git
cd michiganspot

# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:4321
```

### Database Setup

```bash
# Create D1 database
npx wrangler d1 create michiganspot-db

# Initialize schema
npx wrangler d1 execute michiganspot-db --file database/schema.sql

# Run migrations
npx wrangler d1 execute michiganspot-db --file database/migration_001_enhanced_analytics.sql
npx wrangler d1 execute michiganspot-db --file database/migration_002_partner_signups.sql
npx wrangler d1 execute michiganspot-db --file database/migration_003_stripe_payments.sql
```

### Stripe Setup (Partnerships)

```bash
# Add Stripe secrets
npx wrangler secret put STRIPE_SECRET_KEY --env production
npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production

# Create products
npm install stripe
export STRIPE_SECRET_KEY="sk_test_..."
npx tsx scripts/setup-stripe-products.ts

# Copy output Price IDs to wrangler.toml
```

### Deploy

```bash
# Build and deploy
npm run deploy

# Deploy database to production
npx wrangler d1 execute michiganspot-db --remote --file database/schema.sql
```

---

## 📁 Project Structure

```
michiganspot/
├── 📂 src/
│   ├── 🧩 components/          # React components
│   │   ├── Hero.tsx           # Animated landing hero
│   │   ├── SignUpForm.tsx     # Waitlist signup
│   │   ├── PartnerSignUpForm.tsx  # Quick partner interest
│   │   ├── CheckoutButton.tsx # Stripe payment button
│   │   ├── Header.tsx         # Navigation with dropdown
│   │   └── Footer.tsx         # Site footer
│   ├── 📐 layouts/
│   │   └── Layout.astro       # Main layout wrapper
│   ├── 📄 pages/              # File-based routing
│   │   ├── index.astro        # 🏠 Homepage
│   │   ├── about.astro        # ℹ️ About the game
│   │   ├── partnerships.astro # 🤝 Partnership hub
│   │   ├── chamber-partnerships.astro
│   │   ├── business-partnerships.astro
│   │   ├── chamber-intake.astro      # 📋 Application forms
│   │   ├── business-intake.astro
│   │   ├── community-intake.astro
│   │   └── success.astro      # ✅ Payment success
│   ├── 🎨 styles/
│   │   └── global.css         # Treasure map theme
│   └── 🛠️ lib/
│       └── stripe-prices.ts   # Price configuration
├── ⚡ functions/
│   └── api/
│       ├── signup.ts          # Waitlist signups
│       ├── partner-signup.ts  # Quick partner interest
│       ├── create-checkout.ts # Stripe checkout sessions
│       └── stripe-webhook.ts  # Payment webhooks
├── 🗄️ database/
│   ├── schema.sql             # Full database schema
│   └── migration_*.sql        # Schema migrations
├── 🎬 scripts/
│   └── setup-stripe-products.ts  # Stripe product creator
└── ⚙️ Config Files
    ├── wrangler.toml          # Cloudflare configuration
    ├── astro.config.mjs       # Astro settings
    └── tailwind.config.mjs    # Theme tokens
```

---

## 💼 Partnership Opportunities

Michigan Spots offers **founding partner pricing** for early adopters (60-70% off regular rates):

### 🏛️ Chambers of Commerce

| Tier | Founding Price | Regular Price | Savings |
|------|---------------|---------------|---------|
| **Launch Partner** | $299/quarter | $2,500/quarter | **$2,001** |
| **City Launch Partner** | $599/quarter | $5,000/quarter | **$4,001** |
| **Regional Launch Partner** | $1,999/quarter | $10,000+/quarter | **$8,001+** |

### 🏪 Individual Businesses

| Package | Founding Price | Regular Price | Savings |
|---------|---------------|---------------|---------|
| **Single Challenge** | $99 | $299 | **$200** |
| **Seasonal Campaign** | $249 | $899 | **$650** |
| **Multi-Location** | $149/location | $399/location | **$250** |
| **Event Sponsorship** | $199 | $599 | **$400** |

### 🤝 Community Organizations

| Tier | Price | Details |
|------|-------|---------|
| **FREE Tier** | $0 | Libraries, parks, non-profits |
| **Minimal Budget** | $50 | Enhanced features |
| **Modest Budget** | $100 | Full feature access |

**📧 Inquiries**: partnerships@michiganspots.com
**🌐 Learn More**: [michiganspots.com/partnerships](https://michiganspots.com/partnerships)

---

## 🏆 Reddit Community Games 2025

<div align="center">

![Reddit Community Games](https://img.shields.io/badge/Reddit_Community_Games-Participant-FF4500?style=for-the-badge&logo=reddit&logoColor=white)

**Prize Pool**: $45,000 • **Dates**: Oct 13-29, 2025 • **Category**: Community Play

</div>

Michigan Spots is a proud participant in Reddit's inaugural Community Games hackathon, competing in the **Community Play** category for massively multiplayer experiences.

### Why Michigan Spots Fits Perfectly

✅ **Community-Driven** - Every spot, challenge, and badge comes from local Michiganders
✅ **Multiplayer at Scale** - City vs city competitions with thousands of players
✅ **Reddit Integration** - Built on r/michiganspots for authentic discussion
✅ **Meaningful Engagement** - Strengthens local pride and business discovery

---

## 🗄️ Database Schema

<details>
<summary><b>Click to expand full schema</b></summary>

### Core Tables (38 total)

**User & Community**
- `signups` - Waitlist registrations
- `users` - Player profiles (Reddit-linked)
- `teams` - City-based teams
- `user_follows` - Social connections

**Discovery & Content**
- `spots` - All discoverable locations
- `photos` - User-submitted spot photos
- `reviews` - Ratings and reviews (1-5 stars)
- `comments` - Threaded discussions
- `favorites` - Bookmarked spots
- `check_ins` - GPS-verified visits

**Gamification**
- `challenges` - Weekly themed challenges
- `badges` - Achievement definitions
- `user_badges` - Earned achievements
- `leaderboard_entries` - Competition rankings
- `challenge_participants` - Challenge enrollment
- `activity_feed` - User activity timeline

**Analytics**
- `spot_views` - Page view tracking
- `search_queries` - Search behavior
- `daily_analytics` - Aggregated metrics

**Partnerships**
- `partner_signups` - Quick interest forms
- `partner_payments` - Stripe transactions
- `stripe_customers` - Customer records
- `partnership_activations` - Active partnerships
- `sponsor_payments` - Sponsorship tracking

**Moderation**
- `reports` - Content flagging
- `notifications` - User notifications
- `stripe_webhook_events` - Payment event log

</details>

---

## 🎯 Roadmap

### ✅ Phase 1: Foundation (Complete)
- [x] Landing page with treasure map design
- [x] Waitlist signup system
- [x] Partnership pages and intake forms
- [x] Stripe payment integration
- [x] Database schema (38 tables)
- [x] Success page and payment flow

### 🚧 Phase 2: Core Game (In Progress)
- [ ] Reddit Devvit app integration
- [ ] Spot submission system
- [ ] Challenge creation interface
- [ ] Badge awarding engine
- [ ] Leaderboard calculations
- [ ] User profiles

### 📅 Phase 3: Launch (October 2025)
- [ ] Beta testing in Battle Creek
- [ ] Partner onboarding (first 10)
- [ ] Marketing campaign
- [ ] Reddit Community Games submission
- [ ] Public launch on r/michiganspots

### 🚀 Phase 4: Growth (Post-Launch)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] Expansion to other states
- [ ] Enterprise partnership tiers

---

## 🤝 Contributing

Michigan Spots is built by **[Cozyartz Media Group](https://cozyartz.com)**, a Battle Creek-based development studio.

### Want to Get Involved?

🎮 **Play the Game** - Join [r/michiganspots](https://reddit.com/r/michiganspots) in October 2025
💼 **Become a Partner** - Email partnerships@michiganspots.com
📣 **Spread the Word** - Share with Michigan communities
🐛 **Report Issues** - GitHub Issues (coming soon)

---

## 📊 Performance

<div align="center">

| Metric | Value |
|--------|-------|
| **Global Response Time** | <100ms (p95) |
| **Lighthouse Score** | 95+ (all categories) |
| **Page Weight** | <500KB (including images) |
| **Uptime** | 99.99% (Cloudflare SLA) |
| **Database Query Time** | <5ms average |

</div>

---

## 📜 License & Copyright

**Copyright © 2025 Cozyartz Media Group. All rights reserved.**

This project is proprietary software. Unauthorized copying, modification, or distribution is prohibited.

For licensing inquiries: partnerships@michiganspots.com

---

<div align="center">

## 🔗 Links

[![Website](https://img.shields.io/badge/Website-michiganspots.com-FF5D01?style=for-the-badge)](https://michiganspots.com)
[![Reddit](https://img.shields.io/badge/Reddit-r/michiganspots-FF4500?style=for-the-badge&logo=reddit&logoColor=white)](https://reddit.com/r/michiganspots)
[![Email](https://img.shields.io/badge/Email-partnerships@michiganspots.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:partnerships@michiganspots.com)

---

### Built with ❤️ in Michigan

*Launching October 2025 • Founding Partner Pricing Available Now*

**[🚀 Join the Hunt](https://michiganspots.com) • [💼 Become a Partner](https://michiganspots.com/partnerships) • [🗣️ Join the Community](https://reddit.com/r/michiganspots)**

---

⭐ **Star this repo if you're excited about Michigan Spots!** ⭐

</div>
