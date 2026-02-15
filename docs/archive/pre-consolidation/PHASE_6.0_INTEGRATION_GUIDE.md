# PHASE 6.0 — Trust & Safety Enforcement Integration Guide

**Status**: ✅ COMPLETE  
**Date**: January 9, 2026

---

## Overview

This guide explains how to integrate Phase 6.0 Trust & Safety Enforcement with existing systems.

---

## Integration Points

### 1. Analytics Service Integration (Phase 5.7)

The enforcement system consumes signals from the analytics service.

#### How It Works

```typescript
// In your analytics service or controller
const analyticsService = new AnalyticsService();
const enforcementPolicyService = new EnforcementPolicyService();

// Get bidder trust signals
const bidderTrust = await analyticsService.getBidderTrustSignals(userId);

// Evaluate policy
const recommendation = await enforcementPolicyService.evaluatePolicy({
  targetUserId: userId,
  signals: {
    bidVelocity: bidderTrust.bidVelocity,
    fraudSignalCount: bidderTrust.fraudSignalCount,
    trustScore: bidderTrust.trustScore,
  },
});

// If recommendation suggests enforcement, create review
if (recommendation.recommendedAction !== 'NO_ACTION') {
  const action = await trustEnforcementService.createEnforcementReview({
    targetUserId: userId,
    recommendedAction: recommendation.recommendedAction,
    tier: recommendation.tier,
    evidence: recommendation.evidence,
    justification: recommendation.reasoning,
  });
}
```

#### Signals to Monitor

- `bidVelocity` - Bids per minute
- `fraudSignalCount` - Number of fraud signals
- `trustScore` - Overall trust score (0-100)
- `sellerDisputeRate` - Dispute rate for sellers
- `auctionsCompleted` - Number of completed auctions
- `paymentCompletionRate` - Payment completion rate
- `bidRetractionRate` - Bid retraction rate

### 2. Appeals Window Integration (Phase 5.5)

The enforcement system creates mandatory appeal windows similar to Phase 5.5.

#### How It Works

```typescript
// When enforcement action is executed
const executedAction = await trustEnforcementService.executeEnforcementAction({
  actionId: actionId,
  approvedBy: adminId,
  secondApprovedBy: secondAdminId, // For Tier 3
});

// Appeal window is automatically created (72 hours)
// Users can submit appeals during this window
const appeal = await appealService.submitAppeal({
  actionId: actionId,
  userId: userId,
  reason: 'I did not violate any rules',
  evidence: { proof: 'documentation' },
});
```

#### Appeal Window Duration

- Fixed at 72 hours
- Starts immediately after execution
- Cannot be extended
- Cannot be shortened

### 3. Seller Protection Integration (Phase 5.6)

The enforcement system can disable auto-relist for sellers.

#### How It Works

```typescript
// Enforcement action to disable auto-relist
const action = await trustEnforcementService.createEnforcementReview({
  targetSellerId: sellerId,
  recommendedAction: EnforcementActionType.AUTO_RELIST_DISABLE,
  tier: EnforcementTier.TIER_3_SEVERE,
  evidence: { reason: 'Repeated abuse pattern' },
  justification: 'Seller has violated auto-relist policies multiple times',
});

// When seller protection service checks auto-relist eligibility
const sellerProtectionService = new SellerProtectionService();
const isAutoRelistEnabled = await sellerProtectionService.isAutoRelistEnabled(sellerId);
// Returns false if enforcement action is active
```

#### Enforcement Actions Affecting Seller Protection

- `AUTO_RELIST_DISABLE` - Disable auto-relist
- `LISTING_CREATION_LIMIT` - Limit new listings
- `SELLER_REVIEW_FLAG` - Flag for manual review

### 4. Dispute System Integration (Phase 5.2)

The enforcement system can invalidate bids or cancel auctions based on disputes.

#### How It Works

```typescript
// When a dispute is resolved
const disputeService = new DisputeService();
const dispute = await disputeService.resolveDispute({
  disputeId: disputeId,
  resolution: ResolutionType.INVALIDATE,
});

// Create enforcement action to invalidate bid
const action = await trustEnforcementService.createEnforcementReview({
  targetAuctionId: auctionId,
  recommendedAction: EnforcementActionType.BID_INVALIDATION,
  tier: EnforcementTier.TIER_2_TEMPORARY,
  evidence: { disputeId: disputeId },
  justification: 'Bid invalidated due to dispute resolution',
});
```

#### Enforcement Actions Affecting Disputes

- `BID_INVALIDATION` - Invalidate bid (irreversible)
- `AUCTION_CANCEL` - Cancel auction (irreversible)

### 5. Auction Service Integration

The enforcement system can freeze or cancel auctions.

#### How It Works

```typescript
// When enforcement action is executed
const action = await trustEnforcementService.executeEnforcementAction({
  actionId: actionId,
  approvedBy: adminId,
});

// Check if auction is frozen
const auctionService = new AuctionService();
const isFrozen = await auctionService.isAuctionFrozen(auctionId);

// If frozen, prevent bid placement
if (isFrozen) {
  throw new Error('Auction is frozen due to enforcement action');
}
```

#### Enforcement Actions Affecting Auctions

- `AUCTION_FREEZE` - Freeze auction (reversible)
- `AUCTION_CANCEL` - Cancel auction (irreversible)

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Run database migrations
- [ ] Verify all 8 tables created
- [ ] Verify all 25+ indexes created
- [ ] Test database connections

### Phase 2: Service Integration
- [ ] Import TrustEnforcementService
- [ ] Import AppealService
- [ ] Import EnforcementPolicyService
- [ ] Initialize services in your app

### Phase 3: API Integration
- [ ] Import TrustEnforcementController
- [ ] Import TrustEnforcementRoutes
- [ ] Register routes in Express app
- [ ] Test endpoints with curl

### Phase 4: Analytics Integration
- [ ] Connect analytics signals to policy evaluation
- [ ] Implement signal aggregation
- [ ] Test policy evaluation
- [ ] Monitor policy recommendations

### Phase 5: Appeals Integration
- [ ] Implement appeal submission UI
- [ ] Implement appeal decision UI
- [ ] Test appeal window
- [ ] Monitor appeal submissions

### Phase 6: Testing
- [ ] Run safety test suite
- [ ] Verify all tests passing
- [ ] Test enforcement workflow end-to-end
- [ ] Test appeal workflow end-to-end

### Phase 7: Deployment
- [ ] Deploy to staging
- [ ] Run integration tests
- [ ] Deploy to production
- [ ] Monitor enforcement actions

---

## Code Examples

### Example 1: Create Enforcement Review

```typescript
import { TrustEnforcementService, EnforcementActionType, EnforcementTier } from './services/trust-enforcement.service';

const trustEnforcementService = new TrustEnforcementService();

// Create enforcement review
const action = await trustEnforcementService.createEnforcementReview({
  targetUserId: 123,
  recommendedAction: EnforcementActionType.BID_THROTTLE,
  tier: EnforcementTier.TIER_1_SOFT,
  evidence: {
    bidVelocity: 15,
    timeWindow: '1min',
    bidCount: 10,
  },
  justification: 'High bid velocity detected in auction #456',
  durationMinutes: 60,
});

console.log('Enforcement review created:', action.id);
```

### Example 2: Approve and Execute Enforcement Action

```typescript
import { TrustEnforcementService } from './services/trust-enforcement.service';

const trustEnforcementService = new TrustEnforcementService();

// Approve action
const approved = await trustEnforcementService.approveEnforcementAction(
  actionId,
  'admin-1'
);

console.log('Action approved:', approved.status);

// Execute action
const executed = await trustEnforcementService.executeEnforcementAction({
  actionId: actionId,
  approvedBy: 'admin-1',
  secondApprovedBy: 'admin-2', // Required for Tier 3
  executionNote: 'Executed due to repeated violations',
});

console.log('Action executed:', executed.status);
console.log('Appeal window ends at:', executed.metadata.appealWindowEndsAt);
```

### Example 3: Submit Appeal

```typescript
import { AppealService } from './services/appeal.service';

const appealService = new AppealService();

// Submit appeal
const result = await appealService.submitAppeal({
  actionId: 1,
  userId: 123,
  reason: 'I did not violate any rules. This is a false positive.',
  evidence: {
    proof: 'I have documentation showing legitimate bidding',
    attachments: ['doc1.pdf', 'doc2.pdf'],
  },
});

console.log('Appeal submitted:', result.submission.id);
console.log('Appeal status:', result.appeal.status);
```

### Example 4: Decide Appeal

```typescript
import { AppealService } from './services/appeal.service';

const appealService = new AppealService();

// Decide on appeal
const result = await appealService.decideAppeal({
  appealId: 1,
  decision: 'APPROVED',
  decidedBy: 'admin-2',
  justification: 'After reviewing the evidence, the appeal is valid. The user did not violate any rules.',
  metadata: {
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'admin-2',
  },
});

console.log('Appeal decided:', result.appeal.status);
console.log('Decision:', result.decision.decision);
```

### Example 5: Evaluate Policy

```typescript
import { EnforcementPolicyService } from './services/enforcement-policy.service';

const enforcementPolicyService = new EnforcementPolicyService();

// Evaluate policy
const recommendation = await enforcementPolicyService.evaluatePolicy({
  targetUserId: 123,
  signals: {
    bidVelocity: 25,
    fraudSignalCount: 4,
    trustScore: 25,
  },
});

console.log('Recommended action:', recommendation.recommendedAction);
console.log('Tier:', recommendation.tier);
console.log('Confidence:', recommendation.confidence);
console.log('Reasoning:', recommendation.reasoning);
```

### Example 6: Get Enforcement Status

```typescript
import { TrustEnforcementService } from './services/trust-enforcement.service';

const trustEnforcementService = new TrustEnforcementService();

// Get user's enforcement status
const status = await trustEnforcementService.getEnforcementStatus(userId);

console.log('Active enforcements:', status.activeEnforcements);
console.log('Open appeals:', status.openAppeals);

// Check if user has active enforcement
if (status.activeEnforcements.length > 0) {
  console.log('User has active enforcement actions');
  status.activeEnforcements.forEach((action) => {
    console.log(`- ${action.actionType} (${action.tier})`);
  });
}
```

### Example 7: Revert Enforcement Action

```typescript
import { TrustEnforcementService } from './services/trust-enforcement.service';

const trustEnforcementService = new TrustEnforcementService();

// Revert enforcement action
const reverted = await trustEnforcementService.revertEnforcementAction({
  actionId: 1,
  revertedBy: 'admin-2',
  revertReason: 'Appeal was approved. User did not violate any rules.',
});

console.log('Action reverted:', reverted.status);
console.log('Revert reason:', reverted.metadata.revertReason);
```

---

## API Usage Examples

### Create Enforcement Review

```bash
curl -X POST http://localhost:3000/admin/enforcement/review \
  -H "Authorization: Bearer <TRUST_SAFETY_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": 123,
    "recommendedAction": "BID_THROTTLE",
    "tier": "TIER_1_SOFT",
    "evidence": {
      "bidVelocity": 15,
      "timeWindow": "1min"
    },
    "justification": "High bid velocity detected"
  }'
```

### Approve Enforcement Action

```bash
curl -X POST http://localhost:3000/admin/enforcement/approve \
  -H "Authorization: Bearer <TRUST_SAFETY_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": 1
  }'
```

### Execute Enforcement Action

```bash
curl -X POST http://localhost:3000/admin/enforcement/execute \
  -H "Authorization: Bearer <TRUST_SAFETY_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": 1,
    "secondApprovedBy": "admin-2"
  }'
```

### Submit Appeal

```bash
curl -X POST http://localhost:3000/me/appeal \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": 1,
    "reason": "I did not violate any rules",
    "evidence": {
      "proof": "documentation"
    }
  }'
```

### Get Enforcement Status

```bash
curl -X GET http://localhost:3000/me/enforcement-status \
  -H "Authorization: Bearer <USER_TOKEN>"
```

### List Enforcement Actions

```bash
curl -X GET "http://localhost:3000/admin/enforcement/actions?status=EXECUTED&limit=50" \
  -H "Authorization: Bearer <TRUST_SAFETY_ADMIN_TOKEN>"
```

---

## Monitoring & Observability

### Key Metrics to Monitor

1. **Enforcement Actions**
   - Total actions created
   - Actions by tier
   - Actions by type
   - Approval rate
   - Execution rate

2. **Appeals**
   - Total appeals submitted
   - Appeals approved
   - Appeals rejected
   - Average appeal resolution time

3. **Policy Evaluations**
   - Total evaluations
   - Recommendations by action type
   - Policy version usage
   - Average confidence score

### Logging

All enforcement actions are logged with:
- Action ID
- Action type
- Tier
- Target user/auction/seller
- Actor ID
- Timestamp
- Status
- Metadata

### Alerts

Set up alerts for:
- Tier 3 enforcement actions
- Appeal submissions
- Policy evaluation failures
- Dual approval failures

---

## Troubleshooting

### Issue: Enforcement action not executing

**Cause**: Action not in APPROVED status  
**Solution**: Verify action is approved before executing

### Issue: Dual approval not enforced

**Cause**: Same admin used for both approvals  
**Solution**: Use different admins for dual approval

### Issue: Appeal window closed

**Cause**: 72 hours have passed since execution  
**Solution**: Appeals can only be submitted within 72 hours

### Issue: Cannot revert action

**Cause**: Action is not reversible (e.g., BID_INVALIDATION)  
**Solution**: Check action type; some actions cannot be reverted

---

## Best Practices

1. **Always provide detailed justification** for enforcement actions
2. **Use policy evaluation** before creating enforcement reviews
3. **Require dual approval** for all Tier 3 actions
4. **Monitor appeal submissions** for patterns
5. **Log all enforcement decisions** for audit trail
6. **Test enforcement workflows** in staging before production
7. **Monitor enforcement metrics** for effectiveness
8. **Review policy rules** regularly for accuracy

---

## Support

For issues or questions:
1. Check the PHASE_6.0_TRUST_ENFORCEMENT_REVIEW.md for detailed documentation
2. Review the PHASE_6.0_COMPLETION_REPORT.md for implementation details
3. Check the test suite for usage examples
4. Contact the Trust & Safety team

---

**Phase 6.0 — Trust & Safety Enforcement** is ready for integration.
