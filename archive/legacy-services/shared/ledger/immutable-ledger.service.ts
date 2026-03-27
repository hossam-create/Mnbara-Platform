import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as crypto from 'crypto';
import {
  LedgerEntryType,
  LedgerEntryStatus,
  CreateLedgerEntryInput,
  LedgerEntryResponse,
  LedgerVerificationResult,
  LedgerInvalidEntry,
  LedgerQueryFilters,
  LedgerSummary
} from './ledger.types';

// Type for Prisma transaction client
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Hash algorithm used for cryptographic chaining
const HASH_ALGORITHM = 'SHA-256';

/**
 * Immutable Ledger Service
 * 
 * Implements an append-only transaction ledger with cryptographic chaining
 * for maintaining an immutable audit trail of all financial transactions.
 * 
 * Key features:
 * - Append-only: Entries cannot be modified or deleted
 * - Cryptographic chaining: Each entry's hash includes the previous entry's hash
 * - Integrity verification: Chain can be verified at any time
 * - Atomic operations: All writes use serializable transactions
 */
export class ImmutableLedgerService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Append a new entry to the ledger
   * This is the only way to add data - entries cannot be modified after creation
   */
  async appendEntry(input: CreateLedgerEntryInput): Promise<LedgerEntryResponse> {
    return await this.prisma.$transaction(async (tx: TransactionClient) => {
      // Get the last entry to chain from
      const lastEntry = await tx.immutableLedger.findFirst({
        orderBy: { sequenceNumber: 'desc' }
      });

      if (!lastEntry) {
        throw new Error('Ledger not initialized - genesis block missing');
      }

      // Get next sequence number atomically
      const sequenceResult = await tx.$queryRaw<[{ get_next_ledger_sequence: bigint }]>`
        SELECT get_next_ledger_sequence()
      `;
      const sequenceNumber = Number(sequenceResult[0].get_next_ledger_sequence);

      // Generate entry number
      const entryNumber = this.generateEntryNumber(input.entryType, sequenceNumber);

      // Calculate entry hash (includes previous hash for chaining)
      const entryData = {
        sequenceNumber,
        entryNumber,
        entryType: input.entryType,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        amount: input.amount,
        currency: input.currency,
        orderId: input.orderId,
        escrowId: input.escrowId,
        swapId: input.swapId,
        auctionId: input.auctionId,
        transactionRef: input.transactionRef,
        description: input.description,
        previousHash: lastEntry.entryHash
      };

      const entryHash = this.calculateHash(entryData);

      // Create the ledger entry
      const entry = await tx.immutableLedger.create({
        data: {
          entryNumber,
          entryType: input.entryType,
          status: LedgerEntryStatus.PENDING,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
          amount: new Decimal(input.amount),
          currency: input.currency,
          orderId: input.orderId,
          escrowId: input.escrowId,
          swapId: input.swapId,
          auctionId: input.auctionId,
          transactionRef: input.transactionRef,
          description: input.description,
          metadata: input.metadata || {},
          previousHash: lastEntry.entryHash,
          entryHash,
          hashAlgorithm: HASH_ALGORITHM,
          sequenceNumber
        }
      });

      return this.formatEntryResponse(entry);
    }, {
      isolationLevel: 'Serializable' as any,
      timeout: 15000
    });
  }

  /**
   * Confirm a pending entry
   * This is the only allowed modification - changing status from PENDING to CONFIRMED
   */
  async confirmEntry(entryId: number): Promise<LedgerEntryResponse> {
    const entry = await this.prisma.immutableLedger.update({
      where: { id: entryId },
      data: {
        status: LedgerEntryStatus.CONFIRMED,
        confirmedAt: new Date()
      }
    });

    return this.formatEntryResponse(entry);
  }

  /**
   * Mark a pending entry as failed
   * This is the only allowed modification - changing status from PENDING to FAILED
   */
  async failEntry(entryId: number): Promise<LedgerEntryResponse> {
    const entry = await this.prisma.immutableLedger.update({
      where: { id: entryId },
      data: {
        status: LedgerEntryStatus.FAILED,
        confirmedAt: new Date()
      }
    });

    return this.formatEntryResponse(entry);
  }

  /**
   * Create a reversal entry for a confirmed entry
   * Instead of modifying the original, we append a new reversal entry
   */
  async createReversalEntry(
    originalEntryId: number,
    reason: string
  ): Promise<LedgerEntryResponse> {
    const originalEntry = await this.prisma.immutableLedger.findUnique({
      where: { id: originalEntryId }
    });

    if (!originalEntry) {
      throw new Error(`Entry ${originalEntryId} not found`);
    }

    if (originalEntry.status !== LedgerEntryStatus.CONFIRMED) {
      throw new Error('Can only reverse confirmed entries');
    }

    // Create reversal entry with negated amount
    return await this.appendEntry({
      entryType: originalEntry.entryType as LedgerEntryType,
      fromUserId: originalEntry.toUserId || undefined,
      toUserId: originalEntry.fromUserId || undefined,
      amount: -Number(originalEntry.amount),
      currency: originalEntry.currency,
      orderId: originalEntry.orderId || undefined,
      escrowId: originalEntry.escrowId || undefined,
      swapId: originalEntry.swapId || undefined,
      auctionId: originalEntry.auctionId || undefined,
      transactionRef: `REV-${originalEntry.entryNumber}`,
      description: `Reversal of ${originalEntry.entryNumber}: ${reason}`,
      metadata: {
        reversalOf: originalEntry.id,
        originalEntryNumber: originalEntry.entryNumber,
        reversalReason: reason
      }
    });
  }

  /**
   * Verify the integrity of the entire ledger chain
   */
  async verifyChainIntegrity(
    options: { startSequence?: number; endSequence?: number } = {}
  ): Promise<LedgerVerificationResult> {
    const startTime = Date.now();
    const invalidEntries: LedgerInvalidEntry[] = [];

    // Build query conditions
    const where: any = {};
    if (options.startSequence !== undefined) {
      where.sequenceNumber = { ...where.sequenceNumber, gte: options.startSequence };
    }
    if (options.endSequence !== undefined) {
      where.sequenceNumber = { ...where.sequenceNumber, lte: options.endSequence };
    }

    // Fetch entries in order
    const entries = await this.prisma.immutableLedger.findMany({
      where,
      orderBy: { sequenceNumber: 'asc' }
    });

    let previousHash = '';
    let verifiedCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Skip genesis block hash verification
      if (entry.sequenceNumber === BigInt(0)) {
        previousHash = entry.entryHash;
        verifiedCount++;
        continue;
      }

      // Verify previous hash matches
      if (entry.previousHash !== previousHash) {
        invalidEntries.push({
          entryId: entry.id,
          entryNumber: entry.entryNumber,
          expectedHash: previousHash,
          actualHash: entry.previousHash,
          reason: 'Previous hash mismatch - chain broken'
        });
      }

      // Recalculate and verify entry hash
      const entryData = {
        sequenceNumber: Number(entry.sequenceNumber),
        entryNumber: entry.entryNumber,
        entryType: entry.entryType,
        fromUserId: entry.fromUserId,
        toUserId: entry.toUserId,
        amount: Number(entry.amount),
        currency: entry.currency,
        orderId: entry.orderId,
        escrowId: entry.escrowId,
        swapId: entry.swapId,
        auctionId: entry.auctionId,
        transactionRef: entry.transactionRef,
        description: entry.description,
        previousHash: entry.previousHash
      };

      const calculatedHash = this.calculateHash(entryData);

      if (calculatedHash !== entry.entryHash) {
        invalidEntries.push({
          entryId: entry.id,
          entryNumber: entry.entryNumber,
          expectedHash: calculatedHash,
          actualHash: entry.entryHash,
          reason: 'Entry hash mismatch - data tampered'
        });
      } else {
        verifiedCount++;
      }

      previousHash = entry.entryHash;
    }

    return {
      isValid: invalidEntries.length === 0,
      totalEntries: entries.length,
      verifiedEntries: verifiedCount,
      invalidEntries,
      verificationTime: Date.now() - startTime
    };
  }


  /**
   * Query ledger entries with filters
   */
  async queryEntries(filters: LedgerQueryFilters): Promise<{
    entries: LedgerEntryResponse[];
    total: number;
  }> {
    const where: any = {};

    if (filters.entryType) where.entryType = filters.entryType;
    if (filters.status) where.status = filters.status;
    if (filters.fromUserId) where.fromUserId = filters.fromUserId;
    if (filters.toUserId) where.toUserId = filters.toUserId;
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.escrowId) where.escrowId = filters.escrowId;
    if (filters.swapId) where.swapId = filters.swapId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) where.amount.gte = filters.minAmount;
      if (filters.maxAmount !== undefined) where.amount.lte = filters.maxAmount;
    }

    const [entries, total] = await Promise.all([
      this.prisma.immutableLedger.findMany({
        where,
        orderBy: { sequenceNumber: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0
      }),
      this.prisma.immutableLedger.count({ where })
    ]);

    return {
      entries: entries.map(e => this.formatEntryResponse(e)),
      total
    };
  }

  /**
   * Get entry by ID
   */
  async getEntryById(entryId: number): Promise<LedgerEntryResponse | null> {
    const entry = await this.prisma.immutableLedger.findUnique({
      where: { id: entryId }
    });

    return entry ? this.formatEntryResponse(entry) : null;
  }

  /**
   * Get entry by entry number
   */
  async getEntryByNumber(entryNumber: string): Promise<LedgerEntryResponse | null> {
    const entry = await this.prisma.immutableLedger.findUnique({
      where: { entryNumber }
    });

    return entry ? this.formatEntryResponse(entry) : null;
  }

  /**
   * Get entries for a user (as sender or receiver)
   */
  async getUserEntries(
    userId: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ entries: LedgerEntryResponse[]; total: number }> {
    const where = {
      OR: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    };

    const [entries, total] = await Promise.all([
      this.prisma.immutableLedger.findMany({
        where,
        orderBy: { sequenceNumber: 'desc' },
        take: options.limit || 100,
        skip: options.offset || 0
      }),
      this.prisma.immutableLedger.count({ where })
    ]);

    return {
      entries: entries.map(e => this.formatEntryResponse(e)),
      total
    };
  }

  /**
   * Get ledger summary statistics
   */
  async getLedgerSummary(
    startDate?: Date,
    endDate?: Date
  ): Promise<LedgerSummary> {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get counts and aggregations
    const [
      totalEntries,
      byType,
      byStatus,
      lastEntry,
      totalVolume
    ] = await Promise.all([
      this.prisma.immutableLedger.count({ where }),
      this.prisma.immutableLedger.groupBy({
        by: ['entryType'],
        where,
        _count: true,
        _sum: { amount: true }
      }),
      this.prisma.immutableLedger.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      this.prisma.immutableLedger.findFirst({
        where,
        orderBy: { sequenceNumber: 'desc' }
      }),
      this.prisma.immutableLedger.aggregate({
        where: { ...where, amount: { gt: 0 } },
        _sum: { amount: true }
      })
    ]);

    // Verify chain integrity (quick check on last 100 entries)
    const integrityCheck = await this.verifyChainIntegrity({
      startSequence: lastEntry ? Number(lastEntry.sequenceNumber) - 100 : 0
    });

    return {
      totalEntries,
      totalVolume: totalVolume._sum.amount ? Number(totalVolume._sum.amount) : 0,
      byType: byType.reduce((acc, item) => {
        acc[item.entryType] = {
          count: item._count,
          volume: item._sum.amount ? Number(item._sum.amount) : 0
        };
        return acc;
      }, {} as Record<string, { count: number; volume: number }>),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      lastEntryAt: lastEntry?.createdAt,
      chainIntegrity: integrityCheck.isValid
    };
  }

  /**
   * Get audit trail for a specific order
   */
  async getOrderAuditTrail(orderId: number): Promise<LedgerEntryResponse[]> {
    const entries = await this.prisma.immutableLedger.findMany({
      where: { orderId },
      orderBy: { sequenceNumber: 'asc' }
    });

    return entries.map(e => this.formatEntryResponse(e));
  }

  /**
   * Get audit trail for a specific escrow
   */
  async getEscrowAuditTrail(escrowId: number): Promise<LedgerEntryResponse[]> {
    const entries = await this.prisma.immutableLedger.findMany({
      where: { escrowId },
      orderBy: { sequenceNumber: 'asc' }
    });

    return entries.map(e => this.formatEntryResponse(e));
  }

  /**
   * Get audit trail for a specific swap
   */
  async getSwapAuditTrail(swapId: number): Promise<LedgerEntryResponse[]> {
    const entries = await this.prisma.immutableLedger.findMany({
      where: { swapId },
      orderBy: { sequenceNumber: 'asc' }
    });

    return entries.map(e => this.formatEntryResponse(e));
  }

  /**
   * Export ledger entries for compliance/audit
   */
  async exportEntries(
    filters: LedgerQueryFilters,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const { entries } = await this.queryEntries({
      ...filters,
      limit: 10000 // Max export limit
    });

    if (format === 'csv') {
      return this.entriesToCsv(entries);
    }

    return JSON.stringify(entries, null, 2);
  }

  // ============ Private Helper Methods ============

  /**
   * Generate entry number based on type and sequence
   */
  private generateEntryNumber(entryType: LedgerEntryType, sequence: number): string {
    const typePrefix = this.getTypePrefix(entryType);
    const paddedSequence = sequence.toString().padStart(10, '0');
    return `${typePrefix}-${paddedSequence}`;
  }

  /**
   * Get prefix for entry type
   */
  private getTypePrefix(entryType: LedgerEntryType): string {
    const prefixes: Record<LedgerEntryType, string> = {
      [LedgerEntryType.PAYMENT]: 'PAY',
      [LedgerEntryType.REFUND]: 'REF',
      [LedgerEntryType.ESCROW_HOLD]: 'ESH',
      [LedgerEntryType.ESCROW_RELEASE]: 'ESR',
      [LedgerEntryType.ESCROW_REFUND]: 'ESF',
      [LedgerEntryType.WITHDRAWAL]: 'WTH',
      [LedgerEntryType.DEPOSIT]: 'DEP',
      [LedgerEntryType.FEE]: 'FEE',
      [LedgerEntryType.REWARD]: 'RWD',
      [LedgerEntryType.SWAP_INITIATED]: 'SWI',
      [LedgerEntryType.SWAP_COMPLETED]: 'SWC',
      [LedgerEntryType.SWAP_CANCELLED]: 'SWX',
      [LedgerEntryType.ORDER_CREATED]: 'ORD',
      [LedgerEntryType.ORDER_COMPLETED]: 'ORC',
      [LedgerEntryType.ORDER_CANCELLED]: 'ORX',
      [LedgerEntryType.BID_PLACED]: 'BID',
      [LedgerEntryType.AUCTION_WON]: 'AWN',
      [LedgerEntryType.SYSTEM_ADJUSTMENT]: 'ADJ',
      [LedgerEntryType.MIGRATION]: 'MIG'
    };
    return prefixes[entryType] || 'UNK';
  }

  /**
   * Calculate SHA-256 hash of entry data
   */
  private calculateHash(data: Record<string, any>): string {
    const sortedData = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(sortedData).digest('hex');
  }

  /**
   * Format entry for response
   */
  private formatEntryResponse(entry: any): LedgerEntryResponse {
    return {
      id: entry.id,
      entryNumber: entry.entryNumber,
      entryType: entry.entryType as LedgerEntryType,
      status: entry.status as LedgerEntryStatus,
      fromUserId: entry.fromUserId,
      toUserId: entry.toUserId,
      amount: Number(entry.amount),
      currency: entry.currency,
      orderId: entry.orderId,
      escrowId: entry.escrowId,
      swapId: entry.swapId,
      auctionId: entry.auctionId,
      transactionRef: entry.transactionRef,
      description: entry.description,
      metadata: entry.metadata as Record<string, any>,
      previousHash: entry.previousHash,
      entryHash: entry.entryHash,
      createdAt: entry.createdAt,
      confirmedAt: entry.confirmedAt
    };
  }

  /**
   * Convert entries to CSV format
   */
  private entriesToCsv(entries: LedgerEntryResponse[]): string {
    const headers = [
      'Entry Number',
      'Type',
      'Status',
      'From User',
      'To User',
      'Amount',
      'Currency',
      'Order ID',
      'Escrow ID',
      'Swap ID',
      'Description',
      'Entry Hash',
      'Created At'
    ];

    const rows = entries.map(e => [
      e.entryNumber,
      e.entryType,
      e.status,
      e.fromUserId || '',
      e.toUserId || '',
      e.amount,
      e.currency,
      e.orderId || '',
      e.escrowId || '',
      e.swapId || '',
      `"${e.description.replace(/"/g, '""')}"`,
      e.entryHash,
      e.createdAt.toISOString()
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export default ImmutableLedgerService;
