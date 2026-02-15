# Mnbarh Marketplace - Simple Payment Flow Design

## Overview
A minimal, production-ready payment flow using Stripe for marketplace transactions with automatic fee collection.

---

## 1. Payment Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend     │    │   Backend       │    │    Stripe       │
│                 │    │                 │    │                 │
│ User clicks     │    │                 │    │                 │
│ "Buy Now"       │───▶│ Create Payment  │───▶│ Payment Intent  │
│                 │    │ Intent API      │    │ Created         │
│                 │    │                 │    │                 │
│ Show Stripe     │◀───│ Return Client   │◀───│ Client Secret   │
│ Elements        │    │ Secret          │    │                 │
│                 │    │                 │    │                 │
│ User enters     │    │                 │    │                 │
│ card & submits  │───▶│ Confirm Payment │───▶│ Process Card    │
│                 │    │ API            │    │                 │
│                 │    │                 │    │                 │
│ Show Success/   │◀───│ Webhook Handler │◀───│ Payment Status  │
│ Failure Page    │    │ Updates DB      │    │ Webhook         │
│                 │    │                 │    │                 │
│ Send Receipt    │    │                 │    │                 │
│ Email           │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 2. Required Backend Endpoints

### Core Payment Endpoints

#### `POST /api/payments/create-intent`
```typescript
// Request
{
  listingId: string,
  quantity: number,
  buyerId: string,
  shippingAddress: Address
}

// Response
{
  clientSecret: string,
  paymentIntentId: string,
  amount: number,
  fee: number,
  total: number
}
```

#### `POST /api/payments/confirm`
```typescript
// Request
{
  paymentIntentId: string,
  listingId: string,
  buyerId: string
}

// Response
{
  success: boolean,
  orderId: string,
  redirectUrl: string
}
```

#### `GET /api/payments/:paymentIntentId/status`
```typescript
// Response
{
  status: 'pending' | 'succeeded' | 'failed' | 'canceled',
  orderId?: string,
  error?: string
}
```

### Webhook Endpoint

#### `POST /api/payments/webhook`
```typescript
// Stripe webhook event
// Handles: payment_intent.succeeded, payment_intent.payment_failed
```

---

## 3. Required Frontend Actions

### 1. Initialize Payment
```typescript
const handleBuyNow = async (listingId: string) => {
  // 1. Create payment intent
  const response = await fetch('/api/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify({
      listingId,
      quantity: 1,
      buyerId: user.id,
      shippingAddress: user.address
    })
  });
  
  const { clientSecret } = await response.json();
  
  // 2. Show Stripe Elements
  const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
  const elements = stripe.elements({ clientSecret });
  
  // Mount card element
  const cardElement = elements.create('payment');
  cardElement.mount('#card-element');
  
  // 3. Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    });
    
    if (error) {
      showError(error.message);
    } else {
      // Payment succeeded
      window.location.href = `/payment/success?payment_intent=${paymentIntent.id}`;
    }
  };
};
```

### 2. Payment Success Page
```typescript
const PaymentSuccessPage = () => {
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentIntentId = urlParams.get('payment_intent');
      
      const response = await fetch(`/api/payments/${paymentIntentId}/status`);
      const status = await response.json();
      
      setPaymentStatus(status);
    };
    
    checkPaymentStatus();
  }, []);
  
  return (
    <div>
      {paymentStatus?.status === 'succeeded' ? (
        <div>
          <h1>Payment Successful!</h1>
          <p>Order ID: {paymentStatus.orderId}</p>
          <p>Receipt sent to your email</p>
        </div>
      ) : (
        <div>
          <h1>Processing Payment...</h1>
        </div>
      )}
    </div>
  );
};
```

---

## 4. What is Stored in Database

### Tables Required

#### `payments`
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  buyer_id UUID REFERENCES users(id) NOT NULL,
  seller_id UUID REFERENCES users(id) NOT NULL,
  listing_id UUID REFERENCES listings(id) NOT NULL,
  
  -- Amounts (in cents)
  amount_cents INTEGER NOT NULL,
  marketplace_fee_cents INTEGER NOT NULL,
  seller_amount_cents INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL, -- 'pending', 'succeeded', 'failed', 'canceled'
  
  -- Metadata
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_fee_cents INTEGER,
  net_amount_cents INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

#### `orders`
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  buyer_id UUID REFERENCES users(id) NOT NULL,
  seller_id UUID REFERENCES users(id) NOT NULL,
  listing_id UUID REFERENCES listings(id) NOT NULL,
  
  -- Order details
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  total_amount_cents INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'canceled'
  
  -- Shipping
  shipping_address JSONB NOT NULL,
  tracking_number VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP
);
```

#### `transactions` (for accounting)
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  
  -- Transaction details
  type VARCHAR(50) NOT NULL, -- 'sale', 'marketplace_fee', 'stripe_fee'
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Parties
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### Data Flow
1. **Payment Intent Created**: Record in `payments` table with status 'pending'
2. **Payment Succeeded**: Update payment status, create order record, create transaction records
3. **Email Sent**: Mark email receipt as sent
4. **Order Processing**: Update order status as items are shipped/delivered

---

## 5. What is NOT Implemented Yet (Explicit)

### ❌ **Payouts System**
- No automatic seller payouts
- No bank account management
- No payout scheduling
- No payout history tracking

### ❌ **Escrow Automation**
- No holding funds in escrow
- No release triggers based on delivery confirmation
- No dispute fund holding

### ❌ **Dispute Resolution**
- No automated dispute handling
- No refund processing
- No chargeback management

### ❌ **Advanced Features**
- No subscription billing
- No installment payments
- No multi-currency conversion
- No international payment methods
- No saved payment methods
- No payment method management

### ❌ **Analytics & Reporting**
- No payment analytics dashboard
- No revenue reporting
- No seller payment history
- No tax reporting

### ❌ **Security Enhancements**
- No 3D Secure enforcement
- No fraud detection
- No velocity limits
- No suspicious activity monitoring

---

## Implementation Priority

### Phase 1 (MVP - This Design)
✅ Basic payment processing
✅ Marketplace fee collection
✅ Email receipts
✅ Order creation

### Phase 2 (Next)
- Payouts system
- Basic dispute handling
- Payment analytics

### Phase 3 (Future)
- Escrow automation
- Advanced fraud detection
- Multi-currency support

---

## Configuration Required

### Environment Variables
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Marketplace Configuration
MARKETPLACE_FEE_PERCENTAGE=5.0
MARKETPLACE_FEE_FIXED_CENTS=50

# Email Configuration
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_API_KEY=SG....
FROM_EMAIL=noreply@mnbarh.com
```

### Stripe Account Setup
1. Create Stripe Connect account (for marketplace)
2. Configure webhook endpoints
3. Set up pricing plans for fees
4. Configure email templates
5. Enable test mode for development

---

## Security Considerations

### ✅ **Implemented**
- HTTPS only
- Stripe client-side tokenization
- Webhook signature verification
- Input validation and sanitization
- Rate limiting on payment endpoints

### ⚠️ **Additional Recommendations**
- PCI compliance validation
- Regular security audits
- Fraud detection rules
- Transaction monitoring
- Backup payment methods

---

## Error Handling

### Client-Side Errors
- Card declined
- Insufficient funds
- Invalid card details
- Network timeouts

### Server-Side Errors
- Stripe API failures
- Database connection issues
- Email service failures
- Webhook processing errors

### Recovery Strategies
- Retry failed operations
- Graceful degradation
- User-friendly error messages
- Admin notification system

---

## Testing Strategy

### Unit Tests
- Payment intent creation
- Fee calculation logic
- Order creation
- Email sending

### Integration Tests
- Stripe API integration
- Webhook processing
- Database transactions
- Email delivery

### End-to-End Tests
- Complete payment flow
- Error scenarios
- Mobile responsiveness
- Cross-browser compatibility

---

This design provides a solid foundation for marketplace payments while keeping complexity minimal. The system can be extended with additional features as the marketplace grows.
