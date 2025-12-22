#!/bin/bash

# PostgreSQL Encryption Setup Script
# Requirements: 19.1 - Enable Postgres encryption (TDE/PG Crypto)
#
# This script automates the setup of PostgreSQL encryption for the MNBARA platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/backend/services/shared/database/migrations"

# Default values
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mnbara_db}"
DB_USER="${DB_USER:-mnbara_user}"
DB_PASSWORD="${DB_PASSWORD:-mnbara_pass}"

# Functions
print_header() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        print_error "psql command not found. Please install PostgreSQL client."
        exit 1
    fi
    print_info "✓ psql found"
    
    # Check if node is installed
    if ! command -v node &> /dev/null; then
        print_error "node command not found. Please install Node.js."
        exit 1
    fi
    print_info "✓ node found"
    
    # Check database connection
    if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" &> /dev/null; then
        print_error "Cannot connect to database. Please check connection settings."
        print_info "Connection details: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
        exit 1
    fi
    print_info "✓ Database connection successful"
    
    echo ""
}

generate_encryption_key() {
    print_header "Generating Encryption Key"
    
    # Check if key already exists in .env
    if [ -f "$PROJECT_ROOT/.env" ] && grep -q "DB_ENCRYPTION_KEY=" "$PROJECT_ROOT/.env"; then
        print_warning "DB_ENCRYPTION_KEY already exists in .env file"
        read -p "Do you want to generate a new key? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Using existing key"
            return
        fi
    fi
    
    # Generate new key
    NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    print_info "Generated new encryption key"
    print_warning "IMPORTANT: Save this key securely!"
    echo ""
    echo "DB_ENCRYPTION_KEY=$NEW_KEY"
    echo ""
    
    # Ask if user wants to save to .env
    read -p "Save to .env file? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "$PROJECT_ROOT/.env" ]; then
            # Update existing .env
            if grep -q "DB_ENCRYPTION_KEY=" "$PROJECT_ROOT/.env"; then
                sed -i.bak "s/DB_ENCRYPTION_KEY=.*/DB_ENCRYPTION_KEY=$NEW_KEY/" "$PROJECT_ROOT/.env"
                print_info "Updated DB_ENCRYPTION_KEY in .env"
            else
                echo "DB_ENCRYPTION_KEY=$NEW_KEY" >> "$PROJECT_ROOT/.env"
                print_info "Added DB_ENCRYPTION_KEY to .env"
            fi
        else
            echo "DB_ENCRYPTION_KEY=$NEW_KEY" > "$PROJECT_ROOT/.env"
            print_info "Created .env with DB_ENCRYPTION_KEY"
        fi
    fi
    
    echo ""
}

enable_pgcrypto() {
    print_header "Enabling pgcrypto Extension"
    
    # Check if pgcrypto is already enabled
    PGCRYPTO_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_extension WHERE extname='pgcrypto'")
    
    if [ "$PGCRYPTO_EXISTS" -eq "1" ]; then
        print_info "pgcrypto extension already enabled"
    else
        print_info "Installing pgcrypto extension..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/enable_pgcrypto.sql"
        print_info "✓ pgcrypto extension enabled"
    fi
    
    echo ""
}

setup_encrypted_columns() {
    print_header "Setting Up Encrypted Columns"
    
    print_info "Creating encrypted columns for sensitive fields..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/encrypt_sensitive_fields.sql"
    print_info "✓ Encrypted columns created"
    
    echo ""
}

migrate_existing_data() {
    print_header "Migrating Existing Data"
    
    # Check if there's data to migrate
    RECORD_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM \"KycUpload\"")
    
    if [ "$RECORD_COUNT" -eq "0" ]; then
        print_info "No existing data to migrate"
        return
    fi
    
    print_warning "Found $RECORD_COUNT records in KycUpload table"
    read -p "Do you want to migrate existing data to encrypted format? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping data migration"
        return
    fi
    
    # Get encryption key
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    fi
    
    if [ -z "$DB_ENCRYPTION_KEY" ]; then
        print_error "DB_ENCRYPTION_KEY not found in environment"
        print_info "Please set DB_ENCRYPTION_KEY and run migration manually"
        return
    fi
    
    print_info "Migrating data with encryption key..."
    
    # Run migration
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
SELECT set_encryption_key('$DB_ENCRYPTION_KEY');
SELECT * FROM migrate_all_sensitive_fields();
EOF
    
    print_info "✓ Data migration completed"
    
    echo ""
}

verify_setup() {
    print_header "Verifying Setup"
    
    # Check pgcrypto
    PGCRYPTO_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_extension WHERE extname='pgcrypto'")
    if [ "$PGCRYPTO_EXISTS" -eq "1" ]; then
        print_info "✓ pgcrypto extension enabled"
    else
        print_error "✗ pgcrypto extension not found"
    fi
    
    # Check encrypted columns
    ENCRYPTED_COLUMNS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.columns WHERE column_name LIKE '%_encrypted'")
    print_info "✓ Found $ENCRYPTED_COLUMNS encrypted columns"
    
    # Check encryption functions
    FUNCTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_proc WHERE proname IN ('set_encryption_key', 'encrypt_data', 'decrypt_data')")
    if [ "$FUNCTIONS" -eq "3" ]; then
        print_info "✓ Encryption functions created"
    else
        print_error "✗ Some encryption functions missing"
    fi
    
    echo ""
}

print_next_steps() {
    print_header "Next Steps"
    
    echo "1. Update application code to use encrypted columns"
    echo "   - Import encryption utilities from @shared/database/encryption.config"
    echo "   - Add Prisma middleware for automatic encryption/decryption"
    echo ""
    echo "2. Configure Transparent Data Encryption (TDE) for data-at-rest"
    echo "   - See backend/services/shared/database/README.md for TDE options"
    echo ""
    echo "3. Set up key rotation schedule"
    echo "   - Rotate encryption keys quarterly"
    echo "   - Log rotations in encryption_key_audit table"
    echo ""
    echo "4. Configure production key management"
    echo "   - Use AWS Secrets Manager, HashiCorp Vault, or similar"
    echo "   - Never commit encryption keys to version control"
    echo ""
    echo "5. Test encryption/decryption"
    echo "   - Verify data can be encrypted and decrypted correctly"
    echo "   - Test application functionality with encrypted data"
    echo ""
    
    print_info "For detailed documentation, see:"
    print_info "  backend/services/shared/database/README.md"
    echo ""
}

# Main execution
main() {
    print_header "PostgreSQL Encryption Setup"
    echo "This script will set up encryption for the MNBARA platform"
    echo ""
    
    check_prerequisites
    generate_encryption_key
    enable_pgcrypto
    setup_encrypted_columns
    migrate_existing_data
    verify_setup
    print_next_steps
    
    print_header "Setup Complete!"
    print_info "Encryption has been configured successfully"
}

# Run main function
main
