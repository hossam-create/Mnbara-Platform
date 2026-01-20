# Design: eBay-Style Category & Products System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (web-app)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Categories  │  │ FeaturedCat │  │ CategoryPage        │  │
│  │ Component   │  │ Component   │  │ (with products)     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                    ┌─────▼─────┐                             │
│                    │ categoryAPI│                            │
│                    └─────┬─────┘                             │
└──────────────────────────┼───────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    └──────┬──────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│              Listing Service (Node.js)                       │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ category.routes │  │ category.ctrl   │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └────────────────────┘                             │
│                    │                                         │
│           ┌────────▼────────┐                               │
│           │ category.service│                               │
│           └────────┬────────┘                               │
│                    │                                         │
│           ┌────────▼────────┐                               │
│           │  Prisma Client  │                               │
│           └────────┬────────┘                               │
└────────────────────┼─────────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │  PostgreSQL │
              │  (categories│
              │   products) │
              └─────────────┘
```

## Database Design

### Category Table (Already in schema)
```prisma
model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  imageUrl    String?
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  displayOrder Int @default(0)
  isActive    Boolean @default(true)
  isFeatured  Boolean @default(false)
  products    Product[]
}
```

## API Design

### GET /api/categories
Returns hierarchical category tree.

```json
{
  "categories": [
    {
      "id": "clx...",
      "name": "Electronics",
      "slug": "electronics",
      "imageUrl": "https://...",
      "productCount": 500,
      "children": [
        {
          "id": "clx...",
          "name": "Cell Phones",
          "slug": "cell-phones",
          "productCount": 150,
          "children": [...]
        }
      ]
    }
  ]
}
```

### GET /api/categories/:slug
Returns category with products.

```json
{
  "category": {
    "id": "clx...",
    "name": "Electronics",
    "slug": "electronics",
    "breadcrumbs": [
      { "name": "Home", "slug": "/" },
      { "name": "Electronics", "slug": "electronics" }
    ]
  },
  "products": [...],
  "pagination": { "page": 1, "total": 500 }
}
```

## Frontend Components

### Categories.tsx (Updated)
```tsx
// Fetch from API instead of hardcoded
const { data: categories } = useQuery('categories', fetchCategories);
```

### categoryAPI.ts (New)
```tsx
export const fetchCategories = async () => {
  const response = await client.get('/api/categories');
  return response.data;
};
```

## Seed Data Strategy

### Category Seeding
1. Create 8 main categories
2. Create 40+ subcategories (5 per main)
3. Create 120+ sub-subcategories (3 per sub)

### Product Seeding
1. Generate 5000 products using faker
2. Distribute across categories proportionally
3. Mix of listing types (70% fixed, 30% auction)
4. Mix of conditions (60% new, 40% used)
5. Realistic pricing based on category

## Implementation Phases

### Phase 1: Backend API
- [ ] Create category routes
- [ ] Create category controller
- [ ] Create category service
- [ ] Add product count aggregation

### Phase 2: Seed Data
- [ ] Create comprehensive seed script
- [ ] Seed 200+ categories
- [ ] Seed 5000+ products

### Phase 3: Frontend Integration
- [ ] Create categoryAPI service
- [ ] Update Categories component
- [ ] Update FeaturedCategories component
- [ ] Add category breadcrumbs
