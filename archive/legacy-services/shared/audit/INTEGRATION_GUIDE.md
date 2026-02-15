# Audit Logging Integration Guide

This guide shows how to integrate the audit logging module into your MNBARA services.

## Step 1: Initialize the Audit Service

In your service's main entry point (e.g., `index.ts`):

```typescript
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../shared/audit';

const prisma = new PrismaClient();

// Initialize audit service
AuditService.initialize(prisma);

// Start your server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Step 2: Add Middleware to Routes

### Auth Service Example

```typescript
// backend/services/auth-service/src/routes/auth.routes.ts
import { Router } from 'express';
import { 
  auditMiddleware, 
  auditUserAction,
  AuditAction 
} from '../../shared/audit';
import { authMiddleware } from '../middleware/auth.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Login - automatic audit logging
router.post('/login', 
  auditMiddleware(AuditAction.LOGIN_SUCCESS, {
    getDescription: (req) => `Login attempt for ${req.body.email}`,
    captureRequestBody: false // Don't log passwords
  }),
  authController.login
);

// Register - automatic audit logging
router.post('/register',
  auditMiddleware(AuditAction.USER_CREATED, {
    getDescription: (req) => `New user registration: ${req.body.email}`,
    captureRequestBody: false
  }),
  authController.register
);

// Suspend user - admin action
router.post('/users/:userId/suspend',
  authMiddleware,
  auditUserAction(AuditAction.USER_SUSPENDED),
  authController.suspendUser
);

// Ban user - admin action
router.post('/users/:userId/ban',
  authMiddleware,
  auditUserAction(AuditAction.USER_BANNED),
  authController.banUser
);

export default router;
```

### Admin Service Example

```typescript
// backend/services/admin-service/src/routes/kyc.routes.ts
import { Router } from 'express';
import { auditKycAction, AuditAction } from '../../shared/audit';
import { authMiddleware, adminMiddleware } from '../middleware';
import * as kycController from '../controllers/kyc.controller';

const router = Router();

// Approve KYC
router.post('/kyc/:userId/approve',
  authMiddleware,
  adminMiddleware,
  auditKycAction(AuditAction.KYC_APPROVED),
  kycController.approveKyc
);

// Reject KYC
router.post('/kyc/:userId/reject',
  authMiddleware,
  adminMiddleware,
  auditKycAction(AuditAction.KYC_REJECTED),
  kycController.rejectKyc
);

export default router;
```

### Dispute Resolution Example

```typescript
// backend/services/admin-service/src/routes/dispute.routes.ts
import { Router } from 'express';
import { auditDisputeAction, AuditAction } from '../../shared/audit';
import { authMiddleware, adminMiddleware } from '../middleware';
import * as disputeController from '../controllers/dispute.controller';

const router = Router();

// Resolve dispute
router.post('/disputes/:disputeId/resolve',
  authMiddleware,
  adminMiddleware,
  auditDisputeAction(AuditAction.DISPUTE_RESOLVED),
  disputeController.resolveDispute
);

export default router;
```

## Step 3: Manual Logging in Controllers

For more complex scenarios, log manually in your controllers:

```typescript
// backend/services/auth-service/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuditService, AuditAction } from '../../shared/audit';
import * as authService from '../services/auth.service';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  
  try {
    const result = await authService.login(email, password);
    
    // Log successful login
    await AuditService.logAuthEvent(
      AuditAction.LOGIN_SUCCESS,
      result.user.id,
      email,
      true,
      req.ip
    );
    
    res.json(result);
  } catch (error) {
    // Log failed login
    await AuditService.logAuthEvent(
      AuditAction.LOGIN_FAILED,
      undefined,
      email,
      false,
      req.ip,
      error.message
    );
    
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

export async function suspendUser(req: Request, res: Response) {
  const { userId } = req.params;
  const { reason, duration } = req.body;
  const adminUser = req.user;
  
  try {
    // Get user before suspension for audit trail
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    
    // Perform suspension
    await authService.suspendUser(parseInt(userId), duration);
    
    // Log the action with details
    await AuditService.logUserAction(
      AuditAction.USER_SUSPENDED,
      adminUser.id,
      parseInt(userId),
      `User ${user.email} suspended for ${duration}`,
      { 
        reason,
        duration,
        previousStatus: user.isActive,
        suspendedBy: adminUser.email
      },
      req.ip
    );
    
    res.json({ success: true });
  } catch (error) {
    // Log failure
    await AuditService.log({
      action: AuditAction.USER_SUSPENDED,
      actorId: adminUser.id,
      targetId: parseInt(userId),
      description: 'Failed to suspend user',
      success: false,
      errorMessage: error.message,
      actorIp: req.ip
    });
    
    res.status(500).json({ error: 'Failed to suspend user' });
  }
}
```

## Step 4: KYC Approval Example

```typescript
// backend/services/admin-service/src/controllers/kyc.controller.ts
import { Request, Response } from 'express';
import { AuditService, AuditAction } from '../../shared/audit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function approveKyc(req: Request, res: Response) {
  const { userId } = req.params;
  const { level, notes } = req.body;
  const adminUser = req.user;
  
  try {
    // Get current KYC status
    const kycBefore = await prisma.kycVerification.findUnique({
      where: { userId: parseInt(userId) }
    });
    
    // Approve KYC
    const kycAfter = await prisma.kycVerification.update({
      where: { userId: parseInt(userId) },
      data: {
        status: 'APPROVED',
        level,
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
        approvedAt: new Date()
      }
    });
    
    // Log with before/after values
    await AuditService.log({
      action: AuditAction.KYC_APPROVED,
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      actorIp: req.ip,
      targetId: parseInt(userId),
      targetType: 'KycVerification',
      description: `KYC approved for user ${userId} at level ${level}`,
      oldValues: {
        status: kycBefore.status,
        level: kycBefore.level
      },
      newValues: {
        status: kycAfter.status,
        level: kycAfter.level,
        reviewedBy: adminUser.id,
        reviewNotes: notes
      },
      metadata: {
        verificationLevel: level,
        reviewNotes: notes
      }
    });
    
    res.json({ success: true, kyc: kycAfter });
  } catch (error) {
    await AuditService.log({
      action: AuditAction.KYC_APPROVED,
      actorId: adminUser.id,
      targetId: parseInt(userId),
      description: 'Failed to approve KYC',
      success: false,
      errorMessage: error.message
    });
    
    res.status(500).json({ error: 'Failed to approve KYC' });
  }
}

export async function rejectKyc(req: Request, res: Response) {
  const { userId } = req.params;
  const { reason, notes } = req.body;
  const adminUser = req.user;
  
  try {
    const kycBefore = await prisma.kycVerification.findUnique({
      where: { userId: parseInt(userId) }
    });
    
    const kycAfter = await prisma.kycVerification.update({
      where: { userId: parseInt(userId) },
      data: {
        status: 'REJECTED',
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
        reviewNotes: notes
      }
    });
    
    await AuditService.log({
      action: AuditAction.KYC_REJECTED,
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      actorIp: req.ip,
      targetId: parseInt(userId),
      targetType: 'KycVerification',
      description: `KYC rejected for user ${userId}: ${reason}`,
      oldValues: {
        status: kycBefore.status
      },
      newValues: {
        status: kycAfter.status,
        reviewedBy: adminUser.id,
        reviewNotes: notes
      },
      metadata: {
        rejectionReason: reason,
        reviewNotes: notes
      },
      severity: 'WARNING'
    });
    
    res.json({ success: true, kyc: kycAfter });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
}
```

## Step 5: Dispute Resolution Example

```typescript
// backend/services/admin-service/src/controllers/dispute.controller.ts
import { Request, Response } from 'express';
import { AuditService, AuditAction } from '../../shared/audit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function resolveDispute(req: Request, res: Response) {
  const { disputeId } = req.params;
  const { resolution, outcome, refundAmount, notes } = req.body;
  const adminUser = req.user;
  
  try {
    // Get dispute details
    const dispute = await prisma.dispute.findUnique({
      where: { id: parseInt(disputeId) },
      include: { escrow: true }
    });
    
    // Resolve dispute
    const resolvedDispute = await prisma.dispute.update({
      where: { id: parseInt(disputeId) },
      data: {
        status: outcome,
        resolution,
        adminNotes: notes,
        resolvedAt: new Date()
      }
    });
    
    // Handle escrow based on outcome
    if (outcome === 'RESOLVED_BUYER') {
      await prisma.escrow.update({
        where: { id: dispute.escrowId },
        data: { status: 'REFUNDED_TO_BUYER' }
      });
    } else if (outcome === 'RESOLVED_TRAVELER') {
      await prisma.escrow.update({
        where: { id: dispute.escrowId },
        data: { status: 'RELEASED_TO_TRAVELER' }
      });
    }
    
    // Log the resolution
    await AuditService.logDisputeAction(
      AuditAction.DISPUTE_RESOLVED,
      adminUser.id,
      parseInt(disputeId),
      `Dispute ${disputeId} resolved: ${outcome}`,
      {
        outcome,
        resolution,
        refundAmount,
        escrowId: dispute.escrowId,
        escrowAmount: dispute.escrow.amount,
        adminNotes: notes,
        resolvedBy: adminUser.email
      }
    );
    
    res.json({ success: true, dispute: resolvedDispute });
  } catch (error) {
    await AuditService.log({
      action: AuditAction.DISPUTE_RESOLVED,
      actorId: adminUser.id,
      targetId: parseInt(disputeId),
      description: 'Failed to resolve dispute',
      success: false,
      errorMessage: error.message
    });
    
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
}
```

## Step 6: Security Event Logging

```typescript
// backend/services/auth-service/src/middleware/security.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuditService, AuditAction } from '../../shared/audit';

const loginAttempts = new Map<string, number>();

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;
  const attempts = loginAttempts.get(ip) || 0;
  
  if (attempts >= 5) {
    // Log suspicious activity
    await AuditService.logSecurityEvent(
      AuditAction.SUSPICIOUS_ACTIVITY_DETECTED,
      `Multiple failed login attempts from ${ip}`,
      {
        attempts,
        timeWindow: '5 minutes',
        endpoint: req.path
      },
      ip
    );
    
    // Block IP
    await AuditService.logSecurityEvent(
      AuditAction.IP_BLOCKED,
      `IP ${ip} blocked due to excessive failed login attempts`,
      { attempts },
      ip
    );
    
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  }
  
  next();
}
```

## Step 7: Query Audit Logs

```typescript
// backend/services/admin-service/src/controllers/audit.controller.ts
import { Request, Response } from 'express';
import { AuditService, AuditSeverity } from '../../shared/audit';

export async function getAuditLogs(req: Request, res: Response) {
  const { 
    action, 
    actorId, 
    targetId, 
    targetType, 
    severity,
    startDate,
    endDate,
    limit = 100,
    offset = 0
  } = req.query;
  
  try {
    const logs = await AuditService.query({
      action: action as any,
      actorId: actorId ? parseInt(actorId as string) : undefined,
      targetId: targetId ? parseInt(targetId as string) : undefined,
      targetType: targetType as string,
      severity: severity as AuditSeverity,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
    
    res.json({ logs, count: logs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

export async function getUserAuditTrail(req: Request, res: Response) {
  const { userId } = req.params;
  
  try {
    // Get all actions performed by this user
    const actorLogs = await AuditService.query({
      actorId: parseInt(userId),
      limit: 100
    });
    
    // Get all actions targeting this user
    const targetLogs = await AuditService.query({
      targetId: parseInt(userId),
      targetType: 'User',
      limit: 100
    });
    
    res.json({
      actorLogs,
      targetLogs,
      totalActions: actorLogs.length + targetLogs.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user audit trail' });
  }
}
```

## Best Practices

1. **Always initialize AuditService** at application startup
2. **Use middleware for routes** when possible for consistency
3. **Log both success and failure** to track all attempts
4. **Include context** - IP addresses, user agents, request IDs
5. **Track changes** - Use oldValues/newValues for updates
6. **Set appropriate severity** - CRITICAL for security events
7. **Never throw errors** - Audit logging should never break app flow
8. **Sanitize sensitive data** - Remove passwords, tokens from logs
9. **Use correlation IDs** - Link related actions across services
10. **Query logs regularly** - Monitor for suspicious patterns

## Testing

```typescript
// Example test
import { AuditService, AuditAction } from '../../shared/audit';
import { PrismaClient } from '@prisma/client';

describe('Audit Logging', () => {
  let prisma: PrismaClient;
  
  beforeAll(() => {
    prisma = new PrismaClient();
    AuditService.initialize(prisma);
  });
  
  it('should log user suspension', async () => {
    await AuditService.logUserAction(
      AuditAction.USER_SUSPENDED,
      1, // admin ID
      2, // target user ID
      'User suspended for testing',
      { reason: 'test' }
    );
    
    const logs = await AuditService.query({
      action: AuditAction.USER_SUSPENDED,
      targetId: 2
    });
    
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe(AuditAction.USER_SUSPENDED);
  });
});
```

## Monitoring Dashboard

Create an admin dashboard to view audit logs:

```typescript
// Example API endpoint for dashboard
router.get('/admin/audit/dashboard', async (req, res) => {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const [
    criticalEvents,
    failedLogins,
    kycActions,
    disputeActions
  ] = await Promise.all([
    AuditService.query({ severity: 'CRITICAL', startDate: last24Hours }),
    AuditService.query({ action: AuditAction.LOGIN_FAILED, startDate: last24Hours }),
    AuditService.query({ targetType: 'KycVerification', startDate: last24Hours }),
    AuditService.query({ targetType: 'Dispute', startDate: last24Hours })
  ]);
  
  res.json({
    criticalEvents: criticalEvents.length,
    failedLogins: failedLogins.length,
    kycActions: kycActions.length,
    disputeActions: disputeActions.length,
    recentCritical: criticalEvents.slice(0, 10)
  });
});
```
