import { TransactionController } from '../controllers/transaction.controller';

// Mock the dependencies to avoid circular imports
jest.mock('../index', () => ({
  prisma: {}
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('TransactionController Basic Test', () => {
  it('should create controller instance', () => {
    const controller = new TransactionController();
    expect(controller).toBeDefined();
  });
});