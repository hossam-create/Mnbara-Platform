import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';

const inventoryService = new InventoryService();

export class InventoryController {
  async getOverview(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const overview = await inventoryService.getInventoryOverview(sellerId);
      res.json(overview);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateStock(req: Request, res: Response) {
    try {
      const { sellerId, productId } = req.params;
      const { quantity } = req.body;
      const inventory = await inventoryService.updateStock(sellerId, productId, quantity);
      res.json(inventory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getLowStock(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const items = await inventoryService.getLowStockItems(sellerId);
      res.json(items);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async bulkUpdate(req: Request, res: Response) {
    try {
      const { sellerId } = req.params;
      const { updates } = req.body;
      const results = await inventoryService.bulkStockUpdate(sellerId, updates);
      res.json(results);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async setReorderPoint(req: Request, res: Response) {
    try {
      const { sellerId, productId } = req.params;
      const { reorderPoint, reorderQty } = req.body;
      const inventory = await inventoryService.setReorderPoint(
        sellerId,
        productId,
        reorderPoint,
        reorderQty
      );
      res.json(inventory);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
