#!/bin/bash

# Mnbara Platform - Production Monitoring Script
# For 2026 Launch Monitoring

echo "📊 Mnbara Platform Production Monitoring"
echo "========================================"

# Function to check service status
check_service() {
    local service_name=$1
    local container_name=$2
    
    echo "🔍 Checking $service_name..."
    
    # Check if container is running
    if docker ps --filter "name=$container_name" --format "{{.Names}}" | grep -q "^$container_name$"; then
        echo "   ✅ Container: Running"
        
        # Check health status
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "unknown")
        echo "   🏥 Health: $health_status"
        
        # Check resource usage
        local cpu_usage=$(docker stats "$container_name" --no-stream --format "{{.CPUPerc}}" | head -1)
        local mem_usage=$(docker stats "$container_name" --no-stream --format "{{.MemPerc}}" | head -1)
        echo "   💻 CPU: $cpu_usage"
        echo "   💾 Memory: $mem_usage"
        
        return 0
    else
        echo "   ❌ Container: Not running"
        return 1
    fi
}

# Function to check API endpoint
check_api_endpoint() {
    local endpoint=$1
    local expected_code=$2
    local description=$3
    
    echo "🌐 Checking $description..."
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" || echo "failed")
    
    if [ "$response_code" = "$expected_code" ]; then
        echo "   ✅ Status: HTTP $response_code (Healthy)"
        return 0
    else
        echo "   ❌ Status: HTTP $response_code (Unhealthy)"
        return 1
    fi
}

# Function to check database connection
check_database() {
    local db_type=$1
    local check_command=$2
    local description=$3
    
    echo "🗄️  Checking $description..."
    
    if eval "$check_command" >/dev/null 2>&1; then
        echo "   ✅ Status: Connected"
        return 0
    else
        echo "   ❌ Status: Connection failed"
        return 1
    fi
}

# Load environment variables
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

# Current timestamp
echo "🕐 Monitoring Timestamp: $(date)"
echo ""

# ===================
# INFRASTRUCTURE CHECKS
# ===================

echo "🏗️  INFRASTRUCTURE STATUS"
echo "-----------------------"

# Database
check_database "PostgreSQL" "docker exec mnbarh-postgres-prod pg_isready -U $DB_USER" "PostgreSQL Database"

# Redis
check_database "Redis" "docker exec mnbarh-redis-prod redis-cli -a $REDIS_PASSWORD ping | grep -q PONG" "Redis Cache"

# RabbitMQ
check_database "RabbitMQ" "docker exec mnbarh-rabbitmq-prod rabbitmq-diagnostics ping" "RabbitMQ Message Queue"

# Elasticsearch
check_api_endpoint "http://localhost:9200/_cluster/health" "200" "Elasticsearch Cluster"

echo ""

# ===================
# BACKEND SERVICES CHECKS
# ===================

echo "🔧 BACKEND SERVICES STATUS"
echo "-------------------------"

# API Gateway
check_service "API Gateway" "mnbarh-api-gateway-prod"
check_api_endpoint "http://localhost:8080/health" "200" "API Gateway Health"

# P2P Swap Service
check_service "P2P Swap Service" "mnbarh-p2p-swap-prod"
check_api_endpoint "http://localhost:8080/api/p2p-swap/health" "200" "P2P Swap Service Health"

# Real-time Matching Service
check_service "Real-time Matching Service" "mnbarh-real-time-matcher-prod"
check_api_endpoint "http://localhost:3001/health" "200" "Real-time Matching Service Health"

# AI Core Service
check_service "AI Core Service" "mnbarh-ai-core-prod"
check_api_endpoint "http://localhost:8080/api/ai/health" "200" "AI Core Service Health"

echo ""

# ===================
# FRONTEND SERVICES CHECKS
# ===================

echo "🎨 FRONTEND SERVICES STATUS"
echo "--------------------------"

# Web Frontend
check_service "Web Frontend" "mnbarh-web-frontend-prod"
check_api_endpoint "http://localhost:3000" "200" "Web Frontend"

# Mobile Backend
check_service "Mobile Backend" "mnbarh-mobile-backend-prod"
check_api_endpoint "http://localhost:3002/health" "200" "Mobile Backend Health"

echo ""

# ===================
# MONITORING SERVICES CHECKS
# ===================

echo "📈 MONITORING SERVICES STATUS"
echo "---------------------------"

# Prometheus
check_service "Prometheus" "mnbarh-prometheus-prod"
check_api_endpoint "http://localhost:9090" "200" "Prometheus"

# Grafana
check_service "Grafana" "mnbarh-grafana-prod"
check_api_endpoint "http://localhost:3001" "200" "Grafana"

echo ""

# ===================
# PERFORMANCE METRICS
# ===================

echo "📊 PERFORMANCE METRICS"
echo "----------------------"

# System resources
echo "💻 System Resources:"
echo "   CPU Usage: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')"
echo "   Memory Usage: $(free -m | awk '/Mem:/ {printf "%.1f%%", $3/$2*100}')"
echo "   Disk Usage: $(df -h / | awk '/\// {print $5}')"

# Docker resources
echo "🐳 Docker Resources:"
echo "   Running Containers: $(docker ps -q | wc -l)"
echo "   Total Containers: $(docker ps -a -q | wc -l)"
echo "   Docker Version: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"

# Network status
echo "🌐 Network Status:"
echo "   External Connectivity: $(ping -c 1 -W 2 google.com >/dev/null 2>&1 && echo "✅" || echo "❌")"
echo "   DNS Resolution: $(nslookup google.com >/dev/null 2>&1 && echo "✅" || echo "❌")"

echo ""

# ===================
# SECURITY CHECKS
# ===================

echo "🔒 SECURITY STATUS"
echo "-----------------"

# Check for exposed ports
echo "🚪 Open Ports Check:"
netstat -tuln | grep -E ':(80|443|8080|3000|3001|5432|6379|5672|9200|9090)' | while read line; do
    echo "   📍 $line"
done

# SSL certificate check (if applicable)
echo "🔐 SSL Certificate Check:"
if command -v openssl >/dev/null 2>&1; then
    echo "   OpenSSL available for certificate checks"
else
    echo "   ℹ️  OpenSSL not available for detailed certificate checks"
fi

echo ""

# ===================
# SUMMARY
# ===================

echo "📋 MONITORING SUMMARY"
echo "===================="

# Count healthy vs unhealthy services
healthy_count=0
total_count=0

# Count from previous checks
healthy_count=$(($healthy_count + $?))
total_count=$((total_count + 1))

# Calculate health percentage
if [ $total_count -gt 0 ]; then
    health_percentage=$((healthy_count * 100 / total_count))
else
    health_percentage=0
fi

echo ""
echo "🏆 OVERALL HEALTH: $health_percentage%"

if [ $health_percentage -ge 90 ]; then
    echo "✅ EXCELLENT - System is operating optimally"
elif [ $health_percentage -ge 70 ]; then
    echo "⚠️  GOOD - Minor issues detected"
elif [ $health_percentage -ge 50 ]; then
    echo "🔶 FAIR - Several services need attention"
else
    echo "❌ CRITICAL - Immediate attention required"
fi

echo ""
echo "🔔 RECOMMENDED ACTIONS:"

# Check if any critical services are down
if ! docker ps --filter "name=mnbarh-postgres-prod" --format "{{.Names}}" | grep -q "^mnbarh-postgres-prod$"; then
    echo "   🚨 CRITICAL: PostgreSQL database is down"
fi

if ! docker ps --filter "name=mnbarh-api-gateway-prod" --format "{{.Names}}" | grep -q "^mnbarh-api-gateway-prod$"; then
    echo "   🚨 CRITICAL: API Gateway is down"
fi

if ! docker ps --filter "name=mnbarh-redis-prod" --format "{{.Names}}" | grep -q "^mnbarh-redis-prod$"; then
    echo "   🚨 CRITICAL: Redis cache is down"
fi

echo ""
echo "📊 Next monitoring check in 5 minutes..."
echo "   Run './monitor-production.sh' for real-time status"
echo "   Run './check-logs.sh' for detailed log analysis"
echo "   Run './backup-production.sh' for immediate backup"

echo ""
echo "✅ Monitoring completed at $(date)"