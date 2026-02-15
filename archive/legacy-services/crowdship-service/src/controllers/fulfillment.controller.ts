/**
 * FULFILLMENT CONTROLLER
 * API endpoints for fulfillment options
 */

import { Request, Response, NextFunction } from 'express';
import fulfillmentService from '../services/fulfillment.service';

export class FulfillmentController {
  
  /**
   * POST /api/fulfillment/pickup-period
   * Calculate pickup preparation period for cart
   */
  async calculatePickupPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { products } = req.body;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Products array is required'
        });
      }

      const result = fulfillmentService.calculatePickupPeriod(products);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/fulfillment/warehouse-distance
   * Calculate distance from warehouse to delivery address
   */
  async calculateWarehouseDistance(req: Request, res: Response, next: NextFunction) {
    try {
      const { warehouseId, deliveryAddress } = req.body;

      if (!warehouseId || !deliveryAddress) {
        return res.status(400).json({
          success: false,
          error: 'warehouseId and deliveryAddress are required'
        });
      }

      const distance = await fulfillmentService.calculateWarehouseDistance(
        warehouseId,
        deliveryAddress
      );

      res.json({
        success: true,
        data: { distance }
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * GET /api/fulfillment/product-metadata/:productId
   * Get product metadata (type, warehouse)
   */
  async getProductMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;

      const metadata = await fulfillmentService.getProductMetadata(productId);

      res.json({
        success: true,
        data: metadata
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * POST /api/fulfillment/assign-pickup-hub
   * Assign optimal pickup hub
   */
  async assignPickupHub(req: Request, res: Response, next: NextFunction) {
    try {
      const { userLocation } = req.body;

      if (!userLocation) {
        return res.status(400).json({
          success: false,
          error: 'userLocation is required'
        });
      }

      const hub = await fulfillmentService.assignPickupHub(userLocation);

      res.json({
        success: true,
        data: hub
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new FulfillmentController();
