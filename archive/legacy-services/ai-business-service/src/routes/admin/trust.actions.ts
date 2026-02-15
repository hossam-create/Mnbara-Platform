import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  TrustCaseResponse, 
  TrustCaseUpdate, 
  TrustCaseStatus,
  TrustCaseError,
  TrustCaseErrorCodes
} from '../../../models/trust_case.model';
import { authenticateAdmin, requirePermission } from '../../../middleware/auth.middleware';
import { validateRequest } from '../../../middleware/validation.middleware';
import { auditLog } from '../../../middleware/audit.middleware';

const router = Router();
const prisma = new PrismaClient();

// Action Types
const TrustCaseActionSchema = z.enum([
  'ACKNOWLEDGE',
  'ADD_NOTE', 
  'REQUEST_MORE_INFO',
  'MARK_FOR_MONITORING'
]);

type TrustCaseAction = z.infer<typeof TrustCaseActionSchema>;

// Request schemas
const AcknowledgeActionSchema = z.object({
  action: z.literal('ACKNOWLEDGE'),
  notes: z.string().optional(),
  acknowledged_by: z.string().uuid()
});

const AddNoteActionSchema = z.object({
  action: z.literal('ADD_NOTE'),
  notes: z.string().min(1, 'Notes are required for ADD_NOTE action'),
  added_by: z.string().uuid()
});

const RequestMoreInfoActionSchema = z.object({
  action: z.literal('REQUEST_MORE_INFO'),
  info_request: z.string().min(1, 'Info request is required for REQUEST_MORE_INFO action'),
  requested_by: z.string().uuid(),
  deadline: z.string().datetime().optional()
});

const MarkForMonitoringActionSchema = z.object({
  action: z.literal('MARK_FOR_MONITORING'),
  monitoring_reason: z.string().min(1, 'Monitoring reason is required for MARK_FOR_MONITORING action'),
  monitoring_duration: z.number().min(1).max(365).optional(), // days
  marked_by: z.string().uuid()
});

const TrustCaseActionSchema = z.discriminatedUnion('action', [
  AcknowledgeActionSchema,
  AddNoteActionSchema,
  RequestMoreInfoActionSchema,
  MarkForMonitoringActionSchema
]);

// POST /admin/trust/cases/:id/action
router.post('/cases/:id/action', 
  authenticateAdmin,
  requirePermission('trust_cases:manage'),
  validateRequest(TrustCaseActionSchema),
  auditLog('TRUST_CASE_ACTION'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const actionData = req.body;
      const adminId = req.user!.id;

      // Verify trust case exists
      const existingCase = await prisma.trustCase.findUnique({
        where: { case_id: id },
        include: {
          rule: true,
          businessAccount: true
        }
      });

      if (!existingCase) {
        return res.status(404).json({
          error: 'Trust case not found',
          code: TrustCaseErrorCodes.CASE_NOT_FOUND
        });
      }

      // Verify case is in a state that allows actions
      if (existingCase.status === 'RESOLVED' || existingCase.status === 'DISMISSED') {
        return res.status(400).json({
          error: 'Cannot perform actions on resolved or dismissed cases',
          code: 'CASE_ALREADY_CLOSED'
        });
      }

      // Perform action based on type
      const result = await performTrustCaseAction(id, actionData, adminId, existingCase);

      // Log the action in audit trail
      await logTrustCaseAction(id, actionData.action, adminId, result);

      res.json({
        success: true,
        case_id: id,
        action_performed: actionData.action,
        result,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error performing trust case action:', error);
      
      if (error instanceof TrustCaseError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Action implementation functions
async function performTrustCaseAction(
  caseId: string, 
  actionData: any, 
  adminId: string,
  existingCase: any
): Promise<any> {
  switch (actionData.action) {
    case 'ACKNOWLEDGE':
      return await acknowledgeCase(caseId, actionData, adminId);
    
    case 'ADD_NOTE':
      return await addNoteToCase(caseId, actionData, adminId);
    
    case 'REQUEST_MORE_INFO':
      return await requestMoreInfo(caseId, actionData, adminId);
    
    case 'MARK_FOR_MONITORING':
      return await markCaseForMonitoring(caseId, actionData, adminId);
    
    default:
      throw new TrustCaseError(
        'Invalid action type',
        TrustCaseErrorCodes.INVALID_STATUS,
        400
      );
  }
}

async function acknowledgeCase(caseId: string, actionData: any, adminId: string): Promise<any> {
  const updatedCase = await prisma.trustCase.update({
    where: { case_id: caseId },
    data: {
      status: 'UNDER_REVIEW' as TrustCaseStatus,
      notes: actionData.notes ? 
        `${existingCase.notes || ''}\n\n[Acknowledged by ${adminId} at ${new Date().toISOString()}]\n${actionData.notes}` :
        `${existingCase.notes || ''}\n\n[Acknowledged by ${adminId} at ${new Date().toISOString()}]`,
      updated_at: new Date()
    },
    include: {
      rule: true,
      businessAccount: true
    }
  });

  return {
    action: 'ACKNOWLEDGED',
    new_status: updatedCase.status,
    acknowledged_by: adminId,
    acknowledged_at: new Date()
  };
}

async function addNoteToCase(caseId: string, actionData: any, adminId: string): Promise<any> {
  const updatedCase = await prisma.trustCase.update({
    where: { case_id: caseId },
    data: {
      notes: `${existingCase.notes || ''}\n\n[Note added by ${adminId} at ${new Date().toISOString()}]\n${actionData.notes}`,
      updated_at: new Date()
    },
    include: {
      rule: true,
      businessAccount: true
    }
  });

  return {
    action: 'NOTE_ADDED',
    note: actionData.notes,
    added_by: adminId,
    added_at: new Date()
  };
}

async function requestMoreInfo(caseId: string, actionData: any, adminId: string): Promise<any> {
  const updatedCase = await prisma.trustCase.update({
    where: { case_id: caseId },
    data: {
      status: 'UNDER_REVIEW' as TrustCaseStatus,
      notes: `${existingCase.notes || ''}\n\n[Info requested by ${adminId} at ${new Date().toISOString()}]\nRequest: ${actionData.info_request}${actionData.deadline ? `\nDeadline: ${actionData.deadline}` : ''}`,
      updated_at: new Date()
    },
    include: {
      rule: true,
      businessAccount: true
    }
  });

  return {
    action: 'INFO_REQUESTED',
    info_request: actionData.info_request,
    deadline: actionData.deadline,
    requested_by: adminId,
    requested_at: new Date()
  };
}

async function markCaseForMonitoring(caseId: string, actionData: any, adminId: string): Promise<any> {
  const monitoringDuration = actionData.monitoring_duration || 30; // default 30 days
  
  const updatedCase = await prisma.trustCase.update({
    where: { case_id: caseId },
    data: {
      notes: `${existingCase.notes || ''}\n\n[Marked for monitoring by ${adminId} at ${new Date().toISOString()}]\nReason: ${actionData.monitoring_reason}\nDuration: ${monitoringDuration} days`,
      updated_at: new Date()
    },
    include: {
      rule: true,
      businessAccount: true
    }
  });

  return {
    action: 'MARKED_FOR_MONITORING',
    monitoring_reason: actionData.monitoring_reason,
    monitoring_duration_days: monitoringDuration,
    monitoring_until: new Date(Date.now() + monitoringDuration * 24 * 60 * 60 * 1000),
    marked_by: adminId,
    marked_at: new Date()
  };
}

// Audit logging function
async function logTrustCaseAction(
  caseId: string, 
  action: string, 
  adminId: string, 
  result: any
): Promise<void> {
  try {
    await prisma.businessAuditLog.create({
      data: {
        businessAccountId: existingCase.businessAccountId || 'system',
        tableName: 'trust_cases',
        recordId: caseId,
        action: 'TRUST_CASE_ACTION',
        oldValues: existingCase,
        newValues: {
          action,
          adminId,
          result,
          timestamp: new Date()
        },
        userId: adminId,
        ipAddress: '127.0.0.1', // Would come from request
        userAgent: 'Admin Panel', // Would come from request
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log trust case action:', error);
    // Don't throw - logging failure shouldn't break the main flow
  }
}

// GET /admin/trust/cases/:id/history
router.get('/cases/:id/history',
  authenticateAdmin,
  requirePermission('trust_cases:view'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const auditLogs = await prisma.businessAuditLog.findMany({
        where: {
          tableName: 'trust_cases',
          recordId: id,
          action: 'TRUST_CASE_ACTION'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Last 50 actions
      });

      res.json({
        case_id: id,
        action_history: auditLogs.map(log => ({
          action_id: log.id,
          action: log.newValues?.action,
          admin_id: log.userId,
          timestamp: log.createdAt,
          details: log.newValues?.result,
          ip_address: log.ipAddress,
          user_agent: log.userAgent
        }))
      });

    } catch (error) {
      console.error('Error fetching trust case history:', error);
      res.status(500).json({
        error: 'Failed to fetch action history',
        code: 'HISTORY_FETCH_ERROR'
      });
    }
  }
);

// GET /admin/trust/cases/:id/available-actions
router.get('/cases/:id/available-actions',
  authenticateAdmin,
  requirePermission('trust_cases:view'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const trustCase = await prisma.trustCase.findUnique({
        where: { case_id: id },
        select: {
          status: true,
          created_at: true,
          resolved_at: true
        }
      });

      if (!trustCase) {
        return res.status(404).json({
          error: 'Trust case not found',
          code: TrustCaseErrorCodes.CASE_NOT_FOUND
        });
      }

      // Determine available actions based on case status
      const availableActions = getAvailableActions(trustCase.status);

      res.json({
        case_id: id,
        current_status: trustCase.status,
        available_actions: availableActions
      });

    } catch (error) {
      console.error('Error fetching available actions:', error);
      res.status(500).json({
        error: 'Failed to fetch available actions',
        code: 'ACTIONS_FETCH_ERROR'
      });
    }
  }
);

// Helper function to determine available actions
function getAvailableActions(status: string): string[] {
  switch (status) {
    case 'OPEN':
      return ['ACKNOWLEDGE', 'ADD_NOTE', 'REQUEST_MORE_INFO', 'MARK_FOR_MONITORING'];
    
    case 'UNDER_REVIEW':
      return ['ADD_NOTE', 'REQUEST_MORE_INFO', 'MARK_FOR_MONITORING'];
    
    case 'RESOLVED':
    case 'DISMISSED':
      return []; // No actions available on closed cases
    
    default:
      return [];
  }
}

// GET /admin/trust/cases/pending-actions
router.get('/cases/pending-actions',
  authenticateAdmin,
  requirePermission('trust_cases:view'),
  async (req: Request, res: Response) => {
    try {
      // Get cases that have pending info requests
      const pendingCases = await prisma.trustCase.findMany({
        where: {
          status: 'UNDER_REVIEW',
          notes: {
            contains: 'Info requested'
          }
        },
        include: {
          rule: true,
          businessAccount: {
            select: {
              name: true,
              businessType: true
            }
          }
        },
        orderBy: {
          updated_at: 'desc'
        },
        take: 100
      });

      res.json({
        pending_info_requests: pendingCases.map(case_ => ({
          case_id: case_.case_id,
          subject_type: case_.subject_type,
          subject_id: case_.subject_id,
          rule_name: case_.rule?.name,
          business_name: case_.businessAccount?.name,
          business_type: case_.businessAccount?.businessType,
          last_updated: case_.updated_at,
          notes: case_.notes
        }))
      });

    } catch (error) {
      console.error('Error fetching pending actions:', error);
      res.status(500).json({
        error: 'Failed to fetch pending actions',
        code: 'PENDING_ACTIONS_ERROR'
      });
    }
  }
);

// POST /admin/trust/cases/bulk-action
router.post('/cases/bulk-action',
  authenticateAdmin,
  requirePermission('trust_cases:manage'),
  validateRequest(z.object({
    case_ids: z.array(z.string().uuid()).min(1).max(50), // Max 50 cases at once
    action: z.enum(['ACKNOWLEDGE', 'ADD_NOTE', 'MARK_FOR_MONITORING']),
    notes: z.string().optional(),
    monitoring_reason: z.string().optional(),
    monitoring_duration: z.number().min(1).max(365).optional()
  })),
  auditLog('TRUST_CASE_BULK_ACTION'),
  async (req: Request, res: Response) => {
    try {
      const { case_ids, action, notes, monitoring_reason, monitoring_duration } = req.body;
      const adminId = req.user!.id;

      const results = [];
      const errors = [];

      // Process each case
      for (const caseId of case_ids) {
        try {
          const existingCase = await prisma.trustCase.findUnique({
            where: { case_id },
            select: { status: true, notes: true }
          });

          if (!existingCase) {
            errors.push({ case_id, error: 'Case not found' });
            continue;
          }

          if (existingCase.status === 'RESOLVED' || existingCase.status === 'DISMISSED') {
            errors.push({ case_id, error: 'Case already closed' });
            continue;
          }

          // Perform the action
          let actionData: any = { action };
          
          if (action === 'ADD_NOTE' && notes) {
            actionData.notes = notes;
            actionData.added_by = adminId;
          } else if (action === 'MARK_FOR_MONITORING') {
            actionData.monitoring_reason = monitoring_reason || 'Bulk monitoring';
            actionData.monitoring_duration = monitoring_duration || 30;
            actionData.marked_by = adminId;
          } else if (action === 'ACKNOWLEDGE') {
            actionData.acknowledged_by = adminId;
            actionData.notes = notes;
          }

          const result = await performTrustCaseAction(caseId, actionData, adminId, existingCase);
          results.push({ case_id, success: true, result });

        } catch (error) {
          errors.push({ 
            case_id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      // Log bulk action
      await logTrustCaseAction(
        `bulk-${Date.now()}`,
        'BULK_ACTION',
        adminId,
        { 
          action, 
          case_ids, 
          results: results.length, 
          errors: errors.length 
        }
      );

      res.json({
        success: true,
        action_performed: action,
        processed: results.length,
        errors: errors.length,
        results,
        errors,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error performing bulk action:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'BULK_ACTION_ERROR'
      });
    }
  }
);

export default router;
