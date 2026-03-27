/**
 * Stripe Connect Controller
 */

import { Request, Response } from 'express';
import { StripeConnectService } from '../services/stripe-connect.service';
import { logger } from '../utils/logger';

const service = new StripeConnectService();

export class StripeConnectController {
  /**
   * POST /connect/onboard
   * Create connected account and start onboarding
   */
  async onboard(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { email, accountType = 'standard' } = req.body;
      const origin = `${req.protocol}://${req.get('host')}`;

      // Create connected account
      const account = await service.createConnectedAccount(userId, email, accountType);

      // Create onboarding link
      const accountLink = await service.createAccountLink(
        userId,
        `${origin}/connect/onboard/refresh`,
        `${origin}/connect/onboard/success`,
      );

      res.json({
        success: true,
        data: {
          accountId: account.stripeAccountId,
          onboardingUrl: accountLink.url,
        },
      });
    } catch (error: any) {
      logger.error('Onboard error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /connect/onboard/refresh
   * Refresh onboarding link
   */
  async refreshOnboarding(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.redirect('/login');
      }

      const origin = `${req.protocol}://${req.get('host')}`;

      const accountLink = await service.createAccountLink(
        userId,
        `${origin}/connect/onboard/refresh`,
        `${origin}/connect/onboard/success`,
      );

      res.redirect(303, accountLink.url);
    } catch (error: any) {
      logger.error('Refresh onboarding error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /connect/status
   * Get connected account status
   */
  async getStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const status = await service.getAccountStatus(userId);

      if (!status) {
        return res.json({
          success: true,
          data: { connected: false },
        });
      }

      res.json({
        success: true,
        data: {
          connected: true,
          detailsSubmitted: status.detailsSubmitted,
          chargesEnabled: status.chargesEnabled,
          payoutsEnabled: status.payoutsEnabled,
          onboardingStatus: status.onboardingStatus,
          requirements: status.requirements,
        },
      });
    } catch (error: any) {
      logger.error('Get status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /connect/transfer
   * Create transfer to connected account
   */
  async createTransfer(req: Request, res: Response) {
    try {
      const { userId, amount, currency, description, sourceTransaction } = req.body;

      const transfer = await service.createTransfer(
        userId,
        amount,
        currency,
        description,
        sourceTransaction,
      );

      res.json({
        success: true,
        data: transfer,
      });
    } catch (error: any) {
      logger.error('Create transfer error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /connect/balance
   * Get account balance
   */
  async getBalance(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const balance = await service.getAccountBalance(userId);

      res.json({
        success: true,
        data: balance,
      });
    } catch (error: any) {
      logger.error('Get balance error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /connect/payouts
   * List payouts
   */
  async listPayouts(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const payouts = await service.listPayouts(userId, limit);

      res.json({
        success: true,
        data: payouts,
      });
    } catch (error: any) {
      logger.error('List payouts error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /connect/dashboard
   * Get Stripe dashboard login link
   */
  async getDashboardLink(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const loginLink = await service.createLoginLink(userId);

      res.json({
        success: true,
        data: {
          url: loginLink.url,
        },
      });
    } catch (error: any) {
      logger.error('Get dashboard link error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
