import { Router } from 'express';
import { PaymentWebhookController } from '../controllers/PaymentWebhookController';
import { StateTransitionService } from '../services/StateTransitionService';
import { RequestService } from '../services/RequestService';

const router = Router();

// Initialize services (would be injected via dependency injection in production)
const requestService = new RequestService({} as any); // DB would be injected
const stateTransitionService = new StateTransitionService(requestService);
const webhookController = new PaymentWebhookController(
  stateTransitionService,
  requestService
);

/**
 * Payment webhook endpoint
 * POST /api/webhooks/payment
 * 
 * Receives webhook events from payment-service (Stripe)
 * No authentication required - webhook signature verification handled by payment-service
 */
router.post('/payment', webhookController.handlePaymentWebhook.bind(webhookController));

export default router;
