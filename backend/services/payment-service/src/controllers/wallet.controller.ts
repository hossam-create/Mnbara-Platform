import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';

export class WalletController {
    private walletService: WalletService;

    constructor() {
        this.walletService = new WalletService();
    }

    // Get Balance
    getBalance = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // TODO: Get userId from JWT
            const userId = 1;

            const wallet = await this.walletService.getBalance(userId);

            res.json({
                success: true,
                data: {
                    availableBalance: wallet.balance,
                    pendingBalance: wallet.pendingBalance,
                    currency: wallet.currency,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    // Get Transactions
    getTransactions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = 1; // TODO: Get from auth
            const transactions = await this.walletService.getTransactions(userId);

            res.json({
                success: true,
                data: transactions,
            });
        } catch (error) {
            next(error);
        }
    };

    // Deposit (Internal testing endpoint, usually called by webhook)
    deposit = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = 1; // TODO: Get from auth
            const { amount, reference } = req.body;

            const result = await this.walletService.deposit(userId, parseFloat(amount), reference);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    // Withdraw
    withdraw = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = 1; // TODO: Get from auth
            const { payoutMethodId } = req.body;

            const result = await this.walletService.requestFullWithdrawal(
                userId,
                payoutMethodId ? Number(payoutMethodId) : undefined,
            );

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            const msg = error.message || 'Withdrawal error';
            if (
                msg.includes('Insufficient') ||
                msg.includes('No payout method') ||
                msg.includes('No funds available') ||
                msg.includes('already in progress')
            ) {
                return res.status(400).json({ success: false, message: msg });
            }
            next(error);
        }
    };

    // Add payout method
    addPayoutMethod = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = 1; // TODO: Get from auth
            const { provider, identifier, externalRef } = req.body;
            if (!provider || !identifier) {
                return res.status(400).json({ success: false, message: 'provider and identifier are required' });
            }
            const method = await this.walletService.addPayoutMethod(userId, provider, identifier, externalRef);
            res.status(201).json({ success: true, data: method });
        } catch (error) {
            next(error);
        }
    };

    // Get payout methods
    getPayoutMethods = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = 1; // TODO: Get from auth
            const methods = await this.walletService.getPayoutMethods(userId);
            res.json({ success: true, data: methods });
        } catch (error) {
            next(error);
        }
    };

    // List withdrawals
    getWithdrawals = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = 1; // TODO: Get from auth
            const withdrawals = await this.walletService.listWithdrawals(userId);
            res.json({ success: true, data: withdrawals });
        } catch (error) {
            next(error);
        }
    };
}
