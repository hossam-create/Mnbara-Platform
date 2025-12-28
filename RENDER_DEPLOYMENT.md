# Render Deployment Guide

دليل شامل للنشر على Render - كل ما تحتاجه في ملف واحد

## جدول المحتويات
1. [البدء السريع](#البدء-السريع)
2. [المتطلبات](#المتطلبات)
3. [خطوات النشر](#خطوات-النشر)
4. [إعدادات البيئة](#إعدادات-البيئة)
5. [استكشاف الأخطاء](#استكشاف-الأخطاء)
6. [الأسئلة الشائعة](#الأسئلة-الشائعة)

---

## البدء السريع

### الخطوة 1: إنشاء حساب Render
1. اذهب إلى [render.com](https://render.com)
2. سجل حساباً جديداً أو سجل الدخول
3. ربط حسابك بـ GitHub

### الخطوة 2: إنشاء خدمة جديدة
```bash
# من لوحة التحكم Render:
1. اضغط "New +"
2. اختر "Web Service"
3. اختر المستودع الخاص بك
4. اختر الفرع (main/master)
```

### الخطوة 3: إعدادات أساسية
```
Name: mnbara-platform
Environment: Node
Build Command: npm install && npm run build
Start Command: npm start
```

---

## المتطلبات

### قبل البدء تأكد من:
- [ ] حساب GitHub مع المستودع
- [ ] حساب Render
- [ ] متغيرات البيئة جاهزة
- [ ] قاعدة البيانات (PostgreSQL/MongoDB)

### ملف package.json يجب أن يحتوي على:
```json
{
  "scripts": {
    "build": "npm run build:all",
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts"
  }
}
```

---

## خطوات النشر

### 1. إعداد المستودع
```bash
# تأكد من وجود .gitignore
node_modules/
.env
dist/
build/

# تأكد من وجود render.yaml (اختياري)
```

### 2. إضافة متغيرات البيئة
في لوحة Render:
```
Environment → Add Environment Variable

DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
JWT_SECRET=your-secret-key
API_PORT=10000
```

### 3. نشر التطبيق
```bash
# الطريقة 1: من لوحة Render
1. اضغط "Deploy"
2. انتظر انتهاء البناء

# الطريقة 2: من CLI
render deploy --service-id=<service-id>
```

### 4. التحقق من النشر
```bash
# تحقق من السجلات
render logs --service-id=<service-id>

# اختبر الخدمة
curl https://your-service.onrender.com/health
```

---

## إعدادات البيئة

### متغيرات مهمة
```env
# قاعدة البيانات
DATABASE_URL=postgresql://user:password@host:5432/database
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database

# التطبيق
NODE_ENV=production
PORT=10000
API_URL=https://your-service.onrender.com

# الأمان
JWT_SECRET=your-jwt-secret-key
API_KEY=your-api-key

# الخدمات الخارجية
STRIPE_KEY=your-stripe-key
SENDGRID_API_KEY=your-sendgrid-key
```

### ملف .env.render
```env
# انسخ من .env.example وعدّل القيم
DATABASE_URL=postgresql://...
NODE_ENV=production
```

---

## استكشاف الأخطاء

### المشكلة: Build Failed
```
الحل:
1. تحقق من package.json
2. تأكد من وجود build script
3. تحقق من node_modules في .gitignore
4. جرب: npm install && npm run build محلياً
```

### المشكلة: Application Crashed
```
الحل:
1. افتح السجلات: render logs
2. تحقق من متغيرات البيئة
3. تأكد من DATABASE_URL صحيح
4. تحقق من PORT = 10000
```

### المشكلة: Database Connection Error
```
الحل:
1. تحقق من DATABASE_URL
2. تأكد من أن قاعدة البيانات تقبل الاتصالات الخارجية
3. أضف IP Render إلى Whitelist
4. اختبر الاتصال محلياً أولاً
```

### المشكلة: Timeout
```
الحل:
1. زيادة timeout في Render settings
2. تحقق من استهلاك الموارد
3. قد تحتاج إلى خطة مدفوعة
```

---

## الأسئلة الشائعة

### س: كم تكلفة Render؟
ج: خطة مجانية محدودة، خطط مدفوعة من $7/شهر

### س: هل يدعم HTTPS؟
ج: نعم، تلقائياً مع شهادة Let's Encrypt

### س: كيف أحدّث التطبيق؟
ج: ادفع إلى GitHub، Render سينشر تلقائياً

### س: هل يدعم قواعد بيانات متعددة؟
ج: نعم، أضف متغيرات بيئة لكل قاعدة

### س: كيف أراقب الأداء؟
ج: استخدم Render Dashboard أو أدوات خارجية

### س: هل يمكن استخدام Docker؟
ج: نعم، أضف Dockerfile و render.yaml

---

## أوامر مفيدة

```bash
# عرض السجلات
render logs --service-id=<id> --tail=100

# إعادة تشغيل الخدمة
render restart --service-id=<id>

# حذف الخدمة
render delete --service-id=<id>

# عرض الحالة
render status --service-id=<id>
```

---

## ملف render.yaml (اختياري)

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
      - key: DATABASE_URL
        sync: false
```

---

## نصائح مهمة

1. **استخدم متغيرات البيئة** - لا تضع أسرار في الكود
2. **اختبر محلياً أولاً** - تأكد من أن كل شيء يعمل
3. **راقب السجلات** - تحقق من الأخطاء بسرعة
4. **استخدم CI/CD** - اجعل النشر تلقائياً
5. **احتفظ بنسخة احتياطية** - من قاعدة البيانات

---

## روابط مفيدة

- [Render Documentation](https://render.com/docs)
- [Render Dashboard](https://dashboard.render.com)
- [Render CLI](https://render.com/docs/cli)
- [PostgreSQL on Render](https://render.com/docs/databases)

---

**آخر تحديث:** ديسمبر 2025
