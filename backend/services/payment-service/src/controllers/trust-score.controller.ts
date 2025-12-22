import { Request, Response } from 'express';
import { TrustScoreService } from '../services/trust-score.service';
import { TrustScoreRequest } from '../types/trust-score.types';

const trustScoreService = new TrustScoreService();

export class TrustScoreController {
  async getSellerScore(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const { forceRecalculate, configOverrides } = req.query;

      if (!sellerId) {
        return res.status(400).json({
          success: false,
          error: 'sellerId parameter is required'
        });
      }

      const request: TrustScoreRequest = {
        sellerId: parseInt(sellerId),
        forceRecalculate: forceRecalculate === 'true',
        configOverrides: configOverrides ? JSON.parse(configOverrides as string) : undefined
      };

      const result = await trustScoreService.calculateTrustScore(request);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error calculating trust score:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSellerHistory(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;

      if (!sellerId) {
        return res.status(400).json({
          success: false,
          error: 'sellerId parameter is required'
        });
      }

      const history = await trustScoreService.getScoreHistory(parseInt(sellerId));

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      console.error('Error fetching trust score history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSellerTrend(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;

      if (!sellerId) {
        return res.status(400).json({
          success: false,
          error: 'sellerId parameter is required'
        });
      }

      const history = await trustScoreService.getScoreHistory(parseInt(sellerId));

      // Extract trend information from history
      const trendData = {
        sellerId: parseInt(sellerId),
        currentScore: history.summary.currentScore,
        trend: history.summary.trend,
        volatility: history.summary.volatilityIndex,
        deltas: {
          days7: history.summary.delta7d,
          days30: history.summary.delta30d,
          days90: history.summary.delta90d
        },
        historicalScores: history.snapshots.map(s => ({
          score: s.score,
          level: s.level,
          calculatedAt: s.calculatedAt
        }))
      };

      res.json({
        success: true,
        data: trendData
      });

    } catch (error) {
      console.error('Error fetching trust score trend:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getConfig(req: Request, res: Response) {
    try {
      // Return the default configuration
      const config = {
        weights: {
          accountMaturity: 20,
          transactionHistory: 30,
          disputeHistory: 25,
          behavioralStability: 15,
          trustEvents: 10
        },
        decay: {
          penaltyHalfLifeDays: 30,
          recoveryRatePerDay: 0.5,
          maxDailyRecovery: 2
        },
        thresholds: {
          highTrust: 80,
          mediumTrust: 60,
          criticalPenalty: 20
        },
        timeWindows: {
          shortTerm: 7,
          mediumTerm: 30,
          longTerm: 90,
          historical: 365
        }
      };

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      console.error('Error fetching trust score config:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async healthCheck(req: Request, res: Response) {
    try {
      const health = await trustScoreService.healthCheck();

      res.json({
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
  }
}