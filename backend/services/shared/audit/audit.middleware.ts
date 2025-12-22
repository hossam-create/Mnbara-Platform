import { Request, Response, NextFunction } from 'express';
import { AuditAction } from '@prisma/client';
import { AuditService } from './audit.service';

/**
 * Audit Middleware
 * 
 * Automatically logs HTTP requests that match specific patterns.
 * Attach this middleware to routes that need audit logging.
 * 
 * Usage:
 * ```typescript
 * router.post('/users/:id/suspend', 
 *   authMiddleware,
 *   auditMiddleware(AuditAction.USER_SUSPENDED),
 *   suspendUserController
 * );
 * ```
 */

export interface AuditMiddlewareOptions {
  action: AuditAction;
  getTargetId?: (req: Request) => number | undefined;
  getTargetType?: (req: Request) => string | undefined;
  getDescription?: (req: Request) => string;
  getMetadata?: (req: Request) => Record<string, any> | undefined;
  captureRequestBody?: boolean;
  captureResponseBody?: boolean;
}

/**
 * Create audit middleware for a specific action
 */
export function auditMiddleware(
  action: AuditAction,
  options?: Partial<AuditMiddlewareOptions>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.send;
    let responseBody: any;
    
    // Intercept response if needed
    if (options?.captureResponseBody) {
      res.send = function (body: any) {
        responseBody = body;
        return originalSend.call(this, body);
      };
    }
    
    // Wait for response to complete
    res.on('finish', async () => {
      try {
        const user = (req as any).user; // Assumes auth middleware sets req.user
        const success = res.statusCode >= 200 && res.statusCode < 300;
        
        const targetId = options?.getTargetId 
          ? options.getTargetId(req)
          : req.params.id ? parseInt(req.params.id) : undefined;
        
        const targetType = options?.getTargetType
          ? options.getTargetType(req)
          : undefined;
        
        const description = options?.getDescription
          ? options.getDescription(req)
          : `${action} - ${req.method} ${req.path}`;
        
        let metadata: Record<string, any> = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        };
        
        if (options?.getMetadata) {
          metadata = { ...metadata, ...options.getMetadata(req) };
        }
        
        if (options?.captureRequestBody && req.body) {
          metadata.requestBody = sanitizeBody(req.body);
        }
        
        if (options?.captureResponseBody && responseBody) {
          metadata.responseBody = sanitizeBody(responseBody);
        }
        
        await AuditService.log({
          action,
          actorId: user?.id,
          actorEmail: user?.email,
          actorRole: user?.role,
          actorIp: getClientIp(req),
          targetId,
          targetType,
          description,
          metadata,
          userAgent: req.get('user-agent'),
          requestId: (req as any).requestId || req.get('x-request-id'),
          success,
          errorMessage: success ? undefined : `HTTP ${res.statusCode}`,
        });
      } catch (error) {
        console.error('Audit middleware error:', error);
      }
    });
    
    next();
  };
}

/**
 * Audit middleware specifically for user management actions
 */
export function auditUserAction(action: AuditAction) {
  return auditMiddleware(action, {
    getTargetId: (req) => parseInt(req.params.userId || req.params.id),
    getTargetType: () => 'User',
    getDescription: (req) => {
      const targetId = req.params.userId || req.params.id;
      return `${action} for user ${targetId}`;
    },
    getMetadata: (req) => ({
      reason: req.body.reason,
      duration: req.body.duration,
      notes: req.body.notes,
    }),
  });
}

/**
 * Audit middleware for KYC actions
 */
export function auditKycAction(action: AuditAction) {
  return auditMiddleware(action, {
    getTargetId: (req) => parseInt(req.params.userId || req.body.userId),
    getTargetType: () => 'KycVerification',
    getDescription: (req) => {
      const targetId = req.params.userId || req.body.userId;
      return `${action} for user ${targetId}`;
    },
    getMetadata: (req) => ({
      documentType: req.body.documentType,
      verificationLevel: req.body.level,
      rejectionReason: req.body.rejectionReason,
      notes: req.body.notes,
    }),
  });
}

/**
 * Audit middleware for dispute actions
 */
export function auditDisputeAction(action: AuditAction) {
  return auditMiddleware(action, {
    getTargetId: (req) => parseInt(req.params.disputeId || req.params.id),
    getTargetType: () => 'Dispute',
    getDescription: (req) => {
      const targetId = req.params.disputeId || req.params.id;
      return `${action} for dispute ${targetId}`;
    },
    getMetadata: (req) => ({
      resolution: req.body.resolution,
      outcome: req.body.outcome,
      refundAmount: req.body.refundAmount,
      notes: req.body.notes,
    }),
  });
}

/**
 * Audit middleware for escrow actions
 */
export function auditEscrowAction(action: AuditAction) {
  return auditMiddleware(action, {
    getTargetId: (req) => parseInt(req.params.escrowId || req.params.id),
    getTargetType: () => 'Escrow',
    getDescription: (req) => {
      const targetId = req.params.escrowId || req.params.id;
      return `${action} for escrow ${targetId}`;
    },
    getMetadata: (req) => ({
      amount: req.body.amount,
      orderId: req.body.orderId,
      reason: req.body.reason,
    }),
  });
}

/**
 * Get client IP address from request
 */
function getClientIp(req: Request): string | undefined {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress
  );
}

/**
 * Sanitize request/response body to remove sensitive data
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'cvv',
  ];
  
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

export default auditMiddleware;
