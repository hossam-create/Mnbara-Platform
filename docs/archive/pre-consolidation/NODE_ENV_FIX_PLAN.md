# Node.js Environment Fix Plan

## المشكلة الأساسية
جميع npm scripts تفشل مع أخطاء module resolution:
- `Cannot find module 'E:\New computer\vite\bin\vite.js'`
- `Cannot find module 'E:\New computer\typescript\bin\tsc'`

هذا يشير إلى:
1. **Corrupted node_modules** - المسارات المطلقة بدلاً من النسبية
2. **Missing dependencies** - لم يتم تثبيت npm packages
3. **Path issues** - مسارات Windows مع مسافات في الأسماء

## الحل الشامل

### المرحلة 1: تنظيف شامل
```bash
# حذف جميع node_modules والـ lock files
rm -rf node_modules package-lock.json
rm -rf frontend/web-app/node_modules frontend/web-app/package-lock.json
rm -rf backend/services/*/node_modules backend/services/*/package-lock.json

# مسح npm cache
npm cache clean --force
```

### المرحلة 2: إعادة تثبيت الـ dependencies
```bash
# Root dependencies
npm install

# Frontend
cd frontend/web-app && npm install && cd ../..

# Backend services
cd backend/services/listing-service-node && npm install && cd ../../..
cd backend/services/cart-service && npm install && cd ../../..
cd backend/services/payment-service && npm install && cd ../../..
cd backend/services/crowdship-service && npm install && cd ../../..
cd backend/services/compliance-service && npm install && cd ../../..
```

### المرحلة 3: التحقق من التثبيت
```bash
# تحقق من الـ versions
node --version
npm --version

# تحقق من الـ binaries
npx vite --version
npx tsc --version
```

### المرحلة 4: بناء الـ services
```bash
# Frontend
npm run build:frontend

# Backend services
cd backend/services/listing-service-node && npm run build && cd ../../..
cd backend/services/cart-service && npm run build && cd ../../..
cd backend/services/payment-service && npm run build && cd ../../..
```

### المرحلة 5: تشغيل الـ services
```bash
# تشغيل Docker infrastructure
docker-compose -f docker-compose.dev.yml up -d

# تشغيل الـ services
npm run start:mvp
```

## الملفات التي سيتم إنشاؤها/تعديلها

1. **fix-nodejs-env.sh** - Script شامل لإصلاح البيئة
2. **verify-nodejs-setup.sh** - Script للتحقق من التثبيت
3. **install-all-deps.sh** - Script لتثبيت جميع الـ dependencies
4. **NODE_ENV_SETUP.md** - توثيق شامل للـ setup

## الخطوات التالية
1. إنشاء الـ scripts
2. تشغيل الـ cleanup
3. إعادة التثبيت
4. التحقق من النجاح
5. توثيق النتائج
