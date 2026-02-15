import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { AccountingEngine } from './AccountingEngine';

export class AccountingIntegration {
  private accountingEngine: AccountingEngine;

  constructor(private prisma: PrismaClient) {
    this.accountingEngine = new AccountingEngine(prisma);
  }

  /**
   * Create automatic journal entry when invoice is paid
   */
  async handleInvoicePayment(invoiceId: string, paymentAmount: number, userId: string): Promise<void> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          businessAccount: true
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Create journal entry for invoice payment
      await this.accountingEngine.createAutomaticJournalEntry(
        'INVOICE_PAYMENT',
        invoice.businessAccountId,
        invoiceId,
        paymentAmount,
        `Payment received for invoice ${invoice.invoiceNumber}`,
        userId
      );

      logger.info(`Accounting entry created for invoice payment: ${invoice.invoiceNumber}`, {
        invoiceId,
        paymentAmount,
        userId
      });
    } catch (error) {
      logger.error('Failed to create accounting entry for invoice payment:', error);
      throw error;
    }
  }

  /**
   * Create automatic journal entry when expense is approved
   */
  async handleExpenseApproval(expenseId: string, userId: string): Promise<void> {
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
          businessAccount: true
        }
      });

      if (!expense) {
        throw new Error('Expense not found');
      }

      // Create journal entry for expense approval
      await this.accountingEngine.createAutomaticJournalEntry(
        'EXPENSE_PAYMENT',
        expense.businessAccountId,
        expenseId,
        Number(expense.amount),
        `Expense approved: ${expense.merchantName} - ${expense.description}`,
        userId
      );

      logger.info(`Accounting entry created for expense approval: ${expense.merchantName}`, {
        expenseId,
        amount: expense.amount,
        userId
      });
    } catch (error) {
      logger.error('Failed to create accounting entry for expense approval:', error);
      throw error;
    }
  }

  /**
   * Create automatic journal entry for transaction processing
   */
  async handleTransactionProcessing(transactionId: string, userId: string): Promise<void> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          businessAccount: true
        }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Determine transaction type and create appropriate journal entry
      let journalEntryType: 'INVOICE_PAYMENT' | 'EXPENSE_PAYMENT' | 'RECEIVE_PAYMENT' = 'RECEIVE_PAYMENT';

      if (transaction.category === 'EXPENSES') {
        journalEntryType = 'EXPENSE_PAYMENT';
      } else if (transaction.category === 'SALES') {
        journalEntryType = 'INVOICE_PAYMENT';
      }

      await this.accountingEngine.createAutomaticJournalEntry(
        journalEntryType,
        transaction.businessAccountId,
        transactionId,
        Number(transaction.amount),
        `Transaction processed: ${transaction.description || transaction.referenceNumber}`,
        userId
      );

      logger.info(`Accounting entry created for transaction: ${transaction.referenceNumber}`, {
        transactionId,
        amount: transaction.amount,
        type: journalEntryType,
        userId
      });
    } catch (error) {
      logger.error('Failed to create accounting entry for transaction:', error);
      throw error;
    }
  }

  /**
   * Create adjusting journal entry for period end
   */
  async createPeriodEndAdjustments(businessAccountId: string, fiscalPeriodId: string, userId: string): Promise<any> {
    try {
      // Get trial balance for the period
      const trialBalance = await this.accountingEngine.getTrialBalance(businessAccountId, fiscalPeriodId);

      // Identify accounts that need adjustments (this is simplified - in real implementation would be more complex)
      const adjustments: any[] = [];

      // Example: Create adjusting entry for accrued expenses
      // This would typically involve calculating unrecorded expenses for the period
      
      const adjustingEntry = await this.accountingEngine.createJournalEntry({
        businessAccountId,
        entryDate: new Date(),
        description: 'Period end adjusting entries',
        lines: adjustments,
        isAdjustingEntry: true
      }, userId);

      // Post the adjusting entry
      const postedEntry = await this.accountingEngine.postJournalEntry(adjustingEntry.id, userId);

      logger.info(`Period end adjusting entries created for business: ${businessAccountId}`, {
        businessAccountId,
        fiscalPeriodId,
        adjustmentCount: adjustments.length,
        userId
      });

      return postedEntry;
    } catch (error) {
      logger.error('Failed to create period end adjustments:', error);
      throw error;
    }
  }

  /**
   * Create closing entries for fiscal period
   */
  async createClosingEntries(businessAccountId: string, fiscalPeriodId: string, userId: string): Promise<any[]> {
    try {
      const closingEntries: any[] = [];

      // Get profit and loss for the period
      const profitAndLoss = await this.accountingEngine.getProfitAndLoss(businessAccountId, fiscalPeriodId);

      // Close revenue accounts to retained earnings
      if (profitAndLoss.revenues.total > 0) {
        const revenueClosingEntry = await this.accountingEngine.createJournalEntry({
          businessAccountId,
          entryDate: new Date(),
          description: 'Close revenue accounts to retained earnings',
          lines: [
            {
              accountId: await this.getAccountIdByCode(businessAccountId, '3200'), // Retained Earnings
              description: 'Close revenue accounts',
              debitAmount: profitAndLoss.revenues.total,
              creditAmount: 0
            },
            {
              accountId: await this.getAccountIdByCode(businessAccountId, '4000'), // Sales Revenue
              description: 'Close sales revenue',
              debitAmount: 0,
              creditAmount: profitAndLoss.revenues.total
            }
          ],
          isClosingEntry: true
        }, userId);

        const postedRevenueEntry = await this.accountingEngine.postJournalEntry(revenueClosingEntry.id, userId);
        closingEntries.push(postedRevenueEntry);
      }

      // Close expense accounts to retained earnings
      if (profitAndLoss.expenses.total > 0) {
        const expenseClosingEntry = await this.accountingEngine.createJournalEntry({
          businessAccountId,
          entryDate: new Date(),
          description: 'Close expense accounts to retained earnings',
          lines: [
            {
              accountId: await this.getAccountIdByCode(businessAccountId, '5900'), // Other Expenses
              description: 'Close expense accounts',
              debitAmount: 0,
              creditAmount: profitAndLoss.expenses.total
            },
            {
              accountId: await this.getAccountIdByCode(businessAccountId, '3200'), // Retained Earnings
              description: 'Close expense accounts',
              debitAmount: profitAndLoss.expenses.total,
              creditAmount: 0
            }
          ],
          isClosingEntry: true
        }, userId);

        const postedExpenseEntry = await this.accountingEngine.postJournalEntry(expenseClosingEntry.id, userId);
        closingEntries.push(postedExpenseEntry);
      }

      // Mark fiscal period as having closing entries posted
      await this.prisma.fiscalPeriod.update({
        where: { id: fiscalPeriodId },
        data: { closingEntriesPosted: true }
      });

      logger.info(`Closing entries created for fiscal period: ${fiscalPeriodId}`, {
        businessAccountId,
        fiscalPeriodId,
        entryCount: closingEntries.length,
        userId
      });

      return closingEntries;
    } catch (error) {
      logger.error('Failed to create closing entries:', error);
      throw error;
    }
  }

  /**
   * Get account ID by account code
   */
  private async getAccountIdByCode(businessAccountId: string, accountCode: string): Promise<string> {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: {
        businessAccountId,
        accountCode,
        isActive: true
      }
    });

    if (!account) {
      throw new Error(`Account with code ${accountCode} not found`);
    }

    return account.id;
  }

  /**
   * Validate accounting data integrity
   */
  async validateAccountingIntegrity(businessAccountId: string, fiscalPeriodId: string): Promise<any> {
    try {
      const trialBalance = await this.accountingEngine.getTrialBalance(businessAccountId, fiscalPeriodId);
      const balanceSheet = await this.accountingEngine.getBalanceSheet(businessAccountId, fiscalPeriodId);
      const profitAndLoss = await this.accountingEngine.getProfitAndLoss(businessAccountId, fiscalPeriodId);

      const validationResults = {
        trialBalanceValid: true,
        balanceSheetValid: balanceSheet.isBalanced,
        profitAndLossValid: true,
        errors: [] as string[],
        warnings: [] as string[]
      };

      // Check if trial balance balances (debits = credits)
      const totalDebits = trialBalance.reduce((sum, account) => sum + account.debitTotal, 0);
      const totalCredits = trialBalance.reduce((sum, account) => sum + account.creditTotal, 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        validationResults.trialBalanceValid = false;
        validationResults.errors.push(`Trial balance does not balance: Debits ${totalDebits} != Credits ${totalCredits}`);
      }

      // Check for negative balances in asset accounts that shouldn't have them
      const negativeAssets = trialBalance.filter(account => 
        account.accountType === 'ASSET' && account.balance < 0
      );

      if (negativeAssets.length > 0) {
        validationResults.warnings.push(`Found ${negativeAssets.length} asset accounts with negative balances`);
      }

      logger.info(`Accounting integrity validation completed for business: ${businessAccountId}`, {
        businessAccountId,
        fiscalPeriodId,
        validationResults
      });

      return validationResults;
    } catch (error) {
      logger.error('Failed to validate accounting integrity:', error);
      throw error;
    }
  }
}
