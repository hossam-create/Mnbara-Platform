#!/bin/bash

# Master Integration Setup Script
# One command to set up the entire Mnbara platform

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║           Mnbara Platform - Master Setup                  ║"
echo "║                                                            ║"
echo "║  This will set up all 22 microservices                    ║"
echo "║  Estimated time: 20-30 minutes                            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js v18+"
  exit 1
fi
echo "✓ Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
  echo "❌ npm not found. Please install npm"
  exit 1
fi
echo "✓ npm $(npm --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "⚠️  PostgreSQL not found. You'll need it for databases."
  echo "   Continue anyway? (y/n)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "✓ PostgreSQL $(psql --version | awk '{print $3}')"
fi

# Check Redis (optional)
if command -v redis-cli &> /dev/null; then
  echo "✓ Redis $(redis-cli --version | awk '{print $2}')"
else
  echo "⚠️  Redis not found (optional, but recommended)"
fi

echo ""
echo -e "${GREEN}Prerequisites check complete!${NC}"
echo ""
sleep 2

# Setup databases
echo -e "${YELLOW}[2/5] Setting up databases...${NC}"
echo "This will create 22 databases and run migrations"
echo ""

chmod +x scripts/integration/setup-all-databases.sh
./scripts/integration/setup-all-databases.sh

echo ""
echo -e "${GREEN}Database setup complete!${NC}"
echo ""
sleep 2

# Start services
echo -e "${YELLOW}[3/5] Starting all services...${NC}"
echo "This will start 22 microservices"
echo ""

chmod +x scripts/integration/start-all-services.sh
./scripts/integration/start-all-services.sh

echo ""
echo "Waiting 30 seconds for services to initialize..."
sleep 30

echo ""
echo -e "${GREEN}Services started!${NC}"
echo ""
sleep 2

# Health check
echo -e "${YELLOW}[4/5] Running health checks...${NC}"
echo ""

chmod +x scripts/integration/health-check-all.sh
./scripts/integration/health-check-all.sh

echo ""
sleep 2

# Quick verification
echo -e "${YELLOW}[5/5] Quick verification...${NC}"
echo ""

chmod +x scripts/integration/quick-verify.sh
./scripts/integration/quick-verify.sh

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🎉 SETUP COMPLETE! 🎉                        ║"
echo "║                                                            ║"
echo "║  All 22 microservices are running and healthy!            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo "📊 Service Status:"
echo "  • 22 microservices running"
echo "  • 22 databases configured"
echo "  • All health checks passing"
echo ""

echo "🔗 Service URLs:"
echo "  • Listing Service:    http://localhost:3001"
echo "  • Auction Service:    http://localhost:3002"
echo "  • Payment Service:    http://localhost:3003"
echo "  • Auth Service:       http://localhost:3014"
echo "  • Chat Service:       http://localhost:3016"
echo "  • Search Service:     http://localhost:3023"
echo "  • AI Agent Service:   http://localhost:3029"
echo ""

echo "📝 Next Steps:"
echo "  1. Configure API Gateway: cd backend/services/api-gateway"
echo "  2. Run integration tests: npm run test:integration"
echo "  3. Start frontend: cd frontend/web-app && npm run dev"
echo "  4. Deploy to staging: npm run deploy:staging"
echo ""

echo "📚 Documentation:"
echo "  • Integration Guide: INTEGRATION_READINESS_GUIDE.md"
echo "  • Step-by-Step: INTEGRATION_STEP_BY_STEP.md"
echo "  • Service READMEs: backend/services/*/README.md"
echo ""

echo "🛠️  Useful Commands:"
echo "  • Stop all services: ./scripts/integration/stop-all-services.sh"
echo "  • Health check: ./scripts/integration/health-check-all.sh"
echo "  • View logs: tail -f logs/{service-name}.log"
echo ""

echo -e "${GREEN}🚀 Platform is ready for integration and testing!${NC}"
echo ""
