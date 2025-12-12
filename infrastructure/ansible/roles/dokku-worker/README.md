# Dokku Worker Role

This Ansible role manages the creation and configuration of Dokku worker apps for alert monitoring.

## Variables

- `backend_app_name`: Name of the backend Dokku app to copy config from (required)
- `worker_app_name`: Name of the worker Dokku app to create (required)
- `create_worker_app`: Whether to create the worker app (default: true)
- `worker_start_command`: Start command for the worker process (default: "npm run start:alert")

## Usage

```yaml
- hosts: staging-dokku
  roles:
    - role: dokku-worker
      vars:
        backend_app_name: rabbithq-backend-staging
        worker_app_name: rabbithq-worker-staging
```
