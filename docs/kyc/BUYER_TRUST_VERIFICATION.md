# Buyer Trust Verification (Lightweight)

Lightweight buyer verification system for fraud prevention and accountability.

---

## Purpose

- Prevent fraud
- Enable dispute resolution
- Establish buyer accountability
- **NOT financial verification**

---

## Data Collected (Minimal)

| Data | Purpose | Storage |
|------|---------|---------|
| Full name | Identity | Plain |
| Delivery address | Shipping | Plain |
| Phone number | OTP verified | Plain |
| Email | Communication | Plain |
| Emergency contact | Safety | Plain |
| IP address | Fraud prevention | Plain |
| Device fingerprint | Fraud prevention | Hashed |

## Data NOT Collected

- ❌ Passport
- ❌ Biometrics
- ❌ Financial data
- ❌ Payment info

---

## Verification Status

Simple 3-state machine:

```
UNVERIFIED → VERIFIED → RESTRICTED
                    ↗ (can be lifted)
```

### Status Definitions

| Status | Can Browse | Can Submit Requests | Description |
|--------|------------|---------------------|-------------|
| UNVERIFIED | ✅ Yes | ❌ No | Default state, can browse freely |
| VERIFIED | ✅ Yes | ✅ Yes | Full access to buyer features |
| RESTRICTED | ❌ No | ❌ No | Account restricted by admin |

---

## Verification Requirements

To become VERIFIED, buyer must complete:

- [ ] Full name provided
- [ ] Phone number verified (OTP)
- [ ] At least one delivery address added

Optional (not required for verification):
- Email verification
- Emergency contact
- Address validation

---

## Database Schema

### Tables

1. **BuyerTrustProfile** - Main profile with verification status
2. **BuyerDeliveryAddress** - Delivery addresses with validation
3. **BuyerPhoneOtp** - OTP verification tracking
4. **BuyerDeviceLog** - Device/IP logging for fraud detection
5. **BuyerTrustAuditLog** - Immutable audit trail

### User Table Updates

- `buyerVerificationStatus` - Current status
- `buyerVerifiedAt` - Verification timestamp
- `buyerTrustProfileId` - Link to profile

---

## API Endpoints

### User Endpoints (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/buyer-trust/profile` | Create/get profile |
| GET | `/api/buyer-trust/profile` | Get profile status |
| PATCH | `/api/buyer-trust/profile` | Update profile |
| GET | `/api/buyer-trust/status` | Check access status |
| GET | `/api/buyer-trust/indicator` | Get trust indicator (read-only) |

### Address Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/buyer-trust/addresses` | Add address |
| PATCH | `/api/buyer-trust/addresses/:id` | Update address |
| DELETE | `/api/buyer-trust/addresses/:id` | Delete address |
| POST | `/api/buyer-trust/addresses/:id/validate` | Validate address format |

### Phone Verification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/buyer-trust/phone/send-otp` | Send OTP |
| POST | `/api/buyer-trust/phone/verify-otp` | Verify OTP |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/buyer-trust/admin/:userId/restrict` | Apply restriction |
| POST | `/api/buyer-trust/admin/:userId/unrestrict` | Lift restriction |

---

## Access Control

### Middleware Usage

```typescript
import {
  requireVerifiedBuyer,
  checkBuyerStatus,
  blockRestrictedBuyer,
} from './middleware/buyer-trust.middleware';

// Require verification for purchase requests
router.post('/requests', authenticate, requireVerifiedBuyer, createRequest);

// Check status but don't block (for browsing)
router.get('/listings', authenticate, checkBuyerStatus, getListings);

// Block only restricted accounts
router.get('/profile', authenticate, blockRestrictedBuyer, getProfile);
```

### Response When Blocked

```json
{
  "error": {
    "code": "BUYER_VERIFICATION_REQUIRED",
    "message": "Complete verification to submit purchase requests.",
    "details": {
      "status": "UNVERIFIED",
      "canBrowse": true,
      "canSubmitRequests": false,
      "profileId": 123
    }
  }
}
```

---

## Trust Indicator (Read-Only)

The trust indicator provides factual information only - **NO scoring**.

```typescript
interface BuyerTrustIndicator {
  userId: number;
  status: BuyerVerificationStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
  hasValidatedAddress: boolean;
  accountAgeDays: number;
  // NO score - just facts
}
```

---

## Address Validation

Basic format validation only (deterministic):

- Full name required (min 2 chars)
- Address line 1 required (min 5 chars)
- City required (min 2 chars)
- Country code required (2 letters)

**No external API calls** - just format checking.

---

## Device/IP Logging

For fraud detection (read-only indicators):

```typescript
interface BuyerDeviceLog {
  ipAddress: string;
  deviceFingerprint?: string;
  userAgent?: string;
  activityType: string;
  
  // Read-only flags - NO automation
  isNewDevice: boolean;
  isNewLocation: boolean;
  isSuspicious: boolean;  // Manual flag only
}
```

**Constraints:**
- Flags are informational only
- No automated decisions based on flags
- Human review required for any action

---

## Constraints

### Deterministic Logic
- Same input → same output
- No randomness in verification
- No ML/AI decisions

### No Scoring Mutation
- Trust indicator is read-only
- No score calculation
- Just factual data

### No Automation Decisions
- Verification is automatic when requirements met
- Restrictions require admin action
- No auto-blocking based on device flags

### Read-Only Trust Indicators
- Indicators inform, don't decide
- Human review for any action
- No automated enforcement

---

## Audit Logging

Every action is logged immutably:

```typescript
enum BuyerTrustAuditAction {
  PROFILE_CREATED,
  PROFILE_UPDATED,
  PHONE_OTP_SENT,
  PHONE_VERIFIED,
  EMAIL_VERIFIED,
  ADDRESS_ADDED,
  ADDRESS_UPDATED,
  ADDRESS_VALIDATED,
  EMERGENCY_CONTACT_ADDED,
  STATUS_CHANGED,
  RESTRICTION_APPLIED,
  RESTRICTION_LIFTED,
  DEVICE_LOGGED,
  SUSPICIOUS_ACTIVITY_FLAGGED,
}
```

---

## Comparison: Buyer vs Traveler Verification

| Aspect | Buyer (Lightweight) | Traveler (Full KYC) |
|--------|---------------------|---------------------|
| Purpose | Fraud prevention | Trust + compliance |
| Documents | None | Passport, selfie, ticket |
| Phone | 1 (OTP verified) | 2 (local + foreign) |
| Address | Delivery address | Home address |
| Review | Automatic | Human required |
| Blocking | Submit requests only | All traveler features |

---

## Files Created

| File | Purpose |
|------|---------|
| `migrations/20251220_add_buyer_trust_verification/migration.sql` | Database schema |
| `types/buyer-trust.types.ts` | TypeScript interfaces |
| `services/buyer-trust.service.ts` | Business logic |
| `routes/buyer-trust.routes.ts` | API endpoints |
| `middleware/buyer-trust.middleware.ts` | Access control |

---

*Document Version: 1.0*
*Last Updated: December 2025*
*Owner: Trust & Safety Team*
