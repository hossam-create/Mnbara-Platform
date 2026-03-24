# Development Environment Setup Guide

This guide walks you through setting up the development environment for the Mnbara Platform monorepo.

## Prerequisites

### System Requirements
- **Operating System:** Windows, macOS, or Linux
- **Node.js:** 20.0.0 or higher
- **npm:** 10.0.0 or higher
- **Git:** Latest stable version
- **RAM:** Minimum 8GB (16GB recommended)
- **Disk Space:** Minimum 10GB free space

### Verify Prerequisites

Check your current versions:

```bash
node --version    # Should be v20.0.0 or higher
npm --version     # Should be 10.0.0 or higher
git --version     # Should be latest stable
```

If you need to upgrade:
- **Node.js:** Download from https://nodejs.org/ (LTS version 20+)
- **npm:** Run `npm install -g npm@latest`
- **Git:** Download from https://git-scm.com/

## Quick Start

### Option 1: Automated Setup (Recommended)

#### On macOS/Linux:
```bash
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

#### On Windows:
```cmd
scripts\dev-setup.bat
```

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   ```

3. **Update Configuration**
   Edit `.env` with your local settings (see Configuration section below)

4. **Verify Setup**
   ```bash
   nx list
   ```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and update the following variables:

```bash
# Node Environment
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://mnbara:password@localhost:5432/mnbara_dev
REDIS_URL=redis://localhost:6379

# API Configuration
API_PORT=3000
API_HOST=localhost
API_BASE_URL=http://localhost:3000

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=24h

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
PRODUCT_SERVICE_URL=http://localhost:3003
ORDER_SERVICE_URL=http://localhost:3004
PAYMENT_SERVICE_URL=http://localhost:3005
NOTIFICATION_SERVICE_URL=http://localhost:3006

# External Services (optional for development)
STRIPE_SECRET_KEY=sk_test_your_key_here
SENDGRID_API_KEY=your_sendgrid_key_here

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Feature Flags
ENABLE_MOCK_PAYMENTS=true
ENABLE_DEBUG_ENDPOINTS=true
```

### IDE Configuration

#### VS Code

1. **Install Recommended Extensions**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "Mnbara" or install from `.vscode/extensions.json`
   - Recommended extensions:
     - Prettier - Code formatter
     - ESLint
     - Nx Console
     - TypeScript Vue Plugin
     - GitLens

2. **Workspace Settings**
   - Settings are automatically configured in `.vscode/settings.json`
   - Auto-formatting on save is enabled
   - ESLint auto-fix on save is enabled

3. **Debug Configuration**
   - Debug configurations are available in `.vscode/launch.json`
   - Press F5 to start debugging
   - Available debug targets:
     - Launch Auth Service
     - Launch User Service
     - Launch Product Service
     - Launch Order Service
     - Launch Payment Service

#### Other IDEs

- **WebStorm/IntelliJ:** Import project as Nx workspace
- **Vim/Neovim:** Use LSP with TypeScript support
- **Sublime Text:** Install TypeScript plugin

## Development Workflow

### Common Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build specific package
nx build @mnbara/types

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Start development servers
npm run dev

# Start specific service
npm run dev:auth-service
npm run dev:user-service
npm run dev:product-service
npm run dev:order-service
npm run dev:payment-service

# View Nx graph
nx graph

# Run affected commands
nx affected --target=build
nx affected --target=test
```

### Project Structure

```
mnbara-platform/
├── apps/                          # Applications
│   ├── web/                       # Web application (React + Vite)
│   └── mobile/                    # Mobile application (React Native)
├── services/                      # Microservices
│   ├── core/                      # Core services
│   │   ├── auth-service/
│   │   ├── user-service/
│   │   └── notification-service/
│   ├── marketplace/               # E-commerce services
│   │   ├── product-service/
│   │   ├── order-service/
│   │   └── cart-service/
│   ├── crowdshipping/             # Delivery services
│   │   ├── trips-service/
│   │   └── matching-service/
│   └── financial/                 # Financial services
│       ├── payment-service/
│       ├── wallet-service/
│       ├── escrow-service/
│       └── settlement-service/
├── packages/                      # Shared packages
│   ├── @mnbara/types/            # TypeScript types
│   ├── @mnbara/ui-components/    # React components
│   ├── @mnbara/utils/            # Utilities
│   ├── @mnbara/api-client/       # API client
│   └── @mnbara/validation/       # Validation schemas
├── infrastructure/                # Infrastructure as Code
├── docs/                          # Documentation
└── scripts/                       # Development scripts
```

## Database Setup

### PostgreSQL

1. **Install PostgreSQL**
   - Download from https://www.postgresql.org/download/
   - Follow installation instructions for your OS

2. **Create Development Database**
   ```bash
   createdb mnbara_dev
   createuser mnbara --password
   ```

3. **Run Migrations**
   ```bash
   npm run migrate:dev
   ```

### Redis

1. **Install Redis**
   - macOS: `brew install redis`
   - Windows: Download from https://github.com/microsoftarchive/redis/releases
   - Linux: `sudo apt-get install redis-server`

2. **Start Redis**
   ```bash
   redis-server
   ```

## Docker Setup (Alternative)

If you prefer to use Docker:

```bash
# Start all services with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## Troubleshooting

### Issue: Node modules not found

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Nx command not found

**Solution:**
```bash
npm install -g nx
# or use npx
npx nx --version
```

### Issue: Port already in use

**Solution:**
```bash
# Find process using port (macOS/Linux)
lsof -i :3000

# Find process using port (Windows)
netstat -ano | findstr :3000

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Issue: Database connection failed

**Solution:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL in .env
3. Verify database exists: `psql -l`
4. Check credentials are correct

### Issue: TypeScript errors

**Solution:**
```bash
# Rebuild TypeScript
npm run build

# Check for type errors
npx tsc --noEmit
```

## Performance Tips

1. **Use Nx Caching**
   - Nx automatically caches build artifacts
   - Use `nx affected` to only build changed packages

2. **Enable Nx Cloud** (Optional)
   - Sign up at https://nx.app
   - Run `nx connect-to-cloud`
   - Enables distributed caching

3. **Use Watch Mode**
   - `npm run test:watch` for continuous testing
   - `npm run dev` for continuous development

4. **Parallel Builds**
   - Nx automatically parallelizes builds
   - Use `nx run-many --target=build --all --parallel`

## Next Steps

1. **Read the Architecture Guide**
   - See `docs/architecture/NEW_STRUCTURE.md`

2. **Explore the Codebase**
   - Start with `packages/@mnbara/types`
   - Then explore `services/core/auth-service`

3. **Run Tests**
   - `npm run test` to run all tests
   - `npm run test:watch` for watch mode

4. **Start Development**
   - `npm run dev` to start all services
   - Open http://localhost:3000 in your browser

## Getting Help

- **Documentation:** See `docs/` directory
- **Issues:** Check GitHub issues
- **Slack:** Join #development channel
- **Email:** dev-team@mnbara.com

## Additional Resources

- [Nx Documentation](https://nx.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated:** March 2, 2026  
**Version:** 1.0
