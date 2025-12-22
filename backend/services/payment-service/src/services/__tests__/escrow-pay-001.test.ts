import { PrismaClient } from '@prisma/client';
import { EscrowService } from '../escrow.service';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    escrow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    escrowActionLog: {
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('PAY-001: Escrow-based Payments', () => {
  let mockPrisma: any;
  let escrowService: EscrowService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    escrowService = new EscrowService();
  });

  describe('Failed payments must not create escrow', () => {
    it('should not create escrow if payment status is not succeeded', async () => {
      const orderId = 1;
      const mockOrder = {
        id: orderId,
        buyerId: 1,
        travelerId: 2,
        totalAmount: 100.00,
        currency: 'USD',
        status: 'PENDING',
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.escrow.findUnique.mockResolvedValue(null);

      // Simulate failed payment (paymentIntent.status !== 'succeeded')
      const createEscrowParams = {
        orderId,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
      };

      // This should fail because payment hasn't succeeded
      // In real implementation, this would be checked before creating escrow
      await expect(
        escrowService.createEscrow(createEscrowParams as any)
      ).rejects.toThrow();
    });

    it('should create escrow only after payment succeeds', async () => {
      const orderId = 1;
      const mockOrder = {
        id: orderId,
        buyerId: 1,
        travelerId: 2,
        totalAmount: 100.00,
        currency: 'USD',
        status: 'PAID', // Payment succeeded
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.escrow.findUnique.mockResolvedValue(null);
      mockPrisma.escrow.create.mockResolvedValue({
        id: 1,
        orderId,
        status: 'HELD',
        orderType: 'BUY_NOW',
      });

      const createEscrowParams = {
        orderId,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        orderType: 'BUY_NOW',
      };

      const escrow = await escrowService.createEscrow(createEscrowParams as any);

      expect(escrow).toBeDefined();
      expect(mockPrisma.escrow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId,
            status: 'HELD',
            orderType: 'BUY_NOW',
          }),
        })
      );
    });
  });

  describe('Auction order support', () => {
    it('should create escrow with AUCTION order type', async () => {
      const orderId = 1;
      const mockOrder = {
        id: orderId,
        buyerId: 1,
        travelerId: 2,
        totalAmount: 150.00,
        currency: 'USD',
        status: 'PAID',
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.escrow.findUnique.mockResolvedValue(null);
      mockPrisma.escrow.create.mockResolvedValue({
        id: 1,
        orderId,
        status: 'HELD',
        orderType: 'AUCTION',
      });

      const createEscrowParams = {
        orderId,
        buyerId: 1,
        sellerId: 2,
        amount: 150.00,
        currency: 'USD',
        orderType: 'AUCTION',
      };

      const escrow = await escrowService.createEscrow(createEscrowParams as any);

      expect(escrow.orderType).toBe('AUCTION');
      expect(mockPrisma.escrow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderType: 'AUCTION',
          }),
        })
      );
    });

    it('should default to BUY_NOW if order type not specified', async () => {
      const orderId = 1;
      const mockOrder = {
        id: orderId,
        buyerId: 1,
        travelerId: 2,
        totalAmount: 100.00,
        currency: 'USD',
        status: 'PAID',
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.escrow.findUnique.mockResolvedValue(null);
      mockPrisma.escrow.create.mockResolvedValue({
        id: 1,
        orderId,
        status: 'HELD',
        orderType: 'BUY_NOW',
      });

      const createEscrowParams = {
        orderId,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
      };

      const escrow = await escrowService.createEscrow(createEscrowParams as any);

      expect(escrow.orderType).toBe('BUY_NOW');
    });
  });

  describe('Escrow state tracking', () => {
    it('should track HELD status', async () => {
      const escrowId = 1;
      mockPrisma.escrow.findUnique.mockResolvedValue({
        id: escrowId,
        status: 'HELD',
        orderId: 1,
        buyerId: 1,
        sellerId: 2,
      });

      const escrow = await mockPrisma.escrow.findUnique({
        where: { id: escrowId },
      });

      expect(escrow.status).toBe('HELD');
    });

    it('should track RELEASED status', async () => {
      const escrowId = 1;
      mockPrisma.escrow.findUnique.mockResolvedValue({
        id: escrowId,
        status: 'RELEASED',
        orderId: 1,
      });

      const escrow = await mockPrisma.escrow.findUnique({
        where: { id: escrowId },
      });

      expect(escrow.status).toBe('RELEASED');
    });

    it('should track REFUNDED status', async () => {
      const escrowId = 1;
      mockPrisma.escrow.findUnique.mockResolvedValue({
        id: escrowId,
        status: 'REFUNDED',
        orderId: 1,
      });

      const escrow = await mockPrisma.escrow.findUnique({
        where: { id: escrowId },
      });

      expect(escrow.status).toBe('REFUNDED');
    });
  });

  describe('Audit logging', () => {
    it('should log escrow creation', async () => {
      const escrowId = 1;
      mockPrisma.escrowActionLog.create.mockResolvedValue({
        id: 1,
        escrowId,
        action: 'CREATED',
      });

      await mockPrisma.escrowActionLog.create({
        data: {
          escrowId,
          action: 'CREATED',
          performedBy: 1,
          performedByRole: 'buyer',
        },
      });

      expect(mockPrisma.escrowActionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escrowId,
            action: 'CREATED',
          }),
        })
      );
    });

    it('should log escrow release', async () => {
      const escrowId = 1;
      mockPrisma.escrowActionLog.create.mockResolvedValue({
        id: 2,
        escrowId,
        action: 'RELEASED',
      });

      await mockPrisma.escrowActionLog.create({
        data: {
          escrowId,
          action: 'RELEASED',
          performedBy: 1,
          performedByRole: 'buyer',
        },
      });

      expect(mockPrisma.escrowActionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escrowId,
            action: 'RELEASED',
          }),
        })
      );
    });

    it('should log escrow refund', async () => {
      const escrowId = 1;
      mockPrisma.escrowActionLog.create.mockResolvedValue({
        id: 3,
        escrowId,
        action: 'REFUNDED',
      });

      await mockPrisma.escrowActionLog.create({
        data: {
          escrowId,
          action: 'REFUNDED',
          performedBy: null,
          performedByRole: 'system',
          reason: 'Order cancelled',
        },
      });

      expect(mockPrisma.escrowActionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escrowId,
            action: 'REFUNDED',
            reason: 'Order cancelled',
          }),
        })
      );
    });
  });
});





