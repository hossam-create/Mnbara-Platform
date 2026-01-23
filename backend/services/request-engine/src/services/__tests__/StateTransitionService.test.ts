import { StateTransitionService } from '../StateTransitionService';
import { RequestService } from '../RequestService';
import { RequestStatus } from '../../models/enums/RequestStatus';
import { PaymentIntegrationService } from '../PaymentIntegrationService';
import { NotificationService } from '../NotificationService';

// Mock dependencies
jest.mock('../PaymentIntegrationService');
jest.mock('../NotificationService');

describe('StateTransitionService', () => {
  let stateTransitionService: StateTransitionService;
  let mockRequestService: jest.Mocked<RequestService>;
  let mockPaymentService: jest.Mocked<PaymentIntegrationService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  const mockRequestData = {
    id: 'req_123',
    requesterId: 'buyer_123',
    travelerId: 'traveler_456',
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
    // Create mock request service
    mockRequestService = {
      hasActiveRequest: jest.fn(),
      transitionStatus: jest.fn(),
      updateRequestPaymentInfo: jest.fn(),
      getRequestById: jest.fn(),
    } as any;

    // Create service instance
    stateTransitionService = new StateTransitionService(mockRequestService);

    // Get mocked instances
    mockPaymentService = (stateTransitionService as any).paymentService;
    mockNotificationService = (stateTransitionService as any).notificationService;

    // Setup default mock implementations
    mockRequestService.hasActiveRequest.mockResolvedValue(false);
    mockRequestService.transitionStatus.mockResolvedValue(mockRequestData);
    mockRequestService.updateRequestPaymentInfo.mockResolvedValue(undefined);
    mockNotificationService.sendPaymentLink.mockResolvedValue(true);
    mockNotificationService.sendRequestAccepted.mockResolvedValue(true);
    mockNotificationService.sendDeliveryStarted.mockResolvedValue(true);
    mockNotificationService.sendFundsReceived.mockResolvedValue(true);
    mockNotificationService.sendDeliveryCompleted.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('acceptRequest', () => {
    it('should create payment intent and transition to AWAITING_PAYMENT', async () => {
      // Arrange
      const mockPaymentIntent = {
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_123_secret_456',
        amount: 1000,
        currency: 'USD',
        platformFee: 70,
        totalAmount: 1070,
      };

      mockPaymentService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      // Act
      const result = await stateTransitionService.acceptRequest(
        'req_123',
        'traveler_456',
        mockRequestData
      );

      // Assert
      expect(mockRequestService.hasActiveRequest).toHaveBeenCalledWith('traveler_456');
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
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith({
        requestId: 'req_123',
        buyerId: 'buyer_123',
        sellerId: 'traveler_456',
        amount: 1000,
        currency: 'USD',
        description: 'Payment for Request req_123 - iPhone 15 Pro',
      });
      expect(mockRequestService.updateRequestPaymentInfo).toHaveBeenCalledWith('req_123', {
        paymentIntentId: 'pi_123',
        paymentClientSecret: 'pi_123_secret_456',
        paymentAmount: 1000,
        paymentPlatformFee: 70,
        paymentTotalAmount: 1070,
      });
      expect(mockNotificationService.sendPaymentLink).toHaveBeenCalled();
      expect(mockNotificationService.sendRequestAccepted).toHaveBeenCalled();
      expect(result.paymentIntent).toEqual({
        id: 'pi_123',
        clientSecret: 'pi_123_secret_456',
        amount: 1070,
      });
    });

    it('should throw if traveler has active request', async () => {
      // Arrange
      mockRequestService.hasActiveRequest.mockResolvedValue(true);

      // Act & Assert
      await expect(
        stateTransitionService.acceptRequest('req_123', 'traveler_456', mockRequestData)
      ).rejects.toThrow('Traveler already has an active request');

      expect(mockRequestService.transitionStatus).not.toHaveBeenCalled();
      expect(mockPaymentService.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('should rollback to ACCEPTED if payment intent creation fails', async () => {
      // Arrange
      mockPaymentService.createPaymentIntent.mockRejectedValue(
        new Error('Stripe API error')
      );

      // Act & Assert
      await expect(
        stateTransitionService.acceptRequest('req_123', 'traveler_456', mockRequestData)
      ).rejects.toThrow('Failed to create payment intent: Stripe API error');

      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.ACCEPTED,
        'traveler_456',
        'Payment intent creation failed'
      );
    });
  });

  describe('handlePaymentSuccess', () => {
    it('should lock funds and transition to IN_PROGRESS', async () => {
      // Arrange
      const requestData = {
        ...mockRequestData,
        status: RequestStatus.AWAITING_PAYMENT,
      };

      mockPaymentService.lockFunds.mockResolvedValue(true);

      // Act
      const result = await stateTransitionService.handlePaymentSuccess(
        'req_123',
        'pi_123',
        requestData
      );

      // Assert
      expect(mockPaymentService.lockFunds).toHaveBeenCalledWith({
        userId: 'buyer_123',
        amount: 1000,
        requestId: 'req_123',
        currency: 'USD',
      });
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
    });

    it('should throw if funds lock fails', async () => {
      // Arrange
      const requestData = {
        ...mockRequestData,
        status: RequestStatus.AWAITING_PAYMENT,
      };

      mockPaymentService.lockFunds.mockResolvedValue(false);

      // Act & Assert
      await expect(
        stateTransitionService.handlePaymentSuccess('req_123', 'pi_123', requestData)
      ).rejects.toThrow('Failed to lock funds in escrow');

      expect(mockRequestService.transitionStatus).not.toHaveBeenCalled();
    });
  });

  describe('completeDelivery', () => {
    it('should release funds and deduct platform fee', async () => {
      // Arrange
      const requestData = {
        ...mockRequestData,
        status: RequestStatus.IN_PROGRESS,
        paymentPlatformFee: 70,
      };

      mockPaymentService.releaseFunds.mockResolvedValue(true);
      mockPaymentService.deductPlatformFee.mockResolvedValue(true);

      // Act
      const result = await stateTransitionService.completeDelivery(
        'req_123',
        'traveler_456',
        requestData
      );

      // Assert
      expect(mockPaymentService.releaseFunds).toHaveBeenCalledWith({
        requestId: 'req_123',
        toUserId: 'traveler_456',
      });
      expect(mockPaymentService.deductPlatformFee).toHaveBeenCalledWith(
        'traveler_456',
        70,
        'req_123'
      );
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

    it('should complete delivery even if fee deduction fails', async () => {
      // Arrange
      const requestData = {
        ...mockRequestData,
        status: RequestStatus.IN_PROGRESS,
        paymentPlatformFee: 70,
      };

      mockPaymentService.releaseFunds.mockResolvedValue(true);
      mockPaymentService.deductPlatformFee.mockResolvedValue(false);

      // Act
      const result = await stateTransitionService.completeDelivery(
        'req_123',
        'traveler_456',
        requestData
      );

      // Assert
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.DELIVERED,
        'traveler_456',
        'Delivery completed successfully'
      );
    });

    it('should throw if funds release fails', async () => {
      // Arrange
      const requestData = {
        ...mockRequestData,
        status: RequestStatus.IN_PROGRESS,
      };

      mockPaymentService.releaseFunds.mockResolvedValue(false);

      // Act & Assert
      await expect(
        stateTransitionService.completeDelivery('req_123', 'traveler_456', requestData)
      ).rejects.toThrow('Failed to release funds to traveler');

      expect(mockRequestService.transitionStatus).not.toHaveBeenCalled();
    });
  });

  describe('cancelRequest', () => {
    it('should cancel payment intent if in AWAITING_PAYMENT', async () => {
      // Arrange
      const requestData = {
        ...mockRequestData,
        status: RequestStatus.AWAITING_PAYMENT,
        paymentIntentId: 'pi_123',
      };

      mockPaymentService.cancelPaymentIntent.mockResolvedValue(undefined);

      // Act
      const result = await stateTransitionService.cancelRequest(
        'req_123',
        'buyer_123',
        'Changed my mind',
        requestData
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

    it('should refund funds if after payment', async () => {
      // Arrange
      const requestData = {
        ...mockRequestData,
        status: RequestStatus.IN_PROGRESS,
        paymentIntentId: 'pi_123',
      };

      mockPaymentService.refundFunds.mockResolvedValue(true);
      mockPaymentService.createStripeRefund.mockResolvedValue(true);

      // Act
      const result = await stateTransitionService.cancelRequest(
        'req_123',
        'buyer_123',
        'Item not needed',
        requestData
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

    it('should throw if refund fails', async () => {
      // Arrange
      const requestData = {
        ...mockRequestData,
        status: RequestStatus.IN_PROGRESS,
        paymentIntentId: 'pi_123',
      };

      mockPaymentService.refundFunds.mockResolvedValue(false);

      // Act & Assert
      await expect(
        stateTransitionService.cancelRequest('req_123', 'buyer_123', 'Cancel', requestData)
      ).rejects.toThrow('Failed to refund funds to buyer');

      expect(mockRequestService.transitionStatus).not.toHaveBeenCalled();
    });
  });

  describe('transitionStatus', () => {
    it('should delegate to requestService', async () => {
      // Act
      await stateTransitionService.transitionStatus(
        'req_123',
        RequestStatus.DELIVERED,
        'traveler_456',
        'Completed'
      );

      // Assert
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.DELIVERED,
        'traveler_456',
        'Completed'
      );
    });
  });

  describe('expireRequest', () => {
    it('should transition to EXPIRED', async () => {
      // Act
      await stateTransitionService.expireRequest('req_123', 'system');

      // Assert
      expect(mockRequestService.transitionStatus).toHaveBeenCalledWith(
        'req_123',
        RequestStatus.EXPIRED,
        'system',
        'Request expired - deadline passed'
      );
    });
  });
});
