# Sprint 0.1: إعداد البيئة المحلية - دليل التنفيذ

**التاريخ**: 1 فبراير 2026  
**الحالة**: 🚀 جاري التنفيذ  
**المدة المتوقعة**: 2-3 ساعات

---

## ✅ التحقق من المتطلبات الأساسية

### تم التحقق منها:
- ✅ **Node.js**: v22.20.0 (ممتاز!)
- ✅ **Docker**: v29.1.3 (مثبت)
- ❌ **Docker Desktop**: غير مشغل (يحتاج تشغيل)

---

## 🎯 الخطوات المطلوبة

### الخطوة 1: تشغيل Docker Desktop (5 دقائق)

**الإجراء**:
1. افتح Docker Desktop من قائمة Start
2. انتظر حتى يظهر "Docker Desktop is running"
3. تحقق من أن Docker يعمل:

```powershell
docker ps
```

**النتيجة المتوقعة**: قائمة فارغة من الحاويات (أو حاويات موجودة)

---

### الخطوة 2: تثبيت Dependencies (15-20 دقيقة)

**الإجراء**:
```powershell
# في مجلد المشروع الرئيسي
npm install
```

**ملاحظة**: قد يستغرق هذا وقتاً بسبب حجم المشروع الكبير

**النتيجة المتوقعة**: 
- تثبيت جميع الحزم بنجاح
- لا توجد أخطاء حرجة (warnings مقبولة)

---

### الخطوة 3: تشغيل قواعد البيانات (5 دقائق)

**الإجراء**:
```powershell
# تشغيل PostgreSQL و Redis
docker-compose up -d postgres redis
```

**التحقق**:
```powershell
# التحقق من أن الحاويات تعمل
docker ps

# يجب أن ترى:
# - mnbara-postgres (port 5432)
# - mnbara-redis (port 6379)
```

**النتيجة المتوقعة**: 
- حاويتان تعملان
- لا توجد أخطاء

---

### الخطوة 4: تشغيل Migrations (10-15 دقيقة)

**الإجراء**:
```powershell
# الانتظار 10 ثوانٍ لبدء PostgreSQL
timeout /t 10

# تشغيل migrations لجميع الخدمات
# سنقوم بتشغيلها خدمة بخدمة
```

**للخدمات الرئيسية**:

```powershell
# 1. Auction Service
cd backend/services/auction-service
npx prisma migrate deploy
cd ../../..

# 2. Listing Service
cd backend/services/listing-service
npx prisma migrate deploy
cd ../../..

# 3. Internal Ledger Service
cd backend/services/internal-ledger-service
npx prisma migrate deploy
cd ../../..

# 4. Decision Authority Service
cd backend/services/decision-authority-service
npx prisma migrate deploy
cd ../../..

# 5. P2P Exchange Service
cd backend/services/p2p-exchange-service
npx prisma migrate deploy
cd ../../..

# 6. Escrow Service
cd backend/services/escrow-service
npx prisma migrate deploy
cd ../../..
```

**النتيجة المتوقعة**: 
- "Migration applied successfully" لكل خدمة
- قواعد بيانات جاهزة

---

### الخطوة 5: تشغيل الخدمات (10 دقائق)

**الخيار 1: تشغيل جميع الخدمات مع Docker Compose (موصى به)**

```powershell
# تشغيل جميع الخدمات
docker-compose up
```

**الخيار 2: تشغيل الخدمات بشكل فردي (للتطوير)**

افتح نوافذ PowerShell منفصلة:

```powershell
# نافذة 1: API Gateway
cd backend/services/api-gateway
npm run dev

# نافذة 2: Auth Service
cd backend/services/auth-service
npm run dev

# نافذة 3: Listing Service
cd backend/services/listing-service
npm run dev

# نافذة 4: Auction Service
cd backend/services/auction-service
npm run dev

# نافذة 5: Frontend
cd frontend/web-app
npm run dev
```

**النتيجة المتوقعة**: 
- جميع الخدمات تعمل بدون أخطاء
- Frontend متاح على http://localhost:5173

---

### الخطوة 6: التحقق من أن كل شيء يعمل (10 دقائق)

**اختبار 1: API Gateway**
```powershell
curl http://localhost:3000/health
```
**النتيجة المتوقعة**: `{"status":"ok"}`

**اختبار 2: Frontend**
- افتح المتصفح: http://localhost:5173
- يجب أن ترى صفحة Mnbara الرئيسية
- تحقق من Console (F12) - لا توجد أخطاء

**اختبار 3: قاعدة البيانات**
```powershell
# الاتصال بـ PostgreSQL
docker exec -it mnbara-postgres psql -U postgres

# داخل psql:
\l  # عرض قواعد البيانات

# يجب أن ترى:
# - auction_service_db
# - listing_service_db
# - internal_ledger_db
# - decision_authority_db
# - p2p_exchange_db
# - escrow_service_db

# للخروج:
\q
```

---

### الخطوة 7: تشغيل الاختبارات (20-30 دقيقة)

**اختبار الخدمات الرئيسية**:

```powershell
# Auction Service
cd backend/services/auction-service
npm test
cd ../../..

# Listing Service
cd backend/services/listing-service
npm test
cd ../../..

# Internal Ledger Service
cd backend/services/internal-ledger-service
npm test
cd ../../..

# P2P Exchange Service
cd backend/services/p2p-exchange-service
npm test
cd ../../..

# Frontend
cd frontend/web-app
npm test
cd ../..
```

**النتيجة المتوقعة**: 
- معظم الاختبارات تنجح (green)
- بعض الاختبارات قد تفشل (مقبول في هذه المرحلة)

---

## ✅ معايير النجاح

بعد إكمال Sprint 0.1، يجب أن يكون لديك:

- [x] Node.js v22.20.0 مثبت
- [x] Docker Desktop يعمل
- [ ] جميع Dependencies مثبتة
- [ ] PostgreSQL و Redis يعملان
- [ ] جميع Migrations مطبقة
- [ ] جميع الخدمات تعمل محلياً
- [ ] Frontend متاح على http://localhost:5173
- [ ] لا توجد أخطاء حرجة في Console
- [ ] معظم الاختبارات تنجح

---

## 🆘 استكشاف الأخطاء

### مشكلة: Docker Desktop لا يعمل
**الحل**:
1. افتح Docker Desktop من قائمة Start
2. انتظر حتى يبدأ (قد يستغرق 1-2 دقيقة)
3. تحقق من أيقونة Docker في System Tray

### مشكلة: Port already in use
**الحل**:
```powershell
# ابحث عن العملية التي تستخدم المنفذ
netstat -ano | findstr :5432

# أوقف العملية
taskkill /PID <process_id> /F
```

### مشكلة: Database connection failed
**الحل**:
```powershell
# أعد تشغيل PostgreSQL
docker-compose restart postgres

# تحقق من السجلات
docker logs mnbara-postgres
```

### مشكلة: Migration failed
**الحل**:
```powershell
# أعد تعيين قاعدة البيانات
docker-compose down -v
docker-compose up -d postgres redis

# انتظر 10 ثوانٍ
timeout /t 10

# أعد تشغيل migrations
# (كرر الخطوة 4)
```

### مشكلة: Tests failing
**الحل**:
```powershell
# امسح node_modules وأعد التثبيت
rm -rf node_modules package-lock.json
npm install

# امسح ذاكرة الاختبارات المؤقتة
npm test -- --clearCache

# أعد تشغيل الاختبارات
npm test
```

---

## 📊 تتبع التقدم

### الحالة الحالية:
- ✅ Node.js مثبت
- ✅ Docker مثبت
- ⏳ Docker Desktop يحتاج تشغيل
- ⏳ Dependencies تحتاج تثبيت
- ⏳ قواعد البيانات تحتاج تشغيل
- ⏳ Migrations تحتاج تطبيق
- ⏳ الخدمات تحتاج تشغيل
- ⏳ الاختبارات تحتاج تشغيل

---

## 🎯 الخطوة التالية

بعد إكمال Sprint 0.1 بنجاح:
1. ✅ وثق أي مشاكل واجهتها
2. ✅ تأكد من أن كل شيء يعمل
3. ✅ انتقل إلى Sprint 0.2 (إعداد CI/CD)

---

## 📝 ملاحظات

### الوقت المتوقع لكل خطوة:
- الخطوة 1 (Docker): 5 دقائق
- الخطوة 2 (Dependencies): 15-20 دقيقة
- الخطوة 3 (قواعد البيانات): 5 دقائق
- الخطوة 4 (Migrations): 10-15 دقيقة
- الخطوة 5 (الخدمات): 10 دقائق
- الخطوة 6 (التحقق): 10 دقائق
- الخطوة 7 (الاختبارات): 20-30 دقيقة

**المجموع**: 75-95 دقيقة (1.5-2 ساعة)

---

**الحالة**: 🚀 جاري التنفيذ  
**التاريخ**: 1 فبراير 2026  
**الخطوة الحالية**: تشغيل Docker Desktop

---

## 🚀 ابدأ الآن!

**الخطوة الأولى**: شغل Docker Desktop، ثم عد هنا لمتابعة الخطوات
