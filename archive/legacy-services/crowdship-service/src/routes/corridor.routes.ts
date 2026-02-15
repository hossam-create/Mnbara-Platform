/**
 * Corridor Advisory Routes
 * Sprint 2: Trust-First Market Activation (US → MENA)
 * 
 * CONSTRAINTS:
 * - NO payments, NO escrow execution, NO auto-matching
 * - Advisory only, deterministic, feature-flagged
 * - Human confirmation required
 */

import { Router, Request, Response } from 'express';
import { CorridorAdvisoryService, CorridorSnapshot } from '../services/corridor-advisory.service';
import { AICoreIntegrationService } from '../services/ai-core-integration.service';
import { getFeatureFlags } from '../config/feature-flags';

const router = Router();

// In-memory confirmation log (production: use persistent storage)
const confirmationLog: Map<string, { checkpointId: string; confirmed: boolean; timestamp: string; userId?: string }> = new Map();

/**
 * POST /corridor/advisory
 * Get corridor assessment for cross-border transaction
 */
router.post('/advisory', async (req: Request, res: Response) => {
  try {
    const flags = getFeatureFlags();
    if (!flags.CORRIDOR_AI_ADVISORY || !flags.AI_CORE_ENABLED) {
      return res.json({
        data: null,
        message: 'Corridor advisory feature is disabled',
        meta: { advisory: true, featureEnabled: false },
      });
    }

    const { origin, destination, itemValueUSD, deliveryDays, buyerId, travelerId } = req.body;

    // Validate required fields
    if (!origin || !destination || itemValueUSD === undefined) {
      return res.status(400).json({ error: 'Missing required fields: origin, destination, itemValueUSD' });
    }

    const correlationId = `corridor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const corridorService = new CorridorAdvisoryService(correlationId);
    const aiCore = new AICoreIntegrationService(correlationId);

    // Mock user data for trust computation (in production, fetch from database)
    const buyerTrust = aiCore.computeTrustScore({
      userId: String(buyerId || 'buyer-1'),
      role: 'BUYER',
      isEmailVerified: true,
      isPhoneVerified: true,
      is2FAEnabled: false,
      totalTransactions: 15,
      successfulTransactions: 14,
      accountCreatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      averageRating: 4.5,
      totalRatings: 10,
      disputesRaised: 1,
      disputesLost: 0,
      responseRate: 0.85,
      kycLevel: 'basic',
    });

    const travelerTrust = aiCore.computeTrustScore({
      userId: String(travelerId || 'traveler-1'),
      role: 'TRAVELER',
      isEmailVerified: true,
      isPhoneVerified: true,
      is2FAEnabled: true,
      totalTransactions: 25,
      successfulTransactions: 24,
      accountCreatedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      averageRating: 4.8,
      totalRatings: 20,
      disputesRaised: 0,
      disputesLost: 0,
      responseRate: 0.95,
      kycLevel: 'enhanced',
      passportVerified: true,
      totalDeliveries: 20,
      successfulDeliveries: 19,
      onTimeDeliveries: 18,
    });

    if (!buyerTrust || !travelerTrust) {
      return res.json({
        data: null,
        message: 'Trust scoring feature is disabled',
        meta: { advisory: true, correlationId },
      });
    }

    // Assess corridor
    const corridorAssessment = corridorService.assessCorridor({
      origin,
      destination,
      itemValueUSD,
      deliveryDays: deliveryDays || 14,
      buyerTrust,
      travelerTrust,
    });

    res.json({
      data: corridorAssessment,
      meta: {
        advisory: true,
        disclaimer: 'This is an advisory assessment only. No actions have been executed.',
        correlationId,
      },
    });
  } catch (error) {
    console.error('Corridor advisory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /intent/classify
 * Classify market intent
 */
router.post('/intent/classify', async (req: Request, res: Response) => {
  try {
    const flags = getFeatureFlags();
    if (!flags.CORRIDOR_AI_ADVISORY || !flags.AI_CORE_ENABLED) {
      return res.json({
        data: null,
        message: 'Intent classification feature is disabled',
        meta: { advisory: true, featureEnabled: false },
      });
    }

    const correlationId = `intent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const corridorService = new CorridorAdvisoryService(correlationId);

    const intent = corridorService.classifyMarketIntent(req.body);

    res.json({
      data: intent,
      meta: {
        advisory: true,
        disclaimer: 'Intent classification is advisory only.',
        correlationId,
      },
    });
  } catch (error) {
    console.error('Intent classification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /checkpoints
 * Get human confirmation checkpoints
 */
router.post('/checkpoints', async (req: Request, res: Response) => {
  try {
    const flags = getFeatureFlags();
    if (!flags.HUMAN_CONFIRMATION_CHECKPOINTS) {
      return res.json({ data: [] });
    }

    const correlationId = `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const corridorService = new CorridorAdvisoryService(correlationId);

    const checkpoints = corridorService.getConfirmationCheckpoints(req.body);

    res.json({
      data: checkpoints,
      meta: { advisory: true, correlationId },
    });
  } catch (error) {
    console.error('Checkpoints error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /checkpoints/:checkpointId/confirm
 * Record user confirmation for audit
 */
router.post('/checkpoints/:checkpointId/confirm', async (req: Request, res: Response) => {
  try {
    const { checkpointId } = req.params;
    const { confirmed } = req.body;
    const userId = (req as any).user?.id;

    // Log confirmation for audit
    confirmationLog.set(checkpointId, {
      checkpointId,
      confirmed: Boolean(confirmed),
      timestamp: new Date().toISOString(),
      userId,
    });

    // Keep only last 10000 confirmations
    if (confirmationLog.size > 10000) {
      const oldestKey = confirmationLog.keys().next().value;
      if (oldestKey) confirmationLog.delete(oldestKey);
    }

    res.json({
      success: true,
      message: confirmed ? 'Confirmation recorded' : 'Decline recorded',
      checkpointId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Confirmation recording error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /corridor/snapshot/:requestId
 * Get corridor snapshot for audit
 */
router.get('/snapshot/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const snapshot = CorridorAdvisoryService.getSnapshot(requestId);

    res.json({
      data: snapshot,
      meta: { advisory: true },
    });
  } catch (error) {
    console.error('Snapshot retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /corridor/snapshots
 * Get all corridor snapshots for audit (limited)
 */
router.get('/snapshots', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const snapshots = CorridorAdvisoryService.getAllSnapshots(limit);

    res.json({
      data: snapshots,
      meta: { advisory: true, count: snapshots.length },
    });
  } catch (error) {
    console.error('Snapshots retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /corridor/confirmations
 * Get confirmation audit log
 */
router.get('/confirmations', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const confirmations = Array.from(confirmationLog.values()).slice(-limit);

    res.json({
      data: confirmations,
      meta: { count: confirmations.length },
    });
  } catch (error) {
    console.error('Confirmations retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
