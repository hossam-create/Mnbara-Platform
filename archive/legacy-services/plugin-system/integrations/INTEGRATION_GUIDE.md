# 🎬 eBay Live Plugin Integration Guide

This guide explains how to integrate plugins with the eBay Live streaming service, allowing plugins to respond to live streaming events.

## Overview

The eBay Live Plugin Integration connects the live streaming service with the plugin system through a bridge that:

- **Monitors live streaming events** (stream start/end, viewer interactions, chat, auctions)
- **Triggers plugin hooks** when events occur
- **Logs all events** through the audit system for tracking and analytics
- **Provides real-time integration** between streaming and plugin functionality

## Architecture

```
eBay Live Service → Event Bridge → Plugin System → Plugin Hooks
     ↓                    ↓              ↓            ↓
Stream Events → LiveStreamingPluginBridge → HookSystem → Plugin Code
```

## Supported Events

### Stream Lifecycle Events
- `stream:start` - When a live stream begins
- `stream:end` - When a live stream ends
- `stream:viewer-joined` - When a viewer joins a stream
- `stream:viewer-left` - When a viewer leaves a stream

### Chat Events
- `stream:chat-message` - When a chat message is sent
- `stream:chat-message-deleted` - When a chat message is deleted
- `stream:user-banned` - When a user is banned from chat

### Auction Events
- `stream:auction-started` - When a live auction begins
- `stream:auction-bid` - When a bid is placed
- `stream:product-pinned` - When a product is highlighted

### Technical Events
- `stream:technical-error` - When a technical error occurs
- `stream:quality-degraded` - When stream quality degrades

## Creating a Live Streaming Plugin

### 1. Create Plugin Manifest

```json
{
  "name": "my-live-streaming-plugin",
  "version": "1.0.0",
  "description": "A plugin that responds to live streaming events",
  "main": "dist/index.js",
  "type": "custom",
  "config": {
    "streamUrl": "string",
    "chatEnabled": "boolean",
    "maxViewers": "number"
  },
  "hooks": {
    "stream:start": "onStreamStart",
    "stream:chat-message": "onChatMessage",
    "stream:auction-bid": "onAuctionBid"
  },
  "permissions": [
    "stream:read",
    "chat:read",
    "auction:read"
  ]
}
```

### 2. Implement Plugin Code

```typescript
import { Plugin, PluginContext, PluginConfig } from '@mnbara/plugin-core';

export interface MyPluginConfig extends PluginConfig {
  streamUrl?: string;
  chatEnabled?: boolean;
  maxViewers?: number;
}

export class MyLiveStreamingPlugin implements Plugin {
  private config: MyPluginConfig;
  private context: PluginContext;

  async initialize(config: MyPluginConfig, context: PluginContext): Promise<void> {
    this.config = config;
    this.context = context;
    console.log('🎬 Live streaming plugin initialized');
  }

  /**
   * Handle stream start event
   */
  async onStreamStart(data: any): Promise<void> {
    console.log(`🎬 Stream started: ${data.streamId}`);
    
    // Send notification
    if (this.config.chatEnabled) {
      await this.sendWelcomeMessage(data.streamId);
    }
    
    // Log the event
    await this.context.logInfo('Stream started', { streamId: data.streamId });
  }

  /**
   * Handle chat message event
   */
  async onChatMessage(data: any): Promise<void> {
    console.log(`💬 Chat message: ${data.message} from ${data.username}`);
    
    // Check for special commands
    if (data.message.startsWith('!')) {
      await this.handleCommand(data);
    }
    
    // Filter inappropriate content
    if (this.containsInappropriateContent(data.message)) {
      await this.context.reportViolation('Inappropriate content detected', {
        messageId: data.messageId,
        userId: data.userId
      });
    }
  }

  /**
   * Handle auction bid event
   */
  async onAuctionBid(data: any): Promise<void> {
    console.log(`💰 Bid placed: $${data.bidAmount} by ${data.bidderUsername}`);
    
    // Check if bid is significant
    if (data.bidAmount > 1000) {
      await this.announceHighBid(data);
    }
    
    // Update statistics
    await this.updateBidStatistics(data);
  }

  private async sendWelcomeMessage(streamId: string): Promise<void> {
    // Implementation for sending welcome message
    console.log(`Sending welcome message to stream ${streamId}`);
  }

  private async handleCommand(chatData: any): Promise<void> {
    const command = chatData.message.substring(1).split(' ')[0];
    
    switch (command) {
      case 'help':
        await this.sendHelpMessage(chatData.streamId, chatData.userId);
        break;
      case 'stats':
        await this.sendStatistics(chatData.streamId, chatData.userId);
        break;
      default:
        console.log(`Unknown command: ${command}`);
    }
  }

  private containsInappropriateContent(message: string): boolean {
    // Simple content filtering
    const inappropriateWords = ['spam', 'scam', 'fake'];
    return inappropriateWords.some(word => 
      message.toLowerCase().includes(word)
    );
  }

  private async announceHighBid(bidData: any): Promise<void> {
    console.log(`🎉 High bid alert: $${bidData.bidAmount} by ${bidData.bidderUsername}!`);
    // Implementation for announcing high bids
  }

  private async updateBidStatistics(bidData: any): Promise<void> {
    // Implementation for updating bid statistics
    console.log(`Updating bid statistics for auction ${bidData.auctionId}`);
  }

  private async sendHelpMessage(streamId: string, userId: string): Promise<void> {
    // Implementation for sending help message
    console.log(`Sending help message to user ${userId} in stream ${streamId}`);
  }

  private async sendStatistics(streamId: string, userId: string): Promise<void> {
    // Implementation for sending statistics
    console.log(`Sending statistics to user ${userId} in stream ${streamId}`);
  }

  async destroy(): Promise<void> {
    console.log('🎬 Live streaming plugin destroyed');
  }
}
```

### 3. Build and Deploy

```bash
# Build the plugin
npm run build

# Create plugin package
npm pack

# Install using the plugin CLI
cd ../dev-tools/cli
npm run plugin-dev install ../../my-plugin/my-live-streaming-plugin-1.0.0.tgz
```

## Advanced Features

### 1. Stream Quality Monitoring

```typescript
async onQualityDegraded(data: any): Promise<void> {
  console.log(`📉 Quality degraded: ${data.quality} (${data.resolution}@${data.fps}fps)`);
  
  // Alert streamer
  await this.notifyStreamer(data.streamId, 'Stream quality has degraded');
  
  // Suggest improvements
  if (data.bitrate < 1000) {
    await this.suggestBitrateIncrease(data.streamId);
  }
}
```

### 2. Viewer Analytics

```typescript
async onViewerJoined(data: any): Promise<void> {
  console.log(`👤 Viewer joined: ${data.username} from ${data.country}`);
  
  // Track viewer demographics
  await this.trackViewerDemographics(data);
  
  // Send personalized welcome
  if (data.country === 'ES') {
    await this.sendLocalizedWelcome(data.streamId, data.userId, 'es');
  }
}
```

### 3. Auction Management

```typescript
async onAuctionStarted(data: any): Promise<void> {
  console.log(`🏆 Auction started: ${data.productName} starting at $${data.startingBid}`);
  
  // Set up auction timer
  await this.setupAuctionTimer(data);
  
  // Send notifications to interested users
  await this.notifyInterestedUsers(data);
}

async onAuctionBid(data: any): Promise<void> {
  // Validate bid
  if (data.bidAmount < data.currentBid) {
    await this.rejectBid(data, 'Bid must be higher than current bid');
    return;
  }
  
  // Update real-time display
  await this.updateBidDisplay(data);
  
  // Check for auction end
  if (this.shouldEndAuction(data)) {
    await this.endAuction(data);
  }
}
```

## Integration with External Services

### 1. Social Media Integration

```typescript
async onStreamStart(data: any): Promise<void> {
  // Post to social media
  await this.postToTwitter(`🎬 Going live now! Join my stream: ${data.streamTitle}`);
  await this.postToInstagramStory(data.streamId);
}
```

### 2. Analytics Integration

```typescript
async onViewerJoined(data: any): Promise<void> {
  // Send to Google Analytics
  await this.trackEvent('viewer_joined', {
    stream_id: data.streamId,
    user_id: data.userId,
    country: data.country,
    device_type: data.deviceType
  });
}
```

### 3. CRM Integration

```typescript
async onAuctionWon(data: any): Promise<void> {
  // Update customer record
  await this.updateCustomerRecord(data.bidderId, {
    last_purchase: data.productId,
    total_spent: data.bidAmount,
    auction_wins: 1
  });
  
  // Send follow-up email
  await this.sendPurchaseConfirmation(data);
}
```

## Best Practices

### 1. Error Handling

```typescript
async onStreamStart(data: any): Promise<void> {
  try {
    // Your implementation
    await this.complexOperation(data);
  } catch (error) {
    console.error('Failed to handle stream start:', error);
    await this.context.logError('Stream start handler failed', error);
    
    // Don't throw - let other plugins continue
    // Log and continue gracefully
  }
}
```

### 2. Performance Optimization

```typescript
// Use caching for frequently accessed data
private viewerCache = new Map<string, any>();

async onViewerJoined(data: any): Promise<void> {
  // Check cache first
  if (this.viewerCache.has(data.userId)) {
    const cachedData = this.viewerCache.get(data.userId);
    return this.processCachedViewer(cachedData);
  }
  
  // Fetch and cache
  const viewerData = await this.fetchViewerData(data.userId);
  this.viewerCache.set(data.userId, viewerData);
  
  // Process
  await this.processViewer(viewerData);
}
```

### 3. Rate Limiting

```typescript
private messageRateLimiter = new Map<string, number>();

async onChatMessage(data: any): Promise<void> {
  const key = `${data.streamId}:${data.userId}`;
  const now = Date.now();
  
  // Check rate limit
  const lastMessage = this.messageRateLimiter.get(key);
  if (lastMessage && now - lastMessage < 1000) {
    // Too many messages - ignore or warn
    return;
  }
  
  this.messageRateLimiter.set(key, now);
  
  // Process message
  await this.processChatMessage(data);
}
```

## Testing

### 1. Unit Testing

```typescript
import { MyLiveStreamingPlugin } from '../src/index';

describe('MyLiveStreamingPlugin', () => {
  let plugin: MyLiveStreamingPlugin;
  let mockContext: any;

  beforeEach(() => {
    plugin = new MyLiveStreamingPlugin();
    mockContext = {
      logInfo: jest.fn(),
      logError: jest.fn(),
      reportViolation: jest.fn()
    };
  });

  test('should handle stream start event', async () => {
    const config = { chatEnabled: true };
    await plugin.initialize(config, mockContext);

    const streamData = {
      streamId: 'test-stream',
      sellerId: 'user123',
      streamTitle: 'Test Stream'
    };

    await plugin.onStreamStart(streamData);

    expect(mockContext.logInfo).toHaveBeenCalledWith(
      'Stream started',
      { streamId: 'test-stream' }
    );
  });
});
```

### 2. Integration Testing

```typescript
import { EbayLivePluginIntegration } from '../integrations/ebay-live-plugin-integration';

describe('EbayLivePluginIntegration', () => {
  let integration: EbayLivePluginIntegration;
  let mockHookSystem: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockHookSystem = {
      executeHook: jest.fn().mockResolvedValue({ success: true })
    };
    mockAuditService = {
      log: jest.fn().mockResolvedValue({})
    };

    integration = new EbayLivePluginIntegration(mockHookSystem, mockAuditService);
  });

  test('should bridge stream start event to plugin hook', async () => {
    await integration.initialize();

    const streamData = {
      streamId: 'test-stream',
      sellerId: 'user123',
      streamTitle: 'Test Stream'
    };

    // Simulate stream start event
    integration.bridgeEvent('stream:start', streamData);

    expect(mockHookSystem.executeHook).toHaveBeenCalledWith(
      'stream:start',
      expect.objectContaining({
        streamId: 'test-stream',
        sellerId: 'user123',
        title: 'Test Stream'
      })
    );
  });
});
```

## Deployment

### 1. Environment Configuration

```bash
# .env
PLUGIN_SYSTEM_URL=http://localhost:3015
EBAY_LIVE_SERVICE_URL=http://localhost:3016
REDIS_URL=redis://localhost:6379
AUDIT_SERVICE_URL=http://localhost:3017
```

### 2. Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3015

CMD ["npm", "start"]
```

### 3. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: plugin-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: plugin-system
  template:
    metadata:
      labels:
        app: plugin-system
    spec:
      containers:
      - name: plugin-system
        image: mnbara/plugin-system:latest
        ports:
        - containerPort: 3015
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: EBAY_LIVE_SERVICE_URL
          value: "http://ebay-live-service:3016"
```

## Monitoring and Debugging

### 1. Health Checks

```typescript
// Health check endpoint
app.get('/health/ebay-live-integration', (req, res) => {
  const status = ebayLiveIntegration.getStatus();
  res.json({
    status: status.connected ? 'healthy' : 'unhealthy',
    bridgeReady: status.bridgeReady,
    hookSystemReady: status.hookSystemReady,
    auditServiceReady: status.auditServiceReady,
    timestamp: new Date().toISOString()
  });
});
```

### 2. Metrics Collection

```typescript
// Collect integration metrics
const metrics = {
  eventsProcessed: this.eventCounter,
  hooksExecuted: this.hookCounter,
  errors: this.errorCounter,
  averageProcessingTime: this.getAverageProcessingTime()
};

console.log('Integration Metrics:', metrics);
```

### 3. Logging

```typescript
// Structured logging
logger.info('Live streaming event processed', {
  eventType: 'stream:start',
  streamId: data.streamId,
  pluginCount: hookResult.plugins.length,
  processingTime: Date.now() - startTime,
  success: hookResult.success
});
```

## Troubleshooting

### Common Issues

1. **Plugin hooks not firing**
   - Check that plugins are properly registered
   - Verify hook names match exactly
   - Ensure plugins have required permissions

2. **Events not being logged**
   - Check audit service connectivity
   - Verify event handler initialization
   - Check Redis connection for event bus

3. **Performance issues**
   - Monitor hook execution times
   - Check for blocking operations in plugins
   - Consider implementing caching

4. **Integration not connecting**
   - Verify service URLs in configuration
   - Check network connectivity between services
   - Ensure proper authentication/authorization

### Debug Mode

```typescript
// Enable debug logging
process.env.DEBUG = 'ebay-live-plugin:*';

// Debug integration
const integration = new EbayLivePluginIntegration(hooks, auditService, {
  debug: true,
  logEvents: true,
  logHooks: true
});
```

This completes the comprehensive integration guide for connecting plugins with the eBay Live streaming service!