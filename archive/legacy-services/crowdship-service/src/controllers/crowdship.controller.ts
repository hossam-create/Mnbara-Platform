import { Request, Response } from 'express';
import { CrowdshipService } from '../services/crowdship.service';

const crowdshipService = new CrowdshipService();

export class CrowdshipController {
  async createDeliveryRequest(req: Request, res: Response) {
    try {
      const { orderId, pickupLocation, dropoffLocation } = req.body;
      const delivery = await crowdshipService.createDeliveryRequest(orderId, pickupLocation, dropoffLocation);
      res.json(delivery);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async findAvailableTravelers(req: Request, res: Response) {
    try {
      const { pickupLocation, dropoffLocation } = req.body;
      const travelers = await crowdshipService.findAvailableTravelers(pickupLocation, dropoffLocation);
      res.json(travelers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async acceptDelivery(req: Request, res: Response) {
    try {
      const { deliveryRequestId, travelerId } = req.body;
      const delivery = await crowdshipService.acceptDelivery(deliveryRequestId, travelerId);
      res.json(delivery);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTravelerLocation(req: Request, res: Response) {
    try {
      const { travelerId } = req.params;
      const { latitude, longitude } = req.body;
      const traveler = await crowdshipService.updateTravelerLocation(travelerId, latitude, longitude);
      res.json(traveler);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async confirmDelivery(req: Request, res: Response) {
    try {
      const { deliveryRequestId, proof } = req.body;
      const delivery = await crowdshipService.confirmDelivery(deliveryRequestId, proof);
      res.json(delivery);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTravelerStats(req: Request, res: Response) {
    try {
      const { travelerId } = req.params;
      const stats = await crowdshipService.getTravelerStats(travelerId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
