# المشروع #2: SmartContract Escrow System - خطة التنفيذ

**التاريخ**: 2 فبراير 2026  
**الحالة**: 📋 جاهز للبدء  
**الأولوية**: 🔴 عاجل

---

## 📋 نظرة عامة

### الهدف
دمج نظام Escrow الذكي من SmartContract Escrow System في منصة Mnbara.

### المصدر
- **Repository**: https://github.com/Aryamanraj/SmartContractEscrowSystem
- **License**: Open Source
- **Technology**: Solidity Smart Contracts + React

### الوقت المقدر
2-3 أسابيع

---

## 🎯 الخيارات المتاحة

### الخيار A: Blockchain Escrow (للمستقبل)
**المميزات**:
- ✅ شفافية كاملة
- ✅ لا مركزية
- ✅ أمان عالي جداً
- ✅ لا رسوم وسيط

**التحديات**:
- ⚠️ رسوم Gas على Ethereum
- ⚠️ يحتاج معرفة بـ Web3
- ⚠️ بطء نسبي
- ⚠️ تعقيد التطوير

**الوقت**: 3-4 أسابيع

---

### الخيار B: Traditional Escrow (موصى به للـ MVP) ⭐

**الحل الأمثل**:
```typescript
// نظام تقليدي مستوحى من Smart Contract logic
interface EscrowService {
  createEscrow()      // إنشاء معاملة
  addSignature()      // توقيع رقمي
  lockTransaction()   // قفل المعاملة
  releaseFunds()      // إطلاق الأموال
  initiateDispute()   // بدء نزاع
  resolveDispute()    // حل النزاع
}
```

**المميزات**:
- ✅ سريع التطوير
- ✅ رسوم منخفضة
- ✅ سهل الاستخدام
- ✅ يمكن الترقية للـ Blockchain لاحقاً

**الوقت**: 2 أسابيع

---

## 📚 الخطوة 1: دراسة الكود (يوم واحد)

### استنساخ المشروع

```bash
# إنشاء مجلد للمشاريع الخارجية (إذا لم يكن موجوداً)
cd C:\mnbara-platform
mkdir external-projects
cd external-projects

# استنساخ المشروع
git clone https://github.com/Aryamanraj/SmartContractEscrowSystem.git
cd SmartContractEscrowSystem

# استكشاف البنية
dir /s /b
```

---

### دراسة Smart Contract

```bash
cd src\contracts

# قراءة Smart Contract الرئيسي
type EscrowContract.sol
```

**الوظائف الأساسية في Smart Contract**:

```solidity
// من EscrowContract.sol

// 1. إنشاء معاملة
function createTransaction(
    address _buyer,
    address _seller,
    uint256 _amount
) public returns (uint256)

// 2. إضافة توقيع
function addSign(uint256 _txId, string memory _signature) public

// 3. قفل المعاملة
function lockTnx(uint256 _txId) public

// 4. إطلاق الأموال
function releaseTnx(uint256 _txId) public

// 5. بدء نزاع
function initiateDispute(uint256 _txId, string memory _reason) public

// 6. حل النزاع
function resolveDispute(
    uint256 _txId,
    address _winner
) public onlyArbitrator
```

---

### دراسة الواجهات

```bash
# واجهة المشتري
type ..\BuyerLogin.js

# واجهة البائع
type ..\SellerLogin.js

# واجهة المحكّم
type ..\ArbitratorLogin.js
```

---

## 🔨 الخطوة 2: تصميم النظام (يوم واحد)

### البنية المقترحة

```
backend/services/escrow-service/
├── src/
│   ├── services/
│   │   ├── escrow.service.ts           # Core escrow logic
│   │   ├── signature.service.ts        # Digital signatures
│   │   ├── dispute.service.ts          # Dispute handling
│   │   └── payment.service.ts          # Payment integration
│   ├── controllers/
│   │   ├── escrow.controller.ts
│   │   └── dispute.controller.ts
│   ├── routes/
│   │   ├── escrow.routes.ts
│   │   └── dispute.routes.ts
│   ├── types/
│   │   └── escrow.types.ts
│   ├── models/
│   │   └── escrow.model.ts
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── package.json
├── tsconfig.json
└── README.md
```

---

### Database Schema

```prisma
// prisma/schema.prisma

model Escrow {
  id            String   @id @default(uuid())
  buyerId       String
  sellerId      String
  amount        Decimal
  status        EscrowStatus
  signatures    Json[]   // Array of signatures
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lockedAt      DateTime?
  releasedAt    DateTime?
  
  // Dispute fields
  disputeReason String?
  disputeStatus DisputeStatus?
  arbitratorId  String?
  resolution    String?
  
  // Relations
  buyer         User     @relation("BuyerEscrows", fields: [buyerId], references: [id])
  seller        User     @relation("SellerEscrows", fields: [sellerId], references: [id])
  arbitrator    User?    @relation("ArbitratorEscrows", fields: [arbitratorId], references: [id])
  
  @@index([buyerId])
  @@index([sellerId])
  @@index([status])
}

enum EscrowStatus {
  PENDING
  SIGNED
  LOCKED
  RELEASED
  DISPUTED
  RESOLVED
  CANCELLED
}

enum DisputeStatus {
  NONE
  INITIATED
  UNDER_REVIEW
  RESOLVED
}
```

---

## 🔨 الخطوة 3: التطبيق (أسبوع واحد)

### اليوم 1-2: إعداد المشروع

```bash
# إنشاء الخدمة
cd C:\mnbara-platform\backend\services
mkdir escrow-service
cd escrow-service

# تهيئة المشروع
npm init -y

# تثبيت المكتبات
npm install express typescript @types/node @types/express
npm install prisma @prisma/client
npm install dotenv axios winston
npm install jsonwebtoken bcrypt

# Dev dependencies
npm install -D ts-node-dev @types/jest jest ts-jest
npm install -D eslint @typescript-eslint/eslint-plugin

# إنشاء البنية
mkdir -p src/services src/controllers src/routes src/types src/models
mkdir -p prisma

# إنشاء tsconfig.json
npx tsc --init
```

---

### اليوم 3-5: تطبيق EscrowService

```typescript
// src/services/escrow.service.ts

import { PrismaClient, EscrowStatus } from '@prisma/client';
import { CreateEscrowDto, SignatureDto } from '../types/escrow.types';
import { logger } from '../utils/logger';

export class EscrowService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create new escrow transaction
   * Adapted from Smart Contract: createTransaction()
   */
  async createEscrow(data: CreateEscrowDto) {
    logger.info(`Creating escrow for buyer: ${data.buyerId}`);

    const escrow = await this.prisma.escrow.create({
      data: {
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        amount: data.amount,
        status: EscrowStatus.PENDING,
        signatures: []
      }
    });

    logger.info(`Escrow created: ${escrow.id}`);
    return escrow;
  }

  /**
   * Add digital signature
   * Adapted from Smart Contract: addSign()
   */
  async addSignature(escrowId: string, signature: SignatureDto) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.PENDING) {
      throw new Error('Cannot add signature to non-pending escrow');
    }

    // Add signature
    const signatures = [...(escrow.signatures as any[]), signature];

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        signatures,
        status: signatures.length >= 2 ? EscrowStatus.SIGNED : EscrowStatus.PENDING
      }
    });

    // If both parties signed, lock the transaction
    if (signatures.length >= 2) {
      await this.lockTransaction(escrowId);
    }

    logger.info(`Signature added to escrow: ${escrowId}`);
  }

  /**
   * Lock transaction and hold funds
   * Adapted from Smart Contract: lockTnx()
   */
  async lockTransaction(escrowId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.SIGNED) {
      throw new Error('Escrow must be signed before locking');
    }

    // Hold funds from buyer
    await this.holdFunds(escrow.buyerId, escrow.amount);

    // Update status
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.LOCKED,
        lockedAt: new Date()
      }
    });

    logger.info(`Escrow locked: ${escrowId}`);
  }

  /**
   * Release funds to seller
   * Adapted from Smart Contract: releaseTnx()
   */
  async releaseFunds(escrowId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.LOCKED) {
      throw new Error('Escrow must be locked before releasing');
    }

    // Transfer funds to seller
    await this.transferFunds(escrow.buyerId, escrow.sellerId, escrow.amount);

    // Update status
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.RELEASED,
        releasedAt: new Date()
      }
    });

    logger.info(`Funds released for escrow: ${escrowId}`);
  }

  /**
   * Initiate dispute
   * Adapted from Smart Contract: initiateDispute()
   */
  async initiateDispute(escrowId: string, reason: string, userId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.LOCKED) {
      throw new Error('Can only dispute locked escrows');
    }

    // Verify user is buyer or seller
    if (userId !== escrow.buyerId && userId !== escrow.sellerId) {
      throw new Error('Only buyer or seller can initiate dispute');
    }

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.DISPUTED,
        disputeReason: reason,
        disputeStatus: 'INITIATED'
      }
    });

    logger.info(`Dispute initiated for escrow: ${escrowId}`);
  }

  /**
   * Resolve dispute
   * Adapted from Smart Contract: resolveDispute()
   */
  async resolveDispute(
    escrowId: string,
    resolution: 'BUYER' | 'SELLER',
    arbitratorId: string
  ) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== EscrowStatus.DISPUTED) {
      throw new Error('Escrow is not in dispute');
    }

    // Resolve based on decision
    if (resolution === 'BUYER') {
      // Refund to buyer
      await this.refundFunds(escrow.buyerId, escrow.amount);
    } else {
      // Transfer to seller
      await this.transferFunds(escrow.buyerId, escrow.sellerId, escrow.amount);
    }

    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.RESOLVED,
        disputeStatus: 'RESOLVED',
        resolution,
        arbitratorId
      }
    });

    logger.info(`Dispute resolved for escrow: ${escrowId} - Winner: ${resolution}`);
  }

  // Private helper methods
  private async holdFunds(userId: string, amount: any) {
    // TODO: Integrate with payment service
    logger.info(`Holding ${amount} from user: ${userId}`);
  }

  private async transferFunds(fromId: string, toId: string, amount: any) {
    // TODO: Integrate with payment service
    logger.info(`Transferring ${amount} from ${fromId} to ${toId}`);
  }

  private async refundFunds(userId: string, amount: any) {
    // TODO: Integrate with payment service
    logger.info(`Refunding ${amount} to user: ${userId}`);
  }
}
```

---

### اليوم 6-7: API Endpoints

```typescript
// src/controllers/escrow.controller.ts

import { Request, Response } from 'express';
import { EscrowService } from '../services/escrow.service';

export class EscrowController {
  private service: EscrowService;

  constructor() {
    this.service = new EscrowService();
  }

  async createEscrow(req: Request, res: Response) {
    try {
      const escrow = await this.service.createEscrow(req.body);
      res.json({ success: true, data: escrow });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async addSignature(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;
      await this.service.addSignature(escrowId, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async releaseFunds(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;
      await this.service.releaseFunds(escrowId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async initiateDispute(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;
      const { reason, userId } = req.body;
      await this.service.initiateDispute(escrowId, reason, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async resolveDispute(req: Request, res: Response) {
    try {
      const { escrowId } = req.params;
      const { resolution, arbitratorId } = req.body;
      await this.service.resolveDispute(escrowId, resolution, arbitratorId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

---

## 🧪 الخطوة 4: الاختبار (يومان)

### Unit Tests

```typescript
// src/services/__tests__/escrow.service.test.ts

describe('EscrowService', () => {
  let service: EscrowService;

  beforeEach(() => {
    service = new EscrowService();
  });

  it('should create escrow', async () => {
    const data = {
      buyerId: 'buyer123',
      sellerId: 'seller456',
      amount: 1000
    };

    const escrow = await service.createEscrow(data);
    
    expect(escrow).toBeDefined();
    expect(escrow.status).toBe('PENDING');
  });

  it('should add signatures', async () => {
    // Test signature logic
  });

  it('should lock transaction after both signatures', async () => {
    // Test locking logic
  });

  it('should release funds', async () => {
    // Test release logic
  });

  it('should handle disputes', async () => {
    // Test dispute logic
  });
});
```

---

## ✅ Checklist التنفيذ

### الأسبوع 1: Core Implementation
- [ ] استنساخ SmartContractEscrowSystem
- [ ] دراسة EscrowContract.sol
- [ ] إنشاء escrow-service
- [ ] تطبيق EscrowService
- [ ] تطبيق Database schema
- [ ] إنشاء API endpoints

### الأسبوع 2: Testing & Integration
- [ ] كتابة Unit tests
- [ ] Integration tests
- [ ] دمج مع Payment service
- [ ] دمج مع Frontend
- [ ] Documentation
- [ ] Deployment

---

## 🎯 النتيجة المتوقعة

بعد أسبوعين، ستحصل على:

✅ نظام Escrow آمن وموثوق  
✅ دعم التوقيعات الرقمية  
✅ نظام حل النزاعات  
✅ API كامل وجاهز  
✅ اختبارات شاملة  

---

**التاريخ**: 2 فبراير 2026  
**الحالة**: 📋 جاهز للبدء  
**السابق**: ✅ Project #1 Complete  
**التالي**: Project #3 - OpenSkills
