import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const IFRSFinancialStatementSchema = z.object({
  businessAccountId: z.string().uuid(),
  statementType: z.enum(['income_statement', 'balance_sheet', 'cash_flow', 'equity_statement']),
  statementPeriodStart: z.string().date(),
  statementPeriodEnd: z.string().date(),
  ifrsStandard: z.string(),
  currency: z.string().length(3),
  revenue: z.number().default(0),
  costOfSales: z.number().default(0),
  grossProfit: z.number().default(0),
  operatingExpenses: z.number().default(0),
  operatingIncome: z.number().default(0),
  otherIncome: z.number().default(0),
  netIncome: z.number().default(0),
  totalAssets: z.number().default(0),
  currentAssets: z.number().default(0),
  nonCurrentAssets: z.number().default(0),
  totalLiabilities: z.number().default(0),
  currentLiabilities: z.number().default(0),
  nonCurrentLiabilities: z.number().default(0),
  equity: z.number().default(0),
  operatingCashFlow: z.number().default(0),
  investingCashFlow: z.number().default(0),
  financingCashFlow: z.number().default(0),
  netCashFlow: z.number().default(0),
  statementData: z.record(z.any()).default({}),
  calculationMethodology: z.record(z.any()).default({}),
  createdBy: z.string().uuid()
});

const GAAPFinancialStatementSchema = z.object({
  businessAccountId: z.string().uuid(),
  statementType: z.enum(['income_statement', 'balance_sheet', 'cash_flow', 'equity_statement']),
  statementPeriodStart: z.string().date(),
  statementPeriodEnd: z.string().date(),
  gaapStandard: z.string(),
  currency: z.string().length(3),
  revenue: z.number().default(0),
  costOfSales: z.number().default(0),
  grossProfit: z.number().default(0),
  operatingExpenses: z.number().default(0),
  operatingIncome: z.number().default(0),
  otherIncome: z.number().default(0),
  netIncome: z.number().default(0),
  totalAssets: z.number().default(0),
  currentAssets: z.number().default(0),
  nonCurrentAssets: z.number().default(0),
  totalLiabilities: z.number().default(0),
  currentLiabilities: z.number().default(0),
  nonCurrentLiabilities: z.number().default(0),
  equity: z.number().default(0),
  operatingCashFlow: z.number().default(0),
  investingCashFlow: z.number().default(0),
  financingCashFlow: z.number().default(0),
  netCashFlow: z.number().default(0),
  statementData: z.record(z.any()).default({}),
  calculationMethodology: z.record(z.any()).default({}),
  createdBy: z.string().uuid()
});

const DualSnapshotSchema = z.object({
  businessAccountId: z.string().uuid(),
  snapshotName: z.string().min(1),
  snapshotDescription: z.string().optional(),
  snapshotDate: z.string().datetime(),
  snapshotPeriodStart: z.string().date(),
  snapshotPeriodEnd: z.string().date(),
  ifrsStatementId: z.string().uuid().optional(),
  gaapStatementId: z.string().uuid().optional(),
  reconciliationId: z.string().uuid().optional(),
  snapshotData: z.record(z.any()).default({}),
  includesReconciliation: z.boolean().default(true),
  includesSourceData: z.boolean().default(true),
  retentionPeriodDays: z.number().default(2555),
  createdBy: z.string().uuid()
});

export interface IFRSFinancialStatement {
  id: string;
  businessAccountId: string;
  statementType: string;
  statementPeriodStart: Date;
  statementPeriodEnd: Date;
  ifrsStandard: string;
  currency: string;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  otherIncome: number;
  netIncome: number;
  totalAssets: number;
  currentAssets: number;
  nonCurrentAssets: number;
  totalLiabilities: number;
  currentLiabilities: number;
  nonCurrentLiabilities: number;
  equity: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  statementData: any;
  calculationMethodology: any;
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GAAPFinancialStatement {
  id: string;
  businessAccountId: string;
  statementType: string;
  statementPeriodStart: Date;
  statementPeriodEnd: Date;
  gaapStandard: string;
  currency: string;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  otherIncome: number;
  netIncome: number;
  totalAssets: number;
  currentAssets: number;
  nonCurrentAssets: number;
  totalLiabilities: number;
  currentLiabilities: number;
  nonCurrentLiabilities: number;
  equity: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  statementData: any;
  calculationMethodology: any;
  status: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DualSnapshot {
  id: string;
  businessAccountId: string;
  snapshotName: string;
  snapshotDescription?: string;
  snapshotDate: Date;
  snapshotPeriodStart: Date;
  snapshotPeriodEnd: Date;
  ifrsStatementId?: string;
  gaapStatementId?: string;
  reconciliationId?: string;
  snapshotData: any;
  includesReconciliation: boolean;
  includesSourceData: boolean;
  isReadOnly: boolean;
  isImmutable: boolean;
  retentionPeriodDays: number;
  accessCount: number;
  lastAccessed?: Date;
  createdBy: string;
  createdAt: Date;
}

export class FinancialStatementEngine {
  // IFRS Financial Statement Generation
  async generateIFRSStatement(data: z.infer<typeof IFRSFinancialStatementSchema>): Promise<IFRSFinancialStatement> {
    const validated = IFRSFinancialStatementSchema.parse(data);
    
    // Calculate statement based on IFRS transactions
    const calculatedData = await this.calculateIFRSStatementData(
      validated.businessAccountId,
      validated.statementPeriodStart,
      validated.statementPeriodEnd,
      validated.statementType,
      validated.currency
    );
    
    const statementId = uuidv4();
    
    await prisma.$queryRaw`
      INSERT INTO ifrs_financial_statements (
        id,
        business_account_id,
        statement_type,
        statement_period_start,
        statement_period_end,
        ifrs_standard,
        currency,
        revenue,
        cost_of_sales,
        gross_profit,
        operating_expenses,
        operating_income,
        other_income,
        net_income,
        total_assets,
        current_assets,
        non_current_assets,
        total_liabilities,
        current_liabilities,
        non_current_liabilities,
        equity,
        operating_cash_flow,
        investing_cash_flow,
        financing_cash_flow,
        net_cash_flow,
        statement_data,
        calculation_methodology,
        status,
        created_by
      ) VALUES (
        ${statementId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.statementType}::varchar,
        ${validated.statementPeriodStart}::date,
        ${validated.statementPeriodEnd}::date,
        ${validated.ifrsStandard}::varchar,
        ${validated.currency}::varchar,
        ${calculatedData.revenue}::decimal,
        ${calculatedData.costOfSales}::decimal,
        ${calculatedData.grossProfit}::decimal,
        ${calculatedData.operatingExpenses}::decimal,
        ${calculatedData.operatingIncome}::decimal,
        ${calculatedData.otherIncome}::decimal,
        ${calculatedData.netIncome}::decimal,
        ${calculatedData.totalAssets}::decimal,
        ${calculatedData.currentAssets}::decimal,
        ${calculatedData.nonCurrentAssets}::decimal,
        ${calculatedData.totalLiabilities}::decimal,
        ${calculatedData.currentLiabilities}::decimal,
        ${calculatedData.nonCurrentLiabilities}::decimal,
        ${calculatedData.equity}::decimal,
        ${calculatedData.operatingCashFlow}::decimal,
        ${calculatedData.investingCashFlow}::decimal,
        ${calculatedData.financingCashFlow}::decimal,
        ${calculatedData.netCashFlow}::decimal,
        ${JSON.stringify(calculatedData.statementData)}::jsonb,
        ${JSON.stringify(calculatedData.calculationMethodology)}::jsonb,
        'draft'::varchar,
        ${validated.createdBy}::uuid
      )
    `;
    
    return this.getIFRSStatement(statementId);
  }

  async getIFRSStatement(statementId: string): Promise<IFRSFinancialStatement> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        statement_type as "statementType",
        statement_period_start as "statementPeriodStart",
        statement_period_end as "statementPeriodEnd",
        ifrs_standard as "ifrsStandard",
        currency,
        revenue,
        cost_of_sales as "costOfSales",
        gross_profit as "grossProfit",
        operating_expenses as "operatingExpenses",
        operating_income as "operatingIncome",
        other_income as "otherIncome",
        net_income as "netIncome",
        total_assets as "totalAssets",
        current_assets as "currentAssets",
        non_current_assets as "nonCurrentAssets",
        total_liabilities as "totalLiabilities",
        current_liabilities as "currentLiabilities",
        non_current_liabilities as "nonCurrentLiabilities",
        equity,
        operating_cash_flow as "operatingCashFlow",
        investing_cash_flow as "investingCashFlow",
        financing_cash_flow as "financingCashFlow",
        net_cash_flow as "netCashFlow",
        statement_data as "statementData",
        calculation_methodology as "calculationMethodology",
        status,
        approved_by as "approvedBy",
        approved_at as "approvedAt",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ifrs_financial_statements
      WHERE id = ${statementId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getIFRSStatements(businessAccountId: string, filters: {
    statementType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<IFRSFinancialStatement[]> {
    const { statementType, status, startDate, endDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        statement_type as "statementType",
        statement_period_start as "statementPeriodStart",
        statement_period_end as "statementPeriodEnd",
        ifrs_standard as "ifrsStandard",
        currency,
        revenue,
        cost_of_sales as "costOfSales",
        gross_profit as "grossProfit",
        operating_expenses as "operatingExpenses",
        operating_income as "operatingIncome",
        other_income as "otherIncome",
        net_income as "netIncome",
        total_assets as "totalAssets",
        current_assets as "currentAssets",
        non_current_assets as "nonCurrentAssets",
        total_liabilities as "totalLiabilities",
        current_liabilities as "currentLiabilities",
        non_current_liabilities as "nonCurrentLiabilities",
        equity,
        operating_cash_flow as "operatingCashFlow",
        investing_cash_flow as "investingCashFlow",
        financing_cash_flow as "financingCashFlow",
        net_cash_flow as "netCashFlow",
        statement_data as "statementData",
        calculation_methodology as "calculationMethodology",
        status,
        approved_by as "approvedBy",
        approved_at as "approvedAt",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ifrs_financial_statements
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (statementType) {
      query += ` AND statement_type = '${statementType}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (startDate) {
      query += ` AND statement_period_start >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND statement_period_end <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY statement_period_start DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as IFRSFinancialStatement[];
  }

  // GAAP Financial Statement Generation
  async generateGAAPStatement(data: z.infer<typeof GAAPFinancialStatementSchema>): Promise<GAAPFinancialStatement> {
    const validated = GAAPFinancialStatementSchema.parse(data);
    
    // Calculate statement based on GAAP transactions
    const calculatedData = await this.calculateGAAPStatementData(
      validated.businessAccountId,
      validated.statementPeriodStart,
      validated.statementPeriodEnd,
      validated.statementType,
      validated.currency
    );
    
    const statementId = uuidv4();
    
    await prisma.$queryRaw`
      INSERT INTO gaap_financial_statements (
        id,
        business_account_id,
        statement_type,
        statement_period_start,
        statement_period_end,
        gaap_standard,
        currency,
        revenue,
        cost_of_sales,
        gross_profit,
        operating_expenses,
        operating_income,
        other_income,
        net_income,
        total_assets,
        current_assets,
        non_current_assets,
        total_liabilities,
        current_liabilities,
        non_current_liabilities,
        equity,
        operating_cash_flow,
        investing_cash_flow,
        financing_cash_flow,
        net_cash_flow,
        statement_data,
        calculation_methodology,
        status,
        created_by
      ) VALUES (
        ${statementId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.statementType}::varchar,
        ${validated.statementPeriodStart}::date,
        ${validated.statementPeriodEnd}::date,
        ${validated.gapStandard}::varchar,
        ${validated.currency}::varchar,
        ${calculatedData.revenue}::decimal,
        ${calculatedData.costOfSales}::decimal,
        ${calculatedData.grossProfit}::decimal,
        ${calculatedData.operatingExpenses}::decimal,
        ${calculatedData.operatingIncome}::decimal,
        ${calculatedData.otherIncome}::decimal,
        ${calculatedData.netIncome}::decimal,
        ${calculatedData.totalAssets}::decimal,
        ${calculatedData.currentAssets}::decimal,
        ${calculatedData.nonCurrentAssets}::decimal,
        ${calculatedData.totalLiabilities}::decimal,
        ${calculatedData.currentLiabilities}::decimal,
        ${calculatedData.nonCurrentLiabilities}::decimal,
        ${calculatedData.equity}::decimal,
        ${calculatedData.operatingCashFlow}::decimal,
        ${calculatedData.investingCashFlow}::decimal,
        ${calculatedData.financingCashFlow}::decimal,
        ${calculatedData.netCashFlow}::decimal,
        ${JSON.stringify(calculatedData.statementData)}::jsonb,
        ${JSON.stringify(calculatedData.calculationMethodology)}::jsonb,
        'draft'::varchar,
        ${validated.createdBy}::uuid
      )
    `;
    
    return this.getGAAPStatement(statementId);
  }

  async getGAAPStatement(statementId: string): Promise<GAAPFinancialStatement> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        statement_type as "statementType",
        statement_period_start as "statementPeriodStart",
        statement_period_end as "statementPeriodEnd",
        gaap_standard as "gaapStandard",
        currency,
        revenue,
        cost_of_sales as "costOfSales",
        gross_profit as "grossProfit",
        operating_expenses as "operatingExpenses",
        operating_income as "operatingIncome",
        other_income as "otherIncome",
        net_income as "netIncome",
        total_assets as "totalAssets",
        current_assets as "currentAssets",
        non_current_assets as "nonCurrentAssets",
        total_liabilities as "totalLiabilities",
        current_liabilities as "currentLiabilities",
        non_current_liabilities as "nonCurrentLiabilities",
        equity,
        operating_cash_flow as "operatingCashFlow",
        investing_cash_flow as "investingCashFlow",
        financing_cash_flow as "financingCashFlow",
        net_cash_flow as "netCashFlow",
        statement_data as "statementData",
        calculation_methodology as "calculationMethodology",
        status,
        approved_by as "approvedBy",
        approved_at as "approvedAt",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM gaap_financial_statements
      WHERE id = ${statementId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getGAAPStatements(businessAccountId: string, filters: {
    statementType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<GAAPFinancialStatement[]> {
    const { statementType, status, startDate, endDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        statement_type as "statementType",
        statement_period_start as "statementPeriodStart",
        statement_period_end as "statementPeriodEnd",
        gaap_standard as "gaapStandard",
        currency,
        revenue,
        cost_of_sales as "costOfSales",
        gross_profit as "grossProfit",
        operating_expenses as "operatingExpenses",
        operating_income as "operatingIncome",
        other_income as "otherIncome",
        net_income as "netIncome",
        total_assets as "totalAssets",
        current_assets as "currentAssets",
        non_current_assets as "nonCurrentAssets",
        total_liabilities as "totalLiabilities",
        current_liabilities as "currentLiabilities",
        non_current_liabilities as "nonCurrentLiabilities",
        equity,
        operating_cash_flow as "operatingCashFlow",
        investing_cash_flow as "investingCashFlow",
        financing_cash_flow as "financingCashFlow",
        net_cash_flow as "netCashFlow",
        statement_data as "statementData",
        calculation_methodology as "calculationMethodology",
        status,
        approved_by as "approvedBy",
        approved_at as "approvedAt",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM gaap_financial_statements
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (statementType) {
      query += ` AND statement_type = '${statementType}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (startDate) {
      query += ` AND statement_period_start >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND statement_period_end <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY statement_period_start DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as GAAPFinancialStatement[];
  }

  // Dual Snapshot Management
  async createDualSnapshot(data: z.infer<typeof DualSnapshotSchema>): Promise<DualSnapshot> {
    const validated = DualSnapshotSchema.parse(data);
    
    const snapshotId = uuidv4();
    
    await prisma.$queryRaw`
      INSERT INTO dual_statement_snapshots (
        id,
        business_account_id,
        snapshot_name,
        snapshot_description,
        snapshot_date,
        snapshot_period_start,
        snapshot_period_end,
        ifrs_statement_id,
        gaap_statement_id,
        reconciliation_id,
        snapshot_data,
        includes_reconciliation,
        includes_source_data,
        retention_period_days,
        created_by
      ) VALUES (
        ${snapshotId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.snapshotName}::varchar,
        ${validated.snapshotDescription || null}::text,
        ${validated.snapshotDate}::timestamp,
        ${validated.snapshotPeriodStart}::date,
        ${validated.snapshotPeriodEnd}::date,
        ${validated.ifrsStatementId || null}::uuid,
        ${validated.gapStatementId || null}::uuid,
        ${validated.reconciliationId || null}::uuid,
        ${JSON.stringify(validated.snapshotData)}::jsonb,
        ${validated.includesReconciliation}::boolean,
        ${validated.includesSourceData}::boolean,
        ${validated.retentionPeriodDays}::integer,
        ${validated.createdBy}::uuid
      )
    `;
    
    return this.getDualSnapshot(snapshotId);
  }

  async getDualSnapshot(snapshotId: string): Promise<DualSnapshot> {
    // Increment access count
    await prisma.$queryRaw`
      UPDATE dual_statement_snapshots
      SET access_count = access_count + 1,
          last_accessed = CURRENT_TIMESTAMP
      WHERE id = ${snapshotId}::uuid
    `;
    
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_date as "snapshotDate",
        snapshot_period_start as "snapshotPeriodStart",
        snapshot_period_end as "snapshotPeriodEnd",
        ifrs_statement_id as "ifrsStatementId",
        gaap_statement_id as "gaapStatementId",
        reconciliation_id as "reconciliationId",
        snapshot_data as "snapshotData",
        includes_reconciliation as "includesReconciliation",
        includes_source_data as "includesSourceData",
        is_read_only as "isReadOnly",
        is_immutable as "isImmutable",
        retention_period_days as "retentionPeriodDays",
        access_count as "accessCount",
        last_accessed as "lastAccessed",
        created_by as "createdBy",
        created_at as "createdAt"
      FROM dual_statement_snapshots
      WHERE id = ${snapshotId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getDualSnapshots(businessAccountId: string, filters: {
    snapshotType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<DualSnapshot[]> {
    const { snapshotType, startDate, endDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_date as "snapshotDate",
        snapshot_period_start as "snapshotPeriodStart",
        snapshot_period_end as "snapshotPeriodEnd",
        ifrs_statement_id as "ifrsStatementId",
        gaap_statement_id as "gaapStatementId",
        reconciliation_id as "reconciliationId",
        snapshot_data as "snapshotData",
        includes_reconciliation as "includesReconciliation",
        includes_source_data as "includesSourceData",
        is_read_only as "isReadOnly",
        is_immutable as "isImmutable",
        retention_period_days as "retentionPeriodDays",
        access_count as "accessCount",
        last_accessed as "lastAccessed",
        created_by as "createdBy",
        created_at as "createdAt"
      FROM dual_statement_snapshots
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (startDate) {
      query += ` AND snapshot_period_start >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND snapshot_period_end <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY snapshot_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as DualSnapshot[];
  }

  // Private calculation methods
  private async calculateIFRSStatementData(
    businessAccountId: string,
    periodStart: string,
    periodEnd: string,
    statementType: string,
    currency: string
  ): Promise<any> {
    // Get IFRS transactions for the period
    const transactions = await prisma.$queryRaw`
      SELECT 
        ifrs_category,
        SUM(amount) as total_amount,
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
      FROM ifrs_transactions
      WHERE business_account_id = ${businessAccountId}::uuid
        AND transaction_date >= ${periodStart}::date
        AND transaction_date <= ${periodEnd}::date
        AND currency = ${currency}
      GROUP BY ifrs_category
    `;
    
    const data: any = {
      revenue: 0,
      costOfSales: 0,
      grossProfit: 0,
      operatingExpenses: 0,
      operatingIncome: 0,
      otherIncome: 0,
      netIncome: 0,
      totalAssets: 0,
      currentAssets: 0,
      nonCurrentAssets: 0,
      totalLiabilities: 0,
      currentLiabilities: 0,
      nonCurrentLiabilities: 0,
      equity: 0,
      operatingCashFlow: 0,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashFlow: 0,
      statementData: {},
      calculationMethodology: {
        standard: 'IFRS',
        period: `${periodStart} to ${periodEnd}`,
        currency: currency,
        calculationRules: []
      }
    };
    
    // Aggregate by category
    for (const transaction of transactions as any[]) {
      const category = transaction.ifrs_category?.toLowerCase() || 'other';
      const amount = parseFloat(transaction.total_amount) || 0;
      
      switch (category) {
        case 'revenue':
          data.revenue += amount;
          break;
        case 'expense':
        case 'cost_of_sales':
          data.costOfSales += amount;
          break;
        case 'asset':
          data.totalAssets += amount;
          if (category.includes('current')) data.currentAssets += amount;
          else data.nonCurrentAssets += amount;
          break;
        case 'liability':
          data.totalLiabilities += amount;
          if (category.includes('current')) data.currentLiabilities += amount;
          else data.nonCurrentLiabilities += amount;
          break;
        case 'equity':
          data.equity += amount;
          break;
      }
    }
    
    // Calculate derived values
    data.grossProfit = data.revenue - data.costOfSales;
    data.operatingIncome = data.grossProfit - data.operatingExpenses;
    data.netIncome = data.operatingIncome + data.otherIncome;
    
    return data;
  }

  private async calculateGAAPStatementData(
    businessAccountId: string,
    periodStart: string,
    periodEnd: string,
    statementType: string,
    currency: string
  ): Promise<any> {
    // Get GAAP transactions for the period
    const transactions = await prisma.$queryRaw`
      SELECT 
        gaap_category,
        SUM(amount) as total_amount,
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit
      FROM gaap_transactions
      WHERE business_account_id = ${businessAccountId}::uuid
        AND transaction_date >= ${periodStart}::date
        AND transaction_date <= ${periodEnd}::date
        AND currency = ${currency}
      GROUP BY gaap_category
    `;
    
    const data: any = {
      revenue: 0,
      costOfSales: 0,
      grossProfit: 0,
      operatingExpenses: 0,
      operatingIncome: 0,
      otherIncome: 0,
      netIncome: 0,
      totalAssets: 0,
      currentAssets: 0,
      nonCurrentAssets: 0,
      totalLiabilities: 0,
      currentLiabilities: 0,
      nonCurrentLiabilities: 0,
      equity: 0,
      operatingCashFlow: 0,
      investingCashFlow: 0,
      financingCashFlow: 0,
      netCashFlow: 0,
      statementData: {},
      calculationMethodology: {
        standard: 'GAAP',
        period: `${periodStart} to ${periodEnd}`,
        currency: currency,
        calculationRules: []
      }
    };
    
    // Aggregate by category
    for (const transaction of transactions as any[]) {
      const category = transaction.gaap_category?.toLowerCase() || 'other';
      const amount = parseFloat(transaction.total_amount) || 0;
      
      switch (category) {
        case 'revenue':
          data.revenue += amount;
          break;
        case 'expense':
        case 'cost_of_sales':
          data.costOfSales += amount;
          break;
        case 'asset':
          data.totalAssets += amount;
          if (category.includes('current')) data.currentAssets += amount;
          else data.nonCurrentAssets += amount;
          break;
        case 'liability':
          data.totalLiabilities += amount;
          if (category.includes('current')) data.currentLiabilities += amount;
          else data.nonCurrentLiabilities += amount;
          break;
        case 'equity':
          data.equity += amount;
          break;
      }
    }
    
    // Calculate derived values
    data.grossProfit = data.revenue - data.costOfSales;
    data.operatingIncome = data.grossProfit - data.operatingExpenses;
    data.netIncome = data.operatingIncome + data.otherIncome;
    
    return data;
  }
}
