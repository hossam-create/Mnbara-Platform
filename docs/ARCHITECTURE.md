# Mnbara Platform - System Architecture

**Version:** 1.0  
**Last Updated:** 2025-12-22  
**Status:** 🔴 IN PROGRESS

---

## 📐 Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Web (React)  │  Mobile (Flutter)  │  Admin Dashboard       │
└────────┬──────────────────────────────────────────────┬─────┘
         │                                              │
         └──────────────────┬───────────────────────────┘
                            │
         ┌──────────────────▼───────────────────────┐
         │      API Gateway (Express)               │
         │  - Request routing                       │
         │  - Authentication                        │
         │  - Rate limiting                         │
         │  - Load balancing                        │
         └──────────────────┬───────────────────────┘
                            │
         ┌──────────────────▼───────────────────────┐
         │    Microservices Layer (13 Services)     │
         ├──────────────────────────────────────────┤
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Auth Service                   │    │
         │  │  - User authentication (JWT)    │    │
         │  │  - OAuth 2.0 (Google, Apple)    │    │
         │  │  - Profile management           │    │
         │  │  - RBAC                         │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Listing Service                │    │
         │  │  - Product listings             │    │
         │  │  - Category management          │    │
         │  │  - Catalog management           │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Auction Service                │    │
         │  │  - Auction lifecycle            │    │
         │  │  - Bidding system               │    │
         │  │  - Winner determination         │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Payment Service                │    │
         │  │  - Multi-currency wallet        │    │
         │  │  - Escrow system                │    │
         │  │  - Commission handling          │    │
         │  │  - Stripe integration           │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Crowdship Service              │    │
         │  │  - Dynamic pricing              │    │
         │  │  - Shipment tracking            │    │
         │  │  - Delivery status              │    │
         │  │  - Location-based features      │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Matching Service               │    │
         │  │  - Order-traveler matching      │    │
         │  │  - Geo-spatial search           │    │
         │  │  - Event publishing             │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Trips Service                  │    │
         │  │  - Traveler availability        │    │
         │  │  - Trip route tracking          │    │
         │  │  - Location updates             │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Recommendation Service         │    │
         │  │  - ML model infrastructure      │    │
         │  │  - Geospatial filtering         │    │
         │  │  - Context analysis             │    │
         │  │  - Opportunity detection        │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Rewards Service                │    │
         │  │  - Points earning               │    │
         │  │  - Redemption                   │    │
         │  │  - Leaderboard                  │    │
         │  │  - Tier-based rewards           │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Notification Service           │    │
         │  │  - Webhook system               │    │
         │  │  - Event-driven notifications   │    │
         │  │  - RabbitMQ consumer            │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Orders Service                 │    │
         │  │  - Order management             │    │
         │  │  - Status tracking              │    │
         │  │  - Buyer-traveler coordination  │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  KYC Service (NEW)              │    │
         │  │  - Verification workflow        │    │
         │  │  - Document verification        │    │
         │  │  - Compliance tracking          │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Swap Service (NEW)             │    │
         │  │  - P2P swap matching            │    │
         │  │  - Dispute resolution           │    │
         │  │  - Rating system                │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Ledger Service (NEW)           │    │
         │  │  - Blockchain integration       │    │
         │  │  - Immutable transaction log    │    │
         │  │  - Smart contracts              │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         └──────────────────┬───────────────────────┘
                            │
         ┌──────────────────▼───────────────────────┐
         │    Data & Infrastructure Layer           │
         ├──────────────────────────────────────────┤
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  PostgreSQL + PostGIS           │    │
         │  │  - User & profile data          │    │
         │  │  - Product & auction data       │    │
         │  │  - Location data (PostGIS)      │    │
         │  │  - Transaction data             │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Redis (with GEO module)        │    │
         │  │  - Caching                      │    │
         │  │  - Session management           │    │
         │  │  - Geospatial queries           │    │
         │  │  - Real-time data               │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Elasticsearch                  │    │
         │  │  - Full-text search             │    │
         │  │  - Advanced filtering           │    │
         │  │  - Analytics                    │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  RabbitMQ                       │    │
         │  │  - Async messaging              │    │
         │  │  - Event streaming              │    │
         │  │  - Service communication        │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Blockchain (Ethereum/Polygon)  │    │
         │  │  - Immutable ledger             │    │
         │  │  - Smart contracts              │    │
         │  │  - Transaction verification     │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  HashiCorp Vault                │    │
         │  │  - Secret management            │    │
         │  │  - Encryption keys              │    │
         │  │  - API credentials              │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         └──────────────────┬───────────────────────┘
                            │
         ┌──────────────────▼───────────────────────┐
         │    Monitoring & Observability Layer      │
         ├──────────────────────────────────────────┤
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Prometheus                     │    │
         │  │  - Metrics collection           │    │
         │  │  - Time-series database         │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Grafana                        │    │
         │  │  - Metrics visualization        │    │
         │  │  - Dashboards                   │    │
         │  │  - Alerting                     │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  ELK Stack                      │    │
         │  │  - Elasticsearch (logs)         │    │
         │  │  - Logstash (processing)        │    │
         │  │  - Kibana (visualization)       │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         │  ┌─────────────────────────────────┐    │
         │  │  Jaeger                         │    │
         │  │  - Distributed tracing          │    │
         │  │  - Request flow visualization   │    │
         │  └─────────────────────────────────┘    │
         │                                          │
         └──────────────────────────────────────────┘
```

---

## 🏗️ Service Responsibilities

### Core Services (Existing)

#### 1. Auth Service
- **Responsibility:** User authentication and authorization
- **Dependencies:** PostgreSQL, Redis, Vault
- **Provides:** JWT tokens, OAuth integration
- **Consumes:** User credentials, OAuth tokens

#### 2. Listing Service
- **Responsibility:** Product and catalog management
- **Dependencies:** PostgreSQL, Elasticsearch
- **Provides:** Product listings, categories
- **Consumes:** Product data, search queries

#### 3. Auction Service
- **Responsibility:** Auction lifecycle and bidding
- **Dependencies:** PostgreSQL, RabbitMQ
- **Provides:** Auction management, bid processing
- **Consumes:** Auction events, bid data

#### 4. Payment Service
- **Responsibility:** Financial transactions and wallet management
- **Dependencies:** PostgreSQL, Stripe API, Vault
- **Provides:** Payment processing, wallet operations
- **Consumes:** Transaction requests, payment data

#### 5. Crowdship Service
- **Responsibility:** Delivery and shipment management
- **Dependencies:** PostgreSQL, Redis (GEO), RabbitMQ
- **Provides:** Shipment tracking, delivery status
- **Consumes:** Order data, location updates

#### 6. Matching Service
- **Responsibility:** Order-traveler matching algorithm
- **Dependencies:** PostgreSQL, Redis (GEO), RabbitMQ
- **Provides:** Matching results, recommendations
- **Consumes:** Order data, traveler data

#### 7. Trips Service
- **Responsibility:** Traveler availability and route tracking
- **Dependencies:** PostgreSQL, Redis (GEO)
- **Provides:** Trip data, location updates
- **Consumes:** Traveler data, location events

#### 8. Recommendation Service
- **Responsibility:** ML-based recommendations
- **Dependencies:** PostgreSQL, Python/FastAPI, Redis
- **Provides:** Personalized recommendations
- **Consumes:** User behavior, context data

#### 9. Rewards Service
- **Responsibility:** Points and loyalty management
- **Dependencies:** PostgreSQL, Redis
- **Provides:** Points tracking, redemption
- **Consumes:** User activity, transaction data

#### 10. Notification Service
- **Responsibility:** Event-driven notifications
- **Dependencies:** RabbitMQ, Email/SMS providers
- **Provides:** Notifications, webhooks
- **Consumes:** System events, user preferences

#### 11. Orders Service
- **Responsibility:** Order management and coordination
- **Dependencies:** PostgreSQL, RabbitMQ
- **Provides:** Order tracking, status updates
- **Consumes:** Order events, user requests

### New Services (To Be Implemented)

#### 12. KYC Service
- **Responsibility:** Know Your Customer verification
- **Dependencies:** PostgreSQL, External KYC provider, Vault
- **Provides:** Verification status, compliance data
- **Consumes:** User documents, verification requests

#### 13. Swap Service
- **Responsibility:** P2P item swapping
- **Dependencies:** PostgreSQL, RabbitMQ
- **Provides:** Swap matching, dispute resolution
- **Consumes:** Swap requests, user ratings

#### 14. Ledger Service
- **Responsibility:** Immutable transaction ledger
- **Dependencies:** Blockchain (Ethereum/Polygon), PostgreSQL
- **Provides:** Transaction records, verification
- **Consumes:** Transaction data, verification requests

---

## 🔄 Data Flow

### User Registration Flow
```
Client → API Gateway → Auth Service → PostgreSQL
                    ↓
                  Vault (store credentials)
                    ↓
                  Redis (cache session)
```

### Product Search Flow
```
Client → API Gateway → Listing Service → Elasticsearch
                    ↓
                  PostgreSQL (product data)
                    ↓
                  Redis (cache results)
```

### Order Placement Flow
```
Client → API Gateway → Orders Service → PostgreSQL
                    ↓
                  RabbitMQ (publish event)
                    ↓
         ┌──────────┴──────────┬──────────┐
         ↓                     ↓          ↓
    Payment Service    Matching Service  Notification Service
         ↓                     ↓          ↓
      Stripe            Recommendation   Email/SMS
```

### Real-time Location Update Flow
```
Mobile App → API Gateway → Trips Service → Redis (GEO)
                        ↓
                    PostgreSQL
                        ↓
                    RabbitMQ (publish event)
                        ↓
         ┌──────────────┴──────────────┐
         ↓                             ↓
    Crowdship Service         Notification Service
         ↓                             ↓
    Update tracking              Notify users
```

---

## 🔐 Security Architecture

### Authentication & Authorization
- JWT tokens for API authentication
- OAuth 2.0 for social login
- RBAC for authorization
- Session management via Redis

### Data Protection
- TLS/SSL for all communications
- AES-256 encryption for sensitive data
- HashiCorp Vault for secret management
- Database encryption at rest

### Compliance
- KYC verification for users
- PCI-DSS compliance for payments
- GDPR compliance for data handling
- Audit logging for all operations

---

## 📊 Scalability Considerations

### Horizontal Scaling
- Stateless microservices
- Load balancing via API Gateway
- Database replication
- Redis clustering

### Vertical Scaling
- Resource limits per service
- Auto-scaling policies
- Performance optimization
- Caching strategies

### Data Scaling
- Database sharding strategy
- Elasticsearch indexing
- Redis memory management
- Archive old data

---

## 🚀 Deployment Architecture

### Containerization
- Docker containers for all services
- Docker Compose for local development
- Container registry for image storage

### Orchestration
- Kubernetes for production
- Helm charts for deployment
- Auto-scaling policies
- Health checks and monitoring

### CI/CD Pipeline
- GitHub Actions for automation
- Automated testing
- Automated deployment
- Rollback capabilities

---

## 📈 Performance Targets

- **API Response Time:** < 200ms (p95)
- **Database Query Time:** < 100ms (p95)
- **Search Query Time:** < 500ms (p95)
- **System Availability:** 99.9%
- **Concurrent Users:** 10,000+

---

## 🔄 Integration Points

### External Services
- Stripe (Payment processing)
- OAuth providers (Google, Apple, Facebook)
- KYC provider (IDology/Jumio)
- Email/SMS providers
- Blockchain nodes (Ethereum/Polygon)

### Internal Integration
- RabbitMQ for async messaging
- Redis for caching and sessions
- PostgreSQL for data persistence
- Elasticsearch for search

---

**Status:** 🔴 IN PROGRESS  
**Last Updated:** 2025-12-22  
**Next Review:** 2025-12-29
