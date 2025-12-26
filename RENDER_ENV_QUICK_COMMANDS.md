# ⚡ أوامر Render السريعة - نسخ والصق

**للاستخدام السريع - انسخ والصق الأوامر مباشرة**

---

## 🔐 توليد JWT_SECRET (اختر واحد)

### الخيار 1: Node.js (الأسهل)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### الخيار 2: OpenSSL
```bash
openssl rand -hex 32
```

### الخيار 3: Python
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 📝 أوامر Render CLI

### تسجيل الدخول
```bash
render login
```

### إنشاء قاعدة بيانات PostgreSQL
```bash
render create-database mnbara-db
```

### إنشاء Redis
```bash
render create-redis mnbara-redis
```

### إنشاء Web Service
```bash
render create-service
```

### عرض قائمة المتغيرات
```bash
render env list
```

### إضافة متغير واحد
```bash
render env add NODE_ENV production
```

### إضافة متغير مع قيمة معقدة
```bash
render env add DATABASE_URL "postgresql://user:pass@host:5432/db"
```

### حذف متغير
```bash
render env remove NODE_ENV
```

### عرض حالة الخدمة
```bash
render service status mnbara-platform
```

### عرض السجلات
```bash
render logs mnbara-platform
```

### إعادة تشغيل الخدمة
```bash
render restart mnbara-platform
```

### النشر اليدوي
```bash
render deploy mnbara-platform
```

### الرجوع للإصدار السابق
```bash
render rollback mnbara-platform
```

---

## 🚀 إضافة جميع المتغيرات دفعة واحدة

**استبدل القيم بقيمك الفعلية:**

```bash
# 1. تسجيل الدخول أولاً
render login

# 2. إضافة المتغيرات
render env add NODE_ENV production
render env add PORT 3000
render env add DATABASE_URL "postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod"
render env add REDIS_URL "redis://default:PASSWORD@dpg-xxxxx.render.internal:6379"
render env add JWT_SECRET "YOUR_JWT_SECRET_HERE"
```

---

## 🔍 اختبار الاتصالات

### اختبر قاعدة البيانات
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### اختبر Redis
```bash
redis-cli -u $REDIS_URL ping
```

### اختبر الخدمة
```bash
curl https://mnbara-platform.onrender.com/health
```

### اختبر قاعدة البيانات عبر الخدمة
```bash
curl https://mnbara-platform.onrender.com/health/db
```

---

## 📊 عرض المعلومات

### عرض جميع الخدمات
```bash
render services list
```

### عرض جميع قواعد البيانات
```bash
render databases list
```

### عرض جميع Redis
```bash
render redis list
```

### عرض تاريخ النشر
```bash
render deployments mnbara-platform
```

### عرض المقاييس
```bash
render metrics mnbara-platform
```

---

## 🔄 النشر والتحديث

### النشر التلقائي (عبر GitHub)
```bash
git add .
git commit -m "Update environment configuration"
git push origin main
```

### النشر اليدوي
```bash
render deploy mnbara-platform
```

### الرجوع للإصدار السابق
```bash
render rollback mnbara-platform
```

---

## 🆘 استكشاف الأخطاء

### عرض السجلات الكاملة
```bash
render logs mnbara-platform --tail 100
```

### عرض السجلات مع التصفية
```bash
render logs mnbara-platform --filter "error"
```

### عرض السجلات في الوقت الفعلي
```bash
render logs mnbara-platform --follow
```

### إعادة تشغيل الخدمة
```bash
render restart mnbara-platform
```

### حذف الخدمة (احذر!)
```bash
render delete mnbara-platform
```

---

## 💾 النسخ الاحتياطية

### عرض النسخ الاحتياطية
```bash
render backups list mnbara-db
```

### إنشاء نسخة احتياطية يدوية
```bash
render backup create mnbara-db
```

### استعادة من نسخة احتياطية
```bash
render backup restore mnbara-db BACKUP_ID
```

---

## 📋 قائمة التحقق السريعة

```bash
# 1. تسجيل الدخول
render login

# 2. إنشاء قاعدة البيانات
render create-database mnbara-db

# 3. إنشاء Redis
render create-redis mnbara-redis

# 4. عرض المتغيرات
render env list

# 5. إضافة المتغيرات
render env add NODE_ENV production
render env add PORT 3000
render env add DATABASE_URL "YOUR_DB_URL"
render env add REDIS_URL "YOUR_REDIS_URL"
render env add JWT_SECRET "YOUR_JWT_SECRET"

# 6. النشر
render deploy mnbara-platform

# 7. التحقق
render logs mnbara-platform
curl https://mnbara-platform.onrender.com/health
```

---

## 🎯 الخطوات الأساسية (نسخ والصق)

### الخطوة 1: توليد JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
**احفظ النتيجة في مكان آمن**

### الخطوة 2: تسجيل الدخول
```bash
render login
```

### الخطوة 3: إضافة المتغيرات
```bash
render env add NODE_ENV production
render env add PORT 3000
render env add DATABASE_URL "postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod"
render env add REDIS_URL "redis://default:PASSWORD@dpg-xxxxx.render.internal:6379"
render env add JWT_SECRET "PASTE_YOUR_JWT_SECRET_HERE"
```

### الخطوة 4: النشر
```bash
render deploy mnbara-platform
```

### الخطوة 5: التحقق
```bash
render logs mnbara-platform
```

---

## 📞 روابط مفيدة

- **Render CLI Docs:** https://render.com/docs/cli
- **Render Dashboard:** https://dashboard.render.com
- **Render Support:** https://support.render.com

---

**آخر تحديث:** 26 ديسمبر 2025

