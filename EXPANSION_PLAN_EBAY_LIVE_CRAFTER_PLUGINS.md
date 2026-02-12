# 🎯 خطة التوسع الشاملة - eBay Live + CrafterCMS + Plugin System
**تاريخ**: 2 فبراير 2026  
**الحالة**: خطة تنفيذ  
**الهدف**: إضافة 3 ميزات رئيسية للمنصة

---

## 📊 تحليل الواقع الحالي

### ✅ ما هو موجود (من التقرير السابق)

**البنية التحتية**:
- ✅ 80+ microservices (منظمة جيداً)
- ✅ نظام Event Logging (68 نوع حدث)
- ✅ نظام Trust & Safety (11 إجراءات)
- ✅ نظام Disputes كامل
- ✅ نظام Payments (Stripe PaymentIntent)
- ✅ نظام Escrow (state machine)
- ✅ نظام Admin Visibility (read-only)

**الخدمات القابلة للاستخدام**:
- ✅ `auction-service` (مزادات موجودة)
- ✅ `chat-service` (دردشة موجودة)
- ✅ `notification-service` (إشعارات)
- ✅ `payment-service` (دفع)
- ✅ `order-service` (طلبات)

### 🔴 الفجوات التي يجب سدها أولاً

قبل البدء بالميزات الجديدة، يجب إكمال:
1. **Wallet Service Consolidation** (أسبوعان) - دمج خدمات المحفظة المتعددة
2. **Event Taxonomy Extension** (أسبوع) - إضافة أحداث للبث المباشر والـ plugins

---

## 🎯 الاستراتيجية العامة

### الترتيب الموصى به:

```
1️⃣ Plugin System (أولاً)
   ↓
2️⃣ eBay Live (كـ plugin)
   ↓
3️⃣ CrafterCMS (كـ plugin)
```

**السبب**: 
- Plugin System يوفر البنية الأساسية للتوسع
- eBay Live و CrafterCMS يمكن بناؤهما كـ plugins
- يقلل التكرار ويزيد المرونة

---

## 📅 الجدول الزمني الشامل

### **المرحلة 0: التحضير (أسبوعان)**

```yaml
الأسبوع 1: Consolidation
  - [ ] دمج wallet services (internal-ledger + wallet-service)
  - [ ] إضافة أحداث جديدة للـ Event Taxonomy
  - [ ] تحديث API Gateway للـ plugins
  - [ ] إعداد Plugin Registry Database

الأسبوع 2: Infrastructure
  - [ ] إعداد Docker/K8s للخدمات الجديدة
  - [ ] إعداد Redis للـ Plugin Event Bus
  - [ ] إعداد Monitoring للخدمات الجديدة
  - [ ] إعداد CI/CD pipelines
```

---

## 1️⃣ Plugin System (6-8 أسابيع)

### **المرحلة 1.1: Core System (3 أسابيع)**

#### الأسبوع 1: Plugin Loader & Registry

```typescript
// backend/services/plugin-system/
├── core/
│   ├── plugin-loader/
│   │   ├── src/
│   │   │   ├── PluginLoader.ts          // تحميل plugins
│   │   │   ├── PluginValidator.ts       // التحقق من plugins
│   │   │   └── PluginSandbox.ts         // Sandbox للـ plugins
│   │   └── tests/
│   │
│   ├── plugin-registry/
│   │   ├── src/
│   │   │   ├── PluginRegistry.ts        // سجل الـ plugins
│   │   │   ├── PluginMetadata.ts        // metadata management
│   │   │   └── PluginVersioning.ts      // version management
│   │   └── prisma/
│   │       └── schema.prisma           // Plugin tables
│   │
│   └── hooks-system/
│       ├── src/
│       │   ├── HookRegistry.ts          // Hook registration
│       │   ├── HookExecutor.ts          // Hook execution
│       │   └── HookPriority.ts          // Priority system
│       └── tests/
```

**Database Schema**:
```sql
-- Plugin Registry
CREATE TABLE plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  version VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  manifest JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'inactive', -- active, inactive, error
  installed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Plugin Hooks
CREATE TABLE plugin_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID REFERENCES plugins(id),
  hook_name VARCHAR(100) NOT NULL,
  handler_function VARCHAR(255) NOT NULL,
  priority INT DEFAULT 100,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plugin Configurations
CREATE TABLE plugin_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID REFERENCES plugins(id),
  config_key VARCHAR(255) NOT NULL,
  config_value JSONB,
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(plugin_id, config_key)
);
```

**Tasks**:
- [ ] إنشاء PluginLoader class
- [ ] إنشاء PluginRegistry service
- [ ] إنشاء HookSystem
- [ ] كتابة Unit tests (80%+ coverage)
- [ ] إنشاء Database migrations

#### الأسبوع 2: Event Bus & SDK

```typescript
// Event Bus System
├── event-bus/
│   ├── src/
│   │   ├── EventBus.ts                  // Core event bus
│   │   ├── EventEmitter.ts              // Event emission
│   │   ├── EventSubscriber.ts           // Event subscription
│   │   └── EventMiddleware.ts           // Event middleware
│   └── tests/

// Plugin SDK
├── packages/
│   └── plugin-sdk/
│       ├── src/
│       │   ├── MnbaraPlugin.ts          // Base plugin class
│       │   ├── PluginContext.ts         // Plugin context
│       │   ├── ServiceAccess.ts         // Service access helpers
│       │   └── types/
│       │       ├── Plugin.types.ts
│       │       ├── Hook.types.ts
│       │       └── Event.types.ts
│       ├── templates/
│       │   ├── payment-gateway/
│       │   ├── analytics/
│       │   └── shipping/
│       └── package.json
```

**Tasks**:
- [ ] إنشاء EventBus (Redis-based)
- [ ] إنشاء Plugin SDK (TypeScript)
- [ ] إنشاء Plugin templates
- [ ] كتابة Documentation
- [ ] إنشاء Example plugins

#### الأسبوع 3: Security & Permissions

```typescript
// Security System
├── security/
│   ├── src/
│   │   ├── PermissionManager.ts         // Permission system
│   │   ├── SandboxExecutor.ts           // Sandbox execution
│   │   ├── SecurityScanner.ts           // Security scanning
│   │   └── AuditLogger.ts               // Audit logging
│   └── tests/
```

**Tasks**:
- [ ] إنشاء Permission system
- [ ] إنشاء Sandbox executor (VM2 أو isolated worker)
- [ ] إنشاء Security scanner
- [ ] Integration testing
- [ ] Security audit

### **المرحلة 1.2: Marketplace (2-3 أسابيع)**

#### الأسبوع 4-5: Marketplace API & UI

```typescript
// Marketplace
├── marketplace/
│   ├── api/
│   │   ├── src/
│   │   │   ├── PluginMarketplaceAPI.ts
│   │   │   ├── PluginInstaller.ts
│   │   │   ├── PluginPublisher.ts
│   │   │   └── PluginReviewer.ts
│   │   └── tests/
│   │
│   └── web-ui/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── MarketplacePage.tsx
│       │   │   ├── PluginDetailsPage.tsx
│       │   │   └── MyPluginsPage.tsx
│       │   ├── components/
│       │   │   ├── PluginCard.tsx
│       │   │   ├── PluginInstaller.tsx
│       │   │   └── PluginConfigForm.tsx
│       │   └── hooks/
│       │       └── usePlugins.ts
│       └── package.json
```

**Database Schema**:
```sql
-- Marketplace
CREATE TABLE marketplace_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID REFERENCES plugins(id),
  developer_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  price DECIMAL(10,2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  download_count INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Plugin Reviews
CREATE TABLE plugin_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID REFERENCES marketplace_plugins(id),
  user_id UUID REFERENCES users(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(plugin_id, user_id)
);

-- Plugin Installations
CREATE TABLE plugin_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID REFERENCES plugins(id),
  user_id UUID REFERENCES users(id),
  version VARCHAR(50) NOT NULL,
  config JSONB,
  status VARCHAR(20) DEFAULT 'active',
  installed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Tasks**:
- [ ] إنشاء Marketplace API
- [ ] إنشاء Marketplace UI (React)
- [ ] نظام التثبيت/الإلغاء
- [ ] نظام المراجعات
- [ ] نظام الدفع للـ plugins المدفوعة

#### الأسبوع 6: Official Plugins (أمثلة)

```typescript
// Official Plugins
├── plugins/
│   ├── official/
│   │   ├── stripe-payment/
│   │   │   ├── src/
│   │   │   │   └── index.ts
│   │   │   ├── plugin.json
│   │   │   └── README.md
│   │   │
│   │   ├── google-analytics/
│   │   │   ├── src/
│   │   │   │   └── index.ts
│   │   │   ├── plugin.json
│   │   │   └── README.md
│   │   │
│   │   └── mailchimp/
│   │       ├── src/
│   │       │   └── index.ts
│   │       ├── plugin.json
│   │       └── README.md
```

**Tasks**:
- [ ] إنشاء 3 plugins رسمية (أمثلة)
- [ ] كتابة Documentation لكل plugin
- [ ] Integration testing
- [ ] Performance testing

### **المرحلة 1.3: Integration & Testing (أسبوع)**

#### الأسبوع 7-8: Integration

**Tasks**:
- [ ] Integration مع API Gateway
- [ ] Integration مع Event Logging
- [ ] Integration مع Admin Service
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation finalization

---

## 2️⃣ eBay Live Service (6-8 أسابيع)

### **المرحلة 2.1: Core Streaming (3 أسابيع)**

#### الأسبوع 1-2: RTMP & HLS Infrastructure

```typescript
// backend/services/ebay-live-service/
├── streaming/
│   ├── rtmp-server/
│   │   ├── src/
│   │   │   ├── RTMPServer.ts            // RTMP server setup
│   │   │   ├── StreamManager.ts          // Stream lifecycle
│   │   │   └── StreamValidator.ts        // Stream validation
│   │   └── Dockerfile
│   │
│   ├── hls-converter/
│   │   ├── src/
│   │   │   ├── HLSConverter.ts           // FFmpeg HLS conversion
│   │   │   ├── VideoProcessor.ts         // Video processing
│   │   │   └── QualityManager.ts         // Quality management
│   │   └── Dockerfile
│   │
│   └── webrtc-gateway/
│       ├── src/
│       │   ├── WebRTCGateway.ts          // WebRTC for low latency
│       │   ├── SignalingServer.ts         // Signaling
│       │   └── StreamRelay.ts             // Stream relay
│       └── Dockerfile
```

**Infrastructure**:
```yaml
# docker-compose.ebay-live.yml
services:
  rtmp-server:
    image: alfg/nginx-rtmp
    ports:
      - "1935:1935"  # RTMP
      - "8080:8080"   # HTTP
    volumes:
      - ./media:/var/www/html/media

  hls-converter:
    build: ./streaming/hls-converter
    environment:
      - FFMPEG_PATH=/usr/bin/ffmpeg
    volumes:
      - ./media:/media
    depends_on:
      - rtmp-server

  webrtc-gateway:
    build: ./streaming/webrtc-gateway
    ports:
      - "8443:8443"
    depends_on:
      - rtmp-server
```

**Database Schema**:
```sql
-- Live Streams
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  scheduled_start TIMESTAMP NOT NULL,
  actual_start TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  stream_key VARCHAR(255) UNIQUE NOT NULL,
  rtmp_url TEXT,
  hls_url TEXT,
  webrtc_url TEXT,
  thumbnail_url TEXT,
  total_viewers INT DEFAULT 0,
  peak_viewers INT DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stream Analytics
CREATE TABLE stream_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id),
  metric_type VARCHAR(50), -- viewers, engagement, sales
  metric_value JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

**Tasks**:
- [ ] إعداد RTMP server (nginx-rtmp)
- [ ] إعداد HLS converter (FFmpeg)
- [ ] إعداد WebRTC gateway (للتأخير المنخفض)
- [ ] Stream key generation
- [ ] Stream validation
- [ ] Basic error handling

#### الأسبوع 3: WebSocket & Chat

```typescript
// Chat System
├── chat/
│   ├── websocket-server/
│   │   ├── src/
│   │   │   ├── WebSocketServer.ts        // WebSocket server
│   │   │   ├── ChatManager.ts            // Chat management
│   │   │   ├── MessageModerator.ts       // Content moderation
│   │   │   └── EmojiReactions.ts         // Emoji reactions
│   │   └── tests/
│   │
│   └── moderation/
│       ├── src/
│       │   ├── ModerationService.ts      // AI moderation
│       │   ├── BanManager.ts              // User bans
│       │   └── SpamDetector.ts           // Spam detection
│       └── tests/
```

**Integration مع chat-service الموجود**:
```typescript
// Reuse existing chat-service
import { ChatService } from '@mnbara/chat-service';

class LiveChatManager {
  constructor(
    private chatService: ChatService,
    private moderationService: ModerationService
  ) {}

  async sendMessage(streamId: string, userId: string, message: string) {
    // Check moderation
    const isAllowed = await this.moderationService.checkMessage(message);
    if (!isAllowed) {
      throw new Error('Message blocked by moderation');
    }

    // Use existing chat service
    const chatMessage = await this.chatService.sendMessage({
      channelId: `live-stream-${streamId}`,
      userId,
      content: message,
      type: 'live_stream'
    });

    // Broadcast via WebSocket
    this.broadcastToStream(streamId, {
      type: 'new_message',
      data: chatMessage
    });

    return chatMessage;
  }
}
```

**Tasks**:
- [ ] WebSocket server setup
- [ ] Chat integration مع chat-service
- [ ] Message moderation (AI-based)
- [ ] Emoji reactions
- [ ] User bans/timeouts
- [ ] Spam detection

### **المرحلة 2.2: Auction System (2-3 أسابيع)**

#### الأسبوع 4-5: Live Auction Engine

```typescript
// Auction System
├── auction/
│   ├── bidding-engine/
│   │   ├── src/
│   │   │   ├── LiveAuctionEngine.ts      // Live auction logic
│   │   │   ├── BidProcessor.ts           // Bid processing
│   │   │   ├── SoftCloseManager.ts       // Soft-close logic
│   │   │   └── WinnerDeterminer.ts       // Winner determination
│   │   └── tests/
│   │
│   ├── payment-capture/
│   │   ├── src/
│   │   │   ├── AutoPaymentCapture.ts    // Auto payment
│   │   │   ├── PaymentValidator.ts       // Payment validation
│   │   │   └── RefundHandler.ts          // Refund handling
│   │   └── tests/
│   │
│   └── product-carousel/
│       ├── src/
│       │   ├── ProductCarousel.ts        // Product display
│       │   ├── PinProduct.ts              // Pin product
│       │   └── InventorySync.ts          // Inventory sync
│       └── tests/
```

**Integration مع auction-service الموجود**:
```typescript
// Reuse existing auction-service
import { AuctionService } from '@mnbara/auction-service';
import { PaymentService } from '@mnbara/payment-service';

class LiveAuctionManager {
  constructor(
    private auctionService: AuctionService,
    private paymentService: PaymentService
  ) {}

  async createLiveAuction(streamId: string, productId: string, data: LiveAuctionData) {
    // Create auction using existing service
    const auction = await this.auctionService.createAuction({
      productId,
      startingBid: data.startingBid,
      endTime: data.endTime,
      type: 'live_stream',
      metadata: {
        streamId,
        softCloseEnabled: data.softCloseEnabled
      }
    });

    // Create live auction record
    const liveAuction = await this.createLiveAuctionRecord({
      streamId,
      auctionId: auction.id,
      productId,
      ...data
    });

    return { auction, liveAuction };
  }

  async processBid(auctionId: string, userId: string, amount: number) {
    // Use existing bid processing
    const bid = await this.auctionService.placeBid({
      auctionId,
      userId,
      amount
    });

    // Check for soft-close extension
    await this.checkSoftClose(auctionId);

    // Broadcast to stream viewers
    await this.broadcastBid(auctionId, bid);

    return bid;
  }

  async handleAuctionEnd(auctionId: string) {
    // Get winner from existing service
    const winner = await this.auctionService.getWinner(auctionId);

    if (winner) {
      // Auto-capture payment
      await this.autoCapturePayment(winner);
    }
  }
}
```

**Database Schema**:
```sql
-- Live Auctions
CREATE TABLE live_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id),
  auction_id UUID NOT NULL REFERENCES auctions(id),
  product_id UUID NOT NULL REFERENCES products(id),
  starting_bid DECIMAL(10,2) NOT NULL,
  current_bid DECIMAL(10,2) NOT NULL,
  highest_bidder_id UUID REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  soft_close_enabled BOOLEAN DEFAULT TRUE,
  soft_close_extension INT DEFAULT 5, -- seconds
  status VARCHAR(20) DEFAULT 'active', -- active, sold, unsold, cancelled
  winner_id UUID REFERENCES users(id),
  final_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Live Bids
CREATE TABLE live_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES live_auctions(id),
  bidder_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  is_winning BOOLEAN DEFAULT FALSE,
  INDEX idx_auction_timestamp (auction_id, timestamp DESC)
);

-- Pinned Products
CREATE TABLE pinned_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id),
  product_id UUID NOT NULL REFERENCES products(id),
  pinned_at TIMESTAMP DEFAULT NOW(),
  unpinned_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

**Tasks**:
- [ ] Live auction engine
- [ ] Bid processing (reuse auction-service)
- [ ] Soft-close mechanism
- [ ] Product carousel
- [ ] Pin/unpin products
- [ ] Inventory sync
- [ ] Auto payment capture

#### الأسبوع 6: Frontend Components

```typescript
// frontend/web-app/src/
├── features/
│   └── live-streaming/
│       ├── components/
│       │   ├── LiveStreamViewer.tsx      // Main viewer component
│       │   ├── VideoPlayer.tsx           // HLS/WebRTC player
│       │   ├── ChatBox.tsx               // Chat component
│       │   ├── BiddingPanel.tsx          // Bidding UI
│       │   ├── ProductCarousel.tsx       // Product carousel
│       │   └── StreamControls.tsx        // Stream controls (seller)
│       │
│       ├── hooks/
│       │   ├── useLiveStream.ts          // Stream hook
│       │   ├── useLiveChat.ts            // Chat hook
│       │   └── useLiveAuction.ts         // Auction hook
│       │
│       └── pages/
│           ├── LiveStreamPage.tsx         // Viewer page
│           └── CreateStreamPage.tsx      // Creator page
```

**Tasks**:
- [ ] Video player component (HLS.js / Video.js)
- [ ] Chat UI component
- [ ] Bidding panel
- [ ] Product carousel
- [ ] Stream controls (for sellers)
- [ ] Real-time updates (WebSocket)
- [ ] Mobile responsive design

### **المرحلة 2.3: Analytics & Enhancement (أسبوعان)**

#### الأسبوع 7-8: Analytics & Advanced Features

**Tasks**:
- [ ] Viewer tracking
- [ ] Engagement metrics
- [ ] Sales analytics
- [ ] Replay functionality
- [ ] Video receipts
- [ ] Multi-camera support
- [ ] Advanced moderation
- [ ] Performance optimization
- [ ] Load testing
- [ ] Documentation

---

## 3️⃣ CrafterCMS Integration (4-5 أسابيع)

### **المرحلة 3.1: Setup & Basic Integration (أسبوعان)**

#### الأسبوع 1: CrafterCMS Installation

```yaml
# Infrastructure
craftercms/
├── docker-compose.yml
├── crafter-studio/
│   └── Dockerfile
├── crafter-engine/
│   └── Dockerfile
└── content-repo/
    └── .git/
```

**Docker Compose**:
```yaml
version: '3.8'
services:
  crafter-studio:
    image: craftercms/studio:latest
    ports:
      - "8080:8080"
    environment:
      - CRAFTER_ENVIRONMENT=development
    volumes:
      - ./content-repo:/opt/crafter/data/repos/sites/mnbara
    depends_on:
      - mongodb
      - elasticsearch

  crafter-engine:
    image: craftercms/engine:latest
    ports:
      - "8081:8080"
    environment:
      - CRAFTER_ENVIRONMENT=development
    depends_on:
      - crafter-studio
      - mongodb
      - elasticsearch

  mongodb:
    image: mongo:5.0
    volumes:
      - mongodb-data:/data/db

  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
    volumes:
      - es-data:/usr/share/elasticsearch/data

volumes:
  mongodb-data:
  es-data:
```

**Tasks**:
- [ ] تثبيت CrafterCMS (Docker)
- [ ] إعداد Git repository للمحتوى
- [ ] إعداد MongoDB & Elasticsearch
- [ ] إعداد Crafter Studio
- [ ] إعداد Crafter Engine
- [ ] Basic configuration

#### الأسبوع 2: Content Models & API Integration

```typescript
// backend/services/content-service/
├── craftercms-client/
│   ├── src/
│   │   ├── CrafterCMSClient.ts          // GraphQL client
│   │   ├── ContentFetcher.ts            // Content fetching
│   │   ├── ContentUpdater.ts            // Content updates
│   │   └── PersonalizationEngine.ts      // Personalization
│   └── tests/
│
└── content-api/
    ├── src/
    │   ├── ContentController.ts          // REST API
    │   ├── GraphQLResolver.ts           // GraphQL resolver
    │   └── ContentSync.ts                // Sync with DB
    └── tests/
```

**Content Models** (CrafterCMS):
```xml
<!-- /content-types/product/form-definition.xml -->
<form>
  <title>Product Content</title>
  <sections>
    <section>
      <title>Rich Content</title>
      <fields>
        <field>
          <type>wysiwyg</type>
          <id>description</id>
          <title>Description</title>
        </field>
        <field>
          <type>image</type>
          <id>heroImage</id>
          <title>Hero Image</title>
        </field>
        <field>
          <type>repeat</type>
          <id>gallery</id>
          <title>Gallery</title>
        </field>
      </fields>
    </section>
  </sections>
</form>
```

**Integration مع product-service**:
```typescript
// Sync product data with CrafterCMS
class ContentSyncService {
  async syncProduct(productId: string) {
    // Get product from DB
    const product = await this.productService.getProduct(productId);

    // Get/Update content in CrafterCMS
    const content = await this.crafterClient.updateProductContent({
      productId,
      name: product.name,
      price: product.price,
      // Rich content managed in CrafterCMS
    });

    return content;
  }

  async getProductWithContent(productId: string) {
    // Get base data from DB
    const product = await this.productService.getProduct(productId);

    // Get rich content from CrafterCMS
    const content = await this.crafterClient.getProductContent(productId);

    return {
      ...product,
      richContent: content
    };
  }
}
```

**Tasks**:
- [ ] إنشاء Content Models
- [ ] إنشاء CrafterCMS Client
- [ ] GraphQL API setup
- [ ] REST API integration
- [ ] Content sync service
- [ ] Basic React components

### **المرحلة 3.2: Advanced Features (2-3 أسابيع)**

#### الأسبوع 3-4: Personalization & Multilingual

**Tasks**:
- [ ] Personalization engine
- [ ] Multilingual content support
- [ ] A/B testing setup
- [ ] Content versioning
- [ ] Preview system
- [ ] Advanced workflows

#### الأسبوع 5: AI Integration & Optimization

**Tasks**:
- [ ] AI-powered content generation
- [ ] Content recommendations
- [ ] SEO optimization
- [ ] Performance optimization
- [ ] CDN integration
- [ ] Caching strategy
- [ ] Documentation

---

## 📊 الجدول الزمني الإجمالي

### Timeline المرن:

```yaml
Option 1: Sequential (18-21 أسبوع)
  Phase 0: Preparation (2 weeks)
  Phase 1: Plugin System (8 weeks)
  Phase 2: eBay Live (8 weeks)
  Phase 3: CrafterCMS (5 weeks)
  Total: 23 weeks (~6 months)

Option 2: Parallel (12-14 أسبوع) ⭐ RECOMMENDED
  Phase 0: Preparation (2 weeks)
  Phase 1: Plugin System (8 weeks) [Weeks 3-10]
  Phase 2: eBay Live (8 weeks) [Weeks 5-12] ← Overlap
  Phase 3: CrafterCMS (5 weeks) [Weeks 11-15] ← Overlap
  Total: 15 weeks (~4 months)
```

### الجدول الموصى به (Parallel):

```
Week 1-2:   Preparation & Consolidation
Week 3-10:  Plugin System (Core + Marketplace)
Week 5-12:  eBay Live (Streaming + Auction)
Week 11-15: CrafterCMS (Setup + Integration)
Week 16:    Final Integration & Testing
Week 17:    Documentation & Deployment
```

---

## 👥 الفريق المطلوب

### Core Team:

```yaml
Backend Developers: 4-5
  - Plugin System Architect (1)
  - Streaming Engineer (1)
  - CrafterCMS Specialist (1)
  - Integration Developer (1-2)

Frontend Developers: 3-4
  - Plugin Marketplace UI (1)
  - Live Streaming UI (1)
  - CrafterCMS Integration (1)
  - Mobile Apps (1)

DevOps Engineers: 2
  - Infrastructure (1)
  - CI/CD & Monitoring (1)

QA Engineers: 2
  - Manual Testing (1)
  - Automation Testing (1)

Product/Design: 2
  - Product Manager (1)
  - UX Designer (1)
```

### Skills Required:

- **Plugin System**: TypeScript, Node.js, Security, Sandboxing
- **eBay Live**: WebRTC, RTMP, FFmpeg, Video Streaming, WebSocket
- **CrafterCMS**: Java, GraphQL, Content Management, Personalization

---

## 💰 التكلفة التقديرية

### Infrastructure (Monthly):

```yaml
Streaming Infrastructure:
  - RTMP/HLS Servers: $800-1,500
  - CDN (CloudFlare/Fastly): $500-1,000
  - WebRTC Servers: $300-600
  Subtotal: $1,600-3,100

CrafterCMS:
  - CrafterCMS Hosting: $400-800
  - MongoDB: $200-400
  - Elasticsearch: $300-600
  Subtotal: $900-1,800

Plugin System:
  - Redis (Event Bus): $100-200
  - Storage (Plugin files): $50-100
  Subtotal: $150-300

Monitoring & Logging:
  - Prometheus/Grafana: $200-400
  - Logging (ELK): $300-500
  Subtotal: $500-900

Total Monthly: ~$3,150-6,100
```

### Development (One-time):

```yaml
Plugin System:
  - Core Development: $45,000-65,000
  - Marketplace: $25,000-35,000
  - Official Plugins: $15,000-20,000
  Subtotal: $85,000-120,000

eBay Live:
  - Streaming Infrastructure: $35,000-50,000
  - Auction System: $25,000-35,000
  - Frontend: $20,000-30,000
  Subtotal: $80,000-115,000

CrafterCMS:
  - Setup & Integration: $30,000-45,000
  - Personalization: $20,000-30,000
  - AI Integration: $15,000-25,000
  Subtotal: $65,000-100,000

Testing & QA:
  - Manual Testing: $15,000-20,000
  - Automation: $10,000-15,000
  Subtotal: $25,000-35,000

Documentation:
  - Technical Docs: $10,000-15,000
  - User Guides: $5,000-10,000
  Subtotal: $15,000-25,000

Total Development: ~$270,000-395,000
```

### Maintenance (Monthly):

```yaml
Support & Updates: $8,000-12,000
Bug Fixes: $3,000-5,000
Security Updates: $2,000-3,000
Total Monthly: ~$13,000-20,000
```

---

## ⚠️ المخاطر والتحديات

### المخاطر العالية:

1. **Plugin System Security**
   - **Risk**: Plugins قد تحتوي على كود ضار
   - **Mitigation**: Sandbox execution, Security scanning, Code review
   - **Timeline Impact**: +1 week for security hardening

2. **Streaming Infrastructure Costs**
   - **Risk**: تكاليف عالية مع زيادة المشاهدين
   - **Mitigation**: CDN optimization, Adaptive bitrate, Caching
   - **Timeline Impact**: +1 week for optimization

3. **CrafterCMS Learning Curve**
   - **Risk**: فريق جديد على CrafterCMS
   - **Mitigation**: Training, Documentation, External consultant
   - **Timeline Impact**: +1-2 weeks

### المخاطر المتوسطة:

4. **Integration Complexity**
   - **Risk**: تكامل معقد بين الخدمات
   - **Mitigation**: API contracts, Integration testing, Staged rollout
   - **Timeline Impact**: +1 week

5. **Performance at Scale**
   - **Risk**: أداء ضعيف مع زيادة الحمل
   - **Mitigation**: Load testing, Caching, Database optimization
   - **Timeline Impact**: +1 week

---

## ✅ Checklist التنفيذ

### Pre-Development:

- [ ] Team hiring/assignment
- [ ] Infrastructure setup
- [ ] Tool selection & setup
- [ ] Project kickoff meeting
- [ ] Architecture review
- [ ] Security review

### Development:

- [ ] Plugin System Core
- [ ] Plugin Marketplace
- [ ] eBay Live Streaming
- [ ] eBay Live Auctions
- [ ] CrafterCMS Setup
- [ ] CrafterCMS Integration
- [ ] Frontend Components
- [ ] Integration Testing

### Pre-Launch:

- [ ] Security audit
- [ ] Performance testing
- [ ] Load testing
- [ ] Documentation review
- [ ] User acceptance testing
- [ ] Training materials
- [ ] Deployment plan

### Launch:

- [ ] Staged rollout
- [ ] Monitoring setup
- [ ] Support team ready
- [ ] Rollback plan
- [ ] Post-launch review

---

## 🎯 النتيجة النهائية

بعد إكمال هذه الخطة، ستحصل على:

1. ✅ **Plugin System** قابل للتوسع
   - أي ميزة جديدة = plugin جديد
   - Marketplace للـ plugins
   - نظام أمان قوي

2. ✅ **eBay Live** كامل
   - بث مباشر عالي الجودة
   - مزادات حية تفاعلية
   - دفع تلقائي

3. ✅ **CrafterCMS** متكامل
   - محتوى غني ومرن
   - تخصيص للمستخدمين
   - SEO محسّن

**المنصة ستكون جاهزة للتوسع في أي اتجاه! 🚀**

---

**تاريخ الإنشاء**: 2 فبراير 2026  
**آخر تحديث**: 2 فبراير 2026  
**الحالة**: جاهز للتنفيذ

