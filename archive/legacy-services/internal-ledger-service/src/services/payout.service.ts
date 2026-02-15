import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { Decimal } from 'decimal.js';
import {
  PayoutStatus,
  PayoutMethod,
  CreatePayoutRequestData,
  PayoutRequest,
  PayoutFilters,
  PayoutAccountDetails,
} from '../types/payout.types';
import { WalletService } from './wallet.service';
import { InsufficientBalanceError, PayoutError } from '../errors/WalletErrors';

const prisma = new PrismaClient();

export class PayoutService {
  private walletService: WalletService;
  private encryptionKey: string;
  private encryptionAlgorithm = 'aes-256-cbc';

  constructor() {
    this.walletService = new WalletService();
    this.encryptionKey = process.env.PAYOUT_ENCRYPTION_KEY || 'default-key-change-in-production';
    
    if (this.encryptionKey === 'default-key-change-in-production') {
      console.warn('[PayoutService] WARNING: Using default encryption key. Set PAYOUT_ENCRYPTION_KEY in production!');
    }
  }

  /**
   * Encrypt account details
   */
  private encryptAccountDetails(details: PayoutAccountDetails): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(details), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt account details
   */
  private decryptAccountDetails(encryptedData: string): PayoutAccountDetails {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Create a payout request
   * Locks the amount in the wallet
   */
  async createPayoutRequest(data: CreatePayoutRequestData): Promise<PayoutRequest> {
    console.log(`[PayoutService] Creating payout request for user ${data.userId}, amount: ${data.amount}`);

    // Validate minimum amount
    const MIN_PAYOUT_AMOUNT = 10;
    if (data.amount < MIN_PAYOUT_AMOUNT) {
      throw new PayoutError(`Minimum payout amount is $${MIN_PAYOUT_AMOUNT}`);
    }

    // Check available balance
    const wallet = await prisma.wallet.findUnique({
      where: { id: data.walletId },
    });

    if (!wallet) {
      throw new PayoutError('Wallet not found');
    }

    if (wallet.userId !== data.userId) {
      throw new PayoutError('Wallet does not belong to user');
    }

    // Compare Decimal values properly
    const availableBalance = new Decimal(wallet.availableBalance.toString());
    const requestedAmount = new Decimal(data.amount.toString());
    
    if (availableBalance.lessThan(requestedAmount)) {
      throw new InsufficientBalanceError(
        `Insufficient balance. Available: ${wallet.availableBalance}, Requested: ${data.amount}`
      );
    }

    // Encrypt account details
    const encryptedDetails = this.encryptAccountDetails(data.accountDetails);

    // Create payout request and lock funds in a transaction
    const payoutRequest = await prisma.$transaction(async (tx) => {
      // Lock the amount
      await tx.wallet.update({
        where: { id: data.walletId },
        data: {
          availableBalance: { decrement: data.amount },
          lockedBalance: { increment: data.amount },
        },
      });

      // Create payout request
      const request = await tx.payoutRequest.create({
        data: {
          userId: data.userId,
          walletId: data.walletId,
          amount: data.amount,
          currency: data.currency,
          method: data.method,
          accountDetails: encryptedDetails,
          status: PayoutStatus.PENDING,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId: data.walletId,
          transactionType: 'PAYOUT',
          amount: -data.amount,
          referenceType: 'PayoutRequest',
          referenceId: request.id,
          status: 'PENDING',
        },
      });

      return request;
    });

    console.log(`[PayoutService] Payout request created: ${payoutRequest.id}`);
    return payoutRequest as any;
  }

  /**
   * Get payout requests for a user
   */
  async getUserPayoutRequests(userId: number, filters?: PayoutFilters): Promise<PayoutRequest[]> {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.method) {
      where.method = filters.method;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.requestedAt = {};
      if (filters.fromDate) {
        where.requestedAt.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.requestedAt.lte = filters.toDate;
      }
    }

    const requests = await prisma.payoutRequest.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return requests as any;
  }

  /**
   * Get pending payout requests (Admin)
   */
  async getPendingPayoutRequests(filters?: PayoutFilters): Promise<PayoutRequest[]> {
    const where: any = { status: PayoutStatus.PENDING };

    if (filters?.minAmount) {
      where.amount = { ...where.amount, gte: filters.minAmount };
    }

    if (filters?.maxAmount) {
      where.amount = { ...where.amount, lte: filters.maxAmount };
    }

    const requests = await prisma.payoutRequest.findMany({
      where,
      orderBy: { requestedAt: 'asc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });

    return requests as any;
  }

  /**
   * Approve a payout request (Admin)
   */
  async approvePayoutRequest(requestId: string, adminId: number): Promise<PayoutRequest> {
    console.log(`[PayoutService] Admin ${adminId} approving payout request ${requestId}`);

    const request = await prisma.payoutRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new PayoutError('Payout request not found');
    }

    if (request.status !== PayoutStatus.PENDING) {
      throw new PayoutError(`Cannot approve payout in status: ${request.status}`);
    }

    const updatedRequest = await prisma.payoutRequest.update({
      where: { id: requestId },
      data: {
        status: PayoutStatus.APPROVED,
        approvedByAdminId: adminId,
        processedAt: new Date(),
      },
    });

    console.log(`[PayoutService] Payout request ${requestId} approved`);
    return updatedRequest as any;
  }

  /**
   * Reject a payout request (Admin)
   * Unlocks the funds
   */
  async rejectPayoutRequest(
    requestId: string,
    adminId: number,
    rejectionReason: string
  ): Promise<PayoutRequest> {
    console.log(`[PayoutService] Admin ${adminId} rejecting payout request ${requestId}`);

    const request = await prisma.payoutRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new PayoutError('Payout request not found');
    }

    if (request.status !== PayoutStatus.PENDING) {
      throw new PayoutError(`Cannot reject payout in status: ${request.status}`);
    }

    // Reject and unlock funds in a transaction
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Unlock the amount
      await tx.wallet.update({
        where: { id: request.walletId },
        data: {
          availableBalance: { increment: request.amount },
          lockedBalance: { decrement: request.amount },
        },
      });

      // Update payout request
      const updated = await tx.payoutRequest.update({
        where: { id: requestId },
        data: {
          status: PayoutStatus.REJECTED,
          rejectedByAdminId: adminId,
          rejectionReason,
          rejectedAt: new Date(),
        },
      });

      // Update transaction status
      await tx.walletTransaction.updateMany({
        where: {
          referenceType: 'PayoutRequest',
          referenceId: requestId,
        },
        data: {
          status: 'FAILED',
        },
      });

      return updated;
    });

    console.log(`[PayoutService] Payout request ${requestId} rejected`);
    return updatedRequest as any;
  }

  /**
   * Mark payout as processing (Admin)
   */
  async markPayoutAsProcessing(requestId: string, adminId: number): Promise<PayoutRequest> {
    console.log(`[PayoutService] Admin ${adminId} marking payout ${requestId} as processing`);

    const request = await prisma.payoutRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new PayoutError('Payout request not found');
    }

    if (request.status !== PayoutStatus.APPROVED) {
      throw new PayoutError(`Cannot process payout in status: ${request.status}`);
    }

    const updatedRequest = await prisma.payoutRequest.update({
      where: { id: requestId },
      data: {
        status: PayoutStatus.PROCESSING,
        processedByAdminId: adminId,
      },
    });

    console.log(`[PayoutService] Payout request ${requestId} marked as processing`);
    return updatedRequest as any;
  }

  /**
   * Complete a payout request (Admin)
   * Deducts from locked balance
   */
  async completePayoutRequest(
    requestId: string,
    adminId: number,
    notes?: string
  ): Promise<PayoutRequest> {
    console.log(`[PayoutService] Admin ${adminId} completing payout request ${requestId}`);

    const request = await prisma.payoutRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new PayoutError('Payout request not found');
    }

    if (request.status !== PayoutStatus.PROCESSING) {
      throw new PayoutError(`Cannot complete payout in status: ${request.status}`);
    }

    // Complete and deduct from locked balance
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Deduct from locked balance
      await tx.wallet.update({
        where: { id: request.walletId },
        data: {
          lockedBalance: { decrement: request.amount },
        },
      });

      // Update payout request
      const updated = await tx.payoutRequest.update({
        where: { id: requestId },
        data: {
          status: PayoutStatus.COMPLETED,
          completedAt: new Date(),
          notes,
        },
      });

      // Update transaction status
      await tx.walletTransaction.updateMany({
        where: {
          referenceType: 'PayoutRequest',
          referenceId: requestId,
        },
        data: {
          status: 'COMPLETED',
        },
      });

      return updated;
    });

    console.log(`[PayoutService] Payout request ${requestId} completed`);
    return updatedRequest as any;
  }

  /**
   * Get payout request by ID (with decrypted account details for admin)
   */
  async getPayoutRequestById(requestId: string, decryptDetails = false): Promise<any> {
    const request = await prisma.payoutRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new PayoutError('Payout request not found');
    }

    if (decryptDetails) {
      const decryptedDetails = this.decryptAccountDetails(request.accountDetails);
      return {
        ...request,
        accountDetails: decryptedDetails,
      };
    }

    return request;
  }
}
