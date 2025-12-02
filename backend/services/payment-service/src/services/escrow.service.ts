import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EscrowService {
    
    // Hold funds from Buyer (Move to Escrow)
    async holdFunds(buyerId: number, amount: number, orderId: number) {
        return prisma.$transaction(async (tx) => {
            // 1. Check Balance
            const wallet = await tx.wallet.findUnique({ where: { userId: buyerId } });
            if (!wallet || Number(wallet.balance) < amount) {
                throw new Error('Insufficient funds for escrow');
            }

            // 2. Deduct from Buyer Wallet
            await tx.wallet.update({
                where: { userId: buyerId },
                data: { balance: { decrement: amount } }
            });

            // 3. Create Escrow Transaction Record
            return tx.transaction.create({
                data: {
                    userId: buyerId,
                    amount: -amount,
                    type: 'ESCROW_HOLD',
                    status: 'HELD',
                    description: `Escrow hold for Order #${orderId}`,
                    // orderId: orderId // Assuming we can link it, or store in description
                }
            });
        });
    }

    // Release funds to Seller (Complete Escrow)
    async releaseFunds(sellerId: number, amount: number, orderId: number) {
        return prisma.$transaction(async (tx) => {
            // 1. Add to Seller Wallet
            await tx.wallet.update({
                where: { userId: sellerId },
                data: { balance: { increment: amount } }
            });

            // 2. Create Release Transaction
            return tx.transaction.create({
                data: {
                    userId: sellerId,
                    amount: amount,
                    type: 'ESCROW_RELEASE',
                    status: 'COMPLETED',
                    description: `Escrow release for Order #${orderId}`
                }
            });
        });
    }

    // Refund funds to Buyer (Cancel Escrow)
    async refundFunds(buyerId: number, amount: number, orderId: number) {
        return prisma.$transaction(async (tx) => {
            // 1. Add back to Buyer Wallet
            await tx.wallet.update({
                where: { userId: buyerId },
                data: { balance: { increment: amount } }
            });

            // 2. Create Refund Transaction
            return tx.transaction.create({
                data: {
                    userId: buyerId,
                    amount: amount,
                    type: 'ESCROW_REFUND',
                    status: 'REFUNDED',
                    description: `Escrow refund for Order #${orderId}`
                }
            });
        });
    }
}
