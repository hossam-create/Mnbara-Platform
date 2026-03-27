# Push Notification Service

Mobile push notification service with Firebase Cloud Messaging (FCM) and OneSignal support.

## Features

- **Multi-Provider Support**: FCM and OneSignal
- **Multi-Platform**: iOS, Android, Web
- **Device Management**: Register/unregister devices
- **Targeted Notifications**: Send to specific users, topics, or segments
- **Bulk Notifications**: Send to multiple users at once
- **Rich Notifications**: Images, action URLs, custom data
- **Priority Levels**: LOW, NORMAL, HIGH
- **Notification History**: Track sent notifications
- **Statistics**: Delivery and engagement metrics
- **Template System**: Reusable notification templates

## Installation

```bash
cd backend/services/push-notification-service
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure Firebase (FCM):
   - Go to Firebase Console
   - Project Settings > Service Accounts
   - Generate new private key
   - Copy JSON content to `FIREBASE_SERVICE_ACCOUNT`

3. Configure OneSignal:
   - Go to OneSignal Dashboard
   - Settings > Keys & IDs
   - Copy App ID and API Key

## Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Device Management

#### Register Device
```bash
POST /notifications/devices/register
Content-Type: application/json

{
  "userId": "user-123",
  "token": "device-fcm-token",
  "platform": "IOS",
  "provider": "FCM"
}

Response:
{
  "success": true,
  "message": "Device registered successfully"
}
```

#### Unregister Device
```bash
POST /notifications/devices/unregister
Content-Type: application/json

{
  "token": "device-fcm-token"
}
```

### Send Notifications

#### Send to User
```bash
POST /notifications/send
Content-Type: application/json

{
  "userId": "user-123",
  "title": "New Message",
  "body": "You have a new message from John",
  "data": {
    "messageId": "msg-456",
    "type": "chat"
  },
  "imageUrl": "https://example.com/image.jpg",
  "actionUrl": "/messages/msg-456",
  "priority": "HIGH"
}

Response:
{
  "success": true,
  "notificationId": "notif-789"
}
```

#### Send Bulk
```bash
POST /notifications/send/bulk
Content-Type: application/json

{
  "userIds": ["user-1", "user-2", "user-3"],
  "title": "System Update",
  "body": "New features available!",
  "priority": "NORMAL"
}

Response:
{
  "success": true,
  "sent": 3,
  "failed": 0
}
```

#### Send to Topic (FCM)
```bash
POST /notifications/send/topic
Content-Type: application/json

{
  "topic": "news",
  "title": "Breaking News",
  "body": "Important update for all users"
}
```

#### Send to Segment (OneSignal)
```bash
POST /notifications/send/segment
Content-Type: application/json

{
  "segment": "Active Users",
  "title": "Special Offer",
  "body": "Limited time discount!"
}
```

### History & Stats

#### Get Notification History
```bash
GET /notifications/history/:userId?limit=50

Response:
{
  "success": true,
  "data": [
    {
      "id": "notif-1",
      "title": "New Message",
      "body": "...",
      "status": "DELIVERED",
      "sentAt": "2026-02-03T10:00:00Z"
    }
  ]
}
```

#### Get Statistics
```bash
GET /notifications/stats/:userId

Response:
{
  "success": true,
  "data": {
    "total": 100,
    "sent": 95,
    "delivered": 90,
    "clicked": 45,
    "failed": 5
  }
}
```

## Integration Examples

### Mobile App (React Native)

```typescript
import messaging from '@react-native-firebase/messaging';

// Request permission
const requestPermission = async () => {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
};

// Get FCM token
const getFCMToken = async () => {
  const token = await messaging().getToken();
  return token;
};

// Register device
const registerDevice = async (userId: string) => {
  const token = await getFCMToken();
  
  await fetch('http://localhost:3015/notifications/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      provider: 'FCM',
    }),
  });
};

// Handle foreground notifications
messaging().onMessage(async (remoteMessage) => {
  console.log('Notification received:', remoteMessage);
});

// Handle background notifications
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification:', remoteMessage);
});
```

### Backend Integration

```typescript
// Send notification from another service
const sendPushNotification = async (userId: string, title: string, body: string) => {
  const response = await fetch('http://localhost:3015/notifications/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      title,
      body,
      data: { type: 'order', orderId: '123' },
    }),
  });
  
  return response.json();
};

// Example: Order placed notification
await sendPushNotification(
  'user-123',
  'Order Confirmed',
  'Your order #12345 has been confirmed'
);
```

## Use Cases

### E-commerce
- Order confirmations
- Shipping updates
- Price drop alerts
- Abandoned cart reminders

### Marketplace
- New messages
- Bid notifications
- Auction won/lost
- Payment received

### Social
- New followers
- Likes and comments
- Friend requests
- Event reminders

## Database Schema

```prisma
DeviceToken {
  id, userId, token, platform, provider
  isActive, lastUsed
}

PushNotification {
  id, userId, title, body, data
  imageUrl, actionUrl, priority
  status, provider, providerMsgId
  sentAt, deliveredAt, clickedAt
}

NotificationTemplate {
  id, name, title, body
  data, imageUrl, actionUrl
}
```

## Port

Default: **3015**

## Dependencies

- firebase-admin: Firebase Cloud Messaging
- onesignal-node: OneSignal API client
- @prisma/client: Database ORM
- express: Web framework
- winston: Logging

## Architecture

```
src/
├── controllers/
│   └── notification.controller.ts
├── routes/
│   └── notification.routes.ts
├── services/
│   ├── fcm.service.ts
│   ├── onesignal.service.ts
│   └── notification.service.ts
├── types/
│   └── notification.types.ts
├── utils/
│   └── logger.ts
└── index.ts
```

## License

MIT
