import { Request, Response, NextFunction } from 'express';
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
      const { id } = req.params;
      const userId = req.user?.id;

      // Get settlement
      const settlement = await this.settlementCoordinatorService.getSettlement(parseInt(id, 10));

      if (!settlement) {
        res.status(404).json({ error: 'Settlement not found' });
        return;
      }

      // Get match to verify user access
      const match = await prisma.exchangeMatch.findUnique({
        where: { id: settlement.matchId },
        include: { request: true },
      });

      if (!match) {
        res.status(404).json({ error: 'Match not found' });
        return;
      }

      // Check if user is part of this settlement
      if (match.request.userId !== userId && match.acceptorId !== userId && !req.user?.isAdmin) {
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
      const payload = req.body;

      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(provider, req);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      // Process webhook
      await this.settlementCoordinatorService.handlePSPWebhook(provider, payload);

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/exchange/webhooks/escrow/:provider
   * Handle external escrow webhook
   */
  handleEscrowWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { provider } = req.params;
      const payload = req.body;

      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(provider, req);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      // Map escrow webhook to PSP webhook format
      const pspPayload = {
        transactionId: payload.escrowId,
        status: payload.status,
        metadata: payload.metadata,
      };

      // Process webhook
      await this.settlementCoordinatorService.handlePSPWebhook(provider, pspPayload);

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(provider: string, req: Request): boolean {
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;

    if (!signature || !timestamp) {
      return false;
    }

    // Get webhook secret for provider
    const secret = this.getWebhookSecret(provider);
    if (!secret) {
      console.warn(`No webhook secret configured for provider: ${provider}`);
      return false;
    }

    // Verify timestamp (prevent replay attacks)
    const now = Date.now();
    const webhookTime = parseInt(timestamp, 10);
    const timeDiff = Math.abs(now - webhookTime);
    
    // Reject if timestamp is more than 5 minutes old
    if (timeDiff > 5 * 60 * 1000) {
      console.warn(`Webhook timestamp too old: ${timeDiff}ms`);
      return false;
    }

    // Compute expected signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    // Compare signatures (constant-time comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get webhook secret for provider
   */
  private getWebhookSecret(provider: string): string | null {
    const secrets: Record<string, string> = {
      stripe: process.env.STRIPE_WEBHOOK_SECRET || '',
      tatum: process.env.TATUM_WEBHOOK_SECRET || '',
      // Add more providers as needed
    };

    return secrets[provider] || null;
  }
}
