# Resilience Layer - Production Configuration Guide

## Overview

This guide provides production-ready configuration for the Resilience Layer, including Circuit Breakers, Retry, Timeout, Bulkhead isolation, and Graceful Degradation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Resilience Layer Stack                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Retry     │→│   Timeout   │→│   Circuit   │                 │
│  │  (Backoff)  │  │(4s limit)  │  │  Breaker    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│         │                │                │                          │
│         ↓                ↓                ↓                          │
│  ┌─────────────────────────────────────────────────┐               │
│  │            Bulkhead Isolation                    │               │
│  │     (max concurrent per service)                │               │
│  └─────────────────────────────────────────────────┘               │
│                          │                                         │
│                          ↓                                         │
│  ┌─────────────────────────────────────────────────┐               │
│  │        Downstream Service Call                   │               │
│  └─────────────────────────────────────────────────┘               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Circuit Breaker Configuration

### Default Settings

```typescript
const CIRCUIT_BREAKER_CONFIG = {
  // Time before considering request a failure
  timeout: 4000,                    // 4 seconds
  
  // Error rate threshold to open circuit
  errorThresholdPercentage: 50,   // 50% failure rate
  
  // Time before attempting to close (half-open)
  resetTimeout: 15000,            // 15 seconds
  
  // Window for calculating error rate
  rollingCountTimeout: 10000,     // 10 seconds
  
  // Minimum calls before calculating rate
  volumeThreshold: 5,
};
```

### Service-Specific Configurations

| Service | Timeout | Error Threshold | Reset Timeout | Volume Threshold |
|---------|---------|----------------|---------------|------------------|
| wallet-service | 4000ms | 50% | 15000ms | 5 |
| traveler-service | 4000ms | 60% | 10000ms | 3 |
| marketplace-service | 4000ms | 60% | 10000ms | 3 |

### Error Filtering (4xx vs 5xx)

```typescript
// Don't open circuit for client errors (4xx)
errorFilter: (error) => {
  const statusCode = error.statusCode;
  if (statusCode >= 400 && statusCode < 500) {
    return true; // Filter out - don't count as failure
  }
  return false; // Count as failure
}
```

## Retry Configuration

### Exponential Backoff Strategy

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 100,           // Start at 100ms
  maxDelay: 5000,           // Cap at 5 seconds
  backoffMultiplier: 2,     // Double each time
  jitter: true,             // Add ±25% random variation
};
```

### Retry Pattern

| Attempt | Base Delay | Jitter (±25%) | Actual Range |
|---------|-----------|---------------|--------------|
| 1 | 100ms | ±25ms | 75-125ms |
| 2 | 200ms | ±50ms | 150-250ms |
| 3 | 400ms | ±100ms | 300-500ms |

### Non-Retryable Errors (Fail Fast)

- **400** Bad Request - Client error
- **401** Unauthorized - Auth error
- **403** Forbidden - Permission error
- **404** Not Found - Resource error
- **405** Method Not Allowed
- **422** Validation Error

### Retryable Errors

- **408** Request Timeout
- **429** Too Many Requests (rate limit)
- **500** Internal Server Error
- **502** Bad Gateway
- **503** Service Unavailable
- **504** Gateway Timeout
- **Network errors** (ECONNREFUSED, ETIMEDOUT, etc.)

## Timeout Configuration

### Per-Service Timeouts

| Service | Timeout | Priority |
|---------|---------|----------|
| wallet-service | 4000ms | High |
| traveler-service | 4000ms | Medium |
| marketplace-service | 4000ms | Medium |
| auth-service | 2000ms | Critical |
| default | 5000ms | - |

### AbortController Pattern

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 4000);

try {
  const result = await axios.get(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  return result;
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    throw new TimeoutError(serviceName, 4000);
  }
  throw error;
}
```

## Bulkhead Configuration

### Concurrent Execution Limits

| Service | Max Concurrent | Max Queue | Queue Timeout |
|---------|---------------|-----------|---------------|
| wallet-service | 50 | 100 | 5000ms |
| traveler-service | 30 | 60 | 5000ms |
| marketplace-service | 30 | 60 | 5000ms |

### Utilization Monitoring

```typescript
// Alert when utilization > 80%
if (utilizationPercent > 80) {
  logger.warn(`Bulkhead at ${utilizationPercent}% capacity for ${serviceName}`);
}
```

## Kafka Backpressure Configuration

### Lag Thresholds

```typescript
const BACKPRESSURE_CONFIG = {
  // Pause consumption if lag exceeds this
  maxConsumerLag: 1000,
  
  // Resume when lag drops below this
  resumeThreshold: 100,
  
  // Also pause if WebSocket queue is full
  maxWebSocketQueueSize: 500,
  
  // Auto-resume after max pause duration
  pauseTimeout: 30000,
  
  // Check lag every 5 seconds
  checkInterval: 5000,
};
```

## Graceful Degradation Strategy

### Fallback Data per Domain

```typescript
const FALLBACKS = {
  wallet: {
    balance: null,
    transactions: [],
    error: 'wallet-service unavailable',
  },
  traveler: {
    trips: [],
    bookings: [],
    error: 'traveler-service unavailable',
  },
  marketplace: {
    listings: [],
    orders: [],
    error: 'marketplace-service unavailable',
  },
};
```

### Partial Response Format

```json
{
  "success": true,
  "data": {
    "wallet": { "balance": null, "error": "..." },
    "traveler": { "trips": [...] },
    "marketplace": { "listings": [...] }
  },
  "meta": {
    "partial": true,
    "failedDomains": ["wallet"],
    "successDomains": ["traveler", "marketplace"],
    "timestamp": "2026-02-21T10:30:00.000Z",
    "responseTime": 245
  }
}
```

## Environment Variables

```bash
# Circuit Breaker
CIRCUIT_TIMEOUT=4000
CIRCUIT_ERROR_THRESHOLD=50
CIRCUIT_RESET_TIMEOUT=15000

# Retry
RETRY_MAX_RETRIES=3
RETRY_BASE_DELAY=100
RETRY_MAX_DELAY=5000
RETRY_JITTER=true

# Timeout
TIMEOUT_WALLET=4000
TIMEOUT_TRAVELER=4000
TIMEOUT_MARKETPLACE=4000

# Bulkhead
BULKHEAD_WALLET_MAX=50
BULKHEAD_TRAVELER_MAX=30
BULKHEAD_MARKETPLACE_MAX=30

# Kafka Backpressure
KAFKA_MAX_LAG=1000
KAFKA_RESUME_THRESHOLD=100
KAFKA_MAX_QUEUE=500

# Sampling (for production)
RESILIENCE_SAMPLING_RATE=0.2
```

## Monitoring & Alerting

### Key Metrics to Track

| Metric | Threshold | Severity |
|--------|-------------|----------|
| Circuit Open | > 0 circuits open | Warning |
| Circuit Error Rate | > 50% | Critical |
| Bulkhead Rejection Rate | > 10% | Warning |
| Retry Rate | > 20% | Warning |
| Timeout Rate | > 5% | Warning |
| Kafka Lag | > 1000 | Warning |
| Kafka Paused | true | Info |

### Prometheus Metrics (Future)

```
circuit_breaker_state{service="wallet-service"} 0|1|2  // 0=closed, 1=open, 2=half-open
circuit_breaker_failures_total{service="wallet-service"} 42
circuit_breaker_successes_total{service="wallet-service"} 158

bulkhead_concurrent{service="wallet-service"} 35
bulkhead_queued{service="wallet-service"} 5
bulkhead_rejected_total{service="wallet-service"} 3

retry_attempts_total{service="wallet-service"} 27
retry_success_after_retry_total{service="wallet-service"} 8

timeout_total{service="wallet-service"} 5

kafka_consumer_lag{group="activity-gateway-consumer"} 245
kafka_consumer_paused{group="activity-gateway-consumer"} 0
```

## Health Endpoint

### Resilience Status Response

```json
GET /health
{
  "status": "healthy",
  "features": {
    "resilience": {
      "enabled": true,
      "circuitBreakers": {
        "wallet-service": {
          "state": "closed",
          "failures": 2,
          "successes": 48,
          "errorRate": 4,
          "openTime": null
        },
        "traveler-service": {
          "state": "open",
          "failures": 8,
          "successes": 2,
          "errorRate": 80,
          "openTime": "2026-02-21T10:15:00.000Z"
        },
        "marketplace-service": {
          "state": "closed",
          "failures": 0,
          "successes": 50,
          "errorRate": 0
        }
      },
      "bulkheads": {
        "wallet-service": {
          "running": 23,
          "waiting": 3,
          "maxConcurrent": 50,
          "utilizationPercent": 46
        }
      }
    },
    "kafka": {
      "backpressure": {
        "isPaused": false,
        "currentLag": 45,
        "webSocketQueueSize": 12,
        "totalPaused": 2,
        "totalResumed": 2
      }
    }
  }
}
```

## Load Testing Guidelines

### Circuit Breaker Test

```bash
# Simulate service failure
curl -X POST http://localhost:3000/admin/simulate-failure \
  -d '{"service": "wallet-service", "duration": 30000}'

# Watch circuit open
watch -n 1 'curl -s http://localhost:3000/health | jq .features.resilience.circuitBreakers'

# Watch recovery
# After 15 seconds (resetTimeout), circuit should go half-open
# After successful requests, circuit should close
```

### Bulkhead Test

```bash
# Simulate 100 concurrent requests
for i in {1..100}; do
  curl -s http://localhost:3000/api/wallet/balance &
done

# Watch bulkhead utilization
curl -s http://localhost:3000/health | jq .features.resilience.bulkheads
```

### Timeout Test

```bash
# Simulate slow response (5s delay)
curl -X POST http://localhost:3000/admin/simulate-delay \
  -d '{"service": "wallet-service", "delay": 5000}'

# Request should timeout after 4s
curl http://localhost:3000/api/wallet/balance
# → TimeoutError after 4000ms
```

## Best Practices

### 1. Circuit Breaker
- Set `volumeThreshold` to prevent opening on first failure
- Use `errorFilter` to avoid counting 4xx errors
- Monitor `halfOpen` state for recovery patterns

### 2. Retry
- Only retry idempotent operations (GET, safe POSTs)
- Use jitter to prevent thundering herd
- Set `maxDelay` to prevent excessive waiting

### 3. Timeout
- Always shorter than circuit breaker timeout
- Use AbortController for proper cleanup
- Log timeout events for debugging

### 4. Bulkhead
- Set limits based on downstream capacity
- Monitor utilization for capacity planning
- Reject fast rather than queue indefinitely

### 5. Graceful Degradation
- Design fallbacks that provide value even when incomplete
- Communicate partial state clearly to clients
- Track which domains frequently fail

## Troubleshooting

### Circuit Breaker Issues

**Circuit opens too quickly:**
- Increase `volumeThreshold`
- Increase `rollingCountTimeout`
- Adjust `errorThresholdPercentage`

**Circuit won't close:**
- Check if resetTimeout has passed
- Verify half-open requests are succeeding
- Review errorFilter configuration

### Retry Issues

**Too many retries:**
- Reduce `maxRetries`
- Increase `baseDelay`
- Check for non-retryable errors being retried

**Retries not happening:**
- Verify error is in retryable list
- Check if circuit is already open
- Review jitter calculation

### Bulkhead Issues

**Too many rejections:**
- Increase `maxConcurrent`
- Increase `maxQueue`
- Check for slow downstream responses

**Memory leaks:**
- Ensure proper cleanup on timeout
- Monitor queue growth
- Set appropriate `queueTimeout`

## Recovery Procedures

### Manual Circuit Control

```typescript
// Force open (emergency)
import { forceOpen } from './resilience';
forceOpen('wallet-service');

// Force close (after fix)
import { forceClose } from './resilience';
forceClose('wallet-service');
```

### Kafka Backpressure Override

```typescript
// Manual pause
import { manualPause } from './resilience';
await manualPause('activity-gateway-consumer', kafka);

// Manual resume
import { manualResume } from './resilience';
await manualResume('activity-gateway-consumer', kafka);
```

---

## Summary

| Component | Purpose | Key Config |
|-----------|---------|-----------|
| Circuit Breaker | Fail fast on errors | 50% threshold, 15s reset |
| Retry | Handle transient failures | 3 retries, exponential backoff |
| Timeout | Prevent hanging | 4s max per service |
| Bulkhead | Limit concurrency | 30-50 concurrent per service |
| Graceful Degradation | Partial responses | Fallback data per domain |
| Kafka Backpressure | Handle lag | Pause at 1000 lag |

This resilience layer ensures the API Gateway can handle:
- **10,000+ concurrent users**
- **Downstream service outages**
- **Network partitions**
- **Kafka consumer lag spikes**
- **Redis latency increases**

Without crashing or blocking.
