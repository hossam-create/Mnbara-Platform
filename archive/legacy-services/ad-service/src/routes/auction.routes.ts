import { Router } from 'express';
import { AuctionController } from '../controllers/AuctionController';

const router = Router();
const controller = new AuctionController();

router.post('/inject', (req, res) => controller.getAds(req, res));

export default router;
