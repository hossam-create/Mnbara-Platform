// Assistant Routes - Mnbara AI
// مسارات المساعد - ذكاء منبرة

import { Router } from 'express';
import { assistantController } from '../controllers/assistant.controller';

const router = Router();

// Chat with Mnbara AI
router.post('/chat', assistantController.chat.bind(assistantController));

// Get greeting
router.get('/greeting', assistantController.getGreeting.bind(assistantController));

// Rate response
router.post('/rate/:inferenceId', assistantController.rateResponse.bind(assistantController));

// Quick actions
router.post('/action', assistantController.quickAction.bind(assistantController));

export default router;
