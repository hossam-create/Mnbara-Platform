// Inventory Controller - متحكم المخزون

import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';

export const inventoryController = {
  async generateRecommendation(req: Request, res: Response) {
    try {
      const { productId, currentStock, warehouseId } = req.body;
      const recommendation = await inventoryService.generateRecommendation(productId, currentStock, warehouseId);
      res.json({ success: true, data: recommendation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getRecommendations(req: Request, res: Response) {
    try {
      const { urgency, action, warehouseId, page, limit } = req.query;
      const result = await inventoryService.getRecommendations({
        urgency: urgency as any,
        action: action as any,
        warehouseId: warehouseId as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getProductRecommendation(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const recommendation = await inventoryService.getProductRecommendation(productId);
      res.json({ success: true, data: recommendation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getInventoryHealth(req: Request, res: Response) {
    try {
      const health = await inventoryService.getInventoryHealth();
      res.json({ success: true, data: health });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
