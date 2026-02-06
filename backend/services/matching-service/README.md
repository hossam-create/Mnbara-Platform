# Smart Matching Engine - API Documentation

## Overview

The Smart Matching Engine is an AI-powered matching system for the Mnbara e-commerce platform that intelligently matches buyer requests with seller/traveler offers using multiple algorithms:

- **Hyper-Matching Algorithm**: Weighted scoring with 6 factors (distance, price, rating, timing, trust, availability)
- **Collaborative Filtering**: User behavior-based recommendations
- **Content-Based Filtering**: Feature similarity matching
- **Hybrid Recommendations**: Combined approach for optimal results

## Architecture

```
backend/services/matching-service/
├── prisma/
│   └── schema.prisma              # Database models
├── src/
│   ├── app.module.ts             # Main module
│   ├── geo/
│   │   ├── geo.service.ts        # Geospatial queries (PostGIS)
│   │   └── geo.controller.ts
│   ├── matching/
│   │   ├── matching.service.ts    # Basic matching
│   │   └── hyper-matching.service.ts  # Advanced algorithm
│   └── recommendation/
│       ├── recommendation.service.ts  # Main recommendation entry
│       ├── recommendation.controller.ts
│       ├── recommendation.module.ts
│       └── algorithms/
│           ├── collaborative-filtering.service.ts
│           ├── content-based.service.ts
│           └── hybrid-recommendation.service.ts
└── package.json
```

## PostGIS Integration

### Geospatial Queries

The service uses PostGIS for efficient spatial queries with fallback to Haversine formula.

```typescript
// Find listings within radius
const listings = await geoService.findListingsWithinRadius(
  { lat: 30.0444, lon: 31.2357 }, // Cairo
  50 // km radius
);

// Update location with geometry
await geoService.updateListingLocation(listingId, lat, lon);
```

### Distance Calculation

Uses Haversine formula with PostGIS optimization:

```typescript
const distance = geoService.haversineDistance(
  lat1, lon1, lat2, lon2
); // Returns distance in km
```

## Hyper-Matching Algorithm

### Scoring Factors (0-100 scale)

| Factor | Weight (Default) | Description |
|--------|-----------------|-------------|
| Distance | 0.25 | Lower deviation = higher score |
| Price | 0.20 | Competitive pricing preferred |
| Rating | 0.20 | Higher traveler rating preferred |
| Timing | 0.15 | Optimal departure timing |
| Trust | 0.10 | KYC, verification, history |
| Availability | 0.10 | Capacity and schedule fit |

### Weight Configurations

```typescript
// Default (balanced)
const weights = hyperMatchingService.getWeightConfigurations().DEFAULT;

// Speed priority (urgent deliveries)
const weights = hyperMatchingService.getWeightConfigurations().SPEED_PRIORITY;

// Price priority (cost-sensitive)
const weights = hyperMatchingService.getWeightConfigurations().PRICE_PRIORITY;

// Trust priority (high-value items)
const weights = hyperMatchingService.getWeightConfigurations().TRUST_PRIORITY;

// Custom configuration
const customWeights = hyperMatchingService.createWeightConfig({
  distance: 0.35,
  price: 0.30,
});
```

### API Endpoints

#### Find Optimal Matches

```http
POST /matching/hyper-match
Content-Type: application/json

{
  "orderId": "order_123",
  "options": {
    "maxPickupRadiusKm": 100,
    "maxDeliveryRadiusKm": 100,
    "minScoreThreshold": 30,
    "maxResults": 20,
    "prioritizeSpeed": false
  }
}
```

Response:

```json
{
  "success": true,
  "totalCandidates": 50,
  "matchedCandidates": [
    {
      "orderId": "order_123",
      "tripId": "trip_456",
      "travelerId": "user_789",
      "totalScore": 85.5,
      "distanceScore": 92,
      "priceScore": 78,
      "ratingScore": 95,
      "timingScore": 88,
      "trustScore": 90,
      "availabilityScore": 70,
      "pickupDistanceKm": 12.5,
      "deliveryDistanceKm": 8.3,
      "estimatedCost": 45.00,
      "departureDate": "2026-02-15T10:00:00Z",
      "arrivalDate": "2026-02-17T18:00:00Z",
      "travelerRating": 4.8,
      "travelerTrustScore": 92,
      "priority": 65,
      "confidence": 0.85
    }
  ],
  "executionTime": 45,
  "algorithm": "HYPER_MATCH_V3",
  "weightConfig": {
    "distance": 0.25,
    "price": 0.20,
    "rating": 0.20,
    "timing": 15,
    "trust": 10,
    "availability": 10
  }
}
```

## Recommendation Engine

### Personalized Recommendations

```http
GET /recommendations/personalized/{userId}?limit=20
```

### Similar Listings

```http
GET /recommendations/similar/{userId}/{listingId}?limit=10
```

### Contextual Recommendations

```http
GET /recommendations/contextual/{userId}?lat=30.0444&lon=31.2357&timeOfDay=14&dayOfWeek=5
```

### Buyer-Seller Matching

```http
POST /recommendations/match
Content-Type: application/json

{
  "buyerId": "user_123",
  "request": {
    "categories": ["electronics", "clothing"],
    "priceRange": { "min": 50, "max": 200 },
    "locations": ["Cairo", "Alexandria"],
    "keywords": ["iPhone", "summer dress"]
  },
  "sellerOffers": [
    {
      "id": "offer_1",
      "title": "iPhone 14 Pro",
      "price": 150,
      "categoryId": 1,
      "city": "Cairo",
      "country": "Egypt",
      "sellerId": "seller_456"
    }
  ]
}
```

### Record Interaction

```http
POST /recommendations/interaction
Content-Type: application/json

{
  "userId": "user_123",
  "itemId": "listing_456",
  "interactionType": "VIEW"
}

{
  "userId": "user_123",
  "itemId": "listing_456",
  "interactionType": "RATING",
  "rating": 5
}
```

## Database Schema

### Core Models

```prisma
model MatchCandidate {
  id                String   @id @default(cuid())
  orderId           String
  tripId            String
  score             Float    // 0-100 AI matching score
  status            MatchStatus @default(PENDING)
  frictionSignals   Json?
  pickupDeviation   Float?
  dropoffDeviation  Float?
  scoreBreakdown    Json?    // Detailed score components
  confidenceScore   Float?
}

model UserBehavior {
  id              String   @id @default(cuid())
  userId          String
  userType        UserType @default(BUYER)
  eventType       String   // VIEW, SEARCH, BOOKING, CANCELLATION, RATING
  eventData       Json
  latitude        Float?
  longitude       Float?
  city            String?
  country         String?
  timestamp       DateTime @default(now())
}

model UserEmbedding {
  id              String   @id @default(cuid())
  userId          String   @unique
  embedding       Float[]  // 384-dim vector
  totalViews      Int      @default(0)
  totalBookings   Int      @default(0)
  pricePreference Float[]  // Price sensitivity bands
  categoryWeights Json?
  locationWeights Json?
}

model MatchWeightConfig {
  id              String   @id @default(cuid())
  name            String   @unique
  distanceWeight  Float    @default(0.25)
  priceWeight     Float    @default(0.20)
  ratingWeight    Float    @default(0.20)
  timingWeight    Float    @default(0.15)
  trustWeight     Float    @default(0.10)
  availabilityWeight Float @default(0.10)
}
```

## Weight Configuration API

```http
GET /matching/weights
```

Response:

```json
{
  "DEFAULT": {
    "distance": 0.25,
    "price": 0.20,
    "rating": 0.20,
    "timing": 0.15,
    "trust": 0.10,
    "availability": 0.10
  },
  "SPEED_PRIORITY": {
    "distance": 0.40,
    "price": 0.15,
    "rating": 0.15,
    "timing": 0.20,
    "trust": 0.05,
    "availability": 0.05
  },
  "PRICE_PRIORITY": {
    "distance": 0.15,
    "price": 0.40,
    "rating": 0.15,
    "timing": 0.10,
    "trust": 0.10,
    "availability": 0.10
  },
  "TRUST_PRIORITY": {
    "distance": 0.15,
    "price": 0.10,
    "rating": 0.15,
    "timing": 0.10,
    "trust": 0.40,
    "availability": 0.10
  }
}
```

## Integration with Other Services

### RabbitMQ Integration

The service publishes events for async processing:

```typescript
// Publish match found event
await channel.sendToQueue(
  'match-events',
  Buffer.from(JSON.stringify({
    event: 'MATCH_FOUND',
    orderId: 'order_123',
    matches: [...],
  }))
);
```

### Redis Caching

All recommendations are cached with TTL:

- Collaborative recommendations: 30 minutes
- Content-based recommendations: 2 hours
- Hybrid recommendations: 30 minutes
- Similar listings: 2 hours

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend/services/matching-service
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev
```

### 4. Start the Service

```bash
# Development
npm run dev

# Production
npm run build && npm run start:prod
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mnbara
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
```

## Performance Optimization

### Caching Strategy

- User behavior: Cached for 1 hour
- Recommendation results: Cached for 30 minutes
- Weight configurations: Cached indefinitely

### Query Optimization

- PostGIS indexes on location columns
- Composite indexes on frequently queried fields
- Connection pooling with Prisma

## Arabic Support

All interfaces support Arabic language:

```typescript
// Example response reasons in Arabic
const reasons = {
  similar_users: 'المستخدمون المشابهون أحبوا هذا العنصر',
  category_match: 'يتطابق مع فئتك المفضلة',
  price_match: 'السعر مناسب لميزانيتك',
  location_match: 'يتوفر في منطقتك',
};
```

## License

MIT
