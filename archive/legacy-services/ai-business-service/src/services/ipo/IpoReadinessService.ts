import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const IpoReadinessSnapshotSchema = z.object({
  businessAccountId: z.string().uuid(),
  snapshotName: z.string().min(1).max(200),
  snapshotDescription: z.string().optional(),
  snapshotPeriodStart: z.string().datetime(),
  snapshotPeriodEnd: z.string().datetime(),
  reportingPeriodType: z.enum(['quarterly', 'annual', 'interim']),
  fiscalYear: z.number().min(2000).max(2100),
  fiscalQuarter: z.number().min(1).max(4).optional(),
  currency: z.string().default('USD'),
  exchangeRate: z.number().default(1.0),
  status: z.enum(['draft', 'review', 'final', 'archived']).default('draft'),
  createdBy: z.string().uuid()
});

const PublicFinancialStatementSchema = z.object({
  snapshotId: z.string().uuid(),
  statementType: z.enum(['income_statement', 'balance_sheet', 'cash_flow', 'equity_statement']),
  reportingStandard: z.enum(['IFRS', 'US_GAAP', 'LOCAL_GAAP']).default('IFRS'),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  currency: z.string().default('USD'),
  revenue: z.number().optional(),
  costOfGoodsSold: z.number().optional(),
  grossProfit: z.number().optional(),
  operatingExpenses: z.number().optional(),
  operatingIncome: z.number().optional(),
  interestExpense: z.number().optional(),
  interestIncome: z.number().optional(),
  otherIncomeExpense: z.number().optional(),
  profitBeforeTax: z.number().optional(),
  taxExpense: z.number().optional(),
  netIncome: z.number().optional(),
  earningsPerShareBasic: z.number().optional(),
  earningsPerShareDiluted: z.number().optional(),
  cashAndEquivalents: z.number().optional(),
  accountsReceivable: z.number().optional(),
  inventory: z.number().optional(),
  otherCurrentAssets: z.number().optional(),
  totalCurrentAssets: z.number().optional(),
  propertyPlantEquipment: z.number().optional(),
  intangibleAssets: z.number().optional(),
  otherNonCurrentAssets: z.number().optional(),
  totalAssets: z.number().optional(),
  accountsPayable: z.number().optional(),
  shortTermDebt: z.number().optional(),
  otherCurrentLiabilities: z.number().optional(),
  totalCurrentLiabilities: z.number().optional(),
  longTermDebt: z.number().optional(),
  otherNonCurrentLiabilities: z.number().optional(),
  totalLiabilities: z.number().optional(),
  shareCapital: z.number().optional(),
  retainedEarnings: z.number().optional(),
  otherEquity: z.number().optional(),
  totalEquity: z.number().optional(),
  cashFromOperations: z.number().optional(),
  cashFromInvesting: z.number().optional(),
  cashFromFinancing: z.number().optional(),
  netChangeInCash: z.number().optional(),
  cashBeginingBalance: z.number().optional(),
  cashEndingBalance: z.number().optional(),
  createdBy: z.string().uuid()
});

export interface IpoReadinessSnapshot {
  id: string;
  businessAccountId: string;
  snapshotName: string;
  snapshotDescription?: string;
  snapshotPeriodStart: Date;
  snapshotPeriodEnd: Date;
  reportingPeriodType: string;
  fiscalYear: number;
  fiscalQuarter?: number;
  currency: string;
  exchangeRate: number;
  status: string;
  complianceStatus?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicFinancialStatement {
  id: string;
  snapshotId: string;
  statementType: string;
  reportingStandard: string;
  periodStart: Date;
  periodEnd: Date;
  currency: string;
  revenue?: number;
  costOfGoodsSold?: number;
  grossProfit?: number;
  operatingExpenses?: number;
  operatingIncome?: number;
  interestExpense?: number;
  interestIncome?: number;
  otherIncomeExpense?: number;
  profitBeforeTax?: number;
  taxExpense?: number;
  netIncome?: number;
  earningsPerShareBasic?: number;
  earningsPerShareDiluted?: number;
  cashAndEquivalents?: number;
  accountsReceivable?: number;
  inventory?: number;
  otherCurrentAssets?: number;
  totalCurrentAssets?: number;
  propertyPlantEquipment?: number;
  intangibleAssets?: number;
  otherNonCurrentAssets?: number;
  totalAssets?: number;
  accountsPayable?: number;
  shortTermDebt?: number;
  otherCurrentLiabilities?: number;
  totalCurrentLiabilities?: number;
  longTermDebt?: number;
  otherNonCurrentLiabilities?: number;
  totalLiabilities?: number;
  shareCapital?: number;
  retainedEarnings?: number;
  otherEquity?: number;
  totalEquity?: number;
  cashFromOperations?: number;
  cashFromInvesting?: number;
  cashFromFinancing?: number;
  netChangeInCash?: number;
  cashBeginingBalance?: number;
  cashEndingBalance?: number;
  auditStatus: string;
  auditorNotes?: string;
  complianceNotes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class IpoReadinessService {
  // IPO Readiness Snapshot Management
  async createReadinessSnapshot(data: z.infer<typeof IpoReadinessSnapshotSchema>): Promise<IpoReadinessSnapshot> {
    const validated = IpoReadinessSnapshotSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT generate_ipo_readiness_snapshot(
        ${validated.businessAccountId}::uuid,
        ${validated.snapshotName}::varchar,
        ${validated.snapshotPeriodStart}::date,
        ${validated.snapshotPeriodEnd}::date,
        ${validated.fiscalYear}::integer,
        ${validated.fiscalQuarter || null}::integer,
        ${validated.reportingPeriodType}::varchar,
        ${validated.createdBy}::uuid
      ) as snapshot_id
    `;
    
    const snapshotId = (result as any)[0]?.snapshot_id;
    
    // Update additional fields
    await prisma.$queryRaw`
      UPDATE ipo_readiness_snapshots 
      SET 
        snapshot_description = ${validated.snapshotDescription || null}::text,
        currency = ${validated.currency}::varchar,
        exchange_rate = ${validated.exchangeRate}::decimal,
        status = ${validated.status}::varchar
      WHERE id = ${snapshotId}::uuid
    `;
    
    return this.getReadinessSnapshot(snapshotId);
  }

  async getReadinessSnapshot(snapshotId: string): Promise<IpoReadinessSnapshot> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_period_start as "snapshotPeriodStart",
        snapshot_period_end as "snapshotPeriodEnd",
        reporting_period_type as "reportingPeriodType",
        fiscal_year as "fiscalYear",
        fiscal_quarter as "fiscalQuarter",
        currency,
        exchange_rate as "exchangeRate",
        status,
        compliance_status as "complianceStatus",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ipo_readiness_snapshots
      WHERE id = ${snapshotId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getReadinessSnapshots(businessAccountId: string, filters: {
    status?: string;
    fiscalYear?: number;
    limit?: number;
  } = {}): Promise<IpoReadinessSnapshot[]> {
    const { status, fiscalYear, limit = 20 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_period_start as "snapshotPeriodStart",
        snapshot_period_end as "snapshotPeriodEnd",
        reporting_period_type as "reportingPeriodType",
        fiscal_year as "fiscalYear",
        fiscal_quarter as "fiscalQuarter",
        currency,
        exchange_rate as "exchangeRate",
        status,
        compliance_status as "complianceStatus",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM ipo_readiness_snapshots
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (fiscalYear) {
      query += ` AND fiscal_year = ${fiscalYear}`;
    }
    
    query += ` ORDER BY fiscal_year DESC, created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as IpoReadinessSnapshot[];
  }

  // Public Financial Statements Management
  async createPublicFinancialStatement(data: z.infer<typeof PublicFinancialStatementSchema>): Promise<PublicFinancialStatement> {
    const validated = PublicFinancialStatementSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_public_financial_statement(
        ${validated.snapshotId}::uuid,
        ${validated.statementType}::varchar,
        ${validated.reportingStandard}::varchar,
        ${validated.periodStart}::date,
        ${validated.periodEnd}::date,
        ${validated.currency}::varchar,
        ${validated.revenue || null}::decimal,
        ${validated.netIncome || null}::decimal,
        ${validated.totalAssets || null}::decimal,
        ${validated.totalEquity || null}::decimal,
        ${validated.createdBy}::uuid
      ) as statement_id
    `;
    
    const statementId = (result as any)[0]?.statement_id;
    
    // Update additional fields
    await prisma.$queryRaw`
      UPDATE public_financial_statements 
      SET 
        cost_of_goods_sold = ${validated.costOfGoodsSold || null}::decimal,
        gross_profit = ${validated.grossProfit || null}::decimal,
        operating_expenses = ${validated.operatingExpenses || null}::decimal,
        operating_income = ${validated.operatingIncome || null}::decimal,
        interest_expense = ${validated.interestExpense || null}::decimal,
        interest_income = ${validated.interestIncome || null}::decimal,
        other_income_expense = ${validated.otherIncomeExpense || null}::decimal,
        profit_before_tax = ${validated.profitBeforeTax || null}::decimal,
        tax_expense = ${validated.taxExpense || null}::decimal,
        earnings_per_share_basic = ${validated.earningsPerShareBasic || null}::decimal,
        earnings_per_share_diluted = ${validated.earningsPerShareDiluted || null}::decimal,
        cash_and_equivalents = ${validated.cashAndEquivalents || null}::decimal,
        accounts_receivable = ${validated.accountsReceivable || null}::decimal,
        inventory = ${validated.inventory || null}::decimal,
        other_current_assets = ${validated.otherCurrentAssets || null}::decimal,
        total_current_assets = ${validated.totalCurrentAssets || null}::decimal,
        property_plant_equipment = ${validated.propertyPlantEquipment || null}::decimal,
        intangible_assets = ${validated.intangibleAssets || null}::decimal,
        other_non_current_assets = ${validated.otherNonCurrentAssets || null}::decimal,
        accounts_payable = ${validated.accountsPayable || null}::decimal,
        short_term_debt = ${validated.shortTermDebt || null}::decimal,
        other_current_liabilities = ${validated.otherCurrentLiabilities || null}::decimal,
        total_current_liabilities = ${validated.totalCurrentLiabilities || null}::decimal,
        long_term_debt = ${validated.longTermDebt || null}::decimal,
        other_non_current_liabilities = ${validated.otherNonCurrentLiabilities || null}::decimal,
        share_capital = ${validated.shareCapital || null}::decimal,
        retained_earnings = ${validated.retainedEarnings || null}::decimal,
        other_equity = ${validated.otherEquity || null}::decimal,
        cash_from_operations = ${validated.cashFromOperations || null}::decimal,
        cash_from_investing = ${validated.cashFromInvesting || null}::decimal,
        cash_from_financing = ${validated.cashFromFinancing || null}::decimal,
        net_change_in_cash = ${validated.netChangeInCash || null}::decimal,
        cash_begining_balance = ${validated.cashBeginingBalance || null}::decimal,
        cash_ending_balance = ${validated.cashEndingBalance || null}::decimal
      WHERE id = ${statementId}::uuid
    `;
    
    return this.getPublicFinancialStatement(statementId);
  }

  async getPublicFinancialStatement(statementId: string): Promise<PublicFinancialStatement> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        statement_type as "statementType",
        reporting_standard as "reportingStandard",
        period_start as "periodStart",
        period_end as "periodEnd",
        currency,
        revenue,
        cost_of_goods_sold as "costOfGoodsSold",
        gross_profit as "grossProfit",
        operating_expenses as "operatingExpenses",
        operating_income as "operatingIncome",
        interest_expense as "interestExpense",
        interest_income as "interestIncome",
        other_income_expense as "otherIncomeExpense",
        profit_before_tax as "profitBeforeTax",
        tax_expense as "taxExpense",
        net_income as "netIncome",
        earnings_per_share_basic as "earningsPerShareBasic",
        earnings_per_share_diluted as "earningsPerShareDiluted",
        cash_and_equivalents as "cashAndEquivalents",
        accounts_receivable as "accountsReceivable",
        inventory,
        other_current_assets as "otherCurrentAssets",
        total_current_assets as "totalCurrentAssets",
        property_plant_equipment as "propertyPlantEquipment",
        intangible_assets as "intangibleAssets",
        other_non_current_assets as "otherNonCurrentAssets",
        total_assets as "totalAssets",
        accounts_payable as "accountsPayable",
        short_term_debt as "shortTermDebt",
        other_current_liabilities as "otherCurrentLiabilities",
        total_current_liabilities as "totalCurrentLiabilities",
        long_term_debt as "longTermDebt",
        other_non_current_liabilities as "otherNonCurrentLiabilities",
        total_liabilities as "totalLiabilities",
        share_capital as "shareCapital",
        retained_earnings as "retainedEarnings",
        other_equity as "otherEquity",
        total_equity as "totalEquity",
        cash_from_operations as "cashFromOperations",
        cash_from_investing as "cashFromInvesting",
        cash_from_financing as "cashFromFinancing",
        net_change_in_cash as "netChangeInCash",
        cash_begining_balance as "cashBeginingBalance",
        cash_ending_balance as "cashEndingBalance",
        audit_status as "auditStatus",
        auditor_notes as "auditorNotes",
        compliance_notes as "complianceNotes",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM public_financial_statements
      WHERE id = ${statementId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getPublicFinancialStatements(snapshotId: string): Promise<PublicFinancialStatement[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        statement_type as "statementType",
        reporting_standard as "reportingStandard",
        period_start as "periodStart",
        period_end as "periodEnd",
        currency,
        revenue,
        cost_of_goods_sold as "costOfGoodsSold",
        gross_profit as "grossProfit",
        operating_expenses as "operatingExpenses",
        operating_income as "operatingIncome",
        interest_expense as "interestExpense",
        interest_income as "interestIncome",
        other_income_expense as "otherIncomeExpense",
        profit_before_tax as "profitBeforeTax",
        tax_expense as "taxExpense",
        net_income as "netIncome",
        earnings_per_share_basic as "earningsPerShareBasic",
        earnings_per_share_diluted as "earningsPerShareDiluted",
        cash_and_equivalents as "cashAndEquivalents",
        accounts_receivable as "accountsReceivable",
        inventory,
        other_current_assets as "otherCurrentAssets",
        total_current_assets as "totalCurrentAssets",
        property_plant_equipment as "propertyPlantEquipment",
        intangible_assets as "intangibleAssets",
        other_non_current_assets as "otherNonCurrentAssets",
        total_assets as "totalAssets",
        accounts_payable as "accountsPayable",
        short_term_debt as "shortTermDebt",
        other_current_liabilities as "otherCurrentLiabilities",
        total_current_liabilities as "totalCurrentLiabilities",
        long_term_debt as "longTermDebt",
        other_non_current_liabilities as "otherNonCurrentLiabilities",
        total_liabilities as "totalLiabilities",
        share_capital as "shareCapital",
        retained_earnings as "retainedEarnings",
        other_equity as "otherEquity",
        total_equity as "totalEquity",
        cash_from_operations as "cashFromOperations",
        cash_from_investing as "cashFromInvesting",
        cash_from_financing as "cashFromFinancing",
        net_change_in_cash as "netChangeInCash",
        cash_begining_balance as "cashBeginingBalance",
        cash_ending_balance as "cashEndingBalance",
        audit_status as "auditStatus",
        auditor_notes as "auditorNotes",
        compliance_notes as "complianceNotes",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM public_financial_statements
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY period_start DESC
    `;
    
    return result as PublicFinancialStatement[];
  }

  // Analytics and Summary
  async getReadinessSummary(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM ipo_readiness_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result as any[];
  }

  async getComparativeAnalysis(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM ipo_comparative_analysis
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY comparison_year DESC, comparison_period DESC
    `;
    
    return result as any[];
  }

  async getGovernanceDashboard(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM ipo_governance_dashboard
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY fiscal_year DESC
    `;
    
    return result as any[];
  }

  // Materialized View Refresh
  async refreshIpoAnalytics(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_ipo_materialized_views()`;
  }

  // Activity Logging
  async logActivity(data: {
    businessAccountId: string;
    activityType: string;
    activityDescription: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
    performedBy?: string;
    userRole?: string;
    userEmail?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    activityDurationMs?: number;
    dataVolumeBytes?: number;
    additionalData?: any;
  }): Promise<void> {
    await prisma.$queryRaw`
      INSERT INTO ipo_activity_log (
        id,
        business_account_id,
        activity_type,
        activity_description,
        entity_type,
        entity_id,
        entity_name,
        performed_by,
        user_role,
        user_email,
        session_id,
        ip_address,
        user_agent,
        activity_duration_ms,
        data_volume_bytes,
        additional_data,
        performed_at
      ) VALUES (
        ${uuidv4()}::uuid,
        ${data.businessAccountId}::uuid,
        ${data.activityType}::varchar,
        ${data.activityDescription}::text,
        ${data.entityType || null}::varchar,
        ${data.entityId || null}::uuid,
        ${data.entityName || null}::varchar,
        ${data.performedBy || null}::uuid,
        ${data.userRole || null}::varchar,
        ${data.userEmail || null}::varchar,
        ${data.sessionId || null}::varchar,
        ${data.ipAddress || null}::inet,
        ${data.userAgent || null}::text,
        ${data.activityDurationMs || null}::integer,
        ${data.dataVolumeBytes || null}::integer,
        ${JSON.stringify(data.additionalData || {})}::jsonb,
        CURRENT_TIMESTAMP::timestamp
      )
    `;
  }
}
