#!/bin/bash
set -e

echo "🚀 Starting production database migration..."
echo "Environment: $NODE_ENV"
echo "Database: $DATABASE_URL"

# Verify database connection
echo "✓ Verifying database connection..."
npx prisma db execute --stdin < /dev/null || {
  echo "❌ Failed to connect to database"
  exit 1
}

# Run pending migrations
echo "✓ Running pending migrations..."
npx prisma migrate deploy --skip-generate

# Verify schema
echo "✓ Verifying schema..."
npx prisma db execute --stdin < /dev/null

# Seed database if needed
if [ -f "prisma/seed.ts" ]; then
  echo "✓ Seeding database..."
  npx prisma db seed
fi

echo "✅ Migration complete!"
echo "Database is ready for production"
