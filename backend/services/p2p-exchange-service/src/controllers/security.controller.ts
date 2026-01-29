import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { SecurityDepositService } from '../services/security-deposit.service';
import { TrustLevelService } from '../services/trust-level.service';
import { ExternalEscrowService } from '../services/external-escrow.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for Security & Trust endpoints
 */
export class SecurityController {
  private securityDepositService: SecurityDepositService;
  private trustLevelService: TrustLevelService;
  private externalEscrowService: ExternalEscrowService;

  constructor() {
    this.securityDepositService = new SecurityDepositService(prisma);
    this.trustLevelService = new TrustLevelService(prisma);
    this.externalEscrowService = new ExternalEscrowService(prisma);
  }

  /**
   * GET /api/v1/exchange/security-deposit
   * Get security deposit info
   */
  getSecurityDeposit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const deposit = await this.securityDepositService.getDeposit(userId);

      if (!deposit) {
        res.status(404).json({ error: 'Security deposit not found' });
        return;
      }

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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user?.id;
      const { amount, currency } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }

      // Add to deposit
      const deposit = await this.securityDepositService.addToDeposit(userId, amount, currency);

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
   * Get trust level
   */
  getTrustLevel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const trustLevel = await this.trustLevelService.getTrustLevel(userId);

      if (!trustLevel) {
        res.status(404).json({ error: 'Trust level not found' });
        return;
      }

      res.status(200).json({ trustLevel });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/exchange/external-escrow-providers
   * Get available external escrow providers
   */
  getEscrowProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const providers = await this.externalEscrowService.getAvailableProviders();

      res.status(200).json({
        providers,
        count: providers.length,
      });
    } catch (error) {
      next(error);
    }
  };
}
