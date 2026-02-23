# Error Handling Strategy - Real-Time Activity Stream

This document outlines the error handling strategy for the WebSocket + Kafka real-time activity streaming system.

## 1. WebSocket Connection Errors

### Connection Establishment Errors

| Error | Cause | Handling |
|-------|-------|----------|
| `401 Unauthorized` | Invalid/missing JWT | Connection rejected during handshake |
| `403 Forbidden` | Rate limit exceeded | Connection rejected, client should retry after delay |
| `429 Too Many Requests` | Max connections per user (2) | Connection rejected, client must close existing connections |

**Client Response:**
```json
{
  "type": "connection:error",
  "payload": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing token"
  },
  "timestamp": "2026-02-21T12:00:00.000Z"
}
```

### Runtime Connection Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Connection timeout | Client didn't respond to ping | Server terminates connection (code 1001) |
| Heartbeat timeout | No ping/pong in 60 seconds | Server terminates connection |
| Parse error | Invalid message format | Server logs error, continues connection |
| Network error | Network interruption | Client reconnects with exponential backoff |

## 2. Kafka Consumer Errors

### Initialization Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Broker unavailable | Kafka not running | Log warning, continue without real-time (REST fallback) |
| Authentication failed | Invalid SASL credentials | Log error, continue without real-time |
| Topic doesn't exist | activity-events not created | Log error, consumer waits for topic creation |

**Behavior:**
```typescript
// Consumer continues startup even if Kafka fails
try {
  await activityKafkaConsumer.initialize();
  await activityKafkaConsumer.start();
} catch (error) {
  console.warn('[Bootstrap] Kafka consumer failed, continuing with REST only');
  // System continues to work via REST API
}
```

### Runtime Consumer Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Message parse error | Invalid JSON in message | Log error, skip message, continue consuming |
| Schema validation failed | Missing required fields | Log error, skip message, continue consuming |
| Consumer group rebalance | New consumer joined | Automatic, consumer resumes from last committed offset |
| Consumer crashed | Unexpected error | Log error, attempt restart (max 3 retries) |

### Dead Letter Queue (Future Enhancement)

For messages that repeatedly fail:

```typescript
// Pseudo-code for future implementation
if (parseAttempts >= 3) {
  await producer.send({
    topic: 'activity-events-dlq',
    messages: [{ key: userId, value: originalMessage }]
  });
}
```

## 3. Redis Errors

### Connection Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Redis unavailable | Redis server down | Continue without caching/presence (local-only mode) |
| Timeout | Slow Redis response | Log warning, continue operation |
| Command failed | Invalid operation | Log error, continue operation |

**Redis Presence Manager Behavior:**
```typescript
if (!this.redis) {
  // Fallback: allow all if Redis is not available
  return { allowed: true, remaining: MAX_ATTEMPTS };
}
```

## 4. Service-to-Service Errors

### Downstream Service Failures (Activity Aggregation)

| Error | Cause | Handling |
|-------|-------|----------|
| Service timeout | >5s response time | Mark as failed, return partial results |
| Service unavailable | HTTP 503 | Mark as failed, return partial results |
| Invalid response | Wrong data format | Mark as failed, return partial results |

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "partial": true,
    "failedDomains": ["wallet"],
    "cached": false
  }
}
```

## 5. Client-Side Error Handling

### WebSocket Reconnection Strategy

```typescript
const RECONNECT_INTERVAL = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

// Exponential backoff
const backoff = Math.min(1000 * Math.pow(2, attempts), 30000);

// Connection states
- CONNECTING → OPEN → process messages
- OPEN → CLOSE → wait → reconnect
- ERROR → wait → reconnect
```

### React Hook Error Handling

```typescript
const { isConnected, error, reconnect } = useActivityWebSocket({
  token,
  onActivity: handleActivity,
  onError: (error) => {
    // Log to monitoring
    console.error('WebSocket error:', error);
    
    // Show user notification
    showToast('Real-time updates unavailable. Using REST fallback.');
  },
});
```

## 6. Circuit Breaker Pattern (Future)

For enhanced resilience, implement circuit breakers:

```typescript
interface CircuitBreaker {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  lastFailure: Date;
  threshold: number;
  timeout: number;
}

// When failures > threshold, OPEN circuit
// After timeout, HALF_OPEN (test with single request)
// If success, CLOSE circuit
```

## 7. Monitoring & Alerting

### Key Metrics to Track

| Metric | Threshold | Alert |
|--------|-----------|-------|
| WebSocket connections | >1000 | Warning |
| Connection error rate | >5% | Critical |
| Kafka consumer lag | >1000 messages | Warning |
| Redis latency | >100ms | Warning |
| Message processing time | >100ms | Warning |

### Log Levels

```typescript
// INFO: Normal operations
console.log('[WebSocket] User connected');

// WARN: Recoverable issues
console.warn('[KafkaConsumer] Consumer group rebalancing');

// ERROR: Requires attention
console.error('[Redis] Connection failed');

// CRITICAL: Service degradation
console.error('[WebSocket] Server crashed');
```

## 8. Graceful Degradation

### Priority Order

1. **WebSocket + Kafka** (best): Real-time streaming
2. **WebSocket only**: Real-time without persistence
3. **REST + Cache**: Cached aggregated endpoint
4. **REST only**: Direct service calls
5. **Partial REST**: Degraded with failed domains

### Fallback Flow

```
User Action
    ↓
Kafka Event (attempt)
    ↓ (if Kafka fails)
Direct WebSocket push
    ↓ (if WebSocket fails)
REST API fetch on next poll
    ↓ (if service fails)
Show cached data with warning
```

## 9. Testing Error Scenarios

### Manual Test Cases

```bash
# 1. Test connection without token (should fail)
websocat ws://localhost:3000/ws/activity

# 2. Test connection with invalid token (should fail)
websocat ws://localhost:3000/ws/activity?token=invalid

# 3. Test max connections (3rd should fail)
websocat ws://localhost:3000/ws/activity?token=$TOKEN &
websocat ws://localhost:3000/ws/activity?token=$TOKEN &
websocat ws://localhost:3000/ws/activity?token=$TOKEN  # Should fail

# 4. Test reconnection (kill and restart server)
# Client should auto-reconnect with backoff
```

### Load Testing

```bash
# Test with many concurrent connections
for i in {1..100}; do
  websocat ws://localhost:3000/ws/activity?token=$TOKEN &
done
```

## 10. Recovery Procedures

### Redis Recovery

```bash
# Check Redis health
redis-cli ping

# If down, restart Redis
systemctl restart redis

# Clear stale socket data
redis-cli --eval cleanup_sockets.lua
```

### Kafka Recovery

```bash
# Check consumer group status
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group activity-gateway-consumer

# If lag is high, consider:
# 1. Increase consumer instances
# 2. Increase partitions
# 3. Skip to latest (data loss - emergency only)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --reset-offsets --to-latest --execute --group activity-gateway-consumer --topic activity-events
```

### WebSocket Recovery

```bash
# Check active connections
curl http://localhost:3000/health | jq .features.websocket

# If issues, restart gateway (graceful)
kill -SIGTERM <pid>
```

## Summary

The system is designed to be **resilient by default**:

- Every component has a fallback
- Errors are logged but don't crash the system
- Clients auto-reconnect
- Partial results are better than no results
- REST API is always available as backup
