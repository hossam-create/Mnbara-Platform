// Session Routes - مسارات الجلسات

import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';

const router = Router();

router.post('/start', sessionController.startSession);
router.post('/:sessionId/end', sessionController.endSession);
router.get('/:sessionId', sessionController.getSession);
router.get('/user/:userId', sessionController.getUserSessions);

export { router as sessionRoutes };
