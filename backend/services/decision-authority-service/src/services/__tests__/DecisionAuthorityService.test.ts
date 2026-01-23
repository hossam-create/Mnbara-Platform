import { PrismaClient, AssetType, DecisionStatus } from '@prisma/client';
import { DecisionAuthorityService } from '../DecisionAuthorityService';
import { DecisionSourceFactory } from '../../sources/DecisionSourceFactory';
import { 
  DecisionNotFoundError, 
  InvalidDecisionStateError, 
  ValidationError,
  DecisionSourceError 
} from '../../utils/errors';

// Mock DecisionSourceFactory
jest.mock('../../sources/DecisionSourceFactory');

// Mock Prisma Client
const mockPrisma = {
  assetDecisionRecord: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  decisionAuditLog: {
    create: jest.fn(),
    findMany: jest.fn()
  }
} as unknown as PrismaClient;

describe('DecisionAuthorityService', () => {

describe('DecisionAuthorityService', () => {
  let service: DecisionAuthorityService;
  let mockDecisionSource: any;

  beforeEach(() => {
    service = new DecisionAuthorityService(mockPrisma);
    jest.clearAllMocks();

    // Setup mock decision source
    mockDecisionSource = {
      getSourceName: jest.fn().mockReturnValue('INTERNAL'),
      requestDecision: jest.fn()
    };

    (DecisionSourceFactory.getDecisionSource as jest.Mock).mockReturnValue(mockDecisionSource);
  });

  describe('requestDecision', () => {
    it('should create a decision with PENDING status', async () => {
      const mockSourceResponse = {
        decisionId: 'dec-123',
        status: DecisionStatus.PENDING,
        decisionRef: 'ref-123',
        reason: null,
        decidedAt: null,
        expiresAt: new Date('2026-02-01')
      };

      const mockDecision = {
        id: 1,
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        decisionId: 'dec-123',
        status: DecisionStatus.PENDING,
        decisionRef: 'ref-123',
        reason: null,
        decisionSource: 'INTERNAL',
        requestedAt: new Date(),
        decidedAt: null,
        expiresAt: new Date('2026-02-01'),
        metadata: {}
      };

      mockDecisionSource.requestDecision.mockResolvedValue(mockSourceResponse);
      (mockPrisma.assetDecisionRecord.create as jest.Mock).mockResolvedValue(mockDecision);

      const result = await service.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'listing-123'
      });

      expect(result).toEqual(mockDecision);
      expect(mockDecisionSource.requestDecision).toHaveBeenCalledWith({
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        metadata: {}
      });
      expect(mockPrisma.assetDecisionRecord.create).toHaveBeenCalled();
      expect(mockPrisma.decisionAuditLog.create).toHaveBeenCalled();
    });

    it('should create a decision with metadata', async () => {
      const metadata = { sellerId: 'seller-123', price: 100 };
      const mockSourceResponse = {
        decisionId: 'dec-123',
        status: DecisionStatus.PENDING,
        decisionRef: 'ref-123',
        reason: null,
        decidedAt: null,
        expiresAt: new Date('2026-02-01')
      };

      mockDecisionSource.requestDecision.mockResolvedValue(mockSourceResponse);
      (mockPrisma.assetDecisionRecord.create as jest.Mock).mockResolvedValue({});

      await service.requestDecision({
        assetType: AssetType.AUCTION,
        assetId: 'auction-123',
        metadata
      });

      expect(mockDecisionSource.requestDecision).toHaveBeenCalledWith({
        assetType: AssetType.AUCTION,
        assetId: 'auction-123',
        metadata
      });
    });

    it('should throw ValidationError if assetType is missing', async () => {
      await expect(
        service.requestDecision({
          assetType: null as any,
          assetId: 'listing-123'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if assetId is empty', async () => {
      await expect(
        service.requestDecision({
          assetType: AssetType.LISTING,
          assetId: ''
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if assetType is invalid', async () => {
      await expect(
        service.requestDecision({
          assetType: 'INVALID_TYPE' as any,
          assetId: 'listing-123'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw DecisionSourceError if source fails', async () => {
      mockDecisionSource.requestDecision.mockRejectedValue(new Error('Source unavailable'));

      await expect(
        service.requestDecision({
          assetType: AssetType.LISTING,
          assetId: 'listing-123'
        })
      ).rejects.toThrow(DecisionSourceError);
    });
  });

  describe('getDecision', () => {
    it('should retrieve a decision by ID', async () => {
      const mockDecision = {
        id: 1,
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        status: DecisionStatus.PENDING,
        auditLogs: []
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);

      const result = await service.getDecision(1);

      expect(result).toEqual(mockDecision);
      expect(mockPrisma.assetDecisionRecord.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          auditLogs: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    });

    it('should throw DecisionNotFoundError if decision does not exist', async () => {
      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getDecision(999)).rejects.toThrow(DecisionNotFoundError);
    });
  });

  describe('getDecisionByDecisionId', () => {
    it('should retrieve a decision by decisionId', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec-123',
        assetType: AssetType.LISTING,
        status: DecisionStatus.PENDING,
        auditLogs: []
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);

      const result = await service.getDecisionByDecisionId('dec-123');

      expect(result).toEqual(mockDecision);
      expect(mockPrisma.assetDecisionRecord.findUnique).toHaveBeenCalledWith({
        where: { decisionId: 'dec-123' },
        include: {
          auditLogs: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    });

    it('should throw DecisionNotFoundError if decision does not exist', async () => {
      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getDecisionByDecisionId('dec-999')).rejects.toThrow(DecisionNotFoundError);
    });
  });

  describe('getDecisionsByAsset', () => {
    it('should retrieve all decisions for an asset', async () => {
      const mockDecisions = [
        { id: 1, assetType: AssetType.LISTING, assetId: 'listing-123', status: DecisionStatus.APPROVED },
        { id: 2, assetType: AssetType.LISTING, assetId: 'listing-123', status: DecisionStatus.PENDING }
      ];

      (mockPrisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue(mockDecisions);

      const result = await service.getDecisionsByAsset(AssetType.LISTING, 'listing-123');

      expect(result).toEqual(mockDecisions);
      expect(mockPrisma.assetDecisionRecord.findMany).toHaveBeenCalledWith({
        where: {
          assetType: AssetType.LISTING,
          assetId: 'listing-123'
        },
        orderBy: { requestedAt: 'desc' },
        include: {
          auditLogs: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    });

    it('should return empty array if no decisions found', async () => {
      (mockPrisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getDecisionsByAsset(AssetType.AUCTION, 'auction-999');

      expect(result).toEqual([]);
    });
  });

  describe('listDecisions', () => {
    it('should list decisions with all filters', async () => {
      const mockDecisions = [{ id: 1 }, { id: 2 }];
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      (mockPrisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue(mockDecisions);
      (mockPrisma.assetDecisionRecord.count as jest.Mock).mockResolvedValue(2);

      const result = await service.listDecisions({
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        status: DecisionStatus.APPROVED,
        decisionSource: 'INTERNAL',
        startDate,
        endDate,
        limit: 10,
        offset: 0
      });

      expect(result).toEqual({
        decisions: mockDecisions,
        total: 2,
        limit: 10,
        offset: 0
      });

      expect(mockPrisma.assetDecisionRecord.findMany).toHaveBeenCalledWith({
        where: {
          assetType: AssetType.LISTING,
          assetId: 'listing-123',
          status: DecisionStatus.APPROVED,
          decisionSource: 'INTERNAL',
          requestedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { requestedAt: 'desc' },
        take: 10,
        skip: 0,
        include: {
          auditLogs: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    });

    it('should use default limit and offset', async () => {
      (mockPrisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.assetDecisionRecord.count as jest.Mock).mockResolvedValue(0);

      const result = await service.listDecisions({});

      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('should handle partial filters', async () => {
      (mockPrisma.assetDecisionRecord.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.assetDecisionRecord.count as jest.Mock).mockResolvedValue(0);

      await service.listDecisions({
        status: DecisionStatus.PENDING
      });

      expect(mockPrisma.assetDecisionRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: DecisionStatus.PENDING
          }
        })
      );
    });
  });

  describe('updateDecisionFromSource', () => {
    it('should update decision to APPROVED from source', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec-123',
        status: DecisionStatus.PENDING,
        assetType: AssetType.LISTING,
        assetId: 'listing-123'
      };

      const mockUpdated = {
        ...mockDecision,
        status: DecisionStatus.APPROVED,
        decidedAt: new Date()
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);
      (mockPrisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await service.updateDecisionFromSource(
        'dec-123',
        DecisionStatus.APPROVED,
        'Approved by regulator'
      );

      expect(result.status).toBe(DecisionStatus.APPROVED);
      expect(mockPrisma.assetDecisionRecord.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: DecisionStatus.APPROVED,
          reason: 'Approved by regulator',
          decidedAt: expect.any(Date)
        }
      });
      expect(mockPrisma.decisionAuditLog.create).toHaveBeenCalled();
    });

    it('should update decision to REJECTED from source', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec-123',
        status: DecisionStatus.PENDING
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);
      (mockPrisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue({
        ...mockDecision,
        status: DecisionStatus.REJECTED
      });

      await service.updateDecisionFromSource(
        'dec-123',
        DecisionStatus.REJECTED,
        'Rejected by regulator'
      );

      expect(mockPrisma.assetDecisionRecord.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: DecisionStatus.REJECTED,
          reason: 'Rejected by regulator',
          decidedAt: expect.any(Date)
        }
      });
    });

    it('should throw InvalidDecisionStateError for EXPIRED status from source', async () => {
      await expect(
        service.updateDecisionFromSource('dec-123', DecisionStatus.EXPIRED)
      ).rejects.toThrow(InvalidDecisionStateError);
    });

    it('should throw InvalidDecisionStateError for CANCELLED status from source', async () => {
      await expect(
        service.updateDecisionFromSource('dec-123', DecisionStatus.CANCELLED)
      ).rejects.toThrow(InvalidDecisionStateError);
    });

    it('should throw InvalidDecisionStateError if decision is not PENDING', async () => {
      const mockDecision = {
        id: 1,
        decisionId: 'dec-123',
        status: DecisionStatus.APPROVED
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);

      await expect(
        service.updateDecisionFromSource('dec-123', DecisionStatus.REJECTED)
      ).rejects.toThrow(InvalidDecisionStateError);
    });
  });

  describe('expireDecision', () => {
    it('should expire a PENDING decision', async () => {
      const mockDecision = {
        id: 1,
        status: DecisionStatus.PENDING,
        expiresAt: new Date('2026-01-01')
      };

      const mockExpired = {
        ...mockDecision,
        status: DecisionStatus.EXPIRED
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);
      (mockPrisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue(mockExpired);

      const result = await service.expireDecision(1);

      expect(result.status).toBe(DecisionStatus.EXPIRED);
      expect(mockPrisma.assetDecisionRecord.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: DecisionStatus.EXPIRED
        }
      });
      expect(mockPrisma.decisionAuditLog.create).toHaveBeenCalled();
    });

    it('should throw InvalidDecisionStateError if decision is not PENDING', async () => {
      const mockDecision = {
        id: 1,
        status: DecisionStatus.APPROVED
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);

      await expect(service.expireDecision(1)).rejects.toThrow(InvalidDecisionStateError);
    });

    it('should throw DecisionNotFoundError if decision does not exist', async () => {
      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.expireDecision(999)).rejects.toThrow(DecisionNotFoundError);
    });
  });

  describe('cancelDecision', () => {
    it('should cancel a PENDING decision', async () => {
      const mockDecision = {
        id: 1,
        status: DecisionStatus.PENDING,
        reason: null
      };

      const mockCancelled = {
        ...mockDecision,
        status: DecisionStatus.CANCELLED,
        reason: 'Asset removed'
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);
      (mockPrisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue(mockCancelled);

      const result = await service.cancelDecision(1, 'Asset removed');

      expect(result.status).toBe(DecisionStatus.CANCELLED);
      expect(mockPrisma.assetDecisionRecord.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: DecisionStatus.CANCELLED,
          reason: 'Asset removed'
        }
      });
      expect(mockPrisma.decisionAuditLog.create).toHaveBeenCalled();
    });

    it('should preserve existing reason if no new reason provided', async () => {
      const mockDecision = {
        id: 1,
        status: DecisionStatus.PENDING,
        reason: 'Original reason'
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);
      (mockPrisma.assetDecisionRecord.update as jest.Mock).mockResolvedValue({
        ...mockDecision,
        status: DecisionStatus.CANCELLED
      });

      await service.cancelDecision(1);

      expect(mockPrisma.assetDecisionRecord.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: DecisionStatus.CANCELLED,
          reason: 'Original reason'
        }
      });
    });

    it('should throw InvalidDecisionStateError if decision is not PENDING', async () => {
      const mockDecision = {
        id: 1,
        status: DecisionStatus.REJECTED
      };

      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(mockDecision);

      await expect(service.cancelDecision(1)).rejects.toThrow(InvalidDecisionStateError);
    });

    it('should throw DecisionNotFoundError if decision does not exist', async () => {
      (mockPrisma.assetDecisionRecord.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.cancelDecision(999)).rejects.toThrow(DecisionNotFoundError);
    });
  });
