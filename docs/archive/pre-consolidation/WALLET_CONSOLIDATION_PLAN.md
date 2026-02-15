# Consolidated Wallet Service Implementation Plan

## Current State Analysis

### internal-ledger-service (Advanced Features)
- ✅ Double-entry bookkeeping
- ✅ Settlement processing with fees
- ✅ Matching algorithm (buy/sell orders)
- ✅ Compliance/AML integration
- ✅ Audit trail
- ✅ Transaction rollback
- ✅ Payout system

### wallet-service (Multi-currency Features)
- ✅ Multi-currency wallets (USD, EUR, GBP, SAR, AED, EGP, JPY, CNY, INR, TRY)
- ✅ Auto-conversion between currencies
- ✅ Forex hedging
- ✅ Transfer between users
- ✅ Transaction limits
- ✅ Biometric authentication
- ✅ Ledger-first architecture (Phase 4)

## Consolidation Strategy

### Phase 1: Create Unified Service
Create a new `unified-wallet-service` that combines both functionalities:

```
backend/services/unified-wallet-service/
├── src/
│   ├── services/
│   │   ├── wallet.service.ts        // Multi-currency wallet (from wallet-service)
│   │   ├── ledger.service.ts        // Double-entry ledger (from internal-ledger-service)
│   │   ├── settlement.service.ts    // Settlement with fees (from internal-ledger-service)
│   │   ├── matching.service.ts      // Buy/sell matching (from internal-ledger-service)
│   │   ├── compliance.service.ts    // AML/KYC (from internal-ledger-service)
│   │   ├── conversion.service.ts  // Currency conversion (from wallet-service)
│   │   ├── hedging.service.ts     // Forex hedging (from wallet-service)
│   │   ├── transfer.service.ts    // User transfers (from wallet-service)
│   │   ├── payout.service.ts      // Withdrawals (from internal-ledger-service)
│   │   └── audit.service.ts       // Audit trail (from internal-ledger-service)
│   ├── controllers/
│   ├── routes/
│   ├── types/
│   └── index.ts
├── prisma/
│   └── schema.prisma  // Combined schema
└── package.json
```

### Phase 2: Database Schema Consolidation
Combine the database schemas:

```prisma
// Unified Wallet Schema (Key Tables)
model Wallet {
  // From wallet-service
  id              String   @id @default(uuid())
  userId          String   @unique
  primaryCurrency String   @default("USD")
  isActive        Boolean  @default(true)
  isVerified      Boolean  @default(false)
  kycLevel        Int      @default(0)
  dailyLimit      Decimal  @default(1000)
  monthlyLimit    Decimal  @default(10000)
  
  // Relations
  balances        WalletBalance[]
  transactions    WalletTransaction[]
  ledgerEntries   LedgerEntry[]      // From internal-ledger-service
  settlements     Settlement[]       // From internal-ledger-service
  auditLogs       AuditLog[]         // From internal-ledger-service
}

model LedgerEntry {
  // From internal-ledger-service
  id              String   @id @default(uuid())
  transactionId   String
  description     String
  debitAccountId  String
  creditAccountId String
  amount          Decimal  @db.Decimal(10,2)
  currency        String
  entryType       String   // DEBIT or CREDIT
  createdAt       DateTime @default(now())
}

model Settlement {
  // Combined settlement with multi-currency support
  id              String   @id @default(uuid())
  fromUserId      String
  toUserId        String
  amount          Decimal  @db.Decimal(10,2)
  currency        String
  referenceType   String
  referenceId     String
  description     String
  fees            Json     // Platform and processing fees
  netAmount       Decimal  @db.Decimal(10,2)
  status          String   @default("PENDING")
  createdAt       DateTime @default(now())
}
```

### Phase 3: API Consolidation
Create unified API endpoints:

```typescript
// Unified API Routes
app.use('/api/wallets', walletRoutes);           // Multi-currency operations
app.use('/api/ledger', ledgerRoutes);            // Double-entry operations
app.use('/api/settlements', settlementRoutes);   // Settlement with fees
app.use('/api/transfers', transferRoutes);       // User transfers
app.use('/api/conversions', conversionRoutes);   // Currency conversion
app.use('/api/payouts', payoutRoutes);         // Withdrawals
app.use('/api/compliance', complianceRoutes);    // AML/KYC
```

## Implementation Steps

### Step 1: Service Creation
```bash
# Create new unified service
mkdir backend/services/unified-wallet-service
cd backend/services/unified-wallet-service

# Initialize with package.json from both services
# Combine dependencies from both package.json files
```

### Step 2: Schema Migration
```bash
# Create combined Prisma schema
# Run migration to create unified database
npm run prisma:migrate
```

### Step 3: Service Logic Migration
```bash
# Copy and consolidate service logic
# Update imports and dependencies
# Ensure no breaking changes to existing APIs
```

### Step 4: Testing & Validation
```bash
# Run comprehensive tests
# Validate all existing functionality works
# Performance testing
```

### Step 5: Service Switchover
```bash
# Update service discovery/registry
# Redirect traffic to unified service
# Monitor for issues
# Decommission old services
```

## Benefits of Consolidation

1. **Single Source of Truth**: One service for all wallet operations
2. **Reduced Complexity**: No more inter-service communication for related operations
3. **Better Performance**: Eliminates network overhead between services
4. **Easier Maintenance**: Single codebase to maintain
5. **Consistent API**: Unified interface for all wallet operations
6. **Enhanced Features**: Multi-currency support with advanced ledger features

## Risk Mitigation

1. **Backward Compatibility**: Maintain existing API endpoints
2. **Gradual Migration**: Phase-wise approach
3. **Rollback Plan**: Keep old services running during transition
4. **Data Integrity**: Careful database migration with backups
5. **Testing**: Comprehensive testing before switchover

## Timeline: 1-2 weeks

**Week 1**: Service creation, schema consolidation, basic functionality  
**Week 2**: Testing, validation, deployment, switchover