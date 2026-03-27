#!/bin/bash

# Stop All Services
# Gracefully stop all running microservices

set -e

echo "🛑 Stopping all Mnbara services..."

# Check if logs directory exists
if [ ! -d "logs" ]; then
  echo "No logs directory found. Services may not be running."
  exit 0
fi

# Counter
stopped=0
not_running=0

# Stop all services by PID
for pidfile in logs/*.pid; do
  if [ -f "$pidfile" ]; then
    service=$(basename "$pidfile" .pid)
    pid=$(cat "$pidfile")
    
    if ps -p $pid > /dev/null 2>&1; then
      echo "Stopping $service (PID: $pid)..."
      kill $pid
      stopped=$((stopped + 1))
      
      # Wait for graceful shutdown
      sleep 1
      
      # Force kill if still running
      if ps -p $pid > /dev/null 2>&1; then
        echo "  Force killing $service..."
        kill -9 $pid
      fi
    else
      echo "⚠️  $service not running (stale PID file)"
      not_running=$((not_running + 1))
    fi
    
    # Remove PID file
    rm "$pidfile"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Stop Summary:"
echo "  Stopped: $stopped"
echo "  Not Running: $not_running"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ All services stopped!"
