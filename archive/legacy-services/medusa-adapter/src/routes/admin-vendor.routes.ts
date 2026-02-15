import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';

const router = Router();
const vendorController = new VendorController();

// Admin vendor management routes
router.get('/', (req, res) => vendorController.listVendors(req, res));
router.get('/:id', (req, res) => vendorController.getProfile(req, res));
router.put('/:id/status', (req, res) => vendorController.updateStatus(req, res));
router.put('/:id/verification', (req, res) => vendorController.updateVerificationStatus(req, res));

// Admin payout management
router.post('/payouts/batch', (req, res) => vendorController.batchCreatePayouts(req, res));
router.put('/payouts/:id/process', (req, res) => vendorController.processPayout(req, res));
router.put('/payouts/:id/complete', (req, res) => vendorController.completePayout(req, res));
router.put('/payouts/:id/fail', (req, res) => vendorController.failPayout(req, res));

export default router;
