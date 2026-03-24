# PHASE 4.2 — Escrow & State Machine

## ✅ Implementation Complete

### Files Created

| File | Purpose |
|------|---------|
| `migrations/002_escrow.sql` | Escrow state machine & rules |
| `src/dto/escrow.dto.ts` | Validation DTOs |
| `src/services/escrow.service.ts` | Atomic logic & transitions |
| `src/controllers/escrow.controller.ts` | REST API |
| `src/routes/escrow.routes.ts` | Endpoint definitions |

---

## 🔌 API Endpoints

### 1. Create Escrow (No funds moved)

```http
POST /api/v2/escrow
Content-Type: application/json

{
  "buyerWalletId": "buyer-uuid",
  "sellerWalletId": "seller-uuid",
  "amount": 10000,
  "currency": "EGP",
  "referenceType": "ORDER",
  "referenceId": "order_123",
  "description": "Purchase of Item XYZ"
}
```

**State Transition:** `NULL` -> `CREATED`

### 2. Fund Escrow (Buyer -> System)

```http
POST /api/v2/escrow/:id/fund
Content-Type: application/json

{
  "buyerWalletId": "buyer-uuid",
  "systemWalletId": "system-escrow-uuid"
}
```

**State Transition:** `CREATED` -> `FUNDED`
**Ledger:** `DEBIT` Buyer -> `CREDIT` System (Reason: `PURCHASE_HOLD`)

### 3. Release Funds (System -> Seller)

```http
POST /api/v2/escrow/:id/release
Content-Type: application/json

{
  "systemWalletId": "system-escrow-uuid"
}
```

**State Transition:** `FUNDED` -> `RELEASED`
**Ledger:** `DEBIT` System -> `CREDIT` Seller (Reason: `PURCHASE_RELEASE`)

### 4. Refund Buyer (System -> Buyer)

```http
POST /api/v2/escrow/:id/refund
Content-Type: application/json

{
  "systemWalletId": "system-escrow-uuid",
  "reason": "Seller cancelled"
}
```

**State Transition:** `FUNDED` -> `REFUNDED`
**Ledger:** `DEBIT` System -> `CREDIT` Buyer (Reason: `REFUND`)

---

## 🔒 Security & Invariants

1. **State Machine Enforced**:
   - `validate_escrow_transition` DB trigger prevents illegal updates (e.g. `CREATED` -> `RELEASED` direct is blocked).
   - Service layer double-checks state before transactions.

2. **Atomic Money Movement**:
   - All fund moves use the Phase 4.1 atomic transfer service.
   - Money moves + State update happen in ONE transaction.

3. **Audit Trail**:
   - `holdEntryId` links to the specific ledger entry locking funds.
   - `releaseEntryId` links to the payout entry.
   - `refundEntryId` links to the refund entry.

4. **Idempotency**:
   - All `fund`, `release`, `refund` ops accept `requestId` (header or body) to prevent double-execution.

---

## 📊 State Machine Diagram

```
[ CREATED ] ──(Fund)──▶ [ FUNDED ] ──(Release)──▶ [ RELEASED ]
                           │   ▲
                       (Dispute)
                           │   │ (Resolve)
                           ▼   │
                        [ DISPUTED ]
                           │
                       (Refund)
                           ▼
                        [ REFUNDED ]
```

---

## 📝 Next Steps

1. Run migration: `npx prisma migrate dev`
2. Update Control Center to monitor Escrow states.
3. Integrate with Order Service (Phase 5).
