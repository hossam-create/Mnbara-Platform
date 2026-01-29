import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { SettlementCoordinatorService } from '../services/settlement-coordinator.service';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Controller for Settlement endpoints
 */
export class SettlementController {
  private settlementCoordinatorService: SettlementCoordinatorService;

  constructor() {
    this.settlementCoordinatorService = new SettlementCoordinatorService(prisma);
  }

  /**
   * GET /api/v1/exchange/settlements/:id
   * Get settlement details
   */
  getSettlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const settlement = await prisma.settlement.findUnique({
        where: { id },
        include: {
          match: {
            include: {
              sellerRequest: true,
              buyerRequest: true,
            },
          },
        },
      });

      if (!settlement) {
        res.status(404).json({ error: 'Settlement not found' });
        return;
      }

      // Check if user is part of this settlement
      if (
        settlement.match.sellerId !== userId &&
        settlement.match.buyerId !== userId &&
        !req.user?.isAdmin
      ) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.status(200).json({ settlement });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/exchange/webhooks/psp/:provider
   * Handle PSP webhook
   */
  handlePSPWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { provider } = req.params;
      const { signature, timestamp, ...payload } = req.body;

      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(provider, payload, signature, timestamp);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      // Process webhook based on provider
      switch (provider) {
        case 'stripe':
          await this.handleStripeWebhook(payload);
          break;
        case 'paypal':
          await this.handlePayPalWebhook(payload);
          break;
        case 'wise':
          await this.handleWiseWebhook(payload);
          break;
        default:
          res.status(400).json({ error: 'Unknown provider' });
          return;
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/exchange/webhooks/escrow/:provider
   * Handle escrow provider webhook
   */
  handleEscrowWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { provider } = req.params;
      const { signature, timestamp, ...payload } = req.body;

      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(provider, payload, signature, timestamp);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      // Process webhook based on provider
      switch (provider) {
        case 'tatum':
          await this.handleTatumWebhook(payload);
          break;
        case 'coinbase':
          await this.handleCoinbaseWebhook(payload);
          break;
        default:
          res.status(400).json({ error: 'Unknown provider' });
          return;
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(
    provider: string,
    payload: any,
    signature: string,
    timestamp: string
  ): boolean {
    // Get webhook secret from environment
    const secret = process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`];
    if (!secret) {
      return false;
    }

    // Create signature
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Handle Stripe webhook
   */
  private async handleStripeWebhook(payload: any): Promise<void> {
    const { type, data } = payload;

    switch (type) {
      case 'payment_intent.succeeded':
        // Update settlement status
        const matchId = data.object.metadata?.matchId;
        if (matchId) {
          await this.settlementCoordinatorService.processInternalSettlement(matchId);
        }
        break;
      case 'payment_intent.payment_failed':
        // Handle payment failure
        const failedMatchId = data.object.metadata?.matchId;
        if (failedMatchId) {
          await this.settlementCoordinatorService.failSettlement(failedMatchId);
        }
        break;
    }
  }

  /**
   * Handle PayPal webhook
   */
  private async handlePayPalWebhook(payload: any): Promise<void> {
    const { event_type, resource } = payload;

    switch (event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Update settlement status
        const matchId = resource.supplementary_data?.related_ids?.order_id;
        if (matchId) {
          await this.settlementCoordinatorService.processInternalSettlement(matchId);
        }
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        // Handle payment failure
        const failedMatchId = resource.supplementary_data?.related_ids?.order_id;
        if (failedMatchId) {
          await this.settlementCoordinatorService.failSettlement(failedMatchId);
        }
        break;
    }
  }

  /**
   * Handle Wise webhook
   */
  private async handleWiseWebhook(payload: any): Promise<void> {
    const { event, data } = payload;

    switch (event) {
      case 'transfer:completed':
        // Update settlement status
        const matchId = data.resource?.metadata?.matchId;
        if (matchId) {
          await this.settlementCoordinatorService.processInternalSettlement(matchId);
        }
        break;
      case 'transfer:failed':
        // Handle transfer failure
        const failedMatchId = data.resource?.metadata?.matchId;
        if (failedMatchId) {
          await this.settlementCoordinatorService.failSettlement(failedMatchId);
        }
        break;
    }
  }

  /**
   * Handle Tatum webhook
   */
  private async handleTatumWebhook(payload: any): Promise<void> {
    const { type, data } = payload;

    switch (type) {
      case 'ESCROW_RELEASED':
        // Update settlement status
        const matchId = data.escrowId;
        if (matchId) {
          await this.settlementCoordinatorService.processExternalSettlement(matchId);
        }
        break;
      case 'ESCROW_FAILED':
        // Handle escrow failure
        const failedMatchId = data.escrowId;
        if (failedMatchId) {
          await this.settlementCoordinatorService.failSettlement(failedMatchId);
        }
        break;
    }
  }

  /**
   * Handle Coinbase webhook
   */
  private async handleCoinbaseWebhook(payload: any): Promise<void> {
    const { type, data } = payload;

    switch (type) {
      case 'charge:confirmed':
        // Update settlement status
        const matchId = data.metadata?.matchId;
        if (matchId) {
          await this.settlementCoordinatorService.processExternalSettlement(matchId);
        }
        break;
      case 'charge:failed':
        // Handle charge failure
        const failedMatchId = data.metadata?.matchId;
        if (failedMatchId) {
          await this.settlementCoordinatorService.failSettlement(failedMatchId);
        }
        break;
    }
  }
}
