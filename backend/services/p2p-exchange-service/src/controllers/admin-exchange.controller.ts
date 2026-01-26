import { Request, Response, NextFunction } from 'express';
import { ExchangeRequestService } from '../services/exchange-request.service';
import { ProofOfPaymentService } from '../services/proof-of-payment.service';
import { SettlementCoordinatorService } from '../services/settlement-coordinator.service';
import { SecurityDepositService } from '../services/security-deposit.service';
import { PrismaClient } from '@prisma/client';
import { FileStorageService } from '../services/storage/FileStorageService';

const prisma = new PrismaClient();

/**
 * Controller for Admin Exchange endpoints
 */
export class AdminExchangeController {
  private exchangeRequestService: ExchangeRequestService;
  private proofOfPaymentService: ProofOfPaymentService;
  private settlementCoordinatorService: SettlementCoordinatorService;
  private securityDepositService: SecurityDepositService;

  constructor() {
    this.exchangeRequestService = new ExchangeRequestService(prisma);
    this.settlementCoordinatorService = new SettlementCoordinatorService(prisma);
    this.securityDepositService = new SecurityDepositService(prisma);
    
    // Initialize storage service (use local storage for now)
    const storageService = new FileStorageService();
    this.proofOfPaymentService = new ProofOfPaymentService(prisma, storageService);
  }

  /**
   * GET /api/v1/admin/exchange/requests
   * Get all exchange requests (admin)
   */
  getAllRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, page = 1, limit = 50 } = req.query;

      const requests = await prisma.exchangeRequest.findMany({
        where: status ? { status: status as string } : undefined,
        include: {
          matches: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      const total = await prisma.exchangeRequest.count({
        where: status ? { status: status as string } : undefined,
      });

      res.status(200).json({
        requests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/exchange/proofs/pending
   * Get pending proofs for review (admin)
   */
  getPendingProofs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const proofs = await this.proofOfPaymentService.getPendingProofs(100);

      res.status(200).json({ proofs });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/exchange/proofs/:id/verify
   * Verify proof of payment (admin)
   */
  verifyProof = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      const { approved, rejectionReason } = req.body;

      if (!adminId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const proof = await this.proofOfPaymentService.verifyProof({
        proofId: parseInt(id, 10),
        adminId,
        approved,
        rejectionReason,
      });

      res.status(200).json({
        message: approved ? 'Proof verified successfully' : 'Proof rejected',
        proof,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/exchange/settlements/:id/retry
   * Retry failed settlement (admin)
   */
  retrySettlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await this.settlementCoordinatorService.retrySettlement(parseInt(id, 10));

      res.status(200).json({
        message: 'Settlement retry initiated',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/exchange/security-deposit/:userId/freeze
   * Freeze user's security deposit (admin)
   */
  freezeSecurityDeposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { amount, reason } = req.body;

      const deposit = await this.securityDepositService.freezeDeposit(
        parseInt(userId, 10),
        parseFloat(amount),
        reason
      );

      res.status(200).json({
        message: 'Security deposit frozen successfully',
        deposit,
      });
    } catch (error) {
      next(error);
    }
  };
}
