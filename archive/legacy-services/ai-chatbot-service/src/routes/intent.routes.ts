// Intent Routes - مسارات النوايا

import { Router } from 'express';
import { intentController } from '../controllers/intent.controller';

const router = Router();

router.get('/', intentController.getIntents);
router.get('/:intentId', intentController.getIntent);
router.post('/', intentController.createIntent);
router.put('/:intentId', intentController.updateIntent);
router.delete('/:intentId', intentController.deleteIntent);
router.post('/:intentId/responses', intentController.addResponse);

export { router as intentRoutes };
