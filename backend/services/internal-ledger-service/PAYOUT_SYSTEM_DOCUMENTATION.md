# Manual Payout System Documentation

## Overview

The Manual Payout System allows travelers to withdraw funds from their wallets through a secure, admin-approved process. All payouts are processed manually by administrators to ensure security and compliance.

## Features

- ✅ Secure payout requests with encrypted account details
- ✅ Multi-step approval workflow (PENDING → APPROVED → PROCESSING → COMPLETED)
- ✅ Automatic fund locking during payout processing
- ✅ Support for multiple payout methods (Bank Transfer, PayPal, Stripe)
- ✅ Minimum payout amount validation ($10)
- ✅ 2FA requirement for high-value payouts (>$500)
- ✅ User verification requirement (KYC)
- ✅ Comprehensive audit trail
- ✅ Admin rejection with reason tracking

## Database Schema

### PayoutRequest Table

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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (wallet_id) REFERENCES wallets(id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_requested_at (requested_at)
);
```

### Status Flow

```
PENDING → APPROVED → PROCESSING → COMPLETED
   ↓
REJECTED
```

## API Endpoints

### User Endpoints

#### 1. Create Payout Request
```http
POST /api/payouts/request
Authorization: Bearer <token>
X-2FA-Token: <token> (required for amounts > $500)

{
  "walletId": 123,
  "amount": 250.00,
  "currency": "USD",
  "method": "BANK_TRANSFER",
  "accountDetails": {
    "accountHolderName": "John Doe",
    "bankName": "Chase Bank",
    "accountNumber": "1234567890",
    "routingNumber": "123456789"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "userId": 123,
    "walletId": 123,
    "amount": 250.00,
    "currency": "USD",
    "status": "PENDING",
    "method": "BANK_TRANSFER",
    "requestedAt": "2026-01-23T10:00:00Z"
  }
}
```

#### 2. Get My Payout Requests
```http
GET /api/payouts/my-requests?status=PENDING&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "amount": 250.00,
      "status": "PENDING",
      "method": "BANK_TRANSFER",
      "requestedAt": "2026-01-23T10:00:00Z"
    }
  ]
}
```

#### 3. Get Specific Payout Request
```http
GET /api/payouts/:id
Authorization: Bearer <token>
```

### Admin Endpoints

#### 1. Get Pending Payouts
```http
GET /api/admin/payouts/pending?minAmount=100&limit=50
Authorization: Bearer <admin-token>
```

#### 2. Get Payout Details (with decrypted account info)
```http
GET /api/admin/payouts/:id
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "userId": 123,
    "amount": 250.00,
    "status": "PENDING",
    "method": "BANK_TRANSFER",
    "accountDetails": {
      "accountHolderName": "John Doe",
      "bankName": "Chase Bank",
      "accountNumber": "1234567890",
      "routingNumber": "123456789"
    },
    "requestedAt": "2026-01-23T10:00:00Z"
  }
}
```

#### 3. Approve Payout
```http
POST /api/admin/payouts/:id/approve
Authorization: Bearer <admin-token>
```

#### 4. Reject Payout
```http
POST /api/admin/payouts/:id/reject
Authorization: Bearer <admin-token>

{
  "rejectionReason": "Invalid bank account details"
}
```

#### 5. Mark as Processing
```http
POST /api/admin/payouts/:id/process
Authorization: Bearer <admin-token>
```

#### 6. Complete Payout
```http
POST /api/admin/payouts/:id/complete
Authorization: Bearer <admin-token>

{
  "notes": "Bank transfer completed via ACH"
}
```

## Payout Methods

### 1. Bank Transfer
```typescript
{
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;  // US banks
  iban?: string;           // International
  swiftCode?: string;      // International
}
```

### 2. PayPal
```typescript
{
  email: string;
}
```

### 3. Stripe Transfer
```typescript
{
  accountId: string;  // Stripe Connect account ID
}
```

## Security Features

### 1. Account Details Encryption
- All account details are encrypted using AES-256-CBC
- Encryption key stored in environment variable: `PAYOUT_ENCRYPTION_KEY`
- Only admins can decrypt account details

### 2. User Verification
- Only verified users (completed KYC) can request payouts
- Verification status checked before payout creation

### 3. Two-Factor Authentication
- Required for payouts over $500
- Token validated via `X-2FA-Token` header

### 4. Admin Authorization
- All approval/rejection/completion actions require admin role
- Admin actions are logged with admin ID

### 5. Fund Locking
- Funds are locked immediately when payout is requested
- Locked funds cannot be used for other transactions
- Funds are unlocked on rejection or deducted on completion

## Workflow Examples

### Success Path
```
1. User requests $250 payout → Status: PENDING
   - Funds locked: available -$250, locked +$250
   
2. Admin reviews and approves → Status: APPROVED
   - Funds remain locked
   
3. Admin initiates bank transfer → Status: PROCESSING
   - Funds remain locked
   
4. Bank transfer confirmed → Status: COMPLETED
   - Funds deducted: locked -$250
```

### Rejection Path
```
1. User requests $250 payout → Status: PENDING
   - Funds locked: available -$250, locked +$250
   
2. Admin reviews and rejects → Status: REJECTED
   - Funds unlocked: available +$250, locked -$250
```

## Error Handling

### Common Errors

1. **Insufficient Balance**
```json
{
  "success": false,
  "error": "Insufficient balance. Available: 100, Requested: 250"
}
```

2. **Below Minimum Amount**
```json
{
  "success": false,
  "error": "Minimum payout amount is 10"
}
```

3. **User Not Verified**
```json
{
  "success": false,
  "error": "User verification required. Please complete KYC verification."
}
```

4. **2FA Required**
```json
{
  "success": false,
  "error": "Two-factor authentication required for payouts over $500"
}
```

5. **Invalid Status Transition**
```json
{
  "success": false,
  "error": "Cannot approve payout in status: COMPLETED"
}
```

## Testing

### Run Unit Tests
```bash
cd backend/services/internal-ledger-service
npm test -- payout.service.test.ts
```

### Run Integration Tests
```bash
npm test -- payout-workflow.integration.test.ts
```

### Test Coverage
- ✅ Payout request creation
- ✅ Fund locking/unlocking
- ✅ Approval workflow
- ✅ Rejection workflow
- ✅ Complete workflow
- ✅ Multiple concurrent payouts
- ✅ Admin filtering and retrieval
- ✅ Encryption/decryption
- ✅ Error handling

## Environment Variables

```env
# Required
PAYOUT_ENCRYPTION_KEY=your-32-character-encryption-key-here
JWT_SECRET=your-jwt-secret

# Optional
MIN_PAYOUT_AMOUNT=10
HIGH_VALUE_THRESHOLD=500
```

## Admin Workflow Guide

### Processing a Payout Request

1. **Review Pending Payouts**
   - Access admin dashboard
   - View list of pending payouts
   - Filter by amount, date, or method

2. **Verify User Details**
   - Check user verification status
   - Review transaction history
   - Verify account details

3. **Approve or Reject**
   - If approved: Click "Approve" button
   - If rejected: Provide rejection reason

4. **Process Bank Transfer**
   - Mark as "Processing"
   - Initiate manual bank transfer
   - Keep reference number

5. **Complete Payout**
   - After bank transfer confirmation
   - Mark as "Completed"
   - Add notes with reference number

## Monitoring and Logging

All payout operations are logged with:
- User ID
- Admin ID (for admin actions)
- Amount
- Status changes
- Timestamps
- Error details (if any)

### Key Metrics to Monitor
- Average payout processing time
- Rejection rate
- High-value payout frequency
- Failed payout attempts

## Future Enhancements

- [ ] Automated payouts for trusted users
- [ ] Batch payout processing
- [ ] Payout scheduling
- [ ] Multi-currency support
- [ ] Webhook notifications
- [ ] Real-time status updates
- [ ] Payout analytics dashboard
- [ ] Fraud detection integration

## Support

For issues or questions:
- Check logs in `backend/services/internal-ledger-service/logs/`
- Review error messages in API responses
- Contact development team

---

**Last Updated:** January 23, 2026
**Version:** 1.0.0
