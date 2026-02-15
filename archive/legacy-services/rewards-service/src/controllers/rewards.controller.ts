import { Request, Response } from 'express';
import { RewardsService } from '../services/rewards.service';

const rewardsService = new RewardsService();

export class RewardsController {
    
    /**
     * Get user's rewards balance
     * GET /api/rewards/balance/:userId
     */
    async getBalance(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId);
            
            if (!userId) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            const balance = await rewardsService.getBalance(userId);
            
            return res.json({
                success: true,
                data: balance
            });

        } catch (error: any) {
            console.error('Get balance error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Earn points
     * POST /api/rewards/earn
     */
    async earnPoints(req: Request, res: Response) {
        try {
            const { userId, action, metadata } = req.body;

            if (!userId || !action) {
                return res.status(400).json({ 
                    error: 'Missing required fields: userId, action' 
                });
            }

            const result = await rewardsService.earnPoints(userId, action, metadata);
            
            return res.json({
                success: true,
                message: `Earned points for ${action}`,
                data: result
            });

        } catch (error: any) {
            console.error('Earn points error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Redeem points
     * POST /api/rewards/redeem
     */
    async redeemPoints(req: Request, res: Response) {
        try {
            const { userId, points, type } = req.body;

            if (!userId || !points || !type) {
                return res.status(400).json({ 
                    error: 'Missing required fields: userId, points, type (WALLET/DISCOUNT)' 
                });
            }

            if (points <= 0) {
                return res.status(400).json({ error: 'Points must be greater than 0' });
            }

            const result = await rewardsService.redeemPoints(userId, points, type);
            
            return res.json({
                success: true,
                message: `Redeemed ${points} points`,
                data: result
            });

        } catch (error: any) {
            console.error('Redeem points error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get transaction history
     * GET /api/rewards/history/:userId
     */
    async getHistory(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.userId);
            
            if (!userId) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            const history = await rewardsService.getHistory(userId);
            
            return res.json({
                success: true,
                data: history
            });

        } catch (error: any) {
            console.error('Get history error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get leaderboard
     * GET /api/rewards/leaderboard
     */
    async getLeaderboard(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string) || 10;
            
            const leaderboard = await rewardsService.getLeaderboard(limit);
            
            return res.json({
                success: true,
                data: leaderboard
            });

        } catch (error: any) {
            console.error('Get leaderboard error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}
