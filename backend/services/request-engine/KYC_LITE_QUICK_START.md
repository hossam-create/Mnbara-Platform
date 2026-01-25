# KYC-Lite - Quick Start Guide

## 5-Minute Setup

### 1. Run Migration

```bash
# Windows
.\scripts\run-migration.bat 005_kyc_verification.sql

# Linux/Mac
./scripts/run-migration.sh 005_kyc_verification.sql
```

### 2. Initialize Service

```typescript
import { KYCService } from './services/KYCService';
import { StorageFactory } from './services/storage/StorageFactory';

const storageService = StorageFactory.create();
const kycService = new KYCService(db, storageService);
```

### 3. Apply to Routes

```typescript
import { checkTransactionLimit, checkPayoutEligibility } from './middleware/kycVerification';

// Payments - check transaction limit
app.post('/api/payments',
  checkTransactionLimit(kycService),
  paymentHandler
);

// Payouts - check payout eligibility
app.post('/api/payouts',
  checkPayoutEligibility(kycService),
  payoutHandler
);
```

## Verification Levels

| Level | Limit | Payout | Requirements |
|-------|-------|--------|--------------|
| UNVERIFIED | $100 | ❌ No | None |
| EMAIL_VERIFIED | $500 | ✅ Yes ($100) | Email |
| PHONE_VERIFIED | $1,000 | ✅ Yes ($100) | Email + Phone |
| ID_VERIFIED | $5,000 | ✅ Yes (Unlimited) | Email + Phone + ID |

## Common Use Cases

### Protect Payments

```typescript
app.post('/api/payments',
  checkTransactionLimit(kycService),
  handler
);
```

### Protect Payouts

```typescript
app.post('/api/payouts',
  checkPayoutEligibility(kycService),
  handler
);
```

### Require Email Verification

```typescript
import { requireEmailVerification } from './middleware/kycVerification';

app.post('/api/disputes',
  requireEmailVerification(kycService),
  handler
);
```

### Require ID Verification

```typescript
import { requireIdVerification } from './middleware/kycVerification';

app.post('/api/high-value',
  requireIdVerification(kycService),
  handler
);
```

## User APIs

### Get Status
```
GET /api/verification/status
```

### Upload ID
```
POST /api/verification/upload-id
Content-Type: multipart/form-data

documentType: "ID" | "PASSPORT" | "DRIVER_LICENSE"
frontImage: File
backImage: File (optional)
```

### Verify Phone
```
POST /api/verification/verify-phone
{ "phoneNumber": "+1234567890" }

POST /api/verification/confirm-phone
{ "phoneNumber": "+1234567890", "otp": "123456" }
```

### Verify Email
```
POST /api/verification/verify-email
{ "email": "user@example.com" }

GET /api/verification/confirm-email/:token
```

## Admin APIs

### Pending Verifications
```
GET /api/admin/verifications/pending
```

### Approve/Reject
```
POST /api/admin/verifications/:id/approve
POST /api/admin/verifications/:id/reject
{ "rejectionReason": "Document not clear" }
```

## Error Responses

### Verification Required
```json
{
  "error": "Verification required",
  "currentLevel": "UNVERIFIED",
  "requiredLevel": "EMAIL_VERIFIED",
  "upgradeUrl": "/api/verification/upgrade"
}
```

### Limit Exceeded
```json
{
  "error": "Transaction limit exceeded",
  "currentLimit": 500,
  "requestedAmount": 600,
  "requiredLevel": "PHONE_VERIFIED"
}
```

## Testing

```bash
npm test -- KYCService.test.ts
```

## File Validation

- **Allowed Types**: JPEG, PNG, PDF
- **Max File Size**: 5MB per file
- **Max Total Size**: 10MB

## Security Features

- ✅ File type and size validation
- ✅ Secure storage (S3/Local)
- ✅ 6-digit OTP with 10-min expiry
- ✅ 3 max OTP attempts
- ✅ Secure email tokens (24-hour expiry)
- ✅ Admin 2FA required
- ✅ Complete audit trail

## Need Help?

- 📖 Full documentation: `KYC_LITE_DOCUMENTATION.md`
- 🔍 Examples: `src/app.kyc-example.ts`
- 🧪 Tests: `src/services/__tests__/KYCService.test.ts`
- 🌐 Arabic docs: `KYC_LITE_COMPLETE_AR.md`

---

**Ready to use!** 🚀
