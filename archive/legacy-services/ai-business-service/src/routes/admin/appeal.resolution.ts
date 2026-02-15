import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  AppealResolution, 
  AppealStatus,
  AppealError,
  AppealErrorCodes
} from '../../models/appeal.model';
import { authenticateAdmin, requirePermission } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { auditLog } from '../../middleware/audit.middleware';

const router = Router();
const prisma = new PrismaClient();

// Extend Request interface for admin data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        businessAccountId?: string;
      };
    }
  }
}

// Appeal Resolution Schema
const AppealResolutionSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT', 'REQUEST_INFO'], {
    errorMap: () => ({ message: 'Invalid resolution action' })
  }),
  admin_notes: z.string()
    .min(1, 'Admin notes are required for appeal resolution')
    .max(2000, 'Admin notes cannot exceed 2000 characters')
    .trim()
    .refine(val => val.length > 0, 'Admin notes cannot be empty'),
  reviewed_by: z.string().uuid('Invalid admin ID format')
});

// POST /admin/trust/appeals/:id/resolve
router.post('/:id/resolve',
  authenticateAdmin,
  requirePermission('appeals:resolve'),
  validateRequest(AppealResolutionSchema),
  auditLog('APPEAL_RESOLUTION'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action, admin_notes, reviewed_by } = req.body;
      const adminId = req.user!.id;

      console.log(`🔍 Admin appeal resolution: ${action} for appeal ${id} by admin ${adminId}`);

      // Verify appeal exists
      const appeal = await prisma.appeal.findUnique({
        where: { appeal_id: id },
        include: {
          trustCase: {
            include: {
              rule: true,
              businessAccount: true
            }
          }
        }
      });

      if (!appeal) {
        return res.status(404).json({
          error: 'Appeal not found',
          code: AppealErrorCodes.APPEAL_NOT_FOUND
        });
      }

      // Verify appeal is in a resolvable state
      if (appeal.status === 'ACCEPTED' || appeal.status === 'REJECTED') {
        return res.status(400).json({
          error: 'Appeal has already been resolved',
          code: AppealErrorCodes.APPEAL_ALREADY_RESOLVED
        });
      }

      // Perform resolution based on action
      const resolution = await performAppealResolution(
        id, 
        action, 
        admin_notes, 
        reviewed_by || adminId, 
        appeal
      );

      // Log resolution action
      await logAppealResolution(id, action, adminId, resolution, appeal);

      console.log(`✅ Appeal ${id} resolved with action: ${action}`);

      res.json({
        success: true,
        appeal_id: id,
        resolution_action: action,
        new_status: resolution.new_status,
        resolved_at: resolution.resolved_at,
        resolved_by: resolution.resolved_by,
        admin_notes: resolution.admin_notes,
        trust_case: {
          case_id: appeal.trustCase?.case_id,
          status: appeal.trustCase?.status,
          severity: appeal.trustCase?.severity,
          rule_name: appeal.trustCase?.rule?.name
        },
        // Explicitly state no financial changes
        financial_impact: {
          wallet_changed: false,
          escrow_changed: false,
          ledger_changed: false,
          payment_processed: false,
          message: 'Appeal resolution is informational only - no financial systems affected'
        }
      });

    } catch (error) {
      console.error('Error resolving appeal:', error);
      
      if (error instanceof AppealError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Resolution implementation functions
async function performAppealResolution(
  appealId: string,
  action: string,
  adminNotes: string,
  reviewedBy: string,
  existingAppeal: any
): Promise<any> {
  let newStatus: AppealStatus;

  switch (action) {
    case 'ACCEPT':
      newStatus = 'ACCEPTED';
      return await acceptAppeal(appealId, adminNotes, reviewedBy, existingAppeal);
    
    case 'REJECT':
      newStatus = 'REJECTED';
      return await rejectAppeal(appealId, adminNotes, reviewedBy, existingAppeal);
    
    case 'REQUEST_INFO':
      newStatus = 'UNDER_REVIEW';
      return await requestMoreInfo(appealId, adminNotes, reviewedBy, existingAppeal);
    
    default:
      throw new AppealError(
        'Invalid resolution action',
        AppealErrorCodes.INVALID_STATUS,
        400
      );
  }
}

async function acceptAppeal(
  appealId: string,
  adminNotes: string,
  reviewedBy: string,
  existingAppeal: any
): Promise<any> {
  const updatedAppeal = await prisma.appeal.update({
    where: { appeal_id: appealId },
    data: {
      status: 'ACCEPTED' as AppealStatus,
      admin_notes: adminNotes,
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
      updated_at: new Date()
    },
    include: {
      trustCase: {
        include: {
          rule: true,
          businessAccount: true
        }
      }
    }
  });

  // Log acceptance - NO FINANCIAL CHANGES
  await logFinancialNonImpact(appealId, 'ACCEPT', reviewedBy, {
    message: 'Appeal accepted - informational only, no financial systems affected',
    trust_case_status: existingAppeal.trustCase?.status,
    appeal_decision: 'ACCEPTED'
  });

  return {
    new_status: 'ACCEPTED',
    resolved_at: updatedAppeal.reviewed_at,
    resolved_by: reviewedBy,
    admin_notes: adminNotes,
    impact: 'INFORMATIONAL_ONLY'
  };
}

async function rejectAppeal(
  appealId: string,
  adminNotes: string,
  reviewedBy: string,
  existingAppeal: any
): Promise<any> {
  const updatedAppeal = await prisma.appeal.update({
    where: { appeal_id: appealId },
    data: {
      status: 'REJECTED' as AppealStatus,
      admin_notes: adminNotes,
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
      updated_at: new Date()
    },
    include: {
      trustCase: {
        include: {
          rule: true,
          businessAccount: true
        }
      }
    }
  });

  // Log rejection - NO FINANCIAL CHANGES
  await logFinancialNonImpact(appealId, 'REJECT', reviewedBy, {
    message: 'Appeal rejected - informational only, no financial systems affected',
    trust_case_status: existingAppeal.trustCase?.status,
    appeal_decision: 'REJECTED'
  });

  return {
    new_status: 'REJECTED',
    resolved_at: updatedAppeal.reviewed_at,
    resolved_by: reviewedBy,
    admin_notes: adminNotes,
    impact: 'INFORMATIONAL_ONLY'
  };
}

async function requestMoreInfo(
  appealId: string,
  adminNotes: string,
  reviewedBy: string,
  existingAppeal: any
): Promise<any> {
  const updatedAppeal = await prisma.appeal.update({
    where: { appeal_id: appealId },
    data: {
      status: 'UNDER_REVIEW' as AppealStatus,
      admin_notes: adminNotes,
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
      updated_at: new Date()
    },
    include: {
      trustCase: {
        include: {
          rule: true,
          businessAccount: true
        }
      }
    }
  });

  // Log info request - NO FINANCIAL CHANGES
  await logFinancialNonImpact(appealId, 'REQUEST_INFO', reviewedBy, {
    message: 'Additional information requested - informational only, no financial systems affected',
    trust_case_status: existingAppeal.trustCase?.status,
    appeal_decision: 'UNDER_REVIEW'
  });

  return {
    new_status: 'UNDER_REVIEW',
    resolved_at: updatedAppeal.reviewed_at,
    resolved_by: reviewedBy,
    admin_notes: adminNotes,
    impact: 'INFORMATIONAL_ONLY',
    next_action: 'AWAITING_USER_RESPONSE'
  };
}

// Audit logging function
async function logAppealResolution(
  appealId: string,
  action: string,
  adminId: string,
  resolution: any,
  appeal: any
): Promise<void> {
  try {
    await prisma.businessAuditLog.create({
      data: {
        businessAccountId: appeal.trustCase?.businessAccountId || 'system',
        tableName: 'appeals',
        recordId: appealId,
        action: 'APPEAL_RESOLUTION',
        oldValues: {
          appeal_status: appeal.status,
          admin_notes: appeal.admin_notes,
          reviewed_by: appeal.reviewed_by
        },
        newValues: {
          resolution_action: action,
          new_status: resolution.new_status,
          admin_id: adminId,
          admin_notes: resolution.admin_notes,
          reviewed_at: resolution.resolved_at,
          financial_impact: 'NONE', // Explicitly log no financial impact
          timestamp: new Date()
        },
        userId: adminId,
        ipAddress: '127.0.0.1', // Would come from request
        userAgent: 'Admin Panel', // Would come from request
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log appeal resolution:', error);
    // Don't throw - logging failure shouldn't break main flow
  }
}

// Financial non-impact logging
async function logFinancialNonImpact(
  appealId: string,
  action: string,
  adminId: string,
  details: any
): Promise<void> {
  try {
    await prisma.businessAuditLog.create({
      data: {
        businessAccountId: 'system',
        tableName: 'financial_systems',
        recordId: `appeal-${appealId}`,
        action: 'FINANCIAL_NON_IMPACT',
        oldValues: null,
        newValues: {
          appeal_id: appealId,
          resolution_action: action,
          admin_id: adminId,
          wallet_accessed: false,
          escrow_accessed: false,
          ledger_accessed: false,
          payment_processed: false,
          impact_type: 'INFORMATIONAL_ONLY',
          details,
          timestamp: new Date()
        },
        userId: adminId,
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Panel',
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log financial non-impact:', error);
    // Don't throw - logging failure shouldn't break main flow
  }
}

// GET /admin/trust/appeals/:id/history
router.get('/:id/history',
  authenticateAdmin,
  requirePermission('appeals:view'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const auditLogs = await prisma.businessAuditLog.findMany({
        where: {
          tableName: 'appeals',
          recordId: id,
          action: {
            in: ['APPEAL_RESOLUTION', 'FINANCIAL_NON_IMPACT']
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Last 50 actions
      });

      res.json({
        appeal_id: id,
        action_history: auditLogs.map(log => ({
          action_id: log.id,
          action_type: log.action,
          admin_id: log.userId,
          timestamp: log.createdAt,
          details: log.newValues,
          ip_address: log.ipAddress,
          user_agent: log.userAgent
        }))
      });

    } catch (error) {
      console.error('Error fetching appeal history:', error);
      res.status(500).json({
        error: 'Failed to fetch appeal history',
        code: 'HISTORY_FETCH_ERROR'
      });
    }
  }
);

// GET /admin/trust/appeals/pending-resolution
router.get('/pending-resolution',
  authenticateAdmin,
  requirePermission('appeals:view'),
  async (req: Request, res: Response) => {
    try {
      // Get appeals that need resolution
      const pendingAppeals = await prisma.appeal.findMany({
        where: {
          status: {
            in: ['OPEN', 'UNDER_REVIEW']
          }
        },
        include: {
          trustCase: {
            include: {
              rule: true,
              businessAccount: {
                select: {
                  name: true,
                  businessType: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'asc' // Oldest first
        },
        take: 100
      });

      res.json({
        pending_appeals: pendingAppeals.map(appeal => ({
          appeal_id: appeal.appeal_id,
          trust_case_id: appeal.trust_case_id,
          actor_type: appeal.actor_type,
          actor_id: appeal.actor_id,
          status: appeal.status,
          message: appeal.message.substring(0, 300) + (appeal.message.length > 300 ? '...' : ''), // Truncate for list view
          created_at: appeal.created_at,
          trust_case: {
            case_id: appeal.trustCase?.case_id,
            subject_type: appeal.trustCase?.subject_type,
            subject_id: appeal.trustCase?.subject_id,
            status: appeal.trustCase?.status,
            severity: appeal.trustCase?.severity,
            rule_name: appeal.trustCase?.rule?.name,
            business_name: appeal.trustCase?.businessAccount?.name,
            business_type: appeal.trustCase?.businessAccount?.businessType
          }
        })),
        total: pendingAppeals.length
      });

    } catch (error) {
      console.error('Error fetching pending appeals:', error);
      res.status(500).json({
        error: 'Failed to fetch pending appeals',
        code: 'PENDING_APPEALS_ERROR'
      });
    }
  }
);

// POST /admin/trust/appeals/bulk-resolve
router.post('/bulk-resolve',
  authenticateAdmin,
  requirePermission('appeals:resolve'),
  validateRequest(z.object({
    appeal_ids: z.array(z.string().uuid()).min(1).max(50), // Max 50 appeals at once
    action: z.enum(['ACCEPT', 'REJECT']),
    admin_notes: z.string().min(1).max(2000),
    reviewed_by: z.string().uuid().optional()
  })),
  auditLog('APPEAL_BULK_RESOLUTION'),
  async (req: Request, res: Response) => {
    try {
      const { appeal_ids, action, admin_notes, reviewed_by } = req.body;
      const adminId = req.user!.id;

      const results = [];
      const errors = [];

      // Process each appeal
      for (const appealId of appeal_ids) {
        try {
          const existingAppeal = await prisma.appeal.findUnique({
            where: { appeal_id },
            select: { status: true }
          });

          if (!existingAppeal) {
            errors.push({ appeal_id, error: 'Appeal not found' });
            continue;
          }

          if (existingAppeal.status === 'ACCEPTED' || existingAppeal.status === 'REJECTED') {
            errors.push({ appeal_id, error: 'Appeal already resolved' });
            continue;
          }

          // Perform resolution
          const resolution = await performAppealResolution(
            appealId, 
            action, 
            admin_notes, 
            reviewed_by || adminId, 
            existingAppeal
          );
          
          results.push({ appeal_id, success: true, resolution });

        } catch (error) {
          errors.push({ 
            appeal_id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Log bulk resolution
      await logAppealResolution(
        `bulk-${Date.now()}`,
        'BULK_RESOLUTION',
        adminId,
        { 
          action, 
          appeal_ids, 
          results: results.length, 
          errors: errors.length 
        },
        { trustCase: {} }
      );

      res.json({
        success: true,
        resolution_action: action,
        processed: results.length,
        errors: errors.length,
        results,
        errors,
        timestamp: new Date(),
        financial_impact: {
          wallet_changed: false,
          escrow_changed: false,
          ledger_changed: false,
          payment_processed: false,
          message: 'Bulk appeal resolution completed - informational only, no financial systems affected'
        }
      });

    } catch (error) {
      console.error('Error performing bulk appeal resolution:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'BULK_RESOLUTION_ERROR'
      });
    }
  }
);

export default router;
