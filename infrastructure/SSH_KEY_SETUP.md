# SSH Key Management for RabbitHQ Deployment

## Overview

RabbitHQ uses a dedicated SSH key for deployment operations to maintain security separation between personal and deployment access.

## SSH Key Structure

### Deployment Key: `id_rsa_deploy`

- **Purpose**: Dedicated key for RabbitHQ infrastructure deployment
- **Location**: `~/.ssh/id_rsa_deploy` (private) / `~/.ssh/id_rsa_deploy.pub` (public)
- **Passphrase**: None (passwordless for automated deployment)
- **Users**: Used by both `rabbithq` and `dokku` users on servers

### Personal Key: `id_rsa`

- **Purpose**: Your personal SSH key (not used by deployment scripts)
- **Location**: `~/.ssh/id_rsa` (private) / `~/.ssh/id_rsa.pub` (public)
- **Passphrase**: Should have a passphrase for security
- **Users**: Your personal access only

## Setup Instructions

### 1. Create Deployment Key

```bash
cd infrastructure/scripts/setup
bun run create-deploy-key.ts
```

This will:

- Create `~/.ssh/id_rsa_deploy` and `~/.ssh/id_rsa_deploy.pub`
- Display the public key for you to add to Hetzner Cloud
- Use a passwordless key for automated deployment

### 2. Add Public Key to Hetzner Cloud

1. Copy the public key displayed by the script
2. Go to [Hetzner Cloud Console](https://console.hetzner.cloud/)
3. Navigate to Security → SSH Keys
4. Click "Add SSH Key"
5. Paste the public key and name it `rabbithq-deployment`

### 3. Configure Server Users

For existing servers, run:

```bash
cd infrastructure/scripts/setup
bun run ssh-keys.ts <server-ip>
```

This will:

- Add the deployment key to both `rabbithq` and `dokku` users
- Test connections to both users
- Ensure proper permissions are set

## Usage

### Infrastructure Scripts

All infrastructure scripts automatically use `id_rsa_deploy`:

- Server provisioning
- Database setup
- Application deployment
- SSH connections to servers

### Manual SSH Access

```bash
# Connect as rabbithq user (for server management)
ssh -i ~/.ssh/id_rsa_deploy rabbithq@<server-ip>

# Connect as dokku user (for git operations)
ssh -i ~/.ssh/id_rsa_deploy dokku@<server-ip>
```

### Git Deployment

```bash
# Add dokku remote using deployment key
git remote add production dokku@<server-ip>:rabbithq

# Deploy (uses deployment key automatically)
git push production main
```

## Security Benefits

### 🔒 **Separation of Concerns**

- Personal key: Your individual access, with passphrase protection
- Deployment key: Automated operations, restricted to deployment tasks

### 🛡️ **Limited Scope**

- Deployment key only has access to specific users on specific servers
- Easy to rotate if compromised
- No access to personal repositories or systems

### 🔄 **Easy Rotation**

- Generate new deployment key
- Update Hetzner Cloud console
- Re-run setup scripts
- Old key becomes invalid immediately

## Troubleshooting

### Key Not Found Error

```
Error: File does not exist: /Users/username/.ssh/id_rsa_deploy
```

**Solution**: Run `bun run create-deploy-key.ts` to create the deployment key.

### Permission Denied

```
Permission denied (publickey)
```

**Solutions**:

1. Ensure deployment key is added to Hetzner Cloud
2. Run `bun run ssh-keys.ts <server-ip>` to configure server users
3. Check key permissions: `chmod 600 ~/.ssh/id_rsa_deploy`

### Connection Test Failed

```
Dokku user connection test failed
```

**Solutions**:

1. Wait a few seconds and try again (server may be processing)
2. Check if dokku service is running: `sudo systemctl status dokku`
3. Verify key was added properly to `/home/dokku/.ssh/authorized_keys`

## File Locations

```
~/.ssh/
├── id_rsa              # Personal key (not used by scripts)
├── id_rsa.pub          # Personal public key
├── id_rsa_deploy       # Deployment private key (used by scripts)
└── id_rsa_deploy.pub   # Deployment public key
```

## Best Practices

1. **Never share deployment keys**: Keep `id_rsa_deploy` secure
2. **Regular rotation**: Rotate deployment keys every 6-12 months
3. **Monitor usage**: Check server logs for unexpected SSH access
4. **Backup safely**: Store deployment key backup in secure location
5. **Principle of least privilege**: Deployment key only accesses what it needs

## Integration with Infrastructure

The deployment key is automatically used by:

- `hetzner.ts`: Server creation and management
- `ssh-keys.ts`: User setup and key distribution
- `servers-production.ts`: Production server provisioning
- All deployment and management scripts

No manual configuration needed - just ensure the key exists and is added to Hetzner Cloud.
