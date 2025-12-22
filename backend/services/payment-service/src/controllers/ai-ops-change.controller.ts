// AI-OPS-006: Controlled AI Change & Rollback Framework Controller

import { Request, Response, NextFunction } from 'express';
import { AIOpsChangeService } from '../services/ai-ops-change.service';
import {
  ChangeProposalRequest,
  ShadowEvaluationRequest,
  ApprovalRequest,
  RollbackRequest
} from '../types/ai-ops-change.types';

const aiOpsChangeService = new AIOpsChangeService();

export class AIOpsChangeController {
  
  /**
   * POST /api/ai/ops/changes/propose
   * Create a new change proposal
   */
  async proposeChange(req: Request, res: Response, next: NextFunction) {
    try {
      const request: ChangeProposalRequest = {
        title: req.body.title,
        description: req.body.description,
        scope: req.body.scope,
        riskLevel: req.body.riskLevel,
        priority: req.body.priority,
        affectedComponents: req.body.affectedComponents,
        changeDetails: req.body.changeDetails,
        dependencies: req.body.dependencies,
        rollbackPlan: req.body.rollbackPlan,
        authorId: req.body.authorId,
        authorRole: req.body.authorRole
      };

      // Validate required fields
      if (!request.title || !request.description || !request.scope || !request.riskLevel || 
          !request.priority || !request.authorId || !request.authorRole) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, description, scope, riskLevel, priority, authorId, authorRole',
          timestamp: new Date().toISOString()
        });
      }

      const proposal = await aiOpsChangeService.createChangeProposal(request);
      
      res.status(201).json({
        success: true,
        data: proposal,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/ops/changes/:id/run-shadow
   * Run shadow evaluation for a proposal
   */
  async runShadowEvaluation(req: Request, res: Response, next: NextFunction) {
    try {
      const proposalId = req.params.id;
      const request: ShadowEvaluationRequest = {
        evaluationType: req.body.evaluationType,
        sampleSize: req.body.sampleSize,
        timeWindow: req.body.timeWindow
      };

      if (!request.evaluationType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: evaluationType',
          timestamp: new Date().toISOString()
        });
      }

      const evaluationResult = await aiOpsChangeService.runShadowEvaluation(proposalId, request);
      
      res.status(200).json({
        success: true,
        data: evaluationResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/ops/changes/:id/approve
   * Process approval decision for a proposal
   */
  async processApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const proposalId = req.params.id;
      const request: ApprovalRequest = {
        approverId: req.body.approverId,
        approverRole: req.body.approverRole,
        decision: req.body.decision,
        comments: req.body.comments
      };

      if (!request.approverId || !request.approverRole || !request.decision) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: approverId, approverRole, decision',
          timestamp: new Date().toISOString()
        });
      }

      const updatedProposal = await aiOpsChangeService.processApproval(proposalId, request);
      
      res.status(200).json({
        success: true,
        data: updatedProposal,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/ops/versions/:id/rollback
   * Rollback to a previous version
   */
  async rollbackVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const versionId = req.params.id;
      const request: RollbackRequest = {
        reason: req.body.reason,
        executedBy: req.body.executedBy,
        emergency: req.body.emergency || false
      };

      if (!request.reason || !request.executedBy) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: reason, executedBy',
          timestamp: new Date().toISOString()
        });
      }

      const rolledBackVersion = await aiOpsChangeService.rollbackVersion(versionId, request);
      
      res.status(200).json({
        success: true,
        data: rolledBackVersion,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/ops/versions
   * Get all AI versions
   */
  async getAIVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const versions = await aiOpsChangeService.getAIVersions();
      
      res.status(200).json({
        success: true,
        data: versions,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/ai/ops/changes/health
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        status: 'OPERATIONAL',
        module: 'AI-OPS-006',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/ops/changes/:id/submit
   * Submit a proposal for review
   */
  async submitProposal(req: Request, res: Response, next: NextFunction) {
    try {
      const proposalId = req.params.id;
      const authorId = req.body.authorId;

      if (!authorId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: authorId',
          timestamp: new Date().toISOString()
        });
      }

      const proposal = await aiOpsChangeService.submitProposal(proposalId, authorId);
      
      res.status(200).json({
        success: true,
        data: proposal,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/ai/ops/changes/:id/safety-analysis
   * Perform safety and impact analysis
   */
  async performSafetyAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const proposalId = req.params.id;

      const safetyAnalysis = await aiOpsChangeService.performSafetyAnalysis(proposalId);
      
      res.status(200).json({
        success: true,
        data: safetyAnalysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }
}