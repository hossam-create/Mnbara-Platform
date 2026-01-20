import { Request, Response } from 'express';
import { ManualPayoutService } from '../services/ManualPayoutService';
import fs from 'fs';
import path from 'path';

export class ManualPayoutController {
  private payoutService: ManualPayoutService;

  constructor() {
    this.payoutService = new ManualPayoutService();
  }

  /**
   * Create new payout request
   */
  createPayoutRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        sellerId,
        userId,
        amount,
        currency,
        payoutMethod,
        bankAccountName,
        bankAccountNumber,
        bankName,
        bankRoutingNumber,
        bankSwiftCode,
        bankAddress,
        orderIds,
        payoutPeriodStart,
        payoutPeriodEnd,
      } = req.body;

      if (!sellerId || !userId || !amount || !bankAccountName || !bankAccountNumber || !bankName) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }

      const payoutRequest = await this.payoutService.createPayoutRequest({
        sellerId,
        userId,
        amount,
        currency: currency || 'USD',
        payoutMethod: payoutMethod || 'bank_transfer',
        bankAccountName,
        bankAccountNumber,
        bankName,
        bankRoutingNumber,
        bankSwiftCode,
        bankAddress,
        orderIds,
        payoutPeriodStart: payoutPeriodStart ? new Date(payoutPeriodStart) : undefined,
        payoutPeriodEnd: payoutPeriodEnd ? new Date(payoutPeriodEnd) : undefined,
      });

      res.status(201).json({
        success: true,
        data: payoutRequest,
        message: 'Payout request created successfully',
      });
    } catch (error) {
      console.error('Create payout request error:', error);
      res.status(500).json({ 
        error: 'Failed to create payout request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get seller payout requests
   */
  getSellerPayoutRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sellerId } = req.params;
      const { status } = req.query;

      if (!sellerId) {
        res.status(400).json({ error: 'Seller ID is required' });
        return;
      }

      const requests = await this.payoutService.getSellerPayoutRequests(
        sellerId,
        status as string
      );

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      console.error('Get seller payout requests error:', error);
      res.status(500).json({ 
        error: 'Failed to get payout requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get payout request details
   */
  getPayoutRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;

      if (!requestId) {
        res.status(400).json({ error: 'Request ID is required' });
        return;
      }

      const request = await this.payoutService.getPayoutRequest(requestId);

      if (!request) {
        res.status(404).json({ error: 'Payout request not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      console.error('Get payout request error:', error);
      res.status(500).json({ 
        error: 'Failed to get payout request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update payout request status (Admin only)
   */
  updatePayoutStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;
      const { status, reviewedBy, rejectionReason, internalNotes } = req.body;

      if (!requestId || !status) {
        res.status(400).json({ error: 'Request ID and status are required' });
        return;
      }

      const validStatuses = ['requested', 'under_review', 'approved', 'processing', 'paid', 'rejected', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      const updatedRequest = await this.payoutService.updatePayoutStatus(
        requestId,
        status,
        reviewedBy,
        rejectionReason,
        internalNotes
      );

      res.status(200).json({
        success: true,
        data: updatedRequest,
        message: `Payout request ${status} successfully`,
      });
    } catch (error) {
      console.error('Update payout status error:', error);
      res.status(500).json({ 
        error: 'Failed to update payout status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Create weekly payout batch (Admin only)
   */
  createWeeklyBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const batch = await this.payoutService.createWeeklyBatch();

      res.status(201).json({
        success: true,
        data: batch,
        message: 'Weekly payout batch created successfully',
      });
    } catch (error) {
      console.error('Create weekly batch error:', error);
      res.status(500).json({ 
        error: 'Failed to create weekly batch',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get all payout batches (Admin only)
   */
  getPayoutBatches = async (req: Request, res: Response): Promise<void> => {
    try {
      const batches = await this.payoutService.getPayoutBatches();

      res.status(200).json({
        success: true,
        data: batches,
      });
    } catch (error) {
      console.error('Get payout batches error:', error);
      res.status(500).json({ 
        error: 'Failed to get payout batches',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Export batch to CSV (Admin only)
   */
  exportBatchToCSV = async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId } = req.params;

      if (!batchId) {
        res.status(400).json({ error: 'Batch ID is required' });
        return;
      }

      const filePath = await this.payoutService.exportBatchToCSV(batchId);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Export file not found' });
        return;
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);

      // Stream file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Export batch CSV error:', error);
      res.status(500).json({ 
        error: 'Failed to export batch',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get payout statistics (Admin only)
   */
  getPayoutStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      const stats = await this.payoutService.getPayoutStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get payout stats error:', error);
      res.status(500).json({ 
        error: 'Failed to get payout statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get seller payout summary
   */
  getSellerPayoutSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sellerId } = req.params;

      if (!sellerId) {
        res.status(400).json({ error: 'Seller ID is required' });
        return;
      }

      const summary = await this.payoutService.getSellerPayoutSummary(sellerId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Get seller payout summary error:', error);
      res.status(500).json({ 
        error: 'Failed to get seller payout summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get pending requests for review (Admin only)
   */
  getPendingRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = '50' } = req.query;

      const requests = await this.payoutService.getPendingRequests(parseInt(limit as string));

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      console.error('Get pending requests error:', error);
      res.status(500).json({ 
        error: 'Failed to get pending requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get payout settings (Admin only)
   */
  getPayoutSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.payoutService.getPayoutSettings();

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Get payout settings error:', error);
      res.status(500).json({ 
        error: 'Failed to get payout settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update payout settings (Admin only)
   */
  updatePayoutSetting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key, value } = req.body;

      if (!key || value === undefined) {
        res.status(400).json({ error: 'Key and value are required' });
        return;
      }

      await this.payoutService.updatePayoutSetting(key, value);

      res.status(200).json({
        success: true,
        message: 'Payout setting updated successfully',
      });
    } catch (error) {
      console.error('Update payout setting error:', error);
      res.status(500).json({ 
        error: 'Failed to update payout setting',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get audit log for payout request (Admin only)
   */
  getPayoutAuditLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;

      if (!requestId) {
        res.status(400).json({ error: 'Request ID is required' });
        return;
      }

      const auditLog = await this.payoutService.getPayoutAuditLog(requestId);

      res.status(200).json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      console.error('Get payout audit log error:', error);
      res.status(500).json({ 
        error: 'Failed to get audit log',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
