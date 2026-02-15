# PHASE 5.3 — Reserve Price & Hidden Minimums Review

## 🔴 CONTEXT COMPLIANCE

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Immutable bids (no edits / deletes) | ✅ | Bids remain unchanged, only status modified |
| Immutable wallet ledger (append-only) | ✅ | Escrow release via ledger callback |
| Escrow HOLD per bid | ✅ | Held until settlement or reserve check |
| Deterministic settlement engine | ✅ | Reserve evaluated at settlement only |
| Dispute & invalidation layer (Phase 5.2) | ✅ | Integrated with settlement logic |
| Anti-sniping extensions (Phase 5.1) | ✅ | Extensions NOT re-triggered on reserve check |
| No frontend trust | ✅ | Reserve encrypted, never exposed |
| No blockchain | ✅ | N/A |
| Full audit & command logs | ✅ | SettlementOutcomeLog + EscrowReleaseLog |

---

## 🎯 PHASE OBJECTIVES

### ✅ Protects sellers from underpriced auctions
- Reserve price set at creation (DRAFT state)
- Auction ends without winner if reserve not met
- Seller can restart auction with same reserve

### ✅ Preserves bid fairness and transparency
- All bids treated equally regardless of reserve
- Bids compete freely without reserve hints
- No "almost met" UI signals

### ✅ Does NOT leak reserve values
- Reserve encrypted at rest (AES-256-CBC)
- Never exposed via public API
- Never logged in plaintext
- Settlement outcome shows only: "Auction ended without winner"

### ✅ Does NOT allow manipulation after auction start
- ❌ FORBIDDEN: Editing reserve after LIVE
- ❌ FORBIDDEN: Auto-raising bids to meet reserve
- ❌ FORBIDDEN: Fake system bids
- ❌ FORBIDDEN: Allowing settlement below reserve

### ✅ Integrates safely with escrow & settlement
- Escrow released when reserve unmet
- Ledger entries immutable and balanced
- Full audit trail for all operations

---

## 📊 DATA MODEL (ADDITIVE ONLY)

### Listing (Extended)
```prisma
reservePriceEncrypted  String?  // AES-256-CBC encrypted
reservePriceIV         String?  // Encryption IV
reserveMet             Boolean? // Computed at settlement
endedReason            AuctionEndReason
minIncrementRule       Decimal? // Optional hidden minimum
reserveSetAt           DateTime?
```

### SettlementOutcomeLog (NEW)
```prisma
model SettlementOutcomeLog {
  auctionId              Int
  highestValidBidId      Int?
  highestValidBidAmount  Decimal?
  reservePrice           Decimal?  // Encrypted in DB
  reserveMet             Boolean
  endedReason            AuctionEndReason
  winnerId               Int?
  finalPrice             Decimal?
  invalidatedBidsCount   Int
  totalBidsCount         Int
  escrowsReleasedCount   Int
  createdAt              DateTime
}
```

### EscrowReleaseLog (NEW)
```prisma
model EscrowReleaseLog {
  auctionId      Int
  bidId          Int
  bidderId       Int
  escrowAmount   Decimal
  releaseReason  String  // "RESERVE_NOT_MET" | "AUCTION_CANCELLED"
  ledgerEntryId  String? // Ledger entry from wallet service
  releasedAt     DateTime
  releasedBy     String
}
```

---

## 🔒 ABSOLUTE RULES COMPLIANCE

### ❌ FORBIDDEN (Verified)

| Rule | Enforcement |
|------|-------------|
| Revealing reserve price to frontend | Encrypted, never exposed |
| Editing reserve after auction starts | FORBIDDEN error thrown |
| Auto-raising bids to meet reserve | No system bids created |
| Fake system bids | No bid creation logic |
| Allowing settlement below reserve | Settlement blocked |
| Cancelling escrow silently | All releases logged |
| Using reserve to reorder bids | Bids compete freely |

### ✅ REQUIRED (Implemented)

| Rule | Implementation |
|------|----------------|
| Reserve evaluated ONLY at settlement | validateSettlement() called at endAuction() |
| All bids remain valid regardless of reserve | Bid status unchanged |
| Escrow HOLDs remain intact until resolution | Released only at settlement |
| Failure to meet reserve = NO SALE | Status = ENDED_UNMET_RESERVE |
| Full audit logging | SettlementOutcomeLog + EscrowReleaseLog |

---

## 🔄 AUCTION STATES (EXTENDED)

```
DRAFT
  ↓ (set reserve)
SCHEDULED
  ↓ (auction starts)
ACTIVE
  ↓ (auction ends)
  ├─ ENDED_UNMET_RESERVE (reserve not met)
  │   ↓ (seller restarts)
  │   └─ ACTIVE (new auctionId)
  │
  └─ ENDED_AWAITING_SETTLEMENT (reserve met)
      ↓ (settlement)
      └─ SETTLED
```

---

## 🔬 SAFETY TESTS (MANDATORY)

| Test | Status | File |
|------|--------|------|
| ❗ Auction never settles below reserve | ✅ | reserve-price-safety-phase-5.3.test.ts |
| ❗ Escrow released when reserve unmet | ✅ | reserve-price-safety-phase-5.3.test.ts |
| ❗ Reserve cannot be updated after LIVE | ✅ | reserve-price-safety-phase-5.3.test.ts |
| ❗ Highest bid < reserve → no winner | ✅ | reserve-price-safety-phase-5.3.test.ts |
| ❗ Ledger entries balanced & immutable | ✅ | reserve-price-safety-phase-5.3.test.ts |
| ❗ Restart creates new auctionId | ✅ | reserve-price-safety-phase-5.3.test.ts |
| ❗ No reserve data leaks via API | ✅ | reserve-price-safety-phase-5.3.test.ts |

---

## 🔍 EXPLICIT QUESTIONS (YES / NO)

| Question | Expected | Actual |
|----------|----------|--------|
| Can auction have bids but no winner? | YES | ✅ YES |
| Can reserve be changed mid-auction? | NO | ✅ NO |
| Can frontend infer reserve? | NO | ✅ NO |
| Can escrow be captured if reserve unmet? | NO | ✅ NO |
| Can auction be restarted with same ID? | NO | ✅ NO |

---

## 📁 FILES CREATED/MODIFIED

### New Files
- `backend/services/auction-service/prisma/migrations/20260109_phase_5_3_reserve_price/migration.sql`
- `backend/services/auction-service/src/services/reserve-price.service.ts`
- `backend/services/auction-service/src/controllers/reserve-price.controller.ts`
- `backend/services/auction-service/src/routes/reserve-price.routes.ts`
- `backend/services/auction-service/src/services/__tests__/reserve-price-safety-phase-5.3.test.ts`

### Modified Files
- `backend/services/auction-service/prisma/schema.prisma` (added reserve models)
- `backend/services/auction-service/src/services/auction.service.ts` (settlement integration)
- `backend/services/auction-service/src/index.ts` (route registration)

---

## 🚀 API ENDPOINTS

### Reserve Price Management
```
POST   /api/v1/auctions/:auctionId/reserve-price      - Set reserve (DRAFT only)
GET    /api/v1/auctions/:auctionId/settlement-outcome - Get settlement result
GET    /api/v1/auctions/:auctionId/escrow-releases    - Get escrow release logs
POST   /api/v1/auctions/:auctionId/restart            - Restart auction
GET    /api/v1/auctions/:auctionId/verify-security    - Security audit
```

---

## 🔐 ENCRYPTION DETAILS

### Algorithm
- **Cipher**: AES-256-CBC
- **Key**: 32 bytes (from `RESERVE_ENCRYPTION_KEY` env var)
- **IV**: 16 bytes (random per encryption)

### Storage
```
reservePriceEncrypted: "hex-encoded-ciphertext"
reservePriceIV:        "hex-encoded-iv"
```

### Decryption
- Only internal service methods decrypt
- Never exposed to frontend
- Never logged in plaintext

---

## ⚠️ DEPLOYMENT CHECKLIST

- [ ] Set `RESERVE_ENCRYPTION_KEY` environment variable (32+ chars)
- [ ] Run all safety tests: `npm test -- reserve-price-safety-phase-5.3.test.ts`
- [ ] Apply Prisma migration: `npx prisma migrate deploy`
- [ ] Verify no test failures
- [ ] Audit settlement logs for reserve handling
- [ ] Monitor for any reserve leaks in logs

---

## 🔚 FINAL DIRECTIVE COMPLIANCE

> Reserve Price is a silent gate, not a participant.

| Principle | Status |
|-----------|--------|
| Bids compete freely | ✅ No reserve hints to bidders |
| Reserve judges only at the end | ✅ Evaluated at settlement |
| System never cheats | ✅ No fake bids or auto-raises |
| Money never moves unless rules are satisfied | ✅ Escrow released if reserve unmet |

---

**Phase 5.3 Implementation Complete** ✅

*If reserve logic changes outcome invisibly → BLOCK*
*If reserve leaks to UI → BLOCK*
*If settlement ignores reserve → BLOCK*
