import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogData {
  businessAccountId?: string;
  tableName: string;
  recordId?: string;
  action: string;
  oldValues?: any;
  newValues?: any;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export function auditLog(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store audit data in request for later use
    req.auditAction = action;
    req.auditStartTime = new Date();
    next();
  };
}

export async function logAuditEvent(
  action: string,
  data: AuditLogData,
  req?: Request
): Promise<void> {
  try {
    await prisma.businessAuditLog.create({
      data: {
        businessAccountId: data.businessAccountId || 'system',
        tableName: data.tableName,
        recordId: data.recordId,
        action,
        oldValues: data.oldValues,
        newValues: {
          ...data.newValues,
          timestamp: new Date(),
          ipAddress: data.ipAddress || (req?.ip || '127.0.0.1'),
          userAgent: data.userAgent || (req?.get('User-Agent') || 'Unknown')
        },
        userId: data.userId,
        ipAddress: data.ipAddress || (req?.ip || '127.0.0.1'),
        userAgent: data.userAgent || (req?.get('User-Agent') || 'Unknown'),
        createdAt: data.createdAt || new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging failure shouldn't break main flow
  }
}

// Middleware to automatically log audit events after response
export function autoAuditLog(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the audit event if action was set
    if (req.auditAction && req.auditStartTime) {
      logAuditEvent(req.auditAction, {
        tableName: req.auditTable || 'unknown',
        recordId: req.auditRecordId,
        action: req.auditAction,
        newValues: {
          response: data,
          duration: Date.now() - req.auditStartTime.getTime()
        },
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }, req);
    }
    
    originalSend.call(res, data);
  };
  
  next();
}
