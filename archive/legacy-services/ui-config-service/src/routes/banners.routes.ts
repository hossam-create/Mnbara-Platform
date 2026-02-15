import { Router } from 'express';
import { BannersController } from '../controllers/banners.controller';

const router = Router();
const controller = new BannersController();

router.get('/', controller.getAllBanners.bind(controller));
router.get('/:id', controller.getBanner.bind(controller));
router.post('/', controller.createBanner.bind(controller));
router.put('/:id', controller.updateBanner.bind(controller));
router.delete('/:id', controller.deleteBanner.bind(controller));
router.patch('/:id/toggle-active', controller.toggleActive.bind(controller));
router.post('/reorder', controller.reorderBanners.bind(controller));

export default router;
