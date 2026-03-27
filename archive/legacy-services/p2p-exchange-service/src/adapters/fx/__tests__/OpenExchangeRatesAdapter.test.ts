import axios from 'axios';
import { Decimal } from '@prisma/client/runtime/library';
import { OpenExchangeRatesAdapter } from '../OpenExchangeRatesAdapter';
import { FXProviderConfig } from '../../../types/fx-provider.types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenExchangeRatesAdapter', () => {
  let adapter: OpenExchangeRatesAdapter;
  let mockAxiosInstance: any;

  const mockConfig: FXProviderConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://openexchangerates.org/api',
    cacheTTL: 60,
    timeout: 5000,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
    };

    // Mock axios.create to return our mock instance
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

    // Create adapter
    adapter = new OpenExchangeRatesAdapter(mockConfig);
  });

  describe('constructor', () => {
    it('should create adapter with provided config', () => {
      expect(adapter).toBeInstanceOf(OpenExchangeRatesAdapter);
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: mockConfig.baseUrl,
        timeout: mockConfig.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use default values for optional config', () => {
      const minimalConfig: FXProviderConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://test.com',
      };

      new OpenExchangeRatesAdapter(minimalConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: minimalConfig.baseUrl,
        timeout: 5000, // default
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('getRate', () => {
    const mockApiResponse = {
      data: {
        disclaimer: 'Usage subject to terms',
        license: 'https://openexchangerates.org/license',
        timestamp: 1640000000,
        base: 'USD',
        rates: {
          SAR: 3.75,
        },
      },
    };

    it('should fetch rate from API successfully', async () => {
      mockAxiosInstance.get.mockResolvedValue(mockApiResponse);

      const result = await adapter.getRate('USD', 'SAR');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/latest.json', {
        params: {
          app_id: 'test-api-key',
          base: 'USD',
          symbols: 'SAR',
        },
      });

      expect(result).toEqual({
        baseCurrency: 'USD',
        quoteCurrency: 'SAR',
        rate: new Decimal(3.75),
        bid: new Decimal(3.75).mul(0.999), // 0.1% below
        ask: new Decimal(3.75).mul(1.001), // 0.1% above
        timestamp: new Date(1640000000 * 1000),
        source: 'OpenExchangeRates',
      });
    });

    it('should return cached rate on second call', async () => {
      mockAxiosInstance.get.mockResolvedValue(mockApiResponse);

      // First call - should hit API
      const result1 = await adapter.getRate('USD', 'SAR');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await adapter.getRate('USD', 'SAR');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1); // Still 1
      expect(result2).toEqual(result1);
    });

    it('should fetch fresh data after cache expires', async () => {
      // Create adapter with 1ms cache TTL
      const shortCacheAdapter = new OpenExchangeRatesAdapter({
        ...mockConfig,
        cacheTTL: 0.001, // 1ms
      });

      mockAxiosInstance.get.mockResolvedValue(mockApiResponse);

      // First call
      await shortCacheAdapter.getRate('USD', 'SAR');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Second call - should hit API again
      await shortCacheAdapter.getRate('USD', 'SAR');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid base currency', async () => {
      await expect(adapter.getRate('US', 'SAR')).rejects.toThrow(
        'Invalid currency code: US'
      );
    });

    it('should throw error for invalid quote currency', async () => {
      await expect(adapter.getRate('USD', 'SA')).rejects.toThrow(
        'Invalid currency code: SA'
      );
    });

    it('should throw error for lowercase currency', async () => {
      await expect(adapter.getRate('usd', 'SAR')).rejects.toThrow(
        'Currency code must be uppercase: usd'
      );
    });

    it('should throw error when rate not found in response', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          ...mockApiResponse.data,
          rates: {}, // Empty rates
        },
      });

      await expect(adapter.getRate('USD', 'SAR')).rejects.toThrow(
        'Rate not found for SAR'
      );
    });

    it('should handle API errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        isAxiosError: true,
        response: {
          data: {
            message: 'Invalid API key',
          },
        },
      });

      // Mock axios.isAxiosError
      (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      await expect(adapter.getRate('USD', 'SAR')).rejects.toThrow(
        'OpenExchangeRates API error: Invalid API key'
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      mockAxiosInstance.get.mockRejectedValue(networkError);

      (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);

      await expect(adapter.getRate('USD', 'SAR')).rejects.toThrow('Network timeout');
    });

    it('should cache different currency pairs separately', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: { ...mockApiResponse.data, rates: { SAR: 3.75 } },
        })
        .mockResolvedValueOnce({
          data: { ...mockApiResponse.data, rates: { AED: 3.67 } },
        });

      await adapter.getRate('USD', 'SAR');
      await adapter.getRate('USD', 'AED');

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);

      // Both should be cached now
      await adapter.getRate('USD', 'SAR');
      await adapter.getRate('USD', 'AED');

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2); // Still 2
    });
  });

  describe('getHistoricalRates', () => {
    const mockHistoricalResponse = {
      data: {
        disclaimer: 'Usage subject to terms',
        license: 'https://openexchangerates.org/license',
        timestamp: 1640000000,
        base: 'USD',
        rates: {
          SAR: 3.75,
        },
      },
    };

    it('should fetch historical rates for date range', async () => {
      mockAxiosInstance.get.mockResolvedValue(mockHistoricalResponse);

      const from = new Date('2024-01-01');
      const to = new Date('2024-01-03');

      const result = await adapter.getHistoricalRates('USD', 'SAR', from, to);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3); // 3 days
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        date: new Date('2024-01-01'),
        rate: new Decimal(3.75),
        baseCurrency: 'USD',
        quoteCurrency: 'SAR',
      });
    });

    it('should throw error if start date is after end date', async () => {
      const from = new Date('2024-01-03');
      const to = new Date('2024-01-01');

      await expect(
        adapter.getHistoricalRates('USD', 'SAR', from, to)
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should validate currency codes', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-02');

      await expect(
        adapter.getHistoricalRates('US', 'SAR', from, to)
      ).rejects.toThrow('Invalid currency code: US');
    });

    it('should handle API errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        isAxiosError: true,
        response: {
          data: {
            message: 'Historical data not available',
          },
        },
      });

      (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      const from = new Date('2024-01-01');
      const to = new Date('2024-01-01');

      await expect(
        adapter.getHistoricalRates('USD', 'SAR', from, to)
      ).rejects.toThrow('OpenExchangeRates API error: Historical data not available');
    });

    it('should skip dates with missing rates', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({
          data: { ...mockHistoricalResponse.data, rates: { SAR: 3.75 } },
        })
        .mockResolvedValueOnce({
          data: { ...mockHistoricalResponse.data, rates: {} }, // Missing rate
        })
        .mockResolvedValueOnce({
          data: { ...mockHistoricalResponse.data, rates: { SAR: 3.76 } },
        });

      const from = new Date('2024-01-01');
      const to = new Date('2024-01-03');

      const result = await adapter.getHistoricalRates('USD', 'SAR', from, to);

      expect(result).toHaveLength(2); // Only 2 rates (middle one skipped)
    });
  });

  describe('convert', () => {
    const mockApiResponse = {
      data: {
        timestamp: 1640000000,
        base: 'USD',
        rates: {
          SAR: 3.75,
        },
      },
    };

    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue(mockApiResponse);
    });

    it('should convert amount with platform markup', async () => {
      const amount = new Decimal(100);
      const result = await adapter.convert('USD', 'SAR', amount);

      // Expected calculation:
      // Rate: 3.75
      // Ask rate: 3.75 * 1.001 = 3.75375
      // Converted: 100 * 3.75375 = 375.375
      // Markup (0.3%): 375.375 * 0.003 = 1.126125
      // Final: 375.375 - 1.126125 = 374.248875

      expect(result.from).toEqual({
        currency: 'USD',
        amount: new Decimal(100),
      });

      expect(result.to.currency).toBe('SAR');
      expect(result.to.amount.toNumber()).toBeCloseTo(374.248875, 6);
      expect(result.to.beforeMarkup.toNumber()).toBeCloseTo(375.375, 6);

      expect(result.markup.currency).toBe('SAR');
      expect(result.markup.amount.toNumber()).toBeCloseTo(1.126125, 6);
      expect(result.markup.percentage).toBe(0.3);
    });

    it('should throw error for zero amount', async () => {
      await expect(adapter.convert('USD', 'SAR', new Decimal(0))).rejects.toThrow(
        'Amount must be greater than zero'
      );
    });

    it('should throw error for negative amount', async () => {
      await expect(adapter.convert('USD', 'SAR', new Decimal(-100))).rejects.toThrow(
        'Amount must be greater than zero'
      );
    });

    it('should use cached rate for conversion', async () => {
      await adapter.convert('USD', 'SAR', new Decimal(100));
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      await adapter.convert('USD', 'SAR', new Decimal(200));
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1); // Still 1 (cached)
    });

    it('should handle small amounts correctly', async () => {
      const result = await adapter.convert('USD', 'SAR', new Decimal(0.01));

      expect(result.from.amount.toNumber()).toBe(0.01);
      expect(result.to.amount.toNumber()).toBeGreaterThan(0);
      expect(result.markup.amount.toNumber()).toBeGreaterThan(0);
    });

    it('should handle large amounts correctly', async () => {
      const result = await adapter.convert('USD', 'SAR', new Decimal(1000000));

      expect(result.from.amount.toNumber()).toBe(1000000);
      expect(result.to.amount.toNumber()).toBeGreaterThan(3700000);
      expect(result.markup.percentage).toBe(0.3);
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          timestamp: 1640000000,
          base: 'USD',
          rates: { SAR: 3.75 },
        },
      });

      // Populate cache
      await adapter.getRate('USD', 'SAR');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Clear cache
      adapter.clearCache();

      // Should fetch again
      await adapter.getRate('USD', 'SAR');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should return cache statistics', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          timestamp: 1640000000,
          base: 'USD',
          rates: { SAR: 3.75, AED: 3.67 },
        },
      });

      // Empty cache
      let stats = adapter.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);

      // Add to cache
      await adapter.getRate('USD', 'SAR');
      await adapter.getRate('USD', 'AED');

      stats = adapter.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('USD:SAR');
      expect(stats.keys).toContain('USD:AED');
    });
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      });

      (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      await expect(adapter.getRate('USD', 'SAR')).rejects.toThrow(
        'OpenExchangeRates API error: timeout of 5000ms exceeded'
      );
    });

    it('should handle rate limit errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 429,
          data: {
            message: 'Rate limit exceeded',
          },
        },
      });

      (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      await expect(adapter.getRate('USD', 'SAR')).rejects.toThrow(
        'OpenExchangeRates API error: Rate limit exceeded'
      );
    });

    it('should handle invalid API key errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            message: 'Invalid API key',
          },
        },
      });

      (mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

      await expect(adapter.getRate('USD', 'SAR')).rejects.toThrow(
        'OpenExchangeRates API error: Invalid API key'
      );
    });
  });

  describe('date formatting', () => {
    it('should format dates correctly for API', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          timestamp: 1640000000,
          base: 'USD',
          rates: { SAR: 3.75 },
        },
      });

      const from = new Date('2024-01-05');
      const to = new Date('2024-01-05');

      await adapter.getHistoricalRates('USD', 'SAR', from, to);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/historical/2024-01-05.json', {
        params: {
          app_id: 'test-api-key',
          base: 'USD',
          symbols: 'SAR',
        },
      });
    });

    it('should handle single-digit months and days', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          timestamp: 1640000000,
          base: 'USD',
          rates: { SAR: 3.75 },
        },
      });

      const from = new Date('2024-03-07');
      const to = new Date('2024-03-07');

      await adapter.getHistoricalRates('USD', 'SAR', from, to);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/historical/2024-03-07.json', {
        params: {
          app_id: 'test-api-key',
          base: 'USD',
          symbols: 'SAR',
        },
      });
    });
  });
});
