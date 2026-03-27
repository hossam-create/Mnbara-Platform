import { Request, Response } from 'express';
import { paymentProcessingService } from '../services/payment-processing.service';

export const webhookController = {
  /**
   * Handle incoming webhooks from payment gateways
   * POST /api/v2/webhooks/:gateway
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const { gateway } = req.params;

    try {
      // Construct the WebhookEventRequest expected by the adapter
      const webhookReq = {
        headers: req.headers,
        body: req.body,
        // (req as any).rawBody is set by express.json verify callback in index.ts
        rawBody: (req as any).rawBody || Buffer.alloc(0), 
      };

      if (!webhookReq.rawBody.length && Object.keys(webhookReq.body).length > 0) {
        // Warning: Raw body missing but parsed body exists. Signature verification might fail.
        console.warn(`[Webhook:${gateway}] Raw body missing. Ensure express.json verify hook is working.`);
      }

      console.log(`[Webhook:${gateway}] Received event. Processing...`);

      const result = await paymentProcessingService.processWebhook(gateway, webhookReq);

      // Return 200 OK to acknowledge receipt
      res.status(200).json(result);

    } catch (error: any) {
      console.error(`[Webhook:${gateway}] Processing Failed:`, error.message);

      // Distinguish between client errors (Signature) and server errors (DB, Logic)
      if (error.message.includes('Signature')) {
        // Do not retry invalid signatures
        res.status(400).json({ success: false, error: 'Invalid Signature' });
      } else if (error.message.includes('Missing walletId')) {
         // Logic error, do not retry
         res.status(400).json({ success: false, error: error.message });
      } else {
        // Retry for transient errors
        res.status(500).json({ success: false, error: 'Internal Error' });
      }
    }
  }
};
