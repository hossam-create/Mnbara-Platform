import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ProofOfPaymentService } from '../services/proof-of-payment.service';
import { SettlementCoordinatorService } from '../services/settlement-coordinator.service';
import { SecurityDepositService } from '../services/security-deposit.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for Admin Exchange endpoints
 */
export class AdminExchangeController {
  private proofOfPaymentService: ProofOfPaymentService;
  private settlementCoordinatorService: SettlementCoordinatorService;
  private securityDepositService: SecurityDepositService;

  constructor() {
    this.proofOfPaymentService = new ProofOfPaymentService(prisma);
    this.settlementCoordinatorService = new SettlementCoordinatorService(prisma);
    this.securityDepositService = new SecurityDepositService(prisma);
  }

  /**
   * GET /api/v1/admin/exchange/requests
   * Get all exchange requests
   */
  listRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { status, page = '1', limit = '50' } = req.query;

      // Get all requests
      let requests = await prisma.exchangeRequest.findMany({
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      });

      // Filter by status if provided
      if (status) {
        requests = requests.filter(r => r.status === status);
      }

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
   * GET /api/v1/admin/exchange/proofs/pending
   * Get pending proofs for verification
   */
  getPendingProofs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { page = '1', limit = '50' } = req.query;

      // Get pending proofs
      const proofs = await prisma.proofOfPayment.findMany({
        where: { status: 'PENDING' },
        include: {
          match: {
            include: {
              sellerRequest: true,
              buyerRequest: true,
            },
          },
        },
      });

      // Apply pagination
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;

      const paginatedProofs = proofs.slice(startIndex, endIndex);

      res.status(200).json({
        proofs: paginatedProofs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: proofs.length,
          totalPages: Math.ceil(proofs.length / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/exchange/proofs/:id/verify
   * Verify a proof of payment
   */
  verifyProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { verified, notes } = req.body;

      // Get proof
      const proof = await prisma.proofOfPayment.findUnique({
        where: { id },
      });

      if (!proof) {
        res.status(404).json({ error: 'Proof not found' });
        return;
      }

      // Verify proof
      const verifiedProof = await this.proofOfPaymentService.verifyProof(
        id,
        verified,
        notes
      );

      res.status(200).json({
        message: 'Proof verified successfully',
        proof: verifiedProof,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/exchange/settlements/:id/retry
   * Retry a failed settlement
   */
  retrySettlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;

      // Get settlement
      const settlement = await prisma.settlement.findUnique({
        where: { id },
      });

      if (!settlement) {
        res.status(404).json({ error: 'Settlement not found' });
        return;
      }

      if (settlement.status !== 'FAILED') {
        res.status(400).json({
          error: 'Invalid settlement status',
          message: 'Only FAILED settlements can be retried',
        });
        return;
      }

      // Retry settlement
      const retriedSettlement = await this.settlementCoordinatorService.retrySettlement(id);

      res.status(200).json({
        message: 'Settlement retry initiated',
        settlement: retriedSettlement,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/exchange/security-deposit/:userId/freeze
   * Freeze a user's security deposit
   */
  freezeSecurityDeposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { userId } = req.params;
      const { amount, reason } = req.body;

      if (amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }

      // Get deposit
      const deposit = await this.securityDepositService.getDeposit(userId);

      if (!deposit) {
        res.status(404).json({ error: 'Security deposit not found' });
        return;
      }

      if (deposit.amount - deposit.frozenAmount < amount) {
        res.status(400).json({
          error: 'Insufficient available balance',
          message: `Available balance: ${deposit.amount - deposit.frozenAmount}`,
        });
        return;
      }

      // Freeze deposit
      const frozenDeposit = await this.securityDepositService.freezeDeposit(userId, amount);

      // Log admin action
      await prisma.adminLog.create({
        data: {
          adminId: req.user?.id || 'unknown',
          action: 'FREEZE_SECURITY_DEPOSIT',
          targetUserId: userId,
          details: {
            amount,
            reason,
          },
        },
      });

      res.status(200).json({
        message: 'Security deposit frozen successfully',
        deposit: frozenDeposit,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/exchange/security-deposit/:userId/unfreeze
   * Unfreeze a user's security deposit
   */
  unfreezeSecurityDeposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { userId } = req.params;
      const { amount, reason } = req.body;

      if (amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }

      // Get deposit
      const deposit = await this.securityDepositService.getDeposit(userId);

      if (!deposit) {
        res.status(404).json({ error: 'Security deposit not found' });
        return;
      }

      if (deposit.frozenAmount < amount) {
        res.status(400).json({
          error: 'Insufficient frozen balance',
          message: `Frozen balance: ${deposit.frozenAmount}`,
        });
        return;
      }

      // Unfreeze deposit
      const unfrozenDeposit = await this.securityDepositService.unfreezeDeposit(userId, amount);

      // Log admin action
      await prisma.adminLog.create({
        data: {
          adminId: req.user?.id || 'unknown',
          action: 'UNFREEZE_SECURITY_DEPOSIT',
          targetUserId: userId,
          details: {
            amount,
            reason,
          },
        },
      });

      res.status(200).json({
        message: 'Security deposit unfrozen successfully',
        deposit: unfrozenDeposit,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/exchange/statistics
   * Get exchange statistics
   */
  getStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { period = '24h' } = req.query;

      // Calculate time range
      const now = new Date();
      let startTime = new Date();

      switch (period) {
        case '24h':
          startTime.setHours(startTime.getHours() - 24);
          break;
        case '7d':
          startTime.setDate(startTime.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(startTime.getDate() - 30);
          break;
        default:
          startTime.setHours(startTime.getHours() - 24);
      }

      // Get statistics
      const totalRequests = await prisma.exchangeRequest.count({
        where: {
          createdAt: { gte: startTime },
        },
      });

      const totalMatches = await prisma.exchangeMatch.count({
        where: {
          createdAt: { gte: startTime },
        },
      });

      const completedMatches = await prisma.exchangeMatch.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startTime },
        },
      });

      const failedMatches = await prisma.exchangeMatch.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: startTime },
        },
      });

      const totalVolume = await prisma.exchangeMatch.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startTime },
        },
        _sum: {
          sellerAmount: true,
        },
      });

      res.status(200).json({
        period,
        statistics: {
          totalRequests,
          totalMatches,
          completedMatches,
          failedMatches,
          successRate: totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0,
          totalVolume: totalVolume._sum.sellerAmount || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
