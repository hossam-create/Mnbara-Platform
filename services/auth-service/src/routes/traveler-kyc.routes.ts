/**
 * Traveler Full KYC Routes
 * 
 * Purpose: Trust, fraud prevention, dispute resolution ONLY
 * NO payments, NO wallets, NO FX, NO financial execution
 * 
 * Access Control:
 * - Unverified travelers are HARD-BLOCKED from viewing/accepting requests
 * - Human review required for all approvals
 */

import { Router, Request, Response, NextFunction } from 'express';
import { travelerKycService } from '../services/traveler-kyc.service';
import { authenticate } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import {
  TravelerDocumentType,
  CreateTravelerKycRequest,
  UpdateTravelerKycRequest,
  SendPhoneOtpRequest,
  VerifyPhoneOtpRequest,
  AdminReviewRequest,
  AdminDocumentReviewRequest,
} from '../types/traveler-kyc.types';

const router = Router();

// ============================================
// MIDDLEWARE: Extract client info
// ============================================
function extractClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'],
    deviceFingerprint: req.headers['x-device-fingerprint'] as string | undefined,
  };
}

// ============================================
// USER ROUTES (Authenticated)
// ============================================

/**
 * Create or get KYC application
 * POST /api/traveler-kyc/application
 */
router.post('/application', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const clientInfo = extractClientInfo(req);

    const data: CreateTravelerKycRequest = {
      email: (req as any).user.email,
      ipAddress: clientInfo.ipAddress,
      deviceFingerprint: clientInfo.deviceFingerprint,
      userAgent: clientInfo.userAgent,
    };

    const application = await travelerKycService.createApplication(userId, data);
    res.status(201).json({ data: application });
  } catch (error: any) {
    if (error.message.includes('already')) {
      // Return existing application
      try {
        const userId = (req as any).user.id;
        const response = await travelerKycService.getApplicationResponse(userId);
        res.json({ data: response });
      } catch {
        next(error);
      }
    } else {
      next(error);
    }
  }
});

/**
 * Get current application status
 * GET /api/traveler-kyc/application
 */
router.get('/application', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const response = await travelerKycService.getApplicationResponse(userId);
    res.json({ data: response });
  } catch (error: any) {
    if (error.message === 'KYC application not found') {
      res.status(404).json({ error: { message: 'No KYC application found. Please create one first.' } });
    } else {
      next(error);
    }
  }
});

/**
 * Update application information
 * PATCH /api/traveler-kyc/application
 */
router.patch('/application', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const clientInfo = extractClientInfo(req);
    const data: UpdateTravelerKycRequest = req.body;

    const application = await travelerKycService.updateApplication(userId, data, clientInfo.ipAddress);
    const response = await travelerKycService.getApplicationResponse(userId);
    res.json({ data: response });
  } catch (error) {
    next(error);
  }
});

/**
 * Submit application for review
 * POST /api/traveler-kyc/application/submit
 */
router.post('/application/submit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const clientInfo = extractClientInfo(req);

    await travelerKycService.submitApplication(userId, clientInfo.ipAddress);
    const response = await travelerKycService.getApplicationResponse(userId);
    res.json({ data: response, message: 'Application submitted for review' });
  } catch (error) {
    next(error);
  }
});

/**
 * Check traveler access status (for blocking)
 * GET /api/traveler-kyc/status
 */
router.get('/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const status = await travelerKycService.checkTravelerAccess(userId);
    res.json({ data: status });
  } catch (error) {
    next(error);
  }
});


// ============================================
// DOCUMENT ROUTES
// ============================================

/**
 * Upload document
 * POST /api/traveler-kyc/documents
 * 
 * Body (multipart/form-data):
 * - file: The document file
 * - documentType: PASSPORT | BIOMETRIC_SELFIE | FLIGHT_TICKET | PROOF_OF_ADDRESS
 * - Additional metadata based on document type
 */
router.post('/documents', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const clientInfo = extractClientInfo(req);

    // Note: In production, use multer or similar for file upload handling
    // This is a simplified version
    const { documentType, ...metadata } = req.body;

    if (!documentType || !Object.values(TravelerDocumentType).includes(documentType)) {
      return res.status(400).json({
        error: { message: 'Invalid document type' },
      });
    }

    // Mock file for now - in production, this comes from multer
    const file = (req as any).file || {
      buffer: Buffer.from('mock'),
      originalname: 'document.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
    };

    const document = await travelerKycService.uploadDocument(userId, {
      documentType,
      file,
      ...metadata,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    });

    res.status(201).json({ data: document, message: 'Document uploaded successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// PHONE VERIFICATION ROUTES
// ============================================

/**
 * Send OTP to phone
 * POST /api/traveler-kyc/phone/send-otp
 */
router.post('/phone/send-otp', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const data: SendPhoneOtpRequest = req.body;

    if (!data.phoneNumber || !data.phoneType || !data.countryCode) {
      return res.status(400).json({
        error: { message: 'phoneNumber, phoneType, and countryCode are required' },
      });
    }

    if (!['local', 'foreign'].includes(data.phoneType)) {
      return res.status(400).json({
        error: { message: 'phoneType must be "local" or "foreign"' },
      });
    }

    const result = await travelerKycService.sendPhoneOtp(userId, data);
    res.json({
      data: result,
      message: `OTP sent to ${data.phoneType} phone`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Verify phone OTP
 * POST /api/traveler-kyc/phone/verify-otp
 */
router.post('/phone/verify-otp', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const clientInfo = extractClientInfo(req);
    const { phoneNumber, phoneType, otp } = req.body;

    if (!phoneNumber || !phoneType || !otp) {
      return res.status(400).json({
        error: { message: 'phoneNumber, phoneType, and otp are required' },
      });
    }

    const data: VerifyPhoneOtpRequest = {
      phoneNumber,
      phoneType,
      otp,
      ipAddress: clientInfo.ipAddress,
    };

    const result = await travelerKycService.verifyPhoneOtp(userId, data);
    res.json({
      data: result,
      message: `${phoneType} phone verified successfully`,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// ADMIN ROUTES (Requires KYC manage permission)
// ============================================

/**
 * Get pending applications
 * GET /api/traveler-kyc/admin/pending
 */
router.get(
  '/admin/pending',
  authenticate,
  checkPermission('kyc', 'manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = await travelerKycService.adminGetPendingApplications(page, pageSize);
      res.json({
        data: result.applications,
        meta: {
          total: result.total,
          page,
          pageSize,
          totalPages: Math.ceil(result.total / pageSize),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Start review of application
 * POST /api/traveler-kyc/admin/:applicationId/start-review
 */
router.post(
  '/admin/:applicationId/start-review',
  authenticate,
  checkPermission('kyc', 'manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const adminId = (req as any).user.id;
      const clientInfo = extractClientInfo(req);

      const application = await travelerKycService.adminStartReview(
        applicationId,
        adminId,
        clientInfo.ipAddress
      );

      res.json({ data: application, message: 'Review started' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Review application (approve/reject)
 * POST /api/traveler-kyc/admin/:applicationId/review
 * 
 * HUMAN DECISION REQUIRED - No automation
 */
router.post(
  '/admin/:applicationId/review',
  authenticate,
  checkPermission('kyc', 'manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const adminId = (req as any).user.id;
      const clientInfo = extractClientInfo(req);
      const data: AdminReviewRequest = req.body;

      if (!data.action || !['approve', 'reject'].includes(data.action)) {
        return res.status(400).json({
          error: { message: 'action must be "approve" or "reject"' },
        });
      }

      const application = await travelerKycService.adminReviewApplication(
        applicationId,
        adminId,
        data,
        clientInfo.ipAddress
      );

      res.json({
        data: application,
        message: `Application ${data.action}d`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Review document (approve/reject)
 * POST /api/traveler-kyc/admin/documents/:documentId/review
 * 
 * HUMAN DECISION REQUIRED - No automation
 */
router.post(
  '/admin/documents/:documentId/review',
  authenticate,
  checkPermission('kyc', 'manage'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const adminId = (req as any).user.id;
      const clientInfo = extractClientInfo(req);
      const data: AdminDocumentReviewRequest = req.body;

      if (!data.action || !['approve', 'reject'].includes(data.action)) {
        return res.status(400).json({
          error: { message: 'action must be "approve" or "reject"' },
        });
      }

      const document = await travelerKycService.adminReviewDocument(
        documentId,
        adminId,
        data,
        clientInfo.ipAddress
      );

      res.json({
        data: document,
        message: `Document ${data.action}d`,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// ERROR HANDLER
// ============================================
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Traveler KYC Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    error: {
      message,
      code: error.code || 'TRAVELER_KYC_ERROR',
    },
  });
});

export default router;
