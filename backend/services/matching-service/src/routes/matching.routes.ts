import { Router } from 'express';
import { MatchingController } from '../controllers/matching.controller';

const router = Router();
const matchingController = new MatchingController();

// Nearby requests (geo-spatial search)
router.get('/nearby-requests', (req, res) => matchingController.getNearbyRequests(req, res));

// Match traveler with order
router.post('/match', (req, res) => matchingController.matchTravelerWithOrder(req, res));

export default router;
