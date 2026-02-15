import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionClassifierService } from '../transaction-classifier.service';
import { TrustLevelService } from '../trust-level.service';
import { SettlementMethod } from '../../types/enums';
import { ExchangeRequest, TrustLevel } from '@prisma/client';

describe('TransactionClassifierService', () => {
  let service: TransactionClassifierService;
  let trustLevelService: jest.Mocked<TrustLevelService>;

  const mockTrustLevel = (level: number): TrustLevel => ({
    id: 1,
    userId: 1,
    level,
    maxTransactionAmount: new Decimal(level * 1000),
    successfulExchanges: level * 10,
    totalVolume: new Decimal(level * 5000),
    disputeCount: 0,
    timeoutCount: 0,
    lastLevelUpAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const mockExchangeRequest = (
    amount: number,
    useExternalEscrow: boolean = false
  ): ExchangeRequest => ({
    id: 1,
    userId: 1,
    fromCurrency: 'USD',
    toCurrency: 'SAR',
    fromAmount: new Decimal(amount),
    toAmount: new Decimal(amount * 3.75),
    desiredRate: new Decimal(3.75),
    actualRate: null,
    platformFee: new Decimal(amount * 0.01),
    protectionFee: null,
    status: 'OPEN',
    trustLevel: 1,
    securityDeposit: new Decimal(amount * 0.1),
    useExternalEscrow,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    matchedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  beforeEach(() => {
    trustLevelService = {
      getTrustLevel: jest.fn()
    } as any;
    service = new TransactionClassifierService(trustLevelService);
  });

  describe('classifyTransaction', () => {
    describe('Small amounts (< $300)', () => {
      it('should classify $100 as INTERNAL', async () => {
        const request = mockExchangeRequest(100);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(1));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.INTERNAL);
      });

      it('should classify $299 as INTERNAL', async () => {
        const request = mockExchangeRequest(299);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(1));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.INTERNAL);
      });

      it('should classify $50 as INTERNAL regardless of trust level', async () => {
        const request = mockExchangeRequest(50);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(1));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.INTERNAL);
      });

      it('should classify $50 as INTERNAL even if user requests external escrow', async () => {
        const request = mockExchangeRequest(50, true);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(1));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.INTERNAL);
      });
    });

    describe('Large amounts (> $1000)', () => {
      it('should classify $1001 as EXTERNAL_MANDATORY', async () => {
        const request = mockExchangeRequest(1001);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(5));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.EXTERNAL_MANDATORY);
      });

      it('should classify $5000 as EXTERNAL_MANDATORY', async () => {
        const request = mockExchangeRequest(5000);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(5));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.EXTERNAL_MANDATORY);
      });

      it('should classify $10000 as EXTERNAL_MANDATORY regardless of trust level', async () => {
        const request = mockExchangeRequest(10000);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(1));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.EXTERNAL_MANDATORY);
      });
    });

    describe('Medium amounts ($300-$1000)', () => {
      it('should classify $500 as EXTERNAL_OPTIONAL if user requests it', async () => {
        const request = mockExchangeRequest(500, true);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(3));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.EXTERNAL_OPTIONAL);
      });

      it('should classify $500 as INTERNAL for high trust user without external request', async () => {
        const request = mockExchangeRequest(500, false);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(3));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.INTERNAL);
      });

      it('should classify $500 as EXTERNAL_MANDATORY for low trust user (level 1)', async () => {
        const request = mockExchangeRequest(500, false);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(1));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.EXTERNAL_MANDATORY);
      });

      it('should classify $500 as EXTERNAL_MANDATORY for low trust user (level 2)', async () => {
        const request = mockExchangeRequest(500, false);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(2));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.EXTERNAL_MANDATORY);
      });

      it('should classify $300 as INTERNAL for high trust user', async () => {
        const request = mockExchangeRequest(300, false);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(4));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.INTERNAL);
      });

      it('should classify $1000 as INTERNAL for high trust user', async () => {
        const request = mockExchangeRequest(1000, false);
        trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(5));

        const result = await service.classifyTransaction(request);

        expect(result).toBe(SettlementMethod.INTERNAL);
      });
    });
  });

  describe('getClassificationRules', () => {
    it('should return all classification rules', () => {
      const rules = service.getClassificationRules();

      expect(rules).toHaveLength(3);
      expect(rules[0].amountRange).toBe('< $300');
      expect(rules[0].settlementMethod).toBe(SettlementMethod.INTERNAL);
      expect(rules[1].amountRange).toBe('$300 - $1000');
      expect(rules[1].settlementMethod).toBe(SettlementMethod.EXTERNAL_OPTIONAL);
      expect(rules[2].amountRange).toBe('> $1000');
      expect(rules[2].settlementMethod).toBe(SettlementMethod.EXTERNAL_MANDATORY);
    });

    it('should include descriptions for each rule', () => {
      const rules = service.getClassificationRules();

      rules.forEach(rule => {
        expect(rule.description).toBeTruthy();
        expect(rule.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('isExternalEscrowRequired', () => {
    it('should return false for small amounts', () => {
      const result = service.isExternalEscrowRequired(new Decimal(100), 1);
      expect(result).toBe(false);
    });

    it('should return true for large amounts regardless of trust level', () => {
      const result1 = service.isExternalEscrowRequired(new Decimal(1500), 5);
      const result2 = service.isExternalEscrowRequired(new Decimal(1500), 1);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should return true for medium amounts with low trust level', () => {
      const result1 = service.isExternalEscrowRequired(new Decimal(500), 1);
      const result2 = service.isExternalEscrowRequired(new Decimal(500), 2);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should return false for medium amounts with high trust level', () => {
      const result1 = service.isExternalEscrowRequired(new Decimal(500), 3);
      const result2 = service.isExternalEscrowRequired(new Decimal(500), 4);
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should handle boundary values correctly', () => {
      expect(service.isExternalEscrowRequired(new Decimal(299), 1)).toBe(false);
      expect(service.isExternalEscrowRequired(new Decimal(300), 1)).toBe(true);
      expect(service.isExternalEscrowRequired(new Decimal(1000), 1)).toBe(true);
      expect(service.isExternalEscrowRequired(new Decimal(1001), 1)).toBe(true);
    });
  });

  describe('isExternalEscrowAvailable', () => {
    it('should return false for small amounts', () => {
      expect(service.isExternalEscrowAvailable(new Decimal(100))).toBe(false);
      expect(service.isExternalEscrowAvailable(new Decimal(299))).toBe(false);
    });

    it('should return true for medium amounts', () => {
      expect(service.isExternalEscrowAvailable(new Decimal(300))).toBe(true);
      expect(service.isExternalEscrowAvailable(new Decimal(500))).toBe(true);
      expect(service.isExternalEscrowAvailable(new Decimal(1000))).toBe(true);
    });

    it('should return true for large amounts', () => {
      expect(service.isExternalEscrowAvailable(new Decimal(1001))).toBe(true);
      expect(service.isExternalEscrowAvailable(new Decimal(5000))).toBe(true);
    });
  });

  describe('getRecommendation', () => {
    it('should recommend INTERNAL for small amounts', async () => {
      const request = mockExchangeRequest(100);
      trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(1));

      const result = await service.getRecommendation(request);

      expect(result.settlementMethod).toBe(SettlementMethod.INTERNAL);
      expect(result.reason).toContain('Small amount');
      expect(result.alternatives).toBeUndefined();
    });

    it('should recommend EXTERNAL_MANDATORY for large amounts', async () => {
      const request = mockExchangeRequest(2000);
      trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(5));

      const result = await service.getRecommendation(request);

      expect(result.settlementMethod).toBe(SettlementMethod.EXTERNAL_MANDATORY);
      expect(result.reason).toContain('Large amount');
      expect(result.alternatives).toBeUndefined();
    });

    it('should recommend EXTERNAL_MANDATORY for low trust users with medium amounts', async () => {
      const request = mockExchangeRequest(500);
      trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(2));

      const result = await service.getRecommendation(request);

      expect(result.settlementMethod).toBe(SettlementMethod.EXTERNAL_MANDATORY);
      expect(result.reason).toContain('trust level');
      expect(result.alternatives).toBeUndefined();
    });

    it('should recommend EXTERNAL_OPTIONAL when user requests it', async () => {
      const request = mockExchangeRequest(500, true);
      trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(3));

      const result = await service.getRecommendation(request);

      expect(result.settlementMethod).toBe(SettlementMethod.EXTERNAL_OPTIONAL);
      expect(result.reason).toContain('External escrow selected');
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives![0]).toContain('internal netting');
    });

    it('should recommend INTERNAL for trusted users with medium amounts', async () => {
      const request = mockExchangeRequest(500);
      trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(4));

      const result = await service.getRecommendation(request);

      expect(result.settlementMethod).toBe(SettlementMethod.INTERNAL);
      expect(result.reason).toContain('Internal netting recommended');
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives![0]).toContain('external escrow');
    });
  });

  describe('Edge cases', () => {
    it('should handle decimal amounts correctly', async () => {
      const request = mockExchangeRequest(299.99);
      trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(1));

      const result = await service.classifyTransaction(request);

      expect(result).toBe(SettlementMethod.INTERNAL);
    });

    it('should handle exact boundary values', async () => {
      const request300 = mockExchangeRequest(300);
      const request1000 = mockExchangeRequest(1000);
      trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(3));

      const result300 = await service.classifyTransaction(request300);
      const result1000 = await service.classifyTransaction(request1000);

      expect(result300).toBe(SettlementMethod.INTERNAL);
      expect(result1000).toBe(SettlementMethod.INTERNAL);
    });

    it('should handle very large amounts', async () => {
      const request = mockExchangeRequest(100000);
      trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(5));

      const result = await service.classifyTransaction(request);

      expect(result).toBe(SettlementMethod.EXTERNAL_MANDATORY);
    });

    it('should handle very small amounts', async () => {
      const request = mockExchangeRequest(1);
      trustLevelService.getTrustLevel.mockResolvedValue(mockTrustLevel(1));

      const result = await service.classifyTransaction(request);

      expect(result).toBe(SettlementMethod.INTERNAL);
    });
  });
});

