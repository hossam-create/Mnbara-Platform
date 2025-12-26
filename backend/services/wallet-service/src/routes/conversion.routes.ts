import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller';
import { forexController } from '../controllers/forex.controller';

const router = Router();

// تحويل بين العملات في المحفظة - Convert currencies in wallet
router.post('/', walletController.convert);

// معاينة التحويل - Preview conversion
router.post('/preview', forexController.convert);

export default router;
