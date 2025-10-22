#!/bin/bash

# Michigan Spots Partner System Deployment Script
# Deploys the AI-powered partner onboarding system to Cloudflare

set -e

echo "🚀 Deploying Michigan Spots Partner System..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

# Check if user is logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not logged in to Cloudflare. Please run:"
    echo "   wrangler login"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Running type check..."
npm run type-check

# Create D1 database if it doesn't exist
echo "🗄️ Setting up D1 database..."
DB_NAME="michiganspots-partners"

# Check if database exists
if ! wrangler d1 list | grep -q "$DB_NAME"; then
    echo "Creating D1 database: $DB_NAME"
    wrangler d1 create "$DB_NAME"
    echo "⚠️  Please update wrangler.toml with the database ID from above"
    echo "⚠️  Then run this script again"
    exit 1
fi

# Run database migrations
echo "🔄 Running database migrations..."
wrangler d1 execute "$DB_NAME" --file=./schema.sql --env production

# Create KV namespace if it doesn't exist
echo "🗂️ Setting up KV namespace..."
KV_NAME="michiganspots-partners-kv"

if ! wrangler kv:namespace list | grep -q "$KV_NAME"; then
    echo "Creating KV namespace: $KV_NAME"
    wrangler kv:namespace create "$KV_NAME" --env production
    echo "⚠️  Please update wrangler.toml with the KV namespace ID from above"
    echo "⚠️  Then run this script again"
    exit 1
fi

# Set up secrets (if not already set)
echo "🔐 Setting up secrets..."

# Check if secrets exist, if not prompt user to set them
SECRETS=("OPENAI_API_KEY" "CLOUDFLARE_API_TOKEN" "PARTNER_WEBHOOK_SECRET" "QR_API_KEY")

for secret in "${SECRETS[@]}"; do
    if ! wrangler secret list --env production | grep -q "$secret"; then
        echo "⚠️  Secret $secret not found. Please set it:"
        echo "   wrangler secret put $secret --env production"
    fi
done

# Deploy to Cloudflare Workers
echo "🚀 Deploying to Cloudflare Workers..."
wrangler deploy --env production

# Set up custom domain (optional)
echo "🌐 Setting up custom domain..."
DOMAIN="partners.michiganspots.com"

# This would set up custom domain routing
# wrangler route add "$DOMAIN/*" michiganspots-partner-system --env production

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Verify the deployment at: https://michiganspots-partner-system.your-subdomain.workers.dev"
echo "2. Test the health endpoint: /health"
echo "3. Set up custom domain routing if needed"
echo "4. Configure DNS records for partners.michiganspots.com"
echo "5. Test partner onboarding with a sample business"
echo ""
echo "🔗 Useful commands:"
echo "   wrangler tail --env production  # View logs"
echo "   wrangler d1 execute $DB_NAME --command 'SELECT * FROM partners;' --env production  # Query database"
echo "   wrangler kv:key list --binding PARTNERS --env production  # List KV keys"
echo ""
echo "🎉 Michigan Spots Partner System is now live!"