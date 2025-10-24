# Michigan Spots - Dual Payment System Architecture

## 🌐 Two Independent Payment Flows

Michigan Spots uses **TWO SEPARATE PAYMENT SYSTEMS** that do not interfere with each other:

---

## 1. 💳 ONLINE WEB SIGNUPS → Stripe

**Who Uses This:**
- Website visitors
- Online customers
- Self-service signups

**Access Points:**
- https://michiganspots.com/business-partnerships
- https://michiganspots.com/chamber-partnerships
- https://michiganspots.com/partnerships

**Payment Method:** Stripe Checkout
- Credit/debit cards online
- Stripe handles payment processing
- Automatic receipt via email
- Subscription management via Stripe

**Components:**
- `PartnerSignUpForm.tsx` - Online signup form
- Stripe API integration
- Stripe webhook handlers
- Email notifications

**Database Tables:**
- `partner_payments` - Stripe payment tracking
- `stripe_customers` - Customer records
- `partnership_activations` - Active partnerships

**Status:** ✅ **FULLY OPERATIONAL** (unchanged)

---

## 2. 📱 IN-PERSON SALES → PayPal Zettle

**Who Uses This:**
- Outside sales team only
- Trade show booths
- In-person events
- Door-to-door sales

**Access Point:**
- https://michiganspots.com/in-person-signup (iPad/tablet optimized)

**Payment Method:** PayPal Zettle Card Reader
- In-person card swipe/tap/chip
- PayPal Zettle mobile reader
- Immediate receipt printed/emailed
- Manual payment collection

**Components:**
- `InPersonPartnerSignup.tsx` - iPad signup form
- `SignaturePad.tsx` - Digital signature capture
- PayPal Zettle API (verification only)
- Contract display system

**Database Tables:**
- `in_person_signups` - Separate table for in-person sales
- Signatures stored in R2
- Links to `partnership_activations` after payment confirmed

**Status:** ✅ **FULLY OPERATIONAL** (new)

---

## 🔄 Data Flow Comparison

### Online Stripe Flow
```
1. Customer visits website
2. Fills out PartnerSignUpForm
3. Redirected to Stripe Checkout
4. Stripe processes payment
5. Webhook confirms payment
6. Partnership activated automatically
7. Welcome email sent
```

### In-Person PayPal Zettle Flow
```
1. Sales rep opens iPad to /in-person-signup
2. Customer selects tier
3. Customer fills in information
4. Customer reviews and signs contract on iPad
5. System generates Confirmation ID
6. Sales rep processes payment via PayPal Zettle reader
7. Sales rep records PayPal Transaction ID
8. Admin marks payment as collected
9. Partnership activated manually
10. Welcome email sent
```

---

## 📊 Database Separation

### Stripe Online Signups
- Table: `partner_payments`
- Payment Source: `stripe_payment_intent_id` or `stripe_subscription_id`
- Status: Automated via webhooks
- Receipt: Stripe email

### PayPal Zettle In-Person Signups
- Table: `in_person_signups`
- Payment Source: `payment_transaction_id` (PayPal Zettle UUID)
- Status: Manual confirmation by admin
- Receipt: PayPal Zettle printed/emailed

**Both eventually create:**
- `partnership_activations` record (links either source)

---

## 🔐 API Endpoints by System

### Stripe System (Online)
- `POST /api/stripe-checkout` - Create Stripe session
- `POST /api/stripe-webhook` - Handle Stripe events
- `GET /api/partner-auth/*` - Magic links for partners

### PayPal Zettle System (In-Person)
- `POST /api/in-person-signup` - Save signup + signature
- `GET /api/admin/in-person-signups` - View pending payments
- `POST /api/admin/in-person-signups` - Mark as paid
- `GET /api/admin/verify-payment` - Verify Zettle transaction

**No Overlap** - Different endpoints, different workflows

---

## 🛡️ Security & Isolation

### Stripe (Online)
- Stripe handles PCI compliance
- No card data touches our servers
- Stripe Checkout hosted pages
- Webhook signature verification

### PayPal Zettle (In-Person)
- PayPal Zettle PCI compliant
- No card data stored in our system
- Signatures encrypted in transit (HTTPS)
- Signatures stored in R2 with access controls

**Both systems:**
- Use HTTPS only
- Environment variables for API keys
- Cloudflare Pages secrets for production
- No secrets in code

---

## 💰 Revenue Tracking

### Online (Stripe)
Query Stripe dashboard or:
```sql
SELECT SUM(amount) FROM partner_payments WHERE payment_status = 'succeeded';
```

### In-Person (PayPal Zettle)
Query database:
```sql
SELECT SUM(total_paid) FROM in_person_signups WHERE payment_status = 'completed';
```

### Combined Total
Both systems feed into `partnership_activations` for unified partner management

---

## 📋 For Admins

### Online Stripe Signups
- **View:** Stripe Dashboard (https://dashboard.stripe.com)
- **Action Needed:** None (automated)
- **Webhook:** Auto-activates partnerships

### In-Person Signups
- **View:** `/api/admin/in-person-signups` or database query
- **Action Needed:** Mark payment as collected after verifying PayPal transaction
- **Manual:** Admin confirms payment, partnership activated

---

## ✅ System Independence Confirmed

- ✅ Separate URLs (different pages)
- ✅ Separate forms (different components)
- ✅ Separate APIs (no shared endpoints)
- ✅ Separate databases tables (no conflicts)
- ✅ Separate payment processors (Stripe vs PayPal)
- ✅ Both systems fully operational
- ✅ Website visitors unaffected by in-person system
- ✅ Sales team has dedicated tool

---

## 🎯 Which System Should I Use?

**Use Stripe (Online):**
- Customer is on the website
- Self-service signup
- Remote/online customer
- Wants to pay immediately online
- Subscription renewals

**Use PayPal Zettle (In-Person):**
- Sales rep meeting customer in person
- Trade show / event / door-to-door
- Customer wants to sign contract physically (digitally)
- Immediate face-to-face sale
- Prefers card swipe vs online checkout

---

**Both systems are production-ready and do not interfere with each other.**
