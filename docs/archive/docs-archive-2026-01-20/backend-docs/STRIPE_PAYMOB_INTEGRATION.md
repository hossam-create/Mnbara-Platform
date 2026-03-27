# Stripe & Paymob SDK Integration

This document describes the complete integration of Stripe and Paymob payment SDKs in the MNBARA payment service.

## Overview

The payment service supports three payment providers:
- **Stripe** - Global card payments with escrow support
- **PayPal** - Global PayPal payments
- **Paymob** - MENA region payments (cards + mobile wallets)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Payment Service                              │
├─────────────────────────────────────────────────────────────────┤
│  Controllers                                                     │
│  └── PaymentController (handles all provider endpoints)          │
├─────────────────────────────────────────────────────────────────┤
│  Services                                                        │
│  ├── StripeService        - Stripe SDK wrapper                   │
│  ├── PayPalService        - PayPal SDK wrapper                   │
│  ├── PaymobService        - Paymob API wrapper                   │
│  ├── PaymentRecordService - Database payment tracking            │
│  ├── WebhookEventService  - Webhook processing & logging         │
│  ├── EventPublisher       - RabbitMQ event publishing            │
│  ├── EscrowService        - Escrow management                    │
│  └── WalletLedgerService  - Wallet balance tracking              │
├─────────────────────────────────────────────────────────────────┤
│  Database Models                                                 │
│  ├── Payment       - External payment records                    │
│  ├── WebhookEvent  - Webhook audit log                           │
│  ├── Escrow        - Escrow records                              │
│  └── WalletLedger  - Wallet transaction history                  │
└─────────────────────────────────────────────────────────────────┘
```

## Stripe Integration

### Setup

1. Get your API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Configure environment variables:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Payment Flow

1. **Create Payment Intent** (with escrow hold)
   ```
   POST /api/payments/stripe/create-intent
   {
     "amount": 100.00,
     "currency": "USD",
     "userId": 123,
     "orderId": 456,
     "metadata": { "description": "Order payment" }
   }
   ```
   Response:
   ```json
   {
     "success": true,
     "clientSecret": "pi_xxx_secret_xxx",
     "paymentIntentId": "pi_xxx"
   }
   ```

2. **Frontend confirms payment** using Stripe.js with the clientSecret

3. **Webhook receives confirmation**
   - `payment_intent.succeeded` → Updates payment record, publishes event
   - `payment_intent.payment_failed` → Marks payment failed, notifies user

4. **Capture Payment** (release escrow)
   ```
   POST /api/payments/stripe/capture
   { "paymentIntentId": "pi_xxx" }
   ```

5. **Refund Payment**
   ```
   POST /api/payments/stripe/refund
   { "paymentIntentId": "pi_xxx", "amount": 50.00 }
   ```

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Mark payment succeeded, publish event |
| `payment_intent.payment_failed` | Mark payment failed, notify user |
| `payment_intent.canceled` | Mark payment canceled |
| `charge.refunded` | Mark payment refunded |
| `charge.dispute.created` | Mark payment disputed, notify admin |

## Paymob Integration

### Setup

1. Get credentials from [Paymob Dashboard](https://accept.paymob.com/portal2/en/settings)
2. Configure environment variables:
   ```env
   PAYMOB_API_KEY=your_api_key
   PAYMOB_INTEGRATION_ID=card_integration_id
   PAYMOB_WALLET_INTEGRATION_ID=wallet_integration_id
   PAYMOB_IFRAME_ID=iframe_id
   PAYMOB_HMAC_SECRET=hmac_secret
   ```

### Card Payment Flow

1. **Initiate Payment**
   ```
   POST /api/payments/paymob/initiate
   {
     "amount": 100.00,
     "currency": "EGP",
     "userId": 123,
     "orderId": 456,
     "billingData": {
       "firstName": "John",
       "lastName": "Doe",
       "email": "john@example.com",
       "phone": "+201234567890"
     }
   }
   ```
   Response:
   ```json
   {
     "success": true,
     "orderId": 12345,
     "paymentKey": "ZXlKaGJHY...",
     "iframeUrl": "https://accept.paymob.com/api/acceptance/iframes/xxx?payment_token=..."
   }
   ```

2. **Frontend displays iframe** with the iframeUrl

3. **Webhook receives callback**
   - Transaction success → Updates payment record, publishes event
   - Transaction failed → Marks payment failed

4. **User redirected** to callback URL with result

### Mobile Wallet Payment Flow

1. **Create Wallet Payment**
   ```
   POST /api/payments/paymob/wallet
   {
     "amount": 100.00,
     "currency": "EGP",
     "mobileNumber": "+201234567890",
     "userId": 123,
     "billingData": { ... }
   }
   ```
   Response:
   ```json
   {
     "success": true,
     "orderId": 12345,
     "redirectUrl": "https://..."
   }
   ```

2. **User redirected** to wallet app for approval

3. **Webhook receives callback** with transaction result

### Supported Wallets

- Vodafone Cash
- Orange Money
- Etisalat Cash
- WE Pay
- Fawry

## Webhook Configuration

### Stripe Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Add endpoint: `https://your-domain.com/api/payments/webhook/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `charge.dispute.created`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Paymob Webhooks

1. Go to Paymob Dashboard → Settings → Callbacks
2. Set Transaction Callback URL: `https://your-domain.com/api/payments/webhook/paymob`
3. Set Response Callback URL: `https://your-domain.com/api/payments/paymob/callback`
4. Copy HMAC secret to `PAYMOB_HMAC_SECRET`

## Database Schema

### Payment Table

Tracks all external payment provider transactions:

```sql
CREATE TABLE "Payment" (
    "id" SERIAL PRIMARY KEY,
    "provider" "PaymentProvider" NOT NULL,  -- STRIPE, PAYPAL, PAYMOB
    "externalId" VARCHAR(255) NOT NULL,     -- Provider's payment ID
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL,      -- PENDING, SUCCEEDED, FAILED, etc.
    "method" "PaymentMethodType",           -- CARD, PAYPAL, MOBILE_WALLET
    "capturedAt" TIMESTAMP,
    "refundedAmount" DECIMAL(10, 2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### WebhookEvent Table

Audit log of all webhook events:

```sql
CREATE TABLE "WebhookEvent" (
    "id" SERIAL PRIMARY KEY,
    "provider" "PaymentProvider" NOT NULL,
    "eventId" VARCHAR(255) NOT NULL,        -- Provider's event ID
    "eventType" VARCHAR(100) NOT NULL,      -- e.g., 'payment_intent.succeeded'
    "paymentId" INTEGER REFERENCES "Payment"("id"),
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN DEFAULT FALSE,
    "processedAt" TIMESTAMP,
    "processingError" TEXT,
    "receivedAt" TIMESTAMP DEFAULT NOW()
);
```

## Event Publishing

Payment events are published to RabbitMQ for other services:

### Exchange: `mnbara.payments`

### Routing Keys:
- `payment.succeeded` - Payment completed successfully
- `payment.failed` - Payment failed
- `payment.refunded` - Payment refunded
- `payment.dispute.created` - Dispute opened
- `escrow.released` - Escrow funds released
- `escrow.refunded` - Escrow funds refunded

### Event Payload Example:
```json
{
  "provider": "stripe",
  "paymentId": "pi_xxx",
  "amount": 100.00,
  "currency": "USD",
  "orderId": "456",
  "userId": "123",
  "timestamp": "2024-12-13T10:30:00Z",
  "source": "payment-service"
}
```

## Error Handling

All webhook handlers implement:
- **Idempotency** - Duplicate events are detected and skipped
- **Signature verification** - Invalid signatures are rejected
- **Error logging** - Failed processing is logged with retry count
- **Graceful degradation** - RabbitMQ failures don't block webhook processing

## Testing

### Stripe Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0025 0000 3155 | 3D Secure |

### Paymob Test Mode

Use test credentials from Paymob dashboard. Test transactions won't charge real money.

## API Reference

### Stripe Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/stripe/create-intent` | Create payment intent |
| POST | `/api/payments/stripe/capture` | Capture payment |
| POST | `/api/payments/stripe/refund` | Refund payment |
| POST | `/api/payments/webhook/stripe` | Stripe webhook |

### Paymob Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/paymob/initiate` | Initiate card payment |
| POST | `/api/payments/paymob/wallet` | Create wallet payment |
| GET | `/api/payments/paymob/transaction/:id` | Get transaction |
| POST | `/api/payments/paymob/refund` | Refund transaction |
| POST | `/api/payments/webhook/paymob` | Paymob webhook |
| GET | `/api/payments/paymob/callback` | Redirect callback |

## Security Considerations

1. **Never log full card numbers** - Only last 4 digits
2. **Verify webhook signatures** - Reject unsigned requests
3. **Use HTTPS** - All webhook endpoints must use HTTPS
4. **Rotate secrets** - Regularly rotate API keys and webhook secrets
5. **PCI compliance** - Card data never touches your servers (use Stripe.js/iframe)
