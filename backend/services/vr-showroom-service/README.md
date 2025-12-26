# 🥽 VR Showroom Service - خدمة صالة العرض الافتراضية

Virtual Reality shopping experience for Mnbara platform.

تجربة تسوق بالواقع الافتراضي لمنصة منبرة.

## Features | الميزات

### Virtual Showrooms | صالات العرض الافتراضية
- Multiple environment types (Modern Store, Luxury Boutique, etc.)
- Custom 3D scenes support
- Product placement and arrangement
- Real-time multi-user support

### VR Events | أحداث الواقع الافتراضي
- Product launches
- Flash sales
- Live shopping events
- Brand showcases
- Virtual auctions

### Avatars | الأفاتارات
- Customizable avatars
- Multiple styles (Realistic, Cartoon, Custom)
- Accessories support

### Real-time Features | الميزات الفورية
- WebSocket for live updates
- User position synchronization
- Product interactions broadcast
- Voice chat support (planned)

## API Endpoints | نقاط النهاية

### Showrooms
```
GET    /api/showrooms              - List showrooms
GET    /api/showrooms/:id          - Get showroom
POST   /api/showrooms              - Create showroom
PUT    /api/showrooms/:id          - Update showroom
POST   /api/showrooms/:id/publish  - Publish showroom
```

### Products
```
POST   /api/showrooms/:id/products           - Add product
PUT    /api/showrooms/products/:id/position  - Update position
DELETE /api/showrooms/products/:id           - Remove product
POST   /api/showrooms/products/:id/interact  - Track interaction
```

### Sessions
```
POST /api/sessions/start      - Start VR session
POST /api/sessions/:id/end    - End session
GET  /api/sessions/:id        - Get session
GET  /api/sessions/user/:id   - User sessions
```

### Events
```
GET    /api/events                    - List events
GET    /api/events/:id                - Get event
POST   /api/events                    - Create event
PUT    /api/events/:id                - Update event
POST   /api/events/:id/register       - Register for event
DELETE /api/events/:id/register/:uid  - Unregister
POST   /api/events/:id/start          - Start event
POST   /api/events/:id/end            - End event
```

### Avatars
```
GET  /api/avatars/:userId  - Get avatar
POST /api/avatars          - Create avatar
PUT  /api/avatars/:userId  - Update avatar
```

## WebSocket Events | أحداث WebSocket

```javascript
// Client -> Server
socket.emit('join-showroom', showroomId);
socket.emit('leave-showroom', showroomId);
socket.emit('position-update', { showroomId, position, rotation });
socket.emit('interact-product', { showroomId, productId, action });

// Server -> Client
socket.on('user-joined', { socketId });
socket.on('user-left', { socketId });
socket.on('user-moved', { socketId, position, rotation });
socket.on('product-interaction', { socketId, productId, action });
```

## Setup | الإعداد

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Environment Variables | متغيرات البيئة

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/vr_db
REDIS_URL=redis://localhost:6379
PORT=3024
```

## Tech Stack | التقنيات

- Node.js + Express + TypeScript
- Socket.io (real-time)
- Prisma ORM + PostgreSQL
- Redis (caching)

## Port: 3024
