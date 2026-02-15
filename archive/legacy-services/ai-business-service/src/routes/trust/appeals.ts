import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { 
  AppealCreate, 
  AppealResponse, 
  AppealActorType,
  AppealStatus,
  AppealError,
  AppealErrorCodes
} from '../../models/appeal.model';
import { authenticateUser, rateLimit } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { auditLog } from '../../middleware/audit.middleware';

const router = Router();
const prisma = new PrismaClient();

// Extend Request interface for user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        businessAccountId?: string;
        actorType?: AppealActorType;
      };
    }
  }
}

// Rate limiting: 1 appeal per hour per user
const appealRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // 1 appeal per hour
  message: {
    error: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'You can only submit one appeal per hour'
  }
});

// Appeal submission schema
const AppealSubmissionSchema = z.object({
  trust_case_id: z.string().uuid('Invalid trust case ID format'),
  actor_type: z.enum(['USER', 'TRAVELER', 'SELLER', 'AUCTION'], {
    errorMap: () => ({ message: 'Invalid actor type' })
  }),
  message: z.string()
    .min(10, 'Appeal message must be at least 10 characters')
    .max(5000, 'Appeal message cannot exceed 5000 characters')
    .trim()
    .refine(val => val.length > 0, 'Appeal message cannot be empty')
});

// POST /trust/appeals
router.post('/',
  authenticateUser,
  appealRateLimit,
  validateRequest(AppealSubmissionSchema),
  auditLog('APPEAL_SUBMISSION'),
  async (req: Request, res: Response) => {
    try {
      const { trust_case_id, actor_type, message } = req.body;
      const userId = req.user!.id;
      const businessAccountId = req.user!.businessAccountId;

      console.log(`📝 Appeal submission: User ${userId} for trust case ${trust_case_id}`);

      // Verify trust case exists and belongs to user
      const trustCase = await prisma.trustCase.findUnique({
        where: { case_id: trust_case_id },
        include: {
          rule: true,
          businessAccount: true
        }
      });

      if (!trustCase) {
        return res.status(404).json({
          error: 'Trust case not found',
          code: AppealErrorCodes.TRUST_CASE_NOT_FOUND
        });
      }

      // Verify user can appeal this trust case (ownership check)
      const canAppeal = await verifyAppealOwnership(
        userId, 
        trust_case_id, 
        actor_type, 
        businessAccountId
      );

      if (!canAppeal.allowed) {
        return res.status(403).json({
          error: canAppeal.reason,
          code: AppealErrorCodes.UNAUTHORIZED_ACCESS
        });
      }

      // Check for existing appeal (duplicate prevention)
      const existingAppeal = await prisma.appeal.findFirst({
        where: {
          trust_case_id,
          actor_id: userId,
          actor_type,
          status: {
            in: ['OPEN', 'UNDER_REVIEW']
          },
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
          }
        }
      });

      if (existingAppeal) {
        return res.status(409).json({
          error: 'Appeal already exists for this trust case',
          code: AppealErrorCodes.DUPLICATE_APPEAL,
          existing_appeal_id: existingAppeal.appeal_id
        });
      }

      // Create appeal
      const appeal = await prisma.appeal.create({
        data: {
          appeal_id: `AP-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
          trust_case_id,
          actor_id: userId,
          actor_type,
          message: message.trim(),
          status: AppealStatus.OPEN,
          created_at: new Date()
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

      console.log(`✅ Appeal created: ${appeal.appeal_id} for trust case ${trust_case_id}`);

      // Log appeal submission
      await logAppealSubmission(appeal, userId);

      // Return success response (no auto-resolution)
      res.status(201).json({
        success: true,
        appeal: {
          appeal_id: appeal.appeal_id,
          trust_case_id: appeal.trust_case_id,
          actor_type: appeal.actor_type,
          status: appeal.status,
          created_at: appeal.created_at,
          message: 'Appeal submitted successfully. It will be reviewed by our team.'
        },
        trust_case: {
          case_id: trustCase.case_id,
          status: trustCase.status,
          severity: trustCase.severity,
          rule_name: trustCase.rule?.name
        },
        next_steps: {
          status: 'SUBMITTED_FOR_REVIEW',
          message: 'Your appeal has been submitted and is pending review. You will be notified when a decision is made.',
          expected_response_time: '24-48 hours'
        }
      });

    } catch (error) {
      console.error('Error submitting appeal:', error);
      
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

// GET /trust/appeals/:id
router.get('/:id',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

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

      // Verify user owns this appeal
      if (appeal.actor_id !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          code: AppealErrorCodes.UNAUTHORIZED_ACCESS
        });
      }

      res.json({
        appeal: {
          appeal_id: appeal.appeal_id,
          trust_case_id: appeal.trust_case_id,
          actor_type: appeal.actor_type,
          status: appeal.status,
          message: appeal.message,
          admin_notes: appeal.admin_notes,
          created_at: appeal.created_at,
          reviewed_at: appeal.reviewed_at
        },
        trust_case: {
          case_id: appeal.trustCase?.case_id,
          status: appeal.trustCase?.status,
          severity: appeal.trustCase?.severity,
          rule_name: appeal.trustCase?.rule?.name
        }
      });

    } catch (error) {
      console.error('Error fetching appeal:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// GET /trust/appeals
router.get('/',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { 
        status, 
        limit = 20, 
        offset = 0,
        trust_case_id 
      } = req.query;

      const whereClause: any = {
        actor_id: userId
      };

      if (status) {
        whereClause.status = status;
      }

      if (trust_case_id) {
        whereClause.trust_case_id = trust_case_id;
      }

      const appeals = await prisma.appeal.findMany({
        where: whereClause,
        include: {
          trustCase: {
            include: {
              rule: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip: Number(offset),
        take: Math.min(Number(limit), 100) // Max 100
      });

      const total = await prisma.appeal.count({
        where: whereClause
      });

      res.json({
        appeals: appeals.map(appeal => ({
          appeal_id: appeal.appeal_id,
          trust_case_id: appeal.trust_case_id,
          actor_type: appeal.actor_type,
          status: appeal.status,
          message: appeal.message.substring(0, 200) + (appeal.message.length > 200 ? '...' : ''), // Truncate for list view
          created_at: appeal.created_at,
          reviewed_at: appeal.reviewed_at,
          trust_case: {
            case_id: appeal.trustCase?.case_id,
            status: appeal.trustCase?.status,
            severity: appeal.trustCase?.severity,
            rule_name: appeal.trustCase?.rule?.name
          }
        })),
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          has_more: Number(offset) + Number(limit) < total
        }
      });

    } catch (error) {
      console.error('Error fetching appeals:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Helper function to verify appeal ownership
async function verifyAppealOwnership(
  userId: string, 
  trustCaseId: string, 
  actorType: AppealActorType, 
  businessAccountId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const trustCase = await prisma.trustCase.findUnique({
      where: { case_id: trustCaseId },
      select: {
        subject_id: true,
        subject_type: true,
        businessAccountId: true
      }
    });

    if (!trustCase) {
      return { allowed: false, reason: 'Trust case not found' };
    }

    // Check if user can appeal based on actor type and trust case subject
    switch (actorType) {
      case 'USER':
        // User can appeal if they own the business account
        if (trustCase.businessAccountId !== businessAccountId) {
          return { allowed: false, reason: 'You can only appeal trust cases for your own business account' };
        }
        break;

      case 'TRAVELER':
      case 'SELLER':
      case 'AUCTION':
        // These actor types can appeal if they are the subject
        if (trustCase.subject_id !== userId) {
          return { allowed: false, reason: 'You can only appeal trust cases where you are the subject' };
        }
        break;

      default:
        return { allowed: false, reason: 'Invalid actor type' };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Error verifying appeal ownership:', error);
    return { allowed: false, reason: 'Unable to verify appeal ownership' };
  }
}

// Audit logging function
async function logAppealSubmission(appeal: any, userId: string): Promise<void> {
  try {
    await prisma.businessAuditLog.create({
      data: {
        businessAccountId: appeal.trustCase?.businessAccountId || 'system',
        tableName: 'appeals',
        recordId: appeal.appeal_id,
        action: 'APPEAL_SUBMISSION',
        oldValues: null,
        newValues: {
          appeal_id: appeal.appeal_id,
          trust_case_id: appeal.trust_case_id,
          actor_id: userId,
          actor_type: appeal.actor_type,
          status: appeal.status,
          submitted_at: new Date()
        },
        userId: userId,
        ipAddress: '127.0.0.1', // Would come from request
        userAgent: 'User Portal', // Would come from request
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to log appeal submission:', error);
    // Don't throw - logging failure shouldn't break main flow
  }
}

// GET /trust/appeals/eligible-cases
router.get('/eligible-cases',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const businessAccountId = req.user!.businessAccountId;

      // Get trust cases that user can appeal
      const eligibleCases = await prisma.trustCase.findMany({
        where: {
          OR: [
            // User's business account trust cases
            {
              businessAccountId: businessAccountId,
              status: {
                in: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']
              }
            },
            // Trust cases where user is the subject
            {
              subject_id: userId,
              status: {
                in: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']
              }
            }
          ]
        },
        include: {
          rule: true,
          _count: {
            select: {
              appeals: {
                where: {
                  actor_id: userId,
                  created_at: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
                  }
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 50
      });

      // Filter out cases with recent appeals
      const eligibleCasesFiltered = eligibleCases.filter(trustCase => {
        const recentAppealsCount = trustCase._count.appeals;
        return recentAppealsCount === 0;
      });

      res.json({
        eligible_cases: eligibleCasesFiltered.map(trustCase => ({
          case_id: trustCase.case_id,
          subject_type: trustCase.subject_type,
          subject_id: trustCase.subject_id,
          status: trustCase.status,
          severity: trustCase.severity,
          created_at: trustCase.created_at,
          rule_name: trustCase.rule?.name,
          can_appeal: true,
          appeal_deadline: new Date(trustCase.created_at.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
        })),
        total: eligibleCasesFiltered.length
      });

    } catch (error) {
      console.error('Error fetching eligible cases:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

export default router;
