# PHASE 4.1 — Control Center Read-Only Integration

## ✅ Implementation Complete

### Files Created

| File | Purpose |
|------|---------|
| `src/services/control-center.service.ts` | Read-only service for finance dashboard |
| `src/controllers/control-center.controller.ts` | REST controller |
| `src/routes/control-center.routes.ts` | Routes (GET only) |

---

## 🔌 Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v2/control-center/wallets` | List all wallets |
| `GET` | `/api/v2/control-center/wallets/:id/snapshot` | Wallet balance snapshot |
| `GET` | `/api/v2/control-center/ledger` | Ledger audit trail |
| `GET` | `/api/v2/control-center/totals` | System total balances |
| `GET` | `/api/v2/control-center/daily-summary` | Daily transaction summary |

**Note:** All endpoints are READ-ONLY (GET method only). No mutation operations.

---

## 📝 Sample JSON Responses

### 1. List All Wallets
```
GET /api/v2/control-center/wallets?ownerType=USER&status=ACTIVE&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "ownerType": "USER",
      "ownerId": "user_12345",
      "currency": "EGP",
      "status": "ACTIVE",
      "balance": "150000",
      "balanceFormatted": "1500.00 ج.م",
      "entryCount": 47,
      "lastActivity": "2026-01-06T17:30:00.000Z",
      "createdAt": "2025-12-01T10:00:00.000Z"
    },
    {
      "id": "a23bc10b-58cc-4372-a567-0e02b2c3d480",
      "ownerType": "USER",
      "ownerId": "user_67890",
      "currency": "EGP",
      "status": "ACTIVE",
      "balance": "75000",
      "balanceFormatted": "750.00 ج.م",
      "entryCount": 23,
      "lastActivity": "2026-01-05T14:20:00.000Z",
      "createdAt": "2025-11-15T08:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1542,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 2. Wallet Balance Snapshot
```
GET /api/v2/control-center/wallets/f47ac10b-58cc-4372-a567-0e02b2c3d479/snapshot
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "ownerType": "USER",
      "ownerId": "user_12345",
      "currency": "EGP",
      "status": "ACTIVE",
      "balance": "150000",
      "balanceFormatted": "1500.00 ج.م",
      "entryCount": 47,
      "lastActivity": "2026-01-06T17:30:00.000Z",
      "createdAt": "2025-12-01T10:00:00.000Z"
    },
    "recentTransactions": [
      {
        "id": "tx-uuid-1",
        "walletId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "walletOwnerType": "USER",
        "walletOwnerId": "user_12345",
        "entryType": "CREDIT",
        "amount": "10000",
        "amountFormatted": "100.00 ج.م",
        "reason": "DEPOSIT",
        "description": "Cash deposit",
        "referenceType": "SYSTEM",
        "referenceId": "deposit_abc123",
        "balanceAfter": "150000",
        "balanceAfterFormatted": "1500.00 ج.م",
        "createdAt": "2026-01-06T17:30:00.000Z",
        "createdBy": "system"
      }
    ],
    "dailyVolume": [
      {
        "date": "2026-01-06",
        "credits": "25000",
        "debits": "15000"
      }
    ]
  }
}
```

---

### 3. Ledger Audit Trail
```
GET /api/v2/control-center/ledger?reason=DEPOSIT&fromDate=2026-01-01&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ledger-uuid-1",
      "walletId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "walletOwnerType": "USER",
      "walletOwnerId": "user_12345",
      "entryType": "CREDIT",
      "amount": "10000",
      "amountFormatted": "100.00 ج.م",
      "reason": "DEPOSIT",
      "description": "Cash deposit at branch",
      "referenceType": "SYSTEM",
      "referenceId": "deposit_abc123",
      "balanceAfter": "150000",
      "balanceAfterFormatted": "1500.00 ج.م",
      "createdAt": "2026-01-06T17:30:00.000Z",
      "createdBy": "teller_001"
    },
    {
      "id": "ledger-uuid-2",
      "walletId": "a23bc10b-58cc-4372-a567-0e02b2c3d480",
      "walletOwnerType": "SELLER",
      "walletOwnerId": "seller_789",
      "entryType": "CREDIT",
      "amount": "50000",
      "amountFormatted": "500.00 ج.م",
      "reason": "DEPOSIT",
      "description": "Bank transfer",
      "referenceType": "MANUAL",
      "referenceId": "bank_ref_xyz",
      "balanceAfter": "250000",
      "balanceAfterFormatted": "2500.00 ج.م",
      "createdAt": "2026-01-06T16:45:00.000Z",
      "createdBy": "admin_002"
    }
  ],
  "pagination": {
    "total": 3456,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 4. System Total Balances
```
GET /api/v2/control-center/totals
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "currency": "EGP",
      "totalWallets": 15420,
      "activeWallets": 14850,
      "frozenWallets": 320,
      "closedWallets": 250,
      "totalBalance": "4567890000",
      "totalBalanceFormatted": "45,678,900.00 ج.م",
      "byOwnerType": [
        {
          "ownerType": "USER",
          "count": 12500,
          "balance": "2500000000",
          "balanceFormatted": "25,000,000.00 ج.م"
        },
        {
          "ownerType": "SELLER",
          "count": 2100,
          "balance": "1800000000",
          "balanceFormatted": "18,000,000.00 ج.م"
        },
        {
          "ownerType": "TRAVELER",
          "count": 800,
          "balance": "250000000",
          "balanceFormatted": "2,500,000.00 ج.م"
        },
        {
          "ownerType": "SYSTEM",
          "count": 20,
          "balance": "17890000",
          "balanceFormatted": "178,900.00 ج.م"
        }
      ]
    }
  ],
  "generatedAt": "2026-01-06T17:40:00.000Z"
}
```

---

### 5. Daily Transaction Summary
```
GET /api/v2/control-center/daily-summary?days=7
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-12-31",
      "totalCredits": "125000000",
      "totalDebits": "98000000",
      "transactionCount": 4520
    },
    {
      "date": "2026-01-01",
      "totalCredits": "85000000",
      "totalDebits": "72000000",
      "transactionCount": 3890
    },
    {
      "date": "2026-01-02",
      "totalCredits": "142000000",
      "totalDebits": "115000000",
      "transactionCount": 5210
    },
    {
      "date": "2026-01-03",
      "totalCredits": "138000000",
      "totalDebits": "121000000",
      "transactionCount": 4980
    },
    {
      "date": "2026-01-04",
      "totalCredits": "95000000",
      "totalDebits": "88000000",
      "transactionCount": 3450
    },
    {
      "date": "2026-01-05",
      "totalCredits": "110000000",
      "totalDebits": "95000000",
      "transactionCount": 4120
    },
    {
      "date": "2026-01-06",
      "totalCredits": "78000000",
      "totalDebits": "62000000",
      "transactionCount": 2890
    }
  ],
  "period": {
    "days": 7,
    "from": "2025-12-31",
    "to": "2026-01-06"
  }
}
```

---

## 📊 Query Parameters

### List Wallets
| Parameter | Type | Description |
|-----------|------|-------------|
| `ownerType` | enum | USER, SELLER, TRAVELER, SYSTEM |
| `status` | enum | ACTIVE, FROZEN, CLOSED |
| `currency` | string | EGP, USD, etc. |
| `search` | string | Search by owner_id |
| `limit` | number | Page size (max: 100) |
| `offset` | number | Page offset |

### Ledger Trail
| Parameter | Type | Description |
|-----------|------|-------------|
| `walletId` | uuid | Filter by wallet |
| `ownerType` | enum | Filter by owner type |
| `entryType` | enum | CREDIT, DEBIT |
| `reason` | enum | DEPOSIT, WITHDRAWAL, etc. |
| `referenceType` | enum | ORDER, ESCROW, etc. |
| `referenceId` | string | Filter by reference |
| `fromDate` | ISO date | Start date |
| `toDate` | ISO date | End date |
| `limit` | number | Page size (max: 100) |
| `offset` | number | Page offset |

---

## 🔧 Recommended Indexes

Add these indexes for optimal Control Center query performance:

```sql
-- Wallet list queries
CREATE INDEX idx_wallet_owner_type_status ON wallet (owner_type, status);
CREATE INDEX idx_wallet_created_at ON wallet (created_at DESC);

-- Ledger trail queries
CREATE INDEX idx_ledger_created_at ON ledger_entry (created_at DESC);
CREATE INDEX idx_ledger_reason_created ON ledger_entry (reason, created_at DESC);
CREATE INDEX idx_ledger_entry_type_created ON ledger_entry (entry_type, created_at DESC);

-- Balance computation (already exists in migration)
CREATE INDEX idx_ledger_wallet_created ON ledger_entry (wallet_id, created_at DESC);

-- Reference lookups
CREATE INDEX idx_ledger_reference ON ledger_entry (reference_type, reference_id);
```

---

## 🔒 Security

- All endpoints require admin authentication (placeholder guard)
- No mutation operations (GET only)
- Query result limits enforced (max 100 per page)
- Sensitive data filtered for dashboard display

---

## 🎯 Integration with Control Center

These endpoints are designed for consumption by `/control-center/finance`:

```typescript
// Frontend service example
const financeApi = {
  listWallets: (filters) => 
    fetch('/api/v2/control-center/wallets?' + new URLSearchParams(filters)),
  
  getWalletSnapshot: (id) => 
    fetch(`/api/v2/control-center/wallets/${id}/snapshot`),
  
  getLedgerTrail: (filters) => 
    fetch('/api/v2/control-center/ledger?' + new URLSearchParams(filters)),
  
  getSystemTotals: () => 
    fetch('/api/v2/control-center/totals'),
  
  getDailySummary: (days = 30) => 
    fetch(`/api/v2/control-center/daily-summary?days=${days}`),
};
```
