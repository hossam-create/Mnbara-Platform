# Sprint 0.1 - Hybrid Approach (Option 3)

**التاريخ**: 2 فبراير 2026  
**الوقت**: 00:20  
**الحالة**: 🚀 تنفيذ الحل الهجين

---

## 📋 الاستراتيجية

بما أن Docker لا يستطيع تحميل images بسبب مشكلة الشبكة، سنستخدم:

1. ✅ **PostgreSQL من Docker** (يعمل بالفعل)
2. ✅ **Redis من Docker** (يعمل بالفعل)
3. 🔄 **الخدمات محلياً** (npm run dev)

---

## 🎯 الخطوات

### الخطوة 1: التحقق من قواعد البيانات ✅
```powershell
docker ps
```

**النتيجة**: PostgreSQL و Redis يعملان ✅

### الخطوة 2: إصلاح .env files لجميع الخدمات

نحتاج تحديث DATABASE_URL في كل خدمة:

```
DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/mnbarh_dev
```

**الخدمات التي تحتاج تحديث**:
- ✅ auction-service (تم)
- ⏳ listing-service
- ⏳ internal-ledger-service
- ⏳ decision-authority-service
- ⏳ p2p-exchange-service
- ⏳ escrow-service

### الخطوة 3: إنشاء قواعد البيانات

```powershell
# إنشاء قواعد البيانات المطلوبة
docker exec mnbara-platform-postgres-1 psql -U mnbarh -d mnbarh_dev -c "
CREATE SCHEMA IF NOT EXISTS auction;
CREATE SCHEMA IF NOT EXISTS listing;
CREATE SCHEMA IF NOT EXISTS ledger;
CREATE SCHEMA IF NOT EXISTS decision;
CREATE SCHEMA IF NOT EXISTS p2p_exchange;
CREATE SCHEMA IF NOT EXISTS escrow;
"
```

### الخطوة 4: تشغيل Prisma Generate لكل خدمة

```powershell
# Auction Service
cd backend/services/auction-service
npx prisma generate
cd ../../..

# Listing Service
cd backend/services/listing-service
npx prisma generate
cd ../../..

# وهكذا لباقي الخدمات...
```

### الخطوة 5: تشغيل الخدمات محلياً

```powershell
# في terminal منفصل لكل خدمة
cd backend/services/auction-service
npm run dev
```

---

## 💡 المزايا

1. **لا يحتاج Docker images** - نتجنب مشكلة الشبكة
2. **أسرع في التطوير** - hot reload يعمل
3. **سهل التعديل** - يمكن تعديل الكود مباشرة
4. **يستخدم قواعد البيانات من Docker** - موثوقة ومعزولة

---

## 📊 الوقت المتوقع

- تحديث .env files: 5 دقائق
- إنشاء schemas: 2 دقيقة
- Prisma generate: 10 دقائق
- تشغيل الخدمات: 5 دقائق
- **المجموع**: ~20-25 دقيقة

---

## 🚀 البدء الآن

**الخطوة التالية**: تحديث .env files لجميع الخدمات

---

**آخر تحديث**: 2 فبراير 2026 - 00:20
