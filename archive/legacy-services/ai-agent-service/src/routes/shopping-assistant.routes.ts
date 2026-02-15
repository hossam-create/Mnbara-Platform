/**
 * Shopping Assistant Routes
 */

import { Router } from 'express';
import shoppingAssistantController from '../controllers/shopping-assistant.controller';

const router = Router();

// Chat with assistant
router.post('/chat', (req, res) => shoppingAssistantController.chat(req, res));

// Get conversation history
router.get('/conversation/:userId', (req, res) => 
  shoppingAssistantController.getConversation(req, res)
);

// Clear conversation
router.delete('/conversation/:userId', (req, res) => 
  shoppingAssistantController.clearConversation(req, res)
);

export default router;
