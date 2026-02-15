
export interface TrustSignals {
    accountAgeDays: number;
    isIdentityVerified: boolean;
    successfulTransactions: number;
    disputeCount: number;
    communityReports: number;
    isTopRated: boolean;
}

export interface TrustScoreResult {
    score: number;
    level: 'CRITICAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'ELITE';
    factors: string[];
}

export class TrustScoreEngine {
    
    /**
     * Calculates a Trust Score (0-100) based on weighted signals.
     */
    public static calculateScore(signals: TrustSignals): TrustScoreResult {
        let score = 50; // Base score for new users
        const factors: string[] = [];

        // 1. Account Age Impact (Max +15)
        if (signals.accountAgeDays > 365) {
            score += 15;
            factors.push('Long-term member (+15)');
        } else if (signals.accountAgeDays > 90) {
            score += 10;
            factors.push('Established account (+10)');
        } else if (signals.accountAgeDays < 7) {
            score -= 10; // New account risk
            factors.push('New account risk (-10)');
        }

        // 2. Identity Verification (Max +20)
        if (signals.isIdentityVerified) {
            score += 20;
            factors.push('Identity Verified (+20)');
        } else {
            factors.push('Unverified Identity');
        }

        // 3. Transaction History (Max +25)
        const transactionBonus = Math.min(signals.successfulTransactions * 0.5, 25);
        if (transactionBonus > 0) {
            score += transactionBonus;
            factors.push(`Transaction History (+${transactionBonus})`);
        }

        // 4. Disputes & Reports (Heavy Penalty)
        if (signals.disputeCount > 0) {
            const penalty = signals.disputeCount * 15;
            score -= penalty;
            factors.push(`Active Disputes (-${penalty})`);
        }
        if (signals.communityReports > 0) {
            const penalty = signals.communityReports * 20;
            score -= penalty;
            factors.push(`Community Reports (-${penalty})`);
        }

        // 5. Special Status
        if (signals.isTopRated) {
            score += 10;
            factors.push('Top Rated Seller (+10)');
        }

        // Clamp Score
        score = Math.max(0, Math.min(100, score));

        return {
            score: Math.round(score),
            level: this.getTrustLevel(score),
            factors
        };
    }

    private static getTrustLevel(score: number): TrustScoreResult['level'] {
        if (score >= 90) return 'ELITE';
        if (score >= 70) return 'HIGH';
        if (score >= 40) return 'MEDIUM';
        if (score >= 20) return 'LOW';
        return 'CRITICAL';
    }
}
