# Dependency Diagrams

Service dependency graphs and architecture diagrams for Mnbara Platform.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                            │
│                         (Port 3000)                            │
│                    ┌──────────────────┐                          │
│                    │  Load Balancer    │                          │
│                    └──────────────────┘                          │
└────────────────────┬──────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐  ┌──▼──────┐  ┌──▼──────────┐
│ Auth Service │  │ Product│  │ Order      │
│ (Port 3001)  │  │Service│  │Service    │
└───────┬──────┘  │(Port   │  │(Port 3006) │
        │         │3006)  │  └─────┬──────┘
        │         └───┬────┘        │
        │             │             │
        │      ┌──────▼──────┐       │
        │      │ PostgreSQL  │       │
        │      │  Primary    │       │
        │      │  (Port 5432) │       │
        │      └──────┬──────┘       │
        │             │             │
        │      ┌──────▼──────┐       │
        │      │   Redis     │       │
        │      │  (Port 6379)│       │
        │      └──────┬──────┘       │
        │             │             │
        │      ┌──────▼──────┐       │
        │      │   RabbitMQ  │       │
        │      │ (Port 5672) │       │
        │      └──────┬──────┘       │
        │             │             │
        │      ┌──────▼──────┐       │
        │      │   Kafka     │       │
        │      │ (Port 9092) │       │
        │      └─────────────┘       │
```

---

## Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                          API Gateway                              │
│                        ┌──────────────┐                             │
└────────────────────────┤ Load Balancer ├─────────────────────┘
                         └──────┬───────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
    ┌───────▼────────┐  ┌────▼────────┐  ┌─────▼────────┐
    │  Auth Service    │  │ Product     │  │ Order Service │
    │  (Port 3001)    │  │ Service     │  │  (Port 3006) │
    └───────┬────────┘  │(Port 3006)  │  └─────┬────────┘
            │             └──────┬──────┘         │
            │                  │                │
    ┌───────▼────────┐  ┌─────▼────────┐  ┌─────▼────────┐
    │  User Service    │  │ Category    │  │ Wallet       │
    │  (Port 3002)    │  │ Service     │  │ Service      │
    └───────┬────────┘  │(Port 3016)  │  │(Port 3005)  │
            │             └──────┬──────┘  └─────┬────────┘
            │                  │                │
    ┌───────▼────────┐  ┌─────▼────────┐  ┌─────▼────────┐
    │  Matching       │  │ Trips       │  │ Payment      │
    │  Service        │  │ Service     │  │ Service      │
    │  (Port 3010)    │  │(Port 3009)  │  │(Port 3003)  │
    └───────┬────────┘  └──────┬──────┘  └─────┬────────┘
            │                  │                │
    ┌───────▼────────┐  ┌─────▼────────┐  ┌─────▼────────┐
    │  Notification   │  │ Cart        │  │ Escrow       │
    │  Service        │  │ Service     │  │ Service      │
    │  (Port 3011)    │  │(Port 3013)  │  │(Port 3007)  │
    └───────┬────────┘  └──────┬──────┘  └─────┬────────┘
            │                  │                │
    ┌───────▼────────┐  ┌─────▼────────┐  ┌─────▼────────┐
    │  Feature        │  │ Admin       │  │ Settlement   │
    │  Management    │  │ Service     │  │ Service      │
    │  Service        │  │(Port 3015)  │  │(Port 3008)  │
    │  (Port 3014)    │  └─────────────┘  └─────────────┘
    └───────┬────────┘
            │
    ┌───────▼────────┐
    │  Country Layer  │
    │  Service        │
    │  (Port 3016)    │
    └─────────────────┘
```

---

## External Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│  Mnbara Platform Services                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌─────▼────────┐  ┌─────▼────────┐
│  PostgreSQL    │  │   Redis      │  │   RabbitMQ   │
│  (Port 5432)   │  │  (Port 6379)  │  │  (Port 5672)  │
└───────┬────────┘  └──────┬──────┘  └──────┬──────┘
        │                  │                │
┌───────▼────────┐  ┌─────▼────────┐  ┌─────▼────────┐
│  Elasticsearch │  │   Kafka      │  │   Stripe     │
│  (Port 9200)   │  │  (Port 9092)  │  │  (External)   │
└────────────────┘  └─────────────┘  └─────────────┘
```

---

## Data Flow Diagram

```
┌──────────┐
│  Client   │
└─────┬────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│                    ┌──────────────┐                             │
│                    │  Load Balancer    │                             │
│                    └──────────────┘                             │
└────────────────────┬──────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐  ┌──▼──────┐  ┌──▼──────────┐
│ Auth Service │  │ Product│  │ Order      │
│              │  │Service│  │Service    │
└───────┬──────┘  │       │  └─────┬──────┘
        │         └───┬────┘        │
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Primary                             │
│                    (Port 5432)                                     │
└─────────────────────────────────────────────────────────────────┘
        │
        ├───┬────────┬────────┬────────┬────────┬────────┐
        │   │        │        │        │        │        │
        ▼   ▼        ▼        ▼        ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Replica 1│ │ Replica 2│ │ Replica 3│ │ Replica 4│ │ Replica 5│
│ (5433)   │ │ (5434)   │ │ (5435)   │ │ (5436)   │ │ (5437)   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## Event Flow Diagram

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
└────────────────────┬──────────────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Order Created  │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │  Kafka Topic    │
            │  orders         │
            └────────┬───────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    ┌───▼────┐  ┌───▼─────┐  ┌───▼────────┐
    │Payment │  │Escrow   │  │Notification│
    │Service │  │Service  │  │ Service    │
    └───┬────┘  └───┬─────┘  └───┬────────┘
        │         │             │
        ▼         ▼             ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │PostgreSQL│ │  Redis   │ │RabbitMQ  │
   │  Primary  │ │  Cache   │ │  Queue   │
   └─────────┘ └─────────┘ └─────────┘
```

---

## Service Communication Patterns

### Synchronous (HTTP/REST)
```
Client → API Gateway → Auth Service → PostgreSQL
```

### Asynchronous (Kafka)
```
Order Service → Kafka → Payment Service → Kafka → Notification Service
```

### Cache (Redis)
```
Product Service → Redis (Cache) → PostgreSQL (Read-Only)
```

### Queue (RabbitMQ)
```
Notification Service → RabbitMQ → Email Service
```

---

## Infrastructure Dependencies

### Docker Compose Services
```
Infrastructure:
├── postgres (5432)
├── redis (6379)
├── rabbitmq (5672, 15672)
├── elasticsearch (9200)
├── kafka (9092)
├── zookeeper (2181)
├── pgbouncer (6432)
├── patroni (8008)
└── etcd (2379)

Core Services:
├── api-gateway (3000)
├── auth-service (3001)
├── user-service (3002)
├── payment-service (3003)
├── product-service (3004)
├── orders-service (3006)
├── wallet-service (3005)
├── escrow-service (3007)
├── settlement-service (3008)
├── trips-service (3009)
├── matching-service (3010)
├── notification-service (3011)
├── subscription-service (3012)
├── cart-service (3013)
├── feature-management (3014)
├── admin-service (3015)
└── country-layer (3016)
```

### Port Allocations
```
Infrastructure:
- PostgreSQL: 5432 (Primary), 5433-5437 (Replicas)
- Redis: 6379
- RabbitMQ: 5672 (AMQP), 15672 (Management)
- Elasticsearch: 9200
- Kafka: 9092
- Zookeeper: 2181
- PgBouncer: 6432
- Patroni: 8008
- Etcd: 2379

Services:
- API Gateway: 3000
- Auth Service: 3001
- User Service: 3002
- Payment Service: 3003
- Product Service: 3004
- Orders Service: 3006
- Wallet Service: 3005
- Escrow Service: 3007
- Settlement Service: 3008
- Trips Service: 3009
- Matching Service: 3010
- Notification Service: 3011
- Subscription Service: 3012
- Cart Service: 3013
- Feature Management: 3014
- Admin Service: 3015
- Country Layer: 3016
```

---

## Database Schema Dependencies

### Auth Database (auth_db)
```
users
├── sessions
├── oauth_providers
└── roles
```

### Product Database (listing_db)
```
categories
├── products
│   ├── product_images
│   ├── product_specifications
│   ├── bids
│   └── make_offers
└── category_stats
```

### Orders Database (orders_db)
```
orders
├── payments
├── escrow
├── settlements
└── disputes
```

### Wallet Database (wallet_db)
```
wallets
├── transactions
├── wallet_addresses
└── transaction_logs
```

### Trips Database (trips_db)
```
trips
├── match_candidates
├── stopovers
└── trip_manifests
```

---

**Status**: ✅ Dependency Diagrams Created
**Next**: Monitoring Dashboards
