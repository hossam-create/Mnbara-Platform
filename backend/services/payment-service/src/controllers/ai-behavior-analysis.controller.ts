import { Request, Response } from 'express';
import { AIBehaviorAnalysisService } from '../services/ai-behavior-analysis.service';
import { BehaviorEvaluationRequest } from '../types/behavior-analysis.types';

const behaviorAnalysisService = new AIBehaviorAnalysisService();

export class AIBehaviorAnalysisController {
  async evaluateSellerBehavior(req: Request, res: Response) {
    try {
      const { sellerId, timeWindows, configOverrides } = req.body;
      
      if (!sellerId) {
        return res.status(400).json({
          success: false,
          error: 'sellerId is required'
        });
      }

      const request: BehaviorEvaluationRequest = {
        sellerId: parseInt(sellerId),
        timeWindows,
        configOverrides
      };

      const result = await behaviorAnalysisService.evaluateSellerBehavior(request);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          evaluationTimeMs: result.evaluationTimeMs
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          evaluationTimeMs: result.evaluationTimeMs
        });
      }

    } catch (error) {
      console.error('Error evaluating seller behavior:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during behavior evaluation'
      });
    }
  }

  async getSellerPatterns(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      
      if (!sellerId) {
        return res.status(400).json({
          success: false,
          error: 'sellerId is required'
        });
      }

      const request: BehaviorEvaluationRequest = {
        sellerId: parseInt(sellerId)
      };

      const result = await behaviorAnalysisService.evaluateSellerBehavior(request);

      if (result.success && result.data) {
        res.json({
          success: true,
          data: {
            sellerId: result.data.sellerId,
            detectedPatterns: result.data.detectedPatterns,
            evaluationTimestamp: result.data.evaluationTimestamp
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to retrieve seller patterns'
        });
      }

    } catch (error) {
      console.error('Error retrieving seller patterns:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getSellerTemporalMetrics(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const { timeWindows } = req.query;
      
      if (!sellerId) {
        return res.status(400).json({
          success: false,
          error: 'sellerId is required'
        });
      }

      // This would be implemented to return raw temporal metrics
      // For now, we'll use the evaluation service but extract metrics
      const request: BehaviorEvaluationRequest = {
        sellerId: parseInt(sellerId),
        timeWindows: timeWindows ? JSON.parse(timeWindows as string) : undefined
      };

      const result = await behaviorAnalysisService.evaluateSellerBehavior(request);

      if (result.success) {
        // In a real implementation, we'd have a separate method for just metrics
        res.json({
          success: true,
          message: 'Temporal metrics endpoint not fully implemented yet. Use evaluate for complete analysis.'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error retrieving temporal metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getConfig(req: Request, res: Response) {
    try {
      // Return the default configuration
      res.json({
        success: true,
        data: {
          config: {
            volumeSpikeThreshold: 200,
            refundClusteringWindow: 24,
            disputeBurstThreshold: 3,
            trustScoreVolatilityThreshold: 0.15,
            offerRejectionRateThreshold: 0.8,
            temporalAnomalyZScore: 2.5
          },
          description: 'Default behavior analysis configuration',
          lastUpdated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error retrieving config:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async healthCheck(req: Request, res: Response) {
    try {
      // Simple health check - verify service can be instantiated
      const testService = new AIBehaviorAnalysisService();
      
      res.json({
        success: true,
        data: {
          status: 'operational',
          service: 'ai-behavior-analysis',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          capabilities: [
            'volume_spike_detection',
            'refund_clustering_detection',
            'dispute_burst_detection',
            'trust_score_volatility_detection',
            'offer_abuse_detection',
            'temporal_anomaly_detection'
          ]
        }
      });

    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Service unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}