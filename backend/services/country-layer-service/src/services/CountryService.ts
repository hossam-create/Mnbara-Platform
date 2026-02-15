import { PrismaClient } from '@prisma/client';
import { CacheService } from './CacheService';
import winston from 'winston';

export class CountryService {
  constructor(
    private prisma: PrismaClient,
    private cache: CacheService,
    private logger: winston.Logger
  ) {}

  async getAllCountries() {
    const cacheKey = 'countries:all';
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      this.logger.debug('Countries retrieved from cache');
      return cached;
    }

    const countries = await this.prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    await this.cache.set(cacheKey, countries, 3600); // 1 hour cache
    return countries;
  }

  async getCountryByIsoCode(isoCode: string) {
    const cacheKey = `country:${isoCode}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const country = await this.prisma.country.findUnique({
      where: { isoCode: isoCode.toUpperCase() }
    });

    if (country) {
      await this.cache.set(cacheKey, country, 3600);
    }

    return country;
  }

  async createCountry(data: {
    isoCode: string;
    name: string;
    nameAr?: string;
    region?: string;
    subregion?: string;
    riskLevel?: string;
    customsComplexity?: number;
  }) {
    const country = await this.prisma.country.create({
      data: {
        isoCode: data.isoCode.toUpperCase(),
        name: data.name,
        nameAr: data.nameAr,
        region: data.region,
        subregion: data.subregion,
        riskLevel: data.riskLevel || 'medium',
        customsComplexity: data.customsComplexity || 3
      }
    });

    // Clear cache
    await this.cache.del('countries:all');
    
    this.logger.info(`Country created: ${country.isoCode} - ${country.name}`);
    return country;
  }

  async updateCountry(isoCode: string, data: Partial<{
    name: string;
    nameAr: string;
    region: string;
    subregion: string;
    riskLevel: string;
    customsComplexity: number;
    isActive: boolean;
  }>) {
    const country = await this.prisma.country.update({
      where: { isoCode: isoCode.toUpperCase() },
      data
    });

    // Clear cache
    await this.cache.del(`country:${isoCode}`);
    await this.cache.del('countries:all');
    
    this.logger.info(`Country updated: ${country.isoCode} - ${country.name}`);
    return country;
  }

  async getCountriesByRegion(region: string) {
    const cacheKey = `countries:region:${region}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const countries = await this.prisma.country.findMany({
      where: { 
        region: region,
        isActive: true 
      },
      orderBy: { name: 'asc' }
    });

    await this.cache.set(cacheKey, countries, 3600);
    return countries;
  }

  async getCountriesByRiskLevel(riskLevel: 'low' | 'medium' | 'high' | 'critical') {
    const cacheKey = `countries:risk:${riskLevel}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const countries = await this.prisma.country.findMany({
      where: { 
        riskLevel,
        isActive: true 
      },
      orderBy: { name: 'asc' }
    });

    await this.cache.set(cacheKey, countries, 3600);
    return countries;
  }

  async getCountryAnalytics() {
    const cacheKey = 'countries:analytics';
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const analytics = await this.prisma.$queryRaw`
      SELECT 
        c.risk_level,
        COUNT(*) as country_count,
        AVG(c.customs_complexity) as avg_complexity
      FROM countries c
      WHERE c.is_active = true
      GROUP BY c.risk_level
      ORDER BY country_count DESC
    `;

    await this.cache.set(cacheKey, analytics, 900); // 15 minutes cache
    return analytics;
  }
}