import { Request, Response, NextFunction } from 'express';
import { AITrustRiskService } from '../services/ai-trust-risk.service';
import { RiskInput } from '../types/ai-trust-risk.types';

export class AITrustRiskController {
  private riskService: AITrustRiskService;

  constructor() {
    this.riskService = new AITrustRiskService();
  }

  getRiskScore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = parseInt(req.params.sellerId);
      
      if (isNaN(sellerId)) {
        res.status(400).json({ success: false, error: 'Invalid seller ID', timestamp: new Date().toISOString() });
        return;
      }

      const riskInput: RiskInput = await this.fetchSellerData(sellerId);
      const result = this.riskService.calculateRiskScore(riskInput);
      
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  };

  getRiskExplanation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sellerId = parseInt(req.params.sellerId);
      
      if (isNaN(sellerId)) {
        res.status(400).json({ success: false, error: 'Invalid seller ID', timestamp: new Date().toISOString() });
        return;
      }

      const riskInput: RiskInput = await this.fetchSellerData(sellerId);
      const explanation = this.riskService.getRiskExplanation(riskInput);
      
      res.status(200).json({ success: true, data: explanation, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  };

  getConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = this.riskService.getConfig();
      res.status(200).json({ success: true, data: config, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  };

  healthCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = this.riskService.healthCheck();
      res.status(200).json({ success: true, data: health, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  };

  private async fetchSellerData(sellerId: number): Promise<RiskInput> {
    return {
      sellerId,
      accountAgeDays: 180,
      totalOrders: 150,
      ordersLast30Days: 25,
      totalDisputes: 8,
      disputesLast30Days: 2,
      totalRefunds: 12,
      refundsLast30Days: 3,
      escrowTransactions: 45,
      escrowDisputes: 5,
      escrollSuccessRate: 88.9,
      lastUpdated: new Date()
    };
  }
}