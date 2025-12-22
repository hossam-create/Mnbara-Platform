import { Router } from 'express';
import { DisputeController } from '../controllers/dispute.controller';

const router = Router();
const controller = new DisputeController();

// Traveler responds to dispute
router.post('/:id/traveler-response', (req, res) => controller.travelerRespond(req, res));

// Admin resolves disputes
router.post('/:id/resolve-buyer', (req, res) => controller.resolveForBuyer(req, res));
router.post('/:id/resolve-traveler', (req, res) => controller.resolveForTraveler(req, res));

export default router;





