import { Router } from 'express';
import { AutomationController } from '../controllers/AutomationController';

const router = Router();
const automationController = new AutomationController();

// Payout Rules Management
router.post('/payout-rules', automationController.createPayoutRule);
router.get('/sellers/:sellerId/payout-rules', automationController.getSellerPayoutRules);
router.put('/payout-rules/:ruleId', automationController.updatePayoutRule);
router.delete('/payout-rules/:ruleId', automationController.deletePayoutRule);

// Automation Triggers
router.post('/trigger/payouts', automationController.triggerAutomatedPayouts);
router.post('/trigger/escrow-releases', automationController.triggerEscrowReleases);
router.post('/route-transaction', automationController.routeTransaction);

// Dashboard and Monitoring
router.get('/dashboard', automationController.getAutomationDashboard);
router.get('/psp-health', automationController.getPSPHealth);
router.get('/stats', automationController.getAutomationStats);

// Settings Management
router.get('/settings', automationController.getAutomationSettings);
router.put('/settings', automationController.updateAutomationSetting);

// Audit and Logs
router.get('/audit-log', automationController.getAutomationAuditLog);

export default router;
