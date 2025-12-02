import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type RewardAction = 
    | 'DELIVERY_COMPLETED'    // Traveler completes delivery
    | 'PURCHASE_MADE'         // Buyer makes purchase
    | 'FIRST_ORDER'           // First time user bonus
    | 'REFERRAL'              // Referred a friend
    | 'REVIEW_SUBMITTED';     // Left a review

// Points earned per action
const REWARD_POINTS: Record<RewardAction, number> = {
    DELIVERY_COMPLETED: 100,
    PURCHASE_MADE: 50,
    FIRST_ORDER: 200,
    REFERRAL: 150,
    REVIEW_SUBMITTED: 25
};

export class RewardsService {
    
    /**
     * Award points to a user
     */
    async earnPoints(userId: number, action: RewardAction, metadata?: any) {
        const points = REWARD_POINTS[action];
        
        return prisma.$transaction(async (tx) => {
            // 1. Get or create rewards account
            let rewards = await tx.rewards.upsert({
                where: { userId },
                create: {
                    userId,
                    totalPoints: points,
                    availablePoints: points,
                    redeemedPoints: 0
                },
                update: {
                    totalPoints: { increment: points },
                    availablePoints: { increment: points }
                }
            });

            // 2. Create transaction record
            const transaction = await tx.rewardTransaction.create({
                data: {
                    userId,
                    points,
                    type: 'EARNED',
                    action,
                    description: `Earned ${points} points for ${action}`,
                    metadata: metadata ? JSON.stringify(metadata) : null
                }
            });

            return { rewards, transaction };
        });
    }

    /**
     * Redeem points (convert to wallet balance or discount)
     */
    async redeemPoints(userId: number, pointsToRedeem: number, redeemType: 'WALLET' | 'DISCOUNT') {
        return prisma.$transaction(async (tx) => {
            // 1. Check available points
            const rewards = await tx.rewards.findUnique({ where: { userId } });
            
            if (!rewards || rewards.availablePoints < pointsToRedeem) {
                throw new Error('Insufficient points');
            }

            // 2. Deduct points
            await tx.rewards.update({
                where: { userId },
                data: {
                    availablePoints: { decrement: pointsToRedeem },
                    redeemedPoints: { increment: pointsToRedeem }
                }
            });

            // 3. Calculate redemption value (100 points = $1)
            const cashValue = pointsToRedeem / 100;

            // 4. Create redemption transaction
            const transaction = await tx.rewardTransaction.create({
                data: {
                    userId,
                    points: -pointsToRedeem,
                    type: 'REDEEMED',
                    action: redeemType,
                    description: `Redeemed ${pointsToRedeem} points as ${redeemType} ($${cashValue})`
                }
            });

            // 5. If WALLET type, add to wallet
            if (redeemType === 'WALLET') {
                await tx.wallet.update({
                    where: { userId },
                    data: { balance: { increment: cashValue } }
                });
            }

            return { 
                transaction, 
                cashValue,
                remainingPoints: rewards.availablePoints - pointsToRedeem
            };
        });
    }

    /**
     * Get user's rewards balance
     */
    async getBalance(userId: number) {
        let rewards = await prisma.rewards.findUnique({ 
            where: { userId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        // Auto-create if missing
        if (!rewards) {
            rewards = await prisma.rewards.create({
                data: {
                    userId,
                    totalPoints: 0,
                    availablePoints: 0,
                    redeemedPoints: 0
                },
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true }
                    }
                }
            });
        }

        return rewards;
    }

    /**
     * Get rewards transaction history
     */
    async getHistory(userId: number) {
        return prisma.rewardTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }

    /**
     * Get leaderboard (top earners)
     */
    async getLeaderboard(limit: number = 10) {
        return prisma.rewards.findMany({
            orderBy: { totalPoints: 'desc' },
            take: limit,
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });
    }
}
