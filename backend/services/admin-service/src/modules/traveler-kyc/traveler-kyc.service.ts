import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class TravelerKycService {
  constructor(private readonly db: DatabaseService) {}

  async submitKyc(userId: number, data: any, files: Express.Multer.File[]) {
    // Start transaction
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Check if user already has a KYC profile
      const existingProfile = await client.query(
        'SELECT id FROM traveler_kyc_profiles WHERE user_id = $1',
        [userId]
      );

      if (existingProfile.rows.length > 0) {
        throw new Error('KYC profile already exists');
      }

      // Insert KYC profile
      const profileResult = await client.query(
        `INSERT INTO traveler_kyc_profiles (
          user_id, first_name, last_name, nationality, date_of_birth, gender,
          email, local_phone, foreign_phone, from_country, to_country,
          from_city, to_city, departure_date, return_date, permanent_address,
          city, postal_code, emergency_contact_name, emergency_contact_relation,
          emergency_contact_phone, emergency_contact_country, digital_signature,
          terms_accepted, privacy_accepted, data_processing_accepted, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, 'submitted'
        ) RETURNING *`,
        [
          userId, data.firstName, data.lastName, data.nationality, data.dateOfBirth, data.gender,
          data.email, data.localPhone, data.foreignPhone, data.fromCountry, data.toCountry,
          data.fromCity, data.toCity, data.departureDate, data.returnDate, data.permanentAddress,
          data.city, data.postalCode, data.emergencyContactName, data.emergencyContactRelation,
          data.emergencyContactPhone, data.emergencyContactCountry, data.digitalSignature,
          data.termsAccepted === 'true', data.privacyAccepted === 'true', data.dataProcessingAccepted === 'true'
        ]
      );

      // Insert travel data
      await client.query(
        `INSERT INTO traveler_travel_data (
          user_id, from_country, to_country, from_city, to_city,
          departure_date, return_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId, data.fromCountry, data.toCountry, data.fromCity, data.toCity,
          data.departureDate, data.returnDate
        ]
      );

      // Process and store documents
      for (const file of files) {
        const fileHash = this.calculateFileHash(file.buffer);
        const encryptedPath = await this.encryptAndStoreFile(file);
        
        let documentType = 'other';
        if (file.fieldname === 'passportPhoto') documentType = 'passport';
        if (file.fieldname === 'biometricSelfie') documentType = 'selfie';
        if (file.fieldname === 'flightTicket') documentType = 'flight_ticket';
        if (file.fieldname === 'boardingPass') documentType = 'boarding_pass';

        await client.query(
          `INSERT INTO traveler_documents (
            user_id, type, file_hash, encrypted_path, file_name, file_size, mime_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId, documentType, fileHash, encryptedPath, file.originalname,
            file.size, file.mimetype
          ]
        );
      }

      // Update user KYC status
      await client.query(
        'UPDATE users SET kyc_verified = false WHERE id = $1',
        [userId]
      );

      // Log KYC submission event
      await client.query(
        `INSERT INTO user_activity_logs (
          user_id, action_type, resource_type, resource_id, metadata
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          userId, 'KYC_SUBMITTED', 'TRAVELER_KYC', profileResult.rows[0].id,
          JSON.stringify({ type: 'full_verification' })
        ]
      );

      await client.query('COMMIT');
      
      return { 
        success: true, 
        message: 'KYC submitted successfully',
        profileId: profileResult.rows[0].id
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getKycStatus(userId: number) {
    const result = await this.db.query(
      `SELECT 
        tk.status, tk.risk_level, tk.submitted_at, tk.reviewed_at, tk.rejection_reason,
        u.kyc_verified, u.kyc_verified_at
      FROM traveler_kyc_profiles tk
      RIGHT JOIN users u ON tk.user_id = u.id
      WHERE u.id = $1
      ORDER BY tk.submitted_at DESC
      LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { status: 'not_submitted', kycVerified: false };
    }

    return {
      status: result.rows[0].status || 'not_submitted',
      riskLevel: result.rows[0].risk_level,
      submittedAt: result.rows[0].submitted_at,
      reviewedAt: result.rows[0].reviewed_at,
      rejectionReason: result.rows[0].rejection_reason,
      kycVerified: result.rows[0].kyc_verified
    };
  }

  async uploadDocument(userId: number, type: string, file: Express.Multer.File) {
    const fileHash = this.calculateFileHash(file.buffer);
    const encryptedPath = await this.encryptAndStoreFile(file);

    const result = await this.db.query(
      `INSERT INTO traveler_documents (
        user_id, type, file_hash, encrypted_path, file_name, file_size, mime_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, type, fileHash, encryptedPath, file.originalname, file.size, file.mimetype]
    );

    return { success: true, documentId: result.rows[0].id };
  }

  async getKycProfile(userId: number) {
    const profileResult = await this.db.query(
      'SELECT * FROM traveler_kyc_profiles WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1',
      [userId]
    );

    const documentsResult = await this.db.query(
      'SELECT type, file_name, file_size, uploaded_at, verified FROM traveler_documents WHERE user_id = $1',
      [userId]
    );

    const travelDataResult = await this.db.query(
      'SELECT * FROM traveler_travel_data WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    return {
      profile: profileResult.rows[0] || null,
      documents: documentsResult.rows,
      travelData: travelDataResult.rows[0] || null
    };
  }

  async getAllKycProfiles(filters: any) {
    const { status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause = `WHERE tk.status = $${paramIndex++}`;
      values.push(status);
    }

    const countQuery = `SELECT COUNT(*) as count FROM traveler_kyc_profiles tk ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    const query = `
      SELECT 
        tk.*,
        u.email,
        u.first_name,
        u.last_name,
        u.phone
      FROM traveler_kyc_profiles tk
      JOIN users u ON tk.user_id = u.id
      ${whereClause}
      ORDER BY tk.submitted_at DESC
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

  async verifyKyc(userId: number, riskLevel: string = 'low', notes?: string) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Update KYC profile
      await client.query(
        `UPDATE traveler_kyc_profiles 
         SET status = 'verified', risk_level = $1, reviewed_at = NOW() 
         WHERE user_id = $2`,
        [riskLevel, userId]
      );

      // Update user KYC status
      await client.query(
        'UPDATE users SET kyc_verified = true, kyc_verified_at = NOW() WHERE id = $1',
        [userId]
      );

      // Mark documents as verified
      await client.query(
        'UPDATE traveler_documents SET verified = true WHERE user_id = $1',
        [userId]
      );

      // Log verification event
      await client.query(
        `INSERT INTO user_activity_logs (
          user_id, action_type, resource_type, metadata
        ) VALUES ($1, $2, $3, $4)`,
        [
          userId, 'KYC_VERIFIED', 'TRAVELER_KYC',
          JSON.stringify({ riskLevel, notes })
        ]
      );

      await client.query('COMMIT');
      
      return { success: true, message: 'KYC verified successfully' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async rejectKyc(userId: number, reason: string, notes?: string) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Update KYC profile
      await client.query(
        `UPDATE traveler_kyc_profiles 
         SET status = 'rejected', rejection_reason = $1, reviewed_at = NOW() 
         WHERE user_id = $2`,
        [reason, userId]
      );

      // Update user KYC status
      await client.query(
        'UPDATE users SET kyc_verified = false WHERE id = $1',
        [userId]
      );

      // Log rejection event
      await client.query(
        `INSERT INTO user_activity_logs (
          user_id, action_type, resource_type, metadata
        ) VALUES ($1, $2, $3, $4)`,
        [
          userId, 'KYC_REJECTED', 'TRAVELER_KYC',
          JSON.stringify({ reason, notes })
        ]
      );

      await client.query('COMMIT');
      
      return { success: true, message: 'KYC rejected' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private async encryptAndStoreFile(file: Express.Multer.File): Promise<string> {
    // Simple encryption - in production, use proper encryption with keys
    const encrypted = crypto.createCipheriv('aes-256-gcm', Buffer.from(process.env.FILE_ENCRYPTION_KEY || 'default-key-32-bytes-long-here!', 'utf8'), Buffer.alloc(16, 0));
    
    const encryptedData = Buffer.concat([
      encrypted.update(file.buffer),
      encrypted.final()
    ]);

    const fileId = crypto.randomUUID();
    const filePath = path.join(process.cwd(), 'uploads', 'kyc', `${fileId}.enc`);
    
    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    
    // Write encrypted file
    await fs.promises.writeFile(filePath, encryptedData);
    
    return filePath;
  }
}