# Stripe Connect Service

Multi-vendor marketplace payment integration with Stripe Connect.

## Features

- **Connected Account Creation**: Create Standard or Express accounts
- **Onboarding Flow**: Seamless seller onboarding with Stripe
- **Account Management**: Status tracking, balance, payouts
- **Transfers**: Automated transfers to connected accounts
- **Dashboard Access**: Login links to Stripe dashboard

## Architecture

```
Mnbara Platform → Stripe Connect Service → Stripe API
                                        ↓
                              Connected Accounts (Sellers/Travelers)
```

## Setup

### 1. Install Dependencies

```bash
cd backend/services/stripe-connect-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Add your Stripe keys
```

### 3. Database Setup

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Start Service

```bash
npm run dev
```

## API Endpoints

### Onboarding

**POST /connect/onboard**
Create connected account and start onboarding.

```bash
curl -X POST http://localhost:3012/connect/onboard \
  -H "Content-Type: application/json" \
  -d '{"email": "seller@example.com", "accountType": "standard"}'
```

**GET /connect/onboard/refresh**
Refresh onboarding link if expired.

### Status & Info

**GET /connect/status**
Get connected account status.

```bash
curl http://localhost:3012/connect/status
```

**GET /connect/balance**
Get account balance.

```bash
curl http://localhost:3012/connect/balance
```

**GET /connect/payouts**
List payouts.

```bash
curl http://localhost:3012/connect/payouts?limit=10
```

**GET /connect/dashboard**
Get Stripe dashboard login link.

```bash
curl http://localhost:3012/connect/dashboard
```

### Transfers (Internal/Admin)

**POST /connect/transfer**
Create transfer to connected account.

```bash
curl -X POST http://localhost:3012/connect/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "amount": 50.00,
    "currency": "usd",
    "description": "Order #456 payout",
    "sourceTransaction": "ch_..."
  }'
```

## Onboarding Flow

1. **Create Account**: POST /connect/onboard
2. **User Redirected**: To Stripe onboarding
3. **User Completes**: Fills out Stripe form
4. **Redirect Back**: To return_url
5. **Check Status**: GET /connect/status

## Account Types

### Standard (Recommended)
- Full Stripe dashboard access
- Seller manages their own account
- Best for transparency

### Express
- Limited dashboard access
- Platform manages more
- Faster onboarding

## Transfers

Transfers happen automatically after order completion:

```typescript
// After order is completed
await stripeConnectService.createTransfer(
  sellerId,
  orderAmount - platformFee,
  'usd',
  `Order #${orderId} payout`,
  chargeId
);
```

## Webhooks

Handle Stripe webhooks for:
- `account.updated` - Account status changes
- `payout.paid` - Payout completed
- `payout.failed` - Payout failed
- `transfer.created` - Transfer created

## Database Schema

### ConnectedAccount
- userId (unique)
- stripeAccountId
- onboardingStatus
- chargesEnabled
- payoutsEnabled

### Transfer
- connectedAccountId
- stripeTransferId
- amount
- status

### Payout
- connectedAccountId
- stripePayoutId
- amount
- status

## Testing

```bash
# Use Stripe test keys
STRIPE_SECRET_KEY=sk_test_...

# Test onboarding
curl -X POST http://localhost:3012/connect/onboard \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Port

Default: 3012

## Dependencies

- stripe: Stripe Node.js SDK
- @prisma/client: Database ORM
- express: Web framework
- winston: Logging

## Integration with Mnbara

### Seller Onboarding
When seller signs up → Create connected account → Redirect to onboarding

### Order Completion
When order completed → Create transfer to seller's connected account

### Seller Dashboard
Seller can access Stripe dashboard via login link

## Security

- Use Stripe test keys in development
- Never expose secret keys
- Validate webhook signatures
- Implement proper authentication

## Stripe Connect vs Payment Service

- **Payment Service**: Handles customer payments (charges)
- **Connect Service**: Handles seller payouts (transfers)

Both work together for complete payment flow.

## Reference: Official Stripe Sample

For Standard account onboarding flow (create account → account link → refresh/return URLs), see the official sample in the repo: **`docs/external-projects/stripe-connect-sample/`** (Node server in `server/node/`). This service implements the same pattern with auth and persistence. See [EXTERNAL_PROJECTS_INTEGRATION.md](../../../docs/EXTERNAL_PROJECTS_INTEGRATION.md).
