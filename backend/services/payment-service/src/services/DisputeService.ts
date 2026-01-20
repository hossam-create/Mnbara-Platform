import { Pool } from 'pg';
import Stripe from 'stripe';

export interface DisputeRecord {
  orderId: string;
  initiatorId: string;
  respondentId: string;
  disputeType: 'item_not_received' | 'item_not_as_described' | 'damaged_item' | 'wrong_item' | 'other';
  description: string;
  evidence?: DisputeEvidence[];
  amountCents: number;
  requestedResolution: 'refund' | 'partial_refund' | 'return' | 'exchange';
}

export interface DisputeEvidence {
  type: 'photo' | 'video' | 'document' | 'message' | 'tracking_info';
  url: string;
  description: string;
  uploadedBy: 'buyer' | 'seller';
  uploadedAt: Date;
}

export interface DisputeMessage {
  disputeId: string;
  senderId: string;
  message: string;
  attachments?: string[];
  isPrivate: boolean;
  createdAt: Date;
}

export class DisputeService {
  private pool: Pool;
  private stripe: Stripe;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a new dispute
   */
  async createDispute(dispute: Omit<DisputeRecord, 'evidence'>): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate order and check if dispute already exists
      const orderQuery = `
        SELECT o.*, p.buyer_id, p.seller_id, p.amount_cents, p.status as payment_status
        FROM orders o
        JOIN payments p ON o.payment_id = p.id
        WHERE o.id = $1
      `;
      const orderResult = await client.query(orderQuery, [dispute.orderId]);
      const order = orderResult.rows[0];

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.payment_status !== 'succeeded') {
        throw new Error('Cannot dispute unpaid order');
      }

      // Check existing dispute
      const existingQuery = `
        SELECT id FROM disputes WHERE order_id = $1 AND status NOT IN ('resolved', 'dismissed')
      `;
      const existingResult = await client.query(existingQuery, [dispute.orderId]);
      
      if (existingResult.rows[0]) {
        throw new Error('Dispute already exists for this order');
      }

      // Validate initiator
      if (dispute.initiatorId !== order.buyer_id && dispute.initiatorId !== order.seller_id) {
        throw new Error('Only buyer or seller can initiate dispute');
      }

      const respondentId = dispute.initiatorId === order.buyer_id ? order.seller_id : order.buyer_id;

      // Create dispute record
      const disputeQuery = `
        INSERT INTO disputes (
          order_id, initiator_id, respondent_id, dispute_type, description,
          amount_cents, requested_resolution, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', NOW())
        RETURNING *
      `;

      const disputeResult = await client.query(disputeQuery, [
        dispute.orderId,
        dispute.initiatorId,
        respondentId,
        dispute.disputeType,
        dispute.description,
        dispute.amountCents,
        dispute.requestedResolution,
      ]);

      const createdDispute = disputeResult.rows[0];

      // Hold funds in escrow if not already held
      if (order.status !== 'shipped' && order.status !== 'delivered') {
        await this.holdFundsForDispute(order.payment_id, createdDispute.id);
      }

      // Update order status
      await client.query(`
        UPDATE orders SET status = 'disputed' WHERE id = $1
      `, [dispute.orderId]);

      await client.query('COMMIT');

      // Send notifications
      await this.sendDisputeNotifications(createdDispute, 'created');

      return createdDispute;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Hold funds for dispute
   */
  private async holdFundsForDispute(paymentId: string, disputeId: string): Promise<void> {
    // This would integrate with the EscrowService
    console.log(`Holding funds for payment ${paymentId} due to dispute ${disputeId}`);
  }

  /**
   * Add evidence to dispute
   */
  async addEvidence(disputeId: string, evidence: Omit<DisputeEvidence, 'uploadedAt'>, userId: string): Promise<any> {
    // Validate user is part of dispute
    const disputeQuery = `
      SELECT * FROM disputes WHERE id = $1 AND (initiator_id = $2 OR respondent_id = $2)
    `;
    const disputeResult = await this.pool.query(disputeQuery, [disputeId, userId]);
    
    if (!disputeResult.rows[0]) {
      throw new Error('Dispute not found or access denied');
    }

    // Upload evidence (this would integrate with file storage service)
    const evidenceUrl = await this.uploadEvidenceFile(evidence);

    // Store evidence record
    const query = `
      INSERT INTO dispute_evidence (
        dispute_id, type, url, description, uploaded_by, uploaded_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      disputeId,
      evidence.type,
      evidenceUrl,
      evidence.description,
      evidence.uploadedBy,
    ]);

    return result.rows[0];
  }

  /**
   * Upload evidence file
   */
  private async uploadEvidenceFile(evidence: Omit<DisputeEvidence, 'uploadedAt'>): Promise<string> {
    // This would integrate with AWS S3 or similar file storage
    // For now, return a mock URL
    return `https://storage.mnbarh.com/evidence/${Date.now()}_${evidence.type}`;
  }

  /**
   * Add message to dispute
   */
  async addMessage(disputeId: string, message: DisputeMessage): Promise<any> {
    // Validate user is part of dispute
    const disputeQuery = `
      SELECT * FROM disputes WHERE id = $1 AND (initiator_id = $2 OR respondent_id = $2)
    `;
    const disputeResult = await this.pool.query(disputeQuery, [disputeId, message.senderId]);
    
    if (!disputeResult.rows[0]) {
      throw new Error('Dispute not found or access denied');
    }

    // Store message
    const query = `
      INSERT INTO dispute_messages (
        dispute_id, sender_id, message, attachments, is_private, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      disputeId,
      message.senderId,
      message.message,
      JSON.stringify(message.attachments || []),
      message.isPrivate,
    ]);

    // Send notifications (if not private)
    if (!message.isPrivate) {
      await this.sendDisputeMessageNotifications(disputeId, message);
    }

    return result.rows[0];
  }

  /**
   * Get dispute details
   */
  async getDisputeDetails(disputeId: string, userId?: string): Promise<any> {
    let query = `
      SELECT 
        d.*,
        o.tracking_number,
        o.status as order_status,
        l.title as listing_title,
        l.images,
        i.full_name as initiator_name,
        r.full_name as respondent_name,
        p.amount_cents as order_amount
      FROM disputes d
      JOIN orders o ON d.order_id = o.id
      JOIN listings l ON o.listing_id = l.id
      JOIN users i ON d.initiator_id = i.id
      JOIN users r ON d.respondent_id = r.id
      JOIN payments p ON o.payment_id = p.id
      WHERE d.id = $1
    `;

    const params = [disputeId];

    if (userId) {
      query += ' AND (d.initiator_id = $2 OR d.respondent_id = $2)';
      params.push(userId);
    }

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  /**
   * Get dispute evidence
   */
  async getDisputeEvidence(disputeId: string, userId?: string): Promise<DisputeEvidence[]> {
    let query = `
      SELECT de.*, u.full_name as uploader_name
      FROM dispute_evidence de
      JOIN disputes d ON de.dispute_id = d.id
      LEFT JOIN users u ON de.uploaded_by = u.id
      WHERE de.dispute_id = $1
    `;

    const params = [disputeId];

    if (userId) {
      query += ' AND (d.initiator_id = $2 OR d.respondent_id = $2)';
      params.push(userId);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get dispute messages
   */
  async getDisputeMessages(disputeId: string, userId?: string): Promise<DisputeMessage[]> {
    let query = `
      SELECT dm.*, u.full_name as sender_name
      FROM dispute_messages dm
      JOIN disputes d ON dm.dispute_id = d.id
      JOIN users u ON dm.sender_id = u.id
      WHERE dm.dispute_id = $1
      ORDER BY dm.created_at ASC
    `;

    const params = [disputeId];

    if (userId) {
      query += ' AND (d.initiator_id = $2 OR d.respondent_id = $2)';
      params.push(userId);
    }

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(disputeId: string, resolution: {
    winner: 'buyer' | 'seller' | 'split';
    refundAmountCents: number;
    reason: string;
    adminId: string;
  }): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get dispute details
      const disputeQuery = `
        SELECT d.*, p.id as payment_id, p.amount_cents
        FROM disputes d
        JOIN orders o ON d.order_id = o.id
        JOIN payments p ON o.payment_id = p.id
        WHERE d.id = $1 AND d.status = 'open'
      `;
      const disputeResult = await client.query(disputeQuery, [disputeId]);
      const dispute = disputeResult.rows[0];

      if (!dispute) {
        throw new Error('Dispute not found or not open');
      }

      // Validate refund amount
      if (resolution.refundAmountCents > dispute.amount_cents) {
        throw new Error('Refund amount cannot exceed order amount');
      }

      let refundId: string | null = null;

      // Process refund if buyer wins or split
      if (resolution.winner === 'buyer' || resolution.winner === 'split') {
        const refund = await this.stripe.refunds.create({
          payment_intent: dispute.payment_id,
          amount: resolution.refundAmountCents,
          reason: 'dispute',
          metadata: {
            dispute_id: disputeId,
            resolution_winner: resolution.winner,
            admin_id: resolution.adminId,
          },
        });
        refundId = refund.id;
      }

      // Update dispute status
      await client.query(`
        UPDATE disputes 
        SET status = 'resolved', resolved_at = NOW(), winner = $1, 
            refund_amount_cents = $2, refund_id = $3, resolution_reason = $4,
            resolved_by = $5
        WHERE id = $6
      `, [
        resolution.winner,
        resolution.refundAmountCents,
        refundId,
        resolution.reason,
        resolution.adminId,
        disputeId,
      ]);

      // Update order status
      const newOrderStatus = resolution.winner === 'seller' ? 'completed' : 'refunded';
      await client.query(`
        UPDATE orders SET status = $1 WHERE id = $2
      `, [newOrderStatus, dispute.order_id]);

      // Release escrow funds if applicable
      if (resolution.winner === 'seller') {
        await this.releaseEscrowFunds(dispute.payment_id, 'Dispute resolved in favor of seller');
      }

      await client.query('COMMIT');

      // Send notifications
      await this.sendDisputeNotifications(dispute, 'resolved', resolution);

      return {
        disputeId,
        winner: resolution.winner,
        refundAmount: resolution.refundAmountCents,
        refundId,
        orderStatus: newOrderStatus,
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Release escrow funds
   */
  private async releaseEscrowFunds(paymentId: string, reason: string): Promise<void> {
    // This would integrate with the EscrowService
    console.log(`Releasing escrow funds for payment ${paymentId}: ${reason}`);
  }

  /**
   * Get user disputes
   */
  async getUserDisputes(userId: string, status?: string): Promise<any[]> {
    let query = `
      SELECT 
        d.*,
        l.title as listing_title,
        l.images,
        o.status as order_status,
        o.created_at as order_date,
        CASE WHEN d.initiator_id = $1 THEN 'initiator' ELSE 'respondent' END as role
      FROM disputes d
      JOIN orders o ON d.order_id = o.id
      JOIN listings l ON o.listing_id = l.id
      WHERE (d.initiator_id = $1 OR d.respondent_id = $1)
    `;

    const params = [userId];

    if (status) {
      query += ' AND d.status = $2';
      params.push(status);
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_disputes,
        COUNT(*) FILTER (WHERE status = 'open') as open_disputes,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_disputes,
        COUNT(*) FILTER (WHERE winner = 'buyer') as buyer_wins,
        COUNT(*) FILTER (WHERE winner = 'seller') as seller_wins,
        COUNT(*) FILTER (WHERE winner = 'split') as split_resolutions,
        COALESCE(SUM(refund_amount_cents), 0) as total_refunds,
        AVG(CASE WHEN resolved_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/86400 
                ELSE NULL END) as avg_resolution_days
      FROM disputes
    `;

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  /**
   * Auto-escalate old disputes
   */
  async escalateOldDisputes(): Promise<number> {
    const query = `
      UPDATE disputes 
      SET status = 'escalated', escalated_at = NOW()
      WHERE status = 'open' 
      AND created_at < NOW() - INTERVAL '14 days'
      RETURNING id
    `;

    const result = await this.pool.query(query);
    return result.rows.length;
  }

  /**
   * Send dispute notifications
   */
  private async sendDisputeNotifications(dispute: any, action: string, data?: any): Promise<void> {
    const notifications = {
      created: {
        initiator: 'Dispute created successfully - we will notify the other party',
        respondent: 'A dispute has been opened for your order - please respond',
      },
      resolved: {
        initiator: `Dispute resolved - ${data?.winner === 'buyer' ? 'You won' : data?.winner === 'seller' ? 'Seller won' : 'Split decision'}`,
        respondent: `Dispute resolved - ${data?.winner === 'seller' ? 'You won' : data?.winner === 'buyer' ? 'Buyer won' : 'Split decision'}`,
      },
    };

    console.log(`Dispute ${action} notification:`, notifications[action]);
  }

  /**
   * Send dispute message notifications
   */
  private async sendDisputeMessageNotifications(disputeId: string, message: DisputeMessage): Promise<void> {
    // Get dispute participants
    const query = `
      SELECT initiator_id, respondent_id FROM disputes WHERE id = $1
    `;
    const result = await this.pool.query(query, [disputeId]);
    const dispute = result.rows[0];

    const recipientId = message.senderId === dispute.initiator_id ? dispute.respondent_id : dispute.initiator_id;

    console.log(`New message in dispute ${disputeId} for user ${recipientId}`);
  }

  /**
   * Escalate dispute to admin review
   */
  async escalateDispute(disputeId: string, reason: string, userId: string): Promise<any> {
    const query = `
      UPDATE disputes 
      SET status = 'escalated', escalated_at = NOW(), escalated_by = $1, escalation_reason = $2
      WHERE id = $3 AND (initiator_id = $1 OR respondent_id = $1)
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId, reason, disputeId]);
    
    if (result.rows.length === 0) {
      throw new Error('Dispute not found or access denied');
    }

    // Notify admin team
    await this.notifyAdminTeam(disputeId, reason);

    return result.rows[0];
  }

  /**
   * Notify admin team
   */
  private async notifyAdminTeam(disputeId: string, reason: string): Promise<void> {
    console.log(`Dispute ${disputeId} escalated to admin: ${reason}`);
  }
}
