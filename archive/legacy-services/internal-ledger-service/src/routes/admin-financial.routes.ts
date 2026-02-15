/**
 * Admin Financial Dashboard Routes
 * 
 * Routes for admin financial overview dashboard.
 */

import { Router } from 'express';
import { financialDashboardController } from '../controllers/financial-dashboard.controller';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

/**
 * GET /api/admin/financial/overview
 * Get complete dashboard data (metrics + charts + recent data)
 */
router.get('/overview', (req, res) =>
  financialDashboardController.getDashboardOverview(req, res)
);

/**
 * GET /api/admin/financial/metrics
 * Get overview metrics only
 */
router.get('/metrics', (req, res) =>
  financialDashboardController.getMetrics(req, res)
);

/**
 * GET /api/admin/financial/charts/daily-volume
 * Get daily transaction volume chart data (last 30 days)
 */
router.get('/charts/daily-volume', (req, res) =>
  financialDashboardController.getDailyVolume(req, res)
);

/**
 * GET /api/admin/financial/charts/fees-by-category
 * Get fees by category pie chart data
 */
router.get('/charts/fees-by-category', (req, res) =>
  financialDashboardController.getFeesByCategory(req, res)
);

/**
 * GET /api/admin/financial/charts/payouts-by-status
 * Get payouts by status bar chart data
 */
router.get('/charts/payouts-by-status', (req, res) =>
  financialDashboardController.getPayoutsByStatus(req, res)
);

/**
 * GET /api/admin/financial/escrow-holds
 * Get escrow holds with pagination and filters
 * Query params: page, pageSize, status, startDate, endDate
 */
router.get('/escrow-holds', (req, res) =>
  financialDashboardController.getEscrowHolds(req, res)
);

/**
 * GET /api/admin/financial/transactions
 * Get wallet transactions with pagination and filters
 * Query params: page, pageSize, status, startDate, endDate
 */
router.get('/transactions', (req, res) =>
  financialDashboardController.getTransactions(req, res)
);

/**
 * GET /api/admin/financial/pending-payouts
 * Get pending payouts with pagination
 * Query params: page, pageSize, startDate, endDate
 */
router.get('/pending-payouts', (req, res) =>
  financialDashboardController.getPendingPayouts(req, res)
);

export default router;
