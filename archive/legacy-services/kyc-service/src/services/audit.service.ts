/**
 * Audit Service
 * Comprehensive audit logging for all KYC actions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum AuditAction {
  // Document actions
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_VIEWED = 'DOCUMENT_VIEWED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  DOCUMENT_DOWNLOADED = 'DOCUMENT_DOWNLOADED',
  
  // Verification actions
  VERIFICATION_STARTED = 'VERIFICATION_STARTED',
  VERIFICATION_COMPLETED = 'VERIFICATION_COMPLETED',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
  VERIFICATION_EXPIRED = 'VERIFICATION_EXPIRED',
  
  // Review actions
  REVIEW_ASSIGNED = 'REVIEW_ASSIGNED',
  REVIEW_COMPLETED = 'REVIEW_COMPLETED',
  
  // Admin actions
  ADMIN_OVERRIDE = 'ADMIN_OVERRIDE',
  STATUS_CHANGED = 'STATUS_CHANGED',
  
  // Security actions
  ACCESS_DENIED = 'ACCESS_DENIED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  severity: AuditSeverity;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.kycAuditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          severity: entry.severity,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          errorMessage: entry.errorMessage,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log document upload
   */
  async logDocumentUpload(
    userId: string,
    documentId: string,
    documentType: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DOCUMENT_UPLOADED,
      severity: AuditSeverity.INFO,
      resourceType: 'DOCUMENT',
      resourceId: documentId,
      ipAddress,
      userAgent,
      metadata: { documentType },
    });
  }

  /**
   * Log document access
   */
  async logDocumentAccess(
    userId: string,
    documentId: string,
    action: AuditAction,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      severity: action === AuditAction.ACCESS_DENIED 
        ? AuditSeverity.WARNING 
        : AuditSeverity.INFO,
      resourceType: 'DOCUMENT',
      resourceId: documentId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log verification status change
   */
  async logVerificationChange(
    userId: string,
    verificationId: string,
    previousStatus: string,
    newStatus: string,
    changedBy?: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: newStatus === 'APPROVED' 
        ? AuditAction.VERIFICATION_APPROVED 
        : newStatus === 'REJECTED'
        ? AuditAction.VERIFICATION_REJECTED
        : AuditAction.STATUS_CHANGED,
      severity: newStatus === 'REJECTED' ? AuditSeverity.WARNING : AuditSeverity.INFO,
      resourceType: 'VERIFICATION',
      resourceId: verificationId,
      metadata: {
        previousStatus,
        newStatus,
        changedBy,
        reason,
      },
    });
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    adminId: string,
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId: adminId,
      action,
      severity: AuditSeverity.INFO,
      resourceType,
      resourceId,
      metadata,
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ) {
    return await prisma.kycAuditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ) {
    return await prisma.kycAuditLog.findMany({
      where: {
        resourceType,
        resourceId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit logs by action
   */
  async getAuditLogsByAction(
    action: AuditAction,
    limit: number = 100
  ) {
    return await prisma.kycAuditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(query: {
    userId?: string;
    action?: AuditAction;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.severity) where.severity = query.severity;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    return await prisma.kycAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit || 100,
    });
  }
}

export const auditService = new AuditService();
