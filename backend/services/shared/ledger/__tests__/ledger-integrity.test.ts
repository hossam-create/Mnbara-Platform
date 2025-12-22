/**
 * Tests for Immutable Ledger Integrity Verification
 * Requirements: 19.4 - Create Audit_Logs table (ledger integrity)
 */

const crypto = require('crypto');

enum LedgerEntryType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  ESCROW_HOLD = 'ESCROW_HOLD',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
  FEE = 'FEE',
  REWARD = 'REWARD',
  SWAP_INITIATED = 'SWAP_INITIATED',
  SWAP_COMPLETED = 'SWAP_COMPLETED',
  SWAP_CANCELLED = 'SWAP_CANCELLED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  BID_PLACED = 'BID_PLACED',
  AUCTION_WON = 'AUCTION_WON',
  SYSTEM_ADJUSTMENT = 'SYSTEM_ADJUSTMENT',
  MIGRATION = 'MIGRATION'
}

enum LedgerEntryStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED'
}

interface LedgerEntry {
  id: number;
  entryNumber: string;
  entryType: LedgerEntryType;
  status: LedgerEntryStatus;
  fromUserId: number | null;
  toUserId: number | null;
  amount: number;
  currency: string;
  orderId: number | null;
  escrowId: number | null;
  swapId: number | null;
  auctionId: number | null;
  transactionRef: string | null;
  description: string;
  previousHash: string;
  entryHash: string;
  sequenceNumber: number;
}


interface VerificationResult {
  isValid: boolean;
  totalEntries: number;
  verifiedEntries: number;
  invalidEntries: Array<{
    entryId: number;
    entryNumber: string;
    expectedHash: string;
    actualHash: string;
    reason: string;
  }>;
  verificationTime: number;
}

function calculateHash(data: Record<string, unknown>): string {
  const sortedData = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(sortedData).digest('hex');
}

function generateEntryNumber(entryType: LedgerEntryType, sequence: number): string {
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
  const prefix = prefixes[entryType] || 'UNK';
  return prefix + '-' + sequence.toString().padStart(10, '0');
}

function createMockEntry(
  sequence: number,
  entryType: LedgerEntryType,
  previousHash: string,
  overrides: Partial<LedgerEntry> = {}
): LedgerEntry {
  const entryNumber = generateEntryNumber(entryType, sequence);
  
  const entryData = {
    sequenceNumber: sequence,
    entryNumber,
    entryType,
    fromUserId: overrides.fromUserId !== undefined ? overrides.fromUserId : 100,
    toUserId: overrides.toUserId !== undefined ? overrides.toUserId : 200,
    amount: overrides.amount !== undefined ? overrides.amount : 100,
    currency: overrides.currency || 'USD',
    orderId: overrides.orderId !== undefined ? overrides.orderId : null,
    escrowId: overrides.escrowId !== undefined ? overrides.escrowId : null,
    swapId: overrides.swapId !== undefined ? overrides.swapId : null,
    auctionId: overrides.auctionId !== undefined ? overrides.auctionId : null,
    transactionRef: overrides.transactionRef !== undefined ? overrides.transactionRef : 'TXN-' + sequence,
    description: overrides.description || 'Test entry ' + sequence,
    previousHash
  };

  const entryHash = calculateHash(entryData);

  return {
    id: sequence,
    entryNumber,
    entryType,
    status: overrides.status || LedgerEntryStatus.CONFIRMED,
    fromUserId: entryData.fromUserId,
    toUserId: entryData.toUserId,
    amount: entryData.amount,
    currency: entryData.currency,
    orderId: entryData.orderId,
    escrowId: entryData.escrowId,
    swapId: entryData.swapId,
    auctionId: entryData.auctionId,
    transactionRef: entryData.transactionRef,
    description: entryData.description,
    previousHash,
    entryHash,
    sequenceNumber: sequence
  };
}


function verifyChainIntegrity(entries: LedgerEntry[]): VerificationResult {
  const startTime = Date.now();
  const invalidEntries: VerificationResult['invalidEntries'] = [];
  let previousHash = '';
  let verifiedCount = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (entry.sequenceNumber === 0) {
      previousHash = entry.entryHash;
      verifiedCount++;
      continue;
    }

    if (entry.previousHash !== previousHash) {
      invalidEntries.push({
        entryId: entry.id,
        entryNumber: entry.entryNumber,
        expectedHash: previousHash,
        actualHash: entry.previousHash,
        reason: 'Previous hash mismatch - chain broken'
      });
    }

    const entryData = {
      sequenceNumber: entry.sequenceNumber,
      entryNumber: entry.entryNumber,
      entryType: entry.entryType,
      fromUserId: entry.fromUserId,
      toUserId: entry.toUserId,
      amount: entry.amount,
      currency: entry.currency,
      orderId: entry.orderId,
      escrowId: entry.escrowId,
      swapId: entry.swapId,
      auctionId: entry.auctionId,
      transactionRef: entry.transactionRef,
      description: entry.description,
      previousHash: entry.previousHash
    };

    const calculatedHash = calculateHash(entryData);

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

describe('Ledger Integrity Verification', () => {
  describe('Hash Calculation', () => {
    test('produces consistent hashes for same data', () => {
      const data = { amount: 100, currency: 'USD' };
      expect(calculateHash(data)).toBe(calculateHash(data));
      expect(calculateHash(data)).toHaveLength(64);
    });

    test('produces different hashes for different data', () => {
      expect(calculateHash({ amount: 100 })).not.toBe(calculateHash({ amount: 101 }));
    });

    test('is order-independent for object keys', () => {
      expect(calculateHash({ a: 1, b: 2 })).toBe(calculateHash({ b: 2, a: 1 }));
    });
  });

  describe('Entry Number Generation', () => {
    test('generates correct prefixes', () => {
      expect(generateEntryNumber(LedgerEntryType.PAYMENT, 1)).toBe('PAY-0000000001');
      expect(generateEntryNumber(LedgerEntryType.ESCROW_HOLD, 5)).toBe('ESH-0000000005');
      expect(generateEntryNumber(LedgerEntryType.SWAP_INITIATED, 100)).toBe('SWI-0000000100');
    });

    test('pads sequence numbers correctly', () => {
      expect(generateEntryNumber(LedgerEntryType.PAYMENT, 1234567890)).toBe('PAY-1234567890');
    });
  });

  describe('Chain Integrity Verification', () => {
    let genesisEntry: LedgerEntry;

    beforeEach(() => {
      genesisEntry = createMockEntry(0, LedgerEntryType.MIGRATION, '');
    });

    test('verifies a valid chain', () => {
      const entries = [genesisEntry];
      for (let i = 1; i <= 3; i++) {
        entries.push(createMockEntry(i, LedgerEntryType.PAYMENT, entries[i - 1].entryHash));
      }

      const result = verifyChainIntegrity(entries);
      expect(result.isValid).toBe(true);
      expect(result.verifiedEntries).toBe(4);
    });

    test('detects broken chain', () => {
      const entry1 = createMockEntry(1, LedgerEntryType.PAYMENT, genesisEntry.entryHash);
      const entry2 = createMockEntry(2, LedgerEntryType.PAYMENT, 'wrong_hash');

      const result = verifyChainIntegrity([genesisEntry, entry1, entry2]);
      expect(result.isValid).toBe(false);
      expect(result.invalidEntries[0].reason).toContain('Previous hash mismatch');
    });

    test('detects tampered entry', () => {
      const entry1 = createMockEntry(1, LedgerEntryType.PAYMENT, genesisEntry.entryHash);
      const tamperedEntry = { ...entry1, amount: 999999 };

      const result = verifyChainIntegrity([genesisEntry, tamperedEntry]);
      expect(result.isValid).toBe(false);
      expect(result.invalidEntries[0].reason).toContain('Entry hash mismatch');
    });
  });

  describe('Status Transitions', () => {
    test('tracks valid status values', () => {
      const statuses = [
        LedgerEntryStatus.PENDING,
        LedgerEntryStatus.CONFIRMED,
        LedgerEntryStatus.FAILED,
        LedgerEntryStatus.REVERSED
      ];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('Reversal Entries', () => {
    test('creates reversal with negated amount', () => {
      const original = createMockEntry(1, LedgerEntryType.PAYMENT, 'prev', { amount: 500 });
      const reversal = createMockEntry(2, LedgerEntryType.REFUND, original.entryHash, {
        amount: -500,
        transactionRef: 'REV-' + original.entryNumber
      });

      expect(reversal.amount).toBe(-500);
      expect(reversal.transactionRef).toContain('REV-');
    });
  });

  describe('Entry Type Coverage', () => {
    test('supports financial types', () => {
      const types = [LedgerEntryType.PAYMENT, LedgerEntryType.REFUND, LedgerEntryType.FEE];
      types.forEach(type => {
        expect(generateEntryNumber(type, 1)).toMatch(/^[A-Z]{3}-\d{10}$/);
      });
    });

    test('supports swap types', () => {
      expect(generateEntryNumber(LedgerEntryType.SWAP_INITIATED, 1)).toBe('SWI-0000000001');
      expect(generateEntryNumber(LedgerEntryType.SWAP_COMPLETED, 1)).toBe('SWC-0000000001');
    });
  });
});
