# Sprint 0.2 Services - Quick Reference

**All 16 Services at a Glance**

---

## Service Ports & Endpoints

| Port | Service | Health Check | Key Features |
|------|---------|--------------|--------------|
| 3014 | Auth Service | `/health` | OAuth2, JWT, Social Login |
| 3015 | Push Notifications | `/health` | FCM, OneSignal, iOS/Android |
| 3016 | Chat Service | `/health` | Socket.IO, Real-time messaging |
| 3017 | File Storage | `/health` | S3, Image processing |
| 3018 | Job Queue | `/health` | BullMQ, Background jobs |
| 3019 | Image Recognition | `/health` | TensorFlow.js, ML classification |
| 3020 | Recommendations | `/health` | Collaborative filtering |

---

## Quick Test Commands

### Auth Service (3014)
```bash
# Register
curl -X POST http://localhost:3014/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test"}'

# Login
curl -X POST http://localhost:3014/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

### Push Notifications (3015)
```bash
curl -X POST http://localhost:3015/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","title":"Test","body":"Hello"}'
```

### Chat Service (3016)
```bash
# Create conversation
curl -X POST http://localhost:3016/chat/conversations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"DIRECT","participantIds":["user-1","user-2"]}'
```

### File Storage (3017)
```bash
curl -X POST http://localhost:3017/files/upload \
  -F "file=@photo.jpg" \
  -F "folder=products" \
  -F "generateThumbnail=true"
```

### Job Queue (3018)
```bash
curl -X POST http://localhost:3018/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"queue":"email","data":{"to":"user@example.com","subject":"Test"}}'
```

### Image Recognition (3019)
```bash
curl -X POST http://localhost:3019/api/recognition/analyze \
  -F "image=@product.jpg" \
  -F "detectObjects=true"
```

### Recommendations (3020)
```bash
curl http://localhost:3020/api/recommendations/users/user-123?limit=10
```

---

## Installation

### All Services
```bash
# Install dependencies for all services
cd backend/services/auth-service && npm install
cd backend/services/push-notification-service && npm install
cd backend/services/chat-service && npm install
cd backend/services/file-storage-service && npm install
cd backend/services/job-queue-service && npm install
cd backend/services/image-recognition-service && npm install
cd backend/services/recommendation-engine-service && npm install
```

### Database Migrations
```bash
# Run migrations
cd backend/services/auth-service && npx prisma migrate deploy
cd backend/services/push-notification-service && npx prisma migrate deploy
cd backend/services/chat-service && npx prisma migrate deploy
cd backend/services/recommendation-engine-service && npx prisma migrate deploy
```

---

## Environment Setup

### Required Environment Variables

**Auth Service (.env)**
```env
PORT=3014
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_id
FACEBOOK_APP_ID=your_facebook_id
```

**File Storage (.env)**
```env
PORT=3017
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=mnbara-uploads
```

**Job Queue (.env)**
```env
PORT=3018
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Common Integration Patterns

### 1. User Registration Flow
```javascript
// 1. Register user
const { user, tokens } = await registerUser(email, password);

// 2. Send welcome email (Job Queue)
await queueJob('email', { to: email, template: 'welcome' });

// 3. Send push notification
await sendPushNotification(user.id, 'Welcome!', 'Thanks for joining');
```

### 2. Product Upload Flow
```javascript
// 1. Upload image
const { url } = await uploadFile(imageFile);

// 2. Analyze with AI
const { category, tags } = await analyzeImage(imageFile);

// 3. Create product
await createProduct({ name, category, tags, imageUrl: url });

// 4. Queue image processing
await queueJob('image-processing', { imageUrl: url });
```

### 3. Personalized Homepage
```javascript
// 1. Track user view
await trackInteraction({ userId, productId, type: 'VIEW' });

// 2. Get recommendations
const recs = await getRecommendations(userId, 20);

// 3. Display products
displayProducts(recs);
```

---

## Monitoring

### Health Checks
```bash
# Check all services
curl http://localhost:3014/health  # Auth
curl http://localhost:3015/health  # Push
curl http://localhost:3016/health  # Chat
curl http://localhost:3017/health  # Files
curl http://localhost:3018/health  # Jobs
curl http://localhost:3019/health  # Image AI
curl http://localhost:3020/health  # Recommendations
```

### Job Queue Stats
```bash
curl http://localhost:3018/api/queues/stats
```

---

## Troubleshooting

### Service Won't Start
1. Check port availability: `netstat -an | findstr :PORT`
2. Verify environment variables
3. Check database connection
4. Review logs

### Database Issues
```bash
# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Redis Connection
```bash
# Test Redis
redis-cli ping
```

---

## Documentation Links

- Auth Service: `backend/services/auth-service/README.md`
- Push Notifications: `backend/services/push-notification-service/README.md`
- Chat Service: `backend/services/chat-service/README.md`
- File Storage: `backend/services/file-storage-service/README.md`
- Job Queue: `backend/services/job-queue-service/README.md`
- Image Recognition: `backend/services/image-recognition-service/README.md`
- Recommendations: `backend/services/recommendation-engine-service/README.md`

---

**Quick Reference Updated**: February 3, 2026

