# 🚀 QUICK DEPLOYMENT GUIDE

**Status:** ✅ READY FOR DEPLOYMENT  
**Date:** February 18, 2026

---

## ⚡ QUICK START

### 1. Verify Fixes (30 seconds)
```bash
# Windows
powershell -ExecutionPolicy Bypass -File .\scripts\verify-critical-fixes.ps1

# Linux/Mac
bash scripts/verify-critical-fixes.sh
```

### 2. Set Environment Variables (2 minutes)
```bash
# Add to ALL service .env files
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://mnbara.com,https://admin.mnbara.com

# Add to payment-service .env ONLY
WALLET_SERVICE_URL=http://wallet-service:3005
```

### 3. Build Services (5 minutes)
```bash
cd backend/services/payment-service && npm run build
cd backend/services/orders-service && npm run build
cd backend/services/country-layer-service && npm run build
cd backend/services/api-gateway && npm run build
```

### 4. Deploy (1 minute)
```bash
docker-compose restart
```

### 5. Verify (2 minutes)
```bash
# Check all services are up
docker-compose ps

# Test health endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3003/health  # Payment Service
curl http://localhost:3005/health  # Wallet Service
curl http://localhost:3006/health  # Orders Service
```

---

## 🔍 WHAT WAS FIXED

1. **CORS Security** - No more wildcard origins
2. **API Gateway** - No more 502 errors
3. **Wallet Logic** - Single source of truth

---

## 📋 CHECKLIST

- [x] Dependencies installed
- [x] Verification passed
- [ ] Environment variables set
- [ ] Services built
- [ ] Docker containers restarted
- [ ] Health checks pass
- [ ] Integration tests pass

---

## 🆘 TROUBLESHOOTING

### Service Won't Start
```bash
docker-compose logs <service-name>
```

### CORS Errors
Check `.env` file has `ALLOWED_ORIGINS` set correctly

### 502 Errors
Check API Gateway logs:
```bash
docker-compose logs api-gateway
```

### Wallet Errors
Check wallet-service is running:
```bash
curl http://localhost:3005/health
```

---

## 📚 FULL DOCUMENTATION

- [Deployment Ready Summary](DEPLOYMENT_READY_SUMMARY.md)
- [Critical Fixes Completed](CRITICAL_FIXES_COMPLETED.md)
- [Session Complete Summary](SESSION_COMPLETE_SUMMARY.md)

---

**Total Time:** ~10 minutes  
**Difficulty:** Easy  
**Risk:** Low

---

**END OF QUICK GUIDE**
