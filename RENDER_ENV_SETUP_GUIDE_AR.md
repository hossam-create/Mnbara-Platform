# 🔐 دليل إعداد متغيرات البيئة على Render - خطوة بخطوة

**التاريخ:** 26 ديسمبر 2025  
**الحالة:** جاهز للتنفيذ  
**اللغة:** العربية

---

## 📌 ملخص سريع

أنت تحتاج إلى إضافة **5 متغيرات بيئة أساسية** على Render قبل النشر:

1. `NODE_ENV` = `production` (ثابت)
2. `PORT` = `3000` (ثابت)
3. `DATABASE_URL` (من قاعدة البيانات)
4. `REDIS_URL` (من Redis)
5. `JWT_SECRET` (مفتاح آمن)

---

## 🎯 الخطوة 1: إنشاء قاعدة البيانات PostgreSQL على Render

### الطريقة الأولى: عبر لوحة التحكم (الأسهل)

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط على **"New +"** في الزاوية العلوية اليسرى
3. اختر **"PostgreSQL"**
4. ملء البيانات:
   - **Name:** `mnbara-db`
   - **Database:** `mnbara_prod`
   - **User:** `mnbara_user`
   - **Region:** اختر الأقرب لك (مثلاً `Frankfurt` أو `Singapore`)
   - **Plan:** `Free` (للتجربة) أو `Standard` (للإنتاج)

5. اضغط **"Create Database"**
6. انتظر 2-3 دقائق حتى تنتهي عملية الإنشاء

### الطريقة الثانية: عبر Render CLI

```bash
render create-database mnbara-db
```

### ✅ بعد الإنشاء: نسخ DATABASE_URL

1. اذهب إلى **Databases** في لوحة التحكم
2. اختر `mnbara-db`
3. انسخ **Internal Database URL** (هذا هو `DATABASE_URL`)
4. يجب أن يبدو مثل:
   ```
   postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod
   ```

---

## 🎯 الخطوة 2: إنشاء Redis Cache على Render

### الطريقة الأولى: عبر لوحة التحكم

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط على **"New +"**
3. اختر **"Redis"**
4. ملء البيانات:
   - **Name:** `mnbara-redis`
   - **Region:** نفس المنطقة التي اخترتها للـ Database
   - **Plan:** `Free` (للتجربة) أو `Standard` (للإنتاج)

5. اضغط **"Create Redis"**
6. انتظر 2-3 دقائق

### الطريقة الثانية: عبر Render CLI

```bash
render create-redis mnbara-redis
```

### ✅ بعد الإنشاء: نسخ REDIS_URL

1. اذهب إلى **Redis** في لوحة التحكم
2. اختر `mnbara-redis`
3. انسخ **Internal Redis URL** (هذا هو `REDIS_URL`)
4. يجب أن يبدو مثل:
   ```
   redis://default:PASSWORD@dpg-xxxxx.render.internal:6379
   ```

---

## 🎯 الخطوة 3: توليد JWT_SECRET الآمن

### الطريقة الأولى: استخدام Node.js (الأسهل)

افتح Terminal وشغل هذا الأمر:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**النتيجة:** ستحصل على سلسلة طويلة من الأحرف والأرقام مثل:
```
a7f3e9c2b1d4f6a8e5c3b9d2f7a4e1c6b8d3f5a2e7c4b1d6f3a8e5c2b9d4f7
```

### الطريقة الثانية: استخدام OpenSSL

```bash
openssl rand -hex 32
```

### الطريقة الثالثة: استخدام Python

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### ⚠️ تحذير مهم:
- **لا تشارك هذا المفتاح مع أحد**
- **لا تضعه في GitHub**
- **احفظه في مكان آمن**

---

## 🎯 الخطوة 4: إضافة متغيرات البيئة على Render

### الطريقة الأولى: عبر لوحة التحكم (الأسهل)

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اضغط على **"New +"** → **"Web Service"**
3. اختر **"Build and deploy from a Git repository"**
4. ربط GitHub (إذا لم تربطه من قبل)
5. اختر Repository: `hossam-create/Mnbara-Platform`
6. اختر Branch: `main`
7. ملء البيانات الأساسية:
   - **Name:** `mnbara-platform`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Pro` (للإنتاج)

8. **اضغط على "Advanced" أو "Environment"**
9. أضف المتغيرات التالية:

| المتغير | القيمة | الملاحظات |
|---------|--------|----------|
| `NODE_ENV` | `production` | ثابت |
| `PORT` | `3000` | ثابت |
| `DATABASE_URL` | (انسخ من الخطوة 1) | من PostgreSQL |
| `REDIS_URL` | (انسخ من الخطوة 2) | من Redis |
| `JWT_SECRET` | (انسخ من الخطوة 3) | مفتاح آمن |

### الطريقة الثانية: عبر Render CLI

```bash
# تسجيل الدخول
render login

# إضافة المتغيرات
render env add NODE_ENV production
render env add PORT 3000
render env add DATABASE_URL "postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod"
render env add REDIS_URL "redis://default:PASSWORD@dpg-xxxxx.render.internal:6379"
render env add JWT_SECRET "a7f3e9c2b1d4f6a8e5c3b9d2f7a4e1c6b8d3f5a2e7c4b1d6f3a8e5c2b9d4f7"
```

### الطريقة الثالثة: عبر ملف render.yaml

أنشئ ملف `render.yaml` في جذر المشروع:

```yaml
services:
  - type: web
    name: mnbara-platform
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3000"
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: JWT_SECRET
        sync: false
```

---

## 🔍 التحقق من المتغيرات

### عبر لوحة التحكم:

1. اذهب إلى **Services** → اختر `mnbara-platform`
2. اضغط على **"Environment"** أو **"Settings"**
3. تحقق من أن جميع المتغيرات موجودة

### عبر Render CLI:

```bash
render env list
```

---

## 🚀 الخطوة 5: النشر على Render

### الطريقة الأولى: النشر التلقائي

```bash
# ادفع التغييرات إلى GitHub
git add .
git commit -m "Add environment variables configuration"
git push origin main

# Render سيقوم بالنشر تلقائياً
```

### الطريقة الثانية: النشر اليدوي

```bash
# عبر Render CLI
render deploy mnbara-platform

# أو عبر لوحة التحكم:
# Services → mnbara-platform → Manual Deploy
```

---

## ✅ التحقق من النشر الناجح

### 1. تحقق من حالة الخدمة

```bash
render service status mnbara-platform
```

### 2. اعرض السجلات

```bash
render logs mnbara-platform
```

### 3. اختبر الـ Health Check

```bash
curl https://mnbara-platform.onrender.com/health
```

### 4. تحقق من اتصال قاعدة البيانات

```bash
curl https://mnbara-platform.onrender.com/health/db
```

---

## 🆘 حل المشاكل الشائعة

### ❌ مشكلة: "Database connection error"

**الحل:**
1. تحقق من `DATABASE_URL` صحيح
2. تأكد من أن PostgreSQL قيد التشغيل
3. تحقق من كلمة المرور صحيحة

```bash
# اختبر الاتصال
psql $DATABASE_URL -c "SELECT 1"
```

### ❌ مشكلة: "Redis connection error"

**الحل:**
1. تحقق من `REDIS_URL` صحيح
2. تأكد من أن Redis قيد التشغيل
3. تحقق من كلمة المرور صحيحة

```bash
# اختبر الاتصال
redis-cli -u $REDIS_URL ping
```

### ❌ مشكلة: "Service won't start"

**الحل:**
1. اعرض السجلات: `render logs mnbara-platform`
2. تحقق من جميع المتغيرات موجودة
3. تحقق من أن `npm start` يعمل محلياً

### ❌ مشكلة: "Port already in use"

**الحل:**
1. تأكد من أن `PORT=3000` في المتغيرات
2. تحقق من عدم وجود خدمة أخرى على نفس المنفذ

---

## 📊 ملخص المتغيرات المطلوبة

```bash
# المتغيرات الأساسية (5 متغيرات)
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod
REDIS_URL=redis://default:PASSWORD@dpg-xxxxx.render.internal:6379
JWT_SECRET=a7f3e9c2b1d4f6a8e5c3b9d2f7a4e1c6b8d3f5a2e7c4b1d6f3a8e5c2b9d4f7
```

---

## 🎯 خطوات العمل (ملخص سريع)

1. ✅ **إنشاء PostgreSQL** على Render → نسخ `DATABASE_URL`
2. ✅ **إنشاء Redis** على Render → نسخ `REDIS_URL`
3. ✅ **توليد JWT_SECRET** باستخدام Node.js
4. ✅ **إضافة 5 متغيرات** على Render Dashboard
5. ✅ **النشر** عبر `git push` أو `render deploy`
6. ✅ **التحقق** من النشر الناجح

---

## 📞 الدعم والمساعدة

- **Render Docs:** https://render.com/docs
- **Render Support:** https://support.render.com
- **GitHub Issues:** https://github.com/hossam-create/Mnbara-Platform/issues

---

## 🎉 بعد النشر الناجح

بعد أن تنشر بنجاح، ستتمكن من:

✅ الوصول إلى التطبيق على: `https://mnbara-platform.onrender.com`  
✅ استخدام قاعدة البيانات الإنتاجية  
✅ استخدام Redis للـ Cache  
✅ تسجيل الدخول والمصادقة  
✅ معالجة الطلبات والدفع  

---

**الحالة:** ✅ جاهز للنشر  
**آخر تحديث:** 26 ديسمبر 2025  
**الإصدار:** 1.0.0

