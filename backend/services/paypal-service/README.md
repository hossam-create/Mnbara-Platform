# 💳 PayPal Service - خدمة PayPal

خدمة تكامل PayPal لمنصة منبرة - دفع فوري وآمن

## 🚀 المميزات

### الدفع (Payments)
- إنشاء طلبات دفع PayPal
- التقاط المدفوعات
- دعم عملات متعددة
- تتبع المعاملات

### الاسترداد (Refunds)
- استرداد كامل أو جزئي
- تتبع حالة الاسترداد
- أسباب متعددة للاسترداد

### التجار (Merchants)
- تسجيل التجار (Onboarding)
- التحقق من الحسابات
- إدارة صلاحيات الدفع

### Webhooks
- استقبال إشعارات PayPal
- معالجة تلقائية للأحداث
- تسجيل جميع الأحداث

## 📦 التثبيت

```bash
cd backend/services/paypal-service
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

## 🔌 API Endpoints

### المدفوعات (Payments)
```
POST   /api/v1/payments/create           - إنشاء طلب دفع
POST   /api/v1/payments/capture/:orderId - التقاط الدفع
GET    /api/v1/payments/order/:orderId   - تفاصيل الطلب
GET    /api/v1/payments/:transactionId   - تفاصيل المعاملة
GET    /api/v1/payments/user/:userId     - معاملات المستخدم
POST   /api/v1/payments/void/:orderId    - إلغاء الطلب
```

### الاسترداد (Refunds)
```
POST   /api/v1/refunds                   - إنشاء استرداد
```

### التجار (Merchants)
```
POST   /api/v1/merchants/register        - تسجيل تاجر
GET    /api/v1/merchants/:merchantId/status - حالة التسجيل
GET    /api/v1/merchants/:merchantId     - تفاصيل التاجر
PATCH  /api/v1/merchants/:merchantId/email - تحديث البريد
GET    /api/v1/merchants                 - جميع التجار
```

### Webhooks
```
POST   /api/v1/webhooks/paypal           - استقبال Webhooks
```

## 📊 أمثلة الاستخدام

### إنشاء طلب دفع
```bash
curl -X POST http://localhost:3023/api/v1/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-123",
    "userId": "user-456",
    "amount": 99.99,
    "currency": "USD",
    "description": "Purchase from Mnbara",
    "returnUrl": "https://mnbara.com/payment/success",
    "cancelUrl": "https://mnbara.com/payment/cancel"
  }'
```

### التقاط الدفع
```bash
curl -X POST http://localhost:3023/api/v1/payments/capture/PAYPAL_ORDER_ID
```

### إنشاء استرداد
```bash
curl -X POST http://localhost:3023/api/v1/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "transaction-id",
    "amount": 50.00,
    "reason": "CUSTOMER_REQUEST",
    "note": "Customer requested refund",
    "initiatedBy": "admin-123"
  }'
```

## 📈 الرسوم

| العملية | الرسوم |
|---------|--------|
| الدفع | 2.9% + $0.30 |
| الاسترداد | مجاني |
| التحويل الدولي | +1.5% |

## 🔒 الأمان

- تشفير جميع البيانات
- التحقق من Webhooks
- تسجيل جميع المعاملات
- دعم 3D Secure

## 🐳 Docker

```bash
docker build -t mnbara/paypal-service .
docker run -p 3023:3023 --env-file .env mnbara/paypal-service
```

## 📝 الترخيص

MIT License - Mnbara Platform 2026
