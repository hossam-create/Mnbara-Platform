import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const CrossBorderPaymentSchema = z.object({
  businessAccountId: z.string().uuid(),
  paymentReference: z.string().min(1).max(100),
  paymentDirection: z.enum(['inbound', 'outbound']),
  sourceEntityId: z.string().uuid().optional(),
  destinationEntityId: z.string().uuid().optional(),
  sourceCountryCode: z.string().length(2),
  destinationCountryCode: z.string().length(2),
  sourceCurrency: z.string().length(3),
  destinationCurrency: z.string().length(3),
  originalAmount: z.number(),
  convertedAmount: z.number(),
  fxRateApplied: z.number(),
  fxRateAtTime: z.number().optional(),
  fxSpread: z.number().default(0),
  totalFees: z.number().default(0),
  feeBreakdown: z.record(z.any()).default({}),
  paymentMethod: z.enum(['swift', 'sepa', 'ach', 'wire', 'crypto', 'digital_wallet', 'card', 'other']),
  paymentRail: z.string().optional(),
  correspondentBank: z.string().optional(),
  intermediaryBanks: z.array(z.any()).default([]),
  initiatedDate: z.string().datetime(),
  processedDate: z.string().datetime().optional(),
  settledDate: z.string().datetime().optional(),
  expectedSettlementDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed', 'under_review']).default('pending'),
  failureReason: z.string().optional(),
  paymentPurpose: z.string().optional(),
  complianceScreeningResult: z.record(z.any()).default({}),
  riskScore: z.number().int().min(0).max(100).default(0),
  createdBy: z.string().uuid()
});

const FXRateIntelligenceSchema = z.object({
  businessAccountId: z.string().uuid(),
  currencyPair: z.string().length(6),
  baseCurrency: z.string().length(3),
  quoteCurrency: z.string().length(3),
  marketRate: z.number(),
  bankRate: z.number(),
  rateSource: z.string().optional(),
  rateTimestamp: z.string().datetime(),
  isWeekend: z.boolean().default(false),
  isHoliday: z.boolean().default(false),
  marketVolatility: z.number().default(0),
  confidenceLevel: z.number().int().min(1).max(5).default(3)
});

const PaymentRouteSchema = z.object({
  businessAccountId: z.string().uuid(),
  routeName: z.string().min(1).max(200),
  sourceCountry: z.string().length(2),
  destinationCountry: z.string().length(2),
  currencyPair: z.string().length(6),
  paymentMethod: z.string(),
  typicalCorrespondentBanks: z.array(z.any()).default([]),
  averageProcessingHours: z.number().optional(),
  successRate: z.number().default(100),
  averageTotalCost: z.number().optional(),
  costPercentage: z.number().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  complianceFlags: z.array(z.any()).default([]),
  createdBy: z.string().uuid()
});

export interface CrossBorderPayment {
  id: string;
  businessAccountId: string;
  paymentReference: string;
  paymentDirection: string;
  sourceEntityId?: string;
  destinationEntityId?: string;
  sourceCountryCode: string;
  destinationCountryCode: string;
  sourceCurrency: string;
  destinationCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  fxRateApplied: number;
  fxRateAtTime?: number;
  fxSpread: number;
  totalFees: number;
  feeBreakdown: any;
  paymentMethod: string;
  paymentRail?: string;
  correspondentBank?: string;
  intermediaryBanks: any[];
  initiatedDate: Date;
  processedDate?: Date;
  settledDate?: Date;
  expectedSettlementDate?: Date;
  status: string;
  failureReason?: string;
  paymentPurpose?: string;
  complianceScreeningResult: any;
  riskScore: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FXRateIntelligence {
  id: string;
  businessAccountId: string;
  currencyPair: string;
  baseCurrency: string;
  quoteCurrency: string;
  marketRate: number;
  bankRate: number;
  spread: number;
  spreadPercentage: number;
  rateSource?: string;
  rateTimestamp: Date;
  isWeekend: boolean;
  isHoliday: boolean;
  marketVolatility: number;
  confidenceLevel: number;
  createdAt: Date;
}

export interface PaymentRoute {
  id: string;
  businessAccountId: string;
  routeName: string;
  sourceCountry: string;
  destinationCountry: string;
  currencyPair: string;
  paymentMethod: string;
  typicalCorrespondentBanks: any[];
  averageProcessingHours?: number;
  successRate: number;
  averageTotalCost?: number;
  costPercentage?: number;
  riskLevel: string;
  complianceFlags: any[];
  lastAnalyzed: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentEfficiencyMetrics {
  id: string;
  businessAccountId: string;
  metricPeriodStart: Date;
  metricPeriodEnd: Date;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  averageProcessingTimeHours: number;
  averageSettlementTimeHours: number;
  totalVolume: number;
  totalFees: number;
  averageFeePercentage: number;
  fxSavingsOpportunities: number;
  complianceFlagsCount: number;
  riskScoreAverage: number;
  currency?: string;
  paymentMethod?: string;
  createdAt: Date;
}

export interface ComplianceScreeningResult {
  id: string;
  paymentId: string;
  screeningType: string;
  screeningResult: string;
  confidenceScore: number;
  riskFactors: any[];
  matchedEntities: any[];
  screeningRulesApplied: any[];
  reviewerId?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface FXExposureAnalysis {
  id: string;
  businessAccountId: string;
  currency: string;
  exposureType: string;
  exposureAmount: number;
  baseCurrency: string;
  currentRate: number;
  averageRate?: number;
  unrealizedGainLoss: number;
  hedgePercentage: number;
  hedgeInstrument?: string;
  riskLevel: string;
  volatility30d: number;
  volatility90d: number;
  correlationRisk: number;
  analysisDate: Date;
  createdAt: Date;
}

export interface PaymentAnomaly {
  id: string;
  businessAccountId: string;
  paymentId?: string;
  anomalyType: string;
  anomalySeverity: string;
  description: string;
  detectedValue?: number;
  expectedValue?: number;
  variancePercentage?: number;
  detectionRules: any[];
  autoResolved: boolean;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export class CrossBorderPaymentsEngine {
  // Cross-Border Payments Management
  async createPayment(data: z.infer<typeof CrossBorderPaymentSchema>): Promise<CrossBorderPayment> {
    const validated = CrossBorderPaymentSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_cross_border_payment(
        ${validated.businessAccountId}::uuid,
        ${validated.paymentReference}::varchar,
        ${validated.paymentDirection}::varchar,
        ${validated.sourceEntityId || null}::uuid,
        ${validated.destinationEntityId || null}::uuid,
        ${validated.sourceCountryCode}::varchar,
        ${validated.destinationCountryCode}::varchar,
        ${validated.sourceCurrency}::varchar,
        ${validated.destinationCurrency}::varchar,
        ${validated.originalAmount}::decimal,
        ${validated.convertedAmount}::decimal,
        ${validated.fxRateApplied}::decimal,
        ${validated.fxRateAtTime || null}::decimal,
        ${validated.fxSpread}::decimal,
        ${validated.totalFees}::decimal,
        ${JSON.stringify(validated.feeBreakdown)}::jsonb,
        ${validated.paymentMethod}::varchar,
        ${validated.paymentRail || null}::varchar,
        ${validated.correspondentBank || null}::varchar,
        ${JSON.stringify(validated.intermediaryBanks)}::jsonb,
        ${validated.initiatedDate}::timestamptz,
        ${validated.processedDate || null}::timestamptz,
        ${validated.settledDate || null}::timestamptz,
        ${validated.expectedSettlementDate || null}::timestamptz,
        ${validated.status}::varchar,
        ${validated.failureReason || null}::text,
        ${validated.paymentPurpose || null}::varchar,
        ${JSON.stringify(validated.complianceScreeningResult)}::jsonb,
        ${validated.riskScore}::integer,
        ${validated.createdBy}::uuid
      ) as payment_id
    `;
    
    const paymentId = (result as any)[0]?.payment_id;
    return this.getPayment(paymentId);
  }

  async getPayment(paymentId: string): Promise<CrossBorderPayment> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        payment_reference as "paymentReference",
        payment_direction as "paymentDirection",
        source_entity_id as "sourceEntityId",
        destination_entity_id as "destinationEntityId",
        source_country_code as "sourceCountryCode",
        destination_country_code as "destinationCountryCode",
        source_currency as "sourceCurrency",
        destination_currency as "destinationCurrency",
        original_amount as "originalAmount",
        converted_amount as "convertedAmount",
        fx_rate_applied as "fxRateApplied",
        fx_rate_at_time as "fxRateAtTime",
        fx_spread as "fxSpread",
        total_fees as "totalFees",
        fee_breakdown as "feeBreakdown",
        payment_method as "paymentMethod",
        payment_rail as "paymentRail",
        correspondent_bank as "correspondentBank",
        intermediary_banks as "intermediaryBanks",
        initiated_date as "initiatedDate",
        processed_date as "processedDate",
        settled_date as "settledDate",
        expected_settlement_date as "expectedSettlementDate",
        status,
        failure_reason as "failureReason",
        payment_purpose as "paymentPurpose",
        compliance_screening_result as "complianceScreeningResult",
        risk_score as "riskScore",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cross_border_payments
      WHERE id = ${paymentId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getPayments(businessAccountId: string, filters: {
    paymentDirection?: string;
    sourceCountry?: string;
    destinationCountry?: string;
    currencyPair?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<CrossBorderPayment[]> {
    const { 
      paymentDirection, 
      sourceCountry, 
      destinationCountry, 
      currencyPair, 
      status, 
      startDate, 
      endDate, 
      limit = 50 
    } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        payment_reference as "paymentReference",
        payment_direction as "paymentDirection",
        source_entity_id as "sourceEntityId",
        destination_entity_id as "destinationEntityId",
        source_country_code as "sourceCountryCode",
        destination_country_code as "destinationCountryCode",
        source_currency as "sourceCurrency",
        destination_currency as "destinationCurrency",
        original_amount as "originalAmount",
        converted_amount as "convertedAmount",
        fx_rate_applied as "fxRateApplied",
        fx_rate_at_time as "fxRateAtTime",
        fx_spread as "fxSpread",
        total_fees as "totalFees",
        fee_breakdown as "feeBreakdown",
        payment_method as "paymentMethod",
        payment_rail as "paymentRail",
        correspondent_bank as "correspondentBank",
        intermediary_banks as "intermediaryBanks",
        initiated_date as "initiatedDate",
        processed_date as "processedDate",
        settled_date as "settledDate",
        expected_settlement_date as "expectedSettlementDate",
        status,
        failure_reason as "failureReason",
        payment_purpose as "paymentPurpose",
        compliance_screening_result as "complianceScreeningResult",
        risk_score as "riskScore",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cross_border_payments
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (paymentDirection) {
      query += ` AND payment_direction = '${paymentDirection}'`;
    }
    
    if (sourceCountry) {
      query += ` AND source_country_code = '${sourceCountry}'`;
    }
    
    if (destinationCountry) {
      query += ` AND destination_country_code = '${destinationCountry}'`;
    }
    
    if (currencyPair) {
      query += ` AND (source_currency || destination_currency) = '${currencyPair}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (startDate) {
      query += ` AND initiated_date >= '${startDate}'::timestamptz`;
    }
    
    if (endDate) {
      query += ` AND initiated_date <= '${endDate}'::timestamptz`;
    }
    
    query += ` ORDER BY initiated_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as CrossBorderPayment[];
  }

  // FX Rate Intelligence Management
  async analyzeFXRate(data: z.infer<typeof FXRateIntelligenceSchema>): Promise<FXRateIntelligence> {
    const validated = FXRateIntelligenceSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT analyze_fx_rate(
        ${validated.businessAccountId}::uuid,
        ${validated.currencyPair}::varchar,
        ${validated.baseCurrency}::varchar,
        ${validated.quoteCurrency}::varchar,
        ${validated.marketRate}::decimal,
        ${validated.bankRate}::decimal,
        ${validated.rateSource || null}::varchar,
        ${validated.rateTimestamp}::timestamptz,
        ${validated.isWeekend}::boolean,
        ${validated.isHoliday}::boolean,
        ${validated.marketVolatility}::decimal,
        ${validated.confidenceLevel}::integer
      ) as fx_id
    `;
    
    const fxId = (result as any)[0]?.fx_id;
    return this.getFXRateIntelligence(fxId);
  }

  async getFXRateIntelligence(fxId: string): Promise<FXRateIntelligence> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        currency_pair as "currencyPair",
        base_currency as "baseCurrency",
        quote_currency as "quoteCurrency",
        market_rate as "marketRate",
        bank_rate as "bankRate",
        spread,
        spread_percentage as "spreadPercentage",
        rate_source as "rateSource",
        rate_timestamp as "rateTimestamp",
        is_weekend as "isWeekend",
        is_holiday as "isHoliday",
        market_volatility as "marketVolatility",
        confidence_level as "confidenceLevel",
        created_at as "createdAt"
      FROM fx_rate_intelligence
      WHERE id = ${fxId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getFXRateIntelligence(businessAccountId: string, filters: {
    currencyPair?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<FXRateIntelligence[]> {
    const { currencyPair, startDate, endDate, limit = 100 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        currency_pair as "currencyPair",
        base_currency as "baseCurrency",
        quote_currency as "quoteCurrency",
        market_rate as "marketRate",
        bank_rate as "bankRate",
        spread,
        spread_percentage as "spreadPercentage",
        rate_source as "rateSource",
        rate_timestamp as "rateTimestamp",
        is_weekend as "isWeekend",
        is_holiday as "isHoliday",
        market_volatility as "marketVolatility",
        confidence_level as "confidenceLevel",
        created_at as "createdAt"
      FROM fx_rate_intelligence
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (currencyPair) {
      query += ` AND currency_pair = '${currencyPair}'`;
    }
    
    if (startDate) {
      query += ` AND rate_timestamp >= '${startDate}'::timestamptz`;
    }
    
    if (endDate) {
      query += ` AND rate_timestamp <= '${endDate}'::timestamptz`;
    }
    
    query += ` ORDER BY rate_timestamp DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as FXRateIntelligence[];
  }

  // Payment Route Analysis
  async createPaymentRoute(data: z.infer<typeof PaymentRouteSchema>): Promise<PaymentRoute> {
    const validated = PaymentRouteSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO payment_routes (
        id,
        business_account_id,
        route_name,
        source_country,
        destination_country,
        currency_pair,
        payment_method,
        typical_correspondent_banks,
        average_processing_hours,
        success_rate,
        average_total_cost,
        cost_percentage,
        risk_level,
        compliance_flags,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.routeName}::varchar,
        ${validated.sourceCountry}::varchar,
        ${validated.destinationCountry}::varchar,
        ${validated.currencyPair}::varchar,
        ${validated.paymentMethod}::varchar,
        ${JSON.stringify(validated.typicalCorrespondentBanks)}::jsonb,
        ${validated.averageProcessingHours || null}::decimal,
        ${validated.successRate}::decimal,
        ${validated.averageTotalCost || null}::decimal,
        ${validated.costPercentage || null}::decimal,
        ${validated.riskLevel}::varchar,
        ${JSON.stringify(validated.complianceFlags)}::jsonb,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const routeId = (result as any)[0]?.id;
    return this.getPaymentRoute(routeId);
  }

  async getPaymentRoute(routeId: string): Promise<PaymentRoute> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        route_name as "routeName",
        source_country as "sourceCountry",
        destination_country as "destinationCountry",
        currency_pair as "currencyPair",
        payment_method as "paymentMethod",
        typical_correspondent_banks as "typicalCorrespondentBanks",
        average_processing_hours as "averageProcessingHours",
        success_rate as "successRate",
        average_total_cost as "averageTotalCost",
        cost_percentage as "costPercentage",
        risk_level as "riskLevel",
        compliance_flags as "complianceFlags",
        last_analyzed as "lastAnalyzed",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM payment_routes
      WHERE id = ${routeId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getPaymentRoutes(businessAccountId: string, filters: {
    sourceCountry?: string;
    destinationCountry?: string;
    currencyPair?: string;
    paymentMethod?: string;
    riskLevel?: string;
    limit?: number;
  } = {}): Promise<PaymentRoute[]> {
    const { 
      sourceCountry, 
      destinationCountry, 
      currencyPair, 
      paymentMethod, 
      riskLevel, 
      limit = 50 
    } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        route_name as "routeName",
        source_country as "sourceCountry",
        destination_country as "destinationCountry",
        currency_pair as "currencyPair",
        payment_method as "paymentMethod",
        typical_correspondent_banks as "typicalCorrespondentBanks",
        average_processing_hours as "averageProcessingHours",
        success_rate as "successRate",
        average_total_cost as "averageTotalCost",
        cost_percentage as "costPercentage",
        risk_level as "riskLevel",
        compliance_flags as "complianceFlags",
        last_analyzed as "lastAnalyzed",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM payment_routes
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (sourceCountry) {
      query += ` AND source_country = '${sourceCountry}'`;
    }
    
    if (destinationCountry) {
      query += ` AND destination_country = '${destinationCountry}'`;
    }
    
    if (currencyPair) {
      query += ` AND currency_pair = '${currencyPair}'`;
    }
    
    if (paymentMethod) {
      query += ` AND payment_method = '${paymentMethod}'`;
    }
    
    if (riskLevel) {
      query += ` AND risk_level = '${riskLevel}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as PaymentRoute[];
  }

  // Payment Anomaly Detection
  async detectAnomaly(
    businessAccountId: string,
    paymentId: string,
    anomalyType: string,
    anomalySeverity: string,
    description: string,
    detectedValue?: number,
    expectedValue?: number,
    variancePercentage?: number,
    detectionRules: any[] = []
  ): Promise<PaymentAnomaly> {
    const result = await prisma.$queryRaw`
      SELECT detect_payment_anomaly(
        ${businessAccountId}::uuid,
        ${paymentId}::uuid,
        ${anomalyType}::varchar,
        ${anomalySeverity}::varchar,
        ${description}::text,
        ${detectedValue || null}::decimal,
        ${expectedValue || null}::decimal,
        ${variancePercentage || null}::decimal,
        ${JSON.stringify(detectionRules)}::jsonb
      ) as anomaly_id
    `;
    
    const anomalyId = (result as any)[0]?.anomaly_id;
    return this.getPaymentAnomaly(anomalyId);
  }

  async getPaymentAnomaly(anomalyId: string): Promise<PaymentAnomaly> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        payment_id as "paymentId",
        anomaly_type as "anomalyType",
        anomaly_severity as "anomalySeverity",
        description,
        detected_value as "detectedValue",
        expected_value as "expectedValue",
        variance_percentage as "variancePercentage",
        detection_rules as "detectionRules",
        auto_resolved as "autoResolved",
        resolution_notes as "resolutionNotes",
        resolved_by as "resolvedBy",
        resolved_at as "resolvedAt",
        created_at as "createdAt"
      FROM payment_anomalies
      WHERE id = ${anomalyId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getPaymentAnomalies(businessAccountId: string, filters: {
    anomalyType?: string;
    anomalySeverity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<PaymentAnomaly[]> {
    const { 
      anomalyType, 
      anomalySeverity, 
      startDate, 
      endDate, 
      limit = 50 
    } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        payment_id as "paymentId",
        anomaly_type as "anomalyType",
        anomaly_severity as "anomalySeverity",
        description,
        detected_value as "detectedValue",
        expected_value as "expectedValue",
        variance_percentage as "variancePercentage",
        detection_rules as "detectionRules",
        auto_resolved as "autoResolved",
        resolution_notes as "resolutionNotes",
        resolved_by as "resolvedBy",
        resolved_at as "resolvedAt",
        created_at as "createdAt"
      FROM payment_anomalies
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (anomalyType) {
      query += ` AND anomaly_type = '${anomalyType}'`;
    }
    
    if (anomalySeverity) {
      query += ` AND anomaly_severity = '${anomalySeverity}'`;
    }
    
    if (startDate) {
      query += ` AND created_at >= '${startDate}'::timestamptz`;
    }
    
    if (endDate) {
      query += ` AND created_at <= '${endDate}'::timestamptz`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as PaymentAnomaly[];
  }

  // Analytics and Dashboard Methods
  async getPaymentSummary(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM cross_border_payment_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async getFXEfficiencyAnalysis(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM fx_efficiency_analysis
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async getPaymentRoutePerformance(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM payment_route_performance
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async refreshMaterializedViews(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_cross_border_materialized_views()`;
  }

  // Helper Methods for Analysis
  async calculatePaymentEfficiency(businessAccountId: string, periodStart: Date, periodEnd: Date): Promise<PaymentEfficiencyMetrics> {
    const payments = await this.getPayments(businessAccountId, {
      startDate: periodStart.toISOString(),
      endDate: periodEnd.toISOString()
    });

    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.status === 'completed').length;
    const failedPayments = payments.filter(p => p.status === 'failed').length;
    
    const processingTimes = payments
      .filter(p => p.processedDate && p.initiatedDate)
      .map(p => (new Date(p.processedDate!).getTime() - new Date(p.initiatedDate).getTime()) / (1000 * 60 * 60));
    
    const settlementTimes = payments
      .filter(p => p.settledDate && p.initiatedDate)
      .map(p => (new Date(p.settledDate!).getTime() - new Date(p.initiatedDate).getTime()) / (1000 * 60 * 60));
    
    const totalVolume = payments.reduce((sum, p) => sum + p.originalAmount, 0);
    const totalFees = payments.reduce((sum, p) => sum + p.totalFees, 0);
    const averageFeePercentage = totalVolume > 0 ? (totalFees / totalVolume) * 100 : 0;
    
    const riskScores = payments.map(p => p.riskScore);
    const riskScoreAverage = riskScores.length > 0 ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length : 0;

    return {
      id: uuidv4(),
      businessAccountId,
      metricPeriodStart: periodStart,
      metricPeriodEnd: periodEnd,
      totalPayments,
      successfulPayments,
      failedPayments,
      averageProcessingTimeHours: processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0,
      averageSettlementTimeHours: settlementTimes.length > 0 ? settlementTimes.reduce((a, b) => a + b, 0) / settlementTimes.length : 0,
      totalVolume,
      totalFees,
      averageFeePercentage,
      fxSavingsOpportunities: this.calculateFXSavingsOpportunities(payments),
      complianceFlagsCount: payments.filter(p => Object.keys(p.complianceScreeningResult).length > 0).length,
      riskScoreAverage,
      createdAt: new Date()
    };
  }

  private calculateFXSavingsOpportunities(payments: CrossBorderPayment[]): number {
    // Calculate potential FX savings by comparing applied rates with market rates
    let totalSavings = 0;
    
    for (const payment of payments) {
      if (payment.fxSpread > 0.001) { // If spread is more than 0.1%
        const potentialSavings = payment.originalAmount * payment.fxSpread;
        totalSavings += potentialSavings;
      }
    }
    
    return totalSavings;
  }

  async detectPaymentDelays(businessAccountId: string): Promise<PaymentAnomaly[]> {
    const payments = await this.getPayments(businessAccountId, { status: 'pending' });
    const anomalies: PaymentAnomaly[] = [];
    
    for (const payment of payments) {
      const initiatedTime = new Date(payment.initiatedDate).getTime();
      const currentTime = new Date().getTime();
      const hoursElapsed = (currentTime - initiatedTime) / (1000 * 60 * 60);
      
      // Flag payments pending for more than 48 hours
      if (hoursElapsed > 48) {
        const anomaly = await this.detectAnomaly(
          businessAccountId,
          payment.id,
          'delayed_processing',
          hoursElapsed > 72 ? 'high' : 'medium',
          `Payment has been pending for ${hoursElapsed.toFixed(1)} hours`,
          hoursElapsed,
          24, // Expected processing time
          ((hoursElapsed - 24) / 24) * 100,
          [{ rule: 'processing_time_threshold', threshold: 48, actual: hoursElapsed }]
        );
        
        anomalies.push(anomaly);
      }
    }
    
    return anomalies;
  }

  async analyzeFXExposure(businessAccountId: string, currency: string, baseCurrency: string): Promise<FXExposureAnalysis> {
    const payments = await this.getPayments(businessAccountId, {
      destinationCurrency: currency
    });

    const totalExposure = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.convertedAmount, 0);

    // Get current FX rate (this would integrate with a real FX service)
    const currentRate = 1.2; // Placeholder
    
    const unrealizedGainLoss = totalExposure * (currentRate - 1.0);

    return {
      id: uuidv4(),
      businessAccountId,
      currency,
      exposureType: 'transactional',
      exposureAmount: totalExposure,
      baseCurrency,
      currentRate,
      unrealizedGainLoss,
      hedgePercentage: 0,
      riskLevel: Math.abs(unrealizedGainLoss) > 10000 ? 'high' : 'medium',
      volatility30d: 0.02,
      volatility90d: 0.03,
      correlationRisk: 0.1,
      analysisDate: new Date(),
      createdAt: new Date()
    };
  }
}
