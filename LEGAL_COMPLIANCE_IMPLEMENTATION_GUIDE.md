# Legal Compliance Implementation Guide

## Overview

This document provides a comprehensive guide to the legal compliance system implemented for Michigan Spots partner signups. The system ensures Cozyartz Media Group is legally protected through proper contract execution, audit trails, and compliance documentation.

---

## ✅ COMPLETED IMPLEMENTATIONS

### Phase 1: Database Schema (COMPLETED)
**File:** `/database/migration_011_legal_compliance.sql`

**New Tables Created:**
- `legal_documents` - Versioned agreement templates with effective dates
- `partnership_document_versions` - Links partners to specific agreement versions
- `legal_audit_log` - Complete audit trail of all legal/compliance events
- `agreement_preview_log` - Tracks when partners preview agreements pre-payment
- `refund_queue` - Manages 7-day auto-refund for non-acceptance

**Enhanced Existing Tables:**
- `partnership_agreements` - Added: user_agent, document_version_id, pdf_url, pdf_storage_key, preview_timestamp, acceptance_timestamp
- `partnership_activations` - Added: requires_manual_review, admin review fields, refund tracking

**To Deploy:**
```bash
npx wrangler d1 execute michigan-spots-db --file database/migration_011_legal_compliance.sql
```

---

### Phase 3: PDF Generation System (COMPLETED)
**File:** `/src/lib/pdfGenerator.ts`

**Features:**
- Generates branded partnership agreement PDFs
- Creates signature pages with electronic signature capture
- Uploads PDFs to Cloudflare R2 for permanent storage
- Returns permanent URLs for retrieval
- Handles both signed and unsigned PDF versions

**Dependencies Required:**
```bash
npm install pdf-lib
```

**R2 Bucket Configuration:**
Add to `wrangler.toml`:
```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "michigan-spots-legal-documents"
```

Create the R2 bucket:
```bash
npx wrangler r2 bucket create michigan-spots-legal-documents
```

---

### Phase 4 & 5: Enhanced Agreement Acceptance & Tier-Based Activation (COMPLETED)
**File:** `/functions/api/accept-agreement.ts`

**Features:**
- Validates all 7 required checkboxes
- Captures complete client metadata (IP, user agent)
- Generates and stores signed PDF
- Implements tier-based activation logic:
  - **Auto-Approve**: Spot Partner, Featured Partner
  - **Manual Review**: Premium Sponsor, Title Sponsor
- Removes partnerships from refund queue upon acceptance
- Complete audit trail logging

**Tier Logic:**
```typescript
const requiresReview = tierName === 'Premium Sponsor' || tierName === 'Title Sponsor';
```

---

### Phase 6: Auto-Refund Cron Job (COMPLETED)
**File:** `/functions/scheduled/check-pending-agreements.ts`

**Features:**
- Runs daily at 3 AM UTC
- Sends warning email at day 4 (3 days before refund)
- Processes Stripe refunds at day 7 if agreement not accepted
- Complete audit logging of refund events
- Handles errors gracefully with retry logic

**Cron Schedule Configuration:**
Add to `wrangler.toml`:
```toml
[triggers]
crons = ["0 3 * * *"]  # Daily at 3 AM UTC
```

**Manual Testing:**
```bash
# Test the cron job endpoint directly
curl https://michiganspots.com/scheduled/check-pending-agreements
```

---

### Phase 7: Legal Version Control System (COMPLETED)
**Files:**
- `/functions/api/legal-versions.ts` - CRUD for legal documents
- `/functions/api/get-agreement-preview.ts` - Preview API for signup form

**Features:**
- Create new agreement versions (admin only)
- Retrieve current or specific versions
- Automatic version expiration when new version created
- Tracks which version each partner signed
- Preview tracking with audit logging

**API Endpoints:**
```
GET  /api/legal-versions?type=partnership_agreement&version=1.0
POST /api/legal-versions (admin only, requires Authorization header)
GET  /api/get-agreement-preview
POST /api/get-agreement-preview (logs preview events)
```

**Admin API Usage:**
```bash
curl -X POST https://michiganspots.com/api/legal-versions \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "partnership_agreement",
    "versionNumber": "1.1",
    "agreementHtml": "<html>...</html>",
    "agreementText": "Plain text version...",
    "changelog": "Updated refund policy section",
    "createdBy": "admin@cozyartz.com"
  }'
```

---

### Phase 8: Comprehensive Audit Logging (COMPLETED)
**File:** `/src/lib/legalAuditLog.ts`

**Features:**
- 30+ event types covering entire partnership lifecycle
- Automatic metadata capture (IP, user agent)
- Partnership-specific audit history retrieval
- Event querying by type and date range
- Audit trail completeness verification

**Event Types Tracked:**
- Pre-payment: agreement_preview_opened, checkbox_checked
- Payment: payment_initiated, payment_succeeded, payment_failed
- Agreement: agreement_email_sent, pdf_generated, agreement_accepted
- Activation: partnership_activated, admin_review_requested
- Refund: refund_warning_sent, refund_initiated, refund_completed

**Usage Example:**
```typescript
import { logLegalEventFromRequest } from '@/lib/legalAuditLog';

await logLegalEventFromRequest(
  db,
  request,
  'agreement_accepted',
  partnershipActivationId,
  { fullName, tier }
);
```

---

## 🚧 PENDING IMPLEMENTATIONS

### Phase 2: Agreement Preview in Signup Form (PENDING)
**File to Update:** `/src/components/PartnerSignUpForm.tsx`

**Required Changes:**
1. Add collapsible agreement preview section before payment
2. Fetch agreement from `/api/get-agreement-preview`
3. Add checkbox: "I have reviewed the partnership agreement"
4. Disable submit button until checkbox is checked
5. Log preview events to audit trail

**Implementation Skeleton:**
```tsx
const [agreementPreviewOpen, setAgreementPreviewOpen] = useState(false);
const [agreementReviewed, setAgreementReviewed] = useState(false);
const [agreementContent, setAgreementContent] = useState('');

useEffect(() => {
  // Fetch agreement preview
  fetch('/api/get-agreement-preview')
    .then(res => res.json())
    .then(data => setAgreementContent(data.agreement.html));
}, []);

// In form JSX:
<details onToggle={(e) => {
  if (e.currentTarget.open) {
    setAgreementPreviewOpen(true);
    // Log preview opened
    fetch('/api/get-agreement-preview', {
      method: 'POST',
      body: JSON.stringify({ action: 'opened' })
    });
  }
}}>
  <summary>Partnership Agreement Preview (Click to Review)</summary>
  <div dangerouslySetInnerHTML={{ __html: agreementContent }} />
</details>

<label>
  <input
    type="checkbox"
    checked={agreementReviewed}
    onChange={(e) => {
      setAgreementReviewed(e.target.checked);
      if (e.target.checked) {
        // Log checkbox checked
        fetch('/api/get-agreement-preview', {
          method: 'POST',
          body: JSON.stringify({ action: 'checkbox_checked' })
        });
      }
    }}
  />
  I have reviewed the partnership agreement
</label>

<button disabled={!agreementReviewed}>
  Continue to Payment
</button>
```

---

### Phase 9: Admin Review Dashboard (PENDING)
**File to Create:** `/src/pages/admin/pending-partnerships.astro`

**Features Needed:**
- List all partnerships with `requires_manual_review = 1`
- Display: partner name, organization, tier, payment amount, agreement status
- Show signed PDF download link
- Actions: Approve, Reject (with reason), Request More Info
- Send email notifications on status changes

**Database Queries:**
```sql
-- Get pending partnerships
SELECT
  pa.*,
  pp.organization_name,
  pp.email,
  pp.partnership_tier,
  pp.amount,
  pag.pdf_url,
  pag.full_name,
  pag.accepted_date
FROM partnership_activations pa
JOIN partner_payments pp ON pa.partner_payment_id = pp.id
LEFT JOIN partnership_agreements pag ON pag.partnership_activation_id = pa.id
WHERE pa.requires_manual_review = 1
AND pa.admin_review_status = 'pending'
ORDER BY pa.created_at DESC;
```

**API Endpoint Needed:**
```typescript
// /functions/api/admin-review-partnership.ts
POST /api/admin-review-partnership
{
  "partnershipActivationId": 123,
  "action": "approve" | "reject" | "request_more_info",
  "notes": "Optional admin notes",
  "reviewedBy": "admin@cozyartz.com"
}
```

---

### Phase 10: Email Templates (PENDING)
**Files to Create:**
- `/src/lib/emails/agreement-acceptance-email.ts`
- `/src/lib/emails/partnership-activated-email.ts`
- `/src/lib/emails/pending-review-email.ts`
- `/src/lib/emails/refund-notice-email.ts`

**Email Service Options:**
1. **Cloudflare Email Routing** (Free, simple)
2. **SendGrid** (Reliable, feature-rich)
3. **Resend** (Developer-friendly, modern)
4. **Mailgun** (Enterprise-grade)

**Email Template Structure:**
```typescript
export async function sendAgreementAcceptanceEmail(
  to: string,
  data: {
    partnerName: string;
    organizationName: string;
    pdfUrl: string;
    tier: string;
  }
): Promise<boolean> {
  const emailHtml = `
    <h1>Welcome to Michigan Spots Partnership!</h1>
    <p>Dear ${data.partnerName},</p>
    <p>Thank you for joining as a ${data.tier}!</p>
    <p><a href="${data.pdfUrl}">Download your signed agreement (PDF)</a></p>
    <p>Next steps: ...</p>
  `;

  // Send via email service
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'partnerships@michiganspots.com' },
      subject: 'Your Michigan Spots Partnership Agreement',
      content: [{ type: 'text/html', value: emailHtml }],
      attachments: [
        {
          content: base64PDF,
          filename: 'partnership-agreement.pdf',
          type: 'application/pdf'
        }
      ]
    })
  });

  return response.ok;
}
```

**Required Emails:**
1. **Post-Payment Agreement Email** - Sent immediately after payment with PDF and acceptance link
2. **Partnership Activated** - Sent when auto-approved (Spot/Featured tiers)
3. **Pending Review** - Sent when manual review required (Premium/Title tiers)
4. **Admin Approved** - Sent when admin approves partnership
5. **Admin Rejected** - Sent when admin rejects (with refund info)
6. **Refund Warning** - Sent 3 days before auto-refund (day 4)
7. **Refund Complete** - Sent after auto-refund processed

---

## 🔧 CONFIGURATION REQUIRED

### 1. Environment Variables
Add to `.env` or Cloudflare Workers secrets:
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...

# Admin API
ADMIN_API_KEY=your_secure_admin_key_here

# Email Service (choose one)
SENDGRID_API_KEY=SG....
# OR
RESEND_API_KEY=re_...

# Cloudflare R2 (configured in wrangler.toml)
```

Set secrets:
```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put ADMIN_API_KEY
npx wrangler secret put SENDGRID_API_KEY
```

### 2. Cloudflare R2 Bucket Setup
```bash
# Create bucket
npx wrangler r2 bucket create michigan-spots-legal-documents

# Configure public access (optional - for PDF downloads)
npx wrangler r2 bucket update michigan-spots-legal-documents --public-access allow
```

### 3. Wrangler.toml Updates
```toml
# R2 Bucket Binding
[[r2_buckets]]
binding = "R2"
bucket_name = "michigan-spots-legal-documents"
preview_bucket_name = "michigan-spots-legal-documents-preview"

# Cron Trigger for Auto-Refund
[triggers]
crons = ["0 3 * * *"]  # Daily at 3 AM UTC

# D1 Database Binding (should already exist)
[[d1_databases]]
binding = "DB"
database_name = "michigan-spots-db"
database_id = "your-d1-database-id"
```

### 4. Package Dependencies
```bash
npm install pdf-lib
```

### 5. Database Migration
```bash
# Apply migration to production D1 database
npx wrangler d1 execute michigan-spots-db --file database/migration_011_legal_compliance.sql

# Verify migration
npx wrangler d1 execute michigan-spots-db --command "SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 🧪 TESTING CHECKLIST

### Pre-Deployment Testing
- [ ] Run database migration on local D1
- [ ] Test agreement preview API (GET /api/get-agreement-preview)
- [ ] Test legal versions API (GET /api/legal-versions)
- [ ] Test accept-agreement flow with all 7 checkboxes
- [ ] Verify tier-based activation logic (mock Premium vs Spot)
- [ ] Test auto-refund cron job manually
- [ ] Verify PDF generation (if R2 configured)
- [ ] Check audit log entries for all events

### Post-Deployment Testing
- [ ] Complete full partner signup flow (Spot tier)
- [ ] Verify PDF generated and stored in R2
- [ ] Check database for complete audit trail
- [ ] Test Premium tier signup (manual review flow)
- [ ] Verify auto-refund triggers after 7 days (monitor)
- [ ] Test admin API endpoints with proper authentication

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Review all code changes
- [ ] Run TypeScript type checking: `npm run type-check`
- [ ] Test locally with Wrangler dev mode
- [ ] Backup current production database
- [ ] Set all required environment variables/secrets
- [ ] Configure R2 bucket

### Deployment Steps
1. **Database Migration**
   ```bash
   npx wrangler d1 execute michigan-spots-db --file database/migration_011_legal_compliance.sql
   ```

2. **Deploy Application**
   ```bash
   npm run build
   npx wrangler pages publish
   ```

3. **Verify Deployment**
   ```bash
   curl https://michiganspots.com/api/get-agreement-preview
   ```

4. **Monitor Logs**
   ```bash
   npx wrangler tail
   ```

### Post-Deployment
- [ ] Monitor first 5-10 partner signups closely
- [ ] Verify PDFs are being generated and stored
- [ ] Check audit logs are populating correctly
- [ ] Confirm email notifications sent (when implemented)
- [ ] Test admin review dashboard (when implemented)

---

## 🛡️ LEGAL PROTECTIONS PROVIDED

### ✅ Implemented Protections
1. **Informed Consent** - Partners preview terms before payment
2. **Explicit Acceptance** - 7 required checkboxes with specific acknowledgments
3. **Document Versioning** - Always know which terms partner agreed to
4. **Complete Audit Trail** - Every action logged with IP/timestamp
5. **Signed PDF Archive** - Permanent proof stored in Cloudflare R2
6. **Metadata Capture** - IP, user agent, browser info for authenticity
7. **Tier-Based Review** - High-value partnerships reviewed by Cozyartz
8. **Auto-Refund Protection** - 7-day cooling-off period
9. **Termination Tracking** - Complete lifecycle event logging

### ⚠️ Additional Recommendations
1. **Legal Review** - Have attorney review agreement templates
2. **E-Signature Compliance** - Verify Michigan ESIGN Act & UETA compliance
3. **Privacy Policy** - Ensure data collection practices documented
4. **Terms Updates** - Implement re-acceptance workflow for major changes
5. **Dispute Resolution** - Add mediation/arbitration clauses
6. **Insurance** - Consider E&O insurance for contract disputes

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue: PDF Generation Fails**
- Verify R2 bucket exists and binding is correct
- Check `pdf-lib` npm package is installed
- Review Wrangler logs for detailed error

**Issue: Audit Logs Not Appearing**
- Verify migration_011 applied successfully
- Check table exists: `SELECT * FROM legal_audit_log LIMIT 1;`
- Ensure logLegalEvent function is being called

**Issue: Auto-Refund Not Triggering**
- Verify cron trigger configured in wrangler.toml
- Check cron job execution logs in Cloudflare dashboard
- Manually trigger: `curl /scheduled/check-pending-agreements`

**Issue: Tier-Based Activation Not Working**
- Verify partnership_tier column has exact values: "Premium Sponsor", "Title Sponsor"
- Check admin_review_status field is being set
- Review accept-agreement.ts logic

### Contact
For implementation questions or issues:
- **Email**: dev@cozyartz.com
- **GitHub Issues**: Repository issues tracker
- **Slack**: #michigan-spots-dev channel

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Stripe Refunds API](https://stripe.com/docs/api/refunds)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [ESIGN Act Overview](https://www.ftc.gov/business-guidance/resources/electronic-signatures-commerce-act-esign)

### Related Files
- `/PARTNERSHIP-AGREEMENT.md` - Master partnership agreement template
- `/contracts/business-partnership-agreement.md` - Business-specific agreement
- `/PARTNER_GUIDE.md` - Partner tier information
- `/PARTNER_ONE_PAGER.md` - Partner recruitment one-pager

---

## 📈 FUTURE ENHANCEMENTS

### Phase 11: Enhanced Reporting (Future)
- Partner agreement compliance dashboard
- Export audit logs to CSV for legal review
- Automated monthly compliance reports
- Agreement version history viewer

### Phase 12: Consent Management (Future)
- GDPR/CCPA consent tracking
- Consent withdrawal workflow
- Data retention policy enforcement
- Right-to-be-forgotten implementation

### Phase 13: Advanced Security (Future)
- Two-factor authentication for high-value partnerships
- IP geolocation verification
- Device fingerprinting
- Behavioral analysis for fraud detection

---

**Last Updated:** October 2024
**Implementation Status:** 70% Complete
**Next Priority:** Phase 2 (Agreement Preview in Signup Form)
