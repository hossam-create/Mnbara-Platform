/**
 * Dispute & Claims Intelligence Routes
 * NO AUTOMATION - Advisory Only
 *
 * HARD RULES:
 * - No auto-resolution
 * - No outcome enforcement
 * - Human decides everything
 * - Read-only classification
 * - Evidence checklist only (no collection)
 */

import { Router, Request, Response } from 'express';
import { disputeIntelService } from '../services/dispute-intel.service';
import { getFeatureFlags } from '../config/feature-flags';
import { DisputeContext } from '../types/dispute-intel.types';

const router = Router();

// ===========================================
// Middleware: Feature Flag Check
// ===========================================

function checkFeatureEnabled(req: Request, res: Response, next: Function): void {
  const flags = getFeatureFlags();

  if (flags.EMERGENCY_DISABLE_ALL) {
    res.status(503).json({
      error: 'Service temporarily disabled',
      code: 'EMERGENCY_DISABLED',
      advisory: true,
    });
    return;
  }

  if (!flags.DISPUTE_INTEL_ENABLED) {
    res.status(503).json({
      error: 'Dispute intelligence advisory is not enabled',
      code: 'FEATURE_DISABLED',
      advisory: true,
    });
    return;
  }

  next();
}

// ===========================================
// GET /api/disputes/advisory
// Get full dispute advisory (classification + evidence + guidance)
// ===========================================

router.get('/advisory', checkFeatureEnabled, (req: Request, res: Response) => {
  try {
    const {
      disputeId,
      transactionId,
      buyerId,
      sellerId,
      travelerId,
      amount,
      currency,
      itemDescription,
      claimDescription,
      claimDate,
      transactionDate,
      deliveryDate,
      existingEvidence,
    } = req.query;

    // Validate required fields
    if (!disputeId || !buyerId || !sellerId || !amount || !currency || !itemDescription || !claimDescription || !claimDate) {
      res.status(400).json({
        error: 'Missing required fields: disputeId, buyerId, sellerId, amount, currency, itemDescription, claimDescription, claimDate',
        code: 'INVALID_REQUEST',
        advisory: true,
      });
      return;
    }

    const context: DisputeContext = {
      disputeId: disputeId as string,
      transactionId: transactionId as string | undefined,
      buyerId: buyerId as string,
      sellerId: sellerId as string,
      travelerId: travelerId as string | undefined,
      amount: parseFloat(amount as string),
      currency: currency as string,
      itemDescription: itemDescription as string,
      claimDescription: claimDescription as string,
      claimDate: claimDate as string,
      transactionDate: transactionDate as string | undefined,
      deliveryDate: deliveryDate as string | undefined,
      existingEvidence: existingEvidence ? (existingEvidence as string).split(',') : undefined,
    };

    const advisory = disputeIntelService.getDisputeAdvisory(context);

    if (!advisory) {
      res.status(503).json({
        error: 'Dispute intelligence service unavailable',
        code: 'SERVICE_UNAVAILABLE',
        advisory: true,
      });
      return;
    }

    res.json({
      success: true,
      data: advisory,
      advisory: true,
      disclaimer: 'This is advisory information only. No automatic resolution occurs. Human decides everything.',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      advisory: true,
    });
  }
});

// ===========================================
// GET /api/disputes/evidence
// Get evidence checklist for a dispute category
// ===========================================

router.get('/evidence', checkFeatureEnabled, (req: Request, res: Response) => {
  try {
    const { disputeId, category, claimDescription } = req.query;

    if (!disputeId) {
      res.status(400).json({
        error: 'disputeId is required',
        code: 'INVALID_REQUEST',
        advisory: true,
      });
      return;
    }

    // Minimal context for checklist generation
    const context: DisputeContext = {
      disputeId: disputeId as string,
      buyerId: 'unknown',
      sellerId: 'unknown',
      amount: 0,
      currency: 'USD',
      itemDescription: 'N/A',
      claimDescription: (claimDescription as string) || 'General dispute',
      claimDate: new Date().toISOString(),
    };

    const checklist = disputeIntelService.generateEvidenceChecklist(
      context,
      category as any
    );

    res.json({
      success: true,
      data: checklist,
      advisory: true,
      disclaimer: 'This checklist is advisory only. Evidence collection is handled separately by human reviewers.',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      advisory: true,
    });
  }
});

// ===========================================
// GET /api/disputes/classify
// Classify a claim (read-only)
// ===========================================

router.get('/classify', checkFeatureEnabled, (req: Request, res: Response) => {
  try {
    const {
      disputeId,
      buyerId,
      sellerId,
      amount,
      currency,
      itemDescription,
      claimDescription,
      claimDate,
      existingEvidence,
    } = req.query;

    if (!disputeId || !claimDescription) {
      res.status(400).json({
        error: 'disputeId and claimDescription are required',
        code: 'INVALID_REQUEST',
        advisory: true,
      });
      return;
    }

    const context: DisputeContext = {
      disputeId: disputeId as string,
      buyerId: (buyerId as string) || 'unknown',
      sellerId: (sellerId as string) || 'unknown',
      amount: parseFloat((amount as string) || '0'),
      currency: (currency as string) || 'USD',
      itemDescription: (itemDescription as string) || 'N/A',
      claimDescription: claimDescription as string,
      claimDate: (claimDate as string) || new Date().toISOString(),
      existingEvidence: existingEvidence ? (existingEvidence as string).split(',') : undefined,
    };

    const classification = disputeIntelService.classifyClaim(context);

    res.json({
      success: true,
      data: classification,
      advisory: true,
      disclaimer: 'Classification is advisory only. No enforcement or auto-resolution occurs.',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      advisory: true,
    });
  }
});

// ===========================================
// GET /api/disputes/health
// Service health check
// ===========================================

router.get('/health', (req: Request, res: Response) => {
  try {
    const health = disputeIntelService.getHealth();

    res.json({
      success: true,
      data: health,
      advisory: true,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      code: 'HEALTH_CHECK_FAILED',
      advisory: true,
    });
  }
});

// ===========================================
// GET /api/disputes/constraints
// Get service constraints and rules
// ===========================================

router.get('/constraints', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      hardRules: {
        noAutoResolution: true,
        noOutcomeEnforcement: true,
        humanDecidesEverything: true,
        readOnlyClassification: true,
        evidenceChecklistOnly: true,
      },
      capabilities: {
        claimClassification: 'Read-only categorization of dispute claims',
        evidenceChecklist: 'Generate required evidence lists (no collection)',
        resolutionGuidance: 'Advisory guidance for human reviewers',
        riskAssessment: 'Advisory risk analysis',
        timelineGuidance: 'Recommended resolution timelines',
      },
      limitations: {
        noAutoResolution: 'System never automatically resolves disputes',
        noOutcomeEnforcement: 'System never enforces outcomes',
        noEvidenceCollection: 'System only generates checklists, does not collect evidence',
        noDecisionMaking: 'All decisions made by human reviewers',
        noPartyContact: 'System does not contact parties directly',
      },
      supportedCategories: [
        'ITEM_NOT_RECEIVED',
        'ITEM_NOT_AS_DESCRIBED',
        'DAMAGED_ITEM',
        'WRONG_ITEM',
        'PARTIAL_DELIVERY',
        'DELIVERY_DELAY',
        'PAYMENT_ISSUE',
        'COMMUNICATION_ISSUE',
        'CANCELLATION_DISPUTE',
        'REFUND_REQUEST',
        'OTHER',
      ],
      auditLogging: {
        enabled: true,
        logged: ['advisoryId', 'disputeId', 'action', 'timestamp'],
        notLogged: ['claim content', 'personal information', 'evidence files'],
      },
    },
    advisory: true,
    disclaimer: 'This service provides advisory information only. Human reviewers make all decisions.',
  });
});

export default router;
