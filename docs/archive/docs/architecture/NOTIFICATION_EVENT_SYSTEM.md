# Notification & Event System - System Architecture Design

## 1. EVENT BUS ARCHITECTURE

### Event Schema

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_source VARCHAR(100) NOT NULL, -- Service that emitted
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Metadata
  correlation_id UUID, -- For tracing
  causation_id UUID, -- Parent event
  
  -- Status
  status ENUM('PUBLISHED', 'PROCESSING', 'PROCESSED', 'FAILED'),
  
  -- Timestamps
  published_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  
  -- Immutability
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT event_immutable CHECK (created_at = published_at)
);

CREATE INDEX idx_event_type ON events(event_type);
CREATE INDEX idx_event_source ON events(event_source);
CREATE INDEX idx_event_correlation ON events(correlation_id);
CREATE INDEX idx_event_status ON events(status);
CREATE INDEX idx_event_published ON events(published_at);
```

---

### Event Types

```typescript
interface Event {
  id: UUID;
  eventType: string;
  eventSource: string;
  payload: Record<string, any>;
  correlationId: UUID;
  causationId?: UUID;
  publishedAt: Date;
}

// Auction events
interface AuctionBidPlacedEvent extends Event {
  eventType: 'auction.bid_placed';
  payload: {
    auctionId: UUID;
    bidderId: UUID;
    bidAmount: Decimal;
    previousBidderId?: UUID;
  };
}

interface AuctionEndedEvent extends Event {
  eventType: 'auction.ended';
  payload: {
    auctionId: UUID;
    winnerId: UUID;
    finalPrice: Decimal;
  };
}

// Order events
interface OrderCreatedEvent extends Event {
  eventType: 'order.created';
  payload: {
    orderId: UUID;
    buyerId: UUID;
    sellerId: UUID;
    total: Decimal;
  };
}

interface OrderPaidEvent extends Event {
  eventType: 'order.paid';
  payload: {
    orderId: UUID;
    paymentId: UUID;
    amount: Decimal;
  };
}

// Dispute events
interface DisputeCreatedEvent extends Event {
  eventType: 'dispute.created';
  payload: {
    disputeId: UUID;
    transactionId: UUID;
    buyerId: UUID;
    sellerId: UUID;
    reason: string;
  };
}

interface DisputeResolvedEvent extends Event {
  eventType: 'dispute.resolved';
  payload: {
    disputeId: UUID;
    resolution: 'BUYER_WIN' | 'SELLER_WIN' | 'PARTIAL';
    buyerRefund: Decimal;
    sellerPayout: Decimal;
  };
}

// Settlement events
interface SettlementBatchCreatedEvent extends Event {
  eventType: 'settlement.batch_created';
  payload: {
    batchId: UUID;
    batchDate: Date;
    transactionCount: number;
  };
}

interface SettlementExecutedEvent extends Event {
  eventType: 'settlement.executed';
  payload: {
    batchId: UUID;
    totalAmount: Decimal;
    executedAt: Date;
  };
}
```

---

### Event Bus Service

```typescript
interface EventBus {
  // Publish event
  publish(event: Event): Promise<void>;
  
  // Subscribe to event type
  subscribe(
    eventType: string,
    handler: (event: Event) => Promise<void>
  ): void;
  
  // Get event history
  getEventHistory(
    correlationId: UUID,
    limit?: number
  ): Promise<Event[]>;
  
  // Replay events
  replayEvents(
    startDate: Date,
    endDate: Date,
    eventType?: string
  ): Promise<void>;
}

class EventBusImpl implements EventBus {
  private subscribers: Map<string, Function[]> = new Map();
  
  async publish(event: Event): Promise<void> {
    // 1. Store event
    await insertEvent(event);
    
    // 2. Get subscribers
    const handlers = this.subscribers.get(event.eventType) || [];
    
    // 3. Execute handlers (async, non-blocking)
    for (const handler of handlers) {
      // Fire and forget with error handling
      handler(event).catch(err => {
        console.error(`Event handler failed: ${err.message}`);
        // Log to dead letter queue
        await insertDeadLetterEvent(event, err);
      });
    }
  }
  
  subscribe(eventType: string, handler: Function): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
  }
  
  async getEventHistory(
    correlationId: UUID,
    limit: number = 100
  ): Promise<Event[]> {
    return await queryEvents({
      correlationId,
      limit,
      orderBy: 'published_at DESC'
    });
  }
  
  async replayEvents(
    startDate: Date,
    endDate: Date,
    eventType?: string
  ): Promise<void> {
    const events = await queryEvents({
      publishedAtRange: { start: startDate, end: endDate },
      eventType,
      orderBy: 'published_at ASC'
    });
    
    for (const event of events) {
      await this.publish(event);
    }
  }
}
```

---

## 2. NOTIFICATION SYSTEM

### Notification Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  
  -- Recipient
  user_id UUID NOT NULL,
  
  -- Notification details
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Channels
  channels JSONB, -- ['EMAIL', 'SMS', 'PUSH', 'IN_APP']
  
  -- Status
  status ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'),
  
  -- Delivery
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- User interaction
  read_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT notification_immutable CHECK (created_at = created_at)
);

CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_type ON notifications(notification_type);
CREATE INDEX idx_notification_status ON notifications(status);
CREATE INDEX idx_notification_created ON notifications(created_at);
```

---

### Notification Channels

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Notification type preferences
  auction_notifications BOOLEAN DEFAULT true,
  order_notifications BOOLEAN DEFAULT true,
  dispute_notifications BOOLEAN DEFAULT true,
  settlement_notifications BOOLEAN DEFAULT true,
  
  -- Frequency
  email_frequency ENUM('IMMEDIATE', 'DAILY', 'WEEKLY', 'NEVER'),
  sms_frequency ENUM('IMMEDIATE', 'DAILY', 'WEEKLY', 'NEVER'),
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_preferences_user ON notification_preferences(user_id);
```

---

### Notification Service

```typescript
interface NotificationService {
  // Send notification
  sendNotification(
    userId: UUID,
    type: string,
    title: string,
    message: string,
    channels: string[]
  ): Promise<Notification>;
  
  // Get notifications
  getNotifications(
    userId: UUID,
    limit?: number,
    offset?: number
  ): Promise<Notification[]>;
  
  // Mark as read
  markAsRead(notificationId: UUID): Promise<void>;
  
  // Get preferences
  getPreferences(userId: UUID): Promise<NotificationPreferences>;
  
  // Update preferences
  updatePreferences(
    userId: UUID,
    preferences: Partial<NotificationPreferences>
  ): Promise<void>;
}

class NotificationServiceImpl implements NotificationService {
  async sendNotification(
    userId: UUID,
    type: string,
    title: string,
    message: string,
    channels: string[]
  ): Promise<Notification> {
    // 1. Get user preferences
    const prefs = await getPreferences(userId);
    
    // 2. Filter channels based on preferences
    const activeChannels = channels.filter(ch => {
      switch (ch) {
        case 'EMAIL': return prefs.email_enabled;
        case 'SMS': return prefs.sms_enabled;
        case 'PUSH': return prefs.push_enabled;
        case 'IN_APP': return prefs.in_app_enabled;
        default: return false;
      }
    });
    
    // 3. Check quiet hours
    if (prefs.quiet_hours_enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const quietStart = parseTime(prefs.quiet_hours_start);
      const quietEnd = parseTime(prefs.quiet_hours_end);
      
      if (currentTime >= quietStart && currentTime < quietEnd) {
        // Only allow in-app during quiet hours
        activeChannels = activeChannels.filter(ch => ch === 'IN_APP');
      }
    }
    
    // 4. Create notification
    const notification = {
      id: generateUUID(),
      user_id: userId,
      notification_type: type,
      title,
      message,
      channels: activeChannels,
      status: 'PENDING',
      created_at: now()
    };
    
    // 5. Store notification
    await insertNotification(notification);
    
    // 6. Send via channels
    for (const channel of activeChannels) {
      await sendViaChannel(channel, userId, notification);
    }
    
    return notification;
  }
  
  async markAsRead(notificationId: UUID): Promise<void> {
    await updateNotification(notificationId, {
      read_at: now()
    });
  }
}
```

---

## 3. WEBHOOK SYSTEM

### Webhook Schema

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  
  -- Webhook details
  user_id UUID NOT NULL,
  url VARCHAR(2048) NOT NULL,
  
  -- Events
  event_types JSONB, -- Array of subscribed event types
  
  -- Status
  status ENUM('ACTIVE', 'INACTIVE', 'FAILED'),
  
  -- Delivery
  last_delivery_at TIMESTAMP,
  last_delivery_status INT, -- HTTP status code
  failure_count INT DEFAULT 0,
  
  -- Security
  secret_key VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_user ON webhooks(user_id);
CREATE INDEX idx_webhook_status ON webhooks(status);
```

---

### Webhook Delivery

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES webhooks(id),
  event_id UUID NOT NULL REFERENCES events(id),
  
  -- Delivery details
  payload JSONB,
  
  -- Response
  status_code INT,
  response_body TEXT,
  
  -- Retry
  attempt_count INT DEFAULT 1,
  next_retry_at TIMESTAMP,
  
  -- Timestamps
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_delivery_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_delivery_event ON webhook_deliveries(event_id);
```

---

### Webhook Service

```typescript
interface WebhookService {
  // Register webhook
  registerWebhook(
    userId: UUID,
    url: string,
    eventTypes: string[]
  ): Promise<Webhook>;
  
  // Deliver webhook
  deliverWebhook(
    webhookId: UUID,
    event: Event
  ): Promise<void>;
  
  // Get webhook deliveries
  getDeliveries(
    webhookId: UUID,
    limit?: number
  ): Promise<WebhookDelivery[]>;
  
  // Retry failed delivery
  retryDelivery(deliveryId: UUID): Promise<void>;
}

class WebhookServiceImpl implements WebhookService {
  async deliverWebhook(
    webhookId: UUID,
    event: Event
  ): Promise<void> {
    const webhook = await getWebhook(webhookId);
    
    // 1. Check if webhook subscribes to event type
    if (!webhook.event_types.includes(event.eventType)) {
      return;
    }
    
    // 2. Create payload
    const payload = {
      id: generateUUID(),
      timestamp: now(),
      event: event,
      signature: generateSignature(event, webhook.secret_key)
    };
    
    // 3. Attempt delivery
    let statusCode: number;
    let responseBody: string;
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': payload.signature,
          'X-Webhook-ID': webhookId
        },
        body: JSON.stringify(payload),
        timeout: 30000 // 30 seconds
      });
      
      statusCode = response.status;
      responseBody = await response.text();
    } catch (err) {
      statusCode = 0;
      responseBody = err.message;
    }
    
    // 4. Store delivery
    const delivery = {
      id: generateUUID(),
      webhook_id: webhookId,
      event_id: event.id,
      payload,
      status_code: statusCode,
      response_body: responseBody,
      delivered_at: statusCode >= 200 && statusCode < 300 ? now() : null,
      created_at: now()
    };
    
    await insertDelivery(delivery);
    
    // 5. Handle failure
    if (statusCode < 200 || statusCode >= 300) {
      await handleDeliveryFailure(webhookId, delivery);
    }
  }
  
  private async handleDeliveryFailure(
    webhookId: UUID,
    delivery: WebhookDelivery
  ): Promise<void> {
    const webhook = await getWebhook(webhookId);
    
    // Increment failure count
    const newFailureCount = webhook.failure_count + 1;
    
    // Exponential backoff retry
    const retryDelays = [60, 300, 900, 3600]; // seconds
    const nextRetry = retryDelays[Math.min(newFailureCount - 1, 3)];
    
    // Update webhook
    await updateWebhook(webhookId, {
      failure_count: newFailureCount,
      status: newFailureCount > 5 ? 'FAILED' : 'ACTIVE'
    });
    
    // Schedule retry
    await scheduleRetry(delivery.id, addSeconds(now(), nextRetry));
  }
}
```

---

## 4. REAL-TIME UPDATES

### WebSocket Schema

```sql
CREATE TABLE websocket_connections (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Connection details
  connection_id VARCHAR(255) NOT NULL UNIQUE,
  subscribed_channels JSONB, -- ['auction:123', 'order:456']
  
  -- Status
  status ENUM('CONNECTED', 'DISCONNECTED'),
  
  -- Timestamps
  connected_at TIMESTAMP DEFAULT NOW(),
  disconnected_at TIMESTAMP,
  last_heartbeat TIMESTAMP
);

CREATE INDEX idx_connection_user ON websocket_connections(user_id);
CREATE INDEX idx_connection_status ON websocket_connections(status);
```

---

### WebSocket Service

```typescript
interface WebSocketService {
  // Handle connection
  handleConnection(userId: UUID, connectionId: string): void;
  
  // Handle disconnection
  handleDisconnection(connectionId: string): void;
  
  // Subscribe to channel
  subscribe(connectionId: string, channel: string): void;
  
  // Broadcast to channel
  broadcast(channel: string, message: any): void;
  
  // Send to user
  sendToUser(userId: UUID, message: any): void;
}

class WebSocketServiceImpl implements WebSocketService {
  private connections: Map<string, WebSocketConnection> = new Map();
  private channels: Map<string, Set<string>> = new Map();
  
  handleConnection(userId: UUID, connectionId: string): void {
    this.connections.set(connectionId, {
      userId,
      connectionId,
      subscribedChannels: new Set(),
      connectedAt: now()
    });
  }
  
  subscribe(connectionId: string, channel: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;
    
    conn.subscribedChannels.add(channel);
    
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(connectionId);
  }
  
  broadcast(channel: string, message: any): void {
    const connections = this.channels.get(channel);
    if (!connections) return;
    
    for (const connectionId of connections) {
      const ws = getWebSocketConnection(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }
  
  sendToUser(userId: UUID, message: any): void {
    for (const [connectionId, conn] of this.connections) {
      if (conn.userId === userId) {
        const ws = getWebSocketConnection(connectionId);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      }
    }
  }
}
```

---

## 5. NON-NEGOTIABLES

### Events Must Be Immutable

**FORBIDDEN:**
```typescript
// ❌ WRONG - Event can be modified
async function updateEvent(eventId: UUID, newPayload: any) {
  await db.query(
    'UPDATE events SET payload = $1 WHERE id = $2',
    [newPayload, eventId]
  );
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Events are append-only
async function publishEvent(event: Event): Promise<void> {
  // Only insert, never update
  await insertEvent({
    ...event,
    id: generateUUID(),
    published_at: now(),
    created_at: now()
  });
}
```

---

### Notifications Must Respect Preferences

**FORBIDDEN:**
```typescript
// ❌ WRONG - Ignore user preferences
async function sendNotification(userId: UUID, message: string) {
  // Send to all channels regardless of preferences
  await sendEmail(userId, message);
  await sendSMS(userId, message);
  await sendPush(userId, message);
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Check preferences
async function sendNotification(
  userId: UUID,
  message: string
): Promise<void> {
  const prefs = await getPreferences(userId);
  
  if (prefs.email_enabled) {
    await sendEmail(userId, message);
  }
  
  if (prefs.sms_enabled) {
    await sendSMS(userId, message);
  }
  
  if (prefs.push_enabled) {
    await sendPush(userId, message);
  }
}
```

---

### Webhooks Must Be Signed

**FORBIDDEN:**
```typescript
// ❌ WRONG - Unsigned webhook
async function deliverWebhook(webhook: Webhook, event: Event) {
  await fetch(webhook.url, {
    method: 'POST',
    body: JSON.stringify(event)
    // No signature
  });
}
```

**CORRECT:**
```typescript
// ✅ RIGHT - Signed webhook
async function deliverWebhook(webhook: Webhook, event: Event) {
  const signature = generateSignature(event, webhook.secret_key);
  
  await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'X-Webhook-Signature': signature,
      'X-Webhook-ID': webhook.id
    },
    body: JSON.stringify(event)
  });
}
```

---

## 6. IMPLEMENTATION ROADMAP

### Phase 1: Event Bus (Weeks 1-2)
- [ ] Create event schema
- [ ] Implement event publishing
- [ ] Add event subscription
- [ ] Create event history

### Phase 2: Notifications (Weeks 3-4)
- [ ] Create notification schema
- [ ] Implement notification service
- [ ] Add preference management
- [ ] Create notification channels

### Phase 3: Webhooks (Weeks 5-6)
- [ ] Create webhook schema
- [ ] Implement webhook delivery
- [ ] Add retry logic
- [ ] Create webhook signing

### Phase 4: Real-Time (Weeks 7-8)
- [ ] Implement WebSocket service
- [ ] Add channel subscriptions
- [ ] Create real-time broadcasts
- [ ] Add connection management

---

**Document Version:** 1.0  
**Last Updated:** December 20, 2025  
**Status:** Architecture Design (Ready for Implementation)
