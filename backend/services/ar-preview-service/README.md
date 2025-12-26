# 🥽 AR Preview Service - خدمة معاينة الواقع المعزز

Augmented Reality product preview for Mnbara platform.

معاينة المنتجات بالواقع المعزز لمنصة منبرة.

## Features | الميزات

### 3D Models | النماذج ثلاثية الأبعاد
- GLB/GLTF format support
- USDZ for iOS (ARKit)
- Automatic model processing
- Texture management

### AR Sessions | جلسات الواقع المعزز
- Session tracking
- Device analytics
- Interaction metrics
- Conversion tracking

### Supported Platforms | المنصات المدعومة
- iOS (ARKit)
- Android (ARCore)
- Web (WebXR)

### Anchor Types | أنواع التثبيت
- Plane (floor/table)
- Vertical (wall)
- Image markers
- Face tracking
- Body tracking

## API Endpoints | نقاط النهاية

### Models
```
GET    /api/models              - List models
GET    /api/models/:productId   - Get model
POST   /api/models              - Create model
PUT    /api/models/:productId   - Update model
DELETE /api/models/:productId   - Archive model
PATCH  /api/models/:productId/status - Update status
POST   /api/models/:productId/view   - Track view
```

### Sessions
```
POST /api/sessions/start              - Start AR session
POST /api/sessions/:id/end            - End session
GET  /api/sessions/:id                - Get session
GET  /api/sessions/user/:userId       - User sessions
POST /api/sessions/:id/screenshot     - Save screenshot
GET  /api/sessions/screenshots/user/:userId - User screenshots
POST /api/sessions/screenshots/:id/share    - Share screenshot
```

### Analytics
```
GET /api/analytics/dashboard    - Dashboard stats
GET /api/analytics/metrics      - Metrics over time
GET /api/analytics/products/top - Top AR products
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
DATABASE_URL=postgresql://user:pass@localhost:5432/ar_db
REDIS_URL=redis://localhost:6379
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=mnbara-ar-models
PORT=3022
```

## Tech Stack | التقنيات

- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Redis (caching)
- AWS S3 (model storage)
- Sharp (image processing)

## Port: 3022
