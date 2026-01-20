import { Request, Response } from 'express';
import { AutomationService } from '../services/AutomationService';

export class AutomationController {
  private automationService: AutomationService;

  constructor() {
    this.automationService = new AutomationService();
    // Initialize the service
    this.automationService.initialize();
  }

  /**
   * Create automated payout rule
   */
  createPayoutRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        sellerId,
        ruleName,
        ruleType,
        triggerConditions,
        payoutSettings,
        isActive = true,
        autoApprove = false,
        riskThreshold = 50,
      } = req.body;

      if (!sellerId || !ruleName || !ruleType || !triggerConditions || !payoutSettings) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const validRuleTypes = ['threshold', 'schedule', 'instant', 'conditional'];
      if (!validRuleTypes.includes(ruleType)) {
        res.status(400).json({ error: 'Invalid rule type' });
        return;
      }

      const rule = await this.automationService.createPayoutRule({
        sellerId,
        ruleName,
        ruleType,
        triggerConditions,
        payoutSettings,
        isActive,
        autoApprove,
        riskThreshold,
      });

      res.status(201).json({
        success: true,
        data: rule,
        message: 'Automated payout rule created successfully',
      });
    } catch (error) {
      console.error('Create payout rule error:', error);
      res.status(500).json({ 
        error: 'Failed to create payout rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Trigger automated payout processing
   */
  triggerAutomatedPayouts = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.automationService.processAutomatedPayouts();

      res.status(200).json({
        success: true,
        message: 'Automated payout processing triggered successfully',
      });
    } catch (error) {
      console.error('Trigger automated payouts error:', error);
      res.status(500).json({ 
        error: 'Failed to trigger automated payouts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Trigger escrow release processing
   */
  triggerEscrowReleases = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.automationService.processEscrowReleases();

      res.status(200).json({
        success: true,
        message: 'Escrow release processing triggered successfully',
      });
    } catch (error) {
      console.error('Trigger escrow releases error:', error);
      res.status(500).json({ 
        error: 'Failed to trigger escrow releases',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Route transaction to best PSP
   */
  routeTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        transactionId,
        amount,
        currency,
        region,
        method,
      } = req.body;

      if (!transactionId || !amount || !currency || !region || !method) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const routing = await this.automationService.routeToBestPSP({
        transactionId,
        amount,
        currency,
        region,
        method,
      });

      res.status(200).json({
        success: true,
        data: routing,
        message: 'Transaction routed to best PSP successfully',
      });
    } catch (error) {
      console.error('Route transaction error:', error);
      res.status(500).json({ 
        error: 'Failed to route transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get automation dashboard data
   */
  getAutomationDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      // This would query the automation_dashboard view
      // For now, return mock data
      const dashboardData = {
        automatedPayouts: {
          totalExecutions: 150,
          successful: 142,
          failed: 8,
          totalAmountProcessed: 125000.50,
          avgProcessingHours: 2.3,
        },
        escrowReleases: {
          totalExecutions: 89,
          successful: 85,
          failed: 4,
          avgProcessingHours: 1.8,
        },
        pspHealth: {
          healthy: 3,
          degraded: 1,
          down: 0,
        },
        recentActivity: [
          {
            type: 'automated_payout',
            status: 'completed',
            amount: 1250.00,
            timestamp: new Date().toISOString(),
          },
          {
            type: 'escrow_release',
            status: 'released',
            amount: 850.00,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      };

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      console.error('Get automation dashboard error:', error);
      res.status(500).json({ 
        error: 'Failed to get automation dashboard',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get PSP health status
   */
  getPSPHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      // This would query psp_health_status table
      // For now, return mock data
      const pspHealth = [
        {
          id: 'psp-1',
          name: 'Stripe Connect',
          type: 'stripe',
          status: 'healthy',
          responseTimeMs: 245,
          successRate: 99.8,
          errorRate: 0.2,
          lastCheck: new Date().toISOString(),
          consecutiveFailures: 0,
          uptimePercentage: 99.9,
        },
        {
          id: 'psp-2',
          name: 'PayPal Business',
          type: 'paypal',
          status: 'degraded',
          responseTimeMs: 1250,
          successRate: 97.5,
          errorRate: 2.5,
          lastCheck: new Date().toISOString(),
          consecutiveFailures: 0,
          uptimePercentage: 98.2,
        },
        {
          id: 'psp-3',
          name: 'Adyen',
          type: 'adyen',
          status: 'healthy',
          responseTimeMs: 180,
          successRate: 99.9,
          errorRate: 0.1,
          lastCheck: new Date().toISOString(),
          consecutiveFailures: 0,
          uptimePercentage: 99.95,
        },
      ];

      res.status(200).json({
        success: true,
        data: pspHealth,
      });
    } catch (error) {
      console.error('Get PSP health error:', error);
      res.status(500).json({ 
        error: 'Failed to get PSP health',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get automation settings
   */
  getAutomationSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.automationService.getAutomationSettings();

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Get automation settings error:', error);
      res.status(500).json({ 
        error: 'Failed to get automation settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update automation setting
   */
  updateAutomationSetting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key, value } = req.body;

      if (!key || value === undefined) {
        res.status(400).json({ error: 'Key and value are required' });
        return;
      }

      await this.automationService.updateAutomationSetting(key, value);

      res.status(200).json({
        success: true,
        message: 'Automation setting updated successfully',
      });
    } catch (error) {
      console.error('Update automation setting error:', error);
      res.status(500).json({ 
        error: 'Failed to update automation setting',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get automation audit log
   */
  getAutomationAuditLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { automationType, entityId, startDate, endDate, limit = '100' } = req.query;

      // This would query automation_audit_log table
      // For now, return mock data
      const auditLog = [
        {
          id: 'audit-1',
          automationType: 'payout',
          entityId: 'rule-1',
          action: 'execution_completed',
          oldStatus: 'pending',
          newStatus: 'completed',
          executionDetails: { amount: 1250.00, autoApproved: true },
          errorMessage: null,
          performedBy: 'system',
          performedAt: new Date().toISOString(),
        },
        {
          id: 'audit-2',
          automationType: 'escrow_release',
          entityId: 'tx-1',
          action: 'release_executed',
          oldStatus: 'triggered',
          newStatus: 'released',
          executionDetails: { ruleType: 'delivery_confirmation', autoRelease: true },
          errorMessage: null,
          performedBy: 'system',
          performedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];

      res.status(200).json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      console.error('Get automation audit log error:', error);
      res.status(500).json({ 
        error: 'Failed to get automation audit log',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get seller's automated payout rules
   */
  getSellerPayoutRules = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sellerId } = req.params;

      if (!sellerId) {
        res.status(400).json({ error: 'Seller ID is required' });
        return;
      }

      // This would query automated_payout_rules table
      // For now, return mock data
      const rules = [
        {
          id: 'rule-1',
          sellerId,
          ruleName: 'Weekly Threshold Payout',
          ruleType: 'threshold',
          triggerConditions: { minAmount: 100, maxAmount: 5000 },
          payoutSettings: { autoApprove: true, feeWaiver: false },
          isActive: true,
          autoApprove: true,
          riskThreshold: 30,
          createdAt: new Date().toISOString(),
        },
      ];

      res.status(200).json({
        success: true,
        data: rules,
      });
    } catch (error) {
      console.error('Get seller payout rules error:', error);
      res.status(500).json({ 
        error: 'Failed to get seller payout rules',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update payout rule
   */
  updatePayoutRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ruleId } = req.params;
      const updateData = req.body;

      if (!ruleId) {
        res.status(400).json({ error: 'Rule ID is required' });
        return;
      }

      // This would update automated_payout_rules table
      // For now, return success
      res.status(200).json({
        success: true,
        message: 'Payout rule updated successfully',
      });
    } catch (error) {
      console.error('Update payout rule error:', error);
      res.status(500).json({ 
        error: 'Failed to update payout rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Delete payout rule
   */
  deletePayoutRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ruleId } = req.params;

      if (!ruleId) {
        res.status(400).json({ error: 'Rule ID is required' });
        return;
      }

      // This would delete from automated_payout_rules table
      // For now, return success
      res.status(200).json({
        success: true,
        message: 'Payout rule deleted successfully',
      });
    } catch (error) {
      console.error('Delete payout rule error:', error);
      res.status(500).json({ 
        error: 'Failed to delete payout rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get automation statistics
   */
  getAutomationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      // This would calculate real statistics
      // For now, return mock data
      const stats = {
        automatedPayouts: {
          totalProcessed: 1250,
          successRate: 98.4,
          totalAmount: 2450000.00,
          avgProcessingTime: 2.1,
          feeSaved: 12250.00,
        },
        escrowReleases: {
          totalProcessed: 890,
          successRate: 96.7,
          avgProcessingTime: 1.8,
          manualReviewRate: 15.2,
        },
        pspRouting: {
          totalTransactions: 5420,
          optimalRoutingRate: 94.3,
          costSavings: 18500.00,
          fallbackRate: 5.7,
        },
        healthMetrics: {
          overallUptime: 99.8,
          avgResponseTime: 320,
          errorRate: 0.8,
          incidentsResolved: 12,
        },
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get automation stats error:', error);
      res.status(500).json({ 
        error: 'Failed to get automation statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
