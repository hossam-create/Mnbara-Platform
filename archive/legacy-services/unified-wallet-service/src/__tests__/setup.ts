import { jest } from '@jest/globals';

// Mock Prisma
jest.mock('../index', () => ({
  prisma: {
    transaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(async (callback: any) => {
      const mockTx = {
        transaction: {
          update: jest.fn(),
        },
      };
      return await callback(mockTx);
    }),
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock other utilities
jest.mock('../utils/audit', () => ({
  createAuditLog: jest.fn(),
}));

jest.mock('../utils/walletLimits', () => ({
  checkWalletLimits: jest.fn(),
}));

jest.mock('../utils/walletBalance', () => ({
  updateWalletBalance: jest.fn(),
}));

jest.mock('../utils/journalEntries', () => ({
  createJournalEntries: jest.fn(),
}));