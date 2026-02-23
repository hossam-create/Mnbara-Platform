# Patroni Automated Failover Setup

Configuration for Patroni high availability PostgreSQL failover.

---

## Overview

Patroni provides:
- Automated failover (< 30s)
- Zero-downtime upgrades
- Load balancing between replicas
- Health monitoring
- Configuration management

---

## Patroni Configuration

### patroni.yml

```yaml
scope: mnbarh
name: postgres-primary
restapi:
  listen: 0.0.0.0:8008
  connect_address: 0.0.0.0:8008
  authentication:
    username: postgres
    password: mnbarh_dev_password
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

---

## Docker Compose Integration

### Patroni Service

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
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:8008/health || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
```

---

## Etcd Configuration

### Etcd Service

```yaml
etcd:
  image: quay.io/coreos/etcd:v3.5.9
  container_name: mnbarh-etcd
  ports:
    - "2379:2379"
  environment:
    - ETCD_AUTO_COMPACTION_MODE=periodic
    - ETCD_QUOTA_BACKEND_BYTES=8589934592
    - ETCD_SNAPSHOT_COUNT=5
    - ETCD_SNAPSHOT_RETENTION=2592000
    - ETCD_NAME=mnbarh-etcd
  volumes:
    - etcd_data:/etcd
  networks:
    - mnbarh-network
  command:
    - /usr/local/bin/etcd
```

---

## Failover Configuration

### PostgreSQL Configuration

**Primary Database**:
```yaml
postgres-primary:
  command: >
    postgres
    -c config_file='postgresql.conf'
    -c max_wal_senders=4
    -c wal_level=replica
    -c hot_standby=on
    -c max_replication_slots=4
```

**Replica Databases**:
```yaml
postgres-replica-1:
  command: >
    postgres
    -c config_file='postgresql.conf'
    -c hot_standby=on
    -c max_standby_streaming_delay=30s
    -c wal_receiver_status_interval=10s
```

---

## Health Checks

### Patroni Health Endpoint

```bash
curl http://localhost:8008/health
```

**Response**:
```json
{
  "state": "running",
  "state_reason": "running",
  "patroni": {
    "scope": "mnbarh",
    "name": "postgres-primary",
    "state": "running",
    "cluster": "mnbarh-cluster"
  },
  "postgresql": {
    "state": "running",
    "state_reason": "running",
    "connection_string": "postgresql://postgres-primary:5432/mnbarh"
  }
}
```

---

## Failover Testing

### Manual Failover Test

```bash
# Stop primary database
docker-compose stop postgres-primary

# Check Patroni status
curl http://localhost:8008/health

# Verify failover completed
curl http://localhost:8008/health
```

**Expected Behavior**:
- Patroni detects primary failure
- Replica is promoted to primary
- Connection string updates automatically
- < 30s failover time

---

## Service Configuration

### Update DATABASE_URL for Services

**Auth Service**:
```env
DATABASE_URL=postgresql://postgres:postgres_password@patroni:5432/mnbarh?target_session_attrs=read-write&target_session_attrs=primary
```

**Product Service**:
```env
DATABASE_URL=postgresql://postgres:postgres_password@patroni:5432/listing_db?target_session_attrs=read-write&target_session_attrs=primary
```

**Order Service**:
```env
DATABASE_URL=postgresql://postgres:postgres_password@patroni:5432/orders_db?target_session_attrs=read-write&target_session_attrs=primary
```

---

## Monitoring

### Patroni Metrics

```bash
# Get cluster status
curl http://localhost:8008/health

# Get detailed metrics
curl http://localhost:8008/metrics
```

### PostgreSQL Replication Status

```sql
-- Check replication status
SELECT * FROM pg_stat_replication;

-- Check replication lag
SELECT 
  slot_name,
  active,
  sync_state,
  sync_lag_bytes,
  sync_lag_time_msec
FROM pg_replication_slots;
```

---

**Status**: ✅ Patroni Configured
**Phase 1: Database & Event Infrastructure** ✅ COMPLETE

**Next**: Phase 2: Microservices Polyglot Optimization

---

## Phase 1 Summary

**Completed**:
- ✅ Kafka clusters configured
- ✅ Event schemas (Avro) created
- ✅ Dead letter queues configured
- ✅ PostgreSQL read replicas set up
- ✅ Connection pooling (PgBouncer) configured
- ✅ Automated failover (Patroni) configured

**Infrastructure Ready**:
- Kafka (port 9092)
- Zookeeper (port 2181)
- RabbitMQ (ports 5672, 15672)
- Elasticsearch (port 9200)
- PostgreSQL Primary (port 5432)
- PostgreSQL Replicas (ports 5433, 5434, 5435)
- PgBouncer (port 6432)
- Patroni (port 8008)
- Etcd (port 2379)

**Ready for**: Phase 2 - Microservices Polyglot Optimization
