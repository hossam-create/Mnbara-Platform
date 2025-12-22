import { Request, Response } from 'express';
import { DisputeService } from '../services/dispute.service';

export class DisputeController {
  async travelerRespond(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { travelerId, message, evidenceUrls } = req.body;
      const dispute = await DisputeService.travelerRespond({
        disputeId: parseInt(id),
        travelerId,
        message,
        evidenceUrls,
      });
      return res.json({ dispute });
    } catch (error: any) {
      console.error('Traveler respond error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async resolveForBuyer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { adminId, reason } = req.body;
      const dispute = await DisputeService.resolveForBuyer({
        disputeId: parseInt(id),
        adminId,
        reason,
      });
      return res.json({ dispute });
    } catch (error: any) {
      console.error('Resolve for buyer error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async resolveForTraveler(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { adminId, reason } = req.body;
      const dispute = await DisputeService.resolveForTraveler({
        disputeId: parseInt(id),
        adminId,
        reason,
      });
      return res.json({ dispute });
    } catch (error: any) {
      console.error('Resolve for traveler error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}






