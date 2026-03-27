import { Router } from 'express';
import { VersionsController } from '../controllers/versions.controller';

const router = Router();
const controller = new VersionsController();

router.get('/', controller.getAllVersions.bind(controller));
router.get('/latest', controller.getLatestVersion.bind(controller));
router.get('/:id', controller.getVersion.bind(controller));
router.post('/publish', controller.publishVersion.bind(controller));
router.post('/:id/rollback', controller.rollbackToVersion.bind(controller));
router.delete('/:id', controller.deleteVersion.bind(controller));

export default router;
