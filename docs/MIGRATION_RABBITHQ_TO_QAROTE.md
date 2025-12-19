# Migration from RabbitHQ to Qarote - Domain and SSL Configuration

## Overview

This document summarizes the migration from the old domain `rabbithq.io` to the new domain `qarote.io`, including the resolution of OAuth and CORS issues that occurred during the migration.

**Date:** December 19, 2025  
**Status:** ✅ Completed

## Issues Encountered

### 1. Google OAuth Error: `origin_mismatch` (Error 400)

**Problem:** After changing the domain from `rabbithq.io` to `qarote.io`, Google OAuth authentication failed with error:
```
Erreur 400: origin_mismatch
Vous ne pouvez pas vous connecter à cette appli, car elle ne respecte pas le règlement OAuth 2.0 de Google.
```

**Root Cause:** The Google Cloud Console OAuth 2.0 client still had the old domain (`api.rabbithq.io`) configured as an authorized JavaScript origin.

**Solution:**
1. Accessed Google Cloud Console → APIs & Services → Credentials
2. Located the OAuth 2.0 Client ID used by the application
3. Updated "Authorized JavaScript origins" to include:
   - `https://app.qarote.io`
   - `https://staging-app.qarote.io` (for staging environment)
4. Removed old RabbitHQ origins

### 2. CORS Error: HTTP 525 (SSL Handshake Failed)

**Problem:** Frontend requests from `app.qarote.io` to `api.qarote.io` were blocked with CORS errors:
```
Access to fetch at 'https://api.qarote.io/api/auth/google' from origin 'https://app.qarote.io' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause:** 
- The API server (Dokku) did not have an SSL certificate installed
- Cloudflare was proxying traffic but couldn't establish SSL connection to the origin server
- This resulted in HTTP 525 errors (SSL handshake failed)

**Solution:**
1. Installed Let's Encrypt certificate on Dokku
2. Updated domain configuration in Dokku
3. Configured Cloudflare SSL/TLS mode
4. Updated load balancer health checks

## Detailed Steps Completed

### Step 1: Update Dokku Domain Configuration

```bash
# Removed old domain
dokku domains:remove qarote api.rabbithq.io

# Added new domain
dokku domains:add qarote api.qarote.io

# Verified configuration
dokku domains:report qarote
```

### Step 2: Install Let's Encrypt Certificate

**Prerequisites:**
- Disabled Cloudflare proxy temporarily (set DNS record to "DNS only")
- Updated load balancer health check domain from `api.rabbithq.io` to `api.qarote.io`

**Commands:**
```bash
# Configure Let's Encrypt email
dokku letsencrypt:set qarote email support@qarote.io

# Enable Let's Encrypt (generates and installs certificate)
dokku letsencrypt:enable qarote

# Verify certificate installation
dokku letsencrypt:list qarote

# Set up automatic renewal
dokku letsencrypt:cron-job --add
```

**Result:** Certificate successfully installed with automatic renewal configured.

### Step 3: Update Load Balancer Configuration

**Hetzner Cloud Load Balancer:**
- Updated HTTP service (port 80) health check domain from `api.rabbithq.io` to `api.qarote.io`
- Verified both services are healthy:
  - `http:80 → 80`: ✅ Healthy
  - `tcp:443 → 443`: ✅ Healthy

### Step 4: Configure Cloudflare SSL/TLS

**Settings:**
- SSL/TLS mode: Changed from "Full" to **"Full (strict)"**
- This ensures Cloudflare validates the Let's Encrypt certificate on the origin server
- Re-enabled Cloudflare proxy for `api.qarote.io` DNS record

### Step 5: Update CORS Configuration

**Environment Variable:**
- Updated `CORS_ORIGIN` in Dokku configuration:
  ```bash
  dokku config:set qarote CORS_ORIGIN=https://app.qarote.io
  ```

**Verification:**
- Tested CORS preflight request:
  ```bash
  curl -X OPTIONS \
    -H "Origin: https://app.qarote.io" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -v https://api.qarote.io/api/auth/google
  ```
- Result: ✅ HTTP 204 with proper CORS headers

## Final Configuration

### Domain Configuration
- **Frontend:** `app.qarote.io` (Cloudflare Pages)
- **API:** `api.qarote.io` (Dokku on Hetzner)
- **Portal:** `portal.qarote.io` (Cloudflare Pages)

### SSL/TLS Setup
- **Cloudflare → Internet:** Cloudflare-managed certificate (automatic)
- **Cloudflare → Origin:** Let's Encrypt certificate (installed on Dokku)
- **Cloudflare SSL Mode:** Full (strict)
- **Certificate Auto-renewal:** ✅ Configured via cron job

### Load Balancer
- **Provider:** Hetzner Cloud
- **Public IP:** `167.235.104.243`
- **Services:**
  - HTTP (80): ✅ Healthy
  - HTTPS (443): ✅ Healthy
- **Target Server:** `qarote-app-production` (10.0.0.20)

### CORS Configuration
- **Allowed Origin:** `https://app.qarote.io`
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Authorization
- **Credentials:** Enabled
- **Max Age:** 600 seconds

## Verification Tests

### 1. SSL Certificate
```bash
# Check certificate details
openssl s_client -connect api.qarote.io:443 -servername api.qarote.io < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

### 2. CORS Headers
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://app.qarote.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v https://api.qarote.io/api/auth/google
```

**Expected Response:**
- HTTP 204 (No Content)
- Headers: `access-control-allow-origin: https://app.qarote.io`
- Headers: `access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS`
- Headers: `access-control-allow-credentials: true`

### 3. Google OAuth
- ✅ Tested from `app.qarote.io/auth/sign-in`
- ✅ Google OAuth popup appears correctly
- ✅ No CORS errors
- ✅ Authentication flow completes successfully

## Files Modified

### Infrastructure Scripts
- `infrastructure/scripts/setup/application-setup.sh` - Reviewed for Let's Encrypt configuration

### Configuration Files
- Dokku domain configuration (via CLI)
- Cloudflare DNS records
- Hetzner Load Balancer services
- Google Cloud Console OAuth settings

## Lessons Learned

1. **Domain Migration Checklist:**
   - Update all DNS records
   - Update OAuth provider configurations (Google, etc.)
   - Update application domain settings
   - Update load balancer health checks
   - Install/update SSL certificates

2. **SSL Certificate Strategy:**
   - With Cloudflare proxy: Use Let's Encrypt on origin server
   - Cloudflare mode "Full (strict)" requires valid certificate on origin
   - Automatic renewal is essential for production

3. **CORS Configuration:**
   - Must match exact origin (protocol + domain + port)
   - Preflight requests (OPTIONS) must be handled correctly
   - Credentials require explicit origin (no wildcard)

## Maintenance

### Certificate Renewal
- Automatic renewal configured via cron job
- Check renewal status: `dokku letsencrypt:list`
- Manual renewal if needed: `dokku letsencrypt:enable qarote`

### Monitoring
- Monitor load balancer health checks
- Monitor SSL certificate expiration (90 days for Let's Encrypt)
- Monitor CORS errors in browser console
- Monitor Google OAuth errors

## Related Documentation

- [Dokku Let's Encrypt Plugin](https://github.com/dokku/dokku-letsencrypt)
- [Cloudflare SSL/TLS Modes](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/)
- [Hetzner Load Balancer Documentation](https://docs.hetzner.com/cloud/load-balancers/)

## Status

✅ **All issues resolved and verified**
- Google OAuth: Working
- CORS: Working
- SSL/TLS: Configured and working
- Load Balancer: Healthy
- Certificate Auto-renewal: Configured

---

**Last Updated:** December 19, 2025  
**Next Review:** March 2026 (before certificate expiration)

