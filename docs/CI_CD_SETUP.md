# CI/CD Pipeline Setup - Phase 5

**Status:** Complete  
**Last Updated:** March 23, 2026

---

## Overview

This document describes the complete CI/CD pipeline for the Mnbara Platform monorepo using GitHub Actions, Docker, and Kubernetes.

---

## 1. GitHub Actions Workflows

### 1.1 Workflow Files

Location: `.github/workflows/`

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Main CI pipeline (lint, test, build) |
| `pr-check.yml` | PR | PR-specific checks |
| `docker.yml` | Push to main | Build and push Docker images |
| `deploy.yml` | Release | Deploy to production |
| `cd-deploy.yml` | Push to main | Continuous deployment |
| `security-scan.yml` | Push/PR | Security scanning (Gitleaks, npm audit) |
| `codeql.yml` | Push/PR | CodeQL analysis |
| `integration-tests.yml` | Push/PR | Integration test suite |
| `release.yml` | Manual | Create releases |

### 1.2 Main CI Pipeline (`ci.yml`)

**Triggers:**
- Push to: `main`, `develop`, `feature/*`, `release/*`
- Pull requests to: `main`, `develop`

**Jobs:**
1. `lint-and-format` - ESLint and Prettier checks
2. `backend-ci` - Backend service tests (matrix)
3. `recommendation-service-ci` - Python service tests
4. `frontend-web-ci` - Web app tests and build
5. `frontend-admin-ci` - Admin dashboard tests and build
6. `mobile-ci` - Mobile app tests
7. `contracts-ci` - Smart contract tests
8. `security-scan` - Security scanning
9. `docker-build` - Docker image builds (PR only)
10. `helm-validate` - Kubernetes Helm chart validation
11. `ci-summary` - Overall CI status

### 1.3 Job Dependencies

```
lint-and-format
├── backend-ci
├── recommendation-service-ci
├── frontend-web-ci
├── frontend-admin-ci
├── mobile-ci
├── contracts-ci
├── security-scan
├── docker-build
└── helm-validate
    └── ci-summary
```

---

## 2. Build Pipeline

### 2.1 Build Stages

```
Source Code
    ↓
Lint & Format Check
    ↓
Type Check (TypeScript)
    ↓
Unit Tests
    ↓
Integration Tests
    ↓
Build Artifacts
    ↓
Docker Build (optional)
    ↓
Helm Validation
    ↓
Deploy (if main branch)
```

### 2.2 Build Configuration

**Node.js Version:** 18 (configurable in `env.NODE_VERSION`)  
**Python Version:** 3.11 (for Python services)  
**Package Manager:** npm  
**Cache:** GitHub Actions cache for npm dependencies

### 2.3 Build Commands

```bash
# Lint
npm run lint

# Format check
npm run format:check

# Type check
npm run type-check

# Test
npm test

# Build
npm run build

# Build Docker image
docker build -t mnbarh/service:tag .
```

---

## 3. Testing Pipeline

### 3.1 Test Execution

**Unit Tests:**
```bash
npm test -- --run --coverage
```

**Integration Tests:**
```bash
npm run test:integration
```

**E2E Tests:**
```bash
npm run e2e
```

**Property-Based Tests:**
```bash
npm run test:property
```

### 3.2 Coverage Requirements

- **Lines:** 80%
- **Functions:** 80%
- **Branches:** 75%
- **Statements:** 80%

Coverage reports uploaded to Codecov.

### 3.3 Test Timeouts

- **Test timeout:** 30 seconds
- **Hook timeout:** 10 seconds
- **Teardown timeout:** 10 seconds

---

## 4. Security Pipeline

### 4.1 Security Checks

**Gitleaks:** Scans for hardcoded secrets
```bash
gitleaks detect --source . --verbose
```

**npm audit:** Checks for vulnerable dependencies
```bash
npm audit --audit-level=high
```

**CodeQL:** Static analysis for code vulnerabilities
- Runs on push and PR
- Analyzes TypeScript, JavaScript, Python

### 4.2 Security Scanning Workflow

```yaml
security-scan:
  - Gitleaks (secret detection)
  - npm audit (dependency vulnerabilities)
  - CodeQL (static analysis)
```

### 4.3 Handling Security Issues

1. **High severity:** Block merge
2. **Medium severity:** Require review
3. **Low severity:** Informational only

---

## 5. Docker Build Pipeline

### 5.1 Docker Build Trigger

- Runs on PR (build only, no push)
- Runs on push to main (build and push)

### 5.2 Services Built

- api-gateway
- auth-service
- auction-service
- payment-service
- (and others as configured)

### 5.3 Docker Build Configuration

```yaml
docker-build:
  context: backend/services/${{ matrix.service }}
  push: ${{ github.ref == 'refs/heads/main' }}
  tags: mnbarh/${{ matrix.service }}:${{ github.sha }}
  cache: GitHub Actions cache
```

### 5.4 Image Registry

**Registry:** Docker Hub (configurable)  
**Namespace:** `mnbarh/`  
**Tags:**
- `latest` - Latest main branch build
- `{sha}` - Specific commit SHA
- `{version}` - Release version

---

## 6. Deployment Pipeline

### 6.1 Deployment Triggers

**Continuous Deployment (cd-deploy.yml):**
- Trigger: Push to `main`
- Target: Development environment
- Auto-deploy: Yes

**Release Deployment (deploy.yml):**
- Trigger: Manual or release creation
- Target: Staging/Production
- Auto-deploy: No (requires approval)

### 6.2 Deployment Steps

```
1. Build Docker images
2. Push to registry
3. Update Helm values
4. Deploy to Kubernetes
5. Run smoke tests
6. Monitor deployment
```

### 6.3 Kubernetes Deployment

**Tool:** Helm  
**Charts:** `infrastructure/k8s/mnbarh/`  
**Environments:**
- Development: `values-dev.yaml`
- Staging: `values-staging.yaml`
- Production: `values-prod.yaml`

---

## 7. Helm Chart Validation

### 7.1 Helm Validation Steps

```bash
# Lint chart
helm lint infrastructure/k8s/mnbarh

# Template chart (dev)
helm template mnbarh infrastructure/k8s/mnbarh \
  -f infrastructure/k8s/mnbarh/values-dev.yaml

# Template chart (staging)
helm template mnbarh infrastructure/k8s/mnbarh \
  -f infrastructure/k8s/mnbarh/values-staging.yaml

# Template chart (prod)
helm template mnbarh infrastructure/k8s/mnbarh \
  -f infrastructure/k8s/mnbarh/values-prod.yaml
```

### 7.2 Helm Chart Structure

```
infrastructure/k8s/mnbarh/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-prod.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── ingress.yaml
└── charts/
    └── (dependencies)
```

---

## 8. Concurrency and Cancellation

### 8.1 Concurrency Configuration

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Effect:**
- Only one workflow runs per branch
- New pushes cancel previous runs
- Saves CI/CD resources

---

## 9. Artifacts and Caching

### 9.1 Build Artifacts

**Web App Build:**
```yaml
- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: web-build
    path: frontend/web/dist
    retention-days: 7
```

**Admin Dashboard Build:**
```yaml
- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: admin-build
    path: frontend/admin-dashboard/dist
    retention-days: 7
```

### 9.2 Dependency Caching

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 18
    cache: 'npm'
```

**Cache Key:** `npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}`

---

## 10. Environment Variables

### 10.1 Workflow Environment Variables

```yaml
env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'
  NODE_ENV: test  # For test jobs
```

### 10.2 Secrets Configuration

Required secrets in GitHub:
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password
- `CODECOV_TOKEN` - Codecov token
- `GITHUB_TOKEN` - Auto-provided by GitHub

### 10.3 Setting Secrets

```bash
# Via GitHub CLI
gh secret set DOCKER_USERNAME --body "username"
gh secret set DOCKER_PASSWORD --body "password"

# Via GitHub Web UI
Settings → Secrets and variables → Actions → New repository secret
```

---

## 11. Notifications and Reporting

### 11.1 CI Status Checks

All PRs require:
- ✅ `lint-and-format` - Pass
- ✅ `backend-ci` - Pass
- ✅ `frontend-web-ci` - Pass
- ✅ `security-scan` - Pass

### 11.2 Coverage Reports

Coverage uploaded to Codecov:
```yaml
- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    flags: ${{ matrix.service }}
    fail_ci_if_error: false
```

### 11.3 Failure Notifications

**On Failure:**
- PR check fails (blocks merge)
- Email notification sent
- Slack notification (if configured)

---

## 12. Local CI Simulation

### 12.1 Running Workflows Locally

Using `act` (GitHub Actions local runner):

```bash
# Install act
brew install act

# Run specific workflow
act -j lint-and-format

# Run all workflows
act

# Run with specific event
act pull_request
```

### 12.2 Manual Testing

```bash
# Lint
npm run lint

# Format check
npm run format:check

# Type check
npm run type-check

# Test
npm test

# Build
npm run build

# Docker build
docker build -t mnbarh/service:test .
```

---

## 13. Troubleshooting

### 13.1 Common Issues

**Issue:** Tests timeout in CI but pass locally
```
Solution: Increase timeout in vitest.config.ts
testTimeout: 60000 (60 seconds)
```

**Issue:** Cache not working
```
Solution: Clear cache in GitHub Actions settings
Settings → Actions → General → Caches → Clear all
```

**Issue:** Docker build fails
```
Solutio