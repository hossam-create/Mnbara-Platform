// ============================================================
// Proof of Payment Service
// Handles proof of payment uploads and verification (Layer 3 Anti-Scam)
// ============================================================

import { PrismaClient } from '@prisma/client';
import {
  ProofStatus,
  MatchStatus,
} from '../types/enums';
import {
  ProofOfPayment,
  UploadProofInput,
  VerifyProofInput,
  FlagProofInput,
} from '../types/proof-of-payment.types';
import {
  ProofNotFoundError,
  InvalidProofStatusError,
  UnauthorizedProofAccessError,
} from '../errors/ExchangeErrors';
import { FileStorageService } from './storage/FileStorageService';

export class ProofOfPaymentService {
  constructor(
    private prisma: PrismaClient,
    private storageService: FileStorageService
  ) {}

  /**
   * Upload proof of payment
   */
  async uploadProof(input: UploadProofInput): Promise<ProofOfPayment> {
    const { matchId, userId, file, description } = input;

    // Get match details
    const match = await this.prisma.exchangeMatch.findUnique({
      where: { id: matchId },
      include: {
        request: true,
        counterRequest: true,
      },
    });

    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Verify user is part of the match
    if (
      match.request.userId !== userId &&
      match.counterRequest.userId !== userId
    ) {
      throw new UnauthorizedProofAccessError(userId, matchId);
    }

    // Verify match is in correct status
    if (match.status !== MatchStatus.SETTLING) {
      throw new Error(
        `Match ${matchId} must be in SETTLING status to upload proof`
      );
    }

    // Validate file
    this.validateProofFile(file);

    // Upload file to storage
    const fileUrl = await this.storageService.uploadFile(
      file,
      `proofs/${matchId}/${Date.now()}_${file.originalname}`
    );

    // Create proof record
    const proof = await this.prisma.proofOfPayment.create({
      data: {
        matchId,
        uploadedBy: userId,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        description,
        status: ProofStatus.PENDING,
      },
    });

    // TODO: Notify counter-party
    // TODO: Notify admin for review
    // TODO: Log event

    return this.mapToProofOfPayment(proof);
  }

  /**
   * Get proof by ID
   */
  async getProof(proofId: number, userId: number): Promise<ProofOfPayment> {
    const proof = await this.prisma.proofOfPayment.findUnique({
      where: { id: proofId },
      include: {
        match: {
          include: {
            request: true,
            counterRequest: true,
          },
        },
      },
    });

    if (!proof) {
      throw new ProofNotFoundError(proofId);
    }

    // Verify user has access
    if (
      proof.match.request.userId !== userId &&
      proof.match.counterRequest.userId !== userId &&
      proof.verifiedBy !== userId
    ) {
      throw new UnauthorizedProofAccessError(userId, proof.matchId);
    }

    return this.mapToProofOfPayment(proof);
  }

  /**
   * Get all proofs for a match
   */
  async getMatchProofs(
    matchId: number,
    userId: number
  ): Promise<ProofOfPayment[]> {
    // Verify user has access to match
    const match = await this.prisma.exchangeMatch.findUnique({
      where: { id: matchId },
      include: {
        request: true,
        counterRequest: true,
      },
    });

    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    if (
      match.request.userId !== userId &&
      match.counterRequest.userId !== userId
    ) {
      throw new UnauthorizedProofAccessError(userId, matchId);
    }

    const proofs = await this.prisma.proofOfPayment.findMany({
      where: { matchId },
      orderBy: { uploadedAt: 'desc' },
    });

    return proofs.map((proof) => this.mapToProofOfPayment(proof));
  }

  /**
   * Verify proof (admin only)
   */
  async verifyProof(input: VerifyProofInput): Promise<ProofOfPayment> {
    const { proofId, adminId, approved, rejectionReason } = input;

    const proof = await this.prisma.proofOfPayment.findUnique({
      where: { id: proofId },
      include: {
        match: true,
      },
    });

    if (!proof) {
      throw new ProofNotFoundError(proofId);
    }

    // Check if proof is in correct status
    if (proof.status !== ProofStatus.PENDING) {
      throw new InvalidProofStatusError(
        proofId,
        proof.status,
        'PENDING'
      );
    }

    // Update proof status
    const updatedProof = await this.prisma.proofOfPayment.update({
      where: { id: proofId },
      data: {
        status: approved ? ProofStatus.VERIFIED : ProofStatus.REJECTED,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: approved ? null : rejectionReason,
      },
    });

    // If approved, trigger settlement completion
    if (approved) {
      // TODO: Integrate with SettlementCoordinatorService
      // await settlementCoordinator.completeSettlement(proof.match.settlementId);
    } else {
      // If rejected, notify uploader and request re-upload
      // TODO: Notify uploader
      // TODO: Log event
    }

    return this.mapToProofOfPayment(updatedProof);
  }

  /**
   * Flag proof as suspicious
   */
  async flagProof(input: FlagProofInput): Promise<ProofOfPayment> {
    const { proofId, userId, reason } = input;

    const proof = await this.prisma.proofOfPayment.findUnique({
      where: { id: proofId },
      include: {
        match: {
          include: {
            request: true,
            counterRequest: true,
          },
        },
      },
    });

    if (!proof) {
      throw new ProofNotFoundError(proofId);
    }

    // Verify user has access
    if (
      proof.match.request.userId !== userId &&
      proof.match.counterRequest.userId !== userId
    ) {
      throw new UnauthorizedProofAccessError(userId, proof.matchId);
    }

    // Update proof status
    const updatedProof = await this.prisma.proofOfPayment.update({
      where: { id: proofId },
      data: {
        status: ProofStatus.FLAGGED,
        flaggedBy: userId,
        flaggedAt: new Date(),
        flagReason: reason,
      },
    });

    // TODO: Notify admin for review
    // TODO: Escalate to fraud detection
    // TODO: Log event

    return this.mapToProofOfPayment(updatedProof);
  }

  /**
   * Get pending proofs for admin review
   */
  async getPendingProofs(limit: number = 50): Promise<ProofOfPayment[]> {
    const proofs = await this.prisma.proofOfPayment.findMany({
      where: {
        status: ProofStatus.PENDING,
      },
      orderBy: { uploadedAt: 'asc' },
      take: limit,
      include: {
        match: {
          include: {
            request: true,
            counterRequest: true,
          },
        },
      },
    });

    return proofs.map((proof) => this.mapToProofOfPayment(proof));
  }

  /**
   * Get flagged proofs for admin review
   */
  async getFlaggedProofs(limit: number = 50): Promise<ProofOfPayment[]> {
    const proofs = await this.prisma.proofOfPayment.findMany({
      where: {
        status: ProofStatus.FLAGGED,
      },
      orderBy: { flaggedAt: 'asc' },
      take: limit,
      include: {
        match: {
          include: {
            request: true,
            counterRequest: true,
          },
        },
      },
    });

    return proofs.map((proof) => this.mapToProofOfPayment(proof));
  }

  /**
   * Delete proof (admin only or uploader within 5 minutes)
   */
  async deleteProof(proofId: number, userId: number): Promise<void> {
    const proof = await this.prisma.proofOfPayment.findUnique({
      where: { id: proofId },
    });

    if (!proof) {
      throw new ProofNotFoundError(proofId);
    }

    // Check if user can delete
    const isUploader = proof.uploadedBy === userId;
    const uploadedRecently =
      Date.now() - proof.uploadedAt.getTime() < 5 * 60 * 1000; // 5 minutes

    if (!isUploader || !uploadedRecently) {
      throw new Error(
        'Only uploader can delete proof within 5 minutes of upload'
      );
    }

    // Delete file from storage
    await this.storageService.deleteFile(proof.fileUrl);

    // Delete proof record
    await this.prisma.proofOfPayment.delete({
      where: { id: proofId },
    });

    // TODO: Log event
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private validateProofFile(file: Express.Multer.File): void {
    // Allowed file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }

    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of 10MB`);
    }

    // Validate file name
    if (!file.originalname || file.originalname.length > 255) {
      throw new Error('Invalid file name');
    }
  }

  private mapToProofOfPayment(data: any): ProofOfPayment {
    return {
      id: data.id,
      matchId: data.matchId,
      uploadedBy: data.uploadedBy,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      description: data.description,
      status: data.status,
      uploadedAt: data.uploadedAt,
      verifiedBy: data.verifiedBy,
      verifiedAt: data.verifiedAt,
      rejectionReason: data.rejectionReason,
      flaggedBy: data.flaggedBy,
      flaggedAt: data.flaggedAt,
      flagReason: data.flagReason,
    };
  }
}
