# PHASE 5.0 — AUCTIONS FOUNDATION

**Status**: ✅ IMPLEMENTATION IN PROGRESS  
**Date**: 2026-01-08  
**Objective**: Build eBay-style auction foundation with ZERO payment integration

---

## 🎯 SCOPE

### IN SCOPE
- ✅ Auction entity (startPrice, reservePrice, endAt)
- ✅ Bid append-only table
- ✅ Auction lifecycle state machine (DRAFT → SCHEDULED → ACTIVE → ENDED)
- ✅ Server-side bid validation (time windows, min increment)
- ✅ UI: Auction detail page + bid history
- ✅ Real-time bid updates (Socket.IO)
- ✅ Anti-sniping (auto-extend)

### OUT OF SCOPE (Phase 5.1+)
- ❌ Payment processing
- ❌ Wallet debits
- ❌ Escrow execution
- ❌ Winner settlement
- ❌ Automatic payment capture

---

## 📊 DATABASE SCHEMA

### Auction Model
```prisma
model Auction {
  id              String          @id @default(uuid())
  
  // Basic info
  title           String
  description     String          @db.Text
  sellerId        String          // Reference to user service
  
  // Pricing (stored as integers - minor units)
  startingBid     BigInt          // e.g., 10000 = 100.00 EGP
  reservePrice    BigInt?         // Minimum acceptable price
  buyNowPrice     BigInt?         // Instant purchase price
  currentBid      BigInt          @default(0)
  
  currency        String          @default("EGP") @db.Char(3)
  
  // Timing
  startsAt        DateTime
  endsAt          DateTime
  originalEndsAt  DateTime        // Before any extensions
  
  // Anti-sniping
  autoExtendEnabled     Boolean   @default(true)
  autoExtendThresholdMs Int       @default(120000)  // 2 minutes
  autoExtendDurationMs  Int       @default(120000)  // Extend by 2 minutes
  maxExtensions         Int       @default(10)
  extensionCount        Int       @default(0)
  
  // Bid rules
  minBidIncrement BigInt          @default(100)  // 1.00 EGP
  
  // Lifecycle
  status          AuctionStatus   @default(DRAFT)
  
  // Winner (determined at ENDED state)
  winnerId        String?
  finalPrice      BigInt?
  
  // Relations
  bids            Bid[]
  extensions      AuctionExtension[]
  
  // Audit
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  @@index([status])
  @@index([endsAt])
  @@index([sellerId])
  @@map("auction")
}

enum AuctionStatus {
  DRAFT       // Created, not yet published
  SCHEDULED   // Published, waiting for start time
  ACTIVE      // Live, accepting bids
  ENDED       // Time expired, winner determined
  CANCELLED   // Cancelled by seller
  
  @@map("auction_status")
}
```

### Bid Model (Append-Only)
```prisma
model Bid {
  id          String      @id @default(uuid())
  
  auctionId   String
  auction     Auction     @relation(fields: [auctionId], references: [id])
  
  bidderId    String      // Reference to user service
  amount      BigInt      // Minor units
  
  // Bid context
  isAutoBid   Boolean     @default(false)  // Future: proxy bidding
  triggeredExtension Boolean @default(false)
  
  // Status tracking
  status      BidStatus   @default(ACTIVE)
  
  // Immutable timestamp
  createdAt   DateTime    @default(now())
  
  // NO updatedAt - bids are immutable
  
  @@index([auctionId, createdAt(sort: Desc)])
  @@index([bidderId])
  @@index([status])
  @@map("bid")
}

enum BidStatus {
  ACTIVE      // Current highest bid
  OUTBID      // Outbid by another user
  WINNING     // Auction ended, this bid won
  CANCELLED   // Bid cancelled (rare, admin only)
  
  @@map("bid_status")
}
```

### Extension Tracking
```prisma
model AuctionExtension {
  id              String      @id @default(uuid())
  
  auctionId       String
  auction         Auction     @relation(fields: [auctionId], references: [id])
  
  previousEndTime DateTime
  newEndTime      DateTime
  extensionMs     Int
  extensionNumber Int         // 1st, 2nd, 3rd extension
  
  triggeredByBidId String?    // Which bid caused this
  
  createdAt       DateTime    @default(now())
  
  @@index([auctionId])
  @@map("auction_extension")
}
```

---

## 🔒 ABSOLUTE RULES

### 1. NO PAYMENT INTEGRATION
```typescript
// ❌ FORBIDDEN
async function placeBid(auctionId, bidderId, amount) {
  const bid = await createBid(auctionId, bidderId, amount);
  await walletService.debit(bidderId, amount); // ❌ NO!
  return bid;
}

// ✅ CORRECT
async function placeBid(auctionId, bidderId, amount) {
  // Validate bid
  // Create bid record
  // Update auction state
  // Return bid
  // NO wallet interaction
}
```

### 2. Bids Are Append-Only
```typescript
// ❌ FORBIDDEN
await prisma.bid.update({ 
  where: { id: bidId }, 
  data: { amount: newAmount } 
});

// ✅ CORRECT
// Bids are NEVER updated
// Only status changes (ACTIVE → OUTBID)
```

### 3. UI Is Read-Only After Bid Submit
```typescript
// User submits bid
const result = await placeBid(auctionId, userId, amount);

// ✅ UI shows:
// - "Bid placed successfully"
// - Current bid amount
// - Bid history
// - Time remaining

// ❌ UI does NOT show:
// - "Processing payment..."
// - "Charging your wallet..."
// - Any payment-related messaging
```

### 4. Winner Determination ≠ Payment
```typescript
async function endAuction(auctionId) {
  const auction = await getAuction(auctionId);
  const highestBid = await getHighestBid(auctionId);
  
  await prisma.auction.update({
    where: { id: auctionId },
    data: {
      status: 'ENDED',
      winnerId: highestBid.bidderId,
      finalPrice: highestBid.amount
    }
  });
  
  // ❌ NO payment processing here
  // Phase 5.1 will handle settlement separately
}
```

---

## 🎨 UI COMPONENTS

### 1. Auction Detail Page
**Path**: `/auctions/:id`

**Components**:
- Auction header (title, seller, status badge)
- Image gallery
- Current bid display (large, prominent)
- Time remaining countdown
- Bid form (amount input + submit)
- Bid history table
- Auto-extend indicator

**States**:
- `DRAFT`: "This auction hasn't started yet"
- `SCHEDULED`: "Auction starts in [countdown]"
- `ACTIVE`: Full bidding interface
- `ENDED`: "Auction ended. Winner: [name]"

### 2. Bid History Component
**Display**:
- Bidder name (anonymized: "User ***123")
- Bid amount
- Timestamp
- Status badge (ACTIVE, OUTBID, WINNING)

**Pagination**: 20 bids per page

### 3. Countdown Timer
**Updates**: Every 1 second
**Display**:
- `> 1 day`: "2d 5h 23m"
- `< 1 day`: "5h 23m 15s"
- `< 2 min`: **RED** "1m 45s" (ending soon)
- `0`: "Auction ended"

### 4. Bid Form
**Validation**:
- Amount >= currentBid + minBidIncrement
- Auction status === ACTIVE
- Current time < endsAt
- User is authenticated
- User is not the seller

**Submission**:
```typescript
async function handleBidSubmit(amount: number) {
  try {
    const result = await auctionService.placeBid(auctionId, userId, amount);
    
    if (result.success) {
      toast.success('Bid placed successfully!');
      // UI updates via Socket.IO
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    toast.error('Failed to place bid');
  }
}
```

---

## 🔄 AUCTION LIFECYCLE

```
DRAFT
  ↓ (seller publishes)
SCHEDULED
  ↓ (startsAt reached)
ACTIVE
  ↓ (endsAt reached OR seller cancels)
ENDED / CANCELLED
```

### State Transitions

#### DRAFT → SCHEDULED
- **Trigger**: Seller publishes auction
- **Validation**:
  - startsAt > now
  - endsAt > startsAt
  - startingBid > 0
  - All required fields present

#### SCHEDULED → ACTIVE
- **Trigger**: Cron job checks `startsAt`
- **Action**: Update status to ACTIVE
- **Notification**: Notify watchers

#### ACTIVE → ENDED
- **Trigger**: Cron job checks `endsAt`
- **Action**:
  - Update status to ENDED
  - Set winnerId (highest bidder)
  - Set finalPrice (highest bid amount)
  - Update all bids: ACTIVE → OUTBID (except winner: ACTIVE → WINNING)

#### ACTIVE → CANCELLED
- **Trigger**: Seller cancels (admin only if bids exist)
- **Action**:
  - Update status to CANCELLED
  - Update all bids: ACTIVE → CANCELLED

---

## 🚀 API ENDPOINTS

### GET /auctions/:id
**Response**:
```json
{
  "id": "uuid",
  "title": "Vintage Camera",
  "description": "...",
  "sellerId": "user-123",
  "startingBid": 10000,
  "currentBid": 15000,
  "reservePrice": 20000,
  "currency": "EGP",
  "startsAt": "2026-01-10T10:00:00Z",
  "endsAt": "2026-01-15T18:00:00Z",
  "status": "ACTIVE",
  "winnerId": null,
  "finalPrice": null,
  "minBidIncrement": 100,
  "autoExtendEnabled": true,
  "extensionCount": 2,
  "bidCount": 12,
  "timeRemainingMs": 345600000
}
```

### POST /auctions/:id/bids
**Request**:
```json
{
  "amount": 15100
}
```

**Response**:
```json
{
  "success": true,
  "bid": {
    "id": "uuid",
    "auctionId": "uuid",
    "bidderId": "user-123",
    "amount": 15100,
    "status": "ACTIVE",
    "createdAt": "2026-01-08T12:34:56Z"
  },
  "auction": {
    "currentBid": 15100,
    "endsAt": "2026-01-15T18:02:00Z"
  },
  "wasExtended": true,
  "extensionInfo": {
    "previousEndTime": "2026-01-15T18:00:00Z",
    "newEndTime": "2026-01-15T18:02:00Z",
    "extensionNumber": 3
  }
}
```

### GET /auctions/:id/bids
**Response**:
```json
{
  "bids": [
    {
      "id": "uuid",
      "bidderId": "user-***",
      "amount": 15100,
      "status": "ACTIVE",
      "createdAt": "2026-01-08T12:34:56Z"
    }
  ],
  "totalCount": 12,
  "page": 1,
  "limit": 20
}
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] Bid validation (amount, timing, increment)
- [ ] Auto-extend logic (threshold, max extensions)
- [ ] Winner determination (highest bid, reserve price)
- [ ] State transitions (DRAFT → SCHEDULED → ACTIVE → ENDED)

### Integration Tests
- [ ] Place bid → auction updates
- [ ] Multiple concurrent bids
- [ ] Auto-extend triggered correctly
- [ ] Auction end → winner determined

### UI Tests
- [ ] Countdown updates every second
- [ ] Bid form validation
- [ ] Real-time bid updates (Socket.IO)
- [ ] Status badges display correctly

### Safety Tests
- [ ] Cannot bid on ENDED auction
- [ ] Cannot bid below minimum increment
- [ ] Cannot bid on own auction
- [ ] Seller cannot cancel with active bids (without admin)

---

## 📋 DELIVERABLES

### Backend
- [x] Prisma schema (Auction, Bid, AuctionExtension)
- [x] Auction service (create, get, placeBid, endAuction)
- [x] Bid validation logic
- [x] Auto-extend logic
- [x] Cron job (start/end auctions)
- [ ] Socket.IO real-time updates
- [ ] API endpoints

### Frontend
- [x] Auction types (auction.types.ts)
- [ ] Auction detail page
- [ ] Bid form component
- [ ] Bid history component
- [ ] Countdown timer component
- [ ] Socket.IO client integration

### Documentation
- [x] This specification
- [ ] API documentation
- [ ] UI flow diagrams
- [ ] Testing guide

---

## 🚫 FORBIDDEN PATTERNS

### 1. Payment Integration
```typescript
// ❌ NEVER DO THIS IN PHASE 5.0
import { walletService } from '../wallet-service';
import { escrowService } from '../escrow-service';

async function placeBid(auctionId, bidderId, amount) {
  await walletService.hold(bidderId, amount); // ❌
  await escrowService.create(auctionId, amount); // ❌
}
```

### 2. Bid Mutation
```typescript
// ❌ NEVER UPDATE BIDS
await prisma.bid.update({ ... }); // ❌
await prisma.bid.delete({ ... }); // ❌

// ✅ ONLY INSERT AND STATUS UPDATES
await prisma.bid.create({ ... }); // ✅
await prisma.bid.updateMany({ 
  where: { auctionId, status: 'ACTIVE' },
  data: { status: 'OUTBID' }
}); // ✅ (status only)
```

### 3. UI Payment Messaging
```typescript
// ❌ FORBIDDEN
<div>Processing payment...</div>
<div>Charging your wallet...</div>
<div>Payment confirmed</div>

// ✅ CORRECT
<div>Bid placed successfully</div>
<div>You are the highest bidder</div>
<div>Auction ended - You won!</div>
```

---

## ✅ SUCCESS CRITERIA

1. **Auction Creation**: Seller can create auction with start/end times
2. **Bidding**: Users can place bids with validation
3. **Real-time Updates**: Bids update live via Socket.IO
4. **Auto-extend**: Sniping prevention works correctly
5. **Winner Determination**: Highest bidder determined at auction end
6. **NO Payment Integration**: Zero wallet/escrow/payment code
7. **UI Read-Only**: After bid submit, UI only displays state

---

## 🔜 PHASE 5.1 PREVIEW

**Auction Settlement** (Future):
- Winner payment capture
- Escrow creation
- Seller payout
- Refund handling
- Dispute resolution

**NOT IN PHASE 5.0**

---

**END OF PHASE 5.0 SPECIFICATION**
