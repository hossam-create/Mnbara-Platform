# KYC-Lite System Documentation

## Overview

The KYC-Lite system provides a simplified Know Your Customer (KYC) verification process with four verification levels, each with different transaction limits and capabilities.

## Verification Levels

### 1. UNVERIFIED (Default)
- **Transaction Limit**: $100
- **Payout Eligibility**: ❌ No
- **Requirements**: None (default state)

### 2. EMAIL_VERIFIED
- **Transaction Limit**: $500
- **Payout Eligibility**: ✅ Yes (up to $100)
- **Requirements**: Verified email address

### 3. PHONE_VERIFIED
- **Transaction Limit**: $1,000
- **Payout Eligibility**: ✅ Yes (up to $100)
- **Requirements**: Verified email + verified phone number

### 4. ID_VERIFIED
- **Transaction Limit**: $5,000
- **Payout Eligibility**: ✅ Yes (unlimited)
- **Requirements**: Verified email + verified phone + approved ID document

## Special Rules

- **Payout Threshold**: Payouts over $100 require ID verification
- **Unverified Users**: Cannot request any payouts
- **Progressive Verification**: Users can upgrade their level at any time

---

## Database Schema

### verification_documents Table

```sql
CREATE TABLE verification_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  document_type VARCHAR(20) NOT NULL,  -- ID, PASSPORT, DRIVER_LICENSE
  front_image_url TEXT NOT NULL,
  back_image_url TEXT,
  status VARCHAR(20) NOT NULL,         -- PENDING, APPROVED, REJECTED
  uploaded_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER,
  rejection_reason TEXT,
  metadata JSONB
);
```

### phone_verifications Table

```sql
CREATE TABLE phone_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE
);
```

### email_verifications Table

```sql
CREATE TABLE email_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE
);
```

### users Table (Additional Fields)

```sql
ALTER TABLE users ADD COLUMN verification_level VARCHAR(20) DEFAULT 'UNVERIFIED';
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN id_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
```

---

## API Endpoints

### User Endpoints

#### 1. Get Verification Status
```
GET /api/verification/status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "verificationLevel": "EMAIL_VERIFIED",
    "emailVerified": true,
    "phoneVerified": false,
    "idVerified": false,
    "transactionLimit": 500,
    "canRequestPayout": true
  }
}
```

#### 2. Upload ID Document
```
POST /api/verification/upload-id
Content-Type: multipart/form-data
```

**Request**:
```
documentType: "ID" | "PASSPORT" | "DRIVER_LICENSE"
frontImage: File
backImage: File (optional)
```

**Response**:
```json
{
  "success": true,
  "message": "ID document uploaded successfully. It will be reviewed by our team.",
  "data": {
    "id": 1,
    "userId": 1,
    "documentType": "ID",
    "status": "PENDING",
    "uploadedAt": "2026-01-25T10:00:00Z"
  }
}
```

#### 3. Send Phone Verification OTP
```
POST /api/verification/verify-phone
```

**Request**:
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Verification code sent to your phone"
}
```

#### 4. Confirm Phone Verification
```
POST /api/verification/confirm-phone
```

**Request**:
```json
{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Phone verified successfully"
}
```

#### 5. Send Email Verification
```
POST /api/verification/verify-email
```

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

#### 6. Confirm Email Verification
```
GET /api/verification/confirm-email/:token
```

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 7. Get Upgrade Information
```
GET /api/verification/upgrade?targetLevel=ID_VERIFIED
```

**Response**:
```json
{
  "success": true,
  "data": {
    "currentLevel": "EMAIL_VERIFIED",
    "requiredLevel": "ID_VERIFIED",
    "currentLimit": 500,
    "requiredLimit": 5000,
    "upgradeSteps": [
      "Verify your phone number",
      "Upload your ID document"
    ],
    "message": "To increase your transaction limit to $5000, please complete the following steps:"
  }
}
```

### Admin Endpoints

#### 1. Get Pending Verifications
```
GET /api/admin/verifications/pending?limit=50
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "documentType": "ID",
      "frontImageUrl": "https://...",
      "backImageUrl": "https://...",
      "status": "PENDING",
      "uploadedAt": "2026-01-25T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### 2. Get User Documents
```
GET /api/admin/verifications/users/:userId/documents
```

#### 3. Get User Status
```
GET /api/admin/verifications/users/:userId/status
```

#### 4. Approve Verification
```
POST /api/admin/verifications/:id/approve
```

**Response**:
```json
{
  "success": true,
  "message": "Verification approved successfully",
  "data": {
    "id": 1,
    "status": "APPROVED",
    "reviewedAt": "2026-01-25T11:00:00Z",
    "reviewedBy": 2
  }
}
```

#### 5. Reject Verification
```
POST /api/admin/verifications/:id/reject
```

**Request**:
```json
{
  "rejectionReason": "Document is not clear"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Verification rejected",
  "data": {
    "id": 1,
    "status": "REJECTED",
    "rejectionReason": "Document is not clear",
    "reviewedAt": "2026-01-25T11:00:00Z",
    "reviewedBy": 2
  }
}
```

---

## Middleware Usage

### Basic KYC Check

```typescript
import { kycVerification } from './middleware/kycVerification';

app.post('/api/action',
  kycVerification(kycService, {
    requiredLevel: VerificationLevel.EMAIL_VERIFIED
  }),
  handler
);
```

### Check Transaction Limit

```typescript
import { checkTransactionLimit } from './middleware/kycVerification';

app.post('/api/payments',
  checkTransactionLimit(kycService),
  paymentHandler
);
```

### Check Payout Eligibility

```typescript
import { checkPayoutEligibility } from './middleware/kycVerification';

app.post('/api/payouts',
  checkPayoutEligibility(kycService),
  payoutHandler
);
```

### Require Specific Level

```typescript
import {
  requireEmailVerification,
  requirePhoneVerification,
  requireIdVerification
} from './middleware/kycVerification';

// Require email verification
app.post('/api/disputes',
  requireEmailVerification(kycService),
  disputeHandler
);

// Require phone verification
app.post('/api/sensitive-action',
  requirePhoneVerification(kycService),
  handler
);

// Require ID verification
app.post('/api/high-value-transaction',
  requireIdVerification(kycService),
  handler
);
```

---

## File Upload Validation

### Supported File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- PDF (.pdf)

### File Size Limits
- Maximum file size: 5MB per file
- Maximum total size: 10MB (front + back)

### Validation Rules
```typescript
const fileValidation = {
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxTotalSize: 10 * 1024 * 1024, // 10MB
};
```

---

## Error Responses

### Verification Required
```json
{
  "error": "Verification required",
  "message": "This action requires EMAIL_VERIFIED verification level",
  "currentLevel": "UNVERIFIED",
  "requiredLevel": "EMAIL_VERIFIED",
  "upgradeUrl": "/api/verification/upgrade"
}
```

### Transaction Limit Exceeded
```json
{
  "error": "Transaction limit exceeded",
  "message": "Transaction amount ($600) exceeds your current limit ($500). Please upgrade to PHONE_VERIFIED level.",
  "currentLevel": "EMAIL_VERIFIED",
  "currentLimit": 500,
  "requestedAmount": 600,
  "requiredLevel": "PHONE_VERIFIED",
  "upgradeUrl": "/api/verification/upgrade"
}
```

### Payout Not Allowed
```json
{
  "error": "Payout not allowed",
  "message": "You must verify your email before requesting payouts.",
  "currentLevel": "UNVERIFIED",
  "requiredLevel": "EMAIL_VERIFIED",
  "upgradeUrl": "/api/verification/upgrade"
}
```

### Invalid OTP
```json
{
  "success": false,
  "error": "Invalid verification code"
}
```

### Expired OTP
```json
{
  "success": false,
  "error": "Verification code has expired"
}
```

### Maximum Attempts Exceeded
```json
{
  "success": false,
  "error": "Maximum verification attempts exceeded"
}
```

---

## Integration Examples

### Example 1: Payment with KYC Check

```typescript
app.post('/api/payments',
  authenticate,
  checkTransactionLimit(kycService),
  async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id;
    const verificationStatus = req.verificationStatus;

    // Process payment
    const payment = await processPayment(userId, amount);

    res.json({
      success: true,
      payment,
      verificationLevel: verificationStatus.verificationLevel,
      remainingLimit: verificationStatus.transactionLimit - amount
    });
  }
);
```

### Example 2: Payout with KYC Check

```typescript
app.post('/api/payouts',
  authenticate,
  checkPayoutEligibility(kycService),
  async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id;

    // Process payout
    const payout = await processPayout(userId, amount);

    res.json({
      success: true,
      payout
    });
  }
);
```

### Example 3: Manual Verification Check

```typescript
app.post('/api/custom-action',
  authenticate,
  async (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;

    // Manual check
    const check = await kycService.checkTransactionLimit(userId, amount);

    if (!check.allowed) {
      return res.status(403).json({
        error: 'Verification required',
        ...check
      });
    }

    // Proceed with action
    res.json({ success: true });
  }
);
```

---

## Testing

### Run Tests

```bash
npm test -- KYCService.test.ts
```

### Test Coverage

- ✅ Get user verification status
- ✅ Check transaction limits
- ✅ Check payout eligibility
- ✅ Upload ID documents
- ✅ Approve/reject verifications
- ✅ Phone OTP verification
- ✅ Email token verification
- ✅ Error handling

---

## Security Considerations

### File Upload Security
- Validate file types and sizes
- Scan for malware
- Store in secure location (S3 with encryption)
- Generate unique filenames
- Limit upload rate

### OTP Security
- 6-digit random OTP
- 10-minute expiration
- Maximum 3 attempts
- Rate limiting on OTP requests
- SMS delivery via Twilio

### Email Verification
- Cryptographically secure tokens
- 24-hour expiration
- One-time use tokens
- HTTPS-only verification links

### Admin Review
- Two-factor authentication required
- Audit log of all reviews
- Rejection reasons mandatory
- Review time tracking

---

## Monitoring & Logging

### Key Metrics
- Verification requests by level
- Approval/rejection rates
- Average review time
- Failed verification attempts
- Transaction limit violations

### Logging
- All verification attempts
- Document uploads
- Admin reviews
- OTP sends and verifications
- Limit violations

---

## Future Enhancements

1. **Automated ID Verification**:
   - OCR for document reading
   - Face matching
   - Liveness detection

2. **Risk-Based Verification**:
   - Dynamic limits based on user behavior
   - Fraud detection integration
   - Geographic risk scoring

3. **Additional Verification Methods**:
   - Bank account verification
   - Social media verification
   - Biometric verification

4. **Enhanced Admin Tools**:
   - Bulk approval/rejection
   - Verification analytics dashboard
   - Automated flagging of suspicious documents

---

## Support

For issues or questions:
- Check logs in `logs/kyc.log`
- Review database records
- Contact compliance team for policy questions
- Contact development team for technical issues

---

**Implementation Complete!** 🚀

The KYC-Lite system is ready for production use.
