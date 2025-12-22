// AI-TRUST-003: Trust Decision & Recommendation Engine Controller

import { Request, Response } from 'express';
import { AIDecisionEngineService } from '../services/ai-decision-engine.service';
import {
  DecisionEngineRequest,
  BulkEvaluationRequest,
  DecisionEngineResult,
  BulkEvaluationResult,
  DecisionRule,
  DecisionEngineConfig,
  DecisionEngineHealth
} from '../types/ai-decision-engine.types';

export class AIDecisionEngineController {
  private decisionEngineService: AIDecisionEngineService;

  constructor() {
    this.decisionEngineService = new AIDecisionEngineService();
  }

  evaluateDecision = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: DecisionEngineRequest = req.body;
      
      // Validate required fields
      if (!request.sellerId) {
        res.status(400).json({
          success: false,
          error: 'sellerId is required',
          evaluationTimeMs: 0
        });
        return;
      }

      if (!request.aiRiskScore || !request.behaviorRiskScore || !request.trustScore) {
        res.status(400).json({
          success: false,
          error: 'All risk score inputs are required (aiRiskScore, behaviorRiskScore, trustScore)',
          evaluationTimeMs: 0
        });
        return;
      }

      const startTime = Date.now();
      const result = await this.decisionEngineService.evaluateDecision(request);
      const evaluationTimeMs = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: result,
        evaluationTimeMs
      });

    } catch (error) {
      console.error('Error evaluating decision:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        evaluationTimeMs: 0
      });
    }
  };

  evaluateBulk = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: BulkEvaluationRequest = req.body;
      
      // Validate required fields
      if (!request.evaluations || request.evaluations.length === 0) {
        res.status(400).json({
          success: false,
          error: 'evaluations array is required and cannot be empty',
          evaluationTimeMs: 0
        });
        return;
      }

      // Validate each evaluation
      for (const evaluation of request.evaluations) {
        if (!evaluation.sellerId || !evaluation.aiRiskScore || 
            !evaluation.behaviorRiskScore || !evaluation.trustScore) {
          res.status(400).json({
            success: false,
            error: 'Each evaluation must include sellerId, aiRiskScore, behaviorRiskScore, and trustScore',
            evaluationTimeMs: 0
          });
          return;
        }
      }

      const startTime = Date.now();
      const result = await this.decisionEngineService.evaluateBulk(request);
      const evaluationTimeMs = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: result,
        evaluationTimeMs
      });

    } catch (error) {
      console.error('Error evaluating bulk decisions:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        evaluationTimeMs: 0
      });
    }
  };

  getDecisionRules = async (req: Request, res: Response): Promise<void> => {
    try {
      const rules: DecisionRule[] = this.decisionEngineService.getDecisionRules();
      
      res.status(200).json({
        success: true,
        data: rules,
        count: rules.length
      });

    } catch (error) {
      console.error('Error retrieving decision rules:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  getConfiguration = async (req: Request, res: Response): Promise<void> => {
    try {
      const config: DecisionEngineConfig = this.decisionEngineService.getConfiguration();
      
      res.status(200).json({
        success: true,
        data: config
      });

    } catch (error) {
      console.error('Error retrieving configuration:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const health: DecisionEngineHealth = await this.decisionEngineService.healthCheck();
      
      res.status(200).json({
        success: true,
        data: health
      });

    } catch (error) {
      console.error('Error performing health check:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };

  // Helper method for input validation
  private validateRiskScoreInput(score: any, component: string): string | null {
    if (typeof score !== 'number' || score < 0 || score > 1) {
      return `${component} must be a number between 0 and 1`;
    }
    return null;
  }

  private validateRiskLevelInput(level: any, component: string): string | null {
    const validLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validLevels.includes(level)) {
      return `${component} must be one of: ${validLevels.join(', ')}`;
    }
    return null;
  }
}