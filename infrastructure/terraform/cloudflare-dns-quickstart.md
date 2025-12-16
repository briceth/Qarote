# Quick Start: Cloudflare DNS with Terraform

## Your Zone Information

- **Domain:** `qarote.io`
- **Zone ID:** `f1f24715843ec4f3dff0c2f8ad6fe3e7`

## Quick Setup

1. **Copy the example file:**

   ```bash
   cd infrastructure/terraform
   cp cloudflare-dns.tf.example cloudflare-dns.tf
   ```

2. **Edit `cloudflare-dns.tf`** and uncomment/modify the records you need

3. **Plan and apply:**
   ```bash
   source set-cloudflare-env.sh
   terraform plan
   terraform apply
   ```

## Common Records for Your Setup

Based on your infrastructure, you might want:

### App Subdomain (Cloudflare Pages)

```hcl
resource "cloudflare_record" "app" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "app"
  value   = "qarote-app-production.pages.dev"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}
```

### API Subdomain (Your Backend Server)

```hcl
resource "cloudflare_record" "api" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "api"
  value   = "your-backend-server.com"  # Replace with actual server
  type    = "CNAME"
  ttl     = 3600
  proxied = false  # Usually false for APIs
}
```

### Portal Subdomain (Cloudflare Pages)

```hcl
resource "cloudflare_record" "portal" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "portal"
  value   = "qarote-portal-production.pages.dev"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}
```

### Staging Subdomain

```hcl
resource "cloudflare_record" "staging" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "staging"
  value   = "your-staging-server.com"  # Replace with actual server
  type    = "CNAME"
  ttl     = 3600
  proxied = false
}
```

## Importing Existing Records

If you already have DNS records in Cloudflare, you can import them:

```bash
# List existing records
source set-cloudflare-env.sh
curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/f1f24715843ec4f3dff0c2f8ad6fe3e7/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | python3 -m json.tool

# Import a record (replace <record_id> with actual ID)
terraform import cloudflare_record.app f1f24715843ec4f3dff0c2f8ad6fe3e7/<record_id>
```

## See Also

- `CLOUDFLARE_DNS.md` - Complete documentation
- `cloudflare-dns.tf.example` - Full example with all record types

