# Development Environment Checklist

Use this checklist to verify your development environment is properly configured.

## System Requirements

- [ ] Node.js 20.0.0 or higher installed
  - Verify: `node --version`
  - Should output: `v20.x.x` or higher

- [ ] npm 10.0.0 or higher installed
  - Verify: `npm --version`
  - Should output: `10.x.x` or higher

- [ ] Git installed
  - Verify: `git --version`
  - Should output: `git version x.x.x`

- [ ] 8GB RAM minimum (16GB recommended)
  - Check system settings

- [ ] 10GB free disk space
  - Check system settings

## Development Tools

- [ ] Nx CLI installed globally
  - Verify: `nx --version`
  - Install if needed: `npm install -g nx`

- [ ] Prettier installed
  - Verify: `npm list prettier`
  - Should be in devDependencies

- [ ] ESLint installed
  - Verify: `npm list eslint`
  - Should be in devDependencies

- [ ] TypeScript installed
  - Verify: `npm list typescript`
  - Should be in devDependencies

## Repository Setup

- [ ] Repository cloned
  - Verify: `git status`
  - Should show clean working directory

- [ ] Dependencies installed
  - Verify: `npm list` (should not show errors)
  - Run if needed: `npm install`

- [ ] .env file created
  - Verify: `ls -la .env` (macOS/Linux) or `dir .env` (Windows)
  - Create if needed: `cp .env.example .env`

- [ ] .env file configured
  - Check: DATABASE_URL is set
  - Check: JWT_SECRET is set
  - Check: API_PORT is set

## Configuration Files

- [ ] package.json exists
  - Verify: `cat package.json`

- [ ] tsconfig.json exists
  - Verify: `cat tsconfig.json`

- [ ] .eslintrc.json exists
  - Verify: `cat .eslintrc.json`

- [ ] .prettierrc exists
  - Verify: `cat .prettierrc`

- [ ] nx.json exists
  - Verify: `cat nx.json`

- [ ] .env.example exists
  - Verify: `cat .env.example`

## Directory Structure

- [ ] apps/ directory exists
  - Verify: `ls apps/`

- [ ] services/ directory exists
  - Verify: `ls services/`

- [ ] packages/ directory exists
  - Verify: `ls packages/`

- [ ] infrastructure/ directory exists
  - Verify: `ls infrastructure/`

- [ ] docs/ directory exists
  - Verify: `ls docs/`

- [ ] scripts/ directory exists
  - Verify: `ls scripts/`

## IDE Setup (VS Code)

- [ ] VS Code installed
  - Download: https://code.visualstudio.com/

- [ ] Prettier extension installed
  - ID: `esbenp.prettier-vscode`

- [ ] ESLint extension installed
  - ID: `dbaeumer.vscode-eslint`

- [ ] Nx Console extension installed
  - ID: `nrwl.nx-console`

- [ ] TypeScript Vue Plugin installed
  - ID: `Vue.vscode-typescript-vue-plugin`

- [ ] GitLens extension installed
  - ID: `eamodio.gitlens`

- [ ] .vscode/settings.json configured
  - Verify: `cat .vscode/settings.json`

- [ ] .vscode/launch.json configured
  - Verify: `cat .vscode/launch.json`

- [ ] .vscode/tasks.json configured
  - Verify: `cat .vscode/tasks.json`

## Database Setup

- [ ] PostgreSQL installed
  - Verify: `psql --version`

- [ ] PostgreSQL running
  - Verify: `psql -U postgres -c "SELECT version();"`

- [ ] Development database created
  - Verify: `psql -l | grep mnbara_dev`

- [ ] Database user created
  - Verify: `psql -U postgres -c "\du" | grep mnbara`

- [ ] Redis installed
  - Verify: `redis-cli --version`

- [ ] Redis running
  - Verify: `redis-cli ping` (should output PONG)

## Build & Test

- [ ] npm install succeeds
  - Run: `npm install`
  - Should complete without errors

- [ ] npm run build succeeds
  - Run: `npm run build`
  - Should complete without errors

- [ ] npm run test succeeds
  - Run: `npm run test`
  - Should complete without errors

- [ ] npm run lint succeeds
  - Run: `npm run lint`
  - Should complete without errors

- [ ] npm run format succeeds
  - Run: `npm run format`
  - Should complete without errors

## Verification Commands

Run these commands to verify everything is working:

```bash
# Check versions
node --version
npm --version
git --version
nx --version

# Check dependencies
npm list

# Check configuration
cat package.json
cat tsconfig.json
cat .eslintrc.json
cat .prettierrc
cat nx.json

# Check directory structure
ls -la apps/
ls -la services/
ls -la packages/
ls -la infrastructure/
ls -la docs/
ls -la scripts/

# Check environment
cat .env

# Run build
npm run build

# Run tests
npm run test

# Run linter
npm run lint

# Check Nx workspace
nx list
nx graph
```

## Troubleshooting

### Node.js not found
- Download from https://nodejs.org/
- Install LTS version (20+)
- Restart terminal after installation

### npm not found
- Usually installed with Node.js
- Try: `npm install -g npm@latest`

### Dependencies not installing
- Clear cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules`
- Reinstall: `npm install`

### Port already in use
- Find process: `lsof -i :3000` (macOS/Linux)
- Kill process: `kill -9 <PID>`
- Or use different port in .env

### Database connection failed
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `psql -l`

### TypeScript errors
- Clear cache: `rm -rf dist .nx/cache`
- Rebuild: `npm run build`
- Check: `npx tsc --noEmit`

## Next Steps

1. **Complete this checklist**
   - Go through each item
   - Verify or fix as needed

2. **Read documentation**
   - [DEVELOPMENT_SETUP.md](../DEVELOPMENT_SETUP.md)
   - [DEVELOPMENT_SCRIPTS.md](./DEVELOPMENT_SCRIPTS.md)
   - [IDE_SETUP.md](./IDE_SETUP.md)

3. **Start development**
   - `npm run dev` to start services
   - `npm run test:watch` to run tests
   - Open http://localhost:3000 in browser

4. **Explore the codebase**
   - Start with `packages/@mnbara/types`
   - Then explore `services/core/auth-service`
   - Check `apps/web` for frontend

## Support

- **Documentation:** See `docs/` directory
- **Issues:** Check GitHub issues
- **Slack:** Join #development channel
- **Email:** dev-team@mnbara.com

---

**Last Updated:** March 2, 2026  
**Version:** 1.0
