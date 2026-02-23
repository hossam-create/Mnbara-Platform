/**
 * Jest Test Setup for Escrow Service
 */

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    escrow: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    escrowEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
    EscrowStatus: {
      CREATED: 'CREATED',
      SIGNED: 'SIGNED',
      LOCKED: 'LOCKED',
      RELEASED: 'RELEASED',
      DISPUTED: 'DISPUTED',
      RESOLVED: 'RESOLVED',
    },
    DisputeStatus: {
      NONE: 'NONE',
      INITIATED: 'INITIATED',
      RESOLVED: 'RESOLVED',
    },
  };
});

// Mock Wallet Client
jest.mock('../clients/wallet-client', () => ({
  walletClient: {
    holdFunds: jest.fn(),
    releaseFunds: jest.fn(),
    refundFunds: jest.fn(),
    checkBalance: jest.fn(),
    healthCheck: jest.fn(),
  },
}));

// Mock Winston Logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/escrow_test';
process.env.WALLET_SERVICE_URL = 'http://localhost:3005';
process.env.JWT_SECRET = 'test-secret-key';

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
