import { Router } from 'express';
import { CommunicationController } from '../controllers/communication.controller';
import {
  sendMessageValidator,
  getMessagesValidator,
} from '../validators/communication.validator';

const router = Router();
const communicationController = new CommunicationController();

/**
 * POST /api/v1/exchange/matches/:matchId/messages
 * Send a message in a match
 */
router.post(
  '/matches/:matchId/messages',
  sendMessageValidator,
  communicationController.sendMessage
);

/**
 * GET /api/v1/exchange/matches/:matchId/messages
 * Get messages for a match
 */
router.get(
  '/matches/:matchId/messages',
  getMessagesValidator,
  communicationController.getMessages
);

export default router;
