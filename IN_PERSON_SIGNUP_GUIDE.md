# In-Person Partner Signup Guide

## Overview

The in-person signup system allows you to sign up Michigan Spots partners using an iPad or tablet with digital signature capability. This is perfect for trade shows, community events, or in-person sales.

## Access the Signup Page

**URL:** `https://michiganspots.com/in-person-signup`

For local testing: `http://localhost:4321/in-person-signup`

## How It Works

### Step 1: Select Partnership Tier
- Show the potential partner the tier options
- Select the appropriate tier (Spot Partner, Featured Partner, etc.)
- Choose billing duration (Monthly, Quarterly, or Yearly)
- The price is calculated automatically

### Step 2: Collect Business Information
Fill in the partner's information:
- Contact Name *
- Title *
- Email *
- Phone *
- Business Name *
- City *
- Business Address *

### Step 3: Review Agreement & Capture Signature
1. **View Agreement** - Click to display the partnership agreement
2. **Read Confirmation** - Partner must check "I have read and agree to the Partnership Agreement"
3. **Digital Signature** - Partner signs directly on the iPad using finger or stylus
   - They can clear and re-sign if needed
   - Signature is captured as a PNG image

### Step 4: Submit Agreement
- Click "Complete Agreement & Proceed to Payment"
- System generates a unique **Confirmation ID** (e.g., `MS-ABC123-XYZ789`)
- Shows the amount to collect

### Step 5: Collect Payment
- Use your PayPal reader to collect the payment amount shown
- Record the PayPal transaction ID for your records

## What Gets Stored

The system stores:
- All partner contact and business information
- Digital signature (saved to R2 storage)
- Confirmation ID for reference
- Payment status (marked as "pending" until you mark it paid)
- Timestamp and IP address

## iPad Optimization Features

The page is specifically optimized for iPad/tablet use:
- **Large touch targets** - All buttons and inputs are sized for touch
- **Smooth signature capture** - Optimized canvas for finger/stylus signing
- **Clear visual feedback** - Shows when signature is captured
- **Prevents zoom** - Input fields won't zoom on focus
- **Scrollable contract** - Easy to read full agreement on tablet

## After Signup

### Viewing Signups

You can query the database to see all in-person signups:

```bash
npx wrangler d1 execute michiganspot-db --remote --command "SELECT confirmation_id, organization_name, email, tier, total_paid, payment_status, created_at FROM in_person_signups ORDER BY created_at DESC LIMIT 20"
```

### Marking Payment as Collected

Once you collect payment via PayPal:

```sql
UPDATE in_person_signups
SET
  payment_status = 'completed',
  payment_collected_at = CURRENT_TIMESTAMP,
  payment_collected_by = 'Your Name',
  payment_transaction_id = 'PAYPAL_TRANSACTION_ID',
  status = 'active'
WHERE confirmation_id = 'MS-ABC123-XYZ789';
```

### Activating the Partnership

After payment is confirmed, create a partnership activation record to grant the partner access to their benefits.

## Best Practices

### Before an Event
1. Charge your iPad fully
2. Test the page to ensure it loads correctly
3. Have your PayPal reader ready and charged
4. Bring a backup power bank
5. Test the cellular/wifi connection

### During Signup
1. Let the partner read the agreement themselves
2. Explain the tier benefits clearly
3. Ensure signature is clear (not too light)
4. Write down the Confirmation ID immediately
5. Collect payment right away
6. Provide a receipt from PayPal reader

### After the Event
1. Mark all payments as collected in the database
2. Activate partnerships
3. Send welcome emails to new partners
4. Follow up within 2-3 business days to start challenge creation

## Troubleshooting

### Signature not capturing
- Make sure the partner is signing within the white box
- Try using a stylus instead of finger
- Clear and try again

### Form won't submit
- Check that all required fields are filled
- Ensure the agreement checkbox is checked
- Verify signature has been captured (look for green checkmark)

### Payment amount seems wrong
- Double-check the tier and duration selected
- Verify the pricing matches your current rate card
- If needed, manually adjust in the database after submission

## Security Notes

- Signatures are stored securely in Cloudflare R2
- All data is encrypted in transit (HTTPS)
- IP address is logged for audit purposes
- Only authorized staff should have access to the iPad
- Use a PIN/passcode to lock the iPad when not in use

## Support

If you encounter issues:
1. Check that you're connected to the internet
2. Try refreshing the page
3. Clear browser cache if needed
4. Contact development team if problems persist

---

**Questions?** Contact your development team or check the main Michigan Spots documentation.
