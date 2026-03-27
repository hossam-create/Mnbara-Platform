// ============================================================
// Security Types (Security Deposit & Proof of Payment)
// ============================================================

import { Decimal } from 'decimal.js';
import { DepositSource, DepositStatus, VerificationStatus } from './enums';

// ============================================================
// Security Deposit
// ============================================================

export interface SecurityDeposit {
  id: number;
  userId: number;
  amount: Decimal;
  currency: string;
  source: DepositSource;
  status: DepositStatus;
  frozenAmount: Decimal;
  frozenReason?: string | null;
  frozenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSecurityDepositInput {
  userId: number;
  amount: Decimal;
  currency: string;
  source: DepositSource;
}

export interface UpdateSecurityDepositInput {
  userId: number;
  currency: string;
  amount?: Decimal;
  frozenAmount?: Decimal;
  status?: DepositStatus;
  frozenReason?: string;
  frozenAt?: Date;
}

export interface FreezeDepositInput {
  userId: number;
  currency: string;
  amount: Decimal;
  reason: string;
}

export interface DeductDepositInput {
  userId: number;
  currency: string;
  amount: Decimal;
  reason: string;
}

// ============================================================
// Proof of Payment
// ============================================================

export interface ProofOfPayment {
  id: number;
  requestId: number;
  userId: number;
  photoUrl: string;
  videoUrl?: string | null;
  timestamp: Date;
  referenceId: string;
  recipientName: string;
  paymentMethod: string;
  metadata?: any;
  verificationStatus: VerificationStatus;
  verifiedBy?: number | null;
  verifiedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
}

export interface UploadProofInput {
  requestId: number;
  userId: number;
  photoFile: Express.Multer.File;
  videoFile?: Express.Multer.File;
  referenceId: string;
  recipientName: string;
  paymentMethod: string;
  metadata?: Record<string, any>;
}

export interface VerifyProofInput {
  proofId: number;
  adminId: number;
  approved: boolean;
  rejectionReason?: string;
}

export interface ProofValidationResult {
  valid: boolean;
  errors: string[];
}
