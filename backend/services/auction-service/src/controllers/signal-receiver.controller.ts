/**
 * Signal Receiver Controller
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * Handles POST /api/v1/signals endpoint
 * Receives frontend signals and converts to backend events
 */

import { Request, Response } from 'express';
import { SignalReceiverService, SignalPayload } from '../services/signal-receiver.service';

/**
 * Signal Receiver Controller
 */
export class SignalReceiverController {
  constructor(private signalReceiverService: SignalReceiverService) {}

  /**
   * POST /api/v1/signals
   * Receive signal from frontend
   * 
   * RULES:
   * - Accept signal payload
   * - Extract user context (IP, user agent, user ID)
   * - Pass to SignalReceiverService
   * - Return 202 Accepted (fire-and-forget)
   * - Never fail the request (frontend is fire-and-forget)
   */
  async receiveSignal(req: Request, res: Response): Promise<void> {
    try {
      // Extract payload
      const payload: SignalPayload = req.body;

      // Extract context
      const userId = (req as any).user?.id || (req as any).userId;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Process signal
      const result = await this.signalReceiverService.receiveSignal(payload, {
        userId,
        ipAddress,
        userAgent,
      });

      // Always return 202 Accepted (fire-and-forget)
      // Frontend doesn't wait for response
      res.status(202).json({
        accepted: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Even on error, return 202 (fire-and-forget)
      // Frontend doesn't care about errors
      console.error('[SIGNAL_RECEIVER_CONTROLLER_ERROR]', error);
      res.status(202).json({
        accepted: true,
        message: 'Signal received',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default SignalReceiverController;
