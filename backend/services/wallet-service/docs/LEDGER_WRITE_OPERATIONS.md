# PHASE 4.1 — Ledger Write Operations (CRITICAL)

## ✅ Implementation Complete

### Files Created

| File | Purpose |
|------|---------|
| `src/services/ledger.service.ts` | Core ledger operations with atomic writes |
| `src/dto/ledger.dto.ts` | DTOs for credit/debit requests |
| `src/controllers/ledger.controller.ts` | REST controller |
| `src/routes/ledger.routes.ts` | Express routes (POST only) |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v2/ledger/credit` | Add funds to wallet |
| `POST` | `/api/v2/ledger/debit` | Remove funds from wallet |

**Note:** No UPDATE or DELETE endpoints. Ledger is append-only by design.

---

## 📝 Example Request/Response

### Credit Wallet

**Request:**
```bash
curl -X POST http://localhost:3019/api/v2/ledger/credit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user_123" \
  -H "X-Request-Id: req_abc123_deposit_1000" \
  -d '{
    "walletId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "amount": 100.50,
    "reason": "DEPOSIT",
    "referenceType": "SYSTEM",
    "referenceId": "deposit_vendor_xyz",
    "description": "Cash deposit at branch"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "entryId": "e47ac10b-58cc-4372-a567-0e02b2c3d480",
    "walletId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "entryType": "CREDIT",
    "amount": "10050",
    "amountFormatted": "100.50 ج.م",
    "reason": "DEPOSIT",
    "balanceBefore": "5000",
    "balanceBeforeFormatted": "50.00 ج.م",
    "balanceAfter": "15050",
    "balanceAfterFormatted": "150.50 ج.م",
    "idempotencyKey": "req_abc123_deposit_1000",
    "createdAt": "2026-01-06T17:30:00.000Z",
    "isIdempotent": false
  },
  "message": "Credit applied successfully",
  "messageAr": "تم إضافة الرصيد بنجاح"
}
```

**Duplicate Request (200 OK):**
```json
{
  "success": true,
  "data": {
    "entryId": "e47ac10b-58cc-4372-a567-0e02b2c3d480",
    "isIdempotent": true
  },
  "message": "Duplicate request - returning existing entry",
  "messageAr": "طلب مكرر - إرجاع القيد الموجود"
}
```

---

### Debit Wallet

**Request:**
```bash
curl -X POST http://localhost:3019/api/v2/ledger/debit \
  -H "Content-Type: application/json" \
  -H "X-User-Id: system" \
  -H "X-Request-Id: order_12345_hold_5000" \
  -d '{
    "walletId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "amount": 50.00,
    "reason": "PURCHASE_HOLD",
    "referenceType": "ORDER",
    "referenceId": "order_12345",
    "description": "Payment hold for order #12345"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "entryId": "d47ac10b-58cc-4372-a567-0e02b2c3d481",
    "walletId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "entryType": "DEBIT",
    "amount": "5000",
    "amountFormatted": "50.00 ج.م",
    "reason": "PURCHASE_HOLD",
    "balanceBefore": "15050",
    "balanceBeforeFormatted": "150.50 ج.م",
    "balanceAfter": "10050",
    "balanceAfterFormatted": "100.50 ج.م",
    "idempotencyKey": "order_12345_hold_5000",
    "createdAt": "2026-01-06T17:31:00.000Z",
    "isIdempotent": false
  },
  "message": "Debit applied successfully",
  "messageAr": "تم خصم الرصيد بنجاح"
}
```

**Insufficient Balance (400):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance. Current: 10050, Requested: 20000",
    "messageAr": "الرصيد غير كافٍ"
  }
}
```

---

## 🔐 Race-Condition Handling

### The Problem

Without proper handling, two concurrent requests could:
1. Both read the same balance (e.g., 100.00)
2. Both calculate they have sufficient funds
3. Both debit 80.00
4. Result: -60.00 balance (INVALID!)

### The Solution: SELECT FOR UPDATE

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATOMIC TRANSACTION FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request A                        Request B                      │
│  ─────────                        ─────────                      │
│      │                                │                          │
│      ▼                                ▼                          │
│  BEGIN TRANSACTION              BEGIN TRANSACTION                │
│      │                                │                          │
│      ▼                                │                          │
│  SELECT FROM wallet             (WAITING...)                     │
│  WHERE id = ?                         │                          │
│  FOR UPDATE ◄─── Lock acquired        │                          │
│      │                                │                          │
│      ▼                                │                          │
│  Get last ledger entry                │                          │
│  balance = 10000                      │                          │
│      │                                │                          │
│      ▼                                │                          │
│  Validate: 10000 >= 8000 ✓            │                          │
│      │                                │                          │
│      ▼                                │                          │
│  INSERT ledger_entry                  │                          │
│  (amount=8000, balance_after=2000)    │                          │
│      │                                │                          │
│      ▼                                │                          │
│  COMMIT ────────────────────────► Lock released                  │
│                                       │                          │
│                                       ▼                          │
│                                   SELECT FROM wallet             │
│                                   FOR UPDATE ◄─── Lock acquired  │
│                                       │                          │
│                                       ▼                          │
│                                   Get last ledger entry          │
│                                   balance = 2000 ◄─── Updated!   │
│                                       │                          │
│                                       ▼                          │
│                                   Validate: 2000 >= 8000 ✗       │
│                                       │                          │
│                                       ▼                          │
│                                   ROLLBACK                       │
│                                   Return INSUFFICIENT_BALANCE    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Details

```typescript
// 1. SERIALIZABLE isolation level
await prisma.$transaction(async (tx) => {
  // ...
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
});

// 2. Row-level lock on wallet
const walletRows = await tx.$queryRaw`
  SELECT id, status, currency 
  FROM wallet 
  WHERE id = ${walletId}::uuid
  FOR UPDATE  -- ← This is the key!
`;

// 3. Get balance WITHIN the lock
const lastEntry = await tx.$queryRaw`
  SELECT balance_after FROM ledger_entry 
  WHERE wallet_id = ${walletId}::uuid
  ORDER BY created_at DESC LIMIT 1
`;

// 4. Validate and insert atomically
if (currentBalance < debitAmount) {
  throw new InsufficientBalanceError(...);
}

await tx.$executeRaw`INSERT INTO ledger_entry ...`;
```

### Key Guarantees

| Guarantee | How It's Achieved |
|-----------|-------------------|
| **Atomicity** | Single transaction, all or nothing |
| **Consistency** | Balance check within transaction |
| **Isolation** | `FOR UPDATE` prevents concurrent reads |
| **Durability** | Committed to PostgreSQL |

---

## 🛡️ Idempotency

### Purpose
Allow safe retries without duplicate charges.

### Mechanism
1. Client sends `requestId` (or uses `X-Request-Id` header)
2. Server generates `idempotencyKey` from operation details
3. Before transaction: Check if entry with this key exists
4. If exists: Return existing entry with `isIdempotent: true`
5. If not: Insert with unique constraint protection

### Idempotency Key Format
```
{operation}_{reason}:{referenceId}:{amount}

Examples:
- credit_DEPOSIT:pay_abc123:10050
- debit_PURCHASE_HOLD:order_12345:5000
```

### Double Protection
```sql
-- Unique constraint in schema
CONSTRAINT uq_ledger_idempotency 
  UNIQUE (wallet_id, idempotency_key)
```

Even if two requests pass the initial check simultaneously, the unique constraint ensures only one succeeds.

---

## ✅ Validations

| Validation | Error Code |
|------------|------------|
| Amount <= 0 | `INVALID_AMOUNT` |
| Wallet not found | `WALLET_NOT_FOUND` |
| Wallet frozen | `WALLET_FROZEN` |
| Wallet closed | `WALLET_CLOSED` |
| Debit > balance | `INSUFFICIENT_BALANCE` |
| Duplicate request | Returns existing entry |
| Invalid reason for operation | `VALIDATION_ERROR` |

### Valid Reasons by Operation

**Credit Operations:**
- `DEPOSIT` - External funds in
- `REFUND` - Money returned
- `PAYOUT` - Earnings released
- `TRANSFER_IN` - P2P received
- `PURCHASE_RELEASE` - Hold released
- `ADJUSTMENT` - Manual correction

**Debit Operations:**
- `WITHDRAWAL` - External funds out
- `PURCHASE_HOLD` - Order hold
- `FEE` - Platform fee
- `TRANSFER_OUT` - P2P sent
- `ADJUSTMENT` - Manual correction

---

## 🔒 Security Enforcement

| Rule | Implementation |
|------|----------------|
| Append-only ledger | No UPDATE/DELETE endpoints |
| Audit trail | `created_by` required on every entry |
| Immutability | DB trigger prevents updates (in migration) |
| No negative balance | Checked in transaction before insert |
| Authentication | Placeholder guard (`X-User-Id` header) |

---

## 📊 Monitoring

Every ledger operation logs:
```
[Ledger Error] {
  error: "INSUFFICIENT_BALANCE",
  path: "/api/v2/ledger/debit",
  method: "POST",
  body: { walletId: "...", amount: 5000 }
}
```

---

## ✅ Ready for Phase 4.2

With credit/debit implemented:
- Escrow can use `PURCHASE_HOLD` (debit) + `PURCHASE_RELEASE` (credit)
- Refunds use `REFUND` (credit)
- Fees use `FEE` (debit)
- All operations are idempotent and atomic
