# 🏢 Wholesale Service - منبرة للبيع بالجملة
# B2B Marketplace for Bulk Trading

> "Your Gateway to Bulk Trading"
> "بوابتك للتجارة بالجملة"

## 🌟 Overview | نظرة عامة

Wholesale Service is a B2B marketplace enabling suppliers to list products in bulk and buyers to place large orders with tiered pricing.

خدمة البيع بالجملة هي سوق B2B تمكن الموردين من عرض منتجاتهم بالجملة والمشترين من تقديم طلبات كبيرة بأسعار متدرجة.

## ✨ Features | الميزات

### 🏢 Supplier Management
- Supplier registration & verification
- Business profile management
- Document verification
- Performance analytics

### 📦 Product Management
- Bulk product listings
- Tiered pricing (quantity-based)
- Inventory management
- Multi-currency support

### 🛒 Order Management
- Bulk order processing
- Order tracking
- Payment management
- Shipping integration

### 💬 RFQ System
- Request for Quote
- Price negotiation
- Quote management
- Inquiry tracking

### 📊 Analytics
- Sales analytics
- Product performance
- Customer insights
- Revenue reports

## 📡 API Endpoints

### Suppliers
```
POST /api/v1/suppliers/register     - Register new supplier
GET  /api/v1/suppliers              - List suppliers
GET  /api/v1/suppliers/search       - Search suppliers
GET  /api/v1/suppliers/:id          - Get supplier details
PUT  /api/v1/suppliers/:id          - Update supplier
POST /api/v1/suppliers/:id/verify   - Verify supplier (admin)
GET  /api/v1/suppliers/:id/dashboard - Get dashboard
```

### Products
```
POST /api/v1/products               - Create product
GET  /api/v1/products               - List products
GET  /api/v1/products/search        - Search products
GET  /api/v1/products/categories    - Get categories
GET  /api/v1/products/:id           - Get product
PUT  /api/v1/products/:id           - Update product
DELETE /api/v1/products/:id         - Delete product
GET  /api/v1/products/:id/price     - Get price for quantity
POST /api/v1/products/:id/pricing-tiers - Add pricing tier
PUT  /api/v1/products/:id/stock     - Update stock
GET  /api/v1/products/:id/availability - Check availability
```

### Orders
```
POST /api/v1/orders                 - Create order
GET  /api/v1/orders                 - List orders
GET  /api/v1/orders/:id             - Get order
GET  /api/v1/orders/number/:num     - Get by order number
PUT  /api/v1/orders/:id/status      - Update status
PUT  /api/v1/orders/:id/payment     - Update payment
PUT  /api/v1/orders/:id/tracking    - Add tracking
```

### Inquiries (RFQ)
```
POST /api/v1/inquiries              - Create inquiry
GET  /api/v1/inquiries              - List inquiries
GET  /api/v1/inquiries/:id          - Get inquiry
POST /api/v1/inquiries/:id/respond  - Respond to inquiry
PUT  /api/v1/inquiries/:id/status   - Update status
```

### Analytics
```
GET /api/v1/analytics/supplier/:id          - Supplier analytics
GET /api/v1/analytics/supplier/:id/summary  - Supplier summary
GET /api/v1/analytics/supplier/:id/top-products - Top products
GET /api/v1/analytics/platform              - Platform analytics
```

## 🏗️ Architecture

```
wholesale-service/
├── prisma/
│   └── schema.prisma          # Database schema (10 models)
├── src/
│   ├── index.ts               # Entry point
│   ├── controllers/
│   │   ├── supplier.controller.ts
│   │   ├── product.controller.ts
│   │   ├── order.controller.ts
│   │   └── inquiry.controller.ts
│   ├── services/
│   │   ├── supplier.service.ts
│   │   ├── product.service.ts
│   │   ├── order.service.ts
│   │   └── inquiry.service.ts
│   └── routes/
│       ├── supplier.routes.ts
│       ├── product.routes.ts
│       ├── order.routes.ts
│       ├── inquiry.routes.ts
│       ├── pricing.routes.ts
│       └── analytics.routes.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

## 💰 Pricing Tiers Example

```
Base Price: $10/unit

Tier 1: 100-499 units  → $9.50/unit (5% off)
Tier 2: 500-999 units  → $9.00/unit (10% off)
Tier 3: 1000+ units    → $8.50/unit (15% off)
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## 📊 Database Models

| Model | Description |
|-------|-------------|
| Supplier | Supplier profiles |
| WholesaleProduct | Bulk products |
| PricingTier | Supplier pricing tiers |
| ProductPricingTier | Product quantity pricing |
| BulkOrder | Wholesale orders |
| BulkOrderItem | Order line items |
| OrderTimeline | Order status history |
| SupplierReview | Supplier ratings |
| WholesaleAnalytics | Analytics data |
| ProductInquiry | RFQ inquiries |

## 🌍 Supported Business Types

- MANUFACTURER - مصنع
- DISTRIBUTOR - موزع
- WHOLESALER - تاجر جملة
- IMPORTER - مستورد
- EXPORTER - مصدر

## 📝 License

Proprietary - Mnbara Platform © 2026

---

**"منبرة للبيع بالجملة - بوابتك للتجارة الكبيرة"**
**"Mnbara Wholesale - Your Gateway to Big Business"**
