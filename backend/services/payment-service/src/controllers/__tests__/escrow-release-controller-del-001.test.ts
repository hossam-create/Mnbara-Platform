import { Request, Response } from 'express';
import { EscrowController } from '../escrow.controller';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('stripe');

describe('DEL-001: Escrow Release Controller', () => {
  let escrowController: EscrowController;
  let mockPrisma: any;
  let mockStripe: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      escrow: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      order: {
        update: jest.fn(),
      },
      escrowActionLog: {
        create: jest.fn(),
      },
      protectionRequest: {
        findFirst: jest.fn(),
      },
    };

    mockStripe = {
      paymentIntents: {
        retrieve: jest.fn(),
        capture: jest.fn(),
      },
    };

    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    (Stripe as jest.Mock).mockImplementation(() => mockStripe);

    escrowController = new EscrowController();

    mockRequest = {
      params: { id: '1' },
      body: { performedBy: 1 },
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('Only escrows with status HELD can be released', () => {
    it('should allow release when status is HELD', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        travelerId: 3,
        amount: 100.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'BUY_NOW',
        buyerConfirmedDelivery: true,
        receiptUploaded: true,
        stripePaymentId: 'pi_test',
        metadata: {},
      };

      const mockPaymentIntent = {
        id: 'pi_test',
        status: 'requires_capture',
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.protectionRequest.findFirst.mockResolvedValue(null);
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_test', status: 'succeeded' });
      mockPrisma.escrow.update.mockResolvedValue({ ...mockEscrow, status: 'RELEASED', releasedAt: new Date() });
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.escrowActionLog.create.mockResolvedValue({});

      await escrowController.releasePayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'RELEASED',
          }),
        })
      );
    });

    it('should reject release when status is RELEASED', async () => {
      const mockEscrow = {
        id: 1,
        status: 'RELEASED',
        releasedAt: new Date(),
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      await escrowController.releasePayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Escrow has already been released',
        })
      );
    });

    it('should reject release when status is REFUNDED', async () => {
      const mockEscrow = {
        id: 1,
        status: 'REFUNDED',
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      await escrowController.releasePayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Escrow can only be released when status is HELD',
          currentStatus: 'REFUNDED',
        })
      );
    });
  });

  describe('Duplicate release attempts must be prevented', () => {
    it('should reject duplicate release attempt', async () => {
      const mockEscrow = {
        id: 1,
        status: 'RELEASED',
        releasedAt: new Date('2025-01-01'),
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      await escrowController.releasePayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Escrow has already been released',
        })
      );
    });
  });

  describe('Release must work for both BUY_NOW and AUCTION orders', () => {
    it('should release escrow for BUY_NOW order', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'BUY_NOW',
        buyerConfirmedDelivery: true,
        receiptUploaded: true,
        stripePaymentId: 'pi_test',
        metadata: {},
      };

      const mockPaymentIntent = {
        id: 'pi_test',
        status: 'requires_capture',
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.protectionRequest.findFirst.mockResolvedValue(null);
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_test' });
      mockPrisma.escrow.update.mockResolvedValue({ ...mockEscrow, status: 'RELEASED' });
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.escrowActionLog.create.mockResolvedValue({});

      await escrowController.releasePayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should release escrow for AUCTION order', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 150.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'AUCTION',
        buyerConfirmedDelivery: true,
        receiptUploaded: true,
        stripePaymentId: 'pi_test',
        metadata: {},
      };

      const mockPaymentIntent = {
        id: 'pi_test',
        status: 'requires_capture',
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.protectionRequest.findFirst.mockResolvedValue(null);
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_test' });
      mockPrisma.escrow.update.mockResolvedValue({ ...mockEscrow, status: 'RELEASED' });
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.escrowActionLog.create.mockResolvedValue({});

      await escrowController.releasePayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Release action must be auditable with timestamp and actor', () => {
    it('should log release with timestamp and actor', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        travelerId: 3,
        amount: 100.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'BUY_NOW',
        buyerConfirmedDelivery: true,
        receiptUploaded: true,
        stripePaymentId: 'pi_test',
        metadata: {},
      };

      const mockPaymentIntent = {
        id: 'pi_test',
        status: 'requires_capture',
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.protectionRequest.findFirst.mockResolvedValue(null);
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.paymentIntents.capture.mockResolvedValue({ id: 'pi_test' });
      mockPrisma.escrow.update.mockResolvedValue({ 
        ...mockEscrow, 
        status: 'RELEASED',
        releasedAt: new Date(),
      });
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.escrowActionLog.create.mockResolvedValue({});

      mockRequest.body = { performedBy: 1 };

      await escrowController.releasePayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPrisma.escrowActionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'RELEASED',
            performedBy: 1,
            metadata: expect.objectContaining({
              orderType: 'BUY_NOW',
              releaseAmount: 100.00,
            }),
          }),
        })
      );
    });
  });

  describe('Failed release attempts must be logged clearly', () => {
    it('should log release failure and return clear error', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'BUY_NOW',
        buyerConfirmedDelivery: true,
        receiptUploaded: true,
        stripePaymentId: 'pi_test',
        metadata: {},
      };

      const stripeError = new Error('Stripe API error');
      (stripeError as any).type = 'StripeAPIError';

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.protectionRequest.findFirst.mockResolvedValue(null);
      mockStripe.paymentIntents.retrieve.mockRejectedValue(stripeError);
      mockPrisma.escrowActionLog.create.mockResolvedValue({});

      await escrowController.releasePayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Release processing failed',
          details: expect.stringContaining('Stripe release failed'),
          escrowId: 1,
          orderId: 123,
        })
      );

      // Verify failure was logged
      expect(mockPrisma.escrowActionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'RELEASE_FAILED',
            reason: expect.stringContaining('Release failed'),
          }),
        })
      );
    });
  });
});





