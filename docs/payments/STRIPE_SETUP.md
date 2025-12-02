# Stripe Integration Guide - Mnbara Platform

## 📘 Overview
This guide will help you integrate Stripe payment processing into the Mnbara platform for handling escrow, payouts, and wallet top-ups.

---

## 🔑 Step 1: Get Stripe API Keys

### 1.1 Create Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Click **Sign up**
3. Complete registration (email, password, business details)
4. Verify your email

### 1.2 Access Test Mode Dashboard
1. Login to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Toggle **Test Mode** switch (top right) - should be **ON** (orange)
3. Navigate to **Developers** → **API Keys**

### 1.3 Copy Your Keys
You'll see two keys:

**Publishable Key** (starts with `pk_test_...`)
- Used on frontend (safe to expose)
- Example: `pk_test_51A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6`

**Secret Key** (starts with `sk_test_...`)
- Used on backend (NEVER expose publicly)
- Click **Reveal test key** to see it
- Example: `sk_test_51A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6`

---

## 🪝 Step 2: Setup Webhooks

Webhooks allow Stripe to notify your server about payment events.

### 2.1 Add Webhook Endpoint
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL:
   - **Local Testing:** `https://your-ngrok-url.ngrok.io/api/payments/webhook/stripe`
   - **Production:** `https://api.mnbara.com/api/payments/webhook/stripe`

### 2.2 Select Events to Listen
Select these events:
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `charge.succeeded`
- ✅ `charge.refunded`
- ✅ `transfer.created`
- ✅ `payout.paid`
- ✅ `payout.failed`

### 2.3 Copy Webhook Secret
After creating the endpoint:
1. Click on the webhook
2. Click **Reveal** under **Signing secret**
3. Copy the secret (starts with `whsec_...`)

---

## 🛠️ Step 3: Configure Mnbara Platform

### 3.1 Update .env File
Copy `backend/services/payment-service/.env.example` to `.env`:

```bash
cd backend/services/payment-service
cp .env.example .env
```

### 3.2 Edit .env and Add Your Keys
```env
# Replace with YOUR actual keys from Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET_HERE
```

**⚠️ IMPORTANT:** Never commit `.env` to Git! It's already in `.gitignore`.

---

## 🧪 Step 4: Test Payment Flow

### 4.1 Use Test Cards
Stripe provides test card numbers for different scenarios:

| Scenario | Card Number | CVC | Date |
|----------|------------|-----|------|
| **Success** | 4242 4242 4242 4242 | Any 3 digits | Any future date |
| **Decline** | 4000 0000 0000 0002 | Any 3 digits | Any future date |
| **3D Secure** | 4000 0025 0000 3155 | Any 3 digits | Any future date |
| **Insufficient Funds** | 4000 0000 0000 9995 | Any 3 digits | Any future date |

More cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

### 4.2 Test Escrow Flow
```bash
# 1. Create escrow hold
curl -X POST http://localhost:3004/api/escrow/hold \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": 1,
    "amount": 100.50,
    "orderId": 123
  }'

# 2. Release escrow to seller
curl -X POST http://localhost:3004/api/escrow/release \
  -H "Content-Type: application/json" \
  -d '{
    "sellerId": 2,
    "amount": 100.50,
    "orderId": 123
  }'

# 3. Refund to buyer
curl -X POST http://localhost:3004/api/escrow/refund \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": 1,
    "amount": 100.50,
    "orderId": 123
  }'
```

---

## 🔒 Step 5: Security Best Practices

### 5.1 Verify Webhook Signatures
Always verify Stripe webhooks to prevent fake requests:

```typescript
// Already implemented in payment-service
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 5.2 Use HTTPS in Production
Stripe requires HTTPS for webhooks in production.

### 5.3 Never Log Sensitive Data
- ❌ Don't log full card numbers
- ❌ Don't log CVV codes
- ✅ Log only: last 4 digits, brand, transaction ID

---

## 📊 Step 6: Monitor Payments

### 6.1 Stripe Dashboard
Monitor all transactions at: [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)

### 6.2 View Webhook Logs
Check webhook delivery status at: [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)

---

## 🚀 Step 7: Go Live (Production)

When ready for production:

### 7.1 Activate Live Mode
1. Complete Stripe account verification
2. Add bank account for payouts
3. Toggle **Test Mode** OFF
4. Get **Live API keys** (start with `pk_live_...` and `sk_live_...`)

### 7.2 Update Production .env
```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
TEST_MODE=false
```

### 7.3 Update Webhook URL
Change webhook endpoint to production domain:
```
https://api.mnbara.com/api/payments/webhook/stripe
```

---

## 🐛 Troubleshooting

### Issue: "Invalid API Key provided"
- Check that you copied the correct key
- Make sure there are no extra spaces
- Verify you're using **test** keys in test mode

### Issue: "No signatures found"
- Verify webhook secret is correct
- Check that request body is raw (not parsed JSON)

### Issue: "Payment failed"
- Use test card `4242 4242 4242 4242`
- Check Stripe Dashboard for error details

---

## 📚 Additional Resources

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhook Events](https://stripe.com/docs/api/events/types)
- [PCI Compliance](https://stripe.com/docs/security/guide)

---

**Need Help?** Contact support@mnbara.com or check our Discord community.

**Last Updated:** 2025-12-01
