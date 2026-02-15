import { Router } from 'express';
import { UptimeMonitorController } from '../controllers/uptime-monitor.controller';

const router = Router();

/**
 * Uptime monitoring routes
 * All routes require admin authentication
 */

// Uptime status
router.get('/status', UptimeMonitorController.getUptimeStatus);

// Uptime report
router.get('/report', UptimeMonitorController.getUptimeReport);

// SLA compliance check
router.get('/sla', UptimeMonitorController.checkSLACompliance);

// Downtime events
router.get('/downtime-events', UptimeMonitorController.getDowntimeEvents);

// Matching engine health
router.get('/matching-engine-health', UptimeMonitorController.getMatchingEngineHealth);

// Health metrics
router.get('/health-metrics', UptimeMonitorController.getHealthMetrics);

// Reset uptime data (development only)
router.post('/reset', UptimeMonitorController.resetUptimeData);

export default router;
