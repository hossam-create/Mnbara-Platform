// Chat Routes - Gen 10 AI
// مسارات المحادثة - الجيل العاشر

import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

// Create new conversation
router.post('/conversations', chatController.createConversation.bind(chatController));

// Send message to conversation
router.post('/conversations/:conversationId/messages', chatController.sendMessage.bind(chatController));

// Get conversation by ID
router.get('/conversations/:conversationId', chatController.getConversation.bind(chatController));

// Get user's conversations
router.get('/users/:userId/conversations', chatController.getUserConversations.bind(chatController));

// End conversation
router.post('/conversations/:conversationId/end', chatController.endConversation.bind(chatController));

// Escalate to human support
router.post('/conversations/:conversationId/escalate', chatController.escalateToHuman.bind(chatController));

export default router;
