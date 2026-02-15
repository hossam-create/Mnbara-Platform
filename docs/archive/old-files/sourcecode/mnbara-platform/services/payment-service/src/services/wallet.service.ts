import { PrismaClient, Prisma } from '@prisma/client';

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

    // Get Balance
    async getBalance(userId: number) {
        const wallet = await prisma.wallet.findUnique({
            where: { userId },
        });

        if (!wallet) {
            // Auto-create if missing (resilience)
            return this.createWallet(userId);
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

    // Withdraw (Remove funds)
    async withdraw(userId: number, amount: number) {
        return prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { userId } });

            if (!wallet || Number(wallet.balance) < amount) {
                throw new Error('Insufficient funds');
            }

            // 1. Create Transaction Record
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    amount: -amount, // Negative for withdrawal display logic if needed, or keep positive and rely on type
                    type: 'WITHDRAWAL',
                    status: 'PENDING', // Pending admin approval or gateway processing
                    description: 'Wallet Withdrawal',
                },
            });

            // 2. Deduct from Wallet (Lock funds)
            const updatedWallet = await tx.wallet.update({
                where: { userId },
                data: {
                    balance: { decrement: amount },
                },
            });

            return { transaction, wallet: updatedWallet };
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
