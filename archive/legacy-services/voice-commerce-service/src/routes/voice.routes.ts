// Voice Routes - مسارات الصوت

import { Router } from 'express';
import multer from 'multer';
import { voiceController } from '../controllers/voice.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Process voice command
router.post('/command', upload.single('audio'), voiceController.processCommand);

// Text command (for testing)
router.post('/text-command', voiceController.processTextCommand);

// Sessions
router.get('/sessions/:userId', voiceController.getUserSessions);
router.get('/session/:sessionId', voiceController.getSession);
router.post('/session/:sessionId/end', voiceController.endSession);

// User preferences
router.get('/preferences/:userId', voiceController.getPreferences);
router.put('/preferences/:userId', voiceController.updatePreferences);

// Text to Speech
router.post('/synthesize', voiceController.synthesizeSpeech);

export { router as voiceRoutes };
