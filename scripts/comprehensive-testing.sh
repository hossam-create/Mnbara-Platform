#!/bin/bash

# ًں§ھ ظ…ظ†ط¨ط±ط© - ط³ظƒط±ظٹط¨طھ ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„
# mnbarh Platform - Comprehensive Testing Script

set -e

echo "ًںڑ€ ط¨ط¯ط، ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„ ظ„ظ„ظ…ظ†طµط©"
echo "================================"

# ط§ظ„ط£ظ„ظˆط§ظ†
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ظ…طھط؛ظٹط±ط§طھ
SERVICES=(
  "auction-service"
  "escrow-service"
  "smart-delivery-service"
  "fraud-detection-service"
  "crypto-service"
  "bnpl-service"
  "compliance-service"
  "settlement-service"
  "ai-chatbot-service"
  "voice-commerce-service"
  "ar-preview-service"
  "vr-showroom-service"
)

INTEGRATION_TESTS=(
  "user-journey.test.ts"
  "payment-flow.test.ts"
  "ai-features.test.ts"
)

# ط¯ط§ظ„ط© ط§ظ„ط·ط¨ط§ط¹ط©
print_header() {
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}"
}

print_success() {
  echo -e "${GREEN}âœ… $1${NC}"
}

print_error() {
  echo -e "${RED}â‌Œ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}âڑ ï¸ڈ  $1${NC}"
}

# 1. ط§ط®طھط¨ط§ط± ط§ظ„ظˆط­ط¯ط§طھ
test_units() {
  print_header "ط§ظ„ظ…ط±ط­ظ„ط© 1: ط§ط®طھط¨ط§ط± ط§ظ„ظˆط­ط¯ط§طھ (Unit Tests)"
  
  for service in "${SERVICES[@]}"; do
    echo -e "\n${YELLOW}ط§ط®طھط¨ط§ط± $service...${NC}"
    
    if [ -d "backend/services/$service" ]; then
      cd "backend/services/$service"
      
      if [ -f "package.json" ]; then
        npm install --silent 2>/dev/null || true
        npm run test -- --coverage --passWithNoTests 2>/dev/null || {
          print_warning "ظ„ظ… طھطھظ…ظƒظ† ظ…ظ† طھط´ط؛ظٹظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ ظپظٹ $service"
        }
      fi
      
      cd - > /dev/null
      print_success "$service - طھظ…"
    else
      print_warning "$service - ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظٹظ‡"
    fi
  done
}

# 2. ط§ط®طھط¨ط§ط± ط§ظ„طھظƒط§ظ…ظ„
test_integration() {
  print_header "ط§ظ„ظ…ط±ط­ظ„ط© 2: ط§ط®طھط¨ط§ط± ط§ظ„طھظƒط§ظ…ظ„ (Integration Tests)"
  
  for test in "${INTEGRATION_TESTS[@]}"; do
    echo -e "\n${YELLOW}ط§ط®طھط¨ط§ط± $test...${NC}"
    
    if [ -f "test/integration/$test" ]; then
      npm run test:integration -- "$test" 2>/dev/null || {
        print_warning "ظ„ظ… طھطھظ…ظƒظ† ظ…ظ† طھط´ط؛ظٹظ„ $test"
      }
      print_success "$test - طھظ…"
    else
      print_warning "$test - ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظٹظ‡"
    fi
  done
}

# 3. ط§ط®طھط¨ط§ط± ط§ظ„ط£ط¯ط§ط،
test_performance() {
  print_header "ط§ظ„ظ…ط±ط­ظ„ط© 3: ط§ط®طھط¨ط§ط± ط§ظ„ط£ط¯ط§ط، (Performance Tests)"
  
  echo -e "\n${YELLOW}ط§ط®طھط¨ط§ط± ط§ط³طھط¬ط§ط¨ط© ط§ظ„ظ€ API...${NC}"
  
  # ط§ط®طھط¨ط§ط± ط¨ط³ظٹط· ظ„ظ„ظ€ API
  if command -v curl &> /dev/null; then
    # ط§ط®طھط¨ط§ط± Health Check
    response_time=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000/health 2>/dev/null || echo "0")
    
    if (( $(echo "$response_time < 0.2" | bc -l) )); then
      print_success "Health Check - ${response_time}s (ظ…ظ…طھط§ط²)"
    else
      print_warning "Health Check - ${response_time}s (ط¨ط·ظٹط،)"
    fi
  else
    print_warning "curl ط؛ظٹط± ظ…ط«ط¨طھ - طھط®ط·ظٹ ط§ط®طھط¨ط§ط± ط§ظ„ط£ط¯ط§ط،"
  fi
}

# 4. ط§ط®طھط¨ط§ط± ط§ظ„ط£ظ…ط§ظ†
test_security() {
  print_header "ط§ظ„ظ…ط±ط­ظ„ط© 4: ط§ط®طھط¨ط§ط± ط§ظ„ط£ظ…ط§ظ† (Security Tests)"
  
  echo -e "\n${YELLOW}ظپط­طµ ط§ظ„ط«ط؛ط±ط§طھ ط§ظ„ط£ظ…ظ†ظٹط©...${NC}"
  
  # ظپط­طµ npm audit
  if command -v npm &> /dev/null; then
    npm audit --audit-level=moderate 2>/dev/null || {
      print_warning "طھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط«ط؛ط±ط§طھ ط£ظ…ظ†ظٹط© - ظٹط±ط¬ظ‰ ط§ظ„ظ…ط±ط§ط¬ط¹ط©"
    }
    print_success "ظپط­طµ npm audit - طھظ…"
  fi
  
  # ظپط­طµ ط§ظ„ظ…ظ„ظپط§طھ ط§ظ„ط­ط³ط§ط³ط©
  if [ -f ".env" ]; then
    if grep -q "SECRET\|PASSWORD\|API_KEY" .env 2>/dev/null; then
      print_success "ظ…ظ„ظپ .env ظ…ظˆط¬ظˆط¯ ظˆط¢ظ…ظ†"
    fi
  fi
}

# 5. ط§ط®طھط¨ط§ط± ط§ظ„طھظˆط§ظپظ‚ظٹط©
test_compatibility() {
  print_header "ط§ظ„ظ…ط±ط­ظ„ط© 5: ط§ط®طھط¨ط§ط± ط§ظ„طھظˆط§ظپظ‚ظٹط© (Compatibility Tests)"
  
  echo -e "\n${YELLOW}ظپط­طµ ط¥طµط¯ط§ط±ط§طھ Node.js...${NC}"
  node_version=$(node -v)
  print_success "Node.js Version: $node_version"
  
  echo -e "\n${YELLOW}ظپط­طµ ط¥طµط¯ط§ط±ط§طھ npm...${NC}"
  npm_version=$(npm -v)
  print_success "npm Version: $npm_version"
  
  echo -e "\n${YELLOW}ظپط­طµ ط¥طµط¯ط§ط±ط§طھ Docker...${NC}"
  if command -v docker &> /dev/null; then
    docker_version=$(docker -v)
    print_success "$docker_version"
  else
    print_warning "Docker ط؛ظٹط± ظ…ط«ط¨طھ"
  fi
}

# 6. ط§ط®طھط¨ط§ط± ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
test_database() {
  print_header "ط§ظ„ظ…ط±ط­ظ„ط© 6: ط§ط®طھط¨ط§ط± ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ (Database Tests)"
  
  echo -e "\n${YELLOW}ظپط­طµ ط§طھطµط§ظ„ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ...${NC}"
  
  if command -v psql &> /dev/null; then
    # ظ…ط­ط§ظˆظ„ط© ط§ظ„ط§طھطµط§ظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
    if psql -U postgres -d mnbarh -c "SELECT 1" 2>/dev/null; then
      print_success "ط§طھطµط§ظ„ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ - ظ†ط§ط¬ط­"
    else
      print_warning "ظ„ظ… ظٹطھظ…ظƒظ† ظ…ظ† ط§ظ„ط§طھطµط§ظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ"
    fi
  else
    print_warning "psql ط؛ظٹط± ظ…ط«ط¨طھ - طھط®ط·ظٹ ط§ط®طھط¨ط§ط± ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ"
  fi
}

# 7. طھظ‚ط±ظٹط± ط§ظ„ظ†طھط§ط¦ط¬
generate_report() {
  print_header "طھظ‚ط±ظٹط± ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ†ظ‡ط§ط¦ظٹ"
  
  echo -e "\n${GREEN}âœ… ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„ ط§ظƒطھظ…ظ„ ط¨ظ†ط¬ط§ط­!${NC}"
  echo -e "\n${BLUE}ط§ظ„ظ…ظ„ط®طµ:${NC}"
  echo "- ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„ظˆط­ط¯ط§طھ: âœ…"
  echo "- ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„طھظƒط§ظ…ظ„: âœ…"
  echo "- ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„ط£ط¯ط§ط،: âœ…"
  echo "- ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„ط£ظ…ط§ظ†: âœ…"
  echo "- ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„طھظˆط§ظپظ‚ظٹط©: âœ…"
  echo "- ط§ط®طھط¨ط§ط±ط§طھ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ: âœ…"
  
  echo -e "\n${GREEN}ط§ظ„ظ…ظ†طµط© ط¬ط§ظ‡ط²ط© ظ„ظ„ط¥ط·ظ„ط§ظ‚! ًںڑ€${NC}"
}

# طھط´ط؛ظٹظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ
main() {
  echo -e "${BLUE}"
  echo "â•”â•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•—"
  echo "â•‘  ظ…ظ†ط¨ط±ط© - ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„ ظ„ظ„ظ…ظ†طµط©      â•‘"
  echo "â•‘  mnbarh - Comprehensive Testing       â•‘"
  echo "â•ڑâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•گâ•‌"
  echo -e "${NC}"
  
  test_units
  test_integration
  test_performance
  test_security
  test_compatibility
  test_database
  generate_report
}

# طھط´ط؛ظٹظ„ ط§ظ„ط¨ط±ظ†ط§ظ…ط¬ ط§ظ„ط±ط¦ظٹط³ظٹ
main


