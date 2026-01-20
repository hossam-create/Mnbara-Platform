# Custodii Decision Authority API - Complete Integration Guide

## Table of Contents
1. [Architecture Overview](#architecture)
2. [Module 1: Decision Authority Service](#module-1)
3. [Module 2: Backend Service Integration](#module-2)
4. [Module 3: Frontend Integration](#module-3)
5. [Module 4: Infrastructure & Feature Flags](#module-4)
6. [Testing Strategy](#testing)
7. [Deployment Guide](#deployment)
8. [Future Integration Advice](#future-advice)

---

## Architecture Overview {#architecture}

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Mnbarh Platform                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Listing    │  │   Auction    │  │    Escrow    │    │
│  │   Service    │  │   Service    │  │   Service    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  Decision       │                       │
│                   │  Authority      │                       │
│                   │  Service        │                       │
│                   └────────┬────────┘                       │
│                            │                                │
│              ┌─────────────┼─────────────┐                 │
│              │             │             │                 │
│     ┌────────▼────┐  ┌────▼─────┐  ┌───▼──────┐          │
│     │  Internal   │  │ Custodii │  │   Mock   │          │
│     │  Decision   │  │ Decision │  │ Decision │          │
│     │  Source     │  │  Source  │  │  Source  │          │
│     └─────────────┘  └────┬─────┘  └──────────┘          │
│                           │                                │
└───────────────────────────┼────────────────────────────────┘
                            │
                            │ HTTPS
                            │
                   ┌────────▼────────┐
                   │  Custodii API   │
                   │  (External)     │
                   └─────────────────┘
```

### Key Design Principles

1. **Abstraction Layer**: `IDecisionSource` interface isolates external API
2. **Feature Flag Control**: `DECISION_AUTHORITY_MODE` env var controls behavior
3. **Non-Breaking Changes**: Existing services work without modification
4. **Audit Trail**: All decisions logged with full provenance
5. **Graceful Degradation**: Fallback to internal mode if external API fails

---

## MODULE 1: Decision Authority Service {#module-1}

### Task List

**Priority 1 - Foundation**:
- [ ] 1.1 Create service skeleton with package.json
- [ ] 1.2 Define database schema (Prisma)
- [ ] 1.3 Implement IDecisionSource interface
- [ ] 1.4 Build InternalDecisionSource (current behavior)
- [ ] 1.5 Build MockDecisionSource (testing)
- [ ] 1.6 Create DecisionSourceFactory

**Priority 2 - Core Service**:
- [ ] 1.7 Implement DecisionAuthorityService
- [ ] 1.8 Build REST API controllers
- [ ] 1.9 Add routes and middleware
- [ ] 1.10 Implement webhook handler

**Priority 3 - External Integration**:
- [ ] 1.11 Implement CustodiiDecisionSource
- [ ] 1.12 Add polling mechanism
- [ ] 1.13 Implement retry logic
- [ ] 1.14 Add timeout handling

### Code Snippets

#### 1.1 Service Skeleton

**File**: `backend/services/decision-authority-service/package.json`

```json
{
  "name": "@mnbarh/decision-authority-service",
  "version": "1.0.0",
  "description": "External Decision Authority Integration Service",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/client": "^5.8.1",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.4.1",
    "axios": "^1.6.2",
    "jsonwebtoken": "^9.0.2",
    "joi": "^17.11.0",
    "uuid": "^9.0.1",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "@types/jest": "^29.5.14",
    "@types/uuid": "^9.0.7",
    "@types/node-cron": "^3.0.11",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node-dev": "^2.0.0",
    "prisma": "^5.8.1"
  },
  "engines": {
    "node": "22.20.0"
  }
}
```

**How it works**: Standard Node.js microservice with TypeScript, Express, Prisma ORM, and testing framework.

#### 1.2 Database Schema

**File**: `backend/services/decision-authority-service/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum DecisionStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
  CANCELLED
}

enum DecisionSource {
  INTERNAL
  EXTERNAL
  OVERRIDE
}

enum AssetType {
  LISTING
  AUCTION
  ESCROW_RELEASE
}

// Main decision records table (append-only)
model AssetDecisionRecord {
  id           String         @id @default(uuid())
  assetType    AssetType
  assetId      String
  status       DecisionStatus @default(PENDING)
  source       DecisionSource
  authority    String         // 'MNBARH_INTERNAL' | 'CUSTODII' | admin email
  decisionRef  String?        // External reference ID
  reason       String?        @db.Text
  metadata     Json           @default("{}")
  requestedAt  DateTime       @default(now())
  decidedAt    DateTime?
  expiresAt    DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  
  auditLogs    DecisionAuditLog[]
  
  @@index([assetType, assetId])
  @@index([status])
  @@index([source])
  @@index([decisionRef])
  @@map("asset_decision_records")
}

// Audit trail for all decision changes (immutable)
model DecisionAuditLog {
  id         String   @id @default(uuid())
  decisionId String
  decision   AssetDecisionRecord @relation(fields: [decisionId], references: [id])
  eventType  String   // 'CREATED', 'STATUS_CHANGED', 'OVERRIDDEN', etc.
  actor      String   // User/system that triggered the event
  oldStatus  String?
  newStatus  String?
  reason     String?  @db.Text
  metadata   Json     @default("{}")
  createdAt  DateTime @default(now())
  
  @@index([decisionId])
  @@index([eventType])
  @@map("decision_audit_log")
}

// Webhook events from external authorities
model DecisionWebhookEvent {
  id          String   @id @default(uuid())
  decisionRef String
  eventType   String
  payload     Json
  processed   Boolean  @default(false)
  processedAt DateTime?
  error       String?  @db.Text
  createdAt   DateTime @default(now())
  
  @@index([decisionRef])
  @@index([processed])
  @@map("decision_webhook_events")
}
```

**How it works**: 
- `AssetDecisionRecord`: Main table storing all decision requests and outcomes
- `DecisionAuditLog`: Immutable audit trail for compliance
- `DecisionWebhookEvent`: Queue for processing external webhook updates
- Indexes optimize common queries (by asset, status, source)

#### 1.3 IDecisionSource Interface

**File**: `backend/services/decision-authority-service/src/interfaces/IDecisionSource.ts`

```typescript
export enum DecisionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum AssetType {
  LISTING = 'LISTING',
  AUCTION = 'AUCTION',
  ESCROW_RELEASE = 'ESCROW_RELEASE'
}

export interface DecisionRequest {
  assetType: AssetType;
  assetId: string;
  metadata: Record<string, any>;
}

export interface DecisionResponse {
  decisionId: string;
  status: DecisionStatus;
  decisionRef?: string;
  reason?: string;
  decidedAt?: Date;
  expiresAt?: Date;
}

export interface IDecisionSource {
  /**
   * Request a decision from the authority
   * @returns Decision response with initial status (may be PENDING or immediate APPROVED/REJECTED)
   */
  requestDecision(request: DecisionRequest): Promise<DecisionResponse>;
  
  /**
   * Get current status of a decision
   * @param decisionId Internal decision ID
   */
  getDecision(decisionId: string): Promise<DecisionResponse>;
  
  /**
   * Poll for decision status update (for PENDING decisions)
   * @param decisionId Internal decision ID
   */
  pollDecision(decisionId: string): Promise<DecisionResponse>;
  
  /**
   * Cancel a pending decision
   * @param decisionId Internal decision ID
   */
  cancelDecision(decisionId: string): Promise<void>;
  
  /**
   * Get the source name for logging
   */
  getSourceName(): string;
}
```

**How it works**: Interface defines contract that all decision sources must implement. This allows swapping implementations without changing calling code.

