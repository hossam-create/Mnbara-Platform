import { StateTransitionService } from '../StateTransitionService';
import { RequestService } from '../RequestService';
import { RequestStatus } from '../../models/enums/RequestStatus';
import { PaymentIntegrationService } from '../PaymentIntegrationService';
import { NotificationService } from '../NotificationService';

/**
 * Payment Flow Integration Tests
 * Tests the complete payment flow from request acceptance to delivery
 */
describe('Payment Flow Integration', () => {
  let stateTransitionService: StateTransitionService;
  let mockRequestService: jest.Mocked<RequestService>;
  let mockPaymentService: jest.Mocked<PaymentIntegrationService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  const mockRequestData = {
    id: 'req_123',
    requesterId: 'buyer_123',
    travelerId: null,
    status: RequestStatus.VISIBLE_TO_TRAVELERS,
    product: {
      id: 'prod_789',
      title: 'iPhone 15 Pro',
      price: 1000,
      currency: 'USD',
      image: 'https://example.com/image.jpg',
      url: 'https://example.com/product',
    },
    delivery: {
      origin: {
        country: 'US',
        city: 'New York',
        address: '123 Main St',
        postalCode: '10001',
      },
      destination: {
        country: 'UK',
        city: 'London',
        address: '456 High St',
        postalCode: 'SW1A 1AA',
      },
      deadline: new Date('2026-02-01'),
      instructions: 'Handle with care',
    },
  };

  beforeEach(() => {
    // Mock dependencies
    jest.mock('../PaymentIntegrationService');
    jest.mock('../NotificationService');

    mockRequestService = {
      hasActiveRequest: jest.fn(),
      transitionStatus: jest.fn(),
      updateRequestPaymentInfo: jest.fn(),
      getRequestById: jest.fn(),
    } as any;

    stateTransitionService = new StateTransitionService(mockRequestService);
    mockPaymentService = (stateTransitionService as any).paymentService;
    mockNotificationService = (stateTransitionService as any).notificationService;

    // Setup default mocks
    mockRequestService.hasActiveRequest.mockResolvedValue(false);
    mockNotificationService.sendPaymentLink.mockResolvedValue(true);
    mockNotificationService.sendRequestAccepted.mockResolvedValue(true);
    mockNotificationService.sendDeliveryStarted.mockResolvedValue(true);
    mockNotificationService.sendFundsReceived.mockResolvedValue(true);
    mockNotificationService.sendDeliveryCompleted.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Happy Path Flow', () => {
    it('should complete full payment flow: accept → pay → deliver', async () => {
      // Step 1: Accept Request
      const mockPaymentIntent = {
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_123_secret_456',
        amount: 1000,
        currency: 'USD',
        platformFee: 70,
        totalAmount: 1070,
      };

      mockPaymentService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockRequestService.transitionStatus.mockResolvedValue({
        ...mockRequestData,
        status: RequestStatus.AWAITING_PAYMENT,
        travelerId: 'traveler_456',
      });

      const acceptResult = await stateTransitionService.acceptRequest(
        'req_123',
        'traveler_456',
        mockRequestData
      );

      expect(acceptResult.paymentIntent).toBeDefined();
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.ACCEPTED,
        'traveler_456',
        'Request accepted by traveler'
      );
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.AWAITING_PAYMENT,
        'traveler_456',
        'Awaiting payment from buyer'
      );
      expect(mockNotificationService.sendPaymentLink).toHaveBeenCalled();

      // Step 2: Handle Payment Success
      const awaitingPaymentRequest = {
        ...mockRequestData,
        status: RequestStatus.AWAITING_PAYMENT,
        travelerId: 'traveler_456',
      };

      mockPaymentService.lockFunds.mockResolvedValue(true);
      mockRequestService.transitionStatus.mockResolvedValue({
        ...awaitingPaymentRequest,
        status: RequestStatus.IN_PROGRESS,
      });

      const paymentResult = await stateTransitionService.handlePaymentSuccess(
        'req_123',
        'pi_123',
        awaitingPaymentRequest
      );

      expect(mockPaymentService.lockFunds).toHaveBeenCalled();
      expect(mockRequestService.updateRequestPaymentInfo).toHaveBeenCalledWith('req_123', {
        escrowStatus: 'HELD',
        escrowCreatedAt: expect.any(Date),
      });
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.IN_PROGRESS,
        'traveler_456',
        'Payment confirmed, delivery can start'
      );
      expect(mockNotificationService.sendDeliveryStarted).toHaveBeenCalled();

      // Step 3: Complete Delivery
      const inProgressRequest = {
        ...awaitingPaymentRequest,
        status: RequestStatus.IN_PROGRESS,
        paymentPlatformFee: 70,
      };

      mockPaymentService.releaseFunds.mockResolvedValue(true);
      mockPaymentService.deductPlatformFee.mockResolvedValue(true);
      mockRequestService.transitionStatus.mockResolvedValue({
        ...inProgressRequest,
        status: RequestStatus.DELIVERED,
      });

      const deliveryResult = await stateTransitionService.completeDelivery(
        'req_123',
        'traveler_456',
        inProgressRequest
      );

      expect(mockPaymentService.releaseFunds).toHaveBeenCalled();
      expect(mockPaymentService.deductPlatformFee).toHaveBeenCalled();
      expect(mockRequestService.updateRequestPaymentInfo).toHaveBeenCalledWith('req_123', {
        escrowStatus: 'RELEASED',
        escrowReleasedAt: expect.any(Date),
      });
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.DELIVERED,
        'traveler_456',
        'Delivery completed successfully'
      );
      expect(mockNotificationService.sendFundsReceived).toHaveBeenCalled();
      expect(mockNotificationService.sendDeliveryCompleted).toHaveBeenCalled();
    });
  });

  describe('Cancellation Scenarios', () => {
    it('should handle cancellation before payment', async () => {
      // Arrange
      const awaitingPaymentRequest = {
        ...mockRequestData,
        status: RequestStatus.AWAITING_PAYMENT,
        travelerId: 'traveler_456',
        paymentIntentId: 'pi_123',
      };

      mockPaymentService.cancelPaymentIntent.mockResolvedValue(undefined);
      mockRequestService.transitionStatus.mockResolvedValue({
        ...awaitingPaymentRequest,
        status: RequestStatus.CANCELLED,
      });

      // Act
      const result = await stateTransitionService.cancelRequest(
        'req_123',
        'buyer_123',
        'Changed my mind',
        awaitingPaymentRequest
      );

      // Assert
      expect(mockPaymentService.cancelPaymentIntent).toHaveBeenCalledWith('pi_123');
      expect(mockRequestService.updateRequestPaymentInfo).toHaveBeenCalledWith('req_123', {
        paymentStatus: 'CANCELLED',
      });
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.CANCELLED,
        'buyer_123',
        'Changed my mind'
      );
      expect(mockPaymentService.refundFunds).not.toHaveBeenCalled();
    });

    it('should handle cancellation after payment with refund', async () => {
      // Arrange
      const inProgressRequest = {
        ...mockRequestData,
        status: RequestStatus.IN_PROGRESS,
        travelerId: 'traveler_456',
        paymentIntentId: 'pi_123',
      };

      mockPaymentService.refundFunds.mockResolvedValue(true);
      mockPaymentService.createStripeRefund.mockResolvedValue(true);
      mockRequestService.transitionStatus.mockResolvedValue({
        ...inProgressRequest,
        status: RequestStatus.CANCELLED,
      });

      // Act
      const result = await stateTransitionService.cancelRequest(
        'req_123',
        'buyer_123',
        'Item not needed',
        inProgressRequest
      );

      // Assert
      expect(mockPaymentService.refundFunds).toHaveBeenCalledWith({
        requestId: 'req_123',
      });
      expect(mockPaymentService.createStripeRefund).toHaveBeenCalledWith('pi_123');
      expect(mockRequestService.updateRequestPaymentInfo).toHaveBeenCalledWith('req_123', {
        escrowStatus: 'REFUNDED',
        escrowRefundedAt: expect.any(Date),
      });
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.CANCELLED,
        'buyer_123',
        'Item not needed'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle payment failure gracefully', async () => {
      // Arrange
      mockPaymentService.createPaymentIntent.mockRejectedValue(
        new Error('Stripe API error')
      );
      mockRequestService.transitionStatus.mockResolvedValue(mockRequestData);

      // Act & Assert
      await expect(
        stateTransitionService.acceptRequest('req_123', 'traveler_456', mockRequestData)
      ).rejects.toThrow('Failed to create payment intent: Stripe API error');

      // Verify rollback
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.ACCEPTED,
        'traveler_456',
        'Payment intent creation failed'
      );
    });

    it('should handle funds lock failure', async () => {
      // Arrange
      const awaitingPaymentRequest = {
        ...mockRequestData,
        status: RequestStatus.AWAITING_PAYMENT,
        travelerId: 'traveler_456',
      };

      mockPaymentService.lockFunds.mockResolvedValue(false);

      // Act & Assert
      await expect(
        stateTransitionService.handlePaymentSuccess('req_123', 'pi_123', awaitingPaymentRequest)
      ).rejects.toThrow('Failed to lock funds in escrow');

      expect(mockRequestService.transitionStatus).not.toHaveBeenCalled();
    });

    it('should handle funds release failure', async () => {
      // Arrange
      const inProgressRequest = {
        ...mockRequestData,
        status: RequestStatus.IN_PROGRESS,
        travelerId: 'traveler_456',
      };

      mockPaymentService.releaseFunds.mockResolvedValue(false);

      // Act & Assert
      await expect(
        stateTransitionService.completeDelivery('req_123', 'traveler_456', inProgressRequest)
      ).rejects.toThrow('Failed to release funds to traveler');

      expect(mockRequestService.transitionStatus).not.toHaveBeenCalled();
    });

    it('should handle refund failure', async () => {
      // Arrange
      const inProgressRequest = {
        ...mockRequestData,
        status: RequestStatus.IN_PROGRESS,
        travelerId: 'traveler_456',
        paymentIntentId: 'pi_123',
      };

      mockPaymentService.refundFunds.mockResolvedValue(false);

      // Act & Assert
      await expect(
        stateTransitionService.cancelRequest('req_123', 'buyer_123', 'Cancel', inProgressRequest)
      ).rejects.toThrow('Failed to refund funds to buyer');

      expect(mockRequestService.transitionStatus).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should prevent traveler from accepting multiple requests', async () => {
      // Arrange
      mockRequestService.hasActiveRequest.mockResolvedValue(true);

      // Act & Assert
      await expect(
        stateTransitionService.acceptRequest('req_123', 'traveler_456', mockRequestData)
      ).rejects.toThrow('Traveler already has an active request');

      expect(mockPaymentService.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('should complete delivery even if platform fee deduction fails', async () => {
      // Arrange
      const inProgressRequest = {
        ...mockRequestData,
        status: RequestStatus.IN_PROGRESS,
        travelerId: 'traveler_456',
        paymentPlatformFee: 70,
      };

      mockPaymentService.releaseFunds.mockResolvedValue(true);
      mockPaymentService.deductPlatformFee.mockResolvedValue(false);
      mockRequestService.transitionStatus.mockResolvedValue({
        ...inProgressRequest,
        status: RequestStatus.DELIVERED,
      });

      // Act
      const result = await stateTransitionService.completeDelivery(
        'req_123',
        'traveler_456',
        inProgressRequest
      );

      // Assert
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.DELIVERED,
        'traveler_456',
        'Delivery completed successfully'
      );
    });
  });
});
