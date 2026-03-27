#!/bin/bash
# P2P Exchange Service - Rollback Migration Script
# Usage: ./scripts/rollback-migration.sh

set -e

echo "⚠️  P2P Exchange Service - Rollback Migration"
echo "=============================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "📊 Database URL: ${DATABASE_URL%%@*}@***"
echo ""

# Confirm rollback
read -p "⚠️  WARNING: This will ROLLBACK the database schema. All data will be LOST! Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Rollback cancelled"
  exit 0
fi

echo ""
echo "🔄 Running rollback script..."

# Run rollback SQL
psql "$DATABASE_URL" -f prisma/migrations/20260128_initial_production/rollback.sql

echo ""
echo "✅ Rollback completed successfully!"
echo ""
echo "⚠️  WARNING: All P2P Exchange data has been removed!"
echo ""
echo "📊 Next steps:"
echo "   1. Verify database is clean"
echo "   2. Re-run migrations if needed"
echo "   3. Restore from backup if available"
