import { Router } from 'express';
import { CrowdshipController } from '../controllers/crowdship.controller';

const router = Router();
const controller = new CrowdshipController();

router.post('/delivery-requests', controller.createDeliveryRequest);
router.post('/find-travelers', controller.findAvailableTravelers);
router.post('/accept-delivery', controller.acceptDelivery);
router.put('/travelers/:travelerId/location', controller.updateTravelerLocation);
router.post('/confirm-delivery', controller.confirmDelivery);
router.get('/travelers/:travelerId/stats', controller.getTravelerStats);

export default router;
