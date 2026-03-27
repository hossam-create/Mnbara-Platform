// ============================================
// Evidence Service
// Handles file uploads for dispute evidence
// ============================================

import { v4 as uuidv4 } from 'uuid';
import { FileStorageService } from './storage/FileStorageService';
import { LocalStorageService } from './storage/LocalStorageService';
import { S3StorageService } from './storage/S3StorageService';
import {
  DisputeEvidence,
  EvidenceType,
  DisputeParty,
  MulterFile,
  EvidenceResult
} from '../types/dispute.types';
import {
  validateFiles,
  generateUniqueFilename,
  getEvidenceType
} from '../utils/fileValidation';
import {
  InvalidFileTypeError,
  FileTooLargeError,
  TooManyFilesError
} from '../errors/DisputeErrors';
import {
  EvidenceNotFoundError,
  InvalidEvidencePartyError
} from '../errors/DisputeErrors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EvidenceService {
  private storageService: FileStorageService;
  private uploadPath: string;

  constructor() {
    // Use local storage by default, can be configured for S3
    const useS3 = process.env.USE_S3_STORAGE === 'true';
    
    if (useS3) {
      this.storageService = new S3StorageService({
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET || 'dispute-evidence',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'placeholder',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'placeholder'
      });
    } else {
      this.storageService = new LocalStorageService(
        process.env.UPLOAD_PATH || '/tmp/dispute-evidence',
        process.env.UPLOAD_URL || '/uploads'
      );
    }

    this.uploadPath = 'dispute-evidence';
  }

  /**
   * Upload evidence files for a dispute
   */
  async uploadEvidence(
    disputeId: string,
    submittedBy: DisputeParty,
    files: MulterFile[]
  ): Promise<EvidenceResult> {
    try {
      // Validate files
      const validation = validateFiles(files);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.results
            .filter(r => !r.valid)
            .map(r => r.errors?.join(', '))
            .filter(Boolean)
            .join('; ')
        };
      }

      // Upload files and create evidence records
      const evidenceRecords: DisputeEvidence[] = [];

      for (const file of files) {
        // Generate unique filename
        const uniqueFilename = generateUniqueFilename(
          file.originalname,
          disputeId,
          submittedBy
        );

        // Upload to storage
        const fileUrl = await this.storageService.upload(
          file.buffer,
          uniqueFilename,
          file.mimetype,
          this.uploadPath
        );

        // Determine evidence type
        const evidenceType = getEvidenceType(file.mimetype);

        // Create evidence record in database
        const evidence = await prisma.disputeEvidence.create({
          data: {
            disputeId,
            submittedBy,
            fileUrl,
            fileType: evidenceType,
            fileSize: file.size,
            originalFilename: file.originalname
          }
        });

        evidenceRecords.push({
          id: evidence.id,
          disputeId: evidence.disputeId,
          submittedBy: evidence.submittedBy as DisputeParty,
          fileUrl: evidence.fileUrl,
          fileType: evidence.fileType as EvidenceType,
          fileSize: evidence.fileSize,
          originalFilename: evidence.originalFilename,
          submittedAt: evidence.submittedAt
        });
      }

      return {
        success: true,
        evidence: evidenceRecords
      };
    } catch (error) {
      console.error('Error uploading evidence:', error);
      
      if (error instanceof InvalidFileTypeError ||
          error instanceof FileTooLargeError ||
          error instanceof TooManyFilesError) {
        throw error;
      }

      return {
        success: false,
        error: 'Failed to upload evidence'
      };
    }
  }

  /**
   * Get all evidence for a dispute
   */
  async getDisputeEvidence(disputeId: string): Promise<DisputeEvidence[]> {
    const evidence = await prisma.disputeEvidence.findMany({
      where: { disputeId },
      orderBy: { submittedAt: 'asc' }
    });

    return evidence.map((e: any) => ({
      id: e.id,
      disputeId: e.disputeId,
      submittedBy: e.submittedBy as DisputeParty,
      fileUrl: e.fileUrl,
      fileType: e.fileType as EvidenceType,
      fileSize: e.fileSize,
      originalFilename: e.originalFilename,
      submittedAt: e.submittedAt
    }));
  }

  /**
   * Get evidence by ID
   */
  async getEvidenceById(evidenceId: number): Promise<DisputeEvidence | null> {
    const evidence = await prisma.disputeEvidence.findUnique({
      where: { id: evidenceId }
    });

    if (!evidence) {
      return null;
    }

    return {
      id: evidence.id,
      disputeId: evidence.disputeId,
      submittedBy: evidence.submittedBy as DisputeParty,
      fileUrl: evidence.fileUrl,
      fileType: evidence.fileType as EvidenceType,
      fileSize: evidence.fileSize,
      originalFilename: evidence.originalFilename,
      submittedAt: evidence.submittedAt
    };
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(evidenceId: number, userId: string): Promise<void> {
    const evidence = await this.getEvidenceById(evidenceId);
    
    if (!evidence) {
      throw new EvidenceNotFoundError(evidenceId);
    }

    // Delete from storage
    await this.storageService.delete(evidence.fileUrl);

    // Delete from database
    await prisma.disputeEvidence.delete({
      where: { id: evidenceId }
    });
  }

  /**
   * Get evidence count for a dispute
   */
  async getEvidenceCount(disputeId: string, submittedBy?: DisputeParty): Promise<number> {
    return prisma.disputeEvidence.count({
      where: {
        disputeId,
        ...(submittedBy && { submittedBy })
      }
    });
  }
}
