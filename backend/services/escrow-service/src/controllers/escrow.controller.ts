// Escrow Controller

import { Request, Response } from 'express';
import { EscrowService } from '../services/escrow.service';
import { logger } from '../utils/logger';

export class EscrowController {
  private service: EscrowService;

  constructor() {
    this.service = new EscrowService();
  }

  /**
   * POST /api/v1/escrow
   * Create new escrow transaction
   */
  async createEscrow(req: Request, res: Response): Promise<void> {
    try {
      const escrow = await this.service.createTransaction(req.body);
      res.status(201).json({
        success: true,
        data: escrow
      });
    } catch (error) {
      logger.error('Error creating escrow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/v1/escrow/:id/signature
   * Add signature to escrow
   */
  async addSignature(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.service.addSignature(id, req.body);
      res.json({
        success: true,
        message: 'Signature added successfully'
      });
    } catch (error) {
      logger.error('Error adding signature:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/v1/escrow/:id/lock
   * Lock escrow transaction
   */
  async lockTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { buyerId } = req.body;
      await this.service.lockTransaction(id, buyerId, req.body);
      res.json({
        success: true,
        message: 'Transaction locked successfully'
      });
    } catch (error) {
      logger.error('Error locking transaction:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/v1/escrow/:id/release
   * Release funds to seller
   */
  async releaseTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { buyerId } = req.body;
      await this.service.releaseTransaction(id, buyerId);
      res.json({
        success: true,
        message: 'Funds released successfully'
      });
    } catch (error) {
      logger.error('Error releasing funds:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/v1/escrow/:id/dispute
   * Initiate dispute
   */
  async initiateDispute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.service.initiateDispute(id, req.body);
      res.json({
        success: true,
        message: 'Dispute initiated successfully'
      });
    } catch (error) {
      logger.error('Error initiating dispute:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/v1/escrow/:id/resolve
   * Resolve dispute
   */
  async resolveDispute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.service.resolveDispute(id, req.body);
      res.json({
        success: true,
        message: 'Dispute resolved successfully'
      });
    } catch (error) {
      logger.error('Error resolving dispute:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/v1/escrow/:id
   * Get escrow by ID
   */
  async getEscrow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const escrow = await this.service.getEscrowById(id);
      
      if (!escrow) {
        res.status(404).json({
          success: false,
          error: 'Escrow not found'
        });
        return;
      }

      res.json({
        success: true,
        data: escrow
      });
    } catch (error) {
      logger.error('Error getting escrow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/v1/escrow/:id/status
   * Get escrow status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const status = await this.service.getTransactionStatus(id);
      res.json({
        success: true,
        data: { status }
      });
    } catch (error) {
      logger.error('Error getting status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/v1/escrow/health
   * Health check
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    res.json({
      status: 'healthy',
      service: 'escrow-service',
      timestamp: new Date().toISOString()
    });
  }
}
