# Hyper-Scale Architecture for 10M+ Users

## Executive Summary

This document defines the architecture required to scale the platform to 10M+ users while preserving:
- Read-heavy optimization (90%+ reads)
- Deterministic AI behavior
- Corridor isolation (regulatory/operational)

---

## Scale Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Total Users | 10M+ | Active monthly |
| Concurrent Users | 500K+ | Peak |
| Requests/Second | 100K+ | Read-heavy |
| Read:Write Ratio | 90:10 | Optimized for reads |
| Latency P99 | <100ms | Read operations |
| Availability | 99.99% | 52 min downtime/year |
| Corridors | 50+ | Isolated |

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           HYPER-SCALE ARCHITECTURE (10M+ Users)                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              GLOBAL EDGE LAYER                                   │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │    │
│  │  │  CDN    │  │  CDN    │  │  CDN    │  │  CDN    │  │  CDN    │              │    │
│  │  │  MENA   │  │  EU     │  │  APAC   │  │  NA     │  │  LATAM  │              │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘              │    │
│  │       └───────────┬┴───────────┴┬───────────┴───────────┬┘                     │    │
│  │                   │             │                       │                       │    │
│  │  ┌────────────────▼─────────────▼───────────────────────▼────────────────────┐ │    │
│  │  │                    GLOBAL LOAD BALANCER (Anycast)                          │ │    │
│  │  │                    • GeoDNS routing                                        │ │    │
│  │  │                    • Health-based failover                                 │ │    │
│  │  │                    • DDoS protection                                       │ │    │
│  │  └────────────────────────────────┬──────────────────────────────────────────┘ │    │
│  └───────────────────────────────────┼──────────────────────────────────────────────┘    │
│                                      │                                                   │
│  ┌───────────────────────────────────▼──────────────────────────────────────────────┐   │
│  │                         REGIONAL CLUSTERS (Per Corridor)                          │   │
│  │                                                                                    │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐   │   │
│  │  │   REGION: MENA       │  │   REGION: EU         │  │   REGION: APAC       │   │   │
│  │  │   Corridors: 15      │  │   Corridors: 20      │  │   Corridors: 15      │   │   │
│  │  │   ┌────────────────┐ │  │   ┌────────────────┐ │  │   ┌────────────────┐ │   │   │
│  │  │   │ API Gateway    │ │  │   │ API Gateway    │ │  │   │ API Gateway    │ │   │   │
│  │  │   │ (Regional)     │ │  │   │ (Regional)     │ │  │   │ (Regional)     │ │   │   │
│  │  │   └───────┬────────┘ │  │   └───────┬────────┘ │  │   └───────┬────────┘ │   │   │
│  │  │           │          │  │           │          │  │           │          │   │   │
│  │  │   ┌───────▼────────┐ │  │   ┌───────▼────────┐ │  │   ┌───────▼────────┐ │   │   │
│  │  │   │ Service Mesh   │ │  │   │ Service Mesh   │ │  │   │ Service Mesh   │ │   │   │
│  │  │   │ (Istio/Linkerd)│ │  │   │ (Istio/Linkerd)│ │  │   │ (Istio/Linkerd)│ │   │   │
│  │  │   └───────┬────────┘ │  │   └───────┬────────┘ │  │   └───────┬────────┘ │   │   │
│  │  │           │          │  │           │          │  │           │          │   │   │
│  │  │   ┌───────▼────────┐ │  │   ┌───────▼────────┐ │  │   ┌───────▼────────┐ │   │   │
│  │  │   │ Microservices  │ │  │   │ Microservices  │ │  │   │ Microservices  │ │   │   │
│  │  │   │ (Sharded)      │ │  │   │ (Sharded)      │ │  │   │ (Sharded)      │ │   │   │
│  │  │   └────────────────┘ │  │   └────────────────┘ │  │   └────────────────┘ │   │   │
│  │  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: Sharding Strategy


### 1.1 Sharding Dimensions

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MULTI-DIMENSIONAL SHARDING                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   DIMENSION 1: CORRIDOR (Primary)                                                        │
│   ─────────────────────────────────                                                      │
│   • Each corridor = isolated shard                                                       │
│   • Regulatory compliance preserved                                                      │
│   • No cross-corridor data leakage                                                       │
│                                                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │
│   │ CORRIDOR_0  │  │ CORRIDOR_1  │  │ CORRIDOR_2  │  │ CORRIDOR_N  │                   │
│   │ UAE-SA      │  │ UAE-EG      │  │ UK-EU       │  │ ...         │                   │
│   │             │  │             │  │             │  │             │                   │
│   │ • Users     │  │ • Users     │  │ • Users     │  │ • Users     │                   │
│   │ • Listings  │  │ • Listings  │  │ • Listings  │  │ • Listings  │                   │
│   │ • Orders    │  │ • Orders    │  │ • Orders    │  │ • Orders    │                   │
│   │ • Payments  │  │ • Payments  │  │ • Payments  │  │ • Payments  │                   │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                   │
│                                                                                          │
│   DIMENSION 2: USER (Secondary)                                                          │
│   ─────────────────────────────────                                                      │
│   • Within corridor, shard by user_id                                                    │
│   • Consistent hashing for distribution                                                  │
│   • Supports user-centric queries                                                        │
│                                                                                          │
│   Shard Key: hash(user_id) % num_shards                                                 │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         CORRIDOR_0 (UAE-SA)                                      │   │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐     │   │
│   │  │ Shard 0   │  │ Shard 1   │  │ Shard 2   │  │ Shard 3   │  │ Shard N   │     │   │
│   │  │ Users 0-N │  │ Users N-M │  │ Users M-P │  │ Users P-Q │  │ Users ... │     │   │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘     │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   DIMENSION 3: TIME (Tertiary - for analytics)                                          │
│   ─────────────────────────────────────────────                                         │
│   • Hot data: Current month (fast storage)                                              │
│   • Warm data: 1-12 months (standard storage)                                           │
│   • Cold data: 12+ months (archive storage)                                             │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Shard Distribution

```typescript
// Sharding Configuration
interface ShardConfig {
  // Corridor-based primary sharding
  corridorShards: {
    [corridorId: string]: {
      region: string;
      primaryDb: string;
      replicaDbs: string[];
      cacheCluster: string;
      queueCluster: string;
    };
  };
  
  // User-based secondary sharding within corridor
  userShardCount: number;  // e.g., 16 shards per corridor
  
  // Shard key calculation
  getShardKey(userId: string, corridorId: string): string;
}

// Shard Key Calculation
function getShardKey(userId: string, corridorId: string): string {
  const userHash = consistentHash(userId);
  const shardNum = userHash % USER_SHARD_COUNT;
  return `${corridorId}_shard_${shardNum}`;
}

// Consistent Hashing for User Distribution
function consistentHash(key: string): number {
  // MurmurHash3 for consistent distribution
  return murmur3(key) >>> 0;
}
```

### 1.3 Database Sharding Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SHARDING                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         GLOBAL METADATA (Unsharded)                              │   │
│   │  • Corridor configurations                                                       │   │
│   │  • Feature flags                                                                 │   │
│   │  • System settings                                                               │   │
│   │  • Shard routing table                                                           │   │
│   │                                                                                   │   │
│   │  PostgreSQL (HA Cluster) - 3 nodes, synchronous replication                     │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         CORRIDOR SHARDS (Per Corridor)                           │   │
│   │                                                                                   │   │
│   │  CORRIDOR_0 (UAE-SA)                                                             │   │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│   │  │  Primary: pg-corridor0-primary.region-mena.internal                      │    │   │
│   │  │  Replicas: pg-corridor0-replica-{1,2,3}.region-mena.internal            │    │   │
│   │  │                                                                          │    │   │
│   │  │  Tables (Partitioned by user_id hash):                                   │    │   │
│   │  │  • users_p{0-15}                                                         │    │   │
│   │  │  • listings_p{0-15}                                                      │    │   │
│   │  │  • orders_p{0-15}                                                        │    │   │
│   │  │  • transactions_p{0-15}                                                  │    │   │
│   │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                   │   │
│   │  CORRIDOR_1 (UAE-EG)                                                             │   │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│   │  │  Primary: pg-corridor1-primary.region-mena.internal                      │    │   │
│   │  │  Replicas: pg-corridor1-replica-{1,2,3}.region-mena.internal            │    │   │
│   │  │  ... (same structure)                                                    │    │   │
│   │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         CROSS-CORRIDOR (Limited)                                 │   │
│   │  • User profiles (read replicas in each corridor)                               │   │
│   │  • Trust scores (eventually consistent)                                          │   │
│   │  • Global search index (Elasticsearch)                                           │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Shard Routing

```typescript
// Shard Router Service
class ShardRouter {
  private routingTable: Map<string, ShardInfo>;
  
  // Route request to correct shard
  async route(request: ShardedRequest): Promise<ShardConnection> {
    const corridorId = request.corridorId;
    const userId = request.userId;
    
    // 1. Get corridor shard
    const corridorShard = this.routingTable.get(corridorId);
    if (!corridorShard) {
      throw new Error(`Unknown corridor: ${corridorId}`);
    }
    
    // 2. Calculate user shard within corridor
    const userShardNum = consistentHash(userId) % USER_SHARD_COUNT;
    
    // 3. Determine read vs write
    if (request.isRead) {
      // Route to nearest replica
      return this.getNearestReplica(corridorShard, userShardNum);
    } else {
      // Route to primary
      return this.getPrimary(corridorShard, userShardNum);
    }
  }
  
  // Handle cross-corridor queries (limited)
  async routeCrossCorridor(request: CrossCorridorRequest): Promise<ShardConnection[]> {
    // Only allowed for specific operations
    if (!ALLOWED_CROSS_CORRIDOR_OPS.includes(request.operation)) {
      throw new Error('Cross-corridor operation not allowed');
    }
    
    // Return connections to all relevant corridors
    return request.corridorIds.map(id => this.routingTable.get(id));
  }
}
```

---

## Part 2: Cache & Queue Evolution


### 2.1 Multi-Tier Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MULTI-TIER CACHE ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         L1: LOCAL CACHE (Per Pod)                                │   │
│   │                                                                                   │   │
│   │  • In-memory (Node.js LRU / Go sync.Map)                                         │   │
│   │  • TTL: 30 seconds                                                               │   │
│   │  • Size: 100MB per pod                                                           │   │
│   │  • Use case: Hot path data (feature flags, corridor configs)                     │   │
│   │  • Invalidation: TTL-based only (no cross-pod sync)                             │   │
│   │                                                                                   │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│   │  │ Pod 1   │  │ Pod 2   │  │ Pod 3   │  │ Pod N   │  │ ...     │              │   │
│   │  │ L1 100MB│  │ L1 100MB│  │ L1 100MB│  │ L1 100MB│  │         │              │   │
│   │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └─────────┘              │   │
│   │       │            │            │            │                                  │   │
│   └───────┼────────────┼────────────┼────────────┼──────────────────────────────────┘   │
│           │            │            │            │                                       │
│           └────────────┴────────────┴────────────┘                                       │
│                              │ MISS                                                      │
│   ┌──────────────────────────▼──────────────────────────────────────────────────────┐   │
│   │                         L2: REDIS CLUSTER (Per Corridor)                         │   │
│   │                                                                                   │   │
│   │  • Redis Cluster (6+ nodes per corridor)                                         │   │
│   │  • TTL: 5-60 minutes (varies by data type)                                       │   │
│   │  • Size: 50GB per corridor cluster                                               │   │
│   │  • Use case: User sessions, trust scores, advisory cache                         │   │
│   │  • Invalidation: Pub/Sub + TTL                                                   │   │
│   │                                                                                   │   │
│   │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │   │
│   │  │ CORRIDOR_0 Cluster  │  │ CORRIDOR_1 Cluster  │  │ CORRIDOR_N Cluster  │     │   │
│   │  │ ┌─────┐ ┌─────┐    │  │ ┌─────┐ ┌─────┐    │  │ ┌─────┐ ┌─────┐    │     │   │
│   │  │ │ M1  │ │ M2  │    │  │ │ M1  │ │ M2  │    │  │ │ M1  │ │ M2  │    │     │   │
│   │  │ │ R1  │ │ R2  │    │  │ │ R1  │ │ R2  │    │  │ │ R1  │ │ R2  │    │     │   │
│   │  │ └─────┘ └─────┘    │  │ └─────┘ └─────┘    │  │ └─────┘ └─────┘    │     │   │
│   │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘     │   │
│   └──────────────────────────────────────────────────────────────────────────────────┘   │
│                              │ MISS                                                      │
│   ┌──────────────────────────▼──────────────────────────────────────────────────────┐   │
│   │                         L3: CDN EDGE CACHE (Global)                              │   │
│   │                                                                                   │   │
│   │  • CloudFront / Cloudflare                                                       │   │
│   │  • TTL: 1-24 hours (static/semi-static content)                                  │   │
│   │  • Use case: Product images, static configs, public listings                     │   │
│   │  • Invalidation: API-triggered purge                                             │   │
│   │                                                                                   │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│   │  │  MENA   │  │   EU    │  │  APAC   │  │   NA    │  │  LATAM  │              │   │
│   │  │  Edge   │  │  Edge   │  │  Edge   │  │  Edge   │  │  Edge   │              │   │
│   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘              │   │
│   └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```


### 2.2 Cache Data Classification

```typescript
// Cache tier assignment by data type
interface CacheStrategy {
  L1_LOCAL: {
    data: ['feature_flags', 'corridor_configs', 'rate_limits'];
    ttl: 30;  // seconds
    invalidation: 'TTL_ONLY';
  };
  
  L2_REDIS: {
    data: ['user_sessions', 'trust_scores', 'advisory_results', 
           'ai_recommendations', 'listing_details'];
    ttl: 300;  // 5 minutes default
    invalidation: 'PUBSUB_AND_TTL';
  };
  
  L3_CDN: {
    data: ['product_images', 'static_configs', 'public_listings',
           'corridor_metadata', 'help_content'];
    ttl: 3600;  // 1 hour default
    invalidation: 'API_PURGE';
  };
}

// Cache key structure (corridor-aware)
function buildCacheKey(corridorId: string, type: string, id: string): string {
  return `${corridorId}:${type}:${id}`;
}

// Example keys:
// UAE-SA:user:12345
// UAE-SA:trust:12345
// UAE-SA:advisory:req-67890
```

### 2.3 Cache Invalidation Patterns

```typescript
// Pattern 1: Write-Through (Strong Consistency)
class WriteThroughCache {
  async set(key: string, value: any, corridorId: string): Promise<void> {
    // 1. Write to database first
    await this.db.write(key, value);
    
    // 2. Update L2 Redis
    await this.redis.set(buildCacheKey(corridorId, 'data', key), value);
    
    // 3. Publish invalidation event (L1 will expire via TTL)
    await this.redis.publish(`invalidate:${corridorId}`, key);
  }
}

// Pattern 2: Cache-Aside (Read Performance)
class CacheAsideStrategy {
  async get(key: string, corridorId: string): Promise<any> {
    const cacheKey = buildCacheKey(corridorId, 'data', key);
    
    // 1. Check L1
    let value = this.l1Cache.get(cacheKey);
    if (value) return value;
    
    // 2. Check L2
    value = await this.redis.get(cacheKey);
    if (value) {
      this.l1Cache.set(cacheKey, value, 30);  // 30s TTL
      return value;
    }
    
    // 3. Load from DB
    value = await this.db.read(key);
    if (value) {
      await this.redis.setex(cacheKey, 300, value);  // 5min TTL
      this.l1Cache.set(cacheKey, value, 30);
    }
    
    return value;
  }
}

// Pattern 3: Event-Driven Invalidation
class EventDrivenInvalidation {
  constructor() {
    // Subscribe to invalidation events per corridor
    this.redis.subscribe('invalidate:*', (channel, key) => {
      const corridorId = channel.split(':')[1];
      this.invalidateLocal(corridorId, key);
    });
  }
}
```


### 2.4 Queue Architecture (Per-Corridor Isolation)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         QUEUE ARCHITECTURE (Corridor Isolated)                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         KAFKA CLUSTER (Per Region)                               │   │
│   │                                                                                   │   │
│   │  REGION: MENA                                                                    │   │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│   │  │  Brokers: kafka-mena-{1,2,3,4,5}.internal                                │    │   │
│   │  │  Replication Factor: 3                                                   │    │   │
│   │  │  Min ISR: 2                                                              │    │   │
│   │  │                                                                          │    │   │
│   │  │  TOPICS (Per Corridor):                                                  │    │   │
│   │  │  ┌─────────────────────────────────────────────────────────────────┐    │    │   │
│   │  │  │  corridor.UAE-SA.orders      (partitions: 16)                   │    │    │   │
│   │  │  │  corridor.UAE-SA.payments    (partitions: 16)                   │    │    │   │
│   │  │  │  corridor.UAE-SA.advisory    (partitions: 8)                    │    │    │   │
│   │  │  │  corridor.UAE-SA.audit       (partitions: 4, retention: 7 days) │    │    │   │
│   │  │  │  corridor.UAE-SA.dlq         (partitions: 4, dead letter)       │    │    │   │
│   │  │  └─────────────────────────────────────────────────────────────────┘    │    │   │
│   │  │  ┌─────────────────────────────────────────────────────────────────┐    │    │   │
│   │  │  │  corridor.UAE-EG.orders      (partitions: 16)                   │    │    │   │
│   │  │  │  corridor.UAE-EG.payments    (partitions: 16)                   │    │    │   │
│   │  │  │  corridor.UAE-EG.advisory    (partitions: 8)                    │    │    │   │
│   │  │  │  ...                                                            │    │    │   │
│   │  │  └─────────────────────────────────────────────────────────────────┘    │    │   │
│   │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                   │   │
│   │  PARTITIONING STRATEGY:                                                          │   │
│   │  • Order topics: partition by user_id (user's orders stay together)             │   │
│   │  • Payment topics: partition by transaction_id (idempotency)                    │   │
│   │  • Advisory topics: partition by request_id                                      │   │
│   │  • Audit topics: partition by timestamp (time-ordered)                          │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         CONSUMER GROUPS (Per Service)                            │   │
│   │                                                                                   │   │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│   │  │  Group: order-service-UAE-SA                                             │    │   │
│   │  │  Topics: corridor.UAE-SA.orders                                          │    │   │
│   │  │  Consumers: 4 (matches partition count / 4)                              │    │   │
│   │  │  Offset: COMMITTED (at-least-once)                                       │    │   │
│   │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│   │  │  Group: advisory-service-UAE-SA                                          │    │   │
│   │  │  Topics: corridor.UAE-SA.advisory                                        │    │   │
│   │  │  Consumers: 2                                                            │    │   │
│   │  │  Offset: COMMITTED                                                       │    │   │
│   │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```


### 2.5 Event Streaming Configuration

```typescript
// Kafka topic configuration per corridor
interface CorridorTopicConfig {
  corridorId: string;
  topics: {
    orders: TopicConfig;
    payments: TopicConfig;
    advisory: TopicConfig;
    audit: TopicConfig;
    dlq: TopicConfig;
  };
}

interface TopicConfig {
  name: string;
  partitions: number;
  replicationFactor: 3;
  retentionMs: number;
  cleanupPolicy: 'delete' | 'compact';
}

// Topic naming convention
function getTopicName(corridorId: string, domain: string): string {
  return `corridor.${corridorId}.${domain}`;
}

// Partition key strategies
const PARTITION_STRATEGIES = {
  orders: (msg: OrderEvent) => msg.userId,        // User affinity
  payments: (msg: PaymentEvent) => msg.txId,      // Idempotency
  advisory: (msg: AdvisoryEvent) => msg.requestId,
  audit: (msg: AuditEvent) => msg.timestamp,      // Time ordering
};

// Consumer configuration
interface ConsumerConfig {
  groupId: string;
  corridorId: string;
  topics: string[];
  maxPollRecords: 100;
  sessionTimeoutMs: 30000;
  heartbeatIntervalMs: 10000;
  autoOffsetReset: 'earliest' | 'latest';
  enableAutoCommit: false;  // Manual commit for at-least-once
}
```

---

## Part 3: Failure Containment at Scale

### 3.1 Bulkhead Pattern (Per Corridor)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         BULKHEAD ISOLATION (Corridor-Level)                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   Each corridor operates as an isolated "compartment"                                    │
│   Failure in one corridor CANNOT cascade to others                                       │
│                                                                                          │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐            │
│   │   CORRIDOR: UAE-SA  │  │   CORRIDOR: UAE-EG  │  │   CORRIDOR: UK-EU   │            │
│   │   ┌───────────────┐ │  │   ┌───────────────┐ │  │   ┌───────────────┐ │            │
│   │   │ Thread Pool   │ │  │   │ Thread Pool   │ │  │   │ Thread Pool   │ │            │
│   │   │ (50 threads)  │ │  │   │ (50 threads)  │ │  │   │ (50 threads)  │ │            │
│   │   └───────────────┘ │  │   └───────────────┘ │  │   └───────────────┘ │            │
│   │   ┌───────────────┐ │  │   ┌───────────────┐ │  │   ┌───────────────┐ │            │
│   │   │ Connection    │ │  │   │ Connection    │ │  │   │ Connection    │ │            │
│   │   │ Pool (100)    │ │  │   │ Pool (100)    │ │  │   │ Pool (100)    │ │            │
│   │   └───────────────┘ │  │   └───────────────┘ │  │   └───────────────┘ │            │
│   │   ┌───────────────┐ │  │   ┌───────────────┐ │  │   ┌───────────────┐ │            │
│   │   │ Rate Limit    │ │  │   │ Rate Limit    │ │  │   │ Rate Limit    │ │            │
│   │   │ (1000 rps)    │ │  │   │ (1000 rps)    │ │  │   │ (1000 rps)    │ │            │
│   │   └───────────────┘ │  │   └───────────────┘ │  │   └───────────────┘ │            │
│   │   ┌───────────────┐ │  │   ┌───────────────┐ │  │   ┌───────────────┐ │            │
│   │   │ Circuit       │ │  │   │ Circuit       │ │  │   │ Circuit       │ │            │
│   │   │ Breaker       │ │  │   │ Breaker       │ │  │   │ Breaker       │ │            │
│   │   └───────────────┘ │  │   └───────────────┘ │  │   └───────────────┘ │            │
│   │                     │  │                     │  │                     │            │
│   │   Status: HEALTHY   │  │   Status: DEGRADED  │  │   Status: HEALTHY   │            │
│   │   ✓ Isolated        │  │   ⚠️ Isolated       │  │   ✓ Isolated        │            │
│   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘            │
│                                                                                          │
│   UAE-EG degraded → UAE-SA and UK-EU unaffected                                         │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```


### 3.2 Circuit Breaker Configuration

```typescript
// Circuit breaker per corridor per service
interface CircuitBreakerConfig {
  corridorId: string;
  serviceName: string;
  
  // Thresholds
  failureThreshold: 5;           // Open after 5 failures
  successThreshold: 3;           // Close after 3 successes
  timeout: 30000;                // 30s before half-open
  
  // States
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  
  // Metrics window
  rollingWindowMs: 60000;        // 1 minute window
  rollingWindowBuckets: 10;      // 6-second buckets
}

// Circuit breaker implementation
class CorridorCircuitBreaker {
  private breakers: Map<string, CircuitBreaker> = new Map();
  
  async execute<T>(
    corridorId: string,
    serviceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const key = `${corridorId}:${serviceName}`;
    const breaker = this.getOrCreateBreaker(key);
    
    if (breaker.state === 'OPEN') {
      // Check if timeout elapsed
      if (Date.now() - breaker.lastFailure > breaker.timeout) {
        breaker.state = 'HALF_OPEN';
      } else {
        throw new CircuitOpenError(corridorId, serviceName);
      }
    }
    
    try {
      const result = await operation();
      this.recordSuccess(breaker);
      return result;
    } catch (error) {
      this.recordFailure(breaker);
      throw error;
    }
  }
  
  private recordFailure(breaker: CircuitBreaker): void {
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    if (breaker.failures >= breaker.failureThreshold) {
      breaker.state = 'OPEN';
      // Alert ops team
      this.alertCorridorDegraded(breaker.corridorId, breaker.serviceName);
    }
  }
}
```

### 3.3 Graceful Degradation Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         GRACEFUL DEGRADATION LEVELS                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   LEVEL 0: FULL OPERATION                                                               │
│   ─────────────────────────                                                             │
│   • All services operational                                                            │
│   • AI advisory enabled                                                                 │
│   • Real-time features active                                                           │
│                                                                                          │
│   LEVEL 1: AI DEGRADED                                                                  │
│   ─────────────────────────                                                             │
│   Trigger: AI service latency > 500ms or error rate > 5%                               │
│   Response:                                                                              │
│   • Return cached AI recommendations                                                    │
│   • Fall back to rule-based scoring                                                     │
│   • Display "Advisory temporarily simplified" banner                                    │
│                                                                                          │
│   LEVEL 2: CORRIDOR DEGRADED                                                            │
│   ─────────────────────────                                                             │
│   Trigger: Corridor DB latency > 1s or error rate > 10%                                │
│   Response:                                                                              │
│   • Read from replicas only                                                             │
│   • Queue writes for later                                                              │
│   • Disable non-essential features                                                      │
│   • Display "Some features temporarily unavailable" banner                              │
│                                                                                          │
│   LEVEL 3: CORRIDOR ISOLATED                                                            │
│   ─────────────────────────                                                             │
│   Trigger: Corridor completely unreachable                                              │
│   Response:                                                                              │
│   • Return cached data only                                                             │
│   • Disable all writes                                                                  │
│   • Display "Corridor temporarily offline" banner                                       │
│   • Redirect new users to healthy corridors if applicable                              │
│                                                                                          │
│   LEVEL 4: EMERGENCY MODE                                                               │
│   ─────────────────────────                                                             │
│   Trigger: FF_EMERGENCY_DISABLE_ALL = true                                              │
│   Response:                                                                              │
│   • All AI features disabled                                                            │
│   • Static content only                                                                 │
│   • Display maintenance page                                                            │
│   • Ops team alerted immediately                                                        │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```


### 3.4 Blast Radius Limitation

```typescript
// Blast radius controls
interface BlastRadiusConfig {
  // Maximum percentage of users affected by any single failure
  maxUserImpactPercent: 10;
  
  // Maximum corridors affected by shared dependency failure
  maxCorridorImpact: 3;
  
  // Canary deployment percentage
  canaryPercent: 5;
  
  // Rollback triggers
  rollbackTriggers: {
    errorRateThreshold: 5;        // 5% error rate
    latencyP99Threshold: 2000;    // 2s P99
    userComplaintThreshold: 10;   // 10 complaints in 5 min
  };
}

// Deployment strategy for blast radius control
interface DeploymentStrategy {
  // Phase 1: Canary (5% of one corridor)
  canary: {
    corridorId: string;
    percentage: 5;
    duration: '30m';
    successCriteria: {
      errorRate: '<1%';
      latencyP99: '<500ms';
    };
  };
  
  // Phase 2: Single corridor (100% of one corridor)
  singleCorridor: {
    corridorId: string;
    percentage: 100;
    duration: '2h';
    successCriteria: {
      errorRate: '<2%';
      latencyP99: '<750ms';
    };
  };
  
  // Phase 3: Regional rollout (all corridors in region)
  regional: {
    region: string;
    percentage: 100;
    duration: '4h';
  };
  
  // Phase 4: Global rollout
  global: {
    percentage: 100;
    duration: '24h';
  };
}

// Automatic rollback
class AutoRollback {
  async checkAndRollback(deployment: Deployment): Promise<void> {
    const metrics = await this.getDeploymentMetrics(deployment);
    
    if (metrics.errorRate > ROLLBACK_TRIGGERS.errorRateThreshold) {
      await this.rollback(deployment, 'ERROR_RATE_EXCEEDED');
    }
    
    if (metrics.latencyP99 > ROLLBACK_TRIGGERS.latencyP99Threshold) {
      await this.rollback(deployment, 'LATENCY_EXCEEDED');
    }
  }
  
  private async rollback(deployment: Deployment, reason: string): Promise<void> {
    // 1. Revert to previous version
    await this.revertDeployment(deployment);
    
    // 2. Log to audit
    await this.auditLog.write({
      action: 'AUTO_ROLLBACK',
      deployment: deployment.id,
      reason,
      timestamp: new Date(),
    });
    
    // 3. Alert ops
    await this.alertOps({
      type: 'AUTO_ROLLBACK',
      deployment: deployment.id,
      reason,
    });
  }
}
```

---

## Part 4: Deterministic AI at Scale

### 4.1 Model Versioning Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         DETERMINISTIC AI MODEL MANAGEMENT                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   PRINCIPLE: Same input → Same output (always)                                          │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         MODEL VERSION REGISTRY                                   │   │
│   │                                                                                   │   │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│   │  │  Model: trust-scorer                                                     │    │   │
│   │  │  ├── v1.0.0 (DEPRECATED)                                                │    │   │
│   │  │  ├── v1.1.0 (ACTIVE - 95% traffic)                                      │    │   │
│   │  │  ├── v1.2.0 (CANARY - 5% traffic)                                       │    │   │
│   │  │  └── v1.3.0 (STAGED - 0% traffic)                                       │    │   │
│   │  │                                                                          │    │   │
│   │  │  Each version includes:                                                  │    │   │
│   │  │  • Model weights (immutable, hash-verified)                             │    │   │
│   │  │  • Feature schema (versioned)                                           │    │   │
│   │  │  • Inference config (deterministic seed)                                │    │   │
│   │  │  • Test vectors (golden outputs)                                        │    │   │
│   │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                   │   │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│   │  │  Model: intent-classifier                                                │    │   │
│   │  │  ├── v2.0.0 (ACTIVE - 100% traffic)                                     │    │   │
│   │  │  └── v2.1.0 (STAGED - 0% traffic)                                       │    │   │
│   │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                   │   │
│   │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│   │  │  Model: risk-assessor                                                    │    │   │
│   │  │  ├── v1.0.0 (ACTIVE - 100% traffic)                                     │    │   │
│   │  │  └── v1.1.0 (CANARY - 5% traffic, UAE-SA only)                          │    │   │
│   │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```


### 4.2 Feature Store Sharding

```typescript
// Feature store sharded by corridor
interface FeatureStoreConfig {
  // Per-corridor feature stores
  corridorStores: {
    [corridorId: string]: {
      redisCluster: string;
      featureGroups: FeatureGroup[];
      ttl: number;
    };
  };
  
  // Global features (shared across corridors)
  globalStore: {
    redisCluster: string;
    featureGroups: ['corridor_metadata', 'model_configs'];
    ttl: 3600;
  };
}

interface FeatureGroup {
  name: string;
  features: string[];
  updateFrequency: 'REALTIME' | 'HOURLY' | 'DAILY';
  source: 'COMPUTED' | 'INGESTED';
}

// Feature retrieval with corridor isolation
class ShardedFeatureStore {
  async getFeatures(
    userId: string,
    corridorId: string,
    featureNames: string[]
  ): Promise<FeatureVector> {
    const store = this.getCorridorStore(corridorId);
    
    // Build feature vector deterministically
    const features: FeatureVector = {};
    
    for (const name of featureNames.sort()) {  // Sorted for determinism
      const key = `${corridorId}:${userId}:${name}`;
      features[name] = await store.get(key);
    }
    
    return features;
  }
  
  // Batch feature computation (offline)
  async computeFeatures(
    corridorId: string,
    userIds: string[],
    featureGroup: string
  ): Promise<void> {
    const store = this.getCorridorStore(corridorId);
    const computedAt = new Date().toISOString();
    
    for (const userId of userIds) {
      const features = await this.computeUserFeatures(userId, featureGroup);
      
      // Store with version for determinism
      await store.set(`${corridorId}:${userId}:${featureGroup}`, {
        features,
        computedAt,
        version: FEATURE_SCHEMA_VERSION,
      });
    }
  }
}
```

### 4.3 Inference Caching

```typescript
// Deterministic inference cache
interface InferenceCacheConfig {
  // Cache key includes all inputs for determinism
  keyStrategy: 'HASH_ALL_INPUTS';
  
  // TTL based on model type
  ttlByModel: {
    'trust-scorer': 300;        // 5 min (user behavior changes)
    'intent-classifier': 60;    // 1 min (context-dependent)
    'risk-assessor': 600;       // 10 min (slower changing)
    'decision-recommender': 30; // 30 sec (real-time)
  };
  
  // Cache per corridor
  corridorIsolation: true;
}

class DeterministicInferenceCache {
  // Generate deterministic cache key
  private buildCacheKey(
    modelName: string,
    modelVersion: string,
    corridorId: string,
    input: any
  ): string {
    // Sort input keys for determinism
    const sortedInput = this.sortObjectKeys(input);
    const inputHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(sortedInput))
      .digest('hex');
    
    return `inference:${corridorId}:${modelName}:${modelVersion}:${inputHash}`;
  }
  
  async getOrCompute(
    modelName: string,
    modelVersion: string,
    corridorId: string,
    input: any,
    computeFn: () => Promise<any>
  ): Promise<InferenceResult> {
    const cacheKey = this.buildCacheKey(modelName, modelVersion, corridorId, input);
    
    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return {
        result: JSON.parse(cached),
        cached: true,
        cacheKey,
      };
    }
    
    // Compute with deterministic seed
    const result = await this.computeWithSeed(computeFn, modelVersion);
    
    // Cache result
    const ttl = this.config.ttlByModel[modelName] || 60;
    await this.redis.setex(cacheKey, ttl, JSON.stringify(result));
    
    return {
      result,
      cached: false,
      cacheKey,
    };
  }
  
  // Ensure deterministic computation
  private async computeWithSeed(
    computeFn: () => Promise<any>,
    seed: string
  ): Promise<any> {
    // Set deterministic seed based on model version
    this.setRandomSeed(seed);
    return computeFn();
  }
}
```


### 4.4 Determinism Guarantees

```typescript
// Determinism verification
interface DeterminismConfig {
  // All models must pass determinism tests
  testVectors: {
    modelName: string;
    inputs: any[];
    expectedOutputs: any[];
  }[];
  
  // Verification runs on every deployment
  verifyOnDeploy: true;
  
  // Random seed strategy
  seedStrategy: 'MODEL_VERSION_HASH';
}

// Determinism test suite
class DeterminismVerifier {
  async verifyModel(modelName: string, version: string): Promise<boolean> {
    const testVectors = await this.loadTestVectors(modelName, version);
    
    for (const vector of testVectors) {
      // Run inference 3 times
      const results = await Promise.all([
        this.runInference(modelName, version, vector.input),
        this.runInference(modelName, version, vector.input),
        this.runInference(modelName, version, vector.input),
      ]);
      
      // All results must be identical
      if (!this.allEqual(results)) {
        throw new DeterminismError(
          `Model ${modelName}@${version} produced non-deterministic output`
        );
      }
      
      // Must match expected output
      if (!this.deepEqual(results[0], vector.expectedOutput)) {
        throw new DeterminismError(
          `Model ${modelName}@${version} output doesn't match golden vector`
        );
      }
    }
    
    return true;
  }
  
  // Audit log for determinism verification
  async logVerification(
    modelName: string,
    version: string,
    passed: boolean
  ): Promise<void> {
    await this.auditLog.write({
      action: 'DETERMINISM_VERIFICATION',
      modelName,
      version,
      passed,
      timestamp: new Date(),
      verificationHash: this.computeVerificationHash(modelName, version),
    });
  }
}

// Feature flag for AI determinism mode
const AI_DETERMINISM_CONFIG = {
  // Force deterministic mode (no randomness)
  FORCE_DETERMINISTIC: true,
  
  // Seed all random operations
  GLOBAL_SEED: 'platform-v1',
  
  // Disable any non-deterministic features
  DISABLE_SAMPLING: true,
  DISABLE_DROPOUT: true,
  
  // Log all inference for audit
  LOG_ALL_INFERENCE: true,
};
```

---

## Part 5: Monitoring at Scale

### 5.1 Metrics Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         MONITORING HIERARCHY                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   LEVEL 1: GLOBAL METRICS                                                               │
│   ─────────────────────────                                                             │
│   • Total requests/sec (all corridors)                                                  │
│   • Global error rate                                                                   │
│   • Platform availability                                                               │
│   • Active users (global)                                                               │
│                                                                                          │
│   LEVEL 2: REGIONAL METRICS                                                             │
│   ─────────────────────────                                                             │
│   • Requests/sec per region                                                             │
│   • Regional latency P50/P95/P99                                                        │
│   • Regional error rate                                                                 │
│   • Cross-region replication lag                                                        │
│                                                                                          │
│   LEVEL 3: CORRIDOR METRICS                                                             │
│   ─────────────────────────                                                             │
│   • Requests/sec per corridor                                                           │
│   • Corridor-specific error rate                                                        │
│   • Active users per corridor                                                           │
│   • Corridor health score                                                               │
│   • Circuit breaker state                                                               │
│                                                                                          │
│   LEVEL 4: SERVICE METRICS                                                              │
│   ─────────────────────────                                                             │
│   • Service latency (per corridor)                                                      │
│   • Service error rate (per corridor)                                                   │
│   • Pod health                                                                          │
│   • Resource utilization                                                                │
│                                                                                          │
│   LEVEL 5: AI METRICS                                                                   │
│   ─────────────────────────                                                             │
│   • Inference latency                                                                   │
│   • Cache hit rate                                                                      │
│   • Model version distribution                                                          │
│   • Determinism verification status                                                     │
│   • Feature store freshness                                                             │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```


### 5.2 Alerting Thresholds

```typescript
// Alert configuration per level
interface AlertConfig {
  global: {
    errorRate: { warning: 1, critical: 5 };      // %
    latencyP99: { warning: 500, critical: 1000 }; // ms
    availability: { warning: 99.9, critical: 99 }; // %
  };
  
  corridor: {
    errorRate: { warning: 2, critical: 10 };
    latencyP99: { warning: 750, critical: 2000 };
    circuitOpen: { critical: true };
  };
  
  ai: {
    inferenceLatency: { warning: 100, critical: 500 }; // ms
    cacheHitRate: { warning: 80, critical: 50 };       // %
    determinismFailure: { critical: true };
  };
}

// Alert routing
const ALERT_ROUTING = {
  CRITICAL: ['pagerduty', 'slack-critical', 'sms'],
  WARNING: ['slack-warnings', 'email'],
  INFO: ['slack-info'],
};
```

---

## Summary

| Component | Strategy | Corridor Isolation |
|-----------|----------|-------------------|
| Database | Shard per corridor + user partitioning | ✅ Full |
| Cache L1 | Local per pod | ✅ Full |
| Cache L2 | Redis cluster per corridor | ✅ Full |
| Cache L3 | CDN edge (global) | ⚠️ Shared |
| Queues | Kafka topics per corridor | ✅ Full |
| Circuit Breakers | Per corridor per service | ✅ Full |
| AI Models | Versioned, deterministic | ✅ Full |
| Feature Store | Sharded per corridor | ✅ Full |
| Inference Cache | Per corridor, hash-keyed | ✅ Full |

**Key Principles Preserved:**
1. Read-heavy optimization (90%+ reads served from cache)
2. Deterministic AI (same input → same output, always)
3. Corridor isolation (failure in one cannot cascade)
4. Human-in-the-loop (no auto-execution)
5. Feature flags (all features toggleable)
6. Kill switches (emergency disable at any level)

---

## Migration Path

### Phase 1: Foundation (Months 1-3)
- Deploy corridor-sharded databases
- Implement L1/L2 cache layers
- Set up per-corridor Kafka topics

### Phase 2: Scale (Months 4-6)
- Add regional clusters
- Implement circuit breakers
- Deploy feature store sharding

### Phase 3: Optimization (Months 7-9)
- Tune cache TTLs based on traffic
- Optimize partition strategies
- Implement inference caching

### Phase 4: Hardening (Months 10-12)
- Full blast radius testing
- Chaos engineering exercises
- Load testing at 10M+ scale

---

*Document Version: 1.0*
*Last Updated: December 2025*
*Status: DESIGN COMPLETE*
