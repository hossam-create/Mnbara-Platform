# Escrow Service

**خدمة Escrow التقليدية** - مستوحاة من Smart Contract Logic

## 📋 نظرة عامة

خدمة Escrow آمنة وموثوقة مستوحاة من [SmartContractEscrowSystem](https://github.com/Aryamanraj/SmartContractEscrowSystem).

**المصدر الأصلي**: EscrowContract.sol (Solidity Smart Contract)  
**التطبيق**: Traditional backend service (TypeScript + PostgreSQL)

---

## 🎯 الميزات

### من Smart Contract
- ✅ Create Transaction (إنشاء معاملة)
- ✅ Add Signature (توقيع رقمي)
- ✅ Lock Transaction (قفل المعاملة)
- ✅ Release Funds (إطلاق الأموال)
- ✅ Initiate Dispute (بدء نزاع)
- ✅ Resolve Dispute (حل النزاع)

### إضافات
- ✅ Event logging
- ✅ Status tracking
- ✅ Multi-party signatures
- ✅ Dispute management
- ✅ RESTful API

---

## 🚀 البدء السريع

### المتطلبات
- Node.js 18+
- PostgreSQL 14+
- npm أو yarn

### التثبيت

```bash
# تثبيت المكتبات
npm install

# إعداد قاعدة البيانات
cp .env.example .env
# أضف DATABASE_URL في .env

# تشغيل Prisma migrations
npx prisma migrate dev

# تشغيل الخدمة
npm run dev
```

---

## 📡 API Endpoints

### 1. Create Escrow

**POST** `/api/v1/escrow`

```bash
curl -X POST http://localhost:3011/api/v1/escrow \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer123",
    "sellerId": "seller456",
    "arbitratorId": "arbitrator789",
    "amount": 1000,
    "currency": "USD"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "transactionId": "uuid",
    "buyerId": "buyer123",
    "sellerId": "seller456",
    "amount": 1000,
    "status": "CREATED"
  }
}
```

---

### 2. Add Signature

**POST** `/api/v1/escrow/:id/signature`

```bash
curl -X POST http://localhost:3011/api/v1/escrow/{escrowId}/signature \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "seller456",
    "role": "seller",
    "signature": "digital_signature_here"
  }'
```

---

### 3. Lock Transaction

**POST** `/api/v1/escrow/:id/lock`

```bash
curl -X POST http://localhost:3011/api/v1/escrow/{escrowId}/lock \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer123",
    "disputeDuration": 7
  }'
```

---

### 4. Release Funds

**POST** `/api/v1/escrow/:id/release`

```bash
curl -X POST http://localhost:3011/api/v1/escrow/{escrowId}/release \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer123"
  }'
```

---

### 5. Initiate Dispute

**POST** `/api/v1/escrow/:id/dispute`

```bash
curl -X POST http://localhost:3011/api/v1/escrow/{escrowId}/dispute \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "buyer123",
    "reason": "Product not as described",
    "evidence": ["photo1.jpg", "photo2.jpg"]
  }'
```

---

### 6. Resolve Dispute

**POST** `/api/v1/escrow/:id/resolve`

```bash
curl -X POST http://localhost:3011/api/v1/escrow/{escrowId}/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "arbitratorId": "arbitrator789",
    "resolution": "BUYER",
    "notes": "Buyer provided sufficient evidence"
  }'
```

---

### 7. Get Escrow

**GET** `/api/v1/escrow/:id`

```bash
curl http://localhost:3011/api/v1/escrow/{escrowId}
```

---

### 8. Get Status

**GET** `/api/v1/escrow/:id/status`

```bash
curl http://localhost:3011/api/v1/escrow/{escrowId}/status
```

---

## 🏗️ البنية

```
escrow-service/
├── src/
│   ├── services/
│   │   └── escrow.service.ts          # Core logic (from Smart Contract)
│   ├── controllers/
│   │   └── escrow.controller.ts       # HTTP handlers
│   ├── routes/
│   │   └── escrow.routes.ts           # API routes
│   ├── types/
│   │   └── escrow.types.ts            # TypeScript types
│   ├── utils/
│   │   └── logger.ts                  # Logging
│   └── index.ts                       # Entry point
├── prisma/
│   └── schema.prisma                  # Database schema
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🔄 Escrow Flow

### 1. Create Transaction
```
Buyer creates escrow → Status: CREATED
```

### 2. Add Signatures
```
Seller signs → Buyer signs → Status: SIGNED
```

### 3. Lock Transaction
```
Buyer locks → Funds held → Status: LOCKED
```

### 4. Release or Dispute

**Happy Path**:
```
Buyer releases → Funds to seller → Status: RELEASED
```

**Dispute Path**:
```
Buyer/Seller disputes → Arbitrator reviews → Resolve → Status: RESOLVED
```

---

## 🧠 Smart Contract Mapping

| Smart Contract | Traditional Service |
|----------------|---------------------|
| `createTransaction()` | `createTransaction()` |
| `addSignature()` | `addSignature()` |
| `lockTransaction()` | `lockTransaction()` |
| `releaseTransaction()` | `releaseTransaction()` |
| `initiateDispute()` | `initiateDispute()` |
| `resolveDispute()` | `resolveDispute()` |
| `getTransactionStatus()` | `getTransactionStatus()` |

---

## 📊 Database Schema

```prisma
model Escrow {
  id              String        @id @default(uuid())
  transactionId   String        @unique
  buyerId         String
  sellerId        String
  arbitratorId    String?
  amount          Decimal
  status          EscrowStatus
  signatures      Json
  disputeReason   String?
  createdAt       DateTime
  lockedAt        DateTime?
  releasedAt      DateTime?
}

enum EscrowStatus {
  CREATED
  SIGNED
  LOCKED
  RELEASED
  DISPUTED
  RESOLVED
  CANCELLED
}
```

---

## 🧪 الاختبار

```bash
# Run tests
npm test

# Manual testing
npm run dev

# Test create escrow
curl -X POST http://localhost:3011/api/v1/escrow \
  -H "Content-Type: application/json" \
  -d '{"buyerId":"test1","sellerId":"test2","amount":100}'
```

---

## 🔐 الأمان

### من Smart Contract
- ✅ Modifier-based access control (onlyBuyer, onlySeller, onlyArbitrator)
- ✅ Status-based validation (inStatus, notInStatus)
- ✅ Signature verification
- ✅ Dispute deadline enforcement

### إضافات
- ✅ JWT authentication (planned)
- ✅ Rate limiting (planned)
- ✅ Input validation
- ✅ Error handling

---

## 🔄 التطوير المستقبلي

### المرحلة التالية
- [ ] دمج مع Payment Service
- [ ] دمج مع Internal Ledger
- [ ] Multi-currency support
- [ ] Automated dispute resolution
- [ ] Email notifications
- [ ] Webhook support

### Blockchain Integration (اختياري)
- [ ] Deploy actual Smart Contract
- [ ] Web3 integration
- [ ] MetaMask support
- [ ] Hybrid approach (Traditional + Blockchain)

---

## 🤝 المساهمة

هذه الخدمة مستوحاة من [SmartContractEscrowSystem](https://github.com/Aryamanraj/SmartContractEscrowSystem) وتم تعديلها لتناسب منصة Mnbara.

---

## 📝 الترخيص

MIT License

---

## 📞 الدعم

للمساعدة أو الأسئلة، راجع:
- [PROJECT_2_ESCROW_SYSTEM_KICKOFF.md](../../../PROJECT_2_ESCROW_SYSTEM_KICKOFF.md)
- [OPEN_SOURCE_INTEGRATION_PLAN.md](../../../OPEN_SOURCE_INTEGRATION_PLAN.md)

---

**التاريخ**: 2 فبراير 2026  
**الحالة**: ✅ جاهز للاستخدام  
**الإصدار**: 1.0.0  
**المصدر**: SmartContractEscrowSystem (Solidity → TypeScript)
