import { Request, Response, NextFunction } from 'express';
import { MatchingService, MatchingConfig } from '../services/matching.service';

const matchingService = new MatchingService();

export class MatchingController {
  /**
   * GET /api/matching/suggestions/:requestId
   * Get suggested travelers for a shopper request
   */
  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = parseInt(req.params.requestId, 10);
      if (isNaN(requestId)) {
        return res.status(400).json({ error: 'Invalid requestId' });
      }

      // Optional config from query params
      const config: MatchingConfig = {};
      if (req.query.topN) {
        config.topN = parseInt(req.query.topN as string, 10);
      }
      if (req.query.maxDateProximityDays) {
        config.maxDateProximityDays = parseInt(req.query.maxDateProximityDays as string, 10);
      }

      const suggestions = await matchingService.getSuggestedTravelers(requestId, config);

      res.json({
        success: true,
        data: suggestions,
        count: suggestions.length,
      });
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      if (err.message.includes('sourceCountry') || err.message.includes('destinationCountry')) {
        return res.status(400).json({ error: err.message });
      }
      next(err);
    }
  }
}





