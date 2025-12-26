# 🚀 المرحلة الأولى - التفاصيل الكاملة
# Phase 1 Detailed Implementation Plan (Q1 2026)

**الفترة:** يناير - مارس 2026  
**الهدف:** إطلاق BNPL + Crypto + تحسينات الأداء  
**الإيرادات المتوقعة:** $10M

---

## 📋 جدول العمل الأسبوعي

### الأسبوع 1-2: الإعداد والتخطيط (24 ديسمبر - 7 يناير)

#### المهام:
- [ ] تشكيل الفريق (5 مهندسين)
- [ ] إنشاء Repositories
- [ ] إعداد بيئة التطوير
- [ ] تصميم Databases
- [ ] تصميم APIs

#### الملفات المطلوب إنشاؤها:
```
backend/services/bnpl-service/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── index.ts
│   ├── controllers/
│   │   ├── installment.controller.ts
│   │   ├── plan.controller.ts
│   │   └── payment.controller.ts
│   ├── services/
│   │   ├── installment.service.ts
│   │   ├── credit-score.service.ts
│   │   └── payment.service.ts
│   ├── routes/
│   │   ├── installment.routes.ts
│   │   ├── plan.routes.ts
│   │   └── payment.routes.ts
│   └── types/
│       └── bnpl.types.ts
├── package.json
├── Dockerfile
└── README.md

backend/services/crypto-service/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── index.ts
│   ├── controllers/
│   │   ├── wallet.controller.ts
│   │   ├── transaction.controller.ts
│   │   └── rate.controller.ts
│   ├── services/
│   │   ├── wallet.service.ts
│   │   ├── transaction.service.ts
│   │   ├── coinbase.service.ts
│   │   └── security.service.ts
│   ├── routes/
│   │   ├── wallet.routes.ts
│   │   ├── transaction.routes.ts
│   │   └── rate.routes.ts
│   └── types/
│       └── crypto.types.ts
├── package.json
├── Dockerfile
└── README.md
```

---

### الأسبوع 3-4: تطوير BNPL Service (8-21 يناير)

#### المهام:
- [ ] بناء Prisma Schema
- [ ] بناء Controllers
- [ ] بناء Services
- [ ] ربط مع Stripe
- [ ] اختبار شامل

#### Prisma Schema (BNPL):
```prisma
// backend/services/bnpl-service/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model BNPLPlan {
  id                String   @id @default(cuid())
  name              String
  nameAr            String
  description       String?
  descriptionAr     String?
  
  // Installment Details
  installmentCount  Int      // 3, 6, 12 months
  interestRate      Float    @default(0) // 0% for promotional
  monthlyFee        Float    @default(0)
  
  // Limits
  minAmount         Float    @default(100)
  maxAmount         Float    @default(10000)
  
  // Status
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  installments      Installment[]
  
  @@map("bnpl_plans")
}

model Installment {
  id                String   @id @default(cuid())
  
  // User & Order
  userId            String
  orderId           String
  
  // Plan Details
  planId            String
  plan              BNPLPlan @relation(fields: [planId], references: [id])
  
  // Amount
  totalAmount       Float
  installmentAmount Float
  interestAmount    Float
  
  // Status
  status            String   @default("pending") // pending, active, completed, defaulted
  
  // Dates
  startDate         DateTime
  endDate           DateTime
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  payments          Payment[]
  
  @@map("installments")
}

model Payment {
  id                String   @id @default(cuid())
  
  // Installment
  installmentId     String
  installment       Installment @relation(fields: [installmentId], references: [id])
  
  // Payment Details
  amount            Float
  dueDate           DateTime
  paidDate          DateTime?
  
  // Status
  status            String   @default("pending") // pending, completed, failed, overdue
  
  // Stripe
  stripePaymentId   String?
  
  // Dates
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("payments")
}

model CreditScore {
  id                String   @id @default(cuid())
  
  // User
  userId            String   @unique
  
  // Score
  score             Int      @default(500) // 300-850
  
  // History
  totalOrders       Int      @default(0)
  completedOrders   Int      @default(0)
  defaultedOrders   Int      @default(0)
  
  // Dates
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("credit_scores")
}
```

#### APIs (BNPL):
```typescript
// backend/services/bnpl-service/src/routes/installment.routes.ts

import { Router } from 'express';
import { installmentController } from '../controllers/installment.controller';

const router = Router();

/**
 * @route POST /api/v1/installments
 * @desc Create new installment plan
 */
router.post('/', installmentController.createInstallment);

/**
 * @route GET /api/v1/installments/:userId
 * @desc Get user's installments
 */
router.get('/:userId', installmentController.getUserInstallments);

/**
 * @route GET /api/v1/installments/:id
 * @desc Get installment details
 */
router.get('/:id', installmentController.getInstallmentDetails);

/**
 * @route PUT /api/v1/installments/:id
 * @desc Update installment status
 */
router.put('/:id', installmentController.updateInstallment);

/**
 * @route POST /api/v1/installments/:id/pay
 * @desc Process payment for installment
 */
router.post('/:id/pay', installmentController.processPayment);

export default router;
```

---

### الأسبوع 5-6: تطوير Crypto Service (22 يناير - 4 فبراير)

#### المهام:
- [ ] بناء Prisma Schema
- [ ] ربط مع Coinbase Commerce
- [ ] بناء Wallet Management
- [ ] تطبيق Security
- [ ] اختبار شامل

#### Prisma Schema (Crypto):
```prisma
// backend/services/crypto-service/prisma/schema.prisma

model CryptoWallet {
  id                String   @id @default(cuid())
  
  // User
  userId            String   @unique
  
  // Wallet Details
  address           String   @unique
  publicKey         String
  encryptedPrivateKey String // Encrypted with KMS
  
  // Supported Coins
  bitcoinBalance    Float    @default(0)
  ethereumBalance   Float    @default(0)
  usdcBalance       Float    @default(0)
  usdtBalance       Float    @default(0)
  
  // Status
  isActive          Boolean  @default(true)
  isVerified        Boolean  @default(false)
  
  // Dates
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  transactions      CryptoTransaction[]
  
  @@map("crypto_wallets")
}

model CryptoTransaction {
  id                String   @id @default(cuid())
  
  // Wallet
  walletId          String
  wallet            CryptoWallet @relation(fields: [walletId], references: [id])
  
  // Transaction Details
  type              String   // "deposit", "withdrawal", "transfer"
  coin              String   // "BTC", "ETH", "USDC", "USDT"
  amount            Float
  
  // Addresses
  fromAddress       String
  toAddress         String
  
  // Status
  status            String   @default("pending") // pending, confirmed, failed
  confirmations     Int      @default(0)
  
  // Blockchain
  txHash            String?
  blockNumber       Int?
  gasUsed           Float?
  
  // Dates
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("crypto_transactions")
}

model CryptoRate {
  id                String   @id @default(cuid())
  
  // Pair
  fromCoin          String   // "BTC", "ETH", etc
  toCoin            String   // "USD", "EUR", etc
  
  // Rate
  rate              Float
  
  // Dates
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("crypto_rates")
}
```

#### APIs (Crypto):
```typescript
// backend/services/crypto-service/src/routes/wallet.routes.ts

import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller';

const router = Router();

/**
 * @route POST /api/v1/wallets
 * @desc Create new crypto wallet
 */
router.post('/', walletController.createWallet);

/**
 * @route GET /api/v1/wallets/:userId
 * @desc Get user's wallet
 */
router.get('/:userId', walletController.getWallet);

/**
 * @route GET /api/v1/wallets/:userId/balance
 * @desc Get wallet balance
 */
router.get('/:userId/balance', walletController.getBalance);

/**
 * @route POST /api/v1/wallets/:userId/deposit
 * @desc Deposit crypto to wallet
 */
router.post('/:userId/deposit', walletController.depositCrypto);

/**
 * @route POST /api/v1/wallets/:userId/withdraw
 * @desc Withdraw crypto from wallet
 */
router.post('/:userId/withdraw', walletController.withdrawCrypto);

export default router;
```

---

### الأسبوع 7-8: الاختبار والنشر (5-18 فبراير)

#### المهام:
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] Load Tests
- [ ] Security Tests
- [ ] نشر على Staging
- [ ] نشر على Production

#### اختبار BNPL:
```typescript
// backend/services/bnpl-service/src/__tests__/installment.test.ts

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { installmentService } from '../services/installment.service';

describe('BNPL Installment Service', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createInstallment', () => {
    it('should create installment with valid data', async () => {
      const result = await installmentService.createInstallment({
        userId: 'user-123',
        orderId: 'order-456',
        planId: 'plan-789',
        totalAmount: 1000,
      });

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('pending');
      expect(result.totalAmount).toBe(1000);
    });

    it('should fail with invalid amount', async () => {
      expect(async () => {
        await installmentService.createInstallment({
          userId: 'user-123',
          orderId: 'order-456',
          planId: 'plan-789',
          totalAmount: 50, // Below minimum
        });
      }).rejects.toThrow('Amount below minimum');
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const result = await installmentService.processPayment({
        installmentId: 'inst-123',
        amount: 250,
      });

      expect(result.status).toBe('completed');
    });
  });
});
```

---

### الأسبوع 9-12: المراقبة والتحسين (19 فبراير - 18 مارس)

#### المهام:
- [ ] مراقبة الأداء
- [ ] جمع التعليقات
- [ ] تحسين الأداء
- [ ] إصلاح الأخطاء
- [ ] توثيق النتائج

---

## 💻 الأكواد الأساسية

### BNPL Service - Main Index:
```typescript
// backend/services/bnpl-service/src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import installmentRoutes from './routes/installment.routes';
import planRoutes from './routes/plan.routes';
import paymentRoutes from './routes/payment.routes';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3017;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'bnpl-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/installments', installmentRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Error Handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    messageAr: 'خطأ في الخادم'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`💳 BNPL Service running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
```

### Crypto Service - Main Index:
```typescript
// backend/services/crypto-service/src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import walletRoutes from './routes/wallet.routes';
import transactionRoutes from './routes/transaction.routes';
import rateRoutes from './routes/rate.routes';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3018;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'crypto-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/rates', rateRoutes);

// Error Handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    messageAr: 'خطأ في الخادم'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🪙 Crypto Service running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
```

---

## 📦 Docker Compose Updates

```yaml
# docker-compose.yml - Add these services

bnpl-service:
  build:
    context: ./backend/services/bnpl-service
    dockerfile: Dockerfile
  container_name: mnbara-bnpl-service
  ports:
    - "3017:3017"
  environment:
    - NODE_ENV=development
    - PORT=3017
    - DATABASE_URL=postgresql://mnbara:mnbara_dev_password@postgres:5432/bnpl_db
    - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
  depends_on:
    - postgres
  networks:
    - mnbara-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3017/health"]
    interval: 30s
    timeout: 10s
    retries: 3

crypto-service:
  build:
    context: ./backend/services/crypto-service
    dockerfile: Dockerfile
  container_name: mnbara-crypto-service
  ports:
    - "3018:3018"
  environment:
    - NODE_ENV=development
    - PORT=3018
    - DATABASE_URL=postgresql://mnbara:mnbara_dev_password@postgres:5432/crypto_db
    - COINBASE_API_KEY=${COINBASE_API_KEY}
    - COINBASE_API_SECRET=${COINBASE_API_SECRET}
    - KMS_KEY_ID=${KMS_KEY_ID}
  depends_on:
    - postgres
  networks:
    - mnbara-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3018/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

---

## 📊 مؤشرات النجاح Q1

| المؤشر | الهدف | الحد الأدنى |
|--------|-------|-----------|
| BNPL Transactions | 50K | 30K |
| Crypto Transactions | 10K | 5K |
| Revenue | $10M | $7M |
| User Growth | 500K | 300K |
| System Uptime | 99.9% | 99.5% |
| Response Time | <200ms | <500ms |

---

## ✅ Checklist للإطلاق

- [ ] جميع الأكواد مكتملة
- [ ] جميع الاختبارات تمر
- [ ] جميع الأمان مطبق
- [ ] جميع الوثائق مكتملة
- [ ] جميع الفريق مدرب
- [ ] جميع الأنظمة مراقبة
- [ ] جميع الخطط الطوارئ جاهزة

---

**هذه الخطة جاهزة للتنفيذ الفوري!**
