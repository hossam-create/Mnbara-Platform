/**
 * Traveler Full KYC Service
 * 
 * Purpose: Trust, fraud prevention, dispute resolution ONLY
 * NO payments, NO wallets, NO FX, NO financial execution
 * 
 * Constraints:
 * - Deterministic logic only
 * - No automation decisions
 * - Human review required for approval
 * - GDPR-style data minimization
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  TravelerKycStatus,
  TravelerDocumentType,
  TravelerDocumentStatus,
  TravelerKycAuditAction,
  TravelerKycApplication,
  TravelerKycDocument,
  CreateTravelerKycRequest,
  UpdateTravelerKycRequest,
  UploadDocumentRequest,
  SendPhoneOtpRequest,
  VerifyPhoneOtpRequest,
  AdminReviewRequest,
  AdminDocumentReviewRequest,
  TravelerKycApplicationResponse,
  TravelerKycStatusResponse,
  isValidStatusTransition,
  isReadyForSubmission,
  REQUIRED_DOCUMENTS,
} from '../types/traveler-kyc.types';

const prisma = new PrismaClient();

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_RATE_LIMIT_MINUTES = 1;
const MAX_OTP_SENDS_PER_HOUR = 5;

/**
 * Generate application number
 */
function generateApplicationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TKC-${timestamp}-${random}`;
}

/**
 * Generate OTP
 */
function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash OTP for storage
 */
function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Calculate completion progress
 */
function calculateProgress(application: TravelerKycApplication): number {
  let completed = 0;
  const total = 10;

  if (application.fullLegalName) completed++;
  if (application.dateOfBirth) completed++;
  if (application.localPhoneVerified) completed++;
  if (application.foreignPhoneVerified) completed++;
  if (application.addressLine1 && application.city && application.country) completed++;
  if (application.emergencyContactName && application.emergencyContactPhone) completed++;
  if (application.travelDateFrom && application.travelDateTo) completed++;

  // Documents
  const docs = application.documents || [];
  if (docs.some(d => d.documentType === TravelerDocumentType.PASSPORT)) completed++;
  if (docs.some(d => d.documentType === TravelerDocumentType.BIOMETRIC_SELFIE)) completed++;
  if (docs.some(d => d.documentType === TravelerDocumentType.FLIGHT_TICKET)) completed++;

  return Math.round((completed / total) * 100);
}

export class TravelerKycService {
  // ============================================
  // APPLICATION MANAGEMENT
  // ============================================

  /**
   * Create new KYC application
   */
  async createApplication(
    userId: number,
    data: CreateTravelerKycRequest
  ): Promise<TravelerKycApplication> {
    // Check if user already has an application
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id, status FROM "TravelerKycApplication" WHERE "userId" = ${userId}
    `;

    if (existing.length > 0) {
      const app = existing[0];
      if (app.status === TravelerKycStatus.VERIFIED) {
        throw new Error('User already has verified KYC');
      }
      // Return existing application if in DRAFT or REJECTED
      if (app.status === TravelerKycStatus.DRAFT || app.status === TravelerKycStatus.REJECTED) {
        return this.getApplication(userId);
      }
      throw new Error('KYC application already in progress');
    }

    const applicationNumber = generateApplicationNumber();

    await prisma.$executeRaw`
      INSERT INTO "TravelerKycApplication" (
        "userId", "applicationNumber", "status", "email",
        "ipAddress", "deviceFingerprint", "userAgent",
        "createdAt", "updatedAt"
      ) VALUES (
        ${userId}, ${applicationNumber}, 'DRAFT', ${data.email},
        ${data.ipAddress}, ${data.deviceFingerprint || null}, ${data.userAgent || null},
        NOW(), NOW()
      )
    `;

    // Log audit
    await this.logAudit({
      applicationId: 0, // Will be updated
      userId,
      action: TravelerKycAuditAction.APPLICATION_CREATED,
      description: `KYC application created: ${applicationNumber}`,
      actorId: userId,
      actorIp: data.ipAddress,
      actorUserAgent: data.userAgent,
      metadata: { applicationNumber },
    });

    return this.getApplication(userId);
  }


  /**
   * Get application by user ID
   */
  async getApplication(userId: number): Promise<TravelerKycApplication> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerKycApplication" WHERE "userId" = ${userId}
    `;

    if (results.length === 0) {
      throw new Error('KYC application not found');
    }

    const app = results[0];

    // Get documents
    const documents = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerKycDocument" 
      WHERE "applicationId" = ${app.id} AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
    `;

    return {
      ...app,
      documents,
    };
  }

  /**
   * Update application
   */
  async updateApplication(
    userId: number,
    data: UpdateTravelerKycRequest,
    actorIp?: string
  ): Promise<TravelerKycApplication> {
    const app = await this.getApplication(userId);

    // Can only update in DRAFT or REJECTED status
    if (app.status !== TravelerKycStatus.DRAFT && app.status !== TravelerKycStatus.REJECTED) {
      throw new Error('Cannot update application in current status');
    }

    const previousState = { ...app };

    await prisma.$executeRaw`
      UPDATE "TravelerKycApplication" SET
        "fullLegalName" = COALESCE(${data.fullLegalName}, "fullLegalName"),
        "dateOfBirth" = COALESCE(${data.dateOfBirth ? new Date(data.dateOfBirth) : null}, "dateOfBirth"),
        "nationality" = COALESCE(${data.nationality}, "nationality"),
        "addressLine1" = COALESCE(${data.addressLine1}, "addressLine1"),
        "addressLine2" = COALESCE(${data.addressLine2}, "addressLine2"),
        "city" = COALESCE(${data.city}, "city"),
        "stateProvince" = COALESCE(${data.stateProvince}, "stateProvince"),
        "postalCode" = COALESCE(${data.postalCode}, "postalCode"),
        "country" = COALESCE(${data.country}, "country"),
        "emergencyContactName" = COALESCE(${data.emergencyContactName}, "emergencyContactName"),
        "emergencyContactPhone" = COALESCE(${data.emergencyContactPhone}, "emergencyContactPhone"),
        "emergencyContactRelation" = COALESCE(${data.emergencyContactRelation}, "emergencyContactRelation"),
        "travelDateFrom" = COALESCE(${data.travelDateFrom ? new Date(data.travelDateFrom) : null}, "travelDateFrom"),
        "travelDateTo" = COALESCE(${data.travelDateTo ? new Date(data.travelDateTo) : null}, "travelDateTo"),
        "departureDate" = COALESCE(${data.departureDate ? new Date(data.departureDate) : null}, "departureDate"),
        "returnDate" = COALESCE(${data.returnDate ? new Date(data.returnDate) : null}, "returnDate"),
        "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;

    // Reset status to DRAFT if was REJECTED
    if (app.status === TravelerKycStatus.REJECTED) {
      await prisma.$executeRaw`
        UPDATE "TravelerKycApplication" SET "status" = 'DRAFT' WHERE "userId" = ${userId}
      `;
    }

    await this.logAudit({
      applicationId: app.id,
      userId,
      action: TravelerKycAuditAction.APPLICATION_UPDATED,
      description: 'Application information updated',
      actorId: userId,
      actorIp,
      previousState,
      newState: data as unknown as Record<string, unknown>,
    });

    return this.getApplication(userId);
  }

  /**
   * Submit application for review
   */
  async submitApplication(userId: number, actorIp?: string): Promise<TravelerKycApplication> {
    const app = await this.getApplication(userId);

    // Validate status transition
    if (!isValidStatusTransition(app.status, TravelerKycStatus.SUBMITTED)) {
      throw new Error(`Cannot submit application from ${app.status} status`);
    }

    // Check if ready for submission
    const { ready, missing } = isReadyForSubmission(app);
    if (!ready) {
      throw new Error(`Application incomplete. Missing: ${missing.join(', ')}`);
    }

    await prisma.$executeRaw`
      UPDATE "TravelerKycApplication" SET
        "status" = 'SUBMITTED',
        "submittedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE "userId" = ${userId}
    `;

    await this.logAudit({
      applicationId: app.id,
      userId,
      action: TravelerKycAuditAction.APPLICATION_SUBMITTED,
      description: 'Application submitted for review',
      actorId: userId,
      actorIp,
      previousState: { status: app.status },
      newState: { status: TravelerKycStatus.SUBMITTED },
    });

    return this.getApplication(userId);
  }

  // ============================================
  // DOCUMENT MANAGEMENT
  // ============================================

  /**
   * Upload document (encrypted storage)
   */
  async uploadDocument(
    userId: number,
    data: UploadDocumentRequest
  ): Promise<TravelerKycDocument> {
    const app = await this.getApplication(userId);

    // Can only upload in DRAFT or REJECTED status
    if (app.status !== TravelerKycStatus.DRAFT && app.status !== TravelerKycStatus.REJECTED) {
      throw new Error('Cannot upload documents in current status');
    }

    // Generate file hash for integrity
    const fileHash = crypto.createHash('sha256').update(data.file.buffer).digest('hex');

    // Generate encrypted file path (actual encryption handled by storage layer)
    const encryptionKeyId = `key-${crypto.randomBytes(8).toString('hex')}`;
    const fileUrl = `encrypted://kyc/${userId}/${data.documentType}/${Date.now()}-${data.file.originalname}`;

    // Delete existing document of same type
    await prisma.$executeRaw`
      UPDATE "TravelerKycDocument" SET
        "deletedAt" = NOW(),
        "deletionReason" = 'Replaced by new upload'
      WHERE "applicationId" = ${app.id} 
        AND "documentType" = ${data.documentType}::text::"TravelerDocumentType"
        AND "deletedAt" IS NULL
    `;

    // Insert new document
    await prisma.$executeRaw`
      INSERT INTO "TravelerKycDocument" (
        "applicationId", "userId", "documentType",
        "fileUrl", "fileName", "fileSize", "mimeType", "fileHash",
        "encryptionKeyId", "encryptedAt",
        "documentNumber", "documentCountry", "issuedDate", "expiryDate",
        "flightNumber", "departureAirport", "arrivalAirport", "flightDate",
        "livenessReady", "captureTimestamp",
        "status", "uploadIpAddress", "uploadUserAgent",
        "createdAt", "updatedAt"
      ) VALUES (
        ${app.id}, ${userId}, ${data.documentType}::text::"TravelerDocumentType",
        ${fileUrl}, ${data.file.originalname}, ${data.file.size}, ${data.file.mimetype}, ${fileHash},
        ${encryptionKeyId}, NOW(),
        ${data.documentNumber || null}, ${data.documentCountry || null},
        ${data.issuedDate ? new Date(data.issuedDate) : null},
        ${data.expiryDate ? new Date(data.expiryDate) : null},
        ${data.flightNumber || null}, ${data.departureAirport || null},
        ${data.arrivalAirport || null}, ${data.flightDate ? new Date(data.flightDate) : null},
        ${data.documentType === TravelerDocumentType.BIOMETRIC_SELFIE},
        ${data.captureTimestamp ? new Date(data.captureTimestamp) : null},
        'PENDING', ${data.ipAddress}, ${data.userAgent || null},
        NOW(), NOW()
      )
    `;

    await this.logAudit({
      applicationId: app.id,
      userId,
      action: TravelerKycAuditAction.DOCUMENT_UPLOADED,
      description: `Document uploaded: ${data.documentType}`,
      actorId: userId,
      actorIp: data.ipAddress,
      actorUserAgent: data.userAgent,
      metadata: {
        documentType: data.documentType,
        fileName: data.file.originalname,
        fileSize: data.file.size,
        fileHash,
      },
    });

    // Return the uploaded document
    const docs = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerKycDocument"
      WHERE "applicationId" = ${app.id} 
        AND "documentType" = ${data.documentType}::text::"TravelerDocumentType"
        AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    return docs[0];
  }


  // ============================================
  // PHONE VERIFICATION
  // ============================================

  /**
   * Send OTP to phone
   */
  async sendPhoneOtp(
    userId: number,
    data: SendPhoneOtpRequest
  ): Promise<{ sent: boolean; expiresAt: Date }> {
    const app = await this.getApplication(userId);

    // Check rate limiting
    const existing = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerPhoneOtp"
      WHERE "applicationId" = ${app.id}
        AND "phoneNumber" = ${data.phoneNumber}
        AND "phoneType" = ${data.phoneType}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    if (existing.length > 0) {
      const lastOtp = existing[0];
      
      // Check if blocked
      if (lastOtp.blockedUntil && new Date(lastOtp.blockedUntil) > new Date()) {
        throw new Error('Too many attempts. Please try again later.');
      }

      // Check rate limit
      if (lastOtp.lastSentAt) {
        const timeSinceLastSend = Date.now() - new Date(lastOtp.lastSentAt).getTime();
        if (timeSinceLastSend < OTP_RATE_LIMIT_MINUTES * 60 * 1000) {
          throw new Error(`Please wait ${OTP_RATE_LIMIT_MINUTES} minute(s) before requesting another OTP`);
        }
      }

      // Check hourly limit
      if (lastOtp.sentCount >= MAX_OTP_SENDS_PER_HOUR) {
        throw new Error('Maximum OTP requests exceeded. Please try again in an hour.');
      }
    }

    // Generate OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert OTP record
    await prisma.$executeRaw`
      INSERT INTO "TravelerPhoneOtp" (
        "applicationId", "userId", "phoneNumber", "phoneType", "countryCode",
        "otpHash", "expiresAt", "sentCount", "lastSentAt",
        "createdAt", "updatedAt"
      ) VALUES (
        ${app.id}, ${userId}, ${data.phoneNumber}, ${data.phoneType}, ${data.countryCode},
        ${otpHash}, ${expiresAt}, 1, NOW(),
        NOW(), NOW()
      )
      ON CONFLICT ("applicationId", "phoneNumber", "phoneType") 
      DO UPDATE SET
        "otpHash" = ${otpHash},
        "expiresAt" = ${expiresAt},
        "attempts" = 0,
        "sentCount" = "TravelerPhoneOtp"."sentCount" + 1,
        "lastSentAt" = NOW(),
        "updatedAt" = NOW()
    `;

    await this.logAudit({
      applicationId: app.id,
      userId,
      action: TravelerKycAuditAction.PHONE_VERIFICATION_SENT,
      description: `OTP sent to ${data.phoneType} phone: ${data.phoneNumber.slice(-4)}`,
      actorId: userId,
      metadata: {
        phoneType: data.phoneType,
        phoneLastFour: data.phoneNumber.slice(-4),
        countryCode: data.countryCode,
      },
    });

    // TODO: Integrate with SMS provider to send actual OTP
    // For now, log it (in production, this would be sent via SMS)
    console.log(`[DEV] OTP for ${data.phoneNumber}: ${otp}`);

    return { sent: true, expiresAt };
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOtp(
    userId: number,
    data: VerifyPhoneOtpRequest
  ): Promise<{ verified: boolean }> {
    const app = await this.getApplication(userId);

    const otpRecords = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerPhoneOtp"
      WHERE "applicationId" = ${app.id}
        AND "phoneNumber" = ${data.phoneNumber}
        AND "phoneType" = ${data.phoneType}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    if (otpRecords.length === 0) {
      throw new Error('No OTP found. Please request a new one.');
    }

    const otpRecord = otpRecords[0];

    // Check if already verified
    if (otpRecord.verified) {
      return { verified: true };
    }

    // Check if blocked
    if (otpRecord.blockedUntil && new Date(otpRecord.blockedUntil) > new Date()) {
      throw new Error('Too many failed attempts. Please try again later.');
    }

    // Check expiry
    if (new Date(otpRecord.expiresAt) < new Date()) {
      throw new Error('OTP expired. Please request a new one.');
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      // Block for 30 minutes
      await prisma.$executeRaw`
        UPDATE "TravelerPhoneOtp" SET
          "blockedUntil" = NOW() + INTERVAL '30 minutes',
          "updatedAt" = NOW()
        WHERE "id" = ${otpRecord.id}
      `;
      throw new Error('Too many failed attempts. Please try again in 30 minutes.');
    }

    // Verify OTP
    const providedHash = hashOtp(data.otp);
    if (providedHash !== otpRecord.otpHash) {
      // Increment attempts
      await prisma.$executeRaw`
        UPDATE "TravelerPhoneOtp" SET
          "attempts" = "attempts" + 1,
          "lastAttemptAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = ${otpRecord.id}
      `;
      throw new Error('Invalid OTP. Please try again.');
    }

    // Mark as verified
    await prisma.$executeRaw`
      UPDATE "TravelerPhoneOtp" SET
        "verified" = true,
        "verifiedAt" = NOW(),
        "verifiedIp" = ${data.ipAddress},
        "updatedAt" = NOW()
      WHERE "id" = ${otpRecord.id}
    `;

    // Update application
    if (data.phoneType === 'local') {
      await prisma.$executeRaw`
        UPDATE "TravelerKycApplication" SET
          "localPhone" = ${data.phoneNumber},
          "localPhoneVerified" = true,
          "localPhoneVerifiedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = ${app.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "TravelerKycApplication" SET
          "foreignPhone" = ${data.phoneNumber},
          "foreignPhoneVerified" = true,
          "foreignPhoneVerifiedAt" = NOW(),
          "updatedAt" = NOW()
        WHERE "id" = ${app.id}
      `;
    }

    await this.logAudit({
      applicationId: app.id,
      userId,
      action: TravelerKycAuditAction.PHONE_VERIFIED,
      description: `${data.phoneType} phone verified: ${data.phoneNumber.slice(-4)}`,
      actorId: userId,
      actorIp: data.ipAddress,
      metadata: {
        phoneType: data.phoneType,
        phoneLastFour: data.phoneNumber.slice(-4),
      },
    });

    return { verified: true };
  }

  // ============================================
  // STATUS CHECK (BLOCKING)
  // ============================================

  /**
   * Check if traveler can view/accept requests
   * HARD BLOCK if not verified
   */
  async checkTravelerAccess(userId: number): Promise<TravelerKycStatusResponse> {
    try {
      const app = await this.getApplication(userId);

      const isVerified = app.status === TravelerKycStatus.VERIFIED;

      return {
        userId,
        status: app.status,
        isVerified,
        canViewRequests: isVerified,
        canAcceptRequests: isVerified,
        message: isVerified
          ? 'KYC verified. You can view and accept requests.'
          : `KYC ${app.status.toLowerCase()}. Complete verification to access traveler features.`,
        applicationId: app.id,
      };
    } catch {
      // No application exists
      return {
        userId,
        status: TravelerKycStatus.DRAFT,
        isVerified: false,
        canViewRequests: false,
        canAcceptRequests: false,
        message: 'KYC not started. Complete verification to access traveler features.',
      };
    }
  }


  // ============================================
  // ADMIN REVIEW (HUMAN REQUIRED)
  // ============================================

  /**
   * Admin: Start review of application
   */
  async adminStartReview(
    applicationId: number,
    adminId: number,
    adminIp?: string
  ): Promise<TravelerKycApplication> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerKycApplication" WHERE "id" = ${applicationId}
    `;

    if (results.length === 0) {
      throw new Error('Application not found');
    }

    const app = results[0];

    // Validate status transition
    if (!isValidStatusTransition(app.status, TravelerKycStatus.UNDER_REVIEW)) {
      throw new Error(`Cannot start review from ${app.status} status`);
    }

    await prisma.$executeRaw`
      UPDATE "TravelerKycApplication" SET
        "status" = 'UNDER_REVIEW',
        "reviewedBy" = ${adminId},
        "updatedAt" = NOW()
      WHERE "id" = ${applicationId}
    `;

    await this.logAudit({
      applicationId,
      userId: app.userId,
      action: TravelerKycAuditAction.APPLICATION_UNDER_REVIEW,
      description: 'Application review started by admin',
      actorId: adminId,
      actorRole: 'ADMIN',
      actorIp: adminIp,
      previousState: { status: app.status },
      newState: { status: TravelerKycStatus.UNDER_REVIEW },
    });

    return this.getApplicationById(applicationId);
  }

  /**
   * Admin: Review application (HUMAN DECISION REQUIRED)
   */
  async adminReviewApplication(
    applicationId: number,
    adminId: number,
    data: AdminReviewRequest,
    adminIp?: string
  ): Promise<TravelerKycApplication> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerKycApplication" WHERE "id" = ${applicationId}
    `;

    if (results.length === 0) {
      throw new Error('Application not found');
    }

    const app = results[0];

    // Must be under review
    if (app.status !== TravelerKycStatus.UNDER_REVIEW) {
      throw new Error('Application must be under review');
    }

    const newStatus = data.action === 'approve'
      ? TravelerKycStatus.VERIFIED
      : TravelerKycStatus.REJECTED;

    // Validate status transition
    if (!isValidStatusTransition(app.status, newStatus)) {
      throw new Error(`Invalid status transition from ${app.status} to ${newStatus}`);
    }

    if (data.action === 'approve') {
      // Verify all documents are approved
      const docs = await prisma.$queryRaw<any[]>`
        SELECT * FROM "TravelerKycDocument"
        WHERE "applicationId" = ${applicationId} AND "deletedAt" IS NULL
      `;

      const pendingDocs = docs.filter((d: { status: string }) => d.status !== TravelerDocumentStatus.APPROVED);
      if (pendingDocs.length > 0) {
        throw new Error('All documents must be approved before verifying application');
      }

      await prisma.$executeRaw`
        UPDATE "TravelerKycApplication" SET
          "status" = 'VERIFIED',
          "reviewedBy" = ${adminId},
          "reviewedAt" = NOW(),
          "reviewNotes" = ${data.notes || null},
          "verifiedAt" = NOW(),
          "expiresAt" = NOW() + INTERVAL '1 year',
          "updatedAt" = NOW()
        WHERE "id" = ${applicationId}
      `;

      // Update user's traveler KYC status
      await prisma.$executeRaw`
        UPDATE "User" SET
          "travelerKycStatus" = 'VERIFIED',
          "travelerKycVerifiedAt" = NOW(),
          "travelerKycApplicationId" = ${applicationId}
        WHERE "id" = ${app.userId}
      `;

      await this.logAudit({
        applicationId,
        userId: app.userId,
        action: TravelerKycAuditAction.APPLICATION_VERIFIED,
        description: 'Application verified by admin',
        actorId: adminId,
        actorRole: 'ADMIN',
        actorIp: adminIp,
        previousState: { status: app.status },
        newState: { status: TravelerKycStatus.VERIFIED },
        metadata: { notes: data.notes },
      });
    } else {
      // Reject
      if (!data.rejectionReason) {
        throw new Error('Rejection reason is required');
      }

      await prisma.$executeRaw`
        UPDATE "TravelerKycApplication" SET
          "status" = 'REJECTED',
          "reviewedBy" = ${adminId},
          "reviewedAt" = NOW(),
          "reviewNotes" = ${data.notes || null},
          "rejectionReason" = ${data.rejectionReason},
          "updatedAt" = NOW()
        WHERE "id" = ${applicationId}
      `;

      // Update user's traveler KYC status
      await prisma.$executeRaw`
        UPDATE "User" SET
          "travelerKycStatus" = 'REJECTED'
        WHERE "id" = ${app.userId}
      `;

      await this.logAudit({
        applicationId,
        userId: app.userId,
        action: TravelerKycAuditAction.APPLICATION_REJECTED,
        description: `Application rejected: ${data.rejectionReason}`,
        actorId: adminId,
        actorRole: 'ADMIN',
        actorIp: adminIp,
        previousState: { status: app.status },
        newState: { status: TravelerKycStatus.REJECTED },
        metadata: { rejectionReason: data.rejectionReason, notes: data.notes },
      });
    }

    return this.getApplicationById(applicationId);
  }

  /**
   * Admin: Review document (HUMAN DECISION REQUIRED)
   */
  async adminReviewDocument(
    documentId: number,
    adminId: number,
    data: AdminDocumentReviewRequest,
    adminIp?: string
  ): Promise<TravelerKycDocument> {
    const docs = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerKycDocument" WHERE "id" = ${documentId}
    `;

    if (docs.length === 0) {
      throw new Error('Document not found');
    }

    const doc = docs[0];

    const newStatus = data.action === 'approve'
      ? TravelerDocumentStatus.APPROVED
      : TravelerDocumentStatus.REJECTED;

    if (data.action === 'reject' && !data.rejectionReason) {
      throw new Error('Rejection reason is required');
    }

    await prisma.$executeRaw`
      UPDATE "TravelerKycDocument" SET
        "status" = ${newStatus}::text::"TravelerDocumentStatus",
        "reviewedBy" = ${adminId},
        "reviewedAt" = NOW(),
        "reviewNotes" = ${data.notes || null},
        "rejectionReason" = ${data.rejectionReason || null},
        "updatedAt" = NOW()
      WHERE "id" = ${documentId}
    `;

    const action = data.action === 'approve'
      ? TravelerKycAuditAction.DOCUMENT_APPROVED
      : TravelerKycAuditAction.DOCUMENT_REJECTED;

    await this.logAudit({
      applicationId: doc.applicationId,
      userId: doc.userId,
      action,
      description: `Document ${data.action}d: ${doc.documentType}`,
      actorId: adminId,
      actorRole: 'ADMIN',
      actorIp: adminIp,
      previousState: { status: doc.status },
      newState: { status: newStatus },
      metadata: {
        documentType: doc.documentType,
        rejectionReason: data.rejectionReason,
        notes: data.notes,
      },
    });

    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerKycDocument" WHERE "id" = ${documentId}
    `;

    return updated[0];
  }

  /**
   * Admin: Get pending applications
   */
  async adminGetPendingApplications(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ applications: any[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const applications = await prisma.$queryRaw<any[]>`
      SELECT 
        a.*,
        u.email as "userEmail",
        (SELECT COUNT(*) FROM "TravelerKycDocument" d WHERE d."applicationId" = a.id AND d."deletedAt" IS NULL) as "documentsCount",
        (SELECT COUNT(*) FROM "TravelerKycDocument" d WHERE d."applicationId" = a.id AND d."deletedAt" IS NULL AND d.status = 'APPROVED') as "documentsApproved"
      FROM "TravelerKycApplication" a
      JOIN "User" u ON u.id = a."userId"
      WHERE a.status IN ('SUBMITTED', 'UNDER_REVIEW')
      ORDER BY a."submittedAt" ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const countResult = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "TravelerKycApplication"
      WHERE status IN ('SUBMITTED', 'UNDER_REVIEW')
    `;

    return {
      applications,
      total: parseInt(countResult[0].count),
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get application by ID
   */
  private async getApplicationById(applicationId: number): Promise<TravelerKycApplication> {
    const results = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerKycApplication" WHERE "id" = ${applicationId}
    `;

    if (results.length === 0) {
      throw new Error('Application not found');
    }

    const app = results[0];

    const documents = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TravelerKycDocument"
      WHERE "applicationId" = ${applicationId} AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
    `;

    return { ...app, documents };
  }

  /**
   * Log audit entry (immutable)
   */
  private async logAudit(data: {
    applicationId: number;
    userId: number;
    action: TravelerKycAuditAction;
    description: string;
    actorId?: number;
    actorRole?: string;
    actorIp?: string;
    actorUserAgent?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO "TravelerKycAuditLog" (
        "applicationId", "userId", "action", "description",
        "actorId", "actorRole", "actorIp", "actorUserAgent",
        "previousState", "newState", "metadata",
        "createdAt"
      ) VALUES (
        ${data.applicationId}, ${data.userId}, ${data.action}::text::"TravelerKycAuditAction", ${data.description},
        ${data.actorId || null}, ${data.actorRole || null}, ${data.actorIp || null}, ${data.actorUserAgent || null},
        ${data.previousState ? JSON.stringify(data.previousState) : null}::jsonb,
        ${data.newState ? JSON.stringify(data.newState) : null}::jsonb,
        ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
        NOW()
      )
    `;
  }

  /**
   * Get application response with completion status
   */
  async getApplicationResponse(userId: number): Promise<TravelerKycApplicationResponse> {
    const app = await this.getApplication(userId);
    const docs = app.documents || [];

    return {
      id: app.id,
      applicationNumber: app.applicationNumber,
      status: app.status,
      statusReason: app.statusReason,
      completionStatus: {
        personalInfo: !!(app.fullLegalName && app.dateOfBirth && app.nationality),
        localPhoneVerified: app.localPhoneVerified,
        foreignPhoneVerified: app.foreignPhoneVerified,
        passportUploaded: docs.some(d => d.documentType === TravelerDocumentType.PASSPORT),
        selfieUploaded: docs.some(d => d.documentType === TravelerDocumentType.BIOMETRIC_SELFIE),
        flightTicketUploaded: docs.some(d => d.documentType === TravelerDocumentType.FLIGHT_TICKET),
        addressProvided: !!(app.addressLine1 && app.city && app.country),
        emergencyContactProvided: !!(app.emergencyContactName && app.emergencyContactPhone),
        travelDatesProvided: !!(app.travelDateFrom && app.travelDateTo),
      },
      progressPercent: calculateProgress(app),
      documents: docs.map(d => ({
        type: d.documentType,
        status: d.status,
        uploadedAt: d.createdAt,
      })),
      submittedAt: app.submittedAt,
      verifiedAt: app.verifiedAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }
}

export const travelerKycService = new TravelerKycService();
