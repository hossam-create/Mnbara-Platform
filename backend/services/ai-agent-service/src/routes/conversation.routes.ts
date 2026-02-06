import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';

const router = Router();
const controller = new ConversationController();

router.get('/', (req, res) => controller.listConversations(req, res));
router.get('/:conversationId', (req, res) => controller.getConversation(req, res));
router.delete('/:conversationId', (req, res) => controller.deleteConversation(req, res));

export default router;
