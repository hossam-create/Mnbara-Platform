# Stripe PaymentIntent Integration

## Overview

Complete Stripe PaymentIntent integration with internal wallet service, escrow management, and webhook handling.

## Features Implemented

### 1. Create PaymentIntent Endpoint
**POST** `/api/payments/stripe/create-intent`

Creates a Stripe PaymentIntent with automatic platform fee calculation.

**Request Body:**
```json
{
  "requestId": "req_123",
  "buyerId": "buyer_123",
  "sellerId": "seller_123",
  "amount": 100.00,
  "currency": "usd",
  "description": "Payment for Request #123",
  "metadata": {
    "customField": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_xxx",
    "clientSecret": "pi_xxx_secret_yyy",
    "amount": 100.00,
    "currency": "usd",
    "platformFee": 7.00,
    "totalAmount": 107.00
  }
}
```

**Features:**
- ✅ Automatic platform fee calculation (7%)
- ✅ Stores payment intent metadata
- ✅ Returns client secret for frontend
- ✅ Rate limited (10 requests/minute)

---

### 2. Confirm Payment Endpoint
**POST** `/api/payments/stripe/confirm`

Verifies payment success and locks funds in escrow.

**Request Body:**
```json
{
  "paymentIntentId": "pi_xxx",
  "requestId": "req_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "requestId": "req_123",
    "paymentIntentId": "pi_xxx",
    "status": "succeeded",
    "escrowCreated": true,
    "fundsLocked": true
  }
}
```

**Features:**
- ✅ Verifies payment status from Stripe
- ✅ Calls internal-ledger-service to lock funds
- ✅ Updates Request status to PAID
- ✅ Creates escrow hold
- ✅ Rate limited (10 requests/minute)

---

### 3. Get Payment Status Endpoint
**GET** `/api/payments/stripe/status/:paymentIntentId`

Retrieves current payment status.

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentIntentId": "pi_xxx",
    "status": "succeeded",
    "amount": 107.00,
    "currency": "usd",
    "metadata": {
      "requestId": "req_123",
      "buyerId": "buyer_123",
      "sellerId": "seller_123"
    }
  }
}
```

---

### 4. Stripe Webhook Handler
**POST** `/api/webhooks/stripe`

Handles Stripe webhook events with signature verification.

**Supported Events:**
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Charge was refunded

**Security Features:**
- ✅ Stripe signature verification
- ✅ Webhook secret validation
- ✅ Rate limited (100 requests/minute)
- ✅ IP whitelist support

**Webhook Configuration:**
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## Integration with Internal Ledger Service

The payment service integrates with `internal-ledger-service` to lock funds in escrow:

```typescript
// Called after payment confirmation
POST http://localhost:3010/api/wallet/lock-funds
{
  "userId": "buyer_123",
  "amount": 100.00,
  "requestId": "req_123",
  "currency": "usd"
}
```

**Graceful Degradation:**
- If wallet service is unavailable, payment still succeeds
- `fundsLocked` flag indicates whether escrow was created
- Webhook can retry fund locking later

---

## Security Features

### 1. Rate Limiting
- **Payment endpoints**: 10 requests/minute per IP
- **Webhook endpoint**: 100 requests/minute
- **Strict operations**: 3 requests/minute per IP

### 2. Stripe Signature Verification
All webhook requests are verified using Stripe's signature:
```typescript
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  webhookSecret
);
```

### 3. Idempotency
Stripe automatically handles idempotency using `Idempotency-Key` header.

---

## Environment Variables

Required environment variables in `.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_API_VERSION=2023-10-16

# Internal Services
INTERNAL_LEDGER_SERVICE_URL=http://localhost:3010

# Optional: Stripe webhook IP whitelist
STRIPE_WEBHOOK_IPS=54.187.174.169,54.187.205.235
```

---

## Testing

### Unit Tests
```bash
cd services/financial/payment-service
npm test -- enhanced-stripe.service.test.ts
npm test -- stripe-payment.controller.test.ts
```

**Test Coverage:**
- ✅ Create payment intent (success & errors)
- ✅ Confirm payment (success & wallet service failure)
- ✅ Get payment status
- ✅ Refund payment
- ✅ Webhook signature verification
- ✅ Webhook event handling
- ✅ Rate limiting
- ✅ Error handling

### Integration Testing with Stripe CLI

1. Install Stripe CLI:
```bash
stripe login
```

2. Forward webhooks to local:
```bash
stripe listen --forward-to localhost:3004/api/webhooks/stripe
```

3. Trigger test events:
```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

### Test Cards (Stripe Test Mode)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

---

## Frontend Integration Example

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_xxx');

async function handlePayment(requestId, buyerId, sellerId, amount) {
  // 1. Create PaymentIntent
  const response = await fetch('/api/payments/stripe/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId,
      buyerId,
      sellerId,
      amount,
    }),
  });

  const { data } = await response.json();
  const { clientSecret, paymentIntentId } = data;

  // 2. Confirm payment with Stripe Elements
  const stripe = await stripePromise;
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'Customer Name',
      },
    },
  });

  if (result.error) {
    console.error(result.error.message);
    return;
  }

  // 3. Confirm payment on backend
  await fetch('/api/payments/stripe/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentIntentId,
      requestId,
    }),
  });

  console.log('Payment successful and funds locked in escrow!');
}
```

---

## Error Handling

### Common Errors

**1. Payment Intent Creation Failed**
```json
{
  "error": "Failed to create payment intent",
  "message": "Stripe API error: Invalid API key"
}
```

**2. Payment Not Confirmed**
```json
{
  "error": "Failed to confirm payment",
  "message": "Payment not confirmed. Status: requires_payment_method"
}
```

**3. Wallet Service Unavailable**
```json
{
  "success": true,
  "data": {
    "success": true,
    "fundsLocked": false,  // ⚠️ Funds not locked
    "escrowCreated": false
  }
}
```

**4. Rate Limit Exceeded**
```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit for payment operations",
  "retryAfter": "60 seconds"
}
```

---

## Deployment Checklist

### Development
- [x] Stripe Test Mode enabled
- [x] Test webhook secret configured
- [x] Internal ledger service running on localhost:3010
- [x] Rate limiting configured

### Production
- [ ] Switch to Stripe Live Mode
- [ ] Update `STRIPE_SECRET_KEY` with live key
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production webhook
- [ ] Configure production `INTERNAL_LEDGER_SERVICE_URL`
- [ ] Set up webhook endpoint with HTTPS
- [ ] Configure Stripe webhook IP whitelist
- [ ] Enable monitoring and alerts
- [ ] Test end-to-end payment flow

---

## Monitoring & Logging

All operations are logged with context:

```
[EnhancedStripeService] Creating payment intent: { requestId, amount, ... }
[EnhancedStripeService] Payment succeeded: pi_xxx
[EnhancedStripeService] Locking funds in wallet: { userId, amount, ... }
[StripePaymentController] Webhook received: payment_intent.succeeded
```

**Recommended Monitoring:**
- Payment intent creation rate
- Payment confirmation success rate
- Wallet service availability
- Webhook processing latency
- Rate limit hits

---

## Architecture Diagram

```
┌─────────────┐
│   Frontend  │
│  (Stripe.js)│
└──────┬──────┘
       │
       │ 1. Create PaymentIntent
       ▼
┌─────────────────────┐
│  Payment Service    │
│  (Stripe API)       │
└──────┬──────────────┘
       │
       │ 2. Payment Confirmed
       ▼
┌─────────────────────┐
│  Internal Ledger    │
│  Service            │
│  (Lock Funds)       │
└─────────────────────┘
       │
       │ 3. Escrow Created
       ▼
┌─────────────────────┐
│  Request Service    │
│  (Status: PAID)     │
└─────────────────────┘
```

---

## Next Steps

1. **Database Schema**: Add `payments` table to store payment intents
2. **Request Service Integration**: Update Request status to PAID
3. **Notification Service**: Send payment confirmation emails
4. **Analytics**: Track payment success rates and fees
5. **Refund Flow**: Implement automated refund processing
6. **Multi-Currency**: Support multiple currencies
7. **Payment Methods**: Add PayPal, Apple Pay, Google Pay

---

## Support

For issues or questions:
- Stripe Documentation: https://stripe.com/docs/payments/payment-intents
- Internal Ledger Service: `backend/services/internal-ledger-service/README.md`
- Fee Calculator: `services/financial/payment-service/src/services/fee-calculator.service.ts`
