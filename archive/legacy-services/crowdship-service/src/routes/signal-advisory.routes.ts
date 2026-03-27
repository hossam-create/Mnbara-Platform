/**
 * Signal Advisory Routes
 * Voice / Camera / Signals (Advisory-Only)
 *
 * HARD RULES:
 * - Explicit session-level consent required
 * - Ephemeral processing only
 * - No raw audio/video persistence
 * - No cross-session memory
 * - No ML training from signals
 */

import { Router, Request, Response } from 'express';
import { signalAdvisoryService } from '../services/signal-advisory.service';
import { getFeatureFlags } from '../config/feature-flags';
import {
  SignalType,
  SessionConsent,
  VoiceAdvisoryInput,
  CameraAdvisoryInput,
} from '../types/signal-advisory.types';

const router = Router();

// ===========================================
// Constraints Endpoint (Always Available)
// ===========================================

/**
 * GET /api/advisory/constraints
 * Returns hard constraints for signal advisory
 */
router.get('/constraints', (_req: Request, res: Response) => {
  res.json({
    constraints: {
      rules: [
        'Feature flags OFF by default',
        'Explicit session-level consent required',
        'Ephemeral processing only',
        'No raw audio/video persistence',
        'No cross-session memory',
        'No ML training from signals',
        'Human confirmation required for all actions',
        'Session auto-expires after 15 minutes',
        'Full opt-out enforcement',
      ],
      supportedSignals: ['VOICE', 'CAMERA'],
      supportedOutputs: [
        'INTENT_CLARIFICATION',
        'ITEM_DESCRIPTION',
        'RISK_EDUCATION',
        'NEXT_STEP_SUGGESTION',
      ],
      rateLimits: {
        voiceRequestsPerMinute: 10,
        cameraRequestsPerMinute: 5,
        sessionsPerHour: 10,
        maxSessionDurationMinutes: 15,
      },
      blocked: [
        'Raw audio storage',
        'Raw video/image storage',
        'Face detection/recognition',
        'Cross-session memory',
        'ML model training',
        'Trust/risk modification',
        'Transaction triggering',
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

// ===========================================
// Feature Flag Check Middleware
// ===========================================

function checkSignalAdvisoryEnabled(req: Request, res: Response, next: Function) {
  const flags = getFeatureFlags();

  if (flags.EMERGENCY_DISABLE_ALL) {
    return res.status(503).json({
      error: 'Service disabled',
      reason: 'Emergency kill switch active',
      timestamp: new Date().toISOString(),
    });
  }

  if (!flags.SIGNAL_ADVISORY_ENABLED) {
    return res.status(503).json({
      error: 'Signal advisory disabled',
      reason: 'FF_SIGNAL_ADVISORY_ENABLED is false',
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

// ===========================================
// Session Management
// ===========================================

/**
 * POST /api/advisory/session
 * Create a new advisory session with consent
 */
router.post('/session', checkSignalAdvisoryEnabled, (req: Request, res: Response) => {
  const { userId, signalType, consent } = req.body as {
    userId: string;
    signalType: SignalType;
    consent: SessionConsent;
  };

  // Validate required fields
  if (!userId || !signalType || !consent) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['userId', 'signalType', 'consent'],
    });
  }

  // Validate consent
  if (!consent.consentGiven) {
    return res.status(400).json({
      error: 'Consent required',
      message: 'Explicit consent must be given to create a session',
    });
  }

  const result = signalAdvisoryService.createSession(userId, signalType, consent);

  if (!result) {
    return res.status(503).json({
      error: 'Session creation failed',
      reason: 'Service unavailable or rate limited',
    });
  }

  res.status(201).json({
    ...result,
    _meta: {
      endpoint: 'POST /api/advisory/session',
      consentRequired: true,
      ephemeralOnly: true,
    },
  });
});

/**
 * GET /api/advisory/session/status
 * Get session status
 */
router.get('/session/status', checkSignalAdvisoryEnabled, (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;

  if (!sessionId) {
    return res.status(400).json({
      error: 'Missing sessionId',
    });
  }

  const status = signalAdvisoryService.getSessionStatus(sessionId);

  if (!status) {
    return res.status(404).json({
      error: 'Session not found',
      sessionId,
    });
  }

  res.json({
    ...status,
    _meta: {
      endpoint: 'GET /api/advisory/session/status',
      readOnly: true,
    },
  });
});

/**
 * POST /api/advisory/session/opt-out
 * Opt out of session (full enforcement)
 */
router.post('/session/opt-out', checkSignalAdvisoryEnabled, (req: Request, res: Response) => {
  const { sessionId } = req.body as { sessionId: string };

  if (!sessionId) {
    return res.status(400).json({
      error: 'Missing sessionId',
    });
  }

  const success = signalAdvisoryService.optOut(sessionId);

  if (!success) {
    return res.status(404).json({
      error: 'Session not found or already opted out',
      sessionId,
    });
  }

  res.json({
    success: true,
    message: 'Successfully opted out of session',
    sessionId,
    timestamp: new Date().toISOString(),
  });
});

// ===========================================
// Voice Advisory
// ===========================================

/**
 * POST /api/advisory/voice
 * Process voice transcript for advisory
 * NO RAW AUDIO - Transcript only
 */
router.post('/voice', checkSignalAdvisoryEnabled, (req: Request, res: Response) => {
  const flags = getFeatureFlags();

  if (!flags.VOICE_ADVISORY_ENABLED) {
    return res.status(503).json({
      error: 'Voice advisory disabled',
      reason: 'FF_VOICE_ADVISORY_ENABLED is false',
    });
  }

  const input = req.body as VoiceAdvisoryInput;

  // Validate required fields
  if (!input.sessionId || !input.transcript) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['sessionId', 'transcript'],
    });
  }

  const result = signalAdvisoryService.processVoiceAdvisory(input);

  if (!result) {
    return res.status(503).json({
      error: 'Voice advisory failed',
      reason: 'Session invalid, expired, or rate limited',
    });
  }

  res.json({
    ...result,
    _meta: {
      endpoint: 'POST /api/advisory/voice',
      noAudioStorage: true,
      transcriptOnly: true,
      humanConfirmationRequired: true,
    },
  });
});

// ===========================================
// Camera Advisory
// ===========================================

/**
 * POST /api/advisory/camera
 * Process extracted image features for advisory
 * NO RAW IMAGE - Extracted features only
 */
router.post('/camera', checkSignalAdvisoryEnabled, (req: Request, res: Response) => {
  const flags = getFeatureFlags();

  if (!flags.CAMERA_ADVISORY_ENABLED) {
    return res.status(503).json({
      error: 'Camera advisory disabled',
      reason: 'FF_CAMERA_ADVISORY_ENABLED is false',
    });
  }

  const input = req.body as CameraAdvisoryInput;

  // Validate required fields
  if (!input.sessionId || !input.extractedFeatures) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['sessionId', 'extractedFeatures'],
    });
  }

  const result = signalAdvisoryService.processCameraAdvisory(input);

  if (!result) {
    return res.status(503).json({
      error: 'Camera advisory failed',
      reason: 'Session invalid, expired, or rate limited',
    });
  }

  res.json({
    ...result,
    _meta: {
      endpoint: 'POST /api/advisory/camera',
      noImageStorage: true,
      extractedFeaturesOnly: true,
      humanConfirmationRequired: true,
    },
  });
});

// ===========================================
// Health Endpoint
// ===========================================

/**
 * GET /api/advisory/health
 * Get signal advisory health status
 */
router.get('/health', (req: Request, res: Response) => {
  const health = signalAdvisoryService.getHealth();

  res.json({
    ...health,
    _meta: {
      endpoint: 'GET /api/advisory/health',
      readOnly: true,
    },
  });
});

// ===========================================
// Audit Endpoint (No Content)
// ===========================================

/**
 * GET /api/advisory/audit
 * Get audit log (metadata only, no content)
 */
router.get('/audit', checkSignalAdvisoryEnabled, (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const auditLog = signalAdvisoryService.getAuditLog(sessionId);

  res.json({
    auditLog,
    count: auditLog.length,
    timestamp: new Date().toISOString(),
    _meta: {
      endpoint: 'GET /api/advisory/audit',
      readOnly: true,
      noContentStorage: true,
      metadataOnly: true,
    },
  });
});

export default router;
