import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export interface PayoutRequest {
  id?: string;
  sellerId: string;
  userId: string;
  amount: number;
  currency: string;
  payoutMethod: 'bank_transfer' | 'mobile_money' | 'paypal' | 'check';
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
  bankRoutingNumber?: string;
  bankSwiftCode?: string;
  bankAddress?: string;
  orderIds?: string[];
  payoutPeriodStart?: Date;
  payoutPeriodEnd?: Date;
}

export interface PayoutBatch {
  id?: string;
  batchId?: string;
  batchDate: Date;
  weekNumber: number;
  year: number;
  totalRequests: number;
  totalAmount: number;
  totalFees: number;
  totalNetAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export class ManualPayoutService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Create a new payout request
   */
  async createPayoutRequest(requestData: PayoutRequest): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Calculate fee
      const feeResult = await client.query(
        'SELECT calculate_payout_fee($1) as fee',
        [requestData.amount]
      );
      const feeAmount = feeResult.rows[0].fee;
      const netAmount = requestData.amount - feeAmount;

      // Get seller profile for verification
      const profileResult = await client.query(
        'SELECT * FROM seller_payout_profiles WHERE seller_id = $1',
        [requestData.sellerId]
      );
      const profile = profileResult.rows[0];

      // Risk assessment
      const riskScore = await this.calculateRiskScore(requestData.sellerId, requestData.amount, profile);

      // Insert payout request
      const insertQuery = `
        INSERT INTO payout_requests (
          seller_id, user_id, amount, currency, fee_amount, net_amount,
          payout_method, bank_account_name, bank_account_number, bank_name,
          bank_routing_number, bank_swift_code, bank_address,
          order_ids, payout_period_start, payout_period_end,
          risk_score, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;

      const values = [
        requestData.sellerId,
        requestData.userId,
        requestData.amount,
        requestData.currency || 'USD',
        feeAmount,
        netAmount,
        requestData.payoutMethod,
        requestData.bankAccountName,
        requestData.bankAccountNumber,
        requestData.bankName,
        requestData.bankRoutingNumber,
        requestData.bankSwiftCode,
        requestData.bankAddress,
        requestData.orderIds || [],
        requestData.payoutPeriodStart,
        requestData.payoutPeriodEnd,
        riskScore,
        profile?.is_verified || false
      ];

      const result = await client.query(insertQuery, values);
      const payoutRequest = result.rows[0];

      // Log creation
      await this.logPayoutAction(payoutRequest.id, 'created', undefined, undefined, requestData.userId);

      await client.query('COMMIT');
      return payoutRequest;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get payout requests for a seller
   */
  async getSellerPayoutRequests(sellerId: string, status?: string): Promise<any[]> {
    const query = `
      SELECT * FROM payout_requests 
      WHERE seller_id = $1 
      ${status ? 'AND status = $2' : ''}
      ORDER BY requested_at DESC
    `;
    
    const result = await this.pool.query(query, status ? [sellerId, status] : [sellerId]);
    return result.rows;
  }

  /**
   * Get payout request by ID
   */
  async getPayoutRequest(requestId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM payout_requests WHERE id = $1 OR request_id = $1',
      [requestId]
    );
    return result.rows[0];
  }

  /**
   * Update payout request status
   */
  async updatePayoutStatus(
    requestId: string, 
    newStatus: string, 
    reviewedBy?: string, 
    rejectionReason?: string,
    internalNotes?: string
  ): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const updateFields = ['status = $2', 'updated_at = NOW()'];
      const values = [requestId, newStatus];
      let paramCount = 2;

      if (reviewedBy) {
        paramCount++;
        updateFields.push(`approved_by = $${paramCount}`);
        values.push(reviewedBy);
      }

      if (rejectionReason) {
        paramCount++;
        updateFields.push(`rejection_reason = $${paramCount}`);
        values.push(rejectionReason);
      }

      if (internalNotes) {
        paramCount++;
        updateFields.push(`internal_notes = $${paramCount}`);
        values.push(internalNotes);
      }

      // Set timestamps based on status
      if (newStatus === 'under_review') {
        updateFields.push('reviewed_at = NOW()');
      } else if (newStatus === 'approved') {
        updateFields.push('approved_at = NOW()');
      } else if (newStatus === 'processing') {
        updateFields.push('processed_at = NOW()');
      } else if (newStatus === 'paid') {
        updateFields.push('paid_at = NOW()');
      }

      const query = `
        UPDATE payout_requests 
        SET ${updateFields.join(', ')}
        WHERE id = $1 OR request_id = $1
        RETURNING *
      `;

      const result = await client.query(query, values);
      const updatedRequest = result.rows[0];

      await client.query('COMMIT');
      return updatedRequest;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create weekly payout batch
   */
  async createWeeklyBatch(): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get pending approved requests
      const pendingRequests = await client.query(`
        SELECT * FROM payout_requests 
        WHERE status = 'approved' AND batch_id IS NULL
        ORDER BY requested_at ASC
      `);

      if (pendingRequests.rows.length === 0) {
        await client.query('ROLLBACK');
        return { message: 'No pending requests to batch' };
      }

      // Create batch
      const batchResult = await client.query('SELECT create_weekly_payout_batch() as batch_id');
      const batchId = batchResult.rows[0].batch_id;

      // Calculate totals
      const totals = pendingRequests.rows.reduce(
        (acc, req) => ({
          totalRequests: acc.totalRequests + 1,
          totalAmount: acc.totalAmount + parseFloat(req.amount),
          totalFees: acc.totalFees + parseFloat(req.fee_amount),
          totalNetAmount: acc.totalNetAmount + parseFloat(req.net_amount),
        }),
        { totalRequests: 0, totalAmount: 0, totalFees: 0, totalNetAmount: 0 }
      );

      // Update batch with totals
      await client.query(`
        UPDATE payout_batches 
        SET total_requests = $1, total_amount = $2, total_fees = $3, total_net_amount = $4
        WHERE id = $5
      `, [
        totals.totalRequests,
        totals.totalAmount,
        totals.totalFees,
        totals.totalNetAmount,
        batchId
      ]);

      // Assign requests to batch
      await client.query(`
        UPDATE payout_requests 
        SET batch_id = $1, status = 'processing'
        WHERE id = ANY($2)
      `, [batchId, pendingRequests.rows.map(req => req.id)]);

      await client.query('COMMIT');

      return {
        batchId,
        totalRequests: totals.totalRequests,
        totalAmount: totals.totalAmount,
        totalFees: totals.totalFees,
        totalNetAmount: totals.totalNetAmount,
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all payout batches
   */
  async getPayoutBatches(): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT * FROM weekly_payout_report 
      ORDER BY batch_date DESC
    `);
    return result.rows;
  }

  /**
   * Export batch to CSV
   */
  async exportBatchToCSV(batchId: string): Promise<string> {
    const requests = await this.pool.query(`
      SELECT 
        request_id,
        seller_id,
        amount,
        fee_amount,
        net_amount,
        bank_account_name,
        bank_account_number,
        bank_name,
        bank_routing_number,
        bank_swift_code,
        status,
        requested_at
      FROM payout_requests 
      WHERE batch_id = $1
      ORDER BY requested_at ASC
    `, [batchId]);

    if (requests.rows.length === 0) {
      throw new Error('No requests found for this batch');
    }

    // Generate CSV content
    const headers = [
      'Request ID',
      'Seller ID',
      'Amount',
      'Fee',
      'Net Amount',
      'Account Name',
      'Account Number',
      'Bank Name',
      'Routing Number',
      'SWIFT Code',
      'Status',
      'Requested Date'
    ];

    const csvRows = [
      headers.join(','),
      ...requests.rows.map(row => [
        row.request_id,
        row.seller_id,
        row.amount,
        row.fee_amount,
        row.net_amount,
        `"${row.bank_account_name}"`,
        row.bank_account_number,
        `"${row.bank_name}"`,
        row.bank_routing_number || '',
        row.bank_swift_code || '',
        row.status,
        row.requested_at
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    // Save to file
    const fileName = `payout_batch_${batchId}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`;
    const filePath = path.join(process.cwd(), 'exports', fileName);

    // Ensure exports directory exists
    const exportsDir = path.dirname(filePath);
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, csvContent);

    // Update batch with export path
    await this.pool.query(
      'UPDATE payout_batches SET export_file_path = $1 WHERE id = $2',
      [filePath, batchId]
    );

    return filePath;
  }

  /**
   * Get payout statistics
   */
  async getPayoutStats(startDate?: Date, endDate?: Date): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(amount) as total_amount,
        SUM(fee_amount) as total_fees,
        SUM(net_amount) as total_net_amount,
        COUNT(CASE WHEN status = 'requested' THEN 1 END) as pending_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_requests,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_requests,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
        AVG(CASE WHEN paid_at IS NOT NULL THEN paid_at - requested_at END) as avg_processing_days
      FROM payout_requests
      WHERE ($1::date IS NULL OR requested_at >= $1)
        AND ($2::date IS NULL OR requested_at <= $2)
    `;

    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows[0];
  }

  /**
   * Get seller payout summary
   */
  async getSellerPayoutSummary(sellerId: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM get_seller_payout_summary($1)',
      [sellerId]
    );
    return result.rows[0];
  }

  /**
   * Calculate risk score for payout request
   */
  private async calculateRiskScore(sellerId: string, amount: number, profile?: any): Promise<number> {
    let riskScore = 0;

    // Base risk score
    if (!profile?.is_verified) {
      riskScore += 30;
    }

    // Amount-based risk
    if (amount > 1000) riskScore += 10;
    if (amount > 5000) riskScore += 20;
    if (amount > 10000) riskScore += 30;

    // History-based risk
    const historyResult = await this.pool.query(
      'SELECT COUNT(*) as rejected_count FROM payout_requests WHERE seller_id = $1 AND status = $2',
      [sellerId, 'rejected']
    );
    
    const rejectedCount = parseInt(historyResult.rows[0].rejected_count);
    if (rejectedCount > 0) riskScore += rejectedCount * 10;

    // Time-based risk
    if (profile?.last_payout_date) {
      const daysSinceLastPayout = Math.floor(
        (new Date().getTime() - new Date(profile.last_payout_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPayout < 7) riskScore += 15;
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Log payout action for audit
   */
  private async logPayoutAction(
    requestId: string,
    action: string,
    oldStatus?: string,
    newStatus?: string,
    performedBy?: string,
    notes?: string
  ): Promise<void> {
    await this.pool.query(`
      INSERT INTO payout_audit_log (
        payout_request_id, action, old_status, new_status, performed_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [requestId, action, oldStatus, newStatus, performedBy, notes]);
  }

  /**
   * Get payout settings
   */
  async getPayoutSettings(): Promise<any> {
    const result = await this.pool.query(
      'SELECT * FROM payout_settings WHERE is_active = TRUE'
    );
    
    const settings: any = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    return settings;
  }

  /**
   * Update payout settings
   */
  async updatePayoutSetting(key: string, value: string): Promise<void> {
    await this.pool.query(
      'UPDATE payout_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2',
      [value, key]
    );
  }

  /**
   * Get pending requests for review
   */
  async getPendingRequests(limit = 50): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT 
        pr.*,
        sp.risk_score as seller_risk_score,
        sp.is_verified as seller_verified
      FROM payout_requests pr
      LEFT JOIN seller_payout_profiles sp ON pr.seller_id = sp.seller_id
      WHERE pr.status IN ('requested', 'under_review')
      ORDER BY pr.risk_score DESC, pr.requested_at ASC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }

  /**
   * Get audit log for request
   */
  async getPayoutAuditLog(requestId: string): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM payout_audit_log WHERE payout_request_id = $1 ORDER BY performed_at DESC',
      [requestId]
    );
    return result.rows;
  }
}
