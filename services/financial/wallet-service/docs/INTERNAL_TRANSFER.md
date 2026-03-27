# PHASE 4.1 — Internal Wallet Transfer

## ✅ Implementation Complete

### Files Created

| File | Purpose |
|------|---------|
| `src/services/transfer.service.v2.ts` | Atomic transfer operations |
| `src/dto/transfer.dto.ts` | DTOs with validation |
| `src/controllers/transfer.controller.v2.ts` | REST controller |
| `src/routes/transfer.routes.v2.ts` | Transfer route |

---

## 🔌 API Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v2/transfer` | Atomic wallet-to-wallet transfer |

---

## 📝 Example Request/Response

### Transfer Request
```bash
curl -X POST http://localhost:3019/api/v2/transfer \
  -H "Content-Type: application/json" \
  -H "X-User-Id: admin_001" \
  -H "X-Request-Id: escrow_order_12345_hold" \
  -d '{
    "fromWalletId": "buyer-wallet-uuid",
    "toWalletId": "system-escrow-wallet-uuid",
    "amount": 150.00,
    "reason": "PURCHASE_HOLD",
    "referenceType": "ORDER",
    "referenceId": "order_12345",
    "description": "Payment hold for order #12345"
  }'
```

### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "transferId": "transfer-uuid-12345",
    "fromEntry": {
      "entryId": "debit-entry-uuid",
      "walletId": "buyer-wallet-uuid",
      "balanceBefore": "50000",
      "balanceBeforeFormatted": "500.00 ج.م",
      "balanceAfter": "35000",
      "balanceAfterFormatted": "350.00 ج.م"
    },
    "toEntry": {
      "entryId": "credit-entry-uuid",
      "walletId": "system-escrow-wallet-uuid",
      "balanceBefore": "100000",
      "balanceBeforeFormatted": "1000.00 ج.م",
      "balanceAfter": "115000",
      "balanceAfterFormatted": "1150.00 ج.م"
    },
    "amount": "15000",
    "amountFormatted": "150.00 ج.م",
    "currency": "EGP",
    "reason": "PURCHASE_HOLD",
    "referenceType": "ORDER",
    "referenceId": "order_12345",
    "idempotencyKey": "escrow_order_12345_hold",
    "createdAt": "2026-01-06T17:35:00.000Z",
    "isIdempotent": false
  },
  "message": "Transfer completed successfully",
  "messageAr": "تم التحويل بنجاح"
}
```

---

## 📊 Transaction Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      ATOMIC TRANSFER TRANSACTION FLOW                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  POST /api/v2/transfer                                                        │
│  {fromWalletId, toWalletId, amount: 150.00, reason: "PURCHASE_HOLD"}         │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                    BEGIN TRANSACTION                                 │     │
│  │                (SERIALIZABLE ISOLATION)                              │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  STEP 1: Lock both wallets (ordered by ID to prevent deadlock)      │     │
│  │  ═══════════════════════════════════════════════════════════════    │     │
│  │  SELECT * FROM wallet                                                │     │
│  │  WHERE id IN (wallet_A, wallet_B)                                   │     │
│  │  ORDER BY id                                                         │     │
│  │  FOR UPDATE ◄─── Row-level lock acquired                            │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  STEP 2: Validate wallet statuses                                   │     │
│  │  ═══════════════════════════════════════════════════════════════    │     │
│  │  ✓ fromWallet.status == ACTIVE                                      │     │
│  │  ✓ toWallet.status == ACTIVE                                        │     │
│  │  ✗ FROZEN → WalletFrozenError                                       │     │
│  │  ✗ CLOSED → WalletClosedError                                       │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  STEP 3: Validate currency match                                    │     │
│  │  ═══════════════════════════════════════════════════════════════    │     │
│  │  ✓ fromWallet.currency == toWallet.currency                         │     │
│  │  ✗ Mismatch → CurrencyMismatchError                                 │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  STEP 4: Get current balances (within the lock)                     │     │
│  │  ═══════════════════════════════════════════════════════════════    │     │
│  │  fromBalance = SELECT balance_after FROM ledger_entry               │     │
│  │                WHERE wallet_id = fromWalletId                       │     │
│  │                ORDER BY created_at DESC LIMIT 1                     │     │
│  │                                                                      │     │
│  │  toBalance = SELECT balance_after FROM ledger_entry                 │     │
│  │              WHERE wallet_id = toWalletId                           │     │
│  │              ORDER BY created_at DESC LIMIT 1                       │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  STEP 5: Validate sufficient balance                                │     │
│  │  ═══════════════════════════════════════════════════════════════    │     │
│  │  ✓ fromBalance (50000) >= amount (15000)                            │     │
│  │  ✗ Insufficient → InsufficientBalanceError + ROLLBACK               │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  STEP 6: Create DEBIT entry (source wallet)                         │     │
│  │  ═══════════════════════════════════════════════════════════════    │     │
│  │  INSERT INTO ledger_entry (                                          │     │
│  │    wallet_id: fromWalletId,                                          │     │
│  │    entry_type: 'DEBIT',                                              │     │
│  │    amount: 15000,                                                    │     │
│  │    reason: 'TRANSFER_OUT',                                           │     │
│  │    balance_after: 35000,  ◄─── fromBalance - amount                 │     │
│  │    idempotency_key: 'transfer_out:escrow_order_12345_hold'          │     │
│  │  )                                                                   │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  STEP 7: Create CREDIT entry (destination wallet)                   │     │
│  │  ═══════════════════════════════════════════════════════════════    │     │
│  │  INSERT INTO ledger_entry (                                          │     │
│  │    wallet_id: toWalletId,                                            │     │
│  │    entry_type: 'CREDIT',                                             │     │
│  │    amount: 15000,                                                    │     │
│  │    reason: 'TRANSFER_IN',                                            │     │
│  │    balance_after: 115000,  ◄─── toBalance + amount                  │     │
│  │    idempotency_key: 'transfer_in:escrow_order_12345_hold'           │     │
│  │  )                                                                   │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │  STEP 8: Update wallet timestamps                                   │     │
│  │  ═══════════════════════════════════════════════════════════════    │     │
│  │  UPDATE wallet SET updated_at = NOW()                               │     │
│  │  WHERE id IN (fromWalletId, toWalletId)                             │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                         COMMIT                                       │     │
│  │              Locks released, changes persisted                       │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│                        │                                                      │
│                        ▼                                                      │
│                   Return Success                                              │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

                        FAILURE SCENARIOS
                        ─────────────────

  ┌────────────────────────────────────────────────────────────────┐
  │  ANY ERROR AT ANY STEP → AUTOMATIC ROLLBACK                    │
  │  ════════════════════════════════════════════════════════════  │
  │                                                                 │
  │  • Wallet not found         → ROLLBACK → WalletNotFoundError   │
  │  • Wallet frozen/closed     → ROLLBACK → WalletFrozen/Closed   │
  │  • Currency mismatch        → ROLLBACK → CurrencyMismatchError │
  │  • Insufficient balance     → ROLLBACK → InsufficientBalance   │
  │  • Duplicate idempotency    → ROLLBACK → Return existing entry │
  │  • Database error           → ROLLBACK → InternalError         │
  │  • Timeout (15s)            → ROLLBACK → TimeoutError          │
  │                                                                 │
  │  GUARANTEE: Either BOTH entries created, or NEITHER            │
  │             No partial transfers possible                      │
  │                                                                 │
  └────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Deadlock Prevention

When transferring between two wallets concurrently in opposite directions, deadlocks can occur:

```
Without ordering:
  Thread A: Lock Wallet-1, then Lock Wallet-2
  Thread B: Lock Wallet-2, then Lock Wallet-1
  → DEADLOCK!
```

**Solution: Always lock in consistent order (by wallet ID)**

```typescript
// Sort wallet IDs to ensure consistent locking order
const walletIds = [fromWalletId, toWalletId].sort();

// Lock in sorted order
const walletRows = await tx.$queryRaw`
  SELECT * FROM wallet 
  WHERE id IN (${walletIds[0]}::uuid, ${walletIds[1]}::uuid)
  ORDER BY id
  FOR UPDATE
`;
```

This ensures all transactions acquire locks in the same order, preventing deadlocks.

---

## 🛡️ Use Cases

### 1. Buyer → System (Escrow Hold)
```json
{
  "fromWalletId": "buyer-wallet-uuid",
  "toWalletId": "system-escrow-wallet-uuid",
  "amount": 150.00,
  "reason": "PURCHASE_HOLD",
  "referenceType": "ORDER",
  "referenceId": "order_12345"
}
```

### 2. System → Seller (Payout)
```json
{
  "fromWalletId": "system-escrow-wallet-uuid",
  "toWalletId": "seller-wallet-uuid",
  "amount": 142.50,
  "reason": "PAYOUT",
  "referenceType": "ESCROW",
  "referenceId": "escrow_12345"
}
```

### 3. Manual Admin Adjustment
```json
{
  "fromWalletId": "system-operations-wallet-uuid",
  "toWalletId": "user-wallet-uuid",
  "amount": 50.00,
  "reason": "ADJUSTMENT",
  "referenceType": "MANUAL",
  "referenceId": "ticket_support_789",
  "description": "Goodwill credit for delayed delivery"
}
```

---

## ✅ Validations

| Check | Error |
|-------|-------|
| Amount ≤ 0 | `INVALID_AMOUNT` |
| Same wallet | `VALIDATION_ERROR` |
| From wallet not found | `WALLET_NOT_FOUND` |
| To wallet not found | `WALLET_NOT_FOUND` |
| Wallet frozen | `WALLET_FROZEN` |
| Wallet closed | `WALLET_CLOSED` |
| Currency mismatch | `CURRENCY_MISMATCH` |
| Insufficient balance | `INSUFFICIENT_BALANCE` |
| Duplicate request | Returns existing (200 OK) |

---

## 📋 Ledger Entries Created

For each transfer, **two** ledger entries are created:

| Entry | Wallet | Type | Reason | Amount |
|-------|--------|------|--------|--------|
| 1 | Source | DEBIT | TRANSFER_OUT | +15000 |
| 2 | Destination | CREDIT | TRANSFER_IN | +15000 |

Both entries share the same `reference_id` (transfer ID) for linkage.

---

## 🎯 Ready for Escrow Integration

With this transfer mechanism:
- **Hold funds**: `Buyer → System` with reason `PURCHASE_HOLD`
- **Release to seller**: `System → Seller` with reason `PAYOUT`
- **Refund buyer**: `System → Buyer` with reason `REFUND`
- **Platform fee**: `System → Platform` with reason `FEE`

All operations are atomic, idempotent, and fully auditable.
