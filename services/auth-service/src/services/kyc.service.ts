/**
 * KYC Verification Service
 * Requirements: 16.1, 16.2, 16.3 - KYC verification process with identity provider integration
 * 
 * Integrates with Onfido for identity verification including:
 * - Document verification (passport, driver's license, ID card)
 * - Facial recognition and liveness detection
 * - Address verification
 * - Watchlist screening
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * KYC verification status
 */
export enum KYCStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/**
 * Document types supported for KYC
 */
export enum DocumentType {
  PASSPORT = 'passport',
  DRIVING_LICENCE = 'driving_licence',
  NATIONAL_IDENTITY_CARD = 'national_identity_card',
  RESIDENCE_PERMIT = 'residence_permit',
}

/**
 * KYC check types
 */
export enum CheckType {
  DOCUMENT = 'document',
  FACIAL_SIMILARITY_PHOTO = 'facial_similarity_photo',
  FACIAL_SIMILARITY_VIDEO = 'facial_similarity_video',
  KNOWN_FACES = 'known_faces',
  WATCHLIST_STANDARD = 'watchlist_standard',
  WATCHLIST_FULL = 'watchlist_full',
  PROOF_OF_ADDRESS = 'proof_of_address',
}

/**
 * KYC submission data
 */
export interface KYCSubmissionData {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  documentType: DocumentType;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
}

/**
 * Onfido API response types
 */
interface OnfidoApplicant {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  dob: string;
}

interface OnfidoDocument {
  id: string;
  created_at: string;
  file_name: string;
  file_type: string;
  type: string;
  side: string;
}

interface OnfidoCheck {
  id: string;
  created_at: string;
  status: string;
  result: string;
  report_ids: string[];
}

interface OnfidoReport {
  id: string;
  name: string;
  status: string;
  result: string;
  sub_result?: string;
  breakdown: Record<string, any>;
}

/**
 * KYC Service for identity verification
 */
export class KYCService {
  private onfidoClient: AxiosInstance;
  private webhookSecret: string;

  constructor() {
    const apiToken = process.env.ONFIDO_API_TOKEN;
    const webhookSecret = process.env.ONFIDO_WEBHOOK_SECRET;

    if (!apiToken) {
      console.warn('ONFIDO_API_TOKEN not configured - KYC service will use mock mode');
    }

    this.webhookSecret = webhookSecret || '';

    this.onfidoClient = axios.create({
      baseURL: process.env.ONFIDO_API_URL || 'https://api.onfido.com/v3.6',
      headers: {
        'Authorization': `Token token=${apiToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new KYC verification submission
   * Requirements: 16.1 - KYC verification process
   */
  async createSubmission(data: KYCSubmissionData): Promise<{
    submissionId: string;
    applicantId: string;
    sdkToken?: string;
  }> {
    try {
      // Create applicant in Onfido
      const applicant = await this.createApplicant(data);

      // Upload documents
      const documentId = await this.uploadDocument(
        applicant.id,
        data.documentType,
        data.documentFrontUrl,
        'front'
      );

      if (data.documentBackUrl) {
        await this.uploadDocument(
          applicant.id,
          data.documentType,
          data.documentBackUrl,
          'back'
        );
      }

      // Upload selfie for facial similarity
      await this.uploadLivePhoto(applicant.id, data.selfieUrl);

      // Create check
      const check = await this.createCheck(applicant.id, [
        CheckType.DOCUMENT,
        CheckType.FACIAL_SIMILARITY_PHOTO,
        CheckType.WATCHLIST_STANDARD,
      ]);

      // Store submission in database
      const submission = await prisma.kycVerification.create({
        data: {
          userId: parseInt(data.userId),
          status: 'PENDING',
          providerApplicantId: applicant.id,
          providerCheckId: check.id,
          documentType: data.documentType,
          submittedAt: new Date(),
          metadata: {
            documentId,
            checkReportIds: check.report_ids,
          },
        },
      });

      // Generate SDK token for mobile/web SDK
      const sdkToken = await this.generateSDKToken(applicant.id);

      return {
        submissionId: submission.id.toString(),
        applicantId: applicant.id,
        sdkToken,
      };
    } catch (error) {
      console.error('KYC submission failed:', error);
      throw new Error('Failed to create KYC submission');
    }
  }

  /**
   * Create applicant in Onfido
   */
  private async createApplicant(data: KYCSubmissionData): Promise<OnfidoApplicant> {
    const response = await this.onfidoClient.post('/applicants', {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      dob: data.dateOfBirth,
      address: data.address ? {
        street: data.address.street,
        town: data.address.city,
        state: data.address.state,
        postcode: data.address.postalCode,
        country: data.address.country,
      } : undefined,
    });

    return response.data;
  }

  /**
   * Upload document to Onfido
   */
  private async uploadDocument(
    applicantId: string,
    type: DocumentType,
    fileUrl: string,
    side: 'front' | 'back'
  ): Promise<string> {
    // Download file from URL
    const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(fileResponse.data);

    // Create form data
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('applicant_id', applicantId);
    formData.append('type', type);
    formData.append('side', side);
    formData.append('file', fileBuffer, {
      filename: `document_${side}.jpg`,
      contentType: 'image/jpeg',
    });

    const response = await this.onfidoClient.post('/documents', formData, {
      headers: formData.getHeaders(),
    });

    return response.data.id;
  }

  /**
   * Upload live photo (selfie) to Onfido
   */
  private async uploadLivePhoto(applicantId: string, fileUrl: string): Promise<string> {
    const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(fileResponse.data);

    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('applicant_id', applicantId);
    formData.append('file', fileBuffer, {
      filename: 'selfie.jpg',
      contentType: 'image/jpeg',
    });

    const response = await this.onfidoClient.post('/live_photos', formData, {
      headers: formData.getHeaders(),
    });

    return response.data.id;
  }

  /**
   * Create verification check
   */
  private async createCheck(
    applicantId: string,
    reportNames: CheckType[]
  ): Promise<OnfidoCheck> {
    const response = await this.onfidoClient.post('/checks', {
      applicant_id: applicantId,
      report_names: reportNames,
    });

    return response.data;
  }

  /**
   * Generate SDK token for Onfido SDK
   */
  private async generateSDKToken(applicantId: string): Promise<string> {
    const response = await this.onfidoClient.post('/sdk_token', {
      applicant_id: applicantId,
      referrer: process.env.ONFIDO_REFERRER || '*://*/*',
    });

    return response.data.token;
  }

  /**
   * Get KYC submission status
   */
  async getSubmissionStatus(submissionId: string): Promise<{
    status: KYCStatus;
    result?: string;
    reports?: OnfidoReport[];
    rejectionReasons?: string[];
  }> {
    const submission = await prisma.kycVerification.findUnique({
      where: { id: parseInt(submissionId) },
    });

    if (!submission) {
      throw new Error('KYC submission not found');
    }

    // If already processed, return cached status
    if (submission.status === 'APPROVED' || submission.status === 'REJECTED') {
      return {
        status: submission.status as KYCStatus,
        result: submission.verificationResult || undefined,
        rejectionReasons: submission.rejectionReason ? [submission.rejectionReason] : undefined,
      };
    }

    // Fetch latest status from Onfido
    if (submission.providerCheckId) {
      const check = await this.getCheck(submission.providerCheckId);
      const reports = await this.getReports(check.report_ids);

      // Update local status
      const newStatus = this.mapOnfidoStatus(check.status, check.result);
      
      await prisma.kycVerification.update({
        where: { id: parseInt(submissionId) },
        data: {
          status: newStatus,
          verificationResult: check.result,
          verifiedAt: check.status === 'complete' ? new Date() : undefined,
        },
      });

      return {
        status: newStatus as KYCStatus,
        result: check.result,
        reports,
        rejectionReasons: this.extractRejectionReasons(reports),
      };
    }

    return {
      status: submission.status as KYCStatus,
    };
  }

  /**
   * Get check details from Onfido
   */
  private async getCheck(checkId: string): Promise<OnfidoCheck> {
    const response = await this.onfidoClient.get(`/checks/${checkId}`);
    return response.data;
  }

  /**
   * Get reports for a check
   */
  private async getReports(reportIds: string[]): Promise<OnfidoReport[]> {
    const reports = await Promise.all(
      reportIds.map(async (id) => {
        const response = await this.onfidoClient.get(`/reports/${id}`);
        return response.data;
      })
    );
    return reports;
  }

  /**
   * Map Onfido status to internal status
   */
  private mapOnfidoStatus(status: string, result: string): string {
    if (status === 'in_progress') {
      return 'IN_REVIEW';
    }
    if (status === 'complete') {
      if (result === 'clear') {
        return 'APPROVED';
      }
      return 'REJECTED';
    }
    return 'PENDING';
  }

  /**
   * Extract rejection reasons from reports
   */
  private extractRejectionReasons(reports: OnfidoReport[]): string[] {
    const reasons: string[] = [];

    reports.forEach((report) => {
      if (report.result !== 'clear') {
        if (report.breakdown) {
          Object.entries(report.breakdown).forEach(([key, value]: [string, any]) => {
            if (value.result !== 'clear') {
              reasons.push(`${report.name}: ${key} - ${value.result}`);
            }
          });
        }
      }
    });

    return reasons;
  }

  /**
   * Handle Onfido webhook
   * Requirements: 16.2 - Document upload and verification workflow
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const { resource_type, action, object } = payload.payload;

    if (resource_type === 'check' && action === 'check.completed') {
      await this.processCheckCompletion(object);
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('Webhook secret not configured - skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Process check completion webhook
   */
  private async processCheckCompletion(check: OnfidoCheck): Promise<void> {
    const submission = await prisma.kycVerification.findFirst({
      where: { providerCheckId: check.id },
    });

    if (!submission) {
      console.warn(`No submission found for check ${check.id}`);
      return;
    }

    const reports = await this.getReports(check.report_ids);
    const rejectionReasons = this.extractRejectionReasons(reports);

    const newStatus = this.mapOnfidoStatus(check.status, check.result);

    // Update submission
    await prisma.kycVerification.update({
      where: { id: submission.id },
      data: {
        status: newStatus,
        verificationResult: check.result,
        verifiedAt: new Date(),
        rejectionReason: rejectionReasons.length > 0 ? rejectionReasons.join('; ') : null,
        metadata: {
          ...(submission.metadata as object || {}),
          reports: reports.map((r) => ({
            name: r.name,
            result: r.result,
            subResult: r.sub_result,
          })),
        },
      },
    });

    // Update user KYC status
    await prisma.user.update({
      where: { id: submission.userId },
      data: {
        kycStatus: newStatus === 'APPROVED' ? 'VERIFIED' : 
                   newStatus === 'REJECTED' ? 'REJECTED' : 'PENDING',
        kycVerifiedAt: newStatus === 'APPROVED' ? new Date() : undefined,
      },
    });

    // Send notification to user
    await this.sendKYCNotification(submission.userId, newStatus, rejectionReasons);
  }

  /**
   * Send KYC status notification
   */
  private async sendKYCNotification(
    userId: number,
    status: string,
    rejectionReasons: string[]
  ): Promise<void> {
    // This would integrate with notification service
    console.log(`KYC notification for user ${userId}: ${status}`);
    
    // TODO: Integrate with notification service
    // await notificationService.send({
    //   userId,
    //   type: 'KYC_STATUS_UPDATE',
    //   data: { status, rejectionReasons },
    // });
  }

  /**
   * Admin: Manually approve KYC
   * Requirements: 16.3 - Create admin KYC review interface
   */
  async adminApprove(submissionId: string, adminId: string, notes?: string): Promise<void> {
    const submission = await prisma.kycVerification.findUnique({
      where: { id: parseInt(submissionId) },
    });

    if (!submission) {
      throw new Error('KYC submission not found');
    }

    await prisma.$transaction([
      prisma.kycVerification.update({
        where: { id: parseInt(submissionId) },
        data: {
          status: 'APPROVED',
          verifiedAt: new Date(),
          reviewedBy: parseInt(adminId),
          reviewNotes: notes,
        },
      }),
      prisma.user.update({
        where: { id: submission.userId },
        data: {
          kycStatus: 'VERIFIED',
          kycVerifiedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'KYC_MANUAL_APPROVAL',
          severity: 'INFO',
          actorId: parseInt(adminId),
          targetId: submission.userId,
          targetType: 'User',
          description: `KYC manually approved for user ${submission.userId}`,
          metadata: { submissionId, notes },
        },
      }),
    ]);

    await this.sendKYCNotification(submission.userId, 'APPROVED', []);
  }

  /**
   * Admin: Manually reject KYC
   * Requirements: 16.3 - Create admin KYC review interface
   */
  async adminReject(
    submissionId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    const submission = await prisma.kycVerification.findUnique({
      where: { id: parseInt(submissionId) },
    });

    if (!submission) {
      throw new Error('KYC submission not found');
    }

    await prisma.$transaction([
      prisma.kycVerification.update({
        where: { id: parseInt(submissionId) },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          reviewedBy: parseInt(adminId),
        },
      }),
      prisma.user.update({
        where: { id: submission.userId },
        data: {
          kycStatus: 'REJECTED',
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'KYC_MANUAL_REJECTION',
          severity: 'WARNING',
          actorId: parseInt(adminId),
          targetId: submission.userId,
          targetType: 'User',
          description: `KYC manually rejected for user ${submission.userId}`,
          metadata: { submissionId, reason },
        },
      }),
    ]);

    await this.sendKYCNotification(submission.userId, 'REJECTED', [reason]);
  }

  /**
   * Get pending KYC submissions for admin review
   */
  async getPendingSubmissions(page: number = 1, limit: number = 20): Promise<{
    submissions: any[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      prisma.kycVerification.findMany({
        where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              createdAt: true,
            },
          },
        },
        orderBy: { submittedAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.kycVerification.count({
        where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
      }),
    ]);

    return { submissions, total };
  }
}

export const kycService = new KYCService();
