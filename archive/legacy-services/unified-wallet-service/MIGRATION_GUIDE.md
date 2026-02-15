# 🏦 Unified Wallet Service - Migration Guide

## 📋 Overview

This guide provides step-by-step instructions for migrating from the existing wallet services (wallet-service and internal-ledger-service) to the new **Unified Wallet Service**. The consolidation combines multi-currency wallet functionality with double-entry ledger accounting, compliance checks, and advanced features like escrow and currency conversion.

## 🎯 Migration Strategy

### Phase 1: Preparation (1-2 days)
1. **Backup existing data** from both services
2. **Set up new infrastructure** (database, Redis, monitoring)
3. **Deploy unified service** in parallel with existing services
4. **Configure data migration** tools

### Phase 2: Data Migration (1 day)
1. **Migrate user accounts** and wallet data
2. **Migrate transaction history** and ledger entries
3. **Migrate compliance data** and settings
4. **Validate data integrity**

### Phase 3: Service Cutover (1 day)
1. **Update API Gateway** routing
2. **Switch traffic** to new service
3. **Monitor performance** and errors
4. **Rollback plan** ready if needed

## 🚀 Quick Start

### 1. Deploy Unified Wallet Service

```bash
# Clone and setup
git clone <repository>
cd backend/services/unified-wallet-service

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate deploy

# Build and start
npm run build
npm start
```

### 2. Verify Service Health

```bash
# Check health endpoint
curl http://localhost:3016/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

## 📊 Data Migration

### Step 1: Migrate from wallet-service

```bash
# Start migration (requires admin authentication)
curl -X POST http://localhost:3016/api/migrate/wallet-service \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Monitor progress
# Check logs for migration status
```

### Step 2: Migrate from internal-ledger-service

```bash
# Start migration
curl -X POST http://localhost:3016/api/migrate/internal-ledger-service \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 3: Validate Migration

```bash
# Run validation
curl -X GET http://localhost:3016/api/migrate/validate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected response:
{
  "success": true,
  "data": {
    "valid": true,
    "issues": []
  }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3016
DATABASE_URL=postgresql://user:pass@host:5434/unified_wallet_db
REDIS_URL=redis://localhost:6381
JWT_SECRET=your_jwt_secret_here

# Fee Structure
PLATFORM_FEE_PERCENT=2.5
PROCESSING_FEE_PERCENT=1.5
CONVERSION_FEE_PERCENT=1.0
MINIMUM_FEE_USD=0.50

# Supported Currencies
SUPPORTED_CURRENCIES=USD,EUR,GBP,SAR,AED,EGP,JPY,CNY,INR,TRY

# Transaction Limits
DEFAULT_DAILY_LIMIT=10000
DEFAULT_MONTHLY_LIMIT=100000
DEFAULT_YEARLY_LIMIT=1000000
DEFAULT_PER_TRANSACTION_LIMIT=5000

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
MULTI_CURRENCY_ENABLED=true
AUTO_CONVERSION_ENABLED=true
ESCROW_ENABLED=true
PAYOUTS_ENABLED=true
COMPLIANCE_CHECKS_ENABLED=true
```

## 🏗️ API Changes

### Old wallet-service endpoints:
- `POST /api/wallets/create` → `POST /api/wallets`
- `GET /api/wallets/balance/:id` → `GET /api/wallets/:walletId/balance`
- `POST /api/wallets/deposit` → `POST /api/wallets/:walletId/deposit`
- `POST /api/wallets/withdraw` → `POST /api/wallets/:walletId/withdraw`

### Old internal-ledger-service endpoints:
- `POST /api/ledger/settle` → `POST /api/settlements`
- `POST /api/ledger/escrow/create` → `POST /api/escrow`
- `POST /api/ledger/escrow/release` → `POST /api/escrow/:escrowId/release`

### New unified endpoints:
- `POST /api/wallets` - Create wallet
- `GET /api/wallets` - List user wallets
- `GET /api/wallets/:walletId/balance` - Get wallet balance
- `POST /api/wallets/:walletId/deposit` - Deposit funds
- `POST /api/wallets/:walletId/withdraw` - Withdraw funds
- `POST /api/wallets/transfer` - Transfer between wallets
- `POST /api/wallets/convert` - Currency conversion
- `POST /api/settlements` - Create settlement
- `POST /api/escrow` - Create escrow
- `POST /api/escrow/:escrowId/release` - Release escrow
- `GET /api/wallets/:walletId/ledger` - Get ledger entries

## 📈 Performance Monitoring

### Key Metrics to Monitor

1. **Response Times**
   - Wallet creation: < 200ms
   - Balance queries: < 50ms
   - Transfers: < 500ms
   - Settlements: < 1s

2. **Error Rates**
   - Overall error rate: < 1%
   - Timeout errors: < 0.1%
   - Database errors: < 0.01%

3. **Throughput**
   - Transactions per second
   - Concurrent users
   - Peak load handling

### Health Checks

```bash
# Service health
curl http://localhost:3016/health

# Database health
curl http://localhost:3016/health/database

# Redis health
curl http://localhost:3016/health/redis
```

## 🔄 Rollback Procedure

If migration fails or issues arise:

### 1. Stop Unified Service
```bash
# Stop the service
docker-compose down
```

### 2. Rollback Data Migration
```bash
# Rollback migration
curl -X POST http://localhost:3016/api/migrate/rollback \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Update API Gateway
- Route traffic back to original services
- Verify all endpoints are working

### 4. Monitor Original Services
- Ensure they're handling load properly
- Check for any data inconsistencies

## 🐛 Troubleshooting

### Common Issues

#### 1. Migration Fails with "Data Integrity Error"
**Cause**: Duplicate entries or constraint violations
**Solution**: 
- Check migration logs for specific errors
- Clean up duplicate data in source databases
- Run migration with `--force` flag if appropriate

#### 2. Balance Mismatches After Migration
**Cause**: Transaction timing or missing entries
**Solution**:
- Run balance reconciliation script
- Verify all ledger entries are migrated
- Check for pending transactions

#### 3. Performance Degradation
**Cause**: Database indexing or query optimization
**Solution**:
- Check database query performance
- Verify indexes are created properly
- Monitor connection pool usage

#### 4. Currency Conversion Errors
**Cause**: Missing exchange rates or configuration
**Solution**:
- Verify exchange rate service is accessible
- Check currency configuration
- Test conversion with small amounts first

### Debug Commands

```bash
# Check service logs
docker logs unified-wallet-service

# Check database connections
docker exec unified-wallet-postgres pg_isready -U unified_wallet_user

# Check Redis connectivity
docker exec unified-wallet-redis redis-cli ping

# Validate data consistency
curl -X GET http://localhost:3016/api/migrate/validate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📚 Additional Resources

### Documentation
- [API Reference](./API_REFERENCE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Security Guidelines](./SECURITY.md)
- [Performance Tuning](./PERFORMANCE.md)

### Support
- **Technical Issues**: Create GitHub issue
- **Migration Support**: Contact migration team
- **Emergency**: Call +1-XXX-XXX-XXXX

### Tools
- **Migration Validator**: Built-in validation tools
- **Performance Profiler**: Database query analysis
- **Health Monitor**: Real-time service monitoring

## ✅ Migration Checklist

### Pre-Migration
- [ ] Backup all existing data
- [ ] Verify new service deployment
- [ ] Test migration scripts
- [ ] Prepare rollback plan
- [ ] Notify stakeholders

### During Migration
- [ ] Monitor service health
- [ ] Check data integrity
- [ ] Validate API responses
- [ ] Test critical workflows
- [ ] Monitor error rates

### Post-Migration
- [ ] Validate all data migrated
- [ ] Test all user workflows
- [ ] Monitor performance metrics
- [ ] Update documentation
- [ ] Archive old services

## 🎉 Success Criteria

Migration is considered successful when:

1. ✅ **All data migrated** without loss or corruption
2. ✅ **All APIs working** with same or better performance
3. ✅ **No critical errors** for 24 hours post-migration
4. ✅ **User workflows** functioning normally
5. ✅ **Performance metrics** meet or exceed previous levels
6. ✅ **Security compliance** maintained throughout

---

**Estimated Total Migration Time**: 3-4 days  
**Risk Level**: Medium  
**Rollback Time**: 30 minutes  
**Support Team**: Available 24/7 during migration

For questions or issues during migration, contact the migration team immediately.