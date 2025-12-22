# MNBARA Platform

A comprehensive e-commerce marketplace platform with auctions, crowdshipping, escrow payments, and blockchain integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start all services in development
npm run dev

# Or run individual services
npm run dev:auth
npm run dev:listing
npm run dev:auction
npm run dev:payment
```

## 📁 Project Structure

```
mnbara-platform/
├── .github/                    # GitHub configuration
│   ├── workflows/              # CI/CD pipelines
│   │   ├── ci.yml              # Continuous integration
│   │   ├── deploy.yml          # Deployment pipeline
│   │   ├── release.yml         # Production releases
│   │   └── pr-check.yml        # PR validation
│   └── PULL_REQUEST_TEMPLATE.md
│
├── backend/                    # Backend microservices
│   └── services/
│       ├── api-gateway/        # API Gateway (Kong/Express)
│       ├── auth-service/       # Authentication & authorization
│       ├── listing-service/    # Product listings
│       ├── auction-service/    # Real-time auctions
│       ├── payment-service/    # Payments & escrow
│       ├── crowdship-service/  # Crowdshipping logistics
│       ├── notification-service/ # Push & email notifications
│       ├── recommendation-service/ # AI recommendations (Python)
│       ├── rewards-service/    # Loyalty program
│       ├── orders-service/     # Order management
│       ├── trips-service/      # Traveler trips
│       ├── matching-service/   # Geo-spatial matching
│       ├── admin-service/      # Admin operations
│       └── shared/             # Shared utilities
│           ├── audit/          # Audit logging
│           ├── database/       # DB encryption & migrations
│           ├── media/          # Watermarking & fingerprinting
│           └── middleware/     # Shared middleware
│
├── frontend/                   # Frontend applications
│   ├── web/                    # React web application
│   │   └── src/
│   │       ├── components/     # Reusable components
│   │       ├── context/        # React contexts
│   │       ├── hooks/          # Custom hooks
│   │       ├── pages/          # Page components
│   │       ├── services/       # API services
│   │       └── utils/          # Utilities
│   ├── admin-dashboard/        # Admin React application
│   │   └── src/
│   │       ├── components/     # Dashboard components
│   │       ├── pages/          # Admin pages
│   │       └── services/       # Admin API services
│   └── mobile/
│       └── mnbara-app/         # React Native mobile app
│           └── src/
│               ├── components/ # Mobile components
│               ├── hooks/      # Mobile hooks
│               ├── navigation/ # Navigation setup
│               ├── screens/    # Screen components
│               ├── services/   # Mobile services
│               └── store/      # State management
│
├── contracts/                  # Solidity smart contracts
│   ├── MNBToken.sol            # MNB ERC-20 token
│   ├── MNBExchange.sol         # Token exchange
│   ├── MNBAuctionEscrow.sol    # Auction escrow
│   ├── MNBStaking.sol          # Token staking
│   ├── MNBGovernance.sol       # DAO governance
│   └── MNBWallet.sol           # Multi-sig wallet
│
├── infrastructure/             # Infrastructure as Code
│   ├── k8s/                    # Kubernetes Helm charts
│   │   └── mnbara/
│   │       ├── templates/      # K8s manifests
│   │       ├── values.yaml     # Default values
│   │       ├── values-dev.yaml # Development
│   │       ├── values-staging.yaml # Staging
│   │       └── values-prod.yaml # Production
│   ├── terraform/              # AWS infrastructure
│   ├── docker/                 # Docker configurations
│   └── monitoring/             # Prometheus/Grafana
│
├── docs/                       # Documentation
│   ├── api/                    # API documentation
│   ├── architecture/           # Architecture diagrams
│   ├── database/               # Database schemas
│   ├── deployment/             # Deployment guides
│   └── security/               # Security documentation
│
├── scripts/                    # Utility scripts
│   ├── database/               # DB setup scripts
│   ├── deploy/                 # Deployment scripts
│   └── blockchain/             # Contract deployment
│
└── .kiro/                      # Kiro specifications
    └── specs/
        └── ecommerce-platform/
            ├── requirements.md # EARS requirements
            ├── design.md       # Technical design
            └── tasks.md        # Implementation tasks
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js, NestJS
- **Database**: PostgreSQL 15 with PostGIS
- **Cache**: Redis 7
- **Message Queue**: RabbitMQ
- **Search**: Elasticsearch 8
- **Object Storage**: MinIO / AWS S3
- **AI/ML**: Python FastAPI with scikit-learn

### Frontend
- **Web**: React 18 + TypeScript + Vite
- **Mobile**: React Native 0.72+
- **State**: Zustand, React Context
- **UI**: Tailwind CSS, Ant Design
- **Charts**: Recharts

### Blockchain
- **Network**: Ethereum / Polygon
- **Contracts**: Solidity 0.8+
- **Tools**: Hardhat, ethers.js

### Infrastructure
- **Container**: Docker, Kubernetes
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (EKS, RDS, S3, CloudFront)
- **Monitoring**: Prometheus, Grafana, Sentry

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### Environment Setup

```bash
# Clone repository
git clone https://github.com/mnbara/mnbara-platform.git
cd mnbara-platform

# Install dependencies
npm install

# Copy environment files
cp .env.example .env

# Start infrastructure services
docker-compose up -d postgres redis rabbitmq

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

### Running Individual Services

```bash
# Backend services
cd backend/services/auth-service && npm run dev
cd backend/services/auction-service && npm run dev
cd backend/services/payment-service && npm run dev

# Frontend web
cd frontend/web && npm run dev

# Admin dashboard
cd frontend/admin-dashboard && npm run dev

# Mobile app
cd frontend/mobile/mnbara-app && npm run ios
cd frontend/mobile/mnbara-app && npm run android

# Recommendation service (Python)
cd backend/services/recommendation-service
pip install -r requirements.txt
uvicorn src.main:app --reload
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific service tests
cd backend/services/auth-service && npm test
cd frontend/web && npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📦 Deployment

### Kubernetes (Helm)

```bash
# Add Bitnami repo
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Deploy to staging
cd infrastructure/k8s/mnbara
helm dependency update
helm install mnbara . -f values-staging.yaml -n mnbara-staging --create-namespace

# Deploy to production
helm install mnbara . -f values-prod.yaml -n mnbara-prod --create-namespace
```

### CI/CD Pipelines

- **ci.yml**: Runs on every push/PR - linting, testing, security scans
- **deploy.yml**: Deploys to staging/production on merge to main
- **release.yml**: Creates production releases with tags
- **pr-check.yml**: Validates PRs with targeted testing

## 🎨 Favicon & Branding

The platform includes comprehensive favicon support for all browsers and devices:

### Favicon Files Location

```
frontend/web/public/
├── favicon.ico              # Legacy browsers (ICO format)
├── favicon.svg              # Modern browsers (SVG, scalable)
├── favicon-96x96.png        # High-DPI displays
├── apple-touch-icon.png     # iOS home screen (180x180)
├── web-app-manifest-192x192.png  # Android Chrome (192x192)
├── web-app-manifest-512x512.png  # Android Chrome (512x512)
├── site.webmanifest         # PWA manifest
└── browserconfig.xml        # Microsoft tiles

frontend/admin-dashboard/public/
└── (same structure as web)
```

### Updating Favicons

1. Generate new favicons using [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Download the favicon package
3. Replace files in `frontend/web/public/` and `frontend/admin-dashboard/public/`
4. Update `site.webmanifest` if icon names change
5. Update `browserconfig.xml` for Microsoft tiles

### Browser Support

| Browser/Device | Icon Used |
|----------------|-----------|
| Chrome/Firefox | favicon.svg or favicon.ico |
| Safari | favicon.svg, apple-touch-icon.png |
| iOS Home Screen | apple-touch-icon.png (180x180) |
| Android Chrome | web-app-manifest-*.png via manifest |
| Windows Tiles | browserconfig.xml references |

## 🎮 مركز التحكم وإدارة الصلاحيات (RBAC)

### هيكل الصلاحيات
يتضمن النظام إدارة صلاحيات متقدمة (RBAC) مع مستويات متعددة:

#### الأدوار الرئيسية
| الدور | الوصف | الصلاحيات |
|-------|-------|-----------|
| **المشرف العام** | صلاحيات كاملة على النظام | جميع الصلاحيات |
| **مدير العمليات** | إدارة العمليات اليومية | إدارة المستخدمين، المراجعة، التقارير |
| **مدير الدفع** | إدارة المعاملات المالية | معالجة المدفوعات، المراجعة، الإرجاعات |
| **مدير المحتوى** | إدارة المحتوى والعروض | الموافقة على القوائم، إدارة التصنيفات |
| **مدير الأمان** | مراقبة الأمان والامتثال | مراجعة السجلات، كشف الاحتيال |
| **المشرف التقني** | الصيانة التقنية | إدارة الخدمات، المراقبة، السجلات |

### صفحات مركز التحكم

#### 📊 لوحة التحكم الرئيسية
- نظرة عامة على أداء النظام
- إحصائيات المعاملات والمستخدمين
- رسوم بيانية حية للأداء

#### 👥 إدارة المستخدمين
- عرض وتعديل بيانات المستخدمين
- إدارة الصلاحيات والأدوار
- تعليق/تفعيل الحسابات
- مراجعة أنشطة المستخدمين

#### 💰 إدارة المدفوعات
- مراجعة المعاملات المالية
- إدارة طلبات الإرجاع
- متابعة المدفوعات المعلقة
- تقارير الإيرادات

#### ⚖️ إدارة النزاعات
- عرض النزاعات النشطة
- تخصيص المحكمين
- متابعة قرارات النزاعات
- سجل قرارات النزاعات

#### 📈 التقارير والتحليلات
- تقارير أداء النظام
- تحليلات المستخدمين
- تقارير الإيرادات
- مؤشرات الأداء الرئيسية

#### ⚙️ إدارة الميزات (Feature Flags)
- التحكم في إطلاق الميزات
- إدارة تجارب A/B
- مراقبة تأثير الميزات

#### 🔐 إدارة الأمان
- مراجعة سجلات التدقيق
- كشف الأنشطة المشبوهة
- إعدادات الأمان
- إدارة المفاتيح والتواقيع

### إعداد الصلاحيات

```typescript
// مثال: تعريف صلاحية جديدة
const permissions = {
  // إدارة المستخدمين
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  
  // إدارة المدفوعات
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_APPROVE: 'payment:approve',
  PAYMENT_REFUND: 'payment:refund',
  
  // إدارة النزاعات
  DISPUTE_VIEW: 'dispute:view',
  DISPUTE_RESOLVE: 'dispute:resolve',
  DISPUTE_ASSIGN: 'dispute:assign',
  
  // التقارير
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',
  
  // إدارة النظام
  SYSTEM_CONFIG: 'system:config',
  FEATURE_TOGGLE: 'feature:toggle',
};
```

### حماية المسارات
يتم حماية جميع مسارات مركز التحكم بطبقات أمان متعددة:

1. **المصادقة**: JWT tokens مع refresh tokens
2. **الصلاحيات**: تحقق RBAC لكل endpoint
3. **التدقيق**: تسجيل جميع الإجراءات في سجلات التدقيق
4. **المراقبة**: مراقبة في الوقت الحقيقي للأنشطة

### الوصول إلى مركز التحكم
- **التطوير**: `http://localhost:5173/admin`
- **التجريبي**: `https://staging.mnbara.com/admin`
- **الإنتاج**: `https://app.mnbara.com/admin`

### استكشاف الأخطاء
- تحقق من صلاحيات المستخدم في `/admin/users`
- راجع سجلات التدقيق في `/admin/audit-logs`
- تحقق من تكوين RBAC في `backend/services/admin-service/src/shared/rbac/`

## 🔐 Security Features

- JWT/OAuth2 authentication with refresh tokens
- Role-based access control (RBAC) with **Ship Control** for high-privilege operations.
- PostgreSQL encryption (TDE + field-level)
- Audit logging for all sensitive operations (Manual decisions, device events)
- Rate limiting and DDoS protection
- Image watermarking and fingerprinting
- Secure secret management

## 📊 Monitoring

- **Sentry**: Error tracking and performance monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and alerting
- **ServiceMonitor**: Kubernetes service discovery

## 🏗️ Architecture

The platform follows a microservices architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │   Web    │  │  Mobile  │  │    Admin Dashboard       │  │
│  └────┬─────┘  └────┬─────┘  └───────────┬──────────────┘  │
└───────┼─────────────┼────────────────────┼──────────────────┘
        │             │                    │
        └─────────────┼────────────────────┘
                      ▼
              ┌───────────────┐
              │  API Gateway  │
              │   (Kong)      │
              └───────┬───────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌───────────┐    ┌───────────┐
│  Auth   │    │  Listing  │    │  Auction  │
│ Service │    │  Service  │    │  Service  │
└────┬────┘    └─────┬─────┘    └─────┬─────┘
     │               │                │
     └───────────────┼────────────────┘
                     ▼
              ┌───────────────┐
              │  PostgreSQL   │
              │  + PostGIS    │
              └───────────────┘
```

## 📝 API Documentation

API documentation is available at:
- Development: `http://localhost:8080/api/docs`
- Staging: `https://api-staging.mnbara.com/docs`
- Production: `https://api.mnbara.com/docs`

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Follow conventional commit format
3. Ensure all tests pass
4. Submit PR with description

## 📄 License

Proprietary - All Rights Reserved © 2024 MNBARA
