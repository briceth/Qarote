# Ansible Configuration for RabbitHQ

This directory contains Ansible playbooks and roles for managing application configuration on Dokku servers.

## Structure

```
ansible/
├── ansible.cfg              # Ansible configuration
├── inventory.yml            # Inventory file for staging/production
├── group_vars/              # Environment-specific variables
│   ├── staging.yml
│   └── production.yml
├── playbooks/               # Ansible playbooks
│   └── dokku-worker.yml     # Dokku worker app management
└── roles/                   # Reusable Ansible roles
    └── dokku-worker/        # Role for managing Dokku worker apps
```

## Prerequisites

1. **Ansible installed** (>= 2.9)

   ```bash
   pip install ansible
   # or
   brew install ansible
   ```

2. **SSH access** to Dokku servers
   - SSH key configured
   - Access to `dokku` user

3. **Dokku CLI** installed on target servers (already installed via server setup)

## Quick Start

### 1. Set up inventory

Edit `inventory.yml` or set environment variables:

```bash
export staging_dokku_host="your-staging-server-ip"
export production_dokku_host="your-production-server-ip"
```

Or use `group_vars/staging.yml` and `group_vars/production.yml`.

### 2. Create Dokku worker app

**For staging:**

```bash
cd infrastructure/ansible
ansible-playbook playbooks/dokku-worker.yml \
  -e target_environment=staging \
  -e staging_dokku_host=your-staging-ip
```

**For production:**

```bash
ansible-playbook playbooks/dokku-worker.yml \
  -e target_environment=production \
  -e production_dokku_host=your-production-ip
```

### 3. Using the role directly

```bash
ansible-playbook -i inventory.yml \
  -e target_environment=staging \
  -e staging_dokku_host=your-staging-ip \
  playbooks/dokku-worker.yml
```

## Playbooks

### dokku-worker.yml

Creates and configures a Dokku worker app for alert monitoring.

**What it does:**

1. Checks if backend app exists
2. Creates worker app (if it doesn't exist)
3. Exports config from backend app
4. Imports config to worker app
5. Sets start command for worker process

**Variables:**

- `target_environment`: Environment to target (staging/production)
- `backend_app_name`: Backend app name (auto-set from inventory)
- `worker_app_name`: Worker app name (auto-set from inventory)
- `worker_start_command`: Start command (default: "npm run start:alert")
- `create_worker_app`: Whether to create app (default: true)

## Roles

### dokku-worker

Reusable role for managing Dokku worker apps.

**Usage:**

```yaml
- hosts: staging-dokku
  roles:
    - role: dokku-worker
      vars:
        backend_app_name: rabbithq-backend-staging
        worker_app_name: qarote-worker-staging
```

## Environment Variables

You can override variables via environment or command line:

```bash
# Via command line
ansible-playbook playbooks/dokku-worker.yml \
  -e staging_dokku_host=1.2.3.4 \
  -e ssh_key_path=~/.ssh/id_rsa_deploy

# Via environment file
export staging_dokku_host=1.2.3.4
export ssh_key_path=~/.ssh/id_rsa_deploy
ansible-playbook playbooks/dokku-worker.yml -e target_environment=staging
```

## Integration with Terraform

This Ansible setup is designed to work alongside Terraform:

- **Terraform**: Manages infrastructure (servers, networks, firewalls, load balancers)
- **Ansible**: Manages application configuration (Dokku apps, app settings, deployments)

**Typical workflow:**

1. Use Terraform to provision infrastructure
2. Use Ansible to configure applications on that infrastructure
3. Use Ansible for ongoing application management

## Troubleshooting

### SSH Connection Issues

```bash
# Test SSH connection
ssh dokku@your-server-ip "dokku apps:list"

# Use verbose mode
ansible-playbook playbooks/dokku-worker.yml \
  -e target_environment=staging \
  -vvv
```

### App Already Exists

The playbook is idempotent - it's safe to run multiple times. If the app already exists, it will:

- Skip app creation
- Update config if backend config changed
- Update start command if needed

### Config Import Fails

If config import fails, check:

1. Backend app exists and has config
2. Worker app exists
3. SSH access is working

```bash
# Manually test
ssh dokku@your-server "dokku config:export rabbithq-backend-staging"
```

## Best Practices

1. **Use inventory variables** for environment-specific settings
2. **Run in check mode first**: `ansible-playbook --check`
3. **Use version control** for playbooks and roles
4. **Test in staging** before production
5. **Keep playbooks idempotent** (safe to run multiple times)

## Next Steps

After creating the worker app:

1. Deploy your application code to the worker app
2. Scale the worker process: `dokku ps:scale qarote-worker-staging worker=1`
3. Monitor logs: `dokku logs qarote-worker-staging`
