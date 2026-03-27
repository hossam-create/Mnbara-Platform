# SLO (Service Level Objective) Strategy

## Overview

Service Level Objectives define the target reliability and performance metrics for the API Gateway. This document outlines our SLO strategy, error budgets, and incident response procedures.

## SLO Definitions

### Core SLOs

| SLO | Target | Measurement Window | Alert Threshold |
|-----|--------|-------------------|-----------------|
| **Availability** | 99.9% | 30 days | < 99.5% |
| **P95 Latency** | < 300ms | 1 minute rolling | > 400ms |
| **P99 Latency** | < 500ms | 1 minute rolling | > 700ms |
| **Error Rate** | < 2% | 5 minutes | > 3% |

### Derived SLOs

| SLO | Target | Rationale |
|-----|--------|-----------|
| **Circuit Breaker Trigger** | < 5% | Healthy downstream |
| **Load Shed Rate** | < 1% | Normal operation |
| **Brownout Activation** | < 0.1% | Rare events only |
| **Rate Limit Hit Rate** | < 0.5% | Legitimate users |

## Error Budget

### Calculation

```
Error Budget = 100% - SLO Target

For 99.9% availability:
Error Budget = 0.1% per month
= 43.8 minutes downtime per month
```

### Burn Rate

| Burn Rate | Meaning | Action |
|-----------|---------|--------|
| 1x | Normal | Continue as is |
| 2x | Elevated | Review recent changes |
| 4x | Fast | Incident response |
| 10x | Critical | Emergency procedures |

**Calculation:**
```
Burn Rate = (Error Budget Consumed) / (Time Elapsed / Total Window)

Example:
- 1 hour into month
- 2.19 minutes downtime consumed
- Burn Rate = 2.19 / (1 / 720) = 15.8x
```

### Alerting

```
Fast Burn Alert: Burn Rate > 10x for 1 hour
Slow Burn Alert: Burn Rate > 1x over 3 days
Exhaustion Alert: 50% budget consumed in 50% time
```

## SLO Monitoring

### Measurement Points

```
┌─────────────────────────────────────────────────────────┐
│                    Request Lifecycle                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Client → Gateway → Auth → Rate Limit → Priority Queue  │
│    ↓         ↓       ↓         ↓            ↓          │
│  Ingress   Parse   Validate   Check      Weight        │
│  Latency   Time    Time      Limit       Sort          │
│                                                         │
│  → Load Shed Check → Bulkhead → Circuit → Downstream    │
│       ↓                ↓         ↓           ↓         │
│    Decision         Wait      State      Latency       │
│                                                         │
│  → Response → Client                                      │
│      ↓                                                   │
│   Record: Total Latency, Success/Error                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Metrics

**Latency Percentiles:**
```typescript
// Record at response time
recordLatency(totalRequestTime);

// Calculate percentiles
P95 = percentile(latencySamples, 95);
P99 = percentile(latencySamples, 99);
```

**Error Rate:**
```typescript
// Record at response completion
recordRequestOutcome(isError);

// Calculate over window
Error Rate = (Error Count / Total Requests) × 100
```

**Availability:**
```typescript
// Availability = Successful Requests / Total Requests
// Measured over 30-day window
Availability = (totalRequests - errorRequests) / totalRequests × 100
```

### Windows

| Metric | Window | Rationale |
|--------|--------|-----------|
| Latency | 1 minute | Fast reaction to degradation |
| Error Rate | 5 minutes | Smooth out spikes |
| Availability | 30 days | Long-term reliability |
| Burn Rate | 1 hour | Immediate threat detection |

## Adaptive Response

### Latency SLO Violations

**P95 > 300ms (Warning):**
```
1. Record violation span
2. Analyze latency breakdown
3. Adjust circuit breaker thresholds
4. Check downstream service health
```

**P95 > 450ms (Critical):**
```
1. Trigger load shedding for low priority
2. Enable brownout mode (nice-to-have features)
3. Reduce bulkhead concurrency limits
4. Increase retry delays
5. Alert on-call engineer
```

### Error Rate Violations

**Error Rate > 2% (Warning):**
```
1. Categorize errors (4xx vs 5xx)
2. Check downstream health
3. Analyze circuit breaker state
4. Review recent deployments
```

**Error Rate > 4% (Critical):**
```
1. Trigger brownout mode (important features)
2. Reduce rate limits temporarily
3. Increase sampling rate for tracing
4. Emergency incident response
```

### Availability Violations

**Availability < 99.9% (Warning):**
```
1. Calculate burn rate
2. Review error budget consumption
3. Analyze root cause
4. Document in incident log
```

**Availability < 99% (Critical):**
```
1. Emergency brownout (all non-essential)
2. Page on-call immediately
3. Engage incident commander
4. Customer communication
```

## SLO Dashboards

### Real-Time Dashboard

```
┌─────────────────────────────────────────────────────────┐
│                    SLO Dashboard                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Availability (30d):  99.97% ████████████████████░      │
│  Target: 99.9%       ✅ Healthy                         │
│                                                         │
│  Error Budget:        43.2m remaining                   │
│  Burn Rate:          0.8x  (Normal)                     │
│                                                         │
│  P95 Latency:         145ms                             │
│  P99 Latency:         280ms                             │
│  Target: < 300ms     ✅ Healthy                         │
│                                                         │
│  Error Rate (5m):     0.5%                            │
│  Target: < 2%        ✅ Healthy                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Active Alerts: None                                    │
│  Last Incident: 3 days ago                             │
└─────────────────────────────────────────────────────────┘
```

### Historical Trends

**Weekly SLO Report:**
```
Week of 2026-02-14:

Availability:    99.95%  (Target: 99.9%)  ✅
P95 Latency:     180ms   (Target: 300ms)   ✅
P99 Latency:     320ms   (Target: 500ms)   ✅
Error Rate:      1.2%    (Target: 2%)      ✅

Violations:
- 2026-02-16 14:23: P95 spike to 450ms (resolved 5 min)
  Cause: Downstream latency increase
  Action: Circuit breaker tuned

Error Budget Consumed: 12% (on track)
```

## Incident Response

### SLO-Based Severity

| Severity | Condition | Response Time | Actions |
|----------|-----------|---------------|---------|
| SEV1 | SLO violation + customer impact | 15 min | Page on-call, incident commander, customer comms |
| SEV2 | SLO violation + degraded experience | 30 min | On-call engaged, monitoring increased |
| SEV3 | SLO warning threshold crossed | 1 hour | Track during business hours |
| SEV4 | Trending toward violation | 4 hours | Review in next standup |

### Runbooks

**"P95 Latency Violation" Runbook:**
```
1. Check /health endpoint for system state
2. Review distributed traces for slow paths
3. Check downstream service latency
4. Verify circuit breaker states
5. If downstream issue: Enable brownout mode
6. If capacity issue: Scale horizontally
7. Document in incident log
```

**"Error Rate Violation" Runbook:**
```
1. Check error categorization (4xx vs 5xx)
2. Review circuit breaker open/close events
3. Check for downstream outages
4. Verify load shedding is active
5. If cascading failure: Trigger emergency brownout
6. Engage downstream service owners
7. Customer communication if needed
```

## SLO Calibration

### Review Process

**Monthly SLO Review:**
1. Analyze SLO achievement over past month
2. Review error budget consumption
3. Identify trends and patterns
4. Adjust targets if needed (±10%)
5. Document rationale for changes

**Quarterly SLO Calibration:**
1. Comprehensive review of all SLOs
2. Customer feedback integration
3. Competitor benchmark analysis
4. Infrastructure capacity review
5. Major SLO changes require approval

### Adjustment Criteria

**Tighten SLO When:**
- Consistently exceeding target by > 20%
- Customer feedback indicates high satisfaction
- Infrastructure improvements enable better performance

**Relax SLO When:**
- Consistently missing target despite optimization
- Cost of improvement exceeds customer value
- Technical constraints prevent achievement

## SLO in Code

### Configuration

```typescript
// src/adaptive/adaptive-config.ts
export const SLO_TARGETS = {
  p95LatencyMs: 300,
  p99LatencyMs: 500,
  errorRatePercent: 2,
  availabilityPercent: 99.9,
};

export const METRIC_WINDOWS = {
  latencyWindowMs: 60000,      // 1 minute
  errorRateWindowMs: 300000,   // 5 minutes
};
```

### Instrumentation

```typescript
// Record every request
import { recordLatency, recordRequestOutcome } from './adaptive';

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const latency = Date.now() - start;
    const isError = res.statusCode >= 500;
    
    recordLatency(latency);
    recordRequestOutcome(isError);
  });
  
  next();
});
```

### Monitoring

```typescript
// Periodic SLO check
import { checkSLOs, getSLOHealth } from './adaptive';

setInterval(() => {
  const status = checkSLOs();
  
  if (!status.healthy) {
    // Trigger alerts
    sendAlert(`SLO Violation: ${status.violations.map(v => v.type).join(', ')}`);
  }
}, 30000);
```

## Best Practices

### 1. SLO Setting
- Start conservative, tighten over time
- Base on historical performance
- Consider customer-visible metrics
- Review quarterly

### 2. Error Budget
- Treat as team resource
- Allocate for innovation (releases)
- Stop releases when budget exhausted
- Report consumption weekly

### 3. Alerting
- Alert on SLO, not symptoms
- Use burn rate for urgency
- Minimize false positives
- Context-rich notifications

### 4. Incident Response
- SLO-first triage
- Fast mitigation over root cause
- Document in error budget
- Post-mortem within 24h

## Glossary

| Term | Definition |
|------|------------|
| **SLO** | Service Level Objective - target reliability |
| **SLI** | Service Level Indicator - metric being measured |
| **SLA** | Service Level Agreement - contract with consequences |
| **Error Budget** | Allowed unreliability (100% - SLO) |
| **Burn Rate** | Speed of error budget consumption |
| **P95** | 95th percentile - 95% of requests faster |
| **P99** | 99th percentile - 99% of requests faster |

## Summary

Our SLO strategy ensures:

✅ **Clear targets** for reliability and performance
✅ **Measurable metrics** with proper instrumentation
✅ **Error budgets** for balancing reliability and innovation
✅ **Adaptive response** to maintain SLOs under load
✅ **Incident response** procedures based on severity
✅ **Continuous review** and calibration

**Key Principle:** SLOs are promises to customers. We use adaptive protection to keep those promises even under extreme conditions.
