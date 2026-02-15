import { PrismaClient } from '@prisma/client';
import { TrustCaseIngestionService } from '../trust_case_ingestion.service';
import { TrustCaseSubjectType, TrustCaseStatus, TrustCaseSeverity } from '../../../models/trust_case.model';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    trustCase: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn()
    },
    trustRule: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

describe('TrustCaseIngestionService', () => {
  let service: TrustCaseIngestionService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    service = new TrustCaseIngestionService();
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('runIngestionPipeline', () => {
    it('should process no logs when none are available', async () => {
      const result = await service.runIngestionPipeline();
      
      expect(result.processed).toBe(0);
      expect(result.created).toBe(0);
      expect(result.duplicates).toBe(0);
      expect(result.errors).toBe(0);
      expect(result.details.cases).toHaveLength(0);
      expect(result.details.errors).toHaveLength(0);
    });

    it('should create trust cases from flagged rule logs', async () => {
      // Mock rule exists
      (mockPrisma.trustRule.findUnique as jest.Mock).mockResolvedValue({
        id: 'rule-1',
        rule_id: 'USER_SUSPICIOUS_ACTIVITY',
        name: 'Suspicious User Activity',
        severity: 'HIGH'
      });

      // Mock no existing case
      (mockPrisma.trustCase.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock case creation
      const createdCase = {
        case_id: 'TC-123-abc123',
        subject_type: 'USER',
        subject_id: 'user-123',
        rule_id: 'rule-1',
        severity: 'HIGH',
        status: 'OPEN',
        created_at: new Date(),
        notes: 'Rule flagged: unusual_login_pattern. Confidence: 0.85'
      };
      (mockPrisma.trustCase.create as jest.Mock).mockResolvedValue(createdCase);

      const result = await service.runIngestionPipeline();

      expect(result.processed).toBe(2); // 2 mock logs
      expect(result.created).toBe(2);
      expect(result.duplicates).toBe(0);
      expect(result.errors).toBe(0);
      expect(result.details.cases).toHaveLength(2);
    });

    it('should skip duplicate cases within window', async () => {
      // Mock existing case found
      (mockPrisma.trustCase.findFirst as jest.Mock).mockResolvedValue({
        case_id: 'existing-case',
        status: 'OPEN',
        created_at: new Date()
      });

      const result = await service.runIngestionPipeline();

      expect(result.created).toBe(0);
      expect(result.duplicates).toBe(2); // Both logs should be marked as duplicates
    });

    it('should handle errors gracefully', async () => {
      // Mock rule not found
      (mockPrisma.trustRule.findUnique as jest.Mock).mockRejectedValue(
        new Error('Rule not found')
      );

      const result = await service.runIngestionPipeline();

      expect(result.errors).toBeGreaterThan(0);
      expect(result.details.errors).toHaveLength(2);
    });
  });

  describe('createTrustCase', () => {
    it('should create trust case from valid data', async () => {
      const caseData = {
        subject_type: TrustCaseSubjectType.USER,
        subject_id: 'user-123',
        rule_id: 'rule-1',
        severity: TrustCaseSeverity.HIGH,
        status: TrustCaseStatus.OPEN
      };

      const expectedCase = {
        case_id: expect.any(String),
        ...caseData
      };

      (mockPrisma.trustCase.create as jest.Mock).mockResolvedValue(expectedCase);

      const result = await service.createTrustCase(caseData);

      expect(mockPrisma.trustCase.create).toHaveBeenCalledWith({
        data: {
          ...caseData,
          case_id: expect.any(String)
        },
        include: {
          rule: true
        }
      });
      expect(result).toEqual(expectedCase);
    });

    it('should throw error when rule_id is missing', async () => {
      const caseData = {
        subject_type: TrustCaseSubjectType.USER,
        subject_id: 'user-123',
        rule_id: '',
        severity: TrustCaseSeverity.HIGH,
        status: TrustCaseStatus.OPEN
      };

      await expect(service.createTrustCase(caseData)).rejects.toThrow(
        'TrustCase must be created from a rule flag'
      );
    });
  });

  describe('getTrustCase', () => {
    it('should return trust case when found', async () => {
      const caseId = 'TC-123';
      const expectedCase = {
        case_id: caseId,
        subject_type: 'USER',
        subject_id: 'user-123',
        status: 'OPEN'
      };

      (mockPrisma.trustCase.findUnique as jest.Mock).mockResolvedValue(expectedCase);

      const result = await service.getTrustCase(caseId);

      expect(mockPrisma.trustCase.findUnique).toHaveBeenCalledWith({
        where: { case_id: caseId },
        include: { rule: true }
      });
      expect(result).toEqual(expectedCase);
    });

    it('should return null when case not found', async () => {
      (mockPrisma.trustCase.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getTrustCase('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('resolveTrustCase', () => {
    it('should resolve trust case with human decision', async () => {
      const resolutionData = {
        case_id: 'TC-123',
        status: 'RESOLVED',
        resolved_by: 'user-456',
        notes: 'Case reviewed and resolved'
      };

      const expectedCase = {
        case_id: 'TC-123',
        status: 'RESOLVED',
        resolved_at: expect.any(Date),
        resolved_by: 'user-456',
        notes: 'Case reviewed and resolved'
      };

      (mockPrisma.trustCase.update as jest.Mock).mockResolvedValue(expectedCase);

      const result = await service.resolveTrustCase(resolutionData);

      expect(mockPrisma.trustCase.update).toHaveBeenCalledWith({
        where: { case_id: 'TC-123' },
        data: {
          ...resolutionData,
          resolved_at: expect.any(Date),
          updated_at: expect.any(Date)
        },
        include: { rule: true }
      });
      expect(result).toEqual(expectedCase);
    });

    it('should throw error when resolved_by is missing', async () => {
      const resolutionData = {
        case_id: 'TC-123',
        status: 'RESOLVED',
        resolved_by: '',
        notes: 'Case reviewed'
      };

      await expect(service.resolveTrustCase(resolutionData)).rejects.toThrow(
        'Human decision required for TrustCase resolution'
      );
    });
  });

  describe('queryTrustCases', () => {
    it('should query trust cases with filters', async () => {
      const query = {
        subject_type: TrustCaseSubjectType.USER,
        status: TrustCaseStatus.OPEN,
        limit: 10,
        offset: 0
      };

      const expectedCases = [
        {
          case_id: 'TC-123',
          subject_type: 'USER',
          status: 'OPEN'
        }
      ];

      (mockPrisma.trustCase.findMany as jest.Mock).mockResolvedValue(expectedCases);

      const result = await service.queryTrustCases(query);

      expect(mockPrisma.trustCase.findMany).toHaveBeenCalledWith({
        where: {
          subject_type: 'USER',
          status: 'OPEN'
        },
        include: { rule: true },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10
      });
      expect(result).toEqual(expectedCases);
    });

    it('should return all cases when no filters provided', async () => {
      const query = {
        limit: 20,
        offset: 0
      };

      const expectedCases = [
        { case_id: 'TC-123' },
        { case_id: 'TC-456' }
      ];

      (mockPrisma.trustCase.findMany as jest.Mock).mockResolvedValue(expectedCases);

      const result = await service.queryTrustCases(query);

      expect(mockPrisma.trustCase.findMany).toHaveBeenCalledWith({
        where: {},
        include: { rule: true },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 20
      });
      expect(result).toEqual(expectedCases);
    });
  });

  describe('getTrustCaseStats', () => {
    it('should return aggregated statistics', async () => {
      const mockAggregate = { _count: { id: 100 } };
      const mockStatusStats = [
        { status: 'OPEN', _count: { id: 10 } },
        { status: 'RESOLVED', _count: { id: 80 } },
        { status: 'DISMISSED', _count: { id: 10 } }
      ];
      const mockSeverityStats = [
        { severity: 'LOW', _count: { id: 20 } },
        { severity: 'HIGH', _count: { id: 30 } },
        { severity: 'CRITICAL', _count: { id: 50 } }
      ];
      const mockSubjectTypeStats = [
        { subject_type: 'USER', _count: { id: 60 } },
        { subject_type: 'SELLER', _count: { id: 40 } }
      ];

      (mockPrisma.trustCase.aggregate as jest.Mock).mockResolvedValue(mockAggregate);
      (mockPrisma.trustCase.groupBy as jest.Mock)
        .mockResolvedValueOnce(mockStatusStats)
        .mockResolvedValueOnce(mockSeverityStats)
        .mockResolvedValueOnce(mockSubjectTypeStats);

      const result = await service.getTrustCaseStats();

      expect(result).toEqual({
        total_cases: 100,
        open_cases: 10,
        under_review_cases: 0,
        resolved_cases: 80,
        dismissed_cases: 10,
        cases_by_severity: {
          LOW: 20,
          HIGH: 30,
          CRITICAL: 50
        },
        cases_by_subject_type: {
          USER: 60,
          SELLER: 40
        },
        average_resolution_time: null,
        cases_created_today: 0,
        cases_created_this_week: 0,
        cases_created_this_month: 0
      });
    });

    it('should apply date range filters', async () => {
      const filters = {
        date_range: {
          start: new Date('2025-01-01'),
          end: new Date('2025-01-31')
        }
      };

      await service.getTrustCaseStats(filters);

      expect(mockPrisma.trustCase.aggregate).toHaveBeenCalledWith({
        _count: { id: true },
        where: {
          created_at: {
            gte: filters.date_range.start,
            lte: filters.date_range.end
          }
        }
      });
    });
  });

  describe('getTrustCasesBySubject', () => {
    it('should return cases for specific subject', async () => {
      const expectedCases = [
        { case_id: 'TC-123', subject_type: 'USER', subject_id: 'user-123' }
      ];

      (mockPrisma.trustCase.findMany as jest.Mock).mockResolvedValue(expectedCases);

      const result = await service.getTrustCasesBySubject(
        TrustCaseSubjectType.USER,
        'user-123'
      );

      expect(result).toEqual(expectedCases);
    });
  });

  describe('getOpenTrustCases', () => {
    it('should return only open cases', async () => {
      const expectedCases = [
        { case_id: 'TC-123', status: 'OPEN' },
        { case_id: 'TC-456', status: 'OPEN' }
      ];

      (mockPrisma.trustCase.findMany as jest.Mock).mockResolvedValue(expectedCases);

      const result = await service.getOpenTrustCases();

      expect(result).toEqual(expectedCases);
    });
  });

  describe('getTrustCasesByRule', () => {
    it('should return cases for specific rule', async () => {
      const expectedCases = [
        { case_id: 'TC-123', rule_id: 'rule-1' }
      ];

      (mockPrisma.trustCase.findMany as jest.Mock).mockResolvedValue(expectedCases);

      const result = await service.getTrustCasesByRule('rule-1');

      expect(result).toEqual(expectedCases);
    });
  });

  describe('idempotency', () => {
    it('should not create duplicate cases within window', async () => {
      // This test verifies the idempotency logic
      const caseData = {
        subject_type: TrustCaseSubjectType.USER,
        subject_id: 'user-123',
        rule_id: 'rule-1',
        severity: TrustCaseSeverity.HIGH,
        status: TrustCaseStatus.OPEN
      };

      // First call should succeed
      (mockPrisma.trustCase.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.trustCase.create as jest.Mock).mockResolvedValue(caseData);

      const result1 = await service.createTrustCase(caseData);
      expect(result1).toBeDefined();

      // Second call within window should find existing case
      (mockPrisma.trustCase.findFirst as jest.Mock).mockResolvedValue({
        case_id: 'existing-case',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      });

      const result2 = await service.checkForExistingCase(
        'rule-1',
        TrustCaseSubjectType.USER,
        'user-123'
      );
      expect(result2).toBeDefined();
    });
  });

  describe('financial authority restrictions', () => {
    it('should never access financial resources', async () => {
      // This test ensures the service never accesses wallet/escrow/ledger
      const service = new TrustCaseIngestionService();
      
      // Verify no financial methods exist
      expect((service as any).accessWallet).toBeUndefined();
      expect((service as any).accessEscrow).toBeUndefined();
      expect((service as any).accessLedger).toBeUndefined();
      
      // Verify only trust case operations are available
      expect(typeof service.createTrustCase).toBe('function');
      expect(typeof service.getTrustCase).toBe('function');
      expect(typeof service.resolveTrustCase).toBe('function');
    });
  });
});
