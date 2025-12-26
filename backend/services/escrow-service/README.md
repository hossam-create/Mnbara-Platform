# 🔒 Escrow Service - خدمة الضمان

خدمة حماية المدفوعات لمنصة منبرة - ضمان آمن للمشتري والبائع

## 🚀 المميزات

### الضمان (Escrow)
- حماية المدفوعات حتى استلام المنتج
- فترة فحص قابلة للتمديد
- تحرير تلقائي للأموال
- دعم المراحل (Milestones)

### النزاعات (Disputes)
- فتح نزاع بأسباب متعددة
- رفع أدلة ومستندات
- تصعيد للإدارة
- حلول متعددة (استرداد/تقسيم/تحرير)

### المراحل (Milestones)
- تقسيم المدفوعات لمراحل
- تحرير جزئي عند إتمام كل مرحلة
- مناسب للمشاريع الكبيرة

## 📦 التثبيت

```bash
cd backend/services/escrow-service
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

## 🔌 API Endpoints

### الضمان (Escrow)
```
POST   /api/v1/escrow                    - إنشاء معاملة ضمان
GET    /api/v1/escrow/calculate-fees     - حساب الرسوم
GET    /api/v1/escrow/:escrowId          - تفاصيل الضمان
GET    /api/v1/escrow/user/:userId       - معاملات المستخدم
POST   /api/v1/escrow/:escrowId/fund     - تمويل الضمان
POST   /api/v1/escrow/:escrowId/ship     - تأكيد الشحن
POST   /api/v1/escrow/:escrowId/deliver  - تأكيد التسليم
POST   /api/v1/escrow/:escrowId/approve  - موافقة المشتري
POST   /api/v1/escrow/:escrowId/extend-inspection - تمديد الفحص
```

### النزاعات (Disputes)
```
POST   /api/v1/disputes                  - فتح نزاع
GET    /api/v1/disputes/:disputeId       - تفاصيل النزاع
GET    /api/v1/disputes/user/:userId     - نزاعات المستخدم
POST   /api/v1/disputes/:disputeId/messages - إضافة رسالة
POST   /api/v1/disputes/:disputeId/evidence - إضافة دليل
POST   /api/v1/disputes/:disputeId/escalate - تصعيد
POST   /api/v1/disputes/:disputeId/resolve - حل النزاع
```

### المراحل (Milestones)
```
POST   /api/v1/milestones/:escrowId      - إنشاء مراحل
GET    /api/v1/milestones/:escrowId      - مراحل الضمان
PATCH  /api/v1/milestones/:milestoneId/status - تحديث الحالة
POST   /api/v1/milestones/:milestoneId/release - تحرير الأموال
```

## 📊 دورة حياة الضمان

```
PENDING → FUNDED → SHIPPED → DELIVERED → INSPECTION → APPROVED → RELEASED
                                    ↓
                               DISPUTED → RESOLVED/REFUNDED
```

## 💰 الرسوم

| المبلغ | رسوم الضمان | رسوم المنصة |
|--------|-------------|-------------|
| $0-100 | $5 (min) | 1% |
| $100-1000 | 2.5% | 1% |
| $1000+ | 2.5% (max $500) | 1% |

## 📊 أمثلة الاستخدام

### إنشاء معاملة ضمان
```bash
curl -X POST http://localhost:3022/api/v1/escrow \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "buyerId": "buyer-456",
    "sellerId": "seller-789",
    "amount": 500,
    "currency": "USD",
    "paymentMethod": "STRIPE",
    "description": "iPhone 15 Pro",
    "inspectionDays": 3
  }'
```

### فتح نزاع
```bash
curl -X POST http://localhost:3022/api/v1/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "escrowId": "escrow-id",
    "initiatedBy": "buyer-456",
    "initiatorRole": "BUYER",
    "reason": "ITEM_NOT_AS_DESCRIBED",
    "description": "The item is different from the listing"
  }'
```

## 🐳 Docker

```bash
docker build -t mnbara/escrow-service .
docker run -p 3022:3022 --env-file .env mnbara/escrow-service
```

## 📝 الترخيص

MIT License - Mnbara Platform 2026
