import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ExchangeRequestService } from '../services/exchange-request.service';
import { SecurityDepositService } from '../services/security-deposit.service';
import { TrustLevelService } from '../services/trust-level.service';
import { FeeCalculationService } from '../services/fee-calculation.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for Exchange Request endpoints
 */
export class ExchangeRequestController {
  private exchangeRequestService: ExchangeRequestService;
  private securityDepositService: SecurityDepositService;
  private trustLevelService: TrustLevelService;
  private feeCalculationService: FeeCalculationService;

  constructor() {
    this.exchangeRequestService = new ExchangeRequestService(prisma);
    this.securityDepositService = new SecurityDepositService(prisma);
    this.trustLevelService = new TrustLevelService(prisma);
    this.feeCalculationService = new FeeCalculationService();
  }

  /**
   * POST /api/v1/exchange/requests
   * Create a new exchange request
   */
  createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user?.id; // Assuming auth middleware sets req.user
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        rate,
        expiresAt,
        preferredSettlement,
      } = req.body;

      // Check security deposit
      const hasDeposit = await this.securityDepositService.hasSufficientDeposit(
        userId,
        fromAmount
      );
      if (!hasDeposit) {
        res.status(400).json({
          error: 'Insufficient security deposit',
          message: 'You need at least 10% of the transaction amount as security deposit',
        });
        return;
      }

      // Check trust level
      const canPerform = await this.trustLevelService.canPerformExchange(
        userId,
        fromAmount
      );
      if (!canPerform) {
        res.status(400).json({
          error: 'Transaction exceeds trust level limit',
          message: 'Your current trust level does not allow this transaction amount',
        });
        return;
      }

      // Calculate fees
      const fees = this.feeCalculationService.calculateFees(fromAmount, fromCurrency);

      // Create request
      const request = await this.exchangeRequestService.createRequest({
        userId,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        rate,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        preferredSettlement,
      });

      res.status(201).json({
        request,
        fees,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/exchange/requests/:id
   * Get a single exchange request
   */
  getRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = req.user?.id;

      const request = await this.exchangeRequestService.getRequest(id);

      if (!request) {
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      // Check if user has permission to view this request
      if (request.userId !== userId && !req.user?.isAdmin) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.status(200).json({ request });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/exchange/requests
   * Get user's exchange requests
   */
  getUserRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { status, page = '1', limit = '20' } = req.query;

      const requests = await this.exchangeRequestService.getUserRequests(
        userId,
        status as string | undefined
      );

      // Apply pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      const paginatedRequests = requests.slice(startIndex, endIndex);

      res.status(200).json({
        requests: paginatedRequests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: requests.length,
          totalPages: Math.ceil(requests.length / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/exchange/requests/:id
   * Cancel an exchange request
   */
  cancelRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get request to check ownership
      const request = await this.exchangeRequestService.getRequest(id);

      if (!request) {
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      if (request.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      if (request.status !== 'OPEN') {
        res.status(400).json({
          error: 'Cannot cancel request',
          message: 'Only OPEN requests can be cancelled',
        });
        return;
      }

      // Cancel request
      const cancelledRequest = await this.exchangeRequestService.cancelRequest(id);

      res.status(200).json({
        message: 'Request cancelled successfully',
        request: cancelledRequest,
      });
    } catch (error) {
      next(error);
    }
  };
}
