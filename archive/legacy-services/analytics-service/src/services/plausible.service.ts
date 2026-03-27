import axios from 'axios';
import { logger } from '../utils/logger';

export interface PlausibleEventInput {
  domain: string;
  name: string;
  url: string;
  referrer?: string;
  props?: Record<string, string | number>;
}

export interface PlausibleStatsQuery {
  siteId: string;
  period?: '12mo' | '6mo' | '30d' | '7d' | 'day';
  metrics?: string[];
  filters?: string;
}

export class PlausibleService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.PLAUSIBLE_API_URL || 'https://plausible.io/api';
    this.apiKey = process.env.PLAUSIBLE_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('PLAUSIBLE_API_KEY not set - stats API will not work');
    }
  }

  // Send event
  async sendEvent(input: PlausibleEventInput) {
    try {
      await axios.post(`${this.apiUrl}/event`, {
        domain: input.domain,
        name: input.name,
        url: input.url,
        referrer: input.referrer,
        props: input.props
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mnbara Analytics Service'
        }
      });

      logger.info(`Plausible event sent: ${input.name} for ${input.domain}`);
    } catch (error) {
      logger.error('Plausible send event error:', error);
      throw error;
    }
  }

  // Get aggregate stats
  async getAggregateStats(query: PlausibleStatsQuery) {
    if (!this.apiKey) {
      throw new Error('PLAUSIBLE_API_KEY is required for stats API');
    }

    try {
      const params: any = {
        site_id: query.siteId,
        period: query.period || '30d'
      };

      if (query.metrics) {
        params.metrics = query.metrics.join(',');
      }

      if (query.filters) {
        params.filters = query.filters;
      }

      const response = await axios.get(`${this.apiUrl}/v1/stats/aggregate`, {
        params,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Plausible get stats error:', error);
      throw error;
    }
  }

  // Get timeseries data
  async getTimeseries(query: PlausibleStatsQuery) {
    if (!this.apiKey) {
      throw new Error('PLAUSIBLE_API_KEY is required for stats API');
    }

    try {
      const params: any = {
        site_id: query.siteId,
        period: query.period || '30d'
      };

      if (query.metrics) {
        params.metrics = query.metrics.join(',');
      }

      const response = await axios.get(`${this.apiUrl}/v1/stats/timeseries`, {
        params,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Plausible get timeseries error:', error);
      throw error;
    }
  }

  // Get breakdown
  async getBreakdown(siteId: string, property: string, period: string = '30d') {
    if (!this.apiKey) {
      throw new Error('PLAUSIBLE_API_KEY is required for stats API');
    }

    try {
      const response = await axios.get(`${this.apiUrl}/v1/stats/breakdown`, {
        params: {
          site_id: siteId,
          period,
          property
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Plausible get breakdown error:', error);
      throw error;
    }
  }
}
