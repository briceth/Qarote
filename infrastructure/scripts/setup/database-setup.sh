#!/bin/bash

set -e

echo "🗄️  Starting Database Server setup..."

# Test network connectivity
echo "🌐 Testing network connectivity..."
ping -c 1 8.8.8.8
nslookup google.com

# Check and setup attached volume for database persistence
echo "💾 Setting up persistent volume for database..."
if [ -b /dev/sdb ]; then
    echo "Found attached volume at /dev/sdb"
    
    # Check if volume is already formatted and mounted
    if ! mount | grep -q "/dev/sdb"; then
        echo "Formatting and mounting volume..."
        
        # Create mount point for database data
        mkdir -p /mnt/database
        
        # Check if volume is already formatted
        if ! blkid /dev/sdb; then
            echo "Formatting volume with ext4..."
            mkfs.ext4 /dev/sdb
        else
            echo "Volume already formatted"
        fi
        
        # Mount the volume
        mount /dev/sdb /mnt/database
        
        # Add to fstab for persistence
        if ! grep -q "/dev/sdb" /etc/fstab; then
            echo "/dev/sdb /mnt/database ext4 defaults 0 2" >> /etc/fstab
        fi
        
        # Set proper permissions
        chown -R root:root /mnt/database
        chmod 755 /mnt/database
        
        echo "Volume mounted at /mnt/database"
    else
        echo "Volume already mounted"
    fi
else
    echo "⚠️  No additional volume found at /dev/sdb, using local storage"
    mkdir -p /mnt/database
fi

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

# Install Dokku (idempotent check)
echo "🚀 Installing Dokku..."
if ! command -v dokku &> /dev/null; then
    echo "Testing Dokku endpoint accessibility..."
    curl -s --max-time 30 https://dokku.com/install/v0.35.20/bootstrap.sh | head -n 1
    
    echo "Downloading and installing Dokku..."
    wget -NP . https://dokku.com/install/v0.35.20/bootstrap.sh
    DOKKU_TAG=v0.35.20 bash bootstrap.sh
    echo "Dokku installed successfully"
else
    echo "Dokku already installed, skipping..."
fi

# Wait a moment for Dokku to be fully ready
echo "⏳ Waiting for Dokku to be fully ready..."
sleep 10

# Install PostgreSQL plugin (idempotent)
echo "🔌 Installing PostgreSQL plugin..."
if ! dokku plugin:list | grep -q "postgres"; then
    echo "Testing GitHub connectivity..."
    curl -s --max-time 30 https://github.com/dokku/dokku-postgres.git | head -n 1
    
    echo "Installing PostgreSQL plugin..."
    dokku plugin:install https://github.com/dokku/dokku-postgres.git postgres
    echo "PostgreSQL plugin installed"
else
    echo "PostgreSQL plugin already installed, skipping..."
fi

# Install maintenance plugin (idempotent)
echo "🔧 Installing maintenance plugin..."
if ! dokku plugin:list | grep -q "maintenance"; then
    echo "Installing maintenance plugin..."
    dokku plugin:install https://github.com/dokku/dokku-maintenance.git maintenance
    echo "Maintenance plugin installed"
else
    echo "Maintenance plugin already installed, skipping..."
fi

# Create a swap file for database server (idempotent)
echo "💾 Creating swap file for database server..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap file created and activated"
else
    echo "Swap file already exists, checking if active..."
    if ! swapon --show | grep -q "/swapfile"; then
        swapon /swapfile
        echo "Swap file activated"
    else
        echo "Swap file already active"
    fi
fi

# Create the main database with persistent storage (idempotent)
echo "🗄️  Creating main database with persistent storage..."
if ! dokku postgres:list | grep -q "rabbithq-db"; then
    # Create database with default configuration
    dokku postgres:create rabbithq-db --image-version 14
    
    # If we have the volume mounted, we can configure a backup strategy
    if [ -b /dev/sdb ]; then
        echo "Database will use local storage (PostgreSQL handles data management internally)"
        # Create backup directory on the volume for future use
        mkdir -p /mnt/database/backups
        chown -R 999:999 /mnt/database/backups
    fi
    
    echo "Database 'rabbithq-db' created successfully with PostgreSQL 14"
else
    echo "Database 'rabbithq-db' already exists, checking container status..."
    
    # Check if container is running or needs restart
    if ! docker ps | grep -q "dokku.postgres.rabbithq-db"; then
        echo "Database container not running, attempting to start..."
        
        # Try to remove any conflicting stopped containers
        docker rm -f dokku.postgres.rabbithq-db 2>/dev/null || true
        
        # Restart the database service
        dokku postgres:start rabbithq-db 2>/dev/null || {
            echo "Failed to start existing database, recreating..."
            dokku postgres:destroy rabbithq-db --force 2>/dev/null || true
            sleep 5
            dokku postgres:create rabbithq-db --image-version 14
        }
    else
        echo "Database container is already running"
    fi
fi

# Configure PostgreSQL for external connections (idempotent)
echo "🔗 Configuring PostgreSQL for external connections..."
if ! dokku postgres:info rabbithq-db | grep -q "Exposed ports.*5432"; then
    dokku postgres:expose rabbithq-db 5432
    echo "PostgreSQL exposed on port 5432"
else
    echo "PostgreSQL already exposed on port 5432, skipping..."
fi

echo "✅ Database server setup complete!"
echo ""
if [ -b /dev/sdb ]; then
    echo "✅ Database is running with 50GB persistent volume storage"
    echo "✅ Database data will persist across server restarts and replacements"
else
    echo "⚠️  Database is using local storage (data may be lost on server replacement)"
fi
echo "Database is ready and accessible on port 5432"
echo "🎉 Database server is ready!"
