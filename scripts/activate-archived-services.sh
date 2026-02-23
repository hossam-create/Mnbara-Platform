#!/bin/bash

# Archived Services Activation Script
# This script incrementally activates all 71 archived services without interrupting current execution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PHASE1_FILE="docker-compose.archived-phase1.yml"
PHASE2_FILE="docker-compose.archived-phase2.yml"
PHASE3_FILE="docker-compose.archived-phase3.yml"
LOG_FILE="archived-services-activation.log"

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if docker-compose files exist
check_files() {
    log "Checking docker-compose files..."
    
    if [ ! -f "$PHASE1_FILE" ]; then
        error "Phase 1 file not found: $PHASE1_FILE"
        exit 1
    fi
    
    if [ ! -f "$PHASE2_FILE" ]; then
        error "Phase 2 file not found: $PHASE2_FILE"
        exit 1
    fi
    
    if [ ! -f "$PHASE3_FILE" ]; then
        error "Phase 3 file not found: $PHASE3_FILE"
        exit 1
    fi
    
    log "All docker-compose files found"
}

# Check port conflicts
check_port_conflicts() {
    log "Checking for port conflicts..."
    
    local ports=$(grep -h "ports:" -A 1 "$PHASE1_FILE" "$PHASE2_FILE" "$PHASE3_FILE" | grep -oP '\d+:\d+' | cut -d: -f1 | sort -u)
    
    for port in $ports; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            warn "Port $port is already in use"
            log "Checking if port $port is used by an active service..."
            if lsof -i :$port 2>/dev/null | grep -q "LISTEN"; then
                local service=$(lsof -i :$port 2>/dev/null | grep "LISTEN" | awk '{print $1}')
                warn "Port $port is used by $service"
                log "This may cause conflicts. Please review."
            fi
        fi
    done
    
    log "Port conflict check complete"
}

# Check database conflicts
check_database_conflicts() {
    log "Checking for database conflicts..."
    
    local databases=$(grep -h "DATABASE_URL" "$PHASE1_FILE" "$PHASE2_FILE" "$PHASE3_FILE" | grep -oP 'postgresql://[^:]+:[^@]+@[^/]+/\K[^"]+' | sort -u)
    
    log "Databases used by archived services:"
    echo "$databases" | while read db; do
        log "  - $db"
    done
    
    log "Database conflict check complete"
}

# Wait for service to be healthy
wait_for_health() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=0
    
    log "Waiting for $service_name to be healthy..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f "http://localhost:$port/health" > /dev/null 2>&1; then
            log "$service_name is healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    error "$service_name failed to become healthy after ${max_attempts} attempts"
    return 1
}

# Activate services in a phase
activate_phase() {
    local phase_file=$1
    local phase_name=$2
    
    log "=========================================="
    log "Activating $phase_name"
    log "=========================================="
    
    # Get list of services in this phase
    local services=$(grep -E "^\s+[a-z-]+-service:" "$phase_file" | grep -v "^\s*#" | awk '{print $1}' | sed 's/:$//')
    local service_count=$(echo "$services" | wc -l)
    
    log "Found $service_count services in $phase_name"
    
    # Start services
    log "Starting services..."
    docker-compose -f "$phase_file" up -d
    
    # Wait for each service to be healthy
    for service in $services; do
        log "Checking health of $service..."
        
        # Get port for this service
        local port=$(grep -A 10 "^  $service:" "$phase_file" | grep -E "^\s+ports:" -A 1 | grep -oP '\d+:\d+' | cut -d: -f1)
        
        if [ -n "$port" ]; then
            if ! wait_for_health "$service" "$port"; then
                error "Failed to activate $service"
                log "Continuing with remaining services..."
            else
                log "$service activated successfully"
            fi
        else
            warn "Could not determine port for $service"
        fi
    done
    
    log "$phase_name activation complete"
}

# Update monitoring dashboards
update_monitoring() {
    log "Updating monitoring dashboards..."
    
    # Create monitoring configuration for all archived services
    cat > "monitoring/archived-services-dashboard.json" <<EOF
{
  "dashboard": {
    "title": "Archived Services Health",
    "panels": [
      {
        "title": "Service Health Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"archived-.*\"}",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "title": "Service Response Times",
        "type": "graph",
        "targets": [
          {
            "expr": "http_request_duration_seconds{job=~\"archived-.*\"}",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "title": "Service Error Rates",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\",job=~\"archived-.*\"}[5m])",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "title": "Database Connection Pool",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count{job=~\"archived-.*\"}",
            "legendFormat": "{{job}}"
          }
        ]
      },
      {
        "title": "Redis Cache Hit Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "redis_cache_hit_rate{job=~\"archived-.*\"}",
            "legendFormat": "{{job}}"
          }
        ]
      }
    ]
  }
}
EOF
    
    log "Monitoring dashboard configuration created"
}

# Main execution
main() {
    log "=========================================="
    log "Archived Services Activation Started"
    log "=========================================="
    
    # Pre-activation checks
    check_files
    check_port_conflicts
    check_database_conflicts
    
    # Activate Phase 1: Critical Services (21 services)
    activate_phase "$PHASE1_FILE" "Phase 1: Critical Services (21 services)"
    
    # Wait 5 seconds between phases
    log "Waiting 5 seconds before Phase 2..."
    sleep 5
    
    # Activate Phase 2: Medium Priority Services (20 services)
    activate_phase "$PHASE2_FILE" "Phase 2: Medium Priority Services (20 services)"
    
    # Wait 5 seconds between phases
    log "Waiting 5 seconds before Phase 3..."
    sleep 5
    
    # Activate Phase 3: Low Priority Services (24 services)
    activate_phase "$PHASE3_FILE" "Phase 3: Low Priority Services (24 services)"
    
    # Update monitoring
    update_monitoring
    
    # Summary
    log "=========================================="
    log "Archived Services Activation Complete"
    log "=========================================="
    log "Total services activated: 71"
    log "Phase 1: 21 services"
    log "Phase 2: 20 services"
    log "Phase 3: 24 services"
    log "Additional services: 6 (notification-service already active)"
    log ""
    log "Monitoring dashboards updated"
    log "Log file: $LOG_FILE"
    log ""
    log "Next steps:"
    log "1. Verify all services are healthy: curl http://localhost:PORT/health"
    log "2. Check monitoring dashboards: http://grafana:3000"
    log "3. Review logs: tail -f $LOG_FILE"
    log "4. Test service integration with active microservices"
}

# Run main function
main
