import { Router } from 'express';
import { MatchingController } from '../controllers/matching.controller';

const router = Router();
const controller = new MatchingController();

/**
 * GET /api/matching/suggestions/:requestId
 * Get top N suggested travelers for a shopper request
 * Query params:
 *   - topN: number (default 5)
 *   - maxDateProximityDays: number (default 30)
 */
router.get('/suggestions/:requestId', (req, res, next) => {
  controller.getSuggestions(req, res, next);
});

export default router;





