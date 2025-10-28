-- Fix admin_signups_dashboard view to use correct column name
-- The view was referencing pa.payment_id but the column is actually partner_payment_id

DROP VIEW IF EXISTS admin_signups_dashboard;

CREATE VIEW admin_signups_dashboard AS
SELECT
  'waitlist' as signup_type,
  email,
  NULL as organization_name,
  NULL as contact_name,
  NULL as partnership_type,
  NULL as partnership_tier,
  NULL as amount_paid,
  created_at,
  NULL as agreement_accepted
FROM signups
UNION ALL
SELECT
  'partner' as signup_type,
  sc.email,
  sc.organization_name,
  sc.name as contact_name,
  pa.partnership_type,
  pa.partnership_tier,
  pp.amount as amount_paid,
  pa.created_at,
  pa.agreement_accepted
FROM partnership_activations pa
LEFT JOIN stripe_customers sc ON pa.stripe_customer_id = sc.stripe_customer_id
LEFT JOIN partner_payments pp ON pa.partner_payment_id = pp.id
ORDER BY created_at DESC;
