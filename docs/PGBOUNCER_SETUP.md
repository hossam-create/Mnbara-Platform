# PgBouncer Connection Pooling Setup

Configuration for PgBouncer connection pooling for high-performance database access.

---

## Overview

PgBouncer is a connection pooler for PostgreSQL that improves performance by:
- Reducing connection overhead
- Limiting maximum connections
- Pooling connections for reuse
- Load balancing across replicas

---

## Installation

```bash
# Ubuntu/Debian
sudo apt-get install pgbouncer

# macOS
brew install pgbouncer

# Docker
docker run -d --name pgbouncer \
  -p 6432:6432 \
  -e DATABASES_HOST=postgres-primary \
  -e DATABASES_PORT=5432 \
  -e DATABASES=mnbarh \
  -e POOLS=10 \
  - pgbouncer/pgbouncer:latest
```

---

## Configuration File

### pgbouncer.ini

```ini
[databases]
mnbarh = host=postgres-primary port=5432 dbname=mnbarh
mnbarh_replica_1 = host=postgres-replica-1 port=5433 dbname=mnbarh
mnbarh_replica_2 = host=postgres-replica-2 port=5434 dbname=mnbarh
mnbarh_replica_3 = host=postgres-replica-3 port=5435 dbname=mnbarh

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 2
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600
client_idle_timeout = 60
query_timeout = 90
application_name = mnbarh-platform
```

---

## Docker Compose Integration

### PgBouncer Service

```yaml
pgbouncer:
  image: pgbouncer/pgbouncer:latest
  container_name: mnbarh-pgbouncer
  ports:
    - "6432:6432"
  environment:
    - DATABASES_HOST=postgres-primary
    - DATABASES_PORT=5432
    - DATABASES=mnbarh
    - POOLS=10
    - MAX_CLIENT_CONN=100
    - DEFAULT_POOL_SIZE=25
    - MIN_POOL_SIZE=10
  volumes:
    - ./pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini
  networks:
    - mnbarh-network
  depends_on:
    postgres-primary:
      condition: service_healthy
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U pgbouncer || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
```

---

## Service Configuration

### Update DATABASE_URL for Services

**Auth Service**:
```env
DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@pgbouncer:6432/mnbarh?target_session_attrs=read-write
```

**Product Service**:
```env
DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@pgbouncer:6432/listing_db?target_session_attrs=read-write
```

**Order Service**:
```env
DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@pgbouncer:6432/orders_db?target_session_attrs=read-write
```

**Wallet Service**:
```env
DATABASE_URL=postgresql://mnbarh:mnbarh::@pgbouncer:6432/wallet_db?target_session_attrs=read-write
```

---

## Connection Pooling Best Practices

### Prisma Configuration

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection pool settings
datasource db {
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_DIRECT")
  shadowDatabaseUrl = env("DATABASE_URL_SHADOW")
  connection_limit = 10
  pool_timeout = 10
}

generator client {
  provider = "prisma-client-js"
}
```

### Node.js Connection Pool

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'pgbouncer',
  port: 6432,
  database: 'mnbarh',
  user: 'mnbarh',
  password: 'mnbarh_dev_password',
  max: 20, // Maximum pool size
  min: 2,   // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use pool for queries
const result = await pool.query('SELECT * FROM products LIMIT 10');
```

---

## Monitoring

### PgBouncer Statistics

```sql
SHOW POOLS;
SHOW CLIENTS;
SHOW SERVERS;
SHOW STATS;
SHOW DATABASES;
SHOW LISTS;
```

### Health Check Endpoint

```typescript
app.get('/pgbouncer/health', async (req, res) => {
  try {
    const result = await pool.query('SHOW STATS;');
    res.json({
      status: 'healthy',
      stats: result.rows
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'PgBouncer unavailable'
    });
  }
});
```

---

**Status**: ✅ PgBouncer Configured
**Next**: Set up automated failover (Patroni)
