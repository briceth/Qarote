#!/bin/bash

# Script for automating Wrangler login in CI environments
# This script uses environment variables to authenticate with Cloudflare
# CLOUDFLARE_API_TOKEN must be set in the environment

set -e

# Check if CLOUDFLARE_API_TOKEN is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Error: CLOUDFLARE_API_TOKEN environment variable is not set"
  echo "Please set this variable with a valid Cloudflare API token"
  echo "You can create an API token at https://dash.cloudflare.com/profile/api-tokens"
  exit 1
fi

# Create the Wrangler configuration directory if it doesn't exist
WRANGLER_CONFIG_DIR="$HOME/.wrangler"
mkdir -p "$WRANGLER_CONFIG_DIR"

# Create the Cloudflare authentication configuration
cat > "$WRANGLER_CONFIG_DIR/config.json" << EOF
{
  "api_token": "$CLOUDFLARE_API_TOKEN"
}
EOF

# Verify the authentication works
echo "Testing Cloudflare authentication..."
wrangler whoami

# Check if authentication was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully authenticated with Cloudflare!"
else
  echo "❌ Failed to authenticate with Cloudflare"
  exit 1
fi

echo "Wrangler is now configured and ready to use"
