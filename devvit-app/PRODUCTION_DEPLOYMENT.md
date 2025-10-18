# Production Deployment Guide

This guide covers the complete production deployment process for the Reddit Treasure Hunt Game on r/michiganspots.

## Prerequisites

1. **Devvit CLI installed and authenticated**
   ```bash
   npm install -g devvit
   devvit login
   ```

2. **Production API key from Cloudflare Workers**
   - Obtain the production API key for analytics integration
   - This should be set as `DEVVIT_API_KEY` secret in Cloudflare Workers

3. **Reddit permissions**
   - Must have moderator access to r/michiganspots
   - App installation permissions

## Configuration

### 1. Set Production Environment Variables

Edit `devvit-app/.env.production`:

```bash
# Required - Get from Cloudflare Workers dashboard
CLOUDFLARE_API_KEY=your_actual_production_api_key

# Verify these URLs match your production setup
ANALYTICS_BASE_URL=https://michiganspots.com/api/analytics

# Adjust these settings as needed
GPS_VERIFICATION_RADIUS=100
MAX_SUBMISSIONS_PER_USER_PER_DAY=10
```

### 2. Validate Configuration

```bash
cd devvit-app
npm run validate:config
```

This will check that all required settings are properly configured.

## Deployment Process

### Option 1: Automated Deployment

```bash
cd devvit-app
npm run production:setup
```

This will:
1. Validate configuration
2. Run all tests
3. Build the app
4. Upload to Reddit
5. Install on r/michiganspots

### Option 2: Manual Step-by-Step

```bash
cd devvit-app

# 1. Validate configuration
npm run validate:config

# 2. Run tests
npm test

# 3. Build application
npm run build

# 4. Upload to Reddit
devvit upload

# 5. Install to subreddit
devvit install --subreddit michiganspots
```

## Post-Deployment Configuration

After deployment, configure the app settings in Reddit:

1. **Go to r/michiganspots mod tools**
2. **Navigate to Apps & Tools**
3. **Find "Reddit Treasure Hunt Game"**
4. **Configure settings:**
   - `CLOUDFLARE_API_KEY`: Your production API key
   - `ANALYTICS_BASE_URL`: `https://michiganspots.com/api/analytics`
   - `GPS_VERIFICATION_RADIUS`: `100`
   - `MAX_SUBMISSIONS_PER_USER_PER_DAY`: `10`
   - `ENABLE_FRAUD_DETECTION`: `true`
   - `ENABLE_PERFORMANCE_MONITORING`: `true`
   - `LOG_LEVEL`: `info`

## Verification

### 1. Run Health Checks

```bash
npm run health:check
```

This will test:
- Analytics API connectivity
- Configuration validation
- Response times

### 2. Manual Testing

1. **Visit r/michiganspots**
2. **Create a test challenge post**
3. **Verify the app loads correctly**
4. **Test challenge interactions**
5. **Check analytics in partner dashboard**

### 3. Monitor Logs

- Check Devvit app logs in Reddit developer console
- Monitor Cloudflare Workers logs for analytics events
- Verify data appears in partner dashboard

## Troubleshooting

### Common Issues

**App not loading:**
- Check Reddit permissions
- Verify app is installed on correct subreddit
- Check browser console for errors

**Analytics not working:**
- Verify `CLOUDFLARE_API_KEY` is set correctly
- Check Cloudflare Workers logs
- Ensure API endpoints are accessible

**GPS verification failing:**
- Check `GPS_VERIFICATION_RADIUS` setting
- Verify location permissions in browser
- Test with different devices/browsers

### Debug Commands

```bash
# Check app status
devvit list installations

# View app logs
devvit logs

# Test configuration
npm run validate:config

# Run health checks
npm run health:check
```

## Rollback Procedure

If issues occur, you can rollback:

1. **Uninstall from subreddit:**
   ```bash
   devvit uninstall --subreddit michiganspots
   ```

2. **Revert to previous version:**
   ```bash
   # Upload previous working version
   devvit upload --version previous
   devvit install --subreddit michiganspots
   ```

## Monitoring

### Key Metrics to Monitor

1. **App Performance**
   - Load times
   - Error rates
   - User engagement

2. **Analytics Integration**
   - Event delivery success rate
   - API response times
   - Data accuracy in dashboard

3. **User Experience**
   - Challenge completion rates
   - GPS verification success
   - Error reports

### Monitoring Tools

- Reddit Developer Console
- Cloudflare Workers Analytics
- Partner Dashboard Analytics
- Custom health check script

## Security Considerations

1. **API Key Management**
   - Never commit API keys to version control
   - Use Reddit's secure settings storage
   - Rotate keys regularly

2. **Rate Limiting**
   - Monitor for abuse
   - Adjust limits as needed
   - Implement additional fraud detection

3. **Data Privacy**
   - Ensure GDPR compliance
   - Minimize data collection
   - Secure data transmission

## Support

For deployment issues:
1. Check this documentation
2. Review Devvit documentation
3. Check Reddit developer forums
4. Contact development team

## Changelog

- **v1.0.0** - Initial production deployment
- Production configuration setup
- Health monitoring implementation
- Analytics integration verification