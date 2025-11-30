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
                data: wallet,
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
            const { amount } = req.body;

            const result = await this.walletService.withdraw(userId, parseFloat(amount));

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            if (error.message === 'Insufficient funds') {
                return res.status(400).json({ success: false, message: error.message });
            }
            next(error);
        }
    };
}
