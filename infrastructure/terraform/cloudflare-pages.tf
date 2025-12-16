# Cloudflare Pages Projects Configuration
# This file manages Cloudflare Pages projects for Qarote

# Landing Page - Production
resource "cloudflare_pages_project" "landing_production" {
  account_id = var.cloudflare_account_id
  name       = "qarote-landing-production"
  production_branch = "main"
}

# Landing Page - Staging
resource "cloudflare_pages_project" "landing_staging" {
  account_id = var.cloudflare_account_id
  name       = "qarote-landing-staging"
  production_branch = "main"
}

# Frontend App - Production
resource "cloudflare_pages_project" "app_production" {
  account_id = var.cloudflare_account_id
  name       = "qarote-app-production"
  production_branch = "main"
}

# Frontend App - Staging
resource "cloudflare_pages_project" "app_staging" {
  account_id = var.cloudflare_account_id
  name       = "qarote-app-staging"
  production_branch = "main"
}

# Customer Portal - Production
# NOTE: This project doesn't exist yet - will be created when needed
# resource "cloudflare_pages_project" "portal_production" {
#   account_id = var.cloudflare_account_id
#   name       = "qarote-portal-production"
#   production_branch = "main"
# }

# Customer Portal - Staging
resource "cloudflare_pages_project" "portal_staging" {
  account_id = var.cloudflare_account_id
  name       = "qarote-portal-staging"
  production_branch = "main"
}

# Outputs for Cloudflare Pages Projects
output "cloudflare_pages_projects" {
  description = "Cloudflare Pages project details"
  value = {
    landing_production = {
      name = cloudflare_pages_project.landing_production.name
      id   = cloudflare_pages_project.landing_production.id
      url  = "https://${cloudflare_pages_project.landing_production.name}.pages.dev"
    }
    landing_staging = {
      name = cloudflare_pages_project.landing_staging.name
      id   = cloudflare_pages_project.landing_staging.id
      url  = "https://${cloudflare_pages_project.landing_staging.name}.pages.dev"
    }
    app_production = {
      name = cloudflare_pages_project.app_production.name
      id   = cloudflare_pages_project.app_production.id
      url  = "https://${cloudflare_pages_project.app_production.name}.pages.dev"
    }
    app_staging = {
      name = cloudflare_pages_project.app_staging.name
      id   = cloudflare_pages_project.app_staging.id
      url  = "https://${cloudflare_pages_project.app_staging.name}.pages.dev"
    }
    # portal_production = {
    #   name = cloudflare_pages_project.portal_production.name
    #   id   = cloudflare_pages_project.portal_production.id
    #   url  = "https://${cloudflare_pages_project.portal_production.name}.pages.dev"
    # }
    portal_staging = {
      name = cloudflare_pages_project.portal_staging.name
      id   = cloudflare_pages_project.portal_staging.id
      url  = "https://${cloudflare_pages_project.portal_staging.name}.pages.dev"
    }
  }
}
