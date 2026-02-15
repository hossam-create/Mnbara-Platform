// ============================================
// DisputeService Unit Tests
// ============================================

import { DisputeService } from '../DisputeService';
import { DisputeStatus, DisputeReason, DisputeParty } from '../../types/dispute.types';
import {
  DuplicateDisputeError,
  DisputeNotFoundError,
  UnauthorizedDisputeAccessError,
  RequestNotEligibleForDisputeError,
  DisputeWindowExpiredError
} from '../../errors/DisputeErrors';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    dispute: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn()
    },
    request: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    disputeEvidence: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      delete: jest.fn()
    }
  }))
}));

describe('DisputeService', () => {
  let disputeService: DisputeService;
  let prisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    disputeService = new DisputeService();
    prisma = (disputeService as any).prisma;
  });

  describe('openDispute', () => {
    const mockRequest = {
      id: 1,
      buyerId: 'buyer-123',
      sellerId: 'seller-456',
      status: 'DELIVERED',
      updatedAt: new Date()
    };

    it('should successfully open a dispute', async () => {
      prisma.request.findUnique.mockResolvedValue(mockRequest);
      prisma.dispute.findFirst.mockResolvedValue(null);
      prisma.dispute.create.mockResolvedValue({
        id: 'dispute-123',
        requestId: 1,
        openedBy: DisputeParty.BUYER,
        reason: DisputeReason.NOT_DELIVERED,
        description: 'Item not received',
        status: DisputeStatus.OPEN
      });
      prisma.request.update.mockResolvedValue({});
      prisma.disputeEvidence.findMany.mockResolvedValue([]);

      const result = await disputeService.openDispute(
        {
          requestId: 1,
          reason: DisputeReason.NOT_DELIVERED,
          description: 'Item not received'
        },
        'buyer-123',
        DisputeParty.BUYER
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(DisputeStatus.OPEN);
    });

    it('should throw error if request not found', async () => {
      prisma.request.findUnique.mockResolvedValue(null);

      await expect(
        disputeService.openDispute(
          { requestId: 999, reason: DisputeReason.NOT_DELIVERED, description: 'Test' },
          'user-123',
          DisputeParty.BUYER
        )
      ).rejects.toThrow(RequestNotEligibleForDisputeError);
    });

    it('should throw error if request status is not DELIVERED', async () => {
      prisma.request.findUnique.mockResolvedValue({ ...mockRequest, status: 'SHIPPED' });

      await expect(
        disputeService.openDispute(
          { requestId: 1, reason: DisputeReason.NOT_DELIVERED, description: 'Test' },
          'buyer-123',
          DisputeParty.BUYER
        )
      ).rejects.toThrow(RequestNotEligibleForDisputeError);
    });

    it('should throw error if user is not the buyer', async () => {
      prisma.request.findUnique.mockResolvedValue(mockRequest);

      await expect(
        disputeService.openDispute(
          { requestId: 1, reason: DisputeReason.NOT_DELIVERED, description: 'Test' },
          'wrong-user',
          DisputeParty.BUYER
        )
      ).rejects.toThrow(UnauthorizedDisputeAccessError);
    });

    it('should throw error if dispute already exists', async () => {
      prisma.request.findUnique.mockResolvedValue(mockRequest);
      prisma.dispute.findFirst.mockResolvedValue({ id: 'existing-dispute' });

      await expect(
        disputeService.openDispute(
          { requestId: 1, reason: DisputeReason.NOT_DELIVERED, description: 'Test' },
          'buyer-123',
          DisputeParty.BUYER
        )
      ).rejects.toThrow(DuplicateDisputeError);
    });

    it('should throw error if 48-hour window expired', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 3); // 3 days ago
      
      prisma.request.findUnique.mockResolvedValue({ ...mockRequest, updatedAt: oldDate });

      await expect(
        disputeService.openDispute(
          { requestId: 1, reason: DisputeReason.NOT_DELIVERED, description: 'Test' },
          'buyer-123',
          DisputeParty.BUYER
        )
      ).rejects.toThrow(DisputeWindowExpiredError);
    });
  });

  describe('getDisputeById', () => {
    it('should return dispute if found', async () => {
      const mockDispute = {
        id: 'dispute-123',
        requestId: 1,
        openedBy: DisputeParty.BUYER,
        reason: DisputeReason.NOT_DELIVERED,
        description: 'Test',
        status: DisputeStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prisma.dispute.findUnique.mockResolvedValue(mockDispute);
      prisma.disputeEvidence.findMany.mockResolvedValue([]);

      const result = await disputeService.getDisputeById('dispute-123', 'buyer-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('dispute-123');
    });

    it('should throw error if dispute not found', async () => {
      prisma.dispute.findUnique.mockResolvedValue(null);

      await expect(
        disputeService.getDisputeById('non-existent', 'user-123')
      ).rejects.toThrow(DisputeNotFoundError);
    });
  });

  describe('getUserDisputes', () => {
    it('should return user disputes', async () => {
      const mockDisputes = [
        { id: 'dispute-1', status: DisputeStatus.OPEN },
        { id: 'dispute-2', status: DisputeStatus.UNDER_REVIEW }
      ];

      prisma.dispute.findMany.mockResolvedValue(mockDisputes);
      prisma.dispute.count.mockResolvedValue(2);

      const result = await disputeService.getUserDisputes(
        'buyer-123',
        DisputeParty.BUYER,
        {}
      );

      expect(result.disputes).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('getAllDisputes', () => {
    it('should return all disputes for admin', async () => {
      const mockDisputes = [
        { id: 'dispute-1', status: DisputeStatus.OPEN },
        { id: 'dispute-2', status: DisputeStatus.RESOLVED }
      ];

      prisma.dispute.findMany.mockResolvedValue(mockDisputes);
      prisma.dispute.count.mockResolvedValue(2);

      const result = await disputeService.getAllDisputes({});

      expect(result.disputes).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      prisma.dispute.findMany.mockResolvedValue([]);
      prisma.dispute.count.mockResolvedValue(0);

      await disputeService.getAllDisputes({
        status: DisputeStatus.OPEN
      });

      expect(prisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: DisputeStatus.OPEN
          })
        })
      );
    });
  });

  describe('markUnderReview', () => {
    it('should update dispute status to UNDER_REVIEW', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        id: 'dispute-123',
        status: DisputeStatus.OPEN
      });
      prisma.dispute.update.mockResolvedValue({
        id: 'dispute-123',
        status: DisputeStatus.UNDER_REVIEW
      });

      const result = await disputeService.markUnderReview('dispute-123', 'admin-1');

      expect(result.status).toBe(DisputeStatus.UNDER_REVIEW);
    });

    it('should throw error if dispute not in OPEN status', async () => {
      prisma.dispute.findUnique.mockResolvedValue({
        id: 'dispute-123',
        status: DisputeStatus.RESOLVED
      });

      await expect(
        disputeService.markUnderReview('dispute-123', 'admin-1')
      ).rejects.toThrow();
    });
  });

  describe('getDisputeStats', () => {
    it('should return correct statistics', async () => {
      prisma.dispute.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // open
        .mockResolvedValueOnce(2)  // under review
        .mockResolvedValueOnce(5); // resolved

      prisma.dispute.groupBy.mockResolvedValue([
        { reason: DisputeReason.NOT_DELIVERED, _count: 4 },
        { reason: DisputeReason.WRONG_ITEM, _count: 1 }
      ]);

      const result = await disputeService.getDisputeStats();

      expect(result.total).toBe(10);
      expect(result.open).toBe(3);
      expect(result.underReview).toBe(2);
      expect(result.resolved).toBe(5);
    });
  });
});
