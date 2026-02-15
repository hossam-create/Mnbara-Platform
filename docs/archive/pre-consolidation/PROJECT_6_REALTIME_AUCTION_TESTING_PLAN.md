# 🧪 Project #6: Real-Time Auction System - Testing Plan

**Date**: 3 فبراير 2026  
**Status**: Ready for Testing (When Database Available)  
**Current Progress**: 75%  
**Target**: 100%

---

## 🎯 Testing Overview

### Current Status
- ✅ Backend code complete (100%)
- ✅ Integration complete (100%)
- ✅ Dependencies installed (100%)
- ⏳ Database migration pending (0%)
- ⏳ Manual testing pending (0%)
- ⏳ Automated tests pending (0%)

### What Needs Testing
1. **Database Migration** - Apply schema changes
2. **REST API Endpoints** - Test bid placement, history, status
3. **WebSocket Events** - Test real-time notifications
4. **Anti-Sniping Logic** - Test auction extensions
5. **Concurrency Control** - Test race conditions
6. **Idempotency** - Test duplicate prevention

---

## 📋 Pre-Testing Checklist

### ✅ Prerequisites

**1. Database Running**
```bash
# Check if PostgreSQL is running
psql -U mnbarh -d mnbarh_dev -c "SELECT version();"

# If not running, start it
# Windows: Start PostgreSQL service
# Linux/Mac: sudo service postgresql start
```

**2. Environment Variables**
```bash
# backend/services/auction-service/.env
DATABASE_URL="postgresql://mnbarh:password@localhost:5432/mnbarh_dev"
PORT=3003
NODE_ENV=development
```

**3. Dependencies Installed**
```bash
cd backend/services/auction-service
npm list socket.io @nestjs/websockets @nestjs/platform-socket.io @nestjs/schedule

# Should show:
# ├── socket.io@4.8.3
# ├── @nestjs/websockets@11.1.13
# ├── @nestjs/platform-socket.io@11.1.13
# └── @nestjs/schedule@6.1.0
```

---

## 🗄️ Phase 1: Database Migration

### Step 1: Apply Migration

```bash
cd backend/services/auction-service
npx prisma migrate deploy
```

**Expected Output**:
```
✔ Migration 20260203_add_realtime_auction_fields applied successfully
```

### Step 2: Verify Schema

```bash
npx prisma studio
```

**Check**:
- ✅ `Bid` table has `idempotencyKey` column (TEXT, UNIQUE)
- ✅ `Bid` table has `isWinning` column (BOOLEAN, INDEXED)
- ✅ `AuctionExtension` table exists

### Step 3: Seed Test Data

```sql
-- Create test auction
INSERT INTO "Listing" (
  "sellerId",
  "title",
  "description",
  "startingBid",
  "currentBid",
  "minBidIncrement",
  "isAuction",
  "status",
  "auctionStartsAt",
  "auctionEndsAt",
  "autoExtendEnabled",
  "autoExtendThresholdMs",
  "autoExtendDurationMs",
  "maxExtensions",
  "extensionCount",
  "createdAt",
  "updatedAt"
) VALUES (
  1,  -- Replace with actual seller ID
  'Test Auction - Real-Time Bidding',
  'Test auction for real-time bidding system',
  100.00,
  100.00,
  10.00,
  true,
  'ACTIVE',
  NOW(),
  NOW() + INTERVAL '1 hour',
  true,
  120000,  -- 2 minutes
  120000,  -- 2 minutes
  10,
  0,
  NOW(),
  NOW()
);
```

---

## 🧪 Phase 2: Manual API Testing

### Test 1: Place First Bid ✅

**Request**:
```bash
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 110,
    "idempotencyKey": "test-bid-001"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "bid": {
      "id": 1,
      "amount": 110,
      "createdAt": "2026-02-03T15:00:00Z",
      "isWinning": true
    },
    "auction": {
      "id": 1,
      "currentBid": 110,
      "auctionEndsAt": "2026-02-03T16:00:00Z",
      "extensionCount": 0,
      "bidCount": 1
    },
    "extended": false,
    "status": "NEW"
  }
}
```

**Verify**:
- ✅ Bid created in database
- ✅ `isWinning` = true
- ✅ `currentBid` updated to 110
- ✅ `bidCount` = 1
- ✅ No extension (not within threshold)

### Test 2: Idempotency Check ✅

**Request** (same idempotencyKey):
```bash
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 120,
    "idempotencyKey": "test-bid-001"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "bid": {
      "id": 1,
      "amount": 110,  // Original amount, not 120!
      "createdAt": "2026-02-03T15:00:00Z",
      "isWinning": true
    },
    "auction": {
      "id": 1,
      "currentBid": 110,  // Not updated!
      "auctionEndsAt": "2026-02-03T16:00:00Z",
      "extensionCount": 0,
      "bidCount": 1  // Still 1!
    },
    "extended": false,
    "status": "EXISTING"  // Key difference!
  }
}
```

**Verify**:
- ✅ Returns existing bid
- ✅ No new bid created
- ✅ `status` = "EXISTING"
- ✅ Amount not changed

### Test 3: Anti-Sniping Extension ✅

**Setup**: Wait until auction is within 2 minutes of ending

**Request**:
```bash
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 120,
    "idempotencyKey": "test-bid-002"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "bid": {
      "id": 2,
      "amount": 120,
      "createdAt": "2026-02-03T15:58:30Z",
      "isWinning": true
    },
    "auction": {
      "id": 1,
      "currentBid": 120,
      "auctionEndsAt": "2026-02-03T16:02:00Z",  // Extended by 2 min!
      "extensionCount": 1,  // Incremented!
      "bidCount": 2
    },
    "extended": true,  // Key difference!
    "status": "NEW"
  }
}
```

**Verify**:
- ✅ Bid created
- ✅ `extended` = true
- ✅ `auctionEndsAt` extended by 2 minutes
- ✅ `extensionCount` = 1
- ✅ `AuctionExtension` record created

### Test 4: Get Bid History ✅

**Request**:
```bash
curl http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "amount": 120,
      "bidder": {
        "id": 2,
        "name": "Jane Doe"
      },
      "createdAt": "2026-02-03T15:58:30Z",
      "isWinning": true,
      "triggeredExtension": true
    },
    {
      "id": 1,
      "amount": 110,
      "bidder": {
        "id": 1,
        "name": "John Doe"
      },
      "createdAt": "2026-02-03T15:00:00Z",
      "isWinning": false,
      "triggeredExtension": false
    }
  ]
}
```

**Verify**:
- ✅ Bids sorted by amount (highest first)
- ✅ Only one bid has `isWinning` = true
- ✅ Bidder names included

### Test 5: Get Winning Bid ✅

**Request**:
```bash
curl http://localhost:3003/api/auctions/1/realtime-bids/winning \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "amount": 120,
    "bidder": {
      "id": 2,
      "name": "Jane Doe"
    },
    "createdAt": "2026-02-03T15:58:30Z",
    "isWinning": true
  }
}
```

**Verify**:
- ✅ Returns highest bid
- ✅ `isWinning` = true

---

## 🔌 Phase 3: WebSocket Testing

### Test 1: Connect to WebSocket ✅

**Client Code** (JavaScript):
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3003');

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

**Expected Output**:
```
✅ Connected to WebSocket
Socket ID: abc123xyz
```

### Test 2: Subscribe to Auction Room ✅

**Client Code**:
```javascript
// Subscribe to auction updates
socket.emit('auction:subscribe', 1);  // Auction ID = 1

console.log('✅ Subscribed to auction 1');
```

**Expected**:
- ✅ No errors
- ✅ Socket joins room `auction-1`

### Test 3: Listen for Bid Placed Event ✅

**Client Code**:
```javascript
socket.on('bidPlaced', (data) => {
  console.log('🔔 New bid placed:', data);
  // {
  //   auctionId: 1,
  //   newPrice: 130,
  //   bidderName: "Alice Smith",
  //   bidCount: 3,
  //   endTime: "2026-02-03T16:02:00Z",
  //   timestamp: "2026-02-03T15:59:00Z"
  // }
});
```

**Trigger**: Place a bid via REST API

**Expected Output**:
```
🔔 New bid placed: {
  auctionId: 1,
  newPrice: 130,
  bidderName: "Alice Smith",
  bidCount: 3,
  endTime: "2026-02-03T16:02:00Z",
  timestamp: "2026-02-03T15:59:00Z"
}
```

**Verify**:
- ✅ Event received immediately
- ✅ Correct auction ID
- ✅ Correct new price
- ✅ Bidder name included

### Test 4: Listen for Auction Extended Event ✅

**Client Code**:
```javascript
socket.on('auctionExtended', (data) => {
  console.log('⏰ Auction extended:', data);
  // {
  //   auctionId: 1,
  //   newEndTime: "2026-02-03T16:04:00Z",
  //   extensionCount: 2,
  //   reason: "Anti-sniping: Bid placed within threshold",
  //   timestamp: "2026-02-03T16:00:30Z"
  // }
});
```

**Trigger**: Place bid within 2 minutes of end time

**Expected Output**:
```
⏰ Auction extended: {
  auctionId: 1,
  newEndTime: "2026-02-03T16:04:00Z",
  extensionCount: 2,
  reason: "Anti-sniping: Bid placed within threshold",
  timestamp: "2026-02-03T16:00:30Z"
}
```

**Verify**:
- ✅ Event received immediately
- ✅ New end time is 2 minutes later
- ✅ Extension count incremented

### Test 5: Listen for Outbid Event (Private) ✅

**Client Code**:
```javascript
// Subscribe to user room
socket.emit('user:subscribe', 2);  // User ID = 2

socket.on('outbid', (data) => {
  console.log('😞 You were outbid:', data);
  // {
  //   auctionId: 1,
  //   auctionTitle: "Test Auction - Real-Time Bidding",
  //   newPrice: 140,
  //   yourBid: 130,
  //   timestamp: "2026-02-03T16:01:00Z"
  // }
});
```

**Trigger**: Another user places higher bid

**Expected Output**:
```
😞 You were outbid: {
  auctionId: 1,
  auctionTitle: "Test Auction - Real-Time Bidding",
  newPrice: 140,
  yourBid: 130,
  timestamp: "2026-02-03T16:01:00Z"
}
```

**Verify**:
- ✅ Only previous bidder receives event
- ✅ Correct auction info
- ✅ Shows both prices

---

## ⚡ Phase 4: Concurrency Testing

### Test 1: Simultaneous Bids (Race Condition) ✅

**Setup**: Two clients place bids at exact same time

**Client 1**:
```bash
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER1_TOKEN" \
  -d '{"amount": 150, "idempotencyKey": "user1-bid-001"}' &
```

**Client 2** (simultaneously):
```bash
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER2_TOKEN" \
  -d '{"amount": 150, "idempotencyKey": "user2-bid-001"}' &
```

**Expected Behavior**:
- ✅ Only ONE bid succeeds
- ✅ Other bid gets error: "Bid too low"
- ✅ No duplicate bids in database
- ✅ `currentBid` updated correctly

**Verify in Database**:
```sql
SELECT COUNT(*) FROM "Bid" WHERE "listingId" = 1 AND "amount" = 150;
-- Should return 1, not 2!
```

### Test 2: Rapid Sequential Bids ✅

**Setup**: Place 10 bids rapidly (1 per second)

**Script**:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d "{\"amount\": $((150 + i * 10)), \"idempotencyKey\": \"rapid-bid-$i\"}"
  sleep 1
done
```

**Expected**:
- ✅ All 10 bids succeed
- ✅ `currentBid` increases correctly
- ✅ `isWinning` flag updated correctly
- ✅ Only last bid has `isWinning` = true

---

## 🎯 Phase 5: Edge Cases

### Test 1: Bid Below Minimum ❌

**Request**:
```bash
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'  # Below current bid + increment
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Bid too low. Minimum valid bid is 160"
}
```

### Test 2: Bid on Ended Auction ❌

**Setup**: Wait for auction to end

**Request**:
```bash
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -d '{"amount": 200}'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Bidding window is closed"
}
```

### Test 3: Seller Bids on Own Auction ❌

**Request** (as seller):
```bash
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SELLER_TOKEN" \
  -d '{"amount": 200}'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Sellers cannot bid on their own auctions"
}
```

### Test 4: Max Extensions Reached ✅

**Setup**: Trigger 10 extensions (max)

**Request** (11th extension attempt):
```bash
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -d '{"amount": 300}'
```

**Expected**:
- ✅ Bid succeeds
- ✅ No extension (max reached)
- ✅ `extended` = false
- ✅ `extensionCount` = 10 (not 11)

---

## 📊 Success Criteria

### Functional Requirements ✅
- ✅ Bids placed successfully
- ✅ Anti-sniping works correctly
- ✅ Idempotency prevents duplicates
- ✅ WebSocket notifications sent
- ✅ Concurrency handled correctly
- ✅ Edge cases handled gracefully

### Performance Requirements ✅
- ✅ Bid placement: <500ms
- ✅ WebSocket notification: <100ms
- ✅ Concurrent bids: No race conditions
- ✅ Database queries: <100ms

### Data Integrity ✅
- ✅ Only one winning bid
- ✅ `currentBid` always accurate
- ✅ `extensionCount` accurate
- ✅ No duplicate bids with same idempotencyKey

---

## 🚀 When Database is Available

### Quick Start Testing

```bash
# 1. Apply migration
cd backend/services/auction-service
npx prisma migrate deploy

# 2. Start service
npm run dev

# 3. Test REST API
curl http://localhost:3003/health

# 4. Place test bid
curl -X POST http://localhost:3003/api/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -d '{"amount": 110, "idempotencyKey": "test-001"}'

# 5. Test WebSocket
node test-websocket.js
```

---

**Status**: Testing Plan Ready ✅  
**Waiting For**: Database to be available  
**Estimated Testing Time**: 2-3 hours  
**Last Updated**: 3 فبراير 2026, 3:30 PM
