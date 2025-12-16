# Cloudflare Pages Projects - Terraform Management

## ✅ Status: All Projects Imported Successfully

All existing Cloudflare Pages projects have been imported into Terraform state and are now managed by Terraform.

## Prerequisites

The Cloudflare API token is stored in `terraform.tfvars` and `set-cloudflare-env.sh` (both are gitignored for security).

**Option 1: Use the helper script (recommended)**

```bash
source set-cloudflare-env.sh
```

**Option 2: Set manually**

```bash
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="e504d80e71a9d2fdb39d6eb30dff16cc"
```

**Note:** Use an API Token (not Global API Key) for Terraform. The Global API Key doesn't work properly with the Terraform Cloudflare provider for Pages API operations.

## Import Format

The import format for Cloudflare Pages projects is:

```
terraform import cloudflare_pages_project.<resource_name> <account_id>/<project_name>
```

**Important:** Use the project **name**, not the project ID!

## Project Status

- ✅ `qarote-landing-staging` - Imported and managed by Terraform
- ✅ `qarote-landing-production` - Imported and managed by Terraform
- ✅ `qarote-app-staging` - Imported and managed by Terraform
- ✅ `qarote-app-production` - Imported and managed by Terraform
- ✅ `qarote-portal-staging` - Imported and managed by Terraform
- ❌ `qarote-portal-production` - Does not exist (commented out in Terraform config)

## Usage

To manage these projects with Terraform:

```bash
cd infrastructure/terraform

# Set environment variables (use the helper script)
source set-cloudflare-env.sh

# Or set manually from terraform.tfvars
# The account_id is already in terraform.tfvars, so you can use:
terraform plan
terraform apply

# Or specify the account_id explicitly:
terraform plan -var="cloudflare_account_id=e504d80e71a9d2fdb39d6eb30dff16cc"
terraform apply -var="cloudflare_account_id=e504d80e71a9d2fdb39d6eb30dff16cc"
```

## Creating an API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template or create custom:
   - Permissions: `Account` → `Cloudflare Pages` → `Edit`
   - Account Resources: `Include` → `All accounts` (or your specific account)
4. Copy the token and use it as `CLOUDFLARE_API_TOKEN`
