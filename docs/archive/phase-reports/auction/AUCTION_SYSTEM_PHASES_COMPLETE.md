# Auction System - Phases 5.1, 5.2, 5.3 Complete

## System Architecture Overview

The real-money auction system now includes three critical phases:

### Phase 5.1: Anti-Sniping Extensions ✅
- Auto-extend auction end time when bids placed near deadline
- Configurable threshold and duration
- Capped maximum extensions
- Full audit trail of extensions

### Phase 5.2: Disputes & Bid Invalidations ✅
- Formal dispute layer for invalid bids
- Enum-only dispute reasons (no free-text)
- Dispute lifecycle: OPEN → RESOLVED/ESCALATED
- Bid invalidation with escrow release
- Settlement blocked with open disputes
- APPEND-ONLY audit logs

### Phase 5.3: Reserve Price & Hidden Minimums ✅
- Encrypted reserve price (AES-256-CBC)
- Reserve set at creation, immutable after LIVE
- Settlement validates reserve before winner determination
- Auction ends without winner if reserve not met
- Seller can restart auction with same reserve
- No reserve leaks to frontend

---

## Data Flow: Bid Placement to Settlement

```
1. BID PLACEMENT
   ├─ Validate bid amount > current + increment
   ├─ Check auction status = ACTIVE
   ├─ Create Bid record (status = WINNING)
   ├─ Update auction currentBid
   ├─ Check for auto-extend (Phase 5.1)
   │  └─ If bid within threshold → extend end time
   ├─ Process proxy bids (recursive)
   └─ Emit socket events

2. DISPUTE CREATION (Phase 5.2)
   ├─ Validate dispute reason (enum only)
   ├─ Create AuctionDispute (status = OPEN)
   ├─ Set auction.hasOpenDisputes = true
   ├─ Log dispute creation
   └─ Block settlement

3. DISPUTE RESOLUTION (Phase 5.2)
   ├─ Resolve dispute (DISMISS | INVALIDATE | ESCALATE)
   ├─ If INVALIDATE:
   │  ├─ Set bid.status = INVALIDATED
   │  ├─ Recompute auction ranking
   │  ├─ Release escrow if ACTIVE/ENDED
   │  └─ Log invalidation
   ├─ Update auction.hasOpenDisputes flag
   └─ Log resolution

4. AUCTION END
   ├─ Check for open disputes (Phase 5.2)
   │  └─ If any → SETTLEMENT_BLOCKED error
   ├─ Find highest VALID bid (ignore INVALIDATED)
   ├─ Validate reserve price (Phase 5.3)
   │  ├─ Decrypt reserve
   │  ├─ Compare highest bid to reserve
   │  └─ Determine reserveMet flag
   ├─ Determine settlement outcome
   │  ├─ If reserveMet:
   │  │  ├─ Set status = SETTLED
   │  │  ├─ Set winnerId & finalPrice
   │  │  └─ endedReason = NORMAL
   │  └─ If NOT reserveMet:
   │     ├─ Set status = ENDED_UNMET_RESERVE
   │     ├─ No winner
   │     └─ endedReason = RESERVE_NOT_MET
   ├─ Log settlement outcome
   └─ Release escrows

5. ESCROW RELEASE
   ├─ If reserveMet:
   │  ├─ Winner escrow → payout flow
   │  └─ Loser escrows → release
   └─ If NOT reserveMet:
      └─ ALL escrows → release
   ├─ Call wallet service ledger callback
   ├─ Log escrow release
   └─ Record ledger entry ID

6. AUCTION RESTART (Phase 5.3)
   ├─ Check status = ENDED_UNMET_RESERVE
   ├─ Create new auction (new ID)
   ├─ Copy reserve price (encrypted)
   ├─ Set status = ACTIVE
   └─ Log restart
```

---

## Safety Guarantees

### Bid Integrity
- ✅ Bids immutable (only status changes)
- ✅ Bid amounts never edited
- ✅ Bid history preserved
- ✅ Invalidated bids excluded from settlement

### Escrow Safety
- ✅ Escrow held until settlement
- ✅ Released only via ledger callback
- ✅ All releases logged
- ✅ Ledger entries immutable

### Settlement Determinism
- ✅ Disputes block settlement
- ✅ Reserve validated at settlement
- ✅ Highest valid bid determined
- ✅ Winner clearly identified
- ✅ All inputs logged

### Reserve Security
- ✅ Encrypted at rest (AES-256-CBC)
- ✅ Never exposed via API
- ✅ Never logged in plaintext
- ✅ Immutable after LIVE
- ✅ Decryption internal only

---

## API Endpoints Summary

### Auction Management
```
POST   /api/auctions                    - Create auction
GET    /api/auctions/:id                - Get auction details
GET    /api/auctions                    - List active auctions
```

### Bidding
```
POST   /api/bids/:auctionId/place       - Place bid
GET    /api/bids/:auctionId             - Get bids
POST   /api/bids/:auctionId/proxy       - Setup proxy bid
```

### Disputes (Phase 5.2)
```
POST   /api/v1/disputes                 - Create dispute
GET    /api/v1/disputes/open            - Get open disputes
GET    /api/v1/disputes/:id             - Get dispute details
POST   /api/v1/disputes/:id/resolve     - Resolve dispute
POST   /api/v1/bids/:id/invalidate      - Invalidate bid
GET    /api/v1/bids/:id/escrow-impact   - Preview escrow impact
GET    /api/v1/auctions/:id/disputes    - Get auction disputes
```

### Reserve Price (Phase 5.3)
```
POST   /api/v1/auctions/:id/reserve-price      - Set reserve
GET    /api/v1/auctions/:id/settlement-outcome - Get settlement result
GET    /api/v1/auctions/:id/escrow-releases    - Get escrow logs
POST   /api/v1/auctions/:id/restart            - Restart auction
GET    /api/v1/auctions/:id/verify-security    - Security audit
```

---

## Database Tables

### Core Auction Tables
- `Listing` - Auction metadata
- `Bid` - Individual bids
- `ProxyBid` - Automatic bidding configuration
- `AuctionExtension` - Extension history (Phase 5.1)

### Dispute Tables (Phase 5.2)
- `AuctionDispute` - Dispute records
- `DisputeResolutionLog` - Dispute audit trail
- `BidInvalidationLog` - Bid invalidation audit trail

### Settlement Tables (Phase 5.3)
- `SettlementOutcomeLog` - Settlement decisions
- `EscrowReleaseLog` - Escrow release audit trail

---

## Testing Coverage

### Phase 5.1 Tests
- Auto-extend triggers correctly
- Extension capped at maximum
- Concurrent bids handled safely
- Extension history logged

### Phase 5.2 Tests
- Invalidated bid never wins
- Escrow released only once
- Cannot invalidate settled bid
- Settlement blocked with open dispute
- Ledger remains append-only
- Dispute resolution fully logged
- Concurrent invalidations prevented

### Phase 5.3 Tests
- Auction never settles below reserve
- Escrow released when reserve unmet
- Reserve cannot be updated after LIVE
- Highest bid < reserve → no winner
- Ledger entries balanced & immutable
- Restart creates new auctionId
- No reserve data leaks via API

---

## Security Checklist

- [ ] `RESERVE_ENCRYPTION_KEY` configured (32+ chars)
- [ ] All tests passing
- [ ] No reserve leaks in logs
- [ ] Encryption IV random per operation
- [ ] Ledger entries immutable
- [ ] Escrow releases logged
- [ ] Settlement inputs logged
- [ ] Dispute resolution logged
- [ ] No plaintext reserves in database
- [ ] API never exposes reserve values

---

## Deployment Order

1. **Phase 5.1**: Deploy anti-sniping extensions
   - Test with existing auctions
   - Monitor extension behavior

2. **Phase 5.2**: Deploy disputes & invalidations
   - Test dispute creation/resolution
   - Verify settlement blocking
   - Monitor escrow releases

3. **Phase 5.3**: Deploy reserve price
   - Set `RESERVE_ENCRYPTION_KEY`
   - Test reserve validation
   - Verify no leaks
   - Monitor settlement outcomes

---

## Monitoring & Alerts

### Key Metrics
- Auction settlement success rate
- Reserve met vs. unmet ratio
- Dispute creation rate
- Bid invalidation rate
- Escrow release count
- Extension frequency

### Alerts
- Settlement failures
- Reserve leaks detected
- Encryption errors
- Ledger imbalances
- Concurrent transaction conflicts

---

## Future Enhancements

- [ ] Seller can set hidden minimum increment
- [ ] Automatic reserve adjustment based on market
- [ ] Dispute escalation workflow
- [ ] Auction restart with new reserve
- [ ] Analytics dashboard for reserve performance
- [ ] Fraud detection integration

---

## Compliance Summary

| Requirement | Phase | Status |
|-------------|-------|--------|
| Immutable bids | 5.2 | ✅ |
| Immutable ledger | 5.2 | ✅ |
| Escrow HOLD per bid | 5.2 | ✅ |
| Deterministic settlement | 5.3 | ✅ |
| Anti-sniping | 5.1 | ✅ |
| No frontend trust | 5.3 | ✅ |
| Full audit trail | 5.1-5.3 | ✅ |
| Reserve security | 5.3 | ✅ |

---

**All Phases Complete and Ready for Production** ✅
