// Session Routes - مسارات جلسات AR

import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';

const router = Router();

// Sessions
router.post('/start', sessionController.startSession);
router.post('/:sessionId/end', sessionController.endSession);
router.get('/:sessionId', sessionController.getSession);
router.get('/user/:userId', sessionController.getUserSessions);

// Screenshots
router.post('/:sessionId/screenshot', sessionController.saveScreenshot);
router.get('/screenshots/user/:userId', sessionController.getUserScreenshots);
router.post('/screenshots/:screenshotId/share', sessionController.shareScreenshot);

export { router as sessionRoutes };
