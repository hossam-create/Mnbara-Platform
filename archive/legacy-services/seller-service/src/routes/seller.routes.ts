import { Router } from 'express';
import { SellerController } from '../controllers/seller.controller';

const router = Router();
const controller = new SellerController();

router.post('/register', controller.register);
router.get('/:sellerId/profile', controller.getProfile);
router.put('/:sellerId/profile', controller.updateProfile);
router.get('/:sellerId/stats', controller.getStats);

export default router;
