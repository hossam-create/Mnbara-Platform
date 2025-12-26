// Blacklist Routes - مسارات القائمة السوداء

import { Router } from 'express';
import { blacklistController } from '../controllers/blacklist.controller';

const router = Router();

// Blacklist Management
router.get('/', blacklistController.getBlacklist);
router.post('/', blacklistController.addToBlacklist);
router.delete('/:entryType/:value', blacklistController.removeFromBlacklist);
router.get('/check/:entryType/:value', blacklistController.checkBlacklist);

export { router as blacklistRoutes };
