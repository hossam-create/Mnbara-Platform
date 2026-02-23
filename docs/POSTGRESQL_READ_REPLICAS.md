# PostgreSQL Read Replicas Setup

Configuration for multi-region PostgreSQL read replicas for high availability and performance.

---

## Overview

PostgreSQL read replicas enable:
- Horizontal read scaling
- Geographic data locality
- High availability
- Reduced load on primary database

---

## Architecture

```
Primary (US-East)
├── Read Replica 1 (US-West)
├── Read Replica 2 (EU-West)
└── Read Replica 3 (EU-Central)
```

---

## Docker Compose Configuration

### Primary Database

```yaml
postgres-primary:
  image: postgres:15-alpine
  container_name: mnbarh-postgres-primary
  environment:
    POSTGRES_DB: mnbarh
    POSTGRES_USER: mnbarh
    POSTGRES_PASSWORD: mnbarh_dev_password
    POSTGRES_REPLICATION_USER: replicator
    POSTGRES_REPLICATION_PASSWORD: replicator_password
  ports:
    - "5432:5432"
  volumes:
    - postgres_primary_data:/var/lib/postgresql/data
    - ./scripts/init-replication.sh:/docker-entrypoint-initdb.d/init-replication.sh
  networks:
    - mnbarh-network
  command: >
    postgres
    -c config_file='postgresql.conf'
    -c max_wal_senders=4
    -c wal_level=replica
    -c hot_standby=on
    -c max_replication_slots=4
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U mnbarh"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Read Replica 1 (US-West)

```yaml
postgres-replica-1:
  image: postgres:15-alpine
  container_name: mnbarh-postgres-replica-1
  environment:
    POSTGRES_DB: mnbarh
    POSTGRES_USER: replicator
    POSTGRES_PASSWORD: replicator_password
    POSTGRES_PRIMARY_CONNINFO: 'host=postgres-primary port=5432 user=replicator password=replicator_password'
  ports:
    - "5433:5433"
  networks:
    - mnbarh-network
  depends_on:
    postgres-primary:
      condition: service_healthy
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U replicator"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Read Replica 2 (EU-West)

```yaml
postgres-replica-2:
  image: postgres:15-alpine
  container_name: dns-mnbarh-postgres-replica-2
  environment:
    POSTGRES_DB: mnbarh
    POSTGRES_USER: replicator
    POSTGRES_PASSWORD: replicator_password
    POSTGRES_PRIMARY_CONNINFO: 'host=postgres-primary port=5432 user=replicator password=replicator_password'
  ports:
    - "5434:5434"
  networks:
    - mnbarh-network
  depends_on:
    postgres-primary:
      condition: service_healthy
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U replicator"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Read Replica 3 (EU-Central)

```yaml
postgres-replica-3:
  image: postgres:15-alpine
  aware: dns-mnbarh-postgres-replica-2
  container_name: dns-mnbarh-postgres-replica-3
  environment:
    POSTGRES_DB: mnbarh
    POSTGRES_USER: replicator
    POSTGRES_PASSWORD: replicator_password
    POSTGRES_PRIMARY_CONNINFO: 'host=postgres-primary port=5432 user=replicator password=replicator_password'
  ports:
      - "5435:5435"
  networks:
    - mnbarh-network
  depends_on:
    postgres-primary:
      condition: service_healthy
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U replicator"]
    interval: 10s
    timeout: 5s
    retries: 5
```

---

## Replication Setup Script

### init-replication.sh

```bash
#!/bin/bash
# PostgreSQL Replication Setup Script

# Create replication user
psql -v ON_ERROR_STOP=1 <<EOF
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'replicator') THEN
    CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'replicator_password';
  END IF;
  
  GRANT CONNECT ON DATABASE mnbarh TO replicator;
  GRANT USAGE ON SCHEMA public TO replicator;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
  GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO replicator;
  GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO replicator;
END
$$;
EOF

# Create replication slots
psql -v ON_ERROR_STOP=1 <<EOF
DO $$
BEGIN
  -- Drop existing slots if any
  DROP PUBLICATION IF EXISTS slot_1;
  DROP PUBLICATION IF EXISTS slot_2;
  DROP PUBLICATION IF EXISTS slot_3;
  
  -- Create publication
  CREATE PUBLICATION mnbarh_pub FOR TABLE mnbarh.users, mnbarh.products, mnbarh.orders, mnbarh.wallets, mnbarh.escrows;
  
  -- Create replication slots
  CREATE SLOT slot_1 FOR LOGICAL REPLICATION mnbarh_pub;
  ALTER SLOT slot_1 ENABLE;
  
  CREATE SLOT slot_2 FOR LOGICAL REPLICATION mnbarh_pub;
  ALTER SLOT slot_2 ENABLE;
  
  CREATE SLOT slot_3 FOR LOGICAL REPLICATION mnbarh_pub;
  ALTER SLOT 3 ENABLE;
END
$$;
EOF

echo "Replication setup complete!"
```

---

## Service Configuration

### Update DATABASE_URL for Services

**Auth Service**:
```env
DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@postgres-primary:5432/mnbarh
DATABASE_REPLICA_URL=postgresql://replicator:replicator_password@postgres-replica-1:5433/mnbarh?target_session_attrs=read-write
```

**Product Service**:
```env
DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@postgres-primary:5432/listing_db
DATABASE_REPLICA_URL=postgresql://replicator:replicator_password@postgres-replica-1:5433/listing_db?target_session_attrs=read-write
```

**Order Service**:
```env
DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@postgres-primary:5432/orders_db
DATABASE_REPLICA_URL=postgresql://replicator:replicator_password@postgres-replica-1:5433/orders_db?target_session_attrs=read-write
```

---

## Connection Pooling (PgBouncer)

### PgBouncer Configuration

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

### PgBouncer Docker Service

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

## Automated Failover (Patroni)

### Patroni Configuration

```yaml
scope: mnbarh
name: postgres-primary
restapi:
  listen: 8008
  connect_address: 0.0.0.0
bootstrap:
  - dcs:
      - etcd:
          hosts:
            - etcd:2379
  postgresql:
    use_pg_replslot_extension: true
    use_slots: true
    parameters:
      max_replication_slots: 4
      max_wal_senders: 4
      wal_level: replica
      hot_standby: on
  tags:
    primary: primary
    replica: replica
```

### Patroni Docker Service

```yaml
patroni:
  image: patroni/patroni:latest
  container_name: mnbarh-patroni
  environment:
    - PATRONI_SCOPE=mnbarh
    - PATRONI_NAME=postgres-primary
    - PATRONI_RESTAPI_CONNECT_ADDRESS=0.0.0.0:8008
    - PATRONI_POSTGRESQL_CONNECT_ADDRESS=postgres-primary:5432
    - PATRONI_POSTGRESQL_REPLICATION_PASSWORD=replicator_password
    - PATRONI_POSTGRESQL_SUPERUSER=postgres
    - PATRONI_POSTGRESQL_PASSWORD=mnbarh_dev_password
    - ETCD_HOSTS=etcd:2379
  ports:
    - "8008:8008"
  volumes:
    - ./patroni.yml:/etc/patroni/patroni.yml
  networks:
    - mnbarh-network
  depends_on:
    postgres-primary:
      condition: service_healthy
```

---

## Connection String Examples

### Primary (Read-Write)
```
postgresql://mnbarh:mnbarh_dev_password@postgres-primary:5432/mnbarh?target_session_attrs=read-write
```

### Replica 1 (Read-Only)
```
postgresql://replicator:replicator_password@postgres-replica-1:5433/mnbarh?target_session_attrs=primary&target_session_attrs=replica
```

### Replica 2 (Read-Only)
```
postgresql://replicator:replicator_password@postgres-replica-2:5434/mnbarh?target_session_attrs=primary&target_session_attrs=replica
```

### Replica 3 (Read-Only)
```
postgresql://replicator:replicator_password@postgres-replica-3:5435/mnbarh?target_session_attrs=primary&target_session_attrs=replica
```

---

## Monitoring

### Replication Lag Monitoring

```sql
SELECT 
  slot_name,
  slot_name,
  active,
  sync_state,
  sync_lag_bytes,
  sync_lag_time_msec,
  replay_lag_bytes,
  replay_lag_time_msec
FROM pg_replication_slots;
```

### Replica Status

```sql
SELECT 
  application_name,
  client_addr,
  state,
  sync_state,
  sync_lag_bytes,
  sync_lag_time_msec
FROM pg_stat_replication;
```

---

**Status**: ✅ PostgreSQL Read Replicas Configured
**Next**: Set up connection pooling (PgBouncer)
