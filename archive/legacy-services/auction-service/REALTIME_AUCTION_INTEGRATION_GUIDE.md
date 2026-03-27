# Real-Time Auction System - Integration Guide

**Status**: Backend Complete ✅  
**Next**: Module Integration & Testing  
**Date**: 3 فبراير 2026

---

## ✅ What's Been Completed

### Backend Services (100%)
- ✅ `RealtimeBidService` - Bid placement with anti-sniping
- ✅ `AuctionGateway` - WebSocket event broadcasting
- ✅ `AuctionTimerService` - Auto start/end auctions
- ✅ `RealtimeBidController` - REST API endpoints
- ✅ Database migration - Added `idempotencyKey` and `isWinning`

### Key Features Implemented
- ✅ Anti-sniping (auto-extend within 2 minutes)
- ✅ Concurrency control (Prisma transactions)
- ✅ Idempotency (prevent duplicate bids)
- ✅ WebSocket notifications (bid placed, extended, ended, outbid)
- ✅ Automatic auction lifecycle (start/end)
- ✅ Reserve price handling
- ✅ Winner determination

---

## 🔧 Integration Steps

### Step 1: Install Dependencies

```bash
cd backend/services/auction-service
npm install socket.io @nestjs/websockets @nestjs/platform-socket.io @nestjs/schedule
```

**Dependencies**:
- `socket.io` - WebSocket library
- `@nestjs/websockets` - NestJS WebSocket support
- `@nestjs/platform-socket.io` - Socket.IO adapter for NestJS
- `@nestjs/schedule` - Cron job support for timer service

### Step 2: Run Database Migration

```bash
cd backend/services/auction-service
npx prisma migrate deploy
# or
npx prisma migrate dev --name add_realtime_auction_fields
```

This will add:
- `idempotencyKey` (unique) to Bid table
- `isWinning` (indexed) to Bid table

### Step 3: Update Main Module

**File**: `backend/services/auction-service/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RealtimeBidService } from './services/realtime-bid.service';
import { AuctionTimerService } from './services/auction-timer.service';
import { AuctionGateway } from './websocket/auction.gateway';
import { RealtimeBidController } from './controllers/realtime-bid.controller';
import { PrismaService } from './lib/prisma.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  controllers: [
    RealtimeBidController,
    // ... existing controllers
  ],
  providers: [
    PrismaService,
    RealtimeBidService,
    AuctionTimerService,
    AuctionGateway,
    // ... existing providers
  ],
})
export class AppModule {}
```

### Step 4: Update Main Entry Point

**File**: `backend/services/auction-service/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable WebSocket with Socket.IO
  app.useWebSocketAdapter(new IoAdapter(app));
  
  // Enable CORS for WebSocket
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  await app.listen(process.env.PORT || 3001);
  console.log(`Auction service running on port ${process.env.PORT || 3001}`);
}
bootstrap();
```

### Step 5: Environment Variables

**File**: `backend/services/auction-service/.env`

```env
# Existing variables...

# Real-Time Auction Configuration
WEBSOCKET_PORT=3001
FRONTEND_URL=http://localhost:3000

# Anti-Sniping Configuration (optional, defaults in code)
ANTI_SNIPE_THRESHOLD_MS=120000  # 2 minutes
ANTI_SNIPE_EXTENSION_MS=120000  # 2 minutes
MAX_EXTENSIONS=10
```

---

## 🧪 Testing

### Manual Testing

#### 1. Start the Service

```bash
cd backend/services/auction-service
npm run dev
```

#### 2. Test REST API

**Place a Bid**:
```bash
curl -X POST http://localhost:3001/auctions/1/bids \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "idempotencyKey": "bid-123-456"
  }'
```

**Get Bid History**:
```bash
curl http://localhost:3001/auctions/1/bids
```

**Get Winning Bid**:
```bash
curl http://localhost:3001/auctions/1/bids/winning
```

**Get Auction Status**:
```bash
curl http://localhost:3001/auctions/1/status
```

#### 3. Test WebSocket

**Using Socket.IO Client**:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001/auctions');

// Join auction room
socket.emit('joinAuction', 1);

// Listen for events
socket.on('bidPlaced', (data) => {
  console.log('New bid:', data);
});

socket.on('auctionExtended', (data) => {
  console.log('Auction extended:', data);
});

socket.on('auctionEnded', (data) => {
  console.log('Auction ended:', data);
});

// Join user room for private notifications
socket.emit('joinUser', 123);

socket.on('outbid', (data) => {
  console.log('You were outbid:', data);
});
```

### Automated Testing

#### Unit Tests

```bash
cd backend/services/auction-service
npm run test
```

**Test Files to Create**:
- `src/services/__tests__/realtime-bid.service.test.ts`
- `src/services/__tests__/auction-timer.service.test.ts`
- `src/websocket/__tests__/auction.gateway.test.ts`
- `src/controllers/__tests__/realtime-bid.controller.test.ts`

#### Integration Tests

```bash
npm run test:e2e
```

**Test Scenarios**:
- ✅ Place bid successfully
- ✅ Idempotency (duplicate bid returns same result)
- ✅ Anti-sniping triggers extension
- ✅ Concurrent bids (race condition handling)
- ✅ Auction auto-start
- ✅ Auction auto-end
- ✅ Winner determination
- ✅ Reserve price handling
- ✅ WebSocket notifications

---

## 🎨 Frontend Integration

### React Hook: `useRealtimeAuction`

**File**: `frontend/web-app/src/hooks/useRealtimeAuction.ts`

```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface AuctionData {
  id: number;
  currentBid: number;
  bidCount: number;
  timeRemaining: number;
  isActive: boolean;
  extensionCount: number;
}

export function useRealtimeAuction(auctionId: number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3001/auctions');
    
    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('joinAuction', auctionId);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Listen for bid placed
    newSocket.on('bidPlaced', (data) => {
      setAuction((prev) => ({
        ...prev!,
        currentBid: data.newPrice,
        bidCount: data.bidCount,
        timeRemaining: new Date(data.endTime).getTime() - Date.now(),
      }));
    });

    // Listen for auction extended
    newSocket.on('auctionExtended', (data) => {
      setAuction((prev) => ({
        ...prev!,
        timeRemaining: new Date(data.newEndTime).getTime() - Date.now(),
        extensionCount: data.extensionCount,
      }));
    });

    // Listen for auction ended
    newSocket.on('auctionEnded', (data) => {
      setAuction((prev) => ({
        ...prev!,
        isActive: false,
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leaveAuction', auctionId);
      newSocket.disconnect();
    };
  }, [auctionId]);

  const placeBid = async (amount: number) => {
    const response = await fetch(
      `http://localhost:3001/auctions/${auctionId}/bids`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          idempotencyKey: `bid-${Date.now()}-${Math.random()}`,
        }),
      }
    );
    return response.json();
  };

  return {
    auction,
    connected,
    placeBid,
  };
}
```

### React Component: `RealtimeAuction`

**File**: `frontend/web-app/src/components/RealtimeAuction.tsx`

```typescript
import React, { useState } from 'react';
import { useRealtimeAuction } from '../hooks/useRealtimeAuction';

interface Props {
  auctionId: number;
}

export function RealtimeAuction({ auctionId }: Props) {
  const { auction, connected, placeBid } = useRealtimeAuction(auctionId);
  const [bidAmount, setBidAmount] = useState('');

  const handlePlaceBid = async () => {
    try {
      await placeBid(parseFloat(bidAmount));
      setBidAmount('');
    } catch (error) {
      console.error('Failed to place bid:', error);
    }
  };

  if (!auction) {
    return <div>Loading auction...</div>;
  }

  return (
    <div className="realtime-auction">
      <div className="status">
        {connected ? '🟢 Live' : '🔴 Disconnected'}
      </div>

      <div className="current-bid">
        <h3>Current Bid</h3>
        <p className="amount">${auction.currentBid}</p>
        <p className="count">{auction.bidCount} bids</p>
      </div>

      <div className="time-remaining">
        <h3>Time Remaining</h3>
        <p>{formatTime(auction.timeRemaining)}</p>
        {auction.extensionCount > 0 && (
          <p className="extended">
            Extended {auction.extensionCount} time(s)
          </p>
        )}
      </div>

      {auction.isActive && (
        <div className="bid-form">
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Enter bid amount"
          />
          <button onClick={handlePlaceBid}>Place Bid</button>
        </div>
      )}
    </div>
  );
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
```

---

## 📝 API Documentation

### REST Endpoints

#### Place Bid
```
POST /auctions/:auctionId/bids
Content-Type: application/json

{
  "amount": 100.00,
  "idempotencyKey": "optional-unique-key"
}

Response:
{
  "success": true,
  "data": {
    "bid": {
      "id": 123,
      "amount": 100.00,
      "createdAt": "2026-02-03T10:00:00Z",
      "isWinning": true
    },
    "auction": {
      "id": 1,
      "currentBid": 100.00,
      "auctionEndsAt": "2026-02-03T12:00:00Z",
      "extensionCount": 0,
      "bidCount": 5
    },
    "extended": false,
    "status": "NEW"
  }
}
```

#### Get Bid History
```
GET /auctions/:auctionId/bids

Response:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "amount": 100.00,
      "bidder": {
        "id": 456,
        "name": "John Doe"
      },
      "createdAt": "2026-02-03T10:00:00Z",
      "isWinning": true,
      "triggeredExtension": false
    }
  ]
}
```

#### Get Winning Bid
```
GET /auctions/:auctionId/bids/winning

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "amount": 100.00,
    "bidder": {
      "id": 456,
      "name": "John Doe"
    },
    "createdAt": "2026-02-03T10:00:00Z",
    "isWinning": true
  }
}
```

#### Get Auction Status
```
GET /auctions/:auctionId/status

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "status": "ACTIVE",
    "currentBid": 100.00,
    "bidCount": 5,
    "timeRemaining": 3600000,
    "isActive": true,
    "winnerId": null,
    "finalPrice": null,
    "extensionCount": 0,
    "originalEndTime": null
  }
}
```

#### Get Viewer Count
```
GET /auctions/:auctionId/viewers

Response:
{
  "success": true,
  "data": {
    "auctionId": 1,
    "viewerCount": 42
  }
}
```

### WebSocket Events

#### Client → Server

**Join Auction Room**:
```javascript
socket.emit('joinAuction', auctionId);
```

**Leave Auction Room**:
```javascript
socket.emit('leaveAuction', auctionId);
```

**Join User Room** (for private notifications):
```javascript
socket.emit('joinUser', userId);
```

#### Server → Client

**Bid Placed** (broadcast to auction room):
```javascript
socket.on('bidPlaced', (data) => {
  // data: {
  //   auctionId: 1,
  //   newPrice: 100.00,
  //   bidderName: "John Doe",
  //   bidCount: 5,
  //   endTime: "2026-02-03T12:00:00Z",
  //   timestamp: "2026-02-03T10:00:00Z"
  // }
});
```

**Auction Extended** (broadcast to auction room):
```javascript
socket.on('auctionExtended', (data) => {
  // data: {
  //   auctionId: 1,
  //   newEndTime: "2026-02-03T12:02:00Z",
  //   extensionCount: 1,
  //   reason: "Anti-sniping: Bid placed within threshold",
  //   timestamp: "2026-02-03T10:00:00Z"
  // }
});
```

**Auction Ended** (broadcast to auction room):
```javascript
socket.on('auctionEnded', (data) => {
  // data: {
  //   auctionId: 1,
  //   winnerId: 456,
  //   winnerName: "John Doe",
  //   finalPrice: 100.00,
  //   reason: "NORMAL",
  //   timestamp: "2026-02-03T12:00:00Z"
  // }
});
```

**Outbid** (private to user room):
```javascript
socket.on('outbid', (data) => {
  // data: {
  //   auctionId: 1,
  //   auctionTitle: "Vintage Bike",
  //   newPrice: 110.00,
  //   yourBid: 100.00,
  //   timestamp: "2026-02-03T10:00:00Z"
  // }
});
```

**Auction Live** (broadcast to all):
```javascript
socket.on('auctionLive', (data) => {
  // data: {
  //   auctionId: 1,
  //   title: "Vintage Bike",
  //   startTime: "2026-02-03T10:00:00Z",
  //   endTime: "2026-02-03T12:00:00Z",
  //   startingPrice: 50.00,
  //   timestamp: "2026-02-03T10:00:00Z"
  // }
});
```

---

## 🚀 Deployment Checklist

- [ ] Install dependencies (`socket.io`, `@nestjs/websockets`, etc.)
- [ ] Run database migration
- [ ] Update app.module.ts with new services
- [ ] Update main.ts with WebSocket adapter
- [ ] Set environment variables
- [ ] Test REST API endpoints
- [ ] Test WebSocket connections
- [ ] Test anti-sniping logic
- [ ] Test concurrent bidding
- [ ] Create frontend components
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update API documentation
- [ ] Deploy to staging
- [ ] Load testing
- [ ] Deploy to production

---

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)

---

**Last Updated**: 3 فبراير 2026  
**Status**: Ready for Integration ✅
