import { Router } from 'express';
import { TravelerController } from '../controllers/traveler.controller';

const router = Router();
const travelerController = new TravelerController();

// Location tracking
router.post('/:travelerId/location', (req, res) => travelerController.updateLocation(req, res));
router.get('/:travelerId/location', (req, res) => travelerController.getLocation(req, res));

// Trip management (existing routes)
// ... existing trip routes ...

export default router;
