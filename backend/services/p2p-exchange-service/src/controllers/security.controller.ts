import { Request, Response, NextFunction } from 'express';
import { SecurityDepositService } from '../services/security-deposit.service';
import { TrustLevelService } from '../services/trust-level.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for Security & Trust endpoints
 */
export class SecurityController {
  private securityDepositService: SecurityDepositService;
  private trustLevelService: TrustLevelService;

  constructor() {
    this.securityDepositService = new SecurityDepositService(prisma);
    this.trustLevelService = new TrustLevelService(prisma);
  }

  /**
   * GET /api/v1/exchange/security-deposit
   * Get user's security deposit
   */
  getSecurityDeposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const deposit = await this.securityDepositService.getDeposit(userId);

      res.status(200).json({ deposit });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/exchange/security-deposit/add
   * Add to security deposit
   */
  addToSecurityDeposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { amount, currency } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Add to deposit
      const deposit = await this.securityDepositService.addToDeposit(
        userId,
        parseFloat(amount),
        currency
      );

      res.status(200).json({
        message: 'Security deposit added successfully',
        deposit,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/exchange/trust-level
   * Get user's trust level
   */
  getTrustLevel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const trustLevel = await this.trustLevelService.getTrustLevel(userId);

      res.status(200).json({ trustLevel });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/exchange/external-escrow-providers
   * Get available external escrow providers
   */
  getExternalEscrowProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get available providers from database
      const providers = await prisma.externalEscrowProvider.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({ providers });
    } catch (error) {
      next(error);
    }
  };
}
