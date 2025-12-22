# PAY-002: Controlled Escrow Refunds

## Summary
Enhanced escrow refund functionality to ensure controlled, auditable refunds for both buy-now and auction orders, with strict validation, duplicate prevention, and comprehensive error handling.

## What Was Done

### 1. Controller Updates (`src/controllers/escrow.controller.ts`)
- **Enhanced `refundPayment()` method**:
  - **PAY-002**: Only allows refunds when escrow status is `HELD` (removed `DISPUTED` exception)
  - **PAY-002**: Prevents duplicate refund attempts (checks if already `REFUNDED`)
  - **PAY-002**: Explicitly prevents partial refunds (validates full amount only)
  - **PAY-002**: Improves refund failure logging with detailed error messages
  - **PAY-002**: Requires refund reason (validated)
  - Updates escrow status to `REFUNDED` (not `REFUNDED_TO_BUYER`)
  - Handles both captured payments (refund) and uncaptured payments (cancel)
  - Logs refund failures with `REFUND_FAILED` action

### 2. Service Updates (`src/services/escrow.service.ts`)
- **Updated `refundFunds()` method**:
  - **PAY-002**: Only allows refunds from `HELD` status (removed `DISPUTED` exception)
  - **PAY-002**: Prevents duplicate refunds (checks if already `REFUNDED`)
  - Always refunds full escrow amount (no partial support)

### 3. Tests
- **Service tests** (`escrow-refund-pay-002.test.ts`):
  - ✅ Refunds only allowed from HELD status
  - ✅ Refunds rejected from RELEASED/REFUNDED status
  - ✅ Status updated to REFUNDED
  - ✅ Audit logging with reason and timestamp
  - ✅ Full amount refunds only (no partial)
  - ✅ Support for BUY_NOW and AUCTION orders

- **Controller tests** (`escrow-refund-controller.test.ts`):
  - ✅ HELD status validation
  - ✅ Duplicate refund prevention
  - ✅ Partial refund rejection
  - ✅ Refund failure logging
  - ✅ Audit trail with reason and timestamp

## Acceptance Criteria Met

✅ **1. Escrow refunds must be supported for BUY_NOW and AUCTION orders**
- Both order types use the same refund flow
- `orderType` field is logged in audit trail
- No order-type-specific logic (both treated equally)

✅ **2. Refunds can only be initiated if escrow status is HELD**
- Controller validates `escrow.status === 'HELD'`
- Service validates `escrow.status === EscrowStatus.HELD`
- Returns clear error if status is not HELD

✅ **3. Refund action must update escrow status to REFUNDED**
- Escrow status updated to `REFUNDED` (not `REFUNDED_TO_BUYER`)
- `releasedAt` timestamp set
- Metadata updated with refund details

✅ **4. Refunds must be auditable with reason and timestamp**
- `EscrowActionLog` entry created with:
  - Action: `REFUNDED`
  - Reason: Required refund reason
  - Timestamp: `releasedAt` field
  - Metadata: Includes orderType, refundAmount, refundProviderId
- Wallet ledger entry created for refund transaction

✅ **5. Partial refunds are NOT supported (full amount only)**
- Controller validates requested amount matches escrow amount
- Returns error if amount differs (with tolerance for floating point)
- Service always refunds full escrow amount

✅ **6. Duplicate refund attempts must be prevented**
- Checks if escrow status is already `REFUNDED`
- Returns error: "Escrow has already been refunded"
- Includes `refundedAt` timestamp in error response

✅ **7. Refund failures must be logged and surfaced clearly**
- Refund failures logged with `REFUND_FAILED` action
- Error details include:
  - Error message
  - Error type
  - Escrow ID
  - Order ID
  - Attempted timestamp
- Returns 500 status with detailed error response

## API Endpoints

### Refund Escrow
```
POST /api/escrow/:id/refund
Body: {
  "reason": "Order cancelled by buyer" (required),
  "amount": 100.00 (optional, validated if provided)
}

Response (Success):
{
  "message": "Payment refunded to buyer successfully",
  "escrow": {
    "id": 1,
    "status": "REFUNDED",
    "releasedAt": "2025-01-15T10:00:00Z",
    ...
  },
  "reason": "Order cancelled by buyer",
  "refundDetails": {
    "amount": 100.00,
    "currency": "USD",
    "refundedAt": "2025-01-15T10:00:00Z",
    "providerRefundId": "re_xxx"
  }
}

Response (Error - Invalid Status):
{
  "error": "Refund can only be initiated when escrow status is HELD",
  "currentStatus": "RELEASED",
  "allowedStatus": "HELD"
}

Response (Error - Duplicate):
{
  "error": "Escrow has already been refunded",
  "refundedAt": "2025-01-15T09:00:00Z"
}

Response (Error - Partial Refund):
{
  "error": "Partial refunds are not supported. Only full amount refunds are allowed.",
  "requestedAmount": 50.00,
  "escrowAmount": 100.00
}

Response (Error - Refund Failure):
{
  "error": "Refund processing failed",
  "details": "Stripe refund failed: ...",
  "escrowId": 1,
  "orderId": 123
}
```

## Refund Flow

### Successful Refund Flow
1. **Request**: `POST /api/escrow/:id/refund` with reason
2. **Validation**: 
   - Escrow exists
   - Status is `HELD`
   - Not already refunded
   - Reason provided
   - Amount matches (if provided)
3. **Payment Provider**:
   - If payment captured: Create Stripe refund
   - If payment not captured: Cancel PaymentIntent
4. **Database Update**:
   - Update escrow status to `REFUNDED`
   - Set `releasedAt` timestamp
   - Update order status to `CANCELLED`
5. **Audit Logging**:
   - Create `EscrowActionLog` entry
   - Create `WalletLedger` entry (if wallet integration)
6. **Response**: Return refund details

### Failed Refund Flow
1. **Request**: `POST /api/escrow/:id/refund`
2. **Validation**: Passes
3. **Payment Provider**: Fails (e.g., Stripe API error)
4. **Error Handling**:
   - Log `REFUND_FAILED` action
   - Store error details in metadata
   - Return detailed error response
5. **Escrow Status**: Remains `HELD` (not changed)

## Status Transitions

```
HELD → REFUNDED (on successful refund)
  ↓
  (refundedAt timestamp set)
  (order status → CANCELLED)
  (audit log created)
```

**Invalid Transitions** (rejected):
- `RELEASED` → `REFUNDED` ❌
- `REFUNDED` → `REFUNDED` ❌ (duplicate)
- `CANCELLED` → `REFUNDED` ❌
- `EXPIRED` → `REFUNDED` ❌

## Audit Trail

### EscrowActionLog Entry
```json
{
  "escrowId": 1,
  "action": "REFUNDED",
  "performedBy": 1,
  "performedByRole": "system_or_admin",
  "reason": "Order cancelled by buyer",
  "metadata": {
    "orderType": "BUY_NOW",
    "refundAmount": 100.00,
    "refundProviderId": "re_xxx",
    "refundTimestamp": "2025-01-15T10:00:00Z"
  }
}
```

### Refund Failure Log Entry
```json
{
  "escrowId": 1,
  "action": "REFUND_FAILED",
  "performedBy": 1,
  "performedByRole": "system",
  "reason": "Refund failed: Stripe refund failed: ...",
  "metadata": {
    "error": "Stripe refund failed: ...",
    "errorType": "StripeAPIError",
    "attemptedAt": "2025-01-15T10:00:00Z",
    "orderType": "BUY_NOW"
  }
}
```

## Constraints Followed

✅ **Use existing payment provider refund mechanisms**
- Uses Stripe `refunds.create()` for captured payments
- Uses Stripe `paymentIntents.cancel()` for uncaptured payments
- No new payment provider integrations

✅ **Do not change escrow creation logic**
- Only modified refund logic
- Escrow creation remains unchanged

✅ **Do not introduce UI**
- Backend-only implementation
- API endpoints for frontend integration

✅ **Follow existing payment-service architecture**
- Uses existing `EscrowController` pattern
- Uses existing `EscrowService` pattern
- Uses existing audit logging (`EscrowActionLog`)
- Follows existing error handling patterns

## Testing

### Running Tests
```bash
cd backend/services/payment-service
npm test escrow-refund-pay-002.test.ts
npm test escrow-refund-controller.test.ts
```

### Test Coverage
- ✅ Refunds only from HELD status
- ✅ Rejects refunds from other statuses
- ✅ Prevents duplicate refunds
- ✅ Prevents partial refunds
- ✅ Supports BUY_NOW orders
- ✅ Supports AUCTION orders
- ✅ Audit logging with reason and timestamp
- ✅ Refund failure logging
- ✅ Clear error messages

## Next Steps

1. **Test refund flow**:
   - Create escrow with HELD status
   - Attempt refund with valid reason
   - Verify status updated to REFUNDED
   - Verify audit log created

2. **Test error cases**:
   - Attempt refund from RELEASED status (should fail)
   - Attempt duplicate refund (should fail)
   - Attempt partial refund (should fail)
   - Simulate Stripe API failure (should log and return error)

3. **Monitor refund failures**:
   - Check `EscrowActionLog` for `REFUND_FAILED` entries
   - Investigate and retry failed refunds if needed

## Notes

- **Full Amount Only**: The system does not support partial refunds. All refunds must be for the full escrow amount.
- **Status Validation**: Refunds can only be initiated from `HELD` status. This ensures funds are still in escrow and haven't been released or refunded already.
- **Idempotency**: Duplicate refund attempts are prevented by checking if status is already `REFUNDED`.
- **Error Recovery**: Failed refunds are logged but don't change escrow status, allowing for retry or manual intervention.
- **Audit Trail**: All refund actions (successful and failed) are logged with full context for compliance and debugging.





