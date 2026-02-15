// ============================================================
// Proof of Payment Types
// ============================================================

import { VerificationStatus } from './enums';

export interface ProofOfPayment {
  id: number;
  matchId: number;
  uploadedBy: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  status: VerificationStatus;
  uploadedAt: Date;
  verifiedBy?: number;
  verifiedAt?: Date;
  rejectionReason?: string;
  flaggedBy?: number;
  flaggedAt?: Date;
  flagReason?: string;
}

export interface UploadProofInput {
  matchId: number;
  userId: number;
  file: Express.Multer.File;
  description?: string;
}

export interface VerifyProofInput {
  proofId: number;
  adminId: number;
  approved: boolean;
  rejectionReason?: string;
}

export interface FlagProofInput {
  proofId: number;
  userId: number;
  reason: string;
}
