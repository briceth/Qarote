.PHONY: help worker-staging worker-production check-staging check-production

help:
	@echo "Ansible Makefile for Qarote"
	@echo ""
	@echo "Available targets:"
	@echo "  worker-staging      - Create/update worker app in staging"
	@echo "  worker-production   - Create/update worker app in production"
	@echo "  check-staging       - Check staging without making changes"
	@echo "  check-production    - Check production without making changes"
	@echo ""
	@echo "Environment variables:"
	@echo "  STAGING_DOKKU_HOST  - Staging server IP/hostname"
	@echo "  PRODUCTION_DOKKU_HOST - Production server IP/hostname"
	@echo "  SSH_KEY_PATH        - Path to SSH key (default: ~/.ssh/id_rsa)"

worker-staging:
	ansible-playbook playbooks/dokku-worker.yml \
		-e target_environment=staging \
		-e staging_dokku_host=$(or $(STAGING_DOKKU_HOST),5.75.164.253) \
		-e ssh_key_path=$(or $(SSH_KEY_PATH),~/.ssh/id_rsa)

worker-production:
	ansible-playbook playbooks/dokku-worker.yml \
		-e target_environment=production \
		-e production_dokku_host=$(or $(PRODUCTION_DOKKU_HOST),91.98.26.169) \
		-e ssh_key_path=$(or $(SSH_KEY_PATH),~/.ssh/id_rsa)

check-staging:
	ansible-playbook playbooks/dokku-worker.yml \
		--check \
		-e target_environment=staging \
		-e staging_dokku_host=$(or $(STAGING_DOKKU_HOST),5.75.164.253) \
		-e ssh_key_path=$(or $(SSH_KEY_PATH),~/.ssh/id_rsa)

check-production:
	ansible-playbook playbooks/dokku-worker.yml \
		--check \
		-e target_environment=production \
		-e production_dokku_host=$(or $(PRODUCTION_DOKKU_HOST),91.98.26.169) \
		-e ssh_key_path=$(or $(SSH_KEY_PATH),~/.ssh/id_rsa)
