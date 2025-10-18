# Authentication Setup Guide

This guide will help you set up GitHub OAuth authentication for Michigan Spots.

## Overview

The authentication system uses:
- **GitHub OAuth** for login (via Arctic library)
- **Session-based authentication** with secure cookies
- **Role-based access control** (user, partner, super_admin)
- **Cloudflare D1** for user and session storage

## Step 1: Create GitHub OAuth Application

1. Go to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Michigan Spots (or your preferred name)
   - **Homepage URL**: `https://michiganspots.com` (or your domain)
   - **Authorization callback URL**: `https://michiganspots.com/api/auth/github/callback`
   - For local development, also add: `http://localhost:4321/api/auth/github/callback`
4. Click "Register application"
5. **Copy the Client ID** and generate a **new Client Secret**
6. **Save both** - you'll need them for the next step

## Step 2: Configure Environment Variables

### For Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your GitHub OAuth credentials:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

### For Production (Cloudflare Pages)

1. Go to your Cloudflare Pages dashboard
2. Select your Michigan Spots project
3. Go to Settings > Environment Variables
4. Add the following **production** environment variables:
   ```
   GITHUB_CLIENT_ID = your_client_id_here
   GITHUB_CLIENT_SECRET = your_client_secret_here
   PUBLIC_SITE_URL = https://michiganspots.com
   ```

## Step 3: Run Database Migration

The authentication system requires new database tables. Run the migration:

```bash
# For local development
npx wrangler d1 execute michiganspot-db --local --file database/migration_008_github_auth.sql

# For production
npx wrangler d1 execute michiganspot-db --remote --file database/migration_008_github_auth.sql
```

This creates:
- `users` table - Stores user profiles and roles
- `sessions` table - Manages authentication sessions
- `oauth_accounts` table - Links OAuth providers to users

## Step 4: Configure Your Super Admin Account

The super admin is configured in `src/lib/auth.ts`:

```typescript
export const SUPER_ADMIN_GITHUB_USERNAME = 'cozart-lundin';
```

**To set yourself as super admin:**
1. Open `src/lib/auth.ts`
2. Change `SUPER_ADMIN_GITHUB_USERNAME` to your GitHub username
3. Save and deploy

When you first log in with your GitHub account, you'll automatically be assigned the `super_admin` role.

## Step 5: Test Authentication

### Local Development

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:4321`

3. Click the "Login" button in the header

4. You'll be redirected to GitHub to authorize

5. After authorization, you'll be redirected back and logged in

6. If you're the super admin, you'll see:
   - "Admin Dashboard" in your user menu
   - "Database Viewer" in your user menu
   - "Partner Dashboard" in your user menu

### Production

1. Deploy to Cloudflare Pages:
   ```bash
   npm run deploy
   ```

2. Visit your production URL

3. Click "Login" and authorize with GitHub

4. Verify you can access the admin dashboard

## How It Works

### Authentication Flow

1. **Login Click** → User clicks "Login" button
2. **OAuth Init** → Redirects to `/api/auth/github`
3. **GitHub Auth** → User authorizes on GitHub
4. **Callback** → GitHub redirects to `/api/auth/github/callback`
5. **User Creation** → System creates/updates user in D1
6. **Session Creation** → Creates 30-day session cookie
7. **Redirect** → Redirects to dashboard (if admin) or home

### Protected Routes

Protected pages check authentication before rendering:

- `/admin/dashboard` - Requires `super_admin` role
- `/admin/database` - Requires `super_admin` role
- `/partner/dashboard` - Requires `partner` or `super_admin` role

If not authenticated, users are redirected to `/login`
If not authorized (wrong role), users are redirected to home with error

### Session Management

- **Duration**: 30 days
- **Storage**: Cloudflare D1 database
- **Cookie**: HttpOnly, Secure, SameSite=Lax
- **Validation**: Checked on every protected page load

## User Roles

### user (default)
- Basic access to public features
- No dashboard access

### partner
- Access to partner dashboard
- View partnership analytics
- Manage partnership details

### super_admin
- Full access to all dashboards
- Database viewer access
- User management capabilities
- Platform oversight

## Troubleshooting

### "Database not available" error
- Ensure D1 database is properly bound in `wrangler.toml`
- Check that migration 008 has been run
- Verify database binding name is "DB"

### "Invalid OAuth state" error
- Clear your cookies and try again
- Verify callback URL matches GitHub OAuth app settings
- Check that SITE_URL environment variable is correct

### Can't access admin dashboard
- Verify your GitHub username in `src/lib/auth.ts`
- Check that you've logged in at least once
- Inspect your user record in the database:
  ```bash
  npx wrangler d1 execute michiganspot-db --command "SELECT * FROM users WHERE username = 'your-username'"
  ```

### Session expires immediately
- Check system time is correct
- Verify session cookie settings
- Ensure `expires_at` is stored as Unix timestamp (seconds)

## Security Best Practices

✅ **DO:**
- Keep GitHub Client Secret secure (never commit to git)
- Use environment variables for all secrets
- Regularly rotate OAuth secrets
- Monitor failed login attempts
- Keep session duration reasonable (30 days max)

❌ **DON'T:**
- Commit `.env` file to version control
- Share OAuth credentials
- Disable HTTPS in production
- Allow unlimited session duration
- Expose user email addresses publicly

## Next Steps

After setup, you can:
1. Create additional admin users by updating their role in the database
2. Implement partner onboarding workflow
3. Add email notifications for important events
4. Set up 2FA for super admin accounts (future enhancement)
5. Monitor authentication metrics in admin dashboard

For support, contact: security@cozyartz.com
