# Node.js Environment Setup Guide

## المشكلة الأساسية

المشروع يعاني من مشاكل في Node.js environment:
- جميع npm scripts تفشل مع أخطاء module resolution
- المسارات المطلقة بدلاً من النسبية في node_modules
- Dependencies غير مثبتة بشكل صحيح

## الحل السريع (Quick Fix)

### على Linux/Mac:
```bash
bash scripts/fix-nodejs-env.sh
```

### على Windows:
```cmd
scripts\fix-nodejs-env.bat
```

## الحل التفصيلي (Manual Steps)

### 1. التحقق من المتطلبات

تأكد من تثبيت:
- **Node.js**: v22.20.0 أو أحدث
- **npm**: v10.0.0 أو أحدث
- **Docker**: للـ database infrastructure
- **Docker Compose**: لتشغيل الـ services

```bash
node --version
npm --version
docker --version
docker-compose --version
```

### 2. تنظيف شامل

```bash
# حذف جميع node_modules
rm -rf node_modules
rm -rf frontend/web-app/node_modules
find backend/services -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# حذف جميع lock files
rm -rf package-lock.json
rm -rf frontend/web-app/package-lock.json
find backend/services -name "package-lock.json" -type f -delete 2>/dev/null || true

# مسح npm cache
npm cache clean --force
```

### 3. إعادة تثبيت الـ Dependencies

#### Root Dependencies:
```bash
npm install
```

#### Frontend Dependencies:
```bash
cd frontend/web-app
npm install
cd ../..
```

#### Backend Services:
```bash
# Listing Service
cd backend/services/listing-service-node
npm install
cd ../../..

# Cart Service
cd backend/services/cart-service
npm install
cd ../../..

# Payment Service
cd backend/services/payment-service
npm install
cd ../../..

# Crowdship Service
cd backend/services/crowdship-service
npm install
cd ../../..

# Compliance Service
cd backend/services/compliance-service
npm install
cd ../../..
```

### 4. التحقق من التثبيت

```bash
# تحقق من الـ versions
node --version
npm --version

# تحقق من الـ binaries
npx vite --version
npx tsc --version

# أو استخدم الـ verification script
bash scripts/verify-nodejs-setup.sh  # Linux/Mac
scripts\verify-nodejs-setup.bat      # Windows
```

### 5. بناء الـ Services

```bash
# Frontend
npm run build:frontend

# Backend Services
cd backend/services/listing-service-node && npm run build && cd ../../..
cd backend/services/cart-service && npm run build && cd ../../..
cd backend/services/payment-service && npm run build && cd ../../..
```

## تشغيل الـ Services

### تشغيل MVP كامل:
```bash
npm run start:mvp        # Linux/Mac
npm run start:mvp:win    # Windows
```

### تشغيل services فردية:
```bash
npm run dev:listing      # Listing Service
npm run dev:cart         # Cart Service
npm run dev:payment      # Payment Service
```

### تشغيل Frontend فقط:
```bash
npm run dev:frontend
```

## الـ Environment Variables

تأكد من وجود `.env.mvp` مع الـ configuration الصحيحة:

```env
# Database
DATABASE_URL=postgresql://mnbara:mnbara_dev@localhost:5432/mnbara_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev-secret-key-change-in-production

# Service Ports
LISTING_SERVICE_PORT=3001
CART_SERVICE_PORT=3002
PAYMENT_SERVICE_PORT=3003
CROWDSHIP_SERVICE_PORT=3004
COMPLIANCE_SERVICE_PORT=3005

# Frontend
VITE_API_BASE_URL=http://localhost:3001
VITE_CART_API_URL=http://localhost:3002
VITE_PAYMENT_API_URL=http://localhost:3003
VITE_CROWDSHIP_API_URL=http://localhost:3004
VITE_COMPLIANCE_API_URL=http://localhost:3005
```

## استكشاف الأخطاء

### المشكلة: "Cannot find module 'vite'"
**الحل:**
```bash
# تأكد من تثبيت frontend dependencies
cd frontend/web-app
npm install
cd ../..

# أو استخدم الـ fix script
bash scripts/fix-nodejs-env.sh
```

### المشكلة: "Cannot find module 'typescript'"
**الحل:**
```bash
# تأكد من تثبيت root dependencies
npm install

# أو استخدم الـ fix script
bash scripts/fix-nodejs-env.sh
```

### المشكلة: "Port already in use"
**الحل:**
```bash
# تحقق من الـ ports المستخدمة
lsof -i :3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# أو غير الـ ports في .env.mvp
```

### المشكلة: "Docker containers not starting"
**الحل:**
```bash
# تحقق من Docker
docker ps

# ابدأ Docker
docker-compose -f docker-compose.dev.yml up -d

# شاهد الـ logs
docker-compose -f docker-compose.dev.yml logs -f
```

## الـ Scripts المتاحة

| Script | الوصف |
|--------|-------|
| `fix-nodejs-env.sh` | إصلاح شامل للـ Node.js environment (Linux/Mac) |
| `fix-nodejs-env.bat` | إصلاح شامل للـ Node.js environment (Windows) |
| `verify-nodejs-setup.sh` | التحقق من التثبيت (Linux/Mac) |
| `verify-nodejs-setup.bat` | التحقق من التثبيت (Windows) |
| `install-all-deps.sh` | تثبيت جميع الـ dependencies (Linux/Mac) |

## الـ npm Scripts

| Script | الوصف |
|--------|-------|
| `npm start` | تشغيل Frontend |
| `npm run dev:frontend` | تطوير Frontend |
| `npm run build:frontend` | بناء Frontend |
| `npm run dev:listing` | تطوير Listing Service |
| `npm run dev:cart` | تطوير Cart Service |
| `npm run dev:payment` | تطوير Payment Service |
| `npm run start:mvp` | تشغيل MVP كامل (Linux/Mac) |
| `npm run start:mvp:win` | تشغيل MVP كامل (Windows) |
| `npm run verify` | التحقق من الـ services (Linux/Mac) |
| `npm run verify:win` | التحقق من الـ services (Windows) |

## الخطوات التالية

بعد إصلاح Node.js environment:

1. ✅ تشغيل الـ services بنجاح
2. ⏭️ إصلاح API Gateway configuration
3. ⏭️ توحيد الـ frontend و backend communication
4. ⏭️ كتابة comprehensive tests
5. ⏭️ إعداد deployment pipeline

## الدعم والمساعدة

إذا واجهت مشاكل:

1. تحقق من الـ logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f
   ```

2. استخدم الـ verification script:
   ```bash
   bash scripts/verify-nodejs-setup.sh
   ```

3. جرب الـ fix script:
   ```bash
   bash scripts/fix-nodejs-env.sh
   ```

4. تحقق من الـ environment variables:
   ```bash
   cat .env.mvp
   ```
