const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

// In-memory store (replace with database in production)
const rewards = new Map();
const referrals = new Map();

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'rewards-service' });
});

/**
 * GET /api/rewards/:userId
 * Get user reward points balance
 */
app.get('/api/rewards/:userId', (req, res) => {
    const { userId } = req.params;
    const balance = rewards.get(userId) || 0;

    res.json({
        success: true,
        data: {
            userId,
            balance,
            currency: 'points'
        }
    });
});

/**
 * POST /api/rewards/earn
 * Award points for actions
 */
app.post('/api/rewards/earn', (req, res) => {
    const { userId, points, reason } = req.body;

    if (!userId || !points) {
        return res.status(400).json({ error: 'Missing userId or points' });
    }

    const currentBalance = rewards.get(userId) || 0;
    rewards.set(userId, currentBalance + points);

    console.log(`User ${userId} earned ${points} points: ${reason}`);

    res.json({
        success: true,
        data: {
            userId,
            pointsEarned: points,
            newBalance: currentBalance + points,
            reason
        }
    });
});

/**
 * POST /api/rewards/redeem
 * Redeem points
 */
app.post('/api/rewards/redeem', (req, res) => {
    const { userId, points } = req.body;

    if (!userId || !points) {
        return res.status(400).json({ error: 'Missing userId or points' });
    }

    const currentBalance = rewards.get(userId) || 0;

    if (currentBalance < points) {
        return res.status(400).json({ error: 'Insufficient points' });
    }

    rewards.set(userId, currentBalance - points);

    res.json({
        success: true,
        data: {
            userId,
            pointsRedeemed: points,
            newBalance: currentBalance - points
        }
    });
});

/**
 * POST /api/referrals/generate
 * Generate referral code
 */
app.post('/api/referrals/generate', (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    const code = nanoid(10);
    referrals.set(code, { referrerId: userId, uses: 0 });

    res.json({
        success: true,
        data: {
            code,
            url: `https://mnbara.com/invite/${code}`
        }
    });
});

/**
 * POST /api/referrals/use
 * Use referral code
 */
app.post('/api/referrals/use', (req, res) => {
    const { code, newUserId } = req.body;

    if (!code || !newUserId) {
        return res.status(400).json({ error: 'Missing code or newUserId' });
    }

    const referral = referrals.get(code);

    if (!referral) {
        return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Award points to both users
    const referrerPoints = 100;
    const newUserPoints = 50;

    const currentReferrerBalance = rewards.get(referral.referrerId) || 0;
    rewards.set(referral.referrerId, currentReferrerBalance + referrerPoints);
    rewards.set(newUserId, newUserPoints);

    referral.uses++;

    res.json({
        success: true,
        data: {
            referrerReward: referrerPoints,
            newUserReward: newUserPoints,
            message: 'Referral applied successfully'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🎁 Rewards Service running on port ${PORT}`);
});
