#!/bin/bash

set -e

echo "💬 Starting Discourse Server setup..."

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

# Create backup and upload directories
echo "📦 Setting up backup and upload directories..."
mkdir -p /mnt/discourse/backups
mkdir -p /mnt/discourse/uploads

# Set proper permissions for Discourse
chown -R 999:999 /mnt/discourse/backups 2>/dev/null || true
chown -R 999:999 /mnt/discourse/uploads 2>/dev/null || true

echo "Backup and upload directories created"

echo "✅ Discourse server setup complete!"
echo ""
echo "🎉 Discourse server is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy Discourse application using Docker Compose"
echo "2. Configure SMTP settings with your Gmail app password"
echo "3. Complete Discourse setup wizard"
echo "4. Configure SSO integration with RabbitHQ"
echo ""
if [ "$ENVIRONMENT" = "production" ]; then
    echo "✅ Production server configured with Hetzner-managed persistent volume"
    echo "✅ All data will persist across server restarts"
else
    echo "✅ Staging server configured with local storage"
    echo "⚠️  Data will be lost on server restart (acceptable for staging)"
fi
echo ""
echo "🐳 Docker installed (includes Docker Compose)"
echo "💾 Data directory: /mnt/discourse"
echo "📦 Backup directory: /mnt/discourse/backups"
echo "📁 Upload directory: /mnt/discourse/uploads"

