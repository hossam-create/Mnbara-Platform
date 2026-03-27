import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const ReconciliationRuleSchema = z.object({
  businessAccountId: z.string().uuid(),
  ruleName: z.string().min(1),
  accountingStandard: z.enum(['IFRS', 'GAAP']),
  ruleType: z.enum(['account_mapping', 'amount_adjustment', 'timing_difference', 'classification']),
  sourceCriteria: z.record(z.any()).default({}),
  targetMapping: z.record(z.any()).default({}),
  transformationLogic: z.string().min(1),
  priority: z.number().default(1),
  effectiveDate: z.string().date(),
  expiryDate: z.string().date().optional(),
  createdBy: z.string().uuid()
});

const MultiEntityConsolidationSchema = z.object({
  businessAccountId: z.string().uuid(),
  consolidationPeriodStart: z.string().date(),
  consolidationPeriodEnd: z.string().date(),
  entityIds: z.array(z.string().uuid()),
  ifrsEntityData: z.record(z.any()).default({}),
  gaapEntityData: z.record(z.any()).default({}),
  consolidationRules: z.record(z.any()).default({}),
  eliminationEntries: z.array(z.any()).default([]),
  currency: z.string().length(3),
  consolidationMethod: z.enum(['full', 'proportionate', 'equity_method']),
  createdBy: z.string().uuid()
});

export interface ReconciliationRule {
  id: string;
  businessAccountId: string;
  ruleName: string;
  accountingStandard: string;
  ruleType: string;
  sourceCriteria: any;
  targetMapping: any;
  transformationLogic: string;
  priority: number;
  isActive: boolean;
  effectiveDate: Date;
  expiryDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultiEntityConsolidation {
  id: string;
  businessAccountId: string;
  consolidationPeriodStart: Date;
  consolidationPeriodEnd: Date;
  entityIds: string[];
  ifrsEntityData: any;
  gaapEntityData: any;
  consolidationRules: any;
  eliminationEntries: any[];
  ifrsConsolidatedTotals: any;
  gaapConsolidatedTotals: any;
  currency: string;
  consolidationMethod: string;
  status: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReconciliationEngine {
  // Reconciliation Rule Management
  async createReconciliationRule(data: z.infer<typeof ReconciliationRuleSchema>): Promise<ReconciliationRule> {
    const validated = ReconciliationRuleSchema.parse(data);
    
    const ruleId = uuidv4();
    
    await prisma.$queryRaw`
      INSERT INTO translation_rules (
        id,
        business_account_id,
        rule_name,
        accounting_standard,
        rule_type,
        source_criteria,
        target_mapping,
        transformation_logic,
        priority,
        effective_date,
        expiry_date,
        created_by
      ) VALUES (
        ${ruleId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.ruleName}::varchar,
        ${validated.accountingStandard}::varchar,
        ${validated.ruleType}::varchar,
        ${JSON.stringify(validated.sourceCriteria)}::jsonb,
        ${JSON.stringify(validated.targetMapping)}::jsonb,
        ${validated.transformationLogic}::text,
        ${validated.priority}::integer,
        ${validated.effectiveDate}::date,
        ${validated.expiryDate || null}::date,
        ${validated.createdBy}::uuid
      )
    `;
    
    return this.getReconciliationRule(ruleId);
  }

  async getReconciliationRule(ruleId: string): Promise<ReconciliationRule> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        rule_name as "ruleName",
        accounting_standard as "accountingStandard",
        rule_type as "ruleType",
        source_criteria as "sourceCriteria",
        target_mapping as "targetMapping",
        transformation_logic as "transformationLogic",
        priority,
        is_active as "isActive",
        effective_date as "effectiveDate",
        expiry_date as "expiryDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM translation_rules
      WHERE id = ${ruleId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getReconciliationRules(businessAccountId: string, filters: {
    accountingStandard?: string;
    ruleType?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<ReconciliationRule[]> {
    const { accountingStandard, ruleType, isActive, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        rule_name as "ruleName",
        accounting_standard as "accountingStandard",
        rule_type as "ruleType",
        source_criteria as "sourceCriteria",
        target_mapping as "targetMapping",
        transformation_logic as "transformationLogic",
        priority,
        is_active as "isActive",
        effective_date as "effectiveDate",
        expiry_date as "expiryDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM translation_rules
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (accountingStandard) {
      query += ` AND accounting_standard = '${accountingStandard}'`;
    }
    
    if (ruleType) {
      query += ` AND rule_type = '${ruleType}'`;
    }
    
    if (isActive !== undefined) {
      query += ` AND is_active = ${isActive}`;
    }
    
    query += ` ORDER BY priority ASC, created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as ReconciliationRule[];
  }

  // Multi-Entity Consolidation
  async createMultiEntityConsolidation(data: z.infer<typeof MultiEntityConsolidationSchema>): Promise<MultiEntityConsolidation> {
    const validated = MultiEntityConsolidationSchema.parse(data);
    
    const consolidationId = uuidv4();
    
    // Calculate consolidated totals
    const ifrsConsolidated = await this.calculateConsolidatedTotals(
      validated.businessAccountId,
      validated.entityIds,
      validated.consolidationPeriodStart,
      validated.consolidationPeriodEnd,
      'IFRS',
      validated.currency,
      validated.consolidationMethod
    );
    
    const gaapConsolidated = await this.calculateConsolidatedTotals(
      validated.businessAccountId,
      validated.entityIds,
      validated.consolidationPeriodStart,
      validated.consolidationPeriodEnd,
      'GAAP',
      validated.currency,
      validated.consolidationMethod
    );
    
    await prisma.$queryRaw`
      INSERT INTO dual_consolidations (
        id,
        business_account_id,
        consolidation_period_start,
        consolidation_period_end,
        entity_ids,
        ifrs_entity_data,
        gaap_entity_data,
        consolidation_rules,
        elimination_entries,
        ifrs_consolidated_totals,
        gaap_consolidated_totals,
        currency,
        consolidation_method,
        status,
        created_by
      ) VALUES (
        ${consolidationId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.consolidationPeriodStart}::date,
        ${validated.consolidationPeriodEnd}::date,
        ${validated.entityIds}::uuid[],
        ${JSON.stringify(validated.ifrsEntityData)}::jsonb,
        ${JSON.stringify(validated.gaapEntityData)}::jsonb,
        ${JSON.stringify(validated.consolidationRules)}::jsonb,
        ${JSON.stringify(validated.eliminationEntries)}::jsonb,
        ${JSON.stringify(ifrsConsolidated)}::jsonb,
        ${JSON.stringify(gaapConsolidated)}::jsonb,
        ${validated.currency}::varchar,
        ${validated.consolidationMethod}::varchar,
        'draft'::varchar,
        ${validated.createdBy}::uuid
      )
    `;
    
    return this.getMultiEntityConsolidation(consolidationId);
  }

  async getMultiEntityConsolidation(consolidationId: string): Promise<MultiEntityConsolidation> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        consolidation_period_start as "consolidationPeriodStart",
        consolidation_period_end as "consolidationPeriodEnd",
        entity_ids as "entityIds",
        ifrs_entity_data as "ifrsEntityData",
        gaap_entity_data as "gaapEntityData",
        consolidation_rules as "consolidationRules",
        elimination_entries as "eliminationEntries",
        ifrs_consolidated_totals as "ifrsConsolidatedTotals",
        gaap_consolidated_totals as "gaapConsolidatedTotals",
        currency,
        consolidation_method as "consolidationMethod",
        status,
        reviewed_by as "reviewedBy",
        reviewed_at as "reviewedAt",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM dual_consolidations
      WHERE id = ${consolidationId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getMultiEntityConsolidations(businessAccountId: string, filters: {
    consolidationMethod?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<MultiEntityConsolidation[]> {
    const { consolidationMethod, status, startDate, endDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        consolidation_period_start as "consolidationPeriodStart",
        consolidation_period_end as "consolidationPeriodEnd",
        entity_ids as "entityIds",
        ifrs_entity_data as "ifrsEntityData",
        gaap_entity_data as "gaapEntityData",
        consolidation_rules as "consolidationRules",
        elimination_entries as "eliminationEntries",
        ifrs_consolidated_totals as "ifrsConsolidatedTotals",
        gaap_consolidated_totals as "gaapConsolidatedTotals",
        currency,
        consolidation_method as "consolidationMethod",
        status,
        reviewed_by as "reviewedBy",
        reviewed_at as "reviewedAt",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM dual_consolidations
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (consolidationMethod) {
      query += ` AND consolidation_method = '${consolidationMethod}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (startDate) {
      query += ` AND consolidation_period_start >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND consolidation_period_end <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY consolidation_period_start DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as MultiEntityConsolidation[];
  }

  // Advanced Reconciliation Methods
  async performAutoReconciliation(
    businessAccountId: string,
    periodStart: string,
    periodEnd: string,
    createdBy: string
  ): Promise<{ ifrsVsGaap: any; ifrsVsSource: any; gaapVsSource: any }> {
    const results = {
      ifrsVsGaap: null,
      ifrsVsSource: null,
      gaapVsSource: null
    };
    
    // Perform IFRS vs GAAP reconciliation
    results.ifrsVsGaap = await this.reconcileStandards(
      businessAccountId,
      periodStart,
      periodEnd,
      'ifrs_vs_gaap',
      createdBy
    );
    
    // Perform IFRS vs Source reconciliation
    results.ifrsVsSource = await this.reconcileStandards(
      businessAccountId,
      periodStart,
      periodEnd,
      'ifrs_vs_source',
      createdBy
    );
    
    // Perform GAAP vs Source reconciliation
    results.gaapVsSource = await this.reconcileStandards(
      businessAccountId,
      periodStart,
      periodEnd,
      'gaap_vs_source',
      createdBy
    );
    
    return results;
  }

  private async reconcileStandards(
    businessAccountId: string,
    periodStart: string,
    periodEnd: string,
    reconciliationType: string,
    createdBy: string
  ): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT reconcile_standards(
        ${businessAccountId}::uuid,
        ${periodStart}::date,
        ${periodEnd}::date,
        ${reconciliationType}::varchar,
        ${createdBy}::uuid
      ) as reconciliation_id
    `;
    
    const reconciliationId = (result as any)[0]?.reconciliation_id;
    
    return prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        reconciliation_period_start as "reconciliationPeriodStart",
        reconciliation_period_end as "reconciliationPeriodEnd",
        reconciliation_type as "reconciliationType",
        ifrs_total as "ifrsTotal",
        gaap_total as "gaapTotal",
        source_total as "sourceTotal",
        ifrs_vs_gaap_variance as "ifrsVsGaapVariance",
        ifrs_vs_source_variance as "ifrsVsSourceVariance",
        gaap_vs_source_variance as "gaapVsSourceVariance",
        variance_percentage as "variancePercentage",
        reconciliation_status as "reconciliationStatus",
        reconciliation_details as "reconciliationDetails",
        affected_accounts as "affectedAccounts",
        auto_reconciled as "autoReconciled",
        manual_adjustments as "manualAdjustments",
        reviewed_by as "reviewedBy",
        reviewed_at as "reviewedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM standard_reconciliations
      WHERE id = ${reconciliationId}::uuid
    `;
  }

  private async calculateConsolidatedTotals(
    businessAccountId: string,
    entityIds: string[],
    periodStart: string,
    periodEnd: string,
    standard: 'IFRS' | 'GAAP',
    currency: string,
    consolidationMethod: string
  ): Promise<any> {
    const tableName = standard === 'IFRS' ? 'ifrs_transactions' : 'gaap_transactions';
    const standardField = standard === 'IFRS' ? 'ifrs_category' : 'gaap_category';
    
    let query = `
      SELECT 
        ${standardField} as category,
        SUM(amount) as total_amount,
        SUM(debit_amount) as total_debit,
        SUM(credit_amount) as total_credit,
        COUNT(*) as transaction_count
      FROM ${tableName}
      WHERE business_account_id = ${businessAccountId}::uuid
        AND transaction_date >= ${periodStart}::date
        AND transaction_date <= ${periodEnd}::date
        AND currency = ${currency}
    `;
    
    if (entityIds.length > 0) {
      query += ` AND source_transaction_id IN (
        SELECT id FROM journal_entries 
        WHERE business_account_id = ANY(${entityIds}::uuid[])
      )`;
    }
    
    query += ` GROUP BY ${standardField}`;
    
    const results = await prisma.$queryRawUnsafe(query);
    
    // Aggregate totals by category
    const totals: any = {
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
      transactionCount: 0,
      consolidationMethod: consolidationMethod,
      entities: entityIds.length
    };
    
    for (const row of results as any[]) {
      const category = (row.category || '').toLowerCase();
      const amount = parseFloat(row.total_amount) || 0;
      totals.transactionCount += parseInt(row.transaction_count) || 0;
      
      switch (category) {
        case 'revenue':
          totals.revenue += amount;
          break;
        case 'expense':
        case 'cost_of_sales':
          totals.costOfSales += amount;
          break;
        case 'asset':
          totals.totalAssets += amount;
          if (category.includes('current')) totals.currentAssets += amount;
          else totals.nonCurrentAssets += amount;
          break;
        case 'liability':
          totals.totalLiabilities += amount;
          if (category.includes('current')) totals.currentLiabilities += amount;
          else totals.nonCurrentLiabilities += amount;
          break;
        case 'equity':
          totals.equity += amount;
          break;
      }
    }
    
    // Calculate derived values
    totals.grossProfit = totals.revenue - totals.costOfSales;
    totals.operatingIncome = totals.grossProfit - totals.operatingExpenses;
    totals.netIncome = totals.operatingIncome + totals.otherIncome;
    
    return totals;
  }

  // Analytics and Reporting
  async getReconciliationAnalytics(businessAccountId: string, language: 'en' | 'ar' = 'en'): Promise<any> {
    const varianceAnalysis = await prisma.$queryRaw`
      SELECT * FROM reconciliation_variance_analysis
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    const statementComparison = await prisma.$queryRaw`
      SELECT * FROM dual_statement_comparison
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY snapshot_period_start DESC
      LIMIT 10
    `;
    
    return {
      varianceAnalysis: varianceAnalysis || [],
      statementComparison: statementComparison || [],
      summary: language === 'ar' ? {
        title: 'تحليل المصالحة',
        generatedAt: new Date().toISOString(),
        recommendations: this.generateReconciliationRecommendations(varianceAnalysis as any[], language)
      } : {
        title: 'Reconciliation Analytics',
        generatedAt: new Date().toISOString(),
        recommendations: this.generateReconciliationRecommendations(varianceAnalysis as any[], language)
      }
    };
  }

  private generateReconciliationRecommendations(varianceAnalysis: any[], language: 'en' | 'ar'): string[] {
    const recommendations = [];
    
    if (varianceAnalysis.length === 0) {
      recommendations.push(language === 'ar' ? 
        'ابدأ بإجراء مصالحات لتحليل التباينات' : 
        'Start performing reconciliations to analyze variances'
      );
      return recommendations;
    }
    
    for (const analysis of varianceAnalysis) {
      const avgVariance = parseFloat(analysis.avg_variance_percentage) || 0;
      
      if (avgVariance > 5) {
        recommendations.push(language === 'ar' ? 
          `تباين عالي (${avgVariance.toFixed(2)}%) في ${analysis.reconciliation_type} - راجع قواعد الترجمة` : 
          `High variance (${avgVariance.toFixed(2)}%) in ${analysis.reconciliation_type} - review translation rules`
        );
      }
      
      if (analysis.auto_reconciled_count < analysis.reconciliation_count) {
        recommendations.push(language === 'ar' ? 
          `${analysis.reconciliation_count - analysis.auto_reconciled_count} مصالحات تتطلب مراجعة يدوية في ${analysis.reconciliation_type}` : 
          `${analysis.reconciliation_count - analysis.auto_reconciled_count} manual reconciliations required in ${analysis.reconciliation_type}`
        );
      }
    }
    
    return recommendations;
  }

  // Materialized View Refresh
  async refreshReconciliationViews(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_dual_reporting_materialized_views()`;
  }
}
