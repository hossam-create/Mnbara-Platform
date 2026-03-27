import { Router } from 'express';
import { SettlementController } from '../controllers/settlement.controller';
import {
  getSettlementValidator,
  pspWebhookValidator,
  escrowWebhookValidator,
} from '../validators/settlement.validator';

const router = Router();
const settlementController = new SettlementController();

/**
 * GET /api/v1/exchange/settlements/:id
 * Get settlement details
 */
router.get('/:id', getSettlementValidator, settlementController.getSettlement);

/**
 * POST /api/v1/exchange/webhooks/psp/:provider
 * Handle PSP webhook (no auth required - verified by signature)
 */
router.post(
  '/webhooks/psp/:provider',
  pspWebhookValidator,
  settlementController.handlePSPWebhook
);

/**
 * POST /api/v1/exchange/webhooks/escrow/:provider
 * Handle external escrow webhook (no auth required - verified by signature)
 */
router.post(
  '/webhooks/escrow/:provider',
  escrowWebhookValidator,
  settlementController.handleEscrowWebhook
);

export default router;
