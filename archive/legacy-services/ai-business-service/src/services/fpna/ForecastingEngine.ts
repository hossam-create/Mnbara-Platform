import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { FinancialAssumptionsService } from './FinancialAssumptionsService';

export interface ForecastRequest {
  businessAccountId: string;
  scenarioName: string;
  scenarioType: 'BASE' | 'OPTIMISTIC' | 'PESSIMISTIC' | 'CUSTOM';
  startDate: Date;
  endDate: Date;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  baseRevenue?: number;
  forecastMethod: 'PERCENTAGE_OF_SALES' | 'GROWTH_BASED' | 'TREND_BASED';
  userId?: string;
}

export interface ForecastResult {
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  periods: ForecastPeriodResult[];
  summary: ForecastSummary;
}

export interface ForecastPeriodResult {
  periodId: string;
  fiscalYear: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
  periodStart: Date;
  periodEnd: Date;
  incomeStatement: ForecastIncomeStatement;
  balanceSheet: ForecastBalanceSheet;
  cashFlowStatement: ForecastCashFlowStatement;
}

export interface ForecastIncomeStatement {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  interestExpense: number;
  taxExpense: number;
  netIncome: number;
  grossProfitMargin: number;
  operatingMargin: number;
  netProfitMargin: number;
}

export interface ForecastBalanceSheet {
  cashAndEquivalents: number;
  accountsReceivable: number;
  inventory: number;
  currentAssets: number;
  fixedAssets: number;
  intangibleAssets: number;
  totalAssets: number;
  accountsPayable: number;
  currentLiabilities: number;
  longTermDebt: number;
  totalLiabilities: number;
  retainedEarnings: number;
  commonStock: number;
  totalEquity: number;
  workingCapital: number;
  debtToEquityRatio: number;
  currentRatio: number;
}

export interface ForecastCashFlowStatement {
  netIncome: number;
  depreciationAmortization: number;
  changesInWorkingCapital: number;
  operatingCashFlow: number;
  capitalExpenditures: number;
  acquisitionsDispositions: number;
  investingCashFlow: number;
  debtIssuanceRepayment: number;
  equityIssuanceRepurchase: number;
  dividendsPaid: number;
  financingCashFlow: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  cashConversionCycle: number;
}

export interface ForecastSummary {
  totalPeriods: number;
  totalRevenue: number;
  totalNetIncome: number;
  averageNetMargin: number;
  totalAssets: number;
  totalEquity: number;
  averageDebtToEquity: number;
  totalOperatingCashFlow: number;
  totalNetCashFlow: number;
  confidenceScore: number;
}

export class ForecastingEngine {
  constructor(
    private prisma: PrismaClient,
    private assumptionsService: FinancialAssumptionsService
  ) {}

  async generateForecast(request: ForecastRequest): Promise<ForecastResult> {
    try {
      logger.info(`Generating forecast for business: ${request.businessAccountId}, scenario: ${request.scenarioName}`);

      // Validate assumptions
      const validation = await this.assumptionsService.validateAssumptions(request.businessAccountId);
      if (!validation.isValid) {
        throw new Error(`Invalid assumptions: ${validation.errors.join(', ')}`);
      }

      // Create scenario
      const scenario = await this.createScenario(request);

      // Generate forecast periods
      await this.generateForecastPeriods(request.businessAccountId, scenario.id, request.startDate, request.endDate, request.periodType);

      // Get assumptions
      const assumptions = await this.assumptionsService.getAssumptions(request.businessAccountId, { isActive: true });

      // Generate forecast for each period
      const periods = await this.generateForecastForPeriods(request.businessAccountId, scenario.id, assumptions, request);

      // Calculate summary
      const summary = this.calculateForecastSummary(periods);

      logger.info(`Generated forecast for scenario: ${scenario.id} with ${periods.length} periods`);
      
      return {
        scenarioId: scenario.id,
        scenarioName: scenario.scenarioName,
        scenarioType: scenario.scenarioType,
        periods,
        summary
      };
    } catch (error) {
      logger.error('Failed to generate forecast:', error);
      throw error;
    }
  }

  private async createScenario(request: ForecastRequest) {
    return await this.prisma.forecastScenario.create({
      data: {
        businessAccountId: request.businessAccountId,
        scenarioName: request.scenarioName,
        scenarioType: request.scenarioType,
        createdBy: request.userId
      }
    });
  }

  private async generateForecastPeriods(
    businessAccountId: string,
    scenarioId: string,
    startDate: Date,
    endDate: Date,
    periodType: string
  ) {
    await this.prisma.$executeRaw`SELECT generate_forecast_periods(${businessAccountId}, ${scenarioId}, ${startDate}, ${endDate}, ${periodType})`;
  }

  private async generateForecastForPeriods(
    businessAccountId: string,
    scenarioId: string,
    assumptions: any[],
    request: ForecastRequest
  ): Promise<ForecastPeriodResult[]> {
    const periods = await this.prisma.forecastPeriod.findMany({
      where: {
        businessAccountId,
        scenarioId
      },
      orderBy: { periodStart: 'asc' }
    });

    const results: ForecastPeriodResult[] = [];
    let baseRevenue = request.baseRevenue || 100000; // Default base revenue

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      
      // Calculate revenue based on forecast method
      const periodRevenue = await this.calculateRevenue(baseRevenue, assumptions, period, request.forecastMethod, i);
      
      // Generate income statement
      const incomeStatement = await this.generateIncomeStatement(businessAccountId, scenarioId, period.id, periodRevenue, assumptions);
      
      // Generate balance sheet
      const balanceSheet = await this.generateBalanceSheet(businessAccountId, scenarioId, period.id, incomeStatement, assumptions);
      
      // Generate cash flow statement
      const cashFlowStatement = await this.generateCashFlowStatement(businessAccountId, scenarioId, period.id, incomeStatement, balanceSheet, assumptions);

      results.push({
        periodId: period.id,
        fiscalYear: period.fiscalYear,
        fiscalQuarter: period.fiscalQuarter || undefined,
        fiscalMonth: period.fiscalMonth || undefined,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        incomeStatement,
        balanceSheet,
        cashFlowStatement
      });

      // Update base revenue for next period
      baseRevenue = periodRevenue;
    }

    return results;
  }

  private async calculateRevenue(
    baseRevenue: number,
    assumptions: any[],
    period: any,
    forecastMethod: string,
    periodIndex: number
  ): Promise<number> {
    const revenueGrowthRate = this.getAssumptionValue(assumptions, 'revenue_growth_rate') || 10;
    
    switch (forecastMethod) {
      case 'PERCENTAGE_OF_SALES':
        return baseRevenue;
      
      case 'GROWTH_BASED':
        const growthFactorGrowth = 1 + (revenueGrowthRate / 100);
        return baseRevenue * Math.pow(growthFactorGrowth, periodIndex);
      
      case 'TREND_BASED':
        // Apply seasonality factors
        const seasonalityFactor = this.getSeasonalityFactor(assumptions, period.fiscalQuarter);
        const growthFactorTrend = 1 + (revenueGrowthRate / 100);
        return baseRevenue * Math.pow(growthFactorTrend, periodIndex) * seasonalityFactor;
      
      default:
        return baseRevenue;
    }
  }

  private async generateIncomeStatement(
    businessAccountId: string,
    scenarioId: string,
    periodId: string,
    revenue: number,
    assumptions: any[]
  ): Promise<ForecastIncomeStatement> {
    const cogsPercentage = this.getAssumptionValue(assumptions, 'cogs_percentage') || 65;
    const sgaPercentage = this.getAssumptionValue(assumptions, 'sga_percentage') || 15;
    const rdPercentage = this.getAssumptionValue(assumptions, 'rd_percentage') || 8;
    const marketingPercentage = this.getAssumptionValue(assumptions, 'marketing_percentage') || 10;
    const taxRate = this.getAssumptionValue(assumptions, 'tax_rate') || 21;

    const costOfGoodsSold = revenue * (cogsPercentage / 100);
    const grossProfit = revenue - costOfGoodsSold;
    const operatingExpenses = revenue * ((sgaPercentage + rdPercentage + marketingPercentage) / 100);
    const operatingIncome = grossProfit - operatingExpenses;
    const taxExpense = Math.max(0, operatingIncome * (taxRate / 100));
    const netIncome = operatingIncome - taxExpense;

    const incomeStatement = {
      revenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      operatingIncome,
      interestExpense: 0,
      taxExpense,
      netIncome,
      grossProfitMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
      netProfitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0
    };

    await this.prisma.forecastIncomeStatement.create({
      data: {
        businessAccountId,
        scenarioId,
        periodId,
        ...incomeStatement,
        forecastMethod: 'PERCENTAGE_OF_SALES',
        createdBy: 'system'
      }
    });

    return incomeStatement;
  }

  private async generateBalanceSheet(
    businessAccountId: string,
    scenarioId: string,
    periodId: string,
    incomeStatement: ForecastIncomeStatement,
    assumptions: any[]
  ): Promise<ForecastBalanceSheet> {
    const dso = this.getAssumptionValue(assumptions, 'dso') || 45;
    const dio = this.getAssumptionValue(assumptions, 'dio') || 60;
    const dpo = this.getAssumptionValue(assumptions, 'dpo') || 30;

    // Calculate working capital items
    const accountsReceivable = (incomeStatement.revenue / 365) * dso;
    const costOfGoodsSoldPerDay = incomeStatement.costOfGoodsSold / 365;
    const inventory = costOfGoodsSoldPerDay * dio;
    const accountsPayable = costOfGoodsSoldPerDay * dpo;

    const currentAssets = accountsReceivable + inventory + 10000; // Add cash buffer
    const currentLiabilities = accountsPayable + 5000; // Add other current liabilities
    
    const fixedAssets = incomeStatement.revenue * 0.3; // 30% of revenue
    const intangibleAssets = incomeStatement.revenue * 0.1; // 10% of revenue
    
    const totalAssets = currentAssets + fixedAssets + intangibleAssets;
    const totalLiabilities = currentLiabilities + (totalAssets * 0.2); // 20% long-term debt
    
    const retainedEarnings = incomeStatement.netIncome;
    const commonStock = totalAssets * 0.4; // 40% equity
    const totalEquity = totalAssets - totalLiabilities;

    const workingCapital = currentAssets - currentLiabilities;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

    const balanceSheet = {
      cashAndEquivalents: 10000,
      accountsReceivable,
      inventory,
      currentAssets,
      fixedAssets,
      intangibleAssets,
      totalAssets,
      accountsPayable,
      currentLiabilities,
      longTermDebt: totalLiabilities - currentLiabilities,
      totalLiabilities,
      retainedEarnings,
      commonStock,
      totalEquity,
      workingCapital,
      debtToEquityRatio: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
      currentRatio
    };

    await this.prisma.forecastBalanceSheet.create({
      data: {
        businessAccountId,
        scenarioId,
        periodId,
        ...balanceSheet,
        forecastMethod: 'PERCENTAGE_OF_SALES',
        createdBy: 'system'
      }
    });

    return balanceSheet;
  }

  private async generateCashFlowStatement(
    businessAccountId: string,
    scenarioId: string,
    periodId: string,
    incomeStatement: ForecastIncomeStatement,
    balanceSheet: ForecastBalanceSheet,
    assumptions: any[]
  ): Promise<ForecastCashFlowStatement> {
    const depreciationPercentage = this.getAssumptionValue(assumptions, 'depreciation_percentage') || 10;
    const capexGrowthRate = this.getAssumptionValue(assumptions, 'capex_growth_rate') || 8;
    const dividendPayoutRatio = this.getAssumptionValue(assumptions, 'dividend_payout_ratio') || 30;

    const depreciationAmortization = balanceSheet.fixedAssets * (depreciationPercentage / 100);
    const capitalExpenditures = balanceSheet.fixedAssets * (capexGrowthRate / 100);
    const dividendsPaid = incomeStatement.netIncome > 0 ? incomeStatement.netIncome * (dividendPayoutRatio / 100) : 0;
    
    const changesInWorkingCapital = (balanceSheet.accountsReceivable + balanceSheet.inventory) - balanceSheet.accountsPayable;
    const operatingCashFlow = incomeStatement.netIncome + depreciationAmortization - changesInWorkingCapital;
    const investingCashFlow = -capitalExpenditures;
    const financingCashFlow = -dividendsPaid;
    
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
    const endingCash = balanceSheet.cashAndEquivalents + netCashFlow;

    const cashConversionCycle = this.calculateCashConversionCycle(
      balanceSheet.accountsReceivable,
      balanceSheet.inventory,
      balanceSheet.accountsPayable,
      incomeStatement.costOfGoodsSold
    );

    const cashFlowStatement = {
      netIncome: incomeStatement.netIncome,
      depreciationAmortization,
      changesInWorkingCapital,
      operatingCashFlow,
      capitalExpenditures,
      acquisitionsDispositions: 0,
      investingCashFlow,
      debtIssuanceRepayment: 0,
      equityIssuanceRepurchase: 0,
      dividendsPaid,
      financingCashFlow,
      netCashFlow,
      beginningCash: balanceSheet.cashAndEquivalents,
      endingCash,
      cashConversionCycle
    };

    await this.prisma.forecastCashFlowStatement.create({
      data: {
        businessAccountId,
        scenarioId,
        periodId,
        ...cashFlowStatement,
        forecastMethod: 'PERCENTAGE_OF_SALES',
        createdBy: 'system'
      }
    });

    return cashFlowStatement;
  }

  private calculateForecastSummary(periods: ForecastPeriodResult[]): ForecastSummary {
    const totalRevenue = periods.reduce((sum, p) => sum + p.incomeStatement.revenue, 0);
    const totalNetIncome = periods.reduce((sum, p) => sum + p.incomeStatement.netIncome, 0);
    const totalAssets = periods[periods.length - 1]?.balanceSheet.totalAssets || 0;
    const totalEquity = periods[periods.length - 1]?.balanceSheet.totalEquity || 0;
    const totalOperatingCashFlow = periods.reduce((sum, p) => sum + p.cashFlowStatement.operatingCashFlow, 0);
    const totalNetCashFlow = periods.reduce((sum, p) => sum + p.cashFlowStatement.netCashFlow, 0);

    const averageNetMargin = totalRevenue > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;
    const averageDebtToEquity = totalEquity > 0 ? periods.reduce((sum, p) => sum + p.balanceSheet.debtToEquityRatio, 0) / periods.length : 0;

    return {
      totalPeriods: periods.length,
      totalRevenue,
      totalNetIncome,
      averageNetMargin,
      totalAssets,
      totalEquity,
      averageDebtToEquity,
      totalOperatingCashFlow,
      totalNetCashFlow,
      confidenceScore: 85 // Default confidence score
    };
  }

  private getAssumptionValue(assumptions: any[], key: string): number | undefined {
    const assumption = assumptions.find(a => a.assumptionKey === key);
    return assumption?.assumptionValue?.toNumber();
  }

  private getSeasonalityFactor(assumptions: any[], quarter?: number): number {
    if (!quarter) return 1;
    
    const seasonalityKey = `seasonality_q${quarter}`;
    return this.getAssumptionValue(assumptions, seasonalityKey) || 1;
  }

  private calculateCashConversionCycle(
    accountsReceivable: number,
    inventory: number,
    accountsPayable: number,
    costOfGoodsSold: number
  ): number {
    const cogsPerDay = costOfGoodsSold / 365;
    const salesPerDay = accountsReceivable / 45; // Using DSO assumption
    
    const daysInventoryOutstanding = cogsPerDay > 0 ? inventory / cogsPerDay : 0;
    const daysSalesOutstanding = salesPerDay > 0 ? accountsReceivable / salesPerDay : 0;
    const daysPayableOutstanding = cogsPerDay > 0 ? accountsPayable / cogsPerDay : 0;
    
    return daysInventoryOutstanding + daysSalesOutstanding - daysPayableOutstanding;
  }

  async getForecast(
    businessAccountId: string,
    scenarioId: string
  ): Promise<ForecastResult | null> {
    try {
      const scenario = await this.prisma.forecastScenario.findFirst({
        where: {
          id: scenarioId,
          businessAccountId
        }
      });

      if (!scenario) {
        return null;
      }

      const periods = await this.prisma.forecastPeriod.findMany({
        where: {
          businessAccountId,
          scenarioId
        },
        include: {
          incomeStatement: true,
          balanceSheet: true,
          cashFlowStatement: true
        },
        orderBy: { periodStart: 'asc' }
      });

      const periodResults: ForecastPeriodResult[] = periods.map((period: any) => ({
        periodId: period.id,
        fiscalYear: period.fiscalYear,
        fiscalQuarter: period.fiscalQuarter || undefined,
        fiscalMonth: period.fiscalMonth || undefined,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        incomeStatement: period.incomeStatement as any,
        balanceSheet: period.balanceSheet as any,
        cashFlowStatement: period.cashFlowStatement as any
      }));

      const summary = this.calculateForecastSummary(periodResults);

      return {
        scenarioId: scenario.id,
        scenarioName: scenario.scenarioName,
        scenarioType: scenario.scenarioType,
        periods: periodResults,
        summary
      };
    } catch (error) {
      logger.error('Failed to get forecast:', error);
      throw error;
    }
  }

  async listForecasts(businessAccountId: string): Promise<any[]> {
    try {
      const scenarios = await this.prisma.forecastScenario.findMany({
        where: {
          businessAccountId,
          isActive: true
        },
        include: {
          periods: {
            include: {
              incomeStatement: true,
              balanceSheet: true,
              cashFlowStatement: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return scenarios;
    } catch (error) {
      logger.error('Failed to list forecasts:', error);
      throw error;
    }
  }

  async deleteForecast(businessAccountId: string, scenarioId: string): Promise<void> {
    try {
      await this.prisma.forecastScenario.delete({
        where: {
          id: scenarioId,
          businessAccountId
        }
      });
    } catch (error) {
      logger.error('Failed to delete forecast:', error);
      throw error;
    }
  }
}
