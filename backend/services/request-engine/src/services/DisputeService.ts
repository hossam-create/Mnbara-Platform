/**
 * Dispute Service
 * 
 * Core service for managing disputes and refunds.
 * Handles dispute creation, status management, and user operations.
 */

import { Express } from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { EvidenceService } from './EvidenceService';
import {
  Dispute,
  DisputeReason,
  DisputeStatus,
  DisputeParty,
  DisputeFilters,
  DisputeWithDetails,
  DisputeWithFullDetails,
  DISPUTE_CONSTANTS,
  DISPUTABLE_REQUEST_STATUS
} from '../types/dispute.types';
import {
  DisputeWindowExpiredError,
  DuplicateDisputeError,
  InvalidRequestStatusError,
  DisputeNotFoundError,
  RequestNotFoundError,
  UnauthorizedAccessError,
  InvalidDisputeStatusError,
  EvidenceLimitReachedError
} from '../errors/DisputeErrors';
import { logger } from '../utils/logger';

export class DisputeService {
  private db: Pool;
  private evidenceService: EvidenceService;

  constructor(db: Pool) {
    this.db = db;
    this.evidenceService = new EvidenceService(db);
  }

  /**
   * Open a new dispute
   */
  async openDispute(
    requestId: number,
    userId: number,
    reason: DisputeReason,
    description: string,
    evidenceFiles?: Express.Multer.File[]
  ): Promise<Dispute> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      logger.info('Opening dispute', { requestId, userId, reason });

      // Get request details
      const request = await this.getRequest(requestId, client);

      if (!request) {
        throw new RequestNotFoundError(requestId.toString());
      }

      // Validate user is party to request
      const party = this.determineDisputeParty(request, userId);

      // Validate request status
      this.validateRequestStatus(request.status);

      // Validate time window (48 hours)
      this.validateTimeWindow(request.deliveredAt);

      // Check for existing dispute
      await this.validateNoExistingDispute(requestId, client);

      // Create dispute
      const disputeId = uuidv4();
      const dispute = await this.createDispute({
        id: disputeId,
        requestId,
        openedBy: party,
        reason,
        description
      }, client);

      // Upload evidence if provided
      if (evidenceFiles && evidenceFiles.length > 0) {
        await this.evidenceService.uploadEvidence(
          disputeId,
          party,
          evidenceFiles
        );
      }

      // Update request status to DISPUTED
      await this.updateRequestStatus(requestId, 'DISPUTED', client);

      await client.query('COMMIT');

      logger.info('Dispute opened successfully', { disputeId, requestId });

      return dispute;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to open dispute', { requestId, userId, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's disputes
   */
  async getUserDisputes(
    userId: number,
    filters: DisputeFilters
  ): Promise<{ disputes: Dispute[]; total: number }> {
    try {
      const { status, limit = 20, offset = 0 } = filters;

      let query = `
        SELECT 
          d.id,
          d.request_id as "requestId",
          d.opened_by as "openedBy",
          d.reason,
          d.description,
          d.evidence_urls as "evidenceUrls",
          d.status,
          d.resolution,
          d.resolution_percentage as "resolutionPercentage",
          d.admin_notes as "adminNotes",
          d.opened_at as "openedAt",
          d.reviewed_at as "reviewedAt",
          d.resolved_at as "resolvedAt",
          d.closed_at as "closedAt",
          d.created_at as "createdAt",
          d.updated_at as "updatedAt"
        FROM disputes d
        INNER JOIN requests r ON d.request_id = r.id
        WHERE (r.buyer_id = $1 OR r.seller_id = $1)
      `;

      const params: any[] = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND d.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Get total count
      const countQuery = query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) FROM');
      const countResult = await this.db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Add pagination
      query += ` ORDER BY d.opened_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);

      return {
        disputes: result.rows,
        total
      };
    } catch (error) {
      logger.error('Failed to get user disputes', { userId, error });
      throw error;
    }
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(
    disputeId: string,
    userId: number
  ): Promise<DisputeWithDetails> {
    try {
      const query = `
        SELECT 
          d.id,
          d.request_id as "requestId",
          d.opened_by as "openedBy",
          d.reason,
          d.description,
          d.evidence_urls as "evidenceUrls",
          d.status,
          d.resolution,
          d.resolution_percentage as "resolutionPercentage",
          d.admin_notes as "adminNotes",
          d.opened_at as "openedAt",
          d.reviewed_at as "reviewedAt",
          d.resolved_at as "resolvedAt",
          d.closed_at as "closedAt",
          d.created_at as "createdAt",
          d.updated_at as "updatedAt",
          r.id as "request_id",
          r.title as "request_title",
          r.amount as "request_amount",
          r.buyer_id as "request_buyer_id",
          r.seller_id as "request_seller_id"
        FROM disputes d
        INNER JOIN requests r ON d.request_id = r.id
        WHERE d.id = $1
      `;

      const result = await this.db.query(query, [disputeId]);

      if (result.rows.length === 0) {
        throw new DisputeNotFoundError(disputeId);
      }

      const row = result.rows[0];

      // Verify user is party to dispute
      if (row.request_buyer_id !== userId && row.request_seller_id !== userId) {
        throw new UnauthorizedAccessError();
      }

      // Get evidence
      const evidence = await this.evidenceService.getDisputeEvidence(disputeId);

      return {
        id: row.id,
        requestId: row.requestId,
        openedBy: row.openedBy,
        reason: row.reason,
        description: row.description,
        evidenceUrls: row.evidenceUrls,
        status: row.status,
        resolution: row.resolution,
        resolutionPercentage: row.resolutionPercentage,
        adminNotes: row.adminNotes,
        openedAt: row.openedAt,
        reviewedAt: row.reviewedAt,
        resolvedAt: row.resolvedAt,
        closedAt: row.closedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        request: {
          id: row.request_id,
          title: row.request_title,
          amount: row.request_amount
        },
        evidence
      };
    } catch (error) {
      logger.error('Failed to get dispute by ID', { disputeId, error });
      throw error;
    }
  }

  /**
   * Add evidence to existing dispute
   */
  async addEvidence(
    disputeId: string,
    userId: number,
    evidenceFiles: Express.Multer.File[]
  ): Promise<any> {
    try {
      logger.info('Adding evidence to dispute', { disputeId, userId });

      // Get dispute
      const dispute = await this.getDisputeById(disputeId, userId);

      // Validate dispute status
      if (dispute.status !== DisputeStatus.OPEN && dispute.status !== DisputeStatus.UNDER_REVIEW) {
        throw new InvalidDisputeStatusError(dispute.status, 'add evidence');
      }

      // Determine user's party
      const request = await this.getRequest(dispute.requestId);
      const party = this.determineDisputeParty(request, userId);

      // Upload evidence
      const evidence = await this.evidenceService.uploadEvidence(
        disputeId,
        party,
        evidenceFiles
      );

      // Get total evidence count
      const totalCount = await this.evidenceService.getEvidenceCount(disputeId);

      logger.info('Evidence added successfully', { disputeId, count: evidence.length });

      return {
        evidenceUrls: evidence.map(e => e.fileUrl),
        totalEvidence: totalCount
      };
    } catch (error) {
      logger.error('Failed to add evidence', { disputeId, error });
      throw error;
    }
  }

  /**
   * Get all disputes (admin)
   */
  async getAllDisputes(filters: any): Promise<{ disputes: Dispute[]; total: number }> {
    try {
      const { 
        status, 
        reason, 
        dateFrom, 
        dateTo, 
        search,
        limit = 50, 
        offset = 0 
      } = filters;

      let query = `
        SELECT 
          d.id,
          d.request_id as "requestId",
          d.opened_by as "openedBy",
          d.reason,
          d.description,
          d.evidence_urls as "evidenceUrls",
          d.status,
          d.resolution,
          d.resolution_percentage as "resolutionPercentage",
          d.admin_notes as "adminNotes",
          d.opened_at as "openedAt",
          d.reviewed_at as "reviewedAt",
          d.resolved_at as "resolvedAt",
          d.closed_at as "closedAt",
          d.created_at as "createdAt",
          d.updated_at as "updatedAt"
        FROM disputes d
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND d.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (reason) {
        query += ` AND d.reason = $${paramIndex}`;
        params.push(reason);
        paramIndex++;
      }

      if (dateFrom) {
        query += ` AND d.opened_at >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }

      if (dateTo) {
        query += ` AND d.opened_at <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }

      if (search) {
        query += ` AND (d.id::text LIKE $${paramIndex} OR d.request_id::text LIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Get total count
      const countQuery = query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) FROM');
      const countResult = await this.db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Add pagination
      query += ` ORDER BY d.opened_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);

      return {
        disputes: result.rows,
        total
      };
    } catch (error) {
      logger.error('Failed to get all disputes', { error });
      throw error;
    }
  }

  /**
   * Mark dispute as under review (admin)
   */
  async markUnderReview(disputeId: string, adminId: number): Promise<Dispute> {
    try {
      logger.info('Marking dispute under review', { disputeId, adminId });

      const query = `
        UPDATE disputes
        SET 
          status = $1,
          reviewed_at = NOW(),
          reviewed_by_admin_id = $2,
          updated_at = NOW()
        WHERE id = $3 AND status = $4
        RETURNING *
      `;

      const result = await this.db.query(query, [
        DisputeStatus.UNDER_REVIEW,
        adminId,
        disputeId,
        DisputeStatus.OPEN
      ]);

      if (result.rows.length === 0) {
        throw new DisputeNotFoundError(disputeId);
      }

      logger.info('Dispute marked under review', { disputeId });

      return this.mapDisputeRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to mark dispute under review', { disputeId, error });
      throw error;
    }
  }

  // Helper methods

  private async getRequest(requestId: number, client?: any): Promise<any> {
    const db = client || this.db;
    
    const query = `
      SELECT 
        id,
        title,
        amount,
        status,
        buyer_id as "buyerId",
        seller_id as "sellerId",
        delivered_at as "deliveredAt"
      FROM requests
      WHERE id = $1
    `;

    const result = await db.query(query, [requestId]);
    return result.rows[0];
  }

  private determineDisputeParty(request: any, userId: number): DisputeParty {
    if (request.buyerId === userId) {
      return DisputeParty.BUYER;
    }
    if (request.sellerId === userId) {
      return DisputeParty.SELLER;
    }
    throw new UnauthorizedAccessError('User is not a party to this request');
  }

  private validateRequestStatus(status: string): void {
    if (!DISPUTABLE_REQUEST_STATUS.includes(status)) {
      throw new InvalidRequestStatusError(status);
    }
  }

  private validateTimeWindow(deliveredAt: Date): void {
    const now = new Date();
    const hoursElapsed = (now.getTime() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60);

    if (hoursElapsed > DISPUTE_CONSTANTS.DISPUTE_WINDOW_HOURS) {
      throw new DisputeWindowExpiredError(new Date(deliveredAt));
    }
  }

  private async validateNoExistingDispute(requestId: number, client?: any): Promise<void> {
    const db = client || this.db;
    
    const query = `
      SELECT id FROM disputes WHERE request_id = $1
    `;

    const result = await db.query(query, [requestId]);

    if (result.rows.length > 0) {
      throw new DuplicateDisputeError(requestId.toString());
    }
  }

  private async createDispute(data: any, client: any): Promise<Dispute> {
    const query = `
      INSERT INTO disputes (
        id,
        request_id,
        opened_by,
        reason,
        description,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.id,
      data.requestId,
      data.openedBy,
      data.reason,
      data.description,
      DisputeStatus.OPEN
    ];

    const result = await client.query(query, values);
    return this.mapDisputeRow(result.rows[0]);
  }

  private async updateRequestStatus(
    requestId: number,
    status: string,
    client: any
  ): Promise<void> {
    const query = `
      UPDATE requests
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `;

    await client.query(query, [status, requestId]);
  }

  private mapDisputeRow(row: any): Dispute {
    return {
      id: row.id,
      requestId: row.request_id,
      openedBy: row.opened_by,
      reason: row.reason,
      description: row.description,
      evidenceUrls: row.evidence_urls,
      status: row.status,
      resolution: row.resolution,
      resolutionPercentage: row.resolution_percentage,
      adminNotes: row.admin_notes,
      openedAt: row.opened_at,
      reviewedAt: row.reviewed_at,
      resolvedAt: row.resolved_at,
      closedAt: row.closed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
