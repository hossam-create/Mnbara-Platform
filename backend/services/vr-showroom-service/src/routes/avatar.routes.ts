// Avatar Routes - مسارات الأفاتار

import { Router } from 'express';
import { avatarController } from '../controllers/avatar.controller';

const router = Router();

router.get('/:userId', avatarController.getAvatar);
router.post('/', avatarController.createAvatar);
router.put('/:userId', avatarController.updateAvatar);

export { router as avatarRoutes };
