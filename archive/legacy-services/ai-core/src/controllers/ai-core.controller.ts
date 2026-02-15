/**
 * AI Core Controller
 * HTTP handlers for AI Core Nucleus endpoints
 * Read-only advisory responses only
 */

import { Request, Response } from 'express';
import { intentClassifierService } from '../services/intent-classifier.service';
import { trustScorerService, TrustInput } from '../services/trust-scorer.service';
import { riskAssessorService, RiskContext } from '../services/risk-assessor.service';
import { decisionRecommenderService } from '../services/decision-recommender.service';
import { userMatcherService, UserProfile } from '../services/user-matcher.service';
import { auditLoggerService } from '../services/audit-logger.service';
import {
  ClassifyIntentRequest,
  AssessRiskRequest,
  MatchUsersRequest,
  GetRecommendationRequest,
} from '../types/ai-core.types';

export class AICoreController {
  /**
   * POST /api/ai-core/intent/classify
   * Classify user intent from signals
   */
  async classifyIntent(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const request: ClassifyIntentRequest = req.body;

      // Validate required fields
      if (!request.userId || !request.signals) {
        res.status(400).json({
          error: 'Missing required fields: userId, signals',
        });
        return;
      }

      const result = intentClassifierService.classify(request);

      // Audit log
      auditLoggerService.log(
        'CLASSIFY_INTENT',
        { userId: request.userId, signalCount: Object.keys(request.signals).length },
        { type: result.type, confidence: result.confidence },
        startTime
      );

      res.json({
        success: true,
        data: result,
        meta: {
          processingTimeMs: Date.now() - startTime,
          advisory: true,
        },
      });
    } catch (error) {
      auditLoggerService.log(
        'CLASSIFY_INTENT_ERROR',
        { body: req.body },
        { error: (error as Error).message },
        startTime
      );

      res.status(500).json({
        success: false,
        error: 'Intent classification failed',
        message: (error as Error).message,
      });
    }
  }

  /**
   * POST /api/ai-core/trust/compute
   * Compute trust score for a user
   */
  async computeTrustScore(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const input: TrustInput = {
        ...req.body,
        accountCreatedAt: new Date(req.body.accountCreatedAt),
      };

      // Validate required fields
      if (!input.userId) {
        res.status(400).json({
          error: 'Missing required field: userId',
        });
        return;
      }

      const result = trustScorerService.computeTrustScore(input);

      // Audit log
      auditLoggerService.log(
        'COMPUTE_TRUST',
        { userId: input.userId },
        { score: result.score, level: result.level },
        startTime
      );

      res.json({
        success: true,
        data: result,
        meta: {
          processingTimeMs: Date.now() - startTime,
          advisory: true,
        },
      });
    } catch (error) {
      auditLoggerService.log(
        'COMPUTE_TRUST_ERROR',
        { body: req.body },
        { error: (error as Error).message },
        startTime
      );

      res.status(500).json({
        success: false,
        error: 'Trust computation failed',
        message: (error as Error).message,
      });
    }
  }

  /**
   * POST /api/ai-core/risk/assess
   * Assess transaction risk
   */
  async assessRisk(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { request, context } = req.body as {
        request: AssessRiskRequest;
        context: RiskContext;
      };

      // Validate required fields
      if (!request?.transactionId || !context?.buyerTrust || !context?.sellerTrust) {
        res.status(400).json({
          error: 'Missing required fields: request.transactionId, context.buyerTrust, context.sellerTrust',
        });
        return;
      }

      // Parse dates
      context.transactionTime = new Date(context.transactionTime);

      const result = riskAssessorService.assessRisk(request, context);

      // Audit log
      auditLoggerService.log(
        'ASSESS_RISK',
        { transactionId: request.transactionId, amount: request.amount },
        { overallRisk: result.overallRisk, riskScore: result.riskScore },
        startTime
      );

      res.json({
        success: true,
        data: result,
        meta: {
          processingTimeMs: Date.now() - startTime,
          advisory: true,
        },
      });
    } catch (error) {
      auditLoggerService.log(
        'ASSESS_RISK_ERROR',
        { body: req.body },
        { error: (error as Error).message },
        startTime
      );

      res.status(500).json({
        success: false,
        error: 'Risk assessment failed',
        message: (error as Error).message,
      });
    }
  }

  /**
   * POST /api/ai-core/match/users
   * Find matching users based on criteria
   */
  async matchUsers(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { request, requesterProfile, candidateProfiles } = req.body as {
        request: MatchUsersRequest;
        requesterProfile: UserProfile;
        candidateProfiles: UserProfile[];
      };

      // Validate required fields
      if (!request?.requesterId || !requesterProfile || !candidateProfiles) {
        res.status(400).json({
          error: 'Missing required fields: request, requesterProfile, candidateProfiles',
        });
        return;
      }

      // Parse dates in profiles
      requesterProfile.lastActive = new Date(requesterProfile.lastActive);
      for (const profile of candidateProfiles) {
        profile.lastActive = new Date(profile.lastActive);
      }

      const result = userMatcherService.findMatches(
        request,
        requesterProfile,
        candidateProfiles
      );

      // Audit log
      auditLoggerService.log(
        'MATCH_USERS',
        { requesterId: request.requesterId, candidateCount: candidateProfiles.length },
        { matchCount: result.length },
        startTime
      );

      res.json({
        success: true,
        data: result,
        meta: {
          processingTimeMs: Date.now() - startTime,
          advisory: true,
          totalCandidates: candidateProfiles.length,
          matchesReturned: result.length,
        },
      });
    } catch (error) {
      auditLoggerService.log(
        'MATCH_USERS_ERROR',
        { body: req.body },
        { error: (error as Error).message },
        startTime
      );

      res.status(500).json({
        success: false,
        error: 'User matching failed',
        message: (error as Error).message,
      });
    }
  }

  /**
   * POST /api/ai-core/recommend
   * Get decision recommendation
   */
  async getRecommendation(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const request: GetRecommendationRequest = req.body;

      // Validate required fields
      if (!request.requestId || !request.userId || !request.trustScores || !request.riskAssessment) {
        res.status(400).json({
          error: 'Missing required fields: requestId, userId, trustScores, riskAssessment',
        });
        return;
      }

      const result = decisionRecommenderService.recommend(request);

      // Audit log
      auditLoggerService.log(
        'GET_RECOMMENDATION',
        { requestId: request.requestId, userId: request.userId },
        { action: result.action, confidence: result.confidence },
        startTime
      );

      res.json({
        success: true,
        data: result,
        meta: {
          processingTimeMs: Date.now() - startTime,
          advisory: true,
          disclaimer: 'This is an advisory recommendation only. No actions have been executed.',
        },
      });
    } catch (error) {
      auditLoggerService.log(
        'GET_RECOMMENDATION_ERROR',
        { body: req.body },
        { error: (error as Error).message },
        startTime
      );

      res.status(500).json({
        success: false,
        error: 'Recommendation generation failed',
        message: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/ai-core/audit
   * Get audit logs
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { operation, limit = '50' } = req.query;

      let logs;
      if (operation) {
        logs = auditLoggerService.getByOperation(operation as string, parseInt(limit as string));
      } else {
        logs = auditLoggerService.getRecent(parseInt(limit as string));
      }

      const stats = auditLoggerService.getStats();

      res.json({
        success: true,
        data: {
          logs,
          stats,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve audit logs',
        message: (error as Error).message,
      });
    }
  }
}

export const aiCoreController = new AICoreController();
