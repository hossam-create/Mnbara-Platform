# PAY-001: Escrow-based Payments

## Summary
Enhanced escrow system to ensure buyer funds are held securely until delivery completion, with support for both buy-now and auction orders, webhook integration, and strict validation that failed payments do not create escrow records.

## What Was Done

### 1. Database Changes
- **Added `OrderType` enum** to distinguish between `BUY_NOW` and `AUCTION` orders
- **Added `orderType` field** to `Escrow` model (default: `BUY_NOW`)
- **Migration**: `prisma/migrations/20250115_add_escrow_order_type/migration.sql`
- **Indexed** `orderType` for efficient queries

### 2. Escrow Controller Updates (`src/controllers/escrow.controller.ts`)
- **Modified `createEscrow()`**:
  - Now requires payment confirmation before creating escrow
  - Accepts `paymentIntentId` parameter to verify payment succeeded
  - If no `paymentIntentId` provided, returns `clientSecret` for frontend payment
  - Escrow is created via webhook when payment succeeds
  - **PAY-001**: Failed payments (`status !== 'succeeded'`) do not create escrow records
  - Supports `orderType` parameter (`BUY_NOW` or `AUCTION`)

- **Updated `holdPayment()`**:
  - Validates payment status before holding
  - Cancels escrow if payment failed
  - Handles both webhook-created and manually-created escrows

### 3. Webhook Integration (`src/services/webhook-event.service.ts`)
- **Enhanced `processStripeEvent()`**:
  - On `payment_intent.succeeded`: Automatically creates escrow record
  - Checks if escrow already exists (idempotent)
  - Determines order type from metadata or defaults to `BUY_NOW`
  - Creates escrow with status `HELD` (payment already succeeded)
  - Logs escrow creation action
  - Graceful error handling (doesn't fail webhook processing)

- **Webhook placeholders exist** for:
  - Stripe: `/api/payments/webhook/stripe`
  - PayPal: `/api/payments/webhook/paypal`
  - Paymob: `/api/payments/webhook/paymob`

### 4. Escrow Service
- Existing `EscrowService` methods support both `BUY_NOW` and `AUCTION` order types
- All escrow operations (hold, release, refund) work with both order types

### 5. Tests (`src/services/__tests__/escrow-pay-001.test.ts`)
- ✅ Failed payments do not create escrow
- ✅ Escrow created only after payment succeeds
- ✅ Auction order support
- ✅ Buy-now order support (default)
- ✅ Escrow state tracking (HELD, RELEASED, REFUNDED)
- ✅ Audit logging for all escrow actions

## Acceptance Criteria Met

✅ **1. Buyer payment must be captured and held in escrow**
- Payment is captured via Stripe PaymentIntent
- Funds are held in escrow with status `HELD`
- Escrow created automatically via webhook on payment success

✅ **2. Funds must not be released to the seller until delivery is confirmed**
- Escrow status remains `HELD` until buyer confirms delivery
- `releasePayment()` endpoint requires delivery confirmation
- Funds released only when status changes to `RELEASED`

✅ **3. Escrow must support buy-now and auction orders**
- `OrderType` enum: `BUY_NOW`, `AUCTION`
- Escrow model includes `orderType` field
- Both order types use same escrow flow

✅ **4. Escrow state must be trackable (HELD, RELEASED, REFUNDED)**
- `EscrowStatus` enum includes all required states
- Status transitions are logged in `EscrowActionLog`
- Status queryable via `GET /api/escrow/:id/status`

✅ **5. Escrow records must be auditable**
- `EscrowActionLog` model tracks all actions
- Logs include: action, performedBy, performedByRole, reason, metadata
- All escrow operations (create, hold, release, refund) are logged

✅ **6. Failed payments must not create escrow records**
- `createEscrow()` validates payment status before creating escrow
- Webhook handler only creates escrow on `payment_intent.succeeded`
- If payment fails, escrow is not created (or cancelled if already created)

✅ **7. Webhook placeholders must exist for payment provider events**
- Stripe webhook: `/api/payments/webhook/stripe`
- PayPal webhook: `/api/payments/webhook/paypal`
- Paymob webhook: `/api/payments/webhook/paymob`
- Webhook handlers integrated with escrow creation

## Flow

### Buy-Now Order Flow
1. **Checkout**: Frontend calls `POST /api/escrow/create` with `orderId`
2. **Payment Intent**: Backend creates Stripe PaymentIntent, returns `clientSecret`
3. **Payment**: Frontend confirms payment with Stripe
4. **Webhook**: Stripe sends `payment_intent.succeeded` webhook
5. **Escrow Creation**: Webhook handler creates escrow with status `HELD`
6. **Delivery**: Buyer confirms delivery
7. **Release**: `POST /api/escrow/:id/release` releases funds to seller

### Auction Order Flow
1. **Auction Win**: Auction closes, winner determined
2. **Checkout**: Frontend calls `POST /api/escrow/create` with `orderId` and `orderType: 'AUCTION'`
3. **Payment Intent**: Backend creates PaymentIntent
4. **Payment**: Frontend confirms payment
5. **Webhook**: Stripe sends `payment_intent.succeeded` webhook
6. **Escrow Creation**: Webhook handler creates escrow with `orderType: 'AUCTION'` and status `HELD`
7. **Delivery**: Buyer confirms delivery
8. **Release**: Funds released to seller

### Failed Payment Flow
1. **Checkout**: Frontend calls `POST /api/escrow/create`
2. **Payment Intent**: Backend creates PaymentIntent
3. **Payment Fails**: Frontend payment fails or user cancels
4. **Webhook**: Stripe sends `payment_intent.payment_failed` webhook
5. **No Escrow**: Escrow is NOT created (webhook handler ignores failed payments)
6. **Order Status**: Order remains in `PENDING` status

## API Endpoints

### Create Escrow (Payment Intent)
```
POST /api/escrow/create
Body: {
  "orderId": 123,
  "orderType": "BUY_NOW" | "AUCTION" (optional, default: "BUY_NOW")
}

Response (before payment):
{
  "message": "Payment intent created. Escrow will be created after payment succeeds.",
  "paymentIntentId": "pi_xxx",
  "clientSecret": "pi_xxx_secret_xxx",
  "status": "requires_payment_method"
}
```

### Create Escrow (After Payment Succeeds)
```
POST /api/escrow/create
Body: {
  "orderId": 123,
  "paymentIntentId": "pi_xxx",
  "orderType": "AUCTION" (optional)
}

Response:
{
  "message": "Escrow created successfully",
  "escrow": {
    "id": 1,
    "orderId": 123,
    "status": "HELD",
    "orderType": "BUY_NOW",
    ...
  }
}
```

### Hold Payment
```
POST /api/escrow/:id/hold
(Only needed for manual confirmation, webhook handles automatic creation)
```

### Release Payment
```
POST /api/escrow/:id/release
(Releases funds to seller/traveler)
```

### Refund Payment
```
POST /api/escrow/:id/refund
(Refunds funds to buyer)
```

## Database Schema

```prisma
enum OrderType {
  BUY_NOW
  AUCTION
}

model Escrow {
  // ... existing fields ...
  orderType       OrderType       @default(BUY_NOW)
  status          EscrowStatus    @default(HELD)
  // ... rest of fields ...
}

enum EscrowStatus {
  HELD
  RELEASED
  REFUNDED
  DISPUTED
  EXPIRED
  CANCELLED
}
```

## Webhook Integration

### Stripe Webhook Events
- `payment_intent.succeeded` → Creates escrow automatically
- `payment_intent.payment_failed` → No escrow created (or cancelled if exists)

### Webhook Handler Logic
```typescript
case 'payment_intent.succeeded':
  // Verify payment succeeded
  // Check if escrow already exists
  // Create escrow with orderType from metadata
  // Log escrow creation
  break;
```

## Constraints Followed

✅ **Use existing payment provider integration pattern (Stripe-like)**
- Uses Stripe PaymentIntent API
- Follows existing payment service patterns
- Integrates with existing webhook infrastructure

✅ **Do not store raw card data**
- No card data stored in escrow records
- Uses Stripe PaymentIntent (tokenized)
- Only stores `stripePaymentId` reference

✅ **Do not implement UI**
- Backend-only implementation
- API endpoints for frontend integration
- Webhook handlers for automatic processing

✅ **Follow existing transaction and order architecture**
- Uses existing `Escrow` model
- Integrates with existing `Order` model
- Follows existing audit logging pattern

## Testing

### Running Tests
```bash
cd backend/services/payment-service
npm test escrow-pay-001.test.ts
```

### Test Coverage
- ✅ Failed payments do not create escrow
- ✅ Escrow created only after payment succeeds
- ✅ Auction order support
- ✅ Buy-now order support
- ✅ Escrow state tracking
- ✅ Audit logging

## Next Steps

1. **Run migration**:
   ```bash
   cd backend/services/payment-service
   npx prisma migrate dev
   ```

2. **Configure webhooks**:
   - Set up Stripe webhook endpoint: `https://your-domain.com/api/payments/webhook/stripe`
   - Subscribe to `payment_intent.succeeded` and `payment_intent.payment_failed` events
   - Set `STRIPE_WEBHOOK_SECRET` environment variable

3. **Update frontend**:
   - Call `POST /api/escrow/create` to get `clientSecret`
   - Use `clientSecret` with Stripe.js to confirm payment
   - Escrow will be created automatically via webhook

4. **Test flow**:
   - Create order (buy-now or auction)
   - Initiate payment
   - Verify escrow created on payment success
   - Verify no escrow created on payment failure

## Notes

- **Idempotency**: Webhook handler checks if escrow already exists before creating
- **Error Handling**: Webhook escrow creation failures don't block webhook processing
- **Backward Compatibility**: Existing escrow flows still work (manual confirmation)
- **Order Type**: Defaults to `BUY_NOW` if not specified
- **Payment Verification**: All escrow creation requires payment status verification





