/**
 * Financial Dashboard Controller
 * 
 * Admin endpoints for financial overview dashboard.
 */

import { Request, Response } from 'express';
import { financialDashboardService } from '../services/financial-dashboard.service';
import { FinancialFilters } from '../types/financial-dashboard.types';
import { logger } from '../utils/logger';

export class FinancialDashboardController {
  /**
   * GET /api/admin/financial/overview
   * Get complete dashboard data
   */
  async getDashboardOverview(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Admin requesting financial dashboard overview', {
        adminId: (req as any).user?.id,
      });

      const data = await financialDashboardService.getDashboardData();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Failed to get dashboard overview', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data',
      });
    }
  }

  /**
   * GET /api/admin/financial/metrics
   * Get overview metrics only
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Admin requesting financial metrics', {
        adminId: (req as any).user?.id,
      });

      const metrics = await financialDashboardService.getOverviewMetrics();

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Failed to get metrics', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics',
      });
    }
  }

  /**
   * GET /api/admin/financial/charts/daily-volume
   * Get daily transaction volume chart data
   */
  async getDailyVolume(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Admin requesting daily volume chart', {
        adminId: (req as any).user?.id,
      });

      const data = await financialDashboardService.getDailyTransactionVolume();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Failed to get daily volume', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve daily volume data',
      });
    }
  }

  /**
   * GET /api/admin/financial/charts/fees-by-category
   * Get fees by category chart data
   */
  async getFeesByCategory(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Admin requesting fees by category chart', {
        adminId: (req as any).user?.id,
      });

      const data = await financialDashboardService.getFeesByCategory();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Failed to get fees by category', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve fees data',
      });
    }
  }

  /**
   * GET /api/admin/financial/charts/payouts-by-status
   * Get payouts by status chart data
   */
  async getPayoutsByStatus(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Admin requesting payouts by status chart', {
        adminId: (req as any).user?.id,
      });

      const data = await financialDashboardService.getPayoutsByStatus();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Failed to get payouts by status', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payouts data',
      });
    }
  }

  /**
   * GET /api/admin/financial/escrow-holds
   * Get escrow holds with pagination and filters
   */
  async getEscrowHolds(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Admin requesting escrow holds', {
        adminId: (req as any).user?.id,
        query: req.query,
      });

      const filters: FinancialFilters = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
        status: req.query.status as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const data = await financialDashboardService.getEscrowHolds(filters);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Failed to get escrow holds', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve escrow holds',
      });
    }
  }

  /**
   * GET /api/admin/financial/transactions
   * Get wallet transactions with pagination and filters
   */
  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Admin requesting wallet transactions', {
        adminId: (req as any).user?.id,
        query: req.query,
      });

      const filters: FinancialFilters = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
        status: req.query.status as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const data = await financialDashboardService.getTransactions(filters);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Failed to get transactions', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transactions',
      });
    }
  }

  /**
   * GET /api/admin/financial/pending-payouts
   * Get pending payouts with pagination
   */
  async getPendingPayouts(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Admin requesting pending payouts', {
        adminId: (req as any).user?.id,
        query: req.query,
      });

      const filters: FinancialFilters = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const data = await financialDashboardService.getPendingPayouts(filters);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('Failed to get pending payouts', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve pending payouts',
      });
    }
  }
}

export const financialDashboardController = new FinancialDashboardController();
