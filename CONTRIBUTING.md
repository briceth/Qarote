# Contributing to Qarote

Thank you for your interest in contributing to Qarote! We welcome contributions from the community.

## Feedback, Advice, and General Help

If you're looking to provide general feedback, get help, or ask questions, please utilize [GitHub Discussions](https://github.com/your-org/qarote/discussions) rather than GitHub Issues.

For Enterprise Edition support, please contact [support@qarote.io](mailto:support@qarote.io) or use the [Customer Portal](https://portal.qarote.io).

## Contributing to Qarote

Want to contribute to this repository? Follow the development documentation below.

### Prerequisites

- **Node.js**: 24.x or higher
- **pnpm**: 9.0.0 or higher (we use pnpm for package management)
- **Docker & Docker Compose**: For running local services (PostgreSQL, RabbitMQ)
- **Git**: For version control

### Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-org/qarote.git
   cd qarote
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   ```bash
   # Copy example environment files
   cp .env.selfhosted.example .env

   # Edit .env and set required variables
   # For development, use DEPLOYMENT_MODE=community
   ```

4. **Start local services (PostgreSQL, RabbitMQ):**

   ```bash
   docker-compose up -d
   ```

5. **Run database migrations:**

   ```bash
   cd apps/api
   pnpm run db:migrate:dev
   ```

6. **Start development servers:**

   ```bash
   # From project root
   pnpm run dev

   # Or start individual services:
   pnpm run dev:api    # Backend API (port 3000)
   pnpm run dev:app    # Frontend app (port 8080)
   ```

### Project Structure

```
qarote/
├── apps/
│   ├── api/          # Backend API (Hono.js, tRPC, Prisma)
│   ├── app/          # Main frontend application (React, Vite)
│   ├── web/          # Landing page
│   └── portal/       # Customer portal
├── docs/             # Documentation
├── docker/           # Docker configurations
└── scripts/          # Utility scripts
```

### Making Changes

1. **Create a branch:**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** and test locally

3. **Run linting and type checking:**

   ```bash
   pnpm run lint
   pnpm run type-check
   ```

4. **Commit your changes:**

   ```bash
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a Pull Request:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- We use ESLint and Prettier for code formatting
- TypeScript strict mode is enabled
- Follow existing code patterns and conventions
- Write meaningful commit messages (conventional commits preferred)

### Testing

- Run tests: `pnpm run test`
- Type checking: `pnpm run type-check`
- Linting: `pnpm run lint`

### Open-Core Model

Qarote follows an open-core business model:

- **Community Edition**: Open-source (MIT license) - all code is public
- **Enterprise Edition**: Licensed features - some code may be in private repositories

When contributing:

- Community Edition features: Contribute directly to this repository
- Enterprise Edition features: Contact us first to discuss contribution options

### Reporting Issues

Please use our [GitHub Issue Templates](https://github.com/your-org/qarote/issues/new/choose):

- 🐛 Bug Report
- ✨ Feature Request
- 💬 Support Question
- ⚙️ Deployment/Configuration Issue
- 🔒 Security Vulnerability (email security@qarote.io instead)

### Security

**Please do not create public issues for security vulnerabilities.**

Instead, email **security@qarote.io** with:

- A detailed description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Suggested fix (if you have one)

### Questions?

- **General questions**: [GitHub Discussions](https://github.com/your-org/qarote/discussions)
- **Enterprise support**: [support@qarote.io](mailto:support@qarote.io)
- **Security issues**: [security@qarote.io](mailto:security@qarote.io)

Thank you for contributing to Qarote! 🎉
