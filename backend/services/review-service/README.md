# Review & Rating Service

Comprehensive review and rating system for products and sellers with helpful voting and reporting.

## Features

### Product Reviews
- ⭐ 1-5 star ratings
- 📝 Title and detailed comments
- 🖼️ Image attachments
- ✅ Verified purchase badges
- 👍 Helpful voting system
- 🚩 Review reporting
- 📊 Rating distribution analytics

### Seller Ratings
- ⭐ Overall seller rating (1-5)
- 📊 Category-based ratings:
  - Communication
  - Shipping speed
  - Product quality
- 💬 Optional comments
- 📈 Seller performance analytics

### Advanced Features
- One review per order (prevents spam)
- Helpful vote tracking
- Rating distribution visualization
- Product rating summaries
- Seller performance metrics
- Pagination and filtering
- Multiple sort options

## API Endpoints

### Product Reviews

#### Create Review
```http
POST /api/reviews
Headers: x-user-id: {userId}
Body: {
  "productId": "prod123",
  "orderId": "order456",
  "rating": 5,
  "title": "Great product!",
  "comment": "Exactly as described",
  "images": ["url1", "url2"],
  "verified": true
}
```

#### Get Reviews
```http
GET /api/reviews?productId=prod123&sortBy=helpful&page=1&limit=10
Query params:
  - productId: Filter by product
  - userId: Filter by user
  - rating: Filter by rating (1-5)
  - verified: Filter verified reviews
  - sortBy: recent|helpful|rating_high|rating_low
  - page: Page number
  - limit: Items per page
```

#### Get Single Review
```http
GET /api/reviews/:id
```

#### Update Review
```http
PUT /api/reviews/:id
Headers: x-user-id: {userId}
Body: {
  "rating": 4,
  "comment": "Updated review"
}
```

#### Delete Review
```http
DELETE /api/reviews/:id
Headers: x-user-id: {userId}
```

#### Vote Helpful
```http
POST /api/reviews/:id/vote
Headers: x-user-id: {userId}
Body: {
  "helpful": true
}
```

#### Report Review
```http
POST /api/reviews/:id/report
Headers: x-user-id: {userId}
```

#### Get Product Rating Summary
```http
GET /api/reviews/product/:productId/summary
Response: {
  "averageRating": 4.5,
  "totalReviews": 120,
  "ratingDistribution": {
    "1": 2,
    "2": 5,
    "3": 15,
    "4": 38,
    "5": 60
  }
}
```

#### Get User's Review for Product
```http
GET /api/reviews/product/:productId/user
Headers: x-user-id: {userId}
```

### Seller Ratings

#### Create Seller Rating
```http
POST /api/seller-ratings
Headers: x-user-id: {buyerId}
Body: {
  "sellerId": "seller123",
  "orderId": "order456",
  "rating": 5,
  "categories": {
    "communication": 5,
    "shipping": 4,
    "quality": 5
  },
  "comment": "Great seller!"
}
```

#### Get Seller Ratings
```http
GET /api/seller-ratings/seller/:sellerId?page=1&limit=10
```

#### Get Seller Rating Summary
```http
GET /api/seller-ratings/seller/:sellerId/summary
Response: {
  "averageRating": 4.7,
  "totalRatings": 85,
  "categoryAverages": {
    "communication": 4.8,
    "shipping": 4.5,
    "quality": 4.9
  }
}
```

#### Get Buyer's Rating for Seller
```http
GET /api/seller-ratings/seller/:sellerId/buyer
Headers: x-user-id: {buyerId}
```

## Database Schema

### Review Model
- id: Unique identifier
- productId: Product being reviewed
- userId: Reviewer
- orderId: Order (unique - one review per order)
- rating: 1-5 stars
- title: Optional review title
- comment: Review text
- images: Array of image URLs
- verified: Verified purchase badge
- helpful: Helpful vote count
- reported: Flagged for moderation
- createdAt/updatedAt: Timestamps

### ReviewVote Model
- id: Unique identifier
- reviewId: Review being voted on
- userId: Voter
- helpful: true/false
- createdAt: Timestamp
- Unique constraint: (reviewId, userId)

### SellerRating Model
- id: Unique identifier
- sellerId: Seller being rated
- buyerId: Buyer rating the seller
- orderId: Order (unique)
- rating: Overall 1-5 rating
- categories: JSON with category ratings
- comment: Optional comment
- createdAt: Timestamp

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database URL
```

3. Run migrations:
```bash
npm run migrate
```

4. Start service:
```bash
npm run dev
```

## Integration Examples

### Frontend - Display Product Reviews
```typescript
// Get product reviews
const { reviews, pagination } = await fetch(
  `/api/reviews?productId=${productId}&sortBy=helpful&page=1`
).then(r => r.json());

// Display rating summary
const summary = await fetch(
  `/api/reviews/product/${productId}/summary`
).then(r => r.json());

console.log(`${summary.averageRating} stars (${summary.totalReviews} reviews)`);
```

### Frontend - Submit Review
```typescript
// After order completion
await fetch('/api/reviews', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId
  },
  body: JSON.stringify({
    productId,
    orderId,
    rating: 5,
    title: 'Excellent!',
    comment: 'Highly recommend',
    images: uploadedImageUrls
  })
});
```

### Frontend - Rate Seller
```typescript
// After order completion
await fetch('/api/seller-ratings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': buyerId
  },
  body: JSON.stringify({
    sellerId,
    orderId,
    rating: 5,
    categories: {
      communication: 5,
      shipping: 4,
      quality: 5
    },
    comment: 'Fast shipping!'
  })
});
```

## Port

**3024** - Review Service

## Tech Stack

- Express.js
- Prisma ORM
- PostgreSQL
- TypeScript
- Winston (logging)

## Security Features

- User authorization checks
- One review per order validation
- Rating range validation (1-5)
- Report flagging system
- Duplicate vote prevention

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: February 4, 2026
