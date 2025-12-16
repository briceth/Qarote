# Cloudflare DNS Records for qarote.io
# Zone ID: f1f24715843ec4f3dff0c2f8ad6fe3e7

# Data source to get the zone ID from the domain name
data "cloudflare_zone" "qarote" {
  name = "qarote.io"
}

# A record for staging-api subdomain
resource "cloudflare_record" "staging_api" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "staging-api"
  content = "5.75.164.253"
  type    = "A"
  ttl     = 3600
  proxied = false  # Usually false for API endpoints
}

# A record for api subdomain
resource "cloudflare_record" "api" {
  zone_id = data.cloudflare_zone.qarote.id
  name    = "api"
  content = "167.235.104.243"
  type    = "A"
  ttl     = 3600
  proxied = false  # Usually false for API endpoints
}

