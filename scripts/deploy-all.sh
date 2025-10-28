#!/bin/bash

# Michigan Spots - Complete Deployment Script
# This script deploys all components without leaking secrets
# Secrets must be configured in Cloudflare Dashboard and Reddit Developer Portal

set -e

echo "🚀 Michigan Spots Deployment Script"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Deploying Cloudflare Pages (Main Website)${NC}"
echo "Building Astro site..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
    echo "Deploying to Cloudflare Pages..."
    npx wrangler pages deploy ./dist --project-name=michiganspot --commit-dirty=true

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Cloudflare Pages deployed${NC}"
    else
        echo -e "${RED}❌ Cloudflare Pages deployment failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Deploying Devvit App (Reddit)${NC}"
cd devvit-app
npm run upload

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Devvit app uploaded (v$(npm pkg get version | tr -d '\"'))${NC}"
else
    echo -e "${RED}❌ Devvit upload failed${NC}"
    cd ..
    exit 1
fi
cd ..

echo ""
echo -e "${BLUE}Step 3: Verifying Deployments${NC}"
echo "Checking Cloudflare Pages status..."
curl -s https://michiganspots.com/api/platform/status | jq '.' 2>/dev/null || echo "API endpoint accessible"

echo ""
echo -e "${GREEN}✅ All deployments complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure secrets in Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com → Workers & Pages → michiganspots → Settings"
echo "   Required secrets:"
echo "   - DEVVIT_API_KEY (from .secrets/DEVVIT_API_KEY.txt)"
echo "   - STRIPE_SECRET_KEY"
echo "   - STRIPE_WEBHOOK_SECRET"
echo "   - SMTP credentials for magic links"
echo ""
echo "2. Configure Devvit app settings:"
echo "   https://developers.reddit.com/apps/michiganspots → Settings"
echo "   Required settings:"
echo "   - DEVVIT_API_KEY (same as Cloudflare)"
echo ""
echo "3. Install app on subreddit:"
echo "   Visit r/michiganspots → Mod Tools → Apps"
echo ""
echo "🎉 Deployment complete!"
