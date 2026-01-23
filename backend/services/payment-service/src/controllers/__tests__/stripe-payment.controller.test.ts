import { Request, Response } from 'express';
import { StripePaymentController } from '../stripe-payment.controller';
import { EnhancedStripeService } from '../../services/enhanced-stripe.service';
import Stripe from 'stripe';

// Mock the service
jest.mock('../../services/enhanced-stripe.service');
jest.mock('stripe');

describe('StripePaymentController', () => {
  let controller: StripePaymentController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockService: jest.Mocked<EnhancedStripeService>;

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new StripePaymentController();
    mockService = new EnhancedStripeService() as jest.Mocked<EnhancedStripeService>;

    mockRequest = {
      body: {},
      params: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const mockResult = {
        paymentIntentId: 'pi_test_123',
        clientSecret: 'pi_test_123_secret',
        amount: 100,
        currency: 'usd',
        platformFee: 7,
        totalAmount: 107,
      };

      mockRequest.body = {
        requestId: 'req_123',
        buyerId: 'buyer_123',
        sellerId: 'seller_123',
        amount: 100,
      };

      mockService.createPaymentIntent.mockResolvedValue(mockResult);
      (EnhancedStripeService as jest.Mock).mockImplementation(() => mockService);

      const newController = new StripePaymentController();
      await newController.createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 400 for missing required fields', async () => {
      mockRequest.body = {
        requestId: 'req_123',
        // Missing buyerId, sellerId, amount
      };

      await controller.createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: requestId, buyerId, sellerId, amount',
      });
    });

    it('should return 400 for invalid amount', async () => {
      mockRequest.body = {
        requestId: 'req_123',
        buyerId: 'buyer_123',
        sellerId: 'seller_123',
        amount: 0,
      };

      await controller.createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Amount must be greater than 0',
      });
    });

    it('should handle service errors', async () => {
      mockRequest.body = {
        requestId: 'req_123',
        buyerId: 'buyer_123',
        sellerId: 'seller_123',
        amount: 100,
      };

      mockService.createPaymentIntent.mockRejectedValue(new Error('Service error'));
      (EnhancedStripeService as jest.Mock).mockImplementation(() => mockService);

      const newController = new StripePaymentController();
      await newController.createPaymentIntent(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to create payment intent',
        message: 'Service error',
      });
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const mockResult = {
        success: true,
        requestId: 'req_123',
        paymentIntentId: 'pi_test_123',
        status: 'succeeded',
        escrowCreated: true,
        fundsLocked: true,
      };

      mockRequest.body = {
        paymentIntentId: 'pi_test_123',
        requestId: 'req_123',
      };

      mockService.confirmPayment.mockResolvedValue(mockResult);
      (EnhancedStripeService as jest.Mock).mockImplementation(() => mockService);

      const newController = new StripePaymentController();
      await newController.confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should return 400 for missing fields', async () => {
      mockRequest.body = {
        paymentIntentId: 'pi_test_123',
        // Missing requestId
      };

      await controller.confirmPayment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: paymentIntentId, requestId',
      });
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const mockStatus = {
        paymentIntentId: 'pi_test_123',
        status: 'succeeded',
        amount: 107,
        currency: 'usd',
      };

      mockRequest.params = {
        paymentIntentId: 'pi_test_123',
      };

      mockService.getPaymentStatus.mockResolvedValue(mockStatus);
      (EnhancedStripeService as jest.Mock).mockImplementation(() => mockService);

      const newController = new StripePaymentController();
      await newController.getPaymentStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatus,
      });
    });

    it('should return 400 for missing paymentIntentId', async () => {
      mockRequest.params = {};

      await controller.getPaymentStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing paymentIntentId parameter',
      });
    });
  });

  describe('handleWebhook', () => {
    let mockStripe: any;

    beforeEach(() => {
      mockStripe = {
        webhooks: {
          constructEvent: jest.fn(),
        },
        paymentIntents: {
          retrieve: jest.fn(),
        },
      };
      (Stripe as any).mockImplementation(() => mockStripe);
    });

    it('should handle payment_intent.succeeded event', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
            metadata: {
              requestId: 'req_123',
              buyerId: 'buyer_123',
              sellerId: 'seller_123',
            },
          },
        },
      };

      mockRequest.body = Buffer.from(JSON.stringify(mockEvent));
      mockRequest.headers = {
        'stripe-signature': 'test_signature',
      };

      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      mockService.confirmPayment.mockResolvedValue({
        success: true,
        requestId: 'req_123',
        paymentIntentId: 'pi_test_123',
        status: 'succeeded',
        escrowCreated: true,
        fundsLocked: true,
      });
      (EnhancedStripeService as jest.Mock).mockImplementation(() => mockService);

      const newController = new StripePaymentController();
      await newController.handleWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true });
    });

    it('should return 400 for invalid signature', async () => {
      mockRequest.body = Buffer.from('{}');
      mockRequest.headers = {
        'stripe-signature': 'invalid_signature',
      };

      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const newController = new StripePaymentController();
      await newController.handleWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Webhook Error: Invalid signature',
      });
    });

    it('should return 500 if webhook secret not configured', async () => {
      mockRequest.headers = {
        'stripe-signature': 'test_signature',
      };

      delete process.env.STRIPE_WEBHOOK_SECRET;

      await controller.handleWebhook(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Webhook secret not configured',
      });
    });
  });
});
