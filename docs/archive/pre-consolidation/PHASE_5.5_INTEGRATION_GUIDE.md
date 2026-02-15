# PHASE 5.5 — Integration Guide
## Settlement Finality & Appeals Window

---

## QUICK START

### 1. Register Routes in API Gateway

In your main Express app (`backend/services/auction-service/src/index.ts` or similar):

```typescript
import appealsRoutes from './routes/appeals-window.routes';

// Register appeals routes
app.use('/api/appeals', appealsRoutes);
```

### 2. Update Auction Settlement Flow

In `auction.service.ts`, after `endAuction()` completes:

```typescript
import { appealsWindowService } from './appeals-window.service';

async endAuction(listingId: number) {
  // ... existing settlement logic ...
  
  // After settlement completes
  const result = await this.endAuction(listingId);
  
  // Initialize appeals window (72 hours default)
  await appealsWindowService.initializeAppealWindow(listingId);
  
  return result;
}
```

### 3. Prevent Changes to Finalized Auctions

Before any auction modification, verify immutability:

```typescript
import { appealsWindowService } from './appeals-window.service';

async modifyAuction(auctionId: number, data: any) {
  // Verify auction is not finalized
  await appealsWindowService.verifyImmutability(auctionId);
  
  // Proceed with modification
  // ...
}
```

---

## WORKFLOW EXAMPLES

### Example 1: Bidder Submits Appeal

```typescript
// Bidder submits appeal during window
const result = await appealsWindowService.submitAppeal({
  auctionId: 123,
  appellantId: 456,
  reasonCode: AppealReason.TECHNICAL_ERROR,
  description: 'Settlement calculation appears incorrect'
});

console.log('Appeal submitted:', result.appeal.id);
console.log('Window closes at:', result.windowConfig.windowEndsAt);
```

### Example 2: Admin Resolves Appeal

```typescript
// Admin reviews and rejects appeal
const result = await appealsWindowService.resolveAppeal({
  appealId: 789,
  resolution: 'REJECT',
  resolutionNote: 'Settlement calculation verified as correct',
  resolvedBy: 'admin-1'
});

console.log('Appeal resolved:', result.appeal.status);
```

### Example 3: Finalize Settlement

```typescript
// After appeals window closes
const finality = await appealsWindowService.checkSettlementFinality(123);

if (finality.isFinalized) {
  console.log('Auction is finalized and immutable');
} else if (!finality.canAppeal) {
  // Window closed, no accepted appeals
  await appealsWindowService.finalizeSettlement(123);
  console.log('Settlement finalized');
}
```

### Example 4: Admin Override

```typescript
// Admin overrides settlement (requires dual approval)
const result = await appealsWindowService.adminOverride({
  auctionId: 123,
  overrideReason: 'Fraud detected in winning bid',
  newState: SettlementState.OVERRIDDEN,
  initiatedBy: 'admin-1',
  approvedBy: 'admin-2',  // Different person
  metadata: {
    fraudScore: 0.95,
    reason: 'Bidder used multiple accounts'
  }
});

console.log('Override applied:', result.overrideLog.id);
console.log('Audit trail created');
```

---

## DATABASE MIGRATION

### Apply Migration

```bash
cd backend/services/auction-service

# Apply migration
npx prisma migrate deploy

# Or for development
npx prisma migrate dev --name phase_5_5_settlement_finality
```

### Verify Migration

```bash
# Check Prisma schema is updated
npx prisma generate

# Verify models in database
npx prisma db push
```

---

## TESTING

### Run Safety Tests

```bash
cd backend/services/auction-service

# Run Phase 5.5 tests
npm test -- appeals-window-safety-phase-5.5.test.ts

# Run all tests
npm test
```

### Expected Output

```
PASS  src/services/__tests__/appeals-window-safety-phase-5.5.test.ts
  Appeals Window Initialization
    ✓ should initialize appeals window for settled auction
    ✓ should reject initialization for non-settled auction
    ✓ should reject duplicate initialization
    ✓ should support custom window duration
  Appeal Submission
    ✓ should allow bidder to submit appeal during window
    ✓ should allow seller to submit appeal
    ✓ should reject appeal from non-participant
    ✓ should reject appeal after window closes
    ✓ should reject duplicate appeal from same appellant
    ✓ should reject invalid appeal reason
    ✓ should NOT extend appeals window when appeal submitted
  ... (9 test suites, 40+ tests total)

Test Suites: 1 passed, 1 total
Tests:       40 passed, 40 total
```

---

## MONITORING & CONTROL CENTER

### Check Settlement Status

```typescript
const finality = await appealsWindowService.checkSettlementFinality(auctionId);

console.log({
  auctionId: finality.auctionId,
  currentState: finality.currentState,
  isFinalized: finality.isFinalized,
  canAppeal: finality.canAppeal,
  appealWindowEndsAt: finality.appealWindowEndsAt,
  openAppeals: finality.openAppeals
});
```

### Get All Open Appeals

```typescript
const result = await appealsWindowService.getAllOpenAppeals(limit, offset);

console.log(`Total open appeals: ${result.pagination.total}`);
result.appeals.forEach(appeal => {
  console.log(`Appeal ${appeal.id}: ${appeal.reasonCode} (${appeal.status})`);
});
```

### Get Override History

```typescript
const overrideLogs = await appealsWindowService.getOverrideHistory(auctionId);

overrideLogs.forEach(log => {
  console.log(`Override: ${log.previousState} → ${log.newState}`);
  console.log(`Initiated by: ${log.initiatedBy}, Approved by: ${log.approvedBy}`);
  console.log(`Reason: ${log.overrideReason}`);
});
```

---

## ERROR HANDLING

### Common Errors

#### Appeal After Window Closes
```
Error: Appeals window has closed. Window ended at 2026-01-12T12:00:00Z
HTTP: 410 Gone
```

**Solution:** Check `checkSettlementFinality()` before allowing appeal submission.

#### Non-Participant Appeal
```
Error: Appellant must be a bidder or seller in this auction
HTTP: 403 Forbidden
```

**Solution:** Verify appellant is a bidder or seller before submission.

#### Single-Person Override
```
Error: SECURITY: Override requires dual approval. Initiator and approver must be different.
HTTP: 403 Forbidden
```

**Solution:** Use different admin accounts for `initiatedBy` and `approvedBy`.

#### Finalization with Accepted Appeals
```
Error: Cannot finalize: accepted appeal(s) require admin override. Use adminOverride() instead.
HTTP: 400 Bad Request
```

**Solution:** Use `adminOverride()` to handle accepted appeals.

---

## SECURITY CONSIDERATIONS

### 1. Dual Approval Enforcement
- Always verify `initiatedBy !== approvedBy`
- Log both admin IDs in audit trail
- Require separate authentication for each approval

### 2. Window Closure Enforcement
- Window boundaries are immutable once set
- Server-side timestamp validation (not frontend)
- Reject appeals after `windowEndsAt`

### 3. Immutability Verification
- Call `verifyImmutability()` before any auction modification
- Prevent accidental changes to finalized auctions
- Audit all override attempts

### 4. Audit Trail Protection
- All logs are append-only (no deletes/updates)
- Metadata includes full context
- Timestamps are server-generated

---

## PERFORMANCE CONSIDERATIONS

### Indexes
The following indexes are created for performance:

```sql
CREATE INDEX "AuctionAppeal_auctionId_idx" ON "AuctionAppeal"("auctionId");
CREATE INDEX "AuctionAppeal_status_idx" ON "AuctionAppeal"("status");
CREATE INDEX "SettlementOverrideLog_auctionId_idx" ON "SettlementOverrideLog"("auctionId");
CREATE INDEX "AppealsWindowConfig_windowEndsAt_idx" ON "AppealsWindowConfig"("windowEndsAt");
```

### Query Optimization
- Use `checkSettlementFinality()` for status checks (single query)
- Batch appeal resolutions when possible
- Archive old appeals after 90 days (optional)

---

## COMPLIANCE & AUDIT

### Audit Trail
Every action is logged:
- Appeal submission (appellant, reason, timestamp)
- Appeal resolution (admin, decision, timestamp)
- Settlement finalization (timestamp)
- Admin overrides (both admins, reason, timestamp)

### Legal Defensibility
- Immutable audit logs prove settlement integrity
- Dual-approval prevents unauthorized changes
- Timestamps are server-generated (not user-controlled)
- All decisions are documented

### Regulatory Compliance
- Finite appeals window (no indefinite disputes)
- Transparent resolution process
- Audit trail for regulatory review
- Dual-approval for high-stakes decisions

---

## TROUBLESHOOTING

### Appeals Window Not Initializing
```typescript
// Check if auction is settled
const auction = await prisma.listing.findUnique({
  where: { id: auctionId }
});
console.log('Auction status:', auction.status); // Should be SETTLED
```

### Cannot Submit Appeal
```typescript
// Check if window is still open
const windowConfig = await appealsWindowService.getAppealWindowConfig(auctionId);
console.log('Window ends at:', windowConfig.windowEndsAt);
console.log('Current time:', new Date());
```

### Override Not Applying
```typescript
// Verify dual approval
if (initiatedBy === approvedBy) {
  console.error('ERROR: Same person cannot initiate and approve');
}
```

---

## NEXT STEPS

1. **Deploy migration** to production
2. **Register routes** in API gateway
3. **Update auction settlement** to initialize appeals window
4. **Add immutability checks** to modification endpoints
5. **Monitor appeals** via control center
6. **Document SLAs** for appeal resolution
7. **Train admins** on dual-approval process

---

## SUPPORT

For issues or questions:
1. Check the safety tests for examples
2. Review the PHASE_5.5_SETTLEMENT_FINALITY_REVIEW.md
3. Consult the API endpoint documentation
4. Check error messages for guidance

---

**Phase 5.5 Integration Complete**
