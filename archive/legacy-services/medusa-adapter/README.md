# Medusa Adapter Service + Mercur Multi-Vendor

Medusa-inspired e-commerce backend adapter for Mnbara Platform with Mercur multi-vendor marketplace extension. Provides product catalog, cart, order management, and complete vendor marketplace capabilities.

## Features

### Product Management
- Product catalog with variants
- Product options (size, color, etc.)
- Multiple images per product
- Inventory management
- Product collections and categories
- Tags and metadata
- Multi-currency pricing

### Cart System
- Create and manage shopping carts
- Add/update/remove items
- Calculate totals
- Complete cart to create order

### Order Management
- Order creation from cart
- Order status tracking
- Fulfillment status
- Payment status
- Order history

### Multi-Vendor Marketplace (Mercur Extension) ⭐ NEW
- Vendor registration and onboarding
- Vendor verification and approval
- Commission calculation per order
- Automated commission tracking
- Payout management (pending, processing, completed)
- Vendor analytics dashboard
- Batch payout processing
- Multiple payout methods (bank transfer, Stripe, PayPal)

## Tech Stack

- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript
- **Port**: 3022

## Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Start service
npm run dev
```

## API Endpoints

### Products

**List Products (Store)**
```http
GET /api/store/products?status=published&limit=20&offset=0
```

**Get Product**
```http
GET /api/store/products/:id
```

**Get Product by Handle**
```http
GET /api/store/products/handle/:handle
```

**Create Product (Admin)**
```http
POST /api/admin/products
Content-Type: application/json

{
  "title": "Premium T-Shirt",
  "subtitle": "100% Cotton",
  "description": "High quality cotton t-shirt",
  "handle": "premium-tshirt",
  "sellerId": "seller123",
  "sellerType": "INDIVIDUAL",
  "status": "published",
  "variants": [
    {
      "title": "Small / Red",
      "sku": "TSHIRT-S-RED",
      "inventoryQuantity": 100,
      "prices": [
        { "currencyCode": "SAR", "amount": 9900 }
      ]
    }
  ],
  "options": [
    {
      "title": "Size",
      "values": ["Small", "Medium", "Large"]
    },
    {
      "title": "Color",
      "values": ["Red", "Blue", "Green"]
    }
  ],
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

**Update Product (Admin)**
```http
PUT /api/admin/products/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "published"
}
```

**Add Variant (Admin)**
```http
POST /api/admin/products/:id/variants
Content-Type: application/json

{
  "title": "Medium / Blue",
  "sku": "TSHIRT-M-BLUE",
  "inventoryQuantity": 50,
  "prices": [
    { "currencyCode": "SAR", "amount": 9900 }
  ]
}
```

**Update Inventory (Admin)**
```http
PUT /api/admin/products/variants/:variantId/inventory
Content-Type: application/json

{
  "quantity": 75
}
```

### Cart

**Create Cart**
```http
POST /api/store/carts
Content-Type: application/json

{
  "customerId": "customer123",
  "email": "customer@example.com"
}
```

**Get Cart**
```http
GET /api/store/carts/:id
```

**Add Item to Cart**
```http
POST /api/store/carts/:id/line-items
Content-Type: application/json

{
  "variantId": "variant123",
  "quantity": 2
}
```

**Update Item Quantity**
```http
PUT /api/store/carts/:id/line-items/:itemId
Content-Type: application/json

{
  "quantity": 3
}
```

**Remove Item**
```http
DELETE /api/store/carts/:id/line-items/:itemId
```

**Get Cart Total**
```http
GET /api/store/carts/:id/total
```

**Complete Cart (Create Order)**
```http
POST /api/store/carts/:id/complete
Content-Type: application/json

{
  "customerId": "customer123",
  "email": "customer@example.com"
}
```

### Orders

**Get Order**
```http
GET /api/store/orders/:id
```

**List Orders (Admin)**
```http
GET /api/admin/orders?customerId=customer123&status=pending&limit=20
```

**Update Order Status (Admin)**
```http
PUT /api/admin/orders/:id/status
Content-Type: application/json

{
  "status": "completed"
}
```

**Update Fulfillment Status (Admin)**
```http
PUT /api/admin/orders/:id/fulfillment
Content-Type: application/json

{
  "fulfillmentStatus": "shipped"
}
```

**Update Payment Status (Admin)**
```http
PUT /api/admin/orders/:id/payment
Content-Type: application/json

{
  "paymentStatus": "captured"
}
```

**Cancel Order (Admin)**
```http
POST /api/admin/orders/:id/cancel
```

## Database Schema

### Product
- Core product information
- Seller association
- Status (draft, published, rejected)
- Metadata support

### ProductVariant
- Product variations (size, color, etc.)
- SKU, barcode, inventory
- Multiple prices per variant

### ProductOption
- Option types (Size, Color, Material)
- Option values per variant

### Cart
- Shopping cart with items
- Customer association
- Shipping/billing addresses

### Order
- Order from completed cart
- Status tracking (pending, completed, canceled)
- Fulfillment status
- Payment status

## Use Cases

### 1. Create Product with Variants
```javascript
const product = await fetch('http://localhost:3022/api/admin/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Classic Sneakers',
    handle: 'classic-sneakers',
    sellerId: 'seller123',
    sellerType: 'BUSINESS',
    status: 'published',
    variants: [
      {
        title: 'Size 42',
        sku: 'SNEAKER-42',
        inventoryQuantity: 50,
        prices: [{ currencyCode: 'SAR', amount: 29900 }]
      },
      {
        title: 'Size 43',
        sku: 'SNEAKER-43',
        inventoryQuantity: 30,
        prices: [{ currencyCode: 'SAR', amount: 29900 }]
      }
    ]
  })
});
```

### 2. Shopping Cart Flow
```javascript
// Create cart
const cart = await createCart({ customerId: 'user123' });

// Add items
await addToCart(cart.id, { variantId: 'variant1', quantity: 2 });
await addToCart(cart.id, { variantId: 'variant2', quantity: 1 });

// Get total
const total = await getCartTotal(cart.id);
// { subtotal: 59800, total: 59800, itemCount: 3 }

// Complete cart
const order = await completeCart(cart.id, {
  customerId: 'user123',
  email: 'user@example.com'
});
```

### 3. Order Management
```javascript
// List customer orders
const orders = await listOrders({ customerId: 'user123' });

// Update order status
await updateOrderStatus(orderId, 'completed');

// Update fulfillment
await updateFulfillmentStatus(orderId, 'shipped');

// Update payment
await updatePaymentStatus(orderId, 'captured');
```

## Integration with Mnbara

### With Auction Service
```javascript
// When auction ends, create product from winning bid
const product = await createProduct({
  title: auction.title,
  handle: `auction-${auction.id}`,
  sellerId: auction.sellerId,
  sellerType: 'INDIVIDUAL',
  status: 'published',
  variants: [{
    title: 'Default',
    inventoryQuantity: 1,
    prices: [{ currencyCode: 'SAR', amount: auction.winningBid }]
  }]
});
```

### With Payment Service
```javascript
// After payment captured
await updatePaymentStatus(orderId, 'captured');
await updateOrderStatus(orderId, 'completed');
```

### With Location Service
```javascript
// Calculate shipping based on distance
const distance = await calculateDistance(sellerLocation, buyerLocation);
const shippingCost = calculateShippingCost(distance);
```

## Differences from Medusa

### What's Included
✅ Product catalog with variants
✅ Cart system
✅ Order management
✅ Multi-currency pricing
✅ Inventory management
✅ Product options

### What's Simplified
⚠️ No payment providers (use Mnbara payment service)
⚠️ No shipping providers (use Mnbara location service)
⚠️ No regions (single region for now)
⚠️ No discounts/promotions (add later)
⚠️ No returns/exchanges (add later)

### Mnbara-Specific
✅ Seller association (sellerId, sellerType)
✅ Integration with auction system
✅ Integration with location service
✅ Simplified for MVP

## Performance

- **Product List**: < 100ms
- **Cart Operations**: < 50ms
- **Order Creation**: < 200ms

## Port

**3022** - Medusa Adapter Service

## Status

✅ **Complete** - Ready for integration with Mnbara platform


## Multi-Vendor API Endpoints (Mercur Extension)

### Vendor Registration & Profile

**Register as Vendor**
```http
POST /api/vendors/register
Content-Type: application/json

{
  "userId": "user123",
  "businessName": "Tech Store",
  "businessType": "BUSINESS",
  "email": "vendor@techstore.com",
  "phone": "+966501234567",
  "taxId": "123456789",
  "businessLicense": "BL-2024-001",
  "payoutMethod": "bank_transfer",
  "payoutDetails": {
    "bankName": "Al Rajhi Bank",
    "accountNumber": "1234567890",
    "iban": "SA1234567890123456789012"
  }
}
```

**Get Vendor Profile**
```http
GET /api/vendors/:id
```

**Get Vendor by User ID**
```http
GET /api/vendors/user/:userId
```

**Update Vendor Profile**
```http
PUT /api/vendors/:id
Content-Type: application/json

{
  "businessName": "Updated Tech Store",
  "phone": "+966509876543",
  "payoutMethod": "stripe"
}
```

### Vendor Analytics

**Get Vendor Analytics**
```http
GET /api/vendors/:id/analytics

Response:
{
  "id": "analytics123",
  "vendorId": "vendor123",
  "totalSales": 150000,
  "totalOrders": 45,
  "totalCommissions": 15000,
  "totalPayouts": 135000,
  "averageOrderValue": 3333,
  "productCount": 25,
  "rating": 4.8,
  "reviewCount": 120,
  "lastSaleAt": "2026-02-03T10:30:00Z"
}
```

### Commissions

**Get Vendor Commissions**
```http
GET /api/vendors/:id/commissions?status=pending&limit=20&offset=0
```

**Get Commission Summary**
```http
GET /api/vendors/:id/commissions/summary

Response:
{
  "pending": {
    "amount": 5000,
    "count": 10
  },
  "approved": {
    "amount": 3000,
    "count": 6
  },
  "paid": {
    "amount": 135000,
    "count": 300
  }
}
```

### Payouts

**Get Vendor Payouts**
```http
GET /api/vendors/:id/payouts?status=completed&limit=20&offset=0
```

**Get Payout Summary**
```http
GET /api/vendors/:id/payouts/summary

Response:
{
  "pending": {
    "amount": 5000,
    "count": 1
  },
  "processing": {
    "amount": 3000,
    "count": 1
  },
  "completed": {
    "amount": 135000,
    "count": 25
  },
  "failed": {
    "amount": 0,
    "count": 0
  }
}
```

**Request Payout**
```http
POST /api/vendors/:id/payouts
Content-Type: application/json

{
  "commissionIds": ["comm1", "comm2", "comm3"],
  "method": "bank_transfer"
}
```

### Admin Vendor Management

**List All Vendors**
```http
GET /api/admin/vendors?status=active&verificationStatus=verified&limit=20
```

**Update Vendor Status**
```http
PUT /api/admin/vendors/:id/status
Content-Type: application/json

{
  "status": "active"
}
```

**Update Verification Status**
```http
PUT /api/admin/vendors/:id/verification
Content-Type: application/json

{
  "verificationStatus": "verified"
}
```

### Admin Payout Management

**Batch Create Payouts**
```http
POST /api/admin/vendors/payouts/batch
Content-Type: application/json

{
  "vendorIds": ["vendor1", "vendor2", "vendor3"],
  "method": "bank_transfer"
}
```

**Process Payout**
```http
PUT /api/admin/vendors/payouts/:id/process
Content-Type: application/json

{
  "reference": "BANK-TXN-123456"
}
```

**Complete Payout**
```http
PUT /api/admin/vendors/payouts/:id/complete
Content-Type: application/json

{
  "reference": "BANK-TXN-123456"
}
```

**Fail Payout**
```http
PUT /api/admin/vendors/payouts/:id/fail
Content-Type: application/json

{
  "failureReason": "Insufficient funds"
}
```

## Multi-Vendor Workflows

### 1. Vendor Onboarding
```javascript
// Step 1: User registers as vendor
const vendor = await registerVendor({
  userId: 'user123',
  businessName: 'Tech Store',
  businessType: 'BUSINESS',
  email: 'vendor@techstore.com',
  taxId: '123456789',
  businessLicense: 'BL-2024-001'
});
// Status: pending, verificationStatus: unverified

// Step 2: Admin reviews and verifies
await updateVerificationStatus(vendor.id, 'verified');

// Step 3: Admin activates vendor
await updateVendorStatus(vendor.id, 'active');

// Step 4: Vendor can now sell products
```

### 2. Commission Calculation (Automatic)
```javascript
// When order is completed
const order = await completeCart(cartId, { customerId, email });

// Automatically calculate commissions for each item
const commissions = await calculateCommission(order.id);
// Creates commission records for each vendor
// Status: pending

// Admin approves commissions
for (const commission of commissions) {
  await approveCommission(commission.id);
}
// Status: approved
```

### 3. Payout Processing
```javascript
// Vendor requests payout
const pendingCommissions = await getPendingCommissions(vendorId);
const commissionIds = pendingCommissions.map(c => c.id);

const payout = await requestPayout(vendorId, commissionIds, 'bank_transfer');
// Status: pending

// Admin processes payout
await processPayout(payout.id, 'BANK-TXN-123456');
// Status: processing

// Admin completes payout
await completePayout(payout.id, 'BANK-TXN-123456');
// Status: completed
// Commissions marked as paid
// Vendor analytics updated
```

### 4. Batch Payout Processing
```javascript
// Admin creates payouts for all vendors with approved commissions
const payouts = await batchCreatePayouts(
  ['vendor1', 'vendor2', 'vendor3'],
  'bank_transfer'
);

// Process each payout
for (const payout of payouts) {
  await processPayout(payout.id, `BANK-TXN-${payout.id}`);
  await completePayout(payout.id, `BANK-TXN-${payout.id}`);
}
```

## Database Schema (Mercur Extension)

### Vendor
- Vendor registration and profile
- Business information (name, type, tax ID, license)
- Status (pending, active, suspended, banned)
- Verification status (unverified, pending, verified)
- Commission rate (default 10%)
- Payout method and details

### VendorCommission
- Commission per order item
- Sale amount, commission rate, commission amount
- Net amount (vendor receives)
- Status (pending, approved, paid)
- Linked to vendor, order, product

### VendorPayout
- Payout to vendor
- Amount, currency, method
- Status (pending, processing, completed, failed)
- Commission IDs included
- External reference (bank transaction, Stripe transfer)

### VendorAnalytics
- Real-time vendor metrics
- Total sales, orders, commissions, payouts
- Average order value
- Product count
- Rating and reviews
- Last sale timestamp

## Integration Examples

### With Order Service
```javascript
// When order is completed
const order = await orderService.completeOrder(orderId);

// Calculate commissions automatically
const commissions = await commissionService.calculateCommission(order.id);

// Notify vendors
for (const commission of commissions) {
  await notificationService.sendEmail(commission.vendorId, {
    subject: 'New Sale',
    body: `You earned ${commission.netAmount} SAR`
  });
}
```

### With Payment Service
```javascript
// When payment is captured
await paymentService.capturePayment(paymentId);

// Approve commissions
const commissions = await commissionService.listCommissions({
  orderId: order.id,
  status: 'pending'
});

for (const commission of commissions) {
  await commissionService.approveCommission(commission.id);
}
```

### With Stripe Connect
```javascript
// Process payout via Stripe
const payout = await payoutService.getPayout(payoutId);
const vendor = await vendorService.getVendor(payout.vendorId);

// Create Stripe transfer
const transfer = await stripeConnectService.createTransfer({
  amount: payout.amount,
  currency: payout.currency,
  destination: vendor.payoutDetails.stripeAccountId
});

// Complete payout
await payoutService.completePayout(payoutId, transfer.id);
```

## Commission Calculation

Default commission rate: **10%**

Example:
- Product price: 100 SAR
- Commission (10%): 10 SAR
- Vendor receives: 90 SAR

Custom commission rates can be set per vendor.

## Payout Methods

Supported methods:
- **bank_transfer**: Direct bank transfer (requires IBAN)
- **stripe**: Stripe Connect transfer
- **paypal**: PayPal payout

## Status Flows

### Vendor Status
```
pending → active → suspended → banned
         ↓
      rejected
```

### Verification Status
```
unverified → pending → verified
            ↓
         rejected
```

### Commission Status
```
pending → approved → paid
```

### Payout Status
```
pending → processing → completed
         ↓
       failed
```

## Performance

- **Vendor Registration**: < 100ms
- **Commission Calculation**: < 200ms per order
- **Payout Creation**: < 150ms
- **Analytics Query**: < 50ms

## Port

**3022** - Medusa Adapter + Mercur Multi-Vendor Service

## Status

✅ **Complete** - Medusa adapter with full multi-vendor marketplace capabilities
