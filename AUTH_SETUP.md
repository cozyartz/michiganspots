# Multi-Provider Authentication Setup Guide

This guide will help you set up all three authentication methods for Michigan Spots:
1. **GitHub OAuth** - Login with GitHub account
2. **Google OAuth** - Login with Google account
3. **Magic Links** - Passwordless email login via PurelyMail

## Overview

The authentication system provides:
- **Three login options** for maximum flexibility
- **Session-based authentication** with secure HTTP-only cookies
- **Role-based access control** (user, partner, super_admin)
- **Cloudflare D1** database for user and session storage
- **PurelyMail SMTP** for magic link emails (no additional cost!)

---

## Step 1: Create GitHub OAuth Application

1. Go to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Michigan Spots
   - **Homepage URL**: `https://michiganspots.com`
   - **Authorization callback URL**: `https://michiganspots.com/api/auth/github/callback`
   - For local development, also add: `http://localhost:4321/api/auth/github/callback`
4. Click "Register application"
5. **Copy the Client ID**
6. Generate a **new Client Secret** and copy it
7. **Save both** - you'll need them for environment variables

---

## Step 2: Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing) named "Michigan Spots"
3. Enable **Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 Client ID:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Name: Michigan Spots
   - Authorized redirect URIs:
     - `https://michiganspots.com/api/auth/google/callback`
     - `http://localhost:4321/api/auth/google/callback` (for local dev)
5. **Copy the Client ID** and **Client Secret**
6. **Save both** - you'll need them for environment variables

---

## Step 3: Configure PurelyMail SMTP (for Magic Links)

You already have PurelyMail! No additional service needed.

### Option A: Use Existing Email Address

Use your existing PurelyMail email (e.g., `hello@michiganspots.com`):

**If 2FA is enabled:**
1. Log into PurelyMail
2. Go to Settings > Security
3. Generate an **App Password**
4. Use this App Password instead of your real password

**If 2FA is NOT enabled:**
- Just use your regular email and password

### Option B: Create Dedicated Email (Recommended)

Create a dedicated noreply address:
1. Log into PurelyMail
2. Add email alias: `noreply@michiganspots.com`
3. Use this email for SMTP_USER
4. Use your PurelyMail password or App Password for SMTP_PASSWORD

**SMTP Settings:**
- Server: `smtp.purelymail.com`
- Port: `465` (SSL/TLS)
- Username: Full email address (e.g., `noreply@michiganspots.com`)
- Password: Your password or App Password (if 2FA enabled)

---

## Step 4: Configure Environment Variables

### For Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here

   # PurelyMail SMTP
   SMTP_USER=noreply@michiganspots.com
   SMTP_PASSWORD=your_password_or_app_password
   ```

### For Production (Cloudflare Pages)

1. Go to your Cloudflare Pages dashboard
2. Select your Michigan Spots project
3. Go to Settings > Environment Variables
4. Add the following **production** environment variables:

   ```
   GITHUB_CLIENT_ID = your_github_client_id
   GITHUB_CLIENT_SECRET = your_github_client_secret
   GOOGLE_CLIENT_ID = your_google_client_id
   GOOGLE_CLIENT_SECRET = your_google_client_secret
   SMTP_USER = noreply@michiganspots.com
   SMTP_PASSWORD = your_password_or_app_password
   PUBLIC_SITE_URL = https://michiganspots.com
   ```

---

## Step 5: Run Database Migration

The authentication system requires new database tables:

```bash
# For local development
npx wrangler d1 execute michiganspot-db --local --file database/migration_008_github_auth.sql

# For production
npx wrangler d1 execute michiganspot-db --remote --file database/migration_008_github_auth.sql
```

This creates:
- `users` table - Extended with `github_id`, `username`, `role`
- `sessions` table - Manages authentication sessions (30-day duration)
- `oauth_accounts` table - Links OAuth providers (GitHub, Google) to users
- `magic_links` table - Stores one-time magic link tokens

---

## Step 6: Configure Your Super Admin Account

The super admin is configured in `src/lib/auth.ts`:

```typescript
export const SUPER_ADMIN_GITHUB_USERNAME = 'cozart-lundin';
```

**To set yourself as super admin:**
1. Open `src/lib/auth.ts`
2. Change `SUPER_ADMIN_GITHUB_USERNAME` to your GitHub username
3. Save and deploy
4. Log in with your GitHub account
5. You'll automatically be assigned the `super_admin` role

---

## Step 7: Test Authentication

### Local Development

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:4321`

3. Click the "Login" button in the header

4. You'll see three login options:
   - **Continue with GitHub**
   - **Continue with Google**
   - **Email Magic Link**

5. Test each method

6. If you're the super admin (via GitHub), you'll see:
   - "Admin Dashboard" in your user menu
   - "Database Viewer" in your user menu
   - "Partner Dashboard" in your user menu

### Production

1. Deploy to Cloudflare Pages:
   ```bash
   npm run deploy
   ```

2. Visit your production URL

3. Click "Login" and test all three methods

4. Verify you can access the admin dashboard

---

## How Each Authentication Method Works

### GitHub OAuth Flow

1. User clicks "Continue with GitHub"
2. Redirects to GitHub for authorization
3. GitHub redirects back to `/api/auth/github/callback`
4. System fetches user data from GitHub API
5. Creates/updates user in database
6. Creates 30-day session
7. Redirects to dashboard (if admin) or home

### Google OAuth Flow

1. User clicks "Continue with Google"
2. Redirects to Google for authorization
3. Google redirects back to `/api/auth/google/callback`
4. System fetches user data from Google API
5. Links to existing user by email (if exists) or creates new user
6. Creates 30-day session
7. Redirects to appropriate dashboard

### Magic Link Flow

1. User enters email address
2. System generates secure random token (32 bytes)
3. Stores token in `magic_links` table with 15-minute expiration
4. Sends email via PurelyMail SMTP with magic link
5. User clicks link in email
6. System validates token (not expired, not used, matches user)
7. Marks token as used
8. Creates 30-day session
9. Redirects to appropriate dashboard

**Magic Link Security:**
- Tokens are cryptographically random (32 bytes)
- 15-minute expiration
- Single-use only (marked as used after first click)
- Stored in database with user association
- Secure HTTPS-only URLs

---

## Protected Routes

Protected pages check authentication before rendering:

- `/admin/dashboard` - Requires `super_admin` role
- `/admin/database` - Requires `super_admin` role
- `/partner/dashboard` - Requires `partner` or `super_admin` role

If not authenticated, users are redirected to `/login`
If not authorized (wrong role), users are redirected to home with error

---

## Session Management

- **Duration**: 30 days
- **Storage**: Cloudflare D1 database
- **Cookie**: HttpOnly, Secure, SameSite=Lax
- **Validation**: Checked on every protected page load
- **Logout**: Deletes session from database and clears cookie

---

## User Roles

### user (default)
- Basic access to public features
- No dashboard access
- Can upgrade to partner after partnership approval

### partner
- Access to partner dashboard
- View partnership analytics
- Manage partnership details
- Can login via any method

### super_admin
- Full access to all dashboards
- Database viewer access
- User management capabilities
- Platform oversight
- Only assignable via `SUPER_ADMIN_GITHUB_USERNAME` in code

---

## Troubleshooting

### "OAuth not configured" error
- Verify OAuth credentials are in Cloudflare environment variables
- Check credential names match exactly (case-sensitive)
- Ensure secrets are not accidentally quoted

### "Email service not configured" error
- Verify SMTP_USER and SMTP_PASSWORD are set
- Check PurelyMail credentials are correct
- Test SMTP connection with nodemailer test script

### Magic link not arriving
- Check spam/junk folder
- Verify email address exists in database with user
- Check PurelyMail sending logs
- Verify SMTP credentials are correct
- Ensure rate limit not exceeded (3,000/day)

### "Invalid OAuth state" error
- Clear cookies and try again
- Verify callback URL matches OAuth app settings exactly
- Check PUBLIC_SITE_URL environment variable is correct

### Can't access admin dashboard
- Verify your GitHub username in `src/lib/auth.ts`
- Log in via GitHub OAuth (not Google or magic link)
- Check user role in database:
  ```bash
  npx wrangler d1 execute michiganspot-db --command "SELECT * FROM users WHERE username = 'your-username'"
  ```

### Session expires immediately
- Check system time is correct
- Verify session cookie settings
- Ensure `expires_at` is stored as Unix timestamp (seconds, not milliseconds)

### Magic link "already used" error
- Request a new magic link
- Each link can only be used once for security

### Magic link "expired" error
- Links expire after 15 minutes
- Request a new magic link

---

## Email Template Customization

To customize the magic link email, edit `/src/lib/email.ts`:

```typescript
export async function sendMagicLinkEmail(
  transporter: Transporter,
  data: MagicLinkEmailData
): Promise<boolean>
```

The email includes:
- Michigan Spots branding
- Secure login button
- 15-minute expiration notice
- Security warnings
- Plain text fallback

---

## Security Best Practices

✅ **DO:**
- Keep all OAuth secrets secure (never commit to git)
- Use environment variables for all credentials
- Regularly rotate OAuth secrets
- Use App Passwords for PurelyMail if 2FA enabled
- Monitor failed login attempts
- Keep session duration reasonable (30 days max)
- Use HTTPS in production
- Review magic link usage patterns

❌ **DON'T:**
- Commit `.env` file to version control
- Share OAuth credentials
- Disable HTTPS in production
- Allow unlimited session duration
- Expose user email addresses publicly
- Reuse magic link tokens
- Extend magic link expiration beyond 15 minutes

---

## Rate Limits

### PurelyMail
- **Daily limit**: 3,000 emails
- **Burst limit**: 300 at once
- Contact support if you need higher limits

### GitHub OAuth
- **Rate limit**: 5,000 requests/hour (per authenticated app)
- Unlikely to hit this with normal usage

### Google OAuth
- **Default quota**: 10,000 requests/day
- Can request increase if needed

---

## Cost Breakdown

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| PurelyMail SMTP | $0 | Already included in your plan |
| GitHub OAuth | $0 | Free |
| Google OAuth | $0 | Free |
| **Total** | **$0** | No additional auth costs! |

Compare to:
- Auth0: $240/month (Essentials)
- Firebase Auth: Free tier, then $0.0055/verification
- Resend: $20/month for 50k emails

---

## Next Steps

After setup, you can:
1. Test all three login methods
2. Create additional admin users by updating their role in database
3. Implement partner onboarding workflow with automatic role assignment
4. Add email notifications for important events
5. Set up 2FA for super admin accounts (future enhancement)
6. Monitor authentication metrics in admin dashboard
7. Customize magic link email template for branding

---

## Support

For help:
- **Technical issues**: security@cozyartz.com
- **PurelyMail SMTP**: support@purelymail.com
- **GitHub OAuth**: https://github.com/settings/developers
- **Google OAuth**: https://console.cloud.google.com/support

---

**Authentication is now live with three methods! 🎉**
- GitHub OAuth ✅
- Google OAuth ✅
- Magic Links via PurelyMail ✅
