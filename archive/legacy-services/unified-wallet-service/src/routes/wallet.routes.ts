import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';

const router = Router();
const walletController = new WalletController();

// Wallet management routes
router.post('/', walletController.createWallet);
router.get('/', walletController.getUserWallets);
router.get('/:walletId', walletController.getWallet);
router.put('/:walletId', walletController.updateWallet);
router.post('/:walletId/freeze', walletController.freezeWallet);
router.post('/:walletId/unfreeze', walletController.unfreezeWallet);
router.get('/:walletId/statement', walletController.getWalletStatement);

export default router;