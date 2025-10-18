#!/bin/bash

# Production Deployment Script for Reddit Treasure Hunt Game
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🚀 Starting production deployment for Reddit Treasure Hunt Game..."

# Check if we're in the correct directory
if [ ! -f "devvit.yaml" ]; then
    echo "❌ Error: Must run from devvit-app directory"
    exit 1
fi

# Check if Devvit CLI is installed
if ! command -v devvit &> /dev/null; then
    echo "❌ Error: Devvit CLI not found. Please install it first:"
    echo "   npm install -g devvit"
    exit 1
fi

# Check if user is logged in to Devvit
echo "🔐 Checking Devvit authentication..."
if ! devvit whoami &> /dev/null; then
    echo "❌ Error: Not logged in to Devvit. Please run:"
    echo "   devvit login"
    exit 1
fi

# Load production environment variables
if [ -f ".env.production" ]; then
    echo "📋 Loading production environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env.production file not found"
fi

# Run tests before deployment
echo "🧪 Running tests..."
npm test

# Build the app
echo "🔨 Building application..."
npm run build

# Upload to Reddit
echo "📤 Uploading to Reddit..."
devvit upload

# Install to r/michiganspots subreddit
echo "🏠 Installing to r/michiganspots..."
devvit install --subreddit michiganspots

echo "✅ Production deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure app settings in Reddit:"
echo "   - CLOUDFLARE_API_KEY: Set your production API key"
echo "   - ANALYTICS_BASE_URL: https://michiganspots.com/api/analytics"
echo "   - GPS_VERIFICATION_RADIUS: 100"
echo "   - MAX_SUBMISSIONS_PER_USER_PER_DAY: 10"
echo ""
echo "2. Test the app functionality:"
echo "   - Visit r/michiganspots"
echo "   - Create a test challenge post"
echo "   - Verify analytics are being sent"
echo ""
echo "3. Monitor logs and performance"
echo ""
echo "🎉 Deployment complete! The app is now live on r/michiganspots"