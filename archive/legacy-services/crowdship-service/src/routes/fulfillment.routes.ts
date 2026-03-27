/**
 * FULFILLMENT ROUTES
 * API endpoints for fulfillment options
 */

import { Router } from 'express';
import fulfillmentController from '../controllers/fulfillment.controller';

const router = Router();

/**
 * POST /api/fulfillment/pickup-period
 * Calculate pickup preparation period for cart
 */
router.post('/pickup-period', (req, res, next) => {
  fulfillmentController.calculatePickupPeriod(req, res, next);
});

/**
 * POST /api/fulfillment/warehouse-distance
 * Calculate distance from warehouse to delivery address
 */
router.post('/warehouse-distance', (req, res, next) => {
  fulfillmentController.calculateWarehouseDistance(req, res, next);
});

/**
 * GET /api/fulfillment/product-metadata/:productId
 * Get product metadata (type, warehouse)
 */
router.get('/product-metadata/:productId', (req, res, next) => {
  fulfillmentController.getProductMetadata(req, res, next);
});

/**
 * POST /api/fulfillment/assign-pickup-hub
 * Assign optimal pickup hub
 */
router.post('/assign-pickup-hub', (req, res, next) => {
  fulfillmentController.assignPickupHub(req, res, next);
});

export default router;
