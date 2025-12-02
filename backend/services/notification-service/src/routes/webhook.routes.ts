import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();
const webhookController = new WebhookController();

// Auction webhooks
router.post('/auctions/outbid', (req, res) => webhookController.handleAuctionOutbid(req, res));
router.post('/auctions/ended', (req, res) => webhookController.handleAuctionEnded(req, res));

// Order webhooks
router.post('/orders/status-changed', (req, res) => webhookController.handleOrderStatusChanged(req, res));

export default router;
