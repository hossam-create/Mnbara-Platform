import { Pool } from 'pg';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import {
  VerificationLevel,
  DocumentType,
  VerificationStatus,
  VerificationDocument,
  PhoneVerification,
  EmailVerification,
  UserVerificationStatus,
  VerificationCheckResult,
  VERIFICATION_LIMITS,
  PAYOUT_VERIFICATION_THRESHOLD,
} from '../types/kyc.types';
import { FileStorageService } from './storage/FileStorageService';

export class KYCService {
  private db: Pool;
  private storageService: FileStorageService;

  constructor(db: Pool, storageService: FileStorageService) {
    this.db = db;
    this.storageService = storageService;
  }

  /**
   * Get user verification status
   */
  async getUserVerificationStatus(userId: number): Promise<UserVerificationStatus> {
    try {
      const result = await this.db.query(
        `SELECT 
          verification_level,
          email_verified,
          phone_verified,
          id_verified
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      const verificationLevel = user.verification_level as VerificationLevel;
      const transactionLimit = VERIFICATION_LIMITS[verificationLevel];
      const canRequestPayout = verificationLevel !== VerificationLevel.UNVERIFIED;

      return {
        userId,
        verificationLevel,
        emailVerified: user.email_verified,
        phoneVerified: user.phone_verified,
        idVerified: user.id_verified,
        transactionLimit,
        canRequestPayout,
      };
    } catch (error) {
      logger.error('Failed to get user verification status', { error, userId });
      throw error;
    }
  }

  /**
   * Check if transaction amount is allowed for user's verification level
   */
  async checkTransactionLimit(
    userId: number,
    amount: number
  ): Promise<VerificationCheckResult> {
    try {
      const status = await this.getUserVerificationStatus(userId);

      if (amount <= status.transactionLimit) {
        return {
          allowed: true,
          currentLevel: status.verificationLevel,
          currentLimit: status.transactionLimit,
          requestedAmount: amount,
        };
      }

      // Determine required level
      let requiredLevel: VerificationLevel = VerificationLevel.EMAIL_VERIFIED;
      if (amount > VERIFICATION_LIMITS[VerificationLevel.PHONE_VERIFIED]) {
        requiredLevel = VerificationLevel.ID_VERIFIED;
      } else if (amount > VERIFICATION_LIMITS[VerificationLevel.EMAIL_VERIFIED]) {
        requiredLevel = VerificationLevel.PHONE_VERIFIED;
      }

      return {
        allowed: false,
        currentLevel: status.verificationLevel,
        currentLimit: status.transactionLimit,
        requestedAmount: amount,
        requiredLevel,
        message: `Transaction amount ($${amount}) exceeds your current limit ($${status.transactionLimit}). Please upgrade to ${requiredLevel} level.`,
      };
    } catch (error) {
      logger.error('Failed to check transaction limit', { error, userId, amount });
      throw error;
    }
  }

  /**
   * Check if user can request payout
   */
  async checkPayoutEligibility(
    userId: number,
    amount: number
  ): Promise<VerificationCheckResult> {
    try {
      const status = await this.getUserVerificationStatus(userId);

      // Unverified users cannot request payouts
      if (status.verificationLevel === VerificationLevel.UNVERIFIED) {
        return {
          allowed: false,
          currentLevel: status.verificationLevel,
          currentLimit: status.transactionLimit,
          requestedAmount: amount,
          requiredLevel: VerificationLevel.EMAIL_VERIFIED,
          message: 'You must verify your email before requesting payouts.',
        };
      }

      // Payouts > $100 require ID verification
      if (amount > PAYOUT_VERIFICATION_THRESHOLD && !status.idVerified) {
        return {
          allowed: false,
          currentLevel: status.verificationLevel,
          currentLimit: status.transactionLimit,
          requestedAmount: amount,
          requiredLevel: VerificationLevel.ID_VERIFIED,
          message: `Payouts over $${PAYOUT_VERIFICATION_THRESHOLD} require ID verification.`,
        };
      }

      // Check transaction limit
      return this.checkTransactionLimit(userId, amount);
    } catch (error) {
      logger.error('Failed to check payout eligibility', { error, userId, amount });
      throw error;
    }
  }

  /**
   * Upload ID document
   */
  async uploadIdDocument(
    userId: number,
    documentType: DocumentType,
    frontImage: Express.Multer.File,
    backImage?: Express.Multer.File
  ): Promise<VerificationDocument> {
    try {
      // Upload images to storage
      const frontImageUrl = await this.storageService.uploadFile(
        frontImage,
        `kyc/${userId}/front_${Date.now()}_${frontImage.originalname}`
      );

      let backImageUrl: string | undefined;
      if (backImage) {
        backImageUrl = await this.storageService.uploadFile(
          backImage,
          `kyc/${userId}/back_${Date.now()}_${backImage.originalname}`
        );
      }

      // Create verification document record
      const result = await this.db.query(
        `INSERT INTO verification_documents 
         (user_id, document_type, front_image_url, back_image_url, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, documentType, frontImageUrl, backImageUrl, VerificationStatus.PENDING]
      );

      const document = this.mapDocumentRow(result.rows[0]);

      logger.info('ID document uploaded', {
        userId,
        documentId: document.id,
        documentType,
      });

      return document;
    } catch (error) {
      logger.error('Failed to upload ID document', { error, userId, documentType });
      throw error;
    }
  }

  /**
   * Get pending verification documents (Admin)
   */
  async getPendingVerifications(limit: number = 50): Promise<VerificationDocument[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM verification_documents 
         WHERE status = $1 
         ORDER BY uploaded_at ASC 
         LIMIT $2`,
        [VerificationStatus.PENDING, limit]
      );

      return result.rows.map(this.mapDocumentRow);
    } catch (error) {
      logger.error('Failed to get pending verifications', { error });
      throw error;
    }
  }

  /**
   * Get user's verification documents
   */
  async getUserDocuments(userId: number): Promise<VerificationDocument[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM verification_documents 
         WHERE user_id = $1 
         ORDER BY uploaded_at DESC`,
        [userId]
      );

      return result.rows.map(this.mapDocumentRow);
    } catch (error) {
      logger.error('Failed to get user documents', { error, userId });
      throw error;
    }
  }

  /**
   * Approve ID verification (Admin)
   */
  async approveIdVerification(
    documentId: number,
    reviewedBy: number
  ): Promise<VerificationDocument> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Update document status
      const docResult = await client.query(
        `UPDATE verification_documents 
         SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
         WHERE id = $3
         RETURNING *`,
        [VerificationStatus.APPROVED, reviewedBy, documentId]
      );

      if (docResult.rows.length === 0) {
        throw new Error('Document not found');
      }

      const document = this.mapDocumentRow(docResult.rows[0]);

      // Update user verification level
      await client.query(
        `UPDATE users 
         SET id_verified = TRUE, verification_level = $1
         WHERE id = $2`,
        [VerificationLevel.ID_VERIFIED, document.userId]
      );

      await client.query('COMMIT');

      logger.info('ID verification approved', {
        documentId,
        userId: document.userId,
        reviewedBy,
      });

      return document;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to approve ID verification', { error, documentId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reject ID verification (Admin)
   */
  async rejectIdVerification(
    documentId: number,
    reviewedBy: number,
    rejectionReason: string
  ): Promise<VerificationDocument> {
    try {
      const result = await this.db.query(
        `UPDATE verification_documents 
         SET status = $1, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2, rejection_reason = $3
         WHERE id = $4
         RETURNING *`,
        [VerificationStatus.REJECTED, reviewedBy, rejectionReason, documentId]
      );

      if (result.rows.length === 0) {
        throw new Error('Document not found');
      }

      const document = this.mapDocumentRow(result.rows[0]);

      logger.info('ID verification rejected', {
        documentId,
        userId: document.userId,
        reviewedBy,
        reason: rejectionReason,
      });

      return document;
    } catch (error) {
      logger.error('Failed to reject ID verification', { error, documentId });
      throw error;
    }
  }

  /**
   * Send phone verification OTP
   */
  async sendPhoneVerificationOTP(
    userId: number,
    phoneNumber: string
  ): Promise<PhoneVerification> {
    try {
      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      const result = await this.db.query(
        `INSERT INTO phone_verifications 
         (user_id, phone_number, otp, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, phoneNumber, otp, expiresAt]
      );

      // TODO: Send OTP via Twilio SMS
      // await this.twilioService.sendSMS(phoneNumber, `Your verification code is: ${otp}`);

      logger.info('Phone verification OTP sent', {
        userId,
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask phone number
      });

      // For development, log OTP (remove in production)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Development OTP', { otp });
      }

      return this.mapPhoneVerificationRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to send phone verification OTP', { error, userId });
      throw error;
    }
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOTP(
    userId: number,
    phoneNumber: string,
    otp: string
  ): Promise<boolean> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Get latest OTP for this user and phone
      const result = await client.query(
        `SELECT * FROM phone_verifications 
         WHERE user_id = $1 AND phone_number = $2 AND verified = FALSE
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId, phoneNumber]
      );

      if (result.rows.length === 0) {
        throw new Error('No verification request found');
      }

      const verification = this.mapPhoneVerificationRow(result.rows[0]);

      // Check if expired
      if (new Date() > verification.expiresAt) {
        throw new Error('OTP has expired');
      }

      // Check attempts
      if (verification.attempts >= 3) {
        throw new Error('Maximum verification attempts exceeded');
      }

      // Increment attempts
      await client.query(
        `UPDATE phone_verifications 
         SET attempts = attempts + 1 
         WHERE id = $1`,
        [verification.id]
      );

      // Check OTP
      if (verification.otp !== otp) {
        await client.query('COMMIT');
        return false;
      }

      // Mark as verified
      await client.query(
        `UPDATE phone_verifications 
         SET verified = TRUE 
         WHERE id = $1`,
        [verification.id]
      );

      // Update user verification level
      const userResult = await client.query(
        `SELECT verification_level FROM users WHERE id = $1`,
        [userId]
      );

      const currentLevel = userResult.rows[0].verification_level;
      let newLevel = VerificationLevel.PHONE_VERIFIED;

      // Don't downgrade if already ID verified
      if (currentLevel === VerificationLevel.ID_VERIFIED) {
        newLevel = VerificationLevel.ID_VERIFIED;
      }

      await client.query(
        `UPDATE users 
         SET phone_verified = TRUE, verification_level = $1, phone_number = $2
         WHERE id = $3`,
        [newLevel, phoneNumber, userId]
      );

      await client.query('COMMIT');

      logger.info('Phone verification successful', { userId, phoneNumber });

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to verify phone OTP', { error, userId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Send email verification token
   */
  async sendEmailVerificationToken(userId: number, email: string): Promise<EmailVerification> {
    try {
      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store token in database
      const result = await this.db.query(
        `INSERT INTO email_verifications 
         (user_id, email, token, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, email, token, expiresAt]
      );

      // TODO: Send verification email
      // await this.emailService.sendVerificationEmail(email, token);

      logger.info('Email verification token sent', { userId, email });

      return this.mapEmailVerificationRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to send email verification token', { error, userId });
      throw error;
    }
  }

  /**
   * Verify email token
   */
  async verifyEmailToken(token: string): Promise<boolean> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Get verification record
      const result = await client.query(
        `SELECT * FROM email_verifications 
         WHERE token = $1 AND verified = FALSE`,
        [token]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid verification token');
      }

      const verification = this.mapEmailVerificationRow(result.rows[0]);

      // Check if expired
      if (new Date() > verification.expiresAt) {
        throw new Error('Verification token has expired');
      }

      // Mark as verified
      await client.query(
        `UPDATE email_verifications 
         SET verified = TRUE 
         WHERE id = $1`,
        [verification.userId]
      );

      // Update user verification level
      const userResult = await client.query(
        `SELECT verification_level FROM users WHERE id = $1`,
        [verification.userId]
      );

      const currentLevel = userResult.rows[0].verification_level;
      let newLevel = VerificationLevel.EMAIL_VERIFIED;

      // Don't downgrade if already at higher level
      if (
        currentLevel === VerificationLevel.PHONE_VERIFIED ||
        currentLevel === VerificationLevel.ID_VERIFIED
      ) {
        newLevel = currentLevel;
      }

      await client.query(
        `UPDATE users 
         SET email_verified = TRUE, verification_level = $1
         WHERE id = $2`,
        [newLevel, verification.userId]
      );

      await client.query('COMMIT');

      logger.info('Email verification successful', { userId: verification.userId });

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to verify email token', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Map database row to VerificationDocument
   */
  private mapDocumentRow(row: any): VerificationDocument {
    return {
      id: row.id,
      userId: row.user_id,
      documentType: row.document_type as DocumentType,
      frontImageUrl: row.front_image_url,
      backImageUrl: row.back_image_url,
      status: row.status as VerificationStatus,
      uploadedAt: row.uploaded_at,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
      rejectionReason: row.rejection_reason,
      metadata: row.metadata,
    };
  }

  /**
   * Map database row to PhoneVerification
   */
  private mapPhoneVerificationRow(row: any): PhoneVerification {
    return {
      userId: row.user_id,
      phoneNumber: row.phone_number,
      otp: row.otp,
      expiresAt: row.expires_at,
      attempts: row.attempts,
      verified: row.verified,
    };
  }

  /**
   * Map database row to EmailVerification
   */
  private mapEmailVerificationRow(row: any): EmailVerification {
    return {
      userId: row.user_id,
      email: row.email,
      token: row.token,
      expiresAt: row.expires_at,
      verified: row.verified,
    };
  }
}
