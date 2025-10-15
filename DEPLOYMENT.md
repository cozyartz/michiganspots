# Deployment Guide - Michigan Spots

Complete guide to deploy Michigan Spots to Cloudflare Pages with D1 Database.

## Prerequisites

- Cloudflare account
- GitHub repository (optional, for auto-deployments)
- Wrangler CLI installed globally

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
npx wrangler login
```

This will open a browser window for authentication.

## Step 3: Create D1 Database

```bash
npx wrangler d1 create michiganspot-db
```

You'll receive output like:

```
Created database michiganspot-db!
database_id = "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx"
```

## Step 4: Update wrangler.toml

Update the `database_id` in `wrangler.toml` with the ID from Step 3:

```toml
[[d1_databases]]
binding = "DB"
database_name = "michiganspot-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

## Step 5: Initialize Database Schema

```bash
npx wrangler d1 execute michiganspot-db --file=database/schema.sql
```

This creates all the necessary tables.

## Step 6: Test Locally with Wrangler

```bash
npx wrangler pages dev dist
```

This tests the Cloudflare Workers integration locally.

## Step 7: Deploy to Cloudflare Pages

### Option A: Direct Deployment

```bash
npm run build
npx wrangler pages deploy ./dist --project-name=michiganspot
```

### Option B: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to Cloudflare Dashboard > Pages
3. Click "Create a project"
4. Connect to your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`

## Step 8: Configure D1 Binding in Cloudflare

1. Go to Cloudflare Dashboard > Pages > Your Project
2. Go to Settings > Functions
3. Add D1 Database Binding:
   - Variable name: `DB`
   - D1 database: Select `michiganspot-db`
4. Save changes

## Step 9: Configure Custom Domain

1. Go to Cloudflare Dashboard > Pages > Your Project
2. Go to Custom domains
3. Add `michiganspots.com`
4. Follow DNS configuration instructions

## Step 10: Test Production Deployment

Visit your deployment URL and test:
- Homepage loads correctly
- About page works
- Partnerships page works
- Sign-up form submits successfully

## Troubleshooting

### Database Connection Errors

If you see database errors:
1. Check D1 binding is configured correctly
2. Verify database_id in wrangler.toml matches your database
3. Re-run schema initialization

### Build Errors

If build fails:
1. Run `npm install` to ensure all dependencies are installed
2. Check for TypeScript errors with `npm run build`
3. Ensure Node.js version is 18+

### API Endpoint Not Working

If `/api/signup` doesn't work:
1. Ensure `functions/api/signup.ts` exists
2. Check D1 binding is properly configured
3. Check browser console for CORS errors

## Environment Variables

For production, you may want to add:

```bash
npx wrangler pages secret put ENVIRONMENT_NAME
```

## Monitoring

- Check Cloudflare Dashboard > Analytics for traffic
- Use Cloudflare Logs for debugging production issues
- Monitor D1 database usage in Cloudflare Dashboard

## Automatic Deployments

With GitHub integration, every push to `main` branch will trigger automatic deployment.

## Rollback

If deployment has issues:
1. Go to Cloudflare Dashboard > Pages > Your Project
2. Go to Deployments
3. Select a previous working deployment
4. Click "Rollback to this deployment"

## Next Steps

After successful deployment:
1. Test all pages and functionality
2. Set up monitoring and alerts
3. Configure email integration for sign-ups
4. Begin Reddit integration development
