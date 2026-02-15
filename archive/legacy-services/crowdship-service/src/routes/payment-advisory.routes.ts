/**
 * Payment Advisory Routes
 * READ-ONLY - All endpoints are GET only
 *
 * HARD RULES:
 * - No calls to banks
 * - No PSP SDKs
 * - No payment APIs
 * - No side effects
 * - Read-only services only
 */

import { Router, Request, Response } from 'express';
import { paymentAdvisoryService } from '../services/payment-advisory.service';
import { getFeatureFlags } from '../config/feature-flags';
import { structuredLog, LogLevel } from '../services/structured-logger.service';
import { PaymentAdvisoryRequest } from '../types/payment-advisory.types';

const router = Router();

/**
 * Middleware to check payment advisory feature flag
 */
function checkPaymentAdvisoryEnabled(req: Request, res: Response, next: Function) {
  const flags = getFeatureFlags();

  if (flags.EMERGENCY_DISABLE_ALL) {
    return res.status(503).json({
      error: 'Service temporarily disabled',
      message: 'Emergency kill switch is active',
      advisoryOnly: true,
    });
  }

  if (!flags.PAYMENT_ADVISORY_ENABLED) {
    return res.status(403).json({
      error: 'Payment advisory is disabled',
      message: 'Enable FF_PAYMENT_ADVISORY_ENABLED to access this service',
      advisoryOnly: true,
    });
  }

  next();
}

/**
 * Middleware to audit log all requests
 */
function auditPaymentAdvisory(req: Request, res: Response, next: Function) {
  structuredLog(LogLevel.INFO, 'Payment advisory accessed', {
    requestId: (req as any).requestId,
    userId: (req as any).user?.id,
    endpoint: req.path,
    method: req.method,
    metadata: {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      query: req.query,
    },
  });
  next();
}

// Apply middleware to all routes
router.use(auditPaymentAdvisory);

/**
 * GET /api/payments/advisory/health
 * Health check - always available
 */
router.get('/health', (_req: Request, res: Response) => {
  try {
    const health = paymentAdvisoryService.getHealth();
    res.json({
      data: health,
      meta: {
        readOnly: true,
        noExecution: true,
        advisoryOnly: true,
      },
    });
  } catch (error) {
    console.error('Payment advisory health error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Apply feature flag check to remaining routes
router.use(checkPaymentAdvisoryEnabled);

/**
 * GET /api/payments/advisory/options
 * Compare payment methods for a corridor
 * READ-ONLY - No execution
 */
router.get('/options', (req: Request, res: Response) => {
  try {
    const { corridor, amount, currency, buyerTrust, travelerTrust, itemCategory } = req.query;

    if (!corridor || !amount) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['corridor', 'amount'],
        advisoryOnly: true,
      });
    }

    const amountUSD = parseFloat(amount as string);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number',
        advisoryOnly: true,
      });
    }

    const request: PaymentAdvisoryRequest = {
      requestId: (req as any).requestId || `pa-${Date.now()}`,
      corridor: corridor as string,
      originCountry: (corridor as string).split('_')[0],
      destinationCountry: (corridor as string).split('_')[1],
      amountUSD,
      currency: currency as string,
      buyerTrustLevel: buyerTrust as string,
      travelerTrustLevel: travelerTrust as string,
      itemCategory: itemCategory as string,
    };

    const comparison = paymentAdvisoryService.comparePaymentMethods(request);

    res.json({
      data: comparison,
      meta: {
        readOnly: true,
        noExecution: true,
        advisoryOnly: true,
        deterministic: true,
      },
    });
  } catch (error) {
    console.error('Payment options error:', error);
    res.status(500).json({ error: 'Failed to compare payment options' });
  }
});

/**
 * GET /api/payments/advisory/fx
 * Get FX advisory
 * READ-ONLY - Uses static snapshot, no live API calls
 */
router.get('/fx', (req: Request, res: Response) => {
  try {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['from', 'to', 'amount'],
        advisoryOnly: true,
      });
    }

    const amountNum = parseFloat(amount as string);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number',
        advisoryOnly: true,
      });
    }

    const fxAdvisory = paymentAdvisoryService.getFXAdvisory(
      (from as string).toUpperCase(),
      (to as string).toUpperCase(),
      amountNum,
      (req as any).requestId
    );

    res.json({
      data: fxAdvisory,
      meta: {
        readOnly: true,
        noExecution: true,
        advisoryOnly: true,
        snapshotBased: true,
        notLiveRates: true,
      },
    });
  } catch (error) {
    console.error('FX advisory error:', error);
    res.status(500).json({ error: 'Failed to get FX advisory' });
  }
});

/**
 * GET /api/payments/advisory/risks
 * Assess payment risks
 * READ-ONLY - No execution
 */
router.get('/risks', (req: Request, res: Response) => {
  try {
    const { corridor, amount, buyerTrust, travelerTrust, itemCategory } = req.query;

    if (!corridor || !amount) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['corridor', 'amount'],
        advisoryOnly: true,
      });
    }

    const amountUSD = parseFloat(amount as string);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number',
        advisoryOnly: true,
      });
    }

    const request: PaymentAdvisoryRequest = {
      requestId: (req as any).requestId || `pa-${Date.now()}`,
      corridor: corridor as string,
      originCountry: (corridor as string).split('_')[0],
      destinationCountry: (corridor as string).split('_')[1],
      amountUSD,
      buyerTrustLevel: buyerTrust as string,
      travelerTrustLevel: travelerTrust as string,
      itemCategory: itemCategory as string,
    };

    const riskAssessment = paymentAdvisoryService.assessPaymentRisks(request);

    res.json({
      data: riskAssessment,
      meta: {
        readOnly: true,
        noExecution: true,
        advisoryOnly: true,
        deterministic: true,
      },
    });
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ error: 'Failed to assess payment risks' });
  }
});

/**
 * GET /api/payments/advisory/snapshot/:requestId
 * Get audit snapshot for a request
 * READ-ONLY
 */
router.get('/snapshot/:requestId', (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    const snapshot = paymentAdvisoryService.getSnapshot(requestId);

    if (!snapshot) {
      return res.status(404).json({
        error: 'Snapshot not found',
        requestId,
        advisoryOnly: true,
      });
    }

    res.json({
      data: snapshot,
      meta: {
        readOnly: true,
        auditRecord: true,
      },
    });
  } catch (error) {
    console.error('Snapshot retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve snapshot' });
  }
});

/**
 * GET /api/payments/advisory/compliance
 * Get compliance advisory for a corridor
 * READ-ONLY - No execution
 */
router.get('/compliance', (req: Request, res: Response) => {
  try {
    const { corridor, amount, originCountry, destinationCountry } = req.query;

    if (!corridor || !amount) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['corridor', 'amount'],
        advisoryOnly: true,
      });
    }

    const amountUSD = parseFloat(amount as string);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number',
        advisoryOnly: true,
      });
    }

    const request: PaymentAdvisoryRequest = {
      requestId: (req as any).requestId || `pa-${Date.now()}`,
      corridor: corridor as string,
      originCountry: (originCountry as string) || (corridor as string).split('_')[0],
      destinationCountry: (destinationCountry as string) || (corridor as string).split('_')[1],
      amountUSD,
    };

    const complianceAdvisory = paymentAdvisoryService.getComplianceAdvisory(request);

    res.json({
      data: complianceAdvisory,
      meta: {
        readOnly: true,
        noExecution: true,
        advisoryOnly: true,
        deterministic: true,
        whatWeDoNot: [
          'Execute payments',
          'Connect to banks',
          'Process transactions',
          'Store payment credentials',
          'Initiate transfers',
        ],
      },
    });
  } catch (error) {
    console.error('Compliance advisory error:', error);
    res.status(500).json({ error: 'Failed to get compliance advisory' });
  }
});

/**
 * GET /api/payments/advisory/partners
 * Check partner/bank readiness for a corridor
 * READ-ONLY - No actual bank connections
 */
router.get('/partners', (req: Request, res: Response) => {
  try {
    const { corridor } = req.query;

    if (!corridor) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['corridor'],
        advisoryOnly: true,
      });
    }

    const partnerReadiness = paymentAdvisoryService.checkPartnerReadiness(
      corridor as string,
      (req as any).requestId
    );

    res.json({
      data: partnerReadiness,
      meta: {
        readOnly: true,
        noExecution: true,
        advisoryOnly: true,
        noBankConnections: true,
        noPSPSDKs: true,
        whatWeDoNot: [
          'Connect to bank APIs',
          'Initialize PSP SDKs',
          'Create payment intents',
          'Process webhooks',
          'Store secrets',
        ],
      },
    });
  } catch (error) {
    console.error('Partner readiness error:', error);
    res.status(500).json({ error: 'Failed to check partner readiness' });
  }
});

/**
 * GET /api/payments/advisory/fees
 * Get detailed fee breakdown
 * READ-ONLY - Static calculation
 */
router.get('/fees', (req: Request, res: Response) => {
  try {
    const { method, amount, corridor } = req.query;

    if (!method || !amount || !corridor) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['method', 'amount', 'corridor'],
        advisoryOnly: true,
      });
    }

    const amountUSD = parseFloat(amount as string);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number',
        advisoryOnly: true,
      });
    }

    const feeBreakdown = paymentAdvisoryService.getFeeBreakdown(
      method as string,
      amountUSD,
      corridor as string
    );

    res.json({
      data: feeBreakdown,
      meta: {
        readOnly: true,
        noExecution: true,
        advisoryOnly: true,
        staticCalculation: true,
      },
    });
  } catch (error) {
    console.error('Fee breakdown error:', error);
    res.status(500).json({ error: 'Failed to get fee breakdown' });
  }
});

/**
 * GET /api/payments/advisory/constraints
 * Verify read-only constraints
 */
router.get('/constraints', (_req: Request, res: Response) => {
  res.json({
    data: {
      paymentAdvisory: {
        readOnly: true,
        noExecution: true,
        noBankCalls: true,
        noPSPSDKs: true,
        noPaymentAPIs: true,
        noSideEffects: true,
        advisoryOnly: true,
        deterministic: true,
        humanConfirmationRequired: true,
      },
      whatWeDoNot: [
        'Execute payments',
        'Deduct funds',
        'Convert currencies',
        'Create real wallets',
        'Auto-anything',
        'Connect to Stripe/PayPal/PSP SDKs',
        'Process webhooks',
        'Store payment secrets',
        'Initiate bank transfers',
      ],
      whyAdvisoryOnly: 'This service provides intelligence and recommendations only. All actual payment execution requires human confirmation and is handled by separate, audited payment services.',
      endpoints: {
        '/advisory/health': { method: 'GET', mutates: false, executes: false },
        '/advisory/options': { method: 'GET', mutates: false, executes: false },
        '/advisory/fx': { method: 'GET', mutates: false, executes: false },
        '/advisory/risks': { method: 'GET', mutates: false, executes: false },
        '/advisory/compliance': { method: 'GET', mutates: false, executes: false },
        '/advisory/partners': { method: 'GET', mutates: false, executes: false },
        '/advisory/fees': { method: 'GET', mutates: false, executes: false },
        '/advisory/snapshot/:id': { method: 'GET', mutates: false, executes: false },
      },
      verified: true,
    },
    meta: {
      message: 'This is intelligence only. No payments are executed.',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
