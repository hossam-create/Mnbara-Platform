# mnbarh Platform - Action Plan

# ط®ط·ط© ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¹ظ…ظ„ظٹط© - ط£ظˆظ„ 7 ظ…ظ‡ط§ظ…

---

## ًں“‹ Overview - ظ†ط¸ط±ط© ط¹ط§ظ…ط©

ظ‡ط°ظ‡ ط§ظ„ط®ط·ط© طھط­طھظˆظٹ ط¹ظ„ظ‰ ط£ظˆظ„ 7 ظ…ظ‡ط§ظ… ط£ط³ط§ط³ظٹط© ظ„طھط¬ظ‡ظٹط² ظ…ط´ط±ظˆط¹ mnbarh ظ„ظ„ط¥ظ†طھط§ط¬. ظƒظ„ ظ…ظ‡ظ…ط© طھط­طھظˆظٹ ط¹ظ„ظ‰ ظ…ط¹ط§ظٹظٹط± ظ‚ط¨ظˆظ„ ظˆط§ط¶ط­ط© ظˆظ…ط®ط±ط¬ط§طھ ظ…ط­ط¯ط¯ط©.

**ط§ظ„ظ…ط¯ط© ط§ظ„ظ…طھظˆظ‚ط¹ط©**: 2-3 ط£ط³ط§ط¨ظٹط¹
**ط§ظ„ط£ظˆظ„ظˆظٹط©**: High
**ط§ظ„ط­ط§ظ„ط©**: Ready to Start

---

## Task 1 â€” Security Sweep & .gitignore ًں”’

### Description - ط§ظ„ظˆطµظپ

ظپط­طµ ط´ط§ظ…ظ„ ظ„ظ„ط£ظ…ط§ظ† ظ„ط¥ط²ط§ظ„ط© ط£ظٹ ظ…ط¹ظ„ظˆظ…ط§طھ ط­ط³ط§ط³ط© ظ…ظ† ط§ظ„ظ…ط´ط±ظˆط¹ ظˆط§ظ„طھط£ظƒط¯ ظ…ظ† ط¹ط¯ظ… ط±ظپط¹ظ‡ط§ ط¹ظ„ظ‰ GitHub.

### Priority - ط§ظ„ط£ظˆظ„ظˆظٹط©

ًں”´ **Critical** - ظٹط¬ط¨ طھظ†ظپظٹط°ظ‡ط§ ط£ظˆظ„ط§ظ‹

### Estimated Time - ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹

2-3 ط³ط§ط¹ط§طھ

### Acceptance Criteria - ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ‚ط¨ظˆظ„

- [ ] ظ„ط§ طھظˆط¬ط¯ ظ…ظ„ظپط§طھ `.env` ظپظٹ git history
- [ ] ظ„ط§ طھظˆط¬ط¯ API keys ط£ظˆ secrets ظپظٹ ط§ظ„ظƒظˆط¯
- [ ] طھط­ط¯ظٹط« `.gitignore` ظ„ظٹط´ظ…ظ„ ط¬ظ…ظٹط¹ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ط­ط³ط§ط³ط©
- [ ] ظپط­طµ git history ظ„ظ„ظ…ظ„ظپط§طھ ط§ظ„ظƒط¨ظٹط±ط© (>100MB)
- [ ] ط¥ط²ط§ظ„ط© ط£ظٹ credentials ظ…ظ† ط§ظ„ظƒظˆط¯ ط§ظ„ظ…طµط¯ط±ظٹ
- [ ] ط§ظ„طھط£ظƒط¯ ظ…ظ† ط¹ط¯ظ… ظˆط¬ظˆط¯ database dumps

### Deliverables - ط§ظ„ظ…ط®ط±ط¬ط§طھ

1. **Security Audit Report** (`SECURITY_AUDIT.md`):

   ```markdown
   - ظ‚ط§ط¦ظ…ط© ط¨ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ط­ط³ط§ط³ط© ط§ظ„طھظٹ طھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظٹظ‡ط§
   - ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ظ…طھط®ط°ط© ظ„ظƒظ„ ظ…ظ„ظپ
   - ط®ظ„ط§طµط© ط§ظ„ط£ظ…ط§ظ† ط§ظ„ظ†ظ‡ط§ط¦ظٹط©
   ```

2. **Updated .gitignore**:

   ```
   # Already done âœ…
   - Excludes .env files
   - Excludes node_modules
   - Excludes secrets/ directory
   ```

3. **Git History Cleanup** (ط¥ط°ط§ ظ„ط²ظ…):

   ```bash
   # ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ظ…ط³طھط®ط¯ظ…ط©
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/secret" \
     --prune-empty --tag-name-filter cat -- --all

   # ط£ظˆ ط¨ط§ط³طھط®ط¯ط§ظ… BFG Repo-Cleaner
   bfg --delete-files secret.env
   ```

4. **Commit Message**:

   ```
   security: Remove sensitive files and enhance .gitignore

   - Removed .env files from history
   - Updated .gitignore with comprehensive rules
   - Verified no API keys in source code
   - Cleaned up database dumps
   ```

### Steps - ط§ظ„ط®ط·ظˆط§طھ

```bash
# 1. ط§ظ„ط¨ط­ط« ط¹ظ† ظ…ظ„ظپط§طھ .env ظپظٹ ط§ظ„طھط§ط±ظٹط®
git log --all --full-history -- "**/.env"

# 2. ط§ظ„ط¨ط­ط« ط¹ظ† API keys patterns
git grep -i "apikey\|api_key\|secret_key" $(git rev-list --all)

# 3. ظپط­طµ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ظƒط¨ظٹط±ط©
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '$3 > 104857600' | sort -k3 -n -r

# 4. ط¥ط²ط§ظ„ط© ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ط­ط³ط§ط³ط© ط¥ط°ط§ ظˆط¬ط¯طھ
# ط§ط³طھط®ط¯ظ… BFG ط£ظˆ git filter-branch

# 5. Verify ط§ظ„ظ†طھط§ط¦ط¬
git log --all -- "**/.env"  # ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ظپط§ط±ط؛
```

---

## Task 2 â€” Run & Verify Docker Compose Locally ًںگ³

### Description - ط§ظ„ظˆطµظپ

ط§ظ„طھط£ظƒط¯ ظ…ظ† ط£ظ† ط¬ظ…ظٹط¹ ط§ظ„ط®ط¯ظ…ط§طھ طھط¹ظ…ظ„ ط¨ط´ظƒظ„ طµط­ظٹط­ ظ…ط­ظ„ظٹط§ظ‹ ط¨ط§ط³طھط®ط¯ط§ظ… Docker Compose.

### Priority - ط§ظ„ط£ظˆظ„ظˆظٹط©

ًںں  **High** - ظ…ظ‡ظ…ط© ط£ط³ط§ط³ظٹط©

### Estimated Time - ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹

4-6 ط³ط§ط¹ط§طھ

### Acceptance Criteria - ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ‚ط¨ظˆظ„

- [ ] `docker-compose up --build` ظٹط¹ظ…ظ„ ط¨ط¯ظˆظ† ط£ط®ط·ط§ط،
- [ ] ط¬ظ…ظٹط¹ ط§ظ„ط®ط¯ظ…ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط© طھط¨ط¯ط£ ط¨ظ†ط¬ط§ط­:
  - [ ] PostgreSQL
  - [ ] Redis
  - [ ] auth-service
  - [ ] listing-service
  - [ ] auction-service
  - [ ] payment-service
- [ ] ط¬ظ…ظٹط¹ health endpoints طھط³طھط¬ظٹط¨ ط¨ظ€ 200 OK
- [ ] ظٹظ…ظƒظ† ط§ظ„ط§طھطµط§ظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ…ظ† ط§ظ„ط®ط¯ظ…ط§طھ
- [ ] ظ„ط§ طھظˆط¬ط¯ port conflicts

### Deliverables - ط§ظ„ظ…ط®ط±ط¬ط§طھ

1. **Local Setup Guide** (`LOCAL_SETUP.md`):

   ```markdown
   ## Prerequisites

   - Docker Desktop installed
   - 8GB RAM minimum
   - Ports 3001-3008, 5432, 6379 available

   ## Steps

   1. Clone repository
   2. Copy .env.example to .env
   3. Run docker-compose up
   4. Verify services

   ## Troubleshooting

   - Common errors and solutions
   ```

2. **Updated docker-compose.yml**:
   - Fixed any configuration issues
   - Added missing environment variables
   - Proper service dependencies
   - Health checks configured

3. **Test Results** (`TEST_RESULTS.md`):

   ```markdown
   | Service | Status | Health Endpoint | Response Time |
   | ------- | ------ | --------------- | ------------- |
   | auth    | âœ…     | /health         | 45ms          |
   | listing | âœ…     | /health         | 38ms          |
   | auction | âœ…     | /health         | 52ms          |
   | payment | âœ…     | /health         | 41ms          |
   ```

4. **Error Log** (ط¥ط°ط§ ط¸ظ‡ط±طھ ط£ط®ط·ط§ط،):
   - ظ‚ط§ط¦ظ…ط© ط¨ط§ظ„ط£ط®ط·ط§ط، ط§ظ„طھظٹ ط¸ظ‡ط±طھ
   - ط§ظ„ط­ظ„ظˆظ„ ط§ظ„ظ…ط·ط¨ظ‚ط©
   - ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ط¹ظ„ظ‰ docker-compose.yml

### Steps - ط§ظ„ط®ط·ظˆط§طھ

```bash
# 1. ظ†ط³ط® ظ…ظ„ظپ environment
cp services/auth-service/.env.example services/auth-service/.env
# ظƒط±ط± ظ„ظƒظ„ ط®ط¯ظ…ط©

# 2. طھط´ط؛ظٹظ„ Docker Compose
docker-compose up --build

# 3. ظپظٹ terminal ط¢ط®ط±طŒ ط§ط®طھط¨ط§ط± ط§ظ„ط®ط¯ظ…ط§طھ
curl http://localhost:3001/health  # auth-service
curl http://localhost:3002/health  # listing-service
curl http://localhost:3003/health  # auction-service
curl http://localhost:3004/health  # payment-service

# 4. ظپط­طµ ط§ظ„ظ€ logs
docker-compose logs -f auth-service

# 5. ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط§طھطµط§ظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
docker-compose exec postgres psql -U mnbarh_user -d mnbarh_db -c "\dt"

# 6. ط¥ظٹظ‚ط§ظپ ظˆط§ظ„طھظ†ط¸ظٹظپ
docker-compose down -v
```

---

## Task 3 â€” Add CI (GitHub Actions) â€” Basic âڑ™ï¸ڈ

### Description - ط§ظ„ظˆطµظپ

ط¥ط¹ط¯ط§ط¯ CI/CD pipeline ط£ط³ط§ط³ظٹ ط¨ط§ط³طھط®ط¯ط§ظ… GitHub Actions ظ„ظپط­طµ ط§ظ„ظƒظˆط¯ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ط¹ظ†ط¯ ظƒظ„ PR.

### Priority - ط§ظ„ط£ظˆظ„ظˆظٹط©

ًںں  **High**

### Estimated Time - ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹

3-4 ط³ط§ط¹ط§طھ

### Acceptance Criteria - ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ‚ط¨ظˆظ„

- [ ] GitHub Actions workflow ظٹط¹ظ…ظ„ ط¹ظ„ظ‰ ظƒظ„ push/PR
- [ ] ظٹط´ط؛ظ„ lint ظ„ظ„ظƒظˆط¯ (ESLint)
- [ ] ظٹط´ط؛ظ„ unit tests
- [ ] ظٹظپط­طµ Prisma migrations
- [ ] ظٹظپط­طµ TypeScript compilation
- [ ] ظٹط¹ط±ط¶ ظ†طھط§ط¦ط¬ ظˆط§ط¶ط­ط© ظپظٹ PR
- [ ] ظٹظپط´ظ„ PR ط¥ط°ط§ ظپط´ظ„ ط£ظٹ ظپط­طµ

### Deliverables - ط§ظ„ظ…ط®ط±ط¬ط§طھ

1. **CI Workflow File** (`.github/workflows/ci.yml`):

   ```yaml
   name: CI

   on:
     push:
       branches: [main, develop]
     pull_request:
       branches: [main, develop]

   jobs:
     lint:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Setup Node
           uses: actions/setup-node@v3
           with:
             node-version: "18"
         - name: Install dependencies
           run: npm install
         - name: Run ESLint
           run: npm run lint

     test:
       runs-on: ubuntu-latest
       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_PASSWORD: postgres
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
       steps:
         - uses: actions/checkout@v3
         - name: Setup Node
           uses: actions/setup-node@v3
           with:
             node-version: "18"
         - name: Install dependencies
           run: npm install
         - name: Run tests
           run: npm test
         - name: Upload coverage
           uses: codecov/codecov-action@v3

     migrations:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Check Prisma migrations
           run: |
             cd services/auth-service
             npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
   ```

2. **Badge ظپظٹ README.md**:

   ```markdown
   ![CI Status](https://github.com/hossam-create/mnbarh-Platform/workflows/CI/badge.svg)
   ```

3. **Documentation** (`CI_SETUP.md`):
   - ط´ط±ط­ ظƒظٹظپظٹط© ط¹ظ…ظ„ CI
   - ظƒظٹظپظٹط© ط¥ط¶ط§ظپط© tests ط¬ط¯ظٹط¯ط©
   - ظƒظٹظپظٹط© ظپط­طµ ط§ظ„ظ†طھط§ط¦ط¬

4. **Test Coverage Report**:
   - ط¥ط¹ط¯ط§ط¯ CodeCov ط£ظˆ ظ…ظ…ط§ط«ظ„
   - Badge ظ„ظ†ط³ط¨ط© ط§ظ„طھط؛ط·ظٹط©

### Steps - ط§ظ„ط®ط·ظˆط§طھ

```bash
# 1. ط¥ظ†ط´ط§ط، ظ…ط¬ظ„ط¯ workflows
mkdir -p .github/workflows

# 2. ط¥ظ†ط´ط§ط، ظ…ظ„ظپ ci.yml
# (ظƒظ…ط§ ظپظٹ ط§ظ„ط£ط¹ظ„ظ‰)

# 3. ط¥ط¶ط§ظپط© npm scripts ظپظٹ package.json ط§ظ„ط±ط¦ظٹط³ظٹ
{
  "scripts": {
    "lint": "eslint services/*/src/**/*.ts",
    "test": "npm run test --workspaces",
    "test:coverage": "npm run test:coverage --workspaces"
  }
}

# 4. Commit and push
git add .github/workflows/ci.yml
git commit -m "ci: Add GitHub Actions workflow for CI"
git push origin main

# 5. ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† GitHub Actions tab
```

---

## Task 4 â€” Create Postman Collection / OpenAPI ًں“ڑ

### Description - ط§ظ„ظˆطµظپ

طھظˆط«ظٹظ‚ ط´ط§ظ…ظ„ ظ„ط¬ظ…ظٹط¹ API endpoints ط¨ط§ط³طھط®ط¯ط§ظ… Postman Collection ظˆ OpenAPI Specification.

### Priority - ط§ظ„ط£ظˆظ„ظˆظٹط©

ًںں، **Medium-High**

### Estimated Time - ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹

4-5 ط³ط§ط¹ط§طھ

### Acceptance Criteria - ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ‚ط¨ظˆظ„

- [ ] Postman Collection ظٹط­طھظˆظٹ ط¹ظ„ظ‰ ط¬ظ…ظٹط¹ endpoints ط§ظ„ط£ط³ط§ط³ظٹط©
- [ ] ظƒظ„ endpoint ظ„ظ‡:
  - [ ] Request examples
  - [ ] Response examples
  - [ ] Authentication headers
  - [ ] Environment variables
- [ ] OpenAPI 3.0 spec ظ…ظ„ظپ ظƒط§ظ…ظ„
- [ ] ظٹظ…ظƒظ† ط§ط³طھظٹط±ط§ط¯ Collection ظپظٹ Postman ط¨ط¯ظˆظ† ط£ط®ط·ط§ط،
- [ ] Documentation ظˆط§ط¶ط­ط© ظˆظ…ظ†ط¸ظ…ط©

### Deliverables - ط§ظ„ظ…ط®ط±ط¬ط§طھ

1. **Postman Collection** (`postman/mnbarh-Platform.postman_collection.json`):

   ```json
   {
     "info": {
       "name": "mnbarh Platform API",
       "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
     },
     "item": [
       {
         "name": "Auth Service",
         "item": [
           {
             "name": "Register",
             "request": {
               "method": "POST",
               "url": "{{base_url}}/auth/register",
               "body": { ... }
             }
           },
           {
             "name": "Login",
             ...
           }
         ]
       },
       {
         "name": "Listing Service",
         ...
       }
     ]
   }
   ```

2. **Postman Environment** (`postman/mnbarh-Platform.postman_environment.json`):

   ```json
   {
     "name": "mnbarh Local",
     "values": [
       {
         "key": "base_url",
         "value": "http://localhost:3001",
         "enabled": true
       },
       {
         "key": "jwt_token",
         "value": "",
         "enabled": true
       }
     ]
   }
   ```

3. **OpenAPI Specification** (`docs/openapi.yaml`):

   ```yaml
   openapi: 3.0.3
   info:
     title: mnbarh Platform API
     version: 1.0.0
     description: Crowdshipping marketplace API

   servers:
     - url: http://localhost:3001
       description: Local development
     - url: https://mnbarh-auth.onrender.com
       description: Production

   paths:
     /auth/register:
       post:
         summary: Register new user
         tags: [Authentication]
         requestBody:
           required: true
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   email:
                     type: string
                   password:
                     type: string
         responses:
           '201':
             description: User created successfully

     /listings:
       get:
         summary: Get all listings
         tags: [Listings]
         ...

     /auctions/{id}/bid:
       post:
         summary: Place a bid
         tags: [Auctions]
         ...

     /checkout:
       post:
         summary: Checkout and payment
         tags: [Payment]
         ...
   ```

4. **API Documentation** (`docs/API_DOCUMENTATION.md`):
   - ظ†ط¸ط±ط© ط¹ط§ظ…ط© ط¹ظ„ظ‰ ط§ظ„ظ€ API
   - Authentication flow
   - Error handling
   - Rate limiting
   - Examples ظ„ظƒظ„ endpoint

### Steps - ط§ظ„ط®ط·ظˆط§طھ

```bash
# 1. ط¥ظ†ط´ط§ط، ظ…ط¬ظ„ط¯ postman
mkdir -p postman docs

# 2. ظپظٹ Postman:
# - Create new collection
# - Add requests for each endpoint
# - Add tests and examples
# - Export as Collection v2.1

# 3. ط¥ظ†ط´ط§ط، OpenAPI spec ظٹط¯ظˆظٹط§ظ‹ ط£ظˆ ط¨ط§ط³طھط®ط¯ط§ظ… ط£ط¯ط§ط©
# ظٹظ…ظƒظ† ط§ط³طھط®ط¯ط§ظ…:
# - Swagger Editor (https://editor.swagger.io/)
# - Stoplight Studio
# - VS Code extension

# 4. Validate OpenAPI spec
npx @apidevtools/swagger-cli validate docs/openapi.yaml

# 5. Generate API docs
npx redoc-cli bundle docs/openapi.yaml -o docs/api.html

# 6. Commit files
git add postman/ docs/
git commit -m "docs: Add Postman collection and OpenAPI spec"
```

---

## Task 5 â€” Setup DB Migrations & Seed Script ًں—„ï¸ڈ

### Description - ط§ظ„ظˆطµظپ

ط¥ط¹ط¯ط§ط¯ ظ†ط¸ط§ظ… migrations ظ…ظ†ط¸ظ… ظˆseed scripts ظ„طھط¹ط¨ط¦ط© ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ط¨ظٹط§ظ†ط§طھ طھط¬ط±ظٹط¨ظٹط©.

### Priority - ط§ظ„ط£ظˆظ„ظˆظٹط©

ًںں  **High**

### Estimated Time - ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹

5-6 ط³ط§ط¹ط§طھ

### Acceptance Criteria - ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ‚ط¨ظˆظ„

- [ ] ط¬ظ…ظٹط¹ Prisma schemas ظ…ط­ط¯ظ‘ط«ط© ظˆظ…طھط³ظ‚ط©
- [ ] Migration files ظ…ظˆط¬ظˆط¯ط© ظ„ظƒظ„ ط®ط¯ظ…ط©
- [ ] `npx prisma migrate deploy` ظٹظ†ظپط° ط¨ظ†ط¬ط§ط­ ظ…ط­ظ„ظٹط§ظ‹
- [ ] Seed scripts طھط¹ط¨ط¦ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„طھط¬ط±ظٹط¨ظٹط©:
  - [ ] Users (buyer, seller, traveler)
  - [ ] Categories
  - [ ] Sample listings
  - [ ] Sample auctions
- [ ] CI ظٹظپط­طµ migrations طھظ„ظ‚ط§ط¦ظٹط§ظ‹
- [ ] Documentation ظˆط§ط¶ط­ط© ظ„ظ„ظ…ط·ظˆط±ظٹظ†

### Deliverables - ط§ظ„ظ…ط®ط±ط¬ط§طھ

1. **Migration Files** (ظپظٹ ظƒظ„ ط®ط¯ظ…ط©):

   ```
   services/auth-service/prisma/migrations/
   â”œâ”€â”€ 20250126000001_init/
   â”‚   â””â”€â”€ migration.sql
   â”œâ”€â”€ 20250126000002_add_kyc/
   â”‚   â””â”€â”€ migration.sql
   â””â”€â”€ migration_lock.toml
   ```

2. **Seed Scripts**:

   **`services/auth-service/prisma/seed.ts`**:

   ```typescript
   import { PrismaClient } from "@prisma/client";
   import * as bcrypt from "bcrypt";

   const prisma = new PrismaClient();

   async function main() {
     // Create test users
     const hashedPassword = await bcrypt.hash("password123", 10);

     await prisma.user.createMany({
       data: [
         {
           email: "buyer@test.com",
           password: hashedPassword,
           fullName: "Test Buyer",
           role: "BUYER",
         },
         {
           email: "seller@test.com",
           password: hashedPassword,
           fullName: "Test Seller",
           role: "SELLER",
         },
         {
           email: "traveler@test.com",
           password: hashedPassword,
           fullName: "Test Traveler",
           role: "TRAVELER",
         },
       ],
     });

     console.log("âœ“ Users seeded");
   }

   main()
     .catch((e) => {
       console.error(e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
   ```

3. **Migration Commands** (`MIGRATIONS.md`):

   ````markdown
   ## Run Migrations Locally

   ```bash
   # For each service
   cd services/auth-service
   npx prisma migrate dev --name init

   # Or all at once
   npm run migrate:dev
   ```
   ````

   ## Run Migrations in Production

   ```bash
   npx prisma migrate deploy
   ```

   ## Seed Database

   ```bash
   npx prisma db seed
   ```

   ## Reset Database (DEV ONLY)

   ```bash
   npx prisma migrate reset
   ```

   ```

   ```

4. **Updated package.json** (ظپظٹ ظƒظ„ ط®ط¯ظ…ط©):

   ```json
   {
     "prisma": {
       "seed": "ts-node prisma/seed.ts"
     },
     "scripts": {
       "migrate:dev": "prisma migrate dev",
       "migrate:deploy": "prisma migrate deploy",
       "migrate:reset": "prisma migrate reset",
       "db:seed": "prisma db seed"
     }
   }
   ```

5. **Migration Verification Script** (`scripts/verify-migrations.sh`):

   ```bash
   #!/bin/bash
   set -e

   services=("auth-service" "listing-service" "auction-service" "payment-service")

   for service in "${services[@]}"; do
     echo "Checking migrations for $service..."
     cd services/$service
     npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
     cd ../..
   done

   echo "âœ“ All migrations verified"
   ```

### Steps - ط§ظ„ط®ط·ظˆط§طھ

```bash
# 1. طھط­ط¯ظٹط« Prisma schemas
cd services/auth-service
npx prisma format
npx prisma validate

# 2. ط¥ظ†ط´ط§ط، migration
npx prisma migrate dev --name initial_setup

# 3. ط¥ظ†ط´ط§ط، seed script
touch prisma/seed.ts
# (ط£ط¶ظپ ط§ظ„ظƒظˆط¯ ظ…ظ† ط§ظ„ط£ط¹ظ„ظ‰)

# 4. طھط´ط؛ظٹظ„ seed
npx prisma db seed

# 5. ط§ظ„طھط­ظ‚ظ‚
npx prisma studio  # ظپطھط­ UI ظ„ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ

# 6. ظƒط±ط± ظ„ظƒظ„ ط®ط¯ظ…ط©
# auth-service, listing-service, auction-service, payment-service,
# crowdship-service, recommendation-service, rewards-service

# 7. Commit
git add services/*/prisma/
git commit -m "db: Add migrations and seed scripts"
```

---

## Task 6 â€” Add Tests for Core Flows ًں§ھ

### Description - ط§ظ„ظˆطµظپ

ظƒطھط§ط¨ط© unit tests ظˆ integration tests ظ„ظ„ظˆط¸ط§ط¦ظپ ط§ظ„ط£ط³ط§ط³ظٹط© ظپظٹ ط§ظ„ظ…ظ†طµط©.

### Priority - ط§ظ„ط£ظˆظ„ظˆظٹط©

ًںں، **Medium-High**

### Estimated Time - ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹

8-10 ط³ط§ط¹ط§طھ

### Acceptance Criteria - ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ‚ط¨ظˆظ„

- [ ] Test coverage > 70% ظ„ظ„ظƒظˆط¯ ط§ظ„ط£ط³ط§ط³ظٹ
- [ ] ط¬ظ…ظٹط¹ core flows ظ„ظ‡ط§ tests:
  - [ ] Auth: signup, login, JWT refresh
  - [ ] Listings: create, update, search
  - [ ] Auctions: create, bid, auto-extend
  - [ ] Payment: checkout, wallet operations
- [ ] Tests طھط¹ظ…ظ„ ظپظٹ CI ط¨ظ†ط¬ط§ط­
- [ ] Coverage badge ظپظٹ README
- [ ] Tests ظ…ظ†ط¸ظ…ط© ظˆظ†ط¸ظٹظپط©

### Deliverables - ط§ظ„ظ…ط®ط±ط¬ط§طھ

1. **Test Files Structure**:

   ```
   services/auth-service/
   â”œâ”€â”€ src/
   â”‚   â”œâ”€â”€ controllers/
   â”‚   â”‚   â”œâ”€â”€ auth.controller.ts
   â”‚   â”‚   â””â”€â”€ auth.controller.test.ts
   â”‚   â””â”€â”€ services/
   â”‚       â”œâ”€â”€ auth.service.ts
   â”‚       â””â”€â”€ auth.service.test.ts
   â””â”€â”€ tests/
       â””â”€â”€ integration/
           â””â”€â”€ auth.integration.test.ts
   ```

2. **Auth Service Tests** (`services/auth-service/src/controllers/auth.controller.test.ts`):

   ```typescript
   import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
   import request from "supertest";
   import app from "../index";

   describe("Auth Controller", () => {
     describe("POST /auth/register", () => {
       it("should register a new user", async () => {
         const response = await request(app).post("/auth/register").send({
           email: "newuser@test.com",
           password: "password123",
           fullName: "New User",
         });

         expect(response.status).toBe(201);
         expect(response.body).toHaveProperty("token");
         expect(response.body.user.email).toBe("newuser@test.com");
       });

       it("should fail with duplicate email", async () => {
         // First registration
         await request(app).post("/auth/register").send({
           email: "duplicate@test.com",
           password: "password123",
           fullName: "User One",
         });

         // Duplicate registration
         const response = await request(app).post("/auth/register").send({
           email: "duplicate@test.com",
           password: "password456",
           fullName: "User Two",
         });

         expect(response.status).toBe(400);
         expect(response.body.error).toContain("already exists");
       });
     });

     describe("POST /auth/login", () => {
       it("should login with valid credentials", async () => {
         // Register first
         await request(app).post("/auth/register").send({
           email: "logintest@test.com",
           password: "password123",
           fullName: "Login Test",
         });

         // Login
         const response = await request(app).post("/auth/login").send({
           email: "logintest@test.com",
           password: "password123",
         });

         expect(response.status).toBe(200);
         expect(response.body).toHaveProperty("token");
       });

       it("should fail with invalid password", async () => {
         const response = await request(app).post("/auth/login").send({
           email: "logintest@test.com",
           password: "wrongpassword",
         });

         expect(response.status).toBe(401);
       });
     });
   });
   ```

3. **Listing Service Tests** (`services/listing-service/src/controllers/listing.controller.test.ts`):

   ```typescript
   describe("Listing Controller", () => {
     let authToken: string;

     beforeAll(async () => {
       // Get auth token for authenticated requests
       const authResponse = await request(authApp)
         .post("/auth/login")
         .send({ email: "seller@test.com", password: "password123" });
       authToken = authResponse.body.token;
     });

     describe("POST /listings", () => {
       it("should create a new listing", async () => {
         const response = await request(app)
           .post("/listings")
           .set("Authorization", `Bearer ${authToken}`)
           .send({
             title: "iPhone 15 Pro",
             description: "Brand new iPhone",
             price: 999,
             category: "Electronics",
           });

         expect(response.status).toBe(201);
         expect(response.body.listing.title).toBe("iPhone 15 Pro");
       });

       it("should fail without authentication", async () => {
         const response = await request(app).post("/listings").send({
           title: "Test Product",
           price: 100,
         });

         expect(response.status).toBe(401);
       });
     });

     describe("GET /listings", () => {
       it("should return all listings", async () => {
         const response = await request(app).get("/listings");

         expect(response.status).toBe(200);
         expect(Array.isArray(response.body.listings)).toBe(true);
       });

       it("should filter by category", async () => {
         const response = await request(app).get(
           "/listings?category=Electronics"
         );

         expect(response.status).toBe(200);
         expect(
           response.body.listings.every((l) => l.category === "Electronics")
         ).toBe(true);
       });
     });
   });
   ```

4. **Auction Service Tests** (`services/auction-service/src/controllers/bid.controller.test.ts`):

   ```typescript
   describe("Bid Controller", () => {
     let authToken: string;
     let auctionId: string;

     beforeAll(async () => {
       // Setup: Login and create auction
       const authResponse = await request(authApp)
         .post("/auth/login")
         .send({ email: "buyer@test.com", password: "password123" });
       authToken = authResponse.body.token;

       const auctionResponse = await request(app)
         .post("/auctions")
         .set("Authorization", `Bearer ${authToken}`)
         .send({
           productId: "test-product",
           startPrice: 100,
           endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
         });
       auctionId = auctionResponse.body.auction.id;
     });

     describe("POST /auctions/:id/bid", () => {
       it("should place a valid bid", async () => {
         const response = await request(app)
           .post(`/auctions/${auctionId}/bid`)
           .set("Authorization", `Bearer ${authToken}`)
           .send({
             amount: 150,
           });

         expect(response.status).toBe(201);
         expect(response.body.bid.amount).toBe(150);
       });

       it("should reject bid lower than current price", async () => {
         const response = await request(app)
           .post(`/auctions/${auctionId}/bid`)
           .set("Authorization", `Bearer ${authToken}`)
           .send({
             amount: 50,
           });

         expect(response.status).toBe(400);
         expect(response.body.error).toContain("too low");
       });
     });
   });
   ```

5. **Test Configuration** (`jest.config.js`):

   ```javascript
   module.exports = {
     preset: "ts-jest",
     testEnvironment: "node",
     roots: ["<rootDir>/src", "<rootDir>/tests"],
     testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
     collectCoverageFrom: [
       "src/**/*.ts",
       "!src/**/*.test.ts",
       "!src/**/*.spec.ts",
       "!src/index.ts",
     ],
     coverageThreshold: {
       global: {
         branches: 70,
         functions: 70,
         lines: 70,
         statements: 70,
       },
     },
   };
   ```

6. **Coverage Badge** ظپظٹ README:

   ```markdown
   ![Coverage](https://img.shields.io/codecov/c/github/hossam-create/mnbarh-Platform)
   ```

7. **Test Results Summary** (`TEST_COVERAGE_REPORT.md`):

   ```markdown
   # Test Coverage Report

   ## Overall Coverage: 75%

   | Service         | Coverage | Tests | Status |
   | --------------- | -------- | ----- | ------ |
   | auth-service    | 82%      | 15    | âœ…     |
   | listing-service | 78%      | 12    | âœ…     |
   | auction-service | 71%      | 10    | âœ…     |
   | payment-service | 69%      | 8     | âڑ ï¸ڈ     |

   ## Core Flow Coverage

   - âœ… User Registration: 100%
   - âœ… User Login: 100%
   - âœ… Create Listing: 85%
   - âœ… Search Listings: 90%
   - âœ… Place Bid: 80%
   - âœ… Checkout: 75%
   ```

### Steps - ط§ظ„ط®ط·ظˆط§طھ

```bash
# 1. ط¥ط¹ط¯ط§ط¯ Jest
npm install --save-dev jest @jest/globals @types/jest ts-jest supertest @types/supertest

# 2. ط¥ظ†ط´ط§ط، jest.config.js
# (ظƒظ…ط§ ظپظٹ ط§ظ„ط£ط¹ظ„ظ‰)

# 3. ظƒطھط§ط¨ط© tests ظ„ظƒظ„ ط®ط¯ظ…ط©
# auth-service
cd services/auth-service
touch src/controllers/auth.controller.test.ts
# (ط£ط¶ظپ ط§ظ„ظƒظˆط¯)

# 4. طھط´ط؛ظٹظ„ tests
npm test

# 5. ظپط­طµ coverage
npm run test:coverage

# 6. ط¥ط¹ط¯ط§ط¯ CodeCov
# ظپظٹ .github/workflows/ci.yml
# (طھظ… ط¥ط¶ط§ظپطھظ‡ ظپظٹ Task 3)

# 7. Commit
git add services/*/src/**/*.test.ts
git add jest.config.js
git commit -m "test: Add unit and integration tests for core flows"
```

---

## Task 7 â€” Protect Main Branch & Secrets ًں”گ

### Description - ط§ظ„ظˆطµظپ

طھط£ظ…ظٹظ† main branch ظˆط¥ط¹ط¯ط§ط¯ GitHub Secrets ظ„ط­ظ…ط§ظٹط© ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط­ط³ط§ط³ط©.

### Priority - ط§ظ„ط£ظˆظ„ظˆظٹط©

ًں”´ **Critical**

### Estimated Time - ط§ظ„ظˆظ‚طھ ط§ظ„ظ…طھظˆظ‚ط¹

2-3 ط³ط§ط¹ط§طھ

### Acceptance Criteria - ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ‚ط¨ظˆظ„

- [ ] Main branch ظ…ط­ظ…ظٹ ظˆظ„ط§ ظٹظ…ظƒظ† push ظ…ط¨ط§ط´ط±ط©
- [ ] ظٹطھط·ظ„ط¨ PR review ظ‚ط¨ظ„ ط§ظ„ط¯ظ…ط¬
- [ ] ظٹطھط·ظ„ط¨ ظ†ط¬ط§ط­ CI checks ظ‚ط¨ظ„ merge
- [ ] ط¬ظ…ظٹط¹ GitHub Secrets ظ…ط¶ط§ظپط©:
  - [ ] DATABASE_URL
  - [ ] REDIS_URL
  - [ ] JWT_SECRET
  - [ ] STRIPE_SECRET_KEY
  - [ ] STRIPE_PUBLIC_KEY
  - [ ] PAYPAL_CLIENT_ID
  - [ ] PAYPAL_SECRET
  - [ ] AWS credentials (optional)
- [ ] CI ظٹط³طھط·ظٹط¹ ط§ظ„ظˆطµظˆظ„ ظ„ظ„ظ€ secrets
- [ ] Documentation ظ„ظ„ظ…ط·ظˆط±ظٹظ† ط§ظ„ط¬ط¯ط¯

### Deliverables - ط§ظ„ظ…ط®ط±ط¬ط§طھ

1. **Branch Protection Rules** (GitHub Settings):

   ```
   Settings â†’ Branches â†’ Add rule

   Branch name pattern: main

   Require a pull request before merging:
     âœ… Require approvals: 1
     âœ… Dismiss stale pull request approvals
     âœ… Require review from Code Owners

   Require status checks to pass:
     âœ… Require branches to be up to date
     âœ… Status checks: CI / lint, CI / test

   Require conversation resolution before merging: âœ…

   Do not allow bypassing the above settings: âœ…
   ```

2. **GitHub Secrets Setup** (`SECRETS_SETUP.md`):

   ```markdown
   # GitHub Secrets Configuration

   ## How to Add Secrets

   1. Go to: https://github.com/hossam-create/mnbarh-Platform/settings/secrets/actions
   2. Click "New repository secret"
   3. Add each secret below

   ## Required Secrets

   ### Database

   - `DATABASE_URL`
   ```

   postgresql://user:password@host:5432/mnbarh_db

   ```

   - `REDIS_URL`
   ```

   redis://host:6379

   ```

   ### Authentication
   - `JWT_SECRET`
   ```

   Generate with: openssl rand -base64 32
   Must be at least 32 characters

   ```

   ### Payment Gateways
   - `STRIPE_SECRET_KEY`
   ```

   sk*test*... (from Stripe Dashboard)

   ```

   - `STRIPE_PUBLIC_KEY`
   ```

   pk*test*... (from Stripe Dashboard)

   ```

   - `PAYPAL_CLIENT_ID`
   ```

   From PayPal Developer Dashboard

   ```

   - `PAYPAL_SECRET`
   ```

   From PayPal Developer Dashboard

   ```

   ### AWS (Optional - ظ„ظ„ظ†ط´ط± ط¹ظ„ظ‰ AWS)
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`

   ## Verification

   Run this workflow to verify secrets are accessible:
   ```

3. **Secrets Verification Workflow** (`.github/workflows/verify-secrets.yml`):

   ```yaml
   name: Verify Secrets

   on:
     workflow_dispatch:

   jobs:
     verify:
       runs-on: ubuntu-latest
       steps:
         - name: Check DATABASE_URL
           run: |
             if [ -z "${{ secrets.DATABASE_URL }}" ]; then
               echo "â‌Œ DATABASE_URL not set"
               exit 1
             else
               echo "âœ… DATABASE_URL is set"
             fi

         - name: Check REDIS_URL
           run: |
             if [ -z "${{ secrets.REDIS_URL }}" ]; then
               echo "â‌Œ REDIS_URL not set"
               exit 1
             else
               echo "âœ… REDIS_URL is set"
             fi

         - name: Check JWT_SECRET
           run: |
             if [ -z "${{ secrets.JWT_SECRET }}" ]; then
               echo "â‌Œ JWT_SECRET not set"
               exit 1
             elif [ ${#JWT_SECRET} -lt 32 ]; then
               echo "â‌Œ JWT_SECRET too short (minimum 32 chars)"
               exit 1
             else
               echo "âœ… JWT_SECRET is set and valid length"
             fi
           env:
             JWT_SECRET: ${{ secrets.JWT_SECRET }}

         - name: Summary
           run: echo "âœ… All critical secrets verified"
   ```

4. **Updated CI Workflow** (`.github/workflows/ci.yml`):

   ```yaml
   # ط¥ط¶ط§ظپط© secrets ظ„ظ„ظ€ test job
   jobs:
     test:
       runs-on: ubuntu-latest
       env:
         DATABASE_URL: ${{ secrets.DATABASE_URL }}
         REDIS_URL: ${{ secrets.REDIS_URL }}
         JWT_SECRET: ${{ secrets.JWT_SECRET }}
       services:
         postgres:
           image: postgres:15
           env:
             POSTGRES_PASSWORD: postgres
             POSTGRES_DB: test_db
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
         redis:
           image: redis:6
           options: >-
             --health-cmd "redis-cli ping"
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
       steps:
         # ... (ط¨ط§ظ‚ظٹ ط§ظ„ط®ط·ظˆط§طھ)
   ```

5. **Developer Onboarding Guide** (`DEVELOPER_ONBOARDING.md`):

   ```markdown
   # Developer Onboarding

   ## Getting Started

   1. Clone the repository
   2. Create feature branch (don't push to main directly)
   3. Make your changes
   4. Create Pull Request
   5. Wait for CI checks and review

   ## Working with Secrets Locally

   1. Copy `.env.example` to `.env` in each service
   2. Fill in the values (ask team lead)
   3. **NEVER commit .env files**

   ## Creating a Pull Request

   1. Ensure all tests pass locally
   2. Run `npm run lint` to check code style
   3. Create PR with clear description
   4. Request review from team member
   5. Address review comments
   6. Wait for CI to pass
   7. Merge after approval

   ## Branch Protection Rules

   - Cannot push directly to main
   - Requires 1 approval
   - Must pass CI checks
   - All conversations must be resolved
   ```

6. **Environment Template** (`.env.example` ظپظٹ ظƒظ„ ط®ط¯ظ…ط©):

   ```bash
   # Database
   DATABASE_URL=postgresql://mnbarh_user:mnbarh_pass@localhost:5432/mnbarh_db

   # Redis
   REDIS_URL=redis://localhost:6379

   # JWT
   JWT_SECRET=your-super-secret-key-minimum-32-characters-long

   # Stripe
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

   # PayPal
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_SECRET=your_paypal_secret

   # Server
   PORT=3001
   NODE_ENV=development
   ```

### Steps - ط§ظ„ط®ط·ظˆط§طھ

```bash
# 1. ط¥ط¹ط¯ط§ط¯ Branch Protection ط¹ظ„ظ‰ GitHub
# ط§ط°ظ‡ط¨ ط¥ظ„ظ‰: Settings â†’ Branches â†’ Add rule
# ط§طھط¨ط¹ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ظپظٹ Deliverable #1

# 2. ط¥ط¶ط§ظپط© Secrets ط¹ظ„ظ‰ GitHub
# ط§ط°ظ‡ط¨ ط¥ظ„ظ‰: Settings â†’ Secrets â†’ Actions â†’ New secret
# ط£ط¶ظپ ظƒظ„ secret ظ…ظ† ط§ظ„ظ‚ط§ط¦ظ…ط©

# 3. Generate JWT_SECRET ظ…ط­ظ„ظٹط§ظ‹
openssl rand -base64 32

# 4. ط¥ظ†ط´ط§ط، .env.example files
for service in services/*; do
  if [ -d "$service" ]; then
    touch $service/.env.example
    # ط£ط¶ظپ ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©
  fi
done

# 5. ط¥ظ†ط´ط§ط، verification workflow
mkdir -p .github/workflows
touch .github/workflows/verify-secrets.yml
# (ط£ط¶ظپ ط§ظ„ظƒظˆط¯ ظ…ظ† ط§ظ„ط£ط¹ظ„ظ‰)

# 6. طھط´ط؛ظٹظ„ verification
# GitHub â†’ Actions â†’ Verify Secrets â†’ Run workflow

# 7. Commit
git add .env.example .github/workflows/verify-secrets.yml
git commit -m "security: Add secrets verification and .env templates"

# 8. ط¥ظ†ط´ط§ط، PR ظ„ظ„طھط¬ط±ط¨ط©
git checkout -b test/branch-protection
git push origin test/branch-protection
# ط¥ظ†ط´ط§ط، PR ط¹ظ„ظ‰ GitHub ظ„ظ„طھط­ظ‚ظ‚ ظ…ظ† Branch Protection
```

---

## ًں“ٹ Progress Tracking - طھطھط¨ط¹ ط§ظ„طھظ‚ط¯ظ…

### Checklist

- [ ] **Task 1**: Security Sweep & .gitignore _(2-3 hours)_
- [ ] **Task 2**: Docker Compose Verification _(4-6 hours)_
- [ ] **Task 3**: CI/CD Setup _(3-4 hours)_
- [ ] **Task 4**: API Documentation _(4-5 hours)_
- [ ] **Task 5**: DB Migrations & Seeds _(5-6 hours)_
- [ ] **Task 6**: Core Tests _(8-10 hours)_
- [ ] **Task 7**: Branch Protection & Secrets _(2-3 hours)_

### Total Estimated Time

**28-37 hours** (~1 week full-time or 2-3 weeks part-time)

---

## ًںژ¯ Success Metrics - ظ…ط¹ط§ظٹظٹط± ط§ظ„ظ†ط¬ط§ط­

ط¹ظ†ط¯ ط¥ظ†ظ‡ط§ط، ط¬ظ…ظٹط¹ ط§ظ„ظ…ظ‡ط§ظ…طŒ ظٹط¬ط¨ طھط­ظ‚ظٹظ‚:

âœ… **Security**: ظ„ط§ طھظˆط¬ط¯ secrets ظپظٹ ط§ظ„ظƒظˆط¯ ط£ظˆ git history
âœ… **Local Development**: ظƒظ„ ظ…ط·ظˆط± ظٹط³طھط·ظٹط¹ طھط´ط؛ظٹظ„ ط§ظ„ظ…ط´ط±ظˆط¹ ظ…ط­ظ„ظٹط§ظ‹ ط¨ط³ظ‡ظˆظ„ط©
âœ… **CI/CD**: ظƒظ„ PR ظٹظڈظپط­طµ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ظ‚ط¨ظ„ ط§ظ„ط¯ظ…ط¬
âœ… **Documentation**: ظƒظ„ endpoint ظ…ظˆط«ظ‚ ط¨ظˆط¶ظˆط­
âœ… **Database**: ظ†ط¸ط§ظ… migrations ظ…ظ†ط¸ظ… ظˆظ‚ط§ط¨ظ„ ظ„ظ„طھظƒط±ط§ط±
âœ… **Testing**: coverage > 70% ظ„ظ„ظƒظˆط¯ ط§ظ„ط£ط³ط§ط³ظٹ
âœ… **Branch Protection**: main ظ…ط­ظ…ظٹ ظ…ظ† ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ط§ظ„ظ…ط¨ط§ط´ط±ط©

---

## ًں“‌ Notes - ظ…ظ„ط§ط­ط¸ط§طھ

### ط§ظ„طھظ†ط³ظٹظ‚ ط¨ظٹظ† ط§ظ„ظ…ظ‡ط§ظ…:

- **Task 1** ظٹط¬ط¨ ط£ظ† ظٹظ†ظپط° ط£ظˆظ„ط§ظ‹ (ط£ظ…ط§ظ†)
- **Task 2, 5** ظٹظ…ظƒظ† طھظ†ظپظٹط°ظ‡ظ…ط§ ط¨ط§ظ„طھظˆط§ط²ظٹ
- **Task 3** ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ط¨ط¹ط¯ Task 6 ط¬ط§ظ‡ط²
- **Task 7** ظٹظ…ظƒظ† ط§ظ„ط¨ط¯ط، ظپظٹظ‡ ظ…ط¨ظƒط±ط§ظ‹ ظ„ظƒظ† ظٹظƒطھظ…ظ„ ظپظٹ ط§ظ„ظ†ظ‡ط§ظٹط©

### Tools Recommended:

- **BFG Repo-Cleaner**: ظ„طھظ†ط¸ظٹظپ git history
- **Docker Desktop**: ظ„ظ„طھط·ظˆظٹط± ط§ظ„ظ…ط­ظ„ظٹ
- **Postman**: ظ„طھظˆط«ظٹظ‚ ط§ظ„ظ€ API
- **Swagger Editor**: ظ„ظ€ OpenAPI spec
- **Jest**: ظ„ظ„ظ€ testing
- **CodeCov**: ظ„طھطھط¨ط¹ test coverage

### References:

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**ظ†ظ‡ط§ظٹط© ط®ط·ط© ط§ظ„ط¹ظ…ظ„** | **End of Action Plan**

**Last Updated**: 2025-11-26
**Version**: 1.0.0

