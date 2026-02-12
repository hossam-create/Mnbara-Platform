# Database Migrations

This directory contains all database migrations for the Mnbara Platform.

## Migration Files

| Number | Name | Description |
|--------|------|-------------|
| 001 | `001_create_users.sql` | Creates users table and authentication-related tables (refresh tokens, social accounts, addresses) |
| 002 | `002_create_orders.sql` | Creates orders table with items, status history, cancellations, and returns |
| 003 | `003_create_payments.sql` | Creates payments table with refunds, escrow transactions, and payment methods |
| 004 | `004_create_deliveries.sql` | Creates deliveries table with routes, stops, events, and vehicle management |

## Migration Naming Convention

Migrations follow the pattern: `{NUMBER}_{NAME}.sql`

- **Number**: 3-digit padded number (e.g., `001`, `002`, `010`)
- **Name**: Descriptive name in lowercase with underscores

## Writing a New Migration

Each migration file must contain two sections:

```sql
-- UP Migration
-- ============
-- Add your CREATE TABLE, ALTER TABLE, etc. statements here
-- These are executed when running migrations forward

-- DOWN Migration
-- =============
-- Add DROP TABLE, ALTER TABLE to undo changes
-- These are executed when rolling back
```

### Example Migration

```sql
-- Migration: 005_create_products.sql
-- Description: Creates products table
-- Created: 2024-01-15

-- UP Migration
-- ============
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DOWN Migration
-- =============
DROP TABLE IF EXISTS products CASCADE;
```

## Best Practices

1. **Always use `IF NOT EXISTS` or `DROP ... CASCADE`** to make migrations idempotent
2. **Keep migrations small and focused** - one feature per migration
3. **Test migrations locally** before committing
4. **Never modify existing migrations** - create new ones instead
5. **Include rollback SQL** for every forward migration
6. **Add indexes** for commonly queried columns
7. **Use proper constraints** (CHECK, FOREIGN KEY, UNIQUE)
8. **Include timestamps** (created_at, updated_at) on all tables

## Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Run with dry-run to preview
npm run migrate:dry-run

# Run specific number of migrations
npm run migrate -- --step=1

# Migrate to specific migration
npm run migrate -- --to=003

# Rollback last migration
npm run migrate:down -- --step=1

# Rollback all migrations
npm run migrate:down -- --all

# Check migration status
npm run migrate -- --status
```

## Migration Table

The framework tracks applied migrations in the `schema_migrations` table:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique migration ID |
| number | VARCHAR(10) | Migration number (e.g., '001') |
| name | VARCHAR(255) | Migration name |
| filename | VARCHAR(255) | Original filename |
| up_sql | TEXT | Full UP migration SQL |
| down_sql | TEXT | Full DOWN migration SQL |
| checksum | VARCHAR(64) | SHA-256 hash of content |
| applied_at | TIMESTAMP | When migration was applied |
| execution_time_ms | INTEGER | How long migration took |
| success | BOOLEAN | Whether migration succeeded |
| error_message | TEXT | Error if failed |

## Transactional Migrations

By default, migrations run in a transaction. If any statement fails:
- The entire migration is rolled back
- The failure is recorded in `schema_migrations`
- No partial changes are applied

To disable transactions for a specific statement, you can use `CREATE INDEX ... CONCURRENTLY` in PostgreSQL.
