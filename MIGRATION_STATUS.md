# Domain Migration Status: rabbithq.io → qarote.io

## ✅ Completed Tasks

### Code & Configuration

- ✅ Updated all code references from `rabbithq.io` to `qarote.io`
- ✅ Updated all brand names from "RabbitHQ" to "Qarote"
- ✅ Updated GitHub Actions workflows with new Cloudflare Pages project names
- ✅ Updated environment variable defaults and examples
- ✅ Updated documentation (README, deployment guides, etc.)
- ✅ Updated email addresses (support@qarote.io, noreply@qarote.io, etc.)

### Cloudflare Infrastructure

- ✅ Created Terraform configuration for Cloudflare Pages projects
- ✅ Imported all existing Cloudflare Pages projects into Terraform state
- ✅ Disabled auto-deployment for `qarote-landing-production` (now uses GitHub Actions)
- ✅ Created Terraform configuration for DNS records
- ✅ Added DNS A records manually:
  - `api.qarote.io` → `167.235.104.243`
  - `staging-api.qarote.io` → `5.75.164.253`

## 🔄 Still To Do (Manual Tasks)

### 1. Cloudflare DNS Configuration

- [ ] **Add remaining DNS records** (if needed):
  - `app.qarote.io` → CNAME to `qarote-app-production.pages.dev`
  - `portal.qarote.io` → CNAME to `qarote-portal-production.pages.dev` (if exists)
  - `www.qarote.io` → CNAME to `qarote.io`
  - Any other subdomains you need

- [ ] **Set up Cloudflare redirects** (301 redirects from old domain):
  - `rabbithq.io` → `qarote.io`
  - `app.rabbithq.io` → `app.qarote.io`
  - `api.rabbithq.io` → `api.qarote.io`
  - `portal.rabbithq.io` → `portal.qarote.io`
  - `staging.rabbithq.io` → `staging.qarote.io`
  - `www.rabbithq.io` → `www.qarote.io`

- [ ] **Configure Cloudflare Pages custom domains**:
  - In Cloudflare Pages dashboard, add custom domains:
    - `app.qarote.io` for `qarote-app-production`
    - `qarote.io` and `www.qarote.io` for `qarote-landing-production`
    - `portal.qarote.io` for `qarote-portal-production` (if exists)

### 2. Server Configuration (Dokku)

- [ ] **SSH to production server** and run:

  ```bash
  dokku domains:add <app-name> qarote.io
  dokku domains:add <app-name> www.qarote.io
  ```

- [ ] **SSH to staging server** and run:
  ```bash
  dokku domains:add <app-name> staging.qarote.io
  ```

### 3. External Services

#### Stripe

- [ ] **Update Stripe webhooks**:
  - Go to Stripe Dashboard → Developers → Webhooks
  - Update webhook endpoint URLs from `api.rabbithq.io` to `api.qarote.io`
  - Test webhook delivery

#### Google OAuth

- [ ] **Update Google OAuth configuration**:
  - Go to Google Cloud Console → APIs & Services → Credentials
  - Update authorized redirect URIs:
    - `https://app.rabbithq.io/*` → `https://app.qarote.io/*`
  - Update authorized JavaScript origins:
    - `https://app.rabbithq.io` → `https://app.qarote.io`

#### Resend (Email)

- [ ] **Configure Resend for qarote.io**:
  - Add `qarote.io` as verified sending domain in Resend dashboard
  - Set up SPF, DKIM, and DMARC records in Cloudflare DNS
  - Update `FROM_EMAIL` environment variables to use `@qarote.io` addresses

### 4. Environment Variables

#### Backend Servers

- [ ] **Update production backend environment variables**:

  ```env
  FRONTEND_URL=https://app.qarote.io
  FROM_EMAIL=noreply@qarote.io
  LICENSE_VALIDATION_URL=https://api.qarote.io
  CORS_ORIGIN=https://app.qarote.io
  ```

- [ ] **Update staging backend environment variables**:
  ```env
  FRONTEND_URL=https://app.qarote.io  # or staging URL
  FROM_EMAIL=noreply@qarote.io
  CORS_ORIGIN=https://app.qarote.io
  ```

#### Frontend (GitHub Actions)

- [ ] **Update GitHub Actions secrets/variables**:
  - `VITE_API_URL` → `https://api.qarote.io` (production)
  - `VITE_API_URL_STAGING` → `https://staging-api.qarote.io` (staging)

#### Customer Portal (Cloudflare Pages)

- [ ] **Update Cloudflare Pages environment variables**:
  - Go to each Pages project → Settings → Environment variables
  - Update `VITE_API_URL` to `https://api.qarote.io`

### 5. Terraform DNS Records (Optional)

- [ ] **Import manually added DNS records into Terraform** (if you want to manage them with Terraform):

  ```bash
  cd infrastructure/terraform
  source set-cloudflare-env.sh

  # Get record IDs first, then import
  terraform import cloudflare_record.api f1f24715843ec4f3dff0c2f8ad6fe3e7/<record_id>
  terraform import cloudflare_record.staging_api f1f24715843ec4f3dff0c2f8ad6fe3e7/<record_id>
  ```

  **Note:** You'll need to update your API token to have DNS edit permissions first.

### 6. Testing & Verification

- [ ] **Test all domains load correctly**:
  - `https://qarote.io`
  - `https://app.qarote.io`
  - `https://api.qarote.io`
  - `https://portal.qarote.io`
  - `https://staging.qarote.io`
  - `https://staging-api.qarote.io`

- [ ] **Test redirects work**:
  - All `rabbithq.io` subdomains should redirect to corresponding `qarote.io` subdomains

- [ ] **Test email sending**:
  - Verify emails send from `@qarote.io` addresses
  - Check email deliverability

- [ ] **Test OAuth login**:
  - Verify Google OAuth works with new domain

- [ ] **Test Stripe webhooks**:
  - Trigger a test webhook and verify delivery to new domain

- [ ] **Check for broken links**:
  - Search codebase for any remaining `rabbithq.io` references
  - Test all internal links

## 📝 Notes

- The Terraform DNS configuration is ready in `infrastructure/terraform/cloudflare-dns.tf`
- All Cloudflare Pages projects are managed by Terraform
- GitHub Actions workflows are configured for manual deployments
- Most code changes are complete - focus on infrastructure and external services

## 🚨 Important

Before switching traffic:

1. Test everything in staging first
2. Have a rollback plan ready
3. Update external services (Stripe, Google, Resend) before DNS changes
4. Monitor error logs after migration

