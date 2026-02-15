import { PrismaClient, AccountType, NormalBalance, JournalEntryStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface JournalEntryLine {
  accountId: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  referenceType?: string;
  referenceId?: string;
}

export interface CreateJournalEntryRequest {
  businessAccountId: string;
  entryDate: Date;
  description: string;
  referenceType?: string;
  referenceId?: string;
  lines: JournalEntryLine[];
  isAdjustingEntry?: boolean;
  isClosingEntry?: boolean;
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export class AccountingEngine {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a journal entry with automatic double-entry validation
   */
  async createJournalEntry(request: CreateJournalEntryRequest, userId: string): Promise<any> {
    const { businessAccountId, entryDate, description, lines, referenceType, referenceId } = request;

    // Validate business account access
    const businessAccount = await this.prisma.businessAccount.findUnique({
      where: { id: businessAccountId }
    });

    if (!businessAccount) {
      throw new Error('Business account not found');
    }

    // Get or create fiscal period
    const fiscalPeriod = await this.getOrCreateFiscalPeriod(businessAccountId, entryDate);

    // Validate journal entry lines
    this.validateJournalEntryLines(lines);

    // Generate entry number
    const entryNumber = await this.generateEntryNumber(businessAccountId, entryDate);

    // Create journal entry
    const journalEntry = await this.prisma.journalEntry.create({
      data: {
        businessAccountId,
        fiscalPeriodId: fiscalPeriod.id,
        entryNumber,
        entryDate,
        description,
        referenceType,
        referenceId,
        status: JournalEntryStatus.DRAFT,
        totalDebits: 0,
        totalCredits: 0,
        isAdjustingEntry: request.isAdjustingEntry || false,
        isClosingEntry: request.isClosingEntry || false,
        lines: {
          create: lines.map((line, index) => ({
            accountId: line.accountId,
            lineNumber: index + 1,
            description: line.description,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            referenceType: line.referenceType,
            referenceId: line.referenceId
          }))
        }
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                accountCode: true,
                accountName: true,
                accountType: true,
                normalBalance: true
              }
            }
          }
        },
        fiscalPeriod: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            status: true
          }
        }
      }
    });

    logger.info(`Journal entry created: ${entryNumber}`, {
      journalEntryId: journalEntry.id,
      businessAccountId,
      userId,
      lineCount: lines.length
    });

    return journalEntry;
  }

  /**
   * Post a journal entry (make it immutable)
   */
  async postJournalEntry(journalEntryId: string, userId: string): Promise<any> {
    // Get journal entry with lines
    const journalEntry = await this.prisma.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: {
        lines: true,
        fiscalPeriod: true
      }
    });

    if (!journalEntry) {
      throw new Error('Journal entry not found');
    }

    if (journalEntry.status !== JournalEntryStatus.DRAFT) {
      throw new Error('Only draft entries can be posted');
    }

    if (journalEntry.fiscalPeriod.status !== 'OPEN') {
      throw new Error('Cannot post entries to locked fiscal periods');
    }

    // Validate double-entry balance
    const totalDebits = journalEntry.lines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
    const totalCredits = journalEntry.lines.reduce((sum, line) => sum + Number(line.creditAmount), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Journal entry must balance: debits must equal credits');
    }

    // Update account balances
    await this.updateAccountBalances(journalEntry);

    // Post the entry
    const postedEntry = await this.prisma.journalEntry.update({
      where: { id: journalEntryId },
      data: {
        status: JournalEntryStatus.POSTED,
        postedAt: new Date(),
        postedBy: userId,
        totalDebits,
        totalCredits
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                id: true,
                accountCode: true,
                accountName: true,
                accountType: true,
                normalBalance: true
              }
            }
          }
        }
      }
    });

    logger.info(`Journal entry posted: ${postedEntry.entryNumber}`, {
      journalEntryId,
      userId,
      totalDebits,
      totalCredits
    });

    return postedEntry;
  }

  /**
   * Create automatic journal entry for business transactions
   */
  async createAutomaticJournalEntry(
    transactionType: 'INVOICE_PAYMENT' | 'EXPENSE_PAYMENT' | 'RECEIVE_PAYMENT' | 'TRANSFER',
    businessAccountId: string,
    referenceId: string,
    amount: number,
    description: string,
    userId: string
  ): Promise<any> {
    const chartOfAccounts = await this.prisma.chartOfAccount.findMany({
      where: {
        businessAccountId,
        isActive: true
      }
    });

    const accountMap = new Map(chartOfAccounts.map(account => [account.accountCode, account.id]));

    let lines: JournalEntryLine[] = [];

    switch (transactionType) {
      case 'INVOICE_PAYMENT':
        // Debit Cash, Credit Accounts Receivable
        lines = [
          {
            accountId: accountMap.get('1010')!, // Business Checking
            description: 'Payment received from customer',
            debitAmount: amount,
            creditAmount: 0,
            referenceType: 'INVOICE',
            referenceId
          },
          {
            accountId: accountMap.get('1100')!, // Accounts Receivable
            description: 'Invoice payment received',
            debitAmount: 0,
            creditAmount: amount,
            referenceType: 'INVOICE',
            referenceId
          }
        ];
        break;

      case 'EXPENSE_PAYMENT':
        // Debit Expense, Credit Cash
        lines = [
          {
            accountId: accountMap.get('5900')!, // Other Expenses (or specific expense account)
            description: 'Expense payment',
            debitAmount: amount,
            creditAmount: 0,
            referenceType: 'EXPENSE',
            referenceId
          },
          {
            accountId: accountMap.get('1010')!, // Business Checking
            description: 'Payment for expense',
            debitAmount: 0,
            creditAmount: amount,
            referenceType: 'EXPENSE',
            referenceId
          }
        ];
        break;

      case 'RECEIVE_PAYMENT':
        // Debit Cash, Credit Revenue
        lines = [
          {
            accountId: accountMap.get('1010')!, // Business Checking
            description: 'Payment received',
            debitAmount: amount,
            creditAmount: 0,
            referenceType: 'PAYMENT',
            referenceId
          },
          {
            accountId: accountMap.get('4000')!, // Sales Revenue
            description: 'Revenue from payment',
            debitAmount: 0,
            creditAmount: amount,
            referenceType: 'PAYMENT',
            referenceId
          }
        ];
        break;

      case 'TRANSFER':
        // Transfer between accounts (handled by specific transfer logic)
        throw new Error('Transfer entries require specific source and destination accounts');

      default:
        throw new Error('Unknown transaction type');
    }

    const journalEntry = await this.createJournalEntry({
      businessAccountId,
      entryDate: new Date(),
      description,
      referenceType: transactionType,
      referenceId,
      lines
    }, userId);

    // Auto-post the entry
    return await this.postJournalEntry(journalEntry.id, userId);
  }

  /**
   * Get trial balance for a fiscal period
   */
  async getTrialBalance(businessAccountId: string, fiscalPeriodId: string): Promise<AccountBalance[]> {
    const balances = await this.prisma.$queryRaw<AccountBalance[]>`
      SELECT 
        coa.id as "accountId",
        coa.account_code as "accountCode",
        coa.account_name as "accountName",
        coa.account_type as "accountType",
        coa.normal_balance as "normalBalance",
        COALESCE(ab.debit_total, 0) as "debitTotal",
        COALESCE(ab.credit_total, 0) as "creditTotal",
        CASE 
          WHEN coa.normal_balance = 'DEBIT' THEN 
            COALESCE(ab.debit_total, 0) - COALESCE(ab.credit_total, 0)
          ELSE 
            COALESCE(ab.credit_total, 0) - COALESCE(ab.debit_total, 0)
        END as "balance"
      FROM chart_of_accounts coa
      LEFT JOIN account_balances ab ON ab.account_id = coa.id 
        AND ab.business_account_id = coa.business_account_id 
        AND ab.fiscal_period_id = ${fiscalPeriodId}
      WHERE coa.business_account_id = ${businessAccountId}
        AND coa.is_active = true
      ORDER BY coa.account_code
    `;

    return balances;
  }

  /**
   * Get balance sheet for a fiscal period
   */
  async getBalanceSheet(businessAccountId: string, fiscalPeriodId: string): Promise<any> {
    const trialBalance = await this.getTrialBalance(businessAccountId, fiscalPeriodId);

    const assets = trialBalance.filter(account => 
      account.accountType === AccountType.ASSET && account.balance !== 0
    );

    const liabilities = trialBalance.filter(account => 
      account.accountType === AccountType.LIABILITY && account.balance !== 0
    );

    const equity = trialBalance.filter(account => 
      account.accountType === AccountType.EQUITY && account.balance !== 0
    );

    const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0);
    const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0);

    return {
      assets: {
        accounts: assets,
        total: totalAssets
      },
      liabilities: {
        accounts: liabilities,
        total: totalLiabilities
      },
      equity: {
        accounts: equity,
        total: totalEquity
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    };
  }

  /**
   * Get profit and loss statement for a fiscal period
   */
  async getProfitAndLoss(businessAccountId: string, fiscalPeriodId: string): Promise<any> {
    const trialBalance = await this.getTrialBalance(businessAccountId, fiscalPeriodId);

    const revenues = trialBalance.filter(account => 
      account.accountType === AccountType.REVENUE && account.balance !== 0
    );

    const expenses = trialBalance.filter(account => 
      account.accountType === AccountType.EXPENSE && account.balance !== 0
    );

    const totalRevenues = revenues.reduce((sum, account) => sum + account.balance, 0);
    const totalExpenses = expenses.reduce((sum, account) => sum + account.balance, 0);
    const netIncome = totalRevenues - totalExpenses;

    return {
      revenues: {
        accounts: revenues,
        total: totalRevenues
      },
      expenses: {
        accounts: expenses,
        total: totalExpenses
      },
      netIncome
    };
  }

  /**
   * Validate journal entry lines
   */
  private validateJournalEntryLines(lines: JournalEntryLine[]): void {
    if (lines.length < 2) {
      throw new Error('Journal entry must have at least 2 lines');
    }

    const totalDebits = lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredits = lines.reduce((sum, line) => sum + line.creditAmount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Journal entry must balance: debits must equal credits');
    }

    for (const line of lines) {
      if (line.debitAmount > 0 && line.creditAmount > 0) {
        throw new Error('Each line must have either a debit or credit amount, not both');
      }

      if (line.debitAmount <= 0 && line.creditAmount <= 0) {
        throw new Error('Each line must have either a debit or credit amount greater than 0');
      }
    }
  }

  /**
   * Get or create fiscal period for a date
   */
  private async getOrCreateFiscalPeriod(businessAccountId: string, date: Date): Promise<any> {
    // First try to find existing monthly period
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    let fiscalPeriod = await this.prisma.fiscalPeriod.findFirst({
      where: {
        businessAccountId,
        periodStart: startOfMonth,
        periodEnd: endOfMonth
      }
    });

    // If not found, create it
    if (!fiscalPeriod) {
      fiscalPeriod = await this.prisma.fiscalPeriod.create({
        data: {
          businessAccountId,
          periodType: 'MONTHLY',
          periodStart: startOfMonth,
          periodEnd: endOfMonth,
          fiscalYear: date.getFullYear(),
          fiscalMonth: date.getMonth() + 1,
          status: 'OPEN',
          isCurrent: true
        }
      });
    }

    return fiscalPeriod;
  }

  /**
   * Generate unique journal entry number
   */
  private async generateEntryNumber(businessAccountId: string, date: Date): Promise<string> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get count of entries for this date
    const count = await this.prisma.journalEntry.count({
      where: {
        businessAccountId,
        entryDate: date
      }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `JE-${dateStr}-${sequence}`;
  }

  /**
   * Update account balances after posting journal entry
   */
  private async updateAccountBalances(journalEntry: any): Promise<void> {
    const { businessAccountId, fiscalPeriodId, lines } = journalEntry;

    for (const line of lines) {
      const existingBalance = await this.prisma.accountBalance.findUnique({
        where: {
          businessAccountId_accountId_fiscalPeriodId: {
            businessAccountId,
            accountId: line.accountId,
            fiscalPeriodId
          }
        }
      });

      const debitAmount = Number(line.debitAmount);
      const creditAmount = Number(line.creditAmount);
      const netChange = debitAmount - creditAmount;

      if (existingBalance) {
        // Update existing balance
        await this.prisma.accountBalance.update({
          where: {
            businessAccountId_accountId_fiscalPeriodId: {
              businessAccountId,
              accountId: line.accountId,
              fiscalPeriodId
            }
          },
          data: {
            netChange: existingBalance.netChange + netChange,
            debitTotal: existingBalance.debitTotal + debitAmount,
            creditTotal: existingBalance.creditTotal + creditAmount,
            closingBalance: existingBalance.openingBalance + existingBalance.netChange + netChange,
            lastUpdated: new Date()
          }
        });
      } else {
        // Create new balance record
        await this.prisma.accountBalance.create({
          data: {
            businessAccountId,
            accountId: line.accountId,
            fiscalPeriodId,
            openingBalance: 0,
            netChange,
            debitTotal: debitAmount,
            creditTotal: creditAmount,
            closingBalance: netChange
          }
        });
      }
    }
  }
}
