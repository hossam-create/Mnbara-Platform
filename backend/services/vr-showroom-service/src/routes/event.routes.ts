// Event Routes - مسارات الأحداث

import { Router } from 'express';
import { eventController } from '../controllers/event.controller';

const router = Router();

router.get('/', eventController.getEvents);
router.get('/:eventId', eventController.getEvent);
router.post('/', eventController.createEvent);
router.put('/:eventId', eventController.updateEvent);
router.post('/:eventId/register', eventController.registerForEvent);
router.delete('/:eventId/register/:userId', eventController.unregisterFromEvent);
router.post('/:eventId/start', eventController.startEvent);
router.post('/:eventId/end', eventController.endEvent);

export { router as eventRoutes };
