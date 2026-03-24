# Development Scripts Reference

This document describes all available development scripts for the Mnbara Platform monorepo.

## Setup Scripts

### `npm run setup`
Runs the setup wizard to initialize the development environment.

```bash
npm run setup
```

### `npm run setup:dev` (macOS/Linux)
Automated setup script for Unix-like systems.

```bash
npm run setup:dev
```

### `npm run setup:dev:win` (Windows)
Automated setup script for Windows.

```bash
npm run setup:dev:win
```

## Build Scripts

### `npm run build`
Builds all packages and applications in the monorepo.

```bash
npm run build
```

### `npm run build:affected`
Builds only packages that have been modified since the last build.

```bash
npm run build:affected
```

## Testing Scripts

### `npm run test`
Runs all tests in the monorepo (single run).

```bash
npm run test
```

### `npm run test:affected`
Runs tests only for packages that have been modified.

```bash
npm run test:affected
```

### `npm run test:watch`
Runs all tests in watch mode (re-runs on file changes).

```bash
npm run test:watch
```

## Linting & Formatting

### `npm run lint`
Runs ESLint on all packages to check for code quality issues.

```bash
npm run lint
```

### `npm run lint:affected`
Runs ESLint only on modified packages.

```bash
npm run lint:affected
```

### `npm run format`
Formats all code using Prettier.

```bash
npm run format
```

### `npm run format:check`
Checks if code is formatted correctly without making changes.

```bash
npm run format:check
```

## Development Servers

### `npm run dev`
Starts all development servers in parallel.

```bash
npm run dev
```

### Service-Specific Development Servers

Start individual services:

```bash
# Core Services
npm run dev:auth-service
npm run dev:user-service
npm run dev:notification-service

# Marketplace Services
npm run dev:product-service
npm run dev:order-service
npm run dev:cart-service

# Financial Services
npm run dev:payment-service
npm run dev:wallet-service

# Crowdshipping Services
npm run dev:trips-service
npm run dev:matching-service

# Applications
npm run dev:web
npm run dev:mobile
```

## Visualization & Analysis

### `npm run graph`
Opens the Nx project graph visualization in your browser.

```bash
npm run graph
```

### `npm run graph:affected`
Shows the dependency graph for affected packages.

```bash
npm run graph:affected
```

## Database Scripts

### `npm run migrate:dev`
Runs database migrations in development mode.

```bash
npm run migrate:dev
```

### `npm run migrate:deploy`
Runs database migrations in production mode.

```bash
npm run migrate:deploy
```

### `npm run migrate:reset`
Resets the database and re-runs all migrations.

```bash
npm run migrate:reset
```

### `npm run db:seed`
Seeds the database with initial data.

```bash
npm run db:seed
```

### `npm run db:studio`
Opens Prisma Studio for visual database management.

```bash
npm run db:studio
```

## Legacy Scripts

These scripts are maintained for backward compatibility with the existing codebase:

### `npm run start`
Starts the legacy frontend web application.

```bash
npm run start
```

### `npm run dev:frontend`
Starts the legacy frontend in development mode.

```bash
npm run dev:frontend
```

### `npm run build:frontend`
Builds the legacy frontend application.

```bash
npm run build:frontend
```

### `npm run preview:frontend`
Previews the built legacy frontend.

```bash
npm run preview:frontend
```

### `npm run setup:db`
Sets up databases (legacy script).

```bash
npm run setup:db
```

### `npm run setup:db:win`
Sets up databases on Windows (legacy script).

```bash
npm run setup:db:win
```

### `npm run start:mvp`
Starts the MVP environment (legacy script).

```bash
npm run start:mvp
```

### `npm run start:mvp:win`
Starts the MVP environment on Windows (legacy script).

```bash
npm run start:mvp:win
```

### `npm run verify`
Verifies all services are running (legacy script).

```bash
npm run verify
```

### `npm run verify:win`
Verifies all services on Windows (legacy script).

```bash
npm run verify:win
```

### `npm run test:integration`
Runs integration tests (legacy script).

```bash
npm run test:integration
```

### `npm run test:all`
Runs all tests (legacy script).

```bash
npm run test:all
```

## Common Workflows

### Initial Setup
```bash
npm run setup:dev
npm run build
npm run test
```

### Daily Development
```bash
npm run dev
# In another terminal:
npm run test:watch
```

### Before Committing
```bash
npm run format
npm run lint
npm run test
```

### Debugging a Service
```bash
# Terminal 1: Start the service
npm run dev:auth-service

# Terminal 2: Run tests in watch mode
npm run test:watch

# Terminal 3: Open VS Code debugger (F5)
```

### Checking What Changed
```bash
npm run graph:affected
npm run build:affected
npm run test:affected
```

### Database Management
```bash
# Create a new migration
npm run migrate:dev

# View database in UI
npm run db:studio

# Seed with test data
npm run db:seed
```

## Troubleshooting

### Script not found
If you get "command not found", try:
```bash
npm install
```

### Port already in use
If a port is already in use, find and kill the process:
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Build failures
Clear cache and rebuild:
```bash
rm -rf dist .nx/cache
npm run build
```

### Test failures
Run tests in verbose mode:
```bash
npm run test -- --reporter=verbose
```

## Performance Tips

1. **Use affected commands** to only build/test changed packages
2. **Use watch mode** for continuous development
3. **Enable Nx Cloud** for distributed caching
4. **Run services in parallel** with `npm run dev`

## Next Steps

- Read [DEVELOPMENT_SETUP.md](../DEVELOPMENT_SETUP.md) for environment setup
- Check [Architecture Guide](./architecture/NEW_STRUCTURE.md) for project structure
- Review individual package READMEs for specific development instructions

---

**Last Updated:** March 2, 2026  
**Version:** 1.0
