import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class WalletService {
    // Create Wallet (Called on user registration usually)
    async createWallet(userId: number) {
        return prisma.wallet.create({
            data: {
                userId,
                balance: 0,
            },
        });
    }

    // Get Balance (returns available & pending)
    async getBalance(userId: number) {
        let wallet = await prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            // Auto-create if missing (resilience)
            wallet = await this.createWallet(userId);
        }

        return wallet;
    }

    // Deposit (Add funds)
    async deposit(userId: number, amount: number, reference?: string) {
        return prisma.$transaction(async (tx) => {
            // 1. Create Transaction Record
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    amount,
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    description: 'Wallet Deposit',
                    stripeId: reference, // Assuming reference is stripe payment intent ID
                },
            });

            // 2. Update Wallet Balance
            const wallet = await tx.wallet.update({
                where: { userId },
                data: {
                    balance: { increment: amount },
                },
            });

            return { transaction, wallet };
        });
    }

    // ====== PAYOUT METHODS ======

    async addPayoutMethod(userId: number, provider: string, identifier: string, externalRef?: string) {
        const masked = this.maskIdentifier(identifier);
        // If no methods exist, set as default
        const existing = await prisma.payoutMethod.findFirst({ where: { userId } });
        const method = await prisma.payoutMethod.create({
            data: {
                userId,
                provider,
                maskedIdentifier: masked,
                externalRef: externalRef ?? null,
                isDefault: !existing,
            },
        });
        return method;
    }

    async getPayoutMethods(userId: number) {
        return prisma.payoutMethod.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    private maskIdentifier(identifier: string): string {
        if (identifier.length <= 4) return identifier;
        const last4 = identifier.slice(-4);
        return `**** ${last4}`;
    }

    // ====== WITHDRAWALS (FULL BALANCE ONLY) ======

    async requestFullWithdrawal(userId: number, payoutMethodId?: number) {
        return prisma.$transaction(async (tx) => {
            // Lock wallet row via unique where in transaction
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            const available = wallet.balance as Decimal;
            const pending = wallet.pendingBalance as Decimal;

            if (pending.gt(new Decimal(0))) {
                throw new Error('Withdrawal already in progress');
            }

            if (available.lte(new Prisma.Decimal(0))) {
                throw new Error('No funds available for withdrawal');
            }

            // Resolve payout method
            let method = null;
            if (payoutMethodId) {
                method = await tx.payoutMethod.findFirst({
                    where: { id: payoutMethodId, userId },
                });
            } else {
                method =
                    (await tx.payoutMethod.findFirst({ where: { userId, isDefault: true } })) ||
                    (await tx.payoutMethod.findFirst({ where: { userId } }));
            }

            if (!method) {
                throw new Error('No payout method configured');
            }

            const amount = available;

            // Create WithdrawalRequest
            const withdrawal = await tx.withdrawalRequest.create({
                data: {
                    userId,
                    walletId: wallet.id,
                    payoutMethodId: method.id,
                    amount,
                    currency: wallet.currency,
                    status: 'REQUESTED',
                },
            });

            // Move balance -> pendingBalance
            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    balance: new Decimal(0),
                    pendingBalance: pending.add(amount),
                },
            });

            // Optionally create a transaction row for audit (type WITHDRAWAL, status PENDING)
            await tx.transaction.create({
                data: {
                    userId,
                    amount: amount,
                    currency: wallet.currency,
                    type: 'WITHDRAWAL',
                    status: 'PENDING',
                    description: 'Wallet withdrawal requested',
                },
            });

            return { withdrawal, wallet: updatedWallet };
        });
    }

    async listWithdrawals(userId: number) {
        return prisma.withdrawalRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Internal helpers for processing withdrawals (to be used by worker/admin)
    async markWithdrawalCompleted(id: number) {
        return prisma.$transaction(async (tx) => {
            const wr = await tx.withdrawalRequest.findUnique({ where: { id } });
            if (!wr) throw new Error('Withdrawal not found');
            if (wr.status !== 'REQUESTED' && wr.status !== 'PROCESSING') {
                throw new Error('Withdrawal not in processable state');
            }

            const wallet = await tx.wallet.findUnique({ where: { id: wr.walletId } });
            if (!wallet) throw new Error('Wallet not found');

            const pending = wallet.pendingBalance as Decimal;
            const amount = wr.amount as Decimal;

            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    pendingBalance: pending.sub(amount),
                },
            });

            const updatedWr = await tx.withdrawalRequest.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    processedAt: new Date(),
                },
            });

            return { withdrawal: updatedWr, wallet: updatedWallet };
        });
    }

    async markWithdrawalFailed(id: number, reason: string) {
        return prisma.$transaction(async (tx) => {
            const wr = await tx.withdrawalRequest.findUnique({ where: { id } });
            if (!wr) throw new Error('Withdrawal not found');
            if (wr.status !== 'REQUESTED' && wr.status !== 'PROCESSING') {
                throw new Error('Withdrawal not in processable state');
            }

            const wallet = await tx.wallet.findUnique({ where: { id: wr.walletId } });
            if (!wallet) throw new Error('Wallet not found');

            const pending = wallet.pendingBalance as Decimal;
            const amount = wr.amount as Decimal;

            const updatedWallet = await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    pendingBalance: pending.sub(amount),
                    balance: (wallet.balance as Decimal).add(amount),
                },
            });

            const updatedWr = await tx.withdrawalRequest.update({
                where: { id },
                data: {
                    status: 'FAILED',
                    failureReason: reason,
                    processedAt: new Date(),
                },
            });

            return { withdrawal: updatedWr, wallet: updatedWallet };
        });
    }

    // Get Transactions
    async getTransactions(userId: number) {
        return prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
