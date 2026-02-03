# Notification Service

SMS and Email notification service with Twilio and SendGrid.

## Features

- **Email**: SendGrid integration with HTML templates
- **SMS**: Twilio integration for text messages
- **Templates**: Handlebars template engine
- **Queue**: Bull queue for async processing (optional)
- **Tracking**: Database storage for all notifications
- **Status**: Delivery status tracking

## Setup

### 1. Install Dependencies

```bash
cd backend/services/notification-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Add your API keys:
```env
# SendGrid
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@mnbara.com
FROM_NAME=Mnbara

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Database
DATABASE_URL="postgresql://..."

# Redis (optional, for queue)
REDIS_URL="redis://localhost:6379"
```

### 3. Database Setup

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Start Service

```bash
npm run dev
```

## API Endpoints

### Email

**POST /notifications/email**
Send email.

```bash
curl -X POST http://localhost:3013/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello</h1>",
    "text": "Hello"
  }'
```

**POST /notifications/email/template**
Send templated email.

```bash
curl -X POST http://localhost:3013/notifications/email/template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "template": "welcome",
    "data": {"name": "John"}
  }'
```

### SMS

**POST /notifications/sms**
Send SMS.

```bash
curl -X POST http://localhost:3013/notifications/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Hello from Mnbara!"
  }'
```

**POST /notifications/otp**
Send OTP.

```bash
curl -X POST http://localhost:3013/notifications/otp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "code": "123456"
  }'
```

**GET /notifications/sms/:sid/status**
Get SMS delivery status.

```bash
curl http://localhost:3013/notifications/sms/SMxxx/status
```

### Convenience Endpoints

**POST /notifications/welcome**
Send welcome email.

```bash
curl -X POST http://localhost:3013/notifications/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "name": "John Doe"
  }'
```

**POST /notifications/order-confirmation**
Send order confirmation.

```bash
curl -X POST http://localhost:3013/notifications/order-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "orderId": "ORD123",
    "orderDetails": {
      "productName": "iPhone 15",
      "amount": 999,
      "currency": "USD"
    }
  }'
```

## Email Templates

Templates are stored in `src/templates/`:

- `welcome.html` - Welcome email
- `order-confirmation.html` - Order confirmation
- `password-reset.html` - Password reset
- `auction-won.html` - Auction won notification
- `auction-outbid.html` - Outbid notification

### Creating New Templates

1. Create HTML file: `src/templates/my-template.html`
2. Create text file: `src/templates/my-template.txt`
3. Create metadata: `src/templates/my-template.json`

Example metadata:
```json
{
  "subject": "My Subject - {{variable}}",
  "variables": ["variable"]
}
```

Use Handlebars syntax in templates:
```html
<h1>Hello {{name}}!</h1>
<p>Amount: {{formatCurrency amount currency}}</p>
```

## Integration with Mnbara

### User Registration
```typescript
await notificationService.sendWelcomeEmail(email, name);
```

### Order Confirmation
```typescript
await notificationService.sendOrderConfirmation(email, orderId, orderDetails);
```

### OTP Verification
```typescript
const code = generateOTP();
await notificationService.sendOTP(phoneNumber, code);
```

### Auction Notifications
```typescript
// Winner
await notificationService.sendAuctionWon(email, auctionId, details);

// Outbid
await notificationService.sendAuctionOutbid(email, auctionId, details);
```

## Database Schema

### Notification
- id, type (EMAIL/SMS)
- recipient, subject, content
- status (PENDING/SENT/FAILED/DELIVERED)
- provider (SENDGRID/TWILIO)
- providerId, error
- timestamps

### NotificationTemplate
- id, name, type
- subject, template
- variables, active
- timestamps

## Port

Default: 3013

## Dependencies

- @sendgrid/mail: SendGrid SDK
- twilio: Twilio SDK
- handlebars: Template engine
- bull: Job queue (optional)
- @prisma/client: Database ORM

## Testing

```bash
# Test email
npm run test:email

# Test SMS
npm run test:sms
```

## Production Considerations

1. **Rate Limiting**: Implement rate limits for SMS/email
2. **Queue**: Use Bull queue for async processing
3. **Retry**: Implement retry logic for failed sends
4. **Monitoring**: Track delivery rates and failures
5. **Unsubscribe**: Add unsubscribe links to emails
6. **Compliance**: Follow CAN-SPAM and GDPR rules
