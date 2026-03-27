/**
 * Activity Aggregation Service
 * 
 * Handles parallel fetching of activity data from multiple microservices
 * with fault tolerance, Redis caching, and unified DTO mapping.
 */

import Redis from 'ioredis';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import {
  UnifiedActivityDTO,
  ActivityDomain,
  ActivityQueryParams,
  AggregatedActivityResponse,
  WalletActivityResponseItem,
  TravelerActivityResponseItem,
  MarketplaceActivityResponseItem,
} from '../dto/activity.dto';

interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
  duration: number;
}

interface ServiceHealth {
  domain: ActivityDomain;
  healthy: boolean;
  latency: number;
}

export class ActivityAggregationService {
  private redis: Redis | null = null;
  private readonly CACHE_TTL = 90; // 90 seconds
  private readonly SERVICE_TIMEOUT = 5000; // 5 seconds per service
  private clients: Map<ActivityDomain, AxiosInstance> = new Map();

  constructor() {
    this.initializeRedis();
    this.initializeClients();
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis(config.redisUrl, {
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.warn('[ActivityService] Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });

      this.redis.on('error', (err: Error) => {
        console.warn('[ActivityService] Redis error:', err.message);
      });
    } catch (error) {
      console.warn('[ActivityService] Redis initialization failed, continuing without cache');
      this.redis = null;
    }
  }

  private initializeClients(): void {
    const serviceConfigs: { domain: ActivityDomain; baseURL: string | undefined }[] = [
      { domain: 'wallet', baseURL: config.walletServiceUrl },
      { domain: 'traveler', baseURL: config.travelerServiceUrl },
      { domain: 'marketplace', baseURL: config.marketplaceServiceUrl },
    ];

    for (const { domain, baseURL } of serviceConfigs) {
      if (!baseURL) {
        console.warn(`[ActivityService] ${domain} service URL not configured`);
        continue;
      }

      const client = axios.create({
        baseURL,
        timeout: this.SERVICE_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Request interceptor for logging
      client.interceptors.request.use(
        (reqConfig) => {
          (reqConfig as any).metadata = { startTime: Date.now() };
          return reqConfig;
        },
        (error) => Promise.reject(error)
      );

      // Response interceptor for logging
      client.interceptors.response.use(
        (response) => {
          const duration = Date.now() - ((response.config as any).metadata?.startTime || Date.now());
          console.log(`[ActivityService] ${domain}: ${response.status} in ${duration}ms`);
          return response;
        },
        (error: AxiosError) => {
          const duration = Date.now() - ((error.config as any)?.metadata?.startTime || Date.now());
          console.error(`[ActivityService] ${domain}: FAILED in ${duration}ms - ${error.message}`);
          return Promise.reject(error);
        }
      );

      this.clients.set(domain, client);
    }
  }

  private getCacheKey(userId: string, params: ActivityQueryParams): string {
    const { domain = 'all', limit = 20, cursor, startDate, endDate } = params;
    const keyParts = ['activity', userId, domain, limit.toString()];
    if (cursor) keyParts.push(`c:${cursor}`);
    if (startDate) keyParts.push(`s:${startDate}`);
    if (endDate) keyParts.push(`e:${endDate}`);
    return keyParts.join(':');
  }

  private async getFromCache(key: string): Promise<AggregatedActivityResponse | null> {
    if (!this.redis) return null;

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        const parsed = JSON.parse(cached) as AggregatedActivityResponse;
        console.log(`[ActivityService] Cache hit for key: ${key}`);
        return { ...parsed, meta: { ...parsed.meta, cached: true } };
      }
    } catch (error) {
      console.warn('[ActivityService] Cache read error:', error);
    }
    return null;
  }

  private async setCache(key: string, data: AggregatedActivityResponse): Promise<void> {
    if (!this.redis) return;

    try {
      const dataToCache: AggregatedActivityResponse = {
        ...data,
        meta: { ...data.meta, cached: false, cachedAt: new Date().toISOString() },
      };
      await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(dataToCache));
      console.log(`[ActivityService] Cached response for ${this.CACHE_TTL}s, key: ${key}`);
    } catch (error) {
      console.warn('[ActivityService] Cache write error:', error);
    }
  }

  private async fetchWithTimeout<T>(
    domain: ActivityDomain,
    endpoint: string,
    headers: Record<string, string>
  ): Promise<ServiceResult<T>> {
    const client = this.clients.get(domain);
    if (!client) {
      return {
        data: null,
        error: new Error(`Client for ${domain} not initialized`),
        duration: 0,
      };
    }

    const startTime = Date.now();

    try {
      const response = await client.get<T>(endpoint, { headers });
      const duration = Date.now() - startTime;

      return {
        data: response.data,
        error: null,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return {
            data: null,
            error: new Error(`Timeout: ${domain} service did not respond within ${this.SERVICE_TIMEOUT}ms`),
            duration,
          };
        }
        if (error.response) {
          return {
            data: null,
            error: new Error(`${domain} service returned ${error.response.status}`),
            duration,
          };
        }
      }

      return {
        data: null,
        error: error instanceof Error ? error : new Error(`Unknown error from ${domain}`),
        duration,
      };
    }
  }

  private mapWalletActivity(items: WalletActivityResponseItem[]): UnifiedActivityDTO[] {
    return items.map((item) => ({
      id: item.id,
      domain: 'wallet',
      title: this.formatWalletTitle(item.type),
      description: item.description || `Wallet ${item.type}`,
      date: item.createdAt,
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      metadata: { rawType: item.type, ...item.metadata },
    }));
  }

  private mapTravelerActivity(items: TravelerActivityResponseItem[]): UnifiedActivityDTO[] {
    return items.map((item) => ({
      id: item.id,
      domain: 'traveler',
      title: this.formatTravelerTitle(item.action),
      description: item.details || `Traveler ${item.action}`,
      date: item.createdAt,
      status: item.status,
      metadata: item.metadata,
    }));
  }

  private mapMarketplaceActivity(items: MarketplaceActivityResponseItem[]): UnifiedActivityDTO[] {
    return items.map((item) => ({
      id: item.id,
      domain: 'marketplace',
      title: this.formatMarketplaceTitle(item.event),
      description: item.summary || `Marketplace ${item.event}`,
      date: item.createdAt,
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      metadata: item.metadata,
    }));
  }

  private formatWalletTitle(type: string): string {
    const titles: Record<string, string> = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      transfer: 'Transfer',
      escrow_hold: 'Escrow Hold',
      escrow_release: 'Escrow Release',
      refund: 'Refund',
      fee: 'Fee',
    };
    return titles[type.toLowerCase()] || type;
  }

  private formatTravelerTitle(action: string): string {
    const titles: Record<string, string> = {
      route_created: 'Route Created',
      route_updated: 'Route Updated',
      route_cancelled: 'Route Cancelled',
      offer_accepted: 'Offer Accepted',
      offer_rejected: 'Offer Rejected',
      delivery_completed: 'Delivery Completed',
      review_received: 'Review Received',
    };
    return titles[action.toLowerCase()] || action;
  }

  private formatMarketplaceTitle(event: string): string {
    const titles: Record<string, string> = {
      order_placed: 'Order Placed',
      order_shipped: 'Order Shipped',
      order_delivered: 'Order Delivered',
      order_cancelled: 'Order Cancelled',
      review_submitted: 'Review Submitted',
      product_listed: 'Product Listed',
      product_sold: 'Product Sold',
    };
    return titles[event.toLowerCase()] || event;
  }

  private sortByDateDesc(items: UnifiedActivityDTO[]): UnifiedActivityDTO[] {
    return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private paginate(
    items: UnifiedActivityDTO[],
    limit: number,
    cursor?: string
  ): { data: UnifiedActivityDTO[]; hasMore: boolean; nextCursor?: string } {
    let startIndex = 0;

    if (cursor) {
      try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const cursorData = JSON.parse(decoded);
        startIndex = cursorData.index || 0;
      } catch {
        // Invalid cursor, start from beginning
        startIndex = 0;
      }
    }

    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    const hasMore = endIndex < items.length;

    let nextCursor: string | undefined;
    if (hasMore) {
      const cursorData = { index: endIndex, timestamp: Date.now() };
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }

    return { data: paginatedItems, hasMore, nextCursor };
  }

  async aggregateActivity(
    userId: string,
    params: ActivityQueryParams,
    authHeaders: Record<string, string>
  ): Promise<AggregatedActivityResponse> {
    const { domain = 'all', limit = 20, cursor } = params;
    const cacheKey = this.getCacheKey(userId, params);

    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Determine which services to call
    const domainsToFetch: ActivityDomain[] =
      domain === 'all' ? ['wallet', 'traveler', 'marketplace'] : [domain];

    // Fetch from all services in parallel with timeout protection
    const fetchPromises = domainsToFetch.map(async (d) => {
      const result = await this.fetchWithTimeout<unknown[]>(d, '/activity', authHeaders);
      return { domain: d, ...result };
    });

    const results = await Promise.all(fetchPromises);

    // Process results and handle failures
    let allActivities: UnifiedActivityDTO[] = [];
    const failedDomains: ActivityDomain[] = [];
    const serviceHealth: ServiceHealth[] = [];

    for (const result of results) {
      serviceHealth.push({
        domain: result.domain,
        healthy: result.error === null,
        latency: result.duration,
      });

      if (result.error) {
        console.error(`[ActivityService] Failed to fetch from ${result.domain}:`, result.error.message);
        failedDomains.push(result.domain);
        continue;
      }

      if (result.data && Array.isArray(result.data)) {
        let mapped: UnifiedActivityDTO[] = [];

        switch (result.domain) {
          case 'wallet':
            mapped = this.mapWalletActivity(result.data as WalletActivityResponseItem[]);
            break;
          case 'traveler':
            mapped = this.mapTravelerActivity(result.data as TravelerActivityResponseItem[]);
            break;
          case 'marketplace':
            mapped = this.mapMarketplaceActivity(result.data as MarketplaceActivityResponseItem[]);
            break;
        }

        allActivities = allActivities.concat(mapped);
      }
    }

    // Sort all activities by date descending
    allActivities = this.sortByDateDesc(allActivities);

    // Paginate results
    const { data: paginatedData, hasMore, nextCursor } = this.paginate(allActivities, limit, cursor);

    // Build response
    const response: AggregatedActivityResponse = {
      data: paginatedData,
      meta: {
        total: allActivities.length,
        page: cursor ? parseInt(Buffer.from(cursor, 'base64').toString('utf-8')) || 1 : 1,
        limit,
        hasMore,
        cursor: nextCursor,
        partial: failedDomains.length > 0,
        failedDomains,
        cached: false,
        cachedAt: new Date().toISOString(),
      },
    };

    // Cache the response
    await this.setCache(cacheKey, response);

    // Log aggregation summary
    console.log(
      `[ActivityService] Aggregated ${response.data.length}/${response.meta.total} activities ` +
      `(${failedDomains.length} failed domains: ${failedDomains.join(', ') || 'none'})`
    );

    return response;
  }

  async invalidateCache(userId: string): Promise<void> {
    if (!this.redis) return;

    try {
      const pattern = `activity:${userId}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`[ActivityService] Invalidated ${keys.length} cache keys for user ${userId}`);
      }
    } catch (error) {
      console.warn('[ActivityService] Cache invalidation error:', error);
    }
  }

  getHealth(): { redis: boolean; services: Record<ActivityDomain, boolean> } {
    return {
      redis: this.redis?.status === 'ready' || false,
      services: {
        wallet: this.clients.has('wallet'),
        traveler: this.clients.has('traveler'),
        marketplace: this.clients.has('marketplace'),
      },
    };
  }
}

// Singleton instance
export const activityService = new ActivityAggregationService();
export default activityService;
