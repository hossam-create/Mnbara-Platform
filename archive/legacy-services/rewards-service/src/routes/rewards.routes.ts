import { Router } from 'express';
import { RewardsController } from '../controllers/rewards.controller';

const router = Router();
const rewardsController = new RewardsController();

// Balance
router.get('/balance/:userId', (req, res) => rewardsController.getBalance(req, res));

// Earn & Redeem
router.post('/earn', (req, res) => rewardsController.earnPoints(req, res));
router.post('/redeem', (req, res) => rewardsController.redeemPoints(req, res));

// History
router.get('/history/:userId', (req, res) => rewardsController.getHistory(req, res));

// Leaderboard
router.get('/leaderboard', (req, res) => rewardsController.getLeaderboard(req, res));

export default router;
