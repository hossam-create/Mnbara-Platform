# SET-001: Traveler Matching Service

## Overview
Automatic recommendation system for matching travelers to shopper requests based on country match, date proximity, and trust score.

## Implementation Summary

### Database Changes
- **Added `destinationCountry` field to `ShopperRequest`**
  - Migration: `prisma/migrations/20250114_add_destination_country/migration.sql`
  - Indexed for fast queries

### Matching Service (`src/services/matching.service.ts`)
- **Rule-based scoring algorithm** (no ML)
- **Deterministic**: Same inputs → same order
- **Score Components** (total 0-100):
  1. **Source Country Match** (0-20 points)
     - Traveler must be in source country OR have availability from source country
  2. **Destination Country Match** (0-20 points)
     - Traveler must have availability to destination country
  3. **Date Proximity** (0-30 points)
     - Based on how close traveler's departure date is to request date
     - Formula: `30 * (1 - daysDiff / maxDateProximityDays)`
     - Default max proximity: 30 days
  4. **Trust Score** (0-30 points)
     - Normalized from User.rating (0-5) to (0-30)
     - Formula: `(rating / 5) * 30`

### Matching Logic
1. **Filters travelers**:
   - Role = TRAVELER
   - Excludes travelers who already made offers on the request
   - Requires active availability

2. **Calculates score** for each traveler:
   - Checks source country match (location or availability origin)
   - Checks destination country match (availability destination)
   - Finds best matching availability by date proximity
   - Normalizes trust score from rating

3. **Ranks and returns**:
   - Sorted by total score (descending)
   - Returns top N (default 5, configurable)

### API Endpoints

#### `GET /api/matching/suggestions/:requestId`
Get suggested travelers for a shopper request.

**Query Parameters:**
- `topN` (optional): Number of top travelers to return (default: 5)
- `maxDateProximityDays` (optional): Maximum days for date proximity scoring (default: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "travelerId": 2,
      "travelerName": "John Doe",
      "travelerEmail": "john@example.com",
      "totalScore": 85.5,
      "scoreBreakdown": {
        "sourceCountryMatch": 20,
        "destinationCountryMatch": 20,
        "dateProximity": 25.5,
        "trustScore": 30
      },
      "bestAvailability": {
        "origin": "USA",
        "destination": "UAE",
        "departTime": "2025-02-01T00:00:00Z",
        "arriveTime": "2025-02-05T00:00:00Z"
      }
    }
  ],
  "count": 1
}
```

### Configuration
Matching behavior can be customized via `MatchingConfig`:
- `topN`: Number of suggestions (default: 5)
- `countryMatchWeight`: Total weight for country matching (default: 40)
- `dateProximityWeight`: Weight for date proximity (default: 30)
- `trustScoreWeight`: Weight for trust score (default: 30)
- `maxDateProximityDays`: Maximum days for date scoring (default: 30)

### Score Breakdown Storage
Each match includes a detailed `scoreBreakdown` object explaining:
- Why the traveler was matched
- How each component contributed to the total score
- Best matching availability (if found)

### Deterministic Behavior
- Same request + same travelers → same order
- No randomness in scoring
- Consistent ranking for reproducible results

### Updates
Matching suggestions update when:
- New traveler travel dates added (via `TravelerAvailability`)
- Trust score changes (via `User.rating`)
- Request status changes (excludes travelers who already made offers)

### Integration Points
- **ShopperRequestService**: Updated to accept `destinationCountry` on creation
- **ShopperRequestController**: Updated to pass `destinationCountry` from request body
- **MatchingService**: Standalone service, no dependencies on other services

## Testing

### Test Coverage
- ✅ Travelers ranked correctly by score
- ✅ Travelers outside country/date excluded
- ✅ Trust score affects ranking
- ✅ Top N limit enforced
- ✅ Excludes travelers with existing offers
- ✅ Error handling for missing request/countries

### Running Tests
```bash
cd backend/services/crowdship-service
npm test
```

## Usage Example

```typescript
import { MatchingService } from './services/matching.service';

const matchingService = new MatchingService();

// Get top 5 suggestions
const suggestions = await matchingService.getSuggestedTravelers(123);

// Get top 10 with custom date proximity
const customSuggestions = await matchingService.getSuggestedTravelers(123, {
  topN: 10,
  maxDateProximityDays: 60,
});
```

## Future Enhancements
- Weight customization per request type
- Historical performance metrics (completion rate, on-time delivery)
- Category matching (if product category matches traveler's allowed categories)
- Weight/volume capacity matching
- Real-time updates via WebSocket when new travelers become available





