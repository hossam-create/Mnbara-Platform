import { Router } from 'express';
import { ThemesController } from '../controllers/themes.controller';

const router = Router();
const controller = new ThemesController();

router.get('/', controller.getAllThemes.bind(controller));
router.get('/active', controller.getActiveTheme.bind(controller));
router.get('/:id', controller.getTheme.bind(controller));
router.post('/', controller.createTheme.bind(controller));
router.put('/:id', controller.updateTheme.bind(controller));
router.delete('/:id', controller.deleteTheme.bind(controller));
router.patch('/:id/activate', controller.activateTheme.bind(controller));
router.post('/:id/duplicate', controller.duplicateTheme.bind(controller));

export default router;
