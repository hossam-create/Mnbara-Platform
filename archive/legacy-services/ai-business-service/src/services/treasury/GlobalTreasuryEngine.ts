import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const GlobalCashPositionSchema = z.object({
  businessAccountId: z.string().uuid(),
  entityId: z.string().uuid(),
  countryCode: z.string().length(2),
  currency: z.string().length(3),
  cashBalance: z.number(),
  availableBalance: z.number(),
  restrictedBalance: z.number().default(0),
  bankAccountsCount: z.number().default(0),
  balanceDate: z.string().date(),
  createdBy: z.string().uuid()
});

const MultiCurrencyPositionSchema = z.object({
  businessAccountId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  currency: z.string().length(3),
  totalBalance: z.number(),
  fxRateBase: z.number(),
  fxRateToUSD: z.number(),
  balanceInUSD: z.number(),
  balanceInBase: z.number(),
  currencyRiskScore: z.number().default(0),
  concentrationRisk: z.number().default(0),
  positionDate: z.string().date(),
  createdBy: z.string().uuid()
});

const LiquidityForecastSchema = z.object({
  businessAccountId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  currency: z.string().length(3),
  forecastType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual']),
  forecastDate: z.string().date(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  openingBalance: z.number(),
  inflows: z.number().default(0),
  outflows: z.number().default(0),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  forecastModel: z.string().optional(),
  assumptions: z.record(z.any()).default({}),
  createdBy: z.string().uuid()
});

const IntercompanyFundingSchema = z.object({
  businessAccountId: z.string().uuid(),
  fundingReference: z.string().min(1).max(100),
  sourceEntityId: z.string().uuid(),
  destinationEntityId: z.string().uuid(),
  fundingType: z.enum(['loan', 'credit_line', 'guarantee', 'cash_pool', 'equity', 'other']),
  currency: z.string().length(3),
  originalAmount: z.number(),
  outstandingAmount: z.number(),
  interestRate: z.number().default(0),
  maturityDate: z.string().date().optional(),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  repaymentSchedule: z.array(z.any()).default([]),
  collateral: z.record(z.any()).default({}),
  covenants: z.array(z.any()).default([]),
  createdBy: z.string().uuid()
});

const DebtCreditFacilitySchema = z.object({
  businessAccountId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  facilityType: z.enum(['revolving_credit', 'term_loan', 'bridge_loan', 'syndicated_loan', 'bond', 'other']),
  facilityName: z.string().min(1).max(200),
  lender: z.string().max(200).optional(),
  currency: z.string().length(3),
  totalCommitment: z.number(),
  amountDrawn: z.number().default(0),
  interestRate: z.number().default(0),
  marginOverLibor: z.number().default(0),
  arrangementFee: z.number().default(0),
  maturityDate: z.string().date().optional(),
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  renewalDate: z.string().date().optional(),
  covenants: z.array(z.any()).default([]),
  collateralRequirements: z.record(z.any()).default({}),
  rating: z.string().max(20).optional(),
  createdBy: z.string().uuid()
});

export interface GlobalCashPosition {
  id: string;
  businessAccountId: string;
  entityId: string;
  countryCode: string;
  currency: string;
  cashBalance: number;
  availableBalance: number;
  restrictedBalance: number;
  bankAccountsCount: number;
  lastUpdated: Date;
  balanceDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultiCurrencyPosition {
  id: string;
  businessAccountId: string;
  entityId?: string;
  currency: string;
  totalBalance: number;
  fxRateBase: number;
  fxRateToUSD: number;
  balanceInUSD: number;
  balanceInBase: number;
  currencyRiskScore: number;
  concentrationRisk: number;
  positionDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiquidityForecast {
  id: string;
  businessAccountId: string;
  entityId?: string;
  currency: string;
  forecastType: string;
  forecastDate: Date;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  inflows: number;
  outflows: number;
  netCashFlow: number;
  closingBalance: number;
  confidenceLevel: number;
  forecastModel?: string;
  assumptions: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntercompanyFunding {
  id: string;
  businessAccountId: string;
  fundingReference: string;
  sourceEntityId: string;
  destinationEntityId: string;
  fundingType: string;
  currency: string;
  originalAmount: number;
  outstandingAmount: number;
  interestRate: number;
  maturityDate?: Date;
  startDate: Date;
  endDate?: Date;
  repaymentSchedule: any[];
  collateral: any;
  covenants: any[];
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtCreditFacility {
  id: string;
  businessAccountId: string;
  entityId?: string;
  facilityType: string;
  facilityName: string;
  lender?: string;
  currency: string;
  totalCommitment: number;
  amountDrawn: number;
  amountAvailable: number;
  interestRate: number;
  marginOverLibor: number;
  arrangementFee: number;
  maturityDate?: Date;
  startDate: Date;
  endDate?: Date;
  renewalDate?: Date;
  covenants: any[];
  collateralRequirements: any;
  rating?: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreasuryAlert {
  id: string;
  businessAccountId: string;
  alertType: string;
  severity: string;
  title: string;
  description?: string;
  entityId?: string;
  currency?: string;
  thresholdValue?: number;
  currentValue?: number;
  variancePercentage?: number;
  alertData: any;
  status: string;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface TreasuryKPI {
  id: string;
  businessAccountId: string;
  kpiName: string;
  kpiCategory: string;
  kpiValue: number;
  kpiUnit?: string;
  targetValue?: number;
  benchmarkValue?: number;
  varianceFromTarget?: number;
  trendDirection: string;
  performanceRating: string;
  measurementDate: Date;
  periodType: string;
  createdBy: string;
  createdAt: Date;
}

export interface TreasurySnapshot {
  id: string;
  businessAccountId: string;
  snapshotName: string;
  snapshotDescription?: string;
  snapshotDate: Date;
  snapshotData: any;
  includesForecasts: boolean;
  includesAlerts: boolean;
  isReadOnly: boolean;
  createdBy: string;
  createdAt: Date;
}

export class GlobalTreasuryEngine {
  // Global Cash Positions Management
  async updateGlobalCashPosition(data: z.infer<typeof GlobalCashPositionSchema>): Promise<GlobalCashPosition> {
    const validated = GlobalCashPositionSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT update_global_cash_position(
        ${validated.businessAccountId}::uuid,
        ${validated.entityId}::uuid,
        ${validated.countryCode}::varchar,
        ${validated.currency}::varchar,
        ${validated.cashBalance}::decimal,
        ${validated.availableBalance}::decimal,
        ${validated.restrictedBalance}::decimal,
        ${validated.bankAccountsCount}::integer,
        ${validated.balanceDate}::date,
        ${validated.createdBy}::uuid
      ) as position_id
    `;
    
    const positionId = (result as any)[0]?.position_id;
    return this.getGlobalCashPosition(positionId);
  }

  async getGlobalCashPosition(positionId: string): Promise<GlobalCashPosition> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        country_code as "countryCode",
        currency,
        cash_balance as "cashBalance",
        available_balance as "availableBalance",
        restricted_balance as "restrictedBalance",
        bank_accounts_count as "bankAccountsCount",
        last_updated as "lastUpdated",
        balance_date as "balanceDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM global_cash_positions
      WHERE id = ${positionId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getGlobalCashPositions(businessAccountId: string, filters: {
    entityId?: string;
    countryCode?: string;
    currency?: string;
    balanceDate?: string;
    limit?: number;
  } = {}): Promise<GlobalCashPosition[]> {
    const { entityId, countryCode, currency, balanceDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        country_code as "countryCode",
        currency,
        cash_balance as "cashBalance",
        available_balance as "availableBalance",
        restricted_balance as "restrictedBalance",
        bank_accounts_count as "bankAccountsCount",
        last_updated as "lastUpdated",
        balance_date as "balanceDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM global_cash_positions
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (entityId) {
      query += ` AND entity_id = '${entityId}'`;
    }
    
    if (countryCode) {
      query += ` AND country_code = '${countryCode}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    if (balanceDate) {
      query += ` AND balance_date = '${balanceDate}'::date`;
    }
    
    query += ` ORDER BY balance_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as GlobalCashPosition[];
  }

  // Multi-Currency Cash Positioning
  async createMultiCurrencyPosition(data: z.infer<typeof MultiCurrencyPositionSchema>): Promise<MultiCurrencyPosition> {
    const validated = MultiCurrencyPositionSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO multi_currency_positions (
        id,
        business_account_id,
        entity_id,
        currency,
        total_balance,
        fx_rate_base,
        fx_rate_to_usd,
        balance_in_usd,
        balance_in_base,
        currency_risk_score,
        concentration_risk,
        position_date,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.entityId || null}::uuid,
        ${validated.currency}::varchar,
        ${validated.totalBalance}::decimal,
        ${validated.fxRateBase}::decimal,
        ${validated.fxRateToUSD}::decimal,
        ${validated.balanceInUSD}::decimal,
        ${validated.balanceInBase}::decimal,
        ${validated.currencyRiskScore}::decimal,
        ${validated.concentrationRisk}::decimal,
        ${validated.positionDate}::date,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const positionId = (result as any)[0]?.id;
    return this.getMultiCurrencyPosition(positionId);
  }

  async getMultiCurrencyPosition(positionId: string): Promise<MultiCurrencyPosition> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        total_balance as "totalBalance",
        fx_rate_base as "fxRateBase",
        fx_rate_to_usd as "fxRateToUSD",
        balance_in_usd as "balanceInUSD",
        balance_in_base as "balanceInBase",
        currency_risk_score as "currencyRiskScore",
        concentration_risk as "concentrationRisk",
        position_date as "positionDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM multi_currency_positions
      WHERE id = ${positionId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getMultiCurrencyPositions(businessAccountId: string, filters: {
    entityId?: string;
    currency?: string;
    positionDate?: string;
    limit?: number;
  } = {}): Promise<MultiCurrencyPosition[]> {
    const { entityId, currency, positionDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        total_balance as "totalBalance",
        fx_rate_base as "fxRateBase",
        fx_rate_to_usd as "fxRateToUSD",
        balance_in_usd as "balanceInUSD",
        balance_in_base as "balanceInBase",
        currency_risk_score as "currencyRiskScore",
        concentration_risk as "concentrationRisk",
        position_date as "positionDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM multi_currency_positions
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (entityId) {
      query += ` AND entity_id = '${entityId}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    if (positionDate) {
      query += ` AND position_date = '${positionDate}'::date`;
    }
    
    query += ` ORDER BY position_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as MultiCurrencyPosition[];
  }

  // Liquidity Forecasting
  async calculateLiquidityForecast(data: z.infer<typeof LiquidityForecastSchema>): Promise<LiquidityForecast> {
    const validated = LiquidityForecastSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT calculate_liquidity_forecast(
        ${validated.businessAccountId}::uuid,
        ${validated.entityId || null}::uuid,
        ${validated.currency}::varchar,
        ${validated.forecastType}::varchar,
        ${validated.periodStart}::date,
        ${validated.periodEnd}::date,
        ${validated.openingBalance}::decimal,
        ${validated.confidenceLevel}::integer,
        ${validated.createdBy}::uuid
      ) as forecast_id
    `;
    
    const forecastId = (result as any)[0]?.forecast_id;
    return this.getLiquidityForecast(forecastId);
  }

  async getLiquidityForecast(forecastId: string): Promise<LiquidityForecast> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        forecast_type as "forecastType",
        forecast_date as "forecastDate",
        period_start as "periodStart",
        period_end as "periodEnd",
        opening_balance as "openingBalance",
        inflows,
        outflows,
        net_cash_flow as "netCashFlow",
        closing_balance as "closingBalance",
        confidence_level as "confidenceLevel",
        forecast_model as "forecastModel",
        assumptions,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM liquidity_forecasts
      WHERE id = ${forecastId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getLiquidityForecasts(businessAccountId: string, filters: {
    entityId?: string;
    currency?: string;
    forecastType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<LiquidityForecast[]> {
    const { entityId, currency, forecastType, startDate, endDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        forecast_type as "forecastType",
        forecast_date as "forecastDate",
        period_start as "periodStart",
        period_end as "periodEnd",
        opening_balance as "openingBalance",
        inflows,
        outflows,
        net_cash_flow as "netCashFlow",
        closing_balance as "closingBalance",
        confidence_level as "confidenceLevel",
        forecast_model as "forecastModel",
        assumptions,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM liquidity_forecasts
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (entityId) {
      query += ` AND entity_id = '${entityId}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    if (forecastType) {
      query += ` AND forecast_type = '${forecastType}'`;
    }
    
    if (startDate) {
      query += ` AND forecast_date >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND forecast_date <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY forecast_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as LiquidityForecast[];
  }

  // Intercompany Funding Management
  async createIntercompanyFunding(data: z.infer<typeof IntercompanyFundingSchema>): Promise<IntercompanyFunding> {
    const validated = IntercompanyFundingSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO intercompany_funding (
        id,
        business_account_id,
        funding_reference,
        source_entity_id,
        destination_entity_id,
        funding_type,
        currency,
        original_amount,
        outstanding_amount,
        interest_rate,
        maturity_date,
        start_date,
        end_date,
        repayment_schedule,
        collateral,
        covenants,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.fundingReference}::varchar,
        ${validated.sourceEntityId}::uuid,
        ${validated.destinationEntityId}::uuid,
        ${validated.fundingType}::varchar,
        ${validated.currency}::varchar,
        ${validated.originalAmount}::decimal,
        ${validated.outstandingAmount}::decimal,
        ${validated.interestRate}::decimal,
        ${validated.maturityDate || null}::date,
        ${validated.startDate}::date,
        ${validated.endDate || null}::date,
        ${JSON.stringify(validated.repaymentSchedule)}::jsonb,
        ${JSON.stringify(validated.collateral)}::jsonb,
        ${JSON.stringify(validated.covenants)}::jsonb,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const fundingId = (result as any)[0]?.id;
    return this.getIntercompanyFunding(fundingId);
  }

  async getIntercompanyFunding(fundingId: string): Promise<IntercompanyFunding> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        funding_reference as "fundingReference",
        source_entity_id as "sourceEntityId",
        destination_entity_id as "destinationEntityId",
        funding_type as "fundingType",
        currency,
        original_amount as "originalAmount",
        outstanding_amount as "outstandingAmount",
        interest_rate as "interestRate",
        maturity_date as "maturityDate",
        start_date as "startDate",
        end_date as "endDate",
        repayment_schedule as "repaymentSchedule",
        collateral,
        covenants,
        status,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM intercompany_funding
      WHERE id = ${fundingId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getIntercompanyFundings(businessAccountId: string, filters: {
    sourceEntityId?: string;
    destinationEntityId?: string;
    fundingType?: string;
    status?: string;
    currency?: string;
    limit?: number;
  } = {}): Promise<IntercompanyFunding[]> {
    const { 
      sourceEntityId, 
      destinationEntityId, 
      fundingType, 
      status, 
      currency, 
      limit = 50 
    } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        funding_reference as "fundingReference",
        source_entity_id as "sourceEntityId",
        destination_entity_id as "destinationEntityId",
        funding_type as "fundingType",
        currency,
        original_amount as "originalAmount",
        outstanding_amount as "outstandingAmount",
        interest_rate as "interestRate",
        maturity_date as "maturityDate",
        start_date as "startDate",
        end_date as "endDate",
        repayment_schedule as "repaymentSchedule",
        collateral,
        covenants,
        status,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM intercompany_funding
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (sourceEntityId) {
      query += ` AND source_entity_id = '${sourceEntityId}'`;
    }
    
    if (destinationEntityId) {
      query += ` AND destination_entity_id = '${destinationEntityId}'`;
    }
    
    if (fundingType) {
      query += ` AND funding_type = '${fundingType}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    query += ` ORDER BY start_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as IntercompanyFunding[];
  }

  // Debt and Credit Facilities Management
  async createDebtCreditFacility(data: z.infer<typeof DebtCreditFacilitySchema>): Promise<DebtCreditFacility> {
    const validated = DebtCreditFacilitySchema.parse(data);
    
    const amountAvailable = validated.totalCommitment - validated.amountDrawn;
    
    const result = await prisma.$queryRaw`
      INSERT INTO debt_credit_facilities (
        id,
        business_account_id,
        entity_id,
        facility_type,
        facility_name,
        lender,
        currency,
        total_commitment,
        amount_drawn,
        amount_available,
        interest_rate,
        margin_over_libor,
        arrangement_fee,
        maturity_date,
        start_date,
        end_date,
        renewal_date,
        covenants,
        collateral_requirements,
        rating,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.entityId || null}::uuid,
        ${validated.facilityType}::varchar,
        ${validated.facilityName}::varchar,
        ${validated.lender || null}::varchar,
        ${validated.currency}::varchar,
        ${validated.totalCommitment}::decimal,
        ${validated.amountDrawn}::decimal,
        ${amountAvailable}::decimal,
        ${validated.interestRate}::decimal,
        ${validated.marginOverLibor}::decimal,
        ${validated.arrangementFee}::decimal,
        ${validated.maturityDate || null}::date,
        ${validated.startDate}::date,
        ${validated.endDate || null}::date,
        ${validated.renewalDate || null}::date,
        ${JSON.stringify(validated.covenants)}::jsonb,
        ${JSON.stringify(validated.collateralRequirements)}::jsonb,
        ${validated.rating || null}::varchar,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const facilityId = (result as any)[0]?.id;
    return this.getDebtCreditFacility(facilityId);
  }

  async getDebtCreditFacility(facilityId: string): Promise<DebtCreditFacility> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        facility_type as "facilityType",
        facility_name as "facilityName",
        lender,
        currency,
        total_commitment as "totalCommitment",
        amount_drawn as "amountDrawn",
        amount_available as "amountAvailable",
        interest_rate as "interestRate",
        margin_over_libor as "marginOverLibor",
        arrangement_fee as "arrangementFee",
        maturity_date as "maturityDate",
        start_date as "startDate",
        end_date as "endDate",
        renewal_date as "renewalDate",
        covenants,
        collateral_requirements as "collateralRequirements",
        rating,
        status,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM debt_credit_facilities
      WHERE id = ${facilityId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getDebtCreditFacilities(businessAccountId: string, filters: {
    entityId?: string;
    facilityType?: string;
    status?: string;
    currency?: string;
    limit?: number;
  } = {}): Promise<DebtCreditFacility[]> {
    const { entityId, facilityType, status, currency, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        facility_type as "facilityType",
        facility_name as "facilityName",
        lender,
        currency,
        total_commitment as "totalCommitment",
        amount_drawn as "amountDrawn",
        amount_available as "amountAvailable",
        interest_rate as "interestRate",
        margin_over_libor as "marginOverLibor",
        arrangement_fee as "arrangementFee",
        maturity_date as "maturityDate",
        start_date as "startDate",
        end_date as "endDate",
        renewal_date as "renewalDate",
        covenants,
        collateral_requirements as "collateralRequirements",
        rating,
        status,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM debt_credit_facilities
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (entityId) {
      query += ` AND entity_id = '${entityId}'`;
    }
    
    if (facilityType) {
      query += ` AND facility_type = '${facilityType}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    query += ` ORDER BY start_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as DebtCreditFacility[];
  }

  // Analytics and Dashboard Methods
  async getGlobalCashSummary(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM global_cash_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async getLiquidityForecastSummary(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM liquidity_forecast_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async getDebtFacilitySummary(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM debt_facility_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async refreshMaterializedViews(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_treasury_materialized_views()`;
  }

  // Helper Methods for Treasury Operations
  async calculateLiquidityRunway(businessAccountId: string, currency: string): Promise<number> {
    const forecasts = await this.getLiquidityForecasts(businessAccountId, {
      currency,
      forecastType: 'daily',
      limit: 90
    });
    
    let runway = 0;
    let currentBalance = forecasts[0]?.openingBalance || 0;
    
    for (const forecast of forecasts) {
      if (forecast.closingBalance < 0) {
        break;
      }
      runway++;
      currentBalance = forecast.closingBalance;
    }
    
    return runway;
  }

  async calculateCashConcentrationRisk(businessAccountId: string): Promise<number> {
    const positions = await this.getMultiCurrencyPositions(businessAccountId, { limit: 100 });
    
    if (positions.length === 0) return 0;
    
    const totalBalance = positions.reduce((sum, pos) => sum + pos.totalBalance, 0);
    const maxSingleCurrency = Math.max(...positions.map(pos => pos.totalBalance));
    
    return (maxSingleCurrency / totalBalance) * 100;
  }

  async calculateFXExposure(businessAccountId: string): Promise<any> {
    const positions = await this.getMultiCurrencyPositions(businessAccountId, { limit: 100 });
    
    const exposure = {
      totalExposureUSD: 0,
      currencyBreakdown: {},
      highRiskCurrencies: [],
      concentrationRisk: 0
    };
    
    for (const position of positions) {
      exposure.totalExposureUSD += position.balanceInUSD;
      exposure.currencyBreakdown[position.currency] = position.balanceInUSD;
      
      if (position.currencyRiskScore > 70) {
        exposure.highRiskCurrencies.push(position.currency);
      }
    }
    
    exposure.concentrationRisk = await this.calculateCashConcentrationRisk(businessAccountId);
    
    return exposure;
  }

  async generateTreasuryDashboard(businessAccountId: string, language: 'en' | 'ar' = 'en'): Promise<any> {
    const cashSummary = await this.getGlobalCashSummary(businessAccountId);
    const liquiditySummary = await this.getLiquidityForecastSummary(businessAccountId);
    const debtSummary = await this.getDebtFacilitySummary(businessAccountId);
    const fxExposure = await this.calculateFXExposure(businessAccountId);
    
    const runway = await this.calculateLiquidityRunway(businessAccountId, 'USD');
    const concentrationRisk = await this.calculateCashConcentrationRisk(businessAccountId);
    
    return {
      summary: language === 'ar' ? {
        dashboardTitle: 'لوحة معلومات الخزينة العالمية',
        totalCashBalance: cashSummary[0]?.total_cash_balance || 0,
        totalAvailableBalance: cashSummary[0]?.total_available_balance || 0,
        totalEntities: cashSummary[0]?.entities_count || 0,
        totalCountries: cashSummary[0]?.countries_count || 0,
        totalCurrencies: cashSummary[0]?.currencies_count || 0,
        liquidityRunway: runway,
        concentrationRisk,
        generatedAt: new Date().toISOString()
      } : {
        dashboardTitle: 'Global Treasury Dashboard',
        totalCashBalance: cashSummary[0]?.total_cash_balance || 0,
        totalAvailableBalance: cashSummary[0]?.total_available_balance || 0,
        totalEntities: cashSummary[0]?.entities_count || 0,
        totalCountries: cashSummary[0]?.countries_count || 0,
        totalCurrencies: cashSummary[0]?.currencies_count || 0,
        liquidityRunway: runway,
        concentrationRisk,
        generatedAt: new Date().toISOString()
      },
      cashPositions: cashSummary,
      liquidityForecasts: liquiditySummary,
      debtFacilities: debtSummary,
      fxExposure,
      recommendations: this.generateTreasuryRecommendations(
        cashSummary[0],
        liquiditySummary,
        debtSummary,
        fxExposure,
        runway,
        concentrationRisk,
        language
      )
    };
  }

  private generateTreasuryRecommendations(
    cashSummary: any,
    liquiditySummary: any,
    debtSummary: any,
    fxExposure: any,
    runway: number,
    concentrationRisk: number,
    language: 'en' | 'ar'
  ): string[] {
    const recommendations = [];
    
    if (runway < 30) {
      recommendations.push(language === 'ar' ? 
        'مدة السيولة النقدية أقل من 30 يومًا - راجع التدفقات النقدية وخطط التمويل' : 
        'Liquidity runway less than 30 days - review cash flows and funding plans'
      );
    }
    
    if (concentrationRisk > 50) {
      recommendations.push(language === 'ar' ? 
        'مخاطر التركيز النقدي عالية - فكر في تنويع العملات' : 
        'High cash concentration risk - consider currency diversification'
      );
    }
    
    if (fxExposure.highRiskCurrencies.length > 0) {
      recommendations.push(language === 'ar' ? 
        `عملات عالية المخاطر: ${fxExposure.highRiskCurrencies.join(', ')} - نفذ استراتيجيات التحوط` : 
        `High-risk currencies: ${fxExposure.highRiskCurrencies.join(', ')} - implement hedging strategies`
      );
    }
    
    if (debtSummary && debtSummary.some((d: any) => d.maturing_soon_count > 0)) {
      recommendations.push(language === 'ar' ? 
        'تسهيلات الديون تنضج قريبًا - خطط للتجديد أو إعادة التمويل' : 
        'Debt facilities maturing soon - plan for renewals or refinancing'
      );
    }
    
    return recommendations;
  }
}
