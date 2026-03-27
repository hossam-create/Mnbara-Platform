/**
 * KYC Service
 * Main verification logic with ML integration
 */

import { PrismaClient } from '@prisma/client';
import { PythonBridgeService } from './python-bridge.service';
import { StorageService } from './storage.service';
import { KYCSubmitDto, AdminReviewDto } from '../types/kyc.types';

const prisma = new PrismaClient();

export class KYCService {
  private pythonBridge: PythonBridgeService;
  private storage: StorageService;

  constructor() {
    this.pythonBridge = new PythonBridgeService();
    this.storage = new StorageService();
  }

  /**
   * Submit KYC verification
   * Performs OCR and face matching
   */
  async submitVerification(dto: KYCSubmitDto) {
    // Check if user already has verification
    const existing = await prisma.kYCVerification.findUnique({
      where: { userId: dto.userId },
    });

    if (existing && existing.status === 'APPROVED') {
      throw new Error('User already verified');
    }

    // Store images
    const idPhotoPath = await this.storage.saveFile(dto.idPhoto, 'id-photos');
    const selfiePhotoPath = await this.storage.saveFile(dto.selfiePhoto, 'selfies');

    // Convert images to base64 for Python
    const idPhotoBase64 = dto.idPhoto.buffer.toString('base64');
    const selfiePhotoBase64 = dto.selfiePhoto.buffer.toString('base64');

    // Step 1: OCR text extraction
    const ocrResult = await this.pythonBridge.extractText(idPhotoBase64);
    
    if (!ocrResult.success) {
      throw new Error(`OCR failed: ${ocrResult.error}`);
    }

    // Step 2: Text matching (simple contains check)
    const normalizedIdNumber = dto.idNumber.replace(/\s/g, '').toUpperCase();
    const ocrMatch = ocrResult.text?.includes(normalizedIdNumber) || false;

    // Step 3: Face matching
    const faceResult = await this.pythonBridge.matchFaces(
      idPhotoBase64,
      selfiePhotoBase64,
      0.5, // threshold
    );

    if (faceResult.error) {
      throw new Error(`Face matching failed: ${faceResult.error}`);
    }

    // Determine status
    let status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
    
    // Auto-approve if both checks pass
    if (ocrMatch && faceResult.match) {
      status = 'APPROVED';
    }
    // Auto-reject if both checks fail
    else if (!ocrMatch && !faceResult.match) {
      status = 'REJECTED';
    }
    // Otherwise, needs manual review
    else {
      status = 'PENDING';
    }

    // Create or update verification record
    const verification = await prisma.kYCVerification.upsert({
      where: { userId: dto.userId },
      create: {
        userId: dto.userId,
        idType: dto.idType,
        idNumber: dto.idNumber,
        fullName: dto.fullName,
        idPhotoPath,
        selfiePhotoPath,
        status,
        ocrText: ocrResult.text,
        ocrMatch,
        faceMatch: faceResult.match,
        faceConfidence: faceResult.confidence,
        faceDistance: faceResult.distance,
      },
      update: {
        idType: dto.idType,
        idNumber: dto.idNumber,
        fullName: dto.fullName,
        idPhotoPath,
        selfiePhotoPath,
        status,
        ocrText: ocrResult.text,
        ocrMatch,
        faceMatch: faceResult.match,
        faceConfidence: faceResult.confidence,
        faceDistance: faceResult.distance,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
      },
    });

    return verification;
  }

  /**
   * Get verification status for user
   */
  async getVerificationStatus(userId: number) {
    return await prisma.kYCVerification.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        status: true,
        ocrMatch: true,
        faceMatch: true,
        faceConfidence: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get pending verifications (admin)
   */
  async getPendingVerifications() {
    return await prisma.kYCVerification.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Admin review verification
   */
  async reviewVerification(dto: AdminReviewDto) {
    const verification = await prisma.kYCVerification.findUnique({
      where: { id: dto.verificationId },
    });

    if (!verification) {
      throw new Error('Verification not found');
    }

    if (verification.status !== 'PENDING') {
      throw new Error('Verification already reviewed');
    }

    return await prisma.kYCVerification.update({
      where: { id: dto.verificationId },
      data: {
        status: dto.approved ? 'APPROVED' : 'REJECTED',
        reviewedBy: dto.adminId,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });
  }
}
