# Disable Cloudflare Pages Auto-Deployment

This document explains how to disable automatic deployments for Cloudflare Pages projects so that deployments are controlled via GitHub Actions instead.

## Current Status

✅ **`qarote-landing-production`** - Automatic deployments are **DISABLED**

The project is still connected to GitHub (for repository access), but it will no longer deploy automatically on commits to the `main` branch.

## Why Disable Auto-Deployment?

- **Controlled Deployments**: Deploy only when you explicitly trigger via GitHub Actions
- **Quality Checks**: Run tests, linting, and other checks before deployment
- **Manual Approval**: Use GitHub Actions `workflow_dispatch` for manual deployment with confirmation
- **Consistency**: All deployments go through the same CI/CD pipeline

## How It Works

1. **Cloudflare Pages** is connected to your GitHub repository (for access)
2. **Automatic deployments are disabled** - no deployments on commits
3. **GitHub Actions** workflow (`deploy-landing-production.yml`) handles deployments
4. Deployments are triggered **manually** via GitHub Actions UI

## Deploying to Production

### Via GitHub Actions (Recommended)

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **"Deploy Landing to Production"** workflow
4. Click **"Run workflow"**
5. Type **"DEPLOY"** in the confirmation field
6. Click **"Run workflow"** button

The workflow will:

- Run quality checks (type check, lint, format)
- Build the landing page
- Deploy to Cloudflare Pages using Wrangler

### Via Script (For Other Projects)

To disable auto-deployment for other projects:

```bash
cd infrastructure/terraform
./disable-cloudflare-auto-deploy.sh qarote-landing-production
```

Or for a different project:

```bash
./disable-cloudflare-auto-deploy.sh qarote-app-production
```

## Re-enabling Auto-Deployment

If you need to re-enable automatic deployments, you can:

1. **Via Cloudflare Dashboard**:
   - Go to Workers & Pages → Your Project → Settings → Builds
   - Enable "Enable automatic production branch deployments"

2. **Via API** (update the script to set `deployments_enabled: true`)

## Verification

To verify that auto-deployment is disabled:

```bash
cd infrastructure/terraform
source set-cloudflare-env.sh
curl -s -X GET \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/qarote-landing-production" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); cfg = data['result']['source']['config']; print('Deployments enabled:', cfg.get('deployments_enabled')); print('Production deployments enabled:', cfg.get('production_deployments_enabled'))"
```

Expected output:

```
Deployments enabled: False
Production deployments enabled: False
```

## Related Files

- `.github/workflows/deploy-landing-production.yml` - GitHub Actions workflow for manual deployment
- `disable-cloudflare-auto-deploy.sh` - Script to disable auto-deployment for any project
