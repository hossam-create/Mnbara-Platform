import { ProofOfPaymentService } from '../services/proof-of-payment.service';
import { UploadProofInput } from '../types/proof-of-payment.types';

/**
 * Proof of Payment Guard - Layer 3 of Seven-Layer Anti-Scam Architecture
 * 
 * Validates proof of payment uploads.
 * Detects fraudulent proofs using validation rules.
 * Ensures all required metadata is present.
 */
export class ProofOfPaymentGuard {
  private readonly VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  private readonly VALID_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  constructor(private readonly proofOfPaymentService: ProofOfPaymentService) {}

  /**
   * Validate proof of payment before upload
   */
  async validateProof(proof: UploadProofInput): Promise<void> {
    // Validate file is present
    if (!proof.file) {
      throw new Error('Proof file is required');
    }

    // Validate description
    if (!proof.description || proof.description.length < 10) {
      throw new Error('Proof description must be at least 10 characters');
    }

    // Check for duplicate proof
    const existing = await this.proofOfPaymentService.getProofByMatch(proof.matchId);
    if (existing) {
      throw new Error(`Proof already exists for match ${proof.matchId}`);
    }
  }

  /**
   * Detect potential fraud in proof
   * Returns fraud score (0-1, higher = more suspicious)
   */
  async detectFraud(proofId: number): Promise<number> {
    const proof = await this.proofOfPaymentService.getProofById(proofId);
    if (!proof) {
      return 0;
    }

    let fraudScore = 0;

    // Check for suspicious file names
    if (proof.fileName.match(/^(test|fake|dummy)/i)) {
      fraudScore += 0.5;
    }

    // Check for generic descriptions
    if (proof.description && proof.description.match(/^(test|fake|dummy)/i)) {
      fraudScore += 0.3;
    }

    // Flag if fraud score is high
    if (fraudScore > 0.7) {
      await this.proofOfPaymentService.flagProof({
        proofId,
        userId: proof.uploadedBy,
        reason: 'High fraud score detected',
      });
    }

    return fraudScore;
  }

  /**
   * Validate file type
   */
  isValidImageType(mimeType: string): boolean {
    return this.VALID_IMAGE_TYPES.includes(mimeType);
  }

  /**
   * Validate video file type
   */
  isValidVideoType(mimeType: string): boolean {
    return this.VALID_VIDEO_TYPES.includes(mimeType);
  }

  /**
   * Validate file size
   */
  isValidFileSize(size: number, type: 'image' | 'video'): boolean {
    const maxSize = type === 'image' ? this.MAX_IMAGE_SIZE : this.MAX_VIDEO_SIZE;
    return size <= maxSize;
  }
}
