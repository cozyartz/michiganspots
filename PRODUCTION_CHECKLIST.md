# Michigan Spots - Production Deployment Checklist

**Last Updated:** November 17, 2025
**Status:** Ready for Production Deployment

---

## Overview

This checklist ensures all signup flows (regular user and partner signups) are properly configured and tested before launching Michigan Spots in production.

---

## ✅ Code Review Status

### Regular User Signup Flow
- ✅ Frontend validation (SignUpForm.tsx)
- ✅ Email validation with eValidate API
- ✅ Backend API endpoint (/api/signup)
- ✅ Database schema (signups table)
- ✅ Welcome email integration
- ✅ Error handling and user feedback

### Partner Signup Flow
- ✅ Multi-tier selection (Spot/Featured/Premium/Title/Chamber)
- ✅ Complex form with add-ons (prizes, web services)
- ✅ Stripe checkout integration
- ✅ Webhook processing (/api/stripe-webhook)
- ✅ Partnership activation system
- ✅ Confirmation email integration
- ✅ Success page flow

---

## 🔐 Environment Configuration

### Required Secrets (Cloudflare Dashboard)

Navigate to: **Workers & Pages > michiganspot > Settings > Environment Variables > Production**

#### Critical Secrets (Required for Core Functionality):

```bash
# Stripe (Payment Processing)
STRIPE_SECRET_KEY          # Live mode key (starts with sk_live_)
STRIPE_WEBHOOK_SECRET      # From Stripe Dashboard > Developers > Webhooks

# Email Validation
EVALIDATE_API_KEY          # From eValidate service (has fallback, but recommended)

# Email Sending
SMTP_PASSWORD              # For welcome and confirmation emails

# API Security
SEED_API_SECRET            # For business seeding API authentication
CRON_SECRET                # For cron job authentication

# Error Tracking
SENTRY_DSN                 # Server-side error tracking (optional but recommended)
```

#### Public Variables (Already in wrangler.toml):
- ✅ `STRIPE_PUBLISHABLE_KEY` - pk_live_51SQcd8RBOZWADDgw...
- ✅ `PUBLIC_SENTRY_CLIENT_DSN` - https://704cddde6de4294b...
- ✅ All Stripe Price IDs for partnership tiers

---

## 🎯 Stripe Configuration

### 1. Verify Live Mode Products & Prices

**In Stripe Dashboard > Products:**

Ensure these products exist with correct prices:

| Tier | Duration | Price ID | Amount |
|------|----------|----------|--------|
| Spot Partner | Monthly | price_1SQcyRRBOZWADDgwLZZr5RZZ | $99 |
| Spot Partner | Quarterly | price_1SQcypRBOZWADDgwPxFKp9YG | $249 |
| Spot Partner | Yearly | price_1SQcypRBOZWADDgwev52m2Jk | $999 |
| Featured Partner | Quarterly | price_1SQczkRBOZWADDgwbiGbeJG5 | $699 |
| Featured Partner | Yearly | price_1SQczkRBOZWADDgwEIQEmtvJ | $2,399 |
| Premium Sponsor | Quarterly | price_1SQd07RBOZWADDgw1w4GIxIB | $1,499 |
| Premium Sponsor | Yearly | price_1SQd08RBOZWADDgwmJzAeHQ4 | $4,999 |
| Title Sponsor | Quarterly | price_1SQd0XRBOZWADDgwzxJgD4yg | $3,999 |
| Title Sponsor | Yearly | price_1SQd0XRBOZWADDgwVWUZHrm4 | $12,999 |
| Chamber Partnership | Quarterly | price_1SQd0sRBOZWADDgwCKQ0aIUf | $899 |
| Chamber Partnership | Yearly | price_1SQd0tRBOZWADDgwKd1RoR6Q | $2,999 |

### 2. Configure Webhook Endpoint

**Stripe Dashboard > Developers > Webhooks > Add Endpoint:**

**Endpoint URL:**
```
https://michiganspots.com/api/stripe-webhook
```

**Events to Select:**
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`

**After Creating:**
1. Copy the **Signing Secret** (whsec_...)
2. Add to Cloudflare as `STRIPE_WEBHOOK_SECRET`

### 3. Test Webhook (Using Stripe CLI)

```bash
# Install Stripe CLI if needed
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Test webhook locally first
stripe listen --forward-to https://michiganspots.com/api/stripe-webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

---

## 🗄️ Database Verification

### Check Tables Exist in Production

```bash
npx wrangler d1 execute michiganspot-db --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

**Required Tables:**
- ✅ `signups` (with user_type field)
- ✅ `partner_signups`
- ✅ `partner_payments`
- ✅ `partner_webdev_services`
- ✅ `partnership_activations`
- ✅ `stripe_customers`
- ✅ `stripe_webhook_events`

### Verify Schema Updates

```bash
# Check signups table has user_type field
npx wrangler d1 execute michiganspot-db --remote --command \
  "PRAGMA table_info(signups);"

# Should show: user_type TEXT DEFAULT 'player'
```

---

## 🧪 Pre-Launch Testing

### Test 1: Regular User Signup

**URL:** https://michiganspots.com/#signup

**Steps:**
1. ✅ Fill out form with valid email
2. ✅ Test email validation (try invalid email, see error)
3. ✅ Test disposable email detection
4. ✅ Submit form
5. ✅ Verify success message appears
6. ✅ Check email for welcome message

**Database Check:**
```bash
npx wrangler d1 execute michiganspot-db --remote --command \
  "SELECT id, email, name, city, user_type, created_at FROM signups ORDER BY created_at DESC LIMIT 5;"
```

### Test 2: Email Validation API

```bash
curl -X POST https://michiganspots.com/api/validate-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Expected Response:**
```json
{
  "email": "test@example.com",
  "isValid": true,
  "severity": "valid",
  "score": 85,
  "recommendations": ["Email format is valid"]
}
```

### Test 3: Partner Signup (Test Mode First)

**URL:** https://michiganspots.com/business-partnerships

**Steps:**
1. ✅ Select "Spot Partner" tier
2. ✅ Choose "Monthly" duration ($99)
3. ✅ Fill all business information
4. ✅ Skip add-ons for initial test
5. ✅ Click "Proceed to Secure Payment"
6. ✅ Use Stripe test card: `4242 4242 4242 4242`
7. ✅ Complete checkout
8. ✅ Verify redirect to /success page
9. ✅ Check confirmation email

**Database Checks:**
```bash
# Check partner signup created
npx wrangler d1 execute michiganspot-db --remote --command \
  "SELECT id, email, organization_name, tier, duration, status, created_at FROM partner_signups ORDER BY created_at DESC LIMIT 5;"

# Check webhook events logged
npx wrangler d1 execute michiganspot-db --remote --command \
  "SELECT id, event_type, processed, created_at FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 10;"

# Check partnership activated
npx wrangler d1 execute michiganspot-db --remote --command \
  "SELECT id, email, organization_name, partnership_tier, is_active FROM partnership_activations ORDER BY created_at DESC LIMIT 5;"
```

### Test 4: Partner Signup with Add-ons

**Steps:**
1. ✅ Select "Featured Partner" quarterly
2. ✅ Add prize package ($100 value)
3. ✅ Add web service (Landing Page - $499)
4. ✅ Verify total calculation is correct
5. ✅ Complete checkout
6. ✅ Verify all line items appear in Stripe

**Expected Total:** $699 (tier) + $100 (prize) + $499 (web) = $1,298

---

## 📊 Monitoring & Validation

### 1. Error Tracking (Sentry)

**Check:** https://sentry.io/organizations/[your-org]/projects/

**Monitor:**
- Server-side errors in signup flows
- Webhook processing failures
- Email sending issues
- Stripe API errors

### 2. Webhook Event Logs

```bash
# Check for failed webhook processing
npx wrangler d1 execute michiganspot-db --remote --command \
  "SELECT id, event_type, processed, processing_error, created_at FROM stripe_webhook_events WHERE processed = 0 OR processing_error IS NOT NULL ORDER BY created_at DESC LIMIT 10;"
```

### 3. Signup Analytics

```bash
# Regular signups by user type
npx wrangler d1 execute michiganspot-db --remote --command \
  "SELECT user_type, COUNT(*) as count FROM signups GROUP BY user_type;"

# Partner signups by tier and status
npx wrangler d1 execute michiganspot-db --remote --command \
  "SELECT tier, status, COUNT(*) as count FROM partner_signups GROUP BY tier, status;"

# Active partnerships
npx wrangler d1 execute michiganspot-db --remote --command \
  "SELECT COUNT(*) as active_partnerships FROM partnership_activations WHERE is_active = 1;"
```

---

## 🚀 Deployment Steps

### Step 1: Build & Deploy

```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

### Step 2: Configure Environment Variables

1. Go to Cloudflare Dashboard
2. Navigate to: Workers & Pages > michiganspot > Settings > Environment Variables
3. Add all production secrets listed above
4. Verify `STRIPE_SECRET_KEY` uses **live mode** key (starts with `sk_live_`)

### Step 3: Set Up Stripe Webhook

1. Create webhook endpoint in Stripe Dashboard (see instructions above)
2. Add `STRIPE_WEBHOOK_SECRET` to Cloudflare
3. Test webhook with Stripe CLI

### Step 4: Test End-to-End

1. Test regular signup with your own email
2. Test partner signup in **test mode** first
3. Verify all webhooks are being received
4. Check database for proper data storage
5. Confirm emails are being sent

### Step 5: Switch to Live Mode

1. ✅ All test mode flows working
2. ✅ Update to live Stripe keys
3. ✅ Test with real credit card (use your own)
4. ✅ Verify payment shows in Stripe Dashboard
5. ✅ Monitor for 24 hours

---

## 🔍 Post-Launch Monitoring (First 48 Hours)

### Hourly Checks:
- [ ] Check Sentry for errors
- [ ] Review signup count in database
- [ ] Verify webhook events are processing
- [ ] Monitor email delivery

### Daily Checks:
- [ ] Review all signups and filter for spam
- [ ] Check partner signup conversion rate
- [ ] Verify no failed payments
- [ ] Review customer support emails

### Weekly Checks:
- [ ] Analyze signup trends
- [ ] Review email bounce rates
- [ ] Check for disposable email abuse
- [ ] Optimize based on user feedback

---

## 🐛 Common Issues & Solutions

### Issue: Email validation not working

**Symptom:** All emails show as valid
**Solution:** Check `EVALIDATE_API_KEY` is set correctly
**Fallback:** System uses basic regex if API key missing (acceptable)

### Issue: Stripe webhook not receiving events

**Symptom:** Partnerships stay in "pending" status
**Solution:**
1. Verify webhook URL is correct
2. Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
3. Review webhook logs in Stripe Dashboard
4. Check firewall/security settings

### Issue: Partner confirmation emails not sending

**Symptom:** Successful payment but no email
**Solution:**
1. Check `SMTP_PASSWORD` is configured
2. Review email sending logs in Cloudflare
3. Check spam folder
4. Verify email function error handling

### Issue: Duplicate signups allowed

**Symptom:** Same email creates multiple signups
**Solution:**
1. Verify UNIQUE constraint on email field
2. Check database migration ran successfully
3. Review signup API duplicate checking logic

---

## 📋 Final Pre-Launch Checklist

- [ ] All environment secrets configured
- [ ] Stripe webhook endpoint created and tested
- [ ] Database schema verified in production
- [ ] Regular signup tested successfully
- [ ] Partner signup tested with test card
- [ ] Email validation working
- [ ] Welcome emails being sent
- [ ] Confirmation emails being sent
- [ ] Sentry error tracking configured
- [ ] All Stripe price IDs verified
- [ ] Success page loads correctly
- [ ] Mobile responsive testing completed
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Performance testing (Lighthouse score)
- [ ] Security headers configured
- [ ] CORS settings verified

---

## ✅ Launch Approval

**Checklist Completed By:** _________________
**Date:** _________________
**Approved By:** _________________
**Launch Date:** _________________

---

## 📞 Support Contacts

- **Developer:** Claude Code
- **Email Support:** partnerships@michiganspots.com
- **Stripe Support:** https://support.stripe.com
- **Cloudflare Support:** https://support.cloudflare.com

---

**Notes:**
- Keep this checklist updated as new features are added
- Document any production issues and solutions
- Review and update pricing tiers quarterly
- Monitor conversion rates and optimize signup flows
