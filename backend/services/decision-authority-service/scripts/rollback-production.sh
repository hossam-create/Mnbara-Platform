#!/bin/bash
set -e

echo "⚠️  Starting production database rollback..."
echo "Environment: $NODE_ENV"
echo "Database: $DATABASE_URL"

# Get list of migrations
echo "📋 Available migrations:"
npx prisma migrate status

# Prompt for migration name
read -p "Enter migration name to rollback to (or press Enter to cancel): " MIGRATION_NAME

if [ -z "$MIGRATION_NAME" ]; then
  echo "❌ Rollback cancelled"
  exit 1
fi

# Confirm rollback
read -p "⚠️  This will rollback to migration: $MIGRATION_NAME. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Rollback cancelled"
  exit 1
fi

# Perform rollback
echo "🔄 Rolling back to migration: $MIGRATION_NAME..."
npx prisma migrate resolve --rolled-back "$MIGRATION_NAME"

echo "✅ Rollback complete!"
echo "Database rolled back to: $MIGRATION_NAME"
