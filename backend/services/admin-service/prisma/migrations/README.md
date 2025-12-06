# Database Migrations

This directory contains SQL migrations for the admin-service database schema.

## Migrations

### 001_admin_tracking_tables.sql
Creates all tracking tables for admin dashboard:
- `user_sessions` - User login/logout tracking
- `user_activity_logs` - User action logging
- `kyc_verifications` - KYC verification records
- `auction_events` - Real-time auction tracking
- `traveler_flights` - Flight tracking
- `escrow_transactions` - Escrow payment management
- `system_metrics` - Performance metrics

Also adds tracking fields to `users` table.

## Running Migrations

### Using psql
```bash
# Apply migration
psql -U crowdship -d mnbara_db -f migrations/001_admin_tracking_tables.sql

# Rollback migration
psql -U crowdship -d mnbara_db -f migrations/001_admin_tracking_tables_rollback.sql
```

### Using Docker
```bash
# Apply migration
docker exec -i postgres_container psql -U crowdship -d mnbara_db < migrations/001_admin_tracking_tables.sql

# Rollback migration
docker exec -i postgres_container psql -U crowdship -d mnbara_db < migrations/001_admin_tracking_tables_rollback.sql
```

## Migration Order

Migrations should be run in numerical order:
1. `001_admin_tracking_tables.sql`
2. (future migrations...)

## Rollback

Each migration has a corresponding rollback file with `_rollback.sql` suffix.
Always test rollbacks before applying to production.
