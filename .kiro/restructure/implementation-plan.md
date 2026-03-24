# 📅 خطة التنفيذ التفصيلية
## Mnbara Platform Restructuring - Implementation Plan

**تاريخ البدء:** 3 مارس 2026  
**المدة المتوقعة:** 8 أسابيع  
**الحالة:** 📋 جاهز للتنفيذ

---

## 🎯 نظرة عامة

### الأهداف الرئيسية
1. ✅ توحيد البنية
2. ✅ إزالة التكرار
3. ✅ استعادة الخدمات المهمة
4. ✅ تحسين الأداء

### المبادئ الأساسية
- 🔒 لا نحذف شيء دون مراجعة
- 💾 نسخ احتياطية مستمرة
- 🧪 اختبار بعد كل خطوة
- 📝 توثيق كل تغيير

---

## 📆 الجدول الزمني

### الأسبوع 1-2: التحليل (✅ مكتمل)
- [x] جرد شامل للملفات
- [x] تحليل التبعيات
- [x] تحديد الأفكار المتداخلة
- [x] إعداد التقارير

### الأسبوع 3-4: إنشاء البنية الجديدة
- [ ] إنشاء المجلدات
- [ ] إعداد Monorepo
- [ ] إنشاء Packages
- [ ] إعداد الإعدادات

### الأسبوع 5-6: الدمج والاستعادة
- [ ] نقل التطبيقات
- [ ] استعادة الخدمات
- [ ] دمج الكود
- [ ] توحيد التبعيات

### الأسبوع 7-8: الاختبار والتحسين
- [ ] اختبار شامل
- [ ] تحسين الأداء
- [ ] مراجعة الكود
- [ ] إعداد CI/CD

---

## 📋 المرحلة 2: إنشاء البنية الجديدة (الأسبوع 3-4)

### اليوم 1-2: إعداد Monorepo

#### الخطوة 1: اختيار أداة Monorepo
**الخيارات:**
- Nx (موصى به) ⭐
- Turborepo
- Lerna

**القرار:** استخدام Nx

#### الخطوة 2: التثبيت
```bash
# تثبيت Nx
npm install -g nx

# إنشاء workspace
npx create-nx-workspace@latest mnbara-platform \
  --preset=empty \
  --packageManager=npm
```

#### الخطوة 3: إعداد البنية
```bash
cd mnbara-platform

# إنشاء المجلدات الرئيسية
mkdir -p apps/web
mkdir -p apps/mobile
mkdir -p services/core
mkdir -p services/marketplace
mkdir -p services/crowdshipping
mkdir -p services/financial
mkdir -p packages
mkdir -p infrastructure
mkdir -p docs
```

---

### اليوم 3-4: إنشاء Packages المشتركة

#### Package 1: @mnbara/types
```bash
nx generate @nx/js:library types \
  --directory=packages/types \
  --publishable \
  --importPath=@mnbara/types
```

**الملفات:**
```
packages/types/
├── src/
│   ├── index.ts
│   ├── user.types.ts
│   ├── order.types.ts
│   ├── payment.types.ts
│   └── common.types.ts
├── package.json
└── tsconfig.json
```

#### Package 2: @mnbara/ui-components
```bash
nx generate @nx/react:library ui-components \
  --directory=packages/ui-components \
  --publishable \
  --importPath=@mnbara/ui-components
```

#### Package 3: @mnbara/utils
```bash
nx generate @nx/js:library utils \
  --directory=packages/utils \
  --publishable \
  --importPath=@mnbara/utils
```

#### Package 4: @mnbara/api-client
```bash
nx generate @nx/js:library api-client \
  --directory=packages/api-client \
  --publishable \
  --importPath=@mnbara/api-client
```

#### Package 5: @mnbara/validation
```bash
nx generate @nx/js:library validation \
  --directory=packages/validation \
  --publishable \
  --importPath=@mnbara/validation
```

---

### اليوم 5-7: إعداد التطبيقات

#### Web Application
```bash
nx generate @nx/react:application web \
  --directory=apps/web \
  --style=css \
  --bundler=vite \
  --e2eTestRunner=playwright
```

#### Mobile Application
```bash
nx generate @nx/react-native:application mobile \
  --directory=apps/mobile
```

---

### اليوم 8-10: إعداد الخدمات

#### Core Services
```bash
# Auth Service
nx generate @nx/node:application auth-service \
  --directory=services/core/auth-service

# User Service
nx generate @nx/node:application user-service \
  --directory=services/core/user-service

# Notification Service
nx generate @nx/node:application notification-service \
  --directory=services/core/notification-service
```

#### Marketplace Services
```bash
# Product Service
nx generate @nx/node:application product-service \
  --directory=services/marketplace/product-service

# Order Service
nx generate @nx/node:application order-service \
  --directory=services/marketplace/order-service

# Cart Service
nx generate @nx/node:application cart-service \
  --directory=services/marketplace/cart-service
```

---

### اليوم 11-14: إعداد الإعدادات

#### Root package.json
```json
{
  "name": "mnbara-platform",
  "version": "2.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "services/**/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "nx run-many --target=serve --all",
    "build": "nx run-many --target=build --all",
    "test": "nx run-many --target=test --all",
    "lint": "nx run-many --target=lint --all"
  }
}
```

#### Root tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@mnbara/types": ["packages/types/src/index.ts"],
      "@mnbara/ui-components": ["packages/ui-components/src/index.ts"],
      "@mnbara/utils": ["packages/utils/src/index.ts"],
      "@mnbara/api-client": ["packages/api-client/src/index.ts"],
      "@mnbara/validation": ["packages/validation/src/index.ts"]
    }
  }
}
```

---

## 📋 المرحلة 3: الدمج والاستعادة (الأسبوع 5-6)

### اليوم 15-17: نقل Frontend

#### الخطوة 1: نقل Web App
```bash
# نسخ الملفات
cp -r frontend/web-app/src/* apps/web/src/

# تحديث الاستيرادات
# استبدال المسارات النسبية بـ @mnbara/*
```

#### الخطوة 2: دمج Admin Dashboard
```bash
# نقل مكونات Admin
cp -r frontend/admin-dashboard/src/* apps/web/src/admin/
```

---

### اليوم 18-21: نقل Backend Services

#### الخطوة 1: نقل الخدمات النشطة
```bash
# لكل خدمة في backend/services/
for service in backend/services/*; do
  service_name=$(basename $service)
  # تحديد الفئة (core, marketplace, crowdshipping, financial)
  # نقل إلى الموقع المناسب
done
```

---

### اليوم 22-25: استعادة من الأرشيف

#### خدمات عالية الأولوية
```bash
# Decision Authority Service
cp -r archive/legacy-services/decision-authority-service \
  services/core/decision-authority-service

# P2P Exchange Service
cp -r archive/legacy-services/p2p-exchange-service \
  services/marketplace/p2p-exchange-service

# Internal Ledger Service
cp -r archive/legacy-services/internal-ledger-service \
  services/financial/internal-ledger-service

# Auction Service
cp -r archive/legacy-services/auction-service \
  services/marketplace/auction-service

# Listing Service
cp -r archive/legacy-services/listing-service \
  services/marketplace/listing-service
```

---

### اليوم 26-28: توحيد التبعيات

#### الخطوة 1: تحديث package.json
```bash
# تحديث جميع الخدمات لاستخدام التبعيات من root
```

#### الخطوة 2: حذف node_modules المكررة
```bash
# حذف node_modules من كل خدمة
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# تثبيت من root
npm install
```

---

## 📋 المرحلة 4: الاختبار والتحسين (الأسبوع 7-8)

### اليوم 29-32: الاختبار الشامل

#### Unit Tests
```bash
nx run-many --target=test --all
```

#### Integration Tests
```bash
nx run-many --target=test:integration --all
```

#### E2E Tests
```bash
nx run-many --target=e2e --all
```

---

### اليوم 33-36: تحسين الأداء

#### Build Optimization
```bash
# تحسين وقت البناء
nx run-many --target=build --all --parallel=5
```

#### Bundle Size Analysis
```bash
# تحليل حجم الحزم
nx run web:analyze
```

---

### اليوم 37-42: المراجعة النهائية

#### Code Review
- مراجعة جميع الملفات المنقولة
- التأكد من جودة الكود
- تطبيق معايير الكود

#### Documentation
- توثيق البنية الجديدة
- تحديث README
- إنشاء أدلة المطورين

#### CI/CD Setup
- إعداد GitHub Actions
- إعداد automated tests
- إعداد deployment pipelines

---

## ✅ معايير القبول

### Technical
- [ ] جميع الاختبارات تعمل
- [ ] وقت البناء < 10 دقائق
- [ ] لا توجد تبعيات مكررة
- [ ] TypeScript بدون أخطاء

### Organizational
- [ ] بنية واضحة ومنظمة
- [ ] توثيق كامل
- [ ] معايير كود موحدة

### Functional
- [ ] جميع الميزات تعمل
- [ ] الأداء محسّن
- [ ] جاهز للإنتاج

---

## 🚨 خطة الطوارئ

### إذا حدثت مشاكل
1. الرجوع للنسخة الاحتياطية
2. تحليل المشكلة
3. إصلاح المشكلة
4. إعادة المحاولة

### نقاط الرجوع
- بعد كل مرحلة رئيسية
- قبل أي تغيير كبير
- عند اكتشاف مشكلة

---

**الحالة:** 📋 جاهز للتنفيذ - انتظار الموافقة
