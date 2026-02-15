import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { FinancialSecurityService } from '../services/security/FinancialSecurityService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { rbacMiddleware } from '../middleware/rbac';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const securityService = new FinancialSecurityService(prisma);

// Lock financial period
router.post('/periods/lock', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN', 'FINANCIAL_MANAGER']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      fiscalYear: z.number(),
      fiscalQuarter: z.number().optional(),
      fiscalMonth: z.number().optional(),
      reason: z.string().optional()
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const periodId = await securityService.lockFinancialPeriod(
      data.businessAccountId,
      data.fiscalYear,
      data.fiscalQuarter,
      data.fiscalMonth,
      userId,
      data.reason
    );

    res.json({ 
      success: true, 
      data: { periodId }
    });
  } catch (error) {
    logger.error('Failed to lock financial period:', error);
    res.status(500).json({ error: 'Failed to lock financial period' });
  }
});

// Close financial period
router.post('/periods/close', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN', 'FINANCIAL_MANAGER']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      fiscalYear: z.number(),
      fiscalQuarter: z.number().optional(),
      fiscalMonth: z.number().optional(),
      closingData: z.record(z.any()).optional(),
      finalNotes: z.string().optional()
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const closeEventId = await securityService.closeFinancialPeriod(
      data.businessAccountId,
      data.fiscalYear,
      data.fiscalQuarter,
      data.fiscalMonth,
      userId,
      data.closingData,
      data.finalNotes
    );

    res.json({ 
      success: true, 
      data: { closeEventId }
    });
  } catch (error) {
    logger.error('Failed to close financial period:', error);
    res.status(500).json({ error: 'Failed to close financial period' });
  }
});

// Finalize financial period
router.post('/periods/finalize', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      fiscalYear: z.number(),
      fiscalQuarter: z.number().optional(),
      fiscalMonth: z.number().optional(),
      finalNotes: z.string().optional()
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const periodId = await securityService.finalizeFinancialPeriod(
      data.businessAccountId,
      data.fiscalYear,
      data.fiscalQuarter,
      data.fiscalMonth,
      userId,
      data.finalNotes
    );

    res.json({ 
      success: true, 
      data: { periodId }
    });
  } catch (error) {
    logger.error('Failed to finalize financial period:', error);
    res.status(500).json({ error: 'Failed to finalize financial period' });
  }
});

// Get financial period status
router.get('/periods/status/:businessAccountId', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN', 'FINANCIAL_MANAGER', 'FINANCIAL_VIEWER', 'AUDITOR']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const schema = z.object({
      fiscalYear: z.string().optional().transform(val => parseInt(val)),
      periodStatus: z.string().optional(),
      fiscalQuarter: z.string().optional().transform(val => parseInt(val)),
      fiscalMonth: z.string().optional().transform(val => parseInt(val))
    });

    const filters = schema.parse(req.query);

    const periods = await securityService.getFinancialPeriodStatus(
      businessAccountId,
      filters.fiscalYear,
      {
        periodStatus: filters.periodStatus,
        fiscalQuarter: filters.fiscalQuarter,
        fiscalMonth: filters.fiscalMonth
      }
    );

    res.json({ 
      success: true, 
      data: periods 
    });
  } catch (error) {
    logger.error('Failed to get financial period status:', error);
    res.status(500).json({ error: 'Failed to get financial period status' });
  }
});

// Create assumption version
router.post('/assumptions/versions', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN', 'FINANCIAL_MANAGER']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      assumptionKey: z.string(),
      versionNumber: z.number(),
      assumptionValue: z.number(),
      changeReason: z.string(),
      approvalRequired: z.boolean().default(false)
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const versionId = await securityService.createAssumptionVersion(
      data.businessAccountId,
      data.assumptionKey,
      data.versionNumber,
      data.assumptionValue,
      data.changeReason,
      userId,
      data.approvalRequired
    );

    res.json({ 
      success: true, 
      data: { versionId }
    });
  } catch (error) {
    logger.error('Failed to create assumption version:', error);
    res.status(500).json({ error: 'Failed to create assumption version' });
  }
});

// Approve assumption version
router.post('/assumptions/approve', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      versionId: z.string(),
      approvalNotes: z.string().optional()
    });

    const data = schema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await securityService.approveAssumptionVersion(
      data.businessAccountId,
      data.versionId,
      userId,
      data.approvalNotes
    );

    res.json({ 
      success: true, 
      message: 'Assumption version approved successfully' 
    });
  } catch (error) {
    logger.error('Failed to approve assumption version:', error);
    res.status(500).json({ error: 'Failed to approve assumption version' });
  }
});

// Get assumption versions
router.get('/assumptions/versions/:businessAccountId', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN', 'FINANCIAL_MANAGER', 'FINANCIAL_VIEWER', 'AUDITOR']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const schema = z.object({
      assumptionKey: z.string().optional(),
      versionStatus: z.string().optional(),
      effectiveDate: z.string().optional()
    });

    const filters = schema.parse(req.query);

    const versions = await securityService.getAssumptionVersions(
      businessAccountId,
      filters.assumptionKey,
      {
        versionStatus: filters.versionStatus,
        effectiveDate: filters.effectiveDate
      }
    );

    res.json({ 
      success: true, 
      data: versions 
    });
  } catch (error) {
    logger.error('Failed to get assumption versions:', error);
    res.status(500).json({ error: 'Failed to get assumption versions' });
  }
});

// Check financial permissions
router.post('/permissions/check', authMiddleware, async (req: AuthenticatedRequest, res: any) => {
  try {
    const schema = z.object({
      businessAccountId: z.string(),
      userId: z.string(),
      requiredPermission: z.string()
    });

    const data = schema.parse(req.body);

    const hasPermission = await securityService.checkFinancialPermission(
      data.userId,
      data.businessAccountId,
      data.requiredPermission
    );

    res.json({ 
      success: true, 
      data: { hasPermission }
    });
  } catch (error) {
    logger.error('Failed to check financial permissions:', error);
    res.status(500).json({ error: 'Failed to check financial permissions' });
  }
});

// Get security audit log
router.get('/audit/:businessAccountId', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN', 'AUDITOR']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const schema = z.object({
      eventType: z.string().optional(),
      eventSeverity: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      userId: z.string().optional(),
      limit: z.string().optional().transform(val => parseInt(val))
    });

    const filters = schema.parse(req.query);

    const auditLog = await securityService.getSecurityAuditLog(
      businessAccountId,
      {
        eventType: filters.eventType,
        eventSeverity: filters.eventSeverity,
        startDate: filters.startDate,
        endDate: filters.endDate,
        userId: filters.userId,
        limit: filters.limit
      }
    );

    res.json({ 
      success: true, 
      data: auditLog 
    });
  } catch (error) {
    logger.error('Failed to get security audit log:', error);
    res.status(500).json({ error: 'Failed to get security audit log' });
  }
});

// Get financial role permissions
router.get('/roles/:businessAccountId', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN', 'AUDITOR']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;

    const permissions = await securityService.getFinancialRolePermissions(businessAccountId);

    res.json({ 
      success: true, 
      data: permissions 
    });
  } catch (error) {
    logger.error('Failed to get financial role permissions:', error);
    res.status(500).json({ error: 'Failed to get financial role permissions' });
  }
});

// Get financial close events
router.get('/close-events/:businessAccountId', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN', 'FINANCIAL_MANAGER', 'AUDITOR']), async (req: AuthenticatedRequest, res: any) => {
  try {
    const { businessAccountId } = req.params;
    const schema = z.object({
      closeType: z.string().optional(),
      closeStatus: z.string().optional(),
      fiscalYear: z.string().optional().transform(val => parseInt(val)),
      limit: z.string().optional().transform(val => parseInt(val))
    });

    const filters = schema.parse(req.query);

    const events = await securityService.getFinancialCloseEvents(
      businessAccountId,
      {
        closeType: filters.closeType,
        closeStatus: filters.closeStatus,
        fiscalYear: filters.fiscalYear,
        limit: filters.limit
      }
    );

    res.json({ 
      success: true, 
      data: events 
    });
  } catch (error) {
    logger.error('Failed to get financial close events:', error);
    res.status(500).json({ error: 'Failed to get financial close events' });
  }
});

// Refresh security views
router.post('/refresh-views', authMiddleware, rbacMiddleware(['FINANCIAL_ADMIN']), async (req: AuthenticatedRequest, res: any) => {
  try {
    await securityService.refreshSecurityViews();

    res.json({ 
      success: true, 
      message: 'Security views refreshed successfully' 
    });
  } catch (error) {
    logger.error('Failed to refresh security views:', error);
    res.status(500).json({ error: 'Failed to refresh security views' });
  }
});

export default router;
