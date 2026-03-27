// Chat Routes - مسارات الدردشة

import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

// Conversations
router.post('/conversations', chatController.createConversation);
router.get('/conversations/:conversationId', chatController.getConversation);
router.get('/conversations/user/:userId', chatController.getUserConversations);
router.post('/conversations/:conversationId/close', chatController.closeConversation);
router.post('/conversations/:conversationId/rate', chatController.rateConversation);

// Messages
router.post('/conversations/:conversationId/messages', chatController.sendMessage);

// Escalation
router.post('/conversations/:conversationId/escalate', chatController.escalateConversation);

export { router as chatRoutes };
