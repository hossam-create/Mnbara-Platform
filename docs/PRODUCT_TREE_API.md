# Product Tree API Service

Product tree API for hierarchical category browsing with country-based filtering.

---

## Overview

Provides hierarchical product category tree with real-time product counts, country-based filtering, and search capabilities.

---

## API Endpoints

### Get Full Category Tree
```
GET /api/products/tree
```

**Response**:
```json
{
  "id": "root",
  "name": "All Categories",
  "slug": "all",
  "children": [
    {
      "id": "cat_1",
      "name": "Electronics",
      "slug": "electronics",
      "children": [
        {
          "id": "cat_2",
          "name": "Smartphones",
          "slug": "electronics-smartphones",
          "children": [],
          "productCount": 150
        }
      ],
      "productCount": 500
    }
  ],
  "productCount": 10000
}
```

### Get Category Subtree
```
GET /api/products/tree/:categoryId
```

**Parameters**:
- `categoryId`: Category ID

**Response**: Category subtree with children

### Get Products in Category
```
GET /api/products/tree/:categoryId/products?page=1&limit=20&country=US
```

**Parameters**:
- `categoryId`: Category ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `country`: Filter by country of origin (optional)

**Response**:
```json
{
  "products": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### Search Categories and Products
```
GET /api/products/tree/search?query=iphone&country=US
```

**Parameters**:
- `query`: Search query
- `country`: Filter by country (optional)

**Response**:
```json
{
  "categories": [...],
  "products": [...]
}
```

### Filter by Country
```
GET /api/products/tree/filter?country=US&minPrice=100&maxPrice=1000
```

**Parameters**:
- `country`: Country code (ISO 3166-1 alpha-2)
- `minPrice`: Minimum price (optional)
- `maxPrice`: Maximum price (optional)

**Response**: Filtered category tree with product counts

---

## Database Schema

```prisma
model Category {
  id          String   @id @default(cuid())
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  name        String
  nameAr      String?
  slug        String   @unique
  path        String?  // Full path (e.g., "electronics/smartphones")
  depth       Int      @default(0)
  productCount Int      @default(0)
  metadata    Json?    // Additional category data
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([parentId])
  @@index([slug])
  @@index([path])
}

model Product {
  id              String    @id @default(uuid())
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  sellerId        String
  title           String
  titleAr         String?
  price           Decimal   @db.Decimal(10, 2)
  originCountry   String?   // ISO 3166-1 alpha-2
  purchaseCountry String?   // ISO 3166-1 alpha-2
  deliveryCountry String?   // ISO 3166-1 alpha-2
  condition       ProductCondition
  status          ProductStatus
  // ... more fields

  @@index([categoryId])
  @@index([originCountry])
  @@index([purchaseCountry])
  @@index([deliveryCountry])
}
```

---

## Frontend Components

### ProductTree.tsx
Hierarchical tree component with lazy loading and expand/collapse.

### ProductTreeFilter.tsx
Country filter component with multi-select.

### ProductTreeSearch.tsx
Search component with autocomplete.

### ProductTreeItem.tsx
Tree item component with product count and expand/collapse.

---

## Implementation Notes

- Use materialized views for real-time product counts
- Implement caching with Redis for performance
- Support English and Arabic languages
- Lazy load subcategories for large trees
- Implement real-time updates via WebSocket

---

**Status**: 📋 Ready for Implementation
**Priority**: HIGH
**Estimated Time**: 2-3 days
