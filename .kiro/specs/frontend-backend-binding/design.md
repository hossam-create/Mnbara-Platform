# Frontend ↔ Backend Binding — Design Document

**Date**: January 16, 2026  
**Phase**: 7.1 - AI-Ready Architecture Foundation  
**Status**: ACTIVE

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages & Components                                  │   │
│  │  - WalletPage, AuctionPage, OrdersPage, etc.        │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                         │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Service Layer (api.service.ts)                      │   │
│  │  - apiClient (axios instance)                        │   │
│  │  - Request/response interceptors                     │   │
│  │  - Auth token management                             │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                         │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  HTTP Client (axios)                                 │   │
│  │  - Timeout: 30s                                      │   │
│  │  - Retry: 3 attempts                                 │   │
│  │  - Headers: Content-Type, Authorization              │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │ HTTPS
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    API Gateway                               │
│  - Route requests to appropriate services                    │
│  - Rate limiting                                             │
│  - Request validation                                        │
│  - Response transformation                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        │             │             │              │
        ▼             ▼             ▼              ▼
    ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────────┐
    │ Auth   │  │Wallet  │  │Auction │  │ Orders       │
    │Service │  │Service │  │Service │  │ Service      │
    └────────┘  └────────┘  └────────┘  └──────────────┘
        │             │             │              │
        └─────────────┼─────────────┴──────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  PostgreSQL DB   │
            │  - Users         │
            │  - Wallets       │
            │  - Auctions      │
            │  - Orders        │
            │  - Disputes      │
            └──────────────────┘
```

---

## API CLIENT ARCHITECTURE

### Current Implementation (api.service.ts)

```typescript
// 1. Create axios instance with defaults
const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// 2. Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// 4. Export service with organized endpoints
export const apiService = {
  auth: { login, register, logout, ... },
  products: { search, getById, create, ... },
  auctions: { getActive, getById, placeBid, ... },
  // ... more services
};
```

### Improvements Needed

1. **Error Handling**: Add retry logic with exponential backoff
2. **Loading States**: Add request/response tracking
3. **Caching**: Add response caching for GET requests
4. **Validation**: Add request/response schema validation
5. **Logging**: Add request/response logging for debugging

---

## IMPLEMENTATION STRATEGY

### Phase 1: Verify Endpoints (Week 1)

**Goal**: Confirm all backend endpoints exist and return correct data

**Tasks**:
1. Scan all backend services for endpoint definitions
2. Document actual endpoint paths and methods
3. Document request/response schemas
4. Test each endpoint with Postman/curl
5. Update API_INVENTORY.md with findings

**Deliverables**:
- Updated API_INVENTORY.md with verified endpoints
- Postman collection with all endpoints
- Response schema documentation

---

### Phase 2: Implement API Clients (Week 1-2)

**Goal**: Create service-specific API clients

**Structure**:
```
frontend/web-app/src/services/
├── api.service.ts (main axios client)
├── auth.service.ts (auth endpoints)
├── wallet.service.ts (wallet endpoints)
├── auction.service.ts (auction endpoints)
├── orders.service.ts (orders endpoints)
├── cart.service.ts (cart endpoints)
├── disputes.service.ts (disputes endpoints)
├── payment.service.ts (payment endpoints)
├── seller.service.ts (seller endpoints)
├── traveler.service.ts (traveler endpoints)
├── notifications.service.ts (notification endpoints)
└── admin.service.ts (admin endpoints)
```

**Example: wallet.service.ts**
```typescript
import apiService from './api.service';

export const walletService = {
  // Get wallet balance
  getBalance: async (walletId: string) => {
    try {
      const response = await apiService.walletV2.getBalance(walletId);
      return response.data;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      throw error;
    }
  },

  // Get transaction history
  getLedger: async (walletId: string, filters?: any) => {
    try {
      const response = await apiService.walletV2.listLedger(walletId, filters);
      return response.data;
    } catch (error) {
      console.error('Failed to get wallet ledger:', error);
      throw error;
    }
  },

  // Get wallet by owner
  getByOwner: async (ownerType: string, ownerId: string) => {
    try {
      const response = await apiService.walletV2.getByOwner(ownerType, ownerId);
      return response.data;
    } catch (error) {
      console.error('Failed to get wallet:', error);
      throw error;
    }
  },
};
```

---

### Phase 3: Bind Frontend Screens (Week 2)

**Goal**: Replace mock data with real API calls

**Process**:
1. Identify all screens using mock data
2. Replace mock data with API calls
3. Add loading states
4. Add error handling
5. Test with real backend

**Example: WalletPage.tsx**
```typescript
import { useEffect, useState } from 'react';
import { walletService } from '../services/wallet.service';

export const WalletPage = () => {
  const [balance, setBalance] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        const walletId = getUserWalletId(); // Get from auth context
        
        const [balanceData, ledgerData] = await Promise.all([
          walletService.getBalance(walletId),
          walletService.getLedger(walletId),
        ]);
        
        setBalance(balanceData);
        setLedger(ledgerData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch wallet data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <BalanceDisplay balance={balance} />
      <LedgerTable ledger={ledger} />
    </div>
  );
};
```

---

### Phase 4: Add Error Handling (Week 2)

**Goal**: Implement comprehensive error handling

**Error Types**:
1. **Network Errors**: No internet connection
2. **Timeout Errors**: Request took too long
3. **4xx Errors**: Client errors (validation, auth, permissions)
4. **5xx Errors**: Server errors

**Error Handling Strategy**:
```typescript
// 1. Retry logic for transient failures
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 100; // 100ms, 200ms, 400ms
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// 2. User-friendly error messages
const getErrorMessage = (error) => {
  if (error.response?.status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (error.response?.status === 404) {
    return 'The requested resource was not found.';
  }
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please check your connection.';
  }
  return error.message || 'An unexpected error occurred.';
};

// 3. Error logging
const logError = (error, context) => {
  console.error(`[${context}]`, {
    status: error.response?.status,
    message: error.message,
    data: error.response?.data,
    timestamp: new Date().toISOString(),
  });
};
```

---

### Phase 5: Add Loading States (Week 2)

**Goal**: Implement loading indicators for all async operations

**Loading State Patterns**:
```typescript
// 1. Simple loading flag
const [loading, setLoading] = useState(false);

// 2. Loading by operation
const [loadingState, setLoadingState] = useState({
  fetchBalance: false,
  fetchLedger: false,
  submitTransaction: false,
});

// 3. Skeleton loaders
const SkeletonLoader = () => (
  <div className="skeleton">
    <div className="skeleton-line" />
    <div className="skeleton-line" />
    <div className="skeleton-line" />
  </div>
);

// 4. Loading overlay
const LoadingOverlay = ({ visible }) => (
  visible && <div className="loading-overlay"><Spinner /></div>
);
```

---

## DATA FLOW PATTERNS

### Pattern 1: Read-Only Display
```
Component Mount
    ↓
useEffect(() => {
  setLoading(true);
  apiService.get(...)
    .then(data => setData(data))
    .catch(error => setError(error))
    .finally(() => setLoading(false));
}, []);
    ↓
Render: loading ? <Spinner /> : <Display data={data} />
```

### Pattern 2: Form Submission
```
User clicks Submit
    ↓
Form validation
    ↓
setLoading(true);
apiService.post(formData)
    ↓
Success: show confirmation, redirect
Error: show error message, keep form
    ↓
setLoading(false);
```

### Pattern 3: List with Pagination
```
Component Mount
    ↓
useEffect(() => {
  fetchPage(currentPage);
}, [currentPage]);
    ↓
fetchPage(page) {
  setLoading(true);
  apiService.get(..., { page, limit: 20 })
    .then(data => setItems(data.items), setTotal(data.total))
    .finally(() => setLoading(false));
}
    ↓
Render: pagination controls + items
```

### Pattern 4: Real-Time Updates
```
Component Mount
    ↓
WebSocket.connect()
    ↓
WebSocket.on('update', (data) => {
  setData(data);
});
    ↓
Component Unmount
    ↓
WebSocket.disconnect()
```

---

## AUTHENTICATION FLOW

### Token Management
```
1. User logs in
   POST /auth/login { email, password }
   ↓
2. Backend returns JWT token
   { token: "eyJhbGc..." }
   ↓
3. Frontend stores token in localStorage
   localStorage.setItem('authToken', token)
   ↓
4. Frontend includes token in all requests
   Authorization: Bearer eyJhbGc...
   ↓
5. Backend validates token
   ↓
6. If valid: process request
   If invalid: return 401
   ↓
7. Frontend handles 401: redirect to login
```

### Token Refresh
```
1. Token expires (24 hours)
   ↓
2. Backend returns 401 on next request
   ↓
3. Frontend calls POST /auth/refresh
   ↓
4. Backend returns new token
   ↓
5. Frontend stores new token
   ↓
6. Frontend retries original request
```

---

## ERROR HANDLING FLOW

```
API Call
    ↓
Success (2xx)
    ↓
Return data
    ↓
Update UI

API Call
    ↓
Client Error (4xx)
    ↓
401 Unauthorized
    ↓
Redirect to login
    ↓
403 Forbidden
    ↓
Show permission denied
    ↓
404 Not Found
    ↓
Show not found
    ↓
400 Bad Request
    ↓
Show validation error

API Call
    ↓
Server Error (5xx)
    ↓
Retry with backoff
    ↓
Max retries exceeded
    ↓
Show error message

API Call
    ↓
Network Error
    ↓
Retry with backoff
    ↓
Max retries exceeded
    ↓
Show offline message
```

---

## CACHING STRATEGY

### Cache Types

1. **Memory Cache** (in-memory, fast, lost on refresh)
   - User profile
   - Categories
   - Trust score

2. **LocalStorage Cache** (persistent, slower, survives refresh)
   - User preferences
   - Recent searches
   - Saved filters

3. **No Cache** (always fresh)
   - Wallet balance
   - Transaction history
   - Auction bids
   - Orders

### Cache Implementation
```typescript
const cache = new Map();

const getCachedOrFetch = async (key, fetcher, ttl = 5 * 60 * 1000) => {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

// Usage
const userProfile = await getCachedOrFetch(
  'user-profile',
  () => apiService.users.getProfile(),
  10 * 60 * 1000 // 10 minutes
);
```

---

## RESPONSE SCHEMA EXAMPLES

### Wallet Balance Response
```json
{
  "success": true,
  "data": {
    "walletId": "wallet_123",
    "ownerId": "user_456",
    "ownerType": "USER",
    "currency": "USD",
    "balance": 1500.50,
    "available": 1500.50,
    "reserved": 0,
    "lastUpdated": "2026-01-16T10:30:00Z"
  }
}
```

### Auction List Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "auctionId": "auction_123",
        "title": "Vintage Watch",
        "description": "...",
        "currentBid": 150.00,
        "bidCount": 5,
        "endsAt": "2026-01-20T10:00:00Z",
        "status": "ACTIVE",
        "seller": { "id": "user_789", "name": "John Doe" }
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid bid amount",
    "details": [
      {
        "field": "amount",
        "message": "Bid must be higher than current bid"
      }
    ]
  }
}
```

---

## TESTING STRATEGY

### Unit Tests
- Test API service methods
- Test error handling
- Test retry logic
- Test caching

### Integration Tests
- Test frontend-backend communication
- Test authentication flow
- Test error scenarios
- Test loading states

### E2E Tests
- Test complete user workflows
- Test with real backend
- Test performance
- Test error recovery

---

## PERFORMANCE TARGETS

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p95) | ≤ 2s | TBD |
| Frontend Load Time | ≤ 3s | TBD |
| Time to Interactive | ≤ 5s | TBD |
| Cache Hit Rate | ≥ 80% | TBD |
| Error Rate | ≤ 0.1% | TBD |

---

## SECURITY CONSIDERATIONS

### Data Protection
- ✅ No PII in URLs
- ✅ All sensitive data in request body
- ✅ HTTPS required
- ✅ Auth token in Authorization header

### Access Control
- ✅ All protected endpoints require auth
- ✅ User can only access their own data
- ✅ Admin endpoints require admin role
- ✅ Rate limiting enforced

### Compliance
- ✅ GDPR compliant
- ✅ SOC 2 compliant
- ✅ Audit trail maintained
- ✅ Data retention policies enforced

---

## DEPLOYMENT STRATEGY

### Development
- API_BASE_URL: http://localhost:8080
- Services running locally

### Staging
- API_BASE_URL: https://api-staging.mnbara.com
- Services running on staging servers

### Production
- API_BASE_URL: https://api.mnbara.com
- Services running on production servers
- HTTPS required
- Rate limiting enabled
- Monitoring enabled

---

## MONITORING & OBSERVABILITY

### Metrics to Track
- API response time
- Error rate
- Cache hit rate
- Request volume
- User activity

### Logging
- All API calls logged
- All errors logged with context
- All user actions logged
- Audit trail maintained

### Alerting
- API response time > 5s
- Error rate > 1%
- Service unavailable
- Authentication failures

---

## ROLLBACK STRATEGY

If issues occur:
1. Revert to previous version
2. Restore from backup
3. Notify users
4. Investigate root cause
5. Fix and redeploy

---

## CONCLUSION

This design provides a comprehensive approach to binding the frontend to the backend services. The implementation will be done in phases, starting with endpoint verification, then API client implementation, then frontend binding, and finally error handling and optimization.

**Status**: ✅ READY FOR IMPLEMENTATION

