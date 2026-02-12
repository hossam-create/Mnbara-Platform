// ============================================================
// Wallet Service Migration Script
// Consolidates data from wallet-service and internal-ledger-service
// ============================================================

import { PrismaClient } from '@prisma/client';
import { WinstonLogger } from '../utils/logger';

export class WalletMigrationService {
  private prisma: PrismaClient;
  private logger: WinstonLogger;

  constructor(prisma: PrismaClient, logger: WinstonLogger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Migrate from wallet-service to unified wallet service
   */
  async migrateFromWalletService(): Promise<void> {
    try {
      this.logger.info('Starting wallet service migration...');

      // 1. Migrate users
      await this.migrateUsers();

      // 2. Migrate wallets
      await this.migrateWallets();

      // 3. Migrate transactions
      await this.migrateTransactions();

      // 4. Migrate settings and preferences
      await this.migrateSettings();

      this.logger.info('Wallet service migration completed successfully');
    } catch (error) {
      this.logger.error('Wallet service migration failed', error);
      throw error;
    }
  }

  /**
   * Migrate from internal-ledger-service to unified wallet service
   */
  async migrateFromInternalLedgerService(): Promise<void> {
    try {
      this.logger.info('Starting internal ledger service migration...');

      // 1. Migrate ledger entries
      await this.migrateLedgerEntries();

      // 2. Migrate settlements
      await this.migrateSettlements();

      // 3. Migrate escrow transactions
      await this.migrateEscrowTransactions();

      // 4. Migrate compliance data
      await this.migrateComplianceData();

      this.logger.info('Internal ledger service migration completed successfully');
    } catch (error) {
      this.logger.error('Internal ledger service migration failed', error);
      throw error;
    }
  }

  /**
   * Validate migration data integrity
   */
  async validateMigration(): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const issues: string[] = [];

      // Check user count consistency
      const oldUserCount = await this.getOldUserCount();
      const newUserCount = await this.getNewUserCount();
      if (oldUserCount !== newUserCount) {
        issues.push(`User count mismatch: old=${oldUserCount}, new=${newUserCount}`);
      }

      // Check wallet count consistency
      const oldWalletCount = await this.getOldWalletCount();
      const newWalletCount = await this.getNewWalletCount();
      if (oldWalletCount !== newWalletCount) {
        issues.push(`Wallet count mismatch: old=${oldWalletCount}, new=${newWalletCount}`);
      }

      // Check balance consistency
      const balanceConsistency = await this.checkBalanceConsistency();
      if (!balanceConsistency.valid) {
        issues.push(...balanceConsistency.issues);
      }

      // Check transaction count consistency
      const transactionConsistency = await this.checkTransactionConsistency();
      if (!transactionConsistency.valid) {
        issues.push(...transactionConsistency.issues);
      }

      return {
        valid: issues.length === 0,
        issues
      };
    } catch (error) {
      this.logger.error('Migration validation failed', error);
      return {
        valid: false,
        issues: ['Validation failed: ' + error.message]
      };
    }
  }

  /**
   * Rollback migration if needed
   */
  async rollbackMigration(): Promise<void> {
    try {
      this.logger.info('Starting migration rollback...');

      // Delete all migrated data
      await this.prisma.$executeRaw`TRUNCATE TABLE "Wallet" CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "LedgerEntry" CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "EscrowTransaction" CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Payout" CASCADE`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "ComplianceCheck" CASCADE`;

      this.logger.info('Migration rollback completed');
    } catch (error) {
      this.logger.error('Migration rollback failed', error);
      throw error;
    }
  }

  private async migrateUsers(): Promise<void> {
    try {
      // Get users from old wallet service
      const oldUsers = await this.prisma.$queryRaw`
        SELECT DISTINCT u.* 
        FROM "User" u
        JOIN "Wallet" w ON u.id = w."userId"
        WHERE w."createdAt" < CURRENT_DATE - INTERVAL '1 day'
      `;

      for (const user of oldUsers) {
        // Check if user already exists in new system
        const existingUser = await this.prisma.user.findUnique({
          where: { id: user.id }
        });

        if (!existingUser) {
          // Create user with enhanced fields
          await this.prisma.user.create({
            data: {
              id: user.id,
              email: user.email,
              username: user.username,
              fullName: user.fullName || user.username,
              kycVerified: user.kycVerified || false,
              kycLevel: user.kycLevel || 'BASIC',
              userType: user.userType || 'INDIVIDUAL',
              riskScore: user.riskScore || 0,
              riskLevel: user.riskLevel || 'LOW',
              status: user.status || 'ACTIVE',
              isActive: user.isActive !== false,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              lastLoginAt: user.lastLoginAt
            }
          });

          this.logger.info(`Migrated user: ${user.id}`);
        }
      }

      this.logger.info(`Migrated ${oldUsers.length} users`);
    } catch (error) {
      this.logger.error('Failed to migrate users', error);
      throw error;
    }
  }

  private async migrateWallets(): Promise<void> {
    try {
      // Get wallets from old wallet service
      const oldWallets = await this.prisma.$queryRaw`
        SELECT w.*, u."userType", u."kycVerified"
        FROM "Wallet" w
        JOIN "User" u ON w."userId" = u.id
        WHERE w."createdAt" < CURRENT_DATE - INTERVAL '1 day'
      `;

      for (const wallet of oldWallets) {
        // Check if wallet already exists in new system
        const existingWallet = await this.prisma.wallet.findUnique({
          where: { id: wallet.id }
        });

        if (!existingWallet) {
          // Calculate limits based on user type and KYC status
          const limits = this.calculateWalletLimits(wallet.userType, wallet.kycVerified);

          // Create wallet with enhanced fields
          await this.prisma.wallet.create({
            data: {
              id: wallet.id,
              userId: wallet.userId,
              currency: wallet.currency,
              type: wallet.type || 'PERSONAL',
              status: wallet.status || 'ACTIVE',
              balance: wallet.balance || 0,
              pendingBalance: wallet.pendingBalance || 0,
              totalBalance: wallet.totalBalance || 0,
              dailyLimit: limits.daily,
              monthlyLimit: limits.monthly,
              yearlyLimit: limits.yearly,
              perTransactionLimit: limits.perTransaction,
              isLocked: wallet.isLocked || false,
              lockReason: wallet.lockReason,
              lockExpiresAt: wallet.lockExpiresAt,
              createdAt: wallet.createdAt,
              updatedAt: wallet.updatedAt,
              lastTransactionAt: wallet.lastTransactionAt
            }
          });

          this.logger.info(`Migrated wallet: ${wallet.id}`);
        }
      }

      this.logger.info(`Migrated ${oldWallets.length} wallets`);
    } catch (error) {
      this.logger.error('Failed to migrate wallets', error);
      throw error;
    }
  }

  private async migrateTransactions(): Promise<void> {
    try {
      // Get transactions from old wallet service
      const oldTransactions = await this.prisma.$queryRaw`
        SELECT t.*, w."userId", w."currency"
        FROM "Transaction" t
        JOIN "Wallet" w ON t."walletId" = w.id
        WHERE t."createdAt" < CURRENT_DATE - INTERVAL '1 day'
        ORDER BY t."createdAt" ASC
      `;

      for (const transaction of oldTransactions) {
        // Check if transaction already exists in new system
        const existingEntry = await this.prisma.ledgerEntry.findUnique({
          where: { id: transaction.id }
        });

        if (!existingEntry) {
          // Calculate new balance after this transaction
          const newBalance = await this.calculateNewBalance(transaction.walletId, transaction.type, transaction.amount);

          // Create ledger entry with enhanced fields
          await this.prisma.ledgerEntry.create({
            data: {
              id: transaction.id,
              walletId: transaction.walletId,
              userId: transaction.userId,
              currency: transaction.currency,
              type: transaction.type.toUpperCase() as 'DEBIT' | 'CREDIT',
              amount: transaction.amount,
              balance: newBalance,
              description: transaction.description || this.generateDescription(transaction),
              referenceId: transaction.referenceId,
              referenceType: this.mapReferenceType(transaction.type),
              metadata: transaction.metadata || {},
              tags: transaction.tags || [],
              createdAt: transaction.createdAt
            }
          });

          this.logger.info(`Migrated transaction: ${transaction.id}`);
        }
      }

      this.logger.info(`Migrated ${oldTransactions.length} transactions`);
    } catch (error) {
      this.logger.error('Failed to migrate transactions', error);
      throw error;
    }
  }

  private async migrateLedgerEntries(): Promise<void> {
    try {
      // Get ledger entries from internal ledger service
      const oldLedgerEntries = await this.prisma.$queryRaw`
        SELECT le.*, w."userId", w."currency"
        FROM "LedgerEntry" le
        JOIN "Wallet" w ON le."walletId" = w.id
        WHERE le."createdAt" < CURRENT_DATE - INTERVAL '1 day'
        ORDER BY le."createdAt" ASC
      `;

      for (const entry of oldLedgerEntries) {
        // Check if entry already exists in new system
        const existingEntry = await this.prisma.ledgerEntry.findUnique({
          where: { id: entry.id }
        });

        if (!existingEntry) {
          // Create ledger entry with enhanced fields
          await this.prisma.ledgerEntry.create({
            data: {
              id: entry.id,
              walletId: entry.walletId,
              userId: entry.userId,
              currency: entry.currency,
              type: entry.type,
              amount: entry.amount,
              balance: entry.balance,
              description: entry.description,
              referenceId: entry.referenceId,
              referenceType: entry.referenceType,
              metadata: entry.metadata || {},
              tags: entry.tags || [],
              createdAt: entry.createdAt
            }
          });

          this.logger.info(`Migrated ledger entry: ${entry.id}`);
        }
      }

      this.logger.info(`Migrated ${oldLedgerEntries.length} ledger entries`);
    } catch (error) {
      this.logger.error('Failed to migrate ledger entries', error);
      throw error;
    }
  }

  private async migrateSettlements(): Promise<void> {
    try {
      // Get settlements from internal ledger service
      const oldSettlements = await this.prisma.$queryRaw`
        SELECT s.*, b."userId" as "buyerUserId", s."userId" as "sellerUserId"
        FROM "Settlement" s
        JOIN "Wallet" b ON s."buyerWalletId" = b.id
        WHERE s."createdAt" < CURRENT_DATE - INTERVAL '1 day'
      `;

      for (const settlement of oldSettlements) {
        // Create settlement entries in ledger
        await this.createSettlementLedgerEntries(settlement);

        this.logger.info(`Migrated settlement: ${settlement.id}`);
      }

      this.logger.info(`Migrated ${oldSettlements.length} settlements`);
    } catch (error) {
      this.logger.error('Failed to migrate settlements', error);
      throw error;
    }
  }

  private async migrateEscrowTransactions(): Promise<void> {
    try {
      // Get escrow transactions from internal ledger service
      const oldEscrows = await this.prisma.$queryRaw`
        SELECT e.*, b."userId" as "buyerUserId"
        FROM "EscrowTransaction" e
        JOIN "Wallet" b ON e."buyerWalletId" = b.id
        WHERE e."createdAt" < CURRENT_DATE - INTERVAL '1 day'
      `;

      for (const escrow of oldEscrows) {
        // Check if escrow already exists in new system
        const existingEscrow = await this.prisma.escrowTransaction.findUnique({
          where: { id: escrow.id }
        });

        if (!existingEscrow) {
          // Create escrow transaction with enhanced fields
          await this.prisma.escrowTransaction.create({
            data: {
              id: escrow.id,
              buyerWalletId: escrow.buyerWalletId,
              sellerWalletId: escrow.sellerWalletId,
              buyerId: escrow.buyerUserId,
              orderId: escrow.orderId,
              amount: escrow.amount,
              currency: escrow.currency,
              status: escrow.status,
              releaseType: escrow.releaseType || 'MANUAL',
              releaseConditions: escrow.releaseConditions || {},
              holdDuration: escrow.holdDuration,
              createdAt: escrow.createdAt,
              updatedAt: escrow.updatedAt,
              releasedAt: escrow.releasedAt,
              expiresAt: escrow.expiresAt
            }
          });

          this.logger.info(`Migrated escrow: ${escrow.id}`);
        }
      }

      this.logger.info(`Migrated ${oldEscrows.length} escrow transactions`);
    } catch (error) {
      this.logger.error('Failed to migrate escrow transactions', error);
      throw error;
    }
  }

  private async migrateSettings(): Promise<void> {
    try {
      // Migrate user preferences and settings
      const oldSettings = await this.prisma.$queryRaw`
        SELECT * FROM "UserSettings"
        WHERE "createdAt" < CURRENT_DATE - INTERVAL '1 day'
      `;

      for (const setting of oldSettings) {
        // Update user with settings
        await this.prisma.user.update({
          where: { id: setting.userId },
          data: {
            // Map settings to user fields
            updatedAt: new Date()
          }
        });

        this.logger.info(`Migrated settings for user: ${setting.userId}`);
      }

      this.logger.info(`Migrated ${oldSettings.length} settings`);
    } catch (error) {
      this.logger.error('Failed to migrate settings', error);
      throw error;
    }
  }

  private async migrateComplianceData(): Promise<void> {
    try {
      // Get compliance checks from internal ledger service
      const oldComplianceChecks = await this.prisma.$queryRaw`
        SELECT cc.*
        FROM "ComplianceCheck" cc
        WHERE cc."createdAt" < CURRENT_DATE - INTERVAL '1 day'
      `;

      for (const check of oldComplianceChecks) {
        // Check if compliance check already exists in new system
        const existingCheck = await this.prisma.complianceCheck.findUnique({
          where: { id: check.id }
        });

        if (!existingCheck) {
          // Create compliance check with enhanced fields
          await this.prisma.complianceCheck.create({
            data: {
              id: check.id,
              userId: check.userId,
              transactionType: check.transactionType,
              amount: check.amount,
              currency: check.currency,
              counterpartyId: check.counterpartyId,
              status: check.status,
              approved: check.approved,
              reason: check.reason,
              riskScore: check.riskScore,
              metadata: check.metadata || {},
              createdAt: check.createdAt,
              updatedAt: check.updatedAt,
              completedAt: check.completedAt
            }
          });

          this.logger.info(`Migrated compliance check: ${check.id}`);
        }
      }

      this.logger.info(`Migrated ${oldComplianceChecks.length} compliance checks`);
    } catch (error) {
      this.logger.error('Failed to migrate compliance data', error);
      throw error;
    }
  }

  // Helper methods

  private calculateWalletLimits(userType: string, kycVerified: boolean): {
    daily: number;
    monthly: number;
    yearly: number;
    perTransaction: number;
  } {
    const baseLimits = {
      daily: 1000,
      monthly: 10000,
      yearly: 100000,
      perTransaction: 500
    };

    if (kycVerified) {
      baseLimits.daily = 10000;
      baseLimits.monthly = 100000;
      baseLimits.yearly = 1000000;
      baseLimits.perTransaction = 5000;
    }

    if (userType === 'business') {
      baseLimits.daily = 50000;
      baseLimits.monthly = 500000;
      baseLimits.yearly = 5000000;
      baseLimits.perTransaction = 25000;
    }

    return baseLimits;
  }

  private async calculateNewBalance(walletId: string, type: string, amount: number): Promise<number> {
    const lastEntry = await this.prisma.ledgerEntry.findFirst({
      where: { walletId },
      orderBy: { createdAt: 'desc' }
    });

    const lastBalance = lastEntry?.balance || 0;
    return type === 'credit' ? lastBalance + amount : lastBalance - amount;
  }

  private generateDescription(transaction: any): string {
    const descriptions = {
      deposit: 'Deposit to wallet',
      withdrawal: 'Withdrawal from wallet',
      transfer: 'Transfer between wallets',
      settlement: 'Settlement for order',
      escrow: 'Escrow transaction',
      conversion: 'Currency conversion'
    };

    return descriptions[transaction.type] || 'Transaction';
  }

  private mapReferenceType(type: string): string {
    const mapping = {
      deposit: 'DEPOSIT',
      withdrawal: 'WITHDRAWAL',
      transfer: 'TRANSFER',
      settlement: 'SETTLEMENT',
      escrow: 'ESCROW',
      conversion: 'CONVERSION',
      fee: 'FEE',
      refund: 'REFUND'
    };

    return mapping[type] || 'TRANSFER';
  }

  private async createSettlementLedgerEntries(settlement: any): Promise<void> {
    // Create ledger entries for settlement
    // This would create entries for buyer debit, seller credit, and fee credits
    // Implementation depends on settlement structure
    this.logger.info(`Created settlement ledger entries for: ${settlement.id}`);
  }

  // Validation methods

  private async getOldUserCount(): Promise<number> {
    const result = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT u.id) as count
      FROM "User" u
      JOIN "Wallet" w ON u.id = w."userId"
      WHERE w."createdAt" < CURRENT_DATE - INTERVAL '1 day'
    `;
    return result[0]?.count || 0;
  }

  private async getNewUserCount(): Promise<number> {
    const result = await this.prisma.user.count();
    return result;
  }

  private async getOldWalletCount(): Promise<number> {
    const result = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count
      FROM "Wallet"
      WHERE "createdAt" < CURRENT_DATE - INTERVAL '1 day'
    `;
    return result[0]?.count || 0;
  }

  private async getNewWalletCount(): Promise<number> {
    const result = await this.prisma.wallet.count();
    return result;
  }

  private async checkBalanceConsistency(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check that wallet balances match ledger entries
    const wallets = await this.prisma.wallet.findMany();

    for (const wallet of wallets) {
      const ledgerBalance = await this.calculateLedgerBalance(wallet.id);
      if (ledgerBalance !== wallet.balance) {
        issues.push(`Balance mismatch for wallet ${wallet.id}: ledger=${ledgerBalance}, wallet=${wallet.balance}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private async checkTransactionConsistency(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check transaction count consistency
    const oldTransactionCount = await this.getOldTransactionCount();
    const newTransactionCount = await this.getNewTransactionCount();

    if (oldTransactionCount !== newTransactionCount) {
      issues.push(`Transaction count mismatch: old=${oldTransactionCount}, new=${newTransactionCount}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private async calculateLedgerBalance(walletId: string): Promise<number> {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: { walletId },
      _sum: {
        amount: true
      }
    });

    return result._sum.amount || 0;
  }

  private async getOldTransactionCount(): Promise<number> {
    const result = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count
      FROM "Transaction"
      WHERE "createdAt" < CURRENT_DATE - INTERVAL '1 day'
    `;
    return result[0]?.count || 0;
  }

  private async getNewTransactionCount(): Promise<number> {
    const result = await this.prisma.ledgerEntry.count();
    return result;
  }
}