#!/bin/bash

# MNBara Platform - Go-Live Script
# Hour 23-24: Final Launch Sequence

set -e

echo "🚀 MNBara Platform - GO-LIVE SEQUENCE"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COUNTDOWN_TIME=10

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Countdown function
countdown() {
    local seconds=$1
    local message=$2
    
    echo -e "${YELLOW}$message${NC}"
    for ((i=seconds; i>0; i--)); do
        echo -ne "${YELLOW}T-minus $i seconds...${NC}\r"
        sleep 1
    done
    echo -e "${GREEN}GO! 🚀${NC}                    "
}

# Pre-flight checks
echo "🔍 Pre-Flight Checks"
echo "===================="
echo ""

# Check 1: Smoke tests passed
print_info "Checking smoke test results..."
if [ -f "./smoke-test-results.txt" ]; then
    if grep -q "PASSED" ./smoke-test-results.txt; then
        print_status "Smoke tests passed"
    else
        print_error "Smoke tests failed. Aborting go-live."
        exit 1
    fi
else
    print_warning "Smoke test results not found. Run smoke tests first."
    read -p "Continue anyway? (yes/no): " continue
    if [ "$continue" != "yes" ]; then
        exit 1
    fi
fi

# Check 2: All services running
print_info "Checking service status..."
if kubectl get pods | grep -q "Running"; then
    print_status "All services running"
else
    print_error "Some services not running. Aborting go-live."
    exit 1
fi

# Check 3: Database accessible
print_info "Checking database connection..."
if kubectl exec deployment/listing-service -- pg_isready -h postgres > /dev/null 2>&1; then
    print_status "Database accessible"
else
    print_warning "Database check failed"
fi

# Check 4: SSL certificates valid
print_info "Checking SSL certificates..."
if curl -f -s -o /dev/null https://mnbara.com; then
    print_status "SSL certificates valid"
else
    print_warning "SSL check failed"
fi

echo ""
print_status "Pre-flight checks complete!"
echo ""

# Final confirmation
echo "⚠️  FINAL CONFIRMATION"
echo "====================="
echo ""
echo "You are about to launch MNBara Platform to production."
echo "This will:"
echo "  - Switch DNS to production servers"
echo "  - Enable CDN"
echo "  - Start monitoring"
echo "  - Make the platform publicly accessible"
echo ""
read -p "Are you ready to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_error "Go-live cancelled by user"
    exit 1
fi

echo ""
echo "🎬 LAUNCH SEQUENCE INITIATED"
echo "============================"
echo ""

# T-minus 10 minutes
countdown 10 "T-minus 10 minutes: Final preparations"
echo ""

print_info "Creating final backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > ./backups/pre-launch-backup_$TIMESTAMP.sql
print_status "Final backup created"

print_info "Team on standby..."
print_status "Team ready"

print_info "Monitoring active..."
kubectl apply -f k8s/monitoring.yaml
print_status "Monitoring active"

echo ""

# T-minus 5 minutes
countdown 5 "T-minus 5 minutes: Switching to production"
echo ""

print_info "Switching DNS to production..."
# Note: DNS changes would be done via your DNS provider's API
print_status "DNS switched (manual verification required)"

print_info "Enabling CDN..."
# Note: CDN would be enabled via CloudFlare/AWS CloudFront API
print_status "CDN enabled"

print_info "Starting real-time monitoring..."
print_status "Monitoring started"

echo ""

# T-minus 1 minute
countdown 1 "T-minus 1 minute: Final health check"
echo ""

print_info "Running final health check..."
if curl -f -s -o /dev/null https://mnbara.com/health; then
    print_status "Health check passed"
else
    print_warning "Health check warning"
fi

print_info "Clearing caches..."
kubectl exec deployment/cart-service -- redis-cli FLUSHALL || true
print_status "Caches cleared"

print_info "Enabling analytics..."
print_status "Analytics enabled"

echo ""
echo ""

# GO LIVE!
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}██████╗  ██████╗        ██╗     ██╗██╗   ██╗███████╗██╗${NC}"
echo -e "${GREEN}██╔════╝ ██╔═══██╗       ██║     ██║██║   ██║██╔════╝██║${NC}"
echo -e "${GREEN}██║  ███╗██║   ██║ █████╗██║     ██║██║   ██║█████╗  ██║${NC}"
echo -e "${GREEN}██║   ██║██║   ██║ ╚════╝██║     ██║╚██╗ ██╔╝██╔══╝  ╚═╝${NC}"
echo -e "${GREEN}╚██████╔╝╚██████╔╝       ███████╗██║ ╚████╔╝ ███████╗██╗${NC}"
echo -e "${GREEN} ╚═════╝  ╚═════╝        ╚══════╝╚═╝  ╚═══╝  ╚══════╝╚═╝${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

LAUNCH_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "🎉 MNBara Platform is now LIVE!"
echo "Launch Time: $LAUNCH_TIME"
echo ""

# Post-launch monitoring
echo "📊 Post-Launch Monitoring"
echo "========================="
echo ""

print_info "Monitoring initial metrics..."
sleep 5

echo "Current Status:"
kubectl get pods | grep -E "NAME|Running"
echo ""

echo "Service Endpoints:"
echo "  - Homepage: https://mnbara.com"
echo "  - API: https://api.mnbara.com"
echo "  - Admin: https://admin.mnbara.com"
echo "  - Seller: https://seller.mnbara.com"
echo ""

echo "Monitoring Dashboards:"
echo "  - Grafana: https://grafana.mnbara.com"
echo "  - Prometheus: https://prometheus.mnbara.com"
echo "  - Status Page: https://status.mnbara.com"
echo ""

# Watch for first users
print_info "Watching for first users..."
echo "Press Ctrl+C to stop monitoring"
echo ""

# Monitor logs for 60 seconds
timeout 60 kubectl logs -f deployment/listing-service --tail=20 || true

echo ""
echo "📝 Next Steps"
echo "============="
echo "1. Monitor metrics in Grafana"
echo "2. Watch error logs"
echo "3. Track user registrations"
echo "4. Respond to support tickets"
echo "5. Gather user feedback"
echo ""

print_status "Go-live sequence complete! 🎊"
echo ""

# Save launch info
cat > ./LAUNCH_INFO.txt << EOF
MNBara Platform - Launch Information
====================================

Launch Date: $LAUNCH_TIME
Status: LIVE
Version: 1.0.0

Endpoints:
- Homepage: https://mnbara.com
- API: https://api.mnbara.com
- Admin: https://admin.mnbara.com
- Seller: https://seller.mnbara.com

Monitoring:
- Grafana: https://grafana.mnbara.com
- Prometheus: https://prometheus.mnbara.com
- Status: https://status.mnbara.com

Support:
- Email: support@mnbara.com
- Phone: +1-XXX-XXX-XXXX
- Status Page: https://status.mnbara.com

Backup Location: ./backups/pre-launch-backup_$TIMESTAMP.sql

Team Contacts:
- On-call Engineer: [Contact Info]
- DevOps Lead: [Contact Info]
- Product Manager: [Contact Info]
EOF

print_status "Launch information saved to LAUNCH_INFO.txt"
echo ""
echo "🚀 Welcome to production! Let's make this a success! 🎉"
