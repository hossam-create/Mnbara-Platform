# Quick Integration Start - Mnbara Platform

**Status**: All 26 Projects Complete (100%) ✅  
**Ready**: Integration & Launch 🚀

---

## 🚀 One-Command Setup

### Linux/Mac
```bash
chmod +x scripts/integration/master-setup.sh
./scripts/integration/master-setup.sh
```

### Windows
```cmd
scripts\integration\master-setup.bat
```

**That's it!** This will:
- ✅ Check prerequisites
- ✅ Setup 22 databases
- ✅ Start 22 microservices
- ✅ Run health checks
- ✅ Verify everything works

**Time**: 20-30 minutes

---

## 📋 Manual Setup (If Needed)

### Step 1: Setup Databases (15 min)
```bash
./scripts/integration/setup-all-databases.sh
```

### Step 2: Start Services (2 min)
```bash
./scripts/integration/start-all-services.sh
```

### Step 3: Verify (30 sec)
```bash
./scripts/integration/health-check-all.sh
```

---

## 🔍 Quick Checks

### Check Service Status
```bash
./scripts/integration/quick-verify.sh
```

### View Logs
```bash
# All logs
ls logs/

# Specific service
tail -f logs/listing-service.log
tail -f logs/auth-service.log
```

### Stop All Services
```bash
./scripts/integration/stop-all-services.sh
```

---

## 🌐 Service URLs

Once running, access services at:

```
http://localhost:3001  - Listing Service
http://localhost:3002  - Auction Service
http://localhost:3003  - Payment Service
http://localhost:3007  - KYC Service
http://localhost:3009  - Internal Ledger
http://localhost:3010  - AI Recommendations
http://localhost:3011  - Escrow Service
http://localhost:3012  - Stripe Connect
http://localhost:3013  - Notification Service
http://localhost:3014  - Auth Service
http://localhost:3015  - Push Notifications
http://localhost:3016  - Chat Service
http://localhost:3017  - File Storage
http://localhost:3018  - Job Queue
http://localhost:3019  - Image Recognition
http://localhost:3020  - Recommendation Engine
http://localhost:3021  - Location Service
http://localhost:3022  - Medusa Adapter
http://localhost:3023  - Search Service
http://localhost:3024  - Review Service
http://localhost:3025  - Image Processing
http://localhost:3026  - i18n Service
http://localhost:3027  - Novu Service
http://localhost:3028  - Analytics Service
http://localhost:3029  - AI Agent Service
```

---

## ⚡ Quick Tests

### Test Auth Flow
```bash
curl -X POST http://localhost:3014/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Test Listing Creation
```bash
curl -X POST http://localhost:3001/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test Product","price":100}'
```

### Test Search
```bash
curl http://localhost:3023/api/search?q=product
```

---

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check if port is in use
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Check logs
tail -f logs/listing-service.log
```

### Database Connection Error
```bash
# Check PostgreSQL is running
psql --version
pg_isready

# Test connection
psql -h localhost -U postgres
```

### Health Check Fails
```bash
# Restart specific service
kill $(cat logs/listing-service.pid)
cd backend/services/listing-service
npm run dev
```

---

## 📚 Documentation

- **Full Guide**: [INTEGRATION_READINESS_GUIDE.md](INTEGRATION_READINESS_GUIDE.md)
- **Step-by-Step**: [INTEGRATION_STEP_BY_STEP.md](INTEGRATION_STEP_BY_STEP.md)
- **Progress**: [SPRINT_0.2_PROGRESS_UPDATE.md](SPRINT_0.2_PROGRESS_UPDATE.md)
- **Celebration**: [SPRINT_0.2_FINAL_CELEBRATION.md](SPRINT_0.2_FINAL_CELEBRATION.md)

---

## 🎯 Next Steps

### Today
1. ✅ Run master setup script
2. ✅ Verify all services healthy
3. ✅ Test critical endpoints

### This Week
1. Configure API Gateway
2. Run integration tests
3. Deploy to staging

### Next Week
1. Frontend integration
2. End-to-end testing
3. Production deployment

---

## 💡 Pro Tips

- **Logs**: All service logs are in `logs/` directory
- **PIDs**: Process IDs stored in `logs/*.pid` files
- **Restart**: Stop all, then start all for clean restart
- **Debug**: Check logs first, then health endpoints
- **Performance**: Monitor with `htop` or Task Manager

---

**Ready to launch!** 🚀

Run the master setup script and you're good to go!
