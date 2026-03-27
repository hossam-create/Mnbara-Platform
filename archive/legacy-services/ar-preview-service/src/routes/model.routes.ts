// Model Routes - مسارات النماذج ثلاثية الأبعاد

import { Router } from 'express';
import { modelController } from '../controllers/model.controller';

const router = Router();

// Models
router.get('/', modelController.getModels);
router.get('/:productId', modelController.getModel);
router.post('/', modelController.createModel);
router.put('/:productId', modelController.updateModel);
router.delete('/:productId', modelController.deleteModel);

// Model status
router.patch('/:productId/status', modelController.updateStatus);

// View tracking
router.post('/:productId/view', modelController.trackView);

export { router as modelRoutes };
