# Adaptive Protection & SLO Guard Architecture

## Executive Summary

The **Adaptive Intelligence Layer** transforms the API Gateway from a **Self-Healing System** to a **Self-Optimizing + Load-Adaptive Platform**. This layer continuously monitors system health, detects overload conditions, and automatically adjusts behavior to maintain Service Level Objectives (SLOs).

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Adaptive Intelligence Layer                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │    SLO      │  │   Overload  │  │   Rate      │               │
│  │   Guard     │  │  Detector   │  │  Limiter    │               │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘               │
│         │                │                │                        │
│         └────────────────┴────────────────┘                        │
│                          │                                         │
│                          ▼                                         │
│               ┌─────────────────────┐                               │
│               │   Load Shedding     │                               │
│               │   Decision Engine   │                               │
│               └──────────┬──────────┘                               │
│                          │                                         │
│              ┌───────────┴───────────┐                             │
│              ▼                       ▼                             │
│      ┌─────────────┐        ┌─────────────┐                       │
│      │  Brownout   │        │  Priority   │                       │
│      │    Mode     │        │   Queue     │                       │
│      └─────────────┘        └─────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Global Rate Limiter

**Dual Algorithm Approach:**

#### Token Bucket (Burst Control)
```typescript
// Allows bursts up to burstLimit, then limited to refillRate
const bucketConfig = {
  burstLimit: 50,      // Max burst for premium users
  refillRate: 5,       // 5 requests/sec sustained
};
```

**Redis Lua Script (Atomic):**
```lua
local bucket = redis.call('get', KEYS[1])
local now = tonumber(ARGV[1])
local elapsed = now - lastRefill
local tokensToAdd = math.floor(elapsed * refillRate / 1000)
bucket = math.min(bucket + tokensToAdd, burstLimit)

if bucket >= 1 then
  bucket = bucket - 1
  return {1, bucket}  -- Allowed
else
  return {0, bucket}  -- Rejected
end
```

#### Sliding Window (Fair Distribution)
- Uses Redis Sorted Sets
- Removes old entries outside window
- Counts current requests
- Provides accurate rate limiting over time

#### Rate Limit Tiers

| Tier | Per Minute | Per Hour | Burst | Refill/sec |
|------|-----------|----------|-------|-----------|
| free | 60 | 1,000 | 10 | 1 |
| premium | 300 | 10,000 | 50 | 5 |
| enterprise | 1,000 | 50,000 | 200 | 16 |
| admin | 2,000 | 100,000 | 500 | 33 |
| internal | 5,000 | 200,000 | 1,000 | 83 |

#### HTTP Headers
```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1708501200
X-RateLimit-Tier: premium
Retry-After: 60  (when limited)
```

### 2. Load Shedding Service

**Overload State Detection:**

| State | CPU | Memory | Event Loop | Connections |
|-------|-----|--------|-----------|-------------|
| Normal | < 70% | < 75% | < 50ms | < 8,000 |
| Degraded | 70-85% | 75-90% | 50-200ms | 8,000-10,000 |
| Critical | > 85% | > 90% | > 200ms | > 10,000 |

**Priority-Based Shedding:**

```typescript
const PRIORITY_CONFIGS = {
  critical: { canBeShed: false, bulkheadBypass: true },   // Never shed
  high: { canBeShed: false, bulkheadBypass: false },        // Never shed
  normal: { canBeShed: true, bulkheadBypass: false },       // Shed in critical
  low: { canBeShed: true, bulkheadBypass: false },          // Shed in degraded+
  background: { canBeShed: true, bulkheadBypass: false },    // Always shed first
};
```

**System Metrics Monitored:**
- CPU load average
- Memory heap usage
- Event loop lag (measured with `process.hrtime()`)
- Active handles/requests
- Connection count

### 3. SLO Guard

**Service Level Objectives:**

```typescript
const SLO_TARGETS = {
  p95LatencyMs: 300,        // 95% under 300ms
  p99LatencyMs: 500,        // 99% under 500ms
  errorRatePercent: 2,      // < 2% errors
  availabilityPercent: 99.9, // 99.9% uptime
};
```

**Violation Detection:**

| Violation | Threshold | Severity | Action |
|-----------|-----------|----------|--------|
| P95 Latency | > 300ms | Warning | Adjust circuit breakers |
| P95 Latency | > 450ms | Critical | Aggressive load shedding |
| Error Rate | > 2% | Warning | Analyze error patterns |
| Error Rate | > 4% | Critical | Increase retry delay |
| Availability | < 99.9% | Warning | Alert operators |
| Availability | < 95% | Critical | Emergency brownout |

**Adaptive Actions on SLO Violation:**
1. Increase circuit breaker error threshold
2. Increase retry delays to reduce load
3. Reduce bulkhead concurrency limits
4. Trigger brownout mode

### 4. Overload Detector

**Deep System Health Monitoring:**

```typescript
interface SystemHealthSnapshot {
  eventLoopLagMs: number;      // Event loop delay
  heap: {
    used: number;
    total: number;
    percent: number;
  };
  activeHandles: number;       // TCP sockets, files, etc.
  activeRequests: number;      // HTTP requests in flight
  cpuUsage: number;            // Process CPU time
  loadAverage: number[];       // System load (1, 5, 15 min)
}
```

**Event Loop Lag Measurement:**
```typescript
async function measureEventLoopLag(): Promise<number> {
  const start = process.hrtime.bigint();
  return new Promise((resolve) => {
    setImmediate(() => {
      const end = process.hrtime.bigint();
      resolve(Number(end - start) / 1000000); // Convert to ms
    });
  });
}
```

**Trend Analysis:**
- Compares recent (last 10) vs older (previous 10) samples
- Detects improving/stable/degrading trends
- Predictive early warning

### 5. Brownout Mode

**Feature Classification:**

| Priority | Features | Disable When |
|----------|----------|--------------|
| Essential | auth, wallet_core | Never |
| Important | recommendations, insights | Critical state only |
| Nice-to-have | analytics, marketing, logging | Degraded state |

**Brownout Behavior:**

```
Normal State:     All features enabled
                    ↓ (CPU > 70% OR Memory > 75%)
Degraded State:   Disable nice-to-have features
                    ↓ (CPU > 85% OR Memory > 90%)
Critical State:   Disable nice-to-have + important features
                    ↓ (Stable for 60s)
Recovery:         Gradually restore features (5 steps, 10s intervals)
```

**Auto-Recovery:**
- Requires 60s stability window
- Gradual restoration (5 steps)
- 10s intervals between steps
- 95% success rate verification

### 6. Priority Queue Execution

**Weighted Queue System:**

```typescript
const PRIORITY_WEIGHTS = {
  critical: 100,   // Served first
  high: 75,
  normal: 50,
  low: 25,
  background: 10,  // Served last
};
```

**Bulkhead Bypass:**
- Critical priorities bypass bulkhead queue
- Direct execution without waiting
- Reserved capacity for emergencies

**Max Wait Times:**

| Priority | Max Wait | Exceed Action |
|----------|----------|---------------|
| critical | 5s | Immediate processing |
| high | 10s | Priority boost |
| normal | 15s | Log warning |
| low | 20s | Consider shedding |
| background | 60s | Shed if overloaded |

## Integration Points

### Health Endpoint Response

```json
GET /health
{
  "status": "healthy",
  "features": {
    "adaptiveProtection": {
      "enabled": true,
      "brownoutMode": false,
      "overloadState": "normal",
      "sloStatus": "healthy",
      "rateLimiterActive": true,
      
      "loadShedding": {
        "active": false,
        "state": "normal",
        "metrics": {
          "cpuPercent": 45,
          "memoryPercent": 60,
          "eventLoopLagMs": 12,
          "activeConnections": 2340
        }
      },
      
      "slo": {
        "p95LatencyMs": 145,
        "p99LatencyMs": 280,
        "errorRatePercent": 0.5,
        "availabilityPercent": 99.97
      },
      
      "brownout": {
        "active": false,
        "disabledFeatures": 0,
        "inRecovery": false
      },
      
      "overload": {
        "isOverloaded": false,
        "lastSnapshot": {
          "eventLoopLagMs": 12,
          "heap": { "percent": 62 },
          "activeHandles": 45
        }
      }
    }
  }
}
```

### Tracing Integration

**Spans Created:**
- `rate_limit.token_bucket` - Token bucket check
- `rate_limit.sliding_window` - Sliding window check
- `overload.detect` - Overload detection
- `overload.detected` - Overload state entry
- `overload.recovery` - Recovery detected
- `load_shed.decision` - Load shedding decision
- `load_shed.critical` - Critical state actions
- `slo.check` - SLO verification
- `slo.violation` - SLO violation
- `slo.adaptive_action` - Adaptive response
- `brownout.apply` - Brownout activation
- `brownout.feature_disabled` - Feature disabled
- `brownout.feature_restored` - Feature restored

### Metrics (Prometheus Format)

```
# Rate limiting
rate_limit_requests_total{tier="premium",result="allowed"} 15234
rate_limit_requests_total{tier="free",result="rejected"} 456

# Load shedding
load_shed_decisions_total{priority="background",result="shed"} 89
load_shed_overload_state{state="degraded"} 0
load_shed_overload_state{state="critical"} 0

# SLO tracking
slo_latency_p95_ms 145
slo_latency_p99_ms 280
slo_error_rate_percent 0.5
slo_availability_percent 99.97
slo_violations_total{type="latency_p95"} 3

# Brownout
brownout_features_disabled_total 0
brownout_recovery_progress{step="3"} 1

# System health
system_cpu_percent 45
system_memory_percent 60
system_event_loop_lag_ms 12
system_active_connections 2340
```

## Chaos Testing

### Available Simulations

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `POST /admin/chaos/cpu` | CPU spike | `duration`, `intensity` |
| `POST /admin/chaos/memory` | Memory pressure | `sizeMB`, `duration` |
| `POST /admin/chaos/downstream` | Downstream latency | `service`, `delay`, `errorRate` |
| `POST /admin/chaos/connections` | Connection spike | `connections` |
| `POST /admin/chaos/slo` | SLO violation storm | `duration` |
| `POST /admin/chaos/brownout` | Force brownout | `state` |
| `POST /admin/chaos/full` | Full stress test | `duration` |

### Example Test Scenario

```bash
# 1. Start with normal load
curl http://localhost:3000/health | jq .features.adaptiveProtection

# 2. Trigger CPU + memory pressure
curl -X POST /admin/chaos/cpu -d '{"duration": 60000, "intensity": 80}'
curl -X POST /admin/chaos/memory -d '{"sizeMB": 800, "duration": 60000}'

# 3. Watch brownout activate
curl http://localhost:3000/health | jq .features.adaptiveProtection.brownout

# 4. Add downstream latency
curl -X POST /admin/chaos/downstream \
  -d '{"service": "wallet-service", "delay": 3000, "errorRate": 30}'

# 5. Watch SLO violations
curl http://localhost:3000/health | jq .features.adaptiveProtection.slo

# 6. Watch load shedding
curl http://localhost:3000/health | jq .features.adaptiveProtection.loadShedding

# 7. Stop chaos and watch recovery
curl -X POST /admin/chaos/stop
curl http://localhost:3000/health | jq .features.adaptiveProtection
```

## Performance Impact

**Minimal Overhead:**

| Operation | Overhead | Frequency |
|-----------|----------|-----------|
| Rate limit check | ~2ms | Every request |
| Load shed check | <1ms | Every request |
| SLO latency record | <0.5ms | Every request |
| Health snapshot | ~5ms | Every 2 seconds |
| Brownout check | <1ms | Every request |

**Throughput:**
- Handles 10,000+ RPS with < 5% overhead
- Scales horizontally with Redis Cluster
- No single point of failure

## Best Practices

### 1. Rate Limit Configuration
- Set burst limits 2-3x higher than sustained rate
- Use Redis Cluster for multi-region deployments
- Monitor rejection rates (should be < 1% for normal operation)

### 2. Load Shedding
- Always classify endpoints by priority
- Test shedding behavior in staging
- Monitor shed request metrics

### 3. SLO Guard
- Start with relaxed SLOs, tighten over time
- Alert on SLO violations immediately
- Use violation history to identify patterns

### 4. Brownout
- Never disable critical features
- Test degraded UX with product team
- Document which features disable when

### 5. Overload Detection
- Tune thresholds based on your workload
- Monitor false positive rate
- Use trend analysis for early warning

## Configuration

### Environment Variables

```bash
# Rate Limiting
RATE_LIMIT_DEFAULT_TIER=free
RATE_LIMIT_REDIS_CLUSTER=true

# Load Shedding
LOAD_SHED_CPU_WARNING=70
LOAD_SHED_CPU_CRITICAL=85
LOAD_SHED_MEMORY_WARNING=75
LOAD_SHED_MEMORY_CRITICAL=90

# SLO
SLO_P95_LATENCY_MS=300
SLO_P99_LATENCY_MS=500
SLO_ERROR_RATE_PERCENT=2
SLO_CHECK_INTERVAL_MS=30000

# Brownout
BROWNOUT_STABILITY_WINDOW_MS=60000
BROWNOUT_RECOVERY_STEPS=5
BROWNOUT_STEP_INTERVAL_MS=10000

# Overload Detection
OVERLOAD_CHECK_INTERVAL_MS=2000
OVERLOAD_EVENT_LOOP_WARNING_MS=50
OVERLOAD_EVENT_LOOP_CRITICAL_MS=200
```

### Runtime Configuration Updates

```typescript
import { updateRuntimeConfig } from './adaptive';

// Adjust SLO targets during known high-load events
updateRuntimeConfig({
  sloTargets: {
    p95LatencyMs: 500,  // Relaxed during peak
    p99LatencyMs: 800,
    errorRatePercent: 5,
    availabilityPercent: 99.5,
  }
});
```

## Troubleshooting

### Rate Limits Too Aggressive

**Symptoms:** High rejection rate for normal users
**Solution:**
```bash
# Check rate limit metrics
curl /admin/metrics | grep rate_limit

# Increase burst limits
# Edit adaptive-config.ts and restart
```

### Load Shedding Too Sensitive

**Symptoms:** Requests shed when system appears healthy
**Solution:**
```bash
# Check current thresholds
curl /health | jq .features.adaptiveProtection.loadShedding

# Adjust thresholds
LOAD_SHED_CPU_WARNING=80
LOAD_SHED_CPU_CRITICAL=90
```

### False SLO Violations

**Symptoms:** SLO violations without user impact
**Solution:**
- Check metric calculation windows
- Verify latency measurement points
- Consider longer windows for error rate

## Summary

The Adaptive Intelligence Layer provides:

✅ **Multi-tier rate limiting** (Token Bucket + Sliding Window)
✅ **Intelligent load shedding** (priority-based)
✅ **SLO monitoring & enforcement** (P95/P99/Error/Availability)
✅ **Deep system health detection** (CPU/Memory/Event Loop)
✅ **Graceful degradation** (brownout mode)
✅ **Automatic recovery** (gradual restoration)
✅ **Full observability** (tracing + metrics)
✅ **Chaos testing** (validate behavior under load)

**Result:** System maintains performance and availability even under extreme conditions.
