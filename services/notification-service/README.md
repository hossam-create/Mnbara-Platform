# Notification Service

Complete notification system for Mnbara e-commerce platform with real-time WebSocket support, push notifications (FCM), email (SendGrid), SMS (Twilio), and delivery tracking.

## Features

### 🔔 Notification Channels
- **Push Notifications**: Firebase Cloud Messaging (FCM) for mobile and web
- **Email Notifications**: SendGrid for transactional emails
- **SMS Notifications**: Twilio for SMS alerts
- **In-App Notifications**: Real-time toast notifications and notification center

### ⚡ Real-time Features
- **WebSocket Server**: Socket.IO with Redis adapter for horizontal scaling
- **Live Updates**: Instant notification delivery to connected clients
- **Channel Subscriptions**: Subscribe to specific notification channels
- **Event Broadcasting**: Real-time auction updates, order status, chat messages

### 🔄 Event-Driven Architecture
- **Redis Pub/Sub**: Event-driven notification processing
- **Bull Queue**: Background job processing with retry logic
- **Event Workers**: Dedicated workers for each notification type
- **Cross-Service Communication**: Webhook integrations with other services

### 📊 Delivery Tracking
- **Status Tracking**: PENDING → QUEUED → SENDING → SENT → DELIVERED → READ
- **Delivery Logs**: Complete audit trail of all notifications
- **Retry Logic**: Exponential backoff for failed deliveries
- **Statistics**: Delivery rates, read rates, engagement metrics

### 📝 Notification Templates
- **Template System**: Handlebars-based templating
- **Pre-built Templates**: Auction alerts, order updates, payment confirmations
- **Multi-language Support**: Ready for i18n integration
- **Variables**: Dynamic content with user and transaction data

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Notification Service                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   REST API  │  │  WebSocket  │  │      Event Workers      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │               │                      │                 │
│         └───────────────┴──────────────────────┘                 │
│                           │                                      │
│                    ┌──────▼──────┐                               │
│                    │   Service   │                               │
│                    │   Layer     │                               │
│                    └──────┬──────┘                               │
│                           │                                      │
│  ┌─────────────┐  ┌──────▼──────┐  ┌─────────────┐              │
│  │    Bull     │  │   Redis     │  │   Prisma    │              │
│  │   Queues    │  │   Pub/Sub   │  │   Database  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────────┐  ┌─────────────────┐
│  SendGrid   │     │      FCM        │  │     Twilio      │
│  (Email)    │     │  (Push)         │  │     (SMS)       │
└─────────────┘     └─────────────────┘  └─────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis server
- Firebase project (for push notifications)
- SendGrid account (for emails)
- Twilio account (for SMS)

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate

# Start development server
npm run dev

# Start worker process (separate terminal)
npm run worker
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mnbara_notifications

# Redis
REDIS_URL=redis://localhost:6379

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# SendGrid
SENDGRID_API_KEY=your-api-key
FROM_EMAIL=noreply@mnbara.com

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## API Endpoints

### Notifications

```http
# Create notification
POST /notifications
Content-Type: application/json
{
  "userId": "user-123",
  "type": "NEW_BID_RECEIVED",
  "channel": "PUSH",
  "title": "New Bid!",
  "content": "You received a new bid of $100",
  "priority": "HIGH"
}

# Get user notifications
GET /notifications?userId=user-123&page=1&limit=20

# Mark as read
PUT /notifications/:id/read

# Get unread count
GET /notifications/unread/count?userId=user-123

# Get delivery status
GET /notifications/:id/delivery
```

### Templated Notifications

```http
# Send using template
POST /notifications/templated
{
  "userId": "user-123",
  "templateName": "auction-ending-soon",
  "data": {
    "auctionTitle": "Vintage Watch",
    "minutesRemaining": 15,
    "currentBid": 150,
    "currency": "USD"
  },
  "channel": "PUSH"
}
```

### Service-specific Notifications

```http
# Auction notifications
POST /notifications/auction
{
  "type": "AUCTION_ENDING_SOON",
  "auctionId": "auction-123",
  "auctionTitle": "Vintage Watch",
  "userId": "user-123",
  "data": {
    "minutesRemaining": 15,
    "currentBid": 150
  }
}

# Order notifications
POST /notifications/order
{
  "type": "ORDER_SHIPPED",
  "orderId": "order-123",
  "userId": "user-123",
  "orderDetails": {
    "trackingNumber": "1Z999...",
    "carrier": "UPS"
  }
}

# Payment notifications
POST /notifications/payment
{
  "type": "PAYMENT_RECEIVED",
  "transactionId": "txn-123",
  "amount": 150.00,
  "currency": "USD",
  "userId": "user-123",
  "details": {
    "description": "Auction payment"
  }
}

# Chat notifications
POST /notifications/chat
{
  "conversationId": "conv-123",
  "senderId": "user-456",
  "senderName": "John Doe",
  "recipientId": "user-123",
  "messagePreview": "Hey, is this still available?",
  "messageId": "msg-123"
}
```

### Webhooks

```http
# SendGrid email events
POST /webhooks/sendgrid/event

# Twilio SMS status
POST /webhooks/twilio/sms

# FCM delivery receipts
POST /webhooks/fcm/delivery

# Generic internal events
POST /webhooks/events
{
  "source": "auction-service",
  "event": "AUCTION_ENDED",
  "data": { ... }
}
```

## WebSocket API

### Connection

```javascript
const socket = io('http://localhost:3013', {
  query: { userId: 'user-123' }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});
```

### Subscriptions

```javascript
// Subscribe to specific channels
socket.emit('subscribe', [
  'auction:auction-123',
  'order:user-123',
  'chat:conv-123'
]);

// Unsubscribe
socket.emit('unsubscribe', ['auction:auction-123']);
```

### Events

```javascript
// Bid notifications
socket.on('bid', (event) => {
  console.log('Bid event:', event);
  // { type: 'NEW_BID', auctionId: '...', bidAmount: 100, ... }
});

// Order updates
socket.on('order', (event) => {
  console.log('Order event:', event);
  // { type: 'ORDER_SHIPPED', orderId: '...', ... }
});

// Chat messages
socket.on('message', (event) => {
  console.log('New message:', event);
  // { type: 'NEW_MESSAGE', conversationId: '...', senderName: '...', ... }
});

// Auction alerts
socket.on('auction', (event) => {
  console.log('Auction alert:', event);
  // { type: 'AUCTION_ENDING_SOON', auctionId: '...', minutesRemaining: 15, ... }
});

// Payment notifications
socket.on('payment', (event) => {
  console.log('Payment update:', event);
  // { type: 'PAYMENT_RECEIVED', amount: 100, currency: 'USD', ... }
});
```

## Notification Types

### Auction Notifications
- `AUCTION_ENDING_SOON` - Auction ending in X minutes
- `NEW_BID_RECEIVED` - New bid on user's auction
- `OUTBID` - User has been outbid
- `AUCTION_WON` - User won an auction
- `AUCTION_LOST` - Auction ended without winning
- `AUCTION_CANCELLED` - Auction was cancelled

### Order Notifications
- `ORDER_CONFIRMED` - Order has been confirmed
- `ORDER_SHIPPED` - Order has been shipped
- `ORDER_DELIVERED` - Order has been delivered
- `ORDER_CANCELLED` - Order has been cancelled
- `ORDER_DISPUTE` - Dispute filed on order

### Payment Notifications
- `PAYMENT_RECEIVED` - Payment received successfully
- `PAYMENT_FAILED` - Payment attempt failed
- `REFUND_ISSUED` - Refund has been issued

### Chat Notifications
- `NEW_MESSAGE` - New message in conversation
- `MESSAGE_RECEIVED` - Message delivered to recipient

### System Notifications
- `ACCOUNT_VERIFIED` - Account verification complete
- `PASSWORD_CHANGED` - Password was changed
- `NEW_REVIEW` - Received new review
- `SYSTEM_ALERT` - System-level alert

## Delivery Status Flow

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ PENDING │──►│ QUEUED  │──►│ SENDING │──►│  SENT   │──►│DELIVERED│──►│   READ  │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
      │             │             │             │             │             │
      │             │             │             │             │             ▼
      │             │             │             │             │        ┌─────────┐
      │             │             │             │             │        │DISMISSED│
      │             │             │             │             │        └─────────┘
      │             │             │             │             │
      │             │             │             │             ▼
      │             │             │             │        ┌─────────┐
      │             │             │             │        │ FAILED  │
      │             │             │             │        └─────────┘
      │             │             │             │              │
      │             │             │             │              ▼
      │             │             │             │        ┌─────────┐
      │             │             │             │        │  RETRY  │
      │             │             │             │        └─────────┘
      │             │             │             │              │
      └─────────────┴─────────────┴─────────────┘              │
                    (scheduled)                                │
                                                          (max retries exceeded)
                                                               ▼
                                                        ┌─────────┐
                                                        │DISCARDED│
                                                        └─────────┘
```

## Retry Logic

The service uses exponential backoff for retrying failed notifications:

- **First retry**: 2 seconds after failure
- **Second retry**: 4 seconds after failure
- **Third retry**: 8 seconds after failure
- **Maximum retries**: 3 attempts (configurable)
- **Queue priority**: URGENT > HIGH > NORMAL > LOW

## Scaling

### Horizontal Scaling

The service supports horizontal scaling with Redis pub/sub:

```yaml
# docker-compose.yml
services:
  notification-1:
    image: notification-service
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ID=notification-1
  
  notification-2:
    image: notification-service
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ID=notification-2
  
  notification-3:
    image: notification-service
    environment:
      - REDIS_URL=redis://redis:6379
      - NODE_ID=notification-3
```

### Load Balancing

WebSocket connections can be load-balanced using Redis adapter, ensuring all instances can broadcast to all connected clients.

## Monitoring

### Health Check

```bash
curl http://localhost:3013/health
# Response: { "service": "notification-service", "status": "running" }
```

### Queue Statistics

```bash
curl http://localhost:3013/notifications/stats?userId=user-123
# Response: { "total": 100, "sent": 95, "delivered": 90, "failed": 5 }
```

## License

MIT
