# 🛡️ Fraud Detection Service - خدمة كشف الاحتيال

Real-time fraud detection and prevention system for Mnbara platform.

نظام كشف الاحتيال والوقاية في الوقت الفعلي لمنصة منبرة.

## Features | الميزات

### Transaction Analysis | تحليل المعاملات
- Real-time risk scoring (0-100)
- Multi-factor analysis (velocity, amount, device, location, history)
- ML model integration support
- Automatic decision making (Approve/Review/Challenge/Decline)

### User Risk Profiles | ملفات مخاطر المستخدمين
- Dynamic risk scoring per user
- Trust score tracking
- Known devices and locations
- Chargeback and refund history

### Alert Management | إدارة التنبيهات
- Real-time fraud alerts
- Severity levels (Low/Medium/High/Critical)
- Review workflow
- Bulk operations

### Blacklist Management | إدارة القائمة السوداء
- IP addresses
- Email addresses
- Device IDs
- Card BINs
- User IDs

### Fraud Rules | قواعد الاحتيال
- Velocity rules
- Amount rules
- Location rules
- Device rules
- Behavior patterns
- ML model rules

## API Endpoints | نقاط النهاية

### Transaction Analysis
```
POST /api/fraud/analyze          - Analyze transaction
GET  /api/fraud/transaction/:id  - Get transaction risk
```

### User Risk Profile
```
GET  /api/fraud/user/:id/profile - Get user risk profile
PUT  /api/fraud/user/:id/profile - Update user risk profile
POST /api/fraud/user/:id/device  - Add known device
POST /api/fraud/user/:id/location - Add known location
```

### Alerts
```
GET  /api/alerts                 - List alerts
GET  /api/alerts/:id             - Get alert details
PUT  /api/alerts/:id/review      - Review alert
POST /api/alerts/:id/escalate    - Escalate alert
POST /api/alerts/bulk-review     - Bulk review alerts
```

### Blacklist
```
GET    /api/blacklist            - List blacklist entries
POST   /api/blacklist            - Add to blacklist
DELETE /api/blacklist/:type/:val - Remove from blacklist
GET    /api/blacklist/check/:type/:val - Check if blacklisted
```

### Rules
```
GET    /api/rules                - List rules
POST   /api/rules                - Create rule
PUT    /api/rules/:id            - Update rule
DELETE /api/rules/:id            - Delete rule
PATCH  /api/rules/:id/toggle     - Toggle rule
```

### Dashboard
```
GET /api/fraud/dashboard         - Get dashboard stats
GET /api/fraud/metrics           - Get metrics
```

## Risk Scoring | تسجيل المخاطر

| Score Range | Risk Level | Decision |
|-------------|------------|----------|
| 0-19        | Very Low   | Approved |
| 20-39       | Low        | Approved |
| 40-49       | Medium     | Approved |
| 50-69       | Medium     | Challenge (3DS) |
| 70-84       | High       | Review |
| 85-100      | Very High  | Declined |

## Setup | الإعداد

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run seed

# Start development server
npm run dev
```

## Environment Variables | متغيرات البيئة

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/fraud_db
REDIS_URL=redis://localhost:6379
PORT=3020
```

## Tech Stack | التقنيات

- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis (caching & pub/sub)
- ioredis

## Port: 3020
