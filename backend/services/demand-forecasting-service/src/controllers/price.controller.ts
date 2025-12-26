// Price Controller - متحكم التسعير

import { Request, Response } from 'express';
import { priceService } from '../services/price.service';

export const priceController = {
  async optimizePrice(req: Request, res: Response) {
    try {
      const { productId, currentPrice, currentDemand } = req.body;
      const optimization = await priceService.optimizePrice(productId, currentPrice, currentDemand);
      res.json({ success: true, data: optimization });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getOptimizations(req: Request, res: Response) {
    try {
      const { status, recommendation, page, limit } = req.query;
      const result = await priceService.getOptimizations({
        status: status as string,
        recommendation: recommendation as any,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getProductOptimization(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const optimization = await priceService.getProductOptimization(productId);
      res.json({ success: true, data: optimization });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async applyOptimization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const optimization = await priceService.applyOptimization(id);
      res.json({ success: true, data: optimization, message: 'Price optimization applied', messageAr: 'تم تطبيق تحسين السعر' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async rejectOptimization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const optimization = await priceService.rejectOptimization(id);
      res.json({ success: true, data: optimization, message: 'Price optimization rejected', messageAr: 'تم رفض تحسين السعر' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
