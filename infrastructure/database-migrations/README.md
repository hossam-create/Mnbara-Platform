# Mnbara Platform Database Migration Framework

A centralized database migration system for all Mnbara Platform microservices.

## Features

- **Sequential Migrations**: Run migrations in order with numbered files
- **Migration Tracking**: Tracks all applied migrations in `schema_migrations` table
- **Rollback Support**: Full up/down migration support with preview
- **Dry-Run Mode**: Preview migrations without making changes
- **Seed Data**: Populate reference data (countries, currencies, categories)
- **Environment Support**: Configure for dev, staging, and production
- **Distributed Locking**: Prevents concurrent migration runs
- **TypeScript Support**: Full type safety for the migration runner

## Quick Start

### 1. Install Dependencies

```bash
cd infrastructure/database-migrations
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `NODE_ENV` - Environment (development, staging, production)

### 3. Run Migrations

```bash
# Run all pending migrations
npm run migrate

# Preview without applying
npm run migrate:dry-run

# Status check
npm run migrate -- --status
```

### 4. Run Seeds

```bash
# Seed all categories
npm run seed:all

# Seed specific category
npm run seed:countries
npm run seed:currencies
npm run seed:categories
```

## Project Structure

```
infrastructure/database-migrations/
├── migrations/                    # Migration files
│   ├── 001_create_users.sql
│   ├── 002_create_orders.sql
│   ├── 003_create_payments.sql
│   ├── 004_create_deliveries.sql
│   └── README.md
├── scripts/
│   ├── migrate.ts               # Migration runner
│   ├── seed.ts                  # Seeder runner
│   └── rollback.ts              # Rollback runner
├── config/
│   ├── migrations.json         # Migration configuration
│   └── schemas/
│       ├── users.schema.sql
│       ├── orders.schema.sql
│       ├── payments.schema.sql
│       └── deliveries.schema.sql
├── seeds/                       # Seed data files
│   ├── countries/
│   ├── currencies/
│   ├── categories/
│   └── payment_methods/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Configuration

Edit `config/migrations.json` to configure:

```json
{
  "environments": {
    "development": {
      "database": {
        "host": "localhost",
        "port": 5432,
        "name": "mnbara_development"
      },
      "options": {
        "migrationsTable": "schema_migrations",
        "transactional": true,
        "verbose": true
      }
    }
  }
}
```

## Usage

### Migration Commands

```bash
# Run all pending migrations
npm run migrate

# Run specific number of migrations
npm run migrate -- --step=1

# Migrate to specific migration
npm run migrate -- --to=003

# Dry-run mode
npm run migrate:dry-run

# Check status
npm run migrate -- --status
```

### Rollback Commands

```bash
# Rollback last migration
npm run rollback:one

# Rollback multiple migrations
npm run rollback -- --step=3

# Rollback to specific migration
npm run rollback -- --to=001

# Rollback all
npm run rollback -- --all
```

### Seed Commands

```bash
# Seed all
npm run seed:all

# Seed specific category
npm run seed -- --category=countries

# Dry-run seeds
npm run seed -- --dry-run
```

## Creating New Migrations

1. Create a new file in `migrations/` with the next number:
   ```bash
   touch migrations/005_create_products.sql
   ```

2. Add UP and DOWN sections:

```sql
-- UP Migration
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
);

-- DOWN Migration
DROP TABLE IF EXISTS products CASCADE;
```

3. Run the migration:
   ```bash
   npm run migrate
   ```

## Creating New Seeds

1. Create a new file in `seeds/{category}/`:
   ```bash
   touch seeds/categories/001_product_categories.sql
   ```

2. Add seed data:

```sql
-- Description: Seeds product categories
INSERT INTO categories (id, name, slug, description) VALUES
('uuid-1', 'Electronics', 'electronics', 'Electronic devices and accessories'),
('uuid-2', 'Clothing', 'clothing', 'Apparel and fashion')
ON CONFLICT DO NOTHING;
```

3. Run the seed:
   ```bash
   npm run seed -- --category=categories
   ```

## Schema Reference

### Users Schema
- `users` - Main user accounts
- `email_verification_tokens` - Email verification
- `password_reset_tokens` - Password reset
- `refresh_tokens` - JWT refresh tokens
- `social_accounts` - OAuth connections
- `user_addresses` - User addresses

### Orders Schema
- `orders` - Order headers
- `order_items` - Line items
- `order_status_history` - Status changes
- `order_timeline` - Detailed events
- `order_cancellations` - Cancellation requests
- `order_returns` - Return requests

### Payments Schema
- `payments` - Transaction records
- `payment_refunds` - Refund records
- `payment_methods` - User payment methods
- `payment_gateway_settings` - Gateway configs
- `payment_webhooks` - Webhook events
- `escrow_transactions` - Escrow management

### Deliveries Schema
- `deliveries` - Delivery records
- `delivery_routes` - Driver routes
- `delivery_stops` - Route stops
- `delivery_events` - Tracking events
- `delivery_issues` - Issue reports
- `delivery_vehicles` - Fleet management
- `delivery_zones` - Service zones

## Troubleshooting

### Lock Timeout

If migrations are stuck waiting for a lock:
```sql
-- Check for active locks
SELECT * FROM schema_migrations_lock WHERE is_active = true;

-- Remove stale locks (manual intervention)
DELETE FROM schema_migrations_lock WHERE expires_at < NOW();
```

### Failed Migrations

Check the `schema_migrations` table for errors:
```sql
SELECT * FROM schema_migrations WHERE success = false;
```

### Reset Database

⚠️ **Warning**: This deletes all data!

```bash
# Drop and recreate all tables (run migrations down)
npm run migrate:down -- --all

# Or use psql directly
psql -U user -d database -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run migrate
```

## License

MIT
