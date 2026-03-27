import { Router } from 'express';
import { OfferController } from '../controllers/offer.controller';

const router = Router();
const controller = new OfferController();

// Core offer operations
router.post('/', (req, res, next) => controller.create(req, res, next));
router.post('/:id/buyer', (req, res, next) => controller.buyerAction(req, res, next));
router.post('/:id/traveler', (req, res, next) => controller.travelerAction(req, res, next));
router.post('/:id/travel', (req, res, next) => controller.submitTravel(req, res, next));
router.post('/:id/travel/decision', (req, res, next) => controller.buyerTravelDecision(req, res, next));
router.post('/:id/convert', (req, res, next) => controller.convertToOrder(req, res, next));

// Sprint 1: AI Core Integration (advisory only, feature-flagged)
router.get('/:id/ai/recommendation', (req, res, next) => controller.getAIRecommendation(req, res, next));
router.get('/ai/audit', (req, res, next) => controller.getAuditLogs(req, res, next));

export default router;

