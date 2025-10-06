#!/bin/bash

set -e

echo "💬 Starting Discourse Production Server setup..."

# Test network connectivity
echo "🌐 Testing network connectivity..."
ping -c 1 8.8.8.8
nslookup google.com

# Setup Discourse data directory
echo "💾 Setting up Discourse data directory..."
ENVIRONMENT="{{ENVIRONMENT}}"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "Production environment: Setting up persistent volume mount..."
    # Check if volume is attached and mount it
    if [ -b /dev/sdb ]; then
        echo "Found attached volume at /dev/sdb"
        
        # Check if volume is already mounted
        if ! mount | grep -q "/dev/sdb"; then
            echo "Mounting volume..."
            mkdir -p /mnt/discourse
            
            # Check if volume is already formatted
            if ! blkid /dev/sdb; then
                echo "Formatting volume with ext4..."
                mkfs.ext4 /dev/sdb
            else
                echo "Volume already formatted"
            fi
            
            # Mount the volume
            mount /dev/sdb /mnt/discourse
            
            # Add to fstab for persistence
            if ! grep -q "/dev/sdb" /etc/fstab; then
                echo "/dev/sdb /mnt/discourse ext4 defaults 0 2" >> /etc/fstab
            fi
            
            echo "Volume mounted at /mnt/discourse"
        else
            echo "Volume already mounted"
            # Ensure mount point exists even if volume is already mounted
            mkdir -p /mnt/discourse
        fi
    else
        echo "⚠️  No volume found at /dev/sdb for production environment"
        mkdir -p /mnt/discourse
    fi
else
    echo "Staging environment: Using local storage..."
    mkdir -p /mnt/discourse
fi

chown -R root:root /mnt/discourse
chmod 755 /mnt/discourse
echo "Discourse data directory ready at /mnt/discourse"

# Update system (idempotent with lock waiting)
echo "📦 Updating system packages..."

# Wait for APT lock to be released
echo "⏳ Waiting for APT lock to be released..."
while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || sudo fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do
  echo "APT is locked, waiting 10 seconds..."
  sleep 10
done

apt-get update

# Wait for lock again before upgrade
while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || sudo fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do
  echo "APT is locked, waiting 10 seconds..."
  sleep 10
done

apt-get upgrade -y

# Install dependencies (idempotent with lock waiting)
echo "📦 Installing dependencies..."

# Wait for APT lock again before installing
while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || sudo fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do
  echo "APT is locked, waiting 10 seconds..."
  sleep 10
done

apt-get install -y curl wget git dnsutils

# Install Docker (if not already installed)
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    echo "Docker installed successfully"
else
    echo "Docker already installed, skipping..."
fi

# Configure firewall for production
echo "🔥 Configuring firewall for production..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
echo "Firewall configured for production"

echo "✅ Discourse production server setup complete!"
echo ""
echo "🎉 Discourse production server is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Follow the official Discourse installation guide"
echo "2. Configure your domain: forum.rabbithq.io"
echo "3. Set up SSL certificates"
echo "4. Configure SMTP settings"
echo "5. Complete Discourse setup wizard"
echo ""
if [ "$ENVIRONMENT" = "production" ]; then
    echo "✅ Production server configured with Hetzner-managed persistent volume"
    echo "✅ All data will persist across server restarts"
    echo "✅ Firewall configured for production security"
else
    echo "✅ Staging server configured with local storage"
    echo "⚠️  Data will be lost on server restart (acceptable for staging)"
fi
echo ""
echo "🐳 Docker installed (includes Docker Compose)"
echo "💾 Persistent volume: /mnt/discourse (for OS and future use)"
echo "🔒 Firewall: Configured for production security"
echo ""
echo "📚 Official Discourse Installation Guide:"
echo "https://github.com/discourse/discourse_docker"
