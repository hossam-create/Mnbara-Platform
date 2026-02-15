import { Prisma } from '@prisma/client';
import { prisma } from '../index';
import { logger } from './logger';

interface AuditLogData {
  userId?: string;
  walletId?: string;
  transactionId?: string;
  kycDocumentId?: string;
  settlementId?: string;
  escrowHoldId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export const createAuditLog = async (data: AuditLogData) => {
  try {
    const auditLogData: any = {
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      oldValue: data.oldValue ? JSON.stringify(data.oldValue) : Prisma.JsonNull,
      newValue: data.newValue ? JSON.stringify(data.newValue) : Prisma.JsonNull,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata ? JSON.stringify(data.metadata) : Prisma.JsonNull,
    };

    // Add optional fields only if they exist
    if (data.userId) auditLogData.userId = data.userId;
    if (data.walletId) auditLogData.walletId = data.walletId;
    if (data.transactionId) auditLogData.transactionId = data.transactionId;
    if (data.kycDocumentId) auditLogData.kycDocumentId = data.kycDocumentId;
    if (data.settlementId) auditLogData.settlementId = data.settlementId;
    if (data.escrowHoldId) auditLogData.escrowHoldId = data.escrowHoldId;

    const auditLog = await prisma.auditLog.create({
      data: auditLogData,
    });

    logger.info(`Audit log created: ${data.action} on ${data.resourceType}`, {
      auditLogId: auditLog.id,
      userId: data.userId,
      resourceId: data.resourceId,
      action: data.action,
    });

    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw error - audit logging should not break the main operation
    return null;
  }
};

export const getAuditLogs = async (filters: {
  userId?: string;
  walletId?: string;
  transactionId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) => {
  try {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.walletId) where.walletId = filters.walletId;
    if (filters.transactionId) where.transactionId = filters.transactionId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          wallet: {
            select: {
              id: true,
              currency: true,
              type: true,
            },
          },
          transaction: {
            select: {
              id: true,
              type: true,
              amount: true,
              currency: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      auditLogs: auditLogs.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        user: log.user,
        wallet: log.wallet,
        transaction: log.transaction,
        oldValue: log.oldValue && typeof log.oldValue === 'string' ? JSON.parse(log.oldValue) : log.oldValue,
        newValue: log.newValue && typeof log.newValue === 'string' ? JSON.parse(log.newValue) : log.newValue,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        metadata: log.metadata && typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata,
        createdAt: log.createdAt,
      })),
      total,
    };
  } catch (error) {
    logger.error('Failed to get audit logs:', error);
    throw new Error('Failed to retrieve audit logs');
  }
};