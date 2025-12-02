import { Router } from 'express';
import { DeliveryController } from '../controllers/delivery.controller';

const router = Router();
const deliveryController = new DeliveryController();

// Price calculation
router.post('/calculate-price', (req, res) => deliveryController.calculatePrice(req, res));

// Tracking
router.post('/tracking/update', (req, res) => deliveryController.updateTracking(req, res));
router.get('/tracking/:shipmentId', (req, res) => deliveryController.getTracking(req, res));

export default router;
