#!/bin/bash
# P2P Exchange Service - Production Migration Script
# Usage: ./scripts/migrate-production.sh

set -e

echo "🚀 P2P Exchange Service - Production Migration"
echo "=============================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "📊 Database URL: ${DATABASE_URL%%@*}@***"
echo ""

# Confirm migration
read -p "⚠️  This will run migrations on PRODUCTION database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled"
  exit 0
fi

echo ""
echo "📦 Step 1: Generate Prisma Client..."
npm run prisma:generate

echo ""
echo "🔄 Step 2: Running database migrations..."
npm run prisma:deploy

echo ""
echo "🌱 Step 3: Seeding initial data..."
npm run prisma:seed

echo ""
echo "✅ Production migration completed successfully!"
echo ""
echo "📊 Next steps:"
echo "   1. Verify database schema"
echo "   2. Check seeded data"
echo "   3. Run smoke tests"
echo "   4. Deploy application"
