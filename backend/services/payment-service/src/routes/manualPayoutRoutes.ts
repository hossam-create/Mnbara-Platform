import { Router } from 'express';
import { ManualPayoutController } from '../controllers/ManualPayoutController';

const router = Router();
const manualPayoutController = new ManualPayoutController();

// Public routes (for sellers)
router.post('/requests', manualPayoutController.createPayoutRequest);
router.get('/sellers/:sellerId/requests', manualPayoutController.getSellerPayoutRequests);
router.get('/requests/:requestId', manualPayoutController.getPayoutRequest);
router.get('/sellers/:sellerId/summary', manualPayoutController.getSellerPayoutSummary);

// Admin routes (protected by middleware in main app)
router.post('/admin/batches', manualPayoutController.createWeeklyBatch);
router.get('/admin/batches', manualPayoutController.getPayoutBatches);
router.get('/admin/batches/:batchId/export', manualPayoutController.exportBatchToCSV);
router.put('/admin/requests/:requestId/status', manualPayoutController.updatePayoutStatus);
router.get('/admin/requests/pending', manualPayoutController.getPendingRequests);
router.get('/admin/stats', manualPayoutController.getPayoutStats);
router.get('/admin/settings', manualPayoutController.getPayoutSettings);
router.put('/admin/settings', manualPayoutController.updatePayoutSetting);
router.get('/admin/requests/:requestId/audit', manualPayoutController.getPayoutAuditLog);

export default router;
