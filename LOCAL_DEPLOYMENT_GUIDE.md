# 🏠 دليل النشر المحلي - Mnbara Platform

**الحالة:** ✅ جاهز للنشر المحلي  
**التاريخ:** 26 ديسمبر 2025  
**المدة:** 15-20 دقيقة

---

## 📋 المتطلبات

### 1. تثبيت البرامج المطلوبة

```bash
# تحقق من التثبيت
node --version      # يجب أن يكون >=18.0.0
npm --version       # يجب أن يكون >=9.0.0
docker --version    # تحقق من تثبيت Docker
docker-compose --version
```

### 2. إذا لم تثبت Docker

**Windows/Mac:**
- حمل [Docker Desktop](https://www.docker.com/products/docker-desktop)
- ثبت واتبع التعليمات

**Linux:**
```bash
sudo apt-get install docker.io docker-compose
```

---

## 🚀 خطوات النشر المحلي

### الخطوة 1: تحضير المشروع

```bash
# انتقل إلى مجلد المشروع
cd mnbara-platform

# ثبت المكتبات الأساسية
npm install

# ثبت مكتبات كل workspace
npm install --workspaces
```

### الخطوة 2: إنشاء ملف .env

```bash
# انسخ الملف النموذجي
cp .env.example .env

# أو أنشئ ملف جديد بهذا المحتوى:
```

**محتوى `.env`:**
```
# Database
POSTGRES_DB=mnbara
POSTGRES_USER=mnbara
POSTGRES_PASSWORD=mnbara_dev_password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-256-bit-key-for-security

# Node Environment
NODE_ENV=development

# API Gateway
API_GATEWAY_PORT=8080

# Services Ports
AUTH_SERVICE_PORT=3001
LISTING_SERVICE_PORT=3002
PAYMENT_SERVICE_PORT=3003
ORDERS_SERVICE_PORT=3004
NOTIFICATION_SERVICE_PORT=3005

# Frontend
FRONTEND_PORT=3000
ADMIN_DASHBOARD_PORT=3001

# Optional: Third-party APIs
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
OPENAI_API_KEY=your-openai-api-key
```

### الخطوة 3: بدء Docker Containers

```bash
# بدء جميع الخدمات
docker-compose up -d

# أو بدء مع عرض السجلات
docker-compose up

# تحقق من حالة الخدمات
docker-compose ps
```

**ستستغرق المرة الأولى 5-10 دقائق لتحميل الصور وبناء الخدمات**

### الخطوة 4: تهيئة قاعدة البيانات

```bash
# انتظر حتى تكون PostgreSQL جاهزة (حوالي 30 ثانية)
sleep 30

# قم بتشغيل migrations
npm run migrate --workspace=@mnbara/auth-service
npm run migrate --workspace=@mnbara/listing-service
npm run migrate --workspace=@mnbara/payment-service
```

### الخطوة 5: بدء الخدمات المحلية (اختياري)

إذا أردت تشغيل خدمة معينة محلياً بدلاً من Docker:

```bash
# بدء API Gateway محلياً
cd backend/services/api-gateway
npm install
npm run dev

# في terminal آخر - بدء Auth Service
cd backend/services/auth-service
npm install
npm run dev

# في terminal آخر - بدء Frontend
cd frontend/web-app
npm install
npm run dev
```

---

## 🌐 الوصول إلى التطبيق

بعد البدء، يمكنك الوصول إلى:

| الخدمة | الرابط | الوصف |
|--------|--------|--------|
| **Web App** | http://localhost:3000 | التطبيق الرئيسي |
| **Admin Dashboard** | http://localhost:3001 | لوحة التحكم |
| **API Gateway** | http://localhost:8080 | بوابة API |
| **Auth Service** | http://localhost:3001 | خدمة المصادقة |
| **Listing Service** | http://localhost:3002 | خدمة المنتجات |
| **Payment Service** | http://localhost:3003 | خدمة الدفع |
| **Grafana** | http://localhost:3002 | المراقبة |
| **Prometheus** | http://localhost:9090 | المقاييس |
| **RabbitMQ** | http://localhost:15672 | رسائل (user: mnbara, pass: mnbara_dev_password) |

---

## 🔍 التحقق من الحالة

### تحقق من جميع الخدمات

```bash
# عرض حالة جميع الحاويات
docker-compose ps

# عرض السجلات
docker-compose logs -f

# عرض سجلات خدمة معينة
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f api-gateway
```

### اختبر API Gateway

```bash
# اختبر الاتصال
curl http://localhost:8080/health

# يجب أن ترى استجابة مثل:
# {"status": "ok", "timestamp": "2025-12-26T..."}
```

### اختبر قاعدة البيانات

```bash
# الاتصال بـ PostgreSQL
psql -h localhost -U mnbara -d mnbara

# أو استخدم Docker
docker-compose exec postgres psql -U mnbara -d mnbara
```

---

## 🛑 إيقاف الخدمات

```bash
# إيقاف جميع الخدمات
docker-compose down

# إيقاف وحذف البيانات
docker-compose down -v

# إيقاف خدمة معينة
docker-compose stop postgres
docker-compose stop redis
```

---

## 🔧 استكشاف الأخطاء

### المشكلة: Port مستخدم بالفعل

```bash
# ابحث عن العملية التي تستخدم المنفذ
lsof -i :3000  # على Mac/Linux
netstat -ano | findstr :3000  # على Windows

# أو غير المنفذ في docker-compose.yml
# من: "3000:3000"
# إلى: "3001:3000"
```

### المشكلة: Docker لا يعمل

```bash
# تحقق من حالة Docker
docker ps

# إعادة تشغيل Docker
# Windows/Mac: أعد تشغيل Docker Desktop
# Linux:
sudo systemctl restart docker
```

### المشكلة: قاعدة البيانات لا تتصل

```bash
# تحقق من حالة PostgreSQL
docker-compose logs postgres

# أعد بناء الحاوية
docker-compose down
docker-compose up -d postgres
sleep 30
docker-compose up -d
```

### المشكلة: npm install بطيء

```bash
# استخدم npm cache clean
npm cache clean --force

# أو استخدم yarn بدلاً من npm
npm install -g yarn
yarn install
```

---

## 📊 مراقبة الأداء

### استخدم Grafana

1. اذهب إلى: http://localhost:3002
2. اسم المستخدم: admin
3. كلمة المرور: admin
4. أضف Prometheus كمصدر بيانات

### استخدم Prometheus

1. اذهب إلى: http://localhost:9090
2. اكتب استعلام مثل: `up`
3. اضغط Execute

---

## 🔄 تطوير محلي

### بدء خدمة واحدة للتطوير

```bash
# بدء API Gateway مع hot reload
cd backend/services/api-gateway
npm run dev

# بدء Frontend مع hot reload
cd frontend/web-app
npm run dev

# بدء Auth Service مع hot reload
cd backend/services/auth-service
npm run dev
```

### تشغيل الاختبارات

```bash
# اختبر جميع الخدمات
npm run test --workspaces

# اختبر خدمة معينة
npm run test --workspace=@mnbara/api-gateway

# اختبر مع coverage
npm run test:coverage --workspace=@mnbara/api-gateway
```

---

## 📝 ملاحظات مهمة

1. **المرة الأولى:** قد تستغرق 10-15 دقيقة لتحميل جميع الصور وبناء الخدمات
2. **الذاكرة:** تأكد من أن لديك 4GB RAM على الأقل متاحة
3. **المنافذ:** تأكد من عدم استخدام المنافذ 3000-3028 و 5432 و 6379 و 9200
4. **البيانات:** البيانات تُحفظ في volumes، لذا ستبقى حتى بعد إيقاف الخدمات
5. **الأمان:** لا تستخدم كلمات المرور الافتراضية في الإنتاج

---

## ✅ قائمة التحقق

- [ ] تثبيت Node.js >=18.0.0
- [ ] تثبيت Docker و Docker Compose
- [ ] استنساخ المشروع
- [ ] تثبيت المكتبات: `npm install --workspaces`
- [ ] إنشاء ملف `.env`
- [ ] بدء Docker: `docker-compose up -d`
- [ ] انتظر 30 ثانية لتهيئة قاعدة البيانات
- [ ] اختبر الوصول: http://localhost:3000
- [ ] اختبر API: http://localhost:8080/health

---

## 🎉 النتيجة

بعد اتباع هذه الخطوات، يجب أن تكون:

✅ جميع الخدمات تعمل محلياً  
✅ قاعدة البيانات متصلة  
✅ Redis يعمل  
✅ Frontend متاح على http://localhost:3000  
✅ API Gateway متاح على http://localhost:8080  

---

## 📞 الدعم

إذا واجهت مشاكل:

1. تحقق من السجلات: `docker-compose logs -f`
2. تحقق من المنافذ: `docker-compose ps`
3. أعد تشغيل الخدمات: `docker-compose restart`
4. امسح كل شيء وابدأ من جديد: `docker-compose down -v && docker-compose up -d`

---

**النشر المحلي جاهز! 🚀**

