# Aggregated Activity Service

A production-grade unified activity aggregation endpoint at the API Gateway level. This service aggregates activity data from multiple microservices (wallet, traveler, marketplace) into a single, normalized response.

## Features

- **Parallel Aggregation**: Fetches data from all services concurrently with timeout protection
- **Redis Caching**: 90-second cache with automatic invalidation
- **Fault Tolerance**: Graceful degradation when services are unavailable
- **Pagination**: Cursor-based pagination for large datasets
- **Rate Limiting**: 60 requests/minute per user
- **JWT Authentication**: Secure endpoint with existing auth middleware
- **Domain Filtering**: Filter by wallet, traveler, marketplace, or all
- **Kafka Ready**: Topic schema prepared for event-driven migration

## API Endpoints

### GET /api/activity

Main endpoint for aggregated activity data.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `domain` | string | `all` | Filter by domain: `wallet`, `traveler`, `marketplace`, `all` |
| `limit` | number | `20` | Items per page (max: 100) |
| `cursor` | string | - | Pagination cursor for next page |
| `startDate` | string | - | Filter from date (ISO 8601) |
| `endDate` | string | - | Filter until date (ISO 8601) |

**Headers:**

```
Authorization: Bearer <jwt-token>
X-Request-ID: <optional-request-id>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "wallet-1",
      "domain": "wallet",
      "title": "Deposit",
      "description": "Card deposit completed",
      "date": "2026-02-21T10:30:00.000Z",
      "amount": 250.00,
      "currency": "USD",
      "status": "completed",
      "metadata": { ... }
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "hasMore": true,
    "cursor": "eyJpbmRleCI6MjB9",
    "partial": false,
    "failedDomains": [],
    "cached": true,
    "cachedAt": "2026-02-21T12:00:00.000Z"
  }
}
```

### GET /api/activity/health

Health check for the activity aggregation service.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-02-21T12:00:00.000Z",
  "service": "activity-aggregation",
  "components": {
    "redis": true,
    "services": {
      "wallet": true,
      "traveler": true,
      "marketplace": true
    }
  }
}
```

### POST /api/activity/invalidate-cache

Invalidate cache for the authenticated user (admin/debug use).

**Response:**

```json
{
  "success": true,
  "message": "Cache invalidated successfully",
  "userId": "user-123"
}
```

## Architecture

### Aggregation Strategy

```
┌─────────────────┐
│  API Gateway    │
│  /api/activity  │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
    ▼         ▼            ▼            ▼
┌───────┐ ┌───────┐  ┌──────────┐ ┌──────────┐
│ Redis │ │Wallet │  │ Traveler │ │Marketplace│
│ Cache │ │Service│  │ Service  │ │  Service  │
└───────┘ └───────┘  └──────────┘ └──────────┘
```

1. Check Redis cache first (key: `activity:{userId}:{domain}:{limit}`)
2. If cache miss, fetch from services in parallel with Promise.all
3. Each service has 5-second timeout protection
4. Map responses to UnifiedActivityDTO format
5. Sort by date descending
6. Apply pagination
7. Store in cache (TTL: 90 seconds)
8. Return aggregated response

### Fault Tolerance

When a service is unavailable:
- Log error with service name and duration
- Exclude failed service data
- Include `partial: true` and `failedDomains: ["wallet"]` in response
- Return data from healthy services only

### Unified DTO

All service responses are mapped to a common format:

```typescript
interface UnifiedActivityDTO {
  id: string;
  domain: "wallet" | "traveler" | "marketplace";
  title: string;
  description: string;
  date: string; // ISO 8601
  amount?: number;
  currency?: string;
  status?: "pending" | "completed" | "failed" | "cancelled";
  metadata?: Record<string, unknown>;
}
```

## File Structure

```
services/api-gateway/src/
├── dto/
│   └── activity.dto.ts          # DTO definitions
├── controllers/
│   └── activity.controller.ts   # HTTP handlers
├── services/
│   └── activity.service.ts      # Aggregation logic
├── routes/
│   └── activity.routes.ts       # Route definitions
├── kafka/
│   ├── activity-event-schema.json  # Event schema
│   └── activity-topic-config.ts    # Topic configuration
└── index.ts                     # Main entry (updated)
```

## Environment Variables

Add to `.env`:

```env
# Activity Aggregation Services
WALLET_SERVICE_URL=http://localhost:3006
TRAVELER_SERVICE_URL=http://localhost:3007
MARKETPLACE_SERVICE_URL=http://localhost:3008
```

## Testing

Run test commands from `docs/activity-test-curl.sh`:

```bash
# Get all activities
curl -X GET "http://localhost:3000/api/activity" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Get wallet activities only
curl -X GET "http://localhost:3000/api/activity?domain=wallet&limit=10" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Health check
curl -X GET "http://localhost:3000/api/activity/health" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

## Frontend Integration

The frontend already uses the unified activity hook at `frontend/web-app/src/hooks/useActivity.ts`.

Update the service to use the new endpoint:

```typescript
// Before (multiple requests)
const fetchAllActivity = async () => {
  const [wallet, traveler, marketplace] = await Promise.all([
    fetch('/wallet/activity'),
    fetch('/traveler/activity'),
    fetch('/marketplace/activity'),
  ]);
  return [...wallet, ...traveler, ...marketplace];
};

// After (single request)
const fetchAllActivity = async () => {
  const response = await fetch('/api/activity?domain=all');
  const { data } = await response.json();
  return data;
};
```

## Future Enhancements

### Event-Driven Architecture (Kafka)

Topic schema is prepared in `src/kafka/activity-event-schema.json`.

Migration plan:
1. Deploy Kafka topic `activity-events`
2. Services publish activity events to Kafka
3. Gateway consumes events and builds read-optimized cache
4. Eliminate real-time service calls
5. Enable real-time activity streams (WebSocket)

### Analytics

With centralized activity data, we can add:
- User activity reports
- Trend analysis
- Recommendation engine
- Fraud detection

## Performance

- **Cache Hit**: < 10ms (Redis)
- **Cache Miss**: < 100ms (parallel service calls)
- **Timeout**: 5s per service
- **Rate Limit**: 60 req/min per user

## Monitoring

Key metrics to track:
- Cache hit rate
- Service response times
- Partial response rate
- Error rate by domain

## Security

- JWT validation via existing middleware
- User ID extracted from token (not query params)
- Rate limiting per user
- No sensitive data in cache keys

## License

Part of Mnbara Platform - Internal Use Only
