// TS CLEANUP: fixed axios.isAxiosError typing with type assertion, no logic changes
import axios, { AxiosInstance } from 'axios';
import { CustodiiDecisionSource } from '../CustodiiDecisionSource';
import { AssetType } from '../../interfaces/IDecisionSource';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CustodiiDecisionSource', () => {
  let source: CustodiiDecisionSource;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn()
    } as any;

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    source = new CustodiiDecisionSource();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestDecision', () => {
    it('should request decision from Custodii', async () => {
      // Arrange
      const request = {
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        metadata: { seller: 'user-1' }
      };

      const custodiiResponse = {
        decision_id: 'custodii-decision-1',
        status: 'APPROVE',
        reference: 'ref-123',
        reason: 'Approved',
        decided_at: '2026-01-21T00:00:00Z',
        expires_at: '2026-01-22T00:00:00Z'
      };

      mockAxiosInstance.post.mockResolvedValue({ data: custodiiResponse });

      // Act
      const result = await source.requestDecision(request);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/decisions',
        {
          asset_type: 'listing',
          asset_id: 'listing-123',
          metadata: { seller: 'user-1' }
        }
      );

      expect(result).toEqual({
        decisionId: 'custodii-decision-1',
        status: 'APPROVED',
        decisionRef: 'ref-123',
        reason: 'Approved',
        decidedAt: new Date('2026-01-21T00:00:00Z'),
        expiresAt: new Date('2026-01-22T00:00:00Z')
      });
    });

    it('should map DENY to REJECTED', async () => {
      // Arrange
      const request = {
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        metadata: {}
      };

      const custodiiResponse = {
        decision_id: 'custodii-decision-2',
        status: 'DENY',
        reason: 'Rejected'
      };

      mockAxiosInstance.post.mockResolvedValue({ data: custodiiResponse });

      // Act
      const result = await source.requestDecision(request);

      // Assert
      expect(result.status).toBe('REJECTED');
    });

    it('should map PENDING to PENDING', async () => {
      // Arrange
      const request = {
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        metadata: {}
      };

      const custodiiResponse = {
        decision_id: 'custodii-decision-3',
        status: 'PENDING'
      };

      mockAxiosInstance.post.mockResolvedValue({ data: custodiiResponse });

      // Act
      const result = await source.requestDecision(request);

      // Assert
      expect(result.status).toBe('PENDING');
    });

    it('should map UNKNOWN to PENDING', async () => {
      // Arrange
      const request = {
        assetType: AssetType.LISTING,
        assetId: 'listing-123',
        metadata: {}
      };

      const custodiiResponse = {
        decision_id: 'custodii-decision-4',
        status: 'UNKNOWN'
      };

      mockAxiosInstance.post.mockResolvedValue({ data: custodiiResponse });

      // Act
      const result = await source.requestDecision(request);

      // Assert
      expect(result.status).toBe('PENDING');
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const request = {
        assetType: AssetType.LISTING,
        assetId: 'listing-timeout',
        metadata: {}
      };

      const timeoutError = {
        isAxiosError: true,
        code: 'ETIMEDOUT',
        message: 'Timeout'
      };

      mockAxiosInstance.post.mockRejectedValue(timeoutError);
      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

      // Act & Assert
      await expect(source.requestDecision(request)).rejects.toThrow(
        'Custodii timeout: requestDecision'
      );
    });

    it('should handle 404 errors', async () => {
      // Arrange
      const request = {
        assetType: AssetType.LISTING,
        assetId: 'listing-404',
        metadata: {}
      };

      const notFoundError = {
        isAxiosError: true,
        response: { status: 404, statusText: 'Not Found' },
        message: 'Not found'
      };

      mockAxiosInstance.post.mockRejectedValue(notFoundError);
      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

      // Act & Assert
      await expect(source.requestDecision(request)).rejects.toThrow(
        'Decision not found in Custodii: requestDecision'
      );
    });

    it('should handle 500 errors', async () => {
      // Arrange
      const request = {
        assetType: AssetType.LISTING,
        assetId: 'listing-500',
        metadata: {}
      };

      const serverError = {
        isAxiosError: true,
        response: { status: 500, statusText: 'Internal Server Error' },
        message: 'Server error'
      };

      mockAxiosInstance.post.mockRejectedValue(serverError);
      (mockedAxios.isAxiosError as any) = jest.fn().mockReturnValue(true);

      // Act & Assert
      await expect(source.requestDecision(request)).rejects.toThrow(
        'Custodii server error: requestDecision'
      );
    });
  });

  describe('getDecision', () => {
    it('should get decision from Custodii', async () => {
      // Arrange
      const custodiiResponse = {
        decision_id: 'custodii-decision-1',
        status: 'APPROVE',
        reference: 'ref-123'
      };

      mockAxiosInstance.get.mockResolvedValue({ data: custodiiResponse });

      // Act
      const result = await source.getDecision('custodii-decision-1');

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/v1/decisions/custodii-decision-1'
      );

      expect(result).toEqual({
        decisionId: 'custodii-decision-1',
        status: 'APPROVED',
        decisionRef: 'ref-123',
        reason: undefined,
        decidedAt: undefined,
        expiresAt: undefined
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      // Arrange
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'ok' } });

      // Act
      const result = await source.healthCheck();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.latency_ms).toBeDefined();
    });

    it('should return down status on error', async () => {
      // Arrange
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      // Act
      const result = await source.healthCheck();

      // Assert
      expect(result.status).toBe('down');
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('getSourceName', () => {
    it('should return CUSTODII', () => {
      expect(source.getSourceName()).toBe('CUSTODII');
    });
  });
});
