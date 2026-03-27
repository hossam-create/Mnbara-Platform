import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';

const router = Router();
const vendorController = new VendorController();

// Vendor routes
router.post('/register', (req, res) => vendorController.register(req, res));
router.get('/:id', (req, res) => vendorController.getProfile(req, res));
router.get('/user/:userId', (req, res) => vendorController.getByUserId(req, res));
router.put('/:id', (req, res) => vendorController.updateProfile(req, res));
router.get('/:id/analytics', (req, res) => vendorController.getAnalytics(req, res));
router.get('/:id/commissions', (req, res) => vendorController.getCommissions(req, res));
router.get('/:id/commissions/summary', (req, res) => vendorController.getCommissionSummary(req, res));
router.get('/:id/payouts', (req, res) => vendorController.getPayouts(req, res));
router.get('/:id/payouts/summary', (req, res) => vendorController.getPayoutSummary(req, res));
router.post('/:id/payouts', (req, res) => vendorController.requestPayout(req, res));

export default router;
