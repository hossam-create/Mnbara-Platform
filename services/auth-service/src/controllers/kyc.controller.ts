/**
 * KYC Controller
 * Requirements: 16.1, 16.2, 16.3 - KYC verification endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { kycService, DocumentType } from '../services/kyc.service';

/**
 * Submit KYC verification
 * POST /api/kyc/submit
 */
export async function submitKYC(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      address,
      documentType,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !documentType || !documentFrontUrl || !selfieUrl) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['firstName', 'lastName', 'dateOfBirth', 'documentType', 'documentFrontUrl', 'selfieUrl'],
      });
    }

    // Validate document type
    if (!Object.values(DocumentType).includes(documentType)) {
      return res.status(400).json({
        error: 'Invalid document type',
        validTypes: Object.values(DocumentType),
      });
    }

    const result = await kycService.createSubmission({
      userId: userId.toString(),
      firstName,
      lastName,
      dateOfBirth,
      email: email || req.user?.email,
      address,
      documentType,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
    });

    res.status(201).json({
      message: 'KYC submission created successfully',
      submissionId: result.submissionId,
      sdkToken: result.sdkToken,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get KYC submission status
 * GET /api/kyc/status/:submissionId
 */
export async function getKYCStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { submissionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = await kycService.getSubmissionStatus(submissionId);

    res.json(status);
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user's KYC status
 * GET /api/kyc/me
 */
export async function getMyKYCStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's latest KYC submission
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const submission = await prisma.kycVerification.findFirst({
      where: { userId: parseInt(userId.toString()) },
      orderBy: { submittedAt: 'desc' },
    });

    if (!submission) {
      return res.json({
        status: 'NOT_STARTED',
        message: 'No KYC submission found',
      });
    }

    const status = await kycService.getSubmissionStatus(submission.id.toString());

    res.json({
      submissionId: submission.id.toString(),
      ...status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle Onfido webhook
 * POST /api/kyc/webhook
 */
export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-sha2-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }

    await kycService.handleWebhook(req.body, signature);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent retries for invalid signatures
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
}

/**
 * Admin: Get pending KYC submissions
 * GET /api/admin/kyc/pending
 */
export async function getPendingSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await kycService.getPendingSubmissions(page, limit);

    res.json({
      data: result.submissions,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Approve KYC submission
 * POST /api/admin/kyc/:submissionId/approve
 */
export async function approveKYC(req: Request, res: Response, next: NextFunction) {
  try {
    const { submissionId } = req.params;
    const adminId = req.user?.id;
    const { notes } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await kycService.adminApprove(submissionId, adminId.toString(), notes);

    res.json({
      message: 'KYC submission approved successfully',
      submissionId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Reject KYC submission
 * POST /api/admin/kyc/:submissionId/reject
 */
export async function rejectKYC(req: Request, res: Response, next: NextFunction) {
  try {
    const { submissionId } = req.params;
    const adminId = req.user?.id;
    const { reason } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    await kycService.adminReject(submissionId, adminId.toString(), reason);

    res.json({
      message: 'KYC submission rejected',
      submissionId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get supported document types
 * GET /api/kyc/document-types
 */
export async function getDocumentTypes(req: Request, res: Response) {
  res.json({
    documentTypes: Object.values(DocumentType).map((type) => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      requiresBack: type !== DocumentType.PASSPORT,
    })),
  });
}
