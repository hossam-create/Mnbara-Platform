#!/bin/bash

# Mnbara Platform - Unified Database Migration Runner
# This script runs all necessary database migrations in the correct order

echo "🗄️ Mnbara Platform - Database Migration Runner"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-password}"
DB_NAME="${DB_NAME:-mnbara}"

# Function to run SQL migration
run_sql_migration() {
    local service_name=$1
    local migration_file=$2
    
    echo -e "${BLUE}Running migration for $service_name...${NC}"
    
    if [ -f "$migration_file" ]; then
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name migration completed${NC}"
            return 0
        else
            echo -e "${RED}❌ $service_name migration failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Migration file not found: $migration_file${NC}"
        return 1
    fi
}

# Function to run Prisma migration
run_prisma_migration() {
    local service_name=$1
    local service_dir=$2
    
    echo -e "${BLUE}Running Prisma migration for $service_name...${NC}"
    
    if [ -d "$service_dir" ]; then
        cd "$service_dir"
        
        # Generate Prisma client first
        if npx prisma generate > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Prisma client generated${NC}"
        else
            echo -e "${RED}❌ Prisma client generation failed${NC}"
            return 1
        fi
        
        # Run migration
        if npx prisma migrate deploy > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name Prisma migration completed${NC}"
            return 0
        else
            echo -e "${RED}❌ $service_name Prisma migration failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Service directory not found: $service_dir${NC}"
        return 1
    fi
}

# Function to create database if not exists
create_database() {
    echo -e "${BLUE}Creating database if not exists...${NC}"
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database created or already exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Database may already exist${NC}"
    fi
}

# Function to check database connection
check_database_connection() {
    echo -e "${BLUE}Checking database connection...${NC}"
    
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        return 1
    fi
}

# Function to run infrastructure migrations
run_infrastructure_migrations() {
    echo -e "${BLUE}Running infrastructure migrations...${NC}"
    
    local infra_dir="backend/infrastructure/database-migrations/migrations"
    
    if [ -d "$infra_dir" ]; then
        for migration in "$infra_dir"/*.sql; do
            if [ -f "$migration" ]; then
                migration_name=$(basename "$migration" .sql)
                echo -e "${YELLOW}Running $migration_name...${NC}"
                
                if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ $migration_name completed${NC}"
                else
                    echo -e "${RED}❌ $migration_name failed${NC}"
                    return 1
                fi
            fi
        done
    else
        echo -e "${YELLOW}⚠️  Infrastructure migrations directory not found${NC}"
    fi
}

# Function to run service-specific migrations
run_service_migrations() {
    echo -e "${BLUE}Running service-specific migrations...${NC}"
    
    # Define services and their migration order
    local services=(
        "auth-service:backend/services/auth-service"
        "user-service:backend/services/user-service" 
        "product-service:backend/services/product-service"
        "payment-service:backend/services/payment-service"
        "order-service:backend/services/order-service"
        "auction-service:backend/services/auction-service"
        "listing-service:backend/services/listing-service"
        "country-layer-service:backend/services/country-layer-service"
        "subscription-service:backend/services/subscription-service"
        "matching-service:backend/services/matching-service"
        "trips-service:backend/services/trips-service"
        "notification-service:backend/services/notification-service"
        "analytics-service:backend/services/analytics-service"
        "kyc-service:backend/services/kyc-service"
        "wallet-service:backend/services/wallet-service"
    )
    
    for service_pair in "${services[@]}"; do
        IFS=':' read -r service_name service_dir <<< "$service_pair"
        
        echo -e "${YELLOW}Processing $service_name...${NC}"
        
        # Check if Prisma schema exists
        if [ -f "$service_dir/prisma/schema.prisma" ]; then
            run_prisma_migration "$service_name" "$service_dir"
        elif [ -d "$service_dir/migrations" ]; then
            # Look for SQL migrations
            for migration in "$service_dir/migrations"/*.sql; do
                if [ -f "$migration" ]; then
                    run_sql_migration "$service_name" "$migration"
                    break  # Only run the first/main migration
                fi
            done
        else
            echo -e "${YELLOW}⚠️  No migrations found for $service_name${NC}"
        fi
        
        echo ""
    done
}

# Function to run MVP-specific migrations
run_mvp_migrations() {
    echo -e "${BLUE}Running MVP-specific migrations...${NC}"
    
    local mvp_dir="backend/mvp-services/order-service/migrations"
    
    if [ -d "$mvp_dir" ]; then
        for migration in "$mvp_dir"/*.sql; do
            if [ -f "$migration" ]; then
                migration_name=$(basename "$migration" .sql)
                echo -e "${YELLOW}Running MVP $migration_name...${NC}"
                
                if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" > /dev/null 2>&1; then
                    echo -e "${GREEN}✅ MVP $migration_name completed${NC}"
                else
                    echo -e "${RED}❌ MVP $migration_name failed${NC}"
                    return 1
                fi
            fi
        done
    else
        echo -e "${YELLOW}⚠️  MVP migrations directory not found${NC}"
    fi
}

# Function to verify migrations
verify_migrations() {
    echo -e "${BLUE}Verifying migrations...${NC}"
    
    # Check core tables
    local tables=("users" "products" "orders" "payments" "countries" "subscriptions")
    
    for table in "${tables[@]}"; do
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt $table" | grep -q "$table"; then
            echo -e "${GREEN}✅ Table $table exists${NC}"
        else
            echo -e "${RED}❌ Table $table missing${NC}"
        fi
    done
    
    # Check for country layer fields in products
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\d products" | grep -q "origin_country"; then
        echo -e "${GREEN}✅ Country layer fields present in products${NC}"
    else
        echo -e "${YELLOW}⚠️  Country layer fields missing from products${NC}"
    fi
}

# Function to seed sample data
seed_sample_data() {
    echo -e "${BLUE}Seeding sample data...${NC}"
    
    # Sample countries data
    cat << EOF | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1
INSERT INTO countries (code, name, name_ar, currency, is_active) VALUES
('US', 'United States', 'الولايات المتحدة', 'USD', true),
('SA', 'Saudi Arabia', 'السعودية', 'SAR', true),
('UK', 'United Kingdom', 'المملكة المتحدة', 'GBP', true),
('AE', 'United Arab Emirates', 'الإمارات', 'AED', true)
ON CONFLICT (code) DO NOTHING;
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Sample countries data seeded${NC}"
    else
        echo -e "${YELLOW}⚠️  Countries data may already exist${NC}"
    fi
    
    # Sample subscription plans
    cat << EOF | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1
INSERT INTO subscription_plans (id, name, description, price, currency, features, is_active) VALUES
('free', 'Free Plan', 'Basic access to platform features', 0.00, 'USD', '["create-product", "browse-products", "basic-search"]', true),
('basic', 'Basic Plan', 'Enhanced features for active users', 4.99, 'USD', '["create-product", "browse-products", "basic-search", "send-messages"]', true),
('premium', 'Premium Plan', 'Full access to all platform features', 9.99, 'USD', '["create-product", "browse-products", "basic-search", "send-messages", "request-item-from-traveler", "priority-support", "advanced-analytics"]', true)
ON CONFLICT (id) DO NOTHING;
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Sample subscription plans seeded${NC}"
    else
        echo -e "${YELLOW}⚠️  Subscription plans may already exist${NC}"
    fi
}

# Main execution
main() {
    echo "Starting database migration process..."
    echo ""
    
    # Check database connection
    if ! check_database_connection; then
        echo -e "${RED}❌ Database connection failed. Please check your configuration.${NC}"
        exit 1
    fi
    
    # Create database
    create_database
    
    # Run infrastructure migrations
    run_infrastructure_migrations
    
    # Run service-specific migrations
    run_service_migrations
    
    # Run MVP migrations
    run_mvp_migrations
    
    # Verify migrations
    verify_migrations
    
    # Seed sample data
    seed_sample_data
    
    echo ""
    echo -e "${GREEN}🎉 Database migration process completed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start your services"
    echo "2. Run the health check script"
    echo "3. Test the core user flows"
}

# Run main function
main "$@"