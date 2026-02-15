import { Router } from 'express';
import { SubscriberController } from '../controllers/subscriber.controller';

const router = Router();
const subscriberController = new SubscriberController();

// Subscriber CRUD
router.post('/', subscriberController.upsertSubscriber.bind(subscriberController));
router.delete('/:subscriberId', subscriberController.deleteSubscriber.bind(subscriberController));

// Preferences
router.get('/:subscriberId/preferences', subscriberController.getPreferences.bind(subscriberController));
router.put('/:subscriberId/preferences', subscriberController.updatePreferences.bind(subscriberController));

export default router;
