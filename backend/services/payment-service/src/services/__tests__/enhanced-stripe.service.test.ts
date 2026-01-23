import { EnhancedStripeService } from '../enhanced-stripe.service';
import Stripe from 'stripe';
import axios from 'axios';

// Mock Stripe
jest.mock('stripe');
jest.mock('axios');

const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

(Stripe as any).mockImplementation(() => mockStripe);

describe('EnhancedStripeService', () => {
  let service: EnhancedStripeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EnhancedStripeService();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent with fee calculation', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 10700, // $107 (100 + 7% fee)
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: {
          requestId: 'req_123',
          buyerId: 'buyer_123',
          sellerId: 'seller_123',
        },
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent({
        requestId: 'req_123',
        buyerId: 'buyer_123',
        sellerId: 'seller_123',
        amount: 100,
        currency: 'usd',
      });

      expect(result).toEqual({
        paymentIntentId: 'pi_test_123',
        clientSecret: 'pi_test_123_secret',
        amount: 100,
        currency: 'usd',
        platformFee: 7,
        totalAmount: 107,
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10700, // $107 in cents
          currency: 'usd',
          metadata: expect.objectContaining({
            requestId: 'req_123',
            buyerId: 'buyer_123',
            sellerId: 'seller_123',
          }),
        })
      );
    });

    it('should handle errors when creating payment intent', async () => {
      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        service.createPaymentIntent({
          requestId: 'req_123',
          buyerId: 'buyer_123',
          sellerId: 'seller_123',
          amount: 100,
        })
      ).rejects.toThrow('Failed to create payment intent');
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment and lock funds', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 10700,
        currency: 'usd',
        metadata: {
          requestId: 'req_123',
          buyerId: 'buyer_123',
          sellerId: 'seller_123',
          originalAmount: '100',
          platformFee: '7',
        },
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await service.confirmPayment({
        paymentIntentId: 'pi_test_123',
        requestId: 'req_123',
      });

      expect(result).toEqual({
        success: true,
        requestId: 'req_123',
        paymentIntentId: 'pi_test_123',
        status: 'succeeded',
        escrowCreated: true,
        fundsLocked: true,
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/wallet/lock-funds'),
        expect.objectContaining({
          userId: 'buyer_123',
          amount: 100,
          requestId: 'req_123',
        }),
        expect.any(Object)
      );
    });

    it('should throw error if payment not succeeded', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'requires_payment_method',
        metadata: {},
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      await expect(
        service.confirmPayment({
          paymentIntentId: 'pi_test_123',
          requestId: 'req_123',
        })
      ).rejects.toThrow('Payment not confirmed');
    });

    it('should handle wallet service failure gracefully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 10700,
        currency: 'usd',
        metadata: {
          requestId: 'req_123',
          buyerId: 'buyer_123',
          sellerId: 'seller_123',
          originalAmount: '100',
          platformFee: '7',
        },
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      (axios.post as jest.Mock).mockRejectedValue(new Error('Wallet service unavailable'));

      const result = await service.confirmPayment({
        paymentIntentId: 'pi_test_123',
        requestId: 'req_123',
      });

      expect(result.fundsLocked).toBe(false);
      expect(result.success).toBe(true); // Still returns success but flags funds not locked
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 10700,
        currency: 'usd',
        metadata: {
          requestId: 'req_123',
        },
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);

      const result = await service.getPaymentStatus('pi_test_123');

      expect(result).toEqual({
        paymentIntentId: 'pi_test_123',
        status: 'succeeded',
        amount: 107,
        currency: 'usd',
        metadata: {
          requestId: 'req_123',
        },
      });
    });
  });

  describe('refundPayment', () => {
    it('should create refund', async () => {
      const mockRefund = {
        id: 're_test_123',
        amount: 10700,
        status: 'succeeded',
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      const result = await service.refundPayment('pi_test_123', 107);

      expect(result).toEqual(mockRefund);
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 10700, // $107 in cents
      });
    });

    it('should create full refund when amount not specified', async () => {
      const mockRefund = {
        id: 're_test_123',
        status: 'succeeded',
      };

      mockStripe.refunds.create.mockResolvedValue(mockRefund);

      await service.refundPayment('pi_test_123');

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: undefined,
      });
    });
  });
});
