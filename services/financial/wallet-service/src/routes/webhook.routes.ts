import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import { webhookRateLimiter } from '../middleware/webhook-security.middleware';

const router = Router();

/**
 * @route   POST /api/v2/webhooks/:gateway
 * @desc    Receive webhook events from payment providers (Stripe, Paymob)
 * @access  Public (Secured by Signature & Rate Limiter)
 */
router.post('/:gateway', webhookRateLimiter, webhookController.handleWebhook);

export default router;
