# Custodii Decision Authority API - Complete Code Implementation

This document contains all code snippets, tests, and documentation templates needed to implement the Custodii Decision Authority API integration.

---

## SECTION 1: Decision Authority Service (Backend)

### 1.1 Service Structure

```
backend/services/decision-authority-service/
├── src/
│   ├── index.ts                          # Entry point
│   ├── config/
│   │   └── config.ts                     # Configuration loader
│   ├── interfaces/
│   │   └── IDecisionSource.ts            # Decision source interface
│   ├── sources/
│   │   ├── InternalDecisionSource.ts     # Internal (current) behavior
│   │   ├── MockDecisionSource.ts         # Testing mock
│   │   ├── CustodiiDecisionSource.ts     # External Custodii API
│   │   └── DecisionSourceFactory.ts      # Factory pattern
│   ├── services/
│   │   ├── DecisionAuthorityService.ts   # Core business logic
│   │   ├── AuditLogService.ts            # Audit trail
│   │   ├── DecisionPollingService.ts     # Polling for PENDING
│   │   └── WebhookService.ts             # Webhook processing
│   ├── controllers/
│   │   ├── DecisionController.ts         # REST API
│   │   └── WebhookController.ts          # Webhook endpoint
│   ├── routes/
│   │   ├── decision.routes.ts            # Decision routes
│   │   └── webhook.routes.ts             # Webhook routes
│   ├── middleware/
│   │   ├── auth.middleware.ts            # JWT authentication
│   │   ├── validation.middleware.ts      # Request validation
│   │   └── error.middleware.ts           # Error handling
│   └── utils/
│       ├── logger.ts                     # Structured logging
│       └── errors.ts                     # Custom errors
├── prisma/
│   ├── schema.prisma                     # Database schema
│   └── migrations/                       # Migration files
├── tests/
│   ├── unit/                             # Unit tests
│   ├── integration/                      # Integration tests
│   └── e2e/                              # End-to-end tests
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### 1.2 Core Implementation Files

#### File: `src/index.ts`

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import decisionRoutes from './routes/decision.routes';
import webhookRoutes from './routes/webhook.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger';
import config from './config/config';

dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'decision-authority-service',
    mode: config.decisionAuthorityMode,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/decisions', decisionRoutes);
app.use('/api/v1/webhook', webhookRoutes);

// Error handling
app.use(errorMiddleware);

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
  logger.info(`Decision Authority Service running on port ${PORT}`);
  logger.info(`Decision Authority Mode: ${config.decisionAuthorityMode}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

export { app, prisma };
```

**How it works**: Standard Express.js server with health check, routes, error handling, and graceful shutdown.

#### File: `src/config/config.ts`

```typescript
export enum DecisionAuthorityMode {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL'
}

interface Config {
  decisionAuthorityMode: DecisionAuthorityMode;
  custodiiApiUrl: string;
  custodiiApiKey: string;
  custodiiWebhookSecret: string;
  decisionTimeoutMs: number;
  decisionPollIntervalMs: number;
  jwtSecret: string;
  databaseUrl: string;
}

const config: Config = {
  decisionAuthorityMode: (process.env.DECISION_AUTHORITY_MODE as DecisionAuthorityMode) || DecisionAuthorityMode.INTERNAL,
  custodiiApiUrl: process.env.CUSTODII_API_URL || '',
  custodiiApiKey: process.env.CUSTODII_API_KEY || '',
  custodiiWebhookSecret: process.env.CUSTODII_WEBHOOK_SECRET || '',
  decisionTimeoutMs: parseInt(process.env.DECISION_TIMEOUT_MS || '30000'),
  decisionPollIntervalMs: parseInt(process.env.DECISION_POLL_INTERVAL_MS || '5000'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  databaseUrl: process.env.DATABASE_URL || ''
};

// Validation
if (config.decisionAuthorityMode === DecisionAuthorityMode.EXTERNAL) {
  if (!config.custodiiApiUrl) {
    throw new Error('CUSTODII_API_URL is required when DECISION_AUTHORITY_MODE=EXTERNAL');
  }
  if (!config.custodiiApiKey) {
    throw new Error('CUSTODII_API_KEY is required when DECISION_AUTHORITY_MODE=EXTERNAL');
  }
}

export default config;
```

**How it works**: Centralized configuration with validation. Throws error if EXTERNAL mode is enabled without required credentials.

#### File: `src/interfaces/IDecisionSource.ts`

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
  requestDecision(request: DecisionRequest): Promise<DecisionResponse>;
  getDecision(decisionId: string): Promise<DecisionResponse>;
  pollDecision(decisionId: string): Promise<DecisionResponse>;
  cancelDecision(decisionId: string): Promise<void>;
  getSourceName(): string;
}
```

#### File: `src/sources/InternalDecisionSource.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { IDecisionSource, DecisionRequest, DecisionResponse, DecisionStatus } from '../interfaces/IDecisionSource';
import { logger } from '../utils/logger';

/**
 * InternalDecisionSource - Maintains current behavior (auto-approve)
 * This is the default mode and ensures backward compatibility
 */
export class InternalDecisionSource implements IDecisionSource {
  async requestDecision(request: DecisionRequest): Promise<DecisionResponse> {
    logger.info('InternalDecisionSource: Auto-approving decision', { request });
    
    // Auto-approve immediately (current behavior)
    const response: DecisionResponse = {
      decisionId: uuidv4(),
      status: DecisionStatus.APPROVED,
      decidedAt: new Date(),
      reason: 'Auto-approved by internal rules'
    };
    
    return response;
  }
  
  async getDecision(decisionId: string): Promise<DecisionResponse> {
    // Internal decisions are always immediately approved
    return {
      decisionId,
      status: DecisionStatus.APPROVED,
      decidedAt: new Date(),
      reason: 'Auto-approved by internal rules'
    };
  }
  
  async pollDecision(decisionId: string): Promise<DecisionResponse> {
    // No polling needed for internal decisions
    return this.getDecision(decisionId);
  }
  
  async cancelDecision(decisionId: string): Promise<void> {
    // No-op for internal decisions
    logger.info('InternalDecisionSource: Cancel requested (no-op)', { decisionId });
  }
  
  getSourceName(): string {
    return 'INTERNAL';
  }
}
```

**How it works**: Immediately approves all decisions, maintaining exact current platform behavior. Zero external dependencies.

#### File: `src/sources/MockDecisionSource.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { IDecisionSource, DecisionRequest, DecisionResponse, DecisionStatus } from '../interfaces/IDecisionSource';
import { logger } from '../utils/logger';

interface MockDecisionConfig {
  initialStatus?: DecisionStatus;
  delayMs?: number;
  finalStatus?: DecisionStatus;
  reason?: string;
}

/**
 * MockDecisionSource - Simulates external API for testing
 * Configurable delays and status transitions
 */
export class MockDecisionSource implements IDecisionSource {
  private decisions: Map<string, DecisionResponse> = new Map();
  private config: MockDecisionConfig;
  
  constructor(config: MockDecisionConfig = {}) {
    this.config = {
      initialStatus: config.initialStatus || DecisionStatus.PENDING,
      delayMs: config.delayMs || 1000,
      finalStatus: config.finalStatus || DecisionStatus.APPROVED,
      reason: config.reason || 'Mock decision'
    };
  }
  
  async requestDecision(request: DecisionRequest): Promise<DecisionResponse> {
    const decisionId = uuidv4();
    const response: DecisionResponse = {
      decisionId,
      status: this.config.initialStatus!,
      decisionRef: `MOCK-${decisionId}`,
      reason: this.config.reason
    };
    
    this.decisions.set(decisionId, response);
    
    // Simulate async status change
    if (this.config.initialStatus === DecisionStatus.PENDING) {
      setTimeout(() => {
        const updated = this.decisions.get(decisionId);
        if (updated) {
          updated.status = this.config.finalStatus!;
          updated.decidedAt = new Date();
          this.decisions.set(decisionId, updated);
        }
      }, this.config.delayMs);
    }
    
    logger.info('MockDecisionSource: Decision requested', { decisionId, request });
    return response;
  }
  
  async getDecision(decisionId: string): Promise<DecisionResponse> {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision not found: ${decisionId}`);
    }
    return decision;
  }
  
  async pollDecision(decisionId: string): Promise<DecisionResponse> {
    return this.getDecision(decisionId);
  }
  
  async cancelDecision(decisionId: string): Promise<void> {
    const decision = this.decisions.get(decisionId);
    if (decision) {
      decision.status = DecisionStatus.CANCELLED;
      this.decisions.set(decisionId, decision);
    }
    logger.info('MockDecisionSource: Decision cancelled', { decisionId });
  }
  
  getSourceName(): string {
    return 'MOCK';
  }
}
```

**How it works**: Simulates external API with configurable delays and status transitions. Perfect for testing without real external dependencies.

#### File: `src/sources/CustodiiDecisionSource.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import { IDecisionSource, DecisionRequest, DecisionResponse, DecisionStatus, AssetType } from '../interfaces/IDecisionSource';
import { logger } from '../utils/logger';
import config from '../config/config';

/**
 * CustodiiDecisionSource - Integrates with external Custodii API
 * Handles HTTP requests, authentication, and error handling
 */
export class CustodiiDecisionSource implements IDecisionSource {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: config.custodiiApiUrl,
      timeout: config.decisionTimeoutMs,
      headers: {
        'Authorization': `Bearer ${config.custodiiApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Request logging
    this.client.interceptors.request.use(req => {
      logger.info('Custodii API Request', { 
        method: req.method, 
        url: req.url,
        data: req.data 
      });
      return req;
    });
    
    // Response logging
    this.client.interceptors.response.use(
      res => {
        logger.info('Custodii API Response', { 
          status: res.status,
          data: res.data 
        });
        return res;
      },
      error => {
        logger.error('Custodii API Error', { 
          message: error.message,
          response: error.response?.data 
        });
        throw error;
      }
    );
  }
  
  async requestDecision(request: DecisionRequest): Promise<DecisionResponse> {
    try {
      const response = await this.client.post('/decisions', {
        asset_type: request.assetType,
        asset_id: request.assetId,
        metadata: request.metadata
      });
      
      return this.mapCustodiiResponse(response.data);
    } catch (error) {
      logger.error('Failed to request decision from Custodii', { error, request });
      throw new Error(`Custodii API error: ${error}`);
    }
  }
  
  async getDecision(decisionId: string): Promise<DecisionResponse> {
    try {
      const response = await this.client.get(`/decisions/${decisionId}`);
      return this.mapCustodiiResponse(response.data);
    } catch (error) {
      logger.error('Failed to get decision from Custodii', { error, decisionId });
      throw new Error(`Custodii API error: ${error}`);
    }
  }
  
  async pollDecision(decisionId: string): Promise<DecisionResponse> {
    // Same as getDecision for Custodii
    return this.getDecision(decisionId);
  }
  
  async cancelDecision(decisionId: string): Promise<void> {
    try {
      await this.client.post(`/decisions/${decisionId}/cancel`);
      logger.info('Decision cancelled in Custodii', { decisionId });
    } catch (error) {
      logger.error('Failed to cancel decision in Custodii', { error, decisionId });
      throw new Error(`Custodii API error: ${error}`);
    }
  }
  
  getSourceName(): string {
    return 'CUSTODII';
  }
  
  private mapCustodiiResponse(data: any): DecisionResponse {
    return {
      decisionId: data.id,
      status: this.mapStatus(data.status),
      decisionRef: data.reference,
      reason: data.reason,
      decidedAt: data.decided_at ? new Date(data.decided_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined
    };
  }
  
  private mapStatus(custodiiStatus: string): DecisionStatus {
    const statusMap: Record<string, DecisionStatus> = {
      'pending': DecisionStatus.PENDING,
      'approved': DecisionStatus.APPROVED,
      'rejected': DecisionStatus.REJECTED,
      'expired': DecisionStatus.EXPIRED,
      'cancelled': DecisionStatus.CANCELLED
    };
    return statusMap[custodiiStatus.toLowerCase()] || DecisionStatus.PENDING;
  }
}
```

**How it works**: HTTP client for Custodii API with authentication, logging, error handling, and response mapping.

