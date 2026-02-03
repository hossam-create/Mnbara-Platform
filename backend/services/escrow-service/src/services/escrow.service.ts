// Escrow Service - Traditional Implementation
// Inspired by: SmartContractEscrowSystem/EscrowContract.sol

import { PrismaClient, EscrowStatus, DisputeStatus } from '@prisma/client';
import {
  CreateEscrowDto,
  AddSignatureDto,
  LockTransactionDto,
  InitiateDisputeDto,
  ResolveDisputeDto,
  EscrowTransaction,
  Signature
} from '../types/escrow.types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class EscrowService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create Escrow Transaction
   * Inspired by: function createTransaction(bytes32 transactionId, address _seller, address _arbitrator)
   */
  async createTransaction(data: CreateEscrowDto): Promise<EscrowTransaction> {
    logger.info(`Creating escrow transaction for buyer: ${data.buyerId}`);

    // Generate unique transaction ID (like bytes32 in Solidity)
    const transactionId = uuidv4();

    const escrow = await this.prisma.escrow.create({
      data: {
        transactionId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        arbitratorId: data.arbitratorId,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: EscrowStatus.CREATED,
        disputeStatus: DisputeStatus.NONE,
        signatures: []
      }
    });

    // Log event (like emit TransactionCreated in Smart Contract)
    await this.logEvent(escrow.id, 'TransactionCreated', {
      buyer: data.buyerId,
      seller: data.sellerId,
      amount: data.amount
    }, data.buyerId);

    logger.info(`Escrow created: ${escrow.id}`);
    return this.mapToEscrowTransaction(escrow);
  }

  /**
   * Add Signature
   * Inspired by: function addSignature(bytes32 transactionId)
   */
  async addSignature(
    escrowId: string,
    signatureData: AddSignatureDto
  ): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Check status (like in Smart Contract)
    if (escrow.status !== EscrowStatus.CREATED && escrow.status !== EscrowStatus.LOCKED) {
      throw new Error('Transaction status does not allow adding signatures');
    }

    // Get existing signatures
    const signatures = (escrow.signatures as any[]) || [];

    // Check if already signed
    const alreadySigned = signatures.some(
      (sig: any) => sig.userId === signatureData.userId
    );

    if (alreadySigned) {
      throw new Error('Signature already added');
    }

    // Add new signature
    const newSignature: Signature = {
      userId: signatureData.userId,
      role: signatureData.role,
      signature: signatureData.signature,
      timestamp: new Date()
    };

    signatures.push(newSignature);

    // Update escrow
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        signatures,
        // If both buyer and seller signed, change status to SIGNED
        status: signatures.length >= 2 ? EscrowStatus.SIGNED : escrow.status
      }
    });

    // Log event (like emit SignatureAdded)
    await this.logEvent(escrowId, 'SignatureAdded', {
      signer: signatureData.userId,
      role: signatureData.role
    }, signatureData.userId);

    logger.info(`Signature added to escrow: ${escrowId} by ${signatureData.userId}`);
  }

  /**
   * Lock Transaction
   * Inspired by: function lockTransaction(bytes32 transactionId, uint256 disputeDuration)
   */
  async lockTransaction(
    escrowId: string,
    buyerId: string,
    lockData: LockTransactionDto
  ): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Only buyer can lock (like onlyBuyer modifier)
    if (escrow.buyerId !== buyerId) {
      throw new Error('Only the buyer can lock this transaction');
    }

    // Check status (like inStatus modifier)
    if (escrow.status !== EscrowStatus.SIGNED) {
      throw new Error('Transaction must be signed before locking');
    }

    // Check seller signature
    const signatures = (escrow.signatures as any[]) || [];
    const sellerSigned = signatures.some(
      (sig: any) => sig.userId === escrow.sellerId
    );

    if (!sellerSigned) {
      throw new Error('Seller has not signed the transaction');
    }

    // Calculate dispute deadline
    const disputeDuration = lockData.disputeDuration || 7; // default 7 days
    const disputeDeadline = new Date();
    disputeDeadline.setDate(disputeDeadline.getDate() + disputeDuration);

    // Lock the transaction
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.LOCKED,
        lockedAt: new Date(),
        disputeDeadline
      }
    });

    // Hold funds (integrate with payment service)
    await this.holdFunds(escrow.buyerId, escrow.amount);

    // Log event (like emit TransactionLocked)
    await this.logEvent(escrowId, 'TransactionLocked', {
      disputeDeadline
    }, buyerId);

    logger.info(`Transaction locked: ${escrowId}`);
  }

  /**
   * Release Transaction
   * Inspired by: function releaseTransaction(bytes32 transactionId)
   */
  async releaseTransaction(escrowId: string, buyerId: string): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Only buyer can release (like onlyBuyer modifier)
    if (escrow.buyerId !== buyerId) {
      throw new Error('Only the buyer can release this transaction');
    }

    // Check status (like inStatus modifier)
    if (escrow.status !== EscrowStatus.LOCKED) {
      throw new Error('Transaction must be locked before releasing');
    }

    // Check seller signature
    const signatures = (escrow.signatures as any[]) || [];
    const sellerSigned = signatures.some(
      (sig: any) => sig.userId === escrow.sellerId
    );

    if (!sellerSigned) {
      throw new Error('Seller has not signed the transaction');
    }

    // Release funds to seller
    await this.transferFunds(escrow.buyerId, escrow.sellerId, escrow.amount);

    // Update status
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.RELEASED,
        releasedAt: new Date()
      }
    });

    // Log event (like emit TransactionReleased)
    await this.logEvent(escrowId, 'TransactionReleased', {
      seller: escrow.sellerId,
      amount: escrow.amount
    }, buyerId);

    logger.info(`Funds released for escrow: ${escrowId}`);
  }

  /**
   * Initiate Dispute
   * Inspired by: function initiateDispute(bytes32 transactionId, string memory disputeReasonIPFS)
   */
  async initiateDispute(
    escrowId: string,
    disputeData: InitiateDisputeDto
  ): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Only buyer or seller can initiate dispute
    if (disputeData.userId !== escrow.buyerId && disputeData.userId !== escrow.sellerId) {
      throw new Error('Only buyer or seller can initiate dispute');
    }

    // Check status (like inStatus modifier)
    if (escrow.status !== EscrowStatus.LOCKED) {
      throw new Error('Can only dispute locked transactions');
    }

    // Check arbitrator signature (if arbitrator exists)
    if (escrow.arbitratorId) {
      const signatures = (escrow.signatures as any[]) || [];
      const arbitratorSigned = signatures.some(
        (sig: any) => sig.userId === escrow.arbitratorId
      );

      if (!arbitratorSigned) {
        throw new Error('Arbitrator has not signed the transaction');
      }
    }

    // Update to disputed status
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.DISPUTED,
        disputeStatus: DisputeStatus.INITIATED,
        disputeReason: disputeData.reason,
        disputeReasonIPFS: disputeData.evidence ? JSON.stringify(disputeData.evidence) : undefined
      }
    });

    // Log event (like emit TransactionDispute)
    await this.logEvent(escrowId, 'TransactionDispute', {
      initiatedBy: disputeData.userId,
      reason: disputeData.reason
    }, disputeData.userId);

    logger.info(`Dispute initiated for escrow: ${escrowId}`);
  }

  /**
   * Resolve Dispute
   * Inspired by: function resolveDispute(bytes32 transactionId, bool isBuyerWinner)
   */
  async resolveDispute(
    escrowId: string,
    resolutionData: ResolveDisputeDto
  ): Promise<void> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Only arbitrator can resolve (like onlyArbitrator modifier)
    if (escrow.arbitratorId !== resolutionData.arbitratorId) {
      throw new Error('Only the arbitrator can resolve this dispute');
    }

    // Check status (like inStatus modifier)
    if (escrow.status !== EscrowStatus.DISPUTED) {
      throw new Error('Escrow is not in dispute');
    }

    // Transfer funds based on resolution
    if (resolutionData.resolution === 'BUYER') {
      // Buyer wins - refund to buyer
      await this.refundFunds(escrow.buyerId, escrow.amount);
    } else {
      // Seller wins - transfer to seller
      await this.transferFunds(escrow.buyerId, escrow.sellerId, escrow.amount);
    }

    // Update status
    await this.prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.RESOLVED,
        disputeStatus: DisputeStatus.RESOLVED,
        resolution: resolutionData.resolution,
        resolvedBy: resolutionData.arbitratorId,
        resolvedAt: new Date()
      }
    });

    // Log event (like emit TransactionResolved)
    await this.logEvent(escrowId, 'TransactionResolved', {
      winner: resolutionData.resolution,
      arbitrator: resolutionData.arbitratorId
    }, resolutionData.arbitratorId);

    logger.info(`Dispute resolved for escrow: ${escrowId} - Winner: ${resolutionData.resolution}`);
  }

  /**
   * Get Transaction Status
   * Inspired by: function getTransactionStatus(bytes32 transactionId)
   */
  async getTransactionStatus(escrowId: string): Promise<EscrowStatus> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId },
      select: { status: true }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    return escrow.status;
  }

  /**
   * Get Escrow by ID
   */
  async getEscrowById(escrowId: string): Promise<EscrowTransaction | null> {
    const escrow = await this.prisma.escrow.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      return null;
    }

    return this.mapToEscrowTransaction(escrow);
  }

  // Private helper methods

  private async holdFunds(userId: string, amount: any): Promise<void> {
    // TODO: Integrate with payment service or internal ledger
    logger.info(`Holding ${amount} from user: ${userId}`);
  }

  private async transferFunds(fromId: string, toId: string, amount: any): Promise<void> {
    // TODO: Integrate with payment service or internal ledger
    logger.info(`Transferring ${amount} from ${fromId} to ${toId}`);
  }

  private async refundFunds(userId: string, amount: any): Promise<void> {
    // TODO: Integrate with payment service or internal ledger
    logger.info(`Refunding ${amount} to user: ${userId}`);
  }

  private async logEvent(
    escrowId: string,
    eventType: string,
    eventData: any,
    triggeredBy: string
  ): Promise<void> {
    await this.prisma.escrowEvent.create({
      data: {
        escrowId,
        eventType,
        eventData,
        triggeredBy
      }
    });
  }

  private mapToEscrowTransaction(escrow: any): EscrowTransaction {
    return {
      id: escrow.id,
      transactionId: escrow.transactionId,
      buyerId: escrow.buyerId,
      sellerId: escrow.sellerId,
      arbitratorId: escrow.arbitratorId,
      amount: parseFloat(escrow.amount),
      currency: escrow.currency,
      status: escrow.status,
      disputeStatus: escrow.disputeStatus,
      signatures: escrow.signatures || [],
      disputeReason: escrow.disputeReason,
      disputeDeadline: escrow.disputeDeadline,
      disputeReasonIPFS: escrow.disputeReasonIPFS,
      resolution: escrow.resolution,
      resolvedBy: escrow.resolvedBy,
      resolvedAt: escrow.resolvedAt,
      createdAt: escrow.createdAt,
      updatedAt: escrow.updatedAt,
      lockedAt: escrow.lockedAt,
      releasedAt: escrow.releasedAt
    };
  }
}
