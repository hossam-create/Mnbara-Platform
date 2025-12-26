# ₿ Crypto Service - خدمة العملات الرقمية

خدمة الدفع بالعملات الرقمية لمنصة منبرة - تدعم Bitcoin, Ethereum, USDC, USDT

## 🚀 المميزات

### المحفظة الرقمية (Crypto Wallet)
- إنشاء محفظة متعددة العملات
- عناوين إيداع فريدة لكل عملة
- تتبع الرصيد بالوقت الفعلي
- تاريخ المعاملات الكامل

### الدفع بالعملات الرقمية (Crypto Payments)
- إنشاء طلبات دفع فورية
- QR Code للدفع السريع
- تأكيد تلقائي من البلوكتشين
- Webhooks للإشعارات

### أسعار الصرف (Exchange Rates)
- أسعار حية من Coinbase/CoinGecko
- تحويل بين العملات
- تاريخ الأسعار
- رسوم الشبكة

### الأمان (Security)
- تشفير المفاتيح الخاصة
- التحقق بخطوتين للسحب
- حدود السحب اليومية/الشهرية
- مراقبة المعاملات المشبوهة

## 📦 التثبيت

```bash
cd backend/services/crypto-service
npm install
cp .env.example .env
# Edit .env with your configuration
npx prisma generate
npx prisma migrate dev
npm run dev
```

## 🔌 API Endpoints

### المحفظة (Wallets)
```
POST   /api/v1/wallets              - إنشاء محفظة
GET    /api/v1/wallets/:userId      - الحصول على المحفظة
GET    /api/v1/wallets/:userId/balance - الحصول على الرصيد
GET    /api/v1/wallets/:userId/deposit-address?currency=BTC - عنوان الإيداع
GET    /api/v1/wallets/:userId/transactions - تاريخ المعاملات
```

### المدفوعات (Payments)
```
POST   /api/v1/payments             - إنشاء طلب دفع
GET    /api/v1/payments/:paymentId  - حالة الدفع
POST   /api/v1/payments/:paymentId/confirm - تأكيد الدفع
POST   /api/v1/payments/:paymentId/refund - استرداد
POST   /api/v1/payments/:paymentId/pay-from-wallet - دفع من المحفظة
GET    /api/v1/payments/merchant/:merchantId - مدفوعات التاجر
```

### أسعار الصرف (Exchange)
```
GET    /api/v1/exchange/rates       - جميع الأسعار
GET    /api/v1/exchange/rates/:currency - سعر عملة محددة
POST   /api/v1/exchange/convert     - تحويل بين العملات
GET    /api/v1/exchange/history/:currency - تاريخ الأسعار
GET    /api/v1/exchange/fees/:currency - رسوم الشبكة
```

### المعاملات (Transactions)
```
POST   /api/v1/transactions/deposit  - إنشاء إيداع
POST   /api/v1/transactions/withdraw - إنشاء سحب
GET    /api/v1/transactions/:transactionId - تفاصيل المعاملة
GET    /api/v1/transactions/deposit/:depositId - حالة الإيداع
GET    /api/v1/transactions/withdrawal/:withdrawalId - حالة السحب
POST   /api/v1/transactions/transfer - تحويل داخلي
```

## 💰 العملات المدعومة

| العملة | الرمز | الشبكة | الحد الأدنى للإيداع |
|--------|-------|--------|---------------------|
| Bitcoin | BTC | Bitcoin | 0.0001 BTC |
| Ethereum | ETH | Ethereum | 0.001 ETH |
| USD Coin | USDC | ERC-20 | 1 USDC |
| Tether | USDT | ERC-20 | 1 USDT |

## 📊 أمثلة الاستخدام

### إنشاء محفظة
```bash
curl -X POST http://localhost:3018/api/v1/wallets \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'
```

### إنشاء طلب دفع
```bash
curl -X POST http://localhost:3018/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-456",
    "merchantId": "merchant-789",
    "amountUsd": 100,
    "currency": "BTC",
    "callbackUrl": "https://your-site.com/webhook"
  }'
```

### تحويل بين العملات
```bash
curl -X POST http://localhost:3018/api/v1/exchange/convert \
  -H "Content-Type: application/json" \
  -d '{
    "from": "BTC",
    "to": "USD",
    "amount": 0.1
  }'
```

## 🔒 الأمان

- جميع المفاتيح الخاصة مشفرة بـ AES-256
- التحقق بخطوتين مطلوب للسحب
- حدود السحب: $10,000/يوم، $100,000/شهر
- مراقبة المعاملات المشبوهة بالذكاء الاصطناعي

## 📈 الرسوم

| العملية | الرسوم |
|---------|--------|
| الإيداع | مجاني |
| السحب | رسوم الشبكة فقط |
| التحويل الداخلي | مجاني |
| تحويل العملات | 0.5% |
| الدفع | 1% |

## 🐳 Docker

```bash
docker build -t mnbara/crypto-service .
docker run -p 3018:3018 --env-file .env mnbara/crypto-service
```

## 📝 الترخيص

MIT License - Mnbara Platform 2026
