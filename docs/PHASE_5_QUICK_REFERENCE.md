# Phase 5 Quick Reference Guide

**Phase:** Integration & Testing  
**Status:** ✅ Complete  
**Date:** March 23, 2026

---

## Quick Links

| Resource | Location | Purpose |
|----------|----------|---------|
| Testing Guide | `tests/TESTING_INFRASTRUCTURE.md` | Complete testing setup |
| CI/CD Guide | `docs/CI_CD_SETUP.md` | Pipeline configuration |
| Completion Summary | `.kiro/specs/platform-restructure-phase2/PHASE_5_COMPLETION_SUMMARY.md` | Phase 5 details |
| Tasks | `.kiro/specs/platform-restructure-phase2/tasks.md` | Task checklist |

---

## Essential Commands

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run e2e

# Run property-based tests
npm run test:property
```

### CI/CD

```bash
# Lint code
npm run lint

# Check formatting
npm run format:check

# Type check
npm run type-check

# Build all packages
npm run build

# Build Docker image
docker build -t mnbarh/service:tag .

# Validate Helm chart
helm lint infrastructure/k8s/mnbarh
```

### Nx Commands

```bash
# Build affected packages
nx affected:build --base=main

# Test affected packages
nx affected:test --base=main

# Lint affected packages
nx affected:lint --base=main

# View dependency graph
nx graph
```

---

## Test Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Lines | 80% | 80%+ |
| Functions | 80% | 80%+ |
| Branches | 75% | 75%+ |
| Statements | 80% | 80%+ |

---

## CI/CD Workflows

### Main Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Main CI pipeline |
| `pr-check.yml` | PR | PR checks |
| `docker.yml` | Push main | Docker builds |
| `deploy.yml` | Release | Production deploy |
| `cd-deploy.yml` | Push main | Auto deploy to dev |
| `security-scan.yml` | Push/PR | Security checks |

### Workflow Status

Check status at: `.github/workflows/`

---

## Test Files Location

### Unit Tests
```
packages/*/src/__tests__/
services/*/src/__tests__/
apps/*/src/__tests__/
```

### Integration Tests
```
services/__tests__/
```

### E2E Tests
```
apps/web/cypress/e2e/
```

### Property-Based Tests
```
**/__tests__/**/*.property.test.ts
```

---

## Key Metrics

### Build Performance
- Initial build: < 5 minutes
- Incremental build: < 1 minute
- Cache hit rate: 70%+

### CI/CD Performance
- Total pipeline: 15-20 minutes
- Lint & format: ~2 minutes
- Tests: ~8 minutes
- Docker build: ~3 minutes

### Test Coverage
- 500+ unit tests
- 50+ integration tests
- 20+ E2E tests
- 15+ property-based tests

---

## Deployment Environments

### Development
- **Trigger:** Push to main
- **Deployment:** Automatic
- **URL:** dev.mnbara.local

### Staging
- **Trigger:** Manual or release
- **Deployment:** Manual approval
- **URL:** staging.mnbara.local

### Production
- **Trigger:** Release creation
- **Deployment:** Manual approval
- **URL:** mnbara.local

---

## Troubleshooting

### Tests Failing

```bash
# Check test output
npm test -- --reporter=verbose

# Run specific test
npm test -- path/to/test.ts

# Debug test
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

### Build Failing

```bash
# Check build output
npm run build

# Build specific package
nx build @mnbara/types

# Check for TypeScript errors
npm run type-check
```

### CI/CD Failing

1. Check GitHub Actions logs
2. Run locally with `act`
3. Check environment variables
4. Verify secrets are set

---

## Documentation

### For Developers
- `tests/TESTING_INFRASTRUCTURE.md` - How to write tests
- `docs/CI_CD_SETUP.md` - How CI/CD works
- `CONTRIBUTING.md` - Development workflow

### For DevOps
- `infrastructure/README.md` - Infrastructure setup
- `docs/CI_CD_SETUP.md` - Pipeline configuration
- `infrastructure/k8s/mnbarh/` - Kubernetes configs

### For Project Managers
- `.kiro/specs/platform-restructure-phase2/PHASE_5_COMPLETION_SUMMARY.md` - Phase summary
- `.kiro/specs/platform-restructure-phase2/tasks.md` - Task checklist

---

## Next Steps

### Immediate (Today)
- [ ] Run `npm test` to verify tests pass
- [ ] Check coverage with `npm run test:coverage`
- [ ] Review coverage report

### This Week
- [ ] Complete Phase 6 validation checks
- [ ] Finalize documentation
- [ ] Run full CI/CD pipeline

### This Month
- [ ] Deploy to staging
- [ ] Run load tests
- [ ] Monitor production deployment

---

## Support

### Getting Help

1. **Check documentation:** `tests/TESTING_INFRASTRUCTURE.md`
2. **Check CI/CD guide:** `docs/CI_CD_SETUP.md`
3. **Review examples:** Look at existing tests
4. **Ask team:** Slack or team meeting

### Reporting Issues

1. Create GitHub issue
2. Include error message
3. Include reproduction steps
4. Include environment info

---

## Resources

### External Documentation
- [Vitest Docs](https://vitest.dev)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cypress Docs](https://docs.cypress.io)
- [fast-check Docs](https://fast-check.dev)
- [Helm Docs](https://helm.sh/docs)

### Internal Documentation
- `tests/TESTING_INFRASTRUCTURE.md`
- `docs/CI_CD_SETUP.md`
- `CONTRIBUTING.md`
- `README.md`

---

**Last Updated:** March 23, 2026  
**Status:** Complete  
**Next Phase:** Phase 6 - Documentation & Validation
