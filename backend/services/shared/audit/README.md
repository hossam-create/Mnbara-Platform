# Audit Logging Module

Comprehensive audit logging system for the MNBARA platform that tracks all important system actions, security events, and compliance-related activities.

## Features

- ✅ Centralized audit log service
- ✅ Express middleware for automatic logging
- ✅ Support for 50+ action types
- ✅ Severity levels (INFO, WARNING, ERROR, CRITICAL)
- ✅ Actor and target tracking
- ✅ Request/response capture
- ✅ IP tracking and user agent logging
- ✅ Correlation IDs for distributed tracing
- ✅ Change tracking (old/new values)
- ✅ Compliance-ready (GDPR, SOC2)

## Installation

```typescript
import { AuditService } from '../shared/audit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize the audit service
AuditService.initialize(prisma);
```

## Usage

### Basic Logging

```typescript
import { AuditService, AuditAction } from '../shared/audit';

// Log a simple action
await AuditService.log({
  action: AuditAction.USER_SUSPENDED,
  actorId: adminUser.id,
  targetId: suspendedUser.id,
  description: 'User suspended for policy violation',
  metadata: { 
    reason: 'spam',
    duration: '30d' 
  }
});
```

### User Management Actions

```typescript
// Suspend a user
await AuditService.logUserAction(
  AuditAction.USER_SUSPENDED,
  adminUser.id,
  targetUser.id,
  'User suspended for violating terms of service',
  { reason: 'spam', duration: '30 days' },
  req.ip
);

// Ban a user
await AuditService.logUserAction(
  AuditAction.USER_BANNED,
  adminUser.id,
  targetUser.id,
  'User permanently banned for fraud',
  { reason: 'fraud', evidence: ['order-123', 'order-456'] }
);
```

### KYC Actions

```typescript
// Approve KYC
await AuditService.logKycAction(
  AuditAction.KYC_APPROVED,
  adminUser.id,
  applicantUser.id,
  'KYC verification approved',
  { 
    documentType: 'PASSPORT',
    verificationLevel: 'STANDARD' 
  }
);

// Reject KYC
await AuditService.logKycAction(
  AuditAction.KYC_REJECTED,
  adminUser.id,
  applicantUser.id,
  'KYC verification rejected - document expired',
  { 
    documentType: 'PASSPORT',
    rejectionReason: 'Document expired',
    expiryDate: '2023-01-15'
  }
);
```

### Dispute Resolution

```typescript
// Resolve a dispute
await AuditService.logDisputeAction(
  AuditAction.DISPUTE_RESOLVED,
  adminUser.id,
  dispute.id,
  'Dispute resolved in favor of buyer',
  {
    outcome: 'BUYER_REFUND',
    refundAmount: 150.00,
    resolution: 'Product not as described, full refund issued'
  }
);
```

### Escrow Actions

```typescript
// Release escrow
await AuditService.logEscrowAction(
  AuditAction.ESCROW_RELEASED,
  undefined, // System action
  escrow.id,
  'Escrow released to traveler after delivery confirmation',
  {
    orderId: order.id,
    amount: 150.00,
    travelerId: traveler.id
  }
);
```

### Security Events

```typescript
// Log suspicious activity
await AuditService.logSecurityEvent(
  AuditAction.SUSPICIOUS_ACTIVITY_DETECTED,
  'Multiple failed login attempts detected',
  {
    attempts: 5,
    timeWindow: '5 minutes',
    ipAddress: req.ip
  },
  req.ip,
  user?.id
);

// Log account lock
await AuditService.logSecurityEvent(
  AuditAction.ACCOUNT_LOCKED,
  'Account locked due to suspicious activity',
  { reason: 'brute_force_attempt' },
  req.ip,
  user.id
);
```

### Authentication Events

```typescript
// Successful login
await AuditService.logAuthEvent(
  AuditAction.LOGIN_SUCCESS,
  user.id,
  user.email,
  true,
  req.ip
);

// Failed login
await AuditService.logAuthEvent(
  AuditAction.LOGIN_FAILED,
  undefined,
  email,
  false,
  req.ip,
  'Invalid credentials'
);
```

## Express Middleware

### Automatic Route Logging

```typescript
import { auditMiddleware, AuditAction } from '../shared/audit';

// Basic usage
router.post('/users/:id/suspend', 
  authMiddleware,
  auditMiddleware(AuditAction.USER_SUSPENDED),
  suspendUserController
);

// With custom options
router.post('/users/:id/update',
  authMiddleware,
  auditMiddleware(AuditAction.USER_UPDATED, {
    getTargetId: (req) => parseInt(req.params.id),
    getTargetType: () => 'User',
    getDescription: (req) => `User ${req.params.id} updated`,
    captureRequestBody: true,
    getMetadata: (req) => ({
      updatedFields: Object.keys(req.body)
    })
  }),
  updateUserController
);
```

### Specialized Middleware

```typescript
import { 
  auditUserAction,
  auditKycAction,
  auditDisputeAction,
  auditEscrowAction,
  AuditAction 
} from '../shared/audit';

// User management
router.post('/users/:userId/suspend', 
  authMiddleware,
  auditUserAction(AuditAction.USER_SUSPENDED),
  suspendUserController
);

// KYC management
router.post('/kyc/:userId/approve',
  authMiddleware,
  auditKycAction(AuditAction.KYC_APPROVED),
  approveKycController
);

// Dispute resolution
router.post('/disputes/:disputeId/resolve',
  authMiddleware,
  auditDisputeAction(AuditAction.DISPUTE_RESOLVED),
  resolveDisputeController
);

// Escrow management
router.post('/escrow/:escrowId/release',
  authMiddleware,
  auditEscrowAction(AuditAction.ESCROW_RELEASED),
  releaseEscrowController
);
```

## Querying Audit Logs

```typescript
// Get all audit logs for a user
const userLogs = await AuditService.query({
  actorId: user.id,
  limit: 50
});

// Get all KYC actions
const kycLogs = await AuditService.query({
  targetType: 'KycVerification',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});

// Get critical security events
const securityEvents = await AuditService.query({
  severity: AuditSeverity.CRITICAL,
  limit: 100
});

// Get failed actions
const failedActions = await AuditService.query({
  success: false,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
});
```

## Audit Action Types

### User Management
- `USER_CREATED` - New user account created
- `USER_UPDATED` - User profile updated
- `USER_SUSPENDED` - User account suspended
- `USER_BANNED` - User account permanently banned
- `USER_REACTIVATED` - Suspended account reactivated
- `USER_DELETED` - User account deleted

### Authentication
- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILED` - Failed login attempt
- `LOGOUT` - User logged out
- `PASSWORD_CHANGED` - Password changed
- `PASSWORD_RESET` - Password reset
- `MFA_ENABLED` - Multi-factor authentication enabled
- `MFA_DISABLED` - Multi-factor authentication disabled

### KYC Management
- `KYC_SUBMITTED` - KYC application submitted
- `KYC_APPROVED` - KYC verification approved
- `KYC_REJECTED` - KYC verification rejected
- `KYC_DOCUMENT_UPLOADED` - KYC document uploaded
- `KYC_DOCUMENT_DELETED` - KYC document deleted

### Dispute Management
- `DISPUTE_CREATED` - New dispute opened
- `DISPUTE_ASSIGNED` - Dispute assigned to admin
- `DISPUTE_RESOLVED` - Dispute resolved
- `DISPUTE_CLOSED` - Dispute closed

### Escrow Management
- `ESCROW_CREATED` - Escrow created
- `ESCROW_HELD` - Funds held in escrow
- `ESCROW_RELEASED` - Escrow released to seller
- `ESCROW_REFUNDED` - Escrow refunded to buyer

### Order Management
- `ORDER_CREATED` - New order created
- `ORDER_CANCELLED` - Order cancelled
- `ORDER_COMPLETED` - Order completed
- `ORDER_REFUNDED` - Order refunded

### Financial
- `TRANSACTION_CREATED` - Transaction initiated
- `TRANSACTION_COMPLETED` - Transaction completed
- `TRANSACTION_FAILED` - Transaction failed
- `WITHDRAWAL_REQUESTED` - Withdrawal requested
- `WITHDRAWAL_APPROVED` - Withdrawal approved
- `WITHDRAWAL_REJECTED` - Withdrawal rejected

### Admin Actions
- `ADMIN_ACCESS_GRANTED` - Admin access granted
- `ADMIN_ACCESS_REVOKED` - Admin access revoked
- `SETTINGS_CHANGED` - System settings changed

### Security
- `SUSPICIOUS_ACTIVITY_DETECTED` - Suspicious activity detected
- `ACCOUNT_LOCKED` - Account locked
- `ACCOUNT_UNLOCKED` - Account unlocked
- `IP_BLOCKED` - IP address blocked
- `IP_UNBLOCKED` - IP address unblocked

### Data Privacy
- `DATA_EXPORT_REQUESTED` - User data export requested
- `DATA_EXPORT_COMPLETED` - User data export completed
- `DATA_DELETION_REQUESTED` - User data deletion requested
- `DATA_DELETION_COMPLETED` - User data deletion completed
- `CONSENT_UPDATED` - User consent preferences updated

## Severity Levels

- **INFO** - Normal operations (90-day retention)
- **WARNING** - Events that may need attention (180-day retention)
- **ERROR** - Error events (365-day retention)
- **CRITICAL** - Critical security or system events (365-day retention)

## Retention Policy

- INFO logs: 90 days
- WARNING logs: 180 days
- ERROR/CRITICAL logs: 365 days
- Compliance-related logs (KYC, disputes): 7 years

## Database Schema

```sql
CREATE TABLE "AuditLog" (
    "id" SERIAL PRIMARY KEY,
    "action" "AuditAction" NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "actorId" INTEGER,
    "actorEmail" TEXT,
    "actorRole" "UserRole",
    "actorIp" TEXT,
    "targetId" INTEGER,
    "targetType" TEXT,
    "targetEmail" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "userAgent" TEXT,
    "requestId" TEXT,
    "sessionId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_targetId_targetType_idx" ON "AuditLog"("targetId", "targetType");
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_actorIp_idx" ON "AuditLog"("actorIp");
CREATE INDEX "AuditLog_success_idx" ON "AuditLog"("success");
```

## Best Practices

1. **Always log administrative actions** - User suspensions, bans, KYC approvals/rejections
2. **Log security events** - Failed logins, suspicious activity, account locks
3. **Include context** - IP addresses, user agents, request IDs
4. **Track changes** - Use oldValues/newValues for update actions
5. **Never throw errors** - Audit logging should never break application flow
6. **Sanitize sensitive data** - Remove passwords, tokens, credit cards from logs
7. **Use correlation IDs** - Link related actions across services
8. **Set appropriate severity** - Use CRITICAL for security events

## Compliance

This audit logging system is designed to meet compliance requirements for:

- **GDPR** - Tracks consent changes and data access
- **SOC 2** - Comprehensive audit trail for security controls
- **PCI DSS** - Logs payment-related actions
- **ISO 27001** - Security event logging

## Example Integration

```typescript
// In your service initialization
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../shared/audit';

const prisma = new PrismaClient();
AuditService.initialize(prisma);

// In your controllers
import { AuditService, AuditAction } from '../shared/audit';

export async function suspendUser(req: Request, res: Response) {
  const { userId } = req.params;
  const { reason, duration } = req.body;
  const adminUser = req.user;
  
  try {
    // Perform the action
    await userService.suspendUser(userId, duration);
    
    // Log the action
    await AuditService.logUserAction(
      AuditAction.USER_SUSPENDED,
      adminUser.id,
      parseInt(userId),
      `User suspended for ${duration}`,
      { reason, duration },
      req.ip
    );
    
    res.json({ success: true });
  } catch (error) {
    // Log the failure
    await AuditService.log({
      action: AuditAction.USER_SUSPENDED,
      actorId: adminUser.id,
      targetId: parseInt(userId),
      description: 'Failed to suspend user',
      success: false,
      errorMessage: error.message
    });
    
    res.status(500).json({ error: 'Failed to suspend user' });
  }
}
```

## Monitoring & Alerts

Set up alerts for critical audit events:

```typescript
// Example: Alert on multiple failed logins
const recentFailedLogins = await AuditService.query({
  action: AuditAction.LOGIN_FAILED,
  actorIp: suspiciousIp,
  startDate: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
});

if (recentFailedLogins.length >= 5) {
  // Trigger alert
  await alertService.send({
    severity: 'HIGH',
    message: `Multiple failed login attempts from ${suspiciousIp}`,
    data: recentFailedLogins
  });
}
```

## License

Internal use only - MNBARA Platform
