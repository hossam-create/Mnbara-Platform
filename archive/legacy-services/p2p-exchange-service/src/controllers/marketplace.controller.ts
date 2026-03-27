import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ExchangeRequestService } from '../services/exchange-request.service';
import { MatchingEngineService } from '../services/matching-engine.service';
import { SecurityDepositService } from '../services/security-deposit.service';
import { TrustLevelService } from '../services/trust-level.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for Marketplace endpoints
 */
export class MarketplaceController {
  private exchangeRequestService: ExchangeRequestService;
  private matchingEngineService: MatchingEngineService;
  private securityDepositService: SecurityDepositService;
  private trustLevelService: TrustLevelService;

  constructor() {
    this.exchangeRequestService = new ExchangeRequestService(prisma);
    this.matchingEngineService = new MatchingEngineService(prisma);
    this.securityDepositService = new SecurityDepositService(prisma);
    this.trustLevelService = new TrustLevelService(prisma);
  }

  /**
   * GET /api/v1/exchange/marketplace
   * Browse open exchange requests
   */
  browseMarketplace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        fromCurrency,
        toCurrency,
        minAmount,
        maxAmount,
        minTrustLevel,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = '1',
        limit = '20',
      } = req.query;

      // Get open requests
      let requests = await this.exchangeRequestService.getOpenRequests();

      // Apply filters
      if (fromCurrency) {
        requests = requests.filter(r => r.fromCurrency === fromCurrency);
      }
      if (toCurrency) {
        requests = requests.filter(r => r.toCurrency === toCurrency);
      }
      if (minAmount) {
        requests = requests.filter(r => r.fromAmount >= parseFloat(minAmount as string));
      }
      if (maxAmount) {
        requests = requests.filter(r => r.fromAmount <= parseFloat(maxAmount as string));
      }

      // TODO: Filter by trust level (requires joining with TrustLevel table)
      // For now, we'll skip this filter

      // Apply sorting
      requests.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'rate':
            comparison = a.rate - b.rate;
            break;
          case 'amount':
            comparison = a.fromAmount - b.fromAmount;
            break;
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          // reputation sorting would require additional data
          default:
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });

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
        filters: {
          fromCurrency,
          toCurrency,
          minAmount,
          maxAmount,
          minTrustLevel,
        },
        sorting: {
          sortBy,
          sortOrder,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/exchange/marketplace/:requestId/accept
   * Accept an exchange offer
   */
  acceptOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { requestId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get the request
      const request = await this.exchangeRequestService.getRequest(requestId);

      if (!request) {
        res.status(404).json({ error: 'Request not found' });
        return;
      }

      if (request.status !== 'OPEN') {
        res.status(400).json({
          error: 'Request not available',
          message: 'This request is no longer open',
        });
        return;
      }

      if (request.userId === userId) {
        res.status(400).json({
          error: 'Cannot accept own request',
          message: 'You cannot accept your own exchange request',
        });
        return;
      }

      // Check security deposit
      const hasDeposit = await this.securityDepositService.hasSufficientDeposit(
        userId,
        request.toAmount
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
        request.toAmount
      );
      if (!canPerform) {
        res.status(400).json({
          error: 'Transaction exceeds trust level limit',
          message: 'Your current trust level does not allow this transaction amount',
        });
        return;
      }

      // Create match using manual accept
      const match = await this.matchingEngineService.manualAccept(requestId, userId);

      res.status(201).json({
        message: 'Offer accepted successfully',
        match,
      });
    } catch (error) {
      next(error);
    }
  };
}
