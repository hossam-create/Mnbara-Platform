import { Request, Response } from 'express';
import { KYCService } from '../services/KYCService';
import { DocumentType } from '../types/kyc.types';
import { logger } from '../utils/logger';
import { getUpgradePrompt } from '../middleware/kycVerification';

export class KYCController {
  private kycService: KYCService;

  constructor(kycService: KYCService) {
    this.kycService = kycService;
  }

  /**
   * Get user verification status
   */
  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;

      const status = await this.kycService.getUserVerificationStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Get verification status failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get verification status',
      });
    }
  };

  /**
   * Upload ID document
   */
  uploadId = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { documentType } = req.body;

      if (!req.files || !('frontImage' in req.files)) {
        res.status(400).json({
          success: false,
          error: 'Front image is required',
        });
        return;
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const frontImage = files.frontImage[0];
      const backImage = files.backImage ? files.backImage[0] : undefined;

      // Validate document type
      if (!Object.values(DocumentType).includes(documentType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid document type',
        });
        return;
      }

      const document = await this.kycService.uploadIdDocument(
        userId,
        documentType as DocumentType,
        frontImage,
        backImage
      );

      res.json({
        success: true,
        message: 'ID document uploaded successfully. It will be reviewed by our team.',
        data: document,
      });
    } catch (error) {
      logger.error('Upload ID failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to upload ID document',
      });
    }
  };

  /**
   * Get user's verification documents
   */
  getDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;

      const documents = await this.kycService.getUserDocuments(userId);

      res.json({
        success: true,
        data: documents,
      });
    } catch (error) {
      logger.error('Get documents failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get documents',
      });
    }
  };

  /**
   * Send phone verification OTP
   */
  verifyPhone = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          error: 'Phone number is required',
        });
        return;
      }

      await this.kycService.sendPhoneVerificationOTP(userId, phoneNumber);

      res.json({
        success: true,
        message: 'Verification code sent to your phone',
      });
    } catch (error) {
      logger.error('Send phone OTP failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send verification code',
      });
    }
  };

  /**
   * Confirm phone verification OTP
   */
  confirmPhone = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber || !otp) {
        res.status(400).json({
          success: false,
          error: 'Phone number and OTP are required',
        });
        return;
      }

      const verified = await this.kycService.verifyPhoneOTP(userId, phoneNumber, otp);

      if (!verified) {
        res.status(400).json({
          success: false,
          error: 'Invalid verification code',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Phone verified successfully',
      });
    } catch (error) {
      logger.error('Confirm phone OTP failed', { error });
      
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          res.status(400).json({
            success: false,
            error: 'Verification code has expired',
          });
          return;
        }
        if (error.message.includes('attempts')) {
          res.status(429).json({
            success: false,
            error: 'Maximum verification attempts exceeded',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to verify phone',
      });
    }
  };

  /**
   * Send email verification
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required',
        });
        return;
      }

      await this.kycService.sendEmailVerificationToken(userId, email);

      res.json({
        success: true,
        message: 'Verification email sent',
      });
    } catch (error) {
      logger.error('Send email verification failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to send verification email',
      });
    }
  };

  /**
   * Confirm email verification
   */
  confirmEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Verification token is required',
        });
        return;
      }

      const verified = await this.kycService.verifyEmailToken(token);

      if (!verified) {
        res.status(400).json({
          success: false,
          error: 'Invalid verification token',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      logger.error('Confirm email verification failed', { error });

      if (error instanceof Error && error.message.includes('expired')) {
        res.status(400).json({
          success: false,
          error: 'Verification token has expired',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to verify email',
      });
    }
  };

  /**
   * Get upgrade prompt
   */
  getUpgrade = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { targetLevel } = req.query;

      const status = await this.kycService.getUserVerificationStatus(userId);

      if (!targetLevel) {
        // Return general upgrade information
        res.json({
          success: true,
          data: {
            currentLevel: status.verificationLevel,
            currentLimit: status.transactionLimit,
            availableUpgrades: [
              {
                level: 'EMAIL_VERIFIED',
                limit: 500,
                steps: ['Verify your email address'],
              },
              {
                level: 'PHONE_VERIFIED',
                limit: 1000,
                steps: ['Verify your email address', 'Verify your phone number'],
              },
              {
                level: 'ID_VERIFIED',
                limit: 5000,
                steps: [
                  'Verify your email address',
                  'Verify your phone number',
                  'Upload your ID document',
                ],
              },
            ],
          },
        });
        return;
      }

      const prompt = getUpgradePrompt(status.verificationLevel, targetLevel as any);

      res.json({
        success: true,
        data: prompt,
      });
    } catch (error) {
      logger.error('Get upgrade prompt failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get upgrade information',
      });
    }
  };
}
