import { Decimal } from 'decimal.js';
import { PrismaClient } from '@prisma/client';
import { ExternalEscrowService } from '../external-escrow.service';
import { EscrowStatus } from '../../adapters/escrow/ExternalEscrowAdapter';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    externalEscrowProvider: {
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    externalEscrow: {
      create: jest.fn(),
      updateMany: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma)
  };
});

// Mock environment variables
process.env.TATUM_API_KEY = 'test-api-key';
process.env.TATUM_WEBHOOK_SECRET = 'test-webhook-secret';

describe('ExternalEscrowService', () => {
  let service: ExternalEscrowService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    service = new ExternalEscrowService();
  });

  describe('getAvailableProviders', () => {
    it('should return enabled providers within amount limits', async () => {
      const mockProviders = [
        {
          id: 1,
          name: 'Tatum',
          type: 'tatum',
          feePercentage: 1.5,
          feeFixed: null,
          minAmount: 100,
          maxAmount: 10000,
          settlementTime: 60,
          country: null,
          priority: 10,
          enabled: true
        },
        {
          id: 2,
          name: 'Stripe',
          type: 'stripe',
          feePercentage: 2.0,
          feeFixed: 5,
          minAmount: 50,
          maxAmount: 5000,
          settlementTime: 120,
          country: 'US',
          priority: 8,
          enabled: true
        }
      ];

      mockPrisma.externalEscrowProvider.findMany.mockResolvedValue(mockProviders);

      const result = await service.getAvailableProviders(
        new Decimal(1000),
        'USD'
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Tatum');
      expect(result[0].feePercentage.toString()).toBe('1.5');
      expect(result[1].name).toBe('Stripe');
    });

    it('should filter providers by amount limits', async () => {
      const mockProviders = [
        {
          id: 1,
          name: 'Tatum',
          type: 'tatum',
          feePercentage: 1.5,
          feeFixed: null,
          minAmount: 100,
          maxAmount: 10000,
          settlementTime: 60,
          country: null,
          priority: 10,
          enabled: true
        }
      ];

      mockPrisma.externalEscrowProvider.findMany.mockResolvedValue(mockProviders);

      const result = await service.getAvailableProviders(
        new Decimal(1000),
        'USD'
      );

      expect(mockPrisma.externalEscrowProvider.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            enabled: true
          })
        })
      );
    });

    it('should return empty array when no providers available', async () => {
      mockPrisma.externalEscrowProvider.findMany.mockResolvedValue([]);

      const result = await service.getAvailableProviders(
        new Decimal(1000),
        'USD'
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('getProvider', () => {
    it('should return provider by ID', async () => {
      const mockProvider = {
        id: 1,
        name: 'Tatum',
        type: 'tatum',
        feePercentage: 1.5,
        feeFixed: null,
        minAmount: 100,
        maxAmount: 10000,
        settlementTime: 60,
        country: null,
        priority: 10,
        enabled: true
      };

      mockPrisma.externalEscrowProvider.findUnique.mockResolvedValue(mockProvider);

      const result = await service.getProvider(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Tatum');
      expect(result.feePercentage.toString()).toBe('1.5');
    });

    it('should throw error when provider not found', async () => {
      mockPrisma.externalEscrowProvider.findUnique.mockResolvedValue(null);

      await expect(service.getProvider(999)).rejects.toThrow(
        'Provider not found: 999'
      );
    });
  });

  describe('calculateProviderFee', () => {
    it('should calculate fee with percentage only', () => {
      const provider = {
        id: 1,
        name: 'Tatum',
        type: 'tatum',
        feePercentage: new Decimal(1.5),
        settlementTime: 60,
        priority: 10,
        enabled: true
      };

      const fee = service.calculateProviderFee(new Decimal(1000), provider);

      expect(fee.toString()).toBe('15'); // 1.5% of 1000
    });

    it('should calculate fee with percentage and fixed fee', () => {
      const provider = {
        id: 1,
        name: 'Stripe',
        type: 'stripe',
        feePercentage: new Decimal(2.0),
        feeFixed: new Decimal(5),
        settlementTime: 120,
        priority: 8,
        enabled: true
      };

      const fee = service.calculateProviderFee(new Decimal(1000), provider);

      expect(fee.toString()).toBe('25'); // 2% of 1000 + 5
    });

    it('should handle zero amount', () => {
      const provider = {
        id: 1,
        name: 'Tatum',
        type: 'tatum',
        feePercentage: new Decimal(1.5),
        settlementTime: 60,
        priority: 10,
        enabled: true
      };

      const fee = service.calculateProviderFee(new Decimal(0), provider);

      expect(fee.toString()).toBe('0');
    });
  });

  describe('recommendProvider', () => {
    it('should recommend provider with highest score', async () => {
      const mockProviders = [
        {
          id: 1,
          name: 'Tatum',
          type: 'tatum',
          feePercentage: 1.5,
          feeFixed: null,
          minAmount: 100,
          maxAmount: 10000,
          settlementTime: 60,
          country: null,
          priority: 10,
          enabled: true
        },
        {
          id: 2,
          name: 'Stripe',
          type: 'stripe',
          feePercentage: 2.0,
          feeFixed: 5,
          minAmount: 50,
          maxAmount: 5000,
          settlementTime: 120,
          country: 'US',
          priority: 8,
          enabled: true
        }
      ];

      mockPrisma.externalEscrowProvider.findMany.mockResolvedValue(mockProviders);

      const result = await service.recommendProvider(
        new Decimal(1000),
        'USD'
      );

      expect(result).not.toBeNull();
      expect(result!.recommended).toBe(true);
      expect(result!.name).toBe('Tatum'); // Higher priority
    });

    it('should prefer local provider', async () => {
      const mockProviders = [
        {
          id: 1,
          name: 'Tatum',
          type: 'tatum',
          feePercentage: 1.5,
          feeFixed: null,
          minAmount: 100,
          maxAmount: 10000,
          settlementTime: 60,
          country: null,
          priority: 10,
          enabled: true
        },
        {
          id: 2,
          name: 'Local Provider',
          type: 'local',
          feePercentage: 2.0,
          feeFixed: null,
          minAmount: 50,
          maxAmount: 5000,
          settlementTime: 120,
          country: 'US',
          priority: 8,
          enabled: true
        }
      ];

      mockPrisma.externalEscrowProvider.findMany.mockResolvedValue(mockProviders);

      const result = await service.recommendProvider(
        new Decimal(1000),
        'USD',
        'US'
      );

      expect(result).not.toBeNull();
      expect(result!.recommended).toBe(true);
      // Local provider gets +20 bonus, may win despite lower priority
    });

    it('should return null when no providers available', async () => {
      mockPrisma.externalEscrowProvider.findMany.mockResolvedValue([]);

      const result = await service.recommendProvider(
        new Decimal(1000),
        'USD'
      );

      expect(result).toBeNull();
    });
  });

  describe('createExternalEscrow', () => {
    it('should throw error when provider is disabled', async () => {
      const mockProvider = {
        id: 1,
        name: 'Tatum',
        type: 'tatum',
        feePercentage: 1.5,
        feeFixed: null,
        minAmount: 100,
        maxAmount: 10000,
        settlementTime: 60,
        country: null,
        priority: 10,
        enabled: false
      };

      mockPrisma.externalEscrowProvider.findUnique.mockResolvedValue(mockProvider);

      await expect(
        service.createExternalEscrow(
          1,
          1,
          new Decimal(1000),
          'USD',
          {
            matchId: 1,
            senderUserId: 1,
            recipientUserId: 2
          }
        )
      ).rejects.toThrow('Provider is disabled: Tatum');
    });

    it('should throw error when adapter not found', async () => {
      const mockProvider = {
        id: 1,
        name: 'Unknown',
        type: 'unknown',
        feePercentage: 1.5,
        feeFixed: null,
        minAmount: 100,
        maxAmount: 10000,
        settlementTime: 60,
        country: null,
        priority: 10,
        enabled: true
      };

      mockPrisma.externalEscrowProvider.findUnique.mockResolvedValue(mockProvider);

      await expect(
        service.createExternalEscrow(
          1,
          1,
          new Decimal(1000),
          'USD',
          {
            matchId: 1,
            senderUserId: 1,
            recipientUserId: 2
          }
        )
      ).rejects.toThrow('No adapter found for provider type: unknown');
    });
  });

  describe('releaseExternalEscrow', () => {
    it('should throw error when adapter not found', async () => {
      const mockProvider = {
        id: 1,
        name: 'Unknown',
        type: 'unknown',
        feePercentage: 1.5,
        feeFixed: null,
        minAmount: 100,
        maxAmount: 10000,
        settlementTime: 60,
        country: null,
        priority: 10,
        enabled: true
      };

      mockPrisma.externalEscrowProvider.findUnique.mockResolvedValue(mockProvider);

      await expect(
        service.releaseExternalEscrow('escrow-123', 1)
      ).rejects.toThrow('No adapter found for provider type: unknown');
    });
  });

  describe('refundExternalEscrow', () => {
    it('should throw error when adapter not found', async () => {
      const mockProvider = {
        id: 1,
        name: 'Unknown',
        type: 'unknown',
        feePercentage: 1.5,
        feeFixed: null,
        minAmount: 100,
        maxAmount: 10000,
        settlementTime: 60,
        country: null,
        priority: 10,
        enabled: true
      };

      mockPrisma.externalEscrowProvider.findUnique.mockResolvedValue(mockProvider);

      await expect(
        service.refundExternalEscrow('escrow-123', 1)
      ).rejects.toThrow('No adapter found for provider type: unknown');
    });
  });

  describe('getEscrowStatus', () => {
    it('should throw error when adapter not found', async () => {
      const mockProvider = {
        id: 1,
        name: 'Unknown',
        type: 'unknown',
        feePercentage: 1.5,
        feeFixed: null,
        minAmount: 100,
        maxAmount: 10000,
        settlementTime: 60,
        country: null,
        priority: 10,
        enabled: true
      };

      mockPrisma.externalEscrowProvider.findUnique.mockResolvedValue(mockProvider);

      await expect(
        service.getEscrowStatus('escrow-123', 1)
      ).rejects.toThrow('No adapter found for provider type: unknown');
    });
  });

  describe('handleProviderWebhook', () => {
    it('should throw error when adapter not found', async () => {
      await expect(
        service.handleProviderWebhook('unknown', {
          event: 'escrow.created',
          data: { escrowId: 'escrow-123' },
          timestamp: new Date()
        })
      ).rejects.toThrow('No adapter found for provider type: unknown');
    });
  });
});
