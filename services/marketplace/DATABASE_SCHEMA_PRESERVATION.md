# Marketplace Services Database Schema Preservation

**Task:** 4.2.5 Preserve existing database schemas  
**Status:** Complete  
**Date:** March 16, 2026

## Overview

This document outlines the preservation of existing database schemas for all marketplace services. Each service maintains its own Prisma schema and migration files to ensure data integrity and schema consistency across the monorepo.

## Services & Schemas

### 1. Product Service (`services/marketplace/product-service`)

**Database:** PostgreSQL  
**ORM:** Prisma  
**Schema File:** `prisma/schema.prisma`  
**Migration:** `prisma/migrations/001_init/migration.sql`

#### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `Product` | Core product listings | id, sellerId, categoryId, title, price, status, listingType |
| `ProductImage` | Product images and thumbnails | id, productId, url, isPrimary |
| `ProductSpecification` | Product attributes | id, productId, key, value |
| `Seller` | Seller information | id, name, email, rating, trustScore |
| `Category` | Product categories (hierarchical) | id, parentId, nameEn, nameAr, slug |
| `Bid` | Auction bids | id, productId, bidderId, amount, status |
| `MakeOffer` | Make offer listings | id, productId, buyerId, offerPrice, status |
| `RestrictedProduct` | Moderation keywords | id, keyword, severity |
| `ModerationLog` | Moderation audit trail | id, productId, action, status |

#### Enums

- `ProductCondition`: NEW, LIKE_NEW, GOOD, FAIR, POOR, PARTS, REFURBISHED
- `ProductStatus`: DRAFT, PENDING_REVIEW, ACTIVE, PAUSED, SOLD, ARCHIVED, DELETED, REJECTED
- `ListingType`: BUY_IT_NOW, AUCTION, MAKE_OFFER, COMBINED
- `ModerationStatus`: PENDING, APPROVED, REJECTED, FLAGGED, UNDER_REVIEW
- `BidStatus`: ACTIVE, WINNING, OUTBID, WON, CANCELLED
- `OfferStatus`: PENDING, ACCEPTED, DECLINED, COUNTERED, EXPIRED, WITHDRAWN
- `RestrictedSeverity`: WARN, BLOCK, FLAG_FOR_REVIEW
- `ModerationAction`: SUBMITTED, APPROVED, REJECTED, FLAGGED, ESCALATED, APPEALED

#### Special Features

- **PostGIS Integration**: Location field uses `geography(Point, 4326)` for geospatial queries
- **Country of Origin Layer (COOL)**: Tracks origin_country, purchase_country, delivery_country
- **Bilingual Support**: Arabic translations for titles, descriptions, and specifications
- **Auction Support**: Full auction functionality with bids, reserve prices, and auto-bidding
- **Moderation System**: Comprehensive moderation with status tracking and audit logs

#### Indexes

- Seller and category lookups
- Status and listing type filtering
- Price range queries
- Auction end time tracking
- Moderation status tracking
- Geographic queries (city + delivery country)

---

### 2. Order Service (`services/marketplace/order-service`)

**Database:** PostgreSQL  
**ORM:** Prisma  
**Schema File:** `prisma/schema.prisma`  
**Migration:** `prisma/migrations/001_init/migration.sql`

#### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `Order` | Customer orders | id, userId, status, total, currency |
| `OrderItem` | Individual items in orders | id, orderId, productId, quantity, price |

#### Enums

- `OrderStatus`: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED

#### Indexes

- User ID lookup
- Status filtering
- Creation date range queries
- Product ID lookup

#### Design Notes

- Simple, focused schema for order management
- Denormalized price field for historical accuracy
- Cascade delete for order items when order is deleted
- Supports order status lifecycle tracking

---

### 3. Cart Service (`services/marketplace/cart-service`)

**Database:** PostgreSQL  
**ORM:** Prisma  
**Schema File:** `prisma/schema.prisma`  
**Migration:** `prisma/migrations/001_init/migration.sql`

#### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `carts` | Shopping carts | id, userId, createdAt, updatedAt |
| `cart_items` | Items in shopping carts | id, cartId, productId, quantity, price |

#### Design Notes

- One cart per user (unique userId constraint)
- Composite unique constraint on (cartId, productId) to prevent duplicates
- Denormalized price field for consistency
- Cascade delete for cart items when cart is deleted
- Table names use snake_case convention

#### Indexes

- User ID lookup (unique)
- Cart-product combination lookup (unique)

---

## Migration Strategy

### Applying Migrations

Each service uses Prisma migrations to manage schema changes:

```bash
# For product-service
cd services/marketplace/product-service
npx prisma migrate deploy

# For order-service
cd services/marketplace/order-service
npx prisma migrate deploy

# For cart-service
cd services/marketplace/cart-service
npx prisma migrate deploy
```

### Migration Files

All migration files are stored in `prisma/migrations/` directory with the following structure:

```
prisma/
├── schema.prisma          # Current schema definition
└── migrations/
    └── 001_init/
        └── migration.sql  # Initial schema creation
```

### Rollback Strategy

To rollback migrations (if needed):

```bash
# Rollback to previous migration
npx prisma migrate resolve --rolled-back 001_init
```

---

## Schema Preservation Checklist

- [x] Product service schema documented and migrated
- [x] Order service schema documented and migrated
- [x] Cart service schema documented and migrated
- [x] All enums preserved
- [x] All indexes preserved
- [x] All foreign key relationships preserved
- [x] All constraints preserved
- [x] Migration files created for each service
- [x] Schema documentation updated

---

## Data Consistency Guarantees

### Product Service

- **Referential Integrity**: Foreign keys enforce seller and category existence
- **Unique Constraints**: SKU uniqueness, category slug uniqueness
- **Cascade Deletes**: Images, specifications, bids, and offers cascade when product is deleted
- **Audit Trail**: Moderation logs track all status changes

### Order Service

- **Referential Integrity**: Order items must reference valid orders
- **Cascade Deletes**: Order items deleted when order is deleted
- **Historical Accuracy**: Price denormalized to preserve historical order values

### Cart Service

- **User Isolation**: One cart per user (unique constraint)
- **Duplicate Prevention**: Composite unique constraint prevents duplicate items
- **Cascade Deletes**: Cart items deleted when cart is deleted

---

## Environment Configuration

Each service requires a `DATABASE_URL` environment variable:

```bash
# PostgreSQL connection string format
DATABASE_URL="postgresql://user:password@localhost:5432/service_name"
```

### Service Databases

- **product-service**: `mnbara_product_db`
- **order-service**: `mnbara_order_db`
- **cart-service**: `mnbara_cart_db`

---

## Verification Steps

To verify schema preservation:

1. **Check Prisma Client Generation**
   ```bash
   npx prisma generate
   ```

2. **Validate Schema**
   ```bash
   npx prisma validate
   ```

3. **View Database State**
   ```bash
   npx prisma studio
   ```

4. **Check Migration Status**
   ```bash
   npx prisma migrate status
   ```

---

## Related Documentation

- [Product Service README](./product-service/README.md)
- [Order Service README](./order-service/README.md)
- [Cart Service README](./cart-service/README.md)
- [Shared Packages Integration](./SHARED_PACKAGES_INTEGRATION.md)

---

## Notes

- All schemas use PostgreSQL as the primary database
- Prisma Client is auto-generated from schema files
- Migrations are idempotent and can be safely re-applied
- Each service maintains independent database and schema
- No cross-service database dependencies (services communicate via APIs)

---

**Last Updated:** March 16, 2026  
**Version:** 1.0  
**Status:** Complete
