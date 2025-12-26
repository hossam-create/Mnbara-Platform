# 💰 Multi-Currency Wallet Service - خدمة المحفظة متعددة العملات

خدمة المحفظة الرقمية متعددة العملات لمنصة منبرة - تدعم 10 عملات مع التحويل التلقائي والتحوط

## 🚀 المميزات

### المحفظة متعددة العملات (Multi-Currency Wallet)
- دعم 10 عملات: USD, EUR, GBP, SAR, AED, EGP, JPY, CNY, INR, TRY
- رصيد منفصل لكل عملة
- تحويل فوري بين العملات
- حدود يومية وشهرية قابلة للتخصيص

### التحويل التلقائي (Auto-Conversion)
- تحويل تلقائي عند وصول السعر المستهدف
- تحويل عند تجاوز الرصيد حد معين
- تحويل مجدول
- تحويل عند كل إيداع

### التحوط من تقلبات العملات (Forex Hedging)
- عقود آجلة (Forward Contracts)
- خيارات (Options)
- وقف الخسارة (Stop-Loss)
- حماية من تقلبات الأسعار

### أسعار الصرف (Exchange Rates)
- أسعار حية من OpenExchangeRates
- تاريخ الأسعار
- أفضل سعر حسب المبلغ
- تنبيهات الأسعار

## 📦 التثبيت

```bash
cd backend/services/wallet-service
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

## 🔌 API Endpoints

### المحفظة (Wallets)
```
POST   /api/v1/wallets              - إنشاء محفظة
GET    /api/v1/wallets/:userId      - الحصول على المحفظة
GET    /api/v1/wallets/:userId/total-balance - الرصيد الإجمالي
POST   /api/v1/wallets/deposit      - إيداع
POST   /api/v1/wallets/withdraw     - سحب
POST   /api/v1/wallets/convert      - تحويل بين العملات
GET    /api/v1/wallets/:userId/transactions - تاريخ المعاملات
PATCH  /api/v1/wallets/:userId/limits - تحديث الحدود
```

### التحويلات (Transfers)
```
POST   /api/v1/transfers            - إنشاء تحويل
GET    /api/v1/transfers/calculate-fee - حساب الرسوم
GET    /api/v1/transfers/:transferId - تفاصيل التحويل
GET    /api/v1/transfers/user/:userId - تحويلات المستخدم
```

### أسعار الصرف (Forex)
```
GET    /api/v1/forex/rates          - جميع الأسعار
GET    /api/v1/forex/rates/:base/:quote - سعر محدد
POST   /api/v1/forex/convert        - تحويل مبلغ
GET    /api/v1/forex/history/:base/:quote - تاريخ الأسعار
GET    /api/v1/forex/best-rate      - أفضل سعر
```

### التحوط (Hedging)
```
POST   /api/v1/hedging              - إنشاء أمر تحوط
GET    /api/v1/hedging/:orderId     - تفاصيل الأمر
GET    /api/v1/hedging/user/:userId - أوامر المستخدم
POST   /api/v1/hedging/:orderId/execute - تنفيذ الأمر
POST   /api/v1/hedging/:orderId/cancel - إلغاء الأمر
```

## 💱 العملات المدعومة

| العملة | الرمز | المنطقة |
|--------|-------|---------|
| US Dollar | USD | أمريكا |
| Euro | EUR | أوروبا |
| British Pound | GBP | بريطانيا |
| Saudi Riyal | SAR | السعودية |
| UAE Dirham | AED | الإمارات |
| Egyptian Pound | EGP | مصر |
| Japanese Yen | JPY | اليابان |
| Chinese Yuan | CNY | الصين |
| Indian Rupee | INR | الهند |
| Turkish Lira | TRY | تركيا |

## 📊 أمثلة الاستخدام

### إنشاء محفظة
```bash
curl -X POST http://localhost:3019/api/v1/wallets \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "primaryCurrency": "SAR"}'
```

### تحويل بين العملات
```bash
curl -X POST http://localhost:3019/api/v1/wallets/convert \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "fromCurrency": "USD",
    "toCurrency": "SAR",
    "amount": 100
  }'
```

### إنشاء أمر تحوط
```bash
curl -X POST http://localhost:3019/api/v1/hedging \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "currency": "USD",
    "amount": 1000,
    "hedgeType": "FORWARD",
    "targetRate": 3.80,
    "protectionCurrency": "SAR",
    "durationDays": 30
  }'
```

## 📈 الرسوم

| العملية | الرسوم |
|---------|--------|
| الإيداع | مجاني |
| السحب | مجاني |
| التحويل بنفس العملة | مجاني |
| تحويل العملات | 0.3% |
| التحوط (Forward) | 0.5% |
| التحوط (Option) | 1.0% |
| التحوط (Stop-Loss) | 0.3% |

## 🐳 Docker

```bash
docker build -t mnbara/wallet-service .
docker run -p 3019:3019 --env-file .env mnbara/wallet-service
```

## 📝 الترخيص

MIT License - Mnbara Platform 2026
