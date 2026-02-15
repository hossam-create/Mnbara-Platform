import { Router } from 'express';
import { TravelerController } from '../controllers/traveler.controller';

const router = Router();
const travelerController = new TravelerController();

// Location tracking
router.post('/:travelerId/location', travelerController.updateLocation);
router.get('/:travelerId/location', travelerController.getLocation);

// Availability management
router.post('/:travelerId/availability', travelerController.createAvailability);
router.get('/:travelerId/availability', travelerController.getAvailability);
router.put('/availability/:availabilityId', travelerController.updateAvailability);
router.delete('/availability/:availabilityId', travelerController.deleteAvailability);

// Recommendations
router.get('/:travelerId/recommendations', travelerController.getRecommendations);

// Nearby requests
router.get('/nearby-requests', travelerController.getNearbyRequests);

export default router;
