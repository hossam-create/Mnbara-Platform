import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface IncomeStatementData {
  revenue: number;
  expenses: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
}

export interface BalanceSheetData {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  currentAssets: number;
  currentLiabilities: number;
  workingCapital: number;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
}

export interface CashFlowData {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
}

export interface FinancialStatementRequest {
  businessAccountId: string;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  periodStart: Date;
  periodEnd: Date;
  fiscalYear?: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
}

export interface FinancialStatementCalculation {
  id: string;
  calculationType: string;
  calculationName: string;
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  amount: number;
  percentage?: number;
  formula?: string;
  calculationOrder: number;
  isSubtotal: boolean;
  isTotal: boolean;
  parentCalculationId?: string;
  level: number;
}

export interface FinancialStatement {
  id: string;
  businessAccountId: string;
  statementType: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW';
  periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  periodStart: Date;
  periodEnd: Date;
  fiscalYear: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
  statementData: any;
  calculations: any;
  generatedAt: Date;
  generatedBy?: string;
  status: 'GENERATED' | 'REVIEWED' | 'FINALIZED' | 'ARCHIVED';
  notes?: string;
  detailedCalculations: FinancialStatementCalculation[];
}

export class FinancialStatementsEngine {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate Income Statement
   */
  async generateIncomeStatement(request: FinancialStatementRequest, userId?: string): Promise<FinancialStatement> {
    try {
      logger.info(`Generating income statement for business: ${request.businessAccountId}`, {
        businessAccountId: request.businessAccountId,
        periodType: request.periodType,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd
      });

      // Calculate fiscal period information
      const fiscalYear = request.fiscalYear || request.periodStart.getFullYear();
      const fiscalQuarter = request.fiscalQuarter || Math.ceil((request.periodStart.getMonth() + 1) / 3);
      const fiscalMonth = request.fiscalMonth || request.periodStart.getMonth() + 1;

      // Calculate totals from journal entries
      const { revenue, expenses, costOfGoodsSold, operatingExpenses, interestExpense, taxExpense } = 
        await this.calculateIncomeStatementTotals(request.businessAccountId, request.periodStart, request.periodEnd);

      // Calculate derived values
      const grossProfit = revenue - costOfGoodsSold;
      const operatingIncome = grossProfit - operatingExpenses;
      const netIncome = operatingIncome - interestExpense - taxExpense;

      // Create statement data
      const statementData: IncomeStatementData = {
        revenue,
        expenses,
        grossProfit,
        operatingIncome,
        netIncome,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd,
        generatedAt: new Date()
      };

      // Create financial statement record
      const statement = await this.prisma.financialStatement.create({
        data: {
          businessAccountId: request.businessAccountId,
          statementType: 'INCOME_STATEMENT',
          periodType: request.periodType,
          periodStart: request.periodStart,
          periodEnd: request.periodEnd,
          fiscalYear,
          fiscalQuarter,
          fiscalMonth,
          statementData: statementData as any,
          calculations: {
            revenue,
            expenses,
            costOfGoodsSold,
            operatingExpenses,
            interestExpense,
            taxExpense,
            grossProfit,
            operatingIncome,
            netIncome
          },
          generatedBy: userId,
          status: 'GENERATED'
        }
      });

      // Create detailed calculations
      const calculations = await this.createIncomeStatementCalculations(statement.id, {
        revenue,
        expenses,
        costOfGoodsSold,
        operatingExpenses,
        interestExpense,
        taxExpense,
        grossProfit,
        operatingIncome,
        netIncome
      });

      logger.info(`Income statement generated successfully: ${statement.id}`, {
        statementId: statement.id,
        businessAccountId: request.businessAccountId,
        netIncome
      });

      return {
        ...statement,
        detailedCalculations: calculations
      };
    } catch (error) {
      logger.error('Failed to generate income statement:', error);
      throw error;
    }
  }

  /**
   * Generate Balance Sheet
   */
  async generateBalanceSheet(request: FinancialStatementRequest, userId?: string): Promise<FinancialStatement> {
    try {
      logger.info(`Generating balance sheet for business: ${request.businessAccountId}`, {
        businessAccountId: request.businessAccountId,
        periodType: request.periodType,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd
      });

      // Calculate fiscal period information
      const fiscalYear = request.fiscalYear || request.periodStart.getFullYear();
      const fiscalQuarter = request.fiscalQuarter || Math.ceil((request.periodStart.getMonth() + 1) / 3);
      const fiscalMonth = request.fiscalMonth || request.periodStart.getMonth() + 1;

      // Calculate totals from journal entries
      const { 
        totalAssets, 
        totalLiabilities, 
        totalEquity, 
        currentAssets, 
        currentLiabilities,
        fixedAssets,
        intangibleAssets,
        longTermLiabilities,
        retainedEarnings,
        commonStock
      } = await this.calculateBalanceSheetTotals(request.businessAccountId, request.periodEnd);

      // Calculate working capital
      const workingCapital = currentAssets - currentLiabilities;

      // Create statement data
      const statementData: BalanceSheetData = {
        totalAssets,
        totalLiabilities,
        totalEquity,
        currentAssets,
        currentLiabilities,
        workingCapital,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd,
        generatedAt: new Date()
      };

      // Create financial statement record
      const statement = await this.prisma.financialStatement.create({
        data: {
          businessAccountId: request.businessAccountId,
          statementType: 'BALANCE_SHEET',
          periodType: request.periodType,
          periodStart: request.periodStart,
          periodEnd: request.periodEnd,
          fiscalYear,
          fiscalQuarter,
          fiscalMonth,
          statementData: statementData as any,
          calculations: {
            totalAssets,
            totalLiabilities,
            totalEquity,
            currentAssets,
            currentLiabilities,
            workingCapital,
            fixedAssets,
            intangibleAssets,
            longTermLiabilities,
            retainedEarnings,
            commonStock
          },
          generatedBy: userId,
          status: 'GENERATED'
        }
      });

      // Create detailed calculations
      const calculations = await this.createBalanceSheetCalculations(statement.id, {
        totalAssets,
        totalLiabilities,
        totalEquity,
        currentAssets,
        currentLiabilities,
        workingCapital,
        fixedAssets,
        intangibleAssets,
        longTermLiabilities,
        retainedEarnings,
        commonStock
      });

      logger.info(`Balance sheet generated successfully: ${statement.id}`, {
        statementId: statement.id,
        businessAccountId: request.businessAccountId,
        totalAssets,
        totalLiabilities,
        totalEquity
      });

      return {
        ...statement,
        detailedCalculations: calculations
      };
    } catch (error) {
      logger.error('Failed to generate balance sheet:', error);
      throw error;
    }
  }

  /**
   * Generate Cash Flow Statement
   */
  async generateCashFlowStatement(request: FinancialStatementRequest, userId?: string): Promise<FinancialStatement> {
    try {
      logger.info(`Generating cash flow statement for business: ${request.businessAccountId}`, {
        businessAccountId: request.businessAccountId,
        periodType: request.periodType,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd
      });

      // Calculate fiscal period information
      const fiscalYear = request.fiscalYear || request.periodStart.getFullYear();
      const fiscalQuarter = request.fiscalQuarter || Math.ceil((request.periodStart.getMonth() + 1) / 3);
      const fiscalMonth = request.fiscalMonth || request.periodStart.getMonth() + 1;

      // Calculate cash flows from journal entries
      const { 
        operatingCashFlow, 
        investingCashFlow, 
        financingCashFlow,
        beginningCash,
        endingCash
      } = await this.calculateCashFlowTotals(request.businessAccountId, request.periodStart, request.periodEnd);

      // Calculate net cash flow
      const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

      // Create statement data
      const statementData: CashFlowData = {
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
        beginningCash,
        endingCash,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd,
        generatedAt: new Date()
      };

      // Create financial statement record
      const statement = await this.prisma.financialStatement.create({
        data: {
          businessAccountId: request.businessAccountId,
          statementType: 'CASH_FLOW',
          periodType: request.periodType,
          periodStart: request.periodStart,
          periodEnd: request.periodEnd,
          fiscalYear,
          fiscalQuarter,
          fiscalMonth,
          statementData: statementData as any,
          calculations: {
            operatingCashFlow,
            investingCashFlow,
            financingCashFlow,
            netCashFlow,
            beginningCash,
            endingCash
          },
          generatedBy: userId,
          status: 'GENERATED'
        }
      });

      // Create detailed calculations
      const calculations = await this.createCashFlowCalculations(statement.id, {
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
        beginningCash,
        endingCash
      });

      logger.info(`Cash flow statement generated successfully: ${statement.id}`, {
        statementId: statement.id,
        businessAccountId: request.businessAccountId,
        netCashFlow,
        endingCash
      });

      return {
        ...statement,
        detailedCalculations: calculations
      };
    } catch (error) {
      logger.error('Failed to generate cash flow statement:', error);
      throw error;
    }
  }

  /**
   * Generate all financial statements for a period
   */
  async generateAllStatements(request: FinancialStatementRequest, userId?: string): Promise<{
    incomeStatement: FinancialStatement;
    balanceSheet: FinancialStatement;
    cashFlowStatement: FinancialStatement;
  }> {
    try {
      logger.info(`Generating all financial statements for business: ${request.businessAccountId}`);

      const [incomeStatement, balanceSheet, cashFlowStatement] = await Promise.all([
        this.generateIncomeStatement(request, userId),
        this.generateBalanceSheet(request, userId),
        this.generateCashFlowStatement(request, userId)
      ]);

      logger.info(`All financial statements generated successfully for business: ${request.businessAccountId}`, {
        businessAccountId: request.businessAccountId,
        incomeStatementId: incomeStatement.id,
        balanceSheetId: balanceSheet.id,
        cashFlowStatementId: cashFlowStatement.id
      });

      return {
        incomeStatement,
        balanceSheet,
        cashFlowStatement
      };
    } catch (error) {
      logger.error('Failed to generate all financial statements:', error);
      throw error;
    }
  }

  /**
   * Get financial statements for a business
   */
  async getFinancialStatements(
    businessAccountId: string,
    filters: {
      statementType?: 'INCOME_STATEMENT' | 'BALANCE_SHEET' | 'CASH_FLOW';
      periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
      periodStart?: Date;
      periodEnd?: Date;
      fiscalYear?: number;
      fiscalQuarter?: number;
      fiscalMonth?: number;
      status?: 'GENERATED' | 'REVIEWED' | 'FINALIZED' | 'ARCHIVED';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<any> {
    try {
      const where: any = {
        businessAccountId
      };

      if (filters.statementType) where.statementType = filters.statementType;
      if (filters.periodType) where.periodType = filters.periodType;
      if (filters.status) where.status = filters.status;
      if (filters.fiscalYear) where.fiscalYear = filters.fiscalYear;
      if (filters.fiscalQuarter) where.fiscalQuarter = filters.fiscalQuarter;
      if (filters.fiscalMonth) where.fiscalMonth = filters.fiscalMonth;
      
      if (filters.periodStart || filters.periodEnd) {
        where.periodStart = {};
        where.periodEnd = {};
        if (filters.periodStart) where.periodStart.gte = filters.periodStart;
        if (filters.periodEnd) where.periodEnd.lte = filters.periodEnd;
      }

      const [statements, total] = await Promise.all([
        this.prisma.financialStatement.findMany({
          where,
          include: {
            calculations: {
              orderBy: {
                calculationOrder: 'asc'
              }
            }
          },
          orderBy: [
            { periodStart: 'desc' },
            { statementType: 'asc' }
          ],
          skip: ((filters.page || 1) - 1) * (filters.limit || 50),
          take: filters.limit || 50
        }),
        this.prisma.financialStatement.count({ where })
      ]);

      return {
        statements,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 50,
          total,
          pages: Math.ceil(total / (filters.limit || 50))
        }
      };
    } catch (error) {
      logger.error('Failed to get financial statements:', error);
      throw error;
    }
  }

  /**
   * Get single financial statement
   */
  async getFinancialStatement(statementId: string): Promise<FinancialStatement | null> {
    try {
      const statement = await this.prisma.financialStatement.findUnique({
        where: { id: statementId },
        include: {
          calculations: {
            orderBy: {
              calculationOrder: 'asc'
            }
          }
        }
      });

      return statement;
    } catch (error) {
      logger.error('Failed to get financial statement:', error);
      throw error;
    }
  }

  /**
   * Update financial statement status
   */
  async updateStatementStatus(
    statementId: string,
    status: 'GENERATED' | 'REVIEWED' | 'FINALIZED' | 'ARCHIVED',
    notes?: string,
    userId?: string
  ): Promise<FinancialStatement> {
    try {
      const statement = await this.prisma.financialStatement.update({
        where: { id: statementId },
        data: {
          status,
          notes,
          updatedAt: new Date()
        },
        include: {
          calculations: {
            orderBy: {
              calculationOrder: 'asc'
            }
          }
        }
      });

      logger.info(`Financial statement status updated: ${statementId}`, {
        statementId,
        status,
        userId
      });

      return statement;
    } catch (error) {
      logger.error('Failed to update statement status:', error);
      throw error;
    }
  }

  /**
   * Calculate income statement totals from journal entries
   */
  private async calculateIncomeStatementTotals(
    businessAccountId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    revenue: number;
    expenses: number;
    costOfGoodsSold: number;
    operatingExpenses: number;
    interestExpense: number;
    taxExpense: number;
  }> {
    const result = await this.prisma.journalEntryLine.groupBy({
      by: ['account'],
      where: {
        journalEntry: {
          businessAccountId,
          status: 'POSTED',
          entryDate: {
            gte: periodStart,
            lte: periodEnd
          }
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    let revenue = 0;
    let expenses = 0;
    let costOfGoodsSold = 0;
    let operatingExpenses = 0;
    let interestExpense = 0;
    let taxExpense = 0;

    for (const item of result) {
      const account = await this.prisma.chartOfAccount.findUnique({
        where: { id: item.account }
      });

      if (!account) continue;

      const netAmount = (item._sum.debitAmount || 0) - (item._sum.creditAmount || 0);

      if (account.accountType === 'REVENUE') {
        revenue += Math.abs(netAmount);
      } else if (account.accountType === 'EXPENSE') {
        expenses += Math.abs(netAmount);
        
        if (account.accountSubtype === 'COST_OF_GOODS_SOLD') {
          costOfGoodsSold += Math.abs(netAmount);
        } else if (account.accountSubtype === 'OPERATING_EXPENSES') {
          operatingExpenses += Math.abs(netAmount);
        } else if (account.accountSubtype === 'INTEREST_EXPENSE') {
          interestExpense += Math.abs(netAmount);
        } else if (account.accountSubtype === 'TAX_EXPENSE') {
          taxExpense += Math.abs(netAmount);
        }
      }
    }

    return {
      revenue,
      expenses,
      costOfGoodsSold,
      operatingExpenses,
      interestExpense,
      taxExpense
    };
  }

  /**
   * Calculate balance sheet totals from journal entries
   */
  private async calculateBalanceSheetTotals(
    businessAccountId: string,
    periodEnd: Date
  ): Promise<{
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    currentAssets: number;
    currentLiabilities: number;
    fixedAssets: number;
    intangibleAssets: number;
    longTermLiabilities: number;
    retainedEarnings: number;
    commonStock: number;
  }> {
    const result = await this.prisma.journalEntryLine.groupBy({
      by: ['account'],
      where: {
        journalEntry: {
          businessAccountId,
          status: 'POSTED',
          entryDate: {
            lte: periodEnd
          }
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let currentAssets = 0;
    let currentLiabilities = 0;
    let fixedAssets = 0;
    let intangibleAssets = 0;
    let longTermLiabilities = 0;
    let retainedEarnings = 0;
    let commonStock = 0;

    for (const item of result) {
      const account = await this.prisma.chartOfAccount.findUnique({
        where: { id: item.account }
      });

      if (!account) continue;

      const netAmount = (item._sum.debitAmount || 0) - (item._sum.creditAmount || 0);

      if (account.accountType === 'ASSET') {
        totalAssets += Math.abs(netAmount);
        
        if (account.accountSubtype === 'CURRENT_ASSETS') {
          currentAssets += Math.abs(netAmount);
        } else if (account.accountSubtype === 'FIXED_ASSETS') {
          fixedAssets += Math.abs(netAmount);
        } else if (account.accountSubtype === 'INTANGIBLE_ASSETS') {
          intangibleAssets += Math.abs(netAmount);
        }
      } else if (account.accountType === 'LIABILITY') {
        totalLiabilities += Math.abs(netAmount);
        
        if (account.accountSubtype === 'CURRENT_LIABILITIES') {
          currentLiabilities += Math.abs(netAmount);
        } else if (account.accountSubtype === 'LONG_TERM_LIABILITIES') {
          longTermLiabilities += Math.abs(netAmount);
        }
      } else if (account.accountType === 'EQUITY') {
        totalEquity += Math.abs(netAmount);
        
        if (account.accountSubtype === 'RETAINED_EARNINGS') {
          retainedEarnings += Math.abs(netAmount);
        } else if (account.accountSubtype === 'COMMON_STOCK') {
          commonStock += Math.abs(netAmount);
        }
      }
    }

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      currentAssets,
      currentLiabilities,
      fixedAssets,
      intangibleAssets,
      longTermLiabilities,
      retainedEarnings,
      commonStock
    };
  }

  /**
   * Calculate cash flow totals from journal entries
   */
  private async calculateCashFlowTotals(
    businessAccountId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    beginningCash: number;
    endingCash: number;
  }> {
    // Calculate cash flows for the period
    const periodResult = await this.prisma.journalEntryLine.groupBy({
      by: ['account'],
      where: {
        journalEntry: {
          businessAccountId,
          status: 'POSTED',
          entryDate: {
            gte: periodStart,
            lte: periodEnd
          }
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    // Calculate beginning cash balance
    const beginningResult = await this.prisma.journalEntryLine.groupBy({
      by: ['account'],
      where: {
        journalEntry: {
          businessAccountId,
          status: 'POSTED',
          entryDate: {
            lt: periodStart
          }
        }
      },
      _sum: {
        debitAmount: true,
        creditAmount: true
      }
    });

    let operatingCashFlow = 0;
    let investingCashFlow = 0;
    let financingCashFlow = 0;
    let beginningCash = 0;
    let endingCash = 0;

    // Calculate cash flows for the period
    for (const item of periodResult) {
      const account = await this.prisma.chartOfAccount.findUnique({
        where: { id: item.account }
      });

      if (!account) continue;

      const netAmount = (item._sum.debitAmount || 0) - (item._sum.creditAmount || 0);

      if (account.accountType === 'ASSET' && account.accountSubtype === 'CASH_AND_EQUIVALENTS') {
        // This is simplified - in production would categorize by reference type
        operatingCashFlow += netAmount;
      }
    }

    // Calculate beginning cash
    for (const item of beginningResult) {
      const account = await this.prisma.chartOfAccount.findUnique({
        where: { id: item.account }
      });

      if (!account) continue;

      const netAmount = (item._sum.debitAmount || 0) - (item._sum.creditAmount || 0);

      if (account.accountType === 'ASSET' && account.accountSubtype === 'CASH_AND_EQUIVALENTS') {
        beginningCash += netAmount;
      }
    }

    endingCash = beginningCash + operatingCashFlow + investingCashFlow + financingCashFlow;

    return {
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      beginningCash,
      endingCash
    };
  }

  /**
   * Create income statement calculations
   */
  private async createIncomeStatementCalculations(
    statementId: string,
    totals: {
      revenue: number;
      expenses: number;
      costOfGoodsSold: number;
      operatingExpenses: number;
      interestExpense: number;
      taxExpense: number;
      grossProfit: number;
      operatingIncome: number;
      netIncome: number;
    }
  ): Promise<FinancialStatementCalculation[]> {
    const calculations: FinancialStatementCalculation[] = [
      {
        id: this.generateId(),
        calculationType: 'REVENUE',
        calculationName: 'Total Revenue',
        amount: totals.revenue,
        calculationOrder: 1,
        isSubtotal: false,
        isTotal: true,
        level: 1
      },
      {
        id: this.generateId(),
        calculationType: 'EXPENSE',
        calculationName: 'Cost of Goods Sold',
        amount: totals.costOfGoodsSold,
        calculationOrder: 2,
        isSubtotal: false,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'PROFIT',
        calculationName: 'Gross Profit',
        amount: totals.grossProfit,
        calculationOrder: 3,
        isSubtotal: true,
        isTotal: false,
        level: 1
      },
      {
        id: this.generateId(),
        calculationType: 'EXPENSE',
        calculationName: 'Operating Expenses',
        amount: totals.operatingExpenses,
        calculationOrder: 4,
        isSubtotal: false,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'INCOME',
        calculationName: 'Operating Income',
        amount: totals.operatingIncome,
        calculationOrder: 5,
        isSubtotal: true,
        isTotal: false,
        level: 1
      },
      {
        id: this.generateId(),
        calculationType: 'EXPENSE',
        calculationName: 'Interest Expense',
        amount: totals.interestExpense,
        calculationOrder: 6,
        isSubtotal: false,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'EXPENSE',
        calculationName: 'Tax Expense',
        amount: totals.taxExpense,
        calculationOrder: 7,
        isSubtotal: false,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'INCOME',
        calculationName: 'Net Income',
        amount: totals.netIncome,
        calculationOrder: 8,
        isSubtotal: false,
        isTotal: true,
        level: 1
      }
    ];

    // Save calculations to database
    await this.prisma.financialStatementCalculation.createMany({
      data: calculations.map(calc => ({
        financialStatementId: statementId,
        calculationType: calc.calculationType,
        calculationName: calc.calculationName,
        amount: calc.amount,
        calculationOrder: calc.calculationOrder,
        isSubtotal: calc.isSubtotal,
        isTotal: calc.isTotal,
        level: calc.level
      }))
    });

    return calculations;
  }

  /**
   * Create balance sheet calculations
   */
  private async createBalanceSheetCalculations(
    statementId: string,
    totals: {
      totalAssets: number;
      totalLiabilities: number;
      totalEquity: number;
      currentAssets: number;
      currentLiabilities: number;
      workingCapital: number;
      fixedAssets: number;
      intangibleAssets: number;
      longTermLiabilities: number;
      retainedEarnings: number;
      commonStock: number;
    }
  ): Promise<FinancialStatementCalculation[]> {
    const calculations: FinancialStatementCalculation[] = [
      // Assets
      {
        id: this.generateId(),
        calculationType: 'ASSET',
        calculationName: 'Current Assets',
        amount: totals.currentAssets,
        calculationOrder: 1,
        isSubtotal: true,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'ASSET',
        calculationName: 'Fixed Assets',
        amount: totals.fixedAssets,
        calculationOrder: 2,
        isSubtotal: false,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'ASSET',
        calculationName: 'Intangible Assets',
        amount: totals.intangibleAssets,
        calculationOrder: 3,
        isSubtotal: false,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'ASSET',
        calculationName: 'Total Assets',
        amount: totals.totalAssets,
        calculationOrder: 4,
        isSubtotal: false,
        isTotal: true,
        level: 1
      },
      // Liabilities
      {
        id: this.generateId(),
        calculationType: 'LIABILITY',
        calculationName: 'Current Liabilities',
        amount: totals.currentLiabilities,
        calculationOrder: 5,
        isSubtotal: true,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'LIABILITY',
        calculationName: 'Long-Term Liabilities',
        amount: totals.longTermLiabilities,
        calculationOrder: 6,
        isSubtotal: false,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'LIABILITY',
        calculationName: 'Total Liabilities',
        amount: totals.totalLiabilities,
        calculationOrder: 7,
        isSubtotal: false,
        isTotal: true,
        level: 1
      },
      // Equity
      {
        id: this.generateId(),
        calculationType: 'EQUITY',
        calculationName: 'Common Stock',
        amount: totals.commonStock,
        calculationOrder: 8,
        isSubtotal: false,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'EQUITY',
        calculationName: 'Retained Earnings',
        amount: totals.retainedEarnings,
        calculationOrder: 9,
        isSubtotal: false,
        isTotal: false,
        level: 2
      },
      {
        id: this.generateId(),
        calculationType: 'EQUITY',
        calculationName: 'Total Equity',
        amount: totals.totalEquity,
        calculationOrder: 10,
        isSubtotal: false,
        isTotal: true,
        level: 1
      },
      // Metrics
      {
        id: this.generateId(),
        calculationType: 'METRIC',
        calculationName: 'Working Capital',
        amount: totals.workingCapital,
        calculationOrder: 11,
        isSubtotal: false,
        isTotal: false,
        level: 1
      }
    ];

    // Save calculations to database
    await this.prisma.financialStatementCalculation.createMany({
      data: calculations.map(calc => ({
        financialStatementId: statementId,
        calculationType: calc.calculationType,
        calculationName: calc.calculationName,
        amount: calc.amount,
        calculationOrder: calc.calculationOrder,
        isSubtotal: calc.isSubtotal,
        isTotal: calc.isTotal,
        level: calc.level
      }))
    });

    return calculations;
  }

  /**
   * Create cash flow calculations
   */
  private async createCashFlowCalculations(
    statementId: string,
    totals: {
      operatingCashFlow: number;
      investingCashFlow: number;
      financingCashFlow: number;
      netCashFlow: number;
      beginningCash: number;
      endingCash: number;
    }
  ): Promise<FinancialStatementCalculation[]> {
    const calculations: FinancialStatementCalculation[] = [
      {
        id: this.generateId(),
        calculationType: 'CASH_FLOW',
        calculationName: 'Operating Cash Flow',
        amount: totals.operatingCashFlow,
        calculationOrder: 1,
        isSubtotal: false,
        isTotal: false,
        level: 1
      },
      {
        id: this.generateId(),
        calculationType: 'CASH_FLOW',
        calculationName: 'Investing Cash Flow',
        amount: totals.investingCashFlow,
        calculationOrder: 2,
        isSubtotal: false,
        isTotal: false,
        level: 1
      },
      {
        id: this.generateId(),
        calculationType: 'CASH_FLOW',
        calculationName: 'Financing Cash Flow',
        amount: totals.financingCashFlow,
        calculationOrder: 3,
        isSubtotal: false,
        isTotal: false,
        level: 1
      },
      {
        id: this.generateId(),
        calculationType: 'CASH_FLOW',
        calculationName: 'Net Cash Flow',
        amount: totals.netCashFlow,
        calculationOrder: 4,
        isSubtotal: false,
        isTotal: true,
        level: 1
      },
      {
        id: this.generateId(),
        calculationType: 'CASH_BALANCE',
        calculationName: 'Beginning Cash',
        amount: totals.beginningCash,
        calculationOrder: 5,
        isSubtotal: false,
        isTotal: false,
        level: 1
      },
      {
        id: this.generateId(),
        calculationType: 'CASH_BALANCE',
        calculationName: 'Ending Cash',
        amount: totals.endingCash,
        calculationOrder: 6,
        isSubtotal: false,
        isTotal: true,
        level: 1
      }
    ];

    // Save calculations to database
    await this.prisma.financialStatementCalculation.createMany({
      data: calculations.map(calc => ({
        financialStatementId: statementId,
        calculationType: calc.calculationType,
        calculationName: calc.calculationName,
        amount: calc.amount,
        calculationOrder: calc.calculationOrder,
        isSubtotal: calc.isSubtotal,
        isTotal: calc.isTotal,
        level: calc.level
      }))
    });

    return calculations;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Refresh materialized views
   */
  async refreshViews(): Promise<void> {
    try {
      await this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_income_statement`;
      await this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_balance_sheet`;
      await this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cash_flow`;
      
      logger.info('Financial statement views refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh financial statement views:', error);
      throw error;
    }
  }
}
