# Traveler Full KYC Implementation (Enhanced V2)

Complete KYC verification system for travelers on the cross-border commerce platform.

---

## Purpose

**Trust, fraud prevention, dispute resolution ONLY**

- NO payments
- NO wallets
- NO FX
- NO financial execution

**Contractual**: False data = suspension + legal accountability

---

## Requirements

### Mandatory Full KYC Before Traveler Can:
- View shopper requests
- Accept delivery requests
- Create trips
- Access any traveler-specific features

### Data Collected & Stored Securely:

#### Section 1: Personal Identity
| Data | Purpose | Storage |
|------|---------|---------|
| Full legal name | Identity verification | Plain |
| Date of birth | Identity verification | Plain |
| Nationality | Identity verification | Plain |
| Gender | Identity verification | Plain |
| Passport number | Identity verification | Encrypted |
| Passport country | Identity verification | Plain |
| Passport expiry | Identity verification | Plain |

#### Section 2: Contact Information
| Data | Purpose | Storage |
|------|---------|---------|
| Local phone | OTP verified | Hashed |
| Foreign phone | OTP verified | Hashed |
| Email | Communication | Plain |

#### Section 3: Travel Information
| Data | Purpose | Storage |
|------|---------|---------|
| Departure country/city | Route verification | Plain |
| Arrival country/city | Route verification | Plain |
| Travel dates | Route verification | Plain |
| Flight ticket (PDF/image) | Travel verification | Encrypted |
| Boarding pass (optional) | Travel verification | Encrypted |

#### Section 4: Addresses
| Data | Purpose | Storage |
|------|---------|---------|
| Permanent address (Egypt) | Identity verification | Encrypted |
| Governorate | Egypt-specific | Plain |
| Current address (abroad) | Contact | Encrypted |

#### Section 5: Emergency Contact
| Data | Purpose | Storage |
|------|---------|---------|
| Emergency contact name | Safety | Encrypted |
| Emergency contact phone | Safety | Encrypted |
| Emergency contact country | Safety | Plain |

#### Section 6: Security Logs (Auto-captured)
| Data | Purpose | Storage |
|------|---------|---------|
| IP address | Fraud prevention | Plain |
| Device fingerprint | Fraud prevention | Hashed |
| Browser name/version | Fraud prevention | Plain |
| OS name/version | Fraud prevention | Plain |
| Geo country | Fraud prevention | Plain |

#### Section 7: Legal Acknowledgments
| Data | Purpose | Storage |
|------|---------|---------|
| Terms of Service | Contractual | Immutable |
| Privacy Policy | Contractual | Immutable |
| Data Accuracy | Contractual | Immutable |
| Legal Accountability | Contractual | Immutable |
| Suspension Policy | Contractual | Immutable |
| Digital Signature | Contractual | Hashed |

---

## KYC Status State Machine

```
DRAFT → SUBMITTED → UNDER_REVIEW → VERIFIED
                              ↘ REJECTED → DRAFT (resubmit)
```

### Valid Transitions:

| From | To |
|------|-----|
| DRAFT | SUBMITTED |
| SUBMITTED | UNDER_REVIEW, REJECTED |
| UNDER_REVIEW | VERIFIED, REJECTED |
| REJECTED | DRAFT |
| VERIFIED | (terminal) |

---

## Database Schema

### Tables Created:

1. **TravelerKycApplication** - Main application tracking (enhanced with new fields)
2. **TravelerKycDocument** - Encrypted document storage
3. **TravelerKycAuditLog** - Immutable audit trail
4. **TravelerPhoneOtp** - OTP verification tracking
5. **TravelerLegalAcknowledgment** - Legal acknowledgments with version tracking
6. **TravelerSecurityLog** - Immutable security logs for fraud detection

### User Table Updates:
- `travelerKycStatus` - Current KYC status
- `travelerKycVerifiedAt` - Verification timestamp
- `travelerKycApplicationId` - Link to application

---

## API Endpoints

### User Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/traveler-kyc/application` | Create/get application |
| GET | `/api/traveler-kyc/application` | Get application status |
| PATCH | `/api/traveler-kyc/application` | Update application info |
| POST | `/api/traveler-kyc/application/submit` | Submit for review |
| GET | `/api/traveler-kyc/status` | Check access status |
| POST | `/api/traveler-kyc/documents` | Upload document |
| POST | `/api/traveler-kyc/phone/send-otp` | Send phone OTP |
| POST | `/api/traveler-kyc/phone/verify-otp` | Verify phone OTP |
| POST | `/api/traveler-kyc/legal/acknowledge` | Sign legal acknowledgment |
| POST | `/api/traveler-kyc/signature` | Capture digital signature |

### Admin Endpoints (Requires `kyc:manage` permission)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/traveler-kyc/admin/pending` | List pending applications |
| POST | `/api/traveler-kyc/admin/:id/start-review` | Start review |
| POST | `/api/traveler-kyc/admin/:id/review` | Approve/reject application |
| POST | `/api/traveler-kyc/admin/documents/:id/review` | Approve/reject document |

---

## Access Control

### Hard-Block Middleware

```typescript
import { requireVerifiedTraveler } from './middleware/traveler-kyc.middleware';

// Block unverified travelers
router.get('/requests', authenticate, requireVerifiedTraveler, getRequests);
router.post('/trips', authenticate, requireVerifiedTraveler, createTrip);
```

### Response When Blocked:

```json
{
  "error": {
    "code": "TRAVELER_KYC_REQUIRED",
    "message": "KYC draft. Complete verification to access traveler features.",
    "details": {
      "status": "DRAFT",
      "canViewRequests": false,
      "canAcceptRequests": false,
      "applicationId": 123
    }
  }
}
```


---

## Constraints

### Deterministic Logic Only
- No ML inference for document verification
- No automated approval decisions
- Biometric selfie stored as "liveness-ready" for future manual review

### Human Review Required
- All approvals require admin action
- All rejections require admin action with reason
- No auto-approval based on document quality scores

### GDPR-Style Data Minimization
- Only collect necessary data
- Encrypted storage for sensitive documents
- Retention tracking with expiry dates
- Soft-delete with deletion reason logging

---

## Audit Logging

Every action is logged immutably:

```typescript
enum TravelerKycAuditAction {
  APPLICATION_CREATED,
  APPLICATION_UPDATED,
  APPLICATION_SUBMITTED,
  APPLICATION_UNDER_REVIEW,
  APPLICATION_VERIFIED,
  APPLICATION_REJECTED,
  DOCUMENT_UPLOADED,
  DOCUMENT_REVIEWED,
  DOCUMENT_APPROVED,
  DOCUMENT_REJECTED,
  DOCUMENT_DELETED,
  PHONE_VERIFICATION_SENT,
  PHONE_VERIFIED,
  EMAIL_VERIFICATION_SENT,
  EMAIL_VERIFIED,
  ADMIN_NOTE_ADDED,
  STATUS_CHANGED,
}
```

### Audit Log Entry:

```json
{
  "id": 1,
  "applicationId": 123,
  "userId": 456,
  "action": "APPLICATION_SUBMITTED",
  "description": "Application submitted for review",
  "actorId": 456,
  "actorRole": "USER",
  "actorIp": "192.168.1.1",
  "previousState": { "status": "DRAFT" },
  "newState": { "status": "SUBMITTED" },
  "createdAt": "2025-12-20T10:00:00Z"
}
```

---

## Document Storage

### Encryption at Rest
- All documents encrypted before storage
- Encryption key ID stored with document
- File hash (SHA-256) for integrity verification

### Storage Path Format:
```
encrypted://kyc/{userId}/{documentType}/{timestamp}-{filename}
```

### Supported Document Types:
- `PASSPORT` - Required
- `BIOMETRIC_SELFIE` - Required (liveness-ready)
- `FLIGHT_TICKET` - Required
- `PROOF_OF_ADDRESS` - Optional

---

## Phone Verification

### OTP Configuration:
- Length: 6 digits
- Expiry: 10 minutes
- Max attempts: 5
- Rate limit: 1 minute between sends
- Max sends per hour: 5

### Verification Flow:
1. User requests OTP → `POST /phone/send-otp`
2. OTP sent via SMS (hashed in DB)
3. User submits OTP → `POST /phone/verify-otp`
4. On success, phone marked as verified
5. Both local AND foreign phones required

---

## Completion Checklist

Application ready for submission when:

- [ ] Full legal name provided
- [ ] Date of birth provided
- [ ] Nationality provided
- [ ] Local phone verified (OTP)
- [ ] Foreign phone verified (OTP)
- [ ] Address provided (line1, city, country)
- [ ] Emergency contact provided (name, phone)
- [ ] Travel dates provided (from, to)
- [ ] Passport uploaded
- [ ] Biometric selfie uploaded
- [ ] Flight ticket uploaded

---

## Files Created

| File | Purpose |
|------|---------|
| `migrations/20251220_add_traveler_full_kyc/migration.sql` | Database schema |
| `types/traveler-kyc.types.ts` | TypeScript interfaces |
| `services/traveler-kyc.service.ts` | Business logic |
| `routes/traveler-kyc.routes.ts` | API endpoints |
| `middleware/traveler-kyc.middleware.ts` | Access control |

---

*Document Version: 1.0*
*Last Updated: December 2025*
*Owner: Security & Compliance Team*
