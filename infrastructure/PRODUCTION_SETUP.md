# Production Infrastructure Setup with Private Networking

This document explains the production server setup for RabbitHQ using Hetzner Cloud with private networking for enhanced security and performance.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Hetzner Private Network                   │
│                    10.0.0.0/16                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Subnet: 10.0.0.0/24                  │   │
│  │                                                     │   │
│  │  ┌─────────────────┐    ┌─────────────────────────┐ │   │
│  │  │   App Server    │    │    Database Server      │ │   │
│  │  │   10.0.0.20     │◄──►│      10.0.0.10         │ │   │
│  │  │   (cpx31)       │    │      (cpx31)           │ │   │
│  │  │   + Public IP   │    │   Private Only         │ │   │
│  │  └─────────────────┘    └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Infrastructure Components

### Private Network Configuration

- **Network Range**: `10.0.0.0/16` (65,536 total addresses)
- **Subnet Range**: `10.0.0.0/24` (256 addresses for current use)
- **Network Zone**: `eu-central`

### Server Specifications

| Component          | Server Type | Private IP | Public IP                | Purpose                  |
| ------------------ | ----------- | ---------- | ------------------------ | ------------------------ |
| Application Server | cpx31       | 10.0.0.20  | ✅ Yes                   | Runs Dokku + Node.js app |
| Database Server    | cpx31       | 10.0.0.10  | ✅ Yes (management only) | PostgreSQL database      |
| Load Balancer      | lb11        | N/A        | ✅ Yes                   | Traffic distribution     |

## 🌐 Network Configuration

### Private Network vs Subnet Explained

#### Private Network (10.0.0.0/16)

- **Total addresses**: 65,536 IP addresses (10.0.0.0 to 10.0.255.255)
- **Purpose**: Defines the entire private network space
- **Analogy**: Think of it as the "neighborhood"

#### Subnet (10.0.0.0/24)

- **Subnet addresses**: 256 IP addresses (10.0.0.0 to 10.0.0.255)
- **Purpose**: Organizes servers into manageable groups
- **Analogy**: Think of it as a "street" within the neighborhood

### Private Network Configuration

Private networking is automatically configured through the Hetzner Cloud API when servers are attached to the network. No manual configuration is required.

**Automatic Configuration:**

- **Application Server**: Gets private IP `10.0.0.20` automatically
- **Database Server**: Gets private IP `10.0.0.10` automatically
- **Network Interface**: `eth1` is automatically configured by Hetzner Cloud
- **Routing**: Private network routing is automatically set up

**Benefits:**

- No manual netplan configuration needed
- Automatic interface setup and IP assignment
- Reliable network configuration managed by Hetzner Cloud
- Consistent setup across all servers
- Both servers can communicate directly within the 10.0.0.0/24 subnet

## 🔐 Security Features

### Database Security

- **Private Network Only**: Database accepts connections only from private network (`10.0.0.0/16`)
- **Firewall Rules**: Hetzner Cloud Firewall configured to allow PostgreSQL access only from private network IPs
- **No Public Database Access**: Database is not accessible from the internet
- **Centralized Security**: Network-level firewall management for better performance and consistency

### Firewall Configuration

```bash
# Firewall is automatically managed via Hetzner Cloud API
# Rules are applied at network level before traffic reaches servers
# PostgreSQL port 5432 access restricted to private network 10.0.0.0/16
# SSH access allowed for server management
```

### PostgreSQL Access Control

```bash
# pg_hba.conf configuration
host    all    all    10.0.0.20/32    md5  # Allow app server only
```

## 🚀 Deployment Process

### 1. Infrastructure Setup

```bash
# Run the production setup script
npm run setup:production
```

This will:

- ✅ Create private network (10.0.0.0/16)
- ✅ Create subnet (10.0.0.0/24)
- ✅ Provision 2 servers (cpx31 each)
- ✅ Configure private networking
- ✅ Set up Dokku on both servers
- ✅ Configure PostgreSQL with Dokku
- ✅ Display DATABASE_URL for GitHub secrets

### 2. Database URL Output

After setup completion, you'll see:

```
🔐 DATABASE_URL for GitHub Secrets:

postgres://postgres:auto_generated_password@10.0.0.10:5432/rabbithq_db

📝 Next Steps:
1. Copy the DATABASE_URL above
2. Add it as a GitHub secret named: DATABASE_URL
3. Your deployment will automatically use this secret
```

### 3. GitHub Secrets Configuration

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `DATABASE_URL`
5. Value: `postgres://postgres:password@10.0.0.10:5432/rabbithq_db`

## 🔄 Application Configuration

### Environment Variables

The setup script configures:

**Application Server**:

```bash
NODE_ENV=production
# DATABASE_URL comes from GitHub secrets during deployment
```

**Database Server**:

- Uses Dokku auto-generated secure credentials
- Configured for private network access only

### Domain Configuration

- Primary: `qarote.io`
- Secondary: `www.qarote.io`

## 📊 Network Expansion Plan

The current setup allows for easy expansion:

```
Private Network: 10.0.0.0/16
├── Production Subnet: 10.0.0.0/24     (current)
│   ├── 10.0.0.10 (database)
│   ├── 10.0.0.20 (app server)
│   └── 10.0.0.x (254 more available)
├── Staging Subnet: 10.0.1.0/24        (future)
├── Monitoring Subnet: 10.0.2.0/24     (future)
└── ... (254 more subnets available)
```

## 🛠️ Maintenance Commands

### Check Network Connectivity

```bash
# From app server, test database connection
ping 10.0.0.10

# Test PostgreSQL connectivity
telnet 10.0.0.10 5432
```

### View Server Configuration

```bash
# Check private network interface
ip addr show eth1

# Verify private network connectivity
ping -c 3 10.0.0.10  # From app server to database
```

### Database Management

```bash
# Connect to database
dokku postgres:connect rabbithq-db

# View database info
dokku postgres:info rabbithq-db

# Create backup
dokku postgres:backup rabbithq-db backup-$(date +%Y%m%d)
```

## 🎯 Benefits of This Setup

### 🔒 Security

- **Enhanced Security**: Database traffic never leaves Hetzner's private infrastructure
- **Reduced Attack Surface**: Database not exposed to public internet
- **Firewall Isolation**: Only app server can access database

### ⚡ Performance

- **Lower Latency**: Private network provides better performance than public internet
- **Higher Throughput**: Direct server-to-server communication
- **No Internet Routing**: Traffic stays within Hetzner's network

### 💰 Cost Efficiency

- **Free Private Traffic**: No bandwidth charges for private network communication
- **Optimized Resources**: Efficient use of server resources

### 🔧 Scalability

- **Room to Grow**: /16 network provides 65,536 addresses
- **Subnet Organization**: Easy to add new server groups
- **Future-Proof**: Architecture supports expansion

## 🆚 Comparison with Staging

| Feature             | Production                 | Staging              |
| ------------------- | -------------------------- | -------------------- |
| **Networking**      | Private network (10.0.0.x) | Public IPs only      |
| **Server Size**     | cpx31 (larger)             | cpx21 (smaller)      |
| **Database Access** | Private network only       | Public IP allowed    |
| **Security**        | Enhanced firewall rules    | Basic configuration  |
| **Domains**         | qarote.io + www          | staging.qarote.io  |
| **Credentials**     | GitHub secrets             | Direct configuration |

## 🚨 Important Notes

1. **DATABASE_URL Security**: Never commit database credentials to code
2. **GitHub Secrets**: Always use secrets for sensitive configuration
3. **Private Network**: Database is only accessible via private network
4. **Backup Strategy**: Regular database backups are essential
5. **Monitoring**: Consider adding monitoring for production workloads

## 📞 Troubleshooting

### Common Issues

#### Private Network Connectivity

```bash
# Check if private interface is configured
ip addr show eth1

# Test connectivity between servers
ping 10.0.0.10  # From app server
ping 10.0.0.20  # From database server
```

#### Database Connection Issues

```bash
# Check PostgreSQL is listening on private IP
sudo netstat -tlnp | grep :5432

# Verify pg_hba.conf configuration
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep 10.0.0
```

#### Dokku Issues

```bash
# Check Dokku database status
dokku postgres:info rabbithq-db

# Restart database if needed
dokku postgres:restart rabbithq-db
```

This setup provides a robust, secure, and scalable foundation for your production RabbitHQ deployment! 🚀
