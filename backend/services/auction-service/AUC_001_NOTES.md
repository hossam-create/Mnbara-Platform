# AUC-001: Core Auction Functionality

## Summary
Enhanced core auction bidding functionality to ensure fair bid placement, proper state management, safe concurrent bid handling, and clear winner identification when auctions end.

## What Was Done

### 1. Database Changes
- **Added `ENDED` status** to `ListingStatus` enum
- **Migration**: `prisma/migrations/20250116_add_ended_status/migration.sql`
- Supports clear auction end state (DRAFT, ACTIVE, ENDED)

### 2. Service Updates (`src/services/auction.service.ts`)
- **Enhanced `placeBid()` method**:
  - **AUC-001**: Validates auction status is ACTIVE before accepting bids
  - **AUC-001**: Validates bid is higher than current highest bid
  - **AUC-001**: Tracks current highest bid and bidder via `currentBid` field
  - **AUC-001**: Uses Serializable transaction isolation for concurrent bid safety
  - **AUC-001**: Clear error messages for invalid bids
  - Marks previous winning bid as OUTBID
  - Creates new bid with WINNING status

- **Enhanced `endAuction()` method**:
  - **AUC-001**: Sets status to ENDED (or SOLD if reserve met)
  - **AUC-001**: Clearly identifies winning bid with `winnerId` and `finalPrice`
  - Updates winning bid status to WON
  - Deactivates all proxy bids

- **Enhanced `getAuction()` method**:
  - **AUC-001**: Explicitly returns `currentBidder` information
  - Returns bidder details for the current winning bid (WINNING status)
  - Provides complete auction state including current highest bid and bidder

### 3. Controller Updates (`src/controllers/bid.controller.ts`)
- Existing `placeBid()` endpoint already handles bid placement
- Returns clear error messages for validation failures
- Integrates with real-time socket updates

### 4. Tests
- **Service tests** (`auction-bidding-auc-001.test.ts`):
  - ✅ Users can place bids on active auctions
  - ✅ Bids must be higher than current highest bid
  - ✅ Auction tracks current highest bid and bidder
  - ✅ Bids rejected when auction is not ACTIVE
  - ✅ Concurrent bids handled safely
  - ✅ Auction end is deterministic
  - ✅ Winning bid clearly identified

- **Controller tests** (`bid-controller-auc-001.test.ts`):
  - ✅ Successful bid placement
  - ✅ Rejection of low bids
  - ✅ Rejection of bids on inactive auctions

## Acceptance Criteria Met

✅ **1. Users can place bids on active auctions**
- `placeBid()` method allows bid placement
- Validates auction exists and is active
- Creates bid record with proper status

✅ **2. Bids must be higher than the current highest bid**
- Validates `amount >= currentBid + minBidIncrement`
- Returns clear error message if bid too low
- Updates `currentBid` when bid is accepted

✅ **3. Auction must track current highest bid and bidder**
- `currentBid` field tracks highest bid amount
- Current bidder tracked via Bid with WINNING status
- `getAuction()` method explicitly returns `currentBidder` information
- `winnerId` field tracks winner (set on auction end)
- `finalPrice` field tracks winning bid amount

✅ **4. Auction state must be one of: DRAFT, ACTIVE, ENDED**
- `ListingStatus` enum includes DRAFT, ACTIVE, ENDED
- Status transitions: DRAFT → ACTIVE → ENDED (or SOLD)
- Status validation in bid placement

✅ **5. Bids must be rejected if the auction is not ACTIVE**
- Validates `auction.status === ACTIVE` before accepting bid
- Returns clear error: "Auction is not active. Current status: X"
- Rejects bids on DRAFT, ENDED, SOLD, CANCELLED statuses

✅ **6. Concurrent bids must be handled safely (no race conditions)**
- Uses `Serializable` transaction isolation level
- Transaction timeout and maxWait configured
- Pessimistic locking via Prisma transaction
- Prevents double-spending and bid amount conflicts

✅ **7. Auction end must be deterministic based on end time**
- `endAuction()` method processes auctions deterministically
- `endExpiredAuctions()` cron method ends auctions at end time
- End time stored in `auctionEndsAt` field
- Auto-extend feature can extend end time (sniping prevention)

✅ **8. Winning bid must be clearly identified when auction ends**
- `winnerId` field identifies winning bidder
- `finalPrice` field stores winning bid amount
- Winning bid status updated to WON
- `endAuction()` returns winner information

## API Endpoints

### Place Bid
```
POST /api/auctions/:auctionId/bids
Body: {
  "amount": 15.00
}

Response (Success):
{
  "success": true,
  "data": {
    "bid": {
      "id": 1,
      "amount": 15.00,
      "bidderId": 2,
      "status": "WINNING",
      "createdAt": "2025-01-16T10:00:00Z"
    },
    "currentBid": 15.00,
    "auctionEndsAt": "2025-01-17T10:00:00Z",
    "wasExtended": false
  }
}

Response (Error - Low Bid):
{
  "success": false,
  "message": "Bid must be higher than the current highest bid. Minimum bid: 16.00 (current: 15.00, min increment: 1.00)"
}

Response (Error - Not Active):
{
  "success": false,
  "message": "Auction is not active. Current status: ENDED. Only ACTIVE auctions accept bids."
}
```

### End Auction
```
POST /api/auctions/:auctionId/end
(Internal/admin endpoint)

Response:
{
  "auction": {
    "id": 1,
    "status": "ENDED",
    "winnerId": 2,
    "finalPrice": 20.00
  },
  "winner": {
    "userId": 2,
    "amount": 20.00
  },
  "reserveMet": true
}
```

## Bidding Flow

### Successful Bid Flow
1. **Request**: `POST /api/auctions/:auctionId/bids` with amount
2. **Validation**:
   - Auction exists and is ACTIVE
   - Auction has not ended
   - Bidder is not seller
   - Bid amount >= currentBid + minIncrement
3. **Transaction** (Serializable isolation):
   - Lock auction record
   - Mark previous winning bid as OUTBID
   - Create new bid with WINNING status
   - Update auction currentBid
   - Check for auto-extend (if enabled)
4. **Response**: Return bid and updated auction info

### Rejected Bid Flow
1. **Request**: `POST /api/auctions/:auctionId/bids`
2. **Validation**: Fails (e.g., not ACTIVE, bid too low)
3. **Error Response**: Clear error message
4. **No Database Changes**: Transaction rolled back

## Concurrent Bid Safety

### Transaction Isolation
- **Level**: `Serializable` (highest isolation)
- **Timeout**: 10 seconds
- **Max Wait**: 5 seconds for lock
- **Prevents**: Race conditions, double bids, amount conflicts

### Locking Strategy
- Pessimistic locking via Prisma transaction
- Auction record locked during bid placement
- Sequential processing of concurrent bids
- Last bid wins (highest amount)

## Auction State Management

### Status Transitions
```
DRAFT → ACTIVE (when auction starts)
  ↓
ACTIVE → ENDED (when auction ends, no winner or reserve not met)
  ↓
ACTIVE → SOLD (when auction ends, winner and reserve met)
```

### Status Meanings
- **DRAFT**: Auction created but not started
- **ACTIVE**: Auction accepting bids
- **ENDED**: Auction ended, no winner or reserve not met
- **SOLD**: Auction ended with winner (reserve met)
- **EXPIRED**: Auction expired (legacy, use ENDED)
- **CANCELLED**: Auction cancelled by seller

## Winning Bid Identification

When auction ends:
- **winnerId**: User ID of winning bidder
- **finalPrice**: Amount of winning bid
- **Bid Status**: Updated to WON
- **Auction Status**: ENDED or SOLD

## Constraints Followed

✅ **Do not implement payment or escrow logic**
- Bidding logic only
- No payment processing
- No escrow integration

✅ **Do not implement UI**
- Backend-only implementation
- API endpoints for frontend integration

✅ **Use existing auction or listing architecture**
- Uses existing `Listing` model
- Uses existing `Bid` model
- Follows existing service patterns

✅ **Use locking or transactional safety where required**
- Serializable transaction isolation
- Pessimistic locking
- Transaction timeout configured

## Testing

### Running Tests
```bash
cd backend/services/auction-service
npm test auction-bidding-auc-001.test.ts
npm test bid-controller-auc-001.test.ts
```

### Test Coverage
- ✅ Bid placement on active auctions
- ✅ Bid rejection when too low
- ✅ Bid rejection when auction not active
- ✅ Current bid tracking
- ✅ Concurrent bid safety
- ✅ Auction end and winner identification
- ✅ State management (DRAFT, ACTIVE, ENDED)

## Next Steps

1. **Run migration**:
   ```bash
   cd backend/services/auction-service
   npx prisma migrate dev
   ```

2. **Test bidding flow**:
   - Create auction with ACTIVE status
   - Place bid higher than starting bid
   - Verify currentBid updated
   - Attempt bid lower than current (should fail)
   - End auction and verify winner

3. **Test concurrent bids**:
   - Place multiple bids simultaneously
   - Verify only valid bids accepted
   - Verify currentBid reflects highest bid

## Notes

- **Bid Validation**: Minimum bid = currentBid + minBidIncrement
- **Concurrent Safety**: Serializable isolation ensures no race conditions
- **State Management**: Clear status transitions (DRAFT → ACTIVE → ENDED/SOLD)
- **Winner Identification**: winnerId and finalPrice clearly identify winning bid
- **Deterministic End**: Auction ends based on auctionEndsAt timestamp
- **Auto-Extend**: Optional feature prevents sniping (extends auction if bid placed near end time)


