import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { trustScoreCalculator } from '../../services/trust/trust_score.service';
import { trustScoreStorageService } from '../../services/trust/trust_score_storage.service';
import { 
  TrustScoreQuery, 
  TrustScoreResponse, 
  TrustScoreHistoryResponse,
  TrustScoreSubjectType,
  TrustScoreStorageError,
  TrustScoreStorageErrorCodes
} from '../../models/trust_score.model';
import { authenticateUser, authenticateAdmin } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { auditLog } from '../../middleware/audit.middleware';

const router = Router();

// Extend Request interface for user data
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

// GET /trust/score/:subject - User profile (READ ONLY)
router.get('/score/:subjectId',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const userId = req.user!.id;

      console.log(`📊 User ${userId} requesting trust score for subject ${subjectId}`);

      // Get stored trust score
      const storedScore = await trustScoreStorageService.getTrustScore(subjectId, 'USER');

      if (!storedScore) {
        return res.status(404).json({
          error: 'Trust score not found',
          code: 'SCORE_NOT_FOUND',
          message: 'No trust score available for this subject'
        });
      }

      // Verify user can access this score (own score or admin)
      if (userId !== subjectId && req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED',
          message: 'You can only view your own trust score'
        });
      }

      // Format response for user profile (READ ONLY)
      const response: TrustScoreResponse = {
        score_id: storedScore.score_id,
        subject_id: storedScore.subject_id,
        subject_type: storedScore.subject_type,
        trust_score: storedScore.trust_score,
        score_category: storedScore.score_category,
        score_breakdown: {
          base_score: storedScore.score_breakdown.base_score,
          severity_penalty: storedScore.score_breakdown.severity_penalty,
          appeal_adjustment: storedScore.score_breakdown.appeal_adjustment,
          time_decay_factor: storedScore.score_breakdown.time_decay_factor,
          final_score: storedScore.score_breakdown.final_score
        },
        calculation_details: {
          total_cases: storedScore.calculation_details.total_cases,
          open_cases: storedScore.calculation_details.open_cases,
          resolved_cases: storedScore.calculation_details.resolved_cases,
          dismissed_cases: storedScore.calculation_details.dismissed_cases,
          appeals_count: storedScore.calculation_details.appeals_count,
          accepted_appeals: storedScore.calculation_details.accepted_appeals,
          rejected_appeals: storedScore.calculation_details.rejected_appeals,
          oldest_case_age_days: storedScore.calculation_details.oldest_case_age_days,
          newest_case_age_days: storedScore.calculation_details.newest_case_age_days,
          calculation_date: storedScore.calculation_details.calculation_date
        },
        metadata: {
          read_only: true,
          non_binding: true,
          not_used_in_payments: true,
          last_updated: storedScore.metadata.last_updated
        },
        created_at: storedScore.created_at,
        updated_at: storedScore.updated_at
      };

      res.json({
        success: true,
        trust_score: response,
        user_profile_view: {
          score: response.trust_score,
          category: response.score_category,
          description: getScoreCategoryDescription(response.score_category),
          last_updated: response.metadata.last_updated,
          read_only_disclaimer: 'This score is for informational purposes only and does not affect your account status'
        }
      });

    } catch (error) {
      console.error('Error getting trust score:', error);
      
      if (error instanceof TrustScoreStorageError) {
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

// GET /trust/score/:subjectId/history
router.get('/score/:subjectId/history',
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const userId = req.user!.id;
      const { limit = 10 } = req.query;

      // Verify user can access this history
      if (userId !== subjectId && req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      const history = await trustScoreStorageService.getTrustScoreHistory(
        subjectId, 
        'USER', 
        Number(limit)
      );

      const response: TrustScoreHistoryResponse[] = history.map(h => ({
        history_id: h.history_id,
        score_id: h.score_id,
        subject_id: h.subject_id,
        subject_type: h.subject_type,
        trust_score: h.trust_score,
        score_category: h.score_category,
        score_change: h.score_change,
        change_reason: h.change_reason,
        previous_score: h.previous_score,
        calculation_details: {
          total_cases: h.calculation_details.total_cases,
          open_cases: h.calculation_details.open_cases,
          resolved_cases: h.calculation_details.resolved_cases,
          appeals_count: h.calculation_details.appeals_count,
          accepted_appeals: h.calculation_details.accepted_appeals,
          rejected_appeals: h.calculation_details.rejected_appeals,
          calculation_date: h.calculation_details.calculation_date
        },
        created_at: h.created_at
      }));

      res.json({
        success: true,
        subject_id: subjectId,
        history: response,
        total_records: response.length,
        read_only_disclaimer: 'Score history is preserved for audit purposes and is informational only'
      });

    } catch (error) {
      console.error('Error getting trust score history:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// GET /admin/trust/scores - Admin dashboard
router.get('/admin/trust/scores',
  authenticateAdmin,
  validateRequest(z.object({
    subject_id: z.string().uuid().optional(),
    subject_type: z.enum(['USER', 'TRAVELER', 'SELLER', 'AUCTION']).optional(),
    score_category: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']).optional(),
    min_score: z.number().min(0).max(100).optional(),
    max_score: z.number().min(0).max(100).optional(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0)
  })),
  async (req: Request, res: Response) => {
    try {
      const query = req.query as any;
      const adminId = req.user!.id;

      console.log(`🔍 Admin ${adminId} querying trust scores with filters:`, query);

      const scores = await trustScoreStorageService.queryTrustScores(query);

      const response = scores.map(score => ({
        score_id: score.score_id,
        subject_id: score.subject_id,
        subject_type: score.subject_type,
        trust_score: score.trust_score,
        score_category: score.score_category,
        score_breakdown: score.score_breakdown,
        calculation_details: score.calculation_details,
        metadata: score.metadata,
        created_at: score.created_at,
        updated_at: score.updated_at
      }));

      res.json({
        success: true,
        scores: response,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: response.length
        },
        admin_dashboard_view: {
          read_only_disclaimer: 'Trust scores are read-only and do not trigger any automatic actions',
          non_binding_disclaimer: 'Scores are non-binding and not used in payment processing',
          financial_isolation: 'Complete separation from financial systems maintained'
        }
      });

    } catch (error) {
      console.error('Error querying trust scores:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// GET /admin/trust/score/statistics
router.get('/admin/trust/score/statistics',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const adminId = req.user!.id;
      const { subject_type, min_score, max_score } = req.query;

      console.log(`📈 Admin ${adminId} requesting trust score statistics`);

      const filters: any = {};
      if (subject_type) filters.subject_type = subject_type;
      if (min_score || max_score) {
        filters.score_range = {};
        if (min_score) filters.score_range.min = Number(min_score);
        if (max_score) filters.score_range.max = Number(max_score);
      }

      const statistics = await trustScoreStorageService.getTrustScoreStatistics(filters);

      res.json({
        success: true,
        statistics,
        admin_dashboard_view: {
          read_only_disclaimer: 'Statistics are for informational purposes only',
          data_integrity: 'All scores maintain read-only and non-binding properties',
          financial_isolation: 'Complete separation from payment systems verified'
        }
      });

    } catch (error) {
      console.error('Error getting trust score statistics:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// GET /admin/trust/score/trends
router.get('/admin/trust/score/trends',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const adminId = req.user!.id;
      const { subject_id, days = 30 } = req.query;

      console.log(`📈 Admin ${adminId} requesting trust score trends`);

      const trends = await trustScoreStorageService.getScoreTrends(
        subject_id as string,
        Number(days)
      );

      res.json({
        success: true,
        trends,
        admin_dashboard_view: {
          read_only_disclaimer: 'Trend analysis is for informational purposes only',
          historical_data: 'All historical data preserved and never overwritten',
          financial_isolation: 'Trend analysis maintains complete separation from financial systems'
        }
      });

    } catch (error) {
      console.error('Error getting trust score trends:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// POST /admin/trust/score/:subjectId/recalculate
router.post('/admin/trust/score/:subjectId/recalculate',
  authenticateAdmin,
  validateRequest(z.object({
    force_recalculate: z.boolean().default(false)
  })),
  auditLog('TRUST_SCORE_RECALCULATION'),
  async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const { force_recalculate } = req.body;
      const adminId = req.user!.id;

      console.log(`🔄 Admin ${adminId} recalculating trust score for subject ${subjectId}`);

      // Calculate new score using calculator
      const newScore = await trustScoreCalculator.getSubjectTrustScore(subjectId, 'USER');

      if (!newScore) {
        return res.status(404).json({
          error: 'Subject not found or no trust cases',
          code: 'SUBJECT_NOT_FOUND'
        });
      }

      // Store the new score (preserves history)
      const storedScore = await trustScoreStorageService.storeTrustScore({
        id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
        score_id: `SC-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
        subject_id: subjectId,
        subject_type: 'USER',
        trust_score: newScore.trust_score,
        score_category: newScore.score_category,
        score_breakdown: newScore.score_breakdown,
        calculation_details: newScore.calculation_details,
        metadata: {
          read_only: true,
          non_binding: true,
          not_used_in_payments: true,
          last_updated: new Date()
        },
        created_at: new Date(),
        updated_at: null
      });

      res.json({
        success: true,
        recalculated_score: {
          score_id: storedScore.score_id,
          subject_id: storedScore.subject_id,
          trust_score: storedScore.trust_score,
          score_category: storedScore.score_category,
          previous_score: newScore.trust_score,
          score_change: storedScore.trust_score - newScore.trust_score,
          recalculated_by: adminId,
          recalculated_at: new Date()
        },
        admin_dashboard_view: {
          history_preserved: 'Previous score preserved in history',
          read_only_maintained: 'New score maintains read-only properties',
          financial_isolation: 'Recalculation maintains complete financial system isolation'
        }
      });

    } catch (error) {
      console.error('Error recalculating trust score:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
);

// Helper function to get score category description
function getScoreCategoryDescription(category: string): string {
  const descriptions = {
    EXCELLENT: 'Excellent trust score - you have an outstanding trust record',
    GOOD: 'Good trust score - you have a strong trust record',
    FAIR: 'Fair trust score - you have a moderate trust record',
    POOR: 'Poor trust score - you have some trust issues that should be addressed',
    CRITICAL: 'Critical trust score - you have serious trust issues requiring immediate attention'
  };
  return descriptions[category as keyof typeof descriptions] || 'Unknown score category';
}

export default router;
