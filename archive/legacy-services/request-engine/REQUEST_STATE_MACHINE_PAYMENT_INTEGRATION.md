# Request State Machine - Payment Integration

## Overview

Complete integration of Request state machine with Stripe payment system and internal wallet escrow.

## State Machine Changes

### New State: AWAITING_PAYMENT

Added between `ACCEPTED` and `IN_PROGRESS`:

```
VISIBLE_TO_TRAVELERS → ACCEPTED → AWAITING_PAYMENT → IN_PROGRESS → DELIVERED
```

### Updated State Transitions

#### 1. ACCEPTED → AWAITING_PAYMENT
**Trigger**: Traveler accepts request  
**Actions**:
- ✅ Create Stripe PaymentIntent
- ✅ Calculate platform fee (7%)
- ✅ Store payment intent ID and client secret
- ✅ Send payment link to buyer (TODO: notification service)

**Logging**:
```
[StateTransitionService] Accepting request {requestId} by traveler {travelerId}
[StateTransitionService] Transitioning request {requestId} to ACCEPTED
[StateTransitionService] Transitioning request {requestId} to AWAITING_PAYMENT
[StateTransitionService] Creating payment intent for request {requestId}
[PaymentIntegrationService] Creating payment intent: {...}
[PaymentIntegrationService] Payment intent created: {paymentIntentId}
```

---

#### 2. AWAITING_PAYMENT → IN_PROGRESS
**Trigger**: Stripe webhook `payment_intent.succeeded`  
**Actions**:
- ✅ Lock funds in internal wallet (WalletService.lockFunds)
- ✅ Create escrow hold
- ✅ Update escrow status to HELD
- ✅ Transition to IN_PROGRESS

**Logging**:
```
[StateTransitionService] Handling payment success for request {requestId}
[StateTransitionService] Locking funds for request {requestId}
[PaymentIntegrationService] Locking funds: {...}
[PaymentIntegrationService] Funds locked successfully
[StateTransitionService] Funds locked successfully for request {requestId}
[StateTransitionService] Transitioning request {requestId} to IN_PROGRESS
```

---

#### 3. IN_PROGRESS → DELIVERED
**Trigger**: Traveler marks delivery complete  
**Actions**:
- ✅ Release funds to traveler (WalletService.releaseFunds)
- ✅ Deduct platform fee (WalletService.deductFee)
- ✅ Update escrow status to RELEASED
- ✅ Send notification to traveler (TODO: notification service)

**Logging**:
```
[StateTransitionService] Completing delivery for request {requestId}
[StateTransitionService] Releasing funds to traveler {travelerId}
[PaymentIntegrationService] Releasing funds: {...}
[PaymentIntegrationService] Funds released successfully
[StateTransitionService] Deducting platform fee: {platformFee}
[PaymentIntegrationService] Deducting platform fee: {...}
[PaymentIntegrationService] Platform fee deducted successfully
[StateTransitionService] Transitioning request {requestId} to DELIVERED
```

---

#### 4. CANCELLED (from AWAITING_PAYMENT)
**Trigger**: User cancels request before payment  
**Actions**:
- ✅ Cancel Stripe PaymentIntent
- ✅ Update payment status to CANCELLED
- ✅ No refund needed (payment not captured)

**Logging**:
```
[StateTransitionService] Cancelling request {requestId} by user {userId}
[StateTransitionService] Current status: AWAITING_PAYMENT
[StateTransitionService] Cancelling payment intent {paymentIntentId}
[PaymentIntegrationService] Cancelling payment intent: {paymentIntentId}
[StateTransitionService] Payment intent cancelled for request {requestId}
[StateTransitionService] Transitioning request {requestId} to CANCELLED
```

---

#### 5. CANCELLED (after payment)
**Trigger**: User cancels request after payment  
**Actions**:
- ✅ Refund funds to buyer (WalletService.refundFunds)
- ✅ Create Stripe refund
- ✅ Update escrow status to REFUNDED

**Logging**:
```
[StateTransitionService] Cancelling request {requestId} by user {userId}
[StateTransitionService] Current status: IN_PROGRESS
[StateTransitionService] Refunding funds for request {requestId}
[PaymentIntegrationService] Refunding funds: {...}
[PaymentIntegrationService] Funds refunded successfully
[StateTransitionService] Creating Stripe refund for {paymentIntentId}
[PaymentIntegrationService] Creating Stripe refund: {...}
[PaymentIntegrationService] Stripe refund created successfully
[StateTransitionService] Refund completed for request {requestId}
[StateTransitionService] Transitioning request {requestId} to CANCELLED
```

---

## Database Schema Changes

### New Fields in `requests` Table

```sql
-- Payment fields
payment_intent_id VARCHAR(255)           -- Stripe PaymentIntent ID
payment_client_secret TEXT               -- Client secret for frontend
payment_amount DECIMAL(19, 4)            -- Original amount (product price)
payment_platform_fee DECIMAL(19, 4)      -- Platform fee (7%)
payment_total_amount DECIMAL(19, 4)      -- Total charged (amount + fee)
payment_status VARCHAR(50)               -- PENDING, SUCCEEDED, FAILED, CANCELLED, REFUNDED

-- Escrow fields
escrow_status VARCHAR(50)                -- HELD, RELEASED, REFUNDED
escrow_created_at TIMESTAMP              -- When funds locked
escrow_released_at TIMESTAMP             -- When funds released to traveler
escrow_refunded_at TIMESTAMP             -- When funds refunded to buyer
```

### Indexes

```sql
CREATE INDEX idx_requests_payment_intent_id ON requests(payment_intent_id);
CREATE INDEX idx_requests_payment_status ON requests(payment_status);
CREATE INDEX idx_requests_escrow_status ON requests(escrow_status);
```

---

## Service Integration

### PaymentIntegrationService

New service that handles communication with:
1. **payment-service** (Stripe integration)
2. **internal-ledger-service** (Wallet & escrow)

**Methods**:
- `createPaymentIntent()` - Create Stripe PaymentIntent
- `cancelPaymentIntent()` - Cancel PaymentIntent
- `lockFunds()` - Lock funds in wallet
- `releaseFunds()` - Release funds to traveler
- `refundFunds()` - Refund funds to buyer
- `createStripeRefund()` - Create Stripe refund
- `deductPlatformFee()` - Deduct platform fee

---

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Request State Machine                        │
└─────────────────────────────────────────────────────────────────┘

CREATED
   │
   │ (auto)
   ▼
VISIBLE_TO_TRAVELERS
   │
   │ (traveler accepts)
   ▼
ACCEPTED
   │
   │ (create PaymentIntent)
   │ (send payment link)
   ▼
AWAITING_PAYMENT ◄──────────────────┐
   │                                 │
   │ (payment_intent.succeeded)      │ (cancel before payment)
   │ (lock funds)                    │
   │ (create escrow)                 │
   ▼                                 │
IN_PROGRESS                          │
   │                                 │
   │ (delivery complete)             │ (cancel after payment)
   │ (release funds)                 │ (refund funds)
   │ (deduct fee)                    │
   ▼                                 │
DELIVERED                            │
                                     │
                                     ▼
                                 CANCELLED
```

---

## API Flow

### 1. Accept Request
```typescript
POST /api/requests/:id/accept

Request:
{
  "travelerId": "traveler_123"
}

Response:
{
  "request": {
    "id": "req_123",
    "status": "AWAITING_PAYMENT",
    "travelerId": "traveler_123",
    ...
  },
  "paymentIntent": {
    "id": "pi_xxx",
    "clientSecret": "pi_xxx_secret_yyy",
    "amount": 107.00
  }
}
```

### 2. Payment Webhook (Internal)
```typescript
POST /api/webhooks/stripe

Event: payment_intent.succeeded

Actions:
- Lock funds in wallet
- Create escrow
- Transition to IN_PROGRESS
```

### 3. Complete Delivery
```typescript
POST /api/requests/:id/complete

Request:
{
  "travelerId": "traveler_123"
}

Response:
{
  "request": {
    "id": "req_123",
    "status": "DELIVERED",
    "escrowStatus": "RELEASED",
    ...
  }
}
```

### 4. Cancel Request
```typescript
POST /api/requests/:id/cancel

Request:
{
  "userId": "user_123",
  "reason": "Changed my mind"
}

Response:
{
  "request": {
    "id": "req_123",
    "status": "CANCELLED",
    "escrowStatus": "REFUNDED",  // if after payment
    ...
  }
}
```

---

## Environment Variables

Required in `.env`:

```bash
# Payment Service
PAYMENT_SERVICE_URL=http://localhost:3004

# Internal Ledger Service
INTERNAL_LEDGER_SERVICE_URL=http://localhost:3010
```

---

## Error Handling

### Payment Intent Creation Failed
```typescript
try {
  // Create payment intent
} catch (error) {
  // Rollback to ACCEPTED state
  await transitionStatus(requestId, RequestStatus.ACCEPTED, travelerId);
  throw new Error('Failed to create payment intent');
}
```

### Funds Lock Failed
```typescript
const fundsLocked = await lockFunds(...);
if (!fundsLocked) {
  throw new Error('Failed to lock funds in escrow');
}
```

### Funds Release Failed
```typescript
const fundsReleased = await releaseFunds(...);
if (!fundsReleased) {
  throw new Error('Failed to release funds to traveler');
}
```

### Platform Fee Deduction Failed
```typescript
const feeDeducted = await deductPlatformFee(...);
if (!feeDeducted) {
  console.warn('Failed to deduct platform fee');
  // Don't throw - fee deduction failure shouldn't block delivery
}
```

---

## Validation & Guards

### Existing Guards (Preserved)
- ✅ Traveler can only have one active request
- ✅ Deadline must be in the future
- ✅ Valid state transitions enforced
- ✅ Only authorized users can transition states

### New Guards
- ✅ Payment intent must be created before AWAITING_PAYMENT
- ✅ Funds must be locked before IN_PROGRESS
- ✅ Escrow must exist before release/refund

---

## Logging

All state transitions are logged with:
- Request ID
- User ID
- From status
- To status
- Reason
- Timestamp

Example log output:
```
[StateTransitionService] Accepting request req_123 by traveler traveler_456
[StateTransitionService] Transitioning request req_123 to ACCEPTED
[StateTransitionService] Transitioning request req_123 to AWAITING_PAYMENT
[StateTransitionService] Creating payment intent for request req_123
[PaymentIntegrationService] Creating payment intent: {requestId: "req_123", amount: 100}
[PaymentIntegrationService] Payment intent created: pi_xxx
[RequestService] Updated payment info for request req_123
[StateTransitionService] Payment intent created: pi_xxx
```

---

## Testing

### Unit Tests
```bash
cd backend/services/request-engine
npm test -- StateTransitionService.test.ts
```

### Integration Tests
1. Accept request → Verify PaymentIntent created
2. Payment webhook → Verify funds locked
3. Complete delivery → Verify funds released
4. Cancel before payment → Verify PaymentIntent cancelled
5. Cancel after payment → Verify refund created

---

## Deployment Checklist

### Development ✅
- [x] Add AWAITING_PAYMENT state
- [x] Update state transitions
- [x] Create PaymentIntegrationService
- [x] Update StateTransitionService
- [x] Add payment fields to database
- [x] Add comprehensive logging
- [x] Preserve existing validation

### Production 🔲
- [ ] Run database migration
- [ ] Configure environment variables
- [ ] Test payment flow end-to-end
- [ ] Set up webhook endpoint
- [ ] Enable monitoring and alerts
- [ ] Test cancellation scenarios
- [ ] Test refund scenarios

---

## Next Steps

1. **Notification Service Integration**
   - Send payment link to buyer after AWAITING_PAYMENT
   - Send funds notification to traveler after DELIVERED

2. **Admin Dashboard**
   - View payment status
   - View escrow status
   - Manual refund capability

3. **Analytics**
   - Track payment success rate
   - Track escrow hold duration
   - Track refund rate

4. **Dispute Handling**
   - Add DISPUTED state
   - Hold funds during dispute
   - Release based on dispute resolution

---

## Files Modified

1. ✅ `src/models/enums/RequestStatus.ts` - Added AWAITING_PAYMENT state
2. ✅ `src/services/StateTransitionService.ts` - Payment integration
3. ✅ `src/services/RequestService.ts` - Payment info methods
4. ✅ `src/services/PaymentIntegrationService.ts` - NEW
5. ✅ `migrations/002_add_payment_fields.sql` - NEW

---

## Summary

The Request state machine now fully integrates with:
- ✅ Stripe PaymentIntent for payment processing
- ✅ Internal wallet for escrow management
- ✅ Automatic fund locking after payment
- ✅ Automatic fund release on delivery
- ✅ Automatic refunds on cancellation
- ✅ Platform fee deduction
- ✅ Comprehensive logging
- ✅ Preserved validation and guards

**Status**: Implementation complete, ready for testing! 🚀
