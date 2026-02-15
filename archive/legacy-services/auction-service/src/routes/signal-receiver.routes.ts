/**
 * Signal Receiver Routes
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * Endpoint: POST /api/v1/signals
 * Receives frontend signals and converts to backend events
 */

import { Router, Request, Response } from 'express';
import { SignalReceiverController } from '../controllers/signal-receiver.controller';
import { SignalReceiverService } from '../services/signal-receiver.service';
import { EventLoggerService } from '../services/event-logger.service';
import { getPrismaClient } from '../lib/prisma';

/**
 * Create signal receiver routes
 */
export function createSignalReceiverRoutes(): Router {
  const router = Router();

  // Initialize services
  const prisma = getPrismaClient();
  const eventLoggerService = new EventLoggerService(prisma);
  const signalReceiverService = new SignalReceiverService(eventLoggerService);
  const controller = new SignalReceiverController(signalReceiverService);

  /**
   * POST /api/v1/signals
   * Receive signal from frontend
   * 
   * Request body:
   * {
   *   "signal_type": "SEARCH_PERFORMED" | "PRODUCT_VIEWED" | ... (9 types)
   *   "target_id": "optional-id",
   *   "context": { optional context data }
   * }
   * 
   * Response: 202 Accepted (fire-and-forget)
   * {
   *   "accepted": true,
   *   "message": "Signal received",
   *   "timestamp": "2026-01-16T..."
   * }
   */
  router.post('/', (req: Request, res: Response) => {
    controller.receiveSignal(req, res);
  });

  /**
   * Health check for signal receiver
   */
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'signal-receiver',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

export default createSignalReceiverRoutes();
