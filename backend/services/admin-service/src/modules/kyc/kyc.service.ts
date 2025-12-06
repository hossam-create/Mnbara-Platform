import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class KycService {
  constructor(private readonly db: DatabaseService) {}

  async getAllVerifications(filters: any) {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause = `WHERE status = $${paramIndex++}`;
      values.push(status);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM kyc_verifications ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get verifications
    const query = `
      SELECT 
        kv.*,
        u.email,
        u.first_name,
        u.last_name
      FROM kyc_verifications kv
      JOIN users u ON kv.user_id = u.id
      ${whereClause}
      ORDER BY kv.submitted_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const result = await this.db.query(query, [...values, limit, offset]);

    return {
      data: result.rows,
      total,
      page,
      limit,
    };
  }

  async getVerificationById(id: number) {
    const result = await this.db.query(
      `SELECT 
        kv.*,
        u.email,
        u.first_name,
        u.last_name,
        u.phone
      FROM kyc_verifications kv
      JOIN users u ON kv.user_id = u.id
      WHERE kv.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  async getUserVerifications(userId: number) {
    const result = await this.db.query(
      `SELECT * FROM kyc_verifications 
       WHERE user_id = $1 
       ORDER BY submitted_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async approveVerification(id: number, adminNotes?: string) {
    const verification = await this.getVerificationById(id);
    if (!verification) {
      throw new Error('Verification not found');
    }

    // Update verification status
    await this.db.update(
      'kyc_verifications',
      { id },
      {
        status: 'APPROVED',
        verified_at: new Date(),
        rejection_reason: null,
      }
    );

    // Update user KYC status
    await this.db.update(
      'users',
      { id: verification.user_id },
      {
        kyc_verified: true,
        kyc_verified_at: new Date(),
      }
    );

    // Log activity
    await this.db.insert('user_activity_logs', {
      user_id: verification.user_id,
      action_type: 'KYC_APPROVED',
      resource_type: 'KYC_VERIFICATION',
      resource_id: id,
      metadata: { adminNotes },
    });

    return { success: true, message: 'KYC verification approved' };
  }

  async rejectVerification(id: number, reason: string, adminNotes?: string) {
    const verification = await this.getVerificationById(id);
    if (!verification) {
      throw new Error('Verification not found');
    }

    // Update verification status
    await this.db.update(
      'kyc_verifications',
      { id },
      {
        status: 'REJECTED',
        rejection_reason: reason,
      }
    );

    // Log activity
    await this.db.insert('user_activity_logs', {
      user_id: verification.user_id,
      action_type: 'KYC_REJECTED',
      resource_type: 'KYC_VERIFICATION',
      resource_id: id,
      metadata: { reason, adminNotes },
    });

    return { success: true, message: 'KYC verification rejected' };
  }

  async requestResubmit(id: number, reason: string) {
    const verification = await this.getVerificationById(id);
    if (!verification) {
      throw new Error('Verification not found');
    }

    await this.db.update(
      'kyc_verifications',
      { id },
      {
        status: 'RESUBMIT_REQUESTED',
        rejection_reason: reason,
      }
    );

    return { success: true, message: 'Resubmission requested' };
  }
}
