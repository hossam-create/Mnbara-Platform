import { Request, Response } from 'express';
import { TrustScoreEngine, TrustSignals } from '../domain/TrustScoreEngine';

export class TrustController {
    
    /**
     * GET /trust/score/:userId
     * Retrieves the trust score for a specific user.
     */
    public async getUserTrustScore(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            // TODO: Fetch real signals from Database/Redis
            // Mocking data for demonstration based on User ID hash or random
            const mockSignals: TrustSignals = this.getMockSignals(userId);
            
            const result = TrustScoreEngine.calculateScore(mockSignals);

            return res.json({
                userId,
                timestamp: new Date().toISOString(),
                ...result
            });
        } catch (error) {
            console.error('Error calculating trust score:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * POST /trust/report
     * Submit a community report against a user.
     */
    public async reportUser(req: Request, res: Response) {
        try {
            const { reporterId, reportedUserId, reason } = req.body;
            console.log(`User ${reporterId} reported ${reportedUserId} for: ${reason}`);
            
            // TODO: Save report to DB and trigger re-evaluation
            
            return res.status(201).json({ message: 'Report submitted successfully' });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to submit report' });
        }
    }

    private getMockSignals(userId: string): TrustSignals {
        // Deterministic mock based on simple logic for demo
        const isLegacy = userId.includes('LEGACY'); // Simulate old user
        const isRisk = userId.includes('RISK'); // Simulate bad actor

        if (isRisk) {
            return {
                accountAgeDays: 5,
                isIdentityVerified: false,
                successfulTransactions: 1,
                disputeCount: 2,
                communityReports: 1,
                isTopRated: false
            };
        }

        if (isLegacy) {
            return {
                accountAgeDays: 800,
                isIdentityVerified: true,
                successfulTransactions: 150,
                disputeCount: 0,
                communityReports: 0,
                isTopRated: true
            };
        }

        // Standard user
        return {
            accountAgeDays: 45,
            isIdentityVerified: true,
            successfulTransactions: 12,
            disputeCount: 0,
            communityReports: 0,
            isTopRated: false
        };
    }
}
