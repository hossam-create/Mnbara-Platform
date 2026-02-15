import { PrismaClient } from '@prisma/client';
import { CacheService } from './CacheService';
import winston from 'winston';

export class ComplianceService {
  constructor(
    private prisma: PrismaClient,
    private cache: CacheService,
    private eventBus: any, // EventBus type
    private logger: winston.Logger
  ) {}

  async validateProductRoute(productId: string, routeId: number): Promise<ComplianceResult> {
    this.logger.info(`Validating product ${productId} against route ${routeId}`);

    // Get product country data
    const productCountry = await this.prisma.productCountry.findUnique({
      where: { productId },
      include: {
        originCountryRel: true,
        purchaseCountryRel: true,
        deliveryCountryRel: true
      }
    });

    if (!productCountry) {
      return {
        status: 'error',
        message: 'Product country data not found',
        valid: false
      };
    }

    // Get traveler route
    const travelerRoute = await this.prisma.travelerRoute.findUnique({
      where: { id: routeId },
      include: {
        fromCountryRel: true,
        toCountryRel: true
      }
    });

    if (!travelerRoute) {
      return {
        status: 'error',
        message: 'Traveler route not found',
        valid: false
      };
    }

    // Step 1: Route validation
    if (travelerRoute.fromCountry !== productCountry.purchaseCountry ||
        travelerRoute.toCountry !== productCountry.deliveryCountry) {
      return {
        status: 'invalid_route',
        message: 'Route does not match product countries',
        valid: false,
        details: {
          product: {
            purchaseCountry: productCountry.purchaseCountry,
            deliveryCountry: productCountry.deliveryCountry
          },
          route: {
            fromCountry: travelerRoute.fromCountry,
            toCountry: travelerRoute.toCountry
          }
        }
      };
    }

    // Step 2: Get country rules for destination country
    const countryRules = await this.prisma.countryRule.findMany({
      where: {
        country: productCountry.deliveryCountry,
        effectiveDate: {
          lte: new Date()
        },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
      }
    });

    // Step 3: Apply compliance rules
    const complianceResult = await this.applyComplianceRules(productCountry, travelerRoute, countryRules);

    // Step 4: Log compliance check
    await this.logComplianceCheck(productId, routeId, complianceResult);

    // Step 5: Emit compliance event
    await this.eventBus.publish('compliance.checked', {
      productId,
      routeId,
      travelerId: travelerRoute.travelerId,
      status: complianceResult.status,
      riskScore: complianceResult.riskScore,
      estimatedDuty: complianceResult.estimatedDuty,
      estimatedTax: complianceResult.estimatedTax
    });

    return complianceResult;
  }

  private async applyComplianceRules(
    productCountry: any,
    travelerRoute: any,
    countryRules: any[]
  ): Promise<ComplianceResult> {
    let totalRiskScore = 0;
    let isRestricted = false;
    let restrictions: string[] = [];
    let requiredDocuments: string[] = [];
    let estimatedDuty = 0;
    let estimatedTax = 0;

    // Apply general country rules
    for (const rule of countryRules) {
      if (rule.isRestricted) {
        isRestricted = true;
        restrictions.push(rule.restrictions || `Restricted in ${rule.country}`);
        totalRiskScore += 50;
      }

      if (rule.requiresPermit && rule.permitTypes) {
        requiredDocuments.push(...rule.permitTypes);
        totalRiskScore += 15;
      }

      // Calculate estimated costs
      estimatedDuty += rule.dutyRate * 100; // Assuming $100 product value
      estimatedTax += rule.taxRate * 100;
    }

    // Apply origin country risk
    const originCountryRisk = await this.getCountryRiskScore(productCountry.originCountry);
    totalRiskScore += originCountryRisk;

    // Apply route risk assessment
    const routeRisk = await this.assessRouteRisk(travelerRoute);
    totalRiskScore += routeRisk;

    // Determine final status
    let status: ComplianceStatus;
    if (isRestricted) {
      status = 'restricted';
    } else if (totalRiskScore > 70) {
      status = 'high_risk';
    } else if (totalRiskScore > 40) {
      status = 'medium_risk';
    } else {
      status = 'compliant';
    }

    return {
      status,
      valid: status === 'compliant',
      message: this.getComplianceMessage(status),
      riskScore: Math.min(totalRiskScore, 100),
      restrictions,
      requiredDocuments,
      estimatedDuty,
      estimatedTax,
      details: {
        originCountry: productCountry.originCountry,
        purchaseCountry: productCountry.purchaseCountry,
        deliveryCountry: productCountry.deliveryCountry,
        routeFrom: travelerRoute.fromCountry,
        routeTo: travelerRoute.toCountry
      }
    };
  }

  private async getCountryRiskScore(isoCode: string): Promise<number> {
    const country = await this.prisma.country.findUnique({
      where: { isoCode }
    });

    if (!country) {
      return 25; // Unknown country = medium risk
    }

    const riskMap = {
      'low': 5,
      'medium': 15,
      'high': 35,
      'critical': 60
    };

    return riskMap[country.riskLevel as keyof typeof riskMap] || 15;
  }

  private async assessRouteRisk(travelerRoute: any): Promise<number> {
    let riskScore = 0;

    // Check for high-risk country pairs
    const highRiskPairs = [
      { from: 'US', to: 'IR' }, // US to Iran
      { from: 'IR', to: 'US' }, // Iran to US
      { from: 'RU', to: 'UA' }, // Russia to Ukraine
      { from: 'UA', to: 'RU' }, // Ukraine to Russia
    ];

    const isHighRiskPair = highRiskPairs.some(pair => 
      pair.from === travelerRoute.fromCountry && pair.to === travelerRoute.toCountry
    );

    if (isHighRiskPair) {
      riskScore += 40;
    }

    // Check traveler's risk tolerance
    const toleranceMap = {
      'low': 0,
      'medium': 10,
      'high': 25
    };

    riskScore += toleranceMap[travelerRoute.riskTolerance as keyof typeof toleranceMap] || 10;

    return riskScore;
  }

  private async logComplianceCheck(
    productId: string, 
    routeId: number, 
    result: ComplianceResult
  ): Promise<void> {
    await this.prisma.complianceLog.create({
      data: {
        productId,
        routeId,
        travelerId: 'system', // Will be updated with actual traveler ID
        buyerId: 'system', // Will be updated with actual buyer ID
        status: result.status,
        riskScore: result.riskScore || 0,
        restrictions: result.restrictions || [],
        requiredDocuments: result.requiredDocuments || [],
        estimatedDuty: result.estimatedDuty || 0,
        estimatedTax: result.estimatedTax || 0,
        complianceNotes: result.message
      }
    });
  }

  private getComplianceMessage(status: ComplianceStatus): string {
    const messages = {
      'compliant': 'Product complies with all country regulations',
      'medium_risk': 'Product has medium compliance risk - additional verification recommended',
      'high_risk': 'Product has high compliance risk - careful review required',
      'restricted': 'Product is restricted in destination country',
      'invalid_route': 'Route does not match product country requirements',
      'error': 'Compliance check failed due to system error'
    };

    return messages[status];
  }

  async getComplianceHistory(filters: {
    productId?: string;
    routeId?: number;
    status?: ComplianceStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ComplianceHistory> {
    const where: any = {};

    if (filters.productId) where.productId = filters.productId;
    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.complianceLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          route: {
            include: {
              fromCountryRel: true,
              toCountryRel: true
            }
          }
        }
      }),
      this.prisma.complianceLog.count({ where })
    ]);

    return {
      logs,
      total,
      page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
      limit: filters.limit || 50
    };
  }

  async getComplianceAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    country?: string;
  }): Promise<ComplianceAnalytics> {
    const where: any = {};
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [statusStats, riskStats, countryStats] = await Promise.all([
      this.prisma.complianceLog.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _avg: { riskScore: true }
      }),
      
      this.prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN risk_score <= 20 THEN 'low'
            WHEN risk_score <= 50 THEN 'medium'
            WHEN risk_score <= 70 THEN 'high'
            ELSE 'critical'
          END as risk_category,
          COUNT(*) as count,
          AVG(risk_score) as avg_score
        FROM compliance_logs
        WHERE ${where.createdAt ? `created_at >= ${filters.startDate} AND created_at <= ${filters.endDate}` : '1=1'}
        GROUP BY risk_category
        ORDER BY avg_score
      `,
      
      this.prisma.$queryRaw`
        SELECT 
          c.iso_code,
          c.name,
          COUNT(cl.id) as total_checks,
          COUNT(CASE WHEN cl.status = 'compliant' THEN 1 END) as compliant_count,
          AVG(cl.risk_score) as avg_risk_score
        FROM compliance_logs cl
        JOIN traveler_routes tr ON cl.route_id = tr.id
        JOIN countries c ON tr.to_country = c.iso_code
        WHERE ${where.createdAt ? `cl.created_at >= ${filters.startDate} AND cl.created_at <= ${filters.endDate}` : '1=1'}
        GROUP BY c.iso_code, c.name
        ORDER BY total_checks DESC
        LIMIT 10
      `
    ]);

    return {
      statusBreakdown: statusStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        avgRiskScore: stat._avg.riskScore || 0
      })),
      riskDistribution: riskStats,
      topCountries: countryStats,
      totalChecks: statusStats.reduce((sum, stat) => sum + stat._count.id, 0),
      avgRiskScore: statusStats.reduce((sum, stat) => sum + (stat._avg.riskScore || 0), 0) / statusStats.length
    };
  }
}

// Types
interface ComplianceResult {
  status: ComplianceStatus;
  valid: boolean;
  message: string;
  riskScore?: number;
  restrictions?: string[];
  requiredDocuments?: string[];
  estimatedDuty?: number;
  estimatedTax?: number;
  details?: any;
}

interface ComplianceHistory {
  logs: any[];
  total: number;
  page: number;
  limit: number;
}

interface ComplianceAnalytics {
  statusBreakdown: Array<{
    status: string;
    count: number;
    avgRiskScore: number;
  }>;
  riskDistribution: any[];
  topCountries: any[];
  totalChecks: number;
  avgRiskScore: number;
}

type ComplianceStatus = 'compliant' | 'medium_risk' | 'high_risk' | 'restricted' | 'invalid_route' | 'error';