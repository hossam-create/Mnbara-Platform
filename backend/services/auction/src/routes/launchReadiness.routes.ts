import { Router, Request, Response } from 'express';
import { launchReadinessService } from '../services/LaunchReadiness.service';
import { LaunchReadinessRequest } from '../types/LaunchReadiness.types';

/**
 * Launch Readiness Routes - ANALYSIS + DECLARATION ONLY
 * 
 * FINAL PRE-LAUNCH task for real-money marketplace platform
 * NO implementation - only analysis and declaration
 * 
 * ABSOLUTE RULES:
 * - NO new features
 * - NO business logic changes
 * - NO financial behavior changes
 * - This task is ANALYSIS + DECLARATION ONLY
 * - Backend remains source of truth
 * - Frontend has ZERO authority
 */

const router = Router();

/**
 * POST /api/v1/auction/launch-readiness/report
 * 
 * Generate complete Launch Readiness Report
 * FINAL OUTPUT: LaunchReadinessReport, ScopeLockDeclaration, AuthorityMatrix, GoLiveDecision
 */
router.post('/report', async (req: Request, res: Response) => {
  try {
    const request: LaunchReadinessRequest = {
      includeSystemFreeze: req.body.includeSystemFreeze !== false,
      includeScopeLock: req.body.includeScopeLock !== false,
      includeAuthorityMatrix: req.body.includeAuthorityMatrix !== false,
      includeGoLiveChecklist: req.body.includeGoLiveChecklist !== false,
      includePostLaunchFlags: req.body.includePostLaunchFlags !== false,
      autoGenerateReport: req.body.autoGenerateReport !== false
    };

    // Generate launch readiness report
    const result = launchReadinessService.generateLaunchReadinessReport(request);

    if (result.success) {
      res.json({
        success: true,
        report: result.report,
        validation: result.validation,
        decision: result.report?.goLiveDecision,
        status: result.report?.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('[LaunchReadiness] Error generating report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate launch readiness report'
    });
  }
});

/**
 * GET /api/v1/auction/launch-readiness/status
 * 
 * Get current launch readiness status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = launchReadinessService.getLaunchReadinessStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date(),
      readyForSoftLaunch: status === 'READY_FOR_SOFT_LAUNCH'
    });

  } catch (error) {
    console.error('[LaunchReadiness] Error getting status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve launch readiness status'
    });
  }
});

/**
 * GET /api/v1/auction/launch-readiness/system-freeze
 * 
 * Get system freeze declaration
 */
router.get('/system-freeze', async (_req: Request, res: Response) => {
  try {
    const systemFreeze = launchReadinessService.applySystemFreeze();
    
    res.json({
      success: true,
      systemFreeze,
      appliedAt: systemFreeze.appliedAt,
      version: systemFreeze.version
    });

  } catch (error) {
    console.error('[LaunchReadiness] Error getting system freeze:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve system freeze declaration'
    });
  }
});

/**
 * GET /api/v1/auction/launch-readiness/scope-lock
 * 
 * Get launch scope lock declaration
 */
router.get('/scope-lock', async (_req: Request, res: Response) => {
  try {
    const scopeLock = launchReadinessService.lockLaunchScope();
    
    res.json({
      success: true,
      scopeLock,
      lockedAt: scopeLock.lockedAt,
      liveComponentsCount: Object.values(scopeLock.liveComponents.auctions).filter(Boolean).length + 
                           (scopeLock.liveComponents.wallet.readOnly ? 1 : 0) +
                           (scopeLock.liveComponents.escrow.backendControlled ? 1 : 0) +
                           (scopeLock.liveComponents.disputes.guarantees ? 1 : 0) +
                           Object.values(scopeLock.liveComponents.trustAndSafety).filter(Boolean).length +
                           (scopeLock.liveComponents.affiliateAndReferral.trackingOnly ? 1 : 0) +
                           (scopeLock.liveComponents.eventLogging.appendOnly ? 1 : 0),
      lockedComponentsCount: Object.values(scopeLock.lockedComponents).filter(Boolean).length
    });

  } catch (error) {
    console.error('[LaunchReadiness] Error getting scope lock:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve scope lock declaration'
    });
  }
});

/**
 * GET /api/v1/auction/launch-readiness/authority-matrix
 * 
 * Get authority matrix declaration
 */
router.get('/authority-matrix', async (_req: Request, res: Response) => {
  try {
    const authorityMatrix = launchReadinessService.finalizeAuthorityMatrix();
    
    res.json({
      success: true,
      authorityMatrix,
      finalizedAt: authorityMatrix.finalizedAt,
      frontendAuthority: 'VIEW_ONLY',
      backendAuthority: 'FULL_CONTROL',
      adminAuthority: 'READ_ONLY'
    });

  } catch (error) {
    console.error('[LaunchReadiness] Error getting authority matrix:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve authority matrix'
    });
  }
});

/**
 * GET /api/v1/auction/launch-readiness/checklist
 * 
 * Get go-live checklist
 */
router.get('/checklist', async (_req: Request, res: Response) => {
  try {
    const checklist = launchReadinessService.generateGoLiveChecklist();
    
    res.json({
      success: true,
      checklist,
      checkedAt: checklist.checkedAt,
      totalChecks: checklist.totalChecks,
      passedChecks: checklist.passedChecks,
      allPassed: checklist.allPassed,
      readyForLaunch: checklist.allPassed
    });

  } catch (error) {
    console.error('[LaunchReadiness] Error getting checklist:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve go-live checklist'
    });
  }
});

/**
 * GET /api/v1/auction/launch-readiness/post-launch-flags
 * 
 * Get post-launch phase documentation
 */
router.get('/post-launch-flags', async (_req: Request, res: Response) => {
  try {
    const postLaunchFlags = launchReadinessService.documentPostLaunchFlags();
    
    res.json({
      success: true,
      currentPhase: postLaunchFlags.currentPhase,
      futurePhases: postLaunchFlags.futurePhases,
      totalPhases: postLaunchFlags.futurePhases.length,
      nextPhase: postLaunchFlags.futurePhases[0]?.phase,
      nextPhaseDescription: postLaunchFlags.futurePhases[0]?.description,
      nextPhaseTimeline: postLaunchFlags.futurePhases[0]?.estimatedTimeline
    });

  } catch (error) {
    console.error('[LaunchReadiness] Error getting post-launch flags:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve post-launch phase documentation'
    });
  }
});

/**
 * GET /api/v1/auction/launch-readiness/events
 * 
 * Get launch readiness events
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const events = launchReadinessService.getLaunchEvents(limit);
    
    res.json({
      success: true,
      events,
      count: events.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[LaunchReadiness] Error getting events:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve launch readiness events'
    });
  }
});

/**
 * GET /api/v1/auction/launch-readiness/summary
 * 
 * Get launch readiness summary
 */
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    const status = launchReadinessService.getLaunchReadinessStatus();
    const systemFreeze = launchReadinessService.applySystemFreeze();
    const scopeLock = launchReadinessService.lockLaunchScope();
    const authorityMatrix = launchReadinessService.finalizeAuthorityMatrix();
    const checklist = launchReadinessService.generateGoLiveChecklist();
    const postLaunchFlags = launchReadinessService.documentPostLaunchFlags();
    
    const summary = {
      status,
      decision: checklist.allPassed ? 'YES' : 'NO',
      readyForSoftLaunch: checklist.allPassed,
      systemFreeze: {
        version: systemFreeze.version,
        appliedAt: systemFreeze.appliedAt,
        frozen: true
      },
      scopeLock: {
        lockedAt: scopeLock.lockedAt,
        liveComponents: this.countLiveComponents(scopeLock),
        lockedComponents: this.countLockedComponents(scopeLock)
      },
      authorityMatrix: {
        finalizedAt: authorityMatrix.finalizedAt,
        frontendAuthority: 'VIEW_ONLY',
        backendAuthority: 'FULL_CONTROL',
        adminAuthority: 'READ_ONLY'
      },
      checklist: {
        totalChecks: checklist.totalChecks,
        passedChecks: checklist.passedChecks,
        allPassed: checklist.allPassed,
        checkedAt: checklist.checkedAt
      },
      postLaunch: {
        currentPhase: postLaunchFlags.currentPhase,
        futurePhases: postLaunchFlags.futurePhases.length
      },
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('[LaunchReadiness] Error getting summary:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve launch readiness summary'
    });
  }
});

/**
 * GET /api/v1/auction/launch-readiness/health
 * 
 * Health check endpoint
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const status = launchReadinessService.getLaunchReadinessStatus();
    const checklist = launchReadinessService.generateGoLiveChecklist();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      launchReadiness: {
        status,
        readyForSoftLaunch: status === 'READY_FOR_SOFT_LAUNCH',
        checklistPassed: checklist.allPassed,
        systemFrozen: true,
        scopeLocked: true,
        authorityFinalized: true
      }
    });

  } catch (error) {
    console.error('[LaunchReadiness] Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Health check failed'
    });
  }
});

/**
 * Helper function to count live components
 */
function countLiveComponents(scopeLock: any): number {
  let count = 0;
  count += Object.values(scopeLock.liveComponents.auctions).filter(Boolean).length;
  count += scopeLock.liveComponents.wallet.readOnly ? 1 : 0;
  count += scopeLock.liveComponents.escrow.backendControlled ? 1 : 0;
  count += scopeLock.liveComponents.disputes.guarantees ? 1 : 0;
  count += Object.values(scopeLock.liveComponents.trustAndSafety).filter(Boolean).length;
  count += scopeLock.liveComponents.affiliateAndReferral.trackingOnly ? 1 : 0;
  count += scopeLock.liveComponents.eventLogging.appendOnly ? 1 : 0;
  return count;
}

/**
 * Helper function to count locked components
 */
function countLockedComponents(scopeLock: any): number {
  return Object.values(scopeLock.lockedComponents).filter(Boolean).length;
}

export default router;
