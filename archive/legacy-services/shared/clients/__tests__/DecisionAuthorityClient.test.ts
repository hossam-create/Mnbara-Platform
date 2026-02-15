/**
 * DecisionAuthorityClient Tests
 */

import axios from 'axios';
import { DecisionAuthorityClient, AssetType, DecisionStatus } from '../DecisionAuthorityClient';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DecisionAuthorityClient', () => {
  let client: DecisionAuthorityClient;
  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  describe('when integration is ENABLED', () => {
    beforeEach(() => {
      client = new DecisionAuthorityClient({
        baseUrl: 'http://localhost:3010',
        timeout: 30000,
        enabled: true
      });
    });

    it('should be enabled', () => {
      expect(client.isEnabled()).toBe(true);
    });

    it('should request decision successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          decisionId: 'dec_123',
          assetType: AssetType.LISTING,
          assetId: 'listing_456',
          status: DecisionStatus.APPROVED,
          decisionSource: 'INTERNAL',
          authority: 'MNBARH_INTERNAL',
          metadata: {},
          requestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'listing_456',
        metadata: { test: 'data' }
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/decisions', {
        assetType: AssetType.LISTING,
        assetId: 'listing_456',
        metadata: { test: 'data' }
      });
    });

    it('should get decision by ID successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          decisionId: 'dec_123',
          assetType: AssetType.LISTING,
          assetId: 'listing_456',
          status: DecisionStatus.APPROVED,
          decisionSource: 'INTERNAL',
          authority: 'MNBARH_INTERNAL',
          metadata: {},
          requestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getDecision(1);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/decisions/1');
    });

    it('should get decision by decisionId successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          decisionId: 'dec_123',
          assetType: AssetType.LISTING,
          assetId: 'listing_456',
          status: DecisionStatus.APPROVED,
          decisionSource: 'INTERNAL',
          authority: 'MNBARH_INTERNAL',
          metadata: {},
          requestedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getDecisionByDecisionId('dec_123');

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/decisions/by-decision-id/dec_123');
    });

    it('should get decisions by asset successfully', async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            decisionId: 'dec_123',
            assetType: AssetType.LISTING,
            assetId: 'listing_456',
            status: DecisionStatus.APPROVED,
            decisionSource: 'INTERNAL',
            authority: 'MNBARH_INTERNAL',
            metadata: {},
            requestedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getDecisionsByAsset(AssetType.LISTING, 'listing_456');

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/decisions/asset/LISTING/listing_456');
    });

    it('should throw error on request failure', async () => {
      const mockError = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(client.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'listing_456'
      })).rejects.toThrow('Network error');
    });
  });

  describe('when integration is DISABLED', () => {
    beforeEach(() => {
      client = new DecisionAuthorityClient({
        baseUrl: 'http://localhost:3010',
        timeout: 30000,
        enabled: false
      });
    });

    it('should be disabled', () => {
      expect(client.isEnabled()).toBe(false);
    });

    it('should return null when requesting decision', async () => {
      const result = await client.requestDecision({
        assetType: AssetType.LISTING,
        assetId: 'listing_456'
      });

      expect(result).toBeNull();
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should return null when getting decision', async () => {
      const result = await client.getDecision(1);

      expect(result).toBeNull();
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('should return null when getting decision by decisionId', async () => {
      const result = await client.getDecisionByDecisionId('dec_123');

      expect(result).toBeNull();
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('should return empty array when getting decisions by asset', async () => {
      const result = await client.getDecisionsByAsset(AssetType.LISTING, 'listing_456');

      expect(result).toEqual([]);
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });
  });
});
