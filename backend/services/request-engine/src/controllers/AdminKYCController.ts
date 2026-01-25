import { Request, Response } from 'express';
import { KYCService } from '../services/KYCService';
import { logger } from '../utils/logger';

export class AdminKYCController {
  private kycService: KYCService;

  constructor(kycService: KYCService) {
    this.kycService = kycService;
  }

  /**
   * Get pending verifications
   */
  getPendingVerifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const documents = await this.kycService.getPendingVerifications(limit);

      res.json({
        success: true,
        data: documents,
        count: documents.length,
      });
    } catch (error) {
      logger.error('Get pending verifications failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get pending verifications',
      });
    }
  };

  /**
   * Get user's verification documents
   */
  getUserDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
        });
        return;
      }

      const documents = await this.kycService.getUserDocuments(userId);

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      logger.error('Get user documents failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get user documents',
      });
    }
  };

  /**
   * Approve ID verification
   */
  approveVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const documentId = parseInt(req.params.id);
      const reviewedBy = (req as any).user.id;

      if (isNaN(documentId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid document ID',
        });
        return;
      }

      const document = await this.kycService.approveIdVerification(documentId, reviewedBy);

      res.json({
        success: true,
        message: 'Verification approved successfully',
        data: document,
      });
    } catch (error) {
      logger.error('Approve verification failed', { error });

      if (error instanceof Error && error.message === 'Document not found') {
        res.status(404).json({
          success: false,
          error: 'Document not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to approve verification',
      });
    }
  };

  /**
   * Reject ID verification
   */
  rejectVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const documentId = parseInt(req.params.id);
      const reviewedBy = (req as any).user.id;
      const { rejectionReason } = req.body;

      if (isNaN(documentId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid document ID',
        });
        return;
      }

      if (!rejectionReason) {
        res.status(400).json({
          success: false,
          error: 'Rejection reason is required',
        });
        return;
      }

      const document = await this.kycService.rejectIdVerification(
        documentId,
        reviewedBy,
        rejectionReason
      );

      res.json({
        success: true,
        message: 'Verification rejected',
        data: document,
      });
    } catch (error) {
      logger.error('Reject verification failed', { error });

      if (error instanceof Error && error.message === 'Document not found') {
        res.status(404).json({
          success: false,
          error: 'Document not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to reject verification',
      });
    }
  };

  /**
   * Get user verification status
   */
  getUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user ID',
        });
        return;
      }

      const status = await this.kycService.getUserVerificationStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Get user status failed', { error });

      if (error instanceof Error && error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get user status',
      });
    }
  };
}
