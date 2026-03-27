// Enhanced Fraud Detection Controller
// وحدة تحكم كشف الاحتيال المتقدمة - API endpoints for fraud detection

import { Request, Response, NextFunction } from 'express';
import { riskAssessmentService, ComprehensiveRiskInput } from '../services/risk-assessment.service';
import { behavioralAnalysisService } from '../services/behavioral-analysis.service';
import { deviceFingerprintingService, DeviceFingerprintInput } from '../services/device-fingerprint.service';
import { velocityTrackingService } from '../services/velocity-tracking.service';
import { anomalyDetectionEngine } from '../services/anomaly-detection.service';
import { caseManagementService, CaseCreationInput, CaseUpdateInput } from '../services/case-management.service';
import { v4 as uuidv4 } from 'uuid';

// ==========================================
// Risk Assessment API
// ==========================================

export const assessTransactionRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      transactionId,
      amount,
      currency,
      type,
      paymentMethod,
      deviceFingerprint,
      location,
      behavioral
    } = req.body;

    const input: ComprehensiveRiskInput = {
      userId,
      transactionId,
      amount,
      currency,
      type,
      paymentMethod,
      deviceFingerprint,
      location,
      behavioral
    };

    const result = await riskAssessmentService.assessRisk(input);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getUserRiskSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const summary = await riskAssessmentService.getUserRiskSummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Behavioral Analysis API
// ==========================================

export const analyzeBehavior = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId, pageViews, pagesVisited, avgTimePerPage, totalSessionDuration, mouseMovements, mouseSpeed, clickCount, scrollDepth, scrollBehavior, touchEvents, typingSpeed, pasteEvents, backspaceRatio, hourOfDay, dayOfWeek, deviceType, country } = req.body;

    const result = await behavioralAnalysisService.analyzeBehavior({
      userId,
      sessionId: sessionId || uuidv4(),
      pageViews: pageViews || 0,
      pagesVisited: pagesVisited || [],
      avgTimePerPage: avgTimePerPage || 0,
      totalSessionDuration: totalSessionDuration || 0,
      mouseMovements: mouseMovements || 0,
      mouseSpeed: mouseSpeed || 0,
      clickCount: clickCount || 0,
      scrollDepth: scrollDepth || 0,
      scrollBehavior: scrollBehavior || 'normal',
      touchEvents: touchEvents || 0,
      typingSpeed: typingSpeed || 0,
      pasteEvents: pasteEvents || 0,
      backspaceRatio: backspaceRatio || 0,
      keystrokeTiming: [],
      cartInteractions: 0,
      wishlistInteractions: 0,
      searchQueries: 0,
      filterUsage: [],
      hourOfDay: hourOfDay || new Date().getHours(),
      dayOfWeek: dayOfWeek || new Date().getDay(),
      timezone: 'UTC',
      deviceType: deviceType || 'desktop',
      country: country || 'Unknown'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getBehaviorProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const profile = await behavioralAnalysisService.getBehaviorProfile(userId);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Device Fingerprinting API
// ==========================================

export const registerDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fingerprint, userId } = req.body;

    const deviceFingerprintInput: DeviceFingerprintInput = {
      userAgent: fingerprint?.userAgent,
      acceptLanguage: fingerprint?.acceptLanguage,
      timezone: fingerprint?.timezone,
      screenWidth: fingerprint?.screenWidth,
      screenHeight: fingerprint?.screenHeight,
      colorDepth: fingerprint?.colorDepth,
      pixelRatio: fingerprint?.pixelRatio,
      canvasHash: fingerprint?.canvasHash,
      webglVendor: fingerprint?.webglVendor,
      webglRenderer: fingerprint?.webglRenderer,
      platform: fingerprint?.platform
    };

    const result = await deviceFingerprintingService.getOrCreateFingerprint(
      deviceFingerprintInput,
      userId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const markDeviceTrusted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fingerprintId, userId } = req.body;
    const success = await deviceFingerprintingService.markAsTrusted(fingerprintId, userId);

    res.json({
      success,
      message: success ? 'Device marked as trusted' : 'Failed to mark device as trusted'
    });
  } catch (error) {
    next(error);
  }
};

export const markDeviceSuspicious = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fingerprintId, reasons, score } = req.body;
    const success = await deviceFingerprintingService.markAsSuspicious(fingerprintId, reasons || [], score || 80);

    res.json({
      success,
      message: success ? 'Device marked as suspicious' : 'Failed to mark device as suspicious'
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDevices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const devices = await deviceFingerprintingService.getUserDevices(userId);

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Velocity Tracking API
// ==========================================

export const checkVelocity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, entityType, entityId, amount } = req.body;

    const result = await velocityTrackingService.checkVelocity({
      userId,
      entityType,
      entityId,
      amount
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const recordVelocityEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, entityType, entityId, amount, windowType } = req.body;

    await velocityTrackingService.recordEvent({
      userId,
      entityType,
      entityId,
      amount,
      windowType
    });

    res.json({
      success: true,
      message: 'Velocity event recorded'
    });
  } catch (error) {
    next(error);
  }
};

export const getUserVelocitySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const summary = await velocityTrackingService.getUserVelocitySummary(userId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Anomaly Detection API
// ==========================================

export const detectAnomaly = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, transactionId, amount, type, data } = req.body;

    const result = await anomalyDetectionEngine.detectAnomalies({
      userId,
      transactionId,
      amount,
      type,
      data: data || {}
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Case Management API
// ==========================================

export const createCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CaseCreationInput = {
      title: req.body.title,
      description: req.body.description,
      caseType: req.body.caseType,
      priority: req.body.priority,
      userId: req.body.userId,
      orderId: req.body.orderId,
      transactionId: req.body.transactionId,
      estimatedLoss: req.body.estimatedLoss,
      potentialLoss: req.body.potentialLoss,
      openedBy: req.body.openedBy || 'system'
    };

    const caseResult = await caseManagementService.createCase(input);

    res.json({
      success: true,
      data: caseResult
    });
  } catch (error) {
    next(error);
  }
};

export const getCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const caseResult = await caseManagementService.getCase(caseId);

    if (!caseResult) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    res.json({
      success: true,
      data: caseResult
    });
  } catch (error) {
    next(error);
  }
};

export const updateCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const input: CaseUpdateInput = req.body;
    const updatedBy = req.body.updatedBy || 'system';

    const caseResult = await caseManagementService.updateCase(caseId, input, updatedBy);

    if (!caseResult) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    res.json({
      success: true,
      data: caseResult
    });
  } catch (error) {
    next(error);
  }
};

export const resolveCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { resolution, resolutionAr, actionsTaken, resolvedBy } = req.body;

    const caseResult = await caseManagementService.resolveCase(
      caseId,
      resolution,
      resolutionAr,
      actionsTaken || {},
      resolvedBy || 'system'
    );

    if (!caseResult) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    res.json({
      success: true,
      data: caseResult
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, caseType, assignedTo } = req.query;

    const filters: any = {};
    if (status) filters.status = (status as string).split(',');
    if (priority) filters.priority = (priority as string).split(',');
    if (caseType) filters.caseType = (caseType as string).split(',');
    if (assignedTo) filters.assignedTo = assignedTo as string;

    const cases = await caseManagementService.getReviewQueue(Object.keys(filters).length > 0 ? filters : undefined);

    res.json({
      success: true,
      data: cases,
      count: cases.length
    });
  } catch (error) {
    next(error);
  }
};

export const getCaseNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const includeInternal = req.query.internal !== 'false';

    const notes = await caseManagementService.getCaseNotes(caseId, includeInternal);

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    next(error);
  }
};

export const addCaseNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { content, authorId, authorName, isInternal } = req.body;

    const noteId = await caseManagementService.addNote(caseId, {
      content,
      authorId: authorId || 'system',
      authorName: authorName || 'System',
      isInternal: isInternal !== false
    });

    res.json({
      success: true,
      noteId,
      message: 'Note added successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getCaseStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const stats = await caseManagementService.getCaseStatistics(
      dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo ? new Date(dateTo as string) : undefined
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const escalateCase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { caseId } = req.params;
    const { reason, escalatedTo } = req.body;

    const caseResult = await caseManagementService.escalateCase(caseId, reason, escalatedTo);

    if (!caseResult) {
      return res.status(404).json({
        success: false,
        error: 'Case not found'
      });
    }

    res.json({
      success: true,
      data: caseResult,
      message: 'Case escalated successfully'
    });
  } catch (error) {
    next(error);
  }
};
