import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebhookService } from '../../services/WebhookService';

/**
 * WebhookController - Handles Custodii webhooks
 * 
 * CRITICAL RULES:
 * - Thin controller (100% delegation)
 * - NO business logic
 * - Extract signature from header
 * - Delegate to WebhookService
 * - Return appropriate HTTP status
 */
export class WebhookController {
  private webhookService: WebhookService;

  constructor(prisma: PrismaClient) {
    this.webhookService = new WebhookService(prisma);
  }

  /**
   * POST /api/v1/webhooks/custodii
   * Handle webhook from Custodii
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Extract signature from header
      const signature = req.headers['x-custodii-signature'] as string;

      if (!signature) {
        res.status(401).json({
          error: 'Missing signature'
        });
        return;
      }

      // Extract payload
      const payload = req.body;

      // Delegate to service
      const result = await this.webhookService.processWebhook(payload, signature);

      // Return result
      if (result.success) {
        res.status(200).json({
          message: result.message
        });
      } else {
        res.status(400).json({
          error: result.message
        });
      }

    } catch (error) {
      console.error('[WebhookController] Error handling webhook', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}
