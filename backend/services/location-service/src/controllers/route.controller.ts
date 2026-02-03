import { Request, Response } from 'express';
import { RouteMatchingService } from '../services/route-matching.service';
import { logger } from '../utils/logger';

const routeService = new RouteMatchingService();

export class RouteController {
  async createRoute(req: Request, res: Response) {
    try {
      const { travelerId, origin, destination, originLat, originLon, destLat, destLon, capacity, departureAt } = req.body;

      if (!travelerId || !origin || !destination || !originLat || !originLon || !destLat || !destLon || !departureAt) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const route = await routeService.createRoute({
        travelerId,
        origin,
        destination,
        originLat,
        originLon,
        destLat,
        destLon,
        capacity: capacity || 5,
        departureAt: new Date(departureAt)
      });

      res.json(route);
    } catch (error: any) {
      logger.error('Create route error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async createDeliveryRequest(req: Request, res: Response) {
    try {
      const { buyerId, productId, pickupLat, pickupLon, deliveryLat, deliveryLon, pickupAddr, deliveryAddr } = req.body;

      if (!buyerId || !productId || !pickupLat || !pickupLon || !deliveryLat || !deliveryLon || !pickupAddr || !deliveryAddr) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const request = await routeService.createDeliveryRequest({
        buyerId,
        productId,
        pickupLat,
        pickupLon,
        deliveryLat,
        deliveryLon,
        pickupAddr,
        deliveryAddr
      });

      res.json(request);
    } catch (error: any) {
      logger.error('Create delivery request error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async findMatches(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const { maxDetourKm } = req.query;

      const matches = await routeService.findMatchingRoutes(
        requestId,
        maxDetourKm ? parseFloat(maxDetourKm as string) : undefined
      );

      res.json({ matches, count: matches.length });
    } catch (error: any) {
      logger.error('Find matches error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async matchDelivery(req: Request, res: Response) {
    try {
      const { requestId, routeId } = req.body;

      if (!requestId || !routeId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await routeService.matchDeliveryToRoute(requestId, routeId);

      res.json({ message: 'Delivery matched successfully' });
    } catch (error: any) {
      logger.error('Match delivery error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTravelerRoutes(req: Request, res: Response) {
    try {
      const { travelerId } = req.params;

      const routes = await routeService.getRoutesByTraveler(travelerId);

      res.json(routes);
    } catch (error: any) {
      logger.error('Get traveler routes error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getBuyerRequests(req: Request, res: Response) {
    try {
      const { buyerId } = req.params;

      const requests = await routeService.getDeliveryRequestsByBuyer(buyerId);

      res.json(requests);
    } catch (error: any) {
      logger.error('Get buyer requests error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
