import { Request, Response } from 'express';
import { EscrowController } from '../escrow.controller';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('stripe');

describe('PAY-002: Escrow Refund Controller', () => {
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
    };

    mockStripe = {
      paymentIntents: {
        retrieve: jest.fn(),
        cancel: jest.fn(),
      },
      refunds: {
        create: jest.fn(),
      },
    };

    (PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);
    (Stripe as jest.Mock).mockImplementation(() => mockStripe);

    escrowController = new EscrowController();

    mockRequest = {
      params: { id: '1' },
      body: { reason: 'Order cancelled' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('Refunds can only be initiated if escrow status is HELD', () => {
    it('should allow refund when status is HELD', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'BUY_NOW',
        stripePaymentId: 'pi_test',
        metadata: {},
      };

      const mockPaymentIntent = {
        id: 'pi_test',
        status: 'succeeded',
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.refunds.create.mockResolvedValue({ id: 're_test' });
      mockPrisma.escrow.update.mockResolvedValue({ ...mockEscrow, status: 'REFUNDED' });
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.escrowActionLog.create.mockResolvedValue({});

      await escrowController.refundPayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.escrow.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REFUNDED',
          }),
        })
      );
    });

    it('should reject refund when status is RELEASED', async () => {
      const mockEscrow = {
        id: 1,
        status: 'RELEASED',
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      await escrowController.refundPayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Refund can only be initiated when escrow status is HELD',
          currentStatus: 'RELEASED',
        })
      );
    });
  });

  describe('Duplicate refund attempts must be prevented', () => {
    it('should reject refund if escrow is already REFUNDED', async () => {
      const mockEscrow = {
        id: 1,
        status: 'REFUNDED',
        releasedAt: new Date('2025-01-01'),
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      await escrowController.refundPayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Escrow has already been refunded',
        })
      );
    });
  });

  describe('Partial refunds are NOT supported', () => {
    it('should reject partial refund attempts', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'BUY_NOW',
        metadata: {},
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);

      mockRequest.body = {
        reason: 'Partial refund',
        amount: 50.00, // Less than full amount
      };

      await escrowController.refundPayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Partial refunds are not supported. Only full amount refunds are allowed.',
          requestedAmount: 50.00,
          escrowAmount: 100.00,
        })
      );
    });

    it('should allow refund when amount matches full escrow amount', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'BUY_NOW',
        stripePaymentId: 'pi_test',
        metadata: {},
      };

      const mockPaymentIntent = {
        id: 'pi_test',
        status: 'succeeded',
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.refunds.create.mockResolvedValue({ id: 're_test' });
      mockPrisma.escrow.update.mockResolvedValue({ ...mockEscrow, status: 'REFUNDED' });
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.escrowActionLog.create.mockResolvedValue({});

      mockRequest.body = {
        reason: 'Full refund',
        amount: 100.00, // Full amount
      };

      await escrowController.refundPayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Refund failures must be logged and surfaced clearly', () => {
    it('should log refund failure and return clear error', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'BUY_NOW',
        stripePaymentId: 'pi_test',
        metadata: {},
      };

      const stripeError = new Error('Stripe API error');
      (stripeError as any).type = 'StripeAPIError';

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      mockStripe.paymentIntents.retrieve.mockRejectedValue(stripeError);
      mockPrisma.escrowActionLog.create.mockResolvedValue({});

      await escrowController.refundPayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Refund processing failed',
          details: expect.stringContaining('Stripe refund failed'),
          escrowId: 1,
          orderId: 123,
        })
      );

      // Verify failure was logged
      expect(mockPrisma.escrowActionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'REFUND_FAILED',
            reason: expect.stringContaining('Refund failed'),
          }),
        })
      );
    });
  });

  describe('Refunds must be auditable with reason and timestamp', () => {
    it('should log refund with reason and timestamp', async () => {
      const mockEscrow = {
        id: 1,
        orderId: 123,
        buyerId: 1,
        sellerId: 2,
        amount: 100.00,
        currency: 'USD',
        status: 'HELD',
        orderType: 'AUCTION',
        stripePaymentId: 'pi_test',
        metadata: {},
      };

      const mockPaymentIntent = {
        id: 'pi_test',
        status: 'succeeded',
      };

      mockPrisma.escrow.findUnique.mockResolvedValue(mockEscrow);
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      mockStripe.refunds.create.mockResolvedValue({ id: 're_test' });
      mockPrisma.escrow.update.mockResolvedValue({ 
        ...mockEscrow, 
        status: 'REFUNDED',
        releasedAt: new Date(),
      });
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.escrowActionLog.create.mockResolvedValue({});

      const refundReason = 'Order cancelled by buyer';

      mockRequest.body = {
        reason: refundReason,
      };

      await escrowController.refundPayment(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPrisma.escrowActionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'REFUNDED',
            reason: refundReason,
            metadata: expect.objectContaining({
              orderType: 'AUCTION',
              refundAmount: 100.00,
            }),
          }),
        })
      );
    });
  });
});





