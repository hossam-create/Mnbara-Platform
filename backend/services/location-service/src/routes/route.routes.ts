import { Router } from 'express';
import { RouteController } from '../controllers/route.controller';

const router = Router();
const controller = new RouteController();

// Create traveler route
router.post('/routes', (req, res) => controller.createRoute(req, res));

// Create delivery request
router.post('/delivery-requests', (req, res) => controller.createDeliveryRequest(req, res));

// Find matching routes for delivery
router.get('/delivery-requests/:requestId/matches', (req, res) => controller.findMatches(req, res));

// Match delivery to route
router.post('/match', (req, res) => controller.matchDelivery(req, res));

// Get traveler routes
router.get('/travelers/:travelerId/routes', (req, res) => controller.getTravelerRoutes(req, res));

// Get buyer delivery requests
router.get('/buyers/:buyerId/requests', (req, res) => controller.getBuyerRequests(req, res));

export default router;
