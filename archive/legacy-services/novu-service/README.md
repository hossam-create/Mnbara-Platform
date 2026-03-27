# Novu Unified Notification Infrastructure

**Port**: 3027  
**Database**: PostgreSQL  
**External Service**: Novu Cloud

## Overview

Unified notification management system using Novu for multi-channel notifications (email, SMS, push, in-app). Provides centralized notification orchestration with subscriber management, preferences, and delivery tracking.

## Features

### Notification Management
- **Trigger Notifications**: Send notifications via templates
- **Broadcast**: Send to all subscribers
- **Cancel**: Cancel pending notifications
- **History**: Track all notification deliveries

### Subscriber Management
- **Upsert Subscribers**: Create/update subscriber profiles
- **Delete Subscribers**: Remove subscribers
- **Preferences**: Channel-specific notification preferences
- **Profile Data**: Custom subscriber metadata

### Notification Feed
- **In-App Feed**: Real-time notification feed
- **Mark as Read**: Individual or bulk read status
- **Unseen Count**: Badge count for unread notifications
- **Pagination**: Efficient feed loading

### Multi-Channel Support
- **Email**: Transactional and marketing emails
- **SMS**: Text message notifications
- **Push**: Mobile push notifications
- **In-App**: Real-time in-app notifications

## API Endpoints

### Notifications
```
POST   /api/notifications/trigger          - Trigger notification
POST   /api/notifications/broadcast        - Broadcast to all
GET    /api/notifications/:subscriberId/feed - Get notification feed
POST   /api/notifications/:subscriberId/:messageId/read - Mark as read
POST   /api/notifications/:subscriberId/read-all - Mark all as read
GET    /api/notifications/:subscriberId/unseen - Get unseen count
DELETE /api/notifications/:transactionId   - Cancel notification
GET    /api/notifications/:subscriberId/history - Get history
```

### Subscribers
```
POST   /api/subscribers                    - Create/update subscriber
DELETE /api/subscribers/:subscriberId      - Delete subscriber
PUT    /api/subscribers/:subscriberId/preferences - Update preferences
GET    /api/subscribers/:subscriberId/preferences - Get preferences
```

## Setup

### 1. Environment Variables
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/novu_db
NOVU_API_KEY=your_novu_api_key
PORT=3027
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration
```bash
npm run migrate
```

### 4. Start Service
```bash
npm run dev
```

## Usage Examples

### Trigger Notification
```typescript
POST /api/notifications/trigger
{
  "subscriberId": "user123",
  "templateId": "order-confirmation",
  "payload": {
    "orderId": "ORD-12345",
    "amount": 99.99,
    "items": ["Product A", "Product B"]
  },
  "overrides": {
    "email": {
      "subject": "Your Order #ORD-12345 is Confirmed"
    }
  }
}
```

### Broadcast Notification
```typescript
POST /api/notifications/broadcast
{
  "templateId": "system-maintenance",
  "payload": {
    "message": "Scheduled maintenance on Feb 10, 2026",
    "duration": "2 hours"
  }
}
```

### Create Subscriber
```typescript
POST /api/subscribers
{
  "subscriberId": "user123",
  "email": "user@example.com",
  "phone": "+966501234567",
  "firstName": "Ahmed",
  "lastName": "Ali",
  "data": {
    "language": "ar",
    "timezone": "Asia/Riyadh"
  }
}
```

### Get Notification Feed
```typescript
GET /api/notifications/user123/feed?page=0

Response:
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "msg123",
        "content": "Your order has been shipped",
        "seen": false,
        "read": false,
        "createdAt": "2026-02-04T10:00:00Z"
      }
    ],
    "totalCount": 15,
    "hasMore": true
  }
}
```

### Update Preferences
```typescript
PUT /api/subscribers/user123/preferences
{
  "templateId": "marketing-emails",
  "channel": "email",
  "enabled": false
}
```

## Database Schema

### Subscriber
- `id`: Unique identifier
- `subscriberId`: External subscriber ID
- `email`: Email address
- `phone`: Phone number
- `firstName`: First name
- `lastName`: Last name
- `data`: Custom JSON data
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp

### Notification
- `id`: Unique identifier
- `subscriberId`: Subscriber reference
- `templateId`: Notification template
- `payload`: Notification data
- `transactionId`: Novu transaction ID
- `status`: sent | failed | cancelled
- `error`: Error message (if failed)
- `createdAt`: Creation timestamp

## Integration with Novu

### Template Setup
1. Create templates in Novu dashboard
2. Configure channels (email, SMS, push, in-app)
3. Design notification content with variables
4. Test templates before production

### Workflow
1. **Trigger**: Service calls Novu API with template + data
2. **Process**: Novu processes template and sends via channels
3. **Track**: Service logs delivery status in database
4. **Feed**: Subscribers retrieve in-app notifications
5. **Interact**: Mark as read, manage preferences

## Best Practices

### Template Design
- Use clear, actionable content
- Include relevant data in payload
- Test across all channels
- Support multiple languages

### Subscriber Management
- Keep subscriber data up-to-date
- Respect preference settings
- Clean up inactive subscribers
- Validate email/phone formats

### Performance
- Use broadcast for mass notifications
- Paginate notification feeds
- Cache unseen counts
- Index database queries

### Error Handling
- Log failed notifications
- Retry transient failures
- Alert on high failure rates
- Monitor delivery metrics

## Monitoring

### Key Metrics
- Notification delivery rate
- Channel-specific success rates
- Average delivery time
- Subscriber engagement
- Preference opt-out rates

### Health Checks
- Novu API connectivity
- Database connection
- Template availability
- Queue processing

## Common Use Cases

### Order Notifications
```typescript
// Order confirmation
await triggerNotification({
  subscriberId: userId,
  templateId: 'order-confirmation',
  payload: { orderId, items, total }
});

// Shipping update
await triggerNotification({
  subscriberId: userId,
  templateId: 'order-shipped',
  payload: { orderId, trackingNumber }
});
```

### Marketing Campaigns
```typescript
// Broadcast promotion
await broadcastNotification('flash-sale', {
  discount: '50%',
  endTime: '2026-02-10T23:59:59Z'
});
```

### System Alerts
```typescript
// Maintenance notification
await broadcastNotification('maintenance-alert', {
  startTime: '2026-02-10T02:00:00Z',
  duration: '2 hours'
});
```

## Dependencies

- `@novu/node`: Novu Node.js SDK
- `@prisma/client`: Database ORM
- `express`: Web framework
- `winston`: Logging

## Port

Service runs on port **3027**

## License

MIT
