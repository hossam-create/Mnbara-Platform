import { GroupHoldingService, EntityMapping, IntercompanyTransaction, ConsolidationSnapshot } from './GroupHoldingService';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface ConsolidationResult {
  success: boolean;
  consolidatedStatements: any[];
  eliminationJournalId?: string;
  processingLog: any[];
  errorDetails?: any;
  totalEliminations: number;
  totalAdjustments: number;
}

export interface EliminationEntry {
  id: string;
  type: 'intercompany' | 'currency' | 'goodwill' | 'minority_interest' | 'custom';
  description: string;
  debitAmount: number;
  creditAmount: number;
  accountId: string;
  sourceTransactionId?: string;
  targetEntityId?: string;
  currency: string;
  eliminationPercentage: number;
}

export interface ConsolidatedAccount {
  accountCode: string;
  accountName: string;
  accountType: string;
  entityType: string;
  entityId: string;
  originalAmount: number;
  translatedAmount: number;
  eliminatedAmount: number;
  finalAmount: number;
  currency: string;
  exchangeRate: number;
}

export class ConsolidationEngine {
  private groupService: GroupHoldingService;

  constructor() {
    this.groupService = new GroupHoldingService();
  }

  async performConsolidation(snapshotId: string): Promise<ConsolidationResult> {
    const snapshot = await this.groupService.getConsolidationSnapshot(snapshotId);
    const processingLog: any[] = [];
    let totalEliminations = 0;
    let totalAdjustments = 0;

    try {
      processingLog.push({
        timestamp: new Date(),
        step: 'initiation',
        message: `Starting consolidation for group: ${snapshot.groupId}`,
        status: 'info'
      });

      // Step 1: Get all entities in the group
      const entityMappings = await this.groupService.getEntityMappings(snapshot.groupId);
      processingLog.push({
        timestamp: new Date(),
        step: 'entity_loading',
        message: `Loaded ${entityMappings.length} entity mappings`,
        status: 'info',
        data: { entityCount: entityMappings.length }
      });

      // Step 2: Get intercompany transactions
      const intercompanyTransactions = await this.groupService.getIntercompanyTransactions(snapshot.groupId, {
        isEliminated: false
      });
      processingLog.push({
        timestamp: new Date(),
        step: 'intercompany_loading',
        message: `Loaded ${intercompanyTransactions.length} intercompany transactions`,
        status: 'info',
        data: { transactionCount: intercompanyTransactions.length }
      });

      // Step 3: Generate elimination entries
      const eliminationEntries = await this.generateEliminationEntries(
        intercompanyTransactions,
        snapshot.exchangeRates,
        snapshot.currency
      );
      totalEliminations = eliminationEntries.length;
      processingLog.push({
        timestamp: new Date(),
        step: 'elimination_generation',
        message: `Generated ${eliminationEntries.length} elimination entries`,
        status: 'info',
        data: { eliminationCount: eliminationEntries.length }
      });

      // Step 4: Create elimination journal
      const eliminationJournalId = await this.createEliminationJournal(
        snapshotId,
        eliminationEntries,
        snapshot.createdBy
      );
      processingLog.push({
        timestamp: new Date(),
        step: 'elimination_journal',
        message: `Created elimination journal: ${eliminationJournalId}`,
        status: 'info',
        data: { journalId: eliminationJournalId }
      });

      // Step 5: Generate consolidated statements
      const consolidatedStatements = await this.generateConsolidatedStatements(
        snapshot,
        entityMappings,
        eliminationEntries
      );
      totalAdjustments = consolidatedStatements.length;
      processingLog.push({
        timestamp: new Date(),
        step: 'statement_generation',
        message: `Generated ${consolidatedStatements.length} consolidated statements`,
        status: 'info',
        data: { statementCount: consolidatedStatements.length }
      });

      // Step 6: Update snapshot status
      await this.updateSnapshotStatus(snapshotId, 'completed', processingLog, null);
      processingLog.push({
        timestamp: new Date(),
        step: 'completion',
        message: 'Consolidation completed successfully',
        status: 'success'
      });

      return {
        success: true,
        consolidatedStatements,
        eliminationJournalId,
        processingLog,
        totalEliminations,
        totalAdjustments
      };

    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date()
      };

      processingLog.push({
        timestamp: new Date(),
        step: 'error',
        message: `Consolidation failed: ${errorDetails.message}`,
        status: 'error',
        data: errorDetails
      });

      await this.updateSnapshotStatus(snapshotId, 'failed', processingLog, errorDetails);

      return {
        success: false,
        consolidatedStatements: [],
        processingLog,
        errorDetails,
        totalEliminations,
        totalAdjustments
      };
    }
  }

  private async generateEliminationEntries(
    transactions: IntercompanyTransaction[],
    exchangeRates: Record<string, number>,
    consolidationCurrency: string
  ): Promise<EliminationEntry[]> {
    const eliminationEntries: EliminationEntry[] = [];

    for (const transaction of transactions) {
      // Get the journal entry details
      const journalEntry = await this.getJournalEntry(transaction.transactionId);
      
      if (!journalEntry) {
        continue;
      }

      // Apply currency translation if needed
      const translatedAmount = this.translateCurrency(
        journalEntry.amount,
        journalEntry.currency,
        consolidationCurrency,
        exchangeRates
      );

      // Calculate elimination amount
      const eliminationAmount = translatedAmount * (transaction.eliminationPercentage / 100);

      // Create elimination entry
      eliminationEntries.push({
        id: uuidv4(),
        type: 'intercompany',
        description: `Elimination of intercompany ${transaction.transactionType} between ${transaction.sourceEntityId} and ${transaction.targetEntityId}`,
        debitAmount: journalEntry.debitCredit === 'debit' ? eliminationAmount : 0,
        creditAmount: journalEntry.debitCredit === 'credit' ? eliminationAmount : 0,
        accountId: journalEntry.accountId,
        sourceTransactionId: transaction.transactionId,
        targetEntityId: transaction.targetEntityId,
        currency: consolidationCurrency,
        eliminationPercentage: transaction.eliminationPercentage
      });

      // Mark transaction as eliminated
      await this.markTransactionAsEliminated(transaction.id);
    }

    return eliminationEntries;
  }

  private async createEliminationJournal(
    snapshotId: string,
    eliminationEntries: EliminationEntry[],
    createdBy: string
  ): Promise<string> {
    const journalId = uuidv4();

    // Create journal entry header
    await prisma.$queryRaw`
      INSERT INTO journal_entries (
        id,
        business_account_id,
        entry_number,
        entry_date,
        description,
        status,
        created_by,
        created_at
      ) VALUES (
        ${journalId}::uuid,
        (SELECT group_id FROM consolidation_snapshots WHERE id = ${snapshotId}::uuid)::uuid,
        'ELIM-' || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint,
        CURRENT_TIMESTAMP::date,
        'Intercompany elimination journal',
        'posted',
        ${createdBy}::uuid,
        CURRENT_TIMESTAMP::timestamp
      )
    `;

    // Create journal entry lines
    for (const entry of eliminationEntries) {
      await prisma.$queryRaw`
        INSERT INTO journal_entry_lines (
          id,
          journal_entry_id,
          account_id,
          description,
          debit_amount,
          credit_amount,
          currency,
          created_at
        ) VALUES (
          ${uuidv4()}::uuid,
          ${journalId}::uuid,
          ${entry.accountId}::uuid,
          ${entry.description}::text,
          ${entry.debitAmount}::decimal,
          ${entry.creditAmount}::decimal,
          ${entry.currency}::varchar,
          CURRENT_TIMESTAMP::timestamp
        )
      `;
    }

    // Update snapshot with elimination journal ID
    await prisma.$queryRaw`
      UPDATE consolidation_snapshots 
      SET elimination_journal_id = ${journalId}::uuid
      WHERE id = ${snapshotId}::uuid
    `;

    return journalId;
  }

  private async generateConsolidatedStatements(
    snapshot: ConsolidationSnapshot,
    entityMappings: EntityMapping[],
    eliminationEntries: EliminationEntry[]
  ): Promise<any[]> {
    const consolidatedStatements: any[] = [];

    // Generate consolidated income statement
    const incomeStatement = await this.generateConsolidatedIncomeStatement(
      snapshot,
      entityMappings,
      eliminationEntries
    );
    if (incomeStatement) {
      consolidatedStatements.push(incomeStatement);
    }

    // Generate consolidated balance sheet
    const balanceSheet = await this.generateConsolidatedBalanceSheet(
      snapshot,
      entityMappings,
      eliminationEntries
    );
    if (balanceSheet) {
      consolidatedStatements.push(balanceSheet);
    }

    // Generate consolidated cash flow statement
    const cashFlowStatement = await this.generateConsolidatedCashFlowStatement(
      snapshot,
      entityMappings,
      eliminationEntries
    );
    if (cashFlowStatement) {
      consolidatedStatements.push(cashFlowStatement);
    }

    // Generate consolidated equity statement
    const equityStatement = await this.generateConsolidatedEquityStatement(
      snapshot,
      entityMappings,
      eliminationEntries
    );
    if (equityStatement) {
      consolidatedStatements.push(equityStatement);
    }

    return consolidatedStatements;
  }

  private async generateConsolidatedIncomeStatement(
    snapshot: ConsolidationSnapshot,
    entityMappings: EntityMapping[],
    eliminationEntries: EliminationEntry[]
  ): Promise<any> {
    // Get individual entity income statements
    const entityStatements = await this.getEntityFinancialStatements(
      entityMappings.map(em => em.businessAccountId),
      'income_statement',
      snapshot.periodStart,
      snapshot.periodEnd
    );

    // Consolidate amounts
    const consolidated = this.consolidateAmounts(
      entityStatements,
      eliminationEntries,
      'income_statement'
    );

    // Calculate minority interest
    const minorityInterestExpense = await this.calculateMinorityInterest(
      entityMappings,
      consolidated.netIncome || 0
    );

    return {
      id: uuidv4(),
      snapshotId: snapshot.id,
      statementType: 'income_statement',
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      currency: snapshot.currency,
      consolidatedRevenue: consolidated.revenue || 0,
      consolidatedCostOfGoodsSold: consolidated.costOfGoodsSold || 0,
      consolidatedGrossProfit: consolidated.grossProfit || 0,
      consolidatedOperatingExpenses: consolidated.operatingExpenses || 0,
      consolidatedOperatingIncome: consolidated.operatingIncome || 0,
      consolidatedInterestExpense: consolidated.interestExpense || 0,
      consolidatedInterestIncome: consolidated.interestIncome || 0,
      consolidatedOtherIncomeExpense: consolidated.otherIncomeExpense || 0,
      consolidatedProfitBeforeTax: consolidated.profitBeforeTax || 0,
      consolidatedTaxExpense: consolidated.taxExpense || 0,
      consolidatedNetIncome: consolidated.netIncome || 0,
      consolidatedEarningsPerShare: consolidated.earningsPerShare || 0,
      minorityInterestExpense: minorityInterestExpense,
      consolidationMethod: snapshot.consolidationMethod,
      createdBy: snapshot.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async generateConsolidatedBalanceSheet(
    snapshot: ConsolidationSnapshot,
    entityMappings: EntityMapping[],
    eliminationEntries: EliminationEntry[]
  ): Promise<any> {
    // Get individual entity balance sheets
    const entityStatements = await this.getEntityFinancialStatements(
      entityMappings.map(em => em.businessAccountId),
      'balance_sheet',
      snapshot.periodStart,
      snapshot.periodEnd
    );

    // Consolidate amounts
    const consolidated = this.consolidateAmounts(
      entityStatements,
      eliminationEntries,
      'balance_sheet'
    );

    // Calculate minority interest
    const minorityInterest = await this.calculateMinorityInterestEquity(
      entityMappings,
      consolidated.totalEquity || 0
    );

    return {
      id: uuidv4(),
      snapshotId: snapshot.id,
      statementType: 'balance_sheet',
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      currency: snapshot.currency,
      consolidatedCashAndEquivalents: consolidated.cashAndEquivalents || 0,
      consolidatedAccountsReceivable: consolidated.accountsReceivable || 0,
      consolidatedInventory: consolidated.inventory || 0,
      consolidatedOtherCurrentAssets: consolidated.otherCurrentAssets || 0,
      consolidatedTotalCurrentAssets: consolidated.totalCurrentAssets || 0,
      consolidatedPropertyPlantEquipment: consolidated.propertyPlantEquipment || 0,
      consolidatedIntangibleAssets: consolidated.intangibleAssets || 0,
      consolidatedGoodwill: consolidated.goodwill || 0,
      consolidatedOtherNonCurrentAssets: consolidated.otherNonCurrentAssets || 0,
      consolidatedTotalAssets: consolidated.totalAssets || 0,
      consolidatedAccountsPayable: consolidated.accountsPayable || 0,
      consolidatedShortTermDebt: consolidated.shortTermDebt || 0,
      consolidatedOtherCurrentLiabilities: consolidated.otherCurrentLiabilities || 0,
      consolidatedTotalCurrentLiabilities: consolidated.totalCurrentLiabilities || 0,
      consolidatedLongTermDebt: consolidated.longTermDebt || 0,
      consolidatedOtherNonCurrentLiabilities: consolidated.otherNonCurrentLiabilities || 0,
      consolidatedTotalLiabilities: consolidated.totalLiabilities || 0,
      consolidatedShareCapital: consolidated.shareCapital || 0,
      consolidatedRetainedEarnings: consolidated.retainedEarnings || 0,
      consolidatedOtherEquity: consolidated.otherEquity || 0,
      consolidatedMinorityInterest: minorityInterest,
      consolidatedTotalEquity: (consolidated.totalEquity || 0) + minorityInterest,
      consolidationMethod: snapshot.consolidationMethod,
      createdBy: snapshot.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async generateConsolidatedCashFlowStatement(
    snapshot: ConsolidationSnapshot,
    entityMappings: EntityMapping[],
    eliminationEntries: EliminationEntry[]
  ): Promise<any> {
    // Get individual entity cash flow statements
    const entityStatements = await this.getEntityFinancialStatements(
      entityMappings.map(em => em.businessAccountId),
      'cash_flow',
      snapshot.periodStart,
      snapshot.periodEnd
    );

    // Consolidate amounts
    const consolidated = this.consolidateAmounts(
      entityStatements,
      eliminationEntries,
      'cash_flow'
    );

    return {
      id: uuidv4(),
      snapshotId: snapshot.id,
      statementType: 'cash_flow',
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      currency: snapshot.currency,
      consolidatedCashFromOperations: consolidated.cashFromOperations || 0,
      consolidatedCashFromInvesting: consolidated.cashFromInvesting || 0,
      consolidatedCashFromFinancing: consolidated.cashFromFinancing || 0,
      consolidatedNetChangeInCash: consolidated.netChangeInCash || 0,
      consolidatedCashBeginingBalance: consolidated.cashBeginingBalance || 0,
      consolidatedCashEndingBalance: consolidated.cashEndingBalance || 0,
      consolidationMethod: snapshot.consolidationMethod,
      createdBy: snapshot.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private async generateConsolidatedEquityStatement(
    snapshot: ConsolidationSnapshot,
    entityMappings: EntityMapping[],
    eliminationEntries: EliminationEntry[]
  ): Promise<any> {
    // Get individual entity equity statements
    const entityStatements = await this.getEntityFinancialStatements(
      entityMappings.map(em => em.businessAccountId),
      'equity_statement',
      snapshot.periodStart,
      snapshot.periodEnd
    );

    // Consolidate amounts
    const consolidated = this.consolidateAmounts(
      entityStatements,
      eliminationEntries,
      'equity_statement'
    );

    // Calculate minority interest
    const minorityInterest = await this.calculateMinorityInterestEquity(
      entityMappings,
      consolidated.totalEquity || 0
    );

    return {
      id: uuidv4(),
      snapshotId: snapshot.id,
      statementType: 'equity_statement',
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      currency: snapshot.currency,
      consolidatedShareCapital: consolidated.shareCapital || 0,
      consolidatedRetainedEarnings: consolidated.retainedEarnings || 0,
      consolidatedOtherEquity: consolidated.otherEquity || 0,
      consolidatedTotalEquity: (consolidated.totalEquity || 0) + minorityInterest,
      consolidationMethod: snapshot.consolidationMethod,
      createdBy: snapshot.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private consolidateAmounts(
    entityStatements: any[],
    eliminationEntries: EliminationEntry[],
    statementType: string
  ): Record<string, number> {
    const consolidated: Record<string, number> = {};

    // Sum up all entity amounts
    for (const statement of entityStatements) {
      for (const [key, value] of Object.entries(statement)) {
        if (typeof value === 'number' && (key.includes('Amount') || key.includes('Balance') || key.includes('Income') || key.includes('Expense'))) {
          consolidated[key] = (consolidated[key] || 0) + value;
        }
      }
    }

    // Apply eliminations
    for (const elimination of eliminationEntries) {
      // This would need more sophisticated mapping based on account types
      // For now, we'll apply a simple reduction
      const accountType = this.getAccountTypeForElimination(elimination.accountId, statementType);
      if (accountType && consolidated[accountType]) {
        consolidated[accountType] -= (elimination.debitAmount - elimination.creditAmount);
      }
    }

    return consolidated;
  }

  private async calculateMinorityInterest(
    entityMappings: EntityMapping[],
    netIncome: number
  ): Promise<number> {
    let minorityInterest = 0;

    for (const mapping of entityMappings) {
      if (mapping.entityType === 'subsidiary' && mapping.ownershipPercentage < 100) {
        const minorityPercentage = (100 - mapping.ownershipPercentage) / 100;
        minorityInterest += netIncome * minorityPercentage;
      }
    }

    return minorityInterest;
  }

  private async calculateMinorityInterestEquity(
    entityMappings: EntityMapping[],
    totalEquity: number
  ): Promise<number> {
    let minorityInterest = 0;

    for (const mapping of entityMappings) {
      if (mapping.entityType === 'subsidiary' && mapping.ownershipPercentage < 100) {
        const minorityPercentage = (100 - mapping.ownershipPercentage) / 100;
        minorityInterest += totalEquity * minorityPercentage;
      }
    }

    return minorityInterest;
  }

  private translateCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRates: Record<string, number>
  ): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const exchangeRate = exchangeRates[`${fromCurrency}_${toCurrency}`] || 
                        exchangeRates[`${toCurrency}_${fromCurrency}`] || 1;

    if (exchangeRates[`${fromCurrency}_${toCurrency}`]) {
      return amount * exchangeRate;
    } else if (exchangeRates[`${toCurrency}_${fromCurrency}`]) {
      return amount / exchangeRate;
    }

    return amount; // Default to no conversion if rate not found
  }

  private async getJournalEntry(transactionId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT 
        je.id,
        je.business_account_id,
        je.entry_number,
        je.entry_date,
        je.description,
        je.currency,
        jel.account_id,
        jel.description as line_description,
        jel.debit_amount,
        jel.credit_amount,
        CASE 
          WHEN jel.debit_amount > 0 THEN 'debit'
          WHEN jel.credit_amount > 0 THEN 'credit'
        END as debit_credit,
        COALESCE(jel.debit_amount, 0) - COALESCE(jel.credit_amount, 0) as amount
      FROM journal_entries je
      JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
      WHERE je.id = ${transactionId}::uuid
    `;
    
    return (result as any)[0];
  }

  private async markTransactionAsEliminated(transactionId: string): Promise<void> {
    await prisma.$queryRaw`
      UPDATE intercompany_transactions 
      SET is_eliminated = true, elimination_date = CURRENT_TIMESTAMP
      WHERE id = ${transactionId}::uuid
    `;
  }

  private async getEntityFinancialStatements(
    businessAccountIds: string[],
    statementType: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<any[]> {
    const placeholders = businessAccountIds.map((_, index) => `$${index + 1}`).join(',');
    
    const query = `
      SELECT * FROM financial_statements
      WHERE business_account_id IN (${placeholders})
      AND statement_type = '${statementType}'
      AND period_start >= '${periodStart.toISOString()}'
      AND period_end <= '${periodEnd.toISOString()}'
      AND status = 'final'
    `;
    
    const result = await prisma.$queryRawUnsafe(query, ...businessAccountIds);
    return result as any[];
  }

  private getAccountTypeForElimination(accountId: string, statementType: string): string | null {
    // This would need a more sophisticated mapping based on the chart of accounts
    // For now, return a generic mapping
    const accountMappings: Record<string, Record<string, string>> = {
      'income_statement': {
        'revenue': 'consolidatedRevenue',
        'cost_of_goods_sold': 'consolidatedCostOfGoodsSold',
        'operating_expenses': 'consolidatedOperatingExpenses',
        'interest_expense': 'consolidatedInterestExpense',
        'interest_income': 'consolidatedInterestIncome'
      },
      'balance_sheet': {
        'accounts_receivable': 'consolidatedAccountsReceivable',
        'accounts_payable': 'consolidatedAccountsPayable',
        'inventory': 'consolidatedInventory'
      }
    };

    return accountMappings[statementType]?.[accountId] || null;
  }

  private async updateSnapshotStatus(
    snapshotId: string,
    status: string,
    processingLog: any[],
    errorDetails: any
  ): Promise<void> {
    await prisma.$queryRaw`
      UPDATE consolidation_snapshots 
      SET 
        status = ${status}::varchar,
        processing_log = ${JSON.stringify(processingLog)}::jsonb,
        error_details = ${JSON.stringify(errorDetails)}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${snapshotId}::uuid
    `;
  }
}
