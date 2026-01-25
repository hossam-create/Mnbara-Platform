/**
 * Evidence Service
 * 
 * Handles evidence upload, retrieval, and management for disputes.
 */

import { Express } from 'express';
import { Pool } from 'pg';
import { getStorageService } from './storage/StorageFactory';
import { 
  validateFiles, 
  validateTotalEvidenceCount,
  generateUniqueFilename,
  getFileType 
} from '../utils/fileValidation';
import { 
  DisputeEvidence, 
  DisputeParty, 
  EvidenceType 
} from '../types/dispute.types';
import { 
  FileUploadError,
  EvidenceLimitReachedError 
} from '../errors/DisputeErrors';
import { logger } from '../utils/logger';

export class EvidenceService {
  private db: Pool;
  private storageService = getStorageService();

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Upload evidence files for a dispute
   */
  async uploadEvidence(
    disputeId: string,
    submittedBy: DisputeParty,
    files: Express.Multer.File[]
  ): Promise<DisputeEvidence[]> {
    try {
      logger.info('Uploading evidence', { 
        disputeId, 
        submittedBy, 
        fileCount: files.length 
      });

      // Validate files
      validateFiles(files);

      // Check total evidence count
      const currentCount = await this.getEvidenceCount(disputeId);
      validateTotalEvidenceCount(currentCount, files.length);

      // Generate unique filenames
      const filenames = files.map(f => generateUniqueFilename(f.originalname));

      // Upload files to storage
      const uploadResults = await this.storageService.uploadFiles(files, filenames);

      // Create evidence records
      const evidenceRecords: DisputeEvidence[] = [];

      for (let i = 0; i < uploadResults.length; i++) {
        const result = uploadResults[i];
        const file = files[i];

        const evidence = await this.createEvidenceRecord({
          disputeId,
          submittedBy,
          fileUrl: result.url,
          fileType: getFileType(file.mimetype),
          fileSize: file.size,
          originalFilename: file.originalname
        });

        evidenceRecords.push(evidence);
      }

      logger.info('Evidence uploaded successfully', { 
        disputeId, 
        count: evidenceRecords.length 
      });

      return evidenceRecords;
    } catch (error) {
      logger.error('Evidence upload failed', { disputeId, error });
      
      if (error.name === 'DisputeError') {
        throw error;
      }
      
      throw new FileUploadError('evidence', error.message);
    }
  }

  /**
   * Get all evidence for a dispute
   */
  async getDisputeEvidence(disputeId: string): Promise<DisputeEvidence[]> {
    try {
      const query = `
        SELECT 
          id,
          dispute_id as "disputeId",
          submitted_by as "submittedBy",
          file_url as "fileUrl",
          file_type as "fileType",
          file_size as "fileSize",
          original_filename as "originalFilename",
          submitted_at as "submittedAt"
        FROM dispute_evidence
        WHERE dispute_id = $1
        ORDER BY submitted_at ASC
      `;

      const result = await this.db.query(query, [disputeId]);

      return result.rows;
    } catch (error) {
      logger.error('Failed to get dispute evidence', { disputeId, error });
      throw error;
    }
  }

  /**
   * Get evidence count for a dispute
   */
  async getEvidenceCount(disputeId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM dispute_evidence
        WHERE dispute_id = $1
      `;

      const result = await this.db.query(query, [disputeId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to get evidence count', { disputeId, error });
      throw error;
    }
  }

  /**
   * Delete evidence (admin only)
   */
  async deleteEvidence(evidenceId: number): Promise<void> {
    try {
      logger.info('Deleting evidence', { evidenceId });

      // Get evidence record
      const getQuery = `
        SELECT file_url as "fileUrl"
        FROM dispute_evidence
        WHERE id = $1
      `;

      const getResult = await this.db.query(getQuery, [evidenceId]);

      if (getResult.rows.length === 0) {
        throw new Error(`Evidence not found: ${evidenceId}`);
      }

      const fileUrl = getResult.rows[0].fileUrl;

      // Delete from storage
      await this.storageService.deleteFile(fileUrl);

      // Delete from database
      const deleteQuery = `
        DELETE FROM dispute_evidence
        WHERE id = $1
      `;

      await this.db.query(deleteQuery, [evidenceId]);

      logger.info('Evidence deleted successfully', { evidenceId });
    } catch (error) {
      logger.error('Failed to delete evidence', { evidenceId, error });
      throw error;
    }
  }

  /**
   * Create evidence record in database
   */
  private async createEvidenceRecord(data: {
    disputeId: string;
    submittedBy: DisputeParty;
    fileUrl: string;
    fileType: EvidenceType;
    fileSize: number;
    originalFilename: string;
  }): Promise<DisputeEvidence> {
    try {
      const query = `
        INSERT INTO dispute_evidence (
          dispute_id,
          submitted_by,
          file_url,
          file_type,
          file_size,
          original_filename
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id,
          dispute_id as "disputeId",
          submitted_by as "submittedBy",
          file_url as "fileUrl",
          file_type as "fileType",
          file_size as "fileSize",
          original_filename as "originalFilename",
          submitted_at as "submittedAt"
      `;

      const values = [
        data.disputeId,
        data.submittedBy,
        data.fileUrl,
        data.fileType,
        data.fileSize,
        data.originalFilename
      ];

      const result = await this.db.query(query, values);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create evidence record', { data, error });
      throw error;
    }
  }

  /**
   * Get evidence by party
   */
  async getEvidenceByParty(
    disputeId: string,
    party: DisputeParty
  ): Promise<DisputeEvidence[]> {
    try {
      const query = `
        SELECT 
          id,
          dispute_id as "disputeId",
          submitted_by as "submittedBy",
          file_url as "fileUrl",
          file_type as "fileType",
          file_size as "fileSize",
          original_filename as "originalFilename",
          submitted_at as "submittedAt"
        FROM dispute_evidence
        WHERE dispute_id = $1 AND submitted_by = $2
        ORDER BY submitted_at ASC
      `;

      const result = await this.db.query(query, [disputeId, party]);

      return result.rows;
    } catch (error) {
      logger.error('Failed to get evidence by party', { disputeId, party, error });
      throw error;
    }
  }
}
