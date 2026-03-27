#!/bin/bash

# Activity Aggregation Endpoint - Test Commands
# Base URL: http://localhost:3000/api/activity

# Replace with your actual JWT token
JWT_TOKEN="your-jwt-token-here"
API_BASE="http://localhost:3000/api"

echo "=========================================="
echo "Activity Aggregation API - Test Commands"
echo "=========================================="
echo ""

# 1. Get all activities (aggregated from all domains)
echo "1. Get all activities (default: 20 items)"
echo "------------------------------------------"
curl -X GET "${API_BASE}/activity" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-$(date +%s)" | jq .

echo ""
echo ""

# 2. Get activities filtered by domain (wallet)
echo "2. Get wallet activities only"
echo "------------------------------"
curl -X GET "${API_BASE}/activity?domain=wallet&limit=10" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-$(date +%s)" | jq .

echo ""
echo ""

# 3. Get activities filtered by domain (traveler)
echo "3. Get traveler activities only"
echo "--------------------------------"
curl -X GET "${API_BASE}/activity?domain=traveler&limit=10" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-$(date +%s)" | jq .

echo ""
echo ""

# 4. Get activities filtered by domain (marketplace)
echo "4. Get marketplace activities only"
echo "-----------------------------------"
curl -X GET "${API_BASE}/activity?domain=marketplace&limit=10" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-$(date +%s)" | jq .

echo ""
echo ""

# 5. Get activities with custom limit
echo "5. Get activities with limit=5"
echo "------------------------------"
curl -X GET "${API_BASE}/activity?limit=5" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-$(date +%s)" | jq .

echo ""
echo ""

# 6. Get activities with date range filter
echo "6. Get activities from last 7 days"
echo "-----------------------------------"
START_DATE=$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)
END_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
curl -X GET "${API_BASE}/activity?startDate=${START_DATE}&endDate=${END_DATE}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-$(date +%s)" | jq .

echo ""
echo ""

# 7. Get activities with pagination (cursor)
echo "7. Get activities with cursor pagination"
echo "-----------------------------------------"
# First get initial page and extract cursor
RESPONSE=$(curl -s -X GET "${API_BASE}/activity?limit=2" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json")

echo "Initial page:"
echo "$RESPONSE" | jq .

CURSOR=$(echo "$RESPONSE" | jq -r '.meta.cursor // empty')
if [ ! -z "$CURSOR" ]; then
  echo ""
  echo "Next page (using cursor):"
  curl -X GET "${API_BASE}/activity?limit=2&cursor=${CURSOR}" \
    -H "Authorization: Bearer ${JWT_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "X-Request-ID: test-$(date +%s)" | jq .
fi

echo ""
echo ""

# 8. Health check for activity service
echo "8. Activity service health check"
echo "-------------------------------"
curl -X GET "${API_BASE}/activity/health" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" | jq .

echo ""
echo ""

# 9. Invalidate cache (for testing)
echo "9. Invalidate user cache"
echo "------------------------"
curl -X POST "${API_BASE}/activity/invalidate-cache" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: test-$(date +%s)" | jq .

echo ""
echo "=========================================="
echo "Tests completed!"
echo "=========================================="
