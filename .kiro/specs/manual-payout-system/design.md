# Manual Payout System - Design Document

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Frontend       │
│  (Next.js)      │
│  - Dashboard    │
│  - User Portal  │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────┐
│  API Gateway    │
│  - Auth         │
│  - Rate Limit   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Internal Ledger Service        │
│  - Payout Service               │
│  - Wallet Service               │
│  - Escrow Service               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  - Wallets      │
│  - Transactions │
│  - Payouts      │
└─────────────────┘
```

## Database Design

### Schema: payout_requests

```sql
CREATE TABLE payout_requests (
  id VARCHAR(36) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  wallet_id INTEGER NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL,
  method VARCHAR(30) NOT NULL,
  account_details TEXT NOT NULL, -- Encrypted JSON
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  rejected_at TIMESTAMP,
  processed_by_admin_id INTEGER,
  approved_by_admin_id INTEGER,
  rejected_by_admin_id INTEGER,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id),
  CONSTRAINT chk_amount CHECK (amount >= 10),
  CONSTRAINT chk_status CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'))
);

CREATE INDEX idx_payout_user_id ON payout_requests(user_id);
CREATE INDEX idx_payout_status ON payout_requests(status);
CREATE INDEX idx_payout_requested_at ON payout_requests(requested_at);
CREATE INDEX idx_payout_wallet_id ON payout_requests(wallet_id);
```

### Enums

```typescript
enum PayoutStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

enum PayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL',
  STRIPE_TRANSFER = 'STRIPE_TRANSFER'
}
```

## State Machine

### Payout Status Flow

```
                    ┌─────────┐
                    │ PENDING │
                    └────┬────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        ┌──────────┐          ┌──────────┐
        │ APPROVED │          │ REJECTED │
        └────┬─────┘          └──────────┘
             │                      (END)
             ▼
      ┌────────────┐
      │ PROCESSING │
      └─────┬──────┘
            │
            ▼
      ┌───────────┐
      │ COMPLETED │
      └───────────┘
           (END)
```

### Valid Transitions

| From       | To         | Trigger              | Actor |
|------------|------------|----------------------|-------|
| PENDING    | APPROVED   | Admin approval       | Admin |
| PENDING    | REJECTED   | Admin rejection      | Admin |
| APPROVED   | PROCESSING | Admin starts process | Admin |
| PROCESSING | COMPLETED  | Admin confirms done  | Admin |

### Invalid Transitions

- Cannot approve/reject after approval
- Cannot go back to PENDING
- Cannot skip APPROVED or PROCESSING states
- Cannot complete without processing

## API Design

### User Endpoints

#### POST /api/payouts/request
Create a new payout request.

**Request:**
```typescript
{
  walletId: number;
  amount: number;
  currency: string;
  method: PayoutMethod;
  accountDetails: BankAccountDetails | PayPalAccountDetails | StripeAccountDetails;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: string;
    userId: number;
    walletId: number;
    amount: number;
    currency: string;
    status: PayoutStatus;
    method: PayoutMethod;
    requestedAt: string;
  }
}
```

**Business Logic:**
1. Validate user is authenticated
2. Validate user is verified (KYC)
3. Validate amount >= minimum ($10)
4. Validate 2FA if amount > $500
5. Validate wallet belongs to user
6. Validate sufficient available balance
7. Encrypt account details
8. Start database transaction
9. Lock funds in wallet
10. Create payout record
11. Commit transaction
12. Return payout details

#### GET /api/payouts/my-requests
Get user's payout requests.

**Query Parameters:**
- status?: PayoutStatus
- limit?: number (default: 20)
- offset?: number (default: 0)

**Response:**
```typescript
{
  success: boolean;
  data: PayoutRequest[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  }
}
```

#### GET /api/payouts/:id
Get specific payout request details.

**Response:**
```typescript
{
  success: boolean;
  data: PayoutRequest; // Without decrypted account details
}
```

### Admin Endpoints

#### GET /api/admin/payouts/pending
Get all pending payout requests.

**Query Parameters:**
- minAmount?: number
- maxAmount?: number
- limit?: number (default: 50)

**Response:**
```typescript
{
  success: boolean;
  data: PayoutRequest[];
}
```

#### GET /api/admin/payouts/:id
Get payout details with decrypted account information.

**Response:**
```typescript
{
  success: boolean;
  data: {
    ...PayoutRequest;
    accountDetails: DecryptedAccountDetails;
    user: {
      id: number;
      name: string;
      email: string;
      verified: boolean;
    };
    wallet: {
      id: number;
      balance: number;
      lockedBalance: number;
    };
  }
}
```

#### POST /api/admin/payouts/:id/approve
Approve a pending payout.

**Response:**
```typescript
{
  success: boolean;
  data: PayoutRequest;
}
```

**Business Logic:**
1. Validate admin authentication
2. Validate payout exists
3. Validate status is PENDING
4. Update status to APPROVED
5. Record admin ID and timestamp
6. Return updated payout

#### POST /api/admin/payouts/:id/reject
Reject a pending payout.

**Request:**
```typescript
{
  rejectionReason: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: PayoutRequest;
}
```

**Business Logic:**
1. Validate admin authentication
2. Validate payout exists
3. Validate status is PENDING
4. Validate rejection reason provided
5. Start database transaction
6. Update status to REJECTED
7. Unlock funds in wallet
8. Record admin ID, reason, and timestamp
9. Commit transaction
10. Return updated payout

#### POST /api/admin/payouts/:id/process
Mark payout as processing.

**Response:**
```typescript
{
  success: boolean;
  data: PayoutRequest;
}
```

**Business Logic:**
1. Validate admin authentication
2. Validate payout exists
3. Validate status is APPROVED
4. Update status to PROCESSING
5. Record admin ID and timestamp
6. Return updated payout

#### POST /api/admin/payouts/:id/complete
Complete a payout.

**Request:**
```typescript
{
  notes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: PayoutRequest;
}
```

**Business Logic:**
1. Validate admin authentication
2. Validate payout exists
3. Validate status is PROCESSING
4. Start database transaction
5. Update status to COMPLETED
6. Deduct locked funds from wallet
7. Record admin ID, notes, and timestamp
8. Commit transaction
9. Return updated payout

#### GET /api/admin/payouts/stats
Get payout statistics.

**Response:**
```typescript
{
  success: boolean;
  data: {
    pendingAmount: number;
    pendingCount: number;
    approvedToday: number;
    completedThisWeek: number;
    totalProcessed: number;
  }
}
```

## Service Layer Design

### PayoutService

```typescript
class PayoutService {
  // User operations
  async createPayoutRequest(
    userId: number,
    walletId: number,
    amount: number,
    currency: string,
    method: PayoutMethod,
    accountDetails: AccountDetails,
    twoFactorToken?: string
  ): Promise<PayoutRequest>;

  async getUserPayouts(
    userId: number,
    filters: PayoutFilters
  ): Promise<PayoutRequest[]>;

  async getPayoutById(
    payoutId: string,
    userId: number
  ): Promise<PayoutRequest>;

  // Admin operations
  async getPendingPayouts(
    filters: AdminPayoutFilters
  ): Promise<PayoutRequest[]>;

  async getPayoutDetailsForAdmin(
    payoutId: string
  ): Promise<PayoutRequestWithDetails>;

  async approvePayout(
    payoutId: string,
    adminId: number
  ): Promise<PayoutRequest>;

  async rejectPayout(
    payoutId: string,
    adminId: number,
    rejectionReason: string
  ): Promise<PayoutRequest>;

  async markAsProcessing(
    payoutId: string,
    adminId: number
  ): Promise<PayoutRequest>;

  async completePayout(
    payoutId: string,
    adminId: number,
    notes?: string
  ): Promise<PayoutRequest>;

  async getPayoutStats(): Promise<PayoutStats>;

  // Internal helpers
  private encryptAccountDetails(details: AccountDetails): string;
  private decryptAccountDetails(encrypted: string): AccountDetails;
  private validateStatusTransition(from: PayoutStatus, to: PayoutStatus): void;
  private lockFunds(walletId: number, amount: number): Promise<void>;
  private unlockFunds(walletId: number, amount: number): Promise<void>;
  private deductFunds(walletId: number, amount: number): Promise<void>;
}
```

### WalletService Integration

```typescript
class WalletService {
  async lockBalance(
    walletId: number,
    amount: Decimal,
    referenceId: string,
    referenceType: string
  ): Promise<void> {
    // Atomic operation to lock funds
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
        select: { balance: true, lockedBalance: true }
      });

      if (!wallet) {
        throw new WalletNotFoundError(walletId);
      }

      if (wallet.balance.lessThan(amount)) {
        throw new InsufficientBalanceError(wallet.balance, amount);
      }

      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { decrement: amount },
          lockedBalance: { increment: amount }
        }
      });

      await tx.transaction.create({
        data: {
          walletId,
          amount: amount.negated(),
          type: 'LOCK',
          status: 'COMPLETED',
          referenceId,
          referenceType
        }
      });
    });
  }

  async unlockBalance(
    walletId: number,
    amount: Decimal,
    referenceId: string,
    referenceType: string
  ): Promise<void> {
    // Atomic operation to unlock funds
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: amount },
          lockedBalance: { decrement: amount }
        }
      });

      await tx.transaction.create({
        data: {
          walletId,
          amount,
          type: 'UNLOCK',
          status: 'COMPLETED',
          referenceId,
          referenceType
        }
      });
    });
  }

  async deductLockedBalance(
    walletId: number,
    amount: Decimal,
    referenceId: string,
    referenceType: string
  ): Promise<void> {
    // Atomic operation to deduct locked funds
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          lockedBalance: { decrement: amount }
        }
      });

      await tx.transaction.create({
        data: {
          walletId,
          amount: amount.negated(),
          type: 'PAYOUT',
          status: 'COMPLETED',
          referenceId,
          referenceType
        }
      });
    });
  }
}
```

## Security Design

### Encryption

**Algorithm:** AES-256-CBC

**Implementation:**
```typescript
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor() {
    const keyHex = process.env.PAYOUT_ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('Invalid encryption key');
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(data: object): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    const text = JSON.stringify(data);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData: string): object {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}
```

### Authentication & Authorization

**JWT Token Structure:**
```typescript
{
  userId: number;
  email: string;
  role: 'USER' | 'ADMIN';
  verified: boolean;
  iat: number;
  exp: number;
}
```

**Middleware:**
```typescript
// Authentication middleware
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin authorization middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Verification middleware
function requireVerified(req, res, next) {
  if (!req.user.verified) {
    return res.status(403).json({ 
      error: 'User verification required. Please complete KYC verification.' 
    });
  }
  next();
}

// 2FA middleware
function require2FA(req, res, next) {
  const amount = parseFloat(req.body.amount);
  const threshold = parseFloat(process.env.HIGH_VALUE_THRESHOLD || '500');
  
  if (amount > threshold) {
    const token = req.headers['x-2fa-token'];
    if (!token || !validate2FAToken(req.user.userId, token)) {
      return res.status(403).json({ 
        error: 'Two-factor authentication required for payouts over $500' 
      });
    }
  }
  next();
}
```

## Frontend Design

### Component Architecture

```
PayoutDashboard (Container)
├── PayoutStatsCards (Presentation)
│   ├── StatCard (Pending Amount)
│   ├── StatCard (Approved Today)
│   ├── StatCard (Completed This Week)
│   └── StatCard (Total Processed)
├── PayoutFiltersBar (Presentation)
│   ├── SearchInput
│   ├── StatusDropdown
│   ├── MethodDropdown
│   └── AdvancedFilters (Collapsible)
│       ├── DateRangePicker
│       └── AmountRangeInputs
├── PayoutTable (Presentation)
│   ├── TableHeader (Sortable)
│   ├── TableBody
│   │   └── TableRow[]
│   │       ├── UserCell (Avatar + Name + Email + Badge)
│   │       ├── AmountCell
│   │       ├── StatusBadge
│   │       ├── MethodCell
│   │       ├── DateCell
│   │       └── ActionsCell
│   └── Pagination
└── PayoutDetailsModal (Presentation)
    ├── UserInfoSection
    ├── PayoutDetailsSection
    ├── AccountDetailsSection (Decrypted)
    ├── WalletHistorySection
    ├── NotesSection
    └── ActionsSection
        ├── ApproveButton
        ├── RejectForm
        ├── ProcessButton
        └── CompleteForm
```

### State Management

**React Query for Server State:**
```typescript
// Queries
const { data: payouts } = usePayouts(filters);
const { data: stats } = usePayoutStats();
const { data: details } = usePayoutDetails(payoutId);
const { data: history } = useUserWalletHistory(userId);

// Mutations
const approveMutation = useApprovePayout();
const rejectMutation = useRejectPayout();
const processMutation = useMarkAsProcessing();
const completeMutation = useCompletePayout();
```

**Local State for UI:**
```typescript
const [filters, setFilters] = useState<PayoutFilters>({
  status: undefined,
  method: undefined,
  search: '',
  dateFrom: undefined,
  dateTo: undefined,
  minAmount: undefined,
  maxAmount: undefined
});

const [selectedPayout, setSelectedPayout] = useState<string | null>(null);
const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
```

### Styling System

**Tailwind CSS Classes:**
```typescript
// Status badge colors
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

// Stat card colors
const statCardColors = {
  pending: 'bg-yellow-50 border-yellow-200',
  approved: 'bg-green-50 border-green-200',
  completed: 'bg-blue-50 border-blue-200',
  total: 'bg-purple-50 border-purple-200'
};
```

## Error Handling

### Custom Error Classes

```typescript
class PayoutError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PayoutError';
  }
}

class InsufficientBalanceError extends PayoutError {
  constructor(available: Decimal, requested: Decimal) {
    super(
      `Insufficient balance. Available: ${available}, Requested: ${requested}`,
      'INSUFFICIENT_BALANCE'
    );
  }
}

class InvalidStatusTransitionError extends PayoutError {
  constructor(from: PayoutStatus, to: PayoutStatus) {
    super(
      `Invalid status transition from ${from} to ${to}`,
      'INVALID_STATUS_TRANSITION'
    );
  }
}

class UserNotVerifiedError extends PayoutError {
  constructor() {
    super(
      'User verification required. Please complete KYC verification.',
      'USER_NOT_VERIFIED'
    );
  }
}

class TwoFactorRequiredError extends PayoutError {
  constructor() {
    super(
      'Two-factor authentication required for payouts over $500',
      'TWO_FACTOR_REQUIRED'
    );
  }
}
```

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

## Logging and Monitoring

### Log Levels

```typescript
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}
```

### Log Events

```typescript
// Payout created
logger.info('Payout request created', {
  payoutId,
  userId,
  amount,
  method,
  timestamp: new Date()
});

// Status changed
logger.info('Payout status changed', {
  payoutId,
  from: oldStatus,
  to: newStatus,
  adminId,
  timestamp: new Date()
});

// Funds locked
logger.info('Funds locked for payout', {
  payoutId,
  walletId,
  amount,
  timestamp: new Date()
});

// Error occurred
logger.error('Payout creation failed', {
  userId,
  amount,
  error: error.message,
  stack: error.stack,
  timestamp: new Date()
});
```

### Metrics to Track

- Total payouts created per day
- Average approval time
- Rejection rate
- Completion rate
- Average payout amount
- High-value payout count (>$500)
- Failed payout attempts
- Fund locking failures

## Testing Strategy

### Unit Tests

**PayoutService Tests:**
- ✅ Create payout with valid data
- ✅ Reject payout below minimum amount
- ✅ Reject payout with insufficient balance
- ✅ Reject payout for unverified user
- ✅ Require 2FA for high-value payouts
- ✅ Encrypt account details correctly
- ✅ Decrypt account details correctly
- ✅ Validate status transitions
- ✅ Lock funds on payout creation
- ✅ Unlock funds on rejection
- ✅ Deduct funds on completion

**WalletService Tests:**
- ✅ Lock balance atomically
- ✅ Unlock balance atomically
- ✅ Deduct locked balance atomically
- ✅ Handle concurrent operations
- ✅ Rollback on errors

### Integration Tests

**Complete Workflows:**
- ✅ Success path: Request → Approve → Process → Complete
- ✅ Rejection path: Request → Reject
- ✅ Multiple concurrent payouts
- ✅ Fund locking and unlocking
- ✅ Admin filtering and retrieval
- ✅ Statistics calculation

### Frontend Tests

**Component Tests:**
- ✅ PayoutTable renders correctly
- ✅ Filters work correctly
- ✅ Modal opens and closes
- ✅ Status badges display correct colors
- ✅ Action buttons show based on status

**Integration Tests:**
- ✅ Complete approval workflow
- ✅ Complete rejection workflow
- ✅ Real-time updates work
- ✅ Error handling displays correctly

## Performance Optimization

### Database Optimization

**Indexes:**
```sql
CREATE INDEX idx_payout_user_id ON payout_requests(user_id);
CREATE INDEX idx_payout_status ON payout_requests(status);
CREATE INDEX idx_payout_requested_at ON payout_requests(requested_at);
CREATE INDEX idx_payout_wallet_id ON payout_requests(wallet_id);
```

**Query Optimization:**
- Use SELECT only needed columns
- Use pagination for large result sets
- Use database transactions for atomic operations
- Use connection pooling

### Frontend Optimization

**React Query Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
```

**Component Optimization:**
- Use React.memo for expensive components
- Use useMemo for expensive calculations
- Use useCallback for event handlers
- Lazy load modal component
- Virtualize large tables if needed

## Deployment Considerations

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
PAYOUT_ENCRYPTION_KEY=64-character-hex-string
JWT_SECRET=your-jwt-secret

# Optional
MIN_PAYOUT_AMOUNT=10
HIGH_VALUE_THRESHOLD=500
PORT=3010
NODE_ENV=production
```

### Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: 'connected'
  });
});
```

## Future Enhancements

### Phase 2: Automation
- Automated payouts for trusted users
- Batch payout processing
- Scheduled payouts
- Webhook notifications

### Phase 3: Advanced Features
- Multi-currency support
- Real-time status updates via WebSocket
- Fraud detection integration
- Machine learning for approval recommendations

### Phase 4: Analytics
- Payout analytics dashboard
- Trend analysis
- Anomaly detection
- Predictive modeling

---

**Document Version:** 1.0.0
**Last Updated:** January 24, 2026
**Status:** Implemented
