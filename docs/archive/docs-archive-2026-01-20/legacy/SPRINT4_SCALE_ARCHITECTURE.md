# SPRINT 4: SCALE ARCHITECTURE & OPS EXPANSION
## Market 1 Expansion Blueprint

**Confidential & Privileged**
**Classification:** Infrastructure Architecture
**Sprint:** 4 — Scale & Expansion
**Date:** December 18, 2025

---

## 1. Executive Summary

This document defines the architecture for expanding from **Market 0** (live, stable) to **Market 1** (new region) while ensuring:
- Zero impact to Market 0 operations during Market 1 issues
- Complete corridor-level isolation
- Human-governed scaling decisions
- Deterministic, kill-switch-driven control

```
┌─────────────────────────────────────────────────────────────┐
│                   MARKET ISOLATION PRINCIPLE                │
│                                                             │
│    "Market 1 failure NEVER cascades to Market 0."          │
│    "Market 0 remains untouched during Market 1 rollback."  │
│    "Each corridor is an independent failure domain."        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Market Scaling Architecture

### 2.1 Read-Heavy Scaling Assumptions

The platform is fundamentally **read-heavy**:
- Browsing listings: 100x more than creating listings
- Viewing trust scores: 50x more than generating new scores
- Checking prices: 20x more than placing orders

**Scaling Ratios (Baseline):**
| Operation Type | Read:Write Ratio | Cacheability |
| :--- | :--- | :--- |
| Listings | 100:1 | High (TTL: 5 min) |
| Trust Scores | 50:1 | Medium (TTL: 1 min) |
| Risk Scores | 10:1 | Low (per-transaction) |
| User Profiles | 30:1 | High (TTL: 10 min) |
| Price Data | 20:1 | Medium (TTL: 2 min) |

### 2.2 Cache Layer Evolution

**Market 0 (Current):**
- Single Redis cluster
- Simple key-value caching
- Manual invalidation

**Market 1 (Expanded):**
```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE ARCHITECTURE                       │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   MARKET 0      │    │   MARKET 1      │                │
│  │   Redis Cluster │    │   Redis Cluster │                │
│  │   (Isolated)    │    │   (Isolated)    │                │
│  └────────┬────────┘    └────────┬────────┘                │
│           │                      │                          │
│           └──────────┬───────────┘                          │
│                      │                                      │
│           ┌──────────▼──────────┐                          │
│           │   SHARED READ-ONLY  │                          │
│           │   Global Reference  │                          │
│           │   (Sanctions, PEP)  │                          │
│           └─────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

**Cache Rules:**
- Each market has its own Redis cluster (no cross-contamination)
- Cache keys are market-prefixed: `M1:user:123:trust`
- Global reference data (sanctions lists) is read-only shared
- Cache failure in Market 1 = Market 1 goes to origin (no Market 0 impact)

### 2.3 Queue Layer Evolution

**Market 0 (Current):**
- Single RabbitMQ cluster
- Shared queues

**Market 1 (Expanded):**
```
┌─────────────────────────────────────────────────────────────┐
│                    QUEUE ARCHITECTURE                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 MARKET 0 VHOST                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │US→EG Q  │ │US→UAE Q │ │EU→KSA Q │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 MARKET 1 VHOST                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│  │  │UK→NG Q  │ │DE→ZA Q  │ │FR→MA Q  │               │   │
│  │  └─────────┘ └─────────┘ └─────────┘               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Queue Rules:**
- Each market has its own RabbitMQ virtual host
- Each corridor has its own dedicated queue
- Queue overflow in Market 1 cannot steal resources from Market 0
- Dead letter queues are market-specific

### 2.4 Rate Control Evolution

**Rate Limiting Strategy:**
| Layer | Market 0 Limit | Market 1 Limit | Isolation |
| :--- | :--- | :--- | :--- |
| API Gateway | 1000 req/s | 500 req/s (initial) | Separate rate buckets |
| AI Inference | 200 req/s | 100 req/s (initial) | Separate service instances |
| Database | 500 connections | 250 connections | Separate connection pools |

**Rate Control Rules:**
- Market 1 starts at 50% of Market 0 capacity
- Capacity increases require human approval
- Rate limit exhaustion in Market 1 returns 429, no spillover to Market 0

---

## 3. Corridor-Based Load Isolation

### 3.1 Corridor Definition

A **corridor** is a directional trade route treated as an independent operational unit:
- `US→EG` (United States to Egypt)
- `UK→NG` (United Kingdom to Nigeria)
- `DE→ZA` (Germany to South Africa)

### 3.2 Isolation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 CORRIDOR ISOLATION MODEL                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    API GATEWAY                       │   │
│  │         (Routes by corridor header/param)            │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                  │
│      ┌───────────────────┼───────────────────┐              │
│      ▼                   ▼                   ▼              │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐             │
│  │ CORRIDOR  │   │ CORRIDOR  │   │ CORRIDOR  │             │
│  │  US→EG    │   │  UK→NG    │   │  DE→ZA    │             │
│  │           │   │           │   │           │             │
│  │ • Cache   │   │ • Cache   │   │ • Cache   │             │
│  │ • Queue   │   │ • Queue   │   │ • Queue   │             │
│  │ • Workers │   │ • Workers │   │ • Workers │             │
│  │ • Limits  │   │ • Limits  │   │ • Limits  │             │
│  └───────────┘   └───────────┘   └───────────┘             │
│       │               │               │                     │
│       ▼               ▼               ▼                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              SHARED DATABASE LAYER                   │   │
│  │         (Partition by corridor_id)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Failure Containment Rules

| Failure in Corridor | Impact on Other Corridors |
| :--- | :--- |
| Cache failure | None (other corridors have own cache) |
| Queue backup | None (other corridors have own queues) |
| Rate limit hit | None (other corridors have own buckets) |
| Worker crash | None (other corridors have own workers) |
| AI inference slow | None (other corridors have own pools) |

### 3.4 Corridor Independence Checklist

Before declaring a corridor "isolated":
- [ ] Dedicated cache namespace
- [ ] Dedicated queue(s)
- [ ] Dedicated worker pool
- [ ] Dedicated rate limit bucket
- [ ] Dedicated AI inference quota
- [ ] Independent kill switch
- [ ] Independent monitoring dashboard

---

## 4. Ops Capacity Scaling

### 4.1 Human Review Throughput Planning

**Current State (Market 0):**
| Metric | Value |
| :--- | :--- |
| Daily transactions | ~5,000 |
| AI auto-clear rate | 70% |
| Manual review required | 1,500/day |
| Avg review time | 3 min |
| Officer capacity | 8 hours × 20 reviews/hour = 160/day/officer |
| Officers needed | 1,500 ÷ 160 = ~10 officers |

**Market 1 Projection:**
| Metric | Conservative | Moderate | Aggressive |
| :--- | :--- | :--- | :--- |
| Daily transactions | 2,000 | 5,000 | 10,000 |
| Manual review (30%) | 600 | 1,500 | 3,000 |
| Additional officers | 4 | 10 | 19 |

**Scaling Rules:**
- Hire to 80% projected capacity (buffer for spikes)
- Cross-train Market 0 officers for Market 1 backup
- Never exceed 85% officer utilization (quality drops)

### 4.2 Queue Prioritization Rules

**Priority Ordering (Highest to Lowest):**

| Priority | Queue | SLA | Rationale |
| :--- | :--- | :--- | :--- |
| P0 | Escrow Disputes | < 2 hours | Money at risk |
| P1 | High-Value Transactions (>$1000) | < 4 hours | High exposure |
| P2 | High-Risk Flags | < 4 hours | Fraud prevention |
| P3 | Trust Verification | < 8 hours | User experience |
| P4 | Standard Review | < 24 hours | Normal flow |
| P5 | Low-Risk Spot Checks | < 48 hours | Sampling only |

**Overflow Rules:**
```
IF queue_depth(P4) > 8_hours THEN
    Reduce AI auto-clear threshold (more manual review)
    Alert Ops Manager
END IF

IF queue_depth(P2) > 4_hours THEN
    All-hands review session
    Consider corridor throttling
END IF

IF queue_depth(P0) > 2_hours THEN
    Escalate to Risk Officer
    Priority override on all officers
END IF
```

### 4.3 Ops Dashboard Metrics

**Required Visibility:**
- Real-time queue depth by priority
- Officer utilization rate
- Average case age
- Cases approaching SLA breach
- Corridor-level breakdown

---

## 5. Data Partitioning Strategy

### 5.1 Partition Model

**Market-Level Partitioning:**
```
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE PARTITIONING                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   PRIMARY DATABASE                   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Schema: market_0                                   │   │
│  │  Tables: users, transactions, escrow, trust...     │   │
│  │  Row filter: market_id = 0                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Schema: market_1                                   │   │
│  │  Tables: users, transactions, escrow, trust...     │   │
│  │  Row filter: market_id = 1                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Schema: shared                                     │   │
│  │  Tables: sanctions, pep_list, countries...         │   │
│  │  Access: READ-ONLY from market schemas              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Partition Rules

| Data Type | Partition Strategy | Cross-Market Access |
| :--- | :--- | :--- |
| User accounts | By market_id | None (users are market-local) |
| Transactions | By market_id + corridor_id | None |
| Escrow records | By market_id | None |
| Trust scores | By market_id | None |
| Risk logs | By market_id | Read-only for global analytics |
| Reference data | Shared schema | Read-only from all markets |

### 5.3 Migration Safety

**Adding Market 1 Data:**
- New tables created in `market_1` schema
- No DDL changes to `market_0` schema
- Application code uses schema routing based on request context
- Rollback = Drop `market_1` schema (Market 0 untouched)

---

## 6. Failure Containment

### 6.1 Failure Domains

```
┌─────────────────────────────────────────────────────────────┐
│                   FAILURE DOMAIN HIERARCHY                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    PLATFORM                          │   │
│  │  (Shared: Auth, Global Reference, Monitoring)        │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │   MARKET 0            │         MARKET 1            │   │
│  │   (Independent)       │         (Independent)       │   │
│  ├───────────────────────┼─────────────────────────────┤   │
│  │ Corridor │ Corridor   │ Corridor │ Corridor        │   │
│  │  US→EG   │  US→UAE    │  UK→NG   │  DE→ZA          │   │
│  └──────────┴────────────┴──────────┴─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Market 1 Misbehavior Scenarios

**Scenario A: Market 1 Traffic Spike**
| Event | Containment |
| :--- | :--- |
| Traffic 10x above limit | Market 1 rate limiter rejects excess |
| Impact on Market 0 | None (separate rate buckets) |
| Action | Human reviews, increases limit if legitimate |

**Scenario B: Market 1 Fraud Wave**
| Event | Containment |
| :--- | :--- |
| Fraud rate spikes in UK→NG | Corridor kill switch activated |
| Impact on other M1 corridors | None (corridor isolation) |
| Impact on Market 0 | None (market isolation) |
| Action | Investigation, threshold tightening, resume |

**Scenario C: Market 1 Database Corruption**
| Event | Containment |
| :--- | :--- |
| Schema/data corruption in market_1 | Isolated to market_1 schema |
| Impact on Market 0 | None (separate schema) |
| Action | Restore market_1 from backup, Market 0 unaffected |

**Scenario D: Market 1 AI Model Failure**
| Event | Containment |
| :--- | :--- |
| AI inference failing for Market 1 | Circuit breaker opens |
| Impact on Market 0 | None (separate AI pool) |
| Action | Market 1 → manual mode, Market 0 continues normally |

### 6.3 Blast Radius Controls

**Design Principles:**
- No shared mutable state between markets
- No shared worker pools between markets
- No shared cache partitions between markets
- No shared queue consumers between markets
- Shared read-only data only (reference tables)

---

## 7. Rollback & Freeze Strategy

### 7.1 Market 1 Kill Switches

```
┌─────────────────────────────────────────────────────────────┐
│               MARKET 1 KILL SWITCH HIERARCHY                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MARKET_1_ENABLED = FALSE                           │   │
│  │  Effect: All Market 1 traffic returns 503           │   │
│  │  Authority: Ops Manager                             │   │
│  │  Market 0: UNAFFECTED                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │M1_CORRIDOR_   │ │M1_CORRIDOR_   │ │M1_CORRIDOR_   │     │
│  │UK_NG_ENABLED  │ │DE_ZA_ENABLED  │ │FR_MA_ENABLED  │     │
│  │= FALSE        │ │= TRUE         │ │= TRUE         │     │
│  │               │ │               │ │               │     │
│  │Effect: UK→NG  │ │Effect: None   │ │Effect: None   │     │
│  │returns 503    │ │               │ │               │     │
│  └───────────────┘ └───────────────┘ └───────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Freeze Procedure (Market 1)

**Trigger:** Risk Officer decision OR automated threshold breach

**Procedure:**
```
┌─────────────────────────────────────────────────────────────┐
│  MARKET 1 FREEZE PROCEDURE                                  │
│                                                             │
│  1. SET MARKET_1_ENABLED = FALSE                           │
│     → New M1 requests return "Market temporarily unavailable"│
│                                                             │
│  2. DRAIN QUEUES                                           │
│     → In-flight M1 transactions complete normally          │
│     → New queue entries blocked                            │
│                                                             │
│  3. PROTECT ESCROW                                         │
│     → All M1 escrows locked (no releases)                  │
│     → Funds remain safe                                    │
│                                                             │
│  4. NOTIFY USERS                                           │
│     → Display maintenance message to M1 users              │
│     → M0 users see nothing different                       │
│                                                             │
│  5. INVESTIGATE                                            │
│     → Root cause analysis                                  │
│     → Decision: Fix and resume OR extended freeze          │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Rollback Procedure (Market 1)

**Trigger:** Unrecoverable Market 1 failure OR strategic decision

**Procedure:**
```
┌─────────────────────────────────────────────────────────────┐
│  MARKET 1 ROLLBACK PROCEDURE                                │
│                                                             │
│  1. FREEZE (see above)                                     │
│                                                             │
│  2. COMPLETE IN-FLIGHT                                     │
│     → Wait for all M1 queues to drain (max 24 hours)       │
│     → Process remaining escrows manually                   │
│                                                             │
│  3. USER COMMUNICATION                                     │
│     → Notify M1 users of service discontinuation           │
│     → Provide refund/withdrawal instructions               │
│                                                             │
│  4. DATA PRESERVATION                                      │
│     → Export market_1 schema to archive                    │
│     → Retain for regulatory period (7 years)               │
│                                                             │
│  5. INFRASTRUCTURE TEARDOWN                                │
│     → Decommission M1 Redis cluster                        │
│     → Decommission M1 queue vhost                          │
│     → Remove M1 worker deployments                         │
│     → Drop market_1 schema (after archive confirmed)       │
│                                                             │
│  6. VERIFICATION                                           │
│     → Confirm M0 completely unaffected                     │
│     → Performance baseline check                           │
│     → Audit log of rollback complete                       │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Zero-Touch Market 0 Guarantee

| Action | Market 0 Impact |
| :--- | :--- |
| Market 1 feature flag toggled | None |
| Market 1 corridor shutdown | None |
| Market 1 full freeze | None |
| Market 1 rollback | None |
| Market 1 schema dropped | None |
| Market 1 infrastructure removed | None |

**Verification Test (Pre-Launch):**
- Simulate full Market 1 rollback in staging
- Measure Market 0 latency/throughput during rollback
- Acceptance: < 1% deviation in Market 0 performance

---

## 8. Scaling Decision Authority

| Decision | Authority | Secondary |
| :--- | :--- | :--- |
| Add new corridor | Product + Ops Manager | Risk Officer notification |
| Increase M1 rate limits | Ops Manager | CTO notification |
| Add M1 infrastructure | CTO | Finance notification |
| Market 1 freeze | Risk Officer | Ops Manager execution |
| Market 1 rollback | CRO | CEO notification |
| Corridor-level shutdown | Ops Manager | Risk Officer notification |

---

## 9. Sprint 4 Checklist

Before Market 1 launch:

**Infrastructure:**
- [ ] M1 Redis cluster deployed and isolated
- [ ] M1 queue vhost configured
- [ ] M1 worker pool deployed
- [ ] M1 rate limits configured
- [ ] M1 kill switches tested

**Data:**
- [ ] market_1 schema created
- [ ] Data partitioning verified
- [ ] Cross-market queries blocked

**Ops:**
- [ ] M1 officer capacity hired/trained
- [ ] M1 queue priorities configured
- [ ] M1 monitoring dashboards live
- [ ] M1 runbooks documented

**Isolation Verified:**
- [ ] M1 cache failure does not affect M0
- [ ] M1 queue backup does not affect M0
- [ ] M1 rate limit exhaust does not affect M0
- [ ] M1 kill switch does not affect M0
- [ ] Full M1 rollback tested (no M0 impact)

---
**Document Owner:** Infrastructure Lead
**Review:** CTO, Risk Officer
**Version:** 1.0 (Sprint 4)
