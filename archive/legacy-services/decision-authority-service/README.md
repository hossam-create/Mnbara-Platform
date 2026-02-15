# Decision Authority Service

External decision authority API integration for Mnbarh Platform asset disposition control.

## Overview

The Decision Authority Service provides an abstraction layer for asset disposition decisions (listings, auctions, escrow releases). It supports multiple decision sources:

- **INTERNAL**: Auto-approve all decisions (current behavior, backward compatible)
- **EXTERNAL**: Integrate with Custodii API for external regulatory control
- **MOCK**: Simulated decisions for testing

## Phase 1: Foundation (Current Status)

Phase 1 implements the core service skeleton with:

- ✅ Service directory structure
- ✅ TypeScript configuration
- ✅ Prisma database schema (no migrations yet)
- ✅ IDecisionSource interface
- ✅ InternalDecisionSource (auto-approve)
- ✅ MockDecisionSource (testing)
- ✅ DecisionSourceFactory
- ✅ Configuration loader
- ✅ Minimal Express server with health check

## Quick Start

### Installation

```bash
cd backend/services/decision-authority-service
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key configuration:

```env
PORT=3010
DECISION_AUTHORITY_MODE=INTERNAL
DATABASE_URL=postgresql://user:password@localhost:5432/decision_authority_db
```

### Development

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Start production
npm start
```

### Health Check

```bash
curl http://localhost:3010/health
```

Response:

```json
{
  "status": "healthy",
  "service": "decision-authority-service",
  "mode": "INTERNAL",
  "source": "INTERNAL",
  "timestamp": "2026-01-20T12:00:00.000Z"
}
```

## Decision Authority Modes

### INTERNAL Mode (Default)

Auto-approves all decisions immediately. Maintains current platform behavior with zero external dependencies.

```env
DECISION_AUTHORITY_MODE=INTERNAL
```

### EXTERNAL Mode (Phase 3)

Integrates with Custodii API for external decision authority. Requires API credentials.

```env
DECISION_AUTHORITY_MODE=EXTERNAL
CUSTODII_API_URL=https://api.custodii.com/v1
CUSTODII_API_KEY=your_api_key_here
CUSTODII_WEBHOOK_SECRET=your_webhook_secret_here
```

**Note**: EXTERNAL mode is not yet implemented in Phase 1.

### MOCK Mode (Testing)

Simulates external API with configurable delays and status transitions.

```typescript
import { DecisionSourceFactory } from './sources/DecisionSourceFactory';

const mockSource = DecisionSourceFactory.createMockSource({
  initialStatus: 'PENDING',
  delayMs: 2000,
  finalStatus: 'APPROVED'
});
```

## Architecture

### Decision Source Interface

```typescript
interface IDecisionSource {
  requestDecision(request: DecisionRequest): Promise<DecisionResponse>;
  getDecision(decisionId: string): Promise<DecisionResponse>;
  pollDecision(decisionId: string): Promise<DecisionResponse>;
  cancelDecision(decisionId: string): Promise<void>;
  getSourceName(): string;
}
```

### Decision Flow

1. **Request Decision**: Asset service requests decision for listing/auction/escrow
2. **Decision Source**: Factory creates appropriate source (INTERNAL/EXTERNAL/MOCK)
3. **Response**: Decision returned with status (PENDING/APPROVED/REJECTED)
4. **Polling**: For PENDING decisions, poll until final status
5. **Audit**: All decisions logged to database

## Database Schema

### AssetDecisionRecord

Tracks all decision requests and their status.

```prisma
model AssetDecisionRecord {
  id             Int            @id @default(autoincrement())
  assetType      AssetType      // LISTING | AUCTION | ESCROW_RELEASE
  assetId        String
  decisionId     String         @unique
  status         DecisionStatus // PENDING | APPROVED | REJECTED | EXPIRED | CANCELLED
  decisionRef    String?
  reason         String?
  decisionSource String         // INTERNAL | EXTERNAL | MOCK
  requestedAt    DateTime
  decidedAt      DateTime?
  expiresAt      DateTime?
  metadata       Json?
}
```

### DecisionAuditLog

APPEND-ONLY audit trail for all decision changes.

```prisma
model DecisionAuditLog {
  id             Int            @id @default(autoincrement())
  decisionId     Int
  action         String
  previousStatus DecisionStatus?
  newStatus      DecisionStatus?
  actorId        String
  actorType      String
  metadata       Json?
  createdAt      DateTime
}
```

## Environment Variables

### Feature Flags

| Variable | Default | Description | Values |
|----------|---------|-------------|--------|
| `DECISION_AUTHORITY_MODE` | `INTERNAL` | Decision authority mode | `INTERNAL`, `EXTERNAL`, `MOCK` |
| `DECISION_TIMEOUT_MS` | `30000` | Decision request timeout in milliseconds | Number (ms) |
| `DECISION_POLL_INTERVAL_MS` | `5000` | Polling interval for pending decisions | Number (ms) |

### Custodii Integration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CUSTODII_API_URL` | Yes (EXTERNAL mode) | Custodii API endpoint URL | `https://api.custodii.com/v1` |
| `CUSTODII_API_KEY` | Yes (EXTERNAL mode) | Custodii API authentication key | `sk_live_xxxxxxxxxxxxx` |
| `CUSTODII_WEBHOOK_SECRET` | Yes (EXTERNAL mode) | Webhook signature validation secret | `whsec_xxxxxxxxxxxxx` |

### Database

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:password@localhost:5432/decision_authority` |

### Monitoring & Logging

| Variable | Default | Description | Values |
|----------|---------|-------------|--------|
| `LOG_LEVEL` | `info` | Logging level | `debug`, `info`, `warn`, `error` |
| `METRICS_ENABLED` | `true` | Enable Prometheus metrics | `true`, `false` |
| `SENTRY_DSN` | Optional | Sentry error tracking DSN | Sentry DSN URL |

### Node Environment

| Variable | Default | Description | Values |
|----------|---------|-------------|--------|
| `NODE_ENV` | `development` | Node environment | `development`, `staging`, `production` |
| `PORT` | `3010` | Service port | Number |

### Environment Files

- `.env.example` - Template with all variables
- `.env.staging` - Staging environment configuration
- `.env.production` - Production environment configuration

### Configuration by Mode

#### INTERNAL Mode (Default)
```env
DECISION_AUTHORITY_MODE=INTERNAL
DECISION_TIMEOUT_MS=30000
DECISION_POLL_INTERVAL_MS=5000
LOG_LEVEL=info
```

#### EXTERNAL Mode (Production)
```env
DECISION_AUTHORITY_MODE=EXTERNAL
CUSTODII_API_URL=https://api.custodii.com/v1
CUSTODII_API_KEY=sk_live_xxxxxxxxxxxxx
CUSTODII_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
DECISION_TIMEOUT_MS=30000
DECISION_POLL_INTERVAL_MS=5000
LOG_LEVEL=info
METRICS_ENABLED=true
```

#### MOCK Mode (Testing)
```env
DECISION_AUTHORITY_MODE=MOCK
DECISION_TIMEOUT_MS=5000
DECISION_POLL_INTERVAL_MS=1000
LOG_LEVEL=debug
```

## Next Steps (Phase 2)

- [ ] Implement DecisionAuthorityService (business logic)
- [ ] Implement AuditLogService
- [ ] Create REST API endpoints
- [ ] Add authentication middleware
- [ ] Add validation middleware
- [ ] Write comprehensive tests

## Testing

```bash
# Run tests (Phase 2)
npm test

# Run tests with coverage
npm run test:coverage
```

## Documentation

- [Requirements](../../.kiro/specs/custodii-decision-authority/requirements.md)
- [Design](../../.kiro/specs/custodii-decision-authority/design.md)
- [Tasks](../../.kiro/specs/custodii-decision-authority/tasks.md)
- [Implementation Guide](../../.kiro/specs/custodii-decision-authority/IMPLEMENTATION_GUIDE.md)

## Support

For questions or issues, refer to the specification documents in `.kiro/specs/custodii-decision-authority/`.
