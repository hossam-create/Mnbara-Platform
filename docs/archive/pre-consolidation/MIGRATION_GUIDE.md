# MNbarh Platform Migration Guide

## Quick Start

### 1. Set Environment Variables

```powershell
# Set your database connection string
$env:DATABASE_URL = "postgresql://username:password@localhost:5432/mnbara_wallet"

# Optional: Set environment (defaults to development)
$env:ENVIRONMENT = "production"
```

### 2. Run the Migration

```powershell
# Option A: Use the quick migration script
.\quick-migrate.ps1

# Option B: Use the comprehensive safe migration script
.\safe-migration.ps1
```

### 3. Verify Migration

```powershell
# Check migration status
cd backend\services\wallet-service
npx prisma migrate status --schema=prisma\schema-v2.prisma

# Test database connection
npx prisma db pull --schema=prisma\schema-v2.prisma
```

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **Prisma CLI** (installed via npm)
4. **PostgreSQL Client Tools** (psql command)

### Install Prerequisites

```powershell
# Install Node.js dependencies
npm install

# Install Prisma CLI globally (if not already installed)
npm install -g prisma

# Verify PostgreSQL client tools
psql --version
```

## Migration Steps Explained

### Step 1: Apply Database Migrations

```powershell
npx prisma migrate deploy --schema=backend\services\wallet-service\prisma\schema-v2.prisma
```

**What it does**: Applies pending database schema changes

### Step 2: Generate Prisma Client

```powershell
npx prisma generate --schema=backend\services\wallet-service\prisma\schema-v2.prisma
```

**What it does**: Updates TypeScript/JavaScript client to match database schema

### Step 3: Verify System Control

```sql
-- Check current system control state
SELECT * FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';

-- Ensure it's set to ACTIVE
UPDATE system_control SET value = 'ACTIVE' WHERE key = 'SYSTEM_FINANCIAL_MODE';
```

## Troubleshooting

### Common Issues

#### 1. "DATABASE_URL is not set"

```powershell
# Fix: Set the environment variable
$env:DATABASE_URL = "postgresql://your_user:your_password@localhost:5432/mnbara_wallet"
```

#### 2. "psql command not found"

```powershell
# Fix: Install PostgreSQL client tools
# Download from: https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

#### 3. "Prisma not found"

```powershell
# Fix: Install Prisma CLI
npm install -g prisma
# Or install locally in the project
npm install prisma @prisma/client
```

#### 4. Migration fails

```powershell
# Check migration status
npx prisma migrate status --schema=backend\services\wallet-service\prisma\schema-v2.prisma

# Reset migrations (WARNING: This will delete data)
npx prisma migrate reset --schema=backend\services\wallet-service\prisma\schema-v2.prisma
```

### Verification Commands

#### Check Database Connection

```powershell
psql $env:DATABASE_URL -c "SELECT version();"
```

#### Check Migration History

```powershell
psql $env:DATABASE_URL -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;"
```

#### Check System Control

```powershell
psql $env:DATABASE_URL -c "SELECT * FROM system_control WHERE key = 'SYSTEM_FINANCIAL_MODE';"
```

## Safety Features

### Automatic Backup

The scripts create automatic database backups before migration:

- Backup filename: `backup_YYYYMMDD_HHMMSS.sql`
- Located in the project root directory
- Use for rollback if migration fails

### Rollback Procedure

If migration fails:

1. Restore database from backup:

   ```powershell
   psql $env:DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

2. Regenerate Prisma client:
   ```powershell
   npx prisma generate --schema=backend\services\wallet-service\prisma\schema-v2.prisma
   ```

### Production Safety

- Environment validation
- Service health checks
- Database backup creation
- Migration status verification
- System control validation

## Post-Migration

### Verify Services

```powershell
# Check if services are running
npm run verify

# Or manually check health endpoints
curl http://localhost:8080/health
curl http://localhost:8080/wallet/health
```

### Monitor Logs

```powershell
# Check application logs
tail -f logs/application.log

# Check database logs
tail -f logs/postgresql.log
```

### Test Financial Operations

```powershell
# Test wallet operations (via API or direct database)
psql $env:DATABASE_URL -c "SELECT count(*) FROM wallet;"
psql $env:DATABASE_URL -c "SELECT count(*) FROM ledger_entry;"
```

## Support

If you encounter issues:

1. Check the error messages in the script output
2. Verify all prerequisites are installed
3. Ensure database connectivity
4. Check migration logs in the database
5. Review the backup file if rollback is needed
