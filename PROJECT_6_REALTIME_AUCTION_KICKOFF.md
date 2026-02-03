# المشروع #6: Real-Time Bike Auction System - خطة التنفيذ

**التاريخ**: 3 فبراير 2026  
**الحالة**: 📋 جاهز للبدء  
**الأولوية**: 🔴 حرجة جداً

---

## 📋 نظرة عامة

### الهدف
دمج نظام المزادات اللحظي الكامل مع Anti-sniping و Auto-extend من Real-Time Bike Auction System في منصة Mnbara.

### المصدر
- **Repository**: https://github.com/safayatalif/Real-Time-Bike-Auction-System-Backend
- **License**: Open Source
- **Technology**: Node.js, Socket.IO, Prisma, PostgreSQL

### لماذا هذا المشروع بالضبط؟
- ✅ **نظام مزادات كامل** - كل ما تحتاجه موجود
- ✅ **Anti-sniping logic** - منع المزايدة في اللحظة الأخيرة
- ✅ **Auto-extend** - تمديد تلقائي عند المزايدة في آخر دقيقة
- ✅ **WebSocket real-time** - تحديثات لحظية
- ✅ **Bid history** - سجل كامل للمزايدات
- ✅ **Timer management** - إدارة الوقت التلقائي

### الوقت المقدر
2-3 أسابيع

---

## 🎯 ما يمكن استخدامه مباشرة

### Backend Core (95% جاهز)
```
src/
├── models/
│   ├── auction.model.ts             ✅ نموذج المزاد
│   ├── bid.model.ts                 ✅ نموذج المزايدة
│   └── auction-timer.model.ts       ✅ إدارة الوقت
├── services/
│   ├── auction.service.ts           ✅ منطق المزادات
│   ├── bid.service.ts               ✅ منطق المزايدة
│   └── anti-snipe.service.ts        ✅ منع الـ Sniping
├── websocket/
│   ├── auction.gateway.ts           ✅ WebSocket handler
│   └── bid.events.ts                ✅ Real-time events
└── utils/
    └── timer-manager.ts             ✅ إدارة الوقت التلقائي
```


### الخوارزميات الأساسية

```typescript
// Anti-Sniping Algorithm (من الكود الفعلي)
// إذا تمت المزايدة في آخر X دقائق، مدد المزاد
if (timeRemaining < antiSnipeWindow) {
  auction.endTime = new Date(Date.now() + extensionDuration);
  await this.auctionRepository.save(auction);
  
  // إشعار جميع المستخدمين بالتمديد
  this.socketGateway.broadcastAuctionExtended(auctionId, newEndTime);
}

// Auto-Extend Configuration
const EXTENSION_TIME = 5 * 60 * 1000;  // 5 minutes
const SNIPE_WINDOW = 2 * 60 * 1000;    // 2 minutes before end
```

---

## 📚 الخطوة 1: دراسة الكود (يوم واحد)

### استنساخ المشروع

```bash
# الانتقال لمجلد المشاريع الخارجية
cd C:\mnbara-platform\external-projects

# استنساخ المشروع
git clone https://github.com/safayatalif/Real-Time-Bike-Auction-System-Backend.git
cd Real-Time-Bike-Auction-System-Backend

# استكشاف البنية
dir /s /b

# تثبيت المكتبات لفهم الكود
npm install
```

---

### دراسة Models

```bash
# قراءة نموذج المزاد
type src\models\auction.model.ts

# قراءة نموذج المزايدة
type src\models\bid.model.ts

# قراءة نموذج المؤقت
type src\models\auction-timer.model.ts
```

**الحقول الأساسية في Auction Model**:

```typescript
interface Auction {
  id: string;
  productId: string;
  sellerId: string;
  startingPrice: number;
  currentPrice: number;
  startTime: Date;
  endTime: Date;
  status: 'PENDING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  
  // Anti-sniping fields
  originalEndTime: Date;
  extensionCount: number;
  lastExtensionTime: Date;
  
  // Bid tracking
  totalBids: number;
  highestBidderId: string;
  
  // Settings
  minBidIncrement: number;
  antiSnipeWindow: number;    // milliseconds
  extensionDuration: number;  // milliseconds
}
```


### دراسة Services

```bash
# قراءة خدمة المزادات
type src\services\auction.service.ts

# قراءة خدمة المزايدة
type src\services\bid.service.ts

# قراءة خدمة Anti-sniping
type src\services\anti-snipe.service.ts
```

**الوظائف الأساسية**:

```typescript
// من auction.service.ts

class AuctionService {
  // إنشاء مزاد جديد
  async createAuction(data: CreateAuctionDto): Promise<Auction>
  
  // بدء المزاد
  async startAuction(auctionId: string): Promise<void>
  
  // إنهاء المزاد
  async endAuction(auctionId: string): Promise<void>
  
  // تمديد المزاد (Anti-sniping)
  async extendAuction(auctionId: string): Promise<Date>
  
  // الحصول على المزادات النشطة
  async getActiveAuctions(): Promise<Auction[]>
  
  // الحصول على تفاصيل المزاد
  async getAuctionDetails(auctionId: string): Promise<AuctionDetails>
}

// من bid.service.ts

class BidService {
  // وضع مزايدة
  async placeBid(auctionId: string, userId: string, amount: number): Promise<Bid>
  
  // التحقق من صحة المزايدة
  async validateBid(auctionId: string, amount: number): Promise<boolean>
  
  // الحصول على سجل المزايدات
  async getBidHistory(auctionId: string): Promise<Bid[]>
  
  // الحصول على أعلى مزايدة
  async getHighestBid(auctionId: string): Promise<Bid>
}

// من anti-snipe.service.ts

class AntiSnipeService {
  // التحقق من الحاجة للتمديد
  async checkForExtension(auctionId: string, bidTime: Date): Promise<boolean>
  
  // تطبيق التمديد
  async applyExtension(auctionId: string): Promise<Date>
  
  // حساب الوقت المتبقي
  calculateTimeRemaining(endTime: Date): number
}
```

---

### دراسة WebSocket Gateway

```bash
# قراءة WebSocket handler
type src\websocket\auction.gateway.ts

# قراءة Events
type src\websocket\bid.events.ts
```

**Events الأساسية**:

```typescript
// من auction.gateway.ts

@WebSocketGateway()
export class AuctionGateway {
  // الاتصال بمزاد
  @SubscribeMessage('join-auction')
  handleJoinAuction(client: Socket, auctionId: string)
  
  // مغادرة المزاد
  @SubscribeMessage('leave-auction')
  handleLeaveAuction(client: Socket, auctionId: string)
  
  // وضع مزايدة
  @SubscribeMessage('place-bid')
  async handlePlaceBid(client: Socket, data: PlaceBidDto)
  
  // بث مزايدة جديدة
  broadcastNewBid(auctionId: string, bid: Bid)
  
  // بث تمديد المزاد
  broadcastAuctionExtended(auctionId: string, newEndTime: Date)
  
  // بث انتهاء المزاد
  broadcastAuctionEnded(auctionId: string, winner: User)
}
```


---

## 🔨 الخطوة 2: تصميم التكامل (يوم واحد)

### استراتيجية الدمج

**الخيار الموصى به**: دمج في `auction-service` الموجود

```
backend/services/auction-service/
├── src/
│   ├── services/
│   │   ├── auction.service.ts           (موجود - سنحسنه)
│   │   ├── realtime-auction.service.ts  (جديد - من المشروع)
│   │   ├── bid.service.ts               (جديد - من المشروع)
│   │   ├── anti-snipe.service.ts        (جديد - من المشروع)
│   │   └── auction-timer.service.ts     (جديد - من المشروع)
│   ├── websocket/
│   │   ├── auction.gateway.ts           (جديد - من المشروع)
│   │   └── bid.events.ts                (جديد - من المشروع)
│   ├── controllers/
│   │   ├── realtime-auction.controller.ts (جديد)
│   │   └── bid.controller.ts            (جديد)
│   └── types/
│       ├── realtime-auction.types.ts    (جديد)
│       └── bid.types.ts                 (جديد)
```

---

### Database Schema Updates

```prisma
// إضافة للـ schema.prisma الموجود

model Auction {
  // الحقول الموجودة...
  
  // Real-time auction fields (جديد)
  isRealtime        Boolean   @default(false)
  startingPrice     Decimal?
  currentPrice      Decimal?
  startTime         DateTime?
  originalEndTime   DateTime?
  extensionCount    Int       @default(0)
  lastExtensionTime DateTime?
  
  // Anti-sniping settings
  antiSnipeWindow   Int       @default(120000)  // 2 minutes in ms
  extensionDuration Int       @default(300000)  // 5 minutes in ms
  minBidIncrement   Decimal   @default(10)
  
  // Relations
  bids              Bid[]
  highestBid        Bid?      @relation("HighestBid")
  highestBidderId   String?
  
  @@index([isRealtime, status])
  @@index([endTime])
}

model Bid {
  id          String   @id @default(uuid())
  auctionId   String
  bidderId    String
  amount      Decimal
  timestamp   DateTime @default(now())
  isWinning   Boolean  @default(false)
  
  // Relations
  auction     Auction  @relation(fields: [auctionId], references: [id])
  bidder      User     @relation(fields: [bidderId], references: [id])
  
  @@index([auctionId, timestamp])
  @@index([bidderId])
}

model AuctionTimer {
  id              String   @id @default(uuid())
  auctionId       String   @unique
  scheduledEndTime DateTime
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  @@index([scheduledEndTime, isActive])
}
```

---

## 🔨 الخطوة 3: التطبيق (أسبوع ونصف)

### اليوم 1-2: إعداد WebSocket

```bash
# تثبيت المكتبات المطلوبة
cd C:\mnbara-platform\backend\services\auction-service

npm install @nestjs/websockets @nestjs/platform-socket.io
npm install socket.io socket.io-client
npm install @types/socket.io
```


**إنشاء WebSocket Gateway**:

```typescript
// src/websocket/auction.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BidService } from '../services/bid.service';
import { logger } from '../utils/logger';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/auctions',
})
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private bidService: BidService) {}

  handleConnection(client: Socket) {
    logger.info(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    logger.info(`Client disconnected: ${client.id}`);
  }

  /**
   * Join auction room
   * Adapted from: handleJoinAuction()
   */
  @SubscribeMessage('join-auction')
  handleJoinAuction(client: Socket, auctionId: string) {
    client.join(`auction-${auctionId}`);
    logger.info(`Client ${client.id} joined auction ${auctionId}`);
    
    // Send current auction state
    this.sendAuctionState(client, auctionId);
  }

  /**
   * Leave auction room
   */
  @SubscribeMessage('leave-auction')
  handleLeaveAuction(client: Socket, auctionId: string) {
    client.leave(`auction-${auctionId}`);
    logger.info(`Client ${client.id} left auction ${auctionId}`);
  }

  /**
   * Place bid
   * Adapted from: handlePlaceBid()
   */
  @SubscribeMessage('place-bid')
  async handlePlaceBid(
    client: Socket,
    data: { auctionId: string; amount: number; userId: string }
  ) {
    try {
      const bid = await this.bidService.placeBid(
        data.auctionId,
        data.userId,
        data.amount
      );

      // Broadcast to all clients in auction room
      this.broadcastNewBid(data.auctionId, bid);

      return { success: true, bid };
    } catch (error) {
      logger.error(`Bid placement failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Broadcast new bid to all clients
   * Adapted from: broadcastNewBid()
   */
  broadcastNewBid(auctionId: string, bid: any) {
    this.server.to(`auction-${auctionId}`).emit('new-bid', {
      auctionId,
      bid,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast auction extended
   * Adapted from: broadcastAuctionExtended()
   */
  broadcastAuctionExtended(auctionId: string, newEndTime: Date) {
    this.server.to(`auction-${auctionId}`).emit('auction-extended', {
      auctionId,
      newEndTime,
      message: 'Auction extended due to late bid',
    });
  }

  /**
   * Broadcast auction ended
   * Adapted from: broadcastAuctionEnded()
   */
  broadcastAuctionEnded(auctionId: string, winner: any) {
    this.server.to(`auction-${auctionId}`).emit('auction-ended', {
      auctionId,
      winner,
      timestamp: new Date(),
    });
  }

  /**
   * Send current auction state to client
   */
  private async sendAuctionState(client: Socket, auctionId: string) {
    // TODO: Get auction state and send to client
  }
}
```

---

### اليوم 3-5: تطبيق Bid Service

```typescript
// src/services/bid.service.ts

import { PrismaClient } from '@prisma/client';
import { AntiSnipeService } from './anti-snipe.service';
import { AuctionGateway } from '../websocket/auction.gateway';
import { logger } from '../utils/logger';

export class BidService {
  private prisma: PrismaClient;
  private antiSnipeService: AntiSnipeService;
  private gateway: AuctionGateway;

  constructor() {
    this.prisma = new PrismaClient();
    this.antiSnipeService = new AntiSnipeService();
  }

  setGateway(gateway: AuctionGateway) {
    this.gateway = gateway;
  }

  /**
   * Place a bid
   * Adapted from: placeBid()
   */
  async placeBid(auctionId: string, userId: string, amount: number) {
    // Get auction
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { bids: { orderBy: { amount: 'desc' }, take: 1 } },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    // Validate auction status
    if (auction.status !== 'ACTIVE') {
      throw new Error('Auction is not active');
    }

    // Validate bid amount
    await this.validateBid(auction, amount);

    // Check if user is not the seller
    if (auction.sellerId === userId) {
      throw new Error('Seller cannot bid on own auction');
    }

    // Create bid
    const bid = await this.prisma.bid.create({
      data: {
        auctionId,
        bidderId: userId,
        amount,
        timestamp: new Date(),
        isWinning: true,
      },
      include: {
        bidder: true,
      },
    });

    // Update previous winning bid
    if (auction.bids.length > 0) {
      await this.prisma.bid.update({
        where: { id: auction.bids[0].id },
        data: { isWinning: false },
      });
    }

    // Update auction
    await this.prisma.auction.update({
      where: { id: auctionId },
      data: {
        currentPrice: amount,
        highestBidderId: userId,
        totalBids: { increment: 1 },
      },
    });

    // Check for anti-sniping
    const shouldExtend = await this.antiSnipeService.checkForExtension(
      auctionId,
      new Date()
    );

    if (shouldExtend) {
      const newEndTime = await this.antiSnipeService.applyExtension(auctionId);
      
      // Broadcast extension
      this.gateway.broadcastAuctionExtended(auctionId, newEndTime);
    }

    // Broadcast new bid
    this.gateway.broadcastNewBid(auctionId, bid);

    logger.info(`Bid placed: ${bid.id} for auction ${auctionId}`);
    return bid;
  }

  /**
   * Validate bid amount
   * Adapted from: validateBid()
   */
  private async validateBid(auction: any, amount: number) {
    const minBid = auction.currentPrice
      ? Number(auction.currentPrice) + Number(auction.minBidIncrement)
      : Number(auction.startingPrice);

    if (amount < minBid) {
      throw new Error(
        `Bid must be at least ${minBid} (current: ${auction.currentPrice || auction.startingPrice} + increment: ${auction.minBidIncrement})`
      );
    }

    return true;
  }

  /**
   * Get bid history
   * Adapted from: getBidHistory()
   */
  async getBidHistory(auctionId: string) {
    return this.prisma.bid.findMany({
      where: { auctionId },
      include: { bidder: true },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get highest bid
   * Adapted from: getHighestBid()
   */
  async getHighestBid(auctionId: string) {
    return this.prisma.bid.findFirst({
      where: { auctionId, isWinning: true },
      include: { bidder: true },
    });
  }
}
```


---

### اليوم 6-7: تطبيق Anti-Snipe Service

```typescript
// src/services/anti-snipe.service.ts

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class AntiSnipeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Check if auction needs extension
   * Adapted from: checkForExtension()
   */
  async checkForExtension(auctionId: string, bidTime: Date): Promise<boolean> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction || !auction.endTime) {
      return false;
    }

    // Calculate time remaining
    const timeRemaining = this.calculateTimeRemaining(auction.endTime);
    const antiSnipeWindow = auction.antiSnipeWindow || 120000; // 2 minutes default

    // If bid is within anti-snipe window, extend
    if (timeRemaining < antiSnipeWindow && timeRemaining > 0) {
      logger.info(
        `Anti-snipe triggered for auction ${auctionId}. Time remaining: ${timeRemaining}ms`
      );
      return true;
    }

    return false;
  }

  /**
   * Apply extension to auction
   * Adapted from: applyExtension()
   */
  async applyExtension(auctionId: string): Promise<Date> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    const extensionDuration = auction.extensionDuration || 300000; // 5 minutes default
    const newEndTime = new Date(Date.now() + extensionDuration);

    // Update auction
    await this.prisma.auction.update({
      where: { id: auctionId },
      data: {
        endTime: newEndTime,
        extensionCount: { increment: 1 },
        lastExtensionTime: new Date(),
      },
    });

    // Update timer
    await this.prisma.auctionTimer.update({
      where: { auctionId },
      data: {
        scheduledEndTime: newEndTime,
      },
    });

    logger.info(
      `Auction ${auctionId} extended to ${newEndTime}. Extension count: ${auction.extensionCount + 1}`
    );

    return newEndTime;
  }

  /**
   * Calculate time remaining in milliseconds
   * Adapted from: calculateTimeRemaining()
   */
  calculateTimeRemaining(endTime: Date): number {
    return endTime.getTime() - Date.now();
  }

  /**
   * Check if auction has ended
   */
  hasAuctionEnded(endTime: Date): boolean {
    return this.calculateTimeRemaining(endTime) <= 0;
  }
}
```

---

### اليوم 8-9: تطبيق Auction Timer Service

```typescript
// src/services/auction-timer.service.ts

import { PrismaClient } from '@prisma/client';
import { AuctionGateway } from '../websocket/auction.gateway';
import { logger } from '../utils/logger';

export class AuctionTimerService {
  private prisma: PrismaClient;
  private gateway: AuctionGateway;
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
  }

  setGateway(gateway: AuctionGateway) {
    this.gateway = gateway;
  }

  /**
   * Start timer for auction
   * Adapted from: startTimer()
   */
  async startTimer(auctionId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction || !auction.endTime) {
      throw new Error('Auction not found or has no end time');
    }

    // Create timer record
    await this.prisma.auctionTimer.create({
      data: {
        auctionId,
        scheduledEndTime: auction.endTime,
        isActive: true,
      },
    });

    // Schedule end
    this.scheduleAuctionEnd(auctionId, auction.endTime);

    logger.info(`Timer started for auction ${auctionId}`);
  }

  /**
   * Schedule auction end
   */
  private scheduleAuctionEnd(auctionId: string, endTime: Date) {
    const delay = endTime.getTime() - Date.now();

    if (delay <= 0) {
      // Already ended
      this.endAuction(auctionId);
      return;
    }

    // Clear existing timer if any
    if (this.timers.has(auctionId)) {
      clearTimeout(this.timers.get(auctionId)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.endAuction(auctionId);
    }, delay);

    this.timers.set(auctionId, timer);

    logger.info(`Auction ${auctionId} scheduled to end in ${delay}ms`);
  }

  /**
   * End auction
   */
  private async endAuction(auctionId: string) {
    try {
      // Get auction with highest bid
      const auction = await this.prisma.auction.findUnique({
        where: { id: auctionId },
        include: {
          bids: {
            where: { isWinning: true },
            include: { bidder: true },
          },
        },
      });

      if (!auction) {
        return;
      }

      // Update auction status
      await this.prisma.auction.update({
        where: { id: auctionId },
        data: { status: 'ENDED' },
      });

      // Update timer
      await this.prisma.auctionTimer.update({
        where: { auctionId },
        data: { isActive: false },
      });

      // Broadcast end
      const winner = auction.bids[0]?.bidder || null;
      this.gateway.broadcastAuctionEnded(auctionId, winner);

      // Clear timer
      this.timers.delete(auctionId);

      logger.info(`Auction ${auctionId} ended. Winner: ${winner?.id || 'none'}`);
    } catch (error) {
      logger.error(`Error ending auction ${auctionId}: ${error.message}`);
    }
  }

  /**
   * Reschedule timer (for extensions)
   */
  async rescheduleTimer(auctionId: string, newEndTime: Date) {
    await this.prisma.auctionTimer.update({
      where: { auctionId },
      data: { scheduledEndTime: newEndTime },
    });

    this.scheduleAuctionEnd(auctionId, newEndTime);

    logger.info(`Timer rescheduled for auction ${auctionId}`);
  }

  /**
   * Cancel timer
   */
  async cancelTimer(auctionId: string) {
    if (this.timers.has(auctionId)) {
      clearTimeout(this.timers.get(auctionId)!);
      this.timers.delete(auctionId);
    }

    await this.prisma.auctionTimer.update({
      where: { auctionId },
      data: { isActive: false },
    });

    logger.info(`Timer cancelled for auction ${auctionId}`);
  }

  /**
   * Initialize all active timers on startup
   */
  async initializeActiveTimers() {
    const activeAuctions = await this.prisma.auction.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const auction of activeAuctions) {
      if (auction.endTime) {
        this.scheduleAuctionEnd(auction.id, auction.endTime);
      }
    }

    logger.info(`Initialized ${activeAuctions.length} active auction timers`);
  }
}
```


---

### اليوم 10: تطبيق Controllers

```typescript
// src/controllers/realtime-auction.controller.ts

import { Request, Response } from 'express';
import { RealtimeAuctionService } from '../services/realtime-auction.service';
import { BidService } from '../services/bid.service';
import { AuctionTimerService } from '../services/auction-timer.service';

export class RealtimeAuctionController {
  private auctionService: RealtimeAuctionService;
  private bidService: BidService;
  private timerService: AuctionTimerService;

  constructor() {
    this.auctionService = new RealtimeAuctionService();
    this.bidService = new BidService();
    this.timerService = new AuctionTimerService();
  }

  /**
   * Create real-time auction
   */
  async createAuction(req: Request, res: Response) {
    try {
      const auction = await this.auctionService.createAuction(req.body);
      res.json({ success: true, data: auction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Start auction
   */
  async startAuction(req: Request, res: Response) {
    try {
      const { auctionId } = req.params;
      await this.auctionService.startAuction(auctionId);
      await this.timerService.startTimer(auctionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get auction details
   */
  async getAuctionDetails(req: Request, res: Response) {
    try {
      const { auctionId } = req.params;
      const auction = await this.auctionService.getAuctionDetails(auctionId);
      res.json({ success: true, data: auction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get active auctions
   */
  async getActiveAuctions(req: Request, res: Response) {
    try {
      const auctions = await this.auctionService.getActiveAuctions();
      res.json({ success: true, data: auctions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Get bid history
   */
  async getBidHistory(req: Request, res: Response) {
    try {
      const { auctionId } = req.params;
      const bids = await this.bidService.getBidHistory(auctionId);
      res.json({ success: true, data: bids });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Cancel auction
   */
  async cancelAuction(req: Request, res: Response) {
    try {
      const { auctionId } = req.params;
      await this.auctionService.cancelAuction(auctionId);
      await this.timerService.cancelTimer(auctionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

---

## 🧪 الخطوة 4: الاختبار (3 أيام)

### Unit Tests

```typescript
// src/services/__tests__/bid.service.test.ts

import { BidService } from '../bid.service';
import { PrismaClient } from '@prisma/client';

describe('BidService', () => {
  let service: BidService;
  let prisma: PrismaClient;

  beforeEach(() => {
    service = new BidService();
    prisma = new PrismaClient();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('placeBid', () => {
    it('should place valid bid', async () => {
      const auctionId = 'test-auction-1';
      const userId = 'user-1';
      const amount = 1000;

      const bid = await service.placeBid(auctionId, userId, amount);

      expect(bid).toBeDefined();
      expect(bid.amount).toBe(amount);
      expect(bid.bidderId).toBe(userId);
      expect(bid.isWinning).toBe(true);
    });

    it('should reject bid below minimum', async () => {
      const auctionId = 'test-auction-1';
      const userId = 'user-1';
      const amount = 10; // Too low

      await expect(
        service.placeBid(auctionId, userId, amount)
      ).rejects.toThrow('Bid must be at least');
    });

    it('should reject seller bidding on own auction', async () => {
      const auctionId = 'test-auction-1';
      const sellerId = 'seller-1';
      const amount = 1000;

      await expect(
        service.placeBid(auctionId, sellerId, amount)
      ).rejects.toThrow('Seller cannot bid on own auction');
    });

    it('should update previous winning bid', async () => {
      const auctionId = 'test-auction-1';
      
      // First bid
      const bid1 = await service.placeBid(auctionId, 'user-1', 1000);
      expect(bid1.isWinning).toBe(true);

      // Second bid
      const bid2 = await service.placeBid(auctionId, 'user-2', 1100);
      expect(bid2.isWinning).toBe(true);

      // Check first bid is no longer winning
      const updatedBid1 = await prisma.bid.findUnique({
        where: { id: bid1.id },
      });
      expect(updatedBid1?.isWinning).toBe(false);
    });
  });

  describe('getBidHistory', () => {
    it('should return bids in descending order', async () => {
      const auctionId = 'test-auction-1';

      const bids = await service.getBidHistory(auctionId);

      expect(bids).toBeDefined();
      expect(bids.length).toBeGreaterThan(0);
      
      // Check order
      for (let i = 1; i < bids.length; i++) {
        expect(bids[i].timestamp.getTime()).toBeLessThanOrEqual(
          bids[i - 1].timestamp.getTime()
        );
      }
    });
  });
});
```


```typescript
// src/services/__tests__/anti-snipe.service.test.ts

import { AntiSnipeService } from '../anti-snipe.service';

describe('AntiSnipeService', () => {
  let service: AntiSnipeService;

  beforeEach(() => {
    service = new AntiSnipeService();
  });

  describe('checkForExtension', () => {
    it('should trigger extension within snipe window', async () => {
      const auctionId = 'test-auction-1';
      
      // Create auction ending in 1 minute
      const endTime = new Date(Date.now() + 60000);
      await createTestAuction(auctionId, endTime);

      const shouldExtend = await service.checkForExtension(
        auctionId,
        new Date()
      );

      expect(shouldExtend).toBe(true);
    });

    it('should not trigger extension outside snipe window', async () => {
      const auctionId = 'test-auction-2';
      
      // Create auction ending in 10 minutes
      const endTime = new Date(Date.now() + 600000);
      await createTestAuction(auctionId, endTime);

      const shouldExtend = await service.checkForExtension(
        auctionId,
        new Date()
      );

      expect(shouldExtend).toBe(false);
    });
  });

  describe('applyExtension', () => {
    it('should extend auction by configured duration', async () => {
      const auctionId = 'test-auction-1';
      const originalEndTime = new Date(Date.now() + 60000);
      
      await createTestAuction(auctionId, originalEndTime);

      const newEndTime = await service.applyExtension(auctionId);

      // Should be extended by 5 minutes (default)
      const expectedEndTime = Date.now() + 300000;
      expect(newEndTime.getTime()).toBeGreaterThan(originalEndTime.getTime());
      expect(newEndTime.getTime()).toBeCloseTo(expectedEndTime, -3);
    });

    it('should increment extension count', async () => {
      const auctionId = 'test-auction-1';
      
      await createTestAuction(auctionId, new Date(Date.now() + 60000));

      await service.applyExtension(auctionId);
      await service.applyExtension(auctionId);

      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
      });

      expect(auction?.extensionCount).toBe(2);
    });
  });

  describe('calculateTimeRemaining', () => {
    it('should calculate correct time remaining', () => {
      const endTime = new Date(Date.now() + 120000); // 2 minutes

      const remaining = service.calculateTimeRemaining(endTime);

      expect(remaining).toBeCloseTo(120000, -3);
    });

    it('should return negative for past time', () => {
      const endTime = new Date(Date.now() - 60000); // 1 minute ago

      const remaining = service.calculateTimeRemaining(endTime);

      expect(remaining).toBeLessThan(0);
    });
  });
});
```

---

### Integration Tests

```typescript
// src/__tests__/realtime-auction.integration.test.ts

import { io, Socket } from 'socket.io-client';
import { BidService } from '../services/bid.service';

describe('Real-time Auction Integration', () => {
  let clientSocket: Socket;
  let bidService: BidService;

  beforeAll((done) => {
    // Connect to WebSocket
    clientSocket = io('http://localhost:3000/auctions');
    clientSocket.on('connect', done);
    
    bidService = new BidService();
  });

  afterAll(() => {
    clientSocket.close();
  });

  it('should receive new bid events', (done) => {
    const auctionId = 'test-auction-1';

    // Join auction
    clientSocket.emit('join-auction', auctionId);

    // Listen for new bid
    clientSocket.on('new-bid', (data) => {
      expect(data.auctionId).toBe(auctionId);
      expect(data.bid).toBeDefined();
      done();
    });

    // Place bid
    setTimeout(() => {
      bidService.placeBid(auctionId, 'user-1', 1000);
    }, 100);
  });

  it('should receive auction extended events', (done) => {
    const auctionId = 'test-auction-2';

    clientSocket.emit('join-auction', auctionId);

    clientSocket.on('auction-extended', (data) => {
      expect(data.auctionId).toBe(auctionId);
      expect(data.newEndTime).toBeDefined();
      expect(data.message).toContain('extended');
      done();
    });

    // Place bid in snipe window
    setTimeout(() => {
      bidService.placeBid(auctionId, 'user-1', 1000);
    }, 100);
  });

  it('should receive auction ended events', (done) => {
    const auctionId = 'test-auction-3';

    clientSocket.emit('join-auction', auctionId);

    clientSocket.on('auction-ended', (data) => {
      expect(data.auctionId).toBe(auctionId);
      expect(data.winner).toBeDefined();
      done();
    });

    // Wait for auction to end
  });

  it('should handle multiple concurrent bids', async () => {
    const auctionId = 'test-auction-4';
    const bidPromises = [];

    // Place 10 concurrent bids
    for (let i = 0; i < 10; i++) {
      bidPromises.push(
        bidService.placeBid(auctionId, `user-${i}`, 1000 + i * 10)
      );
    }

    const results = await Promise.allSettled(bidPromises);

    // At least one should succeed
    const successful = results.filter((r) => r.status === 'fulfilled');
    expect(successful.length).toBeGreaterThan(0);
  });
});
```

---

## 📦 الخطوة 5: التكامل مع المشروع (يومان)

### تحديث package.json

```json
{
  "dependencies": {
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "socket.io": "^4.6.0",
    "socket.io-client": "^4.6.0"
  },
  "devDependencies": {
    "@types/socket.io": "^3.0.2"
  }
}
```

### تحديث main app

```typescript
// src/index.ts

import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import { AuctionGateway } from './websocket/auction.gateway';
import { BidService } from './services/bid.service';
import { AuctionTimerService } from './services/auction-timer.service';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize services
const bidService = new BidService();
const timerService = new AuctionTimerService();
const gateway = new AuctionGateway(bidService);

// Set gateway references
bidService.setGateway(gateway);
timerService.setGateway(gateway);

// Initialize WebSocket
gateway.server = io;

// Initialize active timers on startup
timerService.initializeActiveTimers();

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/auctions`);
});
```


---

### تحديث Prisma Migration

```bash
# إنشاء migration جديد
cd backend/services/auction-service
npx prisma migrate dev --name add_realtime_auction_features

# تطبيق Migration
npx prisma migrate deploy
```

---

## 🎨 الخطوة 6: Frontend Integration (يومان)

### React Hook للمزادات اللحظية

```typescript
// frontend/web-app/src/hooks/useRealtimeAuction.ts

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Bid {
  id: string;
  amount: number;
  bidderId: string;
  bidder: {
    name: string;
  };
  timestamp: Date;
}

interface AuctionState {
  currentPrice: number;
  highestBidderId: string;
  totalBids: number;
  endTime: Date;
  status: string;
  bids: Bid[];
}

export const useRealtimeAuction = (auctionId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3000/auctions');

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-auction', auctionId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for new bids
    newSocket.on('new-bid', (data) => {
      setAuctionState((prev) => ({
        ...prev!,
        currentPrice: data.bid.amount,
        highestBidderId: data.bid.bidderId,
        totalBids: (prev?.totalBids || 0) + 1,
        bids: [data.bid, ...(prev?.bids || [])],
      }));
    });

    // Listen for auction extended
    newSocket.on('auction-extended', (data) => {
      setAuctionState((prev) => ({
        ...prev!,
        endTime: new Date(data.newEndTime),
      }));
      
      // Show notification
      alert(`Auction extended! New end time: ${new Date(data.newEndTime).toLocaleString()}`);
    });

    // Listen for auction ended
    newSocket.on('auction-ended', (data) => {
      setAuctionState((prev) => ({
        ...prev!,
        status: 'ENDED',
      }));
      
      // Show winner notification
      if (data.winner) {
        alert(`Auction ended! Winner: ${data.winner.name}`);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-auction', auctionId);
      newSocket.close();
    };
  }, [auctionId]);

  // Update time remaining
  useEffect(() => {
    if (!auctionState?.endTime) return;

    const interval = setInterval(() => {
      const remaining = new Date(auctionState.endTime).getTime() - Date.now();
      setTimeRemaining(Math.max(0, remaining));
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionState?.endTime]);

  const placeBid = async (amount: number) => {
    if (!socket) return;

    return new Promise((resolve, reject) => {
      socket.emit(
        'place-bid',
        {
          auctionId,
          amount,
          userId: 'current-user-id', // TODO: Get from auth
        },
        (response: any) => {
          if (response.success) {
            resolve(response.bid);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  };

  return {
    auctionState,
    isConnected,
    timeRemaining,
    placeBid,
  };
};
```

---

### React Component للمزاد اللحظي

```typescript
// frontend/web-app/src/components/RealtimeAuction.tsx

import React, { useState } from 'react';
import { useRealtimeAuction } from '../hooks/useRealtimeAuction';

interface Props {
  auctionId: string;
}

export const RealtimeAuction: React.FC<Props> = ({ auctionId }) => {
  const { auctionState, isConnected, timeRemaining, placeBid } =
    useRealtimeAuction(auctionId);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  };

  const handlePlaceBid = async () => {
    if (!bidAmount || isPlacingBid) return;

    setIsPlacingBid(true);
    try {
      await placeBid(bidAmount);
      setBidAmount(0);
      alert('Bid placed successfully!');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsPlacingBid(false);
    }
  };

  if (!auctionState) {
    return <div>Loading auction...</div>;
  }

  return (
    <div className="realtime-auction">
      <div className="connection-status">
        {isConnected ? (
          <span className="connected">🟢 Connected</span>
        ) : (
          <span className="disconnected">🔴 Disconnected</span>
        )}
      </div>

      <div className="auction-info">
        <h2>Live Auction</h2>
        
        <div className="current-price">
          <label>Current Price:</label>
          <span className="price">${auctionState.currentPrice}</span>
        </div>

        <div className="time-remaining">
          <label>Time Remaining:</label>
          <span className={timeRemaining < 120000 ? 'urgent' : ''}>
            {formatTime(timeRemaining)}
          </span>
        </div>

        <div className="total-bids">
          <label>Total Bids:</label>
          <span>{auctionState.totalBids}</span>
        </div>
      </div>

      {auctionState.status === 'ACTIVE' && (
        <div className="bid-form">
          <input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            placeholder="Enter bid amount"
            min={auctionState.currentPrice + 10}
          />
          <button onClick={handlePlaceBid} disabled={isPlacingBid}>
            {isPlacingBid ? 'Placing Bid...' : 'Place Bid'}
          </button>
        </div>
      )}

      <div className="bid-history">
        <h3>Bid History</h3>
        <ul>
          {auctionState.bids.map((bid) => (
            <li key={bid.id}>
              <span className="bidder">{bid.bidder.name}</span>
              <span className="amount">${bid.amount}</span>
              <span className="time">
                {new Date(bid.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

---

## ✅ Checklist التنفيذ

### الأسبوع 1: Core Implementation
- [ ] استنساخ Real-Time-Bike-Auction-System-Backend
- [ ] دراسة Models و Services
- [ ] إعداد WebSocket في auction-service
- [ ] تطبيق BidService
- [ ] تطبيق AntiSnipeService
- [ ] تطبيق AuctionTimerService
- [ ] تطبيق AuctionGateway

### الأسبوع 2: Testing & Integration
- [ ] كتابة Unit tests
- [ ] كتابة Integration tests
- [ ] اختبار Anti-sniping logic
- [ ] اختبار Auto-extend
- [ ] تحديث Prisma schema
- [ ] تطبيق Migrations

### الأسبوع 3: Frontend & Polish
- [ ] تطبيق useRealtimeAuction hook
- [ ] تطبيق RealtimeAuction component
- [ ] اختبار WebSocket connection
- [ ] اختبار Real-time updates
- [ ] Documentation
- [ ] Deployment

---

## 🎯 النتيجة المتوقعة

بعد 2-3 أسابيع، ستحصل على:

✅ نظام مزادات لحظي كامل  
✅ Anti-sniping logic يعمل  
✅ Auto-extend عند المزايدة المتأخرة  
✅ WebSocket real-time updates  
✅ Bid history كامل  
✅ Timer management تلقائي  
✅ Frontend components جاهزة  
✅ اختبارات شاملة  

---

## 📊 مقارنة مع النظام الحالي

### النظام الحالي (auction-service)
- ✅ Auction CRUD
- ✅ Basic bidding
- ✅ Trust & Safety
- ❌ Real-time updates
- ❌ Anti-sniping
- ❌ Auto-extend

### بعد الدمج
- ✅ كل ما سبق +
- ✅ Real-time WebSocket
- ✅ Anti-sniping logic
- ✅ Auto-extend
- ✅ Live bid updates
- ✅ Timer management

---

## 💡 ملاحظات مهمة

### ما يجب تعديله
- ⚠️ تغيير "Bike" إلى "Product" في جميع الأماكن
- ⚠️ دمج مع نظام المنتجات الموجود
- ⚠️ إضافة "Make Offer" و "Buy It Now" (اختياري)
- ⚠️ ربط مع نظام الدفع

### ما لا يجب استخدامه
- ❌ الـ UI الخاص بالمشروع الأصلي (استخدم UI خاص بك)
- ❌ Authentication system (استخدم النظام الموجود)

---

## 🚀 الخطوات التالية الفورية

### اليوم 1
1. ✅ استنساخ المشروع
2. ✅ دراسة الكود بعمق
3. ✅ فهم Anti-sniping algorithm

### اليوم 2
1. ⏳ تصميم التكامل
2. ⏳ تحديث Database schema
3. ⏳ إعداد WebSocket

### اليوم 3-10
1. ⏳ تطبيق Services
2. ⏳ تطبيق WebSocket Gateway
3. ⏳ تطبيق Controllers

---

**التاريخ**: 3 فبراير 2026  
**الحالة**: 📋 جاهز للبدء  
**السابق**: ✅ Projects #1-5 Complete  
**التالي**: Project #7 - Stripe Connect أو Project #16 - Medusa

**الخلاصة**: هذا المشروع يوفر نظام مزادات لحظي كامل مع Anti-sniping و Auto-extend - بالضبط ما تحتاجه Mnbara. الكود جاهز للاستخدام مع تعديلات بسيطة. التركيز على دمج WebSocket والتأكد من عمل Anti-sniping logic بشكل صحيح.

