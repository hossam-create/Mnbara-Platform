# Mnbara Platform - Quick Test Guide

## ✅ Current Status

Docker is downloading the PostGIS image (postgis/postgis:15-3.4-alpine).  
This may take 5-10 minutes depending on your internet connection.

## 🚀 Next Steps (After Download Completes)

### 1. Verify Database is Running
```bash
docker ps | grep postgres
```

### 2. Apply Schema
```bash
# From project root
Get-Content "docs\database\complete_schema.sql" | docker exec -i mnbara-postgres psql -U mnbara_user -d mnbara_db
```

### 3. Verify Tables Created
```bash
docker exec -it mnbara-postgres psql -U mnbara_user -d mnbara_db -c "\dt"
```

Should show:
- users
- wallets
- rewards
- reward_transactions
- traveler_locations
- trips
- listings
- bids
- orders
- tracking_events
- transactions
- chat_messages
- notifications
- reviews

### 4. Start All Services
```bash
cd infrastructure/docker
docker-compose up --build
```

### 5. Test Services
```bash
# API Gateway
curl http://localhost:8080/health

# Recommendation Service (Python)
curl http://localhost:3007/health

# Rewards Service
curl http://localhost:3008/health

# Test Context Analysis
curl -X POST http://localhost:3007/api/v1/context/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "traveler_id": "test-123",
    "location": {"lat": 25.2048, "lon": 55.2708},
    "voice_transcript": "I am at Dubai Mall"
  }'
```

### 6. Test Rewards
```bash
# Get balance
curl http://localhost:3008/api/rewards/balance/1

# Earn points
curl -X POST http://localhost:3008/api/rewards/earn \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "action": "DELIVERY_COMPLETED"
  }'

# Leaderboard
curl http://localhost:3008/api/rewards/leaderboard
```

---

## 🐛 Troubleshooting

### If PostGIS fails to install
1. Stop containers: `docker-compose down`
2. Remove volumes: `docker volume rm docker_postgres_data`
3. Restart: `docker-compose up postgres -d`

### If services fail to connect to DB
1. Check postgres is healthy: `docker logs mnbara-postgres`
2. Wait 10 seconds for DB to initialize
3. Retry connection

---

## 📊 Service Ports Reference

| Service | Port | Status |
|---------|------|--------|
| API Gateway | 8080 | Ready |
| Auth | 3001 | Ready |
| Listing | 3002 | Ready |
| Auction | 3003 | ✅ Auto-extend |
| Payment | 3004 | ✅ Escrow |
| Crowdship | 3005 | ✅ Pricing |
| Notification | 3006 | Ready |
| **Recommendation** | **3007** | ✅ **Python/AI** |
| **Rewards** | **3008** | ✅ **NEW** |
| Orders | 3009 | Ready |
| Trips | 3010 | Ready |
| Matching | 3011 | Ready |
| PostgreSQL | 5432 | PostGIS |
| Redis | 6379 | Ready |

---

**Next Step:** Wait for Docker download to complete, then run the test commands above! 🚀
