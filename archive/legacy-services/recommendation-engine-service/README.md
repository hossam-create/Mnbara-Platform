# Recommendation Engine Service

Advanced recommendation engine with collaborative filtering, content-based filtering, and ML algorithms.

## Features

- ✅ Personalized recommendations
- ✅ Collaborative filtering
- ✅ Content-based filtering
- ✅ Similar products
- ✅ Trending products
- ✅ Frequently bought together
- ✅ User profiling
- ✅ Interaction tracking

## Quick Start

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

## API Endpoints

### Get Personalized Recommendations
```bash
GET /api/recommendations/users/:userId?limit=10&excludeViewed=true
```

### Get Similar Products
```bash
GET /api/recommendations/products/:productId/similar?limit=10
```

### Get Trending Products
```bash
GET /api/recommendations/trending?category=Electronics&limit=10&timeWindow=7
```

### Get Frequently Bought Together
```bash
GET /api/recommendations/products/:productId/bought-together?limit=5
```

### Track Interaction
```bash
POST /api/recommendations/interactions
{
  "userId": "user-123",
  "productId": "prod-456",
  "type": "VIEW",
  "metadata": { "source": "homepage" }
}
```

### Get User Profile
```bash
GET /api/recommendations/users/:userId/profile
```

## Usage Examples

### Personalized Homepage
```javascript
const { recommendations } = await fetch(
  `http://localhost:3020/api/recommendations/users/${userId}?limit=20`
).then(r => r.json());

// Display personalized products
displayProducts(recommendations);
```

### Product Page - Similar Items
```javascript
const { recommendations } = await fetch(
  `http://localhost:3020/api/recommendations/products/${productId}/similar?limit=6`
).then(r => r.json());

// Show "You may also like"
displaySimilarProducts(recommendations);
```

### Track User Behavior
```javascript
// Track product view
await fetch('http://localhost:3020/api/recommendations/interactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id,
    productId: product.id,
    type: 'VIEW'
  })
});

// Track purchase
await fetch('http://localhost:3020/api/recommendations/interactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUser.id,
    productId: product.id,
    type: 'PURCHASE',
    metadata: { price: product.price, quantity: 1 }
  })
});
```

## Algorithms

### Collaborative Filtering
- User-based: Find similar users and recommend their liked products
- Item-based: Find similar items based on user interactions

### Content-Based Filtering
- Product attributes (category, brand, price range)
- User preferences and history

### Hybrid Approach
- Combines collaborative and content-based
- Weighted scoring system

## Port

3020

## Integration

Works with:
- Product Service (product data)
- User Service (user profiles)
- Order Service (purchase history)
- Analytics Service (behavior tracking)
