/**
 * Decision Service Tests
 * Unit tests for decision API client
 */

import axios from 'axios';
import DecisionService, { decisionService } from '../decisionService';
import { DecisionStatus, DecisionSource, AssetType } from '../../types/decision.types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DecisionService', () => {
  let service: DecisionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DecisionService();
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  describe('getDecision', () => {
    it('should fetch a decision by ID', async () => {
      const mockDecision = {
        id: 'decision-123',
        assetType: AssetType.LISTING,
        assetId: 'listing-456',
        status: DecisionStatus.APPROVED,
        source: DecisionSource.INTERNAL,
        authority: 'MNBARH_INTERNAL',
        decisionRef: null,
        reason: null,
        metadata: {},
        requestedAt: '2026-01-29T10:00:00Z',
        decidedAt: '2026-01-29T10:01:00Z',
        expiresAt: null,
        createdAt: '2026-01-29T10:00:00Z',
        updatedAt: '2026-01-29T10:01:00Z'
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockDecision }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      const result = await service.getDecision('decision-123');

      expect(result).toEqual(mockDecision);
    });

    it('should handle errors when fetching decision', async () => {
      const error = new Error('Network error');
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(error),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      await expect(service.getDecision('decision-123')).rejects.toThrow('Network error');
    });
  });

  describe('getDecisionsByAsset', () => {
    it('should fetch decisions for an asset', async () => {
      const mockDecisions = [
        {
          id: 'decision-1',
          assetType: AssetType.LISTING,
          assetId: 'listing-456',
          status: DecisionStatus.APPROVED,
          source: DecisionSource.INTERNAL,
          authority: 'MNBARH_INTERNAL',
          decisionRef: null,
          reason: null,
          metadata: {},
          requestedAt: '2026-01-29T10:00:00Z',
          decidedAt: '2026-01-29T10:01:00Z',
          expiresAt: null,
          createdAt: '2026-01-29T10:00:00Z',
          updatedAt: '2026-01-29T10:01:00Z'
        }
      ];

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockDecisions }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      const result = await service.getDecisionsByAsset(AssetType.LISTING, 'listing-456');

      expect(result).toEqual(mockDecisions);
    });
  });

  describe('getLatestDecisionForAsset', () => {
    it('should return the most recent decision', async () => {
      const mockDecisions = [
        {
          id: 'decision-1',
          assetType: AssetType.LISTING,
          assetId: 'listing-456',
          status: DecisionStatus.APPROVED,
          source: DecisionSource.INTERNAL,
          authority: 'MNBARH_INTERNAL',
          decisionRef: null,
          reason: null,
          metadata: {},
          requestedAt: '2026-01-29T10:00:00Z',
          decidedAt: '2026-01-29T10:01:00Z',
          expiresAt: null,
          createdAt: '2026-01-29T10:00:00Z',
          updatedAt: '2026-01-29T10:01:00Z'
        },
        {
          id: 'decision-2',
          assetType: AssetType.LISTING,
          assetId: 'listing-456',
          status: DecisionStatus.PENDING,
          source: DecisionSource.EXTERNAL,
          authority: 'CUSTODII',
          decisionRef: 'custodii-789',
          reason: null,
          metadata: {},
          requestedAt: '2026-01-29T11:00:00Z',
          decidedAt: null,
          expiresAt: null,
          createdAt: '2026-01-29T11:00:00Z',
          updatedAt: '2026-01-29T11:00:00Z'
        }
      ];

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockDecisions }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      const result = await service.getLatestDecisionForAsset(AssetType.LISTING, 'listing-456');

      expect(result?.id).toBe('decision-2');
      expect(result?.status).toBe(DecisionStatus.PENDING);
    });

    it('should return null if no decisions exist', async () => {
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: [] }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      const result = await service.getLatestDecisionForAsset(AssetType.LISTING, 'listing-456');

      expect(result).toBeNull();
    });
  });

  describe('isDecisionApproved', () => {
    it('should return true if decision is approved', async () => {
      const mockDecision = {
        id: 'decision-123',
        assetType: AssetType.LISTING,
        assetId: 'listing-456',
        status: DecisionStatus.APPROVED,
        source: DecisionSource.INTERNAL,
        authority: 'MNBARH_INTERNAL',
        decisionRef: null,
        reason: null,
        metadata: {},
        requestedAt: '2026-01-29T10:00:00Z',
        decidedAt: '2026-01-29T10:01:00Z',
        expiresAt: null,
        createdAt: '2026-01-29T10:00:00Z',
        updatedAt: '2026-01-29T10:01:00Z'
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: [mockDecision] }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      const result = await service.isDecisionApproved(AssetType.LISTING, 'listing-456');

      expect(result).toBe(true);
    });

    it('should return false if decision is not approved', async () => {
      const mockDecision = {
        id: 'decision-123',
        assetType: AssetType.LISTING,
        assetId: 'listing-456',
        status: DecisionStatus.PENDING,
        source: DecisionSource.EXTERNAL,
        authority: 'CUSTODII',
        decisionRef: 'custodii-789',
        reason: null,
        metadata: {},
        requestedAt: '2026-01-29T10:00:00Z',
        decidedAt: null,
        expiresAt: null,
        createdAt: '2026-01-29T10:00:00Z',
        updatedAt: '2026-01-29T10:00:00Z'
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: [mockDecision] }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      const result = await service.isDecisionApproved(AssetType.LISTING, 'listing-456');

      expect(result).toBe(false);
    });

    it('should return false if no decision exists', async () => {
      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: [] }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      const result = await service.isDecisionApproved(AssetType.LISTING, 'listing-456');

      expect(result).toBe(false);
    });
  });

  describe('listDecisions', () => {
    it('should list decisions with filters', async () => {
      const mockResponse = {
        data: [],
        total: 0,
        limit: 10,
        offset: 0
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponse }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      const result = await service.listDecisions({
        status: DecisionStatus.APPROVED,
        limit: 10,
        offset: 0
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAuditLog', () => {
    it('should fetch audit log for a decision', async () => {
      const mockResponse = {
        data: [
          {
            id: 'audit-1',
            decisionId: 'decision-123',
            eventType: 'DECISION_REQUESTED',
            actor: 'MNBARH_INTERNAL',
            oldStatus: null,
            newStatus: 'PENDING',
            reason: null,
            metadata: {},
            createdAt: '2026-01-29T10:00:00Z'
          }
        ],
        total: 1,
        limit: 10,
        offset: 0
      };

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({ data: mockResponse }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      } as any);

      service = new DecisionService();
      const result = await service.getAuditLog('decision-123');

      expect(result).toEqual(mockResponse);
    });
  });
});
