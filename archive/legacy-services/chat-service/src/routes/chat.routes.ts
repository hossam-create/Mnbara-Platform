import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
const controller = new ChatController();

// All routes require authentication
router.use(authenticateJWT);

// Conversations
router.post('/conversations', controller.createConversation.bind(controller));
router.get('/conversations', controller.getUserConversations.bind(controller));

// Messages
router.get('/conversations/:conversationId/messages', controller.getMessages.bind(controller));
router.get('/conversations/:conversationId/unread', controller.getUnreadCount.bind(controller));

// Participants
router.post('/conversations/:conversationId/participants', controller.addParticipant.bind(controller));
router.delete('/conversations/:conversationId/participants/:userId', controller.removeParticipant.bind(controller));

export default router;
