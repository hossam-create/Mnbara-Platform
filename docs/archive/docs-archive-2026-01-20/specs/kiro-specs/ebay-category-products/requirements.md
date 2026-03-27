# eBay-Style Category & Products System

## Overview
تنظيم هيكل الـ categories والـ products على طريقة eBay مع 5000+ منتج موزعين على categories هرمية.

## User Stories

### US-1: Hierarchical Category Structure
**As a** buyer  
**I want** to browse products through organized hierarchical categories  
**So that** I can easily find what I'm looking for

**Acceptance Criteria:**
- [ ] Categories fetched from database (not hardcoded)
- [ ] Support for parent/child category relationships (3 levels deep)
- [ ] Each category shows product count
- [ ] Categories display with images and icons
- [ ] Featured categories highlighted on homepage

### US-2: eBay-Style Category Tree
**As a** buyer  
**I want** to see main categories with subcategories  
**So that** I can drill down to specific product types

**Acceptance Criteria:**
- [ ] Main categories: Electronics, Fashion, Home & Garden, Sports, Collectibles, Motors, Toys, Business & Industrial
- [ ] Each main category has 5-10 subcategories
- [ ] Each subcategory has 3-5 sub-subcategories
- [ ] Total ~200 leaf categories

### US-3: Product Catalog with 5000+ Items
**As a** buyer  
**I want** to browse a large catalog of products  
**So that** I have variety and choice

**Acceptance Criteria:**
- [ ] Minimum 5000 products seeded in database
- [ ] Products distributed across all categories
- [ ] Mix of auction and fixed-price listings
- [ ] Various conditions (new, used, refurbished)
- [ ] Realistic pricing and descriptions

### US-4: Category-Based Filtering
**As a** buyer  
**I want** to filter products by category attributes  
**So that** I can narrow down my search

**Acceptance Criteria:**
- [ ] Category-specific attributes (Brand, Size, Color, etc.)
- [ ] Filterable attributes in search results
- [ ] Attribute values populated from products

## Technical Requirements

### Database Schema (Already Exists)
- Category model with hierarchical structure ✅
- CategoryAttribute for item specifics ✅
- Product model with full eBay features ✅

### API Endpoints Needed
- `GET /api/categories` - List all categories with hierarchy
- `GET /api/categories/:slug` - Get category with products
- `GET /api/categories/:slug/attributes` - Get category attributes

### Frontend Integration
- Replace hardcoded categories with API calls
- Dynamic category navigation
- Category breadcrumbs

## Category Structure (eBay-Style)

```
Electronics (500 products)
├── Cell Phones & Accessories (150)
│   ├── Cell Phones & Smartphones (80)
│   ├── Cases & Covers (40)
│   └── Chargers & Cables (30)
├── Computers & Tablets (200)
│   ├── Laptops & Netbooks (100)
│   ├── Tablets & eReaders (50)
│   └── Computer Components (50)
└── Cameras & Photo (150)
    ├── Digital Cameras (80)
    ├── Lenses & Filters (40)
    └── Camera Accessories (30)

Fashion (800 products)
├── Men's Clothing (300)
├── Women's Clothing (350)
└── Shoes & Accessories (150)

Home & Garden (600 products)
├── Furniture (200)
├── Kitchen & Dining (200)
└── Home Décor (200)

Sports & Outdoors (400 products)
├── Exercise & Fitness (150)
├── Outdoor Recreation (150)
└── Team Sports (100)

Collectibles & Art (300 products)
├── Collectibles (150)
├── Art (100)
└── Antiques (50)

Motors (200 products)
├── Car Parts (100)
├── Motorcycle Parts (50)
└── Automotive Tools (50)

Toys & Hobbies (400 products)
├── Action Figures (150)
├── Building Toys (150)
└── Games (100)

Business & Industrial (300 products)
├── Office Equipment (150)
├── Industrial Equipment (100)
└── Restaurant & Food Service (50)
```

## Priority
High - Core marketplace functionality

## Dependencies
- Prisma schema (exists)
- Listing service (exists)
- Frontend web-app (exists)
