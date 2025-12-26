# 🚀 Feature Management Service - خدمة إدارة الميزات

> Control Your Features with Confidence | تحكم في ميزاتك بثقة

## Overview | نظرة عامة

Feature Management Service provides a comprehensive feature flags and release management system for the Mnbara platform. Enable/disable features with a single click from the admin dashboard!

خدمة إدارة الميزات توفر نظام شامل لأعلام الميزات وإدارة الإصدارات لمنصة منبرة. فعّل/عطّل الميزات بضغطة زر واحدة من لوحة تحكم الأدمن!

## 🌟 Features | الميزات

### Feature Flags | أعلام الميزات
- ✅ Enable/Disable features instantly
- 📊 Gradual rollout (0-100%)
- 🎯 User/Region/Subscription overrides
- 🔗 Feature dependencies
- 📈 Real-time metrics

### Release Management | إدارة الإصدارات
- 📦 Version-based releases
- 📅 Scheduled deployments
- 🔄 One-click rollback
- 📜 Changelog generation

### Real-time Updates | التحديثات الفورية
- 🔌 WebSocket support
- 📡 Instant feature changes
- 🔔 Admin notifications

## 🏗️ Architecture | البنية

```
Port: 3028
Database: PostgreSQL
Cache: Redis
Real-time: Socket.IO
```

## 📡 API Endpoints | نقاط النهاية

### Features | الميزات

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/features` | Create feature |
| GET | `/api/v1/features` | List features |
| GET | `/api/v1/features/:key` | Get feature |
| PUT | `/api/v1/features/:key` | Update feature |
| POST | `/api/v1/features/:key/enable` | Enable feature ✅ |
| POST | `/api/v1/features/:key/disable` | Disable feature ❌ |
| POST | `/api/v1/features/:key/rollout` | Set rollout % |
| GET | `/api/v1/features/:key/check` | Check if enabled |
| POST | `/api/v1/features/check` | Bulk check |
| GET | `/api/v1/features/client/enabled` | Get client features |
| POST | `/api/v1/features/:key/overrides` | Add override |
| DELETE | `/api/v1/features/:key/overrides` | Remove override |
| GET | `/api/v1/features/:key/metrics` | Get metrics |

### Releases | الإصدارات

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/releases` | Create release |
| GET | `/api/v1/releases` | List releases |
| GET | `/api/v1/releases/:version` | Get release |
| PUT | `/api/v1/releases/:version` | Update release |
| POST | `/api/v1/releases/:version/schedule` | Schedule release |
| POST | `/api/v1/releases/:version/deploy` | Deploy release 🚀 |
| POST | `/api/v1/releases/:version/rollback` | Rollback release ↩️ |
| GET | `/api/v1/releases/changelog/all` | Get changelog |

### Config | الإعدادات

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/config` | List configs |
| GET | `/api/v1/config/:key` | Get config |
| PUT | `/api/v1/config/:key` | Set config |
| DELETE | `/api/v1/config/:key` | Delete config |

## 🎯 Feature Categories | فئات الميزات

| Category | Description | الوصف |
|----------|-------------|-------|
| FINTECH | Financial services | الخدمات المالية |
| LOGISTICS | Delivery & shipping | التوصيل والشحن |
| MARKETPLACE | Trading features | ميزات التداول |
| AI | AI-powered features | ميزات الذكاء الاصطناعي |
| SECURITY | Security features | ميزات الأمان |
| COMMUNICATION | Chat & notifications | الدردشة والإشعارات |
| ANALYTICS | Reports & dashboards | التقارير ولوحات المعلومات |
| EXPERIMENTAL | Beta features | الميزات التجريبية |

## 🔄 Rollout Strategies | استراتيجيات النشر

| Strategy | Description |
|----------|-------------|
| ALL_OR_NOTHING | 0% or 100% |
| PERCENTAGE | Gradual rollout |
| USER_LIST | Specific users |
| REGION | By geographic region |
| SUBSCRIPTION | By subscription tier |

## 📊 Platform Features | ميزات المنصة

### FinTech | التكنولوجيا المالية
- `bnpl_service` - Buy Now Pay Later
- `crypto_payments` - Cryptocurrency Payments
- `multi_currency_wallet` - Multi-Currency Wallet
- `escrow_protection` - Escrow Payment Protection
- `paypal_integration` - PayPal Integration

### AI | الذكاء الاصطناعي
- `ai_assistant` - AI Shopping Assistant
- `mnbara_ai_engine` - Mnbara AI Engine
- `ai_fraud_detection` - AI Fraud Detection
- `ai_price_optimization` - AI Price Optimization

### Marketplace | السوق
- `wholesale_marketplace` - B2B Wholesale
- `auction_system` - Auction System

### Logistics | اللوجستيات
- `smart_delivery` - Smart Delivery
- `crowdshipping` - Crowdshipping
- `live_tracking` - Live Location Tracking

### Experimental | تجريبي
- `ar_product_preview` - AR Product Preview
- `voice_search` - Voice Search

## 🚀 Quick Start | البداية السريعة

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed

# Start development server
npm run dev
```

## 🔌 WebSocket Events | أحداث WebSocket

### Subscribe to updates
```javascript
socket.emit('subscribe:features');
```

### Listen for changes
```javascript
socket.on('feature:enabled', (data) => {
  console.log(`Feature ${data.key} enabled`);
});

socket.on('feature:disabled', (data) => {
  console.log(`Feature ${data.key} disabled`);
});

socket.on('release:deployed', (data) => {
  console.log(`Release ${data.version} deployed`);
});
```

## 📝 Usage Examples | أمثلة الاستخدام

### Enable a Feature
```bash
curl -X POST http://localhost:3028/api/v1/features/wholesale_marketplace/enable \
  -H "Content-Type: application/json" \
  -H "x-admin-id: admin123" \
  -d '{"reason": "Q2 2026 Launch"}'
```

### Set Gradual Rollout
```bash
curl -X POST http://localhost:3028/api/v1/features/voice_search/rollout \
  -H "Content-Type: application/json" \
  -d '{"percentage": 25}'
```

### Check Feature for User
```bash
curl "http://localhost:3028/api/v1/features/ai_assistant/check?userId=user123&subscription=premium"
```

### Deploy Release
```bash
curl -X POST http://localhost:3028/api/v1/releases/3.0.0/deploy \
  -H "x-admin-id: admin123"
```

## 🔧 Environment Variables | متغيرات البيئة

```env
PORT=3028
DATABASE_URL=postgresql://user:pass@localhost:5432/feature_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3021
```

## 📈 Metrics | المقاييس

The service tracks:
- Total feature checks
- Enabled/Disabled ratio
- Unique users per feature
- Response times
- Error rates

---

**Mnbara Platform** | منصة منبرة
*Control Your Features with Confidence* | *تحكم في ميزاتك بثقة*
