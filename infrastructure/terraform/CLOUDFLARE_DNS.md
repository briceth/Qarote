# Cloudflare DNS Records with Terraform

This guide explains how to manage Cloudflare DNS records using Terraform.

## Prerequisites

1. Cloudflare account with `qarote.io` domain added
2. Cloudflare API token with DNS edit permissions
3. Terraform configured with Cloudflare provider (already done)

## Getting Your Zone ID

The zone ID is automatically retrieved using the `cloudflare_zone` data source, but you can also get it manually:

```bash
cd infrastructure/terraform
source set-cloudflare-env.sh

curl -X GET "https://api.cloudflare.com/client/v4/zones?name=qarote.io" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | \
  python3 -c "import sys, json; data = json.load(sys.stdin); print(data['result'][0]['id'])"
```

## Setting Up DNS Records

1. **Copy the example file:**

   ```bash
   cp cloudflare-dns.tf.example cloudflare-dns.tf
   ```

2. **Edit `cloudflare-dns.tf`** and update the values:
   - Replace IP addresses with your actual server IPs
   - Update CNAME values to point to your actual servers
   - Configure email records (MX, SPF) if needed
   - Add any other records you need

3. **Review the plan:**

   ```bash
   source set-cloudflare-env.sh
   terraform plan
   ```

4. **Apply the changes:**
   ```bash
   terraform apply
   ```

## Common DNS Record Types

### A Record (IPv4)

```hcl
resource "cloudflare_record" "example" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "subdomain"
  value   = "192.0.2.1"
  type    = "A"
  ttl     = 3600
  proxied = true  # Enable Cloudflare proxy
}
```

### CNAME Record

```hcl
resource "cloudflare_record" "example" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "subdomain"
  value   = "target.example.com"
  type    = "CNAME"
  ttl     = 3600
  proxied = true
}
```

### MX Record (Email)

```hcl
resource "cloudflare_record" "mx" {
  zone_id  = data.cloudflare_zone.qarote.id
  name     = "@"  # Root domain
  priority = 10
  value    = "mail.example.com"
  type     = "MX"
  ttl      = 3600
}
```

### TXT Record

```hcl
resource "cloudflare_record" "txt" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "@"
  value   = "your-text-value"
  type    = "TXT"
  ttl     = 3600
}
```

## TTL Settings

- **`ttl = 1`**: Automatic TTL (recommended for Cloudflare Pages)
- **`ttl = 3600`**: 1 hour
- **`ttl = 86400`**: 24 hours

## Proxied vs Non-Proxied

- **`proxied = true`**: Traffic goes through Cloudflare (orange cloud)
  - DDoS protection
  - CDN caching
  - SSL/TLS encryption
  - Use for web traffic

- **`proxied = false`**: Direct connection (gray cloud)
  - No Cloudflare features
  - Use for API endpoints, mail servers, etc.

## Cloudflare Pages Custom Domains

For Cloudflare Pages projects, you typically configure custom domains in the Pages dashboard, but you can also use DNS records:

```hcl
# CNAME pointing to Pages project
resource "cloudflare_record" "portal" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "portal"
  value   = "qarote-portal-production.pages.dev"
  type    = "CNAME"
  ttl     = 1  # Automatic for Pages
  proxied = true
}
```

Then add the custom domain in Cloudflare Pages dashboard:

- Workers & Pages → Your Project → Custom domains → Add domain

## Managing Existing Records

If you have existing DNS records in Cloudflare:

1. **Import existing records:**

   ```bash
   terraform import cloudflare_record.example <zone_id>/<record_id>
   ```

2. **Or let Terraform create new ones** (it will show conflicts if records already exist)

## Best Practices

1. **Use data sources** to get zone IDs automatically
2. **Set appropriate TTLs** - use `1` (automatic) for Cloudflare Pages
3. **Enable proxying** for web traffic to get Cloudflare benefits
4. **Disable proxying** for API endpoints, mail servers, etc.
5. **Use descriptive resource names** in Terraform
6. **Review plans carefully** before applying DNS changes

## Troubleshooting

**Error: Zone not found**

- Verify the domain is added to your Cloudflare account
- Check the domain name spelling

**Error: Record already exists**

- Import the existing record into Terraform state
- Or delete the record in Cloudflare dashboard first

**DNS not resolving**

- Wait for DNS propagation (can take minutes to hours)
- Check TTL values - lower TTL = faster updates
- Verify nameservers are set correctly at your registrar

## Example: Complete Setup for Qarote

```hcl
# Get zone
data "cloudflare_zone" "qarote" {
  name = "qarote.io"
}

# Root domain A record (if needed)
resource "cloudflare_record" "root" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "@"
  value   = "192.0.2.1"
  type    = "A"
  proxied = true
}

# App subdomain
resource "cloudflare_record" "app" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "app"
  value   = "qarote-app-production.pages.dev"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

# API subdomain (pointing to your backend server)
resource "cloudflare_record" "api" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "api"
  value   = "api-server.example.com"  # Your actual backend
  type    = "CNAME"
  ttl     = 3600
  proxied = false
}
```

