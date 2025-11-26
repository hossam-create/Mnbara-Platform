# Mnbara Platform - Action Plan

# خطة العمل العملية - أول 7 مهام

---

## 📋 Overview - نظرة عامة

هذه الخطة تحتوي على أول 7 مهام أساسية لتجهيز مشروع Mnbara للإنتاج. كل مهمة تحتوي على معايير قبول واضحة ومخرجات محددة.

**المدة المتوقعة**: 2-3 أسابيع
**الأولوية**: High
**الحالة**: Ready to Start

---

## Task 1 — Security Sweep & .gitignore 🔒

### Description - الوصف

فحص شامل للأمان لإزالة أي معلومات حساسة من المشروع والتأكد من عدم رفعها على GitHub.

### Priority - الأولوية

🔴 **Critical** - يجب تنفيذها أولاً

### Estimated Time - الوقت المتوقع

2-3 ساعات

### Acceptance Criteria - معايير القبول

- [ ] لا توجد ملفات `.env` في git history
- [ ] لا توجد API keys أو secrets في الكود
- [ ] تحديث `.gitignore` ليشمل جميع الملفات الحساسة
- [ ] فحص git history للملفات الكبيرة (>100MB)
- [ ] إزالة أي credentials من الكود المصدري
- [ ] التأكد من عدم وجود database dumps

### Deliverables - المخرجات

1. **Security Audit Report** (`SECURITY_AUDIT.md`):

   ```markdown
   - قائمة بالملفات الحساسة التي تم العثور عليها
   - الإجراءات المتخذة لكل ملف
   - خلاصة الأمان النهائية
   ```

2. **Updated .gitignore**:

   ```
   # Already done ✅
   - Excludes .env files
   - Excludes node_modules
   - Excludes secrets/ directory
   ```

3. **Git History Cleanup** (إذا لزم):

   ```bash
   # الأوامر المستخدمة
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/secret" \
     --prune-empty --tag-name-filter cat -- --all

   # أو باستخدام BFG Repo-Cleaner
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

### Steps - الخطوات

```bash
# 1. البحث عن ملفات .env في التاريخ
git log --all --full-history -- "**/.env"

# 2. البحث عن API keys patterns
git grep -i "apikey\|api_key\|secret_key" $(git rev-list --all)

# 3. فحص الملفات الكبيرة
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '$3 > 104857600' | sort -k3 -n -r

# 4. إزالة الملفات الحساسة إذا وجدت
# استخدم BFG أو git filter-branch

# 5. Verify النتائج
git log --all -- "**/.env"  # يجب أن يكون فارغ
```

---

## Task 2 — Run & Verify Docker Compose Locally 🐳

### Description - الوصف

التأكد من أن جميع الخدمات تعمل بشكل صحيح محلياً باستخدام Docker Compose.

### Priority - الأولوية

🟠 **High** - مهمة أساسية

### Estimated Time - الوقت المتوقع

4-6 ساعات

### Acceptance Criteria - معايير القبول

- [ ] `docker-compose up --build` يعمل بدون أخطاء
- [ ] جميع الخدمات الأساسية تبدأ بنجاح:
  - [ ] PostgreSQL
  - [ ] Redis
  - [ ] auth-service
  - [ ] listing-service
  - [ ] auction-service
  - [ ] payment-service
- [ ] جميع health endpoints تستجيب بـ 200 OK
- [ ] يمكن الاتصال بقاعدة البيانات من الخدمات
- [ ] لا توجد port conflicts

### Deliverables - المخرجات

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
   | auth    | ✅     | /health         | 45ms          |
   | listing | ✅     | /health         | 38ms          |
   | auction | ✅     | /health         | 52ms          |
   | payment | ✅     | /health         | 41ms          |
   ```

4. **Error Log** (إذا ظهرت أخطاء):
   - قائمة بالأخطاء التي ظهرت
   - الحلول المطبقة
   - التعديلات على docker-compose.yml

### Steps - الخطوات

```bash
# 1. نسخ ملف environment
cp services/auth-service/.env.example services/auth-service/.env
# كرر لكل خدمة

# 2. تشغيل Docker Compose
docker-compose up --build

# 3. في terminal آخر، اختبار الخدمات
curl http://localhost:3001/health  # auth-service
curl http://localhost:3002/health  # listing-service
curl http://localhost:3003/health  # auction-service
curl http://localhost:3004/health  # payment-service

# 4. فحص الـ logs
docker-compose logs -f auth-service

# 5. التحقق من الاتصال بقاعدة البيانات
docker-compose exec postgres psql -U mnbara_user -d mnbara_db -c "\dt"

# 6. إيقاف والتنظيف
docker-compose down -v
```

---

## Task 3 — Add CI (GitHub Actions) — Basic ⚙️

### Description - الوصف

إعداد CI/CD pipeline أساسي باستخدام GitHub Actions لفحص الكود تلقائياً عند كل PR.

### Priority - الأولوية

🟠 **High**

### Estimated Time - الوقت المتوقع

3-4 ساعات

### Acceptance Criteria - معايير القبول

- [ ] GitHub Actions workflow يعمل على كل push/PR
- [ ] يشغل lint للكود (ESLint)
- [ ] يشغل unit tests
- [ ] يفحص Prisma migrations
- [ ] يفحص TypeScript compilation
- [ ] يعرض نتائج واضحة في PR
- [ ] يفشل PR إذا فشل أي فحص

### Deliverables - المخرجات

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

2. **Badge في README.md**:

   ```markdown
   ![CI Status](https://github.com/hossam-create/Mnbara-Platform/workflows/CI/badge.svg)
   ```

3. **Documentation** (`CI_SETUP.md`):
   - شرح كيفية عمل CI
   - كيفية إضافة tests جديدة
   - كيفية فحص النتائج

4. **Test Coverage Report**:
   - إعداد CodeCov أو مماثل
   - Badge لنسبة التغطية

### Steps - الخطوات

```bash
# 1. إنشاء مجلد workflows
mkdir -p .github/workflows

# 2. إنشاء ملف ci.yml
# (كما في الأعلى)

# 3. إضافة npm scripts في package.json الرئيسي
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

# 5. التحقق من GitHub Actions tab
```

---

## Task 4 — Create Postman Collection / OpenAPI 📚

### Description - الوصف

توثيق شامل لجميع API endpoints باستخدام Postman Collection و OpenAPI Specification.

### Priority - الأولوية

🟡 **Medium-High**

### Estimated Time - الوقت المتوقع

4-5 ساعات

### Acceptance Criteria - معايير القبول

- [ ] Postman Collection يحتوي على جميع endpoints الأساسية
- [ ] كل endpoint له:
  - [ ] Request examples
  - [ ] Response examples
  - [ ] Authentication headers
  - [ ] Environment variables
- [ ] OpenAPI 3.0 spec ملف كامل
- [ ] يمكن استيراد Collection في Postman بدون أخطاء
- [ ] Documentation واضحة ومنظمة

### Deliverables - المخرجات

1. **Postman Collection** (`postman/Mnbara-Platform.postman_collection.json`):

   ```json
   {
     "info": {
       "name": "Mnbara Platform API",
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

2. **Postman Environment** (`postman/Mnbara-Platform.postman_environment.json`):

   ```json
   {
     "name": "Mnbara Local",
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
     title: Mnbara Platform API
     version: 1.0.0
     description: Crowdshipping marketplace API

   servers:
     - url: http://localhost:3001
       description: Local development
     - url: https://mnbara-auth.onrender.com
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
   - نظرة عامة على الـ API
   - Authentication flow
   - Error handling
   - Rate limiting
   - Examples لكل endpoint

### Steps - الخطوات

```bash
# 1. إنشاء مجلد postman
mkdir -p postman docs

# 2. في Postman:
# - Create new collection
# - Add requests for each endpoint
# - Add tests and examples
# - Export as Collection v2.1

# 3. إنشاء OpenAPI spec يدوياً أو باستخدام أداة
# يمكن استخدام:
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

## Task 5 — Setup DB Migrations & Seed Script 🗄️

### Description - الوصف

إعداد نظام migrations منظم وseed scripts لتعبئة قاعدة البيانات ببيانات تجريبية.

### Priority - الأولوية

🟠 **High**

### Estimated Time - الوقت المتوقع

5-6 ساعات

### Acceptance Criteria - معايير القبول

- [ ] جميع Prisma schemas محدّثة ومتسقة
- [ ] Migration files موجودة لكل خدمة
- [ ] `npx prisma migrate deploy` ينفذ بنجاح محلياً
- [ ] Seed scripts تعبئ البيانات التجريبية:
  - [ ] Users (buyer, seller, traveler)
  - [ ] Categories
  - [ ] Sample listings
  - [ ] Sample auctions
- [ ] CI يفحص migrations تلقائياً
- [ ] Documentation واضحة للمطورين

### Deliverables - المخرجات

1. **Migration Files** (في كل خدمة):

   ```
   services/auth-service/prisma/migrations/
   ├── 20250126000001_init/
   │   └── migration.sql
   ├── 20250126000002_add_kyc/
   │   └── migration.sql
   └── migration_lock.toml
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

     console.log("✓ Users seeded");
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

4. **Updated package.json** (في كل خدمة):

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

   echo "✓ All migrations verified"
   ```

### Steps - الخطوات

```bash
# 1. تحديث Prisma schemas
cd services/auth-service
npx prisma format
npx prisma validate

# 2. إنشاء migration
npx prisma migrate dev --name initial_setup

# 3. إنشاء seed script
touch prisma/seed.ts
# (أضف الكود من الأعلى)

# 4. تشغيل seed
npx prisma db seed

# 5. التحقق
npx prisma studio  # فتح UI لقاعدة البيانات

# 6. كرر لكل خدمة
# auth-service, listing-service, auction-service, payment-service,
# crowdship-service, recommendation-service, rewards-service

# 7. Commit
git add services/*/prisma/
git commit -m "db: Add migrations and seed scripts"
```

---

## Task 6 — Add Tests for Core Flows 🧪

### Description - الوصف

كتابة unit tests و integration tests للوظائف الأساسية في المنصة.

### Priority - الأولوية

🟡 **Medium-High**

### Estimated Time - الوقت المتوقع

8-10 ساعات

### Acceptance Criteria - معايير القبول

- [ ] Test coverage > 70% للكود الأساسي
- [ ] جميع core flows لها tests:
  - [ ] Auth: signup, login, JWT refresh
  - [ ] Listings: create, update, search
  - [ ] Auctions: create, bid, auto-extend
  - [ ] Payment: checkout, wallet operations
- [ ] Tests تعمل في CI بنجاح
- [ ] Coverage badge في README
- [ ] Tests منظمة ونظيفة

### Deliverables - المخرجات

1. **Test Files Structure**:

   ```
   services/auth-service/
   ├── src/
   │   ├── controllers/
   │   │   ├── auth.controller.ts
   │   │   └── auth.controller.test.ts
   │   └── services/
   │       ├── auth.service.ts
   │       └── auth.service.test.ts
   └── tests/
       └── integration/
           └── auth.integration.test.ts
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

6. **Coverage Badge** في README:

   ```markdown
   ![Coverage](https://img.shields.io/codecov/c/github/hossam-create/Mnbara-Platform)
   ```

7. **Test Results Summary** (`TEST_COVERAGE_REPORT.md`):

   ```markdown
   # Test Coverage Report

   ## Overall Coverage: 75%

   | Service         | Coverage | Tests | Status |
   | --------------- | -------- | ----- | ------ |
   | auth-service    | 82%      | 15    | ✅     |
   | listing-service | 78%      | 12    | ✅     |
   | auction-service | 71%      | 10    | ✅     |
   | payment-service | 69%      | 8     | ⚠️     |

   ## Core Flow Coverage

   - ✅ User Registration: 100%
   - ✅ User Login: 100%
   - ✅ Create Listing: 85%
   - ✅ Search Listings: 90%
   - ✅ Place Bid: 80%
   - ✅ Checkout: 75%
   ```

### Steps - الخطوات

```bash
# 1. إعداد Jest
npm install --save-dev jest @jest/globals @types/jest ts-jest supertest @types/supertest

# 2. إنشاء jest.config.js
# (كما في الأعلى)

# 3. كتابة tests لكل خدمة
# auth-service
cd services/auth-service
touch src/controllers/auth.controller.test.ts
# (أضف الكود)

# 4. تشغيل tests
npm test

# 5. فحص coverage
npm run test:coverage

# 6. إعداد CodeCov
# في .github/workflows/ci.yml
# (تم إضافته في Task 3)

# 7. Commit
git add services/*/src/**/*.test.ts
git add jest.config.js
git commit -m "test: Add unit and integration tests for core flows"
```

---

## Task 7 — Protect Main Branch & Secrets 🔐

### Description - الوصف

تأمين main branch وإعداد GitHub Secrets لحماية المعلومات الحساسة.

### Priority - الأولوية

🔴 **Critical**

### Estimated Time - الوقت المتوقع

2-3 ساعات

### Acceptance Criteria - معايير القبول

- [ ] Main branch محمي ولا يمكن push مباشرة
- [ ] يتطلب PR review قبل الدمج
- [ ] يتطلب نجاح CI checks قبل merge
- [ ] جميع GitHub Secrets مضافة:
  - [ ] DATABASE_URL
  - [ ] REDIS_URL
  - [ ] JWT_SECRET
  - [ ] STRIPE_SECRET_KEY
  - [ ] STRIPE_PUBLIC_KEY
  - [ ] PAYPAL_CLIENT_ID
  - [ ] PAYPAL_SECRET
  - [ ] AWS credentials (optional)
- [ ] CI يستطيع الوصول للـ secrets
- [ ] Documentation للمطورين الجدد

### Deliverables - المخرجات

1. **Branch Protection Rules** (GitHub Settings):

   ```
   Settings → Branches → Add rule

   Branch name pattern: main

   Require a pull request before merging:
     ✅ Require approvals: 1
     ✅ Dismiss stale pull request approvals
     ✅ Require review from Code Owners

   Require status checks to pass:
     ✅ Require branches to be up to date
     ✅ Status checks: CI / lint, CI / test

   Require conversation resolution before merging: ✅

   Do not allow bypassing the above settings: ✅
   ```

2. **GitHub Secrets Setup** (`SECRETS_SETUP.md`):

   ```markdown
   # GitHub Secrets Configuration

   ## How to Add Secrets

   1. Go to: https://github.com/hossam-create/Mnbara-Platform/settings/secrets/actions
   2. Click "New repository secret"
   3. Add each secret below

   ## Required Secrets

   ### Database

   - `DATABASE_URL`
   ```

   postgresql://user:password@host:5432/mnbara_db

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

   ### AWS (Optional - للنشر على AWS)
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
               echo "❌ DATABASE_URL not set"
               exit 1
             else
               echo "✅ DATABASE_URL is set"
             fi

         - name: Check REDIS_URL
           run: |
             if [ -z "${{ secrets.REDIS_URL }}" ]; then
               echo "❌ REDIS_URL not set"
               exit 1
             else
               echo "✅ REDIS_URL is set"
             fi

         - name: Check JWT_SECRET
           run: |
             if [ -z "${{ secrets.JWT_SECRET }}" ]; then
               echo "❌ JWT_SECRET not set"
               exit 1
             elif [ ${#JWT_SECRET} -lt 32 ]; then
               echo "❌ JWT_SECRET too short (minimum 32 chars)"
               exit 1
             else
               echo "✅ JWT_SECRET is set and valid length"
             fi
           env:
             JWT_SECRET: ${{ secrets.JWT_SECRET }}

         - name: Summary
           run: echo "✅ All critical secrets verified"
   ```

4. **Updated CI Workflow** (`.github/workflows/ci.yml`):

   ```yaml
   # إضافة secrets للـ test job
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
         # ... (باقي الخطوات)
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

6. **Environment Template** (`.env.example` في كل خدمة):

   ```bash
   # Database
   DATABASE_URL=postgresql://mnbara_user:mnbara_pass@localhost:5432/mnbara_db

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

### Steps - الخطوات

```bash
# 1. إعداد Branch Protection على GitHub
# اذهب إلى: Settings → Branches → Add rule
# اتبع الإعدادات في Deliverable #1

# 2. إضافة Secrets على GitHub
# اذهب إلى: Settings → Secrets → Actions → New secret
# أضف كل secret من القائمة

# 3. Generate JWT_SECRET محلياً
openssl rand -base64 32

# 4. إنشاء .env.example files
for service in services/*; do
  if [ -d "$service" ]; then
    touch $service/.env.example
    # أضف المتغيرات المطلوبة
  fi
done

# 5. إنشاء verification workflow
mkdir -p .github/workflows
touch .github/workflows/verify-secrets.yml
# (أضف الكود من الأعلى)

# 6. تشغيل verification
# GitHub → Actions → Verify Secrets → Run workflow

# 7. Commit
git add .env.example .github/workflows/verify-secrets.yml
git commit -m "security: Add secrets verification and .env templates"

# 8. إنشاء PR للتجربة
git checkout -b test/branch-protection
git push origin test/branch-protection
# إنشاء PR على GitHub للتحقق من Branch Protection
```

---

## 📊 Progress Tracking - تتبع التقدم

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

## 🎯 Success Metrics - معايير النجاح

عند إنهاء جميع المهام، يجب تحقيق:

✅ **Security**: لا توجد secrets في الكود أو git history
✅ **Local Development**: كل مطور يستطيع تشغيل المشروع محلياً بسهولة
✅ **CI/CD**: كل PR يُفحص تلقائياً قبل الدمج
✅ **Documentation**: كل endpoint موثق بوضوح
✅ **Database**: نظام migrations منظم وقابل للتكرار
✅ **Testing**: coverage > 70% للكود الأساسي
✅ **Branch Protection**: main محمي من التعديلات المباشرة

---

## 📝 Notes - ملاحظات

### التنسيق بين المهام:

- **Task 1** يجب أن ينفذ أولاً (أمان)
- **Task 2, 5** يمكن تنفيذهما بالتوازي
- **Task 3** يجب أن يكون بعد Task 6 جاهز
- **Task 7** يمكن البدء فيه مبكراً لكن يكتمل في النهاية

### Tools Recommended:

- **BFG Repo-Cleaner**: لتنظيف git history
- **Docker Desktop**: للتطوير المحلي
- **Postman**: لتوثيق الـ API
- **Swagger Editor**: لـ OpenAPI spec
- **Jest**: للـ testing
- **CodeCov**: لتتبع test coverage

### References:

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**نهاية خطة العمل** | **End of Action Plan**

**Last Updated**: 2025-11-26
**Version**: 1.0.0
