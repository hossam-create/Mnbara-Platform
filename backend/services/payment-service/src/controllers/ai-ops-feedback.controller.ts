// AI-OPS-005: Human Feedback Loop & Continuous Improvement Controller

import { Request, Response, NextFunction } from 'express';
import { AIOpsFeedbackService } from '../services/ai-ops-feedback.service';
import {
  FeedbackSubmissionRequest,
  AlignmentAnalysisRequest,
  FeedbackMetricsRequest,
  ImprovementSignalsRequest,
  FeedbackTimelineRequest
} from '../types/ai-ops-feedback.types';

const aiOpsFeedbackService = new AIOpsFeedbackService();

export class AIOpsFeedbackController {
  
  /**
   * POST /api/ai/ops/feedback
   * Capture human feedback for AI decisions
   */
  async captureFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const request: FeedbackSubmissionRequest = {
        decisionId: req.body.decisionId,
        actorId: req.body.actorId,
        actorRole: req.body.actorRole,
        overrideAction: req.body.overrideAction,
        overrideReason: req.body.overrideReason,
        confidenceAgreement: req.body.confidenceAgreement,
        comments: req.body.comments,
        evidenceReferences: req.body.evidenceReferences
      };

      // Validate required fields
      if (!request.decisionId || !request.actorId || !request.actorRole || 
          !request.overrideAction || !request.overrideReason || !request.confidenceAgreement) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: decisionId, actorId, actorRole, overrideAction, overrideReason, confidenceAgreement',
          timestamp: new Date().toISOString()
        });
      }

      const feedback = await aiOpsFeedbackService.captureFeedback(request);
      
      res.status(201).json({
        success: true,
        data: feedback,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/ops/feedback/alignment
   * Analyze AI vs Human alignment metrics
   */
  async getAlignmentAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const request: AlignmentAnalysisRequest = {
        period: req.query.period as string,
        riskBand: req.query.riskBand as string,
        ruleId: req.query.ruleId as string,
        recommendationType: req.query.recommendationType as string,
        sellerSegment: req.query.sellerSegment as string
      };

      const alignmentMetrics = await aiOpsFeedbackService.analyzeAlignment(request);
      
      res.json({
        success: true,
        data: alignmentMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/ops/feedback/metrics
   * Get feedback metrics and statistics
   */
  async getFeedbackMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const request: FeedbackMetricsRequest = {
        period: req.query.period as string,
        granularity: req.query.granularity as 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
      };

      // For now, return basic metrics structure
      // This would be enhanced with time-series data in a real implementation
      const alignmentMetrics = await aiOpsFeedbackService.analyzeAlignment({
        period: request.period
      });
      
      res.json({
        success: true,
        data: {
          summary: alignmentMetrics,
          timeSeries: [] // Placeholder for time-series data
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/ops/feedback/signals
   * Generate improvement signals from feedback data
   */
  async getImprovementSignals(req: Request, res: Response, next: NextFunction) {
    try {
      const request: ImprovementSignalsRequest = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        minConfidence: req.query.minConfidence ? parseFloat(req.query.minConfidence as string) : undefined,
        priority: req.query.priority as string
      };

      const signals = await aiOpsFeedbackService.generateImprovementSignals(request);
      
      res.json({
        success: true,
        data: signals,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/ops/sellers/:sellerId/feedback-timeline
   * Get feedback timeline for a specific seller
   */
  async getSellerFeedbackTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = parseInt(req.params.sellerId);
      
      if (isNaN(sellerId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid seller ID',
          timestamp: new Date().toISOString()
        });
      }

      const request: FeedbackTimelineRequest = {
        sellerId,
        period: req.query.period as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      const timeline = await aiOpsFeedbackService.getFeedbackTimeline(request);
      
      res.json({
        success: true,
        data: timeline,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/ops/feedback/health
   * System health check for feedback module
   */
  async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    try {
      // Basic health check - verify we can access the database
      const testFeedback = await aiOpsFeedbackService.analyzeAlignment({ period: '7d' });
      
      res.json({
        success: true,
        data: {
          status: 'OPERATIONAL',
          module: 'AI-OPS-005',
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          metricsAvailable: testFeedback.totalDecisions > 0
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.json({
        success: false,
        data: {
          status: 'DEGRADED',
          module: 'AI-OPS-005',
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          error: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}