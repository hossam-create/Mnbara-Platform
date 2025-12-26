#!/bin/bash

# ============================================
# Owner Account Setup Script
# This script sets up owner accounts for both dashboards
# ============================================

echo "🚀 Setting up Owner Accounts for Mnbara Platform..."
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${BLUE}Checking PostgreSQL connection...${NC}"
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not running. Please start PostgreSQL first.${NC}"
    echo "Run: docker-compose up -d postgres"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Run the SQL setup script
echo -e "${BLUE}Creating owner accounts...${NC}"
if psql -h localhost -p 5432 -U postgres -d mnbara_platform -f scripts/setup-owner-accounts.sql; then
    echo -e "${GREEN}✅ Owner accounts created successfully!${NC}"
else
    echo -e "${RED}❌ Failed to create owner accounts${NC}"
    exit 1
fi

echo ""
echo "============================================"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "============================================"
echo ""
echo -e "${YELLOW}📊 Admin Dashboard (Business Management):${NC}"
echo "URL: http://localhost:3000"
echo "Email: owner@mnbarh.com"
echo "Password: MnbaraOwner2026!"
echo "Role: SUPER_ADMIN (Full Access)"
echo ""
echo -e "${YELLOW}🚀 System Control Dashboard (Technical):${NC}"
echo "URL: http://localhost:3001"
echo "Email: owner@mnbarh.com"
echo "Password: SystemControl2026!"
echo "Role: SYSTEM_ADMIN (L5 Clearance)"
echo "MFA: Required (scan QR code on first login)"
echo ""
echo -e "${BLUE}🔐 MFA Backup Codes (save these):${NC}"
echo "123456, 789012, 345678, 901234, 567890"
echo ""
echo -e "${GREEN}📱 MFA Setup Instructions:${NC}"
echo "1. Download Google Authenticator or Authy"
echo "2. Go to http://localhost:3001 and login"
echo "3. Scan the QR code that appears"
echo "4. Enter the 6-digit code from your app"
echo ""
echo -e "${YELLOW}🛡️ Security Notes:${NC}"
echo "- Change default passwords after first login"
echo "- Keep MFA backup codes in a safe place"
echo "- System Control dashboard has 1-hour session timeout"
echo "- All access attempts are logged for security"
echo ""
echo -e "${GREEN}Ready to launch! 🚀${NC}"
echo "============================================"