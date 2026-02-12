# Live Streaming Events System

This module provides comprehensive event tracking for the eBay Live streaming service integration. It extends the existing audit logging system with specialized event types for live streaming, auctions, chat, and technical monitoring.

## Overview

The live streaming events system tracks all activities related to:
- Stream lifecycle (start, end, cancellation)
- Viewer interactions (join, leave, engagement)
- Chat functionality (messages, moderation)
- Live auctions (bidding, winners, payments)
- Technical monitoring (errors, quality, connections)
- Content management (products, thumbnails, recordings)

## Event Types

### Stream Lifecycle Events
- `LIVE_STREAM_STARTED` - Stream begins broadcasting
- `LIVE_STREAM_ENDED` - Stream ends normally
- `LIVE_STREAM_CANCELLED` - Stream cancelled before/during broadcast

### Viewer Events
- `LIVE_STREAM_VIEWER_JOINED` - User joins a live stream
- `LIVE_STREAM_VIEWER_LEFT` - User leaves a live stream

### Chat Events
- `LIVE_STREAM_CHAT_MESSAGE_SENT` - User sends a chat message
- `LIVE_STREAM_CHAT_MESSAGE_DELETED` - Message deleted (moderation)

### Moderation Events
- `LIVE_STREAM_USER_BANNED` - User banned from stream
- `LIVE_STREAM_USER_UNBANNED` - User unbanned from stream
- `LIVE_STREAM_MODERATION_ACTION_TAKEN` - General moderation action

### Product Events
- `LIVE_STREAM_PRODUCT_PINNED` - Product highlighted in stream
- `LIVE_STREAM_PRODUCT_UNPINNED` - Product removed from highlight

### Auction Events
- `LIVE_AUCTION_STARTED` - Live auction begins
- `LIVE_AUCTION_ENDED` - Live auction ends
- `LIVE_AUCTION_BID_PLACED` - New bid placed
- `LIVE_AUCTION_BID_CANCELLED` - Bid cancelled
- `LIVE_AUCTION_WINNER_DETERMINED` - Winner declared
- `LIVE_AUCTION_PAYMENT_CAPTURED` - Payment processed

### Technical Events
- `LIVE_STREAM_TECHNICAL_ERROR` - Technical error occurred
- `LIVE_STREAM_QUALITY_DEGRADED` - Stream quality dropped
- `LIVE_STREAM_RTMP_CONNECTION_ESTABLISHED` - RTMP connection established
- `LIVE_STREAM_RTMP_CONNECTION_LOST` - RTMP connection lost
- `LIVE_STREAM_HLS_SEGMENT_CREATED` - HLS segment generated
- `LIVE_STREAM_WEBRTC_CONNECTION_ESTABLISHED` - WebRTC connection established
- `LIVE_STREAM_WEBRTC_CONNECTION_LOST` - WebRTC connection lost

### Recording Events
- `LIVE_STREAM_RECORDING_STARTED` - Recording begins
- `LIVE_STREAM_RECORDING_ENDED` - Recording ends
- `LIVE_STREAM_RECORDING_UPLOADED` - Recording uploaded to storage

### Media Events
- `LIVE_STREAM_THUMBNAIL_UPDATED` - Stream thumbnail changed
- `LIVE_STREAM_METADATA_UPDATED` - Stream metadata updated

### Analytics Events
- `LIVE_STREAM_ANALYTICS_DATA_COLLECTED` - Analytics data gathered

## Usage

### Basic Usage

```typescript
import { LiveStreamingEventHandler } from '../shared/events';
import { AuditService } from '../shared/audit';

// Initialize the event handler
const eventHandler = new LiveStreamingEventHandler(AuditService);

// Log a stream start event
await eventHandler.logStreamStart({
  streamId: 'stream-123',
  sellerId: 'user-456',
  streamTitle: 'Live Auction Event',
  category: 'electronics',
  scheduledStartTime: new Date(),
  streamKey: 'key-abc123',
  rtmpUrl: 'rtmp://stream.example.com/live',
  hlsUrl: 'https://stream.example.com/hls/stream-123.m3u8',
  webrtcUrl: 'https://stream.example.com/webrtc/stream-123',
});
```

### Viewer Events

```typescript
// Viewer joins stream
await eventHandler.logViewerJoined({
  streamId: 'stream-123',
  userId: 'user-789',
  username: 'john_doe',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  country: 'US',
  deviceType: 'mobile',
});

// Viewer leaves stream
await eventHandler.logViewerLeft({
  streamId: 'stream-123',
  userId: 'user-789',
  joinTime: new Date('2024-02-09T10:00:00Z'),
  duration: 1800, // 30 minutes
});
```

### Chat Events

```typescript
// Chat message sent
await eventHandler.logChatMessageSent({
  streamId: 'stream-123',
  messageId: 'msg-456',
  userId: 'user-789',
  username: 'john_doe',
  messageContent: 'Great product! How much for shipping?',
  messageType: 'text',
});

// Chat message deleted (moderation)
await eventHandler.logChatMessageDeleted({
  streamId: 'stream-123',
  messageId: 'msg-456',
  deletedBy: 'user-999', // moderator
  moderationReason: 'inappropriate_content',
});
```

### Auction Events

```typescript
// Auction started
await eventHandler.logAuctionStart({
  streamId: 'stream-123',
  auctionId: 'auction-789',
  productId: 'product-abc',
  productName: 'Vintage Watch',
  startingBid: 100.00,
  endTime: new Date('2024-02-09T12:00:00Z'),
  softCloseEnabled: true,
  softCloseExtension: 300, // 5 minutes
});

// Bid placed
await eventHandler.logBidPlaced({
  streamId: 'stream-123',
  auctionId: 'auction-789',
  productId: 'product-abc',
  productName: 'Vintage Watch',
  bidderId: 'user-789',
  bidderUsername: 'john_doe',
  bidAmount: 150.00,
  currentBid: 150.00,
  bidCount: 5,
  timeRemaining: 600, // 10 minutes
});
```

### Technical Events

```typescript
// Technical error
await eventHandler.logTechnicalError({
  streamId: 'stream-123',
  errorType: 'connection',
  errorCode: 'RTMP_DISCONNECT',
  errorMessage: 'RTMP connection lost unexpectedly',
  retryCount: 3,
});

// Quality degradation
await eventHandler.logQualityDegraded({
  streamId: 'stream-123',
  quality: 'medium',
  bitrate: 1500000, // 1.5 Mbps
  resolution: '1280x720',
  fps: 30,
  reason: 'network_congestion',
});
```

## Event Categories

Events are organized into categories for easier filtering and analysis:

- **Lifecycle**: Stream start/end events
- **Viewer**: User viewing activities
- **Chat**: Chat-related events
- **Moderation**: User management and content moderation
- **Product**: Product showcasing events
- **Auction**: Live auction events
- **Technical**: Infrastructure and quality events
- **Recording**: Stream recording events
- **Media**: Thumbnail and metadata updates
- **Analytics**: Data collection events

## Severity Levels

Each event type has a default severity level:

- **INFO**: Normal operational events (stream start, viewer join, bid placed)
- **WARNING**: Events requiring attention (quality degradation, message deletion)
- **ERROR**: Technical problems (connection lost, encoding errors)
- **CRITICAL**: System-critical issues (complete stream failure)

## Integration with Existing Systems

The live streaming events integrate seamlessly with:
- **Audit Logging**: All events are logged to the audit system
- **Analytics**: Events feed into analytics dashboards
- **Monitoring**: Technical events trigger alerts
- **Compliance**: All events satisfy audit requirements

## Database Schema

The events are stored in the existing `audit_logs` table with:
- `action`: The event type (e.g., 'LIVE_STREAM_STARTED')
- `metadata`: JSON object with event-specific data
- `severity`: Event severity level
- `actorId`: User who triggered the event
- `targetId`: Stream or resource affected
- `targetType`: Type of affected resource
- Standard audit fields (timestamps, IP, user agent, etc.)

## Next Steps

1. **Run Migration**: Execute the database migration to add new event types
2. **Update Prisma Schema**: Regenerate Prisma client with new enum values
3. **Integrate with Services**: Add event logging to eBay Live service components
4. **Create Dashboard**: Build analytics dashboard for live streaming events
5. **Add Monitoring**: Set up alerts for critical events
6. **Performance Testing**: Ensure event logging doesn't impact stream performance