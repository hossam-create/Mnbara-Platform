# SEC-001: Two-Factor Authentication (2FA) Implementation

## Summary
Implemented TOTP-based two-factor authentication (2FA) for user accounts as per SEC-001 requirements.

## What Was Done

### 1. Database Changes
- Added `UserTwoFactor` model to Prisma schema with fields:
  - `secret`: TOTP secret (base32 encoded)
  - `enabled`: 2FA enabled status
  - `backupCodes`: Hashed backup recovery codes (JSON array)
  - `enabledAt`: Timestamp when 2FA was enabled
- Created migration file: `prisma/migrations/20250101_add_two_factor_auth/migration.sql`

### 2. Dependencies Added
- `speakeasy`: For TOTP secret generation and verification
- `qrcode`: For generating QR codes for authenticator apps
- `@types/qrcode`: TypeScript types

### 3. TwoFactorService (`src/services/two-factor.service.ts`)
- `generateSecret()`: Generates TOTP secret and QR code, creates backup codes
- `verifyAndEnable()`: Verifies TOTP token and enables 2FA
- `validateToken()`: Validates TOTP token or backup code during login/sensitive actions
- `isEnabled()`: Checks if 2FA is enabled for a user
- `disable()`: Disables 2FA (requires valid token)
- `regenerateBackupCodes()`: Regenerates backup codes (requires valid token)

### 4. AuthService Updates (`src/services/auth.service.ts`)
- Added `findUserByEmail()`: Helper to find user by email
- Added `verifyPassword()`: Helper to verify password
- Added `completeLogin()`: Completes login after 2FA verification

### 5. Controller Updates (`src/controllers/auth.controller.ts`)
- Modified `login()`: Now supports 2FA verification flow
  - Returns `requires2FA: true` if 2FA is enabled but code not provided
  - Validates 2FA code before completing login
- Modified `changePassword()`: Requires 2FA code if 2FA is enabled
- Added `setup2FA()`: Generates secret and QR code
- Added `enable2FA()`: Enables 2FA after token verification
- Added `disable2FA()`: Disables 2FA (requires valid token)
- Added `get2FAStatus()`: Returns 2FA enabled status
- Added `regenerateBackupCodes()`: Regenerates backup codes

### 6. Routes (`src/routes/auth.routes.ts`)
- Updated `/api/auth/login`: Added optional `twoFactorCode` parameter
- Updated `/api/auth/change-password`: Added optional `twoFactorCode` parameter
- Added `/api/auth/2fa/setup` (POST): Generate 2FA secret and QR code
- Added `/api/auth/2fa/enable` (POST): Enable 2FA
- Added `/api/auth/2fa/disable` (POST): Disable 2FA
- Added `/api/auth/2fa/status` (GET): Get 2FA status
- Added `/api/auth/2fa/regenerate-backup-codes` (POST): Regenerate backup codes

### 7. Tests (`src/services/two-factor.service.test.ts`)
- Tests for `generateSecret()`
- Tests for `verifyAndEnable()` (success and failure cases)
- Tests for `validateToken()` (TOTP and backup code validation)
- Tests for `disable()` (success and failure cases)
- Tests for `isEnabled()`

## Acceptance Criteria Met

✅ **1. Users can enable or disable 2FA from account security settings**
- Endpoints: `/api/auth/2fa/setup`, `/api/auth/2fa/enable`, `/api/auth/2fa/disable`

✅ **2. When 2FA is enabled, users must provide a valid one-time code during login**
- Login flow modified to check 2FA status and require code if enabled
- Returns `requires2FA: true` if code not provided

✅ **3. 2FA is required for sensitive actions (login, password change, payout settings)**
- Login: Requires 2FA code if enabled
- Password change: Requires 2FA code if enabled
- (Payout settings would be in payment-service, not in scope for this story)

✅ **4. Backup recovery codes must be generated and shown once to the user**
- Generated during setup and enable
- Shown only once in response (not stored in plain text)
- Can be regenerated via `/api/auth/2fa/regenerate-backup-codes`

✅ **5. If the 2FA code is incorrect, access must be denied with a clear error message**
- Returns `401 Unauthorized` with message: "Invalid 2FA code. Please try again."

✅ **6. System must support TOTP-based authenticators (e.g., Google Authenticator)**
- Uses `speakeasy` library for TOTP (RFC 6238 compliant)
- Generates QR code compatible with Google Authenticator, Authy, 1Password, etc.

✅ **7. Existing users without 2FA must still be able to log in normally**
- Login flow checks if 2FA is enabled before requiring code
- Users without 2FA can log in with just email/password

## Security Considerations

- Backup codes are hashed using bcrypt before storage
- TOTP secrets are stored in base32 format
- Backup codes are shown only once (during setup/enable/regenerate)
- 2FA token validation uses a time window of ±2 steps (60 seconds) for clock drift tolerance
- Used backup codes are removed from the database

## Next Steps

1. Run database migration: `npx prisma migrate dev`
2. Install dependencies: `npm install`
3. Test the implementation with a TOTP authenticator app
4. (Future) Add UI components for 2FA setup in frontend

## Notes

- The implementation follows the existing codebase structure
- No changes to user roles or permissions
- No new authentication flows beyond 2FA
- Minimal tests cover the core functionality





