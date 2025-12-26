# 🚀 دليل النشر والتحديثات - Deployment & Update Guide

**آخر تحديث:** 25 ديسمبر 2025

---

## 📋 جدول المحتويات

1. [النشر الأول (Initial Deployment)](#النشر-الأول)
2. [عملية التحديث (Update Process)](#عملية-التحديث)
3. [أنواع التحديثات](#أنواع-التحديثات)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Rollback Strategy](#rollback-strategy)
6. [Best Practices](#best-practices)

---

## 🎯 النشر الأول

### الخطوات:
```bash
# 1. Build all services
npm run build:all

# 2. Run tests
npm run test:all

# 3. Build Docker images
docker-compose -f docker-compose.prod.yml build

# 4. Push to registry
docker-compose -f docker-compose.prod.yml push

# 5. Deploy to Kubernetes
kubectl apply -f k8s/

# 6. Verify deployment
kubectl get pods -n mnbara
```

---

## 🔄 عملية التحديث

### الخطوة 1: إنشاء Branch جديد
```bash
# من main branch
git checkout main
git pull origin main

# إنشاء branch للتحديث
git checkout -b feature/new-feature-name
# أو
git checkout -b hotfix/bug-fix-name
# أو
git checkout -b release/v3.3.0
```

### الخطوة 2: عمل التغييرات
```bash
# عدل الكود المطلوب
# ...

# تأكد من الاختبارات
npm run test

# تأكد من عدم وجود أخطاء
npm run lint
npm run type-check
```

### الخطوة 3: Commit و Push
```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature-name
```

### الخطوة 4: إنشاء Pull Request
- افتح GitHub/GitLab
- أنشئ Pull Request من branch الجديد إلى main
- اطلب Code Review من الفريق
- انتظر موافقة CI/CD Pipeline

### الخطوة 5: Merge و Deploy
```bash
# بعد الموافقة، يتم الـ merge تلقائياً
# CI/CD Pipeline يعمل:
# 1. Build
# 2. Test
# 3. Deploy to Staging
# 4. Deploy to Production (بعد الموافقة)
```

---

## 📦 أنواع التحديثات

### 1️⃣ تحديث صغير (Patch) - v3.2.0 → v3.2.1
**متى؟** إصلاح bugs بسيطة
```bash
git checkout -b hotfix/fix-login-bug
# عدل الكود
git commit -m "fix: resolve login timeout issue"
```

### 2️⃣ تحديث متوسط (Minor) - v3.2.0 → v3.3.0
**متى؟** إضافة ميزات جديدة بدون كسر التوافقية
```bash
git checkout -b feature/add-dark-mode
# أضف الميزة
git commit -m "feat: add dark mode support"
```

### 3️⃣ تحديث كبير (Major) - v3.0.0 → v4.0.0
**متى؟** تغييرات كبيرة قد تكسر التوافقية
```bash
git checkout -b release/v4.0.0
# تغييرات كبيرة
git commit -m "feat!: redesign payment system"
```

---

## 🔧 تحديث كل مكون

### تحديث Backend Service
```bash
# 1. عدل الكود في backend/services/[service-name]/
cd backend/services/auth-service

# 2. اختبر محلياً
npm run dev
npm run test

# 3. Build Docker image
docker build -t mnbara/auth-service:v3.3.0 .

# 4. Push to registry
docker push mnbara/auth-service:v3.3.0

# 5. Update Kubernetes deployment
kubectl set image deployment/auth-service \
  auth-service=mnbara/auth-service:v3.3.0 -n mnbara
```

### تحديث Frontend (Web)
```bash
# 1. عدل الكود في frontend/web-app/
cd frontend/web-app

# 2. اختبر محلياً
npm run dev
npm run build

# 3. Build و Deploy
docker build -t mnbara/web-app:v3.3.0 .
docker push mnbara/web-app:v3.3.0

# 4. Update deployment
kubectl set image deployment/web-app \
  web-app=mnbara/web-app:v3.3.0 -n mnbara
```

### تحديث Flutter App
```bash
# 1. عدل الكود في mobile/flutter_app/
cd mobile/flutter_app

# 2. اختبر محلياً
flutter run

# 3. Build للإنتاج
# Android
flutter build apk --release
flutter build appbundle --release

# iOS
flutter build ios --release

# 4. رفع للمتاجر
# Android → Google Play Console
# iOS → App Store Connect
```

---

## 🤖 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: npm run test:all

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Images
        run: docker-compose build

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to Staging
        run: kubectl apply -f k8s/staging/

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        run: kubectl apply -f k8s/production/
```

---

## ⏪ Rollback Strategy

### إذا حصل مشكلة بعد التحديث:
```bash
# 1. Rollback سريع في Kubernetes
kubectl rollout undo deployment/[service-name] -n mnbara

# 2. أو ارجع لـ version معين
kubectl rollout undo deployment/auth-service \
  --to-revision=5 -n mnbara

# 3. تحقق من الحالة
kubectl rollout status deployment/auth-service -n mnbara
```

### Database Rollback
```bash
# إذا في migration جديد
npx prisma migrate reset
# أو
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## 📱 تحديث التطبيق (App Store / Play Store)

### Android (Google Play)
1. زود `versionCode` في `android/app/build.gradle`
2. Build: `flutter build appbundle --release`
3. ارفع على Google Play Console
4. اختر Release Track (Internal → Beta → Production)
5. انتظر المراجعة (عادة 1-3 أيام)

### iOS (App Store)
1. زود version في Xcode
2. Build: `flutter build ios --release`
3. Archive من Xcode
4. ارفع على App Store Connect
5. اختر TestFlight أو Production
6. انتظر المراجعة (عادة 1-7 أيام)

---

## 🎛️ Feature Flags للتحديثات الآمنة

### تفعيل ميزة جديدة تدريجياً:
```typescript
// في الكود
if (await featureService.isEnabled('new-checkout-flow', userId)) {
  // الميزة الجديدة
  return newCheckoutFlow();
} else {
  // الميزة القديمة
  return oldCheckoutFlow();
}
```

### من لوحة التحكم:
1. افتح Admin Dashboard → Feature Flags
2. أنشئ Feature Flag جديد
3. فعّل لـ 10% من المستخدمين
4. راقب الأداء
5. زود النسبة تدريجياً
6. فعّل للجميع

---

## 📊 مراقبة التحديث

### بعد كل تحديث راقب:
```bash
# 1. صحة الـ Pods
kubectl get pods -n mnbara

# 2. Logs
kubectl logs -f deployment/[service-name] -n mnbara

# 3. Metrics في Grafana
# - Response Time
# - Error Rate
# - CPU/Memory Usage

# 4. Alerts في PagerDuty/Slack
```

---

## ✅ Checklist قبل كل تحديث

- [ ] الاختبارات ناجحة 100%
- [ ] Code Review تم
- [ ] Documentation محدثة
- [ ] Database migrations جاهزة
- [ ] Rollback plan موجود
- [ ] Monitoring alerts مفعلة
- [ ] Team notified
- [ ] Backup موجود

---

## 🗓️ جدول التحديثات المقترح

| النوع | التكرار | الوقت المناسب |
|-------|---------|---------------|
| Hotfix | فوري | أي وقت |
| Patch | أسبوعي | الثلاثاء 10 صباحاً |
| Minor | شهري | أول أسبوع |
| Major | ربع سنوي | بداية الربع |

---

**آخر تحديث:** 25 ديسمبر 2025
