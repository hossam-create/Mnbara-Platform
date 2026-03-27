# OpenTelemetry Distributed Tracing - Complete Implementation Guide

## Overview

This document provides complete implementation details for distributed tracing across the Mnbara platform microservices stack.

**Architecture Coverage:**
- ✅ API Gateway (Node.js/TypeScript)
- ✅ Wallet Service
- ✅ Traveler Service
- ✅ Marketplace Service
- ✅ Kafka Event Streaming
- ✅ WebSocket Real-time
- ✅ Redis Operations
- ✅ HTTP Request Flow

---

## Quick Start

### 1. Start Jaeger (All-in-One)

```bash
# Using Docker
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/all-in-one:1.50

# Or use docker-compose
docker-compose -f infrastructure/docker/docker-compose.tracing.yml up -d
```

**Access Jaeger UI:** http://localhost:16686

### 2. Install Dependencies

```bash
cd services/api-gateway
npm install

# For other services
cd backend/services/wallet-service
npm install
```

### 3. Configure Environment

```bash
# .env file for each service
OTEL_SERVICE_NAME=api-gateway
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_ENVIRONMENT=development
OTEL_SAMPLING_RATE=0.2
```

### 4. Start Services

```bash
# API Gateway (tracing auto-initializes first)
npm run dev

# Other services
npm run dev
```

---

## Implementation Details

### Service Bootstrap Pattern

```typescript
// index.ts - FIRST LINES
import { initTracing } from './tracing';
initTracing();  // Must be before any other imports!

import express from 'express';
// ... rest of imports
```

### End-to-End Trace Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Complete Distributed Trace Example                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User makes request to API Gateway                           │
│     POST /api/wallet/deposit                                    │
│     ↓                                                           │
│     ├─ HTTP POST /api/wallet/deposit (api-gateway)             │
│        ├─ Trace ID: abc123...                                   │
│        ├─ Span ID: def456...                                    │
│        └─ Headers: traceparent: 00-abc123...-def456...-01    │
│                                                                 │
│  2. Gateway forwards to wallet-service                            │
│     ↓                                                           │
│     ├─ HTTP POST /deposit (wallet-service)                      │
│        ├─ Extracts traceparent header                           │
│        ├─ Creates child span                                    │
│        ├─ Trace ID: abc123... (SAME!)                          │
│        └─ Span ID: ghi789... (new)                             │
│                                                                 │
│  3. Wallet service publishes to Kafka                           │
│     ↓                                                           │
│     ├─ kafka.produce (wallet-service)                           │
│        ├─ Injects traceparent into message headers              │
│        ├─ traceparent: 00-abc123...-ghi789...-01               │
│        └─ Headers persisted with message                        │
│                                                                 │
│  4. API Gateway consumes from Kafka                               │
│     ↓                                                           │
│     ├─ kafka.consume (api-gateway)                              │
│        ├─ Extracts traceparent from message headers               │
│        ├─ Creates child span with extracted context             │
│        ├─ Trace ID: abc123... (STILL SAME!)                  │
│        └─ Span ID: jkl012... (new)                             │
│                                                                 │
│  5. Gateway pushes to WebSocket                                   │
│     ↓                                                           │
│     ├─ websocket.push_event (api-gateway)                       │
│        ├─ Child of kafka.consume span                           │
│        ├─ Trace ID: abc123...                                 │
│        └─ Span ID: mno345... (new)                            │
│                                                                 │
│  6. Client receives event                                       │
│     └─ activity:new event (frontend)                            │
│        └─ Can log trace ID for debugging                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Kafka Context Propagation

### Producer (Inject Context)

```typescript
import { injectContextIntoHeaders } from '../tracing';

async publishEvent(event: ActivityEventPayload): Promise<void> {
  const span = tracer.startSpan('kafka.produce', {
    kind: SpanKind.PRODUCER,
    attributes: { 'messaging.destination': 'activity-events' },
  });

  try {
    const headers: Record<string, string> = {};
    
    // KEY: Inject trace context
    injectContextIntoHeaders(headers);
    
    await producer.send({
      topic: 'activity-events',
      messages: [{
        key: event.userId,
        value: JSON.stringify(event),
        headers: Object.entries(headers),
      }],
    });
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
```

### Consumer (Extract Context)

```typescript
import { extractContextFromHeaders } from '../tracing';

async consumeMessage(message: KafkaMessage): Promise<void> {
  // Extract context from Kafka headers
  const extractedContext = extractContextFromHeaders(
    message.headers as Record<string, string>
  );
  
  // Create span as child of extracted context
  const span = tracer.startSpan(
    'kafka.consume',
    { kind: SpanKind.CONSUMER },
    extractedContext
  );
  
  await context.with(trace.setSpan(context.active(), span), async () => {
    // Process message with trace continuity
    await processEvent(message);
  });
  
  span.end();
}
```

---

## WebSocket Tracing

### Connection Span

```typescript
import { createConnectionSpan, createPushEventSpan } from './websocket-tracing';

// When client connects
const connectionSpan = createConnectionSpan(socket, {
  ip: clientIp,
  userAgent: userAgent,
  userId: userId,
});

// Store trace context on socket
socket.traceContext = connectionSpan.spanContext();

connectionSpan.end();
```

### Event Push Span

```typescript
// When pushing event to client
const pushSpan = createPushEventSpan(
  socket,
  'activity:new',
  event.eventId,
  JSON.stringify(event).length
);

try {
  socket.send(JSON.stringify({
    type: 'activity:new',
    payload: event,
  }));
  pushSpan.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  pushSpan.recordException(error);
  pushSpan.setStatus({ code: SpanStatusCode.ERROR });
} finally {
  pushSpan.end();
}
```

---

## Correlation Logging

### Structured Log Format

```json
{
  "timestamp": "2026-02-21T10:30:00.000Z",
  "level": "info",
  "message": "Deposit processed successfully",
  "service": "wallet-service",
  "traceId": "abc123def45678901234567890123456",
  "spanId": "def4567890123456",
  "userId": "user-123",
  "requestId": "req-abc-123",
  "eventId": "evt-xyz-789",
  "amount": 100.00,
  "currency": "USD"
}
```

### Using the Logger

```typescript
import { logger, logWithCorrelation } from './middleware/correlation-logger.middleware';

// Automatic trace correlation
logger.info('Processing deposit', {
  userId: 'user-123',
  amount: 100,
});

// Or with explicit correlation
logWithCorrelation('info', 'Deposit completed', {
  eventId: 'evt-123',
  processingTime: '150ms',
});
```

---

## Health Endpoint

### Observability Status

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "healthy",
  "service": "api-gateway",
  "features": {
    "websocket": { "enabled": true, "localConnections": 42 },
    "kafka": { "enabled": true, "topic": "activity-events" },
    "redis": { "connected": true, "latency": 2 },
    "observability": {
      "tracing": true,
      "exporter": "otlp",
      "serviceName": "api-gateway",
      "environment": "development",
      "samplingRate": 0.2
    }
  }
}
```

---

## Trace Visualization in Jaeger

### Example Trace View

```
Trace: abc123def45678901234567890123456
Duration: 245ms
Services: 4 (api-gateway, wallet-service, kafka, websocket)
Spans: 8
├─ api-gateway: HTTP POST /api/wallet/deposit (2.1ms)
│  └─ Tags: http.method=POST, http.url=/api/wallet/deposit, user.id=user-123
│
├─ api-gateway: HTTP GET wallet-service/deposit (45ms)
│  ├─ Tags: http.method=GET, peer.service=wallet-service
│  └─ Logs:
│     ├─ 10:30:00.100: Request headers
│     ├─ 10:30:00.145: Response received
│
├─ wallet-service: HTTP POST /deposit (38ms)
│  ├─ Tags: http.method=POST, http.status_code=200
│  └─ Child Spans:
│     ├─ wallet.validate_deposit (5ms)
│     ├─ wallet.update_balance (12ms)
│     ├─ wallet.save_transaction (15ms)
│     └─ kafka.produce (4ms)
│        ├─ Tags: messaging.system=kafka, messaging.destination=activity-events
│        └─ Logs:
│           ├─ 10:30:00.200: Message published
│
├─ kafka: messaging.receive (2ms)
│  └─ Tags: messaging.operation=receive, messaging.kafka.partition=0
│
├─ api-gateway: kafka.consume (3ms)
│  ├─ Tags: messaging.system=kafka, messaging.operation=receive
│  └─ Child Spans:
│     ├─ event.validate (0.5ms)
│     ├─ websocket.push_event (1.5ms)
│     │  ├─ Tags: websocket.event_type=activity:new, user.id=user-123
│     │  └─ Logs:
│     │     ├─ 10:30:00.205: Event pushed to user user-123
│     │     ├─ 10:30:00.206: Socket count: 2
│
└─ api-gateway: websocket.send (0.3ms)
   └─ Tags: websocket.socket_id=socket-abc, user.id=user-123
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_SERVICE_NAME` | Service identifier | `api-gateway` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP collector URL | `http://localhost:4318/v1/traces` |
| `OTEL_ENVIRONMENT` | Environment label | `development` |
| `OTEL_SAMPLING_RATE` | Trace sampling rate (0-1) | `0.2` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | Protocol (grpc/http) | `http/protobuf` |
| `KAFKA_BROKERS` | Kafka bootstrap servers | `localhost:9092` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |

---

## Troubleshooting

### Common Issues

**No traces appearing in Jaeger:**

```bash
# 1. Check Jaeger is running
curl http://localhost:16686

# 2. Verify OTLP endpoint
curl -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans": []}'

# 3. Check sampling rate
echo $OTEL_SAMPLING_RATE  # Should be > 0
```

**Broken trace continuity:**

```bash
# Verify context propagation headers
# Should see traceparent header in:
# - HTTP requests: traceparent: 00-abc123...
# - Kafka messages: headers['traceparent']
# - WebSocket metadata: traceContext
```

**Performance impact:**

```bash
# Adjust sampling rate for production
OTEL_SAMPLING_RATE=0.05  # 5% sampling

# Or use parent-based sampling
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

---

## Production Checklist

- [ ] Sampling rate configured (0.05-0.2 for production)
- [ ] Jaeger/Tempo deployed with persistence
- [ ] Log correlation working (traceId in all logs)
- [ ] Alerting rules set up (error rate, latency)
- [ ] Dashboard created in Grafana
- [ ] Documentation shared with team
- [ ] Runbook for common issues

---

## Additional Resources

- **Jaeger UI:** http://localhost:16686
- **Grafana:** http://localhost:3001
- **API Health:** http://localhost:3000/health
- **OTLP Endpoint:** http://localhost:4318/v1/traces

---

## Next Steps

1. Review traces in Jaeger UI after making API requests
2. Verify trace continuity across all services
3. Set up alerts for error traces
4. Create Grafana dashboards
5. Share trace correlation IDs with frontend team

**Questions?** Check the example files:
- `docs/TRACING_SERVICE_TEMPLATE.ts`
- `docs/KAFKA_PRODUCER_TRACING_EXAMPLE.ts`
- `docs/KAFKA_CONSUMER_TRACING_EXAMPLE.ts`
